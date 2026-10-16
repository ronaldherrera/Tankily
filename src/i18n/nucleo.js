// Núcleo de las traducciones: búsqueda de claves, plurales y variables.
// No importa ningún diccionario, así que se puede usar en el navegador sin descargar los 8 idiomas.
import { LOCALES } from './config.js';

export function buscar(dic, clave) {
  return clave.split('.').reduce((nodo, parte) => (nodo == null ? undefined : nodo[parte]), dic);
}

export function interpolar(texto, vars) {
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (m, nombre) => (vars[nombre] ?? m));
}

// Categorías de plural de Intl (one/few/many/other) → claves de los diccionarios
const CATEGORIA = { zero: 'cero', one: 'uno', two: 'otros', few: 'pocos', many: 'muchos', other: 'otros' };
const reglas = {};
function formaPlural(lang, valor, n) {
  if (n === 0 && valor.cero) return valor.cero;
  reglas[lang] ||= new Intl.PluralRules(LOCALES[lang] || lang);
  return valor[CATEGORIA[reglas[lang].select(n)]] ?? valor.otros;
}

// Resuelve una clave en un diccionario ya elegido. Devuelve undefined si no existe.
export function resolver(dic, lang, clave, vars) {
  let valor = buscar(dic, clave);
  if (valor === undefined) return undefined;
  if (valor && typeof valor === 'object' && !Array.isArray(valor) && 'otros' in valor) {
    valor = formaPlural(lang, valor, Number(vars?.n ?? 0));
  }
  return typeof valor === 'string' ? interpolar(valor, vars) : valor;
}
