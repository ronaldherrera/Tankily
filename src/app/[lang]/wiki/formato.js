// Los títulos de WikiTank vienen en mayúsculas: se muestran con mayúscula inicial.
const SIGLAS = /\b(co2|co₂|led|ph|kh|gh|tds|diy|koi|fowlr|crs|cbs)\b/gi;

export function tituloWiki(texto = '') {
  const t = texto.replace(/\s+/g, ' ').trim().toLowerCase();
  return (t.charAt(0).toUpperCase() + t.slice(1)).replace(SIGLAS, (s) => (s.toLowerCase() === 'koi' ? 'koi' : s.toUpperCase()));
}

// Color de agua por grupo de especies (mismo lenguaje que los tipos de tanque)
export function aguaGrupo(titulo = '', ruta = []) {
  const t = titulo.toUpperCase();
  if (ruta.includes('estanques-koi')) return '#ffc65c';
  if (t.includes('ALGA')) return '#a8d672';
  if (t.includes('PLANTA') || t.includes('FLORA')) return '#7cdc8c';
  if (t.includes('INVERTEBRADO') || t.includes('GAMBA') || t.includes('CARACOL')) return '#ff9a7a';
  if (t.includes('CORAL') || t.includes('ANÉMONA')) return '#ff86b4';
  if (t.includes('PEC') || t.includes('GOLDFISH') || t.includes('KOI')) return '#3fa9ff';
  return '#9fe7f5';
}
