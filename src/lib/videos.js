import { supabase } from './supabase';
import { tActual } from '@/i18n/actual';

// Vídeos cortos de las publicaciones. Se comprimen en el propio navegador (máx. 60 s, 720p, MP4 H.264 + AAC) y se
// suben a Cloudflare R2 a través del Worker worker/media, que no cobra por la descarga. La URL del Worker va en
// NEXT_PUBLIC_MEDIA_URL; sin ella, la opción de vídeo no aparece.
export const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_URL || '').replace(/\/$/, '');
export const DURACION_MAX = 60;
const LADO_LARGO = 1280;
const LADO_CORTO = 720;
const MAX_SIN_COMPRIMIR = 40 * 1024 * 1024; // lo que acepta el Worker
const t = (clave, vars) => tActual(clave, vars);

// Duración y tamaño, con un <video> en la página (Safari no reproduce vídeos que no estén en el documento)
function abrir(archivo) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('video');
    el.muted = true; el.playsInline = true; el.preload = 'auto';
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    el.src = URL.createObjectURL(archivo);
    document.body.appendChild(el);
    el.onloadedmetadata = () => resolve(el);
    el.onerror = () => { cerrar(el); reject(new Error(t('video.noSePuedeLeer'))); };
  });
}
function cerrar(el) { URL.revokeObjectURL(el.src); el.remove(); }

function medidas(ancho, alto) {
  const s = Math.min(1, LADO_LARGO / Math.max(ancho, alto), LADO_CORTO / Math.min(ancho, alto));
  const par = (n) => Math.max(2, Math.round((n * s) / 2) * 2); // H.264 pide medidas pares
  return { ancho: par(ancho), alto: par(alto) };
}

// Edición básica (EditorVideo): { inicio, fin } en segundos y recorte { x, y, w, h } en píxeles del vídeo original
const recorteDe = (el, ed) => ed?.recorte || { x: 0, y: 0, w: el.videoWidth, h: el.videoHeight };
const tramoDe = (el, ed) => {
  const inicio = Math.max(0, ed?.inicio || 0);
  return { inicio, fin: Math.min(el.duration, ed?.fin ?? el.duration, inicio + DURACION_MAX) };
};

export async function puedeComprimir(ancho, alto) {
  if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined' || !('requestVideoFrameCallback' in HTMLVideoElement.prototype)) return false;
  try {
    const v = await VideoEncoder.isConfigSupported({ codec: 'avc1.4d401f', width: ancho, height: alto, bitrate: 2_500_000, framerate: 30 });
    const a = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 128_000 });
    return !!(v.supported && a.supported);
  } catch { return false; }
}

const aBlob = (canvas) => new Promise((r) => canvas.toBlob(r, 'image/webp', 0.8));

// Fotograma para la miniatura (si no se ha podido sacar al comprimir)
async function miniatura(el, ancho, alto, rec, inicio = 0) {
  await new Promise((r) => { el.onseeked = r; el.currentTime = Math.min(inicio + 0.5, (el.duration || 1) / 2 + inicio); });
  const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
  c.getContext('2d').drawImage(el, rec.x, rec.y, rec.w, rec.h, 0, 0, ancho, alto);
  return aBlob(c);
}

// Reproduce el vídeo (sin sonido) y va codificando cada fotograma; el audio se decodifica aparte y se recodifica a AAC
async function comprimir(archivo, el, { ancho, alto }, rec, { inicio, fin }, onProgreso) {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  let audio = null;
  try {
    const ctx = new AudioContext({ sampleRate: 48000 });
    audio = await ctx.decodeAudioData(await archivo.arrayBuffer());
    ctx.close();
  } catch { audio = null; } // sin pista de audio (o no se puede leer): vídeo mudo

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: ancho, height: alto },
    ...(audio ? { audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 48000 } } : {}),
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset', // el primer fotograma no siempre llega en el instante 0
  });
  let fallo = null;
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { fallo = e; } });
  venc.configure({ codec: 'avc1.4d401f', width: ancho, height: alto, bitrate: 2_500_000, framerate: 30 });

  const duracion = fin - inicio;
  const canvas = document.createElement('canvas'); canvas.width = ancho; canvas.height = alto;
  const g = canvas.getContext('2d');
  let poster = null, ultimo = -1, n = 0;

  await new Promise((resolve, reject) => {
    const alFotograma = (_ahora, meta) => {
      if (fallo) return reject(fallo);
      const tiempo = meta.mediaTime - inicio;
      if (tiempo > duracion || el.ended) return resolve();
      if (tiempo >= 0 && tiempo > ultimo + 0.001) {
        g.drawImage(el, rec.x, rec.y, rec.w, rec.h, 0, 0, ancho, alto);
        if (!poster && tiempo >= 0.3) aBlob(canvas).then((b) => { poster = poster || b; });
        const f = new VideoFrame(canvas, { timestamp: Math.round(tiempo * 1e6) });
        venc.encode(f, { keyFrame: n % 60 === 0 });
        f.close();
        ultimo = tiempo; n++;
        onProgreso?.(Math.min(0.85, (tiempo / duracion) * 0.85));
      }
      el.requestVideoFrameCallback(alFotograma);
    };
    el.onended = () => resolve();
    el.requestVideoFrameCallback(alFotograma);
    el.onseeked = () => { el.onseeked = null; el.play().catch(reject); };
    el.currentTime = inicio;
  });
  el.pause();
  await venc.flush();
  if (fallo) throw fallo;

  if (audio) {
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { fallo = e; } });
    aenc.configure({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 128_000 });
    const desde = Math.round(inicio * 48000), total = Math.max(0, Math.min(audio.length - desde, Math.round(duracion * 48000)));
    const izq = audio.getChannelData(0), der = audio.numberOfChannels > 1 ? audio.getChannelData(1) : izq;
    for (let i = 0; i < total; i += 1024) {
      const k = Math.min(1024, total - i);
      const datos = new Float32Array(k * 2);
      datos.set(izq.subarray(desde + i, desde + i + k), 0); datos.set(der.subarray(desde + i, desde + i + k), k);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: k, numberOfChannels: 2, timestamp: Math.round((i / 48000) * 1e6), data: datos });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush();
    if (fallo) throw fallo;
  }
  muxer.finalize();
  return { video: new Blob([muxer.target.buffer], { type: 'video/mp4' }), poster };
}

