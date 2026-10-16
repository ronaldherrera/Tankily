import { IDIOMAS, LOCALES } from '@/i18n/config';
import { wikiTankTree } from '@/lib/wikiData';
import { catalogoEspecies } from '@/lib/catalogoEspecies';
import { HERRAMIENTAS } from '@/lib/herramientas';
import { FORO_CATEGORIAS, TIPOS_TANQUE, slugTipo } from '@/lib/constantes';

// sitemap.xml: páginas indexables en todos los idiomas (con sus alternativas hreflang)
// y WikiTank, que de momento solo se indexa en español.
export const dynamic = 'force-static';

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';
const LEGALES = ['aviso-legal', 'privacidad', 'cookies', 'normas'];

const RUTAS = [
  ['/', 1, 'daily'],
  ['/foro/', 0.9, 'daily'],
  ...FORO_CATEGORIAS.map((c) => [`/foro/${c.slug}/`, 0.7, 'daily']),
  ['/tanques/', 0.8, 'daily'],
  ...Object.keys(TIPOS_TANQUE).filter((k) => k !== 'otro').map((k) => [`/tanques/${slugTipo(k)}/`, 0.6, 'daily']),
  ['/mercado/', 0.8, 'daily'],
  ['/tiendas/', 0.7, 'weekly'],
  ['/tiendas/pro/', 0.6, 'monthly'],
  ['/wiki/', 0.8, 'weekly'],
  ['/herramientas/', 0.8, 'monthly'],
  ...HERRAMIENTAS.map((h) => [`/herramientas/${h.clave}/`, 0.7, 'monthly']),
  ['/apoyar/', 0.3, 'monthly'],
  ...LEGALES.map((d) => [`/legal/${d}/`, 0.2, 'yearly']),
];

function rutasWiki(nodos, prefijo = []) {
  return nodos.flatMap((n) => {
    const ruta = [...prefijo, n.slug];
    return [ruta.join('/'), ...(n.children ? rutasWiki(n.children, ruta) : [])];
  });
}

export default function sitemap() {
  const ahora = new Date();
  const paginas = RUTAS.flatMap(([ruta, prioridad, frecuencia]) => IDIOMAS.map((lang) => ({
    url: `${URL_SITIO}/${lang}${ruta}`,
    lastModified: ahora,
    changeFrequency: frecuencia,
    priority: prioridad,
    alternates: { languages: Object.fromEntries(IDIOMAS.map((l) => [LOCALES[l], `${URL_SITIO}/${l}${ruta}`])) },
  })));
  const wiki = rutasWiki(wikiTankTree).map((ruta) => ({
    url: `${URL_SITIO}/es/wiki/explorer/${encodeURI(ruta)}/`,
    lastModified: ahora,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  // Catálogo y fichas de especies de WikiTank (en español, como el resto de la wiki)
  const especies = [
    { url: `${URL_SITIO}/es/wiki/especies/`, lastModified: ahora, changeFrequency: 'weekly', priority: 0.8 },
    ...catalogoEspecies().map((e) => ({ url: `${URL_SITIO}/es/wiki/especies/${e.slug}/`, lastModified: ahora, changeFrequency: 'monthly', priority: 0.7 })),
  ];
  return [...paginas, ...wiki, ...especies];
}
