// Manifiesto de la app instalable (PWA), uno por idioma: /<idioma>/manifest.webmanifest.
// Así el nombre de los accesos directos (mantener pulsado el icono) sale en el idioma del usuario.
// Todos comparten `id`, de modo que es siempre la misma app, y arrancan en "/", que lleva al último
// idioma usado; los accesos directos pasan por "/?ir=<sección>" (ver src/app/(raiz)/page.js).
import { traducir } from '@/i18n/traducir';
import { IDIOMA_DEFECTO } from '@/i18n/config';

export function manifiesto(lang = IDIOMA_DEFECTO) {
  const t = (clave) => traducir(lang, clave);
  const icono = [{ src: '/icons/icon-192.png', sizes: '192x192' }];
  return {
    id: '/',
    name: 'Tankily',
    short_name: 'Tankily',
    description: t('meta.descripcionCorta'),
    lang,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#050b14',
    theme_color: '#050b14',
    categories: ['social', 'lifestyle', 'education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: t('nav.tanques'), url: '/?ir=tanques', icons: icono },
      { name: t('nav.foro'), url: '/?ir=foro', icons: icono },
      { name: t('herr.corto'), url: '/?ir=herramientas', icons: icono },
    ],
  };
}
