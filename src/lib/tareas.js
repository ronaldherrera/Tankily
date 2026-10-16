// Tareas de mantenimiento: estado (cuándo toca) y registro al marcarlas como hechas.
// El cambio de agua es una tarea "virtual": su frecuencia vive en tanques.cambio_agua_cada_dias
// y su última vez es el último evento cambio_agua del diario.
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

// Lista de tareas de un tanque (incluido el cambio de agua), ordenada por urgencia
export function tareasDelTanque(tanque, tareas = [], ultimoCambioAgua = null) {
  const lista = tareas.filter((t) => t.tanque_id === tanque.id).map((t) => ({ ...t, dias: diasParaTocar(t.ultima_vez, t.cada_dias) }));
  if (tanque.cambio_agua_cada_dias) {
    lista.push({
      id: `agua-${tanque.id}`, virtual: true, tanque_id: tanque.id, tipo: 'cambio_agua',
      cada_dias: tanque.cambio_agua_cada_dias, ultima_vez: ultimoCambioAgua,
      // Sin cambios anotados, el plazo cuenta desde que el tanque se registró
      dias: diasParaTocar(ultimoCambioAgua || tanque.creado_en, tanque.cambio_agua_cada_dias),
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
  if (tarea.virtual) return { tarea: { ...tarea, ultima_vez: ahora, dias: tarea.cada_dias }, evento };
  const { data, error } = await supabase.from('tareas').update({ ultima_vez: ahora }).eq('id', tarea.id).select().single();
  if (error) throw error;
  return { tarea: { ...data, dias: diasParaTocar(data.ultima_vez, data.cada_dias) }, evento };
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
