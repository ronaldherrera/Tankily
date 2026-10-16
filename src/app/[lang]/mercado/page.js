import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import MercadoCliente from './MercadoCliente';

// La página es de cliente; este envoltorio de servidor le da título, descripción y URL canónica propios.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: traducir(lang, 'seo.mercado.t'),
    description: traducir(lang, 'seo.mercado.d'),
    alternates: alternativas(lang, '/mercado/'),
  };
}

export default function Pagina() {
  return <MercadoCliente />;
}
