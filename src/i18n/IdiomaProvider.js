"use client";

import { createContext, use, useContext, useMemo } from 'react';
import { IDIOMA_DEFECTO, LOCALES, conIdioma } from './config';
import { resolver } from './nucleo';
import { registrarDiccionario } from './actual';

const IdiomaContext = createContext(null);

// Cada idioma va en su propio archivo JS: el navegador descarga solo el de la página, una vez, y lo guarda
// en caché. No se pasa como prop desde el layout porque entonces iría incrustado en el HTML de cada una de
// las miles de páginas del export estático (el build pasaba de 5 GB).
const CARGADORES = {
  es: () => import('./porIdioma/es.js'),
  en: () => import('./porIdioma/en.js'),
  de: () => import('./porIdioma/de.js'),
  pt: () => import('./porIdioma/pt.js'),
  fr: () => import('./porIdioma/fr.js'),
  it: () => import('./porIdioma/it.js'),
  nl: () => import('./porIdioma/nl.js'),
  pl: () => import('./porIdioma/pl.js'),
};
const cargas = {};
const cargarDiccionario = (lang) => (cargas[lang] ??= (CARGADORES[lang] || CARGADORES[IDIOMA_DEFECTO])().then((m) => m.default));

export function IdiomaProvider({ lang, children }) {
  const diccionario = use(cargarDiccionario(lang));
  registrarDiccionario(lang, diccionario);
  const valor = useMemo(() => ({
    lang,
    locale: LOCALES[lang],
    t: (clave, vars) => {
      const texto = resolver(diccionario, lang, clave, vars);
      if (texto === undefined && process.env.NODE_ENV !== 'production') console.warn(`[i18n] Falta la clave "${clave}"`);
      return texto ?? clave;
    },
    ruta: (href) => conIdioma(href, lang),
  }), [lang, diccionario]);
  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>;
}

// { t, lang, locale, ruta }
export function useT() {
  const ctx = useContext(IdiomaContext);
  if (ctx) return ctx;
  // Fuera del proveedor (no debería ocurrir en la web): devuelve la clave
  return { lang: IDIOMA_DEFECTO, locale: LOCALES[IDIOMA_DEFECTO], t: (clave) => clave, ruta: (h) => conIdioma(h, IDIOMA_DEFECTO) };
}
