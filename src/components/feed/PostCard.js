"use client";

import { useState } from 'react';
import Link from '@/components/Enlace';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Trash2, Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { colorAgua } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { Avatar, NombreAutor, Galeria, useTostada } from '@/components/ui';
import TextoTraducible from './TextoTraducible';
import CommentSection from './CommentSection';
import Reportar from '@/components/Reportar';
import { usePresencia } from '@/lib/presencia';
import { borrarImagenes } from '@/lib/imagenes';

export function ChipTanque({ tanque }) {
  if (!tanque) return null;
  return (
    <Link href={`/tanque/?id=${tanque.id}`} className="etiqueta-agua" style={{ '--agua': colorAgua(tanque.tipo) }}>
      {tanque.nombre}
    </Link>
  );
}

function Contenido({ post, sinEnlaces = false }) {
  return (
    <>
      {post.tipo === 'medicion' ? (
        <div className="medicion-compartida" style={{ '--agua': colorAgua(post.tanque?.tipo) }}>
          <TextoTraducible tabla="publicaciones" id={post.id} texto={post.contenido} idioma={post.idioma} sinEnlaces={sinEnlaces} />
        </div>
      ) : (
        <TextoTraducible tabla="publicaciones" id={post.id} texto={post.contenido} idioma={post.idioma} sinEnlaces={sinEnlaces} />
      )}
      <Galeria imagenes={post.imagenes} sinEnlaces={sinEnlaces} />
    </>
  );
}

export default function PostCard({ post, meGusta = false, onBorrado, destacado = false }) {
  const { usuario } = useSesion();
  const tostada = useTostada();
  const { t } = useT();
  // Un eco sin texto se muestra como la publicación original con una línea "X hizo eco"
  const esEcoPuro = post.eco_de && !post.contenido && post.original;
  const objetivo = esEcoPuro ? post.original : post;
  const [verComentarios, setVerComentarios] = useState(destacado);
  const [gusta, setGusta] = useState(meGusta);
  const [numGusta, setNumGusta] = useState(objetivo.num_me_gusta);
  const [numEcos, setNumEcos] = useState(objetivo.num_ecos);
  const [numComentarios, setNumComentarios] = useState(objetivo.num_comentarios);
  const [menu, setMenu] = useState(false);
  const [reportando, setReportando] = useState(false);
  const menuOpciones = usePresencia(menu);


  async function alternarGusta() {
    if (!usuario) return tostada(t('post.entraGusta'));
    const nuevo = !gusta;
    setGusta(nuevo);
    setNumGusta((n) => n + (nuevo ? 1 : -1));
    const { error } = nuevo
      ? await supabase.from('me_gusta').insert({ publicacion_id: objetivo.id })
      : await supabase.from('me_gusta').delete().eq('publicacion_id', objetivo.id).eq('usuario_id', usuario.id);
    if (error && error.code !== '23505') {
      setGusta(!nuevo);
      setNumGusta((n) => n + (nuevo ? -1 : 1));
    }
  }

  async function hacerEco() {
    if (!usuario) return tostada(t('post.entraEco'));
    const { error } = await supabase.from('publicaciones').insert({ eco_de: objetivo.id, tipo: 'eco' });
    if (!error) {
      setNumEcos((n) => n + 1);
      tostada(t('post.ecoPublicado'));
    }
  }

  async function compartir() {
    const url = `${window.location.origin}/${document.documentElement.lang}/post/?id=${objetivo.id}`;
    if (navigator.share) {
      try { await navigator.share({ url, title: 'Tankily' }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      tostada(t('comun.enlaceCopiado'));
    }
  }

  async function borrar() {
    setMenu(false);
    const { error } = await supabase.from('publicaciones').delete().eq('id', post.id);
    if (!error) borrarImagenes(post.imagenes);
    if (!error) {
      tostada(t('post.eliminada'));
      onBorrado?.(post.id);
    }
  }

  const autor = objetivo.autor;
  const esMia = usuario?.id === post.usuario_id;

  return (
    <article className="post cristal-suave">
      {esEcoPuro && (
        <p className="mini texto-3" style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
          <Repeat2 size={14} /> {t('post.hizoEco', { nombre: post.autor?.nombre || post.autor?.usuario })}
        </p>
      )}

      <header className="post-cabecera">
        <Link href={`/u/?n=${autor?.usuario}`} aria-hidden="true" tabIndex={-1}><Avatar perfil={autor} tamano={42} /></Link>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <NombreAutor perfil={autor} />
            <Link href={`/post/?id=${objetivo.id}`} className="texto-3 pequeno">{formatRelativeTime(objetivo.creado_en)}</Link>
          </div>
          <ChipTanque tanque={objetivo.tanque} />
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-fantasma btn-icono btn-s" onClick={() => setMenu(!menu)} aria-label={t('comun.opciones')} aria-expanded={menu}>
            <MoreHorizontal size={18} />
          </button>
          {menuOpciones.montado && (
            <div className={`menu cristal${menuOpciones.saliendo ? ' saliendo' : ''}`} onMouseLeave={() => setMenu(false)}>
              {esMia ? (
                <button onClick={borrar}><Trash2 size={16} /> {t('comun.eliminar')}</button>
              ) : (
                <button onClick={() => { setMenu(false); setReportando(true); }}><Flag size={16} /> {t('comun.reportar')}</button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="post-cuerpo">
        <Contenido post={objetivo} />
        {post.eco_de && !esEcoPuro && post.original && (
          <Link href={`/post/?id=${post.original.id}`} className="eco-citado">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <Avatar perfil={post.original.autor} tamano={22} />
              <strong className="pequeno">{post.original.autor?.nombre || post.original.autor?.usuario}</strong>
              <span className="texto-3 mini">{formatRelativeTime(post.original.creado_en)}</span>
            </div>
            <Contenido post={post.original} sinEnlaces />
          </Link>
        )}
      </div>

      <footer className="post-acciones">
        <button onClick={() => setVerComentarios(!verComentarios)} aria-label={t('post.comentarios')} aria-expanded={verComentarios}>
          <MessageCircle size={18} /> <span>{numComentarios || ''}</span>
        </button>
        <button onClick={hacerEco} aria-label={t('post.hacerEco')}>
          <Repeat2 size={18} /> <span>{numEcos || ''}</span>
        </button>
        <button onClick={alternarGusta} aria-label={t('post.meGusta')} aria-pressed={gusta} className={gusta ? 'gusta' : ''}>
          <Heart size={18} fill={gusta ? 'currentColor' : 'none'} /> <span>{numGusta || ''}</span>
        </button>
        <button onClick={compartir} aria-label={t('comun.compartir')}>
          <Share size={18} />
        </button>
      </footer>

      {verComentarios && (
        <CommentSection
          postId={objetivo.id}
          autorPostId={objetivo.usuario_id}
          onCambioTotal={(d) => setNumComentarios((n) => n + d)}
        />
      )}

      {reportando && <Reportar tipo="publicacion" objetoId={post.id} onCerrar={() => setReportando(false)} />}
    </article>
  );
}
