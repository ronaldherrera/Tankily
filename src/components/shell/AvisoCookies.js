"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';
import { ADSENSE_CMP } from '@/lib/adsense';
import { DURACION_SALIDA } from '@/lib/presencia';

const CLAVE = 'tk-consentimiento-cookies';

// Consentimiento previo (LSSI/RGPD): la publicidad personalizada solo se carga si se acepta.
export function leerConsentimiento() {
  try { return localStorage.getItem(CLAVE); } catch { return null; }
}

export default function AvisoCookies() {
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const { t } = useT();

  useEffect(() => {
    // Con el gestor de consentimiento certificado de Google activo (lib/adsense.js), el aviso lo muestra él
    setVisible(!ADSENSE_CMP && !leerConsentimiento());
  }, []);

  function decidir(valor) {
    try { localStorage.setItem(CLAVE, valor); } catch {}
    window.dispatchEvent(new CustomEvent('tk:consentimiento', { detail: valor }));
    setSaliendo(true);
    setTimeout(() => setVisible(false), DURACION_SALIDA);
  }

  if (!visible) return null;

  return (
    <div className={`aviso-cookies cristal cristal-fijo${saliendo ? ' saliendo' : ''}`} role="dialog" aria-label={t('pie.cookies')}>
      <p className="pequeno">
        {t('cookies.aviso')}{' '}
        <Link className="enlace" href="/legal/cookies/">{t('cookies.masInfo')}</Link>
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button className="btn btn-s" onClick={() => decidir('necesarias')}>{t('cookies.soloNecesarias')}</button>
        <button className="btn btn-s btn-primario" onClick={() => decidir('todas')}>{t('cookies.aceptarTodas')}</button>
      </div>
    </div>
  );
}
