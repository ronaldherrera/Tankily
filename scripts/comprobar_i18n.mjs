// Comprueba las traducciones:
//  1. Que cada clave t('…') usada en el código existe en todos los idiomas.
//  2. Que los dos diccionarios tienen las mismas claves.
//  3. Avisa de textos en español que se hayan quedado escritos directamente en JSX.
// Uso: node scripts/comprobar_i18n.mjs
import fs from 'fs';
import path from 'path';
import { diccionarios } from '../src/i18n/diccionarios.js';

const RAIZ = 'src';
const archivos = [];
(function recorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['i18n'].includes(e.name)) recorrer(ruta); }
    else if (ruta.endsWith('.js') && !ruta.includes('wikiData') && !ruta.includes('especiesWiki')) archivos.push(ruta);
  }
})(RAIZ);

const existe = (dic, clave) => clave.split('.').reduce((n, p) => (n == null ? undefined : n[p]), dic) !== undefined;

function claves(obj, prefijo = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const c = prefijo ? `${prefijo}.${k}` : k;
    const esHoja = typeof v !== 'object' || Array.isArray(v) || 'otros' in v;
    return esHoja ? [c] : claves(v, c);
  });
}

let errores = 0;

// 1. Claves usadas
for (const f of archivos) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.-]+)'/g)) {
    for (const lang of Object.keys(diccionarios)) {
      if (!existe(diccionarios[lang], m[1])) { console.log(`✗ ${f}: falta "${m[1]}" en ${lang}`); errores++; }
    }
  }
  // Claves dinámicas t(`seccion.${x}`): comprobar que la sección existe
  for (const m of src.matchAll(/\bt\(\s*`([a-zA-Z0-9_.-]+)\.\$\{/g)) {
    for (const lang of Object.keys(diccionarios)) {
      if (!existe(diccionarios[lang], m[1])) { console.log(`✗ ${f}: falta la sección "${m[1]}" en ${lang}`); errores++; }
    }
  }
}

// 2. Mismas claves en todos los idiomas
const [base, ...resto] = Object.keys(diccionarios);
const clavesBase = new Set(claves(diccionarios[base]));
for (const lang of resto) {
  const clavesLang = new Set(claves(diccionarios[lang]));
  for (const c of clavesBase) if (!clavesLang.has(c)) { console.log(`✗ "${c}" está en ${base} pero no en ${lang}`); errores++; }
  for (const c of clavesLang) if (!clavesBase.has(c)) { console.log(`✗ "${c}" está en ${lang} pero no en ${base}`); errores++; }
}

// 3. Texto en español escrito directamente en JSX (aviso, no error)
let avisos = 0;
for (const f of archivos) {
  const lineas = fs.readFileSync(f, 'utf8').split('\n');
  lineas.forEach((l, i) => {
    if (/^\s*(\/\/|\*)/.test(l)) return;
    const jsx = l.match(/>\s*([A-ZÁÉÍÓÚ¿¡][a-záéíóúñ]+(?:\s+[a-záéíóúñ]+){1,})\s*</);
    const atributo = l.match(/(placeholder|aria-label|title|titulo)="([^"]*[a-záéíóúñ]{3,}[^"]*)"/);
    if (jsx || atributo) { console.log(`⚠ ${f}:${i + 1}: ${(jsx?.[1] || atributo?.[2]).slice(0, 70)}`); avisos++; }
  });
}

console.log(`\n${errores} errores, ${avisos} avisos`);
process.exit(errores ? 1 : 0);
