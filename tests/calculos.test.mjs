import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  volumenRectangular, volumenCilindrico, pesoAgua, cambioAgua, porcentajeParaNitrato,
  co2DesdeKhPh, zonaCo2, convertirDureza, pptDesdeDensidad, densidadDesdePpt, salNecesaria,
} from '@/lib/calculos';

const cerca = (a, b, margen = 0.01) => assert.ok(Math.abs(a - b) <= margen, `${a} no está cerca de ${b}`);

test('volumen rectangular descuenta sustrato y margen', () => {
  const { bruto, neto } = volumenRectangular({ largo: 100, ancho: 40, alto: 50, sustrato: 5, margen: 3 });
  assert.equal(bruto, 200);
  assert.equal(neto, 168);
});

test('volumen nunca es negativo aunque el sustrato supere la altura', () => {
  assert.equal(volumenRectangular({ largo: 60, ancho: 30, alto: 10, sustrato: 15 }).neto, 0);
});

test('volumen cilíndrico', () => {
  cerca(volumenCilindrico({ diametro: 40, alto: 50 }).bruto, 62.83);
});

test('el agua salada pesa un 2,5 % más', () => {
  assert.equal(pesoAgua(100), 100);
  cerca(pesoAgua(100, true), 102.5);
});

test('cambio de agua: litros y nitratos tras la dilución', () => {
  const r = cambioAgua({ litros: 200, porcentaje: 25, nitrato: 40, nitratoAgua: 8 });
  assert.equal(r.cambiar, 50);
  assert.equal(r.nitratoTras, 32);
  assert.equal(cambioAgua({ litros: 100, porcentaje: 10 }).nitratoTras, null);
});

test('porcentaje para llegar a un nitrato objetivo', () => {
  cerca(porcentajeParaNitrato({ actual: 40, objetivo: 20 }), 50);
  assert.equal(porcentajeParaNitrato({ actual: 10, objetivo: 20 }), 0);
  assert.equal(porcentajeParaNitrato({ actual: 40, objetivo: 10, nitratoAgua: 10 }), null);
});

test('CO₂ por KH y pH', () => {
  cerca(co2DesdeKhPh(4, 6.8), 19.02);
  assert.equal(zonaCo2(10), 'bajo');
  assert.equal(zonaCo2(20), 'optimo');
  assert.equal(zonaCo2(40), 'alto');
});

test('dureza: 1 °dH = 17,848 ppm', () => {
  const r = convertirDureza(10, 'dh');
  cerca(r.ppm, 178.48);
  cerca(convertirDureza(r.ppm, 'ppm').dh, 10);
});

test('salinidad: densidad y ppt son inversas', () => {
  cerca(pptDesdeDensidad(1.025), 33.24);
  cerca(densidadDesdePpt(pptDesdeDensidad(1.026)), 1.026, 1e-9);
  cerca(salNecesaria(100, 35) / 1000, 3.59);
});

test('distancias: provincias, alias y orden por cercanía', async () => {
  const { centroProvincia, distanciaKm, ordenarPorDistancia } = await import('@/lib/geo');
  const madrid = centroProvincia('ES', 'Madrid');
  const valencia = centroProvincia('ES', 'València');
  cerca(distanciaKm(madrid, valencia), 302, 10);
  assert.deepEqual(centroProvincia('ES', 'Vizcaya'), centroProvincia('ES', 'Bizkaia'));
  assert.equal(centroProvincia('MX', 'Jalisco'), null);
  const lista = [{ id: 'bcn', pais: 'ES', provincia: 'Barcelona' }, { id: 'mx', pais: 'MX', provincia: 'Jalisco' }, { id: 'tol', pais: 'ES', provincia: 'Toledo' }, { id: 'tienda', lat: 40.42, lng: -3.70 }];
  const orden = ordenarPorDistancia(lista, madrid).map((x) => x.id);
  assert.deepEqual(orden, ['tienda', 'tol', 'bcn', 'mx']);
});
