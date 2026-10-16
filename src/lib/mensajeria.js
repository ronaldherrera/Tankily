"use client";

// Mensajería compartida por la página /mensajes/ y el chat flotante de escritorio:
// carga los mensajes del usuario, escucha los nuevos en tiempo real, los agrupa en
// conversaciones y permite enviar y marcar como leídos.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

export const PERFIL_CHAT = 'id, usuario, nombre, avatar_url';
const SELECT = `*, emisor:perfiles!emisor_id(${PERFIL_CHAT}), receptor:perfiles!receptor_id(${PERFIL_CHAT}), anuncio:anuncios(id, titulo)`;

export function useMensajeria(usuario, activo = true) {
  const [mensajes, setMensajes] = useState(null);

  useEffect(() => {
    if (!usuario || !activo) return undefined;
    const cargar = () => supabase.from('mensajes').select(SELECT)
      .or(`emisor_id.eq.${usuario.id},receptor_id.eq.${usuario.id}`)
      .order('creado_en', { ascending: true }).limit(1000)
      .then(({ data }) => setMensajes(data || []));
    cargar();
    // Nombre de canal único: la página y el chat flotante pueden convivir un instante
    const canal = supabase.channel(`mensajes-${usuario.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `receptor_id=eq.${usuario.id}` }, cargar)
      .subscribe();
    const alLeer = () => cargar();
    window.addEventListener('tk:leidos', alLeer);
    return () => { supabase.removeChannel(canal); window.removeEventListener('tk:leidos', alLeer); };
  }, [usuario, activo]);

  // Conversaciones agrupadas por la otra persona, la más reciente primero
  const conversaciones = useMemo(() => {
    if (!mensajes || !usuario) return [];
    const mapa = new Map();
    for (const m of mensajes) {
      const persona = m.emisor_id === usuario.id ? m.receptor : m.emisor;
      if (!persona) continue;
      const c = mapa.get(persona.id) || { persona, ultimo: m, sinLeer: 0 };
      c.ultimo = m;
      if (m.receptor_id === usuario.id && !m.leido) c.sinLeer++;
      mapa.set(persona.id, c);
    }
    return [...mapa.values()].sort((a, b) => b.ultimo.creado_en.localeCompare(a.ultimo.creado_en));
  }, [mensajes, usuario]);

  const hiloCon = useCallback(
    (con) => (mensajes || []).filter((m) => con && (m.emisor_id === con || m.receptor_id === con)),
    [mensajes],
  );

  const enviar = useCallback(async ({ con, contenido, anuncioId = null }) => {
    const { data, error } = await supabase.from('mensajes')
      .insert({ receptor_id: con, contenido, anuncio_id: anuncioId ? Number(anuncioId) : null })
      .select(SELECT).single();
    if (error) throw error;
    setMensajes((ms) => [...(ms || []), data]);
    return data;
  }, []);

  const marcarLeidos = useCallback(async (con) => {
    if (!usuario || !con) return;
    const pendientes = (mensajes || []).some((m) => m.receptor_id === usuario.id && m.emisor_id === con && !m.leido);
    if (!pendientes) return;
    await supabase.from('mensajes').update({ leido: true }).eq('receptor_id', usuario.id).eq('emisor_id', con).eq('leido', false);
    setMensajes((ms) => ms.map((m) => (m.receptor_id === usuario.id && m.emisor_id === con ? { ...m, leido: true } : m)));
    // Avisa a la insignia del menú y a la otra vista de mensajes
    window.dispatchEvent(new Event('tk:leidos'));
  }, [usuario, mensajes]);

  const totalSinLeer = conversaciones.reduce((s, c) => s + c.sinLeer, 0);
  return { mensajes, conversaciones, hiloCon, enviar, marcarLeidos, totalSinLeer };
}

// Perfil de alguien con quien aún no hay conversación
export async function perfilDe(id) {
  const { data } = await supabase.from('perfiles').select(PERFIL_CHAT).eq('id', id).maybeSingle();
  return data;
}
