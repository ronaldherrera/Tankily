"use client";

import { useState } from 'react';
import { Info } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';

// "muestra ⓘ" junto al @usuario de las cuentas de la comunidad de demostración (perfiles.muestra). Discreto, del
// mismo tamaño y gris que el resto de la línea; la ⓘ despliega la explicación.
export default function MarcaMuestra() {
  const { t } = useT();
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <span>{t('muestra.palabra')}</span>{' '}
      <button type="button" className="marca-muestra" aria-expanded={abierta} aria-label={t('muestra.ayuda')} onClick={() => setAbierta(!abierta)}>
        <Info size={13} aria-hidden="true" />
      </button>
      {abierta && <span className="marca-muestra-texto mini">{t('muestra.info')}</span>}
    </>
  );
}
