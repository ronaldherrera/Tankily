import { traducir } from '@/i18n/traducir';

// Título de la pestaña del navegador. Es una página privada o de cuenta: fuera de los buscadores.
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: traducir(lang, 'nav.mas'), robots: { index: false } };
}

export default function Layout({ children }) {
  return children;
}
