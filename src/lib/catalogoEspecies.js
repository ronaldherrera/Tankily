// Catálogo de especies de WikiTank para las páginas /wiki/especies/: se genera en el build leyendo los
// Markdown de las carpetas "Especies habituales" (solo lectura: la wiki no se toca). Solo servidor (usa fs).
// Una especie que aparece en varios tipos de acuario es una sola entrada, "habitual en" todos ellos.
import fs from 'node:fs';
import path from 'node:path';
import { wikiTankTree } from './wikiData';
import { camposDe, leerFicha } from './fichaEspecie';
import { tituloWiki } from '@/app/[lang]/wiki/formato';

// Carpetas de "Especies habituales" (los títulos de la wiki van en mayúsculas: se comparan en minúsculas)
const CATEGORIA = {
  peces: 'pez', 'otros peces': 'pez', 'goldfish fancy': 'pez', 'goldfish de estanque': 'pez', 'variedades de koi': 'pez',
  plantas: 'planta', macroalgas: 'planta', corales: 'coral', invertebrados: 'invertebrado',
};
const nombreNodo = (n) => (n?.title || '').replace(/\s+/g, ' ').trim().toLowerCase();
const RAIZ_MD = path.join(process.cwd(), 'WikiTank');
const RAIZ_MEDIA = path.join(process.cwd(), 'public', 'wiki-media');

