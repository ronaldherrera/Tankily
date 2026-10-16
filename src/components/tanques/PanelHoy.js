"use client";

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { tareasDelTanque } from '@/lib/tareas';
import { FilaTarea, cuandoToca, nombreTarea } from './Mantenimiento';

// "Hoy en tus tanques": tareas pendientes de todos los tanques del usuario, en la portada.
// Es el motivo para volver cada día: abre Tankily, marca lo hecho y queda en el diario.
export default function PanelHoy() {
  const { usuario } = useSesion();
  const { t } = useT();
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const { data: tanques } = await supabase
        .from('tanques')
        .select('id, nombre, cambio_agua_cada_dias, creado_en, eventos:tanque_eventos(fecha, tipo)')
        .eq('usuario_id', usuario.id)
        .eq('eventos.tipo', 'cambio_agua')
        .order('fecha', { referencedTable: 'eventos', ascending: false })
        .limit(1, { referencedTable: 'eventos' });
      const ids = (tanques || []).map((x) => x.id);
      const { data: tareas } = ids.length ? await supabase.from('tareas').select('*').in('tanque_id', ids) : { data: [] };
      setDatos({ tanques: tanques || [], tareas: tareas || [] });
    })();
  }, [usuario]);

  const todas = useMemo(() => {
    if (!datos) return [];
    return datos.tanques
      .flatMap((tq) => tareasDelTanque(tq, datos.tareas, tq.eventos?.[0]?.fecha || null).map((x) => ({ ...x, nombreTanque: tq.nombre })))
      .sort((a, b) => a.dias - b.dias);
  }, [datos]);

  if (!usuario || !datos || datos.tanques.length === 0) return null;

  const pendientes = todas.filter((x) => x.dias <= 0);
  const proxima = todas.find((x) => x.dias > 0);

  function alHacer({ tarea }) {
    setDatos((d) => {
      if (tarea.virtual) {
        // Cambio de agua: su "última vez" vive en los eventos del tanque
        return { ...d, tanques: d.tanques.map((tq) => (tq.id === tarea.tanque_id ? { ...tq, eventos: [{ fecha: tarea.ultima_vez, tipo: 'cambio_agua' }] } : tq)) };
      }
      return { ...d, tareas: d.tareas.map((x) => (x.id === tarea.id ? tarea : x)) };
    });
  }

  return (
    <section className={`cristal panel-hoy ${pendientes.length ? 'con-pendientes' : ''}`} aria-labelledby="hoy-titulo">
      <div className="panel-hoy-cabecera">
        <CalendarCheck size={18} aria-hidden="true" />
        <h2 className="titulo-s" id="hoy-titulo">{t('hoy.titulo')}</h2>
        {pendientes.length > 0 && <span className="panel-hoy-cuenta">{t('hoy.pendientes', { n: pendientes.length })}</span>}
      </div>
      {todas.length === 0 && <p className="pequeno texto-2">{t('hoy.sinTareas')}</p>}
      {pendientes.length > 0 && (
        <ul className="lista-tareas">
          {pendientes.slice(0, 6).map((tarea) => <FilaTarea key={tarea.id} tarea={tarea} tanque={tarea.nombreTanque} onHecha={alHacer} />)}
        </ul>
      )}
      {pendientes.length === 0 && proxima && (
        <p className="pequeno texto-2">
          {t('hoy.alDia')} {t('hoy.proxima')} <strong>{nombreTarea(proxima, t)}</strong> ({proxima.nombreTanque}) · {cuandoToca(proxima.dias, t)}
        </p>
      )}
    </section>
  );
}
