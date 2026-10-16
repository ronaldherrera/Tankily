// Hoja de contactos de las fotos de public/especies/ para revisarlas a ojo (no se usa en la web).
// Uso: node scripts/especies/hoja.mjs <origen> <salida.jpg> [desde]
//   origen: «todas» (orden alfabético), «recientes» (las últimas descargadas primero) o la ruta de un
//   .txt con un nombre de archivo por línea. «desde» indica a partir de qué foto (de 48 en 48).
import sharp from 'sharp';
import fs from 'node:fs';
const dir = 'public/especies';
const [origen = 'todas', salida, desdeTexto = '0'] = process.argv.slice(2);
const desde = Number(desdeTexto) || 0, n = 48, col = 8, w = 200, h = 150;
const existentes = new Set(fs.readdirSync(dir).filter((f) => f.endsWith('.webp')));
let lista;
if (origen === 'recientes') lista = [...existentes].sort((a, b) => fs.statSync(`${dir}/${b}`).mtimeMs - fs.statSync(`${dir}/${a}`).mtimeMs);
else if (origen.endsWith('.txt')) lista = fs.readFileSync(origen, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => existentes.has(l));
else lista = [...existentes].sort();
const archivos = lista.slice(desde, desde + n);
const piezas = await Promise.all(archivos.map(async (f, i) => {
  const img = await sharp(`${dir}/${f}`).resize(w, h, { fit: 'cover' }).toBuffer();
  const etiqueta = Buffer.from(`<svg width="${w}" height="18"><rect width="100%" height="100%" fill="black" opacity="0.7"/><text x="3" y="13" font-size="11" fill="white" font-family="Arial">${i + desde} ${f.replace('.webp', '').slice(0, 28)}</text></svg>`);
  const conTexto = await sharp(img).composite([{ input: etiqueta, top: h - 18, left: 0 }]).toBuffer();
  return { input: conTexto, top: Math.floor(i / col) * h, left: (i % col) * w };
}));
await sharp({ create: { width: col * w, height: Math.max(1, Math.ceil(archivos.length / col)) * h, channels: 3, background: '#222' } })
  .composite(piezas).jpeg({ quality: 70 }).toFile(salida);
console.log(archivos.length, 'de', lista.length);
