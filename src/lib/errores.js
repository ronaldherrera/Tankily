// Texto para mostrar un error de Supabase al usuario. Los errores con código propio de la base de
// datos (p. ej. el freno antispam LIMITE_FRECUENCIA) se traducen; el resto se muestra tal cual.
export function mensajeError(error, t) {
  const mensaje = error?.message || String(error || '');
  if (mensaje.includes('LIMITE_FRECUENCIA')) return t('errorLimite');
  return mensaje;
}
