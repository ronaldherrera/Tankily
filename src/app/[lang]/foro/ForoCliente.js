"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { FORO_CATEGORIAS } from '@/lib/constantes';
import { Vacio } from '@/components/ui';
import FilaHilo, { FilasHiloCargando, SELECT_HILO } from '@/components/foro/FilaHilo';
import Lateral from '@/components/Lateral';
import { useT } from '@/i18n/IdiomaProvider';

const GRUPOS = FORO_CATEGORIAS.reduce((g, c) => ({ ...g, [c.grupo]: [...(g[c.grupo] || []), c] }), {});

// Lo último cargado se conserva entre visitas: al volver al foro se ve al instante y se refresca debajo
let cache = null;

export default function ForoPage() {
  const { usuario } = useSesion();
  const [datos, setDatos] = useState(cache);
  const { t } = useT();

  useEffect(() => {
    Promise.all([
      supabase.from('foro_hilos').select(SELECT_HILO).order('ultima_actividad', { ascending: false }).limit(15),
      supabase.from('foro_hilos').select(SELECT_HILO).eq('num_respuestas', 0).eq('cerrado', false).order('creado_en', { ascending: false }).limit(5),
    ]).then(([recientes, sinResponder]) => {
      cache = { recientes: recientes.data || [], sinResponder: sinResponder.data || [] };
      setDatos(cache);
    });
  }, []);

  return (
    <div className="contenido">
      <div className="columna" style={{ gap: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, paddingTop: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 className="titulo-l">{t('foro.titulo')}</h1>
            <p className="texto-2">{t('foro.subtitulo')}</p>
          </div>
          <Link href={usuario ? '/foro/nuevo/' : '/acceder/'} className="btn btn-primario"><Plus size={18} /> {t('foro.abrirHilo')}</Link>
        </header>

        {datos?.sinResponder.length > 0 && (
          <section className="cristal" style={{ padding: '14px 16px' }}>
            <h2 className="titulo-s">{t('foro.esperanRespuesta')}</h2>
            <ul className="lista-hilos">{datos.sinResponder.map((h) => <FilaHilo key={h.id} hilo={h} conCategoria />)}</ul>
          </section>
        )}

        {Object.entries(GRUPOS).map(([grupo, cats]) => (
          <section key={grupo}>
            <h2 className="titulo-s texto-2" style={{ marginBottom: 10 }}>{t(`foro.grupos.${grupo}`)}</h2>
            <div className="rejilla-categorias">
              {cats.map((c) => (
                <Link key={c.slug} href={`/foro/${c.slug}/`} className="categoria-foro cristal-suave">
                  <strong>{t(`foro.categorias.${c.slug}.nombre`)}</strong>
                  <span className="pequeno texto-3">{t(`foro.categorias.${c.slug}.descripcion`)}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="titulo-s texto-2" style={{ marginBottom: 10 }}>{t('foro.actividad')}</h2>
          {datos && datos.recientes.length === 0 ? (
            <div className="cristal-suave">
              <Vacio titulo={t('foro.vacioTitulo')} accion={usuario && <Link href="/foro/nuevo/?c=presentaciones" className="btn">{t('foro.presentate')}</Link>}>
                {t('foro.vacioTexto')}
              </Vacio>
            </div>
          ) : (
            <ul className="lista-hilos cristal-suave" style={{ padding: '4px 16px' }} aria-busy={!datos}>
              {datos ? datos.recientes.map((h) => <FilaHilo key={h.id} hilo={h} conCategoria />) : <FilasHiloCargando />}
            </ul>
          )}
        </section>
      </div>
      <Lateral ubicacionPubli="foro" />
    </div>
  );
}
