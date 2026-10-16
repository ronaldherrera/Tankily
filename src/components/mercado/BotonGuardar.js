"use client";

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { useGuardados } from '@/lib/guardados';
import { useTostada } from '@/components/ui';

// Marcador para guardar un anuncio. Sin sesión avisa de que hay que entrar.
export default function BotonGuardar({ anuncioId, conTexto = false, className = '' }) {
  const { t } = useT();
  const tostada = useTostada();
  const { conSesion, guardado, alternar } = useGuardados();
  const esta = guardado(anuncioId);
  const etiqueta = esta ? t('guardados.quitar') : t('guardados.guardar');

  function pulsar(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!conSesion) return tostada(t('guardados.entra'));
    alternar(anuncioId);
  }

  return (
    <button type="button" className={`boton-guardar${esta ? ' activo' : ''} ${className}`} onClick={pulsar} aria-pressed={esta} aria-label={etiqueta} title={etiqueta}>
      {esta ? <BookmarkCheck size={conTexto ? 16 : 18} aria-hidden="true" /> : <Bookmark size={conTexto ? 16 : 18} aria-hidden="true" />}
      {conTexto && <span>{etiqueta}</span>}
    </button>
  );
}
