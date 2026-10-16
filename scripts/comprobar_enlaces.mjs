// Busca enlaces internos rotos en la web exportada (out/): cada href="/..." de cada página tiene que
// llevar a un archivo que exista. Las rutas con ?id= se comprueban sin la consulta (la página existe).
// Uso, después de `npm run build`: node scripts/comprobar_enlaces.mjs   (sale con error si hay rotos)
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'out');
const IGNORAR_CARPETAS = new Set(['_next', 'wiki-media']);
const RECURSO = /\.(css|js|png|jpe?g|webp|avif|svg|ico|xml|txt|webmanifest|json|pdf)$/i;

const paginas = [];
(function recorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!IGNORAR_CARPETAS.has(e.name)) recorrer(p); }
    else if (e.name.endsWith('.html')) paginas.push(p);
  }
})(OUT);

const existe = (ruta) => [path.join(OUT, ruta, 'index.html'), path.join(OUT, ruta), path.join(OUT, `${ruta}.html`)]
  .some((c) => fs.existsSync(c) && fs.statSync(c).isFile());

const rotos = new Map(); // destino → páginas que lo enlazan
let enlaces = 0;
for (const pagina of paginas) {
  const html = fs.readFileSync(pagina, 'utf8');
  for (const [, href] of html.matchAll(/href="(\/[^"#]*)"/g)) {
    const ruta = href.split('?')[0];
    if (/^\/(_next|wiki-media|icons)\//.test(ruta) || RECURSO.test(ruta)) continue;
    enlaces++;
    let decodificada = ruta;
    try { decodificada = decodeURI(ruta); } catch { /* se comprueba tal cual */ }
    if (existe(decodificada)) continue;
    if (!rotos.has(ruta)) rotos.set(ruta, new Set());
    rotos.get(ruta).add(path.relative(OUT, pagina));
  }
}

console.log(`${paginas.length} páginas, ${enlaces} enlaces internos, ${rotos.size} destinos rotos`);
for (const [destino, origen] of [...rotos].slice(0, 30)) {
  const lista = [...origen];
  console.log(`  ${destino}  ←  ${lista.slice(0, 2).join(', ')}${lista.length > 2 ? ` (+${lista.length - 2})` : ''}`);
}
process.exit(rotos.size ? 1 : 0);
