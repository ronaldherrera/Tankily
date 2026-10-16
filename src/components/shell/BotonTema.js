"use client";

import { Moon, Sun, SunMoon } from 'lucide-react';
import { useTema } from '@/lib/tema';
import { useT } from '@/i18n/IdiomaProvider';

const ORDEN = ['oscuro', 'claro', 'auto'];
const ICONO = { oscuro: Moon, claro: Sun, auto: SunMoon };
const CLAVE = { oscuro: 'tema.temaOscuro', claro: 'tema.temaClaro', auto: 'tema.temaAuto' };

// Alterna oscuro → claro → automático
export default function BotonTema({ conTexto = false, className = 'nav-item' }) {
  const [preferencia, elegir] = useTema();
  const { t } = useT();
  const siguiente = ORDEN[(ORDEN.indexOf(preferencia) + 1) % ORDEN.length];
  const Icono = ICONO[preferencia];
  const texto = t(CLAVE[preferencia]);

  return (
    <button
      type="button"
      className={className}
      onClick={() => elegir(siguiente)}
      aria-label={t('tema.cambiarA', { actual: texto, siguiente: t(CLAVE[siguiente]).toLowerCase() })}
      title={t('tema.pulsa', { actual: texto })}
      style={{ background: 'none', border: 0, cursor: 'pointer', width: conTexto ? '100%' : undefined, font: 'inherit', textAlign: 'left' }}
    >
      <Icono size={20} />
      {conTexto && <span>{texto}</span>}
    </button>
  );
}

// Selector explícito para la página de ajustes
export function SelectorTema() {
  const [preferencia, elegir] = useTema();
  const { t } = useT();
  return (
    <div className="chips" role="radiogroup" aria-label={t('tema.nombre')}>
      {ORDEN.map((p) => {
        const Icono = ICONO[p];
        return (
          <button key={p} type="button" role="radio" aria-checked={preferencia === p} className="chip" aria-pressed={preferencia === p} onClick={() => elegir(p)}>
            <Icono size={14} /> {t(`tema.${p}`)}
          </button>
        );
      })}
    </div>
  );
}
