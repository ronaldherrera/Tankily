import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { wikiTankTree } from '@/lib/wikiData';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import { tituloWiki } from '../../formato';
import ExplorerClient from './ExplorerClient';
import { slugsPorTitulo } from '@/lib/catalogoEspecies';
import { IDIOMAS_WIKI, nodoTraducible, contenidoTraducido, titulosTraducidos } from '@/lib/wikiTraduccion';

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';

// Función para encontrar el nodo en el árbol basado en el array de slugs
function findNodeByPath(nodes, pathArray) {
  if (!pathArray || pathArray.length === 0) return null;
  const currentSlug = pathArray[0];
  const node = nodes.find(n => n.slug === currentSlug);

  if (!node) return null;
  if (pathArray.length === 1) return node;

  return findNodeByPath(node.children, pathArray.slice(1));
}

// Nodos desde la raíz hasta el actual (para las migas de pan)
function cadena(nodos, ruta) {
  const salida = [];
  let nivel = nodos;
  for (const slug of ruta) {
    const nodo = nivel?.find((n) => n.slug === slug);
    if (!nodo) break;
    salida.push(nodo);
    nivel = nodo.children;
  }
  return salida;
}

// Algunas páginas de grupo de especies empiezan con la plantilla interna para redactar fichas
// ("## ESTRUCTURA DE FICHA DE CORAL" + bloque de código + ---). No es para lectores: se omite al
// mostrarla, sin tocar el archivo.
const sinPlantilla = (texto) => texto.replace(/^##\s*ESTRUCTURA DE FICHA[^\n]*\n(?:\s*```[\s\S]*?```)?\s*---[ \t]*\r?\n/, '');

// Contenido de todos los archivos Markdown del nodo (solo lectura de WikiTank)
function leerContenido(nodo) {
  if (!nodo?.contentFiles?.length) return '';
  return nodo.contentFiles
    .map((file) => {
      const fullPath = path.join(process.cwd(), 'WikiTank', file);
      return fs.existsSync(fullPath) ? sinPlantilla(fs.readFileSync(fullPath, 'utf8')) : '';
    })
    .filter(Boolean)
    .join('\n\n---\n\n');
}

// Páginas que son solo fichas (sin un párrafo de texto): la descripción enumera las especies
function fichasDe(contenido, titulo) {
  const nombres = [...contenido.matchAll(/^###\s+(.+)$/gm)].map((m) => m[1].replace(/\s*\(.*$/, '').trim()).filter(Boolean);
  if (!nombres.length || !titulo) return undefined;
  const resto = nombres.length > 5 ? ` y ${nombres.length - 5} más` : '';
  return `${titulo}: fichas de ${nombres.slice(0, 5).join(', ')}${resto}, con temperatura, pH, tamaño y cuidados.`;
}

// Primer párrafo de texto, sin Markdown, para la meta descripción (~155 caracteres)
function resumen(contenido, titulo) {
  const sinCodigo = contenido.replace(/```[\s\S]*?```/g, '');
  const parrafo = sinCodigo.split(/\n\s*\n/).map((p) => p.trim())
    .find((p) => p && !/^(#|!\[|\||-{3,}|>|\*\*[^*]+\*\*:)/.test(p) && p.length > 60);
  if (!parrafo) return fichasDe(sinCodigo, titulo);
  const limpio = parrafo
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return limpio.length > 155 ? `${limpio.slice(0, 152).replace(/\s+\S*$/, '')}…` : limpio;
}

// Versión de la página en un idioma: título, contenido y si está traducida (lib/wikiTraduccion.js).
// En los idiomas sin traducción todavía (o en las páginas de grupos de especies) el contenido va en español.
function enIdioma(nodo, pathArray, lang) {
  const contenido = leerContenido(nodo);
  const titulos = lang === 'es' ? {} : titulosTraducidos(lang);
  const nombre = (titulo) => titulos[titulo] || tituloWiki(titulo);
  if (lang === 'es' || !IDIOMAS_WIKI.includes(lang)) return { contenido, nombre, traducido: lang === 'es' };
  const traducido = nodoTraducible(pathArray) && !!titulos[nodo.title] && (!contenido || contenidoTraducido(contenido, lang) != null);
  return { contenido: traducido && contenido ? contenidoTraducido(contenido, lang) : contenido, nombre, traducido };
}

// Generar todos los caminos posibles para exportación estática: en español y en los idiomas con
// traducción (IDIOMAS_WIKI). En los demás no se genera (el .htaccess y conIdioma llevan a /es/).
export async function generateStaticParams({ params }) {
  const { lang } = await params;
  // Next exige al menos una ruta por idioma: en los demás, una vacía que da 404 (el .htaccess redirige a /es/)
  if (lang !== 'es' && !IDIOMAS_WIKI.includes(lang)) return [{ path: ['_'] }];
  const paths = [];

  function collectPaths(nodes, currentPath = []) {
    for (const node of nodes) {
      const nodePath = [...currentPath, node.slug];
      paths.push({ path: nodePath });
      if (node.children) {
        collectPaths(node.children, nodePath);
      }
    }
  }

  collectPaths(wikiTankTree);
  return paths;
}

// Las páginas traducidas se indexan en su idioma y enlazan entre sí (hreflang); las que siguen en español
// apuntan a la versión española y no se indexan
export async function generateMetadata({ params }) {
  const { lang, path: pathArray } = await params;
  const nodo = findNodeByPath(wikiTankTree, pathArray);
  if (!nodo) return {};
  const ruta = `/wiki/explorer/${pathArray.join('/')}/`;
  const v = enIdioma(nodo, pathArray, lang);
  const conTraduccion = nodoTraducible(pathArray) && IDIOMAS_WIKI.some((l) => enIdioma(nodo, pathArray, l).traducido);
  return {
    title: `${v.nombre(nodo.title)} · WikiTank`,
    description: resumen(v.contenido, v.nombre(nodo.title)),
    alternates: v.traducido ? {
      canonical: `/${lang}${ruta}`,
      languages: conTraduccion ? Object.fromEntries([['es', `/es${ruta}`], ...IDIOMAS_WIKI.filter((l) => enIdioma(nodo, pathArray, l).traducido).map((l) => [l, `/${l}${ruta}`]), ['x-default', `/es${ruta}`]]) : undefined,
    } : { canonical: `/es${ruta}` },
    robots: v.traducido ? undefined : { index: false, follow: true },
  };
}

export default async function WikiExplorerPage({ params }) {
  const { lang, path: pathArray } = await params;
  const currentNode = findNodeByPath(wikiTankTree, pathArray);

  if (!currentNode) notFound();

  const v = enIdioma(currentNode, pathArray, lang);
  const content = v.contenido;
  const idiomaPagina = v.traducido ? lang : 'es';
  // Las páginas con fichas de especies (tipos de acuario, koi) enlazan cada ficha con su página propia
  const conEspecies = currentNode.children?.some((c) => /especies habituales/i.test(c.title)) || pathArray.includes('estanques-koi');

  // Datos estructurados para Google: artículo de WikiTank (en el idioma de la página) y migas de pan
  const rutaCanonica = `/${idiomaPagina}/wiki/explorer/${pathArray.join('/')}/`;
  const articulo = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: v.nombre(currentNode.title),
    description: resumen(content, v.nombre(currentNode.title)),
    inLanguage: idiomaPagina,
    url: `${URL_SITIO}${rutaCanonica}`,
    ...(currentNode.previewImage ? { image: `${URL_SITIO}${encodeURI(currentNode.previewImage)}` } : {}),
    isPartOf: { '@type': 'WebSite', name: 'WikiTank · Tankily', url: `${URL_SITIO}/${idiomaPagina}/wiki/` },
    publisher: { '@type': 'Organization', name: 'Tankily', logo: { '@type': 'ImageObject', url: `${URL_SITIO}/icons/icon-512.png` } },
  };
  const nodos = cadena(wikiTankTree, pathArray);
  const miga = migas([
    ['WikiTank', `/${idiomaPagina}/wiki/`],
    ...nodos.map((n, i) => [v.nombre(n.title), `/${idiomaPagina}/wiki/explorer/${pathArray.slice(0, i + 1).join('/')}/`]),
  ]);
  // Títulos para la pantalla (nodo actual, subsecciones y migas) en el idioma de la página
  const titulos = Object.fromEntries([currentNode, ...nodos, ...(currentNode.children || [])].map((n) => [n.title, v.nombre(n.title)]));

  return (
    <>
      <JsonLd datos={[articulo, miga]} />
      <ExplorerClient
        currentNode={currentNode}
        pathArray={pathArray}
        content={content}
        titulos={titulos}
        migas={nodos.map((n) => titulos[n.title])}
        traducido={v.traducido}
        slugsEspecies={conEspecies ? slugsPorTitulo() : null}
      />
    </>
  );
}
