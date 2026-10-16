// Busca foto para las especies del catálogo que no la tienen: imagen principal (P18) del taxón en
// Wikidata → archivo de Wikimedia Commons. Solo licencias que permiten uso comercial (CC0, dominio
// público, CC BY y CC BY-SA); nunca NC ni ND. Guarda la foto en public/especies/<slug>.webp y el
// crédito (autor, licencia, enlace) en especies/fotos.json, que la ficha muestra junto a la foto.
// Uso: node --import ./tests/resolver.mjs scripts/especies/fotos.mjs [--max 50]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { catalogoEspecies, slugEspecie } from '../../src/lib/catalogoEspecies.js';
import { RAIZ, pedir, esperar } from './comun.mjs';

const DESTINO = path.join(RAIZ, 'public', 'especies');
const CREDITOS = path.join(RAIZ, 'especies', 'fotos.json');
const max = Number(process.argv[process.argv.indexOf('--max') + 1]) || Infinity;
fs.mkdirSync(DESTINO, { recursive: true });
fs.mkdirSync(path.dirname(CREDITOS), { recursive: true });
const creditos = fs.existsSync(CREDITOS) ? JSON.parse(fs.readFileSync(CREDITOS, 'utf8')) : {};
// En Windows el archivo puede estar un instante bloqueado (el servidor de desarrollo lo lee): se reintenta
const guardarCreditos = async () => {
  const ordenado = Object.fromEntries(Object.entries(creditos).sort(([a], [b]) => a.localeCompare(b)));
  for (let i = 1; ; i++) {
    try { fs.writeFileSync(CREDITOS, JSON.stringify(ordenado, null, 2) + '\n'); return; } catch (err) {
      if (i >= 5) throw err;
      await esperar(500 * i);
    }
  }
};

