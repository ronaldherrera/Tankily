import { notFound } from 'next/navigation';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { TIPOS_TANQUE, slugTipo, tipoDeSlug } from '@/lib/constantes';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import TanquesCliente from '../TanquesCliente';

// Una página estática por tipo de acuario (/tanques/plantado/…), con título y descripción propios
export function generateStaticParams() {
  return Object.keys(TIPOS_TANQUE).filter((k) => k !== 'otro').map((k) => ({ tipo: slugTipo(k) }));
}

export async function generateMetadata({ params }) {
  const { lang, tipo: slug } = await params;
  const tipo = tipoDeSlug(slug);
  if (!tipo) return {};
  const nombre = traducir(lang, `tipos.${tipo}`);
  return {
    title: traducir(lang, 'seo.tipoTanque.t', { tipo: nombre }),
    description: traducir(lang, 'seo.tipoTanque.d', { tipo: nombre }),
    alternates: alternativas(lang, `/tanques/${slug}/`),
  };
}

export default async function PaginaTipo({ params }) {
  const { lang, tipo: slug } = await params;
  const tipo = tipoDeSlug(slug);
  if (!tipo) notFound();
  return (
    <>
      <JsonLd datos={migas([
        ['Tankily', `/${lang}/`],
        [traducir(lang, 'tanques.titulo'), `/${lang}/tanques/`],
        [traducir(lang, `tipos.${tipo}`), `/${lang}/tanques/${slug}/`],
      ])} />
      <TanquesCliente tipo={tipo} />
    </>
  );
}
