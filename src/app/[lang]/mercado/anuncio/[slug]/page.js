import { notFound } from 'next/navigation';
import FichaAnuncio from '@/components/paginas/FichaAnuncio';
import { parametros, datosAnuncio, resumen } from '@/lib/paginasPublicas';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import { formatPrecio } from '@/lib/formatRelativeTime';
import { traducir } from '@/i18n/traducir';

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';

// Página indexable de un anuncio activo del mercado, en su idioma (lib/paginasPublicas.js). Si el anuncio
// se vende o se borra, desaparece en la siguiente publicación nocturna.
export const dynamicParams = false;

export async function generateStaticParams({ params }) {
  const { lang } = await params;
  return parametros('anuncio', lang);
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const d = await datosAnuncio(slug);
  if (!d || d.anuncio.idioma !== lang) return { robots: { index: false } };
  const a = d.anuncio;
  return {
    title: `${a.titulo} · ${formatPrecio(a.precio, a.modalidad, a.moneda)} · ${traducir(lang, 'mercado.titulo')}`,
    description: resumen(a.descripcion || a.titulo),
    alternates: { canonical: `/${lang}/mercado/anuncio/${d.slug}/` },
    openGraph: a.imagenes?.[0] ? { images: [a.imagenes[0]] } : undefined,
  };
}

export default async function Pagina({ params }) {
  const { lang, slug } = await params;
  const d = await datosAnuncio(slug);
  if (!d || d.anuncio.idioma !== lang) notFound();
  const a = d.anuncio;
  return (
    <>
      <JsonLd datos={migas([
        ['Tankily', `/${lang}/`],
        [traducir(lang, 'mercado.titulo'), `/${lang}/mercado/`],
        [a.titulo, `/${lang}/mercado/anuncio/${d.slug}/`],
      ])} />
      {/* Producto con su oferta: precio y disponibilidad (los de cambio o regalo van a 0) */}
      <JsonLd datos={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: a.titulo,
        description: a.descripcion || a.titulo,
        image: a.imagenes?.length ? a.imagenes : undefined,
        url: `${URL_SITIO}/${lang}/mercado/anuncio/${d.slug}/`,
        offers: {
          '@type': 'Offer',
          price: a.modalidad === 'venta' && a.precio != null ? Number(a.precio) : 0,
          priceCurrency: a.moneda || 'EUR',
          availability: a.estado === 'activo' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
          itemCondition: 'https://schema.org/UsedCondition',
          seller: { '@type': a.tienda ? 'Organization' : 'Person', name: a.tienda?.nombre || a.autor?.nombre || a.autor?.usuario },
        },
      }} />
      <FichaAnuncio id={a.id} inicial={d} />
    </>
  );
}
