import { IDIOMAS } from '@/i18n/config';
import { manifiesto } from '@/lib/manifiesto';

// /<idioma>/manifest.webmanifest, generado en el build (export estático)
export const dynamic = 'force-static';

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export async function GET(_peticion, { params }) {
  const { lang } = await params;
  return new Response(JSON.stringify(manifiesto(lang)), { headers: { 'Content-Type': 'application/manifest+json' } });
}
