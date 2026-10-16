"use client";

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PARAMETROS, parametrosDe, fueraDeRango } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { formatNumero, formatFechaHora } from '@/lib/formatRelativeTime';
import { Modal, Vacio, useTostada } from '@/components/ui';
import GraficaParametro from './GraficaParametro';

const fmt = (v) => formatNumero(v, 2);

// Valor y unidad de una medición para mostrar (la temperatura se guarda en °C)
function useMostrar() {
  const u = useUnidades();
  return (parametro, valor) => (parametro === 'temperatura'
    ? [fmt(u.deC(Number(valor))), u.unidadTemp]
    : [fmt(valor), PARAMETROS[parametro]?.unidad]);
}

// Último valor de cada parámetro, con aviso si está fuera del rango orientativo
export function UltimosParametros({ mediciones, tipo }) {
  const { t } = useT();
  const mostrar = useMostrar();
  const ultimos = {};
  for (const m of mediciones) if (!ultimos[m.parametro] || m.medido_en > ultimos[m.parametro].medido_en) ultimos[m.parametro] = m;
  // En el orden habitual de cada tipo de tanque (temperatura, salinidad, pH, KH…); los demás al final
  const orden = parametrosDe(tipo);
  const posicion = (p) => (orden.includes(p) ? orden.indexOf(p) : orden.length);
  const lista = Object.values(ultimos).sort((a, b) => posicion(a.parametro) - posicion(b.parametro));
  if (!lista.length) return null;
  return (
    <div className="rejilla-parametros">
      {lista.map((m) => {
        const raro = fueraDeRango(m.parametro, Number(m.valor), tipo);
        const [valor, unidad] = mostrar(m.parametro, m.valor);
        return (
          <div key={m.parametro} className={`parametro${raro ? ' fuera' : ''}`}>
            <span className="mini texto-3">{t(`parametros.${m.parametro}`)}</span>
            <span><span className="cifra" style={{ fontSize: '1.4rem' }}>{valor}</span> <span className="mini texto-3">{unidad}</span></span>
            {raro && <span className="estado"><AlertTriangle size={12} /> {t('mediciones.fueraRango')}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function FormularioMedicion({ tanque, onGuardado, onCerrar }) {
  const tostada = useTostada();
  const { t } = useT();
  const u = useUnidades();
  const mostrar = useMostrar();
  const disponibles = parametrosDe(tanque.tipo);
  const [valores, setValores] = useState({});
  const [compartir, setCompartir] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    const filas = Object.entries(valores)
      .filter(([, v]) => v !== '' && !Number.isNaN(Number(String(v).replace(',', '.'))))
      .map(([parametro, v]) => {
        const numero = Number(String(v).replace(',', '.'));
        return { tanque_id: tanque.id, parametro, valor: parametro === 'temperatura' ? u.aC(numero) : numero };
      });
    if (!filas.length) return;
    setGuardando(true);
    const { data, error } = await supabase.from('mediciones').insert(filas).select();
    if (!error && compartir) {
      const valores = filas.map((f) => {
        const [valor, unidad] = mostrar(f.parametro, f.valor);
        return `${t(`parametros.${f.parametro}`)} ${valor}${unidad ? ' ' + unidad : ''}`;
      }).join(' · ');
      const texto = t('mediciones.textoMuro', { nombre: tanque.nombre, tipo: t(`tipos.${tanque.tipo}`), valores });
      await supabase.from('publicaciones').insert({ contenido: texto, tipo: 'medicion', tanque_id: tanque.id });
    }
    setGuardando(false);
    if (error) return tostada(t('comun.errorGuardar', { error: error.message }));
    tostada(t('mediciones.guardada', { n: filas.length }));
    onGuardado(data);
    onCerrar();
  }

  return (
    <Modal titulo={t('mediciones.nueva')} onCerrar={onCerrar}>
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p className="pequeno texto-2">{t('mediciones.soloMedido')}</p>
        <div className="fila-campos" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
          {disponibles.map((p) => (
            <label key={p} className="campo">
              <span>{t(`parametros.${p}`)}{(p === 'temperatura' ? u.unidadTemp : PARAMETROS[p].unidad) ? ` (${p === 'temperatura' ? u.unidadTemp : PARAMETROS[p].unidad})` : ''}</span>
              <input className="entrada" inputMode="decimal" value={valores[p] || ''} onChange={(e) => setValores({ ...valores, [p]: e.target.value })} />
            </label>
          ))}
        </div>
        {tanque.visibilidad === 'publico' && (
          <label className="casilla">
            <input type="checkbox" checked={compartir} onChange={(e) => setCompartir(e.target.checked)} />
            {t('mediciones.compartir')}
          </label>
        )}
        <button className="btn btn-primario" disabled={guardando}>{guardando ? t('comun.guardando') : t('mediciones.guardar')}</button>
      </form>
    </Modal>
  );
}

export default function Mediciones({ tanque, mediciones, setMediciones, esDueno }) {
  const { t } = useT();
  const mostrar = useMostrar();
  const [formulario, setFormulario] = useState(false);
  const porParametro = {};
  for (const m of mediciones) (porParametro[m.parametro] ||= []).push(m);
  const orden = parametrosDe(tanque.tipo).filter((p) => porParametro[p]).concat(Object.keys(porParametro).filter((p) => !parametrosDe(tanque.tipo).includes(p)));

  async function borrar(id) {
    const { error } = await supabase.from('mediciones').delete().eq('id', id);
    if (!error) setMediciones(mediciones.filter((m) => m.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {esDueno && (
        <button className="btn btn-primario" style={{ alignSelf: 'flex-start' }} onClick={() => setFormulario(true)}>{t('mediciones.anadir')}</button>
      )}

      {mediciones.length === 0 ? (
        <Vacio titulo={t('mediciones.vacioTitulo')}>
          {esDueno ? t('mediciones.vacioDueno') : t('mediciones.vacioOtro')}
        </Vacio>
      ) : (
        <>
          {orden.map((p) => (
            <div key={p} className="cristal-suave">
              <GraficaParametro parametro={p} mediciones={porParametro[p]} tipoTanque={tanque.tipo} />
            </div>
          ))}

          <details className="cristal-suave" style={{ padding: 16 }}>
            <summary className="titulo-s" style={{ cursor: 'pointer' }}>{t('mediciones.historial', { n: mediciones.length })}</summary>
            <table className="tabla" style={{ marginTop: 12 }}>
              <thead><tr><th>{t('mediciones.fecha')}</th><th>{t('mediciones.parametro')}</th><th>{t('mediciones.valor')}</th>{esDueno && <th><span className="sr-only">{t('mediciones.acciones')}</span></th>}</tr></thead>
              <tbody>
                {[...mediciones].sort((a, b) => b.medido_en.localeCompare(a.medido_en)).map((m) => (
                  <tr key={m.id}>
                    <td>{formatFechaHora(m.medido_en, { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{t(`parametros.${m.parametro}`)}</td>
                    <td className="cifra">{mostrar(m.parametro, m.valor)[0]} <span className="texto-3 mini">{mostrar(m.parametro, m.valor)[1]}</span></td>
                    {esDueno && <td><button className="btn btn-fantasma btn-icono btn-s" onClick={() => borrar(m.id)} aria-label={t('mediciones.eliminar')}><Trash2 size={14} /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}

      {formulario && (
        <FormularioMedicion tanque={tanque} onCerrar={() => setFormulario(false)} onGuardado={(nuevas) => setMediciones([...mediciones, ...nuevas])} />
      )}
    </div>
  );
}
