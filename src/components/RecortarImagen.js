"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Modal } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';

const ZOOM_MAX = 4;

// Recorte antes de subir (como LinkedIn): se arrastra para encuadrar y se acerca con el control,
// la rueda del ratón o pellizcando en el móvil. `forma` "circulo" (fotos de perfil y logos, salida
// cuadrada) o "rectangulo" con `proporcion` (portadas). Devuelve un archivo WebP del tamaño de salida.
export default function RecortarImagen({ archivo, forma = 'circulo', proporcion = 1, anchoSalida = 512, titulo, onListo, onCancelar }) {
  const { t } = useT();
  const marco = useRef(null);
  const [img, setImg] = useState(null);
  const [ancho, setAncho] = useState(0);
  // Zoom y posición juntos: cada paso (rueda, pellizco, arrastre) parte siempre del valor real
  const [vista, setVista] = useState({ z: 1, x: 0, y: 0 });
  const [guardando, setGuardando] = useState(false);
  const punteros = useRef(new Map());
  const gesto = useRef(null);

  const alto = ancho / proporcion;
  const base = img ? Math.max(ancho / img.naturalWidth, alto / img.naturalHeight) : 1;
  const escala = base * vista.z;

  // La imagen siempre cubre todo el marco: no se puede dejar hueco al arrastrar ni al alejar
  const limitar = useCallback((v) => {
    if (!img) return v;
    const esc = base * v.z;
    const minX = ancho - img.naturalWidth * esc;
    const minY = alto - img.naturalHeight * esc;
    return { z: v.z, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
  }, [img, ancho, alto, base]);

  useEffect(() => {
    const url = URL.createObjectURL(archivo);
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  // Tamaño del marco según el ancho disponible en la ventana
  useEffect(() => {
    const medir = () => setAncho(Math.min(marco.current?.parentElement?.clientWidth || 440, 480));
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  // Al cargar: centrada y llenando el marco
  useEffect(() => {
    if (!img || !ancho) return;
    const b = Math.max(ancho / img.naturalWidth, alto / img.naturalHeight);
    setVista({ z: 1, x: (ancho - img.naturalWidth * b) / 2, y: (alto - img.naturalHeight * b) / 2 });
  }, [img, ancho, alto]);

  // Cambia el zoom (valor o función del actual) manteniendo fijo el punto (cx, cy) del marco:
  // el centro, el cursor o el punto medio del pellizco
  const hacerZoom = useCallback((nuevo, cx = ancho / 2, cy = alto / 2) => {
    setVista((v) => {
      const z = Math.min(ZOOM_MAX, Math.max(1, typeof nuevo === 'function' ? nuevo(v.z) : nuevo));
      const antes = base * v.z;
      const despues = base * z;
      return limitar({ z, x: cx - ((cx - v.x) / antes) * despues, y: cy - ((cy - v.y) / antes) * despues });
    });
  }, [ancho, alto, base, limitar]);
  const mover = (dx, dy) => setVista((v) => limitar({ z: v.z, x: v.x + dx, y: v.y + dy }));

  function punto(e) {
    const r = marco.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function alPulsar(e) {
    marco.current.setPointerCapture(e.pointerId);
    punteros.current.set(e.pointerId, punto(e));
    gesto.current = null;
  }
  function alMover(e) {
    if (!punteros.current.has(e.pointerId)) return;
    const anterior = punteros.current.get(e.pointerId);
    const ahora = punto(e);
    punteros.current.set(e.pointerId, ahora);
    const lista = [...punteros.current.values()];
    if (lista.length >= 2) {
      // Pellizco: el zoom sigue la distancia entre los dos dedos
      const [a, b] = lista;
      const distancia = Math.hypot(a.x - b.x, a.y - b.y);
      const previa = gesto.current;
      if (previa) hacerZoom((z) => z * (distancia / previa), (a.x + b.x) / 2, (a.y + b.y) / 2);
      gesto.current = distancia;
    } else {
      mover(ahora.x - anterior.x, ahora.y - anterior.y);
    }
  }
  function alSoltar(e) {
    punteros.current.delete(e.pointerId);
    gesto.current = null;
  }

  // Rueda del ratón: zoom hacia el cursor (sin mover la página)
  useEffect(() => {
    const nodo = marco.current;
    if (!nodo) return undefined;
    const rueda = (e) => {
      e.preventDefault();
      const r = nodo.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      hacerZoom((z) => z * factor, e.clientX - r.left, e.clientY - r.top);
    };
    nodo.addEventListener('wheel', rueda, { passive: false });
    return () => nodo.removeEventListener('wheel', rueda);
  }, [hacerZoom]);

  function teclas(e) {
    const paso = e.shiftKey ? 40 : 10;
    const flecha = { ArrowLeft: [paso, 0], ArrowRight: [-paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] }[e.key];
    if (flecha) { e.preventDefault(); mover(...flecha); }
    if (e.key === '+' || e.key === '=') hacerZoom((z) => z * 1.1);
    if (e.key === '-') hacerZoom((z) => z / 1.1);
  }

  async function aplicar() {
    if (!img) return;
    setGuardando(true);
    const altoSalida = Math.round(anchoSalida / proporcion);
    const canvas = document.createElement('canvas');
    canvas.width = anchoSalida;
    canvas.height = altoSalida;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -vista.x / escala, -vista.y / escala, ancho / escala, alto / escala, 0, 0, anchoSalida, altoSalida);
    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/webp', 0.9));
    try {
      await onListo(new File([blob], 'recorte.webp', { type: 'image/webp' }));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo={titulo} onCerrar={onCancelar} ancho={540}>
      <div className="recorte">
        <div
          ref={marco}
          className={`recorte-marco recorte-${forma}`}
          style={{ width: ancho || '100%', height: alto || 240 }}
          tabIndex={0}
          role="application"
          aria-label={t('recorte.ayuda')}
          onPointerDown={alPulsar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onKeyDown={teclas}
        >
          {img && (
            <img
              src={img.src}
              alt=""
              draggable={false}
              style={{ width: img.naturalWidth, height: img.naturalHeight, transform: `translate(${vista.x}px, ${vista.y}px) scale(${escala})` }}
            />
          )}
          <span className="recorte-mascara" aria-hidden="true" />
        </div>
        <p className="pequeno texto-3">{t('recorte.ayuda')}</p>
        <label className="recorte-zoom">
          <ZoomOut size={18} aria-hidden />
          <input type="range" min={1} max={ZOOM_MAX} step={0.01} value={vista.z} onChange={(e) => hacerZoom(Number(e.target.value))} aria-label={t('recorte.zoom')} />
          <ZoomIn size={18} aria-hidden />
        </label>
        <div className="recorte-acciones">
          <button type="button" className="btn" onClick={onCancelar}>{t('recorte.cancelar')}</button>
          <button type="button" className="btn btn-primario" onClick={aplicar} disabled={!img || guardando}>{guardando ? t('recorte.subiendo') : t('recorte.aplicar')}</button>
        </div>
      </div>
    </Modal>
  );
}
