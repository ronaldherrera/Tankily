// Avisa a Bing (y al resto de buscadores con IndexNow: Yandex, Seznam…; Bing alimenta también a Copilot y ChatGPT)
// de las páginas nuevas o cambiadas tras cada publicación. Compara el sitemap que había publicado con el nuevo:
//  · páginas que antes no estaban;
//  · tanques, hilos y anuncios cuya fecha ha cambiado.
// No se avisa de todo lo subido: en cada build cambian casi todos los archivos aunque el contenido sea igual.
// La clave no es secreta (IndexNow la comprueba en https://tankily.com/<clave>.txt).
// Uso (lo hace el deploy): node scripts/indexnow.mjs sitemap-anterior.xml out/sitemap.xml   (--prueba: solo lista)
import fs from 'node:fs';

const CLAVE = '82f5c28978362d9b7d089540ea19187a';
const HOST = 'tankily.com';
const COMUNIDAD = /\/(tanque|foro\/hilo|mercado\/anuncio)\/[^/]+\/$/;

const leer = (ruta) => {
  const xml = fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : '';
  return new Map([...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => [m[1], m[2] || '']));
};
const [anterior, nuevo] = [leer(process.argv[2]), leer(process.argv[3])];
const urls = [...nuevo].filter(([url, fecha]) => !anterior.has(url) || (COMUNIDAD.test(url) && anterior.get(url) !== fecha)).map(([url]) => url);

if (!urls.length) { console.log('IndexNow: nada nuevo'); process.exit(0); }
if (process.argv.includes('--prueba')) { console.log(`IndexNow (prueba): ${urls.length} páginas`); console.log(urls.slice(0, 20).join('\n')); process.exit(0); }
if (!anterior.size) { console.log('IndexNow: no se pudo leer el sitemap anterior; no se avisa para no mandar la web entera'); process.exit(0); }

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: CLAVE, keyLocation: `https://${HOST}/${CLAVE}.txt`, urlList: urls.slice(0, 10000) }),
});
console.log(`IndexNow: ${urls.length} páginas → ${r.status}`);
