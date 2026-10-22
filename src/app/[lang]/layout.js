import { notFound } from 'next/navigation';
import '../globals.css';
import { fredoka, geist } from '@/lib/fuentes';
import { SesionProvider } from '@/lib/sesion';
import { TostadaProvider } from '@/components/ui';
import AppShell from '@/components/shell/AppShell';
import { SCRIPT_TEMA } from '@/lib/scriptTema';
import { SCRIPT_INSTALAR } from '@/lib/instalarApp';
import { IDIOMAS, LOCALES, esIdioma } from '@/i18n/config';
import { IdiomaProvider } from '@/i18n/IdiomaProvider';
import { traducir } from '@/i18n/traducir';
import { UMAMI_ID, UMAMI_SCRIPT, SCRIPT_SIN_ANALITICA } from '@/lib/analitica';

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';

export const dynamicParams = false;

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = (clave) => traducir(lang, clave);
  return {
    metadataBase: new URL(URL_SITIO),
    title: { default: t('meta.titulo'), template: '%s · Tankily' },
    description: t('meta.descripcion'),
    icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }], apple: '/apple-touch-icon.png' },
    manifest: `/${lang}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: 'Tankily', statusBarStyle: 'black-translucent' },
    keywords: t('meta.palabrasClave'),
    openGraph: {
      type: 'website',
      locale: LOCALES[lang].replace('-', '_'),
      siteName: 'Tankily',
      title: t('meta.titulo'),
      description: t('meta.descripcionCorta'),
      images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Tankily' }],
    },
    twitter: { card: 'summary_large_image', images: ['/og.jpg'] },
  };
}

export const viewport = {
  themeColor: '#050b14',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();

  return (
    <html lang={lang} data-tema="oscuro" className={`${geist.variable} ${fredoka.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_INSTALAR }} />
        {/* Casi todas las páginas piden datos a Supabase al cargar: se abre la conexión cuanto antes */}
        {/* Analítica sin cookies (src/lib/analitica.js); data-domains: no cuenta las visitas en local;
            data-exclude-hash: al volver de iniciar sesión el token de Supabase va tras el # y no debe salir de la web */}
        {UMAMI_ID && <script dangerouslySetInnerHTML={{ __html: SCRIPT_SIN_ANALITICA }} />}
        {UMAMI_ID && <script defer src={UMAMI_SCRIPT} data-website-id={UMAMI_ID} data-domains="tankily.com" data-exclude-hash="true" />}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />}
      </head>
      <body>
        <IdiomaProvider lang={lang}>
          <SesionProvider>
            <TostadaProvider>
              <AppShell>{children}</AppShell>
            </TostadaProvider>
          </SesionProvider>
        </IdiomaProvider>
      </body>
    </html>
  );
}
