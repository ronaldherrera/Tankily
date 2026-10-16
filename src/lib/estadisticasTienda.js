// Visitas de tiendas: vistas de la ficha y clics en contacto o web, contadas por día.
// Las ven las tiendas Pro en su panel (tabla tienda_visitas, función registrar_visita_tienda).
import { supabase } from './supabase';

// Una vista por tienda y sesión del navegador, para no inflar el contador al recargar
export function registrarVista(tiendaId) {
  const clave = `tk-visto-tienda-${tiendaId}`;
  try { if (sessionStorage.getItem(clave)) return; sessionStorage.setItem(clave, '1'); } catch {}
  supabase.rpc('registrar_visita_tienda', { p_tienda: tiendaId, p_tipo: 'vista' }).then(() => {});
}

export function registrarClic(tiendaId, tipo) {
  supabase.rpc('registrar_visita_tienda', { p_tienda: tiendaId, p_tipo: tipo }).then(() => {});
}
