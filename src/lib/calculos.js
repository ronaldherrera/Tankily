// Fórmulas de las calculadoras de acuariofilia. Todo en unidades métricas (cm, litros, °C);
// la interfaz convierte desde y hacia el sistema del usuario.

// Volumen de un acuario rectangular. El agua no llega al borde ni ocupa el sustrato.
export function volumenRectangular({ largo, ancho, alto, sustrato = 0, margen = 0 }) {
  const bruto = (largo * ancho * alto) / 1000;
  const alturaAgua = Math.max(alto - sustrato - margen, 0);
  const neto = (largo * ancho * alturaAgua) / 1000;
  return { bruto, neto };
}

// Volumen de un acuario cilíndrico (diámetro y alto en cm)
export function volumenCilindrico({ diametro, alto, sustrato = 0, margen = 0 }) {
  const area = Math.PI * (diametro / 2) ** 2;
  return { bruto: (area * alto) / 1000, neto: (area * Math.max(alto - sustrato - margen, 0)) / 1000 };
}

// Peso del agua en kg (el agua salada pesa un 2,5 % más)
export const pesoAgua = (litros, marino = false) => litros * (marino ? 1.025 : 1);

// Cambio de agua: litros a cambiar y nitratos resultantes (dilución simple, agua nueva sin nitratos)
export function cambioAgua({ litros, porcentaje, nitrato = null, nitratoAgua = 0 }) {
  const cambiar = (litros * porcentaje) / 100;
  const nitratoTras = nitrato == null ? null : nitrato * (1 - porcentaje / 100) + nitratoAgua * (porcentaje / 100);
  return { cambiar, nitratoTras };
}

// Porcentaje de cambio necesario para bajar los nitratos de `actual` a `objetivo`
export function porcentajeParaNitrato({ actual, objetivo, nitratoAgua = 0 }) {
  if (actual <= objetivo) return 0;
  if (objetivo <= nitratoAgua) return null; // imposible con esa agua de grifo
  return ((actual - objetivo) / (actual - nitratoAgua)) * 100;
}

// CO₂ disuelto (mg/l) a partir de KH (°dKH) y pH: CO₂ = 3 · KH · 10^(7 − pH)
export const co2DesdeKhPh = (kh, ph) => 3 * kh * 10 ** (7 - ph);
export const zonaCo2 = (co2) => (co2 < 15 ? 'bajo' : co2 <= 30 ? 'optimo' : 'alto');

// Dureza: todo pasa por ppm de CaCO₃
const POR_PPM = { dh: 17.848, ppm: 1, mmol: 100.09, meq: 50.045 };
export function convertirDureza(valor, desde) {
  const ppm = valor * POR_PPM[desde];
  return { dh: ppm / POR_PPM.dh, ppm, mmol: ppm / POR_PPM.mmol, meq: ppm / POR_PPM.meq };
}

// Salinidad a 25 °C: densidad específica ↔ ppt (aprox. lineal en el rango del acuario)
const SG_POR_PPT = 0.000752;
export const pptDesdeDensidad = (sg) => (sg - 1) / SG_POR_PPT;
export const densidadDesdePpt = (ppt) => 1 + ppt * SG_POR_PPT;
// Gramos de sal para preparar `litros` de agua a `ppt` (ppt ≈ g por kg de agua de mar)
export const salNecesaria = (litros, ppt) => litros * densidadDesdePpt(ppt) * ppt;
