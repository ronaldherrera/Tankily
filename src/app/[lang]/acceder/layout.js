import { traducir } from '@/i18n/traducir';

// Título de la pestaña del navegador. Es una página privada o de cuenta: fuera de los buscadores.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  // El texto ya lleva la marca ("Entra en Tankily"): sin el sufijo " · Tankily"
  return { title: { absolute: traducir(lang, 'acceso.titulo') }, robots: { index: false } };
}

export default function Layout({ children }) {
  return children;
}
