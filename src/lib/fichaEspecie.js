// Lectura de las fichas técnicas de WikiTank ("**Campo**: valor") a datos que la web puede usar
// (temperatura, pH, GH, salinidad, tamaño, litros mínimos, comportamiento, dificultad, reef, grupo y
// tipo de agua). Lo usan scripts/indexar_especies.mjs y las páginas de especies. Solo lectura de la wiki.
// Sin imports con "@/": también se importa desde scripts de Node.

// Campos "**Campo**: valor" de un bloque de Markdown
export function camposDe(bloque) {
  const campos = {};
  for (const [, k, valor] of bloque.matchAll(/^\*\*([^*]+)\*\*:\s*(.+)$/gm)) campos[k.trim()] = valor.trim();
  return campos;
}

export const numeros = (v) => [...v.replace(/,/g, '.').matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
export const rango = (v) => {
  const n = numeros(v);
  if (!n.length) return undefined;
  return [Math.min(...n.slice(0, 2)), Math.max(...n.slice(0, 2))];
};

export function leerFicha(campos, ruta = '') {
  const f = {};
  const v = (k) => campos[k];
  if (v('Temperatura')) f.t = rango(v('Temperatura'));
  if (v('pH')) f.ph = rango(v('pH'));
  const gh = v('GH') || (v('GH / KH / TDS') && v('GH / KH / TDS').match(/GH\s*([\d.,\s–-]+)/)?.[1]);
  if (gh) f.gh = rango(gh);
  // A veces la salinidad va dentro de "GH / KH / TDS: Salinidad 1.023-1.025"
  const salinidad = v('Salinidad') || (v('GH / KH / TDS') || '').match(/Salinidad\s*([\d.,\s–-]+)/i)?.[1];
  if (salinidad) {
    const s = rango(salinidad);
    if (s && s[0] > 1 && s[1] < 1.05) f.sal = s;
  }
  if (v('Tamaño')) {
    const n = numeros(v('Tamaño').split(/\(/)[0]);
    if (n.length && /cm/.test(v('Tamaño'))) f.cm = Math.max(...n);
  }
  if (v('Tamaño de acuario mínimo')) {
    const n = numeros(v('Tamaño de acuario mínimo'));
    if (n.length) {
      f.l = n[0];
      if (/por (pez|ejemplar|individuo|animal)/i.test(v('Tamaño de acuario mínimo'))) f.lpp = 1;
    }
  }
  const comp = (v('Comportamiento') || '').toLowerCase();
  if (comp) {
    if (/semi\s*-?\s*agre/.test(comp)) f.comp = 'semiagresivo';
    else if (/(?<!no )agresiv/.test(comp) && !/pac[ií]fic/.test(comp.split(/[(,;]/)[0])) f.comp = 'agresivo';
    else if (/pac[ií]fic/.test(comp)) f.comp = 'pacifico';
  }
  const estrellas = (v('Dificultad') || '').match(/★/g);
  if (estrellas) f.dif = estrellas.length;
  const reef = (v('Reef Safe') || '').toLowerCase();
  if (reef) {
    if (/precauci|⚠/.test(reef)) f.reef = 'precaucion';
    else if (/^\W*(✅|s[ií]\b)/.test(reef)) f.reef = 'si';
    else if (/^\W*(❌|no\b)/.test(reef)) f.reef = 'no';
  }
  const grupo = v('Mínimo de individuos');
  if (grupo) {
    const n = numeros(grupo);
    if (n.length && n[0] >= 2) f.grupo = n[0];
  }
  // Tipo de agua: la salinidad o lo que diga la ficha; si no, la carpeta (acuarios marinos).
  // Las salobres se quedan sin tipo para no dar avisos de "agua equivocada" en ningún sentido.
  // Solo lo principal: "dulce (ciclo larval marino)" es agua dulce
  const tipo = (v('Tipo de agua') || '').toLowerCase().split(/[(,;]/)[0];
  if (/salobre/.test(tipo)) { /* sin tipo */ }
  else if (f.sal || /marin|salad/.test(tipo) || /marino/i.test(ruta)) f.agua = 'marina';
  // Estanques y acuarios de agua fría son siempre de agua dulce aunque la ficha no lo diga
  else if (tipo || f.gh || /estanques? koi|agua fr[ií]a/i.test(ruta)) f.agua = 'dulce';
  return Object.keys(f).length ? f : null;
}
