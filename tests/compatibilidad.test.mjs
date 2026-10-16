import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizarCompatibilidad, especieDe, ultimasMediciones } from '@/lib/compatibilidad';
import { especiesWiki } from '@/lib/especiesWiki';

// Habitante a partir del nombre científico tal como está en el índice de WikiTank
function hab(nombre, cantidad = 1) {
  const e = especiesWiki.find((x) => x.nombre === nombre);
  assert.ok(e?.ficha, `falta la ficha de ${nombre}`);
  return { nombre: e.comun || e.nombre, nombre_cientifico: e.nombre, wiki_ruta: e.ruta, categoria: e.categoria, cantidad };
}
const tipos = (r) => r.avisos.map((a) => a.tipo);

test('encuentra la especie por nombre común o científico', () => {
  assert.equal(especieDe({ nombre: 'Betta' })?.nombre, 'Betta splendens');
  assert.equal(especieDe({ nombre: 'x', nombre_cientifico: 'paracheirodon innesi' })?.nombre, 'Paracheirodon innesi');
  assert.equal(especieDe({ nombre: 'Especie inventada' }), null);
});

test('goldfish y betta no comparten temperatura', () => {
  const r = analizarCompatibilidad({ tanque: { tipo: 'comunidad', litros: 300 }, habitantes: [hab('Carassius auratus', 2), hab('Betta splendens')] });
  const rango = r.avisos.find((a) => a.tipo === 'rango' && a.parametro === 'temperatura');
  assert.equal(rango?.nivel, 'conflicto');
  assert.equal(r.rangos.temperatura, null);
});

test('una comunidad tranquila no da avisos', () => {
  const r = analizarCompatibilidad({ tanque: { tipo: 'comunidad', litros: 120 }, habitantes: [hab('Paracheirodon innesi', 10), hab('Corydoras paleatus', 6)] });
  assert.deepEqual(r.avisos, []);
  assert.ok(r.rangos.temperatura);
});

test('peces de agua dulce en un tanque marino', () => {
  const r = analizarCompatibilidad({ tanque: { tipo: 'reef', litros: 300 }, habitantes: [hab('Betta splendens'), hab('Amphiprion ocellaris', 2)] });
  const agua = r.avisos.find((a) => a.tipo === 'agua');
  assert.deepEqual(agua?.especies, ['Betta']);
});

test('invertebrados marinos no se marcan como de agua dulce en un reef', () => {
  // Regresión: su salinidad estaba en otro campo de la ficha y el índice los daba por dulces
  for (const nombre of ['Lysmata amboinensis', 'Astraea tecta', 'Alpheus sp']) {
    const r = analizarCompatibilidad({ tanque: { tipo: 'reef', litros: 300 }, habitantes: [hab(nombre), hab('Amphiprion ocellaris', 2)] });
    assert.ok(!tipos(r).includes('agua'), `${nombre} sale como agua equivocada`);
  }
});

test('litros mínimos, por ejemplar cuando la ficha lo indica', () => {
  const r = analizarCompatibilidad({ tanque: { tipo: 'comunidad', litros: 150 }, habitantes: [hab('Carassius auratus', 2)] });
  const litros = r.avisos.find((a) => a.tipo === 'litros');
  assert.equal(litros?.necesita, 240);
});

test('especies de grupo con pocos ejemplares', () => {
  const r = analizarCompatibilidad({ tanque: { tipo: 'comunidad', litros: 100 }, habitantes: [hab('Paracheirodon innesi', 2)] });
  const grupo = r.avisos.find((a) => a.tipo === 'grupo');
  assert.equal(grupo?.minimo, 6);
});

test('mediciones fuera del rango de alguna especie', () => {
  const r = analizarCompatibilidad({
    tanque: { tipo: 'comunidad', litros: 100 },
    habitantes: [hab('Paracheirodon innesi', 8)],
    ultimas: ultimasMediciones([{ parametro: 'temperatura', valor: '31' }, { parametro: 'temperatura', valor: '24' }]),
  });
  const m = r.avisos.find((a) => a.tipo === 'medicion');
  assert.equal(m?.valor, 31);
});

