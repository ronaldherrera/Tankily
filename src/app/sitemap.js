import { IDIOMAS, IDIOMAS_FICHAS } from '@/i18n/config';
import { wikiTankTree } from '@/lib/wikiData';
import { catalogoEspecies } from '@/lib/catalogoEspecies';
import { HERRAMIENTAS } from '@/lib/herramientas';
import { FORO_CATEGORIAS, TIPOS_TANQUE, slugTipo } from '@/lib/constantes';
import { rutasPublicas } from '@/lib/paginasPublicas';
import { IDIOMAS_WIKI, nodoTraducible, titulosTraducidos } from '@/lib/wikiTraduccion';
import { fichaTraducida } from '@/lib/especiesTraduccion';
import { DOCS_LEGALES } from '@/lib/legales';

// sitemap.xml: páginas indexables en todos los idiomas (con sus alternativas hreflang), WikiTank (de momento
// solo en español) y el contenido público de la comunidad (lib/paginasPublicas.js).
export const dynamic = 'force-static';

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';
const LEGALES = DOCS_LEGALES;

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

// [ruta, ¿traducible?, título] de cada página de WikiTank
function rutasWiki(nodos, prefijo = []) {
  return nodos.flatMap((n) => {
    const ruta = [...prefijo, n.slug];
    return [[ruta.join('/'), nodoTraducible(ruta), n.title], ...(n.children ? rutasWiki(n.children, ruta) : [])];
  });
}

export default async function sitemap() {
  const ahora = new Date();
  const paginas = RUTAS.flatMap(([ruta, prioridad, frecuencia]) => IDIOMAS.map((lang) => ({
    url: `${URL_SITIO}/${lang}${ruta}`,
    lastModified: ahora,
    changeFrequency: frecuencia,
    priority: prioridad,
    alternates: { languages: Object.fromEntries(IDIOMAS.map((l) => [l, `${URL_SITIO}/${l}${ruta}`])) },
  })));
  // WikiTank: en español y, si están traducidas, en los idiomas de IDIOMAS_WIKI (con sus alternativas)
  const wiki = rutasWiki(wikiTankTree).flatMap(([ruta, traducible, titulo]) => {
    const idiomas = ['es', ...IDIOMAS_WIKI.filter((l) => traducible && titulosTraducidos(l)[titulo])];
    const url = (l) => `${URL_SITIO}/${l}/wiki/explorer/${encodeURI(ruta)}/`;
    const alternates = idiomas.length > 1 ? { languages: Object.fromEntries(idiomas.map((l) => [l, url(l)])) } : undefined;
    return idiomas.map((l) => ({ url: url(l), lastModified: ahora, changeFrequency: 'monthly', priority: 0.6, alternates }));
  });
  // Catálogo y fichas de especies de WikiTank: en español y, las que están traducidas enteras, en los idiomas de
  // IDIOMAS_FICHAS (con sus alternativas)
  const especies = [
    ...['es', ...IDIOMAS_FICHAS].map((l, _, todos) => ({
      url: `${URL_SITIO}/${l}/wiki/especies/`, lastModified: ahora, changeFrequency: 'weekly', priority: 0.8,
      alternates: { languages: Object.fromEntries(todos.map((o) => [o, `${URL_SITIO}/${o}/wiki/especies/`])) },
    })),
    ...catalogoEspecies().flatMap((e) => {
      const idiomas = ['es', ...IDIOMAS_FICHAS.filter((l) => fichaTraducida(e, l))];
      const url = (l) => `${URL_SITIO}/${l}/wiki/especies/${e.slug}/`;
      const alternates = idiomas.length > 1 ? { languages: Object.fromEntries(idiomas.map((l) => [l, url(l)])) } : undefined;
      return idiomas.map((l) => ({ url: url(l), lastModified: ahora, changeFrequency: 'monthly', priority: 0.7, alternates }));
    }),
  ];
  // Tanques públicos, hilos del foro y anuncios activos (cada uno en su idioma; se actualiza cada noche)
  const comunidad = (await rutasPublicas()).map(({ ruta, fecha }) => ({
    url: `${URL_SITIO}${ruta}`,
    lastModified: fecha ? new Date(fecha) : ahora,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));
  return [...paginas, ...wiki, ...especies, ...comunidad];
}
