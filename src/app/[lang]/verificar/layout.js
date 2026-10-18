import { traducir } from '@/i18n/traducir';

// Destino de los enlaces de los correos de la cuenta: privada, fuera de los buscadores
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: traducir(lang, 'verificar.titulo'), robots: { index: false } };
}

export default function Layout({ children }) {
  return children;
}
