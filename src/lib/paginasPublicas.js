// Páginas indexables de contenido de la comunidad (tanques públicos, hilos del foro y anuncios activos):
// /es/tanque/arrecife-del-salon-12/, /es/foro/hilo/como-bajar-nitratos-8/, /es/mercado/anuncio/anubias-5/.
// Se generan al construir la web (y cada noche, .github/workflows/deploy.yml) leyendo Supabase con la clave
// pública, así que solo entra lo que cualquiera puede ver. Cada una existe solo en el idioma de su contenido.
// Los enlaces dentro de la web siguen usando ?id=, que funciona también con lo creado después del último build.
import { supabase, AUTOR } from './supabase';
import { slugCon, idDeSlug } from './slugs';

export { slugCon, idDeSlug };

// Sin contenido en un idioma, la ruta necesita al menos un parámetro para el export estático
export const VACIO = '_';

const TIPOS = {
  tanque: {
    lista: () => supabase.from('tanques').select('id, nombre, idioma, creado_en').eq('visibilidad', 'publico'),
    texto: (x) => x.nombre,
    ruta: '/tanque/',
  },
  hilo: {
    lista: () => supabase.from('foro_hilos').select('id, titulo, idioma, creado_en'),
    texto: (x) => x.titulo,
    ruta: '/foro/hilo/',
  },
  anuncio: {
    lista: () => supabase.from('anuncios').select('id, titulo, idioma, actualizado_en, creado_en').eq('estado', 'activo'),
    texto: (x) => x.titulo,
    ruta: '/mercado/anuncio/',
  },
};

// Una sola consulta por tipo durante todo el build
const cache = {};
async function todos(tipo) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  cache[tipo] ??= TIPOS[tipo].lista().limit(5000).then(({ data, error }) => {
    if (error) { console.warn(`[paginasPublicas] ${tipo}: ${error.message}`); return []; }
    return (data || []).map((x) => ({
      id: x.id, idioma: x.idioma || 'es', slug: slugCon(TIPOS[tipo].texto(x), x.id),
      fecha: x.actualizado_en || x.creado_en,
    }));
  });
  return cache[tipo];
}

export async function parametros(tipo, lang) {
  const lista = (await todos(tipo)).filter((x) => x.idioma === lang);
  return lista.length ? lista.map((x) => ({ slug: x.slug })) : [{ slug: VACIO }];
}

// Para el sitemap: [{ url, fecha }]
export async function rutasPublicas() {
  const salida = [];
  for (const tipo of Object.keys(TIPOS)) {
    for (const x of await todos(tipo)) salida.push({ ruta: `/${x.idioma}${TIPOS[tipo].ruta}${x.slug}/`, fecha: x.fecha });
  }
  return salida;
}

// Datos de una página. Si el slug no coincide con el actual (se ha renombrado), la página apunta como
// canónica a la dirección buena.
export async function datosTanque(slug) {
  const id = idDeSlug(slug);
  if (!id || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { data: tanque } = await supabase.from('tanques').select(`*, ${AUTOR}`).eq('id', id).eq('visibilidad', 'publico').maybeSingle();
  if (!tanque) return null;
  const { data: habitantes } = await supabase.from('habitantes').select('*').eq('tanque_id', id).order('anadido_en');
  return { tanque, habitantes: habitantes || [], slug: slugCon(tanque.nombre, id) };
}

export async function datosHilo(slug) {
  const id = idDeSlug(slug);
  if (!id || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { data: hilo } = await supabase.from('foro_hilos')
    .select(`*, ${AUTOR}, tanque:tanques(id, nombre, tipo, litros, foto_url, visibilidad, idioma, creado_en)`).eq('id', id).maybeSingle();
  if (!hilo) return null;
  const { data: respuestas } = await supabase.from('foro_respuestas').select(`*, ${AUTOR}`).eq('hilo_id', id).order('creado_en');
  return { hilo, respuestas: respuestas || [], slug: slugCon(hilo.titulo, id) };
}

export async function datosAnuncio(slug) {
  const id = idDeSlug(slug);
  if (!id || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { data: anuncio } = await supabase.from('anuncios')
    .select(`*, ${AUTOR}, tienda:tiendas(nombre, slug, verificada, logo_url)`).eq('id', id).maybeSingle();
  if (!anuncio) return null;
  return { anuncio, slug: slugCon(anuncio.titulo, id) };
}

// Texto corto para la descripción de la página (meta description)
export const resumen = (texto, n = 155) => {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  return limpio.length > n ? `${limpio.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : limpio;
};
