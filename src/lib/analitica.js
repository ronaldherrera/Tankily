// Analítica de tráfico con Umami Cloud: sin cookies ni datos personales, así que no necesita banner.
// Mide visitas, de dónde llega la gente, países y dispositivos, y unos pocos eventos clave para saber
// qué canales traen gente que se registra y crea su tanque. El enganche (activos, embudo, retención)
// se mide con datos propios en Administración → Crecimiento.
// El ID de la web (cloud.umami.is → Settings → Websites) no es secreto. Vacío = sin analítica.
export const UMAMI_ID = 'a691d5e4-0df3-46f7-89c3-4f0802a1987a';
export const UMAMI_SCRIPT = 'https://cloud.umami.is/script.js';

// evento('tanque_creado') · evento('acceso_social', { proveedor: 'google' })
export function evento(nombre, datos) {
  try { window.umami?.track(nombre, datos); } catch { /* la analítica nunca rompe nada */ }
}
