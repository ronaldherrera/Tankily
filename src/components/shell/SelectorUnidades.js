"use client";

import { useUnidades } from '@/lib/unidades';
import { useT } from '@/i18n/IdiomaProvider';

// Métrico (l, cm, °C) o imperial (gal, in, °F). Solo cambia cómo se muestra y se escribe.
export default function SelectorUnidades() {
  const { sistema, elegir } = useUnidades();
  const { t } = useT();
  return (
    <div className="chips" role="radiogroup" aria-label={t('ajustes.unidades')}>
      {['metrico', 'imperial'].map((s) => (
        <button key={s} type="button" role="radio" aria-checked={sistema === s} aria-pressed={sistema === s} className="chip" onClick={() => elegir(s)}>
          {t(`ajustes.${s}`)}
        </button>
      ))}
    </div>
  );
}
