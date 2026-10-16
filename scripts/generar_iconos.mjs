// Genera los iconos de la app a partir del símbolo de Tankily (la t de ola):
//   public/icons/icon-192.png, icon-512.png     → manifest (purpose "any")
//   public/icons/maskable-512.png               → manifest (purpose "maskable", zona segura del 80 %)
//   public/apple-touch-icon.png                 → pantalla de inicio de iPhone/iPad (180 px, sin transparencia)
//   src/app/favicon.ico                         → navegadores antiguos (16 y 32 px dentro del .ico)
//   public/favicon.svg                          → pestaña del navegador (mismo cuadro oscuro que el .ico, nítido a cualquier tamaño)
// Uso: node scripts/generar_iconos.mjs
import fs from 'fs';
import sharp from 'sharp';

// Fondo: el abismo de la marca con una luz de agua arriba a la izquierda
const fondo = (lado, radio) => `
  <defs>
    <radialGradient id="luz" cx="30%" cy="12%" r="95%">
      <stop offset="0" stop-color="#15406a"/>
      <stop offset="0.7" stop-color="#071425"/>
    </radialGradient>
  </defs>
  <rect width="${lado}" height="${lado}" rx="${radio}" fill="url(#luz)"/>`;

// Símbolo en la retícula de 64: palo claro, ola con el degradado de la marca y burbuja
const simbolo = `
  <defs>
    <linearGradient id="ola" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9fe7f5"/>
      <stop offset="1" stop-color="#5aa8ff"/>
    </linearGradient>
  </defs>
  <path d="M29 10V40a12 12 0 0 0 12 12h3" fill="none" stroke="#e6f1f7" stroke-width="9" stroke-linecap="round"/>
  <path d="M14 26c5-4.2 10-4.2 15 0s10 4.2 15 0" fill="none" stroke="url(#ola)" stroke-width="8.5" stroke-linecap="round"/>
  <circle cx="51" cy="13" r="4" fill="#9fe7f5"/>`;

// La t ocupa x 9,75–55 y y 5,5–56,5 en su retícula: se centra con un desplazamiento
function icono(lado, { radio = 0, escala = 0.72 } = {}) {
  const tam = lado * escala;
  const desp = (lado - tam) / 2;
  const s = tam / 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
    ${fondo(lado, radio)}
    <g transform="translate(${desp - 0.6 * s} ${desp + 1 * s}) scale(${s})">${simbolo}</g>
  </svg>`;
}

const png = (svg) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon-192.png', await png(icono(192, { radio: 42 })));
fs.writeFileSync('public/icons/icon-512.png', await png(icono(512, { radio: 112 })));
// Maskable: fondo a sangre y el símbolo dentro de la zona segura (círculo del 80 %)
fs.writeFileSync('public/icons/maskable-512.png', await png(icono(512, { escala: 0.56 })));
fs.writeFileSync('public/apple-touch-icon.png', await png(icono(180, { escala: 0.7 })));
fs.writeFileSync('public/favicon.svg', icono(64, { radio: 64 * 0.22, escala: 0.82 }).replace(/\n\s*/g, ''));

// favicon.ico con PNG de 16 y 32 px dentro (formato ICO con imágenes PNG, válido desde Windows Vista)
const tamanos = [16, 32];
const imagenes = await Promise.all(tamanos.map((t) => png(icono(t, { radio: t * 0.22, escala: 0.82 }))));
const cabecera = Buffer.alloc(6);
cabecera.writeUInt16LE(0, 0); cabecera.writeUInt16LE(1, 2); cabecera.writeUInt16LE(tamanos.length, 4);
let desplazamiento = 6 + 16 * tamanos.length;
const entradas = tamanos.map((t, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(t, 0); e.writeUInt8(t, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(imagenes[i].length, 8); e.writeUInt32LE(desplazamiento, 12);
  desplazamiento += imagenes[i].length;
  return e;
});
fs.writeFileSync('src/app/favicon.ico', Buffer.concat([cabecera, ...entradas, ...imagenes]));

console.log('Iconos generados: public/icons/*, public/apple-touch-icon.png, public/favicon.svg, src/app/favicon.ico');
