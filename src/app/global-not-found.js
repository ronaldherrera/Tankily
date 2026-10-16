/* eslint-disable @next/next/no-html-link-for-pages -- el script cambia el idioma de los enlaces; <a> normales para que React no los reescriba */
import './globals.css';
import { fredoka, geist } from '@/lib/fuentes';

export const metadata = {
  title: '404 · Tankily',
  robots: { index: false },
};

// Textos del 404 en los 8 idiomas: es una página estática única, así que el idioma se elige
// en el navegador a partir de la URL (/de/..., /fr/...) o, si no la hay, del idioma del navegador.
const TEXTOS = {
  es: ['Esta página no existe', 'Puede que el enlace esté mal escrito o que el contenido se haya borrado.', 'Ir al inicio', 'Buscar', 'WikiTank'],
  en: ['This page doesn’t exist', 'The link may be mistyped, or the content may have been deleted.', 'Go home', 'Search', 'WikiTank'],
  de: ['Diese Seite gibt es nicht', 'Vielleicht ist der Link falsch geschrieben oder der Inhalt wurde gelöscht.', 'Zur Startseite', 'Suchen', 'WikiTank'],
  pt: ['Esta página não existe', 'O link pode estar errado ou o conteúdo pode ter sido apagado.', 'Ir para o início', 'Pesquisar', 'WikiTank'],
  fr: ['Cette page n’existe pas', 'Le lien est peut-être mal écrit, ou le contenu a été supprimé.', 'Aller à l’accueil', 'Rechercher', 'WikiTank'],
  it: ['Questa pagina non esiste', 'Il link potrebbe essere sbagliato o il contenuto è stato eliminato.', 'Vai alla home', 'Cerca', 'WikiTank'],
  nl: ['Deze pagina bestaat niet', 'De link is misschien verkeerd getypt, of de inhoud is verwijderd.', 'Naar de startpagina', 'Zoeken', 'WikiTank'],
  pl: ['Ta strona nie istnieje', 'Link może być błędny albo treść została usunięta.', 'Strona główna', 'Szukaj', 'WikiTank'],
};

const elegirIdioma = `(function(){var T=${JSON.stringify(TEXTOS)};
var m=location.pathname.match(/^\\/([a-z]{2})(\\/|$)/);var l=m&&T[m[1]]?m[1]:(navigator.language||'').slice(0,2);if(!T[l])l='es';
var t=T[l];document.documentElement.lang=l;
document.querySelectorAll('[data-t]').forEach(function(e){e.textContent=t[+e.dataset.t]});
document.querySelectorAll('[data-ruta]').forEach(function(e){e.href='/'+l+e.dataset.ruta});})();`;

export default function GlobalNotFound() {
  const t = TEXTOS.es;
  return (
    <html lang="es" suppressHydrationWarning data-tema="oscuro" className={`${geist.variable} ${fredoka.variable}`}>
      <body>
        <div className="causticas" aria-hidden="true" />
        <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div className="cristal" style={{ padding: 32, maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
            <p className="cifra" style={{ fontSize: '3rem' }}>404</p>
            <h1 className="titulo-m" data-t="0" suppressHydrationWarning>{t[0]}</h1>
            <p className="texto-2" data-t="1" suppressHydrationWarning>{t[1]}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
              <a suppressHydrationWarning className="btn btn-primario" href="/es/" data-ruta="/" data-t="2">{t[2]}</a>
              <a suppressHydrationWarning className="btn" href="/es/explorar/" data-ruta="/explorar/" data-t="3">{t[3]}</a>
              <a suppressHydrationWarning className="btn" href="/es/wiki/" data-ruta="/wiki/" data-t="4">{t[4]}</a>
            </div>
          </div>
        </main>
        <script dangerouslySetInnerHTML={{ __html: elegirIdioma }} />
      </body>
    </html>
  );
}
