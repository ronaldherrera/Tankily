// Worker de Cloudflare para los vídeos de Tankily (bucket R2 «tankily-media»). Sirve en *.workers.dev, así que no
// hace falta mover el dominio a Cloudflare ni guardar claves de R2 en ningún sitio: el bucket va enlazado al Worker.
//
//   PUT    /subir?tipo=video|poster   Cuerpo: el archivo. Cabecera Authorization: Bearer <token de sesión de Supabase>.
//                                     Devuelve { url }. Se guarda en {uid}/videos/… (cada persona en su carpeta).
//   GET    /{ruta}                    Sirve el archivo, con peticiones por rangos (para poder saltar en el vídeo) y caché.
//   DELETE /{ruta}                    Borra el archivo; solo su autor (la ruta empieza por su id).
//   DELETE /todo                      Borra todos los archivos de quien lo pide (al eliminar la cuenta).
//
// Variables (wrangler.toml): SUPABASE_URL, SUPABASE_ANON_KEY (la clave pública de la web), ORIGENES.

const TIPOS = {
  video: { mime: ['video/mp4', 'video/quicktime', 'video/webm'], max: 40 * 1024 * 1024, ext: { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' } },
  poster: { mime: ['image/webp', 'image/jpeg'], max: 2 * 1024 * 1024, ext: { 'image/webp': 'webp', 'image/jpeg': 'jpg' } },
};

function cors(req, env) {
  const origen = req.headers.get('Origin') || '';
  const permitidos = (env.ORIGENES || '').split(',').map((s) => s.trim());
  return {
    'Access-Control-Allow-Origin': permitidos.includes(origen) ? origen : permitidos[0] || '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
const json = (datos, estado, cab) => new Response(JSON.stringify(datos), { status: estado, headers: { ...cab, 'Content-Type': 'application/json' } });

// Quién hace la petición: se pregunta a Supabase con su token (así no hay que verificar firmas aquí)
async function usuario(req, env) {
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: auth } });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.id ? u : null;
}

async function subir(req, env, cab) {
  const u = await usuario(req, env);
  if (!u) return json({ error: 'sin_sesion' }, 401, cab);
  const tipo = TIPOS[new URL(req.url).searchParams.get('tipo')];
  const mime = (req.headers.get('Content-Type') || '').split(';')[0].trim();
  if (!tipo || !tipo.mime.includes(mime)) return json({ error: 'tipo_no_permitido' }, 415, cab);
  const largo = Number(req.headers.get('Content-Length') || 0);
  if (!largo || largo > tipo.max) return json({ error: 'demasiado_grande' }, 413, cab);
  const ruta = `${u.id}/videos/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${tipo.ext[mime]}`;
  await env.MEDIA.put(ruta, req.body, { httpMetadata: { contentType: mime, cacheControl: 'public, max-age=31536000, immutable' } });
  return json({ url: `${new URL(req.url).origin}/${ruta}` }, 200, cab);
}

async function servir(req, env, cab, ruta) {
  const rango = req.headers.get('Range');
  const obj = await env.MEDIA.get(ruta, rango ? { range: req.headers } : {});
  if (!obj) return new Response('No encontrado', { status: 404, headers: cab });
  const h = new Headers(cab);
  obj.writeHttpMetadata(h);
  h.set('ETag', obj.httpEtag);
  h.set('Accept-Ranges', 'bytes');
  if (rango && obj.range) {
    const inicio = obj.range.offset ?? 0;
    const fin = obj.range.length != null ? inicio + obj.range.length - 1 : obj.size - 1;
    h.set('Content-Range', `bytes ${inicio}-${fin}/${obj.size}`);
    h.set('Content-Length', String(fin - inicio + 1));
    return new Response(req.method === 'HEAD' ? null : obj.body, { status: 206, headers: h });
  }
  h.set('Content-Length', String(obj.size));
  return new Response(req.method === 'HEAD' ? null : obj.body, { status: 200, headers: h });
}

// Al eliminar la cuenta: borra todos los archivos de la persona ({uid}/…)
async function borrarTodo(req, env, cab) {
  const u = await usuario(req, env);
  if (!u) return json({ error: 'sin_sesion' }, 401, cab);
  let cursor, n = 0;
  do {
    const lista = await env.MEDIA.list({ prefix: `${u.id}/`, cursor, limit: 1000 });
    const claves = lista.objects.map((o) => o.key);
    if (claves.length) await env.MEDIA.delete(claves);
    n += claves.length;
    cursor = lista.truncated ? lista.cursor : undefined;
  } while (cursor);
  return json({ borrados: n }, 200, cab);
}

async function borrar(req, env, cab, ruta) {
  const u = await usuario(req, env);
  if (!u) return json({ error: 'sin_sesion' }, 401, cab);
  if (!ruta.startsWith(`${u.id}/`)) return json({ error: 'no_es_tuyo' }, 403, cab);
  await env.MEDIA.delete(ruta);
  return json({ ok: true }, 200, cab);
}

const worker = {
  async fetch(req, env) {
    const cab = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cab });
    const url = new URL(req.url);
    const ruta = decodeURIComponent(url.pathname.slice(1));
    try {
      if (req.method === 'PUT' && ruta === 'subir') return await subir(req, env, cab);
      if (req.method === 'DELETE' && ruta === 'todo') return await borrarTodo(req, env, cab);
      if (!ruta || ruta.includes('..')) return new Response('Tankily media', { status: 200, headers: cab });
      if (req.method === 'GET' || req.method === 'HEAD') return await servir(req, env, cab, ruta);
      if (req.method === 'DELETE') return await borrar(req, env, cab, ruta);
      return new Response('Método no permitido', { status: 405, headers: cab });
    } catch (e) {
      return json({ error: 'interno', detalle: String(e?.message || e) }, 500, cab);
    }
  },
};

export default worker;
