// Avisos (webhooks) de Stripe para el plan Pro de las tiendas. Stripe la llama en cada pago, renovación,
// impago o cancelación; aquí se mantiene tiendas.plan / pro_hasta y la tabla tienda_suscripciones.
//
// Cada tienda paga con un enlace de pago de Stripe con su id en client_reference_id (ver
// src/lib/planPro.js). Solo se aceptan avisos firmados por Stripe (cabecera Stripe-Signature).
//
// Secreto: STRIPE_WEBHOOK_SECRET (whsec_…, de Stripe → Desarrolladores → Webhooks → este endpoint).
// Se despliega sin verificación JWT (supabase/config.toml): la protege la firma de Stripe.
// Eventos que hay que activar en Stripe: checkout.session.completed, invoice.paid, invoice.payment_failed,
// customer.subscription.updated y customer.subscription.deleted.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MARGEN_DIAS = 2;   // el cobro de la renovación puede llegar unas horas tarde
const TOLERANCIA = 300;  // segundos de antigüedad máxima del aviso

async function firmaValida(cuerpo: string, cabecera: string | null, secreto: string) {
  if (!cabecera) return false;
  const partes = Object.fromEntries(cabecera.split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k, v])) as Record<string, string>;
  const firmas = cabecera.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  const t = Number(partes.t);
  if (!t || !firmas.length || Math.abs(Date.now() / 1000 - t) > TOLERANCIA) return false;
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(`${t}.${cuerpo}`));
  const esperada = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return firmas.some((f) => f.length === esperada.length && [...f].every((c, i) => c === esperada[i]));
}

const fecha = (segundos: number) => new Date((segundos + MARGEN_DIAS * 86400) * 1000);
const soloDia = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('', { status: 405 });
  const secreto = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const cuerpo = await req.text();
  if (!secreto || !(await firmaValida(cuerpo, req.headers.get('stripe-signature'), secreto))) {
    return new Response('firma no válida', { status: 400 });
  }
  const evento = JSON.parse(cuerpo);
  const o = evento.data?.object || {};
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Activa o alarga el Pro de una tienda hasta `hasta`
  const activar = async (tiendaId: number, hasta: Date) => {
    const { error } = await sb.from('tiendas').update({ plan: 'pro', pro_hasta: soloDia(hasta), verificada: true }).eq('id', tiendaId);
    if (error) throw error;
  };
  const suscripcionDe = (factura: any) => factura.subscription || factura.parent?.subscription_details?.subscription || null;

  try {
    switch (evento.type) {
      // Primer pago desde el enlace de pago: aquí llega el id de la tienda
      case 'checkout.session.completed': {
        const tiendaId = Number(o.client_reference_id);
        if (!tiendaId || o.mode !== 'subscription') break;
        const anual = (o.amount_total ?? 0) >= 10000; // 190 € al año frente a 19 € al mes (en céntimos)
        const ahora = Math.floor(Date.now() / 1000);
        const hasta = fecha(ahora + (anual ? 366 : 31) * 86400); // provisional: invoice.paid pone la fecha exacta
        await sb.from('tienda_suscripciones').upsert({
          tienda_id: tiendaId, stripe_cliente: o.customer, stripe_suscripcion: o.subscription,
          periodo: anual ? 'año' : 'mes', estado: 'activa', hasta: hasta.toISOString(), actualizado_en: new Date().toISOString(),
        });
        await activar(tiendaId, hasta);
        break;
      }
      // Cada cobro (también el primero): fin exacto del periodo pagado
      case 'invoice.paid': {
        const sub = suscripcionDe(o);
        const fin = Math.max(0, ...(o.lines?.data || []).map((l: any) => l.period?.end || 0));
        if (!sub || !fin) break;
        const { data: fila } = await sb.from('tienda_suscripciones').select('tienda_id').eq('stripe_suscripcion', sub).maybeSingle();
        if (!fila) break; // el primer invoice.paid puede llegar antes que checkout.session.completed
        const hasta = fecha(fin);
        await sb.from('tienda_suscripciones').update({ estado: 'activa', hasta: hasta.toISOString(), actualizado_en: new Date().toISOString() }).eq('stripe_suscripcion', sub);
        await activar(fila.tienda_id, hasta);
        break;
      }
      // Impago: se avisa en su panel; el Pro sigue hasta el final de lo pagado
      case 'invoice.payment_failed': {
        const sub = suscripcionDe(o);
        if (sub) await sb.from('tienda_suscripciones').update({ estado: 'impagada', actualizado_en: new Date().toISOString() }).eq('stripe_suscripcion', sub);
        break;
      }
      // Cancelación programada (al final del periodo) o reactivación
      case 'customer.subscription.updated':
        await sb.from('tienda_suscripciones').update({ estado: o.cancel_at_period_end ? 'cancelada' : (o.status === 'past_due' ? 'impagada' : 'activa'), actualizado_en: new Date().toISOString() }).eq('stripe_suscripcion', o.id);
        break;
      case 'customer.subscription.deleted':
        await sb.from('tienda_suscripciones').update({ estado: 'cancelada', actualizado_en: new Date().toISOString() }).eq('stripe_suscripcion', o.id);
        break;
    }
  } catch (e) {
    console.error(evento.type, (e as Error).message);
    return new Response('error', { status: 500 }); // Stripe reintentará
  }
  return new Response(JSON.stringify({ recibido: evento.type }), { headers: { 'Content-Type': 'application/json' } });
});
