import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import TanquesCliente from './TanquesCliente';

// La página es de cliente; este envoltorio de servidor le da título, descripción y URL canónica propios.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: traducir(lang, 'seo.tanques.t'),
    description: traducir(lang, 'seo.tanques.d'),
    alternates: alternativas(lang, '/tanques/'),
  };
}

export default function Pagina() {
  return <TanquesCliente />;
}
