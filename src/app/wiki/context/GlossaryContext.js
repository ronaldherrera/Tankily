"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const GlossaryContext = createContext(null);

export function GlossaryProvider({ children }) {
  const [content, setContent] = useState('');
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carga e inicialización global
  useEffect(() => {
    fetch('/wiki-media/Glosario/Glosario.md')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar el archivo');
        return res.text();
      })
      .then(text => {
        setContent(text);
        
        // Extraer términos
        const regex = /^\*\*([^*]+)\*\*:/gm;
        const extractedTerms = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          let rawTerm = match[1].trim();
          
          if (rawTerm.includes('(')) {
             const parts = rawTerm.split('(');
             extractedTerms.push(parts[0].trim());
             const inParen = rawTerm.match(/\(([^)]+)\)/);
             if (inParen && inParen[1] && inParen[1].trim().length > 2) {
                 extractedTerms.push(inParen[1].trim());
             }
          } else {
             extractedTerms.push(rawTerm);
          }
        }
        
        // Ordenarlos de mayor a menor longitud para evitar matches parciales en Regex (ej. "Amonio" vs "Amoniaco")
        const cleanTerms = extractedTerms
          .filter(t => t.length > 2)
          .sort((a,b) => b.length - a.length);
          
        setTerms(cleanTerms);
        setLoading(false);
      })
      .catch(err => {
        console.error("Glossary fetch error:", err);
        setError("Error cargando diccionario");
        setLoading(false);
      });
  }, []);

  const openGlossary = (term = '') => {
    setSearchTerm(term);
    setIsOpen(true);
  };

  const closeGlossary = () => {
    setIsOpen(false);
  };

  return (
    <GlossaryContext.Provider value={{ content, terms, loading, error, isOpen, searchTerm, setSearchTerm, openGlossary, closeGlossary }}>
      {children}
    </GlossaryContext.Provider>
  );
}

export function useGlossary() {
  const ctx = useContext(GlossaryContext);
  if (!ctx) {
    throw new Error('useGlossary must be used within a GlossaryProvider');
  }
  return ctx;
}
