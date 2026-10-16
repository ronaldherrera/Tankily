"use client";

import React from 'react';
import Link from '@/components/Enlace';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Folder, Layers, ArrowRight, X } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ModernDiagram from '@/components/ModernDiagram';
import Publicidad from '@/components/Publicidad';
import AnadirATanque from '@/components/wiki/AnadirATanque';
import TanquesConEspecie from '@/components/wiki/TanquesConEspecie';
import { DURACION_SALIDA } from '@/lib/presencia';
import { useGlossary } from '../../context/GlossaryContext';
import { tituloWiki, aguaGrupo } from '../../formato';
import { useT } from '@/i18n/IdiomaProvider';

// Cabecera de una ficha tal como la limpia el catálogo de especies (para buscar su página en slugsEspecies)
const limpiarTituloEspecie = (titulo) => titulo.replace(/\s+/g, ' ').replace(/\s*—.*$/, '').trim();

export default function ExplorerClient({ currentNode, pathArray, content, slugsEspecies }) {
  const { terms, openGlossary } = useGlossary();
  const { t, lang } = useT();

  // Identificar "ESPECIES HABITUALES" de forma robusta
  const specialChild = currentNode.children?.find(c => {
    const title = c.title.toUpperCase();
    return title.includes("ESPECIES HABITUALES") || title.includes("HABITANTES") || title.includes("FAUNA") || title.includes("IDENTIFICACION");
  });
  const otherChildren = currentNode.children?.filter(c => c !== specialChild) || [];

  // División de contenido original
  const [beforeSplit, afterSplit] = content?.split('<!-- SPLIT_HERE -->') || [content, ""];

  // Ficha de especie abierta
  const [selectedPokedexNode, setSelectedPokedexNode] = React.useState(null);
  const [cerrandoFicha, setCerrandoFicha] = React.useState(false);
  const cerrarFicha = React.useCallback(() => {
    setCerrandoFicha(true);
    setTimeout(() => { setSelectedPokedexNode(null); setCerrandoFicha(false); }, DURACION_SALIDA);
  }, []);

  React.useEffect(() => {
    if (!selectedPokedexNode) return;
    document.body.style.overflow = 'hidden';
    const alPulsar = (e) => e.key === 'Escape' && cerrarFicha();
    document.addEventListener('keydown', alPulsar);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', alPulsar);
    };
  }, [selectedPokedexNode, cerrarFicha]);

  // Bloque de especies (Pokédex)
  const especies = () => {
    if (!specialChild || !specialChild.children || specialChild.children.length === 0) return null;
    return (
      <section className="pokedex">
        <h2>{t('wiki.especiesHabituales')}</h2>
        {specialChild.children.map((child, idx) => (
          <PokedexCategoryLine key={idx} node={child} pathArray={pathArray} onSelectSpecies={setSelectedPokedexNode} />
        ))}
      </section>
    );
  };

  // Acceso a la guía de algas
  const accesoAlgas = () => (
    <div>
      <Link href="/wiki/explorer/algas" className="wiki-algas">
        <span className="wiki-algas-icono"><Layers size={18} /></span>
        <span>
          <span className="mini texto-3" style={{ display: 'block' }}>{t('wiki.guiaCompleta')}</span>
          <strong>{t('wiki.saberAlgas')}</strong>
        </span>
        <ArrowRight size={18} className="texto-3" />
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
      // Término del glosario
      if (href?.startsWith('#glossary:')) {
        const term = decodeURIComponent(href.replace('#glossary:', ''));
        return (
          <span
            className="termino-glosario"
            role="button"
            tabIndex={0}
            onClick={() => openGlossary(term)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openGlossary(term))}
            title={t('wiki.verDefinicion')}
          >
            {children}
          </span>
        );
      }

      // Enlaces externos o anclas
      if (href?.startsWith('http') || href?.startsWith('#')) {
        return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{children}</a>;
      }

      // Enlaces internos (.md relativos) → rutas del explorador. Cada carpeta de WikiTank es una
      // página y sus .md son su contenido, así que "Ciclo_nitrogeno/Ciclo_nitrogeno.md" apunta a la
      // carpeta: se resuelve como una ruta de archivos (con . y ..) y se quita el nombre del .md.
      const slug = (part) => part.toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, '-');
      let ruta = href || '';
      try { ruta = decodeURI(ruta); } catch { /* enlace con % suelto: se usa tal cual */ }
      const partes = ruta.split('#')[0].split('/');
      const destino = partes[0] === '' ? [] : [...pathArray];
      partes.forEach((part, i) => {
        if (!part || part === '.') return;
        if (part === '..') { destino.pop(); return; }
        if (i === partes.length - 1 && /\.md$/i.test(part)) return;
        destino.push(slug(part));
      });
      const targetPath = `/wiki/explorer/${destino.join('/')}${destino.length ? '/' : ''}`;

      return <Link href={targetPath} className="wiki-enlace">{children}</Link>;
    },
    img: ({ src, alt }) => {
      if (src?.startsWith('http') || src?.startsWith('data:')) {
        return <span className="wiki-figura"><img src={src} alt={alt} /></span>;
      }

      // Imagen relativa al nodo actual
      const cleanSrc = src.replace(/^\.\//, '');
      const mediaPath = encodeURI(`/wiki-media/${currentNode.relativePath}/${cleanSrc}`);

      // La imagen de cabecera ya se muestra arriba
      if (currentNode.previewImage && encodeURI(`/wiki-media/${currentNode.previewImage}`) === mediaPath) {
        return null;
      }

      return (
        <span className="wiki-figura">
          <img src={mediaPath} alt={alt} loading="lazy" />
          {alt && <span className="pie-figura">{alt}</span>}
        </span>
      );
    }
  };

  // Rejilla de subsecciones
  const subsecciones = () => otherChildren.length > 0 && (
    <nav className="wiki-subsecciones" aria-label={t('wiki.temasDe')}>
      {otherChildren.map((child, idx) => (
        <Link key={idx} href={`/wiki/explorer/${pathArray.join('/')}/${child.slug}`} className="wiki-subseccion">
          <span
            className="wiki-subseccion-icono"
            style={child.previewImage ? { backgroundImage: `url("${encodeURI(`/wiki-media/${child.previewImage}`)}")` } : undefined}
          >
            {!child.previewImage && <Folder size={18} />}
          </span>
          <strong>{tituloWiki(child.title)}</strong>
        </Link>
      ))}
    </nav>
  );

  const renderMarkdownFlow = (text) => {
    if (!text) return null;

    // Resaltado de términos del glosario
    let processedText = text;
    if (terms && terms.length > 0) {
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const termsPattern = terms.map(escapeRegExp).join('|');
      // Límites de palabra que incluyen acentos y ñ
      const boundaryBefore = "(?<![a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])";
      const boundaryAfter = "(?![a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])";
      const regexStr = boundaryBefore + "(" + termsPattern + ")" + boundaryAfter + "(?![^\\[]*\\])(?![^\\`]*\\`)(?![^<]*>)";
      const safeRegex = new RegExp(regexStr, 'gi');
      processedText = processedText.replace(safeRegex, (match) => `[${match}](#glossary:${encodeURIComponent(match)})`);
    }

    // Inyectar la Pokédex justo después de la descripción
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
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {processedText}
        </ReactMarkdown>
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
          flowContent.push(<React.Fragment key="species-card">{especies()}</React.Fragment>);
        }
        speciesRendered = true;
      } else if (match.type === 'algae') {
        flowContent.push(<React.Fragment key="algae-card">{accesoAlgas()}</React.Fragment>);
      }

      lastIndex = match.index;
    });

    flowContent.push(
      <ReactMarkdown key="md-last" remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {processedText.substring(lastIndex)}
      </ReactMarkdown>
    );

    // Si hay carpeta de especies y no se colocó, va al final (salvo layouts con Pokédex al pie)
    if (specialChild && !speciesRendered && !isCustomBottom) {
      flowContent.push(<React.Fragment key="species-fallback">{especies()}</React.Fragment>);
    }

    return flowContent;
  };

  const titulo = tituloWiki(currentNode.title);

  return (
    <article style={{ '--agua': aguaGrupo(currentNode.title, pathArray) === '#9fe7f5' ? undefined : aguaGrupo(currentNode.title, pathArray) }}>
      <Breadcrumbs path={pathArray} />

      {currentNode.previewImage ? (
        <header className="wiki-hero">
          <img src={encodeURI(`/wiki-media/${currentNode.previewImage}`)} alt="" />
          <div className="wiki-hero-panel cristal cristal-refracta">
            <h1>{titulo}</h1>
            {currentNode.children?.length > 0 && (
              <p className="pequeno texto-2" style={{ marginTop: 8 }}>{t('wiki.temasSeccion', { n: currentNode.children.length })}</p>
            )}
          </div>
        </header>
      ) : (
        <h1 className="wiki-titulo">{titulo}</h1>
      )}

      {lang !== 'es' && t('wiki.sinTraducir') && <p className="aviso" lang={lang} style={{ marginBottom: 16 }}>{t('wiki.sinTraducir')}</p>}

      <div className="wiki-articulo" lang="es">
        <div className="md">
          {renderMarkdownFlow(beforeSplit)}
        </div>

        {afterSplit ? (
          <>
            {subsecciones()}
            <div className="md" style={{ marginTop: '2rem' }}>
              {renderMarkdownFlow(afterSplit)}
            </div>
          </>
        ) : (
          subsecciones()
        )}

        {/* Pokédex al final para Estanques Koi y Algas */}
        {(pathArray.includes('estanques-koi') || pathArray.includes('algas')) && <div className="md">{especies()}</div>}
      </div>

      {/* Publicidad al final del artículo: no interrumpe la lectura */}
      <div style={{ marginTop: 20 }}><Publicidad ubicacion="wiki" /></div>

      {selectedPokedexNode && (
        <div className={`ficha-velo${cerrandoFicha ? ' saliendo' : ''}`} onClick={cerrarFicha}>
          <div
            className="ficha-especie cristal cristal-refracta"
            role="dialog"
            aria-modal="true"
            aria-label={selectedPokedexNode.title}
            style={{ '--agua': aguaGrupo(selectedPokedexNode.parentNode.title, pathArray) }}
            onClick={e => e.stopPropagation()}
          >
            <header className="ficha-cabecera">
              <div>
                <span className="etiqueta-agua">{tituloWiki(selectedPokedexNode.parentNode.title)}</span>
                <h2>{selectedPokedexNode.title}</h2>
                {slugsEspecies?.[limpiarTituloEspecie(selectedPokedexNode.title)] && (
                  <Link href={`/wiki/especies/${slugsEspecies[limpiarTituloEspecie(selectedPokedexNode.title)]}/`} className="enlace pequeno">{t('fichaEsp.fichaCompleta')}</Link>
                )}
              </div>
              <button className="btn btn-icono btn-s" onClick={cerrarFicha} aria-label={t('wiki.cerrarFicha')} autoFocus>
                <X size={18} />
              </button>
            </header>
            <div className="ficha-cuerpo">
              <PokedexModalContent speciesData={selectedPokedexNode} />
              {/* Solo en fichas de especie (con datos de agua), no en las de familia */}
              {/\*\*(Temperatura|pH)\*\*/.test(selectedPokedexNode.content || '') && (
                <>
                  <AnadirATanque titulo={selectedPokedexNode.title} grupo={selectedPokedexNode.parentNode.title} />
                  <TanquesConEspecie titulo={selectedPokedexNode.title} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

// Ficha técnica de una especie: separa los "**Dato**: valor" del texto descriptivo
function PokedexModalContent({ speciesData }) {
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
      // Al llegar a notas o descripción se deja de capturar datos
      if (label.toLowerCase().includes('nota') || label.toLowerCase().includes('descrip')) {
        capturingStats = false;
        descriptionLines.push(line);
      } else {
        stats.push({ label, value });
      }
    } else if (trimmed || !capturingStats) {
      descriptionLines.push(line);
    }
  });

  const mediaPath = encodeURI(`/wiki-media/${speciesData.parentNode.relativePath}/${speciesData.image}`);

  return (
    <>
      {speciesData.image && (
        <div className="ficha-imagen">
          <img src={mediaPath} alt={speciesData.title} />
        </div>
      )}

      {descriptionLines.length > 0 && (
        <div className="md">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: () => null, h2: () => null, h3: () => null, img: () => null }}>
            {descriptionLines.join('\n')}
          </ReactMarkdown>
        </div>
      )}

      {stats.length > 0 && (
        <div className="ficha-datos">
          {stats.map((stat, i) => (
            <div key={i}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Carrusel horizontal de especies de una categoría
function PokedexCategoryLine({ node, pathArray, onSelectSpecies }) {
  const [speciesList, setSpeciesList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      const alInicio = el.scrollLeft <= 0;
      // Deja pasar el scroll vertical de la página cuando el carrusel llega a un extremo
      if ((e.deltaY > 0 && alFinal) || (e.deltaY < 0 && alInicio)) return;
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
        // Las especies empiezan con ## o ###
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

  if (loading || speciesList.length === 0) return null;

  return (
    <div className="pokedex-grupo" style={{ '--agua': aguaGrupo(node.title, pathArray) }}>
      <div className="pokedex-grupo-cabecera">
        <span className="etiqueta-agua" aria-hidden="true" />
        <h3>{tituloWiki(node.title)}</h3>
        <span className="cuenta">{speciesList.length}</span>
      </div>
      <div ref={scrollRef} className="pokedex-carrusel">
        {speciesList.map((species, idx) => {
          const partes = species.title.split('(');
          const nombre = partes[0].trim();
          const cientifico = partes.length > 1 ? partes.slice(1).join('(').replace(/\)\s*$/, '').trim() : null;
          return (
            <button key={idx} type="button" className="especie" onClick={() => onSelectSpecies(species)}>
              <span className="especie-foto">
                {species.image
                  ? <img src={encodeURI(`/wiki-media/${node.relativePath}/${species.image}`)} alt="" loading="lazy" />
                  : <Folder size={22} className="texto-3" />}
              </span>
              <span className="especie-texto">
                <strong>{nombre}</strong>
                {cientifico && <em>{cientifico}</em>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
