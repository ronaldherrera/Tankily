"use client";

import { useEffect, useRef, useState } from 'react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';
import { supabase } from '@/lib/supabase';
import { ADSENSE_CLIENTE, ADSENSE_SLOT, cargarScriptAdsense } from '@/lib/adsense';

let cacheCampanas = null;
async function campanasVigentes() {
  if (!cacheCampanas) {
    cacheCampanas = supabase
      .from('campanas')
      .select('id, titulo, texto, imagen_url, enlace, ubicacion, prioridad, tienda:tiendas(nombre, slug, logo_url, verificada)')
      .order('prioridad', { ascending: false })
      .then(({ data }) => data || []);
  }
  return cacheCampanas;
}

// Espacio publicitario. Prioridad: campaña propia (tiendas Pro / marcas directas) → AdSense →
// autopromoción del plan para tiendas. Siempre rotulado como publicidad.
export default function Publicidad({ ubicacion = 'lateral' }) {
  const [campana, setCampana] = useState(undefined);
  const { t } = useT();
  const ins = useRef(null);

  useEffect(() => {
    campanasVigentes().then((lista) => {
      const candidatas = lista.filter((c) => c.ubicacion === ubicacion);
      setCampana(candidatas.length ? candidatas[Math.floor(Math.random() * Math.min(candidatas.length, 3))] : null);
    });
  }, [ubicacion]);

  const usarAdsense = campana === null && ADSENSE_CLIENTE && ADSENSE_SLOT;

  useEffect(() => {
    if (!usarAdsense || !ins.current || ins.current.dataset.listo) return;
    cargarScriptAdsense();
    ins.current.dataset.listo = '1';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, [usarAdsense]);

  if (campana === undefined) return null;

  if (campana) {
    const externo = /^https?:/.test(campana.enlace);
    return (
      <aside className="publi cristal-suave" aria-label={t('publi.rotulo')}>
        <span className="publi-rotulo">{t('publi.patrocinado')}{campana.tienda ? ` · ${campana.tienda.nombre}` : ''}</span>
        <a href={campana.enlace} target={externo ? '_blank' : undefined} rel={externo ? 'noopener sponsored' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {campana.imagen_url && <img src={campana.imagen_url} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover' }} loading="lazy" />}
          <strong className="titulo-s">{campana.titulo}</strong>
          {campana.texto && <span className="pequeno texto-2">{campana.texto}</span>}
        </a>
      </aside>
    );
  }

  if (usarAdsense) {
    return (
      <aside className="publi cristal-suave" aria-label={t('publi.rotulo')}>
        <span className="publi-rotulo">{t('publi.rotulo')}</span>
        <ins ref={ins} className="adsbygoogle" style={{ display: 'block', minHeight: 120 }}
          data-ad-client={ADSENSE_CLIENTE} data-ad-slot={ADSENSE_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
      </aside>
    );
  }

  return (
    <aside className="publi cristal-suave" aria-label={t('publi.rotulo')}>
      <span className="publi-rotulo">{t('publi.paraTiendas')}</span>
      <strong className="titulo-s">{t('publi.tiendaTitulo')}</strong>
      <span className="pequeno texto-2">{t('publi.tiendaTexto')}</span>
      <Link href="/tiendas/pro/" className="btn btn-s" style={{ alignSelf: 'flex-start' }}>{t('publi.verPlanes')}</Link>
    </aside>
  );
}
