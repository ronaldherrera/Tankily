import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { catalogoEspecies } from '@/lib/catalogoEspecies';
import WikiCliente from './WikiCliente';

// La página es de cliente; este envoltorio de servidor le da título, descripción y URL canónica propios.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: traducir(lang, 'seo.wiki.t'),
    description: traducir(lang, 'seo.wiki.d'),
    alternates: alternativas(lang, '/wiki/'),
  };
}

// Número de especies y unas fotos para el acceso destacado al catálogo (calculado en el build)
export default function Pagina() {
  const especies = catalogoEspecies();
  const muestra = especies.filter((e) => e.imagen && e.categoria === 'pez').filter((_, i) => i % 9 === 0).slice(0, 4).map((e) => e.imagen);
  return <WikiCliente numEspecies={especies.length} fotosEspecies={muestra} />;
}
