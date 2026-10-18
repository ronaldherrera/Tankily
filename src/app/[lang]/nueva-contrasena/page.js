'use client';

import { useNavegar } from '@/components/Enlace';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTostada } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';
import { contrasenaValida } from '@/lib/contrasena';
import CampoContrasena from '@/components/CampoContrasena';

// Destino del enlace de recuperación: Supabase ya ha abierto sesión al llegar aquí
export default function NuevaContrasenaPage() {
  const router = useNavegar();
  const tostada = useTostada();
  const { t } = useT();
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');

  async function guardar(e) {
    e.preventDefault();
    if (!contrasenaValida(password)) return setError(t('registro.errorContrasena'));
    if (repetir !== password) return setError(t('contrasena.noCoinciden'));
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError(error.message);
    tostada(t('recuperar.cambiada'));
    router.push('/');
  }

  return (
    <form className="auth cristal cristal-refracta" onSubmit={guardar}>
      <h1 className="titulo-l">{t('recuperar.nueva')}</h1>
      <CampoContrasena etiqueta={t('recuperar.nuevaCampo')} valor={password} onCambio={setPassword} autoComplete="new-password" minLength={8} ayuda={t('registro.minimo')} />
      <CampoContrasena
        etiqueta={t('contrasena.repetir')}
        valor={repetir}
        onCambio={setRepetir}
        autoComplete="new-password"
        error={repetir && repetir !== password.slice(0, repetir.length) ? t('contrasena.noCoinciden') : ''}
      />
      {error && <p className="aviso error">{error}</p>}
      <button className="btn btn-primario">{t('recuperar.guardar')}</button>
    </form>
  );
}
