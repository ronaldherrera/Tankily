"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Languages, Check } from 'lucide-react';
import { IDIOMAS, NOMBRES_IDIOMA, sinIdioma } from '@/i18n/config';
import { useT } from '@/i18n/IdiomaProvider';
import { usePresencia } from '@/lib/presencia';

function guardar(lang) {
  try { localStorage.setItem('tk-idioma', lang); } catch {}
}

// Menú de idiomas: cambia de idioma manteniendo la página actual (/es/foro/ → /de/foro/)
export default function SelectorIdioma({ conTexto = false, className = 'nav-item' }) {
  const { lang, t } = useT();
  const pathname = usePathname() || '/';
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const menu = usePresencia(abierto);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => !caja.current?.contains(e.target) && setAbierto(false);
    const escape = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', escape); };
  }, [abierto]);

  const destino = (l) => `/${l}${sinIdioma(pathname)}`;
  const enPie = className !== 'nav-item';

  return (
    <div ref={caja} style={{ position: 'relative', width: conTexto ? '100%' : undefined, display: enPie ? 'inline-block' : undefined }}>
      <button
        type="button"
        className={className}
        onClick={() => setAbierto(!abierto)}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label={t('comun.idioma')}
        title={t('comun.idioma')}
        style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left', color: 'inherit', width: conTexto ? '100%' : undefined }}
      >
        {!enPie && <Languages size={20} />}
        {(conTexto || enPie) && <span>{NOMBRES_IDIOMA[lang]}</span>}
      </button>
      {menu.montado && (
        <div className={`menu cristal menu-idiomas${enPie ? ' en-pie' : ''}${menu.saliendo ? ' saliendo' : ''}`} role="menu">
          {IDIOMAS.map((l) => (
            <a
              key={l}
              role="menuitem"
              lang={l}
              href={destino(l) + (typeof window !== 'undefined' ? window.location.search : '')}
              aria-current={l === lang ? 'true' : undefined}
              onClick={() => guardar(l)}
            >
              <span style={{ flex: 1 }}>{NOMBRES_IDIOMA[l]}</span>
              {l === lang && <Check size={16} />}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Lista de idiomas para Ajustes
export function SelectorIdiomaLista() {
  const { lang, t } = useT();
  const pathname = usePathname() || '/';
  return (
    <div className="chips" role="radiogroup" aria-label={t('comun.idioma')}>
      {IDIOMAS.map((l) => (
        <a
          key={l}
          role="radio"
          aria-checked={l === lang}
          className={`chip${l === lang ? ' activo' : ''}`}
          lang={l}
          href={`/${l}${sinIdioma(pathname)}`}
          onClick={() => guardar(l)}
        >
          {NOMBRES_IDIOMA[l]}
        </a>
      ))}
    </div>
  );
}
