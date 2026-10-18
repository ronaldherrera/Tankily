"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, AUTOR } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { Cargando, Vacio } from '@/components/ui';
import Publicidad from '@/components/Publicidad';
import PostCard from './PostCard';
import { useT } from '@/i18n/IdiomaProvider';
import ErrorCarga from '@/components/ErrorCarga';
import { cargarMisEcos } from '@/lib/ecos';

const TANQUE = 'tanque:tanques(id, nombre, tipo)';
export const SELECT_POST = `*, ${AUTOR}, ${TANQUE}, original:eco_de(*, ${AUTOR}, ${TANQUE})`;
const POR_PAGINA = 15;
const PUBLI_CADA = 6;

// Construye la consulta según el modo del muro
async function consulta({ modo, usuarioId, etiqueta, autorId, tanqueId }, desde) {
  let q = supabase.from('publicaciones').select(SELECT_POST);
  if (modo === 'siguiendo' && usuarioId) {
    const { data } = await supabase.from('seguidores').select('seguido_id').eq('seguidor_id', usuarioId);
    q = q.in('usuario_id', [usuarioId, ...(data || []).map((s) => s.seguido_id)]);
  }
  if (etiqueta) q = q.contains('etiquetas', [etiqueta]);
  if (autorId) q = q.eq('usuario_id', autorId);
  if (tanqueId) q = q.eq('tanque_id', tanqueId);
  return q.order('creado_en', { ascending: false }).range(desde, desde + POR_PAGINA - 1);
}

export default function Feed({ modo = 'todos', etiqueta, autorId, tanqueId, cabecera, vacio, conPublicidad = true }) {
  const { usuario, cargando: cargandoSesion } = useSesion();
  const { t } = useT();
  const [posts, setPosts] = useState(null);
  const [gustados, setGustados] = useState(new Set());
  const [misEcos, setMisEcos] = useState(new Map());
  const [hayMas, setHayMas] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [nuevos, setNuevos] = useState(0);
  const [fallo, setFallo] = useState(false); // la última carga falló (sin conexión, error del servidor)
  const centinela = useRef(null);
  const filtros = { modo, usuarioId: usuario?.id, etiqueta, autorId, tanqueId };
  const clave = JSON.stringify(filtros);

  const marcarGustados = useCallback(async (lista) => {
    if (!usuario || !lista.length) return;
    const ids = lista.flatMap((p) => [p.id, p.original?.id]).filter(Boolean);
    const [{ data }, ecos] = await Promise.all([
      supabase.from('me_gusta').select('publicacion_id').eq('usuario_id', usuario.id).in('publicacion_id', ids),
      cargarMisEcos(usuario.id, ids),
    ]);
    setGustados((prev) => new Set([...prev, ...(data || []).map((g) => g.publicacion_id)]));
    setMisEcos((prev) => new Map([...prev, ...ecos]));
  }, [usuario]);

  const cargar = useCallback(async (reiniciar) => {
    const desde = reiniciar ? 0 : posts?.length || 0;
    if (!reiniciar) setCargandoMas(true);
    let data = null, error = null;
    try { ({ data, error } = await consulta(JSON.parse(clave), desde)); } catch (e) { error = e; }
    setFallo(!!error);
    if (error) {
      // Se conserva lo ya cargado; si no había nada, se mostrará el aviso con "Reintentar"
      setPosts((prev) => (reiniciar ? [] : prev));
      setHayMas(false);
      setCargandoMas(false);
      return;
    }
    const lista = data || [];
    await marcarGustados(lista);
    setPosts((prev) => (reiniciar ? lista : [...(prev || []), ...lista]));
    setHayMas(lista.length === POR_PAGINA);
    setCargandoMas(false);
    if (reiniciar) setNuevos(0);
  }, [clave, posts?.length, marcarGustados]);

  useEffect(() => {
    if (cargandoSesion) return;
    setPosts(null);
    cargar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, cargandoSesion]);

  // Aviso de publicaciones nuevas en tiempo real (sin saltos en el scroll)
  useEffect(() => {
    if (autorId || tanqueId || etiqueta) return;
    const canal = supabase
      .channel(`muro-${modo}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'publicaciones' }, (pl) => {
        if (pl.new.usuario_id !== usuario?.id) setNuevos((n) => n + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [modo, autorId, tanqueId, etiqueta, usuario?.id]);

  // Scroll infinito
  useEffect(() => {
    const el = centinela.current;
    if (!el || !hayMas) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !cargandoMas && posts?.length) cargar(false);
    }, { rootMargin: '600px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hayMas, cargandoMas, posts?.length, cargar]);

  const alPublicar = (post) => setPosts((p) => [post, ...(p || [])]);
  const alBorrar = (id) => setPosts((p) => p.filter((x) => x.id !== id));

  return (
    <>
      {typeof cabecera === 'function' ? cabecera(alPublicar) : cabecera}

      {nuevos > 0 && (
        <button className="btn btn-primario btn-s pildora-nuevos" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); cargar(true); }}>
          {t('muro.nuevas', { n: nuevos })}
        </button>
      )}

      {posts === null ? (
        <Cargando alto={160} />
      ) : posts.length === 0 && fallo ? (
        <ErrorCarga onReintentar={() => { setPosts(null); cargar(true); }} />
      ) : posts.length === 0 ? (
        vacio || <Vacio titulo={t('muro.vacioGenericoTitulo')}>{t('muro.vacioGenericoTexto')}</Vacio>
      ) : (
        posts.map((post, i) => (
          <div key={post.id} style={{ display: 'contents', '--i': i % 10 }}>
            <PostCard
              post={post}
              meGusta={gustados.has(post.original && !post.contenido ? post.original.id : post.id)}
              miEco={misEcos.get(post.original && !post.contenido ? post.original.id : post.id)}
              onBorrado={alBorrar}
            />
            {conPublicidad && (i + 1) % PUBLI_CADA === 0 && <Publicidad ubicacion="feed" />}
          </div>
        ))
      )}

      <div ref={centinela} />
      {cargandoMas && <Cargando alto={120} n={1} />}
      {fallo && posts?.length > 0 && (
        <button type="button" className="btn" style={{ alignSelf: 'center' }} onClick={() => { setHayMas(true); cargar(false); }}>{t('errorPagina.reintentar')}</button>
      )}
    </>
  );
}
