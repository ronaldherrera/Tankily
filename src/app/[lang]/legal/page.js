import Link from '@/components/Enlace';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { DOCS_LEGALES as DOCS } from '@/lib/legales';

// /legal/: índice con todos los documentos legales (antes daba 403 al no existir la página)
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: traducir(lang, 'legal.otros'), alternates: alternativas(lang, '/legal/') };
}

export default async function LegalIndice({ params }) {
  const { lang } = await params;
  const t = (clave) => traducir(lang, clave);

  return (
    <div className="contenido">
      <article className="columna" style={{ gap: 20, paddingTop: 12 }}>
        <h1 className="titulo-l">{t('legal.otros')}</h1>
        <nav className="chips" aria-label={t('legal.otros')}>
          {DOCS.map((d) => <Link key={d} className="chip" href={`/legal/${d}/`}>{t(`legal.docs.${d}.titulo`)}</Link>)}
        </nav>
      </article>
    </div>
  );
}
