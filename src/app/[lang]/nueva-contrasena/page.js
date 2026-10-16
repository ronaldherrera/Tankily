'use client';

import { useNavegar } from '@/components/Enlace';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTostada } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';

// Destino del enlace de recuperación: Supabase ya ha abierto sesión al llegar aquí
export default function NuevaContrasenaPage() {
  const router = useNavegar();
  const tostada = useTostada();
  const { t } = useT();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function guardar(e) {
    e.preventDefault();
    if (password.length < 8) return setError(t('registro.errorContrasena'));
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError(error.message);
    tostada(t('recuperar.cambiada'));
    router.push('/');
  }

  return (
    <form className="auth cristal cristal-refracta" onSubmit={guardar}>
      <h1 className="titulo-l">{t('recuperar.nueva')}</h1>
      <label className="campo"><span>{t('recuperar.nuevaCampo')}</span><input className="entrada" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <p className="aviso error">{error}</p>}
      <button className="btn btn-primario">{t('recuperar.guardar')}</button>
    </form>
  );
}