test('los conflictos van antes que los avisos', () => {
  const r = analizarCompatibilidad({ tanque: { tipo: 'comunidad', litros: 50 }, habitantes: [hab('Carassius auratus', 2), hab('Paracheirodon innesi', 2)] });
  const niveles = r.avisos.map((a) => a.nivel);
  assert.deepEqual(niveles, [...niveles].sort((a, b) => (a === b ? 0 : a === 'conflicto' ? -1 : 1)));
});

test('qué especies encajan: litros, agua, temperatura y grupo', async () => {
  const { especiesQueEncajan } = await import('@/lib/compatibilidad');
  const nombres = (l) => l.map((x) => x.especie.nombre);
  const nano = especiesQueEncajan({ agua: 'dulce', litros: 30 });
  assert.ok(!nombres(nano).includes('Carassius auratus'), 'un goldfish no cabe en 30 l');
  assert.ok(nano.every((x) => !x.litrosMin || x.litrosMin <= 30));
  assert.ok(nano.every((x) => x.especie.ficha.agua === 'dulce'));
  const frio = especiesQueEncajan({ agua: 'dulce', litros: 500, temp: 15 });
  assert.ok(nombres(frio).some((n) => /Carassius|Goldfish/i.test(n)));
  assert.ok(!nombres(frio).includes('Paracheirodon axelrodi'), 'el cardenal no aguanta 15 °C');
  const reef = especiesQueEncajan({ agua: 'marina', litros: 300, categoria: 'coral' });
  assert.ok(reef.length > 0 && reef.every((x) => x.especie.categoria === 'coral'));
  const faciles = especiesQueEncajan({ agua: 'dulce', litros: 200, difMax: 1 });
  assert.ok(faciles.every((x) => !x.especie.ficha.dif || x.especie.ficha.dif <= 1));
});

test('palabras clave para buscar hilos parecidos', async () => {
  const { palabrasClave } = await import('@/lib/palabrasClave');
  assert.deepEqual(palabrasClave('¿Cuántos neones necesito para mi acuario?'), ['neones']);
  assert.deepEqual(palabrasClave('Mis gambas CRS pierden color'), ['gambas', 'pierden', 'color']);
  assert.deepEqual(palabrasClave('ok'), []);
});

test('35 ppt (la salinidad habitual de un reef) no da aviso; 38 o 27 sí', async () => {
  const { analizarCompatibilidad } = await import('@/lib/compatibilidad');
  const tanque = { tipo: 'reef', litros: 300 };
  const habitantes = [hab('Amphiprion ocellaris', 2)];
  const aviso = (v) => analizarCompatibilidad({ tanque, habitantes, ultimas: { salinidad: v } }).avisos.some((a) => a.tipo === 'medicion');
  assert.equal(aviso(35.1), false);
  assert.equal(aviso(38), true);
  assert.equal(aviso(27), true);
});

test('catálogo de especies: una entrada por especie, con dónde es habitual', async () => {
  const { catalogoEspecies, especiePorSlug } = await import('@/lib/catalogoEspecies');
  const c = catalogoEspecies();
  assert.ok(c.length > 150, `solo ${c.length} especies`);
  assert.equal(new Set(c.map((e) => e.slug)).size, c.length, 'slugs repetidos');
  const cardenal = especiePorSlug('paracheirodon-axelrodi');
  assert.ok(cardenal.acuarios.length >= 2, 'el cardenal sale en varios tipos de acuario');
  assert.ok(cardenal.ficha?.t, 'con su temperatura');
  assert.ok(!c.some((e) => /ESTRUCTURA DE FICHA|NOMBRE COMÚN/i.test(e.titulo)), 'sin plantillas');
  assert.ok(c.every((e) => !e.titulo.includes('\n')));
});
