"use client";

import { useMemo, useRef, useState } from 'react';
import { PARAMETROS, ES_MARINO } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { formatNumero, formatFechaHora } from '@/lib/formatRelativeTime';

const ANCHO = 600;
const ALTO = 180;
const M = { arriba: 12, derecha: 12, abajo: 22, izquierda: 40 };

const fmtFecha = (f) => formatFechaHora(f, { day: 'numeric', month: 'short' });
// Con muchas mediciones los puntos se amontonan: solo se dibujan el último y el señalado
const MAX_PUNTOS = 40;

// Una serie temporal por parámetro. La banda gris marca el rango recomendado.
// La temperatura se guarda en °C y se muestra en la unidad elegida por el usuario.
export default function GraficaParametro({ parametro, mediciones, tipoTanque }) {
  const { t } = useT();
  const u = useUnidades();
  const [activo, setActivo] = useState(null);
  const svg = useRef(null);
  const def = PARAMETROS[parametro];
  const esTemp = parametro === 'temperatura';
  const conv = esTemp ? u.deC : (v) => v;
  const unidad = esTemp ? u.unidadTemp : def?.unidad;
  const rangoBase = def?.[ES_MARINO(tipoTanque) ? 'marino' : 'dulce'];
  const rango = rangoBase && rangoBase.map(conv);
  const nombre = t(`parametros.${parametro}`);

  const datos = useMemo(
    () => [...mediciones].sort((a, b) => new Date(a.medido_en) - new Date(b.medido_en)).map((m) => ({ ...m, t: new Date(m.medido_en).getTime(), v: conv(Number(m.valor)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mediciones, u.sistema],
  );

  if (datos.length === 0) return null;

  const valores = datos.map((d) => d.v);
  let min = Math.min(...valores, ...(rango || []));
  let max = Math.max(...valores, ...(rango || []));
  if (min === max) { min -= 1; max += 1; }
  const holgura = (max - min) * 0.12;
  min -= holgura; max += holgura;
  const t0 = datos[0].t;
  const t1 = datos.length > 1 ? datos[datos.length - 1].t : t0 + 86400000;

  const x = (tt) => M.izquierda + ((tt - t0) / (t1 - t0 || 1)) * (ANCHO - M.izquierda - M.derecha);
  const y = (v) => M.arriba + (1 - (v - min) / (max - min)) * (ALTO - M.arriba - M.abajo);
  const puntos = datos.map((d) => `${x(d.t)},${y(d.v)}`).join(' ');
  const marcas = [min + holgura, (min + max) / 2, max - holgura];
  const fuera = (d) => !!rango && (d.v < rango[0] || d.v > rango[1]);
  const ultimo = datos[datos.length - 1];
  const visibles = datos.length <= MAX_PUNTOS ? datos : datos.filter((d) => d === ultimo || d.id === activo?.id || fuera(d));

  function alMover(e) {
    const caja = svg.current.getBoundingClientRect();
    const px = ((e.clientX - caja.left) / caja.width) * ANCHO;
    let mejor = datos[0];
    for (const d of datos) if (Math.abs(x(d.t) - px) < Math.abs(x(mejor.t) - px)) mejor = d;
    setActivo(mejor);
  }

  return (
    <figure className="grafica">
      <figcaption style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <strong className="titulo-s">{nombre}</strong>
        <span className="mini texto-3">
          {rango ? t('mediciones.recomendado', { min: formatNumero(rango[0]), max: formatNumero(rango[1]), u: unidad }) : unidad}
        </span>
      </figcaption>
      <div style={{ position: 'relative' }}>
        <svg
          ref={svg}
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          width="100%"
          role="img"
          aria-label={t('mediciones.evolucion', { nombre, valor: formatNumero(valores[valores.length - 1]), u: unidad })}
          onPointerMove={alMover}
          onPointerLeave={() => setActivo(null)}
          style={{ display: 'block', touchAction: 'pan-y' }}
        >
          {rango && (
            <rect x={M.izquierda} width={ANCHO - M.izquierda - M.derecha} y={y(rango[1])} height={Math.max(0, y(rango[0]) - y(rango[1]))} fill="rgba(var(--c-tinta),0.07)" />
          )}
          {marcas.map((v) => (
            <g key={v}>
              <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(v)} y2={y(v)} stroke="rgba(var(--c-tinta),0.1)" />
              <text x={M.izquierda - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--texto-3)">{formatNumero(v)}</text>
            </g>
          ))}
          <text x={M.izquierda} y={ALTO - 4} fontSize="11" fill="var(--texto-3)">{fmtFecha(t0)}</text>
          {datos.length > 1 && <text x={ANCHO - M.derecha} y={ALTO - 4} fontSize="11" fill="var(--texto-3)" textAnchor="end">{fmtFecha(t1)}</text>}

          <polyline points={puntos} fill="none" stroke="var(--agua)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* Los valores fuera del rango recomendado, en color de aviso (y dicho en el tooltip y en la tabla) */}
          {visibles.map((d) => (
            <circle key={d.id} cx={x(d.t)} cy={y(d.v)} r={activo?.id === d.id ? 5 : 4} fill={fuera(d) ? 'var(--aviso)' : 'var(--agua)'} stroke="var(--superficie)" strokeWidth="2" />
          ))}
          {activo && <line x1={x(activo.t)} x2={x(activo.t)} y1={M.arriba} y2={ALTO - M.abajo} stroke="rgba(var(--c-tinta),0.5)" strokeDasharray="3 3" />}
        </svg>
        {activo && (
          <div className="tooltip-grafica cristal" style={{ left: `${(x(activo.t) / ANCHO) * 100}%` }}>
            <span className="cifra">{formatNumero(activo.v)} {unidad}</span>
            <span className="mini texto-3">{formatFechaHora(activo.medido_en)}</span>
            {fuera(activo) && <span className="mini" style={{ color: 'var(--aviso)' }}>{t('mediciones.fueraRango')}</span>}
          </div>
        )}
      </div>
      {/* La misma información en tabla para lectores de pantalla (la gráfica solo se puede explorar con el ratón) */}
      <table className="sr-only">
        <caption>{nombre}</caption>
        <thead><tr><th scope="col">{t('mediciones.fecha')}</th><th scope="col">{t('mediciones.valor')}</th></tr></thead>
        <tbody>
          {datos.slice(-30).map((d) => (
            <tr key={d.id}><td>{formatFechaHora(d.medido_en)}</td><td>{formatNumero(d.v)} {unidad}{fuera(d) ? ` (${t('mediciones.fueraRango')})` : ''}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
