import { traducir } from '@/i18n/traducir';

// Preferencias de los avisos por email y baja desde los correos: privada, fuera de los buscadores
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: traducir(lang, 'avisos.titulo'), robots: { index: false } };
}

export default function Layout({ children }) {
  return children;
}
