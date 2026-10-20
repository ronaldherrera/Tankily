// Direcciones legibles de tanques, hilos y anuncios: "Arrecife del salón" + 12 → "arrecife-del-salon-12".
// El id al final hace la dirección única y estable aunque cambie el título. Sirve en el servidor y en la web.
const sinAcentos = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const base = (texto) => sinAcentos(texto).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '');

export const slugCon = (texto, id) => `${base(texto) || 'tankily'}-${id}`;
export const idDeSlug = (slug) => { const m = /-(\d+)$/.exec(slug || ''); return m ? Number(m[1]) : null; };
