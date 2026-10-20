"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { DURACION_MAX } from '@/lib/videos';

// Edición básica antes de subir, como en Instagram pero sin filtros:
// - Encuadre: proporción (Original, 9:16, 4:5, 1:1, 16:9) y arrastrar el vídeo para colocarlo.
// - Duración: línea de tiempo con miniaturas y un rectángulo que se ensancha o acorta por sus bordes y se arrastra
//   entero (máx. 60 s). La vista previa repite en bucle el trozo elegido.
// Va en un portal sobre toda la página (dentro de un contenedor con backdrop-filter, un position: fixed no cubre la
// pantalla). Devuelve { inicio, fin, recorte } con onListo.
const PROPORCIONES = [['original', null], ['9:16', 9 / 16], ['4:5', 4 / 5], ['1:1', 1], ['16:9', 16 / 9]];
const MINIATURAS = 10;
const MINIMO = 1; // s
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Fotogramas repartidos por todo el vídeo para la línea de tiempo (con un segundo <video>, sin tocar la vista previa)
async function sacarMiniaturas(url, duracion, n) {
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  await new Promise((r) => { v.onloadeddata = r; v.onerror = r; });
  const alto = 64, ancho = Math.max(24, Math.round(alto * (v.videoWidth / v.videoHeight || 0.56)));
  const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
  const g = c.getContext('2d');
  const res = [];
  for (let i = 0; i < n; i++) {
    await new Promise((r) => { v.onseeked = r; v.currentTime = Math.min(duracion - 0.05, (duracion * (i + 0.5)) / n); });
    g.drawImage(v, 0, 0, ancho, alto);
    res.push(c.toDataURL('image/jpeg', 0.6));
  }
  v.removeAttribute('src'); v.load();
  return res;
}

