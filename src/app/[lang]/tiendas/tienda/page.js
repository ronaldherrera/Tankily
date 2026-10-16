"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, MapPin, Phone, Globe2, Mail, Clock, Star, Pencil, Flag, Share } from 'lucide-react';
import { supabase, AUTOR } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { registrarVista, registrarClic } from '@/lib/estadisticasTienda';
import { useT } from '@/i18n/IdiomaProvider';
import { nombrePais, unirLugar } from '@/lib/paises';
import { formatRelativeTime, formatNumero } from '@/lib/formatRelativeTime';
import { Avatar, NombreAutor, Vacio, Cargando, Pestanas, useTostada } from '@/components/ui';
import AnuncioCard, { SELECT_ANUNCIO } from '@/components/mercado/AnuncioCard';
import Reportar from '@/components/Reportar';
import InvitacionRegistro from '@/components/InvitacionRegistro';

function Estrellas({ valor, onCambio }) {
  const { t } = useT();
  return (
    <span style={{ display: 'inline-flex', gap: 2 }} role={onCambio ? 'radiogroup' : undefined} aria-label={onCambio ? t('tiendas.ficha.puntuacion') : t('tiendas.ficha.deCinco', { n: valor })}>
      {[1, 2, 3, 4, 5].map((n) => (
        onCambio ? (
          <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={t('tiendas.ficha.estrellas', { n })} onClick={() => onCambio(n)} style={{ background: 'none', border: 0, cursor: 'pointer', color: n <= valor ? 'var(--aviso)' : 'var(--texto-3)', padding: 2 }}>
            <Star size={22} fill={n <= valor ? 'currentColor' : 'none'} />
          </button>
        ) : (
          <Star key={n} size={14} fill={n <= Math.round(valor) ? 'currentColor' : 'none'} style={{ color: n <= Math.round(valor) ? 'var(--aviso)' : 'var(--texto-3)' }} />
        )
      ))}
    </span>
  );
}

