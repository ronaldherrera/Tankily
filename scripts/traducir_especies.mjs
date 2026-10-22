// Traduce las fichas de especies de WikiTank con DeepL, pieza a pieza (src/lib/especiesTraduccion.js), y guarda el
// resultado en WikiTank-traducciones/especies-<idioma>.json. Solo traduce lo que falta, por orden de prioridad
// (rótulos, grupos, acuarios, valores, nombres y por último las notas) y, antes de cada lote, mira el saldo de
// DeepL: si no llega, para y guarda lo hecho. Las fichas que queden sin completar siguen en español con noindex.
//
// Uso (PowerShell, la clave se escribe en la terminal y no se guarda en ningún archivo):
//   node --import ./tests/resolver.mjs scripts/traducir_especies.mjs --prueba           → solo cuenta caracteres
//   $env:DEEPL_API_KEY="tu_clave:fx"; node --import ./tests/resolver.mjs scripts/traducir_especies.mjs en
import fs from 'node:fs';
import path from 'node:path';
import { catalogoEspecies } from '../src/lib/catalogoEspecies.js';
import { proteger, restaurar } from '../src/lib/wikiTraduccion.js';
import { lineasFicha, piezasValor, unidadesTexto, fichaTraducida } from '../src/lib/especiesTraduccion.js';

const DIR = path.join(process.cwd(), 'WikiTank-traducciones');
const DESTINO = { en: 'EN-US', de: 'DE', fr: 'FR', pt: 'PT-BR', it: 'IT', nl: 'NL', pl: 'PL' };
const prueba = process.argv.includes('--prueba');
const idiomas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const objetivo = idiomas.length ? idiomas : ['en'];
const MARGEN = 5000; // caracteres de DeepL que se dejan sin gastar

// Todo lo traducible del catálogo, por apartado: { clave: { texto, contexto } }
const cat = catalogoEspecies();
const apartados = { rotulos: new Map(), grupos: new Map(), acuarios: new Map(), valores: new Map(), nombres: new Map(), textos: new Map() };
for (const e of cat) {
  for (const l of lineasFicha(e.contenido)) {
    if (l.tipo === 'dato') {
      apartados.rotulos.set(l.rotulo, { texto: l.rotulo, contexto: 'Nombre de un dato en la ficha de una especie de acuario.' });
      for (const k of piezasValor(l.rotulo, l.valor)) {
        const texto = k.slice(k.indexOf('|') + 1);
        apartados.valores.set(k, { texto, contexto: `Valor del dato «${l.rotulo}» en la ficha de una especie de acuario.`, grupo: l.rotulo });
      }
    } else if (l.tipo === 'texto') {
      for (const u of unidadesTexto(l.linea)) apartados.textos.set(u.clave, { texto: u.texto, contexto: `Notas de la ficha de ${e.cientifico || e.comun}, especie de acuario.` });
    }
  }
  for (const n of [e.comun, ...e.otrosNombres].filter(Boolean)) apartados.nombres.set(n, { texto: n, contexto: `Nombre común de ${e.cientifico || 'una especie'} (especie de acuario).` });
  apartados.grupos.set(e.grupo, { texto: e.grupo, contexto: 'Grupo de especies de acuario (título de sección).' });
  for (const a of e.acuarios) apartados.acuarios.set(a.acuario, { texto: a.acuario, contexto: 'Tipo de acuario (título de sección).' });
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const claveApi = process.env.DEEPL_API_KEY;
const urlBase = claveApi?.endsWith(':fx') ? 'https://api-free.deepl.com/v2' : 'https://api.deepl.com/v2';

async function saldo() {
  const r = await fetch(`${urlBase}/usage`, { headers: { Authorization: `DeepL-Auth-Key ${claveApi}` } });
  if (!r.ok) throw new Error(`DeepL ${r.status}: ${await r.text()}`);
  const u = await r.json();
  return u.character_limit - u.character_count;
}

// Hasta 50 textos por petición, con el mismo contexto (DeepL no cobra el contexto)
async function deepl(textos, lang, contexto) {
  for (let intento = 0; ; intento++) {
    await esperar(800);
    const r = await fetch(`${urlBase}/translate`, {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${claveApi}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textos, source_lang: 'ES', target_lang: DESTINO[lang], context: contexto, tag_handling: 'xml', ignore_tags: ['x'], preserve_formatting: true, split_sentences: 'nonewlines' }),
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

if (!prueba && !claveApi) { console.error('Falta la clave: $env:DEEPL_API_KEY="tu_clave:fx" (o usa --prueba)'); process.exit(1); }
fs.mkdirSync(DIR, { recursive: true });

for (const lang of objetivo) {
  if (!DESTINO[lang]) { console.error(`Idioma desconocido: ${lang}`); continue; }
  const ruta = path.join(DIR, `especies-${lang}.json`);
  const datos = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : {};
  for (const a of Object.keys(apartados)) datos[a] ||= {};
  const faltan = Object.entries(apartados).map(([a, m]) => [a, [...m].filter(([k]) => !(k in datos[a]))]);
  const coste = (x) => proteger(x.texto).texto.length;
  let total = 0;
  for (const [a, lista] of faltan) {
    const c = lista.reduce((s, [, x]) => s + coste(x), 0);
    total += c;
    console.log(`${lang} · ${a}: ${lista.length} por traducir (~${c.toLocaleString('es-ES')} caracteres)`);
  }
  console.log(`${lang} · total: ~${total.toLocaleString('es-ES')} caracteres`);
  if (prueba) continue;

  let disponible = await saldo();
  console.log(`Saldo de DeepL: ${disponible.toLocaleString('es-ES')} caracteres`);
  let parado = false;
  for (const [a, lista] of faltan) {
    if (parado) break;
    // Lotes con el mismo contexto (los valores, por rótulo; el resto, por apartado) de hasta 50 textos y ~20.000 caracteres
    const porContexto = new Map();
    for (const par of lista) {
      const ctx = a === 'textos' ? 'Notas de la ficha de una especie de acuario.' : par[1].contexto;
      if (!porContexto.has(ctx)) porContexto.set(ctx, []);
      porContexto.get(ctx).push(par);
    }
    for (const [ctx, pares] of porContexto) {
      for (let i = 0; i < pares.length && !parado;) {
        const lote = [];
        let tam = 0;
        while (i < pares.length && lote.length < 50 && tam + coste(pares[i][1]) < 20000) { tam += coste(pares[i][1]); lote.push(pares[i++]); }
        if (!lote.length) lote.push(pares[i++]);
        if (tam > disponible - MARGEN) { parado = true; console.log(`\nSin saldo suficiente para seguir (quedan ${disponible.toLocaleString('es-ES')}).`); break; }
        const protegidos = lote.map(([, x]) => proteger(x.texto));
        const tr = await deepl(protegidos.map((p) => p.texto), lang, ctx);
        lote.forEach(([k], j) => { datos[a][k] = restaurar(tr[j], protegidos[j].trozos).trim(); });
        disponible -= tam;
        fs.writeFileSync(ruta, JSON.stringify(datos, null, 1));
        process.stdout.write('.');
      }
      if (parado) break;
    }
  }
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 1));
  const completas = cat.filter((e) => fichaTraducida(e, lang)).length;
  console.log(`\n${lang}: ${completas} de ${cat.length} fichas completas (se indexan en ese idioma)`);
}
