// Compatibilidad de un tanque: cruza los habitantes entre sí y con el agua real del tanque,
// usando las fichas técnicas de WikiTank (src/lib/especiesWiki.js, campo `ficha`).
// Funciones puras: no tocan la base de datos ni la interfaz.
import { especiesWiki } from './especiesWiki';
import { ES_MARINO } from './constantes';
import { pptDesdeDensidad } from './calculos';

const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Especie de la wiki que corresponde a un habitante (por ruta + nombre, o solo por nombre)
export function especieDe(h) {
  const nombres = [h.nombre_cientifico, h.nombre].filter(Boolean).map(normalizar);
  return especiesWiki.find((e) => e.ruta === h.wiki_ruta && nombres.includes(normalizar(e.nombre)))
    || especiesWiki.find((e) => nombres.includes(normalizar(e.nombre)) || (e.comun && nombres.includes(normalizar(e.comun))))
    || null;
}

// Densidad específica (1,025) → salinidad en ppt (aprox. a 25 °C)
const densidadAPpt = (d) => Math.round(pptDesdeDensidad(d) * 10) / 10;

// Rango común de una lista de rangos [min, max]; null si no se solapan
function interseccion(rangos) {
  if (!rangos.length) return undefined;
  const min = Math.max(...rangos.map((r) => r[0]));
  const max = Math.min(...rangos.map((r) => r[1]));
  return min <= max ? [min, max] : null;
}

const PARAMS = [
  // margen: tolerancia de medida para no avisar por diferencias que no importan
  { clave: 't', parametro: 'temperatura', margen: 0.5 },
  { clave: 'ph', parametro: 'ph', margen: 0.1 },
  { clave: 'gh', parametro: 'gh', soloDulce: true, margen: 1 },
  // Salinidad: 2 ppt de margen porque las fichas dan densidad y entre aficionados 1,025–1,026 se lee como ~35 ppt
  { clave: 'sal', parametro: 'salinidad', soloMarino: true, convertir: densidadAPpt, margen: 2 },
];

/**
 * @param tanque      { tipo, litros }
 * @param habitantes  filas de la tabla habitantes (nombre, nombre_cientifico, wiki_ruta, categoria, cantidad)
 * @param ultimas     { temperatura: 25.1, ph: 7.2, ... } última medición de cada parámetro
 * @returns { conFicha, sinFicha, rangos: { temperatura: [a,b] | null, ... }, avisos: [{ nivel, tipo, ...datos }] }
 *          nivel: 'conflicto' (no deberían convivir o no sobrevivirán) | 'aviso' (conviene revisarlo)
 */