function Tienda() {
  const slug = useSearchParams().get('s');
  const { usuario } = useSesion();
  const { t, locale } = useT();
  const tostada = useTostada();
  const [tienda, setTienda] = useState(undefined);
  const [resenas, setResenas] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [pestana, setPestana] = useState('resenas');

  // Compartir la ficha (también para el dueño, que es quien más la difunde)
  async function compartir() {
    if (navigator.share) { try { await navigator.share({ url: location.href, title: tienda?.nombre }); } catch {} }
    else { await navigator.clipboard.writeText(location.href); tostada(t('comun.enlaceCopiado')); }
  }
  const [puntos, setPuntos] = useState(0);
  const [texto, setTexto] = useState('');
  const [reportando, setReportando] = useState(false);

  async function cargarResenas(id) {
    const { data } = await supabase.from('tienda_resenas').select(`*, ${AUTOR}`).eq('tienda_id', id).order('creado_en', { ascending: false });
    setResenas(data || []);
  }

  useEffect(() => {
    if (!slug) return;
    supabase.from('tiendas').select('*, propietario:perfiles!propietario_id(usuario, nombre, avatar_url)').eq('slug', slug).maybeSingle().then(({ data }) => {
      setTienda(data);
      if (!data) return;
      // Estadísticas de la tienda (no cuentan las visitas del propio dueño)
      if (data.propietario_id !== usuario?.id) registrarVista(data.id);
      document.title = `${t('tiendas.ficha.tituloSeo', { nombre: data.nombre, lugar: data.ciudad || data.provincia || nombrePais(data.pais, locale) })} · Tankily`;
      cargarResenas(data.id);
      supabase.from('anuncios').select(SELECT_ANUNCIO).eq('tienda_id', data.id).neq('estado', 'vendido').order('creado_en', { ascending: false }).limit(24)
        .then(({ data: a }) => setAnuncios(a || []));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (tienda === undefined) return <div className="contenido ancho"><Cargando alto={300} n={1} /></div>;
  if (!tienda) return <div className="contenido"><div className="columna"><Vacio titulo={t('tiendas.ficha.noExiste')} accion={<Link href="/tiendas/" className="btn">{t('tiendas.ficha.verTiendas')}</Link>} /></div></div>;

  const esMia = usuario?.id === tienda.propietario_id;
  const miResena = resenas.find((r) => r.usuario_id === usuario?.id);

  async function valorar(e) {
    e.preventDefault();
    if (!puntos) return tostada(t('tiendas.ficha.eligePuntuacion'));
    const cambios = { puntuacion: puntos, texto: texto.trim() || null };
    // Al editar solo se mandan puntuación y texto: la tienda de una reseña no se puede cambiar
    const { error } = miResena
      ? await supabase.from('tienda_resenas').update(cambios).eq('tienda_id', tienda.id).eq('usuario_id', usuario.id)
      : await supabase.from('tienda_resenas').insert({ tienda_id: tienda.id, ...cambios });
    if (error) return tostada(t('tiendas.ficha.errorResena', { error: error.message }));
    tostada(t('tiendas.ficha.gracias'));
    setPuntos(0); setTexto('');
    cargarResenas(tienda.id);
  }

  const ld = {
    '@context': 'https://schema.org', '@type': 'PetStore', name: tienda.nombre, description: tienda.descripcion || undefined,
    address: { '@type': 'PostalAddress', streetAddress: tienda.direccion || undefined, addressLocality: tienda.ciudad || undefined, addressRegion: tienda.provincia || undefined, addressCountry: tienda.pais || 'ES' },
    telephone: tienda.telefono || undefined, url: tienda.web || undefined, image: tienda.logo_url || undefined,
    aggregateRating: tienda.num_resenas ? { '@type': 'AggregateRating', ratingValue: tienda.valoracion, reviewCount: tienda.num_resenas } : undefined,
  };
  const direccionCompleta = unirLugar([tienda.direccion, tienda.ciudad, tienda.provincia, nombrePais(tienda.pais, locale)]);

  return (
    <div className="contenido ancho">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="columna" style={{ gap: 18 }}>
        <div className="perfil-portada" style={tienda.portada_url ? { backgroundImage: `url(${JSON.stringify(tienda.portada_url)})`, marginTop: 12 } : { marginTop: 12 }} />
        <div className="perfil-cabecera">
          <span className="logo-tienda grande">{tienda.logo_url ? <img src={tienda.logo_url} alt="" /> : tienda.nombre.charAt(0)}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-icono btn-s" onClick={compartir} aria-label={t('comun.compartir')}><Share size={16} /></button>
            {esMia ? (
              <Link href="/tiendas/gestionar/" className="btn btn-s"><Pencil size={14} /> {t('tiendas.ficha.editar')}</Link>
            ) : (
              <>
                <button className="btn btn-icono btn-s" onClick={() => setReportando(true)} aria-label={t('tiendas.ficha.reportar')}><Flag size={16} /></button>
                {usuario && <Link href={`/mensajes/?con=${tienda.propietario_id}`} className="btn btn-s btn-primario" onClick={() => registrarClic(tienda.id, 'contacto')}><Mail size={14} /> {t('tiendas.ficha.escribir')}</Link>}
              </>
            )}
          </div>
        </div>

        <div className="tienda-cuerpo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div>
              <h1 className="titulo-l" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {tienda.nombre} {tienda.verificada && <BadgeCheck size={24} style={{ color: 'var(--agua)' }} aria-label={t('tiendas.verificada')} />}
              </h1>
              <p className="texto-2" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {tienda.num_resenas > 0
                  ? <><Estrellas valor={Number(tienda.valoracion)} /> {formatNumero(tienda.valoracion, 1)} · {t('tiendas.ficha.resenas', { n: tienda.num_resenas })}</>
                  : t('tiendas.ficha.sinResenas')}
              </p>
            </div>
            {tienda.especialidades?.length > 0 && <div className="chips">{tienda.especialidades.map((e) => <span key={e} className="chip">{t(`tiendas.especialidades.${e}`)}</span>)}</div>}
            {tienda.descripcion && <p className="prosa texto-2">{tienda.descripcion}</p>}

            <InvitacionRegistro texto={t('invitacion.tienda')} />

            <Pestanas etiqueta={t('tiendas.ficha.pestanas')} valor={pestana} onCambio={setPestana} opciones={[['resenas', `${t('tiendas.ficha.resenasPestana')} ${tienda.num_resenas || ''}`], ['anuncios', `${t('tiendas.ficha.productos')} ${anuncios.length || ''}`]]} />

            {pestana === 'resenas' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {usuario && !esMia && (
                  <form onSubmit={valorar} className="cristal" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <strong>{miResena ? t('tiendas.ficha.actualiza') : t('tiendas.ficha.hasComprado')}</strong>
                    <Estrellas valor={puntos || miResena?.puntuacion || 0} onCambio={setPuntos} />
                    <textarea className="entrada" rows={3} maxLength={1000} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t('tiendas.ficha.resenaEj')} />
                    <button className="btn btn-primario btn-s" style={{ alignSelf: 'flex-end', position: 'relative', zIndex: 2 }}>{t('tiendas.ficha.publicarResena')}</button>
                  </form>
                )}
                {resenas.length === 0 ? <Vacio titulo={t('tiendas.ficha.sinResenas')} /> : resenas.map((r) => (
                  <div key={r.usuario_id} className="cristal-suave" style={{ padding: 14, display: 'flex', gap: 10 }}>
                    <Avatar perfil={r.autor} tamano={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><NombreAutor perfil={r.autor} conUsuario={false} /><Estrellas valor={r.puntuacion} /><span className="mini texto-3">{formatRelativeTime(r.creado_en)}</span></div>
                      {r.texto && <p className="prosa texto-2 pequeno" style={{ marginTop: 4 }}>{r.texto}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : anuncios.length === 0 ? (
              <Vacio titulo={t('tiendas.ficha.sinProductos')} />
            ) : (
              <div className="rejilla-anuncios">{anuncios.map((a) => <AnuncioCard key={a.id} anuncio={a} />)}</div>
            )}
          </div>

          <aside className="cristal" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'start' }}>
            <h2 className="titulo-s">{t('tiendas.ficha.contacto')}</h2>
            <ul className="lista-filas pequeno">
              <li><MapPin size={16} className="texto-3" /><span>{direccionCompleta}</span></li>
              {tienda.telefono && <li><Phone size={16} className="texto-3" /><a className="enlace" href={`tel:${tienda.telefono}`} onClick={() => registrarClic(tienda.id, 'contacto')}>{tienda.telefono}</a></li>}
              {tienda.web && <li><Globe2 size={16} className="texto-3" /><a className="enlace" href={tienda.web} target="_blank" rel="noopener" onClick={() => registrarClic(tienda.id, 'web')}>{tienda.web.replace(/^https?:\/\//, '')}</a></li>}
              {tienda.email_contacto && <li><Mail size={16} className="texto-3" /><a className="enlace" href={`mailto:${tienda.email_contacto}`} onClick={() => registrarClic(tienda.id, 'contacto')}>{tienda.email_contacto}</a></li>}
              {tienda.horario && <li><Clock size={16} className="texto-3" /><span style={{ whiteSpace: 'pre-wrap' }}>{tienda.horario}</span></li>}
            </ul>
            {tienda.direccion && (
              <a className="btn btn-s" style={{ position: 'relative', zIndex: 2 }} target="_blank" rel="noopener" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tienda.nombre} ${direccionCompleta}`)}`}>{t('tiendas.ficha.comoLlegar')}</a>
            )}
          </aside>
        </div>
        {reportando && <Reportar tipo="tienda" objetoId={tienda.id} onCerrar={() => setReportando(false)} />}
      </div>
    </div>
  );
}

export default function TiendaPage() {
  return <Suspense><Tienda /></Suspense>;
}
