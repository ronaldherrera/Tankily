"use client";

import { Suspense, useEffect, useState } from 'react';
import Link, { useNavegar } from '@/components/Enlace';
import { useSearchParams } from 'next/navigation';
import { Search, BookOpen, MessagesSquare, Tag, Store, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { especiesWiki } from '@/lib/especiesWiki';
import { formatPrecio } from '@/lib/formatRelativeTime';
import { Avatar, Vacio, Cargando } from '@/components/ui';
import Feed from '@/components/feed/Feed';
import TanqueCard from '@/components/tanques/TanqueCard';
import Lateral, { Tendencias } from '@/components/Lateral';
import { useT } from '@/i18n/IdiomaProvider';
import { HERRAMIENTAS } from '@/lib/herramientas';
import { enlaceHilo, enlaceAnuncio } from '@/lib/enlaces';

const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Evita que comas o paréntesis rompan el filtro or() de PostgREST
const limpiar = (s) => s.replace(/[,()%*\\]/g, ' ').trim();

function Resultados({ q }) {
  const [r, setR] = useState(null);
  const { t, lang } = useT();
  const traducirLocal = t;

  useEffect(() => {
    const t = limpiar(q);
    if (t.length < 2) { setR(null); return; }
    setR(undefined);
    const patron = `%${t}%`;
    Promise.all([
      supabase.from('perfiles').select('id, usuario, nombre, avatar_url, bio').or(`usuario.ilike.${patron},nombre.ilike.${patron}`).limit(8),
      supabase.from('tanques').select('id, nombre, tipo, litros, foto_url, visibilidad, idioma, creado_en, autor:perfiles!usuario_id(usuario, nombre, avatar_url)').ilike('nombre', patron).limit(8),
      supabase.from('foro_hilos').select('id, titulo, num_respuestas, categoria, idioma, creado_en').or(`titulo.ilike.${patron},contenido.ilike.${patron}`).order('ultima_actividad', { ascending: false }).limit(8),
      supabase.from('anuncios').select('id, titulo, precio, moneda, modalidad, provincia, imagenes, estado, idioma, creado_en').eq('estado', 'activo').ilike('titulo', patron).limit(8),
      supabase.from('tiendas').select('id, slug, nombre, ciudad, provincia, logo_url').or(`nombre.ilike.${patron},ciudad.ilike.${patron}`).limit(6),
    ]).then(([perfiles, tanques, hilos, anuncios, tiendas]) => {
      const nq = normalizar(t);
      setR({
        perfiles: perfiles.data || [], tanques: tanques.data || [], hilos: hilos.data || [],
        anuncios: anuncios.data || [], tiendas: tiendas.data || [],
        // Especies por nombre científico o común ("payaso" encuentra Amphiprion ocellaris)
        especies: especiesWiki.filter((e) => normalizar(e.nombre).includes(nq) || (e.comun && normalizar(e.comun).includes(nq))).slice(0, 6),
        herramientas: HERRAMIENTAS.filter(({ clave }) => [traducirLocal(`herr.${clave}.titulo`), traducirLocal(`herr.${clave}.desc`), clave]
          .some((x) => normalizar(x).includes(nq))),
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  if (r === null) return null;
  if (r === undefined) return <Cargando alto={80} n={3} />;
  const total = Object.values(r).reduce((s, l) => s + l.length, 0);
  if (!total) return <Vacio titulo={t('explorar.sinResultados', { q })}>{t('explorar.sinResultadosTexto')}</Vacio>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {r.especies.length > 0 && (
        <section className="cristal-suave" style={{ padding: 14 }}>
          <h2 className="titulo-s" style={{ marginBottom: 6 }}>{t('explorar.enWiki')}</h2>
          <ul className="lista-filas">
            {r.especies.map((e) => (
              <li key={e.nombre}>
                <img loading="lazy" src={encodeURI(e.imagen)} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                <Link href={`/wiki/explorer/${e.ruta}/`} style={{ flex: 1 }}>{e.comun && e.comun !== e.nombre && <>{e.comun} </>}<em className={e.comun && e.comun !== e.nombre ? 'texto-3 pequeno' : ''}>{e.nombre}</em></Link>
                <BookOpen size={16} className="texto-3" />
              </li>
            ))}
          </ul>
        </section>
      )}
      {r.herramientas.length > 0 && (
        <section className="cristal-suave" style={{ padding: 14 }}>
          <h2 className="titulo-s" style={{ marginBottom: 6 }}>{t('herr.corto')}</h2>
          <ul className="lista-filas">
            {r.herramientas.map(({ clave }) => (
              <li key={clave}><Calculator size={16} className="texto-3" /><Link href={`/herramientas/${clave}/`} style={{ flex: 1 }}>{t(`herr.${clave}.titulo`)}</Link></li>
            ))}
          </ul>
        </section>
      )}
      {r.perfiles.length > 0 && (
        <section className="cristal-suave" style={{ padding: 14 }}>
          <h2 className="titulo-s" style={{ marginBottom: 6 }}>{t('explorar.acuaristas')}</h2>
          <ul className="lista-filas">
            {r.perfiles.map((p) => (
              <li key={p.id}>
                <Avatar perfil={p} tamano={36} />
                <Link href={`/u/?n=${p.usuario}`} style={{ flex: 1, minWidth: 0 }}>
                  <strong>{p.nombre || p.usuario}</strong> <span className="texto-3 pequeno">@{p.usuario}</span>
                  {p.bio && <span className="mini texto-3" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.bio}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {r.tanques.length > 0 && (
        <section>
          <h2 className="titulo-s" style={{ marginBottom: 10 }}>{t('explorar.tanques')}</h2>
          <div className="rejilla-tarjetas">{r.tanques.map((tq) => <TanqueCard key={tq.id} tanque={tq} />)}</div>
        </section>
      )}
      {r.hilos.length > 0 && (
        <section className="cristal-suave" style={{ padding: 14 }}>
          <h2 className="titulo-s" style={{ marginBottom: 6 }}>{t('explorar.enForo')}</h2>
          <ul className="lista-filas">
            {r.hilos.map((h) => (
              <li key={h.id}><MessagesSquare size={16} className="texto-3" /><Link href={enlaceHilo(h, lang)} style={{ flex: 1 }}>{h.titulo}</Link><span className="mini texto-3">{t('explorar.respuestasCorto', { n: h.num_respuestas })}</span></li>
            ))}
          </ul>
        </section>
      )}
      {r.anuncios.length > 0 && (
        <section className="cristal-suave" style={{ padding: 14 }}>
          <h2 className="titulo-s" style={{ marginBottom: 6 }}>{t('explorar.enMercado')}</h2>
          <ul className="lista-filas">
            {r.anuncios.map((a) => (
              <li key={a.id}><Tag size={16} className="texto-3" /><Link href={enlaceAnuncio(a, lang)} style={{ flex: 1 }}>{a.titulo}</Link><span className="cifra">{formatPrecio(a.precio, a.modalidad, a.moneda)}</span></li>
            ))}
          </ul>
        </section>
      )}
      {r.tiendas.length > 0 && (
        <section className="cristal-suave" style={{ padding: 14 }}>
          <h2 className="titulo-s" style={{ marginBottom: 6 }}>{t('explorar.tiendas')}</h2>
          <ul className="lista-filas">
            {r.tiendas.map((ti) => (
              <li key={ti.id}><Store size={16} className="texto-3" /><Link href={`/tiendas/tienda/?s=${ti.slug}`} style={{ flex: 1 }}>{ti.nombre}</Link><span className="mini texto-3">{ti.ciudad || ti.provincia}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Explorar() {
  const params = useSearchParams();
  const router = useNavegar();
  const etiqueta = params.get('tag');
  const { t } = useT();
  const [q, setQ] = useState(params.get('q') || '');
  const [busqueda, setBusqueda] = useState(params.get('q') || '');

  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(q);
      if (q) router.replace(`/explorar/?q=${encodeURIComponent(q)}`, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [q, router]);

  return (
    <div className="contenido">
      <div className="columna">
        {etiqueta ? (
          <>
            <div style={{ paddingTop: 12 }}>
              <h1 className="titulo-l">#{etiqueta}</h1>
              <Link href="/explorar/" className="enlace pequeno">{t('explorar.volver')}</Link>
            </div>
            <Feed etiqueta={etiqueta} vacio={<Vacio titulo={t('explorar.sinUsos', { etiqueta })} />} />
          </>
        ) : (
          <>
            <label className="buscador cristal">
              <Search size={20} className="texto-3" />
              <span className="sr-only">{t('explorar.buscar')}</span>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('explorar.placeholder')} />
            </label>
            {busqueda.trim().length >= 2 ? <Resultados q={busqueda.trim()} /> : (
              <div className="solo-movil"><Tendencias /></div>
            )}
          </>
        )}
      </div>
      <Lateral><Tendencias /></Lateral>
    </div>
  );
}

// Mientras se lee la búsqueda de la URL, la caja ya ocupa su sitio (sin página en blanco)
const Provisional = () => <div className="contenido"><div className="columna"><div className="buscador cristal" aria-hidden="true" /></div></div>;

export default function ExplorarPage() {
  return <Suspense fallback={<Provisional />}><Explorar /></Suspense>;
}
