import { alternativas } from '@/lib/seo';
import { traducir } from '@/i18n/traducir';
import { IDIOMAS } from '@/i18n/config';
import { JsonLd, organizacionYSitio } from '@/lib/datosEstructurados';
import { wikiTankTree } from '@/lib/wikiData';
import { especiesWiki } from '@/lib/especiesWiki';
import { HERRAMIENTAS } from '@/lib/herramientas';
import MuroCliente from './MuroCliente';

// La portada es una página de cliente; este envoltorio de servidor declara su URL canónica.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { alternates: alternativas(lang, '/') };
}

// Cifras reales para la portada de visitantes, calculadas en el build (no pesan en el navegador)
const todos = (nodos) => nodos.flatMap((n) => [n, ...todos(n.children || [])]);
const CIFRAS = {
  especies: especiesWiki.filter((e) => e.ficha).length,
  articulos: todos(wikiTankTree).filter((n) => n.contentFiles?.length).length,
  calculadoras: HERRAMIENTAS.length,
  idiomas: IDIOMAS.length,
};

export default async function Portada({ params }) {
  const { lang } = await params;
  return (
    <>
      <JsonLd datos={organizacionYSitio(lang, traducir(lang, 'meta.descripcion'))} />
      <MuroCliente cifras={CIFRAS} />
    </>
  );
}
