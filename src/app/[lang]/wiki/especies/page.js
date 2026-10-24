import { traducir } from '@/i18n/traducir';
import { IDIOMAS_FICHAS } from '@/i18n/config';
import { catalogoEspecies, resumenEspecie } from '@/lib/catalogoEspecies';
import { fichaTraducida } from '@/lib/especiesTraduccion';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import CatalogoCliente from './CatalogoCliente';

// Catálogo de especies de WikiTank. Las tarjetas (con enlace a cada ficha) van en el HTML estático;
// la búsqueda y los filtros funcionan en el navegador. Se indexa en español y en los idiomas con fichas
// traducidas (IDIOMAS_FICHAS), con los nombres comunes de cada idioma; en los demás, noindex y canónica española.
const IDIOMAS_CATALOGO = ['es', ...IDIOMAS_FICHAS];

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const n = catalogoEspecies().length;
  const indexable = IDIOMAS_CATALOGO.includes(lang);
  return {
    title: `${traducir(lang, 'catalogo.titulo')} · WikiTank`,
    description: traducir(lang, 'catalogo.intro', { n }),
    alternates: indexable ? {
      canonical: `/${lang}/wiki/especies/`,
      languages: Object.fromEntries([...IDIOMAS_CATALOGO.map((l) => [l, `/${l}/wiki/especies/`]), ['x-default', '/es/wiki/especies/']]),
    } : { canonical: '/es/wiki/especies/' },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

// Tarjeta en el idioma de la página: con los nombres traducidos si la ficha lo está entera
function resumenEnIdioma(e, lang) {
  const r = resumenEspecie(e);
  const tr = lang !== 'es' && IDIOMAS_FICHAS.includes(lang) ? fichaTraducida(e, lang) : null;
  return tr ? { ...r, comun: tr.comun, otrosNombres: tr.otrosNombres, lang } : { ...r, lang: 'es' };
}

export default async function PaginaCatalogo({ params }) {
  const { lang } = await params;
  const t = (clave, vars) => traducir(lang, clave, vars);
  const especies = catalogoEspecies().map((e) => resumenEnIdioma(e, lang));
  const base = IDIOMAS_CATALOGO.includes(lang) ? lang : 'es';
  return (
    <div className="especie-pagina">
      <JsonLd datos={migas([['WikiTank', `/${base}/wiki/`], [t('catalogo.titulo'), `/${base}/wiki/especies/`]])} />
      <header className="catalogo-cabecera">
        <h1 className="wiki-titulo" style={{ margin: '16px 0 8px' }}>{t('catalogo.titulo')}</h1>
        <p className="texto-2" style={{ maxWidth: '60ch', fontSize: '1.08rem' }}>{t('catalogo.intro', { n: especies.length })}</p>
      </header>
      <CatalogoCliente especies={especies} />
    </div>
  );
}
