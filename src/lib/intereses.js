// Temas de Explorar: cada uno agrupa tipos de tanque (lib/constantes.js → TIPOS_TANQUE). Una publicación entra en un
// tema si va ligada a un tanque de esos tipos; las que no tienen tanque solo salen con "Todo".
export const INTERESES = {
  marino: ['reef', 'marino_peces', 'nano_marino'],
  dulce: ['comunidad', 'plantado', 'gambas', 'ciclidos', 'discos', 'biotopo', 'paludario'],
  plantado: ['plantado'],
  gambas: ['gambas'],
  ciclidos: ['ciclidos', 'discos'],
  fria: ['agua_fria', 'estanque'],
};

const CLAVE = 'tk-intereses';

// Elección guardada en este navegador: null si nunca eligió (entonces se deduce de sus tanques)
export function leerIntereses() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(v) ? v.filter((x) => INTERESES[x]) : null;
  } catch { return null; }
}

export function guardarIntereses(lista) {
  try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* sin almacenamiento */ }
}

// Temas que se deducen de los tanques de alguien: un reef → marino; plantado y gambas → los dos.
// "Agua dulce" solo si tiene algún tanque dulce que no encaje en un tema más concreto (comunitario, biotopo…)
const CONCRETOS = ['marino', 'plantado', 'gambas', 'ciclidos', 'fria'];
export function interesesDeTanques(tipos) {
  const elegidos = CONCRETOS.filter((k) => INTERESES[k].some((t) => tipos.includes(t)));
  const cubiertos = new Set(CONCRETOS.flatMap((k) => INTERESES[k]));
  if (tipos.some((t) => INTERESES.dulce.includes(t) && !cubiertos.has(t))) elegidos.push('dulce');
  return elegidos;
}

// Tipos de tanque de una lista de temas (vacía = todo)
export const tiposDe = (intereses) => [...new Set(intereses.flatMap((k) => INTERESES[k] || []))];
