// Contrasta las fichas del catálogo con fuentes externas antes de publicarlas:
//  · GBIF (api.gbif.org, datos abiertos): el nombre científico existe, está aceptado y es de esa familia
//  · FishBase (solo peces, solo como referencia): temperatura, pH y tamaño máximo. Sus datos son del
//    medio natural y su licencia no permite uso comercial: aquí solo se comparan, no se copian.
// FishBase pide como máximo una petición cada 10 s (robots.txt); las respuestas quedan en caché.
// Uso: node --import ./tests/resolver.mjs scripts/especies/validar.mjs [--solo-nuevas] [--sin-fishbase]
import { catalogoEspecies } from '../../src/lib/catalogoEspecies.js';
import { pedir, esperar, cache } from './comun.mjs';

const soloNuevas = process.argv.includes('--solo-nuevas');
const sinFishbase = process.argv.includes('--sin-fishbase');
const gbif = cache('gbif');
const fishbase = cache('fishbase');

// La taxonomía de GBIF va algo por detrás: familias actuales (las que usan FishBase y Eschmeyer) que
// GBIF aún incluye en otra. No son errores de la ficha.
const EQUIVALENTES = {
  danionidae: 'cyprinidae', leuciscidae: 'cyprinidae', acheilognathidae: 'cyprinidae', tincidae: 'cyprinidae',
  gobionidae: 'cyprinidae', xenocyprididae: 'cyprinidae', botiidae: 'cobitidae', gastromyzontidae: 'balitoridae', nemacheilidae: 'balitoridae',
  auchenoglanididae: 'claroteidae', microdesmidae: 'gobiidae', gobionellidae: 'gobiidae', oxudercidae: 'gobiidae', butidae: 'eleotridae',
};
const mismaFamilia = (a, b) => {
  const [x, y] = [a.toLowerCase(), b.toLowerCase()];
  return x === y || EQUIVALENTES[x] === y || EQUIVALENTES[y] === x;
};
const binomio = (n) => n.replace(/["“][^"”]*["”]/g, '').replace(/\b(var|cf|aff)\.?\s.*$/, '').trim().split(/\s+/).slice(0, 2).join(' ');
const esGenerico = (n) => /\bspp?\.?$/.test(n.trim());

async function consultarGbif(nombre) {
  if (gbif.has(nombre)) return gbif.get(nombre);
  const r = await pedir(`https://api.gbif.org/v1/species/match?verbose=false&name=${encodeURIComponent(nombre)}`);
  const datos = r && { tipo: r.matchType, rango: r.rank, estado: r.status, familia: r.family, reino: r.kingdom, aceptado: r.acceptedUsageKey ? r.species : null, confianza: r.confidence };
  // Un fallo de red no es «no encontrado»: no se guarda, para volver a preguntar la próxima vez
  if (datos) gbif.set(nombre, datos);
  return datos;
}

// "pH range: 5.0 - 7.0; dH range: 1 - 2. Tropical; 20°C - 26°C" y "Max length : 2.5 cm"
async function consultarFishbase(nombre) {
  if (fishbase.has(nombre)) return fishbase.get(nombre);
  await esperar(10000);
  const res = await pedir(`https://www.fishbase.se/summary/${nombre.replace(/\s+/g, '-')}.html`, { json: false });
  const html = res ? (await res.text()).replace(/&deg;/g, '°').replace(/\s+/g, ' ') : '';
  const num = (re) => { const m = html.match(re); return m ? m.slice(1).map(Number) : null; };
  const datos = html.includes('Max length') || html.includes('pH range') ? {
    t: num(/(\d+(?:\.\d+)?)\s*°C\s*-\s*(\d+(?:\.\d+)?)\s*°C/),
    ph: num(/pH range:\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/),
    dh: num(/dH range:\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/),
    cm: num(/Max length\s*:\s*(\d+(?:\.\d+)?)\s*cm/)?.[0] ?? null,
  } : null;
  if (res) fishbase.set(nombre, datos);
  return datos;
}

// Diferencias que merecen revisarse a mano (los rangos de acuario pueden ser más amplios que los naturales)
function diferencias(f, fb) {
  const avisos = [];
  if (f.t && fb.t && (f.t[0] > fb.t[1] + 1 || f.t[1] < fb.t[0] - 1)) avisos.push(`temperatura ${f.t.join('–')} vs FishBase ${fb.t.join('–')}`);
  if (f.t && fb.t && Math.abs((f.t[0] + f.t[1]) / 2 - (fb.t[0] + fb.t[1]) / 2) > 3) avisos.push(`temperatura media ${f.t.join('–')} vs ${fb.t.join('–')}`);
  if (f.ph && fb.ph && (f.ph[0] > fb.ph[1] + 0.5 || f.ph[1] < fb.ph[0] - 0.5)) avisos.push(`pH ${f.ph.join('–')} vs FishBase ${fb.ph.join('–')}`);
  // FishBase da la longitud estándar máxima registrada: en acuario suele quedar por debajo
  if (f.cm && fb.cm && (f.cm > fb.cm * 1.6 || f.cm < fb.cm * 0.4)) avisos.push(`tamaño ${f.cm} cm vs FishBase ${fb.cm} cm`);
  return [...new Set(avisos)];
}

const lista = catalogoEspecies().filter((e) => e.cientifico && (!soloNuevas || !e.acuarios.length));
let problemas = 0;
console.log(`Validando ${lista.length} especies…\n`);
for (const e of lista) {
  const nombre = binomio(e.cientifico);
  const avisos = [];
  const g = await consultarGbif(esGenerico(e.cientifico) ? nombre.split(' ')[0] : nombre);
  if (!g || g.tipo === 'NONE') avisos.push('GBIF no lo encuentra');
  else {
    if (g.tipo === 'HIGHERRANK' && !esGenerico(e.cientifico)) avisos.push(`GBIF solo reconoce el ${g.rango.toLowerCase()}`);
    if (g.estado === 'SYNONYM' && g.aceptado) avisos.push(`sinónimo; nombre aceptado: ${g.aceptado}`);
    if (g.tipo === 'FUZZY') avisos.push(`GBIF lo corrige (¿errata?), confianza ${g.confianza}`);
    const familia = e.contenido.match(/\*\*Familia\*\*:\s*([A-Za-z]+)/)?.[1];
    if (familia && g.familia && !mismaFamilia(familia, g.familia)) avisos.push(`familia ${familia} vs GBIF ${g.familia}`);
  }
  if (e.categoria === 'pez' && !sinFishbase && !esGenerico(e.cientifico) && e.ficha?.agua) {
    const fb = await consultarFishbase(nombre);
    if (fb) avisos.push(...diferencias(e.ficha, fb));
  }
  if (avisos.length) { problemas++; console.log(`• ${e.cientifico} (${e.comun || '—'}): ${avisos.join('; ')}`); }
}
console.log(`\n${problemas} con algo que revisar de ${lista.length}.`);
