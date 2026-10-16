import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diasParaTocar, tareasDelTanque, tareasIniciales, cambioAguaSugerido } from '@/lib/tareas';

const DIA = 86400000;
const hoy = new Date(2026, 9, 14, 12).getTime();

test('días para que toque una tarea', () => {
  assert.equal(diasParaTocar(null, 7, hoy), 0);
  assert.equal(diasParaTocar(hoy - 3 * DIA, 7, hoy), 4);
  assert.equal(diasParaTocar(hoy - 10 * DIA, 7, hoy), -3);
  // Cuenta por días de calendario, no por horas
  assert.equal(diasParaTocar(new Date(2026, 9, 13, 23).getTime(), 1, new Date(2026, 9, 14, 1).getTime()), 0);
});

test('el cambio de agua se añade como tarea y la lista va por urgencia', () => {
  const tanque = { id: 1, cambio_agua_cada_dias: 7, creado_en: new Date(Date.now() - 30 * DIA).toISOString() };
  const tareas = [
    { id: 10, tanque_id: 1, tipo: 'filtro', cada_dias: 30, ultima_vez: new Date().toISOString() },
    { id: 11, tanque_id: 2, tipo: 'test', cada_dias: 7, ultima_vez: null },
  ];
  const lista = tareasDelTanque(tanque, tareas, null);
  assert.deepEqual(lista.map((t) => t.tipo), ['cambio_agua', 'filtro']);
  assert.ok(lista[0].virtual);
  assert.ok(lista[0].dias < 0);
});

test('recordatorios iniciales según el tipo de tanque', () => {
  assert.ok(tareasIniciales('plantado').some((t) => t.tipo === 'abono'));
  assert.equal(tareasIniciales('reef').find((t) => t.tipo === 'limpieza').cada_dias, 7);
  assert.equal(tareasIniciales('estanque').length, 2);
  assert.equal(cambioAguaSugerido('discos'), 3);
  assert.equal(cambioAguaSugerido('comunidad'), 7);
});

test('una tienda es Pro solo mientras no caduca', async () => {
  const { esPro } = await import('@/lib/tiendas');
  assert.equal(esPro({ plan: 'pro', pro_hasta: null }), true);
  assert.equal(esPro({ plan: 'pro', pro_hasta: '2026-10-15' }, '2026-10-15'), true, 'el último día cuenta');
  assert.equal(esPro({ plan: 'pro', pro_hasta: '2026-10-14' }, '2026-10-15'), false);
  assert.equal(esPro({ plan: 'gratis', pro_hasta: '2030-01-01' }), false);
  assert.equal(esPro(null), false);
});

test('el error del freno antispam se traduce; los demás se muestran tal cual', async () => {
  const { mensajeError } = await import('@/lib/errores');
  const t = (k) => `«${k}»`;
  assert.equal(mensajeError({ message: 'LIMITE_FRECUENCIA' }, t), '«errorLimite»');
  assert.equal(mensajeError({ message: 'duplicate key' }, t), 'duplicate key');
  assert.equal(mensajeError(new Error('Failed to fetch'), t), 'Failed to fetch');
});

test('las ubicaciones no repiten ciudad y provincia', async () => {
  const { unirLugar } = await import('@/lib/paises');
  assert.equal(unirLugar(['Madrid', 'Madrid', 'España']), 'Madrid, España');
  assert.equal(unirLugar(['Santander', 'Cantabria', 'España']), 'Santander, Cantabria, España');
  assert.equal(unirLugar(['', null, 'México', 'méxico ']), 'México');
});

test('el país probable sale de la zona horaria antes que del idioma', async () => {
  // Node 20 (el del despliegue) no tiene navigator
  if (typeof navigator === 'undefined') globalThis.navigator = { language: 'es' };
  const { paisProbable } = await import('@/lib/paises');
  const original = Intl.DateTimeFormat;
  const conZona = (zona) => { Intl.DateTimeFormat = () => ({ resolvedOptions: () => ({ timeZone: zona }) }); };
  try {
    conZona('America/Mexico_City'); assert.equal(paisProbable(), 'MX');
    conZona('America/Argentina/Buenos_Aires'); assert.equal(paisProbable(), 'AR');
    conZona('Europe/Madrid'); assert.equal(paisProbable(), 'ES');
    conZona('America/Chicago'); assert.equal(paisProbable(), 'US');
  } finally { Intl.DateTimeFormat = original; }
});
