import "./globals.css";
import Header from "@/components/Header";
import TopBar from "@/components/TopBar";

export const metadata = {
  title: "Tankily - Red Social Acuariofilia",
  description: "Comunidad para apasionados de los acuarios.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ display: 'flex', minHeight: '100vh', margin: 0 }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          <main style={{ flex: 1, width: '100%', padding: 0, margin: '0 auto' }}>
            {children}
          </main>
          <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid #eee', fontSize: '0.8rem', color: 'gray' }}>
            &copy; 2026 Tankily - Comunidad de Acuariofilia
          </footer>
        </div>
      </body>
    </html>
  );
}
