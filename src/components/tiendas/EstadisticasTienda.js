"use client";

import { useEffect, useState } from 'react';
import { Crown, Eye, MessageCircle, Globe2 } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import { esPro } from '@/lib/tiendas';

const DIAS = 30;

// Estadísticas de los últimos 30 días para tiendas Pro. Las gratuitas ven qué se están perdiendo.
export default function EstadisticasTienda({ tienda }) {
  const { t, locale } = useT();
  const pro = esPro(tienda);
  const [filas, setFilas] = useState(null);
  const [serie, setSerie] = useState([]);

  useEffect(() => {
    if (!pro) return;
    const hoy = Date.now();
    const dia = (i) => new Date(hoy - (DIAS - 1 - i) * 86400000).toISOString().slice(0, 10);
    supabase.from('tienda_visitas').select('dia, vistas, contactos, web').eq('tienda_id', tienda.id).gte('dia', dia(0)).order('dia')
      .then(({ data }) => {
        const filasDb = data || [];
        const porDia = Object.fromEntries(filasDb.map((f) => [f.dia, f]));
        // Serie completa de 30 días (los días sin visitas cuentan como 0)
        setSerie(Array.from({ length: DIAS }, (_, i) => ({ dia: dia(i), vistas: porDia[dia(i)]?.vistas || 0 })));
        setFilas(filasDb);
      });
  }, [pro, tienda.id]);

  if (!pro) {
    return (
      <section className="cristal estad-tienda estad-bloqueada">
        <h2 className="titulo-s">{t('estadTienda.titulo')}</h2>
        <p className="pequeno texto-2">{t('estadTienda.teaser')}</p>
        <Link href="/tiendas/pro/" className="btn btn-primario" style={{ alignSelf: 'flex-start' }}><Crown size={15} aria-hidden="true" /> {t('estadTienda.verPro')}</Link>
      </section>
    );
  }
  if (!filas) return null;

  const total = (k) => filas.reduce((s, f) => s + f[k], 0);
  const max = Math.max(1, ...serie.map((d) => d.vistas));
  const fecha = (d) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(d));

  return (
    <section className="cristal estad-tienda" aria-labelledby="estad-titulo">
      <div className="estad-cabecera">
        <h2 className="titulo-s" id="estad-titulo">{t('estadTienda.titulo')}</h2>
        <span className="mini texto-3">{t('estadTienda.periodo')}</span>
      </div>
      <div className="estad-cifras">
        <div><Eye size={16} aria-hidden="true" /><span className="cifra">{total('vistas')}</span><span className="mini texto-3">{t('estadTienda.vistas')}</span></div>
        <div><MessageCircle size={16} aria-hidden="true" /><span className="cifra">{total('contactos')}</span><span className="mini texto-3">{t('estadTienda.contactos')}</span></div>
        <div><Globe2 size={16} aria-hidden="true" /><span className="cifra">{total('web')}</span><span className="mini texto-3">{t('estadTienda.web')}</span></div>
      </div>
      {total('vistas') === 0 ? (
        <p className="pequeno texto-2">{t('estadTienda.sinDatos')}</p>
      ) : (
        <div className="estad-barras" role="img" aria-label={`${t('estadTienda.vistas')}: ${total('vistas')}`}>
          {serie.map((d) => (
            <span key={d.dia} className="estad-barra" style={{ '--alto': `${(d.vistas / max) * 100}%` }} title={t('estadTienda.dia', { fecha: fecha(d.dia), n: d.vistas })} />
          ))}
        </div>
      )}
    </section>
  );
}
