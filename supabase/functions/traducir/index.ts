// Traduce un texto de Tankily (publicación, comentario, hilo o respuesta del foro).
// Recibe { tabla, id, campo, idioma } y nunca un texto libre: lee el original de la base de datos,
// así nadie puede usar esta función como traductor gratuito. Guarda el resultado en la caché
// compartida `traducciones` para que cada texto se traduzca una sola vez por idioma.
//
// Proveedor: DeepL si existe el secreto DEEPL_API_KEY (las claves gratuitas acaban en ":fx"); si DeepL falla
// o se agota el crédito, MyMemory. Clave:
//   npx supabase secrets set DEEPL_API_KEY=... --project-ref <ref>
// Si no, la API gratuita de MyMemory (sin clave, ~5000 caracteres/día; la caché lo multiplica).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CAMPOS: Record<string, string[]> = {
  publicaciones: ['contenido'],
  comentarios: ['contenido'],
  foro_hilos: ['titulo', 'contenido'],
  foro_respuestas: ['contenido'],
};
// Idiomas de la interfaz → código de destino de DeepL
const DESTINO: Record<string, string> = { es: 'ES', en: 'EN-US', de: 'DE', pt: 'PT-BR', fr: 'FR', it: 'IT', nl: 'NL', pl: 'PL' };
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, 'Content-Type': 'application/json' } });

async function huella(texto: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// #etiquetas, @menciones y enlaces no se traducen nunca
const PROTEGER = /(#[\p{L}\p{N}_]{2,40}|@[a-zA-Z0-9_][a-zA-Z0-9_.-]{1,18}[a-zA-Z0-9_]|https?:\/\/[^\s<]+)/gu;
const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const desescapar = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// DeepL: las partes protegidas van envueltas en <x> y se ignoran
async function conDeepL(original: string, idioma: string, clave: string, origen: string | null) {
  const marcado = escapar(original).replace(PROTEGER, '<x>$1</x>');
  const url = clave.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: [marcado], target_lang: DESTINO[idioma], tag_handling: 'xml', ignore_tags: ['x'] }),
  });
  if (!r.ok) throw new Error(`DeepL ${r.status}`);
  const datos = await r.json();
  return {
    texto: desescapar(String(datos.translations?.[0]?.text || '').replace(/<\/?x>/g, '')),
    de: String(datos.translations?.[0]?.detected_source_language || origen || '').slice(0, 2).toLowerCase(),
  };
}

// MyMemory: traduce trozos de hasta ~500 caracteres. Se traducen solo los fragmentos de texto
// entre las partes protegidas, y los largos se parten por frases.
function trocear(texto: string) {
  if (texto.length <= 480) return [texto];
  const frases = texto.match(/[^.!?\n]+[.!?\n]*\s*/g) || [texto];
  const trozos: string[] = [];
  let actual = '';
  for (const frase of frases) {
    if ((actual + frase).length > 480 && actual) { trozos.push(actual); actual = ''; }
    actual += frase;
  }
  if (actual) trozos.push(actual);
  return trozos;
}

async function conMyMemory(original: string, origen: string | null, idioma: string) {
  if (!origen) throw new Error('idioma de origen desconocido');
  const traducir = async (t: string) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${origen}|${idioma}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`MyMemory ${r.status}`);
    const d = await r.json();
    const salida = String(d.responseData?.translatedText || '');
    if (Number(d.responseStatus) !== 200 || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(salida)) {
      throw new Error(`MyMemory: ${d.responseDetails || salida}`);
    }
    return salida;
  };
  const partes = original.split(PROTEGER);
  const traducidas: string[] = [];
  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i];
    if (i % 2 === 1 || !parte.trim()) { traducidas.push(parte); continue; }
    const [, antes, medio, despues] = parte.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    const trozos: string[] = [];
    for (const trozo of trocear(medio)) trozos.push(await traducir(trozo));
    traducidas.push(antes + trozos.join(' ') + despues);
  }
  return { texto: traducidas.join(''), de: origen };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return responder({ error: 'metodo' }, 405);

  let peticion: { tabla?: string; id?: number; campo?: string; idioma?: string };
  try { peticion = await req.json(); } catch { return responder({ error: 'peticion' }, 400); }
  const { tabla = '', id, campo = 'contenido', idioma = '' } = peticion;
  if (!CAMPOS[tabla]?.includes(campo) || !Number.isInteger(id) || !DESTINO[idioma]) return responder({ error: 'peticion' }, 400);

  // El original se lee con los permisos de quien pide (RLS): así una publicación de un tanque privado
  // no se puede leer pidiendo su traducción. La clave de servicio solo se usa para la caché.
  const lector = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: fila } = await lector.from(tabla).select(`${campo}, idioma`).eq('id', id).maybeSingle();
  const original: string | undefined = fila?.[campo];
  if (!original) return responder({ error: 'no_existe' }, 404);
  if (original.length > 5000) return responder({ error: 'largo' }, 413);
  if (fila.idioma === idioma) return responder({ texto: original, de: idioma });

  const h = await huella(original);
  const { data: guardada } = await sb.from('traducciones').select('texto, huella')
    .match({ tabla, fila_id: id, campo, idioma }).maybeSingle();
  if (guardada && guardada.huella === h) return responder({ texto: guardada.texto, de: fila.idioma, cache: true });

  // DeepL si hay clave; si falla (p. ej. 456: crédito agotado), MyMemory, para que traducir no deje de funcionar
  const clave = Deno.env.get('DEEPL_API_KEY');
  let resultado: { texto: string; de: string } | null = null;
  let proveedor = 'mymemory';
  if (clave) {
    try {
      resultado = await conDeepL(original, idioma, clave, fila.idioma);
      proveedor = 'deepl';
    } catch (e) {
      console.error('DeepL', String(e));
    }
  }
  if (!resultado?.texto) {
    try {
      resultado = await conMyMemory(original, fila.idioma, idioma);
    } catch (e) {
      return responder({ error: 'proveedor', detalle: String(e) }, 502);
    }
  }
  if (!resultado.texto) return responder({ error: 'proveedor' }, 502);

  await sb.from('traducciones').upsert({ tabla, fila_id: id, campo, idioma, huella: h, texto: resultado.texto });
  return responder({ texto: resultado.texto, de: resultado.de, proveedor });
});
