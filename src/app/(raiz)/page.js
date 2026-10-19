import Link from 'next/link';
import { IDIOMAS, IDIOMA_DEFECTO } from '@/i18n/config';

// Elige idioma: el último usado (localStorage) o el del navegador; si no, español.
// "?ir=<sección>" (accesos directos de la app instalada) lleva a esa sección en ese idioma.
// Al redirigir se pierde de qué web venía la visita (document.referrer pasa a ser tankily.com): se
// conserva como utm_source para que la analítica (Umami) sepa la procedencia.
const SCRIPT = `(function(){var l=['${IDIOMAS.join("','")}'],d='${IDIOMA_DEFECTO}',p;try{p=localStorage.getItem('tk-idioma')}catch(e){}if(l.indexOf(p)<0){var n=(navigator.languages||[navigator.language||'']);for(var i=0;i<n.length;i++){var c=String(n[i]).slice(0,2).toLowerCase();if(l.indexOf(c)>=0){p=c;break}}}if(l.indexOf(p)<0)p=d;var m=/[?&]ir=([a-z]+)/.exec(location.search),ir=m&&['tanques','foro','herramientas'].indexOf(m[1])>=0?m[1]+'/':'';var q=ir?'':location.search,r='';try{r=new URL(document.referrer).hostname}catch(e){}if(r&&r!==location.hostname&&!/[?&]utm_source=/.test(q))q+=(q?'&':'?')+'utm_source='+encodeURIComponent(r)+'&utm_medium=referral';location.replace('/'+p+'/'+ir+q+location.hash)})();`;

export default function Raiz() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
      <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', gap: 12, fontFamily: 'var(--fuente-texto)' }}>
        <noscript>
          <p style={{ display: 'flex', gap: 16 }}>
            <Link href="/es/">Español</Link>
            <Link href="/en/">English</Link>
          </p>
        </noscript>
      </main>
    </>
  );
}
