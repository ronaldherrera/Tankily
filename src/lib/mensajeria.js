"use client";

// Mensajería compartida por la página /mensajes/ y el chat flotante de escritorio:
// carga los mensajes del usuario, escucha los nuevos en tiempo real, los agrupa en
// conversaciones y permite enviar y marcar como leídos.
// Rendimiento: se cargan una vez los más recientes y después solo se añade lo nuevo (nunca se
// vuelve a descargar todo por un mensaje); lo que envías aparece al instante, antes de que
// responda el servidor.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { detectarIdioma } from './traduccion';

export const PERFIL_CHAT = 'id, usuario, nombre, avatar_url';
const SELECT = `*, emisor:perfiles!emisor_id(${PERFIL_CHAT}), receptor:perfiles!receptor_id(${PERFIL_CHAT}), anuncio:anuncios(id, titulo)`;
const LIMITE = 500;

// Añade mensajes sin duplicar (el propio puede llegar por la respuesta y por tiempo real) y en orden
function fusionar(previos, nuevos) {
  const porId = new Map((previos || []).map((m) => [m.id, m]));
  for (const m of nuevos) porId.set(m.id, m);
  return [...porId.values()].sort((a, b) => a.creado_en.localeCompare(b.creado_en));
}

export function useMensajeria(usuario, activo = true) {
  const [mensajes, setMensajes] = useState(null);

  useEffect(() => {
    if (!usuario || !activo) return undefined;
    let vivo = true;
    // Los más recientes (antes se pedían los 1000 más antiguos: con mucho historial, lo nuevo no salía)
    supabase.from('mensajes').select(SELECT)
      .or(`emisor_id.eq.${usuario.id},receptor_id.eq.${usuario.id}`)
      .order('creado_en', { ascending: false }).limit(LIMITE)
      .then(({ data }) => { if (vivo) setMensajes((previos) => fusionar(previos, (data || []).reverse())); });

    // Mensaje nuevo para mí: se pide solo ese (con nombres y fotos) y se añade
    const alLlegar = async ({ new: fila }) => {
      const { data } = await supabase.from('mensajes').select(SELECT).eq('id', fila.id).maybeSingle();
      if (vivo && data) setMensajes((ms) => fusionar(ms, [data]));
    };
    // Nombre de canal único: la página y el chat flotante pueden convivir un instante
    // Mis mensajes que la otra persona acaba de leer: pasan a doble check
    const alLeerlos = ({ new: fila }) => {
      if (vivo) setMensajes((ms) => (ms || []).map((m) => (m.id === fila.id ? { ...m, leido: fila.leido } : m)));
    };
    const canal = supabase.channel(`mensajes-${usuario.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `receptor_id=eq.${usuario.id}` }, alLlegar)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes', filter: `emisor_id=eq.${usuario.id}` }, alLeerlos)
      .subscribe();

    // La otra vista (página o chat flotante) marcó una conversación como leída: se refleja aquí sin recargar
    const alLeer = (e) => {
      const con = e.detail?.con;
      if (!con) return;
      setMensajes((ms) => (ms || []).map((m) => (m.receptor_id === usuario.id && m.emisor_id === con ? { ...m, leido: true } : m)));
    };
    window.addEventListener('tk:leidos', alLeer);
    return () => { vivo = false; supabase.removeChannel(canal); window.removeEventListener('tk:leidos', alLeer); };
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

  // Se pinta al instante (marcado como "enviando") y se sustituye por el real cuando responde el servidor.
  // Se guarda en qué idioma está escrito (lang: el de la interfaz, si no se detecta) para traducirlo a quien lo lee
  const enviar = useCallback(async ({ con, contenido, anuncioId = null, lang }) => {
    const provisional = {
      id: `enviando-${Date.now()}`, emisor_id: usuario?.id, receptor_id: con, contenido, leido: false,
      creado_en: new Date().toISOString(), anuncio_id: anuncioId ? Number(anuncioId) : null, enviando: true,
      emisor: null, receptor: null,
    };
    setMensajes((ms) => {
      const previo = (ms || []).find((m) => m.emisor_id === con || m.receptor_id === con);
      // Para que la conversación siga en la lista mientras se envía, se reutilizan los perfiles ya conocidos
      if (previo) {
        provisional.emisor = previo.emisor_id === usuario?.id ? previo.emisor : previo.receptor;
        provisional.receptor = previo.emisor_id === con ? previo.emisor : previo.receptor;
      }
      return [...(ms || []), provisional];
    });
    const { data, error } = await supabase.from('mensajes')
      .insert({ receptor_id: con, contenido, anuncio_id: anuncioId ? Number(anuncioId) : null, idioma: await detectarIdioma(contenido, lang) })
      .select(SELECT).single();
    if (error) {
      setMensajes((ms) => (ms || []).filter((m) => m.id !== provisional.id));
      throw error;
    }
    setMensajes((ms) => fusionar((ms || []).filter((m) => m.id !== provisional.id), [data]));
    return data;
  }, [usuario]);

  const marcarLeidos = useCallback(async (con) => {
    if (!usuario || !con) return;
    const pendientes = (mensajes || []).some((m) => m.receptor_id === usuario.id && m.emisor_id === con && !m.leido);
    if (!pendientes) return;
    setMensajes((ms) => ms.map((m) => (m.receptor_id === usuario.id && m.emisor_id === con ? { ...m, leido: true } : m)));
    await supabase.from('mensajes').update({ leido: true }).eq('receptor_id', usuario.id).eq('emisor_id', con).eq('leido', false);
    // Avisa a la insignia del menú y a la otra vista de mensajes
    window.dispatchEvent(new CustomEvent('tk:leidos', { detail: { con } }));
  }, [usuario, mensajes]);

  const totalSinLeer = conversaciones.reduce((s, c) => s + c.sinLeer, 0);
  return { mensajes, conversaciones, hiloCon, enviar, marcarLeidos, totalSinLeer };
}

// Estado de la otra persona de una conversación (función estado_chat): el idioma en que usa la web, que es al
// que se le traducen tus mensajes, y si está en línea o cuándo se conectó por última vez. Se refresca cada 30 s.
const EN_LINEA_MS = 150000; // la web apunta la conexión cada minuto mientras está a la vista
export function useEstadoChat(con) {
  const [estado, setEstado] = useState(null);
  useEffect(() => {
    if (!con) return undefined;
    let vivo = true;
    const pedir = () => supabase.rpc('estado_chat', { p_con: con }).then(({ data }) => {
      if (!vivo) return;
      const hace = data?.visto_en ? Date.now() - new Date(data.visto_en).getTime() : null;
      // Sin hora exacta, el último día que entró (en UTC, como actividad_diaria): 'hoy', 'ayer' o la fecha
      const ahora = new Date();
      const ayer = new Date(ahora.getTime() - 86400000).toISOString().slice(0, 10);
      const dia = data?.ultimo_dia;
      const ultimoDia = !dia ? null : dia === ahora.toISOString().slice(0, 10) ? 'hoy' : dia === ayer ? 'ayer' : dia;
      setEstado({ con, idioma: data?.idioma || null, vistoEn: data?.visto_en || null, enLinea: hace !== null && hace < EN_LINEA_MS, hace, ultimoDia });
    });
    pedir();
    const intervalo = setInterval(pedir, 30000);
    return () => { vivo = false; clearInterval(intervalo); };
  }, [con]);
  return estado?.con === con ? estado : null;
}

// Perfil de alguien con quien aún no hay conversación
export async function perfilDe(id) {
  const { data } = await supabase.from('perfiles').select(PERFIL_CHAT).eq('id', id).maybeSingle();
  return data;
}
