"use client";

import { Suspense, useEffect, useState } from 'react';
import Link, { useNavegar } from '@/components/Enlace';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { CATEGORIAS_ANUNCIO, MODALIDADES } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import ErrorCarga from '@/components/ErrorCarga';
import SelectorUbicacion from '@/components/SelectorUbicacion';
import { Cargando, Vacio } from '@/components/ui';
import { useGuardados } from '@/lib/guardados';
import { usePaisInicial, usePuntoUsuario } from '@/lib/ubicacion';
import { ordenarPorDistancia } from '@/lib/geo';
import OrdenCercania from '@/components/OrdenCercania';
import { nombrePais } from '@/lib/paises';
import AnuncioCard, { SELECT_ANUNCIO } from '@/components/mercado/AnuncioCard';
import Publicidad from '@/components/Publicidad';
import Selector from '@/components/Selector';

const POR_PAGINA = 24;

function Mercado() {
  const params = useSearchParams();
  const router = useNavegar();
  const { usuario } = useSesion();
  const { t, locale } = useT();
  const { guardados } = useGuardados();
  const [filtros, setFiltros] = useState({
    categoria: params.get('cat') || '',
    pais: params.get('pais') || '',
    provincia: params.get('prov') || '',
    modalidad: params.get('mod') || '',
    q: params.get('q') || '',
    mios: params.get('mios') === '1',
    guardados: params.get('guardados') === '1',
  });
  const [anuncios, setAnuncios] = useState(null);
  // País del usuario como filtro inicial, si hay anuncios allí (y la URL no trae otros filtros)
  const inicial = usePaisInicial('mercado',
    (pais) => supabase.from('anuncios').select('id', { count: 'exact', head: true }).eq('pais', pais).neq('estado', 'vendido').then(({ count }) => count || 0),
    !!(params.get('pais') || params.get('mios') || params.get('guardados')));
  const [paisAuto, setPaisAuto] = useState(null);
  // Orden "Más cerca": con un punto de referencia, se traen hasta 200 resultados y se ordenan por distancia
  const [cerca, setCerca] = useState(params.get('orden') === 'cerca');
  const ubicacionUsuario = usePuntoUsuario();
  const punto = cerca ? ubicacionUsuario.punto : null;
  useEffect(() => {
    if (!inicial.pais) return;
     
    setPaisAuto(inicial.pais);
    setFiltros((f) => ({ ...f, pais: inicial.pais }));
  }, [inicial.pais]);
  const [fallo, setFallo] = useState(false);
  const [hayMas, setHayMas] = useState(false);

  async function cargar(desde = 0) {
    let q = supabase.from('anuncios').select(SELECT_ANUNCIO);
    if (filtros.mios && usuario) q = q.eq('usuario_id', usuario.id);
    if (filtros.guardados && usuario) q = q.in('id', guardados ? [...guardados] : []);
    else q = q.neq('estado', 'vendido');
    if (filtros.categoria) q = q.eq('categoria', filtros.categoria);
    if (filtros.pais) q = q.eq('pais', filtros.pais);
    if (filtros.provincia.trim()) q = filtros.pais === 'ES' ? q.eq('provincia', filtros.provincia) : q.ilike('provincia', `%${filtros.provincia.trim().replace(/[%*]/g, '')}%`);
    if (filtros.modalidad) q = q.eq('modalidad', filtros.modalidad);
    if (filtros.q.trim()) q = q.ilike('titulo', `%${filtros.q.trim().replace(/[%*]/g, '')}%`);
    const { data, error } = await q.order('destacado_ahora', { ascending: false }).order('creado_en', { ascending: false }).range(desde, punto ? 199 : desde + POR_PAGINA - 1);
    setFallo(!!error);
    if (error) { if (!desde) setAnuncios([]); setHayMas(false); return; }
    if (punto) { setAnuncios(ordenarPorDistancia(data || [], punto)); setHayMas(false); return; }
    setAnuncios((a) => (desde ? [...a, ...(data || [])] : data || []));
    setHayMas((data || []).length === POR_PAGINA);
  }

  useEffect(() => {
    if (!inicial.decidido) return undefined;
    const temporizador = setTimeout(() => {
      setAnuncios(null);
      cargar(0);
      const p = new URLSearchParams();
      if (filtros.categoria) p.set('cat', filtros.categoria);
      // El país puesto automáticamente no va a la URL: al recargar se vuelve a decidir
      if (filtros.pais && filtros.pais !== paisAuto) p.set('pais', filtros.pais);
      if (filtros.provincia) p.set('prov', filtros.provincia);
      if (filtros.modalidad) p.set('mod', filtros.modalidad);
      if (filtros.q) p.set('q', filtros.q);
      if (filtros.mios) p.set('mios', '1');
      if (filtros.guardados) p.set('guardados', '1');
      if (cerca) p.set('orden', 'cerca');
      router.replace(`/mercado/${p.size ? `?${p}` : ''}`, { scroll: false });
    }, 250);
    return () => clearTimeout(temporizador);
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, usuario, filtros.guardados ? guardados : null, inicial.decidido, cerca, punto]);

  const poner = (campo, valor) => setFiltros({ ...filtros, [campo]: valor });

  return (
    <div className="contenido ancho">
      <div className="columna" style={{ gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, paddingTop: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 className="titulo-l">{t('mercado.titulo')}</h1>
            <p className="texto-2">{t('mercado.subtitulo')}</p>
          </div>
          <Link href={usuario ? '/mercado/nuevo/' : '/acceder/'} className="btn btn-primario"><Plus size={18} /> {t('mercado.publicar')}</Link>
        </header>

        <div className="filtros-mercado cristal">
          <label className="buscador-mini">
            <Search size={16} className="texto-3" />
            <input value={filtros.q} onChange={(e) => poner('q', e.target.value)} placeholder={t('mercado.buscar')} aria-label={t('mercado.buscar')} />
          </label>
          <SelectorUbicacion modo="filtro" pais={filtros.pais} region={filtros.provincia} onCambio={({ pais, region }) => setFiltros({ ...filtros, pais, provincia: region })} />
          <Selector className="entrada" value={filtros.modalidad} onChange={(e) => poner('modalidad', e.target.value)} aria-label={t('mercado.modalidad')}>
            <option value="">{t('mercado.todasModalidades')}</option>
            {MODALIDADES.map((k) => <option key={k} value={k}>{t(`mercado.modalidades.${k}`)}</option>)}
          </Selector>
          {usuario && (
            <label className="casilla" style={{ alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <input type="checkbox" checked={filtros.mios} onChange={(e) => poner('mios', e.target.checked)} /> {t('mercado.misAnuncios')}
            </label>
          )}
          {usuario && (
            <label className="casilla" style={{ alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <input type="checkbox" checked={filtros.guardados} onChange={(e) => poner('guardados', e.target.checked)} /> {t('guardados.filtro')}
            </label>
          )}
        </div>

        {paisAuto && filtros.pais === paisAuto && (
          <p className="aviso-cercania mini">
            <MapPin size={14} aria-hidden="true" /> {t('cercania.anuncios', { pais: nombrePais(paisAuto, locale) })}
            <button type="button" className="enlace" onClick={() => { inicial.verTodos(); setPaisAuto(null); poner('pais', ''); }}>{t('cercania.verTodos')}</button>
          </p>
        )}
        <OrdenCercania activo={cerca} onCambio={setCerca} ubicacion={ubicacionUsuario} aproximadas conUsuario={!!usuario} />
        <div className="chips-desliza" role="group" aria-label={t('mercado.categoria')}>
          <button className="chip" aria-pressed={!filtros.categoria} onClick={() => poner('categoria', '')}>{t('mercado.todo')}</button>
          {CATEGORIAS_ANUNCIO.map((k) => (
            <button key={k} className="chip" aria-pressed={filtros.categoria === k} onClick={() => poner('categoria', filtros.categoria === k ? '' : k)}>{t(`mercado.categorias.${k}`)}</button>
          ))}
        </div>

        <Publicidad ubicacion="mercado" />

        {anuncios === null ? (
          <div className="rejilla-anuncios"><Cargando alto={260} n={8} /></div>
        ) : anuncios.length === 0 && fallo ? (
          <ErrorCarga onReintentar={() => { setAnuncios(null); cargar(0); }} />
        ) : anuncios.length === 0 && filtros.guardados ? (
          <Vacio titulo={t('guardados.vacio')}>{t('guardados.vacioTexto')}</Vacio>
        ) : anuncios.length === 0 ? (
          <Vacio titulo={t('mercado.vacioTitulo')} accion={usuario && <Link href="/mercado/nuevo/" className="btn">{t('mercado.publicarPrimero')}</Link>}>
            {t('mercado.vacioTexto')}
          </Vacio>
        ) : (
          <div className="rejilla-anuncios">{anuncios.map((a) => <AnuncioCard key={a.id} anuncio={a} />)}</div>
        )}
        {hayMas && <button className="btn" style={{ alignSelf: 'center' }} onClick={() => cargar(anuncios.length)}>{t('comun.cargarMas')}</button>}
      </div>
    </div>
  );
}

// Mientras se leen los filtros de la URL se muestra la cabecera: va en el HTML estático (SEO)
function CabeceraProvisional() {
  const { t } = useT();
  return (
    <div className="contenido ancho">
      <div className="columna" style={{ gap: 16 }}>
        <header style={{ paddingTop: 12 }}>
          <h1 className="titulo-l">{t('mercado.titulo')}</h1>
          <p className="texto-2">{t('mercado.subtitulo')}</p>
        </header>
        <Cargando n={4} />
      </div>
    </div>
  );
}

export default function MercadoPage() {
  return <Suspense fallback={<CabeceraProvisional />}><Mercado /></Suspense>;
}
