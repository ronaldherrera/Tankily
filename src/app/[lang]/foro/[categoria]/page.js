import { notFound } from 'next/navigation';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { FORO_CATEGORIAS, categoriaForo } from '@/lib/constantes';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import { supabase } from '@/lib/supabase';
import { SELECT_HILO } from '@/components/foro/FilaHilo';
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

// Los hilos más recientes, leídos al construir la web: así la página no llega vacía a Google (antes los
// cargaba solo el navegador y Search Console la marcaba como soft 404). El navegador los refresca al abrirla.
async function hilosIniciales(categoria) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { data, error } = await supabase.from('foro_hilos').select(SELECT_HILO).eq('categoria', categoria)
    .order('fijado', { ascending: false }).order('ultima_actividad', { ascending: false }).range(0, 29);
  return error ? null : data || [];
}

export default async function PaginaCategoria({ params }) {
  const { lang, categoria } = await params;
  if (!categoriaForo(categoria)) notFound();
  const inicial = await hilosIniciales(categoria);
  return (
    <>
      <JsonLd datos={migas([
        ['Tankily', `/${lang}/`],
        [traducir(lang, 'foro.titulo'), `/${lang}/foro/`],
        [traducir(lang, `foro.categorias.${categoria}.nombre`), `/${lang}/foro/${categoria}/`],
      ])} />
      <CategoriaCliente slug={categoria} inicial={inicial} />
    </>
  );
}