export default function EditorVideo({ archivo, onListo, onCancelar }) {
  const { t } = useT();
  // La URL temporal se crea y se libera en el mismo efecto (con useMemo, el doble montaje de desarrollo la anulaba)
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const u = URL.createObjectURL(archivo);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [archivo]);
  const el = useRef(null);
  const pista = useRef(null);
  const [info, setInfo] = useState(null); // { duracion, ancho, alto }
  const [inicio, setInicio] = useState(0);
  const [fin, setFin] = useState(0);
  const [ahora, setAhora] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [prop, setProp] = useState('original');
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [miniaturas, setMiniaturas] = useState([]);
  const gesto = useRef(null);
  const tramo = useRef({ inicio: 0, fin: 0 });
  useEffect(() => { tramo.current = { inicio, fin }; }, [inicio, fin]);

  // Sin desplazamiento de la página de detrás y con Escape para cerrar
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const tecla = (e) => e.key === 'Escape' && onCancelar();
    document.addEventListener('keydown', tecla);
    return () => { document.body.style.overflow = previo; document.removeEventListener('keydown', tecla); };
  }, [onCancelar]);

  function alCargar() {
    const v = el.current;
    const d = v.duration;
    setInfo({ duracion: d, ancho: v.videoWidth, alto: v.videoHeight });
    setFin(Math.min(d, DURACION_MAX));
    tramo.current = { inicio: 0, fin: Math.min(d, DURACION_MAX) };
    v.play().catch(() => setPausado(true));
    sacarMiniaturas(url, d, MINIATURAS).then(setMiniaturas).catch(() => {});
  }
  // La vista previa repite en bucle el trozo elegido
  // Solo se reproduce lo que marca la selección: se comprueba en cada fotograma (timeupdate solo llega ~4 veces
  // por segundo y dejaba ver hasta un cuarto de segundo de fuera) y, al pasarse del final, vuelve al inicio
  useEffect(() => {
    let id;
    const vigilar = () => {
      const v = el.current;
      const { inicio: i, fin: f } = tramo.current;
      if (v && !gesto.current && f > i) {
        if (v.currentTime >= f - 0.02 || v.currentTime < i - 0.05) v.currentTime = i;
        setAhora(v.currentTime);
      }
      id = requestAnimationFrame(vigilar);
    };
    id = requestAnimationFrame(vigilar);
    return () => cancelAnimationFrame(id);
  }, []);
  function alAvanzar() {
    // Respaldo por si la pestaña no pinta fotogramas (en segundo plano no hay requestAnimationFrame)
    const v = el.current;
    const { inicio: i, fin: f } = tramo.current;
    if (v && !gesto.current && f > i && (v.currentTime >= f || v.currentTime < i - 0.05)) v.currentTime = i;
  }
  function alternarReproduccion() {
    const v = el.current;
    if (!v) return;
    if (v.paused) {
      const { inicio: i, fin: f } = tramo.current;
      if (v.currentTime < i || v.currentTime >= f - 0.05) v.currentTime = i; // siempre dentro del fragmento
      v.play().catch(() => {}); setPausado(false);
    } else { v.pause(); setPausado(true); }
  }

  // --- Línea de tiempo: arrastrar el borde izquierdo, el derecho o el rectángulo entero ---
  const dur = info?.duracion || 0;
  function empezarGesto(tipo, e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesto.current = { tipo, x0: e.clientX, ancho: pista.current.getBoundingClientRect().width, inicio, fin, estabaPausado: el.current?.paused ?? true };
    el.current?.pause(); // quieto en el fotograma del borde mientras se arrastra
    // El final del arrastre se escucha en toda la ventana: si el dedo se suelta fuera de la pista, no se queda «enganchado»
    const terminar = () => { window.removeEventListener('pointerup', terminar); window.removeEventListener('pointercancel', terminar); soltarGesto(); };
    window.addEventListener('pointerup', terminar);
    window.addEventListener('pointercancel', terminar);
  }
  function moverGesto(e) {
    const g = gesto.current;
    if (!g || !dur) return;
    const dt = ((e.clientX - g.x0) / g.ancho) * dur;
    let i = g.inicio, f = g.fin;
    if (g.tipo === 'inicio') i = Math.min(Math.max(0, g.inicio + dt, g.fin - DURACION_MAX), g.fin - MINIMO);
    else if (g.tipo === 'fin') f = Math.max(Math.min(dur, g.fin + dt, g.inicio + DURACION_MAX), g.inicio + MINIMO);
    else { const largo = g.fin - g.inicio; i = Math.min(Math.max(0, g.inicio + dt), dur - largo); f = i + largo; }
    setInicio(i); setFin(f);
    // Mientras se arrastra se ve el fotograma del borde que se mueve
    if (el.current) el.current.currentTime = g.tipo === 'fin' ? Math.max(i, f - 0.1) : i;
  }
  function soltarGesto() {
    if (!gesto.current) return;
    const { estabaPausado } = gesto.current;
    gesto.current = null;
    if (el.current) { el.current.currentTime = tramo.current.inicio; if (!estabaPausado) el.current.play().catch(() => {}); }
  }

  // --- Encuadre: arrastrar el vídeo dentro del marco (object-position, 0..1 en cada eje) ---
  const r = PROPORCIONES.find(([k]) => k === prop)[1];
  const propOriginal = info ? info.ancho / info.alto : 9 / 16;
  const propMarco = r || propOriginal;
  function empezarEncuadre(e) {
    if (!r) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesto.current = { tipo: 'encuadre', x0: e.clientX, y0: e.clientY, pos, caja: e.currentTarget.getBoundingClientRect() };
    const terminar = () => { window.removeEventListener('pointerup', terminar); window.removeEventListener('pointercancel', terminar); gesto.current = null; };
    window.addEventListener('pointerup', terminar);
    window.addEventListener('pointercancel', terminar);
  }
  function moverEncuadre(e) {
    const g = gesto.current;
    if (!g || g.tipo !== 'encuadre') return;
    const sobraX = Math.max(1, g.caja.height * propOriginal - g.caja.width);
    const sobraY = Math.max(1, g.caja.width / propOriginal - g.caja.height);
    const lim = (n) => Math.min(1, Math.max(0, n));
    setPos({
      x: propOriginal > propMarco ? lim(g.pos.x - (e.clientX - g.x0) / sobraX) : 0.5,
      y: propOriginal < propMarco ? lim(g.pos.y - (e.clientY - g.y0) / sobraY) : 0.5,
    });
  }

  function listo() {
    let recorte = null;
    if (r && info) {
      const { ancho: W, alto: H } = info;
      if (W / H > r) { const w = Math.round(H * r); recorte = { x: Math.round((W - w) * pos.x), y: 0, w, h: H }; }
      else { const h = Math.round(W / r); recorte = { x: 0, y: Math.round((H - h) * pos.y), w: W, h }; }
    }
    onListo({ inicio, fin, recorte });
  }

  const pct = (s) => (dur ? (s / dur) * 100 : 0);
  return createPortal(
    <div className="editor-video-fondo" role="dialog" aria-modal="true" aria-label={t('video.editar')}>
      <div className="editor-video">
        <header className="editor-video-cabecera">
          <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={onCancelar} aria-label={t('comun.cancelar')}><X size={18} /></button>
          <strong>{t('video.editar')}</strong>
          <button type="button" className="btn btn-primario btn-s" disabled={!info} onClick={listo}>{t('video.usar')}</button>
        </header>

        <div className="editor-video-escena">
          <div
            className={`editor-video-marco${r ? ' movible' : ''}`}
            style={{ '--prop': propMarco }}
            onPointerDown={empezarEncuadre}
            onPointerMove={moverEncuadre}
            onPointerUp={() => { gesto.current = null; }}
            onClick={r ? undefined : alternarReproduccion}
          >
            <video
              ref={el}
              src={url || undefined}
              muted
              playsInline
              onLoadedMetadata={alCargar}
              onTimeUpdate={alAvanzar}
              style={{ objectFit: r ? 'cover' : 'contain', objectPosition: `${pos.x * 100}% ${pos.y * 100}%` }}
            />
            {pausado && <span className="editor-video-pausa" aria-hidden><Play size={28} /></span>}
          </div>
        </div>
        {r && <p className="mini texto-3 editor-video-ayuda">{t('video.arrastra')}</p>}

        <div className="editor-video-controles">
          <div className="chips editor-video-proporciones" role="group" aria-label={t('video.encuadre')}>
            {PROPORCIONES.map(([k]) => (
              <button key={k} type="button" className={`chip${prop === k ? ' activo' : ''}`} aria-pressed={prop === k}
                onClick={() => { setProp(k); setPos({ x: 0.5, y: 0.5 }); }}>
                {k === 'original' ? t('video.original') : k}
              </button>
            ))}
          </div>

          <div className="editor-video-tiempos mini">
            <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={alternarReproduccion} aria-label={pausado ? t('video.reproducir') : t('video.pausar')}>
              {pausado ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <span>{mmss(inicio)}</span>
            <strong>{t('video.segundos', { s: Math.round(fin - inicio) })}</strong>
            <span>{mmss(fin)}</span>
          </div>

          <div className="editor-video-pista" ref={pista} onPointerMove={moverGesto} onPointerUp={soltarGesto} onPointerCancel={soltarGesto}>
            <div className="editor-video-tira">
              {Array.from({ length: MINIATURAS }, (_, i) => (
                <span key={i} style={miniaturas[i] ? { backgroundImage: `url(${miniaturas[i]})` } : undefined} />
              ))}
            </div>
            <div className="editor-video-sombra" style={{ left: 0, width: `${pct(inicio)}%` }} />
            <div className="editor-video-sombra" style={{ left: `${pct(fin)}%`, right: 0 }} />
            <div
              className="editor-video-seleccion"
              style={{ left: `${pct(inicio)}%`, width: `${pct(fin - inicio)}%` }}
              onPointerDown={(e) => empezarGesto('mover', e)}
              role="group"
              aria-label={t('video.duracion')}
            >
              <span className="editor-video-asa izq" onPointerDown={(e) => empezarGesto('inicio', e)} aria-label={t('video.inicio')} role="slider" aria-valuenow={Math.round(inicio)} aria-valuemin={0} aria-valuemax={Math.round(dur)} tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'ArrowLeft') setInicio(Math.max(0, inicio - 1)); if (e.key === 'ArrowRight') setInicio(Math.min(fin - MINIMO, inicio + 1)); }} />
              <span className="editor-video-asa der" onPointerDown={(e) => empezarGesto('fin', e)} aria-label={t('video.fin')} role="slider" aria-valuenow={Math.round(fin)} aria-valuemin={0} aria-valuemax={Math.round(dur)} tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'ArrowLeft') setFin(Math.max(inicio + MINIMO, fin - 1)); if (e.key === 'ArrowRight') setFin(Math.min(dur, inicio + DURACION_MAX, fin + 1)); }} />
            </div>
            {dur > 0 && <div className="editor-video-cabezal" style={{ left: `${pct(ahora)}%` }} />}
          </div>
          {dur > DURACION_MAX && <p className="mini texto-3" style={{ textAlign: 'center' }}>{t('video.maximo', { s: DURACION_MAX })}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
