import '../globals.css';
import { fredoka, geist } from '@/lib/fuentes';

export const metadata = {
  title: 'Tankily',
  description: 'Tankily — la comunidad de los acuarios · the aquarium community',
  robots: { index: false, follow: true },
};

// Layout mínimo de la raíz "/": solo sirve para redirigir al idioma del visitante
export default function RaizLayout({ children }) {
  return (
    <html lang="es" data-tema="oscuro" className={`${geist.variable} ${fredoka.variable}`}>
      <body>{children}</body>
    </html>
  );
}
