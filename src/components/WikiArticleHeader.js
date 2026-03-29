"use client";

import { useEffect, useState } from 'react';
import Breadcrumbs from './Breadcrumbs';

export default function WikiArticleHeader({ slug, title }) {
  const [currentSection, setCurrentSection] = useState("");
  const [catColor, setCatColor] = useState("#000");

  useEffect(() => {
    // Buscar color de la categoría
    wikiTree.forEach(group => {
      const cat = group.categories.find(c => c.items.some(item => item.file === slug));
      if (cat) setCatColor(cat.color);
    });

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      // Intentar encontrar el nombre legible de la sección si es posible, 
      // o simplemente usar el hash formateado
      if (hash) {
        setCurrentSection(hash.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      } else {
        setCurrentSection("");
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Breadcrumbs currentSlug={slug} currentSection={currentSection} />
        <Link href="/wiki" style={{ 
          textDecoration: 'none', 
          color: 'black', 
          fontSize: '0.85rem', 
          fontWeight: '800', 
          padding: '0.6rem 1.2rem', 
          background: '#eee', 
          borderRadius: '100px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.background = '#ddd'}
        onMouseLeave={(e) => e.target.style.background = '#eee'}
        >
          ← Volver al Índice
        </Link>
      </div>
      <h1 style={{ 
        fontSize: '3.5rem', 
        fontWeight: '900', 
        letterSpacing: '-2px', 
        marginBottom: '0.5rem',
        lineHeight: '1.1',
        color: catColor
      }}>
        {title}
      </h1>
    </div>
  );
}
