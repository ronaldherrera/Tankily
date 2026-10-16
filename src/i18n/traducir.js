// Traducción en el servidor (páginas estáticas, metadatos y scripts): tiene los 8 idiomas.
// En el navegador NO se importa este archivo: IdiomaProvider recibe solo el diccionario de la
// página y traduce con nucleo.js, para no descargar los textos de todos los idiomas.
import { IDIOMA_DEFECTO } from './config.js';
import { diccionarios } from './diccionarios.js';
import { resolver } from './nucleo.js';

// t('foro.titulo') · t('foro.respuestas', { n: 3 }). Si falta en el idioma pedido, usa el de reserva.
// Plurales: { uno, otros } y, si el idioma lo necesita (p. ej. polaco), también { pocos, muchos }.
export function traducir(lang, clave, vars) {
  let valor = resolver(diccionarios[lang], lang, clave, vars);
  if (valor === undefined) valor = resolver(diccionarios[IDIOMA_DEFECTO], IDIOMA_DEFECTO, clave, vars);
  if (valor === undefined) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] Falta la clave "${clave}"`);
    return clave;
  }
  return valor;
}

export const crearT = (lang) => (clave, vars) => traducir(lang, clave, vars);
