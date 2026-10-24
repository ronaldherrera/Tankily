// URL canónica y versiones por idioma (hreflang) de una página.
// Cada página indexable las declara con su propia ruta. El layout no lo hace: si lo hiciera,
// todas las páginas heredarían la canónica de la portada y Google las trataría como duplicados.
import { IDIOMAS } from '@/i18n/config';

export function alternativas(lang, ruta = '/') {
  return {
    canonical: `/${lang}${ruta}`,
    languages: {
      ...Object.fromEntries(IDIOMAS.map((l) => [l, `/${l}${ruta}`])),
      'x-default': `/en${ruta}`,
    },
  };
}
