// Plan Pro de pago con Stripe (enlaces de pago, sin servidor propio). Al pagar, Stripe avisa a la Edge
// Function `stripe`, que activa el Pro de la tienda (su id va en client_reference_id) y lo renueva en cada cobro.
// Los enlaces se crean en Stripe → Enlaces de pago; el del portal, en Stripe → Configuración → Portal de clientes.
// Mientras estén vacíos, el Pro se sigue pidiendo por email (como antes).
export const PAGO_MENSUAL = 'https://buy.stripe.com/00w9ATaElg949nCbBhfAc00';  // 19 € al mes
export const PAGO_ANUAL = 'https://buy.stripe.com/3cI00jcMt7CyeHWdJpfAc01';    // 190 € al año
export const PORTAL = 'https://billing.stripe.com/p/login/00w9ATaElg949nCbBhfAc00';
export const PAGO_ACTIVO = Boolean(PAGO_MENSUAL && PAGO_ANUAL);

// Idiomas de la página de pago de Stripe
const LOCALES_STRIPE = ['es', 'en', 'de', 'pt', 'fr', 'it', 'nl', 'pl'];

export function enlacePago(base, tienda, email, lang) {
  const p = new URLSearchParams({ client_reference_id: String(tienda.id) });
  if (email) p.set('prefilled_email', email);
  if (LOCALES_STRIPE.includes(lang)) p.set('locale', lang);
  return `${base}?${p}`;
}

export const enlacePortal = (email) => (PORTAL ? `${PORTAL}${email ? `?prefilled_email=${encodeURIComponent(email)}` : ''}` : '');
