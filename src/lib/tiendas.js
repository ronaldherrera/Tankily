// Una tienda es Pro si tiene el plan y no ha caducado (pro_hasta es la fecha de fin, incluida).
// Úsalo siempre en lugar de mirar solo `plan`, que sigue en 'pro' hasta que alguien lo cambie.
export const esPro = (tienda, hoy = new Date().toISOString().slice(0, 10)) =>
  tienda?.plan === 'pro' && (!tienda.pro_hasta || tienda.pro_hasta >= hoy);
