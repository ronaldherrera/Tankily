// Enlaces a tanques, hilos y anuncios desde los listados públicos. Si el elemento ya tiene su página
// indexable (lib/paginasPublicas.js) se enlaza a ella, que es lo que Google valora; si no, a ?id=, que
// funciona siempre. Tiene página si: es público, está en el idioma que se está viendo y existía cuando se
// construyó la web (NEXT_PUBLIC_CONSTRUIDO, next.config.mjs). Si aun así una dirección no existe (p. ej. un
// título cambiado), el .htaccess la redirige a la versión con ?id=.
import { slugCon } from './slugs';

const CONSTRUIDO = process.env.NEXT_PUBLIC_CONSTRUIDO ? Date.parse(process.env.NEXT_PUBLIC_CONSTRUIDO) : 0;
const tienePagina = (x, lang) => !!x?.creado_en && (x.idioma || 'es') === lang && Date.parse(x.creado_en) < CONSTRUIDO;

export const enlaceTanque = (t, lang) =>
  t?.nombre && t.visibilidad === 'publico' && tienePagina(t, lang) ? `/tanque/${slugCon(t.nombre, t.id)}/` : `/tanque/?id=${t.id}`;

export const enlaceHilo = (h, lang) =>
  h?.titulo && tienePagina(h, lang) ? `/foro/hilo/${slugCon(h.titulo, h.id)}/` : `/foro/hilo/?id=${h.id}`;

export const enlaceAnuncio = (a, lang) =>
  a?.titulo && a.estado === 'activo' && tienePagina(a, lang) ? `/mercado/anuncio/${slugCon(a.titulo, a.id)}/` : `/mercado/anuncio/?id=${a.id}`;
