"use client";

// Anuncios guardados del mercado: un estado compartido por todas las tarjetas de la página.
// Se carga una vez por sesión y se actualiza al momento al guardar o quitar (optimista).
import { useCallback, useEffect, useReducer } from 'react';
import { supabase } from './supabase';
import { useSesion } from './sesion';

let ids = null;        // Set con los ids guardados del usuario actual
let delUsuario = null; // de quién son
let cargando = null;
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());

function cargar(usuarioId) {
  if (delUsuario === usuarioId && (ids || cargando)) return;
  delUsuario = usuarioId;
  ids = null;
  cargando = supabase.from('anuncios_guardados').select('anuncio_id').then(({ data }) => {
    if (delUsuario !== usuarioId) return;
    ids = new Set((data || []).map((r) => r.anuncio_id));
    cargando = null;
    avisar();
  });
}

export function useGuardados() {
  const { usuario } = useSesion();
  const [, refrescar] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    oyentes.add(refrescar);
    return () => oyentes.delete(refrescar);
  }, []);
  useEffect(() => {
    if (usuario) cargar(usuario.id);
    else if (delUsuario) { delUsuario = null; ids = null; avisar(); }
  }, [usuario]);

  const alternar = useCallback(async (anuncioId) => {
    if (!usuario || !ids) return;
    const estaba = ids.has(anuncioId);
    const siguiente = new Set(ids);
    if (estaba) siguiente.delete(anuncioId); else siguiente.add(anuncioId);
    ids = siguiente;
    avisar();
    const { error } = estaba
      ? await supabase.from('anuncios_guardados').delete().eq('usuario_id', usuario.id).eq('anuncio_id', anuncioId)
      : await supabase.from('anuncios_guardados').insert({ anuncio_id: anuncioId });
    if (error) {
      // Se deshace el cambio si la base de datos no lo acepta
      const vuelta = new Set(ids);
      if (estaba) vuelta.add(anuncioId); else vuelta.delete(anuncioId);
      ids = vuelta;
      avisar();
    }
  }, [usuario]);

  return { conSesion: !!usuario, guardados: ids, guardado: (id) => !!ids?.has(id), alternar };
}
