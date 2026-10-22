import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Ficha completa de una especie de WikiTank, pintada en el servidor (va en el HTML que lee Google).
// Igual que la ventana de la wiki: los datos en una rejilla y las notas y descripciones como texto. El reparto lo
// hace lib/especiesTraduccion.js (separarFicha en español, fichaTraducida en otros idiomas).
export default function FichaEspecieContenido({ datos, texto }) {
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
      {texto && (
        <div className="md" style={{ marginTop: 16 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={sinElementos}>{texto}</ReactMarkdown>
        </div>
      )}
    </>
  );
}
