// Navegadores dentro de otras apps (Facebook, Instagram, TikTok…): al tocar un enlace en esas apps la web se abre
// en su propio visor y no en Chrome o Safari. Google no deja iniciar sesión ahí (error 403 disallowed_useragent),
// así que en esos visores se quita "Continuar con Google" y se ofrece abrir la página en el navegador.
const APPS = [
  ['Facebook', /FBAN|FBAV|FB_IAB|FBIOS|FB4A/],
  ['Instagram', /Instagram/],
  ['TikTok', /musical_ly|BytedanceWebview|TikTok/i],
  ['Messenger', /Messenger/],
  ['LinkedIn', /LinkedInApp/],
  ['Snapchat', /Snapchat/],
  ['LINE', /\bLine\//],
];

// Nombre de la app cuyo visor está abierto, o null en un navegador normal
export function navegadorDeApp(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  return APPS.find(([, patron]) => patron.test(ua))?.[0] || null;
}

export const esAndroid = (ua = typeof navigator === 'undefined' ? '' : navigator.userAgent) => /Android/i.test(ua);

// En Android, un enlace intent:// abre la misma página en Chrome (y, si no está, en el navegador por defecto).
// En iOS no hay forma de salir del visor desde la página: hay que usar el menú de la app.
export function enlaceAlNavegador(url = window.location.href) {
  const u = new URL(url);
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(u.href)};end`;
}
