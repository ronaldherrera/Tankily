// Datos estructurados (JSON-LD) para buscadores: Google entiende qué es cada página y puede
// mostrar resultados enriquecidos (organización, buscador del sitio, migas de pan, herramientas).
const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';

export function JsonLd({ datos }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }} />;
}

export const organizacionYSitio = (lang, descripcion) => [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tankily',
    url: URL_SITIO,
    logo: `${URL_SITIO}/icons/icon-512.png`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tankily',
    url: `${URL_SITIO}/${lang}/`,
    inLanguage: lang,
    description: descripcion,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${URL_SITIO}/${lang}/explorar/?q={consulta}` },
      'query-input': 'required name=consulta',
    },
  },
];

export const migas = (elementos) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: elementos.map(([nombre, ruta], i) => ({ '@type': 'ListItem', position: i + 1, name: nombre, item: `${URL_SITIO}${ruta}` })),
});

export const herramientaWeb = ({ nombre, descripcion, ruta, lang }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: nombre,
  description: descripcion,
  url: `${URL_SITIO}${ruta}`,
  inLanguage: lang,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
});
