import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Tankily - Red Social Acuariofilia",
  description: "Comunidad para apasionados de los acuarios.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header>
          <h1>Tankily</h1>
          <nav style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link href="/">Muro</Link>
            <Link href="/acuarios">Mis Acuarios</Link>
            <Link href="/wiki">Wiki</Link>
            <Link href="/mercado">Mercado</Link>
            <Link href="/perfil">Mi Perfil</Link>
            <span style={{ color: '#ccc' }}>|</span>
            <Link href="/acceder">Entrar</Link>
            <Link href="/registro" style={{ fontWeight: 'bold' }}>Registro</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; 2026 Tankily - Comunidad de Acuariofilia</p>
        </footer>
      </body>
    </html>
  );
}
