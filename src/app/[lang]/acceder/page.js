'use client';

import { useState } from 'react';
import Link, { useNavegar } from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { Marca } from '@/components/shell/AppShell';
import { useT } from '@/i18n/IdiomaProvider';
import AccesoSocial from '@/components/auth/AccesoSocial';
import { enviarEnlace } from '@/lib/autenticacion';
import CampoContrasena from '@/components/CampoContrasena';

export default function AccederPage() {
  const router = useNavegar();
  const { t, lang } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enlace, setEnlace] = useState(null); // null | 'enviando' | 'enviado'

  // Enlace mágico: entra sin contraseña con un enlace enviado al email
  async function pedirEnlace() {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('social.escribeEmail'));
    setEnlace('enviando');
    const { error: e } = await enviarEnlace(email.trim(), lang);
    if (e) { setEnlace(null); setError(e.message); return; }
    setEnlace('enviado');
  }

  async function entrar(e) {
    e.preventDefault();
    setCargando(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setCargando(false);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? t('acceso.errorCredenciales')
        : error.message === 'Email not confirmed'
          ? t('acceso.errorConfirmar')
          : error.message);
      return;
    }
    router.push('/');
  }

  return (
    <form className="auth cristal cristal-refracta" onSubmit={entrar}>
      <Marca tamano={48} />
      <div>
        <h1 className="titulo-l">{t('acceso.titulo')}</h1>
        <p className="texto-2">{t('acceso.subtitulo')}</p>
      </div>
      <AccesoSocial />
      <label className="campo"><span>{t('acceso.email')}</span><input className="entrada" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <CampoContrasena etiqueta={t('acceso.contrasena')} valor={password} onCambio={setPassword} />
      {error && <p className="aviso error" role="alert">{error}</p>}
      <button className="btn btn-primario" disabled={cargando}>{cargando ? t('acceso.entrando') : t('acceso.entrar')}</button>
      {enlace === 'enviado' ? (
        <p className="aviso" role="status">{t('social.enlaceEnviado', { email: email.trim() })}</p>
      ) : (
        <button type="button" className="btn btn-fantasma" onClick={pedirEnlace} disabled={enlace === 'enviando'}>
          {enlace === 'enviando' ? t('social.enviando') : t('social.sinContrasena')}
        </button>
      )}
      <Link className="enlace pequeno" href="/recuperar/" style={{ alignSelf: 'center' }}>{t('acceso.olvide')}</Link>
      <div className="auth-separador"><span>{t('acceso.nuevo')}</span></div>
      <Link href="/registro/" className="btn btn-bloque">{t('acceso.creaCuenta')}</Link>
    </form>
  );
}
