import { notFound } from 'next/navigation';
import Link from '@/components/Enlace';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';

const EMAIL = process.env.NEXT_PUBLIC_EMAIL_CONTACTO || 'contacto@tankily.com';
const DOCS = ['aviso-legal', 'privacidad', 'cookies', 'normas'];

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }) {
  const { lang, doc } = await params;
  if (!DOCS.includes(doc)) return {};
  return { title: traducir(lang, `legal.docs.${doc}.titulo`), alternates: alternativas(lang, `/legal/${doc}/`) };
}

export default async function LegalPage({ params }) {
  const { lang, doc } = await params;
  if (!DOCS.includes(doc)) notFound();
  const t = (clave, vars) => traducir(lang, clave, vars);
  const secciones = t(`legal.docs.${doc}.secciones`);

  return (
    <div className="contenido">
      <article className="columna" style={{ gap: 20, paddingTop: 12 }}>
        <h1 className="titulo-l">{t(`legal.docs.${doc}.titulo`)}</h1>
        {secciones.map(([titulo, texto]) => (
          <section key={titulo}>
            <h2 className="titulo-s" style={{ marginBottom: 6 }}>{titulo}</h2>
            <p className="prosa texto-2">{texto.replace('{email}', EMAIL)}</p>
          </section>
        ))}
        <nav className="chips" aria-label={t('legal.otros')}>
          {DOCS.filter((d) => d !== doc).map((d) => <Link key={d} className="chip" href={`/legal/${d}/`}>{t(`legal.docs.${d}.titulo`)}</Link>)}
        </nav>
      </article>
    </div>
  );
}