// "No restrictions" (sin restricciones conocidas) y "Attribution" (libre citando al autor) también lo son
// "Copyrighted free use" y GPL permiten el uso comercial citando autor y licencia, como CC BY-SA
// GFDL y Free Art License (FAL) son licencias libres copyleft, como CC BY-SA
const LIBRE = /^(cc0|public domain|pd|no restrictions|attribution$|copyrighted free use|gpl|gfdl|fal\b|cc[ -]by(-sa)?[ -]\d(\.\d)?)/i;
const sinHtml = (s = '') => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
const binomio = (n) => n.replace(/["“][^"”]*["”]/g, '').replace(/\b(var|cf|aff)\.?\s.*$/, '').trim().split(/\s+/).slice(0, 2).join(' ');

// Fotos revisadas a ojo y descartadas (dibujos, ejemplares de museo, otra especie…): no se vuelven a usar
const DESCARTADAS = path.join(RAIZ, 'especies', 'fotos-descartadas.json');
const descartadas = new Set(fs.existsSync(DESCARTADAS) ? JSON.parse(fs.readFileSync(DESCARTADAS, 'utf8')) : []);
for (const [slug, c] of Object.entries(creditos)) {
  if (!descartadas.has(c.fuente)) continue;
  fs.rmSync(path.join(DESTINO, c.archivo), { force: true });
  delete creditos[slug];
}
await guardarCreditos();

const pendientes = catalogoEspecies()
  // Ni géneros ("spp.") ni variedades de cultivo ("Blue Bolt"): la foto de la especie salvaje engañaría
  .filter((e) => !e.imagen && e.cientifico && !/\bspp?\.?$/.test(e.cientifico) && !/["“']|\svar\.\s/.test(e.cientifico) && !creditos[slugEspecie(e.cientifico)])
  .slice(0, max);
console.log(`${pendientes.length} especies sin foto con nombre científico.`);

// 1. Wikidata: imágenes de todos los taxones de una vez (de 40 en 40)
const imagenes = new Map(); // binomio → nombre de archivo en Commons
for (let i = 0; i < pendientes.length; i += 40) {
  const nombres = [...new Set(pendientes.slice(i, i + 40).map((e) => binomio(e.cientifico)))];
  const valores = nombres.map((n) => `"${n.replace(/"/g, '')}"`).join(' ');
  const consulta = `SELECT ?nombre ?img WHERE { VALUES ?nombre { ${valores} } ?item wdt:P225 ?nombre; wdt:P18 ?img. }`;
  const r = await pedir(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(consulta)}`);
  for (const b of r?.results?.bindings || []) {
    if (!imagenes.has(b.nombre.value)) imagenes.set(b.nombre.value, decodeURIComponent(b.img.value.split('/').pop()));
  }
  await esperar(1000);
}
console.log(`Wikidata tiene foto de ${imagenes.size}.`);

// 2. Commons: licencia, autor y miniatura de cada archivo
const datosArchivo = async (titulo) => {
  const info = await pedir(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1100&titles=${encodeURIComponent('File:' + titulo)}`);
  return Object.values(info?.query?.pages || {})[0]?.imageinfo?.[0] || null;
};
// Si Wikidata no tiene foto, se busca en Commons un archivo cuyo nombre lleve el binomio completo,
// descartando mapas, dibujos, láminas y ejemplares de museo
const NO_FOTO = new Set(['map', 'mapa', 'range', 'distribution', 'drawing', 'illustration', 'plate', 'lamina', 'skull', 'specimen', 'museum', 'herbarium', 'svg', 'stamp', 'sello', 'shell', 'shells', 'concha', 'conchas', 'tafel', 'tab', 'fig', 'figure', 'lithograph', 'engraving', 'botanical']);
const pareceFoto = (titulo) => !titulo.toLowerCase().split(/[^a-z]+/).some((p) => NO_FOTO.has(p));
// Ilustradores y revistas de los siglos XVIII–XX: sus láminas están en dominio público pero son dibujos
const ILUSTRADORES = /boulenger|bleeker|günther|gunther|evermann|lacep[eè]de|valenciennes|cuvier|steindachner|bloch|zoologische mededelingen|francis day|starr jordan|ichthyologia|fishes of india/i;
async function buscarEnCommons(nombre) {
  const r = await pedir(`https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=15&srsearch=${encodeURIComponent('"' + nombre + '"')}`);
  const [g, s] = nombre.toLowerCase().split(' ');
  return (r?.query?.search || []).map((x) => x.title.replace(/^File:/, ''))
    .filter((titulo) => { const l = titulo.toLowerCase().replace(/[_-]/g, ' '); return l.includes(g) && l.includes(s) && /\.(jpe?g|png|webp)$/i.test(titulo) && pareceFoto(l); });
}
const urlArchivo = (titulo) => `https://commons.wikimedia.org/wiki/File:${titulo.replace(/ /g, '_')}`;

// Primera foto válida entre la de Wikidata y las que encuentra la búsqueda de Commons
// Nombres antiguos según GBIF ("Puntius tetrazona" para Puntigrus tetrazona): muchas fotos de Commons
// siguen con ellos
async function sinonimos(nombre) {
  const m = await pedir(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(nombre)}`);
  const clave = m?.acceptedUsageKey || m?.usageKey;
  if (!clave) return [];
  const r = await pedir(`https://api.gbif.org/v1/species/${clave}/synonyms?limit=20`);
  return [...new Set((r?.results || []).map((s) => s.canonicalName).filter((n) => n && n.split(' ').length === 2 && n !== nombre))].slice(0, 5);
}
async function elegirFoto(nombre) {
  let encontradas = await buscarEnCommons(nombre);
  if (!imagenes.get(nombre) && !encontradas.length) {
    for (const otro of await sinonimos(nombre)) encontradas = [...encontradas, ...(await buscarEnCommons(otro))];
  }
  const candidatas = [imagenes.get(nombre), ...encontradas].filter((t) => t && pareceFoto(t) && !descartadas.has(urlArchivo(t)));
  for (const titulo of [...new Set(candidatas)].slice(0, 6)) {
    const ii = await datosArchivo(titulo);
    if (!ii || !/image\/(jpeg|png|webp)/.test(ii.mime) || descartadas.has(ii.descriptionurl)) continue;
    if (ILUSTRADORES.test(sinHtml(ii.extmetadata?.Artist?.value)) || ILUSTRADORES.test(titulo)) continue;
    const licencia = sinHtml(ii.extmetadata?.LicenseShortName?.value);
    if (!LIBRE.test(licencia) || /\b(nc|nd)\b/i.test(licencia)) { rechazadas.push(`${nombre} (${licencia || 'sin licencia'})`); continue; }
    return { ii, licencia };
  }
  return null;
}
let nuevas = 0;
const rechazadas = [];
for (const e of pendientes) {
  const elegida = await elegirFoto(binomio(e.cientifico));
  if (!elegida) continue;
  const { ii, licencia } = elegida;
  const meta = ii.extmetadata || {};
  // "No machine-readable author provided. Haplochromis assumed (…)" → "Haplochromis"
  const autor = sinHtml(meta.Artist?.value).replace(/^No machine-readable author provided\.\s*(.+?)\s+assumed.*$/i, '$1') || 'Autor desconocido';
  const res = await pedir(ii.thumburl || ii.url, { json: false });
  if (!res) continue;
  const slug = slugEspecie(e.cientifico);
  try {
    await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 960, height: 720, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72 }).toFile(path.join(DESTINO, `${slug}.webp`));
  } catch (err) { console.warn(`  ⚠ ${e.cientifico}: ${err.message}`); continue; }
  creditos[slug] = {
    archivo: `${slug}.webp`, autor: autor.slice(0, 120), licencia,
    urlLicencia: meta.LicenseUrl?.value || null, fuente: ii.descriptionurl,
  };
  await guardarCreditos();
  nuevas++;
  console.log(`  ✓ ${e.cientifico} — ${licencia}, ${autor.slice(0, 60)}`);
  await esperar(500);
}
console.log(`\n${nuevas} fotos nuevas.${rechazadas.length ? ` Rechazadas por licencia: ${rechazadas.join(', ')}` : ''}`);
console.log(`Sin foto libre: ${pendientes.filter((e) => !creditos[slugEspecie(e.cientifico)]).map((e) => e.cientifico).join(', ') || 'ninguna'}`);
