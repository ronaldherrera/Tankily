import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import TiendasCliente from './TiendasCliente';

// La página es de cliente; este envoltorio de servidor le da título, descripción y URL canónica propios.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: traducir(lang, 'seo.tiendas.t'),
    description: traducir(lang, 'seo.tiendas.d'),
    alternates: alternativas(lang, '/tiendas/'),
  };
}

export default function Pagina() {
  return <TiendasCliente />;
}
