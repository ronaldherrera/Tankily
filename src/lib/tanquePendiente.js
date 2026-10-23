// "Tanque pendiente": lo que un visitante sin cuenta deja preparado (las especies del compatibilizador o la de una
// ficha de WikiTank) para que, al registrarse, su primer tanque nazca ya con ellas. Se guarda solo en este navegador.
// { tipo, litros, habitantes: [{ nombre, nombre_cientifico, wiki_ruta, categoria, cantidad }], fecha }
const CLAVE = 'tk-tanque-pendiente';
const CADUCA = 30 * 864e5;

export function guardarPendiente({ tipo, litros = null, habitantes }) {
  try { localStorage.setItem(CLAVE, JSON.stringify({ tipo, litros, habitantes, fecha: Date.now() })); } catch { /* sin almacenamiento */ }
}

export function leerPendiente() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE));
    if (!p?.habitantes?.length || Date.now() - p.fecha > CADUCA) return null;
    return p;
  } catch { return null; }
}

export function borrarPendiente() {
  try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
}

// "6 × Neón, 1 × Betta"
export const resumenPendiente = (p) => p.habitantes.map((h) => `${h.cantidad} × ${h.nombre}`).join(', ');

// Tipo de tanque que mejor encaja con una especie de WikiTank (para la ficha de una sola especie)
export function tipoParaEspecie(especie) {
  if (especie?.ficha?.agua !== 'marina') return 'comunidad';
  return especie.categoria === 'coral' || especie.ficha.reef === 'si' ? 'reef' : 'marino_peces';
}
