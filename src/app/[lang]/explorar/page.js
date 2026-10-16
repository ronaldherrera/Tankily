import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import ExplorarCliente from './ExplorarCliente';

// La página es de cliente; este envoltorio de servidor le da título, descripción y URL canónica propios.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: traducir(lang, 'seo.explorar.t'),
    description: traducir(lang, 'seo.explorar.d'),
    alternates: alternativas(lang, '/explorar/'),
  };
}

export default function Pagina() {
  return <ExplorarCliente />;
}
