// Idiomas disponibles. El primero es el de reserva cuando falta una traducción.
export const IDIOMAS = ['es', 'en', 'de', 'pt', 'fr', 'it', 'nl', 'pl'];
export const IDIOMA_DEFECTO = 'es';
export const LOCALES = { es: 'es-ES', en: 'en-US', de: 'de-DE', pt: 'pt-BR', fr: 'fr-FR', it: 'it-IT', nl: 'nl-NL', pl: 'pl-PL' };
export const NOMBRES_IDIOMA = { es: 'Español', en: 'English', de: 'Deutsch', pt: 'Português', fr: 'Français', it: 'Italiano', nl: 'Nederlands', pl: 'Polski' };

export const esIdioma = (valor) => IDIOMAS.includes(valor);

// Idioma de la página actual (en el navegador lo marca <html lang>)
export function idiomaActual() {
  if (typeof document === 'undefined') return IDIOMA_DEFECTO;
  const lang = document.documentElement.lang;
  return esIdioma(lang) ? lang : IDIOMA_DEFECTO;
}

// Rutas internas que no llevan prefijo de idioma (recursos estáticos)
const SIN_PREFIJO = /^\/(wiki-media|images|_next|favicon|ads\.txt)/;
const CON_PREFIJO = new RegExp(`^/(${IDIOMAS.join('|')})(/|$)`);
// Artículos de WikiTank: solo se generan en español hasta que se traduzcan (las fichas de especies, sí en todos)
const SOLO_ESPANOL = /^\/wiki\/explorer\//;

export function conIdioma(href, lang) {
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return href;
  if (SIN_PREFIJO.test(href) || CON_PREFIJO.test(href)) return href;
  if (SOLO_ESPANOL.test(href)) return `/es${href}`;
  return `/${lang}${href}`;
}

// Quita el prefijo de idioma de una ruta: /en/foro/ → /foro/
export function sinIdioma(pathname = '/') {
  return pathname.replace(CON_PREFIJO, '/') || '/';
}
