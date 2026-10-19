import { notFound } from 'next/navigation';
import HiloForo from '@/components/paginas/HiloForo';
import { parametros, datosHilo, resumen } from '@/lib/paginasPublicas';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import { traducir } from '@/i18n/traducir';

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';

// Página indexable de un hilo del foro, en su idioma (lib/paginasPublicas.js). El HTML lleva ya la pregunta
// y las respuestas para los buscadores; al abrirla se actualiza con lo que haya al momento.
export const dynamicParams = false;

export async function generateStaticParams({ params }) {
  const { lang } = await params;
  return parametros('hilo', lang);
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const d = await datosHilo(slug);
  if (!d || d.hilo.idioma !== lang) return { robots: { index: false } };
  return {
    title: `${d.hilo.titulo} · ${traducir(lang, 'foro.titulo')}`,
    description: resumen(d.hilo.contenido),
    alternates: { canonical: `/${lang}/foro/hilo/${d.slug}/` },
    openGraph: d.hilo.imagenes?.[0] ? { images: [d.hilo.imagenes[0]] } : undefined,
  };
}

const persona = (p) => ({ '@type': 'Person', name: p?.nombre || p?.usuario || 'Tankily', url: p?.usuario ? `${URL_SITIO}/es/u/?n=${p.usuario}` : undefined });

export default async function Pagina({ params }) {
  const { lang, slug } = await params;
  const d = await datosHilo(slug);
  if (!d || d.hilo.idioma !== lang) notFound();
  const { hilo, respuestas } = d;
  const url = `${URL_SITIO}/${lang}/foro/hilo/${d.slug}/`;
  return (
    <>
      <JsonLd datos={migas([
        ['Tankily', `/${lang}/`],
        [traducir(lang, 'foro.titulo'), `/${lang}/foro/`],
        [hilo.titulo, `/${lang}/foro/hilo/${d.slug}/`],
      ])} />
      {/* Google muestra los hilos de foros como "Debates y foros" con este marcado */}
      <JsonLd datos={{
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        headline: hilo.titulo,
        text: hilo.contenido,
        url,
        inLanguage: lang,
        datePublished: hilo.creado_en,
        author: persona(hilo.autor),
        image: hilo.imagenes?.length ? hilo.imagenes : undefined,
        interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: respuestas.length },
        comment: respuestas.slice(0, 20).map((r) => ({
          '@type': 'Comment', text: r.contenido, datePublished: r.creado_en, author: persona(r.autor),
        })),
      }} />
      <HiloForo id={hilo.id} inicial={d} />
    </>
  );
}
