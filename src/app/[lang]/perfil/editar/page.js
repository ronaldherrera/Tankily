"use client";

import { useNavegar } from '@/components/Enlace';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { subirImagen } from '@/lib/imagenes';
import { NIVELES } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import SelectorUbicacion from '@/components/SelectorUbicacion';
import { Avatar, RequiereSesion, useTostada } from '@/components/ui';
import { usuarioValido } from '@/lib/usuario';
import Selector from '@/components/Selector';
import RecortarImagen from '@/components/RecortarImagen';

// Foto de perfil cuadrada (se ve en círculo) y portada 3:1, como se muestran en el perfil
const RECORTES = {
  avatar_url: { forma: 'circulo', proporcion: 1, anchoSalida: 512, titulo: 'recorte.foto' },
  portada_url: { forma: 'rectangulo', proporcion: 3, anchoSalida: 1500, titulo: 'recorte.portada' },
};

export default function EditarPerfil() {
  const { usuario, perfil, cargando, recargarPerfil } = useSesion();
  const router = useNavegar();
  const tostada = useTostada();
  const { t } = useT();
  const [f, setF] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [recorte, setRecorte] = useState(null);

  useEffect(() => {
    if (perfil && !f) setF({ usuario: perfil.usuario, nombre: perfil.nombre || '', bio: perfil.bio || '', pais: perfil.pais || '', provincia: perfil.provincia || '', nivel: perfil.nivel || '', avatar_url: perfil.avatar_url || '', portada_url: perfil.portada_url || '' });
  }, [perfil, f]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion /></div>;
  if (!f) return null;

  const cambiar = (c) => (e) => setF({ ...f, [c]: e.target.value });

  // Al elegir una foto se abre el recorte; al aplicarlo se sube ya recortada
  function subir(campo, e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (archivo) setRecorte({ campo, archivo });
  }
  async function subirRecorte(archivo) {
    const { campo } = recorte;
    try {
      const url = await subirImagen(archivo, 'perfil', { ladoMaximo: RECORTES[campo].anchoSalida });
      setF((x) => ({ ...x, [campo]: url }));
    } catch (err) { setError(err.message); }
    setRecorte(null);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    const nombreUsuario = f.usuario.trim().toLowerCase();
    if (!usuarioValido(nombreUsuario)) return setError(t('registro.errorUsuario'));
    setGuardando(true);
    const { error } = await supabase.from('perfiles').update({
      usuario: nombreUsuario,
      nombre: f.nombre.trim() || null,
      bio: f.bio.trim() || null,
      pais: f.pais || null,
      provincia: f.provincia || null,
      nivel: f.nivel || null,
      avatar_url: f.avatar_url || null,
      portada_url: f.portada_url || null,
    }).eq('id', usuario.id);
    setGuardando(false);
    if (error) return setError(error.code === '23505' ? t('registro.usuarioCogido') : error.message);
    await recargarPerfil();
    tostada(t('editarPerfil.guardado'));
    router.push(`/u/?n=${nombreUsuario}`);
  }

  return (
    <div className="contenido">
      <form className="columna" onSubmit={guardar} style={{ gap: 20 }}>
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{t('editarPerfil.titulo')}</h1>
        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar perfil={{ ...perfil, avatar_url: f.avatar_url }} tamano={80} />
            <label className="btn btn-s" style={{ position: 'relative', zIndex: 2 }}>{t('editarPerfil.cambiarFoto')}<input type="file" accept="image/*" hidden onChange={(e) => subir('avatar_url', e)} /></label>
            <label className="btn btn-s btn-fantasma" style={{ position: 'relative', zIndex: 2 }}>{t('editarPerfil.cambiarPortada')}<input type="file" accept="image/*" hidden onChange={(e) => subir('portada_url', e)} /></label>
          </div>
          <div className="fila-campos">
            <label className="campo"><span>{t('editarPerfil.nombre')}</span><input className="entrada" maxLength={50} value={f.nombre} onChange={cambiar('nombre')} /></label>
            <label className="campo"><span>{t('editarPerfil.usuario')}</span><input className="entrada" maxLength={20} value={f.usuario} onChange={cambiar('usuario')} autoCapitalize="none" /></label>
          </div>
          <label className="campo"><span>{t('editarPerfil.bio')}</span><textarea className="entrada" maxLength={300} value={f.bio} onChange={cambiar('bio')} placeholder={t('editarPerfil.bioEj')} /><small>{t('editarPerfil.restantes', { n: 300 - f.bio.length })}</small></label>
          <div className="fila-campos">
            <SelectorUbicacion pais={f.pais} region={f.provincia} onCambio={({ pais, region }) => setF({ ...f, pais, provincia: region })} />
            <label className="campo">
              <span>{t('editarPerfil.experiencia')}</span>
              <Selector className="entrada" value={f.nivel} onChange={cambiar('nivel')}>
                <option value="">{t('comun.sinIndicar')}</option>
                {NIVELES.map((k) => <option key={k} value={k}>{t(`perfil.niveles.${k}`)}</option>)}
              </Selector>
            </label>
          </div>
        </section>
        {error && <p className="aviso error">{error}</p>}
        <button className="btn btn-primario" style={{ alignSelf: 'flex-end' }} disabled={guardando}>{guardando ? t('comun.guardando') : t('editarPerfil.guardar')}</button>
      </form>
      {recorte && (
        <RecortarImagen
          archivo={recorte.archivo}
          {...RECORTES[recorte.campo]}
          titulo={t(RECORTES[recorte.campo].titulo)}
          onListo={subirRecorte}
          onCancelar={() => setRecorte(null)}
        />
      )}
    </div>
  );
}