const sinAcentos = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
export const slugEspecie = (s) => sinAcentos(s).toLowerCase().replace(/["“”]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clave = (s) => sinAcentos(s).toLowerCase().replace(/\b(spp?|var|cf|aff)\b\.?/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
// Cabecera de una especie: espacios normales y sin coletillas tras una raya ("Nombre — comentario"),
// salvo que el nombre científico vaya detrás ("Taiwan Bee — Blue Bolt (Caridina …)" → "Taiwan Bee Blue Bolt (Caridina …)")
const tituloLimpio = (t) => t.replace(/\s+/g, ' ')
  .replace(/\s*—\s*([^()]*?)\s*(\([^)]*\))\s*$/, ' $1 $2').replace(/\s*—.*$/, '').trim();

// Nombre científico con su escritura correcta: género con mayúscula y el resto en minúscula,
// salvo los nombres de variedad entre comillas ("Corydoras Aeneus" → "Corydoras aeneus")
function escrituraCientifica(nombre) {
  const [genero, ...resto] = nombre.trim().split(/\s+/);
  let enComillas = false;
  const partes = resto.map((p) => {
    const abre = /^["“]/.test(p);
    if (abre) enComillas = true;
    const salida = enComillas ? p : p.toLowerCase();
    if (/["”]$/.test(p)) enComillas = false;
    return salida;
  });
  return [genero.charAt(0).toUpperCase() + genero.slice(1), ...partes].join(' ');
}

// "Nombre común / otro (Nombre científico)" → partes; sin paréntesis puede ser un binomio o una variedad.
// Algunas fichas lo escriben al revés ("Corydoras Aeneus (Corydoras Bronce)"): la foto de la ficha se
// llama como la especie (Corydoras_aeneus.webp), así que el lado que coincide con ella es el científico.
// ¿Tiene forma de nombre científico? "Género especie" (la especie en minúscula, sin tildes ni "de")
const esCientifico = (texto) => /^[A-Z][a-z]+ (?:[a-z]+|spp?\.?)(?:\s|$)/.test(texto) && !/[áéíóúñ]|\bde\b/i.test(texto);
// Lo mismo aunque la especie venga en mayúscula ("Hygrophila Polysperma")
const formaCientifica = (texto) => esCientifico(escrituraCientifica(texto)) && texto.trim().split(/\s+/).length <= 4;

// `variedades`: carpetas de variedades (koi, goldfish), donde "Showa Sanshoku" es un nombre, no una especie
function nombres(cabecera, foto, variedades = false) {
  const m = cabecera.match(/^(.*)\(([^)]+)\)\s*$/);
  const trocear = (texto) => texto.split(/[/,]/).map((x) => x.trim()).filter(Boolean);
  const fuera = trocear(m ? m[1] : cabecera);
  const dentro = m ? trocear(m[2]) : [];
  const todos = [...dentro, ...fuera];
  const resultado = (cientifico) => {
    const comunes = [...fuera, ...dentro].filter((x) => x !== cientifico);
    return { comun: comunes[0] || null, otrosNombres: comunes.slice(1), cientifico: cientifico ? escrituraCientifica(cientifico) : null };
  };
  // 1. Una parte claramente científica (la especie ya en minúscula), primero entre paréntesis
  const clara = todos.find(esCientifico);
  if (clara) return resultado(clara);
  if (variedades) return resultado(null);
  // 2. La que coincide con la foto de la ficha (se llama como la especie)
  const deFoto = foto ? clave(foto.replace(/\.[a-z]+$/i, '').replace(/_/g, ' ')) : '';
  const porFoto = deFoto && todos.find((x) => formaCientifica(x) && (clave(x) === deFoto || deFoto.startsWith(clave(x))));
  if (porFoto) return resultado(porFoto);
  // 3. La que tiene forma de nombre científico aunque la especie vaya en mayúscula ("Hygrophila Polysperma")
  return resultado(todos.find(formaCientifica) || null);
}

// Carpeta especies/: <Categoría>/<Grupo>.md (p. ej. Peces/Tetras.md)
const RAIZ_AMPLIADAS = path.join(process.cwd(), 'especies');
const CARPETA_CATEGORIA = { peces: 'pez', plantas: 'planta', corales: 'coral', invertebrados: 'invertebrado' };
function archivosAmpliados() {
  if (!fs.existsSync(RAIZ_AMPLIADAS)) return [];
  return fs.readdirSync(RAIZ_AMPLIADAS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && CARPETA_CATEGORIA[d.name.toLowerCase()])
    .flatMap((d) => fs.readdirSync(path.join(RAIZ_AMPLIADAS, d.name)).filter((f) => f.endsWith('.md')).sort()
      .map((f) => ({ categoria: CARPETA_CATEGORIA[d.name.toLowerCase()], grupo: f.replace(/\.md$/, ''), archivo: path.join(RAIZ_AMPLIADAS, d.name, f) })));
}
// slug → { archivo, autor, licencia, urlLicencia, fuente }
function leerFotos() {
  try { return JSON.parse(fs.readFileSync(path.join(RAIZ_AMPLIADAS, 'fotos.json'), 'utf8')); } catch { return {}; }
}

let cache = null;
let cacheHecha = 0;
// En desarrollo se recalcula cada pocos segundos para ver al momento las fichas que se añaden o corrigen
const VIGENCIA = process.env.NODE_ENV === 'production' ? Infinity : 5000;

// Lista completa, ordenada por nombre científico (o común si no lo hay)
export function catalogoEspecies() {
  if (cache && Date.now() - cacheHecha < VIGENCIA) return cache;
  cacheHecha = Date.now();
  const porClave = new Map();

  (function recorrer(nodos, antepasados) {
    for (const nodo of nodos) {
      const camino = [...antepasados, nodo];
      const enEspecies = nombreNodo(antepasados.at(-1)) === 'especies habituales';
      const categoria = CATEGORIA[nombreNodo(nodo)];
      if (enEspecies && categoria && nodo.contentFiles?.length) {
        // El tipo de acuario es el nodo que contiene "Especies habituales"
        const acuario = camino.at(-3);
        const rutaAcuario = camino.slice(0, -2).map((n) => n.slug).join('/');
        for (const archivo of nodo.contentFiles) {
          const ruta = path.join(RAIZ_MD, archivo);
          if (!fs.existsSync(ruta)) continue;
          const texto = fs.readFileSync(ruta, 'utf8').replace(/\r/g, '').replace(/```[\s\S]*?```/g, '');
          for (const bloque of texto.split(/\n(?=#{2,3} )/).slice(1)) {
            const cabecera = tituloLimpio(bloque.split('\n')[0].replace(/^#{2,3}\s*/, ''));
            const campos = camposDe(bloque);
            if (Object.keys(campos).length < 2) continue; // títulos de sección, no especies
            const foto = bloque.match(/!\[[^\]]*\]\(([^)]+)\)/)?.[1];
            const n = nombres(cabecera, foto, /variedades|goldfish/.test(nombreNodo(nodo)));
            const k = clave(n.cientifico || n.comun || cabecera);
            if (!k) continue;
            const imagen = foto && fs.existsSync(path.join(RAIZ_MEDIA, nodo.relativePath, foto)) ? `/wiki-media/${nodo.relativePath}/${foto}` : null;
            const aparicion = { acuario: tituloWiki(acuario?.title || ''), ruta: rutaAcuario };
            const contenido = bloque.replace(/^#{2,3}[^\n]*\n/, '').trim();
            const previa = porClave.get(k);
            if (!previa) {
              porClave.set(k, {
                ...n, titulo: cabecera, titulos: [cabecera], categoria, grupo: tituloWiki(nodo.title), imagen, contenido,
                ficha: leerFicha(campos, nodo.relativePath), numCampos: Object.keys(campos).length,
                rutaGrupo: camino.map((x) => x.slug).join('/'), acuarios: [aparicion],
              });
            } else {
              if (!previa.acuarios.some((a) => a.ruta === aparicion.ruta)) previa.acuarios.push(aparicion);
              previa.imagen ||= imagen;
              if (!previa.titulos.includes(cabecera)) previa.titulos.push(cabecera);
              previa.otrosNombres = [...new Set([...previa.otrosNombres, ...n.otrosNombres, n.comun].filter((x) => x && x !== previa.comun))];
              // Se queda con la ficha más completa
              if (Object.keys(campos).length > previa.numCampos) {
                Object.assign(previa, { contenido, ficha: leerFicha(campos, nodo.relativePath), numCampos: Object.keys(campos).length });
              }
            }
          }
        }
      }
      if (nodo.children?.length) recorrer(nodo.children, camino);
    }
  })(wikiTankTree, []);

  // Fichas ampliadas (carpeta especies/, mismo formato): especies que no son "habituales" de ningún
  // tipo de acuario de la wiki. Si una ya está en la wiki, manda la de la wiki.
  for (const { categoria, grupo, archivo } of archivosAmpliados()) {
    const texto = fs.readFileSync(archivo, 'utf8').replace(/\r/g, '');
    for (const bloque of texto.split(/\n(?=### )/).slice(1)) {
      const cabecera = tituloLimpio(bloque.split('\n')[0].replace(/^###\s*/, ''));
      const campos = camposDe(bloque);
      if (Object.keys(campos).length < 2) continue;
      const n = nombres(cabecera, null);
      const k = clave(n.cientifico || n.comun || cabecera);
      if (!k) continue;
      const previa = porClave.get(k);
      if (previa) {
        previa.otrosNombres = [...new Set([...previa.otrosNombres, ...n.otrosNombres, n.comun].filter((x) => x && x !== previa.comun))];
        continue;
      }
      porClave.set(k, {
        ...n, titulo: cabecera, titulos: [cabecera], categoria, grupo, imagen: null,
        contenido: bloque.replace(/^###[^\n]*\n/, '').trim(), ficha: leerFicha(campos, path.relative(RAIZ_AMPLIADAS, archivo)),
        numCampos: Object.keys(campos).length, rutaGrupo: null, acuarios: [],
      });
    }
  }

  // Fotos de Wikimedia Commons e iNaturalist (scripts/especies/fotos.mjs) para las que no tienen foto en la wiki
  const fotos = leerFotos();
  for (const e of porClave.values()) {
    if (e.imagen) continue;
    const foto = fotos[slugEspecie(e.cientifico || e.comun)];
    // Las fotos con licencia no comercial (nc) solo se usan en su propia ficha, que va sin publicidad:
    // van en imagenNC y no en imagen, para que no salgan en el catálogo, el buscador ni los tanques
    if (foto) Object.assign(e, { [foto.nc ? 'imagenNC' : 'imagen']: `/especies/${foto.archivo}`, credito: foto });
  }

  const usados = new Set();
  cache = [...porClave.values()]
    .sort((a, b) => (a.cientifico || a.comun).localeCompare(b.cientifico || b.comun, 'es'))
    .map((e) => {
      let slug = slugEspecie(e.cientifico || e.comun);
      for (let i = 2; usados.has(slug); i++) slug = `${slugEspecie(e.cientifico || e.comun)}-${i}`;
      usados.add(slug);
      const { numCampos, ...resto } = e;
      return { slug, ...resto };
    });
  return cache;
}

export const especiePorSlug = (slug) => catalogoEspecies().find((e) => e.slug === slug) || null;

// Cabecera de la ficha (tal como está en la wiki) → slug, para enlazar desde la ventana de la especie
export const slugsPorTitulo = () => Object.fromEntries(catalogoEspecies().flatMap((e) => e.titulos.map((t) => [t, e.slug])));
// Lo mínimo para el listado del catálogo (sin el texto de la ficha)
export const resumenEspecie = ({ slug, comun, cientifico, otrosNombres, categoria, grupo, imagen, ficha, acuarios }) =>
  ({ slug, comun, cientifico, otrosNombres, categoria, grupo, imagen, ficha, acuarios: acuarios.map((a) => a.acuario) });
