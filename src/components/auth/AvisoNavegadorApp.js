"use client";

import { ExternalLink, Link2 } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { useTostada } from '@/components/ui';
import { esAndroid, enlaceAlNavegador } from '@/lib/navegadorApp';
import { evento } from '@/lib/analitica';

// Aviso en entrar y registro cuando la página está abierta dentro de Facebook, Instagram… (ver lib/navegadorApp.js).
// En Android, un botón la abre en Chrome; en iOS se explica el menú de la app y se puede copiar el enlace.
export default function AvisoNavegadorApp({ app }) {
  const { t } = useT();
  const tostada = useTostada();
  const android = esAndroid();

  async function copiar() {
    try { await navigator.clipboard.writeText(window.location.href); tostada(t('navegadorApp.copiado')); } catch { /* sin portapapeles */ }
  }

  return (
    <div className="aviso aviso-navegador-app" role="note">
      <strong className="pequeno">{t('navegadorApp.titulo', { app })}</strong>
      <p className="mini texto-2">{t('navegadorApp.texto')}</p>
      {!android && <p className="mini texto-2">{t('navegadorApp.ios')}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {android && (
          <a href={enlaceAlNavegador()} className="btn btn-s btn-primario" onClick={() => evento('navegador_app_abrir', { app })}>
            <ExternalLink size={14} aria-hidden="true" /> {t('navegadorApp.abrir')}
          </a>
        )}
        <button type="button" className="btn btn-s" onClick={copiar}><Link2 size={14} aria-hidden="true" /> {t('navegadorApp.copiar')}</button>
      </div>
    </div>
  );
}
