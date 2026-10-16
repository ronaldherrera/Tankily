"use client";

import { createContext, useContext, useMemo } from 'react';
import { IDIOMA_DEFECTO, LOCALES, conIdioma } from './config';
import { resolver } from './nucleo';
import { registrarDiccionario } from './actual';

const IdiomaContext = createContext(null);

// Recibe solo el diccionario del idioma de la página (lo pasa el layout desde el servidor):
// así el navegador no descarga los textos de los 8 idiomas.
export function IdiomaProvider({ lang, diccionario, children }) {
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
