// robots.txt: todo indexable salvo las páginas privadas o de cuenta
export const dynamic = 'force-static';

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';
const PRIVADAS = ['ajustes', 'mensajes', 'notificaciones', 'perfil/editar', 'tanques/nuevo', 'foro/nuevo', 'foro/categoria', 'mercado/nuevo', 'tiendas/gestionar', 'acceder', 'registro', 'recuperar', 'nueva-contrasena', 'admin'];

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVADAS.map((p) => `/*/${p}/`) }],
    sitemap: `${URL_SITIO}/sitemap.xml`,
    host: URL_SITIO,
  };
}
