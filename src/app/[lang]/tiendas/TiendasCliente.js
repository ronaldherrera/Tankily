"use client";

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { ESPECIALIDADES_TIENDA } from '@/lib/constantes';
import { Cargando, Vacio } from '@/components/ui';
import Publicidad from '@/components/Publicidad';
import SelectorUbicacion from '@/components/SelectorUbicacion';
import TarjetaTienda from '@/components/tiendas/TarjetaTienda';
import { usePaisInicial, useUbicacion, usePuntoUsuario } from '@/lib/ubicacion';
import { ordenarPorDistancia } from '@/lib/geo';
import OrdenCercania from '@/components/OrdenCercania';
import { nombrePais } from '@/lib/paises';
import { esPro } from '@/lib/tiendas';

export default function TiendasPage() {
  const { usuario } = useSesion();
  const { t, locale } = useT();
  const [pais, setPais] = useState('');
  const [region, setRegion] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [online, setOnline] = useState(false);
  const [tiendas, setTiendas] = useState(null);
  // País del usuario como filtro inicial, si hay tiendas allí
  const inicial = usePaisInicial('tiendas', (p) => supabase.from('tiendas').select('id', { count: 'exact', head: true }).eq('pais', p).then(({ count }) => count || 0));
  const [paisAuto, setPaisAuto] = useState(null);
  const ubicacion = useUbicacion();
  const [cerca, setCerca] = useState(false);
  const ubicacionUsuario = usePuntoUsuario();
  const punto = cerca ? ubicacionUsuario.punto : null;
  useEffect(() => {
    if (!inicial.pais) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el país llega tras decidir con la sesión cargada
    setPaisAuto(inicial.pais);
    setPais(inicial.pais);
  }, [inicial.pais]);

  useEffect(() => {
    if (!inicial.decidido) return undefined;
    const temporizador = setTimeout(() => {
      setTiendas(null);
      let q = supabase.from('tiendas').select('id, slug, nombre, logo_url, portada_url, ciudad, provincia, pais, especialidades, venta_online, envio_alcance, lat, lng, plan, pro_hasta, verificada, valoracion, num_resenas');
      if (pais) q = q.eq('pais', pais);
      if (region.trim()) q = pais === 'ES' ? q.eq('provincia', region) : q.ilike('provincia', `%${region.trim().replace(/[%*]/g, '')}%`);
      if (especialidad) q = q.contains('especialidades', [especialidad]);
      if (online) q = q.eq('venta_online', true);
      q.order('plan', { ascending: false }).order('verificada', { ascending: false }).order('valoracion', { ascending: false }).limit(90)
        // Orden final aquí: primero las de la provincia del usuario (si la tiene en su perfil) y, dentro
        // de cada grupo, las Pro vigentes (las caducadas siguen con plan 'pro' en la base de datos)
        .then(({ data }) => {
          // "Más cerca": por distancia al usuario (tiendas con coordenadas reales; si no, centro de su provincia)
          if (punto) { setTiendas(ordenarPorDistancia(data || [], punto)); return; }
          const enSuProvincia = (ti) => Number(!!ubicacion.provincia && ti.pais === ubicacion.pais && ti.provincia === ubicacion.provincia);
          setTiendas((data || []).map((ti, i) => ({ ti, i }))
            .sort((a, b) => enSuProvincia(b.ti) - enSuProvincia(a.ti) || Number(esPro(b.ti)) - Number(esPro(a.ti)) || a.i - b.i)
            .map((x) => x.ti));
        });
    }, 250);
    return () => clearTimeout(temporizador);
  }, [pais, region, especialidad, online, inicial.decidido, ubicacion.pais, ubicacion.provincia, punto]);

  return (
    <div className="contenido ancho">
      <div className="columna" style={{ gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, paddingTop: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 className="titulo-l">{t('tiendas.titulo')}</h1>
            <p className="texto-2">{t('tiendas.subtitulo')}</p>
          </div>
          <Link href={usuario ? '/tiendas/gestionar/' : '/tiendas/pro/'} className="btn">{t('tiendas.anadir')}</Link>
        </header>

        <div className="filtros-mercado cristal">
          <SelectorUbicacion modo="filtro" pais={pais} region={region} onCambio={(v) => { setPais(v.pais); setRegion(v.region); }} />
          <label className="casilla" style={{ alignItems: 'center' }}><input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} /> {t('tiendas.ventaOnline')}</label>
        </div>
        {paisAuto && pais === paisAuto && (
          <p className="aviso-cercania mini">
            <MapPin size={14} aria-hidden="true" /> {t('cercania.tiendas', { pais: nombrePais(paisAuto, locale) })}
            <button type="button" className="enlace" onClick={() => { inicial.verTodos(); setPaisAuto(null); setPais(''); setRegion(''); }}>{t('cercania.verTodos')}</button>
          </p>
        )}
        <OrdenCercania activo={cerca} onCambio={setCerca} ubicacion={ubicacionUsuario} conUsuario={!!usuario} />
        <div className="chips-desliza" role="group" aria-label={t('tiendas.especialidad')}>
          <button className="chip" aria-pressed={!especialidad} onClick={() => setEspecialidad('')}>{t('tiendas.todas')}</button>
          {ESPECIALIDADES_TIENDA.map((k) => (
            <button key={k} className="chip" aria-pressed={especialidad === k} onClick={() => setEspecialidad(especialidad === k ? '' : k)}>{t(`tiendas.especialidades.${k}`)}</button>
          ))}
        </div>

        <Publicidad ubicacion="tiendas" />

        {tiendas === null ? <div className="rejilla-tarjetas"><Cargando alto={220} n={6} /></div> : tiendas.length === 0 ? (
          <Vacio titulo={t('tiendas.vacioTitulo')} accion={<Link href="/tiendas/pro/" className="btn">{t('tiendas.darDeAlta')}</Link>}>
            {t('tiendas.vacioTexto')}
          </Vacio>
        ) : (
          <div className="rejilla-tarjetas">{tiendas.map((ti) => <TarjetaTienda key={ti.id} tienda={ti} />)}</div>
        )}
      </div>
    </div>
  );
}
