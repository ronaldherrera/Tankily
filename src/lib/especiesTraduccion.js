// Traducción de las fichas de especies de WikiTank (solo en el servidor, al construir la web).
// Una ficha es una lista de "**Dato**: valor" y unas notas. Como los datos se repiten muchísimo entre especies
// («**Comportamiento**: pacífico» sale en cientos), no se traduce ficha a ficha sino pieza a pieza: cada rótulo,
// cada valor (con su rótulo, para que DeepL sepa de qué habla) y cada línea de texto una sola vez. Las
// traducciones van en WikiTank-traducciones/especies-<idioma>.json (las genera scripts/traducir_especies.mjs).
// Una ficha solo se publica traducida (y se indexa en ese idioma) si están todas sus piezas; si falta alguna se
// muestra en español con noindex, como antes.
import fs from 'node:fs';
import path from 'node:path';
import { clave, piezas, componer } from './wikiTraduccion.js';

// Valores que no se traducen nunca (nombres científicos)
const VALOR_LITERAL = new Set(['Familia']);
// El origen es una lista de países y regiones: se traduce cada uno por separado
const VALOR_LISTA = new Set(['Origen']);

// ¿Tiene palabras que traducir, más allá de cifras y unidades?
export const conTexto = (s) => /\p{L}{2,}/u.test(s.replace(/°?[CF]\b|\b(cm|mm|ppm|ppt|dGH|dKH|TDS|pH|KH|GH|L|l)\b/g, ''));

// Una ficha son primero datos («**Dato**: valor») y, desde las notas o la descripción, texto
export function lineasFicha(contenido) {
  const lineas = [];
  let enDatos = true;
  for (const linea of (contenido || '').split('\n')) {
    const limpia = linea.trim();
    const dato = limpia.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
    if (!limpia || limpia.startsWith('![') || limpia === '---') lineas.push({ tipo: 'fija', linea });
    else if (dato && enDatos && !/nota|descrip/i.test(dato[1])) lineas.push({ tipo: 'dato', rotulo: dato[1].trim(), valor: dato[2].trim() });
    else { if (dato) enDatos = false; lineas.push({ tipo: 'texto', linea }); }
  }
  return lineas;
}

// En el texto se conservan las líneas en blanco (párrafos) pero no las imágenes ni los separadores
const enTexto = (texto, linea) => texto.length > 0 && !linea.trim().startsWith('![') && linea.trim() !== '---';

// { datos: [[rótulo, valor]], texto } de una ficha en español, como la pinta FichaEspecieContenido
export function separarFicha(contenido) {
  const datos = [], texto = [];
  for (const l of lineasFicha(contenido)) {
    if (l.tipo === 'dato') datos.push([l.rotulo, l.valor]);
    else if (l.tipo === 'texto' || enTexto(texto, l.linea)) texto.push(l.linea);
  }
  return { datos, texto: texto.join('\n').trim() };
}

// Lo que hay que traducir de un valor: nada, el valor entero o cada elemento de la lista
export function piezasValor(rotulo, valor) {
  if (VALOR_LITERAL.has(rotulo) || !conTexto(valor)) return [];
  if (VALOR_LISTA.has(rotulo)) return valor.split(/\s*,\s*/).filter(conTexto).map((v) => `${rotulo}|${v}`);
  return [`${rotulo}|${valor}`];
}

// Unidades de texto de una línea libre (sin marcas de lista, cita…), con su clave
export const unidadesTexto = (linea) => piezas(linea).unidades.map((u) => ({ clave: clave(u), texto: u }));

const DIR = path.join(process.cwd(), 'WikiTank-traducciones');
const cache = {};
export function traduccionesEspecies(lang) {
  if (process.env.NODE_ENV !== 'production' || !(lang in cache)) {
    const ruta = path.join(DIR, `especies-${lang}.json`);
    cache[lang] = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : null;
  }
  return cache[lang];
}

// Ficha traducida { datos, texto, comun, otrosNombres, grupo, acuarios } o null si falta algo
const memo = new Map();
export function fichaTraducida(e, lang) {
  const k = `${lang}|${e.slug}`;
  if (memo.has(k) && process.env.NODE_ENV === 'production') return memo.get(k);
  const tr = traduccionesEspecies(lang);
  let res = null;
  if (tr) res = traducir(e, tr);
  memo.set(k, res);
  return res;
}

function traducir(e, tr) {
  const { rotulos = {}, valores = {}, textos = {}, nombres = {}, grupos = {}, acuarios = {} } = tr;
  const datos = [], texto = [];
  for (const l of lineasFicha(e.contenido)) {
    if (l.tipo === 'fija') { if (enTexto(texto, l.linea)) texto.push(l.linea); continue; }
    if (l.tipo === 'dato') {
      const rotulo = rotulos[l.rotulo];
      if (rotulo == null) return null;
      let valor = l.valor;
      if (VALOR_LISTA.has(l.rotulo) && !VALOR_LITERAL.has(l.rotulo)) {
        const partes = valor.split(/\s*,\s*/).map((v) => (conTexto(v) ? valores[`${l.rotulo}|${v}`] : v));
        if (partes.some((v) => v == null)) return null;
        valor = partes.join(', ');
      } else if (piezasValor(l.rotulo, valor).length) {
        valor = valores[`${l.rotulo}|${valor}`];
        if (valor == null) return null;
      }
      datos.push([rotulo, valor]);
      continue;
    }
    const p = piezas(l.linea);
    const traducidas = p.unidades.map((u) => textos[clave(u)]);
    if (traducidas.some((t) => t == null)) return null;
    texto.push(componer(p.plantilla, traducidas));
  }
  const nombre = (n) => nombres[n];
  if (e.comun && nombre(e.comun) == null) return null;
  if (e.otrosNombres.some((n) => nombre(n) == null)) return null;
  if (grupos[e.grupo] == null) return null;
  if (e.acuarios.some((a) => acuarios[a.acuario] == null)) return null;
  return {
    datos,
    texto: texto.join('\n').trim(),
    comun: e.comun ? nombre(e.comun) : null,
    otrosNombres: [...new Set(e.otrosNombres.map(nombre).filter((n) => n && n !== nombre(e.comun)))],
    grupo: grupos[e.grupo],
    acuarios: e.acuarios.map((a) => ({ ...a, acuario: acuarios[a.acuario] })),
  };
}
