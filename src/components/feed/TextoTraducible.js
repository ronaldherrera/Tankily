"use client";

import { useState } from 'react';
import { Languages } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { useTraduccion } from '@/lib/traduccion';
import TextoRico from './TextoRico';

// Texto de un usuario que se traduce solo si está en otro idioma, como en las grandes redes:
// muestra la traducción con "Traducido del francés · Ver original" y permite alternar.
// `render` decide cómo pintar el texto (por defecto, con #etiquetas y @menciones).
// Con `compacto` (listados) solo cambia el texto por su traducción, sin la línea de aviso;
// el original aparece al pasar el ratón.
export default function TextoTraducible({ tabla, id, campo = 'contenido', texto, idioma, sinEnlaces = false, compacto = false, render }) {
  const { t, lang } = useT();
  const { necesita, estado, traducido, traducirAhora } = useTraduccion({ tabla, id, campo, texto, idioma }, lang);
  const [original, setOriginal] = useState(false);
  const pintar = render || ((x) => <TextoRico texto={x} sinEnlaces={sinEnlaces} />);

  if (!necesita) return pintar(texto);

  const nombreIdioma = (() => {
    try { return new Intl.DisplayNames([lang], { type: 'language' }).of(idioma); } catch { return idioma; }
  })();
  const verTraduccion = estado === 'listo' && !original;
  if (compacto) return <span title={verTraduccion ? texto : undefined}>{pintar(verTraduccion ? traducido : texto)}</span>;

  // Dentro de un enlace (cita de un eco) no se puede poner un botón: solo se muestra la traducción
  const accion = (etiqueta, onClick) => (sinEnlaces
    ? null
    : <button type="button" className="boton-traduccion" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}>{etiqueta}</button>);
  if (sinEnlaces && estado !== 'listo') return pintar(texto);

  return (
    <>
      {pintar(verTraduccion ? traducido : texto)}
      <span className="nota-traduccion mini" lang={lang}>
        <Languages size={13} aria-hidden="true" />
        {estado === 'traduciendo' && <span>{t('trad.traduciendo')}</span>}
        {estado === 'listo' && (
          <>
            <span>{original ? t('trad.original', { idioma: nombreIdioma }) : t('trad.traducidoDe', { idioma: nombreIdioma })}</span>
            {!sinEnlaces && <span aria-hidden="true">·</span>}
            {accion(original ? t('trad.verTraduccion') : t('trad.verOriginal'), () => setOriginal(!original))}
          </>
        )}
        {(estado === 'manual' || estado === 'error') && accion(t('trad.verTraduccion'), traducirAhora)}
      </span>
    </>
  );
}
