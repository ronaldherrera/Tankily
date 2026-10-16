"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import FilaHilo, { SELECT_HILO } from './FilaHilo';

// Al terminar de leer un hilo: otros de la misma categoría, primero los resueltos
// (suelen ser los más útiles) y luego los de actividad más reciente.
export default function HilosRelacionados({ hilo }) {
  const { t } = useT();
  const [lista, setLista] = useState(null);

  useEffect(() => {
    supabase.from('foro_hilos').select(SELECT_HILO)
      .eq('categoria', hilo.categoria).neq('id', hilo.id)
      .order('solucion_id', { ascending: false, nullsFirst: false })
      .order('ultima_actividad', { ascending: false })
      .limit(5)
      .then(({ data }) => setLista(data || []));
  }, [hilo.id, hilo.categoria]);

  if (!lista?.length) return null;
  const categoria = t(`foro.categorias.${hilo.categoria}.nombre`);
  return (
    <section className="cristal-suave relacionados" aria-labelledby="relacionados-titulo">
      <h2 className="titulo-s" id="relacionados-titulo">{t('relacionados.titulo', { categoria })}</h2>
      <div>{lista.map((h) => <FilaHilo key={h.id} hilo={h} />)}</div>
      <Link href={`/foro/${hilo.categoria}/`} className="enlace pequeno">{t('relacionados.verCategoria')}</Link>
    </section>
  );
}
