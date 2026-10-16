"use client";

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookA, Search, X, Loader2 } from 'lucide-react';
import { useGlossary } from '../context/GlossaryContext';
import { useT } from '@/i18n/IdiomaProvider';

// El "# GLOSARIO" del Markdown baja a h2: cada página de la wiki ya tiene su propio h1
const SIN_H1 = { h1: ({ node, ...props }) => <h2 {...props} /> };

export default function GlossaryWidget() {
  const { content, loading, error, isOpen, searchTerm, setSearchTerm, openGlossary, closeGlossary } = useGlossary();
  const { t } = useT();

  // Bloquear el scroll de la página y cerrar con Escape mientras está abierto
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const alPulsar = (e) => e.key === 'Escape' && closeGlossary();
    document.addEventListener('keydown', alPulsar);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', alPulsar);
    };
  }, [isOpen, closeGlossary]);

  const toggleModal = () => (isOpen ? closeGlossary() : openGlossary(searchTerm));

  const filteredContent = (() => {
    if (!searchTerm.trim()) return content;
    const query = searchTerm.toLowerCase();
    // Cada definición es un bloque separado por línea en blanco
    return content.split(/\n\s*\n/).filter(block => block.toLowerCase().includes(query)).join('\n\n');
  })();

  return (
    <>
      <button className="glosario-fab cristal cristal-fijo" onClick={toggleModal} title={t('wiki.diccionario')} aria-label={t('wiki.abrirDiccionario')} aria-expanded={isOpen}>
        <BookA size={22} style={{ position: 'relative', zIndex: 2 }} />
      </button>

      <div className="glosario-velo" data-abierto={isOpen} onClick={closeGlossary} aria-hidden={!isOpen}>
        <aside className="glosario-panel cristal cristal-fijo" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('wiki.diccionario')}>
          <div className="glosario-cabecera">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="titulo-m" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><BookA size={22} style={{ color: 'var(--agua)' }} /> {t('wiki.diccionario')}</h2>
              <button className="btn btn-icono btn-s" onClick={closeGlossary} aria-label={t('wiki.cerrarDiccionario')}><X size={18} /></button>
            </div>
            <label className="buscador-mini" style={{ flex: 'none' }}>
              <Search size={16} className="texto-3" />
              <span className="sr-only">{t('wiki.buscarTermino')}</span>
              <input
                type="text"
                placeholder={t('wiki.buscarTerminoEj')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
          </div>

          <div className="glosario-contenido md">
            {loading && (
              <p className="texto-3" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
                <Loader2 size={18} className="girar" /> {t('wiki.cargandoDiccionario')}
              </p>
            )}

            {error && (
              <div className="aviso error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span>{t('wiki.errorDiccionario')}</span>
                <button className="btn btn-s" onClick={() => window.location.reload()}>{t('wiki.reintentar')}</button>
              </div>
            )}

            {!loading && !error && content && (
              filteredContent ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={SIN_H1}>{filteredContent}</ReactMarkdown>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <p className="titulo-s">{t('wiki.ningunTermino', { q: searchTerm })}</p>
                  <p className="pequeno texto-3">{t('wiki.ningunTerminoTexto')}</p>
                </div>
              )
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
