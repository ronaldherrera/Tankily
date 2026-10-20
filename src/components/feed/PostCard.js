"use client";

import { useEffect, useRef, useState } from 'react';
import Link from '@/components/Enlace';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Trash2, Flag, Quote, Undo2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { colorAgua } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { Avatar, NombreAutor, Galeria, Modal, useTostada, EtiquetaOculto } from '@/components/ui';
import { detectarIdioma } from '@/lib/traduccion';
import TextoTraducible from './TextoTraducible';
import CommentSection, { precargarComentarios } from './CommentSection';
import Reportar from '@/components/Reportar';
import { usePresencia } from '@/lib/presencia';
import { borrarImagenes } from '@/lib/imagenes';
import { evento } from '@/lib/analitica';
import { enlaceTanque } from '@/lib/enlaces';

export function ChipTanque({ tanque }) {
  const { lang } = useT();
  if (!tanque) return null;
  return (
    <Link href={enlaceTanque(tanque, lang)} className="etiqueta-agua" style={{ '--agua': colorAgua(tanque.tipo) }}>
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

export default function PostCard({ post, meGusta = false, miEco, onBorrado, destacado = false }) {
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
  // Republicar, como en X: "Hacer eco" tal cual o "Citar" con un comentario propio
  const [menuEco, setMenuEco] = useState(false);
  const menuEcoPresencia = usePresencia(menuEco);
  const cajaEco = useRef(null);
  const [citando, setCitando] = useState(false);
  // Mi eco y mi cita de esta publicación (ids), para marcar el botón y no repetir
  const [eco, setEco] = useState(miEco?.eco || null);
  const [cita, setCita] = useState(miEco?.cita || null);

  useEffect(() => {
    if (!menuEco) return undefined;
    const fuera = (e) => !cajaEco.current?.contains(e.target) && setMenuEco(false);
    const escape = (e) => e.key === 'Escape' && setMenuEco(false);
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', escape); };
  }, [menuEco]);


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

  function abrirMenuEco() {
    if (!usuario) return tostada(t('post.entraEco'));
    setMenuEco(!menuEco);
  }

  async function hacerEco() {
    setMenuEco(false);
    if (!usuario) return tostada(t('post.entraEco'));
    const { data, error } = await supabase.from('publicaciones').insert({ eco_de: objetivo.id, tipo: 'eco' }).select('id').single();
    if (!error) {
      setEco(data.id);
      setNumEcos((n) => n + 1);
      tostada(t('post.ecoPublicado'));
    } else if (error.code === '23505') {
      // Ya había un eco (la base de datos solo permite uno): se marca el botón con el existente
      const { data: previo } = await supabase.from('publicaciones').select('id')
        .eq('usuario_id', usuario.id).eq('eco_de', objetivo.id).is('contenido', null).maybeSingle();
      if (previo) setEco(previo.id);
    }
  }

  // Deshacer el eco: se borra mi eco (no la publicación original). Si esta tarjeta era ese eco, se quita del muro.
  async function deshacerEco() {
    setMenuEco(false);
    const id = eco;
    setEco(null);
    setNumEcos((n) => Math.max(0, n - 1));
    const { error } = await supabase.from('publicaciones').delete().eq('id', id).eq('usuario_id', usuario.id);
    if (error) { setEco(id); setNumEcos((n) => n + 1); return; }
    tostada(t('cita.ecoDeshecho'));
    if (post.id === id) onBorrado?.(post.id);
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
            <EtiquetaOculto oculto={objetivo.oculto} />
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
        <button
          onClick={() => setVerComentarios(!verComentarios)}
          onPointerEnter={() => precargarComentarios(objetivo.id)}
          onFocus={() => precargarComentarios(objetivo.id)}
          aria-label={t('post.comentarios')}
          aria-expanded={verComentarios}
        >
          <MessageCircle size={18} /> <span>{numComentarios || ''}</span>
        </button>
        <span ref={cajaEco} className="post-eco">
          <button
            onClick={abrirMenuEco}
            aria-label={t('post.hacerEco')}
            aria-haspopup="menu"
            aria-expanded={menuEco}
            aria-pressed={!!(eco || cita)}
            className={`${menuEco ? 'activo' : ''}${eco || cita ? ' eco-hecho' : ''}`}
          >
            <Repeat2 size={18} /> <span>{numEcos || ''}</span>
          </button>
          {menuEcoPresencia.montado && (
            <div className={`menu cristal menu-eco${menuEcoPresencia.saliendo ? ' saliendo' : ''}`} role="menu">
              {eco
                ? <button role="menuitem" onClick={deshacerEco}><Undo2 size={16} /> {t('cita.deshacerEco')}</button>
                : <button role="menuitem" onClick={hacerEco}><Repeat2 size={16} /> {t('post.hacerEco')}</button>}
              {cita
                ? <Link role="menuitem" href={`/post/?id=${cita}`} onClick={() => setMenuEco(false)}><Quote size={16} /> {t('cita.verCita')}</Link>
                : <button role="menuitem" onClick={() => { setMenuEco(false); setCitando(true); }}><Quote size={16} /> {t('cita.citar')}</button>}
            </div>
          )}
        </span>
        <button onClick={alternarGusta} aria-label={t('post.meGusta')} aria-pressed={gusta} className={gusta ? 'gusta' : ''}>
          <Heart size={18} fill={gusta ? 'currentColor' : 'none'} /> <span>{numGusta || ''}</span>
        </button>
        <button onClick={compartir} aria-label={t('comun.compartir')}>
          <Share size={18} />
        </button>
      </footer>

      {verComentarios && (
        <div className="despliega">
          <CommentSection
            postId={objetivo.id}
            autorPostId={objetivo.usuario_id}
            onCambioTotal={(d) => setNumComentarios((n) => n + d)}
          />
        </div>
      )}

      {reportando && <Reportar tipo="publicacion" objetoId={post.id} onCerrar={() => setReportando(false)} />}
      {citando && (
        <CitarPost
          original={objetivo}
          onCerrar={() => setCitando(false)}
          onPublicada={(id) => { setCitando(false); setCita(id); setNumEcos((n) => n + 1); tostada(t('cita.publicada')); }}
        />
      )}
    </article>
  );
}

// Ventana para citar: tu comentario arriba y la publicación original enmarcada debajo, como quedará en el muro
function CitarPost({ original, onCerrar, onPublicada }) {
  const { t, lang } = useT();
  const { perfil } = useSesion();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [publicando, setPublicando] = useState(false);

  async function publicar(e) {
    e.preventDefault();
    if (!texto.trim()) return setError(t('cita.vacia'));
    setPublicando(true);
    const { data, error: fallo } = await supabase.from('publicaciones').insert({
      eco_de: original.id, tipo: 'eco', contenido: texto.trim(), idioma: await detectarIdioma(texto, lang),
    }).select('id').single();
    setPublicando(false);
    if (fallo?.code === '23505') return setError(t('cita.yaCitada'));
    if (fallo) return setError(fallo.message);
    evento('publicacion', { tipo: 'cita' });
    onPublicada(data.id);
  }

  return (
    <Modal titulo={t('cita.titulo')} onCerrar={onCerrar} ancho={560}>
      <form className="citar" onSubmit={publicar}>
        <div className="citar-autor">
          <Avatar perfil={perfil} tamano={40} />
          <textarea
            className="entrada"
            rows={3}
            maxLength={2000}
            autoFocus
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setError(''); }}
            placeholder={t('cita.placeholder')}
            aria-label={t('cita.placeholder')}
          />
        </div>
        <div className="eco-citado">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <Avatar perfil={original.autor} tamano={22} />
            <strong className="pequeno">{original.autor?.nombre || original.autor?.usuario}</strong>
            <span className="texto-3 mini">{formatRelativeTime(original.creado_en)}</span>
          </div>
          <Contenido post={original} sinEnlaces />
        </div>
        {error && <p className="aviso error">{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn" onClick={onCerrar}>{t('recorte.cancelar')}</button>
          <button className="btn btn-primario" disabled={publicando || !texto.trim()}>{t('cita.publicar')}</button>
        </div>
      </form>
    </Modal>
  );
}
