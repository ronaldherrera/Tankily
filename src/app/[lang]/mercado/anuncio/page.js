"use client";

import { Suspense, useEffect, useState } from 'react';
import BotonGuardar from '@/components/mercado/BotonGuardar';
import Link from '@/components/Enlace';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Truck, Mail, Pencil, Flag, Share, BadgeCheck, Trash2 } from 'lucide-react';
import { supabase, AUTOR } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { nombrePais, unirLugar } from '@/lib/paises';
import { formatPrecio, formatRelativeTime } from '@/lib/formatRelativeTime';
import { Avatar, NombreAutor, Vacio, Cargando, useTostada } from '@/components/ui';
import AnuncioCard, { SELECT_ANUNCIO } from '@/components/mercado/AnuncioCard';
import Reportar from '@/components/Reportar';
import Publicidad from '@/components/Publicidad';
import { borrarImagenes } from '@/lib/imagenes';

function Anuncio() {
  const id = useSearchParams().get('id');
  const { usuario } = useSesion();
  const tostada = useTostada();
  const { t, locale, ruta } = useT();
  const [a, setA] = useState(undefined);
  const [foto, setFoto] = useState(0);
  const [otros, setOtros] = useState([]);
  const [reportando, setReportando] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('anuncios').select(`*, ${AUTOR}, tienda:tiendas(nombre, slug, verificada, logo_url)`).eq('id', id).maybeSingle().then(({ data }) => {
      setA(data);
      setFoto(0);
      if (!data) return;
      document.title = `${data.titulo} · ${formatPrecio(data.precio, data.modalidad, data.moneda)} · ${t('mercado.titulo')} Tankily`;
      supabase.from('anuncios').select(SELECT_ANUNCIO).eq('categoria', data.categoria).eq('estado', 'activo').neq('id', data.id).order('creado_en', { ascending: false }).limit(4)
        .then(({ data: o }) => setOtros(o || []));
    });
  }, [id]);

  if (a === undefined) return <div className="contenido ancho"><Cargando alto={420} n={1} /></div>;
  if (!a) return <div className="contenido"><div className="columna"><Vacio titulo={t('mercado.anuncio.noExiste')} accion={<Link href="/mercado/" className="btn">{t('mercado.anuncio.irAlMercado')}</Link>} /></div></div>;

  const esMio = usuario?.id === a.usuario_id;

  async function compartir() {
    if (navigator.share) { try { await navigator.share({ url: location.href, title: a.titulo }); } catch {} }
    else { await navigator.clipboard.writeText(location.href); tostada(t('comun.enlaceCopiado')); }
  }

  async function borrar() {
    if (!window.confirm(t('mercado.anuncio.confirmarEliminar'))) return;
    const { error } = await supabase.from('anuncios').delete().eq('id', a.id);
    if (!error) borrarImagenes(a.imagenes);
    if (!error) { tostada(t('mercado.anuncio.eliminado')); location.href = ruta('/mercado/'); }
  }

  return (
    <div className="contenido ancho">
      <div className="columna" style={{ gap: 18 }}>
        <Link href="/mercado/" className="enlace pequeno" style={{ display: 'inline-flex', gap: 4, alignItems: 'center', paddingTop: 12 }}><ArrowLeft size={14} /> {t('mercado.titulo')}</Link>
        <div className="anuncio-detalle">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="anuncio-foto-grande cristal-suave">
              {a.imagenes?.length ? <img src={a.imagenes[foto]} alt={a.titulo} /> : <span className="texto-3">{t('mercado.anuncio.sinFotos')}</span>}
            </div>
            {a.imagenes?.length > 1 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {a.imagenes.map((src, i) => (
                  <button key={src} onClick={() => setFoto(i)} aria-label={t('mercado.anuncio.foto', { n: i + 1 })} style={{ border: i === foto ? '2px solid var(--agua)' : '2px solid transparent', borderRadius: 10, padding: 0, background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <img loading="lazy" src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="cristal cristal-refracta" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'start' }}>
            {a.estado !== 'activo' && <span className="chip activo" style={{ alignSelf: 'flex-start' }}>{a.estado === 'reservado' ? t('mercado.reservado') : t('mercado.vendido')}</span>}
            <span className="cifra" style={{ fontSize: '2rem' }}>{formatPrecio(a.precio, a.modalidad, a.moneda)}</span>
            <h1 className="titulo-m">{a.titulo}</h1>
            <div className="chips">
              <span className="chip">{t(`mercado.categorias.${a.categoria}`)}</span>
              <span className="chip">{t(`mercado.modalidades.${a.modalidad}`)}</span>
              <span className="chip"><MapPin size={12} /> {unirLugar([a.provincia, nombrePais(a.pais, locale)])}</span>
              {a.envio && <span className="chip"><Truck size={12} /> {a.envio_alcance ? t(`envio.${a.envio_alcance}`) : t('mercado.envio')}</span>}
            </div>
            <hr className="separador" />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Avatar perfil={a.autor} tamano={40} />
              <div style={{ minWidth: 0 }}>
                <NombreAutor perfil={a.autor} />
                {a.tienda && (
                  <Link href={`/tiendas/tienda/?s=${a.tienda.slug}`} className="mini" style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--agua-texto)' }}>
                    {a.tienda.verificada && <BadgeCheck size={12} />} {a.tienda.nombre}
                  </Link>
                )}
                <p className="mini texto-3">{t('mercado.anuncio.publicado', { tiempo: formatRelativeTime(a.creado_en) })}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
              {esMio ? (
                <>
                  <Link href={`/mercado/nuevo/?id=${a.id}`} className="btn btn-primario"><Pencil size={16} /> {t('mercado.anuncio.editar')}</Link>
                  <button className="btn btn-peligro btn-icono" onClick={borrar} aria-label={t('mercado.anuncio.eliminar')}><Trash2 size={16} /></button>
                </>
              ) : usuario ? (
                <>
                  <Link href={`/mensajes/?con=${a.usuario_id}&anuncio=${a.id}`} className="btn btn-primario" style={{ flex: 1 }}><Mail size={16} /> {t('mercado.anuncio.contactar')}</Link>
                  <BotonGuardar anuncioId={a.id} className="btn btn-icono" />
                </>
              ) : (
                <Link href="/acceder/" className="btn btn-primario" style={{ flex: 1 }}>{t('mercado.anuncio.entraContactar')}</Link>
              )}
              <button className="btn btn-icono" onClick={compartir} aria-label={t('comun.compartir')}><Share size={16} /></button>
              {!esMio && <button className="btn btn-icono" onClick={() => setReportando(true)} aria-label={t('mercado.anuncio.reportar')}><Flag size={16} /></button>}
            </div>
            <p className="mini texto-3">{t('mercado.anuncio.consejo')}</p>
          </aside>
        </div>

        {a.descripcion && (
          <section className="cristal-suave" style={{ padding: 20 }}>
            <h2 className="titulo-s" style={{ marginBottom: 8 }}>{t('mercado.anuncio.descripcion')}</h2>
            <p className="prosa texto-2">{a.descripcion}</p>
          </section>
        )}

        <Publicidad ubicacion="mercado" />

        {otros.length > 0 && (
          <section>
            <h2 className="titulo-s" style={{ marginBottom: 10 }}>{t('mercado.anuncio.masEn', { categoria: t(`mercado.categorias.${a.categoria}`) })}</h2>
            <div className="rejilla-anuncios">{otros.map((o) => <AnuncioCard key={o.id} anuncio={o} />)}</div>
          </section>
        )}
        {reportando && <Reportar tipo="anuncio" objetoId={a.id} onCerrar={() => setReportando(false)} />}
      </div>
    </div>
  );
}

export default function AnuncioPage() {
  return <Suspense><Anuncio /></Suspense>;
}
