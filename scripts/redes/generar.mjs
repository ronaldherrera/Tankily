// Genera las piezas de redes (scripts/redes/piezas.mjs): reels en MP4 de 1080×1920 y carruseles en PNG de
// 1080×1350, con capturas reales de Tankily (del build de producción, `out/`, servido aquí mismo) y fotos de
// Wikimedia Commons con su crédito (marca/redes/fotos). Cada pieza va a su carpeta con el texto listo para pegar.
// Uso: node scripts/redes/generar.mjs [--solo 3,7]     (antes: npm run build y node scripts/redes/fotos-redes.mjs)
// Salida: marca/redes/salida/<n>-<fecha>-<slug>/ (fuera de git) y hojas de revisión en marca/redes/salida/_revision/
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { abrirNavegador, esperar } from './navegador.mjs';
import { PIEZAS } from './piezas.mjs';
import { LOCUCION, LOCUCION_V3, FIRMA } from './locucion.mjs';
import { DIRECCION } from './direccion.mjs';

// --v2: motor nuevo (lienzo2.html, skill director-arte-redes) en marca/redes/salida-v2; --portadas: solo portadas
const V2 = process.argv.includes('--v2');
const SOLO_PORTADAS = process.argv.includes('--portadas');

// Voz de Krill: Kokoro local (D:/Mis Desarrollos/_herramientas/kokoro) con los ajustes de marca/redes/voz/krill.json
const KOKORO = path.resolve(process.cwd(), '..', '_herramientas', 'kokoro');
const VOZ = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'marca', 'redes', 'voz', 'krill.json'), 'utf8'));
// Pronunciación: lo que se manda a la voz (los subtítulos siguen con la grafía buena)
const PRONUNCIACION = [[/Tankily/g, 'Tánkili']];
const PIPER = process.argv.includes('--piper');
// Chatterbox (MIT, local con GPU): timbre de marca/redes/voz/referencia-krill.wav con más emoción
const CHATTERBOX = process.argv.includes('--chatterbox');
// ElevenLabs: voz diseñada de Krill (voice_id en marca/redes/voz/krill.json) y guiones con etiquetas (LOCUCION_V3)
const ELEVEN = process.argv.includes('--elevenlabs');
const TOMAS = process.argv.includes('--tomas') ? Number(process.argv[process.argv.indexOf('--tomas') + 1]) : 3;
const ELEVEN_DIR = path.resolve(process.cwd(), '..', '_herramientas', 'elevenlabs');
const CB = { exageracion: 1.0, cfg: 0.3, temperatura: 0.85 };
const RAIZ_PROYECTO = process.cwd();
// ElevenLabs cambia algo el timbre según la frase: de 3 tomas se queda con la más parecida a la voz elegida
// (huella de voz) que además se entiende (Whisper)
function elegirTomas(salidaTomas, archivoLote) {
  const archivo = archivoLote.replace('-lote.json', '-tomas.json');
  fs.writeFileSync(archivo, salidaTomas.toString('utf8').trim().split(String.fromCharCode(10)).pop());
  const cb = path.join(KOKORO, '..', 'chatterbox');
  return execFileSync(path.join(cb, 'venv', 'Scripts', 'python.exe'), ['-I', path.join(cb, 'elegir_toma.py'),
    '--referencia', path.join(RAIZ_PROYECTO, VOZ.elevenlabs_referencia), '--entrada', archivo, '--misma-toma'], { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 });
}
function locutar(n, frases, carpeta) {
  fs.mkdirSync(carpeta, { recursive: true });
  const lote = frases.map((texto, i) => ({ texto: PRONUNCIACION.reduce((t, [re, por]) => t.replace(re, por), texto), salida: path.join(carpeta, `${String(n).padStart(2, '0')}-${i}.wav`) }));
  const archivoLote = path.join(carpeta, `${String(n).padStart(2, '0')}-lote.json`);
  fs.writeFileSync(archivoLote, JSON.stringify(lote));
  const python = path.join(KOKORO, 'venv', 'Scripts', 'python.exe');
  const salida = ELEVEN
    ? elegirTomas(execFileSync('python', ['-I', path.join(ELEVEN_DIR, 'voz_elevenlabs.py'), 'guion', '--voz', VOZ.elevenlabs_voice_id, '--lote', archivoLote, '--tomas', String(TOMAS), '--prefijo', '[Castilian Spanish accent from Spain]'], { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 }), archivoLote)
    : CHATTERBOX
    ? execFileSync(path.join(KOKORO, '..', 'chatterbox', 'venv', 'Scripts', 'python.exe'), ['-I', path.join(KOKORO, '..', 'chatterbox', 'voz_chatterbox.py'),
      '--lote', archivoLote, '--referencia', path.join(RAIZ_PROYECTO, 'marca', 'redes', 'voz', 'referencia-krill-teatral.wav'),
      '--exageracion', String(CB.exageracion), '--cfg', String(CB.cfg), '--temperatura', String(CB.temperatura)], { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 })
    : PIPER
    ? execFileSync(python, ['-I', path.join(KOKORO, 'voz_piper.py'), '--modelo', 'piper/es_ES-davefx-medium.onnx', '--lote', archivoLote,
      '--tono', '1.0', '--velocidad', '1.08', '--expresividad', '0.45', '--variacion', '0.5'], { stdio: 'pipe' })
    : execFileSync(python, ['-I', path.join(KOKORO, 'voz.py'), '--lote', archivoLote,
      '--voz', VOZ.voz, '--tono', String(VOZ.tono), '--velocidad', String(VOZ.velocidad), '--sala', String(VOZ.sala), '--calidez', String(VOZ.calidez), '--idioma', VOZ.idioma], { stdio: 'pipe' });
  // Segmentos (trozo, inicio, fin) de cada frase: los subtítulos van con la voz real
  const info = JSON.parse(salida.toString('utf8').trim().split(String.fromCharCode(10)).pop());
  // Los subtítulos vuelven a la grafía buena (la voz recibió «Tánkili»)
  const grafia = (s) => s.replace(/Tánkili/g, 'Tankily').replace(/góldfish/g, 'goldfish').replace(/Kril(?!l)/g, 'Krill');
  return { wavs: lote.map((l) => fs.readFileSync(l.salida).toString('base64')), segmentos: info.map((r) => (r.segmentos || []).map((s) => ({ ...s, texto: grafia(s.texto) }))) };
}

