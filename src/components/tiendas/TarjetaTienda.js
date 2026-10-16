"use client";

import Link from '@/components/Enlace';
import { BadgeCheck, MapPin, Star, Globe2, Navigation } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { nombrePais, unirLugar } from '@/lib/paises';
import { formatNumero } from '@/lib/formatRelativeTime';
import { esPro } from '@/lib/tiendas';
import { textoDistancia } from '@/components/OrdenCercania';

export default function TarjetaTienda({ tienda }) {
  const { t, locale } = useT();
  const pro = esPro(tienda);
  const lugar = unirLugar([tienda.ciudad, tienda.provincia, nombrePais(tienda.pais, locale)]);
  return (
    <Link href={`/tiendas/tienda/?s=${tienda.slug}`} className={`tarjeta-tienda cristal-suave${pro ? ' pro' : ''}`}>
      <div className="tarjeta-tienda-portada" style={tienda.portada_url ? { backgroundImage: `url(${JSON.stringify(tienda.portada_url)})` } : undefined} />
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="logo-tienda">{tienda.logo_url ? <img loading="lazy" src={tienda.logo_url} alt="" /> : tienda.nombre.charAt(0)}</span>
        <strong className="titulo-s" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {tienda.nombre} {tienda.verificada && <BadgeCheck size={16} style={{ color: 'var(--agua)' }} aria-label={t('tiendas.verificada')} />}
        </strong>
        <span className="mini texto-3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><MapPin size={12} />{lugar}</span>
          {tienda.distancia != null && <span className="distancia"><Navigation size={11} aria-hidden="true" />{textoDistancia(tienda.distancia, t, tienda.aproximada)}</span>}
          {tienda.venta_online && <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><Globe2 size={12} />{tienda.envio_alcance ? t(`envio.${tienda.envio_alcance}`) : t('tiendas.online')}</span>}
          {tienda.num_resenas > 0 && <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><Star size={12} fill="currentColor" />{formatNumero(tienda.valoracion, 1)} ({tienda.num_resenas})</span>}
        </span>
        {tienda.especialidades?.length > 0 && (
          <span className="mini texto-2">{tienda.especialidades.map((e) => t(`tiendas.especialidades.${e}`)).join(', ')}</span>
        )}
      </div>
    </Link>
  );
}