async function token() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error(t('video.entraParaSubir'));
  return session.access_token;
}

// Subida con progreso (fetch no informa del progreso de subida)
function subir(blob, tipo, tk, onProgreso) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('PUT', `${MEDIA_URL}/subir?tipo=${tipo}`);
    x.setRequestHeader('Authorization', `Bearer ${tk}`);
    x.setRequestHeader('Content-Type', blob.type);
    x.upload.onprogress = (e) => e.lengthComputable && onProgreso?.(e.loaded / e.total);
    x.onload = () => {
      let r = {};
      try { r = JSON.parse(x.responseText); } catch { /* respuesta vacía */ }
      if (x.status === 200 && r.url) resolve(r.url);
      else reject(new Error(r.error === 'demasiado_grande' ? t('video.pesado') : t('video.errorSubir')));
    };
    x.onerror = () => reject(new Error(t('video.errorSubir')));
    x.send(blob);
  });
}

// Prepara y sube un vídeo. onProgreso(fase, 0..1) con fase 'preparando' | 'subiendo'. edicion: ver recorteDe/tramoDe.
// Devuelve lo que se guarda en publicaciones.video: { url, poster, duracion, ancho, alto }.
export async function subirVideo(archivo, onProgreso, edicion = null) {
  if (!MEDIA_URL) throw new Error(t('video.noDisponible'));
  if (!archivo.type.startsWith('video/')) throw new Error(t('video.noEsVideo'));
  const tk = await token();
  const el = await abrir(archivo);
  try {
    const rec = recorteDe(el, edicion), tramo = tramoDe(el, edicion);
    const m = medidas(rec.w, rec.h);
    let video = archivo, poster = null;
    if (await puedeComprimir(m.ancho, m.alto)) {
      ({ video, poster } = await comprimir(archivo, el, m, rec, tramo, (p) => onProgreso?.('preparando', p)));
    } else {
      // Sin WebCodecs no se puede recortar ni encuadrar: solo se sube tal cual si ya cumple
      const editado = edicion?.recorte || tramo.inicio > 0 || tramo.fin < el.duration - 0.2;
      if (editado) throw new Error(t('video.sinEditor'));
      if (el.duration > DURACION_MAX + 0.5) throw new Error(t('video.largo', { s: DURACION_MAX }));
      if (archivo.size > MAX_SIN_COMPRIMIR) throw new Error(t('video.pesado'));
    }
    if (!poster) poster = await miniatura(el, m.ancho, m.alto, rec, tramo.inicio);
    const url = await subir(video, 'video', tk, (p) => onProgreso?.('subiendo', p * 0.95));
    const urlPoster = poster ? await subir(poster, 'poster', tk).catch(() => null) : null;
    onProgreso?.('subiendo', 1);
    return { url, poster: urlPoster, duracion: Math.round((tramo.fin - tramo.inicio) * 10) / 10, ancho: m.ancho, alto: m.alto };
  } finally {
    cerrar(el);
  }
}

// Borra el vídeo y su miniatura de R2 (al borrar la publicación). Sin errores visibles: como con las imágenes.
export async function borrarVideo(video) {
  if (!video?.url || !MEDIA_URL) return;
  try {
    const tk = await token();
    await Promise.all([video.url, video.poster].filter((u) => u?.startsWith(`${MEDIA_URL}/`))
      .map((u) => fetch(u, { method: 'DELETE', headers: { Authorization: `Bearer ${tk}` } })));
  } catch { /* se queda huérfano, pero la publicación ya está borrada */ }
}

// Al eliminar la cuenta: todos los vídeos de la persona
export async function borrarMisVideos() {
  if (!MEDIA_URL) return 0;
  try {
    const r = await fetch(`${MEDIA_URL}/todo`, { method: 'DELETE', headers: { Authorization: `Bearer ${await token()}` } });
    return (await r.json()).borrados || 0;
  } catch { return 0; }
}
