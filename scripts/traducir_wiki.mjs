// Traduce los artículos de WikiTank con DeepL y guarda el resultado en WikiTank-traducciones/<idioma>.json
// (bloque a bloque: solo se traduce lo que falta o ha cambiado desde la última vez).
//
// Uso (PowerShell, la clave se escribe en la terminal y no se guarda en ningún archivo):
//   node --import ./tests/resolver.mjs scripts/traducir_wiki.mjs --prueba          → solo cuenta caracteres
//   $env:DEEPL_API_KEY="tu_clave:fx"; node --import ./tests/resolver.mjs scripts/traducir_wiki.mjs en de fr
//
// Ojo: el plan gratuito de DeepL es un crédito único de 1 millón de caracteres. Haz antes la prueba.
import fs from 'node:fs';
import path from 'node:path';
import { wikiTankTree } from '../src/lib/wikiData.js';
import { IDIOMAS_WIKI, nodoTraducible, dividir, clave, traducible, piezas, componer, proteger, restaurar } from '../src/lib/wikiTraduccion.js';
import { tituloWiki } from '../src/app/[lang]/wiki/formato.js';

const DIR = path.join(process.cwd(), 'WikiTank-traducciones');
const DESTINO = { en: 'EN-US', de: 'DE', fr: 'FR', pt: 'PT-BR', it: 'IT', nl: 'NL', pl: 'PL' };
const prueba = process.argv.includes('--prueba');
const idiomas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const objetivo = idiomas.length ? idiomas : IDIOMAS_WIKI;

// Igual que la página de WikiTank: sin la plantilla interna de las fichas
const sinPlantilla = (texto) => texto.replace(/^##\s*ESTRUCTURA DE FICHA[^\n]*\n(?:\s*```[\s\S]*?```)?\s*---[ \t]*\r?\n/, '');

// Bloques de todos los artículos traducibles y títulos de todos los nodos
const bloques = new Map();
const titulos = new Set();
(function recorrer(nodos, ruta = []) {
  for (const n of nodos) {
    const r = [...ruta, n.slug];
    titulos.add(n.title);
    if (nodoTraducible(r)) {
      for (const f of n.contentFiles || []) {
        const p = path.join(process.cwd(), 'WikiTank', f);
        if (!fs.existsSync(p)) continue;
        for (const b of dividir(sinPlantilla(fs.readFileSync(p, 'utf8')))) if (traducible(b)) bloques.set(clave(b), b);
      }
    }
    if (n.children) recorrer(n.children, r);
  }
})(wikiTankTree);

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// DeepL acepta hasta 50 textos por petición
async function deepl(textos, lang, claveApi) {
  if (textos.length > 50) {
    const salida = [];
    for (let i = 0; i < textos.length; i += 50) salida.push(...await deepl(textos.slice(i, i + 50), lang, claveApi));
    return salida;
  }
  const url = claveApi.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
  // Pausa entre peticiones y, si DeepL pide ir más despacio (429) o está saturado (5xx), reintento con espera
  for (let intento = 0; ; intento++) {
    await esperar(800);
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${claveApi}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textos, source_lang: 'ES', target_lang: DESTINO[lang], tag_handling: 'xml', ignore_tags: ['x'], preserve_formatting: true, split_sentences: 'nonewlines' }),
    });
    if (r.ok) return (await r.json()).translations.map((t) => t.text);
    if ((r.status === 429 || r.status >= 500) && intento < 8) {
      const s = Math.min(120, 5 * 2 ** intento);
      process.stdout.write(`[espera ${s} s]`);
      await esperar(s * 1000);
      continue;
    }
    throw new Error(`DeepL ${r.status}: ${await r.text()}`);
  }
}

const claveApi = process.env.DEEPL_API_KEY;
if (!prueba && !claveApi) { console.error('Falta la clave: $env:DEEPL_API_KEY="tu_clave:fx" (o usa --prueba)'); process.exit(1); }
fs.mkdirSync(DIR, { recursive: true });

let totalGeneral = 0;
for (const lang of objetivo) {
  const ruta = path.join(DIR, `${lang}.json`);
  const datos = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : { bloques: {}, titulos: {} };
  const faltan = [...bloques].filter(([k]) => !(k in datos.bloques));
  const titulosFaltan = [...titulos].filter((t) => !(t in datos.titulos));
  const coste = (b) => piezas(b).unidades.reduce((s, u) => s + proteger(u).texto.length, 0);
  const caracteres = faltan.reduce((s, [, b]) => s + coste(b), 0) + titulosFaltan.reduce((s, t) => s + tituloWiki(t).length, 0);
  totalGeneral += caracteres;
  console.log(`${lang}: ${faltan.length} bloques y ${titulosFaltan.length} títulos por traducir (~${caracteres.toLocaleString('es-ES')} caracteres)`);
  if (prueba) continue;

  // Títulos (con mayúscula inicial, como se muestran)
  for (let i = 0; i < titulosFaltan.length; i += 50) {
    const lote = titulosFaltan.slice(i, i + 50);
    const tr = await deepl(lote.map((t) => tituloWiki(t)), lang, claveApi);
    lote.forEach((t, j) => { datos.titulos[t] = tr[j]; });
  }
  // Bloques, en lotes de hasta ~25.000 caracteres (cada unidad de texto va por separado); se guarda tras cada
  // lote por si algo se corta
  let lote = [];
  let tam = 0;
  const vaciar = async () => {
    if (!lote.length) return;
    const partes = lote.map(([, b]) => { const p = piezas(b); return { ...p, protegidas: p.unidades.map(proteger) }; });
    const textos = partes.flatMap((p) => p.protegidas.map((u) => u.texto));
    const tr = await deepl(textos, lang, claveApi);
    let k = 0;
    lote.forEach(([clv], j) => {
      const p = partes[j];
      const traducidas = p.protegidas.map((u) => restaurar(tr[k++], u.trozos));
      datos.bloques[clv] = componer(p.plantilla, traducidas);
    });
    fs.writeFileSync(ruta, JSON.stringify(datos, null, 1));
    process.stdout.write('.');
    lote = []; tam = 0;
  };
  for (const par of faltan) {
    const p = piezas(par[1]);
    const n = coste(par[1]);
    if (lote.length && (tam + n > 25000 || lote.reduce((s, [, b]) => s + piezas(b).unidades.length, 0) + p.unidades.length > 45)) await vaciar();
    lote.push(par); tam += n;
  }
  await vaciar();
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 1));
  console.log(` ${lang} listo`);
}
console.log(`Total: ~${totalGeneral.toLocaleString('es-ES')} caracteres${prueba ? ' (prueba: no se ha traducido nada)' : ''}`);
