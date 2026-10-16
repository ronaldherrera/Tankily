"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import { palabrasClave } from '@/lib/palabrasClave';
import FilaHilo, { SELECT_HILO } from './FilaHilo';

// Al escribir el título de un hilo nuevo: hilos que ya existen con esas palabras, por si la
// pregunta ya tiene respuesta. Espera a que se deje de teclear y prioriza los más parecidos.
export default function HilosParecidos({ titulo }) {
  const { t } = useT();
  const [hilos, setHilos] = useState([]);
  const palabras = palabrasClave(titulo);
  const clave = palabras.join(' ');

  useEffect(() => {
    if (!clave) return undefined;
    const palabras = clave.split(' ');
    let vigente = true;
    const espera = setTimeout(async () => {
      const { data } = await supabase.from('foro_hilos').select(SELECT_HILO)
        .or(palabras.map((p) => `titulo.ilike.%${p}%`).join(','))
        .order('num_respuestas', { ascending: false })
        .limit(20);
      if (!vigente) return;
      // Más palabras en común primero y, a igualdad, los resueltos
      const puntuados = (data || [])
        .map((h) => ({ h, n: palabras.filter((p) => h.titulo.toLowerCase().includes(p)).length }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n || Number(!!b.h.solucion_id) - Number(!!a.h.solucion_id));
      setHilos(puntuados.slice(0, 3).map((x) => x.h));
    }, 450);
    return () => { vigente = false; clearTimeout(espera); };
  }, [clave]);

  if (!clave || !hilos.length) return null;
  return (
    <section className="hilos-parecidos" aria-live="polite">
      <p className="pequeno texto-2">{t('relacionados.parecidos')}</p>
      <ul className="lista-hilos cristal-suave" style={{ padding: '2px 14px' }}>
        {hilos.map((h) => <FilaHilo key={h.id} hilo={h} conCategoria nuevaPestana />)}
      </ul>
    </section>
  );
}
