"use client";

import Link from '@/components/Enlace';
import { MapPin, Truck, BadgeCheck, Navigation } from 'lucide-react';
import { textoDistancia } from '@/components/OrdenCercania';
import { formatPrecio, formatRelativeTime } from '@/lib/formatRelativeTime';
import { useT } from '@/i18n/IdiomaProvider';
import { nombrePais, unirLugar } from '@/lib/paises';
import BotonGuardar from './BotonGuardar';

// destacado: el campo calculado destacado_ahora (marcado por un admin o de una tienda con Pro vigente)
export const SELECT_ANUNCIO = 'id, titulo, precio, moneda, modalidad, provincia, pais, envio, envio_alcance, imagenes, estado, destacado:destacado_ahora, creado_en, categoria, tienda:tiendas(nombre, slug, verificada, lat, lng)';

export default function AnuncioCard({ anuncio }) {
  const { t, locale } = useT();
  return (
    <div className="tarjeta-anuncio-caja">
    <Link href={`/mercado/anuncio/?id=${anuncio.id}`} className={`tarjeta-anuncio cristal-suave${anuncio.destacado ? ' destacado' : ''}`}>
      <div className="tarjeta-anuncio-foto">
        {anuncio.imagenes?.[0] ? <img src={anuncio.imagenes[0]} alt="" loading="lazy" /> : <span className="texto-3 mini">{t('mercado.sinFoto')}</span>}
        {anuncio.estado !== 'activo' && <span className="sello">{anuncio.estado === 'reservado' ? t('mercado.reservado') : t('mercado.vendido')}</span>}
        {anuncio.destacado && <span className="sello sello-destacado">{t('mercado.destacado')}</span>}
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="cifra" style={{ fontSize: '1.15rem' }}>{formatPrecio(anuncio.precio, anuncio.modalidad, anuncio.moneda)}</span>
        <strong className="pequeno" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{anuncio.titulo}</strong>
        <span className="mini texto-3" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {anuncio.distancia != null && <span className="distancia"><Navigation size={11} aria-hidden="true" />{textoDistancia(anuncio.distancia, t, anuncio.aproximada)}</span>}
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><MapPin size={12} />{unirLugar([anuncio.provincia, nombrePais(anuncio.pais, locale)])}</span>
          {anuncio.envio && <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><Truck size={12} />{anuncio.envio_alcance ? t(`envio.${anuncio.envio_alcance}`) : t('mercado.envio')}</span>}
          {anuncio.modalidad !== 'venta' && <span>{t(`mercado.modalidades.${anuncio.modalidad}`)}</span>}
          <span>{formatRelativeTime(anuncio.creado_en)}</span>
        </span>
        {anuncio.tienda && (
          <span className="mini" style={{ display: 'inline-flex', gap: 4, alignItems: 'center', color: 'var(--agua-texto)' }}>
            {anuncio.tienda.verificada && <BadgeCheck size={12} />}{anuncio.tienda.nombre}
          </span>
        )}
      </div>
    </Link>
    <BotonGuardar anuncioId={anuncio.id} className="en-tarjeta" />
    </div>
  );
}
