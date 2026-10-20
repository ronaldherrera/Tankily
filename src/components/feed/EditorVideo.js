"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';
import { DURACION_MAX } from '@/lib/videos';

// Edición básica antes de subir, como en Instagram pero sin filtros: recortar la duración (inicio y final, máx. 60 s)
// y elegir el encuadre (proporción + arrastrar para colocar). Devuelve { inicio, fin, recorte } con onListo.
const PROPORCIONES = [['original', null], ['9:16', 9 / 16], ['4:5', 4 / 5], ['1:1', 1], ['16:9', 16 / 9]];
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function EditorVideo({ archivo, onListo, onCancelar }) {
  const { t } = useT();
  const url = useMemo(() => URL.createObjectURL(archivo), [archivo]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const el = useRef(null);
  const [info, setInfo] = useState(null); // { duracion, ancho, alto }
  const [inicio, setInicio] = useState(0);
  const [fin, setFin] = useState(0);
  const [prop, setProp] = useState('original');
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const arrastre = useRef(null);

  function alCargar() {
    const v = el.current;
    setInfo({ duracion: v.duration, ancho: v.videoWidth, alto: v.videoHeight });
    setFin(Math.min(v.duration, DURACION_MAX));
    v.play().catch(() => {});
  }
  // La vista previa repite en bucle el trozo elegido
  function alAvanzar() {
    const v = el.current;
    if (v && (v.currentTime >= fin || v.currentTime < inicio - 0.3)) v.currentTime = inicio;
  }
  function cambiarInicio(valor) {
    const i = Math.min(valor, fin - 1);
    setInicio(i);
    if (fin - i > DURACION_MAX) setFin(i + DURACION_MAX);
    if (el.current) el.current.currentTime = i;
  }
  function cambiarFin(valor) {
    const f = Math.max(valor, inicio + 1);
    setFin(f);
    if (f - inicio > DURACION_MAX) setInicio(f - DURACION_MAX);
    if (el.current) el.current.currentTime = Math.max(inicio, f - 2);
  }

  const r = PROPORCIONES.find(([k]) => k === prop)[1];
  const propOriginal = info ? info.ancho / info.alto : 9 / 16;
  const propMarco = r || propOriginal;

  // Arrastrar el vídeo dentro del marco: mueve object-position (0..1 en cada eje)
  function alPulsar(e) {
    if (!r) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const caja = e.currentTarget.getBoundingClientRect();
    arrastre.current = { x0: e.clientX, y0: e.clientY, pos, caja };
  }
  function alMover(e) {
    const a = arrastre.current;
    if (!a || !info) return;
    const sobraX = Math.max(1, a.caja.height * propOriginal - a.caja.width); // lo que sobresale del marco
    const sobraY = Math.max(1, a.caja.width / propOriginal - a.caja.height);
    const lim = (n) => Math.min(1, Math.max(0, n));
    setPos({
      x: propOriginal > propMarco ? lim(a.pos.x - (e.clientX - a.x0) / sobraX) : 0.5,
      y: propOriginal < propMarco ? lim(a.pos.y - (e.clientY - a.y0) / sobraY) : 0.5,
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

  const dur = info?.duracion || 0;
  return (
    <Modal titulo={t('video.editar')} onCerrar={onCancelar} ancho={460}>
      <div className="editor-video">
        <div
          className={`editor-video-marco${r ? ' movible' : ''}`}
          style={{ aspectRatio: String(propMarco) }}
          onPointerDown={alPulsar}
          onPointerMove={alMover}
          onPointerUp={() => { arrastre.current = null; }}
        >
          <video
            ref={el}
            src={url}
            muted
            playsInline
            onLoadedMetadata={alCargar}
            onTimeUpdate={alAvanzar}
            style={{ objectFit: r ? 'cover' : 'contain', objectPosition: `${pos.x * 100}% ${pos.y * 100}%` }}
          />
        </div>
        {r && <p className="mini texto-3">{t('video.arrastra')}</p>}

        <div className="chips" role="group" aria-label={t('video.encuadre')}>
          {PROPORCIONES.map(([k]) => (
            <button key={k} type="button" className={`chip${prop === k ? ' activo' : ''}`} aria-pressed={prop === k}
              onClick={() => { setProp(k); setPos({ x: 0.5, y: 0.5 }); }}>
              {k === 'original' ? t('video.original') : k}
            </button>
          ))}
        </div>

        {dur > 0 && (
          <div className="editor-video-tramo">
            <div className="mini" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('video.duracion')}</span>
              <span className="texto-3">{mmss(inicio)} – {mmss(fin)} · {t('video.segundos', { s: Math.round(fin - inicio) })}</span>
            </div>
            <label className="mini texto-3">{t('video.inicio')}
              <input type="range" min="0" max={dur} step="0.1" value={inicio} onChange={(e) => cambiarInicio(Number(e.target.value))} />
            </label>
            <label className="mini texto-3">{t('video.fin')}
              <input type="range" min="0" max={dur} step="0.1" value={fin} onChange={(e) => cambiarFin(Number(e.target.value))} />
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-fantasma" onClick={onCancelar}>{t('comun.cancelar')}</button>
          <button type="button" className="btn btn-primario" disabled={!info} onClick={listo}>{t('video.usar')}</button>
        </div>
      </div>
    </Modal>
  );
}
