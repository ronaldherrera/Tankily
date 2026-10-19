import { notFound } from 'next/navigation';
import FichaTanque from '@/components/paginas/FichaTanque';
import { parametros, datosTanque, resumen } from '@/lib/paginasPublicas';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import { imagenTanque } from '@/lib/constantes';
import { traducir } from '@/i18n/traducir';

// Página indexable de un tanque público, en el idioma de su dueño (lib/paginasPublicas.js).
// El HTML lleva ya la ficha rellena para los buscadores; al abrirla se actualiza con los datos al momento.
export const dynamicParams = false;

export async function generateStaticParams({ params }) {
  const { lang } = await params;
  return parametros('tanque', lang);
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const d = await datosTanque(slug);
  if (!d || d.tanque.idioma !== lang) return { robots: { index: false } };
  const { tanque, habitantes } = d;
  const tipo = traducir(lang, `tipos.${tanque.tipo}`);
  const especies = [...new Set(habitantes.map((h) => h.nombre))].slice(0, 6).join(', ');
  const autor = tanque.autor?.nombre || `@${tanque.autor?.usuario}`;
  return {
    title: `${tanque.nombre} · ${tipo}${tanque.litros ? ` ${tanque.litros} l` : ''}`,
    description: resumen(tanque.descripcion || `${tipo}${tanque.litros ? ` de ${tanque.litros} l` : ''} de ${autor}${especies ? `: ${especies}` : ''}.`),
    alternates: { canonical: `/${lang}/tanque/${d.slug}/` },
    openGraph: { images: [imagenTanque(tanque)] },
  };
}

export default async function Pagina({ params }) {
  const { lang, slug } = await params;
  const d = await datosTanque(slug);
  if (!d || d.tanque.idioma !== lang) notFound();
  return (
    <>
      <JsonLd datos={migas([
        ['Tankily', `/${lang}/`],
        [traducir(lang, 'tanques.titulo'), `/${lang}/tanques/`],
        [d.tanque.nombre, `/${lang}/tanque/${d.slug}/`],
      ])} />
      <FichaTanque id={d.tanque.id} inicial={d} />
    </>
  );
}
