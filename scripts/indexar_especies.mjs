// Genera src/lib/especiesWiki.js: índice de especies de WikiTank (solo lectura de la wiki).
// 1. Recorre las fotos de "Especies habituales/<Categoría>/" y enlaza cada especie con su página.
// 2. Lee las fichas de los Markdown ("### Nombre común (Nombre científico)" + líneas "**Campo**: valor")
//    y guarda los datos que sirven para comprobar compatibilidad: temperatura, pH, GH, salinidad,
//    tamaño, litros mínimos, comportamiento, dificultad, apto para reef y grupo mínimo.
import fs from 'fs';
import path from 'path';
import { wikiTankTree } from '../src/lib/wikiData.js';
import { leerFicha } from '../src/lib/fichaEspecie.js';
// El catálogo usa el alias "@/": este script se ejecuta con tests/resolver.mjs (npm run especies)
import { catalogoEspecies } from '../src/lib/catalogoEspecies.js';

const RAIZ = path.resolve('public/wiki-media');
const RAIZ_MD = path.resolve('WikiTank');
const CATEGORIA = {
  Peces: 'pez', 'Otros peces': 'pez', 'Goldfish fancy': 'pez', 'Goldfish de estanque': 'pez', 'Variedades de koi': 'pez',
  Plantas: 'planta', Macroalgas: 'planta', Corales: 'coral', Invertebrados: 'invertebrado',
};

const clave = (s) => s.replace(/["“”][^"“”]*["“”]/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\b(spp?|var|cf|aff)\b\.?/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// relativePath → ruta de slugs del explorador
const rutas = {};
(function recorrer(nodos, prefijo) {
  for (const n of nodos) {
    const ruta = [...prefijo, n.slug];
    rutas[n.relativePath] = ruta.join('/');
    if (n.children) recorrer(n.children, ruta);
  }
})(wikiTankTree, []);

const fichas = new Map(); // clave del nombre científico → { comun, ficha }
(function leer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { leer(p); continue; }
    if (!e.name.endsWith('.md')) continue;
    // Las plantillas de ficha van entre ``` y se ignoran
    const texto = fs.readFileSync(p, 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const bloque of texto.split(/\n(?=### )/).slice(1)) {
      const cabecera = bloque.split('\n')[0].replace(/^###\s*/, '').trim();
      // "Común (Científico)" o, sin paréntesis, solo el binomio científico
      const m = cabecera.match(/^(.*)\(([^)]+)\)\s*$/) || (/^[A-Z][a-z]+ [a-z]+/.test(cabecera) ? [null, cabecera, cabecera] : null);
      if (!m) continue;
      const campos = {};
      for (const [, k, valor] of bloque.matchAll(/^\*\*([^*]+)\*\*:\s*(.+)$/gm)) campos[k.trim()] = valor.trim();
      if (!campos.Temperatura && !campos.pH) continue;
      const ficha = leerFicha(campos, path.relative(RAIZ_MD, p));
      if (!ficha) continue;
      const comun = m[1].split('/')[0].trim();
      const registrar = (k) => { if (k && !fichas.has(k)) fichas.set(k, { comun, ficha }); };
      for (const cientifico of m[2].split('/')) {
        const k = clave(cientifico);
        registrar(k);
        registrar(k.split(' ').slice(0, 2).join(' '));
        if (/\bspp?\b/.test(cientifico)) registrar(k.split(' ')[0]);
      }
      for (const nombre of m[1].split('/')) registrar(clave(nombre));
    }
  }
})(RAIZ_MD);

// --- Especies con foto -------------------------------------------------
const especies = new Map();
(function buscar(dir) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) { buscar(completo); continue; }
    if (!entrada.name.endsWith('.webp')) continue;
    const relativo = path.relative(RAIZ, completo).split(path.sep).join('/');
    const partes = relativo.split('/');
    const i = partes.indexOf('Especies habituales');
    if (i === -1) continue;
    const carpeta = partes[i + 1];
    const categoria = CATEGORIA[carpeta];
    if (!categoria) continue;
    const nombre = entrada.name.replace(/\.webp$/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const k = nombre.toLowerCase();
    if (especies.has(k)) continue;
    // Búsqueda: nombre completo, género + especie y, para fichas "Género spp.", el género
    const k0 = clave(nombre);
    const datos = fichas.get(k0) || fichas.get(k0.split(' ').slice(0, 2).join(' ')) || fichas.get(k0.split(' ')[0])
      // Las variedades de goldfish comparten los datos de Carassius auratus
      || (k0.startsWith('goldfish') ? fichas.get('carassius auratus') : undefined);
    especies.set(k, {
      nombre,
      ...(datos ? { comun: datos.comun } : {}),
      categoria,
      imagen: '/wiki-media/' + relativo,
      ruta: rutas[partes.slice(0, i + 2).join('/')] || null,
      ...(datos ? { ficha: datos.ficha } : {}),
    });
  }
})(RAIZ);

// Página de la especie en /wiki/especies/: por la foto (es el mismo archivo) o, si no, por el nombre científico
const catalogo = catalogoEspecies();
const porImagen = new Map(catalogo.filter((e) => e.imagen).map((e) => [e.imagen, e.slug]));
const porNombre = new Map(catalogo.filter((e) => e.cientifico).map((e) => [clave(e.cientifico), e.slug]));
for (const e of especies.values()) {
  const k = clave(e.nombre);
  const slug = porImagen.get(e.imagen) || porNombre.get(k) || porNombre.get(k.split(' ').slice(0, 2).join(' '));
  if (slug) e.slug = slug;
}

// Fichas ampliadas (carpeta especies/): no tienen carpeta en la wiki, se toman del catálogo
for (const e of catalogo.filter((x) => !x.acuarios.length && x.ficha)) {
  const nombre = e.cientifico || e.comun;
  const k = nombre.toLowerCase();
  if (especies.has(k)) continue;
  especies.set(k, { nombre, ...(e.comun ? { comun: e.comun } : {}), categoria: e.categoria, imagen: e.imagen, ruta: null, ficha: e.ficha, slug: e.slug });
}

const lista = [...especies.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
fs.writeFileSync(
  'src/lib/especiesWiki.js',
  `// Generado por scripts/indexar_especies.mjs a partir de WikiTank. No editar a mano.\nexport const especiesWiki = [\n${lista.map((e) => ' ' + JSON.stringify(e)).join(',\n')},\n];\n`,
);
console.log(`${lista.length} especies indexadas, ${lista.filter((e) => e.ficha).length} con ficha técnica (${fichas.size} fichas en la wiki), ${lista.filter((e) => e.slug).length} con página propia`);
