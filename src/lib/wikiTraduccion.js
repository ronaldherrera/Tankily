// Traducción de los artículos de WikiTank (solo en el servidor, al construir la web).
// Las traducciones se guardan bloque a bloque en WikiTank-traducciones/<idioma>.json (las genera
// scripts/traducir_wiki.mjs con DeepL): cada bloque del Markdown español (párrafo, lista, tabla, título…)
// se identifica por un resumen de su texto, así que al cambiar un artículo solo se retraduce lo que cambió.
// Las páginas de grupos de especies (listas de fichas) no se traducen: las fichas ya existen en cada idioma.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export { IDIOMAS_WIKI } from '../i18n/config.js';

// Nodos que se traducen: todo menos las páginas de "Especies habituales"
export const nodoTraducible = (ruta) => !ruta.includes('especies-habituales');

// Bloques separados por líneas en blanco; los bloques de código (```) van enteros aunque tengan líneas vacías
export function dividir(texto) {
  const bloques = [];
  let actual = [];
  let enCodigo = false;
  for (const linea of texto.replace(/\r\n/g, '\n').split('\n')) {
    if (/^\s*```/.test(linea)) enCodigo = !enCodigo;
    if (!enCodigo && !linea.trim()) {
      if (actual.length) { bloques.push(actual.join('\n')); actual = []; }
    } else actual.push(linea);
  }
  if (actual.length) bloques.push(actual.join('\n'));
  return bloques;
}

export const clave = (bloque) => crypto.createHash('sha1').update(bloque.trim()).digest('hex').slice(0, 16);

// ¿Tiene texto que traducir? (no: código, separadores, solo imágenes o solo símbolos)
export function traducible(bloque) {
  const b = bloque.trim();
  if (!b || /^```/.test(b) || /^-{3,}$/.test(b)) return false;
  const sinMarcas = b.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\]\([^)]*\)/g, ']').replace(/https?:\/\/\S+/g, '');
  return /\p{L}{2,}/u.test(sinMarcas);
}

// Un bloque se parte en "unidades" de texto que se traducen por separado (cada línea de una lista, cada celda
// de una tabla…): la estructura (marcas de lista, barras de tabla, saltos de línea) se queda aquí y no se manda
// a DeepL, que cobra por carácter. Dentro de cada unidad, los enlaces y las negritas van como etiquetas que
// DeepL traduce por dentro (<a i="n">texto</a>, <b>…</b>) y lo intocable (imágenes, código, direcciones)
// como <x i="n"/>. Todo con tag_handling xml.
const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const desescapar = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const SEPARADOR_TABLA = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const MARCA = /^(\s*(?:#{1,6}|[-*+]|\d+[.)]|>)\s+)/;
const tieneTexto = (s) => /\p{L}{2,}/u.test(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/https?:\/\/\S+/g, ''));

export function piezas(bloque) {
  const plantilla = [];   // líneas con huecos {n}
  const unidades = [];
  const hueco = (texto) => {
    if (!tieneTexto(texto)) return texto;
    unidades.push(texto.trim());
    const ini = texto.match(/^\s*/)[0], fin = texto.match(/\s*$/)[0];
    return `${ini}\u0001${unidades.length - 1}\u0001${fin}`;
  };
  for (const linea of bloque.split('\n')) {
    if (SEPARADOR_TABLA.test(linea)) { plantilla.push(linea); continue; }
    if (/^\s*\|/.test(linea)) { plantilla.push(linea.split('|').map(hueco).join('|')); continue; }
    const m = linea.match(MARCA);
    plantilla.push(m ? m[1] + hueco(linea.slice(m[1].length)) : hueco(linea));
  }
  return { plantilla: plantilla.join('\n'), unidades };
}

export const componer = (plantilla, traducidas) => plantilla.replace(/\u0001(\d+)\u0001/g, (_, n) => traducidas[Number(n)] ?? '');

export function proteger(unidad) {
  const trozos = [];
  const guardar = (t) => { trozos.push(t); return `\u0002${trozos.length - 1}\u0002`; };
  let s = unidad
    .replace(/!\[[^\]]*\]\([^)]*\)|`[^`\n]+`|https?:\/\/[^\s)<]+/g, (m) => guardar(m))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, texto, url) => { trozos.push(url); return `\u0003${trozos.length - 1}\u0003${texto}\u0004`; });
  s = escapar(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\u0002(\d+)\u0002/g, '<x i="$1"/>')
    .replace(/\u0003(\d+)\u0003/g, '<a i="$1">').replace(/\u0004/g, '</a>');
  return { texto: s, trozos };
}

export function restaurar(traducido, trozos) {
  return desescapar(traducido
    .replace(/<x i="(\d+)"\s*\/>/g, (_, n) => `\u0005${n}\u0005`)
    .replace(/<a i="(\d+)">([\s\S]*?)<\/a>/g, (_, n, t) => `[${t}](\u0005${n}\u0005)`)
    .replace(/<b>([\s\S]*?)<\/b>/g, '**$1**'))
    .replace(/\u0005(\d+)\u0005/g, (_, n) => trozos[Number(n)] ?? '');
}

// ---- Uso en el build -------------------------------------------------------------------------

const DIR = path.join(process.cwd(), 'WikiTank-traducciones');
const cache = {};
export function traducciones(lang) {
  // En desarrollo se relee siempre (para ver al momento lo que traduce el script); en el build, una vez
  if (process.env.NODE_ENV !== 'production' || !(lang in cache)) {
    const ruta = path.join(DIR, `${lang}.json`);
    cache[lang] = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : null;
  }
  return cache[lang];
}

// Contenido traducido de un artículo, o null si falta alguna parte (entonces se muestra en español)
export function contenidoTraducido(texto, lang) {
  const tr = traducciones(lang);
  if (!tr) return null;
  const salida = [];
  for (const bloque of dividir(texto)) {
    if (!traducible(bloque)) { salida.push(bloque); continue; }
    const t = tr.bloques?.[clave(bloque)];
    if (t == null) return null;
    salida.push(t);
  }
  return salida.join('\n\n');
}

// Títulos de los nodos traducidos: { "ACUARIOS DE AGUA FRÍA": "Cold-water aquariums", … }
export const titulosTraducidos = (lang) => traducciones(lang)?.titulos || {};
