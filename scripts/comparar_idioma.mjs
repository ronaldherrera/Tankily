// Compara las claves de un idioma con las del español: node scripts/comparar_idioma.mjs de
import { diccionarios } from '../src/i18n/diccionarios.js';

const lang = process.argv[2];
const claves = (o, p = '') => Object.entries(o).flatMap(([k, v]) => {
  const c = p ? `${p}.${k}` : k;
  return typeof v !== 'object' || Array.isArray(v) || 'otros' in v ? [c] : claves(v, c);
});
const es = new Set(claves(diccionarios.es));
const otro = new Set(claves(diccionarios[lang] || {}));
const faltan = [...es].filter((c) => !otro.has(c));
const sobran = [...otro].filter((c) => !es.has(c));
console.log(`${lang}: ${otro.size} claves · faltan ${faltan.length} · sobran ${sobran.length}`);
if (faltan.length) console.log('  faltan:', faltan.join(', '));
if (sobran.length) console.log('  sobran:', sobran.join(', '));
