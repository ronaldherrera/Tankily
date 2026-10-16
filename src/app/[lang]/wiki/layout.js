"use client";

import GlossaryWidget from './components/GlossaryWidget';
import { GlossaryProvider } from './context/GlossaryContext';

export default function WikiLayout({ children }) {
  return (
    <GlossaryProvider>
      <div style={{ minHeight: 'calc(100vh - 80px)', background: '#fcfcfc', padding: '2rem 0' }}>
        {/* Área Central de Contenido */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          {children}
        </main>

        {/* Widget Global del Diccionario Flotante */}
        <GlossaryWidget />

      <style jsx global>{`
        .wiki-article-container h1 { font-size: 3.5rem; font-weight: 900; letter-spacing: -2px; margin-bottom: 2rem; line-height: 1.1; }
        .wiki-article-container h2 { font-size: 2rem; margin-top: 3rem; margin-bottom: 1.5rem; font-weight: 800; border: none; }
        .wiki-article-container h3 { font-size: 1.5rem; margin-top: 2.5rem; font-weight: 700; }
        .wiki-article-container p { line-height: 1.8; font-size: 1.15rem; color: #444; margin-bottom: 1.5rem; }
        
        .nav-card-hover { transition: all 0.3s ease; }
        .nav-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.05);
        }

        .wiki-content table { width: 100%; border-collapse: collapse; margin: 2rem 0; font-size: 1rem; }
        .wiki-content th { background: #f8f8f8; text-align: left; padding: 1.2rem; border: 1px solid #eee; font-weight: 800; }
        .wiki-content td { padding: 1.2rem; border: 1px solid #eee; }
        .wiki-content blockquote { border-left: 6px solid black; padding: 1.5rem 2rem; background: #fafafa; margin: 2.5rem 0; font-style: italic; font-size: 1.1rem; border-radius: 0 16px 16px 0; }
        .wiki-content code { background: #f5f5f5; padding: 0.3rem 0.6rem; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
      `}</style>
      </div>
    </GlossaryProvider>
  );
}
