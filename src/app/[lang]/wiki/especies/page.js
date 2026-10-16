import { traducir } from '@/i18n/traducir';
import { catalogoEspecies, resumenEspecie } from '@/lib/catalogoEspecies';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import CatalogoCliente from './CatalogoCliente';

// Catálogo de especies de WikiTank. Las tarjetas (con enlace a cada ficha) van en el HTML estático;
// la búsqueda y los filtros funcionan en el navegador. Como el resto de la wiki, se indexa en español.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  const n = catalogoEspecies().length;
  return {
    title: `${traducir(lang, 'catalogo.titulo')} · WikiTank`,
    description: traducir(lang, 'catalogo.intro', { n }),
    alternates: { canonical: '/es/wiki/especies/' },
    robots: lang === 'es' ? undefined : { index: false, follow: true },
  };
}

export default async function PaginaCatalogo({ params }) {
  const { lang } = await params;
  const t = (clave, vars) => traducir(lang, clave, vars);
  const especies = catalogoEspecies().map(resumenEspecie);
  return (
    <div className="especie-pagina">
      <JsonLd datos={migas([['WikiTank', '/es/wiki/'], [t('catalogo.titulo'), '/es/wiki/especies/']])} />
      <header className="catalogo-cabecera">
        <h1 className="wiki-titulo" style={{ margin: '16px 0 8px' }}>{t('catalogo.titulo')}</h1>
        <p className="texto-2" style={{ maxWidth: '60ch', fontSize: '1.08rem' }}>{t('catalogo.intro', { n: especies.length })}</p>
      </header>
      <CatalogoCliente especies={especies} />
    </div>
  );
}
