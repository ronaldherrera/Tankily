// Ecos y citas que ya ha hecho el usuario sobre unas publicaciones, para marcar el botón de republicar
// (como el corazón de los "me gusta") y no repetir: Map idOriginal → { eco: idDeMiEco, cita: idDeMiCita }
import { supabase } from './supabase';

export async function cargarMisEcos(usuarioId, ids) {
  const mapa = new Map();
  if (!usuarioId || !ids.length) return mapa;
  const { data } = await supabase.from('publicaciones').select('id, eco_de, contenido')
    .eq('usuario_id', usuarioId).in('eco_de', ids);
  for (const p of data || []) {
    const actual = mapa.get(p.eco_de) || { eco: null, cita: null };
    if (p.contenido) actual.cita = actual.cita || p.id; else actual.eco = actual.eco || p.id;
    mapa.set(p.eco_de, actual);
  }
  return mapa;
}
