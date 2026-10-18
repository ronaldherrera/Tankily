"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link, { useNavegar } from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useTostada } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';

// A dónde se va después de cada tipo de enlace
const DESTINO = { recovery: '/nueva-contrasena/', email: '/', email_change: '/ajustes/' };

// Los botones de los correos de la cuenta llevan aquí (tankily.com/…/verificar/?token_hash=…&type=…) en lugar
// de a supabase.co: así el enlace es del mismo dominio que el remitente y los correos no parecen phishing.
function Verificar() {
  const params = useSearchParams();
  const router = useNavegar();
  const tostada = useTostada();
  const { t } = useT();
  const [error, setError] = useState(false);
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true; // el código solo vale una vez (en desarrollo, React ejecuta los efectos dos veces)
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    if (!tokenHash || !DESTINO[type]) { setError(true); return; }
    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error: fallo }) => {
      if (fallo) { setError(true); return; }
      if (type === 'email') tostada(t('verificar.listo'));
      if (type === 'email_change') tostada(t('verificar.emailCambiado'));
      router.replace(DESTINO[type]);
    });
  }, [params, router, tostada, t]);

  return (
    <div className="auth cristal cristal-refracta" style={{ textAlign: 'center' }}>
      {error ? (
        <>
          <h1 className="titulo-l">{t('verificar.error')}</h1>
          <p className="texto-2">{t('verificar.errorTexto')}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/recuperar/" className="btn">{t('verificar.recuperar')}</Link>
            <Link href="/acceder/" className="btn btn-primario">{t('verificar.acceder')}</Link>
          </div>
        </>
      ) : (
        <>
          <Loader2 size={28} className="girar" style={{ margin: '0 auto', color: 'var(--agua)' }} aria-hidden />
          <h1 className="titulo-l">{t('verificar.titulo')}</h1>
          <p className="texto-2">{t('verificar.texto')}</p>
        </>
      )}
    </div>
  );
}

export default function VerificarPage() {
  return <Suspense><Verificar /></Suspense>;
}
