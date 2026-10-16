"use client";

import { useState } from 'react';
import { Trash2, Droplets, Sparkles, Filter, FlaskConical, Plus, Minus, Pill, Scissors, NotebookPen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TIPOS_EVENTO } from '@/lib/constantes';
import { formatRelativeTime, formatFechaHora } from '@/lib/formatRelativeTime';
import { Vacio, useTostada } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';

// Icono de cada tipo de evento: se ve de un vistazo qué se hizo en el tanque
const ICONOS = { cambio_agua: Droplets, limpieza: Sparkles, filtro: Filter, dosificacion: FlaskConical, alta: Plus, baja: Minus, tratamiento: Pill, poda: Scissors, otro: NotebookPen };

// Agrupa los eventos (ya ordenados de más reciente a más antiguo) por mes: [['octubre de 2026', [...]], …]
function porMes(eventos) {
  const grupos = [];
  for (const ev of eventos) {
    const mes = formatFechaHora(ev.fecha, { month: 'long', year: 'numeric' });
    const etiqueta = mes.charAt(0).toLocaleUpperCase() + mes.slice(1);
    if (grupos.at(-1)?.[0] !== etiqueta) grupos.push([etiqueta, []]);
    grupos.at(-1)[1].push(ev);
  }
  return grupos;
}

export default function Diario({ tanque, eventos, setEventos, esDueno }) {
  const tostada = useTostada();
  const { t } = useT();
  const [tipo, setTipo] = useState('cambio_agua');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function anotar(e) {
    e.preventDefault();
    setGuardando(true);
    const { data, error } = await supabase.from('tanque_eventos').insert({ tanque_id: tanque.id, tipo, nota: nota.trim() || null }).select().single();
    setGuardando(false);
    if (error) return tostada(t('diario.errorAnotar', { error: error.message }));
    setEventos([data, ...eventos]);
    setNota('');
    tostada(t('diario.anotado'));
  }

  async function borrar(id) {
    const { error } = await supabase.from('tanque_eventos').delete().eq('id', id);
    if (!error) setEventos(eventos.filter((e) => e.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {esDueno && (
        <form onSubmit={anotar} className="cristal-suave" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="chips">
            {TIPOS_EVENTO.filter((k) => !['alta', 'baja'].includes(k)).map((k) => (
              <button type="button" key={k} className="chip" aria-pressed={tipo === k} onClick={() => setTipo(k)}>{t(`eventos.${k}`)}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="entrada" maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} placeholder={t('diario.notaEj')} aria-label={t('diario.nota')} />
            <button className="btn btn-primario" disabled={guardando}>{t('diario.anotar')}</button>
          </div>
        </form>
      )}

      {eventos.length === 0 ? (
        <Vacio titulo={t('diario.vacioTitulo')}>{esDueno ? t('diario.vacioDueno') : t('diario.vacioOtro')}</Vacio>
      ) : (
        <div className="diario cristal-suave">
          {porMes(eventos).map(([mes, lista]) => (
            <section key={mes} className="diario-mes">
              <h3 className="mini texto-3">{mes}</h3>
              <ol className="linea-tiempo">
                {lista.map((ev) => {
                  const Icono = ICONOS[ev.tipo] || NotebookPen;
                  return (
                    <li key={ev.id} className={`evento-${ev.tipo}`}>
                      <span className="evento-icono" aria-hidden="true"><Icono size={14} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong className="pequeno">{t(`eventos.${ev.tipo}`)}</strong> <span className="texto-3 mini">{formatRelativeTime(ev.fecha)}</span>
                        {ev.nota && <p className="pequeno texto-2">{ev.nota}</p>}
                      </div>
                      {esDueno && <button className="btn btn-fantasma btn-icono btn-s" onClick={() => borrar(ev.id)} aria-label={t('diario.eliminar')}><Trash2 size={14} /></button>}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
