// Google AdSense, en dos fases:
//  1. NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-…): genera ads.txt (para que Google verifique la web) y permite
//     cargar AdSense, pero solo a quien acepta "todas" en nuestro aviso de cookies.
//  2. NEXT_PUBLIC_ADSENSE_CMP=1, cuando el mensaje de consentimiento del RGPD esté configurado en AdSense
//     (Privacidad y mensajes): el gestor certificado de Google sustituye a nuestro aviso y AdSense se carga
//     para todos (Google sirve anuncios no personalizados o limitados a quien no consiente).
// Así nunca hay un momento sin aviso de cookies.
export const ADSENSE_CLIENTE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // ca-pub-XXXXXXXXXXXXXXXX
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
export const ADSENSE_ACTIVO = Boolean(ADSENSE_CLIENTE);
export const ADSENSE_CMP = ADSENSE_ACTIVO && process.env.NEXT_PUBLIC_ADSENSE_CMP === '1';

// Mismo almacenamiento que components/shell/AvisoCookies.js
const aceptoTodas = () => { try { return localStorage.getItem('tk-consentimiento-cookies') === 'todas'; } catch { return false; } };

export function cargarScriptAdsense() {
  if (!ADSENSE_ACTIVO || document.getElementById('adsense')) return;
  if (!ADSENSE_CMP && !aceptoTodas()) {
    // Sin el gestor de Google, se espera a que la persona acepte todas las cookies en nuestro aviso
    window.addEventListener('tk:consentimiento', (e) => { if (e.detail === 'todas') cargarScriptAdsense(); }, { once: true });
    return;
  }
  const s = document.createElement('script');
  s.id = 'adsense';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENTE}`;
  document.head.appendChild(s);
}
