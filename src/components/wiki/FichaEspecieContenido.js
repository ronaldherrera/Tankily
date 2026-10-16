import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Ficha completa de una especie de WikiTank, pintada en el servidor (va en el HTML que lee Google).
// Igual que la ventana de la wiki: los "**Dato**: valor" en una rejilla y el resto como texto.
// Las notas y descripciones (y lo que va después) son texto, no datos.
export default function FichaEspecieContenido({ contenido }) {
  const datos = [];
  const texto = [];
  let enDatos = true;
  for (const linea of contenido.split('\n')) {
    const limpia = linea.trim();
    if (limpia.startsWith('![') || limpia === '---') continue;
    const dato = limpia.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
    if (dato && enDatos && !/nota|descrip/i.test(dato[1])) datos.push([dato[1].trim(), dato[2].trim()]);
    else if (limpia || !enDatos) {
      if (dato) enDatos = false;
      texto.push(linea);
    }
  }
  // Sin enlaces relativos de la wiki (no llevarían a ninguna parte desde esta página) ni títulos o imágenes repetidos
  const sinElementos = { h1: () => null, h2: () => null, h3: () => null, img: () => null, a: ({ children }) => <>{children}</> };
  return (
    <>
      {datos.length > 0 && (
        <dl className="ficha-datos">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt>{etiqueta}</dt>
              <dd><ReactMarkdown components={{ ...sinElementos, p: ({ children }) => <>{children}</> }}>{valor}</ReactMarkdown></dd>
            </div>
          ))}
        </dl>
      )}
      {texto.join('\n').trim() && (
        <div className="md" style={{ marginTop: 16 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={sinElementos}>{texto.join('\n')}</ReactMarkdown>
        </div>
      )}
    </>
  );
}
