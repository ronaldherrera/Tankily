// Diccionario del idioma de la página en el navegador, para módulos que traducen fuera de React
// (formato de fechas, subida de imágenes). Lo registra IdiomaProvider al montarse.
import { idiomaActual } from './config.js';
import { resolver } from './nucleo.js';

const registrados = {};

export function registrarDiccionario(lang, dic) {
  registrados[lang] = dic;
}

export function tActual(clave, vars) {
  const lang = idiomaActual();
  return resolver(registrados[lang] || Object.values(registrados)[0], lang, clave, vars) ?? clave;
}
