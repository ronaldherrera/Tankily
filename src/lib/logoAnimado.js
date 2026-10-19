// Logo animado calculado en el navegador (para la "t" de la cabecera mientras algo carga). Es la misma
// animación que public/logo-animado.svg (scripts/logo_animado/): una ola que avanza y una burbuja que se
// desprende de ella, sube, coincide con el icono y estalla. Aquí se calcula fotograma a fotograma para poder
// usar los colores del tema y acelerar o parar en el instante del icono (t = 0).
// estadoLogo(segundos, { r }) → { ola, burbuja, anillo, gotas } en la retícula de 64 del símbolo.

export const CICLO = 5.5; // segundos

// Curva de Bézier de tiempo, como keySplines de SVG: x de 0 a 1 → progreso
function bezier(x1, y1, x2, y2) {
  const coef = (a1, a2) => { const cc = 3 * a1, bb = 3 * (a2 - a1) - cc, aa = 1 - cc - bb; return [aa, bb, cc]; };
  const [ax, bx, cx] = coef(x1, x2), [ay, by, cy] = coef(y1, y2);
  const fx = (t) => ((ax * t + bx) * t + cx) * t;
  const fy = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) { // Newton
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= (fx(t) - x) / d;
    }
    return fy(Math.min(1, Math.max(0, t)));
  };
}
const LINEAL = (x) => x;
const SUAVE = bezier(0.4, 0, 0.6, 1);
const SALE = bezier(0.12, 0.75, 0.3, 1);
const CAE = bezier(0.5, 0, 0.9, 0.6);

// Interpola por tramos como <animate keyTimes values keySplines>
function tramos(u, tiempos, valores, curvas = []) {
  if (u <= tiempos[0]) return valores[0];
  for (let i = 1; i < tiempos.length; i++) {
    if (u <= tiempos[i]) {
      const p = (u - tiempos[i - 1]) / (tiempos[i] - tiempos[i - 1] || 1);
      const e = (curvas[i - 1] || LINEAL)(p);
      return valores[i - 1] + (valores[i] - valores[i - 1]) * e;
    }
  }
  return valores[valores.length - 1];
}

// Ola: y = 26 - 3,15·sin(2π(x-14)/30 - 2πt), curva suave de 16 tramos (Catmull-Rom → Bézier)
function ola(t) {
  const y = (x) => 26 - 3.15 * Math.sin((2 * Math.PI * (x - 14)) / 30 - 2 * Math.PI * t);
  const n = 17, paso = 30 / (n - 1);
  const p = Array.from({ length: n + 2 }, (_, i) => { const x = 14 + (i - 1) * paso; return [x, y(x)]; });
  const f = (v) => v.toFixed(2);
  let d = `M${f(p[1][0])} ${f(p[1][1])}`;
  for (let i = 1; i < n; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

// Recorrido de la burbuja al desprenderse (misma curva que el SVG)
const RECORRIDO = [[41, 23.5], [41.4, 18.6], [44.6, 13.4], [51, 13]];
function punto(p) {
  const q = 1 - p;
  const c = [q * q * q, 3 * q * q * p, 3 * q * p * p, p * p * p];
  return [0, 1].map((k) => RECORRIDO.reduce((s, pt, i) => s + pt[k] * c[i], 0));
}

const GOTAS = [[-95, 4.6, 1.25], [-62, 3.6, 0.9], [-128, 3.9, 1.0], [-28, 2.6, 0.7], [-160, 2.8, 0.75], [20, 1.9, 0.55]];
const RAD = Math.PI / 180;

export function estadoLogo(segundos, { r = 4.6 } = {}) {
  const t = ((segundos / CICLO) % 1 + 1) % 1;
  const u = (t + 0.25) % 1; // vida de la burbuja: nace con la punta derecha arriba (t = 0,75)
  const k = r / 4.6;        // la burbuja del símbolo puede ser algo más pequeña que la del icono
  const POP = 0.5;

  const [bx, by] = punto(u < 0.22 ? bezier(0.45, 0, 0.2, 1)(u / 0.22) : 1);
  const flota = tramos(u, [0, 0.27, 0.35, 0.43, 0.5], [0, 0, -0.4, 0, -0.25], [LINEAL, SUAVE, SUAVE, SUAVE]);
  const tr = [0, 0.22, 0.465, 0.477, 0.489, POP, 0.506];
  const curvas = [bezier(0.3, 0, 0.3, 1), LINEAL, SUAVE, SUAVE, SUAVE, LINEAL];
  const burbuja = {
    x: bx, y: by + flota,
    rx: k * tramos(u, tr, [1.5, 4.6, 4.6, 4.95, 4.35, 4.6, 5.2], curvas),
    ry: k * tramos(u, tr, [1.8, 4.6, 4.6, 4.3, 4.85, 4.6, 5.2], curvas),
    opacidad: tramos(u, [0, POP, 0.511], [1, 1, 0]),
    // 0: color del final de la ola (nace de ella) → 1: color de la burbuja
    color: tramos(u, [0, 0.06, 0.16], [0, 0, 1]),
  };
  const anillo = {
    r: k * tramos(u, [0, POP, 0.535], [4.6, 4.6, 7.6], [LINEAL, SALE]),
    grosor: tramos(u, [0, POP, 0.535], [1.8, 1.8, 0.2]),
    opacidad: tramos(u, [0, 0.499, 0.503, 0.535], [0, 0, 0.85, 0]),
  };
  const gotas = GOTAS.map(([ang, dist, tam]) => {
    const a = ang * RAD, R = 4.6 * k, D = dist * k;
    const x0 = 51 + R * Math.cos(a), y0 = 13 + R * Math.sin(a);
    const x1 = 51 + (R + D) * Math.cos(a), y1 = 13 + (R + D) * Math.sin(a);
    const x2 = x1 + 0.35 * Math.cos(a), y2 = y1 + 1.6 * k;
    return {
      x: tramos(u, [0, POP, 0.545, 0.6], [x0, x0, x1, x2], [LINEAL, SALE, CAE]),
      y: tramos(u, [0, POP, 0.545, 0.6], [y0, y0, y1, y2], [LINEAL, SALE, CAE]),
      r: k * tramos(u, [0, POP, 0.503, 0.545, 0.6], [0, 0, tam, tam * 0.75, 0]),
    };
  });
  return { ola: ola(t), burbuja, anillo, gotas };
}
