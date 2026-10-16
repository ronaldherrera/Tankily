"use client";

import { RefreshCw } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { Vacio } from '@/components/ui';

// Cuando una lista no se puede cargar (sin conexión, error del servidor): se dice claramente
// y se ofrece reintentar, en lugar de mostrar "no hay nada" como si estuviera vacía.
export default function ErrorCarga({ onReintentar }) {
  const { t } = useT();
  return (
    <Vacio
      titulo={t('errorCarga.titulo')}
      accion={<button type="button" className="btn" onClick={onReintentar}><RefreshCw size={16} aria-hidden="true" /> {t('errorPagina.reintentar')}</button>}
    >
      {t('errorCarga.texto')}
    </Vacio>
  );
}
