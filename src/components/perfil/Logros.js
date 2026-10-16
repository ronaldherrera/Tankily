"use client";

import { useEffect, useState } from 'react';
import { Fish, Layers, FlaskConical, Droplets, Sprout, MessageCircle, Users, LifeBuoy, Award, Handshake, Star, Medal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import { Cargando } from '@/components/ui';

// Doce logros calculados con datos públicos (se ven también en el perfil de otros).
// [clave, icono, estadística, meta]
export const LOGROS = [
  ['primer_tanque', Fish, 'tanques', 1],
  ['coleccionista', Layers, 'tanques', 3],
  ['quimico', FlaskConical, 'mediciones', 50],
  ['constante', Droplets, 'cambios', 10],
  ['biodiverso', Sprout, 'especies', 10],
  ['voz', MessageCircle, 'publicaciones', 10],
  ['popular', Users, 'seguidores', 10],
  ['ayudante', LifeBuoy, 'respuestas', 10],
  ['sabio', Award, 'soluciones', 3],
  ['trato', Handshake, 'vendidos', 1],
  ['critico', Star, 'resenas', 3],
  ['veterano', Medal, 'dias', 365],
];

const contar = (q) => q.then(({ count }) => count || 0);
const cabeza = { count: 'exact', head: true };

async function estadisticas(perfil, tanquesVisibles) {
  const ids = tanquesVisibles.map((x) => x.id);
  const [mediciones, cambios, especies, publicaciones, seguidores, respuestas, vendidos, resenas] = await Promise.all([
    ids.length ? contar(supabase.from('mediciones').select('id', cabeza).in('tanque_id', ids)) : 0,
    ids.length ? contar(supabase.from('tanque_eventos').select('id', cabeza).in('tanque_id', ids).eq('tipo', 'cambio_agua')) : 0,
    ids.length ? supabase.from('habitantes').select('nombre_cientifico, nombre').in('tanque_id', ids)
      .then(({ data }) => new Set((data || []).map((h) => (h.nombre_cientifico || h.nombre).toLowerCase())).size) : 0,
    contar(supabase.from('publicaciones').select('id', cabeza).eq('usuario_id', perfil.id)),
    contar(supabase.from('seguidores').select('seguido_id', cabeza).eq('seguido_id', perfil.id)),
    supabase.from('foro_respuestas').select('id').eq('usuario_id', perfil.id).then(({ data }) => data || []),
    contar(supabase.from('anuncios').select('id', cabeza).eq('usuario_id', perfil.id).eq('estado', 'vendido')),
    contar(supabase.from('tienda_resenas').select('tienda_id', cabeza).eq('usuario_id', perfil.id)),
  ]);
  const idsRespuestas = respuestas.map((r) => r.id);
  const soluciones = idsRespuestas.length
    ? await contar(supabase.from('foro_hilos').select('id', cabeza).in('solucion_id', idsRespuestas))
    : 0;
  const dias = Math.floor((Date.now() - new Date(perfil.creado_en).getTime()) / 86400000);
  return { tanques: ids.length, mediciones, cambios, especies, publicaciones, seguidores, respuestas: idsRespuestas.length, soluciones, vendidos, resenas, dias };
}

// Hook: estadísticas y número de logros conseguidos
export function useLogros(perfil, tanques) {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    if (!perfil || !tanques) return;
    let vivo = true;
    estadisticas(perfil, tanques).then((d) => vivo && setDatos(d));
    return () => { vivo = false; };
  }, [perfil, tanques]);
  const conseguidos = datos ? LOGROS.filter(([, , est, meta]) => datos[est] >= meta).length : null;
  return { datos, conseguidos };
}

export default function Logros({ datos }) {
  const { t } = useT();
  if (!datos) return <Cargando alto={110} n={2} />;
  const conseguidos = LOGROS.filter(([, , est, meta]) => datos[est] >= meta).length;
  // Los conseguidos primero; luego los más cercanos a conseguirse
  const orden = [...LOGROS].sort((a, b) => {
    const pa = Math.min(datos[a[2]] / a[3], 1), pb = Math.min(datos[b[2]] / b[3], 1);
    return pb - pa;
  });
  return (
    <section className="logros" aria-label={t('logros.pestana')}>
      <p className="pequeno texto-2">{t('logros.resumen', { n: conseguidos, total: LOGROS.length })}</p>
      <ul className="rejilla-logros">
        {orden.map(([clave, Icono, est, meta]) => {
          const actual = Math.min(datos[est], meta);
          const hecho = datos[est] >= meta;
          return (
            <li key={clave} className={`logro${hecho ? ' conseguido' : ''}`}>
              <span className="logro-icono"><Icono size={22} aria-hidden="true" /></span>
              <strong>{t(`logros.${clave}.nombre`)}</strong>
              <span className="mini texto-3">{t(`logros.${clave}.desc`)}</span>
              {!hecho && (
                <>
                  <span className="logro-barra" aria-hidden="true"><span style={{ width: `${(actual / meta) * 100}%` }} /></span>
                  <span className="mini texto-3 cifra">{t('logros.progreso', { actual, meta })}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
