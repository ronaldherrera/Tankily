import Link from 'next/link';
import { IDIOMAS, IDIOMA_DEFECTO } from '@/i18n/config';

// Elige idioma: el último usado (localStorage) o el del navegador; si no, español.
const SCRIPT = `(function(){var l=['${IDIOMAS.join("','")}'],d='${IDIOMA_DEFECTO}',p;try{p=localStorage.getItem('tk-idioma')}catch(e){}if(l.indexOf(p)<0){var n=(navigator.languages||[navigator.language||'']);for(var i=0;i<n.length;i++){var c=String(n[i]).slice(0,2).toLowerCase();if(l.indexOf(c)>=0){p=c;break}}}if(l.indexOf(p)<0)p=d;location.replace('/'+p+'/'+location.search+location.hash)})();`;

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
