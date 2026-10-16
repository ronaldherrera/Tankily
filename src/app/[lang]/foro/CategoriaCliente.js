"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { Vacio, Pestanas } from '@/components/ui';
import { categoriaForo } from '@/lib/constantes';
import FilaHilo, { FilasHiloCargando, SELECT_HILO } from '@/components/foro/FilaHilo';
import Lateral from '@/components/Lateral';
import ErrorCarga from '@/components/ErrorCarga';
import { useT } from '@/i18n/IdiomaProvider';

const POR_PAGINA = 30;
// Última lista vista por categoría y filtro: al volver se muestra al instante
const cache = new Map();

// Lista de hilos de una categoría del foro. La página (/foro/<categoría>/) es estática y le pasa el slug.
export default function CategoriaCliente({ slug }) {
  const { usuario } = useSesion();
  const cat = categoriaForo(slug);
  const { t } = useT();
  const nombreCat = cat ? t(`foro.categorias.${cat.slug}.nombre`) : t('foro.categoria.noEncontrada');
  const [filtro, setFiltro] = useState('recientes');
  const [hilos, setHilos] = useState(() => cache.get(`${slug}:recientes`) || null);
  const [hayMas, setHayMas] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function cargar(desde = 0) {
    let q = supabase.from('foro_hilos').select(SELECT_HILO).eq('categoria', slug);
    if (filtro === 'sin_respuesta') q = q.eq('num_respuestas', 0);
    if (filtro === 'resueltos') q = q.not('solucion_id', 'is', null);
    const { data, error } = await q.order('fijado', { ascending: false }).order('ultima_actividad', { ascending: false }).range(desde, desde + POR_PAGINA - 1);
    setFallo(!!error);
    if (error) { if (!desde) setHilos((h) => h || []); setHayMas(false); return; }
    setHilos((h) => {
      const lista = desde ? [...h, ...(data || [])] : data || [];
      if (!desde) cache.set(`${slug}:${filtro}`, lista);
      return lista;
    });
    setHayMas((data || []).length === POR_PAGINA);
  }

  useEffect(() => {
    if (!slug) return;
    setHilos(cache.get(`${slug}:${filtro}`) || null);
    cargar(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, filtro]);

  return (
    <div className="contenido">
      <div className="columna" style={{ gap: 16 }}>
        <Link href="/foro/" className="enlace pequeno" style={{ display: 'inline-flex', gap: 4, alignItems: 'center', paddingTop: 12 }}><ArrowLeft size={14} /> {t('foro.titulo')}</Link>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <h1 className="titulo-l">{nombreCat}</h1>
            {cat && <p className="texto-2">{t(`foro.categorias.${cat.slug}.descripcion`)}</p>}
          </div>
          <Link href={usuario ? `/foro/nuevo/?c=${slug}` : '/acceder/'} className="btn btn-primario"><Plus size={18} /> {t('foro.abrirHilo')}</Link>
        </header>
        <Pestanas etiqueta={t('foro.categoria.filtro')} valor={filtro} onCambio={setFiltro} opciones={[['recientes', t('foro.categoria.recientes')], ['sin_respuesta', t('foro.categoria.sinRespuesta')], ['resueltos', t('foro.categoria.resueltos')]]} />
        {hilos === null ? (
          <ul className="lista-hilos cristal-suave" style={{ padding: '4px 16px' }} aria-busy="true"><FilasHiloCargando n={6} /></ul>
        ) : hilos.length === 0 && fallo ? (
          <ErrorCarga onReintentar={() => { setHilos(null); cargar(0); }} />
        ) : hilos.length === 0 ? (
          <Vacio titulo={t('foro.categoria.vacio')} accion={usuario && <Link href={`/foro/nuevo/?c=${slug}`} className="btn">{t('foro.categoria.abrirPrimero')}</Link>} />
        ) : (
          <ul className="lista-hilos cristal-suave" style={{ padding: '4px 16px' }}>{hilos.map((h) => <FilaHilo key={h.id} hilo={h} />)}</ul>
        )}
        {hayMas && <button className="btn" style={{ alignSelf: 'center' }} onClick={() => cargar(hilos.length)}>{t('comun.cargarMas')}</button>}
      </div>
      <Lateral ubicacionPubli="foro" />
    </div>
  );
}
