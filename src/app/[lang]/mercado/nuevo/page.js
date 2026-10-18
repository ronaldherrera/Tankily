"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNavegar } from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { CATEGORIAS_ANUNCIO, MODALIDADES } from '@/lib/constantes';
import { MONEDAS, monedaDe, paisProbable } from '@/lib/paises';
import { RequiereSesion, SubidorImagenes, useTostada } from '@/components/ui';
import SelectorUbicacion from '@/components/SelectorUbicacion';
import { mensajeError } from '@/lib/errores';
import Selector from '@/components/Selector';

const VACIO = { titulo: '', descripcion: '', categoria: 'peces', modalidad: 'venta', precio: '', moneda: 'EUR', pais: '', provincia: '', envio: false, envio_alcance: 'pais', imagenes: [], estado: 'activo', como_tienda: false };

function FormularioAnuncio() {
  const id = useSearchParams().get('id');
  const router = useNavegar();
  const tostada = useTostada();
  const { t } = useT();
  const { usuario, perfil, cargando } = useSesion();
  const [tienda, setTienda] = useState(null);
  const [f, setF] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) return;
    // Quien tiene tienda publica como tienda por defecto (y si es Pro, el anuncio sale destacado)
    supabase.from('tiendas').select('id, nombre').eq('propietario_id', usuario.id).maybeSingle().then(({ data }) => {
      setTienda(data);
      if (data && !id) setF((x) => ({ ...x, como_tienda: true }));
    });
    if (id) {
      supabase.from('anuncios').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setF({ ...VACIO, ...data, precio: data.precio ?? '', como_tienda: !!data.tienda_id });
      });
    } else {
      // Anuncio nuevo: país, región y moneda del perfil (o del navegador)
      const pais = perfil?.pais || paisProbable();
      setF((x) => ({ ...x, pais: x.pais || pais, provincia: x.provincia || perfil?.provincia || '', moneda: monedaDe(pais) }));
    }
  }, [usuario, perfil, id]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion texto={t('mercado.form.requiereSesion')} /></div>;

  const cambiar = (c) => (e) => setF({ ...f, [c]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const fila = {
      titulo: f.titulo.trim(),
      descripcion: f.descripcion.trim(),
      categoria: f.categoria,
      modalidad: f.modalidad,
      precio: f.modalidad === 'regalo' || f.precio === '' ? null : Number(String(f.precio).replace(',', '.')),
      moneda: f.moneda,
      pais: f.pais,
      provincia: f.provincia.trim(),
      envio: f.envio,
      envio_alcance: f.envio ? f.envio_alcance || 'pais' : null,
      imagenes: f.imagenes,
    };
    let res;
    if (id) res = await supabase.from('anuncios').update({ ...fila, estado: f.estado }).eq('id', id).select('id').single();
    else res = await supabase.from('anuncios').insert({ ...fila, tienda_id: f.como_tienda && tienda ? tienda.id : null }).select('id').single();
    setGuardando(false);
    if (res.error) return setError(mensajeError(res.error, t));
    tostada(id ? t('mercado.form.actualizado') : t('mercado.form.publicado'));
    router.push(`/mercado/anuncio/?id=${res.data.id}`);
  }

  return (
    <div className="contenido">
      <form className="columna" onSubmit={guardar} style={{ gap: 18 }}>
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{id ? t('mercado.form.editar') : t('mercado.form.nuevo')}</h1>
        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="campo">
            <span>{t('mercado.form.fotos')}</span>
            <SubidorImagenes valor={f.imagenes} onCambio={(imagenes) => setF({ ...f, imagenes })} maximo={8} carpeta="mercado" />
            <small>{t('mercado.form.fotosAyuda')}</small>
          </div>
          <label className="campo"><span>{t('mercado.form.titulo')}</span><input className="entrada" required minLength={3} maxLength={100} value={f.titulo} onChange={cambiar('titulo')} placeholder={t('mercado.form.tituloEj')} /></label>
          <div className="fila-campos">
            <label className="campo">
              <span>{t('mercado.form.categoria')}</span>
              <Selector className="entrada" value={f.categoria} onChange={cambiar('categoria')}>
                {CATEGORIAS_ANUNCIO.map((k) => <option key={k} value={k}>{t(`mercado.categorias.${k}`)}</option>)}
              </Selector>
            </label>
            <label className="campo">
              <span>{t('mercado.form.modalidad')}</span>
              <Selector className="entrada" value={f.modalidad} onChange={cambiar('modalidad')}>
                {MODALIDADES.map((k) => <option key={k} value={k}>{t(`mercado.modalidades.${k}`)}</option>)}
              </Selector>
            </label>
          </div>
          {f.modalidad !== 'regalo' && (
            <div className="fila-campos">
              <label className="campo"><span>{t('mercado.form.precio')}</span><input className="entrada" inputMode="decimal" value={f.precio} onChange={cambiar('precio')} placeholder={f.modalidad === 'cambio' ? t('mercado.form.opcional') : t('mercado.form.precioEj')} /></label>
              <label className="campo">
                <span>{t('mercado.form.moneda')}</span>
                <Selector className="entrada" value={f.moneda} onChange={cambiar('moneda')}>
                  {MONEDAS.map((m) => <option key={m}>{m}</option>)}
                </Selector>
              </label>
            </div>
          )}
          <label className="campo"><span>{t('mercado.form.descripcion')}</span><textarea className="entrada" rows={6} maxLength={4000} value={f.descripcion} onChange={cambiar('descripcion')} placeholder={t('mercado.form.descripcionEj')} /></label>
          <div className="fila-campos">
            <SelectorUbicacion
              requerido
              pais={f.pais}
              region={f.provincia}
              onCambio={({ pais, region }) => setF({ ...f, pais, provincia: region, moneda: pais !== f.pais && pais ? monedaDe(pais) : f.moneda })}
            />
            {id && (
              <label className="campo">
                <span>{t('mercado.form.estado')}</span>
                <Selector className="entrada" value={f.estado} onChange={cambiar('estado')}>
                  <option value="activo">{t('mercado.form.disponible')}</option>
                  <option value="reservado">{t('mercado.form.reservado')}</option>
                  <option value="vendido">{t('mercado.form.vendido')}</option>
                </Selector>
              </label>
            )}
          </div>
          <label className="casilla"><input type="checkbox" checked={f.envio} onChange={cambiar('envio')} /> {t('mercado.form.envios')}</label>
          {f.envio && (
            <label className="campo">
              <span>{t('envio.alcance')}</span>
              <Selector className="entrada" value={f.envio_alcance || 'pais'} onChange={cambiar('envio_alcance')}>
                <option value="provincia">{t('envio.opcionProvincia')}</option>
                <option value="pais">{t('envio.opcionPais')}</option>
                <option value="internacional">{t('envio.opcionInternacional')}</option>
              </Selector>
            </label>
          )}
          {tienda && !id && <label className="casilla"><input type="checkbox" checked={f.como_tienda} onChange={cambiar('como_tienda')} /> {t('mercado.form.comoTienda', { tienda: tienda.nombre })}</label>}
          <p className="mini texto-3">{t('mercado.form.aviso')}</p>
        </section>
        {error && <p className="aviso error">{error}</p>}
        <button className="btn btn-primario" style={{ alignSelf: 'flex-end' }} disabled={guardando}>{guardando ? t('comun.guardando') : id ? t('comun.guardarCambios') : t('mercado.publicar')}</button>
      </form>
    </div>
  );
}

export default function NuevoAnuncioPage() {
  return <Suspense><FormularioAnuncio /></Suspense>;
}
