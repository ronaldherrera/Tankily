"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useGlossary } from '../context/GlossaryContext';

export default function GlossaryWidget() {
  const { content, loading, error, isOpen, searchTerm, setSearchTerm, openGlossary, closeGlossary } = useGlossary();
  
  // Ref to handle clicking outside to close
  const sheetRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const toggleModal = () => isOpen ? closeGlossary() : openGlossary(searchTerm);

  // Handle click outside
  const handleBackdropClick = (e) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target)) {
      closeGlossary();
    }
  };

  const filteredContent = (() => {
    if (!searchTerm.trim()) return content;
    const query = searchTerm.toLowerCase();
    
    // Divide the markdown by blank lines
    return content.split(/\n\s*\n/).filter(block => {
      return block.toLowerCase().includes(query);
    }).join('\n\n');
  })();

  return (
    <>
      <style jsx>{`
        .glossary-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background: linear-gradient(135deg, #0f172a 0%, #000000 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.1);
          cursor: pointer;
          z-index: 9999;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .glossary-fab:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 15px 35px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.1);
        }
        .glossary-fab:active {
          transform: translateY(0) scale(0.95);
        }
        .backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
          z-index: 10000;
          opacity: ${isOpen ? 1 : 0};
          visibility: ${isOpen ? 'visible' : 'hidden'};
          transition: all 0.4s ease;
        }
        .side-sheet {
          position: fixed;
          top: 0;
          right: 0;
          width: 100%;
          max-width: 550px;
          height: 100vh;
          background: #ffffff;
          box-shadow: -10px 0 50px rgba(0,0,0,0.1);
          z-index: 10001;
          transform: translateX(${isOpen ? '0%' : '100%'});
          transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
          display: flex;
          flex-direction: column;
        }
        .sheet-header {
          padding: 1.5rem 2rem;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .sheet-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .close-btn {
          background: #f5f5f5;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 18px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .close-btn:hover {
          background: #e0e0e0;
        }
        .sheet-content {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }
        .loading-state, .error-state {
          padding: 3rem 2rem;
          text-align: center;
          color: #666;
        }
      `}</style>

      {/* Botón Flotante */}
      <div className="glossary-fab" onClick={toggleModal} title="Abrir Diccionario">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
      </div>

      {/* Backdrop (Fondo oscuro con desenfoque) */}
      <div className="backdrop" onClick={handleBackdropClick}>
        
        {/* Side-Sheet (Cajón lateral) */}
        <div className="side-sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
          <div className="sheet-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="sheet-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
                Diccionario
              </h2>
              <button className="close-btn" onClick={closeGlossary} aria-label="Cerrar diccionario">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {/* Buscador Integrado */}
            <div style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Buscar término (ej. Nitrato, Coral, TDS)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.95rem',
                  outline: 'none',
                  background: '#f8fafc',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#000';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div className="sheet-content wiki-article-container wiki-content">
            {loading && (
              <div className="loading-state">
                <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid #000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando glosario...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            
            {error && (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={() => {setError(null); setLoading(true); setContent('');}} style={{ padding: '0.5rem 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}>Intentar de nuevo</button>
              </div>
            )}
            
            {!loading && !error && content && (
              <>
                {filteredContent ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {filteredContent}
                  </ReactMarkdown>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No se encontraron resultados</p>
                    <p style={{ fontSize: '0.9rem' }}>Intenta con otro término.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
