import { catalogoEspecies, slugEspecie } from '../../src/lib/catalogoEspecies.js';
const c = catalogoEspecies();
const bin = (s) => (s || '').toLowerCase().replace(/["“][^"”]*["”]/g, '').split(/\s+/).slice(0, 2).join(' ');
const m = new Map();
for (const e of c) {
  const claves = new Set([bin(e.cientifico || e.comun)].filter((k) => /^[a-z]+ [a-z]+$/.test(k)));
  for (const k of claves) m.set(k, [...(m.get(k) || []), `${e.comun} | ${e.cientifico} | ${e.acuarios.length ? 'wiki' : 'ampl'} | ${e.rutaGrupo || e.archivo || ''}`]);
}
console.log('total', c.length);
for (const [k, v] of m) if (v.length > 1) console.log(k, '=>', v.join('  ||  '));
