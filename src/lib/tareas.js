// Tareas de mantenimiento: estado (cuándo toca) y registro al marcarlas como hechas.
// El cambio de agua es una tarea "virtual": su frecuencia vive en tanques.cambio_agua_cada_dias
// y su última vez es el último evento cambio_agua del diario.
// Una fecha programada (tareas.proxima, tanques.cambio_agua_proximo) manda sobre "última vez + cada N
// días" hasta que se marca como hecha (lo mismo que public.toca_tarea en la base de datos).
import { supabase } from './supabase';

// Tipos con su frecuencia sugerida (días) y el evento del diario que generan al hacerse
export const TIPOS_TAREA = {
  test: { dias: 7, evento: null },
  filtro: { dias: 30, evento: 'filtro' },
  limpieza: { dias: 14, evento: 'limpieza' },
  abono: { dias: 7, evento: 'dosificacion' },
  dosificacion: { dias: 1, evento: 'dosificacion' },
  poda: { dias: 14, evento: 'poda' },
  alimento: { dias: 60, evento: null },
  otro: { dias: 7, evento: 'otro' },
};

const DIA = 86400000;
const inicioDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

// Días que faltan para que toque (0 = hoy, negativo = atrasada). Sin última vez: toca hoy.
export function diasParaTocar(ultimaVez, cadaDias, ahora = Date.now()) {
  if (!ultimaVez) return 0;
  return Math.round((inicioDia(ultimaVez) + cadaDias * DIA - inicioDia(ahora)) / DIA);
}

// "AAAA-MM-DD" (columna date) → fecha local a las 00:00, y al revés
export const deFechaISO = (f) => { const [a, m, d] = f.split('-').map(Number); return new Date(a, m - 1, d); };
export const aFechaISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const diasHasta = (fecha, ahora = Date.now()) => Math.round((deFechaISO(fecha).getTime() - inicioDia(ahora)) / DIA);

// Fechas (AAAA-MM-DD) en que toca una tarea entre dos días: la próxima y las siguientes cada N días.
// Si está atrasada, la primera es hoy.
export function fechasDeTarea(tarea, desde, hasta) {
  const hoy = inicioDia(Date.now());
  let d = Math.max(hoy + tarea.dias * DIA, hoy);
  const fin = inicioDia(hasta);
  const lista = [];
  while (d <= fin && lista.length < 400) {
    if (d >= inicioDia(desde)) lista.push(aFechaISO(new Date(d)));
    d = inicioDia(d + tarea.cada_dias * DIA + DIA / 2); // + medio día: los cambios de hora no la mueven
  }
  return lista;
}

// Lista de tareas de un tanque (incluido el cambio de agua), ordenada por urgencia
export function tareasDelTanque(tanque, tareas = [], ultimoCambioAgua = null) {
  const lista = tareas.filter((t) => t.tanque_id === tanque.id)
    .map((t) => ({ ...t, dias: t.proxima ? diasHasta(t.proxima) : diasParaTocar(t.ultima_vez, t.cada_dias) }));
  if (tanque.cambio_agua_cada_dias) {
    const proxima = tanque.cambio_agua_proximo || null;
    lista.push({
      id: `agua-${tanque.id}`, virtual: true, tanque_id: tanque.id, tipo: 'cambio_agua',
      cada_dias: tanque.cambio_agua_cada_dias, ultima_vez: ultimoCambioAgua, proxima, desde: tanque.creado_en,
      // Sin cambios anotados, el plazo cuenta desde que el tanque se registró
      dias: proxima ? diasHasta(proxima) : diasParaTocar(ultimoCambioAgua || tanque.creado_en, tanque.cambio_agua_cada_dias),
    });
  }
  return lista.sort((a, b) => a.dias - b.dias);
}

// Marca una tarea como hecha: actualiza la tarea y apunta el evento en el diario.
// Devuelve { tarea, evento } con las filas nuevas (evento puede ser null).
export async function marcarHecha(tarea) {
  const ahora = new Date().toISOString();
  const tipoEvento = tarea.tipo === 'cambio_agua' ? 'cambio_agua' : TIPOS_TAREA[tarea.tipo]?.evento;
  let evento = null;
  if (tipoEvento) {
    const { data, error } = await supabase.from('tanque_eventos')
      .insert({ tanque_id: tarea.tanque_id, tipo: tipoEvento, nota: tarea.tipo === 'otro' ? tarea.nombre : null, fecha: ahora })
      .select().single();
    if (error) throw error;
    evento = data;
  }
  // Hecha: la fecha programada ya se ha cumplido y la tarea vuelve a su ritmo desde hoy
  if (tarea.virtual) {
    if (tarea.proxima) await supabase.from('tanques').update({ cambio_agua_proximo: null }).eq('id', tarea.tanque_id);
    return { tarea: { ...tarea, ultima_vez: ahora, proxima: null, dias: tarea.cada_dias }, evento };
  }
  const { data, error } = await supabase.from('tareas').update({ ultima_vez: ahora, proxima: null }).eq('id', tarea.id).select().single();
  if (error) throw error;
  return { tarea: { ...data, dias: diasParaTocar(data.ultima_vez, data.cada_dias) }, evento };
}

// Cambiar la frecuencia o programar la próxima vez (fecha AAAA-MM-DD o null para volver al ritmo normal).
// Devuelve la tarea con sus días recalculados.
export async function programarTarea(tarea, { cadaDias, proxima }) {
  if (tarea.virtual) {
    const { error } = await supabase.from('tanques').update({ cambio_agua_cada_dias: cadaDias, cambio_agua_proximo: proxima }).eq('id', tarea.tanque_id);
    if (error) throw error;
    const t = { ...tarea, cada_dias: cadaDias, proxima };
    return { ...t, dias: proxima ? diasHasta(proxima) : diasParaTocar(tarea.ultima_vez || tarea.desde, cadaDias) };
  }
  const { data, error } = await supabase.from('tareas').update({ cada_dias: cadaDias, proxima }).eq('id', tarea.id).select().single();
  if (error) throw error;
  return { ...data, dias: data.proxima ? diasHasta(data.proxima) : diasParaTocar(data.ultima_vez, data.cada_dias) };
}

// Recordatorios con los que nace un tanque nuevo, según su tipo, para que el panel "Hoy"
// sea útil desde el primer día. El usuario puede cambiarlos o borrarlos.
const PLANTADOS = ['plantado', 'paludario', 'biotopo'];
export function tareasIniciales(tipo) {
  if (tipo === 'estanque') return [{ tipo: 'test', cada_dias: 14 }, { tipo: 'filtro', cada_dias: 30 }];
  return [
    { tipo: 'test', cada_dias: 7 },
    { tipo: 'filtro', cada_dias: 30 },
    { tipo: 'limpieza', cada_dias: ['reef', 'nano_marino'].includes(tipo) ? 7 : 14 },
    ...(PLANTADOS.includes(tipo) ? [{ tipo: 'abono', cada_dias: 7 }] : []),
  ];
}

// Frecuencia de cambio de agua sugerida si al crear el tanque no se indica
export const cambioAguaSugerido = (tipo) => ({ discos: 3, estanque: 30, paludario: 14 }[tipo] || 7);