const RAIZ = process.cwd();
const OUT = path.join(RAIZ, 'out');
const SALIDA = path.join(RAIZ, 'marca', 'redes', 'salida');
const DESTINO = V2 ? path.join(RAIZ, 'marca', 'redes', 'salida-v2') : SALIDA;
const FOTOS = path.join(RAIZ, 'marca', 'redes', 'fotos');
const PUERTO = 4180;
const BASE = `http://localhost:${PUERTO}`;
const soloArg = process.argv[process.argv.indexOf('--solo') + 1];
const solo = process.argv.includes('--solo') ? new Set(soloArg.split(',').map(Number)) : null;

if (!fs.existsSync(path.join(OUT, 'es', 'index.html'))) throw new Error('Falta el build: ejecuta npm run build');
fs.mkdirSync(path.join(SALIDA, '_revision'), { recursive: true });
const creditos = JSON.parse(fs.readFileSync(path.join(FOTOS, 'creditos.json'), 'utf8'));
const VIDEOS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'marca', 'redes', 'videos', 'creditos.json'), 'utf8'));

// Servidor estático mínimo para out/ (las rutas terminan en / y se sirven con su index.html)
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webm': 'video/webm', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json' };
const servidor = http.createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, BASE).pathname);
  // /__redes/ (motor de dibujo) y /__videos/ (clips): mismo origen que la página, así el canvas no queda «contaminado»
  const montajes = { '/__redes/': path.join(RAIZ, 'scripts', 'redes'), '/__videos/': path.join(RAIZ, 'marca', 'redes', 'videos') };
  const montaje = Object.keys(montajes).find((m) => ruta.startsWith(m));
  const base = montaje ? montajes[montaje] : OUT;
  let archivo = path.join(base, montaje ? ruta.slice(montaje.length) : ruta);
  if (!archivo.startsWith(base)) { res.writeHead(403).end(); return; }
  if (ruta.endsWith('/') || (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory())) archivo = path.join(archivo, 'index.html');
  if (!fs.existsSync(archivo)) { res.writeHead(404).end('404'); return; }
  // Peticiones por trozos (Range): sin ellas el navegador no puede saltar a un instante del vídeo
  const tam = fs.statSync(archivo).size, rango = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (rango) {
    const ini = rango[1] ? Number(rango[1]) : 0, fin = rango[2] ? Number(rango[2]) : tam - 1;
    res.writeHead(206, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Content-Range': `bytes ${ini}-${fin}/${tam}`, 'Accept-Ranges': 'bytes', 'Content-Length': fin - ini + 1 });
    fs.createReadStream(archivo, { start: ini, end: fin }).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Content-Length': tam });
  fs.createReadStream(archivo).pipe(res);
});
await new Promise((r) => servidor.listen(PUERTO, r));

