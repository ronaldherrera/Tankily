// Manifiesto de la app (PWA): permite instalar Tankily en la pantalla de inicio del móvil
// o como aplicación de escritorio, con su icono y a pantalla completa.
export const dynamic = 'force-static';

export default function manifest() {
  return {
    name: 'Tankily',
    short_name: 'Tankily',
    description: 'The social network for fishkeepers: your tanks, water parameters, forum, marketplace and WikiTank.',
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
      { name: 'Tanques', url: '/es/tanques/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Foro', url: '/es/foro/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Calculadoras', url: '/es/herramientas/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
