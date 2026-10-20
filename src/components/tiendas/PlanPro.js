"use client";

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Crown, ExternalLink } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { esPro } from '@/lib/tiendas';
import { PAGO_ACTIVO, PAGO_MENSUAL, PAGO_ANUAL, enlacePago, enlacePortal } from '@/lib/planPro';
import { useT } from '@/i18n/IdiomaProvider';
import { useTostada } from '@/components/ui';

// Plan Pro en el panel de la tienda: contratar (19 €/mes o 190 €/año con Stripe), ver hasta cuándo es Pro,
// avisos de cancelación o impago y acceso al portal de Stripe para gestionar la suscripción.
// Al volver del pago (?pro=ok) espera a que el aviso de Stripe active el Pro y recarga la tienda.
export default function PlanPro({ tienda, onActualizada }) {
  const { usuario } = useSesion();
  const { t, lang, locale } = useT();
  const tostada = useTostada();
  const vuelta = useSearchParams().get('pro') === 'ok';
  const [suscripcion, setSuscripcion] = useState(null);
  const esperado = useRef(false);

  useEffect(() => {
    supabase.from('tienda_suscripciones').select('periodo, estado, hasta').eq('tienda_id', tienda.id).maybeSingle()
      .then(({ data }) => setSuscripcion(data));
  }, [tienda.id, tienda.plan, tienda.pro_hasta]);

  // Vuelta del pago: el aviso de Stripe tarda unos segundos; se consulta hasta ver el Pro activo
  useEffect(() => {
    if (!vuelta || esperado.current || esPro(tienda)) return;
    esperado.current = true;
    tostada(t('planPro.gracias'));
    let intentos = 0;
    const reloj = setInterval(async () => {
      intentos++;
      const { data } = await supabase.from('tiendas').select('*').eq('id', tienda.id).maybeSingle();
      if (data && esPro(data)) { clearInterval(reloj); onActualizada?.(data); tostada(t('planPro.activado')); }
      else if (intentos > 20) clearInterval(reloj);
    }, 3000);
    return () => clearInterval(reloj);
  }, [vuelta, tienda, onActualizada, tostada, t]);

  const fecha = (d) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const portal = enlacePortal(usuario?.email);

  if (esPro(tienda)) {
    const hasta = suscripcion?.hasta || tienda.pro_hasta;
    const aviso = suscripcion?.estado === 'cancelada' ? 'planPro.cancelado' : suscripcion?.estado === 'impagada' ? 'planPro.impagado' : 'planPro.activo';
    return (
      <section className="cristal plan-pro-panel">
        <h2 className="titulo-s"><Crown size={18} aria-hidden /> {t('planPro.titulo')}</h2>
        {hasta && <p className={`texto-2 pequeno ${suscripcion?.estado === 'impagada' ? 'texto-aviso' : ''}`}>{t(aviso, { fecha: fecha(hasta) })}</p>}
        {suscripcion && portal && (
          <a href={portal} target="_blank" rel="noopener noreferrer" className="btn btn-s" style={{ alignSelf: 'flex-start' }}>
            <ExternalLink size={15} aria-hidden /> {t('planPro.gestionar')}
          </a>
        )}
      </section>
    );
  }

  if (!PAGO_ACTIVO) {
    return <Link href="/tiendas/pro/" className="btn btn-s"><Crown size={14} /> {t('tiendas.gestionar.pasarPro')}</Link>;
  }

  return (
    <section className="cristal plan-pro-panel">
      <h2 className="titulo-s"><Crown size={18} aria-hidden /> {t('planPro.titulo')}</h2>
      <p className="texto-2 pequeno">{t('planPro.texto')} <Link href="/tiendas/pro/" className="enlace">{t('planPro.ventajas')}</Link></p>
      <div className="plan-pro-opciones">
        <a href={enlacePago(PAGO_MENSUAL, tienda, usuario?.email, lang)} className="btn">{t('planPro.mensual')}</a>
        <a href={enlacePago(PAGO_ANUAL, tienda, usuario?.email, lang)} className="btn btn-primario">
          {t('planPro.anual')} <span className="chip">{t('planPro.ahorro')}</span>
        </a>
      </div>
      <p className="mini texto-3">{t('planPro.seguro')} {t('planPro.condiciones')} <Link href="/legal/planes/" className="enlace">{t('planPro.condicionesEnlace')}</Link>.</p>
    </section>
  );
}
