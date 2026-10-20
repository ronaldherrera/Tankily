// Fotos para las piezas de redes. Las fichas de WikiTank traen imágenes sin autor ni licencia conocidos, así
// que para publicar en redes se usan solo fotos de Wikimedia Commons con licencia que permite uso comercial
// (mismo criterio que scripts/especies/fotos.mjs) y se guarda el crédito para citarlo en cada publicación.
// Uso: node scripts/redes/fotos-redes.mjs  → marca/redes/fotos/<slug>.jpg y marca/redes/fotos/creditos.json
// Para cambiar una foto: pon su URL de Commons en ELEGIDAS y vuelve a ejecutar.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { pedir, esperar } from '../especies/comun.mjs';

const DESTINO = path.join('marca', 'redes', 'fotos');
const CREDITOS = path.join(DESTINO, 'creditos.json');
fs.mkdirSync(DESTINO, { recursive: true });

export const ESPECIES = ['Betta splendens', 'Corydoras aeneus', 'Corydoras paleatus', 'Paracheirodon innesi', 'Paracheirodon axelrodi',
  'Neocaridina davidi', 'Poecilia reticulata', 'Xiphophorus maculatus', 'Carassius auratus', 'Pterophyllum scalare', 'Danio rerio',
  'Trigonostigma heteromorpha', 'Neritina natalensis'];
// Archivo de Commons elegido a mano cuando el automático no convence (nombre sin "File:")
const ELEGIDAS = JSON.parse(fs.existsSync(path.join(DESTINO, 'elegidas.json')) ? fs.readFileSync(path.join(DESTINO, 'elegidas.json'), 'utf8') : '{}');

const LIBRE = /^(cc0|public domain|pd|no restrictions|attribution$|copyrighted free use|cc[ -]by(-sa)?[ -]\d(\.\d)?)/i;
const sinHtml = (s = '') => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
const slug = (n) => n.toLowerCase().replace(/[^a-z]+/g, '-');
const NO_FOTO = new Set(['map', 'range', 'distribution', 'drawing', 'illustration', 'plate', 'skull', 'specimen', 'museum', 'university', 'natural', 'history',
  'svg', 'stamp', 'shell', 'fig', 'figure', 'lithograph', 'engraving', 'corte', 'section', 'histology', 'embryo', 'larva', 'larvae', 'brain', 'fountain', 'pond']);
const pareceFoto = (t) => !t.toLowerCase().split(/[^a-z]+/).some((p) => NO_FOTO.has(p));

async function candidatas(nombre) {
  const titulos = [];
  if (ELEGIDAS[nombre]) titulos.push(ELEGIDAS[nombre]);
  const q = `SELECT ?img WHERE { ?item wdt:P225 "${nombre}"; wdt:P18 ?img. }`;
  const w = await pedir(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`);
  for (const b of w?.results?.bindings || []) {
    const t = decodeURIComponent(b.img.value.split('/').pop());
    if (pareceFoto(t)) titulos.push(t);
  }
  const r = await pedir(`https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=20&srsearch=${encodeURIComponent('"' + nombre + '"')}`);
  for (const x of r?.query?.search || []) {
    const t = x.title.replace(/^File:/, '');
    if (/\.(jpe?g|png)$/i.test(t) && pareceFoto(t)) titulos.push(t);
  }
  return [...new Set(titulos)];
}

const creditos = {};
for (const nombre of ESPECIES) {
  let hecho = false;
  for (const titulo of (await candidatas(nombre)).slice(0, 8)) {
    const info = await pedir(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|mime|size&iiurlwidth=1400&titles=${encodeURIComponent('File:' + titulo)}`);
    const ii = Object.values(info?.query?.pages || {})[0]?.imageinfo?.[0];
    if (!ii || !/image\/(jpeg|png)/.test(ii.mime) || ii.width < 900) continue;
    const licencia = sinHtml(ii.extmetadata?.LicenseShortName?.value);
    if (!LIBRE.test(licencia) || /\b(nc|nd)\b/i.test(licencia)) continue;
    const res = await pedir(ii.thumburl || ii.url, { json: false });
    if (!res) continue;
    const archivo = `${slug(nombre)}.jpg`;
    await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(path.join(DESTINO, archivo));
    const autor = sinHtml(ii.extmetadata?.Artist?.value).replace(/^No machine-readable author provided\.\s*(.+?)\s+assumed.*$/i, '$1') || 'Autor desconocido';
    creditos[nombre] = { archivo, autor: autor.slice(0, 80), licencia, fuente: ii.descriptionurl };
    console.log(`✓ ${nombre} — ${licencia}, ${autor.slice(0, 50)} (${titulo})`);
    hecho = true;
    break;
  }
  if (!hecho) console.log(`✗ ${nombre}: sin foto libre`);
  await esperar(400);
}
fs.writeFileSync(CREDITOS, JSON.stringify(creditos, null, 2) + '\n');