export function analizarCompatibilidad({ tanque, habitantes, ultimas = {} }) {
  const marino = ES_MARINO(tanque.tipo);
  const reef = ['reef', 'nano_marino'].includes(tanque.tipo);
  const lista = habitantes.map((h) => ({ h, e: especieDe(h) })).filter((x) => x.e?.ficha);
  const avisos = [];
  const rangos = {};
  const nombre = (x) => x.h.nombre;

  // 1. Agua dulce en tanque marino o al revés
  const aguaEquivocada = lista.filter((x) => x.e.ficha.agua && x.e.ficha.agua !== (marino ? 'marina' : 'dulce'));
  if (aguaEquivocada.length) avisos.push({ nivel: 'conflicto', tipo: 'agua', especies: aguaEquivocada.map(nombre), agua: marino ? 'dulce' : 'marina' });
  const validas = lista.filter((x) => !aguaEquivocada.includes(x));

  // 2. Apto para arrecife
  if (reef) {
    const no = validas.filter((x) => x.e.ficha.reef === 'no');
    const precaucion = validas.filter((x) => x.e.ficha.reef === 'precaucion');
    if (no.length) avisos.push({ nivel: 'conflicto', tipo: 'reefNo', especies: no.map(nombre) });
    if (precaucion.length) avisos.push({ nivel: 'aviso', tipo: 'reefPrecaucion', especies: precaucion.map(nombre) });
  }

  // 3. Rangos de agua: que exista un punto común y que la última medición caiga dentro
  for (const p of PARAMS) {
    if ((p.soloDulce && marino) || (p.soloMarino && !marino)) continue;
    const conDato = validas.filter((x) => x.e.ficha[p.clave]);
    const convertir = p.convertir || ((v) => v);
    const rangosEsp = conDato.map((x) => x.e.ficha[p.clave].map(convertir));
    const comun = interseccion(rangosEsp);
    if (comun === undefined) continue;
    rangos[p.parametro] = comun;
    if (comun === null) {
      // Las dos especies más alejadas: la que pide el mínimo más alto y la que tolera el máximo más bajo
      const alta = conDato.reduce((a, b) => (convertir(b.e.ficha[p.clave][0]) > convertir(a.e.ficha[p.clave][0]) ? b : a));
      const baja = conDato.reduce((a, b) => (convertir(b.e.ficha[p.clave][1]) < convertir(a.e.ficha[p.clave][1]) ? b : a));
      avisos.push({
        nivel: 'conflicto', tipo: 'rango', parametro: p.parametro,
        a: { nombre: nombre(alta), rango: alta.e.ficha[p.clave].map(convertir) },
        b: { nombre: nombre(baja), rango: baja.e.ficha[p.clave].map(convertir) },
      });
    }
    const valor = ultimas[p.parametro];
    if (valor != null) {
      const fuera = conDato.filter((x) => {
        const [min, max] = x.e.ficha[p.clave].map(convertir);
        return valor < min - p.margen || valor > max + p.margen;
      });
      if (fuera.length) avisos.push({ nivel: 'aviso', tipo: 'medicion', parametro: p.parametro, valor, especies: fuera.map(nombre) });
    }
  }

  // 4. Litros mínimos (por ejemplar cuando la ficha lo indica)
  if (tanque.litros) {
    for (const x of validas) {
      const { l, lpp } = x.e.ficha;
      if (!l) continue;
      const necesita = lpp ? l * x.h.cantidad : l;
      if (tanque.litros < necesita) avisos.push({ nivel: 'aviso', tipo: 'litros', especie: nombre(x), necesita, tiene: tanque.litros });
    }
  }

  // 5. Especies de grupo con pocos ejemplares
  for (const x of validas) {
    const { grupo } = x.e.ficha;
    if (grupo && x.h.cantidad < grupo) avisos.push({ nivel: 'aviso', tipo: 'grupo', especie: nombre(x), minimo: grupo, tiene: x.h.cantidad });
  }

  // 6. Peces agresivos junto a peces pacíficos
  const peces = validas.filter((x) => x.h.categoria === 'pez');
  const agresivos = peces.filter((x) => x.e.ficha.comp === 'agresivo');
  const pacificos = peces.filter((x) => x.e.ficha.comp === 'pacifico');
  if (agresivos.length && pacificos.length) avisos.push({ nivel: 'aviso', tipo: 'agresivo', especies: agresivos.map(nombre), n: pacificos.length });

  avisos.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'conflicto' ? -1 : 1));
  return { conFicha: lista.length, sinFicha: habitantes.length - lista.length, rangos, avisos };
}

// Última medición de cada parámetro (las mediciones llegan ordenadas de más reciente a más antigua)
export function ultimasMediciones(mediciones) {
  const ultimas = {};
  for (const m of mediciones) if (ultimas[m.parametro] === undefined) ultimas[m.parametro] = Number(m.valor);
  return ultimas;
}

/**
 * Especies con ficha que encajan en un acuario (herramienta "¿Qué especies puedo tener?").
 * @param agua       'dulce' | 'marina' (las de agua salobre, sin tipo, no se proponen)
 * @param litros     volumen del acuario; las especies sin litros mínimos en su ficha se incluyen
 * @param temp, ph   valores del agua (opcionales); se aceptan con el mismo margen que los avisos
 * @param difMax     dificultad máxima de 1 a 5 (opcional)
 * @param categoria  'pez' | 'invertebrado' | 'coral' | 'planta' (opcional)
 * @returns [{ especie, litrosMin }] ordenadas de más fácil a más difícil
 */
export function especiesQueEncajan({ agua, litros, temp = null, ph = null, difMax = null, categoria = null }) {
  const dentro = (rango, valor, margen) => !rango || valor == null || (valor >= rango[0] - margen && valor <= rango[1] + margen);
  const vistas = new Set();
  return especiesWiki
    .filter((e) => e.ficha && e.ficha.agua === agua && (!categoria || e.categoria === categoria))
    .map((e) => {
      const { l, lpp, grupo } = e.ficha;
      return { especie: e, litrosMin: l ? (lpp ? l * (grupo || 1) : l) : null };
    })
    .filter(({ especie: { ficha }, litrosMin }) => (!litros || !litrosMin || litrosMin <= litros)
      && dentro(ficha.t, temp, 0.5) && dentro(ficha.ph, ph, 0.1)
      && (!difMax || !ficha.dif || ficha.dif <= difMax))
    // Variedades con la misma ficha y el mismo nombre común (p. ej. goldfish) cuentan una vez
    .filter(({ especie: e }) => {
      const clave = `${e.comun || e.nombre}|${JSON.stringify(e.ficha)}`;
      if (vistas.has(clave)) return false;
      vistas.add(clave);
      return true;
    })
    .sort((a, b) => (a.especie.ficha.dif || 3) - (b.especie.ficha.dif || 3) || (a.especie.comun || a.especie.nombre).localeCompare(b.especie.comun || b.especie.nombre));
}
