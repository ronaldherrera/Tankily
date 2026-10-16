import { notFound } from 'next/navigation';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { FORO_CATEGORIAS, categoriaForo } from '@/lib/constantes';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import CategoriaCliente from '../CategoriaCliente';

// Una página estática por categoría del foro (/foro/reef/…): indexable, con su título y descripción
export function generateStaticParams() {
  return FORO_CATEGORIAS.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }) {
  const { lang, categoria } = await params;
  if (!categoriaForo(categoria)) return {};
  return {
    title: `${traducir(lang, `foro.categorias.${categoria}.nombre`)} · ${traducir(lang, 'seo.foro.t')}`,
    description: traducir(lang, `foro.categorias.${categoria}.descripcion`),
    alternates: alternativas(lang, `/foro/${categoria}/`),
  };
}

export default async function PaginaCategoria({ params }) {
  const { lang, categoria } = await params;
  if (!categoriaForo(categoria)) notFound();
  return (
    <>
      <JsonLd datos={migas([
        ['Tankily', `/${lang}/`],
        [traducir(lang, 'foro.titulo'), `/${lang}/foro/`],
        [traducir(lang, `foro.categorias.${categoria}.nombre`), `/${lang}/foro/${categoria}/`],
      ])} />
      <CategoriaCliente slug={categoria} />
    </>
  );
}
