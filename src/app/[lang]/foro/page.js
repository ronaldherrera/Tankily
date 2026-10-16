import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import ForoCliente from './ForoCliente';

// La página es de cliente; este envoltorio de servidor le da título, descripción y URL canónica propios.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: traducir(lang, 'seo.foro.t'),
    description: traducir(lang, 'seo.foro.d'),
    alternates: alternativas(lang, '/foro/'),
  };
}

export default function Pagina() {
  return <ForoCliente />;
}
