// Notificaciones push (Web Push). La llaman los triggers de `mensajes` y `notificaciones` por pg_net
// con la cabecera x-avisos (misma clave que los avisos por email): { tipo: 'mensaje' | 'notificacion', id }.
// La función `avisos` también la usa para los recordatorios de mantenimiento, ya redactados:
// { tipo: 'directo', usuario, titulo, cuerpo, url, etiqueta }.
// Lee la fila, redacta el aviso en el idioma de la persona y lo envía a todos sus dispositivos suscritos;
// las suscripciones caducadas (404/410) se borran.
//
// Secretos: AVISOS_CLAVE, VAPID_PUBLICA y VAPID_PRIVADA (node scripts/claves_push.mjs).
// Textos: textos.json, copiado de la web con scripts/textos_push.mjs.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import textos from './textos.json' with { type: 'json' };

const T = textos as Record<string, { tipos: Record<string, string>; alguien: string }>;
const recortar = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

Deno.serve(async (req) => {
  const clave = Deno.env.get('AVISOS_CLAVE');
  if (req.method !== 'POST' || !clave || req.headers.get('x-avisos') !== clave) return new Response('', { status: 401 });
  const peticion = await req.json().catch(() => ({}));
  const { tipo, id } = peticion;
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  webpush.setVapidDetails('mailto:krill@tankily.com', Deno.env.get('VAPID_PUBLICA')!, Deno.env.get('VAPID_PRIVADA')!);

  if (tipo === 'directo') {
    const { usuario, titulo, cuerpo, url, etiqueta } = peticion;
    if (!usuario || !titulo || !url) return new Response('', { status: 400 });
    const { data: subs } = await sb.from('push_suscripciones').select('id, endpoint, p256dh, auth').eq('usuario_id', usuario);
    return responder(sb, subs || [], JSON.stringify({ titulo, cuerpo, url, etiqueta }));
  }
  if (!['mensaje', 'notificacion'].includes(tipo) || !Number.isInteger(id)) return new Response('', { status: 400 });

  // Quién recibe, quién lo provoca y adónde lleva
  let destino: string, actorId: string | null, ruta: string, cuerpo: string, etiqueta: string;
  if (tipo === 'mensaje') {
    const { data: m } = await sb.from('mensajes').select('emisor_id, receptor_id, contenido').eq('id', id).maybeSingle();
    if (!m) return new Response('', { status: 404 });
    destino = m.receptor_id; actorId = m.emisor_id;
    ruta = `/mensajes/?con=${m.emisor_id}`;
    cuerpo = recortar(m.contenido, 140);
    etiqueta = `mensajes-${m.emisor_id}`; // los de la misma conversación se sustituyen
  } else {
    const { data: n } = await sb.from('notificaciones')
      .select('usuario_id, actor_id, tipo, publicacion_id, hilo_id, tanque_id, tienda:tiendas(slug)').eq('id', id).maybeSingle();
    if (!n) return new Response('', { status: 404 });
    destino = n.usuario_id; actorId = n.actor_id;
    ruta = n.publicacion_id ? `/post/?id=${n.publicacion_id}` : n.hilo_id ? `/foro/hilo/?id=${n.hilo_id}`
      : n.tanque_id ? `/tanque/?id=${n.tanque_id}` : (n.tienda as any)?.slug ? `/tiendas/tienda/?s=${(n.tienda as any).slug}` : '';
    cuerpo = n.tipo;
    etiqueta = `notificacion-${id}`;
  }

  const [{ data: subs }, { data: prefs }, { data: actor }] = await Promise.all([
    sb.from('push_suscripciones').select('id, endpoint, p256dh, auth').eq('usuario_id', destino),
    sb.from('avisos_email').select('idioma').eq('usuario_id', destino).maybeSingle(),
    actorId ? sb.from('perfiles').select('usuario, nombre').eq('id', actorId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!subs?.length) return new Response(JSON.stringify({ enviados: 0 }));

  const lang = T[prefs?.idioma] ? prefs!.idioma : 'es';
  const quien = actor?.nombre || (actor?.usuario ? `@${actor.usuario}` : T[lang].alguien);
  if (tipo === 'notificacion' && !ruta) ruta = actor?.usuario ? `/u/?n=${actor.usuario}` : '/notificaciones/';
  const aviso = tipo === 'mensaje'
    ? { titulo: quien, cuerpo }
    : { titulo: 'Tankily', cuerpo: `${quien} ${T[lang].tipos[cuerpo] ?? ''}`.trim() };
  const carga = JSON.stringify({ ...aviso, url: `/${lang}${ruta}`, etiqueta });
  return responder(sb, subs, carga);
});

type Sub = { id: number; endpoint: string; p256dh: string; auth: string };

// Envía la carga a todos los dispositivos y borra las suscripciones caducadas
async function responder(sb: ReturnType<typeof createClient>, subs: Sub[], carga: string) {
  let enviados = 0;
  const caducadas: number[] = [];
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, { TTL: 86400, urgency: 'high' });
      enviados++;
    } catch (e) {
      const estado = (e as { statusCode?: number }).statusCode;
      if (estado === 404 || estado === 410) caducadas.push(s.id);
      else console.error('push', estado, (e as Error).message);
    }
  }));
  if (caducadas.length) await sb.from('push_suscripciones').delete().in('id', caducadas);
  return new Response(JSON.stringify({ enviados, caducadas: caducadas.length }), { headers: { 'Content-Type': 'application/json' } });
}
