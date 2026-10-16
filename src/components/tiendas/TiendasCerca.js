"use client";

import { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import { useUbicacion } from '@/lib/ubicacion';
import { esPro } from '@/lib/tiendas';
import { nombrePais, unirLugar } from '@/lib/paises';

// "Tiendas cerca de ti" en la columna lateral de la portada: hasta 3 tiendas del país del usuario,
// primero las de su provincia y, dentro de cada grupo, las Pro. Si no hay ninguna, no se muestra.
export default function TiendasCerca() {
  const { t, locale } = useT();
  const ubicacion = useUbicacion();
  const [tiendas, setTiendas] = useState([]);

  useEffect(() => {
    if (!ubicacion.listo || !ubicacion.pais) return undefined;
    let vigente = true;
    supabase.from('tiendas').select('id, slug, nombre, logo_url, ciudad, provincia, pais, plan, pro_hasta, verificada, valoracion')
      .eq('pais', ubicacion.pais).order('valoracion', { ascending: false }).limit(30)
      .then(({ data }) => {
        if (!vigente) return;
        const cerca = (ti) => Number(!!ubicacion.provincia && ti.provincia === ubicacion.provincia);
        setTiendas((data || []).sort((a, b) => cerca(b) - cerca(a) || Number(esPro(b)) - Number(esPro(a))).slice(0, 3));
      });
    return () => { vigente = false; };
  }, [ubicacion.listo, ubicacion.pais, ubicacion.provincia]);

  if (!tiendas.length) return null;
  return (
    <section className="cristal-suave tiendas-cerca" style={{ padding: 16 }}>
      <h2 className="titulo-s">{t('cercania.tiendasCerca')}</h2>
      <ul>
        {tiendas.map((ti) => (
          <li key={ti.id}>
            <Link href={`/tiendas/tienda/?s=${ti.slug}`} className="fila-tanque">
              <span className="logo-tienda mini-logo">{ti.logo_url ? <img src={ti.logo_url} alt="" loading="lazy" /> : ti.nombre.charAt(0)}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <strong className="pequeno" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {ti.nombre} {ti.verificada && <BadgeCheck size={13} style={{ color: 'var(--agua)', flexShrink: 0 }} aria-label={t('tiendas.verificada')} />}
                </strong>
                <span className="mini texto-3">{unirLugar([ti.ciudad, ti.provincia, nombrePais(ti.pais, locale)])}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/tiendas/" className="enlace pequeno">{t('cercania.verTodas')}</Link>
    </section>
  );
}
