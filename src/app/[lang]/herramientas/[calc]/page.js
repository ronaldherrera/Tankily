import { notFound } from 'next/navigation';
import Link from '@/components/Enlace';
import Lateral from '@/components/Lateral';
import Calculadora from '@/components/herramientas/Calculadoras';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { HERRAMIENTAS } from '@/lib/herramientas';
import { JsonLd, migas, herramientaWeb } from '@/lib/datosEstructurados';

const CLAVES = HERRAMIENTAS.map((h) => h.clave);

export function generateStaticParams() {
  return CLAVES.map((calc) => ({ calc }));
}

export async function generateMetadata({ params }) {
  const { lang, calc } = await params;
  if (!CLAVES.includes(calc)) return {};
  return {
    title: traducir(lang, `herr.${calc}.titulo`),
    description: traducir(lang, `herr.${calc}.desc`),
    alternates: alternativas(lang, `/herramientas/${calc}/`),
  };
}

export default async function PaginaCalculadora({ params }) {
  const { lang, calc } = await params;
  if (!CLAVES.includes(calc)) notFound();
  const t = (clave, vars) => traducir(lang, clave, vars);
  return (
    <div className="contenido">
      <JsonLd datos={[
        herramientaWeb({ nombre: t(`herr.${calc}.titulo`), descripcion: t(`herr.${calc}.desc`), ruta: `/${lang}/herramientas/${calc}/`, lang }),
        migas([['Tankily', `/${lang}/`], [t('herr.corto'), `/${lang}/herramientas/`], [t(`herr.${calc}.corto`), `/${lang}/herramientas/${calc}/`]]),
      ]} />
      <article className="columna">
        <header className="calc-cabecera">
          <Link href="/herramientas/" className="mini enlace">{t('herr.corto')}</Link>
          <h1 className="titulo-l">{t(`herr.${calc}.titulo`)}</h1>
          <p className="texto-2">{t(`herr.${calc}.desc`)}</p>
        </header>
        <section className="cristal-suave calc-panel">
          <Calculadora tipo={calc} />
        </section>
        <section className="calc-explicacion">
          <h2 className="titulo-s">{t('herr.comoSeCalcula')}</h2>
          <p className="prosa texto-2">{t(`herr.${calc}.explicacion`)}</p>
        </section>
        <nav aria-label={t('herr.otras')} className="calc-otras">
          <h2 className="titulo-s">{t('herr.otras')}</h2>
          <div className="chips">
            {CLAVES.filter((c) => c !== calc).map((c) => <Link key={c} href={`/herramientas/${c}/`} className="chip">{t(`herr.${c}.corto`)}</Link>)}
          </div>
        </nav>
      </article>
      <Lateral />
    </div>
  );
}
