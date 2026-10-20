"use client";

import { useState } from 'react';
import Link, { useNavegar } from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { Modal, RequiereSesion, useTostada } from '@/components/ui';
import { SelectorTema } from '@/components/shell/BotonTema';
import { SelectorIdiomaLista } from '@/components/shell/SelectorIdioma';
import SelectorUnidades from '@/components/shell/SelectorUnidades';
import { useT } from '@/i18n/IdiomaProvider';
import { borrarMisArchivos } from '@/lib/imagenes';
import { borrarMisVideos } from '@/lib/videos';

const TABLAS_PROPIAS = [
  ['perfiles', 'id'], ['tanques', 'usuario_id'], ['publicaciones', 'usuario_id'], ['comentarios', 'usuario_id'],
  ['foro_hilos', 'usuario_id'], ['foro_respuestas', 'usuario_id'], ['anuncios', 'usuario_id'], ['tiendas', 'propietario_id'],
  ['seguidores', 'seguidor_id'], ['me_gusta', 'usuario_id'], ['tienda_resenas', 'usuario_id'],
  ['tanque_seguidores', 'usuario_id'], ['foro_votos', 'usuario_id'], ['notificaciones', 'usuario_id'],
  ['anuncios_guardados', 'usuario_id'], ['avisos_email', 'usuario_id'],
];

export default function AjustesPage() {
  const { usuario, perfil, cargando } = useSesion();
  const router = useNavegar();
  const tostada = useTostada();
  const { t } = useT();
  const [borrando, setBorrando] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion /></div>;

  async function salir() {
    await supabase.auth.signOut();
    router.push('/');
  }

  // Derecho de acceso/portabilidad: descarga todo lo propio en JSON
  async function exportar() {
    const datos = { cuenta: { email: usuario.email, creada: usuario.created_at } };
    for (const [tabla, columna] of TABLAS_PROPIAS) {
      const { data } = await supabase.from(tabla).select('*').eq(columna, usuario.id);
      datos[tabla] = data || [];
    }
    const ids = datos.tanques.map((t) => t.id);
    if (ids.length) {
      for (const tabla of ['habitantes', 'mediciones', 'tanque_eventos', 'tareas']) {
        const { data } = await supabase.from(tabla).select('*').in('tanque_id', ids);
        datos[tabla] = data || [];
      }
    }
    const { data: mensajes } = await supabase.from('mensajes').select('*').or(`emisor_id.eq.${usuario.id},receptor_id.eq.${usuario.id}`);
    datos.mensajes = mensajes || [];
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tankily-${perfil?.usuario || 'datos'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function eliminarCuenta() {
    // Primero las fotos (no se borran en cascada); si fallan, la cuenta se elimina igualmente
    try { await borrarMisArchivos(usuario.id); } catch { /* sigue */ }
    await borrarMisVideos(); // los vídeos están en Cloudflare R2, no en Supabase
    const { error } = await supabase.rpc('eliminar_mi_cuenta');
    if (error) return tostada(t('ajustes.errorEliminar', { error: error.message }));
    await supabase.auth.signOut();
    tostada(t('ajustes.eliminada'));
    router.push('/');
  }

  return (
    <div className="contenido">
      <div className="columna" style={{ gap: 20 }}>
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{t('ajustes.titulo')}</h1>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="titulo-s">{t('ajustes.cuenta')}</h2>
          <p className="texto-2">{t('ajustes.hasEntrado', { email: usuario.email })}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <Link href="/perfil/editar/" className="btn btn-s">{t('perfil.editar')}</Link>
            <Link href="/recuperar/" className="btn btn-s">{t('ajustes.cambiarContrasena')}</Link>
            <Link href="/tiendas/gestionar/" className="btn btn-s">{t('ajustes.miTienda')}</Link>
            <button className="btn btn-s" onClick={salir}>{t('ajustes.cerrarSesion')}</button>
          </div>
        </section>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="titulo-s">{t('ajustes.apariencia')}</h2>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="campo"><span>{t('tema.nombre')}</span><SelectorTema /></div>
            <div className="campo"><span>{t('ajustes.idioma')}</span><SelectorIdiomaLista /></div>
            <div className="campo"><span>{t('ajustes.unidades')}</span><SelectorUnidades /></div>
          </div>
        </section>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="titulo-s">{t('avisos.titulo')}</h2>
          <p className="texto-2 pequeno">{t('avisos.ajustesTexto')}</p>
          <Link href="/avisos/" className="btn btn-s" style={{ alignSelf: 'flex-start', position: 'relative', zIndex: 2 }}>{t('avisos.gestionar')}</Link>
        </section>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="titulo-s">{t('ajustes.tusDatos')}</h2>
          <p className="texto-2 pequeno">{t('ajustes.descargarTexto')}</p>
          <button className="btn btn-s" style={{ alignSelf: 'flex-start', position: 'relative', zIndex: 2 }} onClick={exportar}>{t('ajustes.descargar')}</button>
          <hr className="separador" />
          <p className="texto-2 pequeno">{t('ajustes.eliminarTexto')}</p>
          <button className="btn btn-s btn-peligro" style={{ alignSelf: 'flex-start', position: 'relative', zIndex: 2 }} onClick={() => setBorrando(true)}>{t('ajustes.eliminar')}</button>
        </section>
      </div>

      {borrando && (
        <Modal titulo={t('ajustes.eliminarTitulo')} onCerrar={() => setBorrando(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p className="texto-2">{t('ajustes.confirmar', { usuario: perfil?.usuario })}</p>
            <input className="entrada" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} aria-label={t('ajustes.confirmacion')} />
            <button className="btn btn-peligro" disabled={confirmacion !== perfil?.usuario} onClick={eliminarCuenta}>{t('ajustes.eliminarDefinitivo')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
