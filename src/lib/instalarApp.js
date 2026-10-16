// Instalar Tankily como app desde el navegador (PWA). Aún no hay app en las tiendas.

// Chrome/Edge en Android lanzan "beforeinstallprompt" muy pronto, a veces antes de que React se monte:
// este script en <head> lo guarda para que AvisoApp pueda abrir el instalador después.
// preventDefault() quita la mini barra de Chrome: ya mostramos nuestro propio aviso.
export const SCRIPT_INSTALAR = `addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__tkInstalar=e;dispatchEvent(new Event('tk:instalable'))});addEventListener('appinstalled',function(){window.__tkInstalar=null;try{localStorage.setItem('tk-app-instalada','1')}catch(e){}});`;

// Ya se abre como app (desde el icono de la pantalla de inicio)
export function enModoApp() {
  return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
}

// 'ios' (iPhone/iPad), 'android', u 'otro' (ordenador)
export function plataforma() {
  const ua = navigator.userAgent;
  // El iPad con iPadOS se presenta como un Mac: se distingue por la pantalla táctil
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'otro';
}
