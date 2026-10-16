// Google AdSense. Con NEXT_PUBLIC_ADSENSE_CLIENT configurado, el script se carga en todas las
// páginas: incluye el gestor de consentimiento certificado de Google (obligatorio en el EEE para
// anuncios personalizados), que sustituye a nuestro aviso de cookies. Si el usuario no da su
// consentimiento, Google sirve anuncios no personalizados o limitados.
export const ADSENSE_CLIENTE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // ca-pub-XXXXXXXXXXXXXXXX
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
export const ADSENSE_ACTIVO = Boolean(ADSENSE_CLIENTE);

export function cargarScriptAdsense() {
  if (!ADSENSE_ACTIVO || document.getElementById('adsense')) return;
  const s = document.createElement('script');
  s.id = 'adsense';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENTE}`;
  document.head.appendChild(s);
}
