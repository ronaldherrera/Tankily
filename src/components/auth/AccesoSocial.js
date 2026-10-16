"use client";

import { useState } from 'react';
import { useT } from '@/i18n/IdiomaProvider';
import { useProveedores, entrarCon } from '@/lib/autenticacion';

const NOMBRES = { google: 'Google', apple: 'Apple', facebook: 'Facebook', azure: 'Microsoft' };

// Logotipos oficiales (las guías de marca de cada proveedor piden usarlos en el botón)
function Logo({ proveedor }) {
  if (proveedor === 'google') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z" />
        <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.1 0 10 0 12s.5 3.9 1.4 5.5l4-3.1z" />
        <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l4 3.1c.9-2.8 3.5-4.8 6.6-4.8z" />
      </svg>
    );
  }
  if (proveedor === 'apple') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
        <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z" />
      </svg>
    );
  }
  if (proveedor === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path fill="#fff" d="M15.7 15.5l.5-3.5h-3.3V9.8c0-1 .5-1.9 2-1.9h1.5v-3s-1.4-.2-2.7-.2c-2.8 0-4.6 1.7-4.6 4.7V12H6.1v3.5h3v8.4c.6.1 1.2.1 1.9.1s1.3 0 1.9-.1v-8.4h2.8z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  );
}

// Botones "Continuar con Google/Apple/Facebook/Microsoft" y separador "o con tu email".
// Si no hay ningún proveedor activado en Supabase, no se muestra nada.
export default function AccesoSocial({ registro = false }) {
  const { t, lang } = useT();
  const proveedores = useProveedores(lang);
  const [yendo, setYendo] = useState(null);
  const [error, setError] = useState('');
  if (!proveedores?.length) return null;

  async function ir(p) {
    setYendo(p);
    setError('');
    const { error: e } = await entrarCon(p, lang);
    if (e) { setYendo(null); setError(t('social.error', { proveedor: NOMBRES[p], error: e.message })); }
  }

  return (
    <div className="acceso-social">
      {proveedores.map((p) => (
        <button key={p} type="button" className={`btn btn-bloque boton-social social-${p}`} onClick={() => ir(p)} disabled={!!yendo}>
          <Logo proveedor={p} />
          <span>{t('social.continuarCon', { proveedor: NOMBRES[p] })}</span>
        </button>
      ))}
      {registro && <p className="mini texto-3">{t('social.aceptas')}</p>}
      {error && <p className="aviso error" role="alert">{error}</p>}
      <div className="auth-separador"><span>{t('social.oEmail')}</span></div>
    </div>
  );
}
