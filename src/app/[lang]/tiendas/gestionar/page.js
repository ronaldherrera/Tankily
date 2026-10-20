"use client";

import { Suspense, useEffect, useState } from 'react';
import Link, { useNavegar } from '@/components/Enlace';
import { BadgeCheck, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { subirImagen } from '@/lib/imagenes';
import { ESPECIALIDADES_TIENDA } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import EstadisticasTienda from '@/components/tiendas/EstadisticasTienda';
import { paisProbable } from '@/lib/paises';
import SelectorUbicacion from '@/components/SelectorUbicacion';
import { RequiereSesion, useTostada } from '@/components/ui';
import { esPro } from '@/lib/tiendas';
import { geocodificarTienda } from '@/lib/geocodificar';
import Selector from '@/components/Selector';
import RecortarImagen from '@/components/RecortarImagen';
import PlanPro from '@/components/tiendas/PlanPro';

// Logo cuadrado y portada 3:1
const RECORTES = {
  logo_url: { forma: 'rectangulo', proporcion: 1, anchoSalida: 512, titulo: 'recorte.logo' },
  portada_url: { forma: 'rectangulo', proporcion: 3, anchoSalida: 1500, titulo: 'recorte.portada' },
};

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

const VACIA = { nombre: '', slug: '', descripcion: '', logo_url: '', portada_url: '', web: '', telefono: '', email_contacto: '', direccion: '', ciudad: '', pais: '', provincia: '', especialidades: [], venta_online: false, envio_alcance: 'pais', horario: '' };

export default function GestionarTienda() {
  const { usuario, cargando } = useSesion();
  const router = useNavegar();
  const tostada = useTostada();
  const { t } = useT();
  const [existente, setExistente] = useState(undefined);
  const [f, setF] = useState(VACIA);
  const [slugTocado, setSlugTocado] = useState(false);
  const [recorte, setRecorte] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) return;
    supabase.from('tiendas').select('*').eq('propietario_id', usuario.id).maybeSingle().then(({ data }) => {
      setExistente(data);
      if (data) { setF({ ...VACIA, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? VACIA[k] ?? ''])) }); setSlugTocado(true); }
      else setF((x) => ({ ...x, pais: x.pais || paisProbable() }));
    });
  }, [usuario]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion texto={t('tiendas.gestionar.requiereSesion')} /></div>;
  if (existente === undefined) return null;

  const cambiar = (c) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((x) => ({ ...x, [c]: valor, ...(c === 'nombre' && !slugTocado ? { slug: slugify(valor) } : {}) }));
  };

  // Al elegir una foto se abre el recorte; al aplicarlo se sube ya recortada
  function subir(campo, e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (archivo) setRecorte({ campo, archivo });
  }
  async function subirRecorte(archivo) {
    const { campo } = recorte;
    try {
      const url = await subirImagen(archivo, 'tienda', { ladoMaximo: RECORTES[campo].anchoSalida });
      setF((x) => ({ ...x, [campo]: url }));
    } catch (err) { setError(err.message); }
    setRecorte(null);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    if (!/^[a-z0-9-]{3,40}$/.test(f.slug)) return setError(t('tiendas.gestionar.errorSlug'));
    setGuardando(true);
    const web = f.web.trim() && !/^https?:\/\//.test(f.web.trim()) ? `https://${f.web.trim()}` : f.web.trim();
    const fila = {
      nombre: f.nombre.trim(), slug: f.slug, descripcion: f.descripcion.trim() || null, logo_url: f.logo_url || null, portada_url: f.portada_url || null,
      web: web || null, telefono: f.telefono.trim() || null, email_contacto: f.email_contacto.trim() || null, direccion: f.direccion.trim() || null,
      ciudad: f.ciudad.trim() || null, pais: f.pais, provincia: f.provincia.trim(), especialidades: f.especialidades, venta_online: f.venta_online, envio_alcance: f.venta_online ? f.envio_alcance || 'pais' : null, horario: f.horario.trim() || null,
    };
    // Coordenadas para "Más cerca" (OpenStreetMap), solo si la dirección es nueva o ha cambiado
    const cambioDireccion = !existente || existente.lat == null || ['direccion', 'ciudad', 'provincia', 'pais'].some((c) => (existente[c] || '') !== (fila[c] || ''));
    if (cambioDireccion) {
      const coordenadas = await geocodificarTienda(fila);
      fila.lat = coordenadas?.lat ?? null;
      fila.lng = coordenadas?.lng ?? null;
    }
    const res = existente
      ? await supabase.from('tiendas').update(fila).eq('id', existente.id)
      : await supabase.from('tiendas').insert(fila);
    setGuardando(false);
    if (res.error) return setError(res.error.code === '23505' ? t('tiendas.gestionar.slugCogido') : res.error.message);
    tostada(existente ? t('tiendas.gestionar.actualizada') : t('tiendas.gestionar.creada'));
    router.push(`/tiendas/tienda/?s=${f.slug}`);
  }

  const alternarEspecialidad = (k) => setF((x) => ({ ...x, especialidades: x.especialidades.includes(k) ? x.especialidades.filter((e) => e !== k) : [...x.especialidades, k] }));

  return (
    <div className="contenido">
      <form className="columna" onSubmit={guardar} style={{ gap: 18 }}>
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{existente ? t('tiendas.gestionar.tuTienda') : t('tiendas.gestionar.alta')}</h1>

        {existente && (
          <div className="aviso" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {existente.verificada ? <><BadgeCheck size={18} style={{ color: 'var(--agua)' }} /> {t('tiendas.gestionar.verificada')}</> : t('tiendas.gestionar.sinVerificar')}
            <span className="texto-3">·</span>
            <span>{t('tiendas.gestionar.plan', { plan: esPro(existente) ? t('tiendas.gestionar.pro') : t('tiendas.gestionar.gratuito') })}</span>
          </div>
        )}
        {existente && <Suspense><PlanPro tienda={existente} onActualizada={setExistente} /></Suspense>}
        {existente && <EstadisticasTienda tienda={existente} />}

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="fila-campos">
            <label className="campo"><span>{t('tiendas.gestionar.nombre')}</span><input className="entrada" required maxLength={80} value={f.nombre} onChange={cambiar('nombre')} /></label>
            <label className="campo">
              <span>{t('tiendas.gestionar.direccionTankily')}</span>
              <input className="entrada" required maxLength={40} value={f.slug} onChange={(e) => { setSlugTocado(true); setF({ ...f, slug: slugify(e.target.value) }); }} />
              <small>tankily.com/tiendas/tienda/?s={f.slug || 'mi-tienda'}</small>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <label className="btn btn-s">{f.logo_url ? t('tiendas.gestionar.cambiarLogo') : t('tiendas.gestionar.subirLogo')}<input type="file" accept="image/*" hidden onChange={(e) => subir('logo_url', e)} /></label>
            <label className="btn btn-s">{f.portada_url ? t('tiendas.gestionar.cambiarPortada') : t('tiendas.gestionar.subirPortada')}<input type="file" accept="image/*" hidden onChange={(e) => subir('portada_url', e)} /></label>
            {f.logo_url && <img loading="lazy" src={f.logo_url} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover' }} />}
          </div>
          <label className="campo"><span>{t('tiendas.gestionar.descripcion')}</span><textarea className="entrada" rows={4} maxLength={2000} value={f.descripcion} onChange={cambiar('descripcion')} placeholder={t('tiendas.gestionar.descripcionEj')} /></label>
          <div className="campo">
            <span>{t('tiendas.gestionar.especialidades')}</span>
            <div className="chips">
              {ESPECIALIDADES_TIENDA.map((k) => <button type="button" key={k} className="chip" aria-pressed={f.especialidades.includes(k)} onClick={() => alternarEspecialidad(k)}>{t(`tiendas.especialidades.${k}`)}</button>)}
            </div>
          </div>
        </section>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="titulo-s">{t('tiendas.gestionar.ubicacion')}</h2>
          <label className="campo"><span>{t('tiendas.gestionar.direccion')}</span><input className="entrada" maxLength={200} value={f.direccion} onChange={cambiar('direccion')} /></label>
          <div className="fila-campos">
            <label className="campo"><span>{t('tiendas.gestionar.ciudad')}</span><input className="entrada" maxLength={80} value={f.ciudad} onChange={cambiar('ciudad')} /></label>
            <SelectorUbicacion requerido pais={f.pais} region={f.provincia} onCambio={({ pais, region }) => setF({ ...f, pais, provincia: region })} />
          </div>
          <div className="fila-campos">
            <label className="campo"><span>{t('tiendas.gestionar.telefono')}</span><input className="entrada" type="tel" maxLength={30} value={f.telefono} onChange={cambiar('telefono')} /></label>
            <label className="campo"><span>{t('tiendas.gestionar.email')}</span><input className="entrada" type="email" maxLength={120} value={f.email_contacto} onChange={cambiar('email_contacto')} /></label>
            <label className="campo"><span>{t('tiendas.gestionar.web')}</span><input className="entrada" maxLength={200} value={f.web} onChange={cambiar('web')} placeholder={t('tiendas.gestionar.webEj')} /></label>
          </div>
          <label className="campo"><span>{t('tiendas.gestionar.horario')}</span><textarea className="entrada" rows={2} maxLength={300} value={f.horario} onChange={cambiar('horario')} placeholder={t('tiendas.gestionar.horarioEj')} /></label>
          <label className="casilla"><input type="checkbox" checked={f.venta_online} onChange={cambiar('venta_online')} /> {t('tiendas.gestionar.venderOnline')}</label>
          {f.venta_online && (
            <label className="campo">
              <span>{t('envio.alcance')}</span>
              <Selector className="entrada" value={f.envio_alcance || 'pais'} onChange={cambiar('envio_alcance')}>
                <option value="provincia">{t('envio.opcionProvincia')}</option>
                <option value="pais">{t('envio.opcionPais')}</option>
                <option value="internacional">{t('envio.opcionInternacional')}</option>
              </Selector>
            </label>
          )}
        </section>

        {error && <p className="aviso error">{error}</p>}
        <button className="btn btn-primario" style={{ alignSelf: 'flex-end' }} disabled={guardando}>{guardando ? t('comun.guardando') : existente ? t('comun.guardarCambios') : t('tiendas.gestionar.crear')}</button>
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