const nav = await abrirNavegador();
// Cookies ya respondidas y aviso de instalar la app descartado: que no tapen las capturas
await nav.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('tk-consentimiento-cookies', 'necesarias'); localStorage.setItem('tk-aviso-app', String(Date.now())); } catch {}` });

const capturas = new Map();
async function capturar(v) {
  const clave = JSON.stringify([v.ruta, v.desde, v.alto, v.rellenar || null]);
  if (capturas.has(clave)) return capturas.get(clave);
  await nav.ir(BASE + v.ruta, { escala: 2, pausa: v.espera || 2500 });
  // La barra inferior del móvil (fija) saldría a mitad de una captura
  await nav.evaluar(`(() => { const s = document.createElement('style'); s.textContent = '.barra-movil,.velo-barra,.aviso-app,.aviso-cookies{display:none!important}'; document.head.appendChild(s); return true; })()`);
  if (v.rellenar) {
    await nav.evaluar(`(() => {
      const campos = [...document.querySelectorAll('main input')].filter((i) => i.offsetParent && !['checkbox', 'radio', 'search'].includes(i.type));
      const poner = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      ${JSON.stringify(v.rellenar)}.forEach((valor, i) => { if (!campos[i]) return; poner.call(campos[i], String(valor)); campos[i].dispatchEvent(new Event('input', { bubbles: true })); });
      return campos.length;
    })()`);
  }
  // Datos que llegan después de cargar (mediciones del tanque, tiendas): esperar a que aparezca su texto
  if (v.esperar) {
    await nav.evaluar(`new Promise((r) => { const t0 = Date.now(); const f = () => (document.body.innerText.includes(${JSON.stringify(v.esperar)}) || Date.now() - t0 > 20000) ? r(true) : setTimeout(f, 200); f(); })`);
  }
  await esperar(900);
  // `ancla`: el encuadre empieza en ese texto (más `desde` px), así no se descoloca si la página cambia de altura
  let y = v.desde;
  if (v.ancla) {
    const top = await nav.evaluar(`(() => { const n = [...document.querySelectorAll('main *')].find((x) => x.textContent.trim().startsWith(${JSON.stringify(v.ancla)}) && x.textContent.length < 200); return n ? n.getBoundingClientRect().top + scrollY : null; })()`);
    if (top == null) throw new Error(`No encuentro «${v.ancla}» en ${v.ruta}`);
    y = Math.max(0, Math.round(top + v.desde));
  }
  const r = await nav.cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width: 390, height: v.alto, scale: 1 } });
  const dato = 'data:image/png;base64,' + r.result.data;
  capturas.set(clave, dato);
  return dato;
}

const datoFoto = (especie) => {
  const c = creditos[especie];
  if (!c) throw new Error(`Sin foto para ${especie}: ejecuta scripts/redes/fotos-redes.mjs`);
  const autor = c.autor && c.autor !== 'Autor desconocido' ? c.autor : decodeURIComponent(c.fuente.split('File:')[1] || '').replace(/_/g, ' ');
  return { src: 'data:image/jpeg;base64,' + fs.readFileSync(path.join(FOTOS, c.archivo)).toString('base64'), credito: `${autor} (${c.licencia}), Wikimedia Commons`, sujeto: c.sujeto };
};

const resumen = [];
try {
  for (const piezaBase of PIEZAS) {
    if (solo && !solo.has(piezaBase.n)) continue;
    // Locución: el texto en pantalla puede cambiar (memes) y cada escena lleva la expresión de Krill
    const loc = piezaBase.formato === 'reel' ? LOCUCION[piezaBase.n] : null;
    let pieza = loc
      ? { ...piezaBase, kGancho: loc.gancho.k, escenas: piezaBase.escenas.map((e, i) => ({ ...e, t: loc.escenas[i].t || e.t, k: loc.escenas[i].k })) }
      : piezaBase;
    // v2: dirección de arte de la pieza; los carruseles, por ahora, solo portada
    if (V2) pieza = { ...pieza, ...(DIRECCION[pieza.n] || {}), soloPortada: SOLO_PORTADAS };
    const recursos = {};
    if (loc && !(V2 && pieza.soloPortada)) {
      const v3 = ELEVEN && LOCUCION_V3[pieza.n];
      const frases = v3 ? [v3.gancho, ...v3.escenas, v3.firma] : [loc.gancho.vo, ...loc.escenas.map((e) => e.vo), FIRMA];
      const voz = locutar(pieza.n, frases, path.join(SALIDA, '_voz'));
      recursos.__voz = voz.wavs;
      recursos.__segmentos = voz.segmentos;
      recursos.__textos = frases.map((f) => f.split('[').map((p, j) => (j ? p.slice(p.indexOf(']') + 1) : p)).join('').replace(/  +/g, ' ').trim());
    }
    const usadas = new Set();
    // Vídeos reales (marca/redes/videos, con su crédito): en el reel, toda especie con vídeo sale en vídeo y no en foto
    const usadosVideo = new Set();
    if (V2 && pieza.formato === 'reel' && !pieza.soloPortada) {
      const deEspecie = (esp) => Object.keys(VIDEOS).find((k) => (VIDEOS[k].especies || []).includes(esp));
      if (!pieza.ganchoVideo && pieza.ganchoVisual?.tipo === 'foto' && deEspecie(pieza.ganchoVisual.especie)) pieza.ganchoVideo = { clave: deEspecie(pieza.ganchoVisual.especie), inicio: 0 };
      if (pieza.ganchoVideo) { usadosVideo.add(pieza.ganchoVideo.clave); pieza.ganchoVisual = null; }
      pieza.escenas = pieza.escenas.map((e) => {
        const clave = e.v?.tipo === 'foto' && (e.v.video || deEspecie(e.v.especie));
        if (!clave) return e;
        usadosVideo.add(clave);
        return { ...e, v: { ...e.v, video: clave } };
      });
      recursos.__videos = Object.fromEntries([...usadosVideo].map((k) => [k, { src: '/__videos/' + VIDEOS[k].archivo, credito: `${VIDEOS[k].autor} (${VIDEOS[k].licencia}), Wikimedia Commons` }]));
    }
    const creditosVideo = [...usadosVideo].map((k) => `${VIDEOS[k].autor} (${VIDEOS[k].licencia}), Wikimedia Commons`);
    const visuales = [...(pieza.soloPortada ? [] : (pieza.escenas || pieza.laminas).map((e) => e.v).filter((v) => !v?.video)), pieza.ganchoVisual, pieza.portada?.visual, ...(pieza.portada?.visuales || [])].filter(Boolean);
    for (const v of visuales) {
      // En v2 las pantallas van dentro de un móvil: hace falta la vista completa (alto de pantalla) para desplazarla
      if (v.tipo === 'pagina') { if (V2) v.alto = Math.max(v.alto, 900); v.clave = 'p:' + JSON.stringify([v.ruta, v.desde, v.alto, v.rellenar || null, v.ancla || null]); recursos[v.clave] = await capturar(v); }
      if (v.tipo === 'foto') { v.clave = 'f:' + v.especie; recursos[v.clave] = datoFoto(v.especie); usadas.add(v.especie); }
    }

    await nav.ir(`${BASE}/__redes/${V2 ? 'lienzo2.html' : 'lienzo.html'}`, { ancho: 1200, alto: 900, escala: 1, movil: false, pausa: 800 });
    await nav.evaluar(`new Promise((r) => { const t = setInterval(() => { if (window.listo && window.Mp4Muxer) { clearInterval(t); r(true); } }, 100); })`);
    const res = await nav.evaluar(`window.generar(${JSON.stringify(pieza)}, ${JSON.stringify(recursos)})`);

    const carpeta = path.join(DESTINO, `${String(pieza.n).padStart(2, '0')}-${pieza.fecha}-${pieza.slug}`);
    if (!(V2 && pieza.soloPortada)) fs.rmSync(carpeta, { recursive: true, force: true });
    fs.mkdirSync(carpeta, { recursive: true });
    fs.mkdirSync(path.join(DESTINO, '_revision'), { recursive: true });
    if (res.portadas) for (const [nombre, b] of Object.entries(res.portadas)) fs.writeFileSync(path.join(carpeta, `${nombre}.jpg`), Buffer.from(b, 'base64'));
    if (res.laminas) res.laminas.forEach((b, i) => fs.writeFileSync(path.join(carpeta, `${String(i + 1).padStart(2, '0')}.${V2 ? 'jpg' : 'png'}`), Buffer.from(b, 'base64')));
    else if (res.video) {
      fs.writeFileSync(path.join(carpeta, 'video.mp4'), Buffer.from(res.video, 'base64'));
      if (res.portada) fs.writeFileSync(path.join(carpeta, 'portada.jpg'), Buffer.from(res.portada, 'base64'));
      res.revision.forEach((b, i) => fs.writeFileSync(path.join(DESTINO, '_revision', `${String(pieza.n).padStart(2, '0')}-${i}.jpg`), Buffer.from(b, 'base64')));
    }
    if (res.laminas) res.laminas.forEach((b, i) => fs.writeFileSync(path.join(DESTINO, '_revision', `${String(pieza.n).padStart(2, '0')}-${i}.${V2 ? 'jpg' : 'png'}`), Buffer.from(b, 'base64')));
    if (V2 && pieza.soloPortada) { console.log(`✓ ${pieza.n} ${pieza.titulo} — portadas`); continue; }

    const fotos = [...usadas].map((e) => datoFoto(e).credito);
    const textoFinal = [pieza.texto, fotos.length ? `Foto${fotos.length > 1 ? 's' : ''}: ${fotos.join('; ')}.` : '', creditosVideo.length ? `Vídeo${creditosVideo.length > 1 ? 's' : ''}: ${creditosVideo.join('; ')}.` : '', pieza.tags].filter(Boolean).join('\n\n') + '\n';
    fs.writeFileSync(path.join(carpeta, 'texto.txt'), textoFinal);
    const que = res.laminas ? `${res.laminas.length} láminas` : `vídeo de ${res.duracion.toFixed(1)} s`;
    resumen.push(`${pieza.n}. ${pieza.fecha} ${pieza.titulo}: ${que}`);
    console.log(`✓ ${pieza.n} ${pieza.titulo} — ${que}`);
  }
} finally {
  await nav.cerrar();
  servidor.close();
}
// Índice para programar: todas las piezas generadas, por fecha, con su vídeo o láminas y el texto para copiar
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fechaLarga = (f) => new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const filas = PIEZAS.map((p) => {
  const dir = `${String(p.n).padStart(2, '0')}-${p.fecha}-${p.slug}`;
  const ruta = path.join(SALIDA, dir);
  if (!fs.existsSync(ruta)) return '';
  const archivos = fs.readdirSync(ruta);
  const texto = fs.existsSync(path.join(ruta, 'texto.txt')) ? fs.readFileSync(path.join(ruta, 'texto.txt'), 'utf8') : '';
  const medios = archivos.includes('video.mp4')
    ? `<video src="${dir}/video.mp4" poster="${dir}/portada.jpg" controls preload="none" playsinline></video>`
    : `<div class="laminas">${archivos.filter((a) => a.endsWith('.png')).map((a) => `<img src="${dir}/${a}" alt="" loading="lazy">`).join('')}</div>`;
  return `<article><header><h2>${esc(fechaLarga(p.fecha))}</h2><p>${esc(p.titulo)} · ${p.formato === 'reel' ? 'Reel' : 'Carrusel'}</p></header>
    ${medios}
    <p class="ruta">${esc(path.join('marca', 'redes', 'salida', dir))}</p>
    <pre>${esc(texto)}</pre><button data-texto="${esc(texto)}">Copiar texto</button></article>`;
}).join('\n');
fs.writeFileSync(path.join(SALIDA, 'index.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Piezas de redes de Tankily</title>
<style>body{margin:0;background:#071425;color:#e6f1f7;font:16px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:0 auto;padding:32px 16px;display:grid;gap:28px}
h1{margin:0}article{background:#0d2238;border:1px solid #1d3a57;border-radius:14px;padding:18px;display:grid;gap:12px}header h2{margin:0;font-size:1.2rem;text-transform:capitalize}header p{margin:0;color:#9fb6cb}
video{width:270px;max-width:100%;border-radius:10px;background:#000}.laminas{display:flex;gap:8px;overflow-x:auto}.laminas img{height:300px;border-radius:8px}
pre{white-space:pre-wrap;background:#071425;border-radius:10px;padding:12px;margin:0;font:inherit;font-size:.95rem}.ruta{margin:0;color:#9fb6cb;font-size:.85rem}
button{justify-self:start;font:inherit;border:0;border-radius:99px;padding:8px 16px;background:#7cc4ff;color:#071425;font-weight:600;cursor:pointer}</style></head>
<body><main><h1>Piezas de redes de Tankily</h1><p>Del 4 de noviembre al 27 de diciembre de 2026. Cada carpeta tiene el vídeo (con su portada) o las láminas del carrusel y <code>texto.txt</code> con el texto de la publicación.</p>
${filas}</main><script>document.addEventListener('click',async(e)=>{const b=e.target.closest('button[data-texto]');if(!b)return;try{await navigator.clipboard.writeText(b.dataset.texto);b.textContent='Copiado';setTimeout(()=>b.textContent='Copiar texto',2000)}catch{}});</script></body></html>
`);
console.log(`\n${resumen.length} piezas en ${path.relative(RAIZ, SALIDA)} (índice: index.html)`);
