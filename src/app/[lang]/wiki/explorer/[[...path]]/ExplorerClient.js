"use client";

import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Breadcrumbs from '@/components/Breadcrumbs';
import ModernDiagram from '@/components/ModernDiagram';
import { useGlossary } from '../../context/GlossaryContext';

export default function ExplorerClient({ currentNode, pathArray, content }) {
  const { terms, openGlossary } = useGlossary();

  // Identificar "ESPECIES HABITUALES" de forma más robusta
  const specialChild = currentNode.children?.find(c => {
    const title = c.title.toUpperCase();
    return title.includes("ESPECIES HABITUALES") || title.includes("HABITANTES") || title.includes("FAUNA") || title.includes("IDENTIFICACION");
  });
  const otherChildren = currentNode.children?.filter(c => c !== specialChild) || [];

  // Lógica de división de contenido original
  const [beforeSplit, afterSplit] = content?.split('<!-- SPLIT_HERE -->') || [content, ""];

  // Estado para el Modal de Pokedex
  const [selectedPokedexNode, setSelectedPokedexNode] = React.useState(null);

  React.useEffect(() => {
    if (selectedPokedexNode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedPokedexNode]);

  // Componente para la Tarjeta Especial de Especies (Convertida en Pokédex)
  const SpecialCard = () => {
    if (!specialChild || !specialChild.children || specialChild.children.length === 0) return null;

    return (
      <div style={{ margin: '3.5rem 0', maxWidth: '100%', minWidth: 0, width: '100%' }}>
        <h2 style={{ 
          margin: '0 0 1.5rem 0', 
          fontSize: '1.6rem', 
          fontWeight: '900', 
          letterSpacing: '-1px',
          color: '#000',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '0.75rem'
        }}>
          Especies habituales
        </h2>
        {specialChild.children.map((child, idx) => (
          <PokedexCategoryLine key={idx} node={child} onSelectSpecies={setSelectedPokedexNode} />
        ))}
      </div>
    );
  };


  // Componente para la Tarjeta de Algas
  const AlgaeCard = () => (
    <div style={{ margin: '2rem 0' }}>
      <Link 
        href={`/wiki/explorer/algas`}
        style={{
          background: '#000',
          borderRadius: '24px',
          padding: '1.2rem 2.2rem',
          textDecoration: 'none',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1.2rem',
          color: 'white',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        }}
      >
        <div style={{ 
          width: '36px', 
          height: '36px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '10px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div style={{ textAlign: 'left' }}>
          <span style={{ 
            display: 'block', 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            opacity: 0.5,
            marginBottom: '2px'
          }}>
            Guía completa:
          </span>
          <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '0.5px' }}>
            SABER MÁS SOBRE ALGAS
          </span>
        </div>
        <span style={{ opacity: 0.5, fontSize: '1.2rem', marginLeft: '0.5rem' }}>→</span>
      </Link>
    </div>
  );

  const markdownComponents = {
    h1: () => null,
    code: ({ inline, className, children, ...props }) => {
      const match = /language-diagram-([a-zA-Z0-9-]+)/.exec(className || '');
      if (!inline && match) {
        return <ModernDiagram type={match[1]} />;
      }
      return <code className={className} {...props}>{children}</code>;
    },
    a: ({ href, children }) => {
      // Glosario Auto-Link
      if (href?.startsWith('#glossary:')) {
        const term = decodeURIComponent(href.replace('#glossary:', ''));
        return (
          <span 
            className="glossary-highlight" 
            onClick={() => openGlossary(term)}
            title="Abrir definición en glosario"
            style={{ 
              borderBottom: '1.5px dashed #0066FF', 
              color: 'inherit', 
              cursor: 'pointer',
              position: 'relative',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(0, 102, 255, 0.05)';
              e.target.style.color = '#0066FF';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'inherit';
            }}
          >
            {children}
          </span>
        );
      }

      // Si es un enlace externo, usar normal
      if (href?.startsWith('http') || href?.startsWith('#')) {
        return <a href={href}>{children}</a>;
      }

      // Convertir enlaces internos (.md relativos) a rutas de nuestro explorador
      const cleanHref = href?.replace('.md', '').split('/').map(part => {
        return part.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, '-');
      }).join('/');

      // Resolver ruta relativa
      const targetPath = cleanHref.startsWith('/') 
        ? `/wiki/explorer${cleanHref}`
        : `/wiki/explorer/${pathArray.join('/')}/${cleanHref}`;

      return (
        <Link 
          href={targetPath} 
          style={{ color: '#0066FF', textDecoration: 'none', fontWeight: '600' }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {children}
        </Link>
      );
    },
    img: ({ src, alt }) => {
      // Ignorar si es una URL externa
      if (src?.startsWith('http') || src?.startsWith('data:')) {
        return <img src={src} alt={alt} style={{ maxWidth: '100%', borderRadius: '16px' }} />;
      }

      // Resolver ruta de imagen relativa al nodo actual
      const cleanSrc = src.replace(/^\.\//, '');
      const mediaPath = encodeURI(`/wiki-media/${currentNode.relativePath}/${cleanSrc}`);

      // Si la imagen a renderizar es exactamente idéntica a la imagen de cabecera (previewImage), la ocultamos
      if (currentNode.previewImage && encodeURI(`/wiki-media/${currentNode.previewImage}`) === mediaPath) {
        return null;
      }

      return (
        <span style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
          <img 
            src={mediaPath} 
            alt={alt} 
            style={{ 
              maxWidth: '100%', 
              borderRadius: '24px', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              background: '#f9f9f9',
              display: 'block'
            }} 
          />
          {alt && <span style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', opacity: 0.7, display: 'block' }}>{alt}</span>}
        </span>
      );
    }
  };

  // Componente Rejilla de Tarjetas (Otras Secciones)
  const CardsGrid = () => otherChildren.length > 0 && (
    <div style={{ margin: '3rem 0' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '1rem' 
      }}>
        {otherChildren.map((child, idx) => (
          <Link 
            key={idx} 
            href={`/wiki/explorer/${pathArray.join('/')}/${child.slug}`}
            style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: '16px',
              padding: '0.8rem 1.2rem',
              textDecoration: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              minHeight: '60px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
              e.currentTarget.style.borderColor = '#eee';
            }}
          >
            <div style={{ 
              width: child.previewImage ? '48px' : '32px', 
              height: child.previewImage ? '48px' : '32px', 
              background: child.previewImage ? `url("${encodeURI(`/wiki-media/${child.previewImage}`)}") center/cover` : '#f8f8f8', 
              borderRadius: '10px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flexShrink: 0,
              boxShadow: child.previewImage ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
              overflow: 'hidden'
            }}>
              {!child.previewImage && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              )}
            </div>
            <div>
              <h4 style={{ 
                fontSize: '0.85rem', 
                fontWeight: '800', 
                color: '#000',
                margin: 0,
                letterSpacing: '-0.1px',
                textTransform: 'uppercase'
              }}>
                {child.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  const renderMarkdownFlow = (text) => {
    if (!text) return null;

    // Resaltado Inteligente de Glosario
    let processedText = text;
    if (terms && terms.length > 0) {
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const termsPattern = terms.map(escapeRegExp).join('|');
      // Usamos límites de palabra personalizados que incluyen caracteres acentuados y la ñ/Ñ
      const boundaryBefore = "(?<![a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])";
      const boundaryAfter = "(?![a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])";
      const regexStr = boundaryBefore + "(" + termsPattern + ")" + boundaryAfter + "(?![^\\[]*\\])(?![^\\`]*\\`)(?![^<]*>)";
      const safeRegex = new RegExp(regexStr, 'gi');
      processedText = processedText.replace(safeRegex, (match) => `[${match}](#glossary:${match})`);
    }

    // Lógica avanzada para inyectar la Pokedex exactamente tras la descripción
    let injectionIndex = -1;
    const descriptionMatch = processedText.match(/^##\s+descripci[oó]n.*$/im);
    if (descriptionMatch) {
      const searchFrom = descriptionMatch.index + descriptionMatch[0].length;
      const nextDelimiter = processedText.substring(searchFrom).match(/(^---\s*$|^#{1,3}\s+)/m);
      if (nextDelimiter) {
        injectionIndex = searchFrom + nextDelimiter.index;
      }
    }

    const speciesRegex = /(^#{2,3}\s+.*(especies|habitantes|plantas|fauna|peces|algas|identificacion).*$)/im;
    const speciesMatch = processedText.match(speciesRegex);

    // Si no encontramos el hueco tras la descripción, usamos el regex clásico de parámetros
    if (injectionIndex === -1 && speciesMatch) {
      injectionIndex = speciesMatch.index;
    }

    const algaeRegex = /(^#{1,3}\s+.*(errores|mantenimiento|algas).*$)/im;
    const algaeMatch = pathArray.includes('algas') ? null : processedText.match(algaeRegex);

    let lastIndex = 0;
    const allMatches = [
      ...(injectionIndex !== -1 && specialChild ? [{ type: 'species', index: injectionIndex }] : []),
      ...(algaeMatch ? [{ type: 'algae', index: algaeMatch.index }] : [])
    ].sort((a, b) => a.index - b.index);

    if (allMatches.length === 0) {
      return (
        <>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {processedText}
          </ReactMarkdown>
        </>
      );
    }

    const flowContent = [];
    let speciesRendered = false;
    const isCustomBottom = pathArray.includes('estanques-koi') || pathArray.includes('algas');
    
    allMatches.forEach((match, i) => {
      flowContent.push(
        <ReactMarkdown key={`md-${i}`} remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {processedText.substring(lastIndex, match.index).trim()}
        </ReactMarkdown>
      );

      if (match.type === 'species') {
        if (!isCustomBottom) {
          flowContent.push(<SpecialCard key="species-card" />);
        }
        speciesRendered = true;
      } else if (match.type === 'algae') {
        flowContent.push(<AlgaeCard key="algae-card" />);
      }

      lastIndex = match.index;
    });

    flowContent.push(
      <ReactMarkdown key="md-last" remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {processedText.substring(lastIndex)}
      </ReactMarkdown>
    );

    // Garantía: Si hay carpeta de especies pero no se renderizó (porque no hubo match de texto o solo hubo de algas)
    // Solo aplicamos este fallback interno si NO es un layout custom de final de página
    if (specialChild && !speciesRendered && !isCustomBottom) {
      flowContent.push(<SpecialCard key="species-fallback" />);
    }

    return flowContent;
  };

  return (
    <div className="wiki-content" style={{ paddingBottom: '5rem' }}>
      <div style={{ 
        position: 'sticky', 
        top: '70px', 
        zIndex: 800, 
        background: 'rgba(255, 255, 255, 0.5)', 
        backdropFilter: 'blur(10px)',
        padding: '0.75rem 0',
        marginBottom: '1.5rem'
      }}>
        <Breadcrumbs path={pathArray} />
      </div>

      {/* Hero Image / Header visual highlight */}
      {currentNode.previewImage && (
        <div style={{ 
          width: '100%', 
          height: '380px', 
          borderRadius: '32px', 
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden',
          background: '#111',
          boxShadow: '0 30px 80px rgba(0,0,0,0.15)'
        }}>
           <img 
             src={encodeURI(`/wiki-media/${currentNode.previewImage}`)} 
             alt={currentNode.title}
             style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
           />
           <div style={{ 
             position: 'absolute', 
             bottom: 0, 
             left: 0, 
             right: 0, 
             padding: '3rem',
             background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
             color: 'white'
           }}>
             <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', opacity: 0.6, display: 'block', marginBottom: '0.75rem' }}>WIKITANK</span>
             <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', margin: 0, letterSpacing: '-2px', lineHeight: '1' }}>
               {currentNode.title}
             </h1>
             {currentNode.children?.length > 0 && (
               <span style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.85rem', fontWeight: '600', opacity: 0.6 }}>
                 {currentNode.children.length} subsecciones
               </span>
             )}
           </div>
        </div>
      )}

      {!currentNode.previewImage && (
        <div style={{ marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: '0.75rem' }}>WIKITANK</span>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
            fontWeight: '950', 
            letterSpacing: '-4px', 
            lineHeight: '0.95', 
            textTransform: 'uppercase',
            margin: 0,
            color: '#000'
          }}>
            {currentNode.title}
          </h1>
        </div>
      )}

      <div className="markdown-body-wrapper" style={{ 
        background: 'white', 
        padding: '1rem 3rem 3rem 3rem', 
        border: '1px solid #f0f0f0'
      }}>
        <div className="markdown-body" style={{ lineHeight: '1.8', color: '#222', fontSize: '1.1rem' }}>
          {renderMarkdownFlow(beforeSplit)}
        </div>

        {afterSplit ? (
          <>
            <CardsGrid />
            <div className="markdown-body" style={{ lineHeight: '1.8', color: '#222', fontSize: '1.1rem', marginTop: '3rem' }}>
              {renderMarkdownFlow(afterSplit)}
            </div>
          </>
        ) : (
          <CardsGrid />
        )}

        {/* Pokedex al final para Estanques Koi y Algas */}
        {(pathArray.includes('estanques-koi') || pathArray.includes('algas')) && <SpecialCard />}

        <style jsx global>{`
          .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { color: #000; font-weight: 800; letter-spacing: -0.5px; }
          .markdown-body h2 { font-size: 1.6rem; margin-top: 3rem; margin-bottom: 1rem; border-bottom: 2px solid #f0f0f0; padding-bottom: 0.75rem; }
          .markdown-body h3 { font-size: 1.2rem; margin-top: 2rem; margin-bottom: 0.75rem; }
          .markdown-body p { margin-bottom: 1.5rem; color: #444; line-height: 1.9; }
          .markdown-body ul, .markdown-body ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
          .markdown-body li { margin-bottom: 0.5rem; color: #444; line-height: 1.8; }
          .markdown-body strong { color: #000; font-weight: 700; }
          .markdown-body em { color: #555; font-style: italic; }
          .markdown-body blockquote { border-left: 3px solid #000; padding: 1rem 1.5rem; background: #fafafa; border-radius: 0 16px 16px 0; margin: 2rem 0; color: #555; font-style: normal; }
          .markdown-body blockquote p { margin-bottom: 0; }
          .markdown-body img { max-width: 100%; margin: 1rem 0; display: block; }
          .markdown-body table { width: 100%; border-collapse: collapse; margin: 2rem 0; font-size: 0.9rem; border-radius: 12px; overflow: hidden; border: 1px solid #eee; }
          .markdown-body th, .markdown-body td { text-align: left; padding: 1rem 1.2rem; border-bottom: 1px solid #f0f0f0; }
          .markdown-body th { background: #000 !important; color: #fff !important; font-weight: 700; letter-spacing: 1px; font-size: 0.75rem; text-transform: uppercase; border-bottom: none; }
          .markdown-body tr:last-child td { border-bottom: none; }
          .markdown-body tr:hover td { background: #fafafa; }
          .markdown-body pre { background: #111; color: #f0f0f0; padding: 1.5rem; border-radius: 16px; overflow-x: auto; margin: 1.5rem 0; }
          .markdown-body code { background: #f0f0f0; padding: 0.2em 0.5em; border-radius: 6px; font-size: 0.9em; }
          .markdown-body pre code { background: transparent; padding: 0; color: inherit; }
          .markdown-body a { color: #0066FF; font-weight: 600; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
          .markdown-body a:hover { border-bottom-color: #0066FF; }
        `}</style>
      </div>

      {/* Pokedex Modal Componente */}
      {selectedPokedexNode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          padding: '2rem'
        }} onClick={() => setSelectedPokedexNode(null)}>
          
          <div style={{
            width: '100%',
            maxWidth: '850px',
            height: '85vh',
            background: 'white',
            borderRadius: '32px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
            animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            
            <style>{`
              @keyframes modalSlideUp {
                from { opacity: 0; transform: translateY(40px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            
            {/* Cabecera del Pokedex Modal */}
            <div style={{ 
              background: getCategoryTheme(selectedPokedexNode.parentNode.title, pathArray).color, 
              color: 'white', 
              padding: '1rem max(1.5rem, 5%)', 
              borderTopLeftRadius: '32px', 
              borderTopRightRadius: '32px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexShrink: 0 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7, display: 'block', marginBottom: '2px' }}>{selectedPokedexNode.parentNode.title}</span>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', letterSpacing: '0.2px' }}>{selectedPokedexNode.title}</h2>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedPokedexNode(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Contenido Inyectado Directamente de la extracción */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 2.5rem', scrollBehavior: 'smooth' }} className="markdown-body">
              <PokedexModalContent speciesData={selectedPokedexNode} isKoiPond={pathArray.includes('estanques-koi')} />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Función auxiliar para obtener el tema de color según la categoría
const getCategoryTheme = (categoryTitle, currentPath = []) => {
  // Forzar tema Negro/Gris para Estanques Koi y Algas
  if (currentPath.includes('estanques-koi') || categoryTitle.toUpperCase().includes('ALGAS')) {
    return { color: '#222', bg: '#f9f9f9', light: '#f0f0f0' };
  }

  const title = categoryTitle.toUpperCase();
  if (title.includes('PECES')) return { color: '#0066FF', bg: '#f0f7ff', light: '#e1f0ff' };
  if (title.includes('PLANTAS') || title.includes('FLORA')) return { color: '#2EB872', bg: '#f0fff4', light: '#e6ffef' };
  if (title.includes('INVERTEBRADOS') || title.includes('GAMBAS') || title.includes('CARACOLES')) return { color: '#FF7E00', bg: '#fff8f0', light: '#ffefdb' };
  if (title.includes('CORALES') || title.includes('ANÉMONAS') || title.includes('MARINO')) return { color: '#FF4E88', bg: '#fff0f5', light: '#ffe4ee' };
  return { color: '#444', bg: '#f9f9f9', light: '#f0f0f0' };
};

// Renderizador Múltiple del contenido de especie aislado
// Componente para renderizar la ficha técnica tipo cromo
function PokedexModalContent({ speciesData, isKoiPond }) {
  const theme = React.useMemo(() => {
    if (isKoiPond || speciesData.parentNode.title.toUpperCase().includes('ALGAS')) {
      return { color: '#000', bg: '#f9f9f9', light: '#f0f0f0' };
    }
    return getCategoryTheme(speciesData.parentNode.title);
  }, [speciesData.parentNode.title, isKoiPond]);

  // Parser para extraer stats del markdown
  const stats = [];
  let descriptionLines = [];
  const lines = speciesData.content.split('\n');
  let capturingStats = true;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('###') || trimmed.startsWith('![')) return;

    const match = trimmed.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
    if (match && capturingStats) {
      const label = match[1].trim();
      const value = match[2].trim();
      // Si llegamos a Notas o algo que suene a descripción, paramos de capturar stats para el grid
      if (label.toLowerCase().includes('nota') || label.toLowerCase().includes('descrip')) {
        capturingStats = false;
        descriptionLines.push(line);
      } else {
        stats.push({ label, value });
      }
    } else {
      // Si no es un stat, lo mandamos a la descripción (incluso líneas vacías para MD)
      if (trimmed || !capturingStats) {
        descriptionLines.push(line);
      }
    }
  });

  const mediaPath = encodeURI(`/wiki-media/${speciesData.parentNode.relativePath}/${speciesData.image}`);

  return (
    <div style={{ padding: '0 0 3rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Imagen Grande de Cromo */}
      <div style={{ 
        width: '100%', 
        height: '300px', 
        position: 'relative'
      }}>
        <img 
          src={mediaPath} 
          alt={speciesData.title} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>

      {/* Descripción / Notas Finales */}
      {descriptionLines.length > 0 && (
        <div style={{ 
          padding: '0 0.5rem', 
          lineHeight: '1.7',
          fontSize: '1rem'
        }} className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ 
              h1: () => null, 
              h2: () => null, 
              h3: () => null,
              img: () => null
            }}>
            {descriptionLines.join('\n')}
          </ReactMarkdown>
        </div>
      )}

      {/* Bloque Único de Datos Técnicos (2 Columnas) */}
      <div style={{ 
        background: theme.bg, 
        padding: '1.8rem', 
        borderRadius: '24px',
        border: `1px solid ${theme.light}`,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: '2rem',
        rowGap: '0.8rem'
      }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderBottom: `1px solid ${theme.light}`, paddingBottom: '0.6rem' }}>
            <span style={{ fontWeight: '400', color: theme.color, opacity: 0.7, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.5px' }}>
              {stat.label}
            </span>
            <span style={{ fontWeight: '700', color: '#222', fontSize: '0.95rem' }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Extractor y renderizador del Carrusel Horizontal de Especies
function PokedexCategoryLine({ node, onSelectSpecies }) {
  const [speciesList, setSpeciesList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; 
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [speciesList]);

  React.useEffect(() => {
    if (!node.contentFiles || node.contentFiles.length === 0) {
      setLoading(false);
      return;
    }
    
    fetch(encodeURI(`/wiki-media/${node.contentFiles[0]}`))
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(text => {
        // En tu estructura, las especies comienzan con ## o ### 
        const parts = text.split(/\n#{2,3}\s+/);
        
        const parsedSpecies = parts.slice(1).map(part => {
          const lines = part.split('\n');
          const title = lines[0].trim();
          
          const imgMatch = part.match(/!\[.*?\]\((.*?)\)/);
          const image = imgMatch ? imgMatch[1] : null;

          const content = '### ' + part;

          return { title, image, content, parentNode: node };
        }).filter(s => !s.title.toUpperCase().includes('NOMBRE COMÚN'));

        setSpeciesList(parsedSpecies);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [node]);

  if (loading) return null;
  if (speciesList.length === 0) return null;

  return (
    <div style={{ marginBottom: '3rem', maxWidth: '100%', width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1rem', 
          fontWeight: '700', 
          letterSpacing: '0.5px', 
          color: '#666',
          opacity: 0.8
        }}>
          {node.title.charAt(0) + node.title.slice(1).toLowerCase()}
        </h3>
      </div>

      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '100%',
        background: 'white',
        borderRadius: '24px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
        padding: '1.5rem 0.5rem'
      }}>
        <div 
          ref={scrollRef}
          className="custom-scroll"
          style={{
            display: 'flex',
            gap: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '1rem',
            paddingTop: '1rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            scrollBehavior: 'smooth',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <style>{`
            .custom-scroll::-webkit-scrollbar {
              height: 6px;
            }
            .custom-scroll::-webkit-scrollbar-track {
              background: #fdfdfd; 
              border-radius: 10px;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background: #d4d4d4; 
              border-radius: 10px;
            }
            .custom-scroll::-webkit-scrollbar-thumb:hover {
              background: #a8a8a8; 
            }
          `}</style>
          {speciesList.map((species, idx) => (
            <div 
              key={idx}
              onClick={() => onSelectSpecies(species)}
              style={{
                minWidth: '100px',
                maxWidth: '100px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.8rem',
                transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <div style={{ 
                width: '74px', 
                height: '74px', 
                borderRadius: '50%', 
                background: species.image ? `url("${encodeURI(`/wiki-media/${node.relativePath}/${species.image}`)}") center/cover` : '#f8f8f8',
                border: '3px solid white',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0
              }}>
                {!species.image && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textAlign: 'center', marginTop: '-0.2rem' }}>
                {(() => {
                  const parts = species.title.split('(');
                  if (parts.length > 1) {
                    const mainName = parts[0].trim();
                    const sciName = '(' + parts.slice(1).join('(').trim();
                    return (
                      <>
                        <span style={{ fontWeight: '700', fontSize: '0.65rem', color: '#222', textTransform: 'uppercase', letterSpacing: '0.2px', lineHeight: '1.2' }}>{mainName}</span>
                        <span style={{ fontWeight: '400', fontSize: '0.55rem', color: '#666', fontStyle: 'italic', letterSpacing: '0px', lineHeight: '1.2' }}>{sciName}</span>
                      </>
                    );
                  }
                  return (
                    <span style={{ fontWeight: '700', fontSize: '0.65rem', color: '#222', textTransform: 'uppercase', letterSpacing: '0.2px', lineHeight: '1.2' }}>{species.title}</span>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
