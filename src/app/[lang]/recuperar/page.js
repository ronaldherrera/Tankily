'use client';

import { useState } from 'react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const { t, lang } = useT();
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/${lang}/nueva-contrasena/`,
    });
    if (error) return setError(error.message);
    setEnviado(true);
  }

  return (
    <form className="auth cristal cristal-refracta" onSubmit={enviar}>
      <h1 className="titulo-l">{t('recuperar.titulo')}</h1>
      {enviado ? (
        <p className="texto-2">{t('recuperar.enviado', { email })}</p>
      ) : (
        <>
          <p className="texto-2">{t('recuperar.texto')}</p>
          <label className="campo"><span>{t('acceso.email')}</span><input className="entrada" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {error && <p className="aviso error">{error}</p>}
          <button className="btn btn-primario">{t('recuperar.enviar')}</button>
        </>
      )}
      <Link href="/acceder/" className="enlace pequeno">{t('recuperar.volver')}</Link>
    </form>
  );
}
