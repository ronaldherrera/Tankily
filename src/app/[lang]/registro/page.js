'use client';

import { useState } from 'react';
import Link, { useNavegar } from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { Marca } from '@/components/shell/AppShell';
import { useT } from '@/i18n/IdiomaProvider';
import AccesoSocial from '@/components/auth/AccesoSocial';
import { contrasenaValida } from '@/lib/contrasena';
import { usuarioValido } from '@/lib/usuario';
import CampoContrasena from '@/components/CampoContrasena';
import { evento } from '@/lib/analitica';

export default function RegistroPage() {
  const router = useNavegar();
  const { t, lang } = useT();
  const [f, setF] = useState({ nombre: '', usuario: '', email: '', password: '', repetir: '' });
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const cambiar = (c) => (e) => setF({ ...f, [c]: e.target.value });

  async function registrar(e) {
    e.preventDefault();
    setError('');
    const usuario = f.usuario.trim().toLowerCase();
    if (!usuarioValido(usuario)) return setError(t('registro.errorUsuario'));
    if (!contrasenaValida(f.password)) return setError(t('registro.errorContrasena'));
    if (f.repetir !== f.password) return setError(t('contrasena.noCoinciden'));
    setCargando(true);
    const { data: ocupado } = await supabase.from('perfiles').select('id').eq('usuario', usuario).maybeSingle();
    if (ocupado) { setCargando(false); return setError(t('registro.usuarioCogido')); }

    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        // idioma: para enviar los emails de la cuenta en su idioma (plantillas en supabase/plantillas)
        data: { usuario, nombre: f.nombre.trim(), idioma: lang },
        emailRedirectTo: `${window.location.origin}/${lang}/`,
      },
    });
    setCargando(false);
    if (error) return setError(error.message === 'User already registered' ? t('registro.emailExiste') : error.message);
    // Con la confirmación de email activada, Supabase no da error si el email ya existe (no envía nada y
    // devuelve el usuario sin identidades): se avisa para que entre o recupere la contraseña.
    if (data.user && data.user.identities?.length === 0) return setError(t('registro.emailExiste'));
    evento('registro', { metodo: 'email' });
    if (data.session) router.push('/tanques/nuevo/');
    else setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="auth cristal cristal-refracta">
        <Marca tamano={48} />
        <h1 className="titulo-l">{t('registro.revisaCorreo')}</h1>
        <p className="texto-2">{t('registro.enlaceEnviado', { email: f.email })}</p>
        <Link href="/acceder/" className="btn">{t('registro.irAEntrar')}</Link>
      </div>
    );
  }

  return (
    <form className="auth cristal cristal-refracta" onSubmit={registrar}>
      <Marca tamano={48} />
      <div>
        <h1 className="titulo-l">{t('registro.titulo')}</h1>
        <p className="texto-2">{t('registro.subtitulo')}</p>
      </div>
      <AccesoSocial registro />
      <label className="campo"><span>{t('registro.nombre')}</span><input className="entrada" autoComplete="name" maxLength={50} value={f.nombre} onChange={cambiar('nombre')} /></label>
      <label className="campo">
        <span>{t('registro.usuario')}</span>
        <input className="entrada" required autoCapitalize="none" maxLength={20} value={f.usuario} onChange={cambiar('usuario')} placeholder={t('registro.usuarioEj')} />
        <small>{t('registro.asiTeMencionaran', { usuario: f.usuario.trim().toLowerCase() || 'usuario' })}</small>
      </label>
      <label className="campo"><span>{t('acceso.email')}</span><input className="entrada" type="email" autoComplete="email" required value={f.email} onChange={cambiar('email')} /></label>
      <CampoContrasena etiqueta={t('acceso.contrasena')} valor={f.password} onCambio={(v) => setF({ ...f, password: v })} autoComplete="new-password" minLength={8} ayuda={t('registro.minimo')} />
      <CampoContrasena
        etiqueta={t('contrasena.repetir')}
        valor={f.repetir}
        onCambio={(v) => setF({ ...f, repetir: v })}
        autoComplete="new-password"
        error={f.repetir && f.repetir !== f.password.slice(0, f.repetir.length) ? t('contrasena.noCoinciden') : ''}
      />
      <label className="casilla">
        <input type="checkbox" required checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
        <span>{t('registro.acepto')} <Link className="enlace" href="/legal/normas/" target="_blank">{t('registro.normas')}</Link> {t('registro.yLa')} <Link className="enlace" href="/legal/privacidad/" target="_blank">{t('registro.privacidad')}</Link>.</span>
      </label>
      {error && <p className="aviso error" role="alert">{error}</p>}
      <button className="btn btn-primario" disabled={cargando || !acepta}>{cargando ? t('registro.creando') : t('registro.crear')}</button>
      <p className="pequeno texto-2">{t('registro.yaTienes')} <Link className="enlace" href="/acceder/">{t('registro.entra')}</Link></p>
    </form>
  );
}
