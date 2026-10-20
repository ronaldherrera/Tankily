// Logo animado de Tankily, paso 3 de 3: GIF para los correos (public/icons/logo-animado.gif).
// Gmail no reproduce SVG animados pero sí GIF. Se dibuja el logo animado sobre el mismo cuadro oscuro del
// icono de la app, se congela la animación fotograma a fotograma en Chrome sin ventana (protocolo de
// depuración, sin dependencias) y Python (Pillow) une las capturas en el GIF.
// Uso: node scripts/logo_animado/gif.mjs   (necesita Chrome y `pip install pillow`)
//      node scripts/logo_animado/gif.mjs --perfil   → foto de perfil animada (Google, redes): 512 px, el
//      cuadro sin esquinas redondeadas para que el recorte circular no deje bordes claros
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const perfil = process.argv.includes('--perfil');
const LADO = perfil ? 512 : 96; // en el correo se muestra a 40-48 px: el doble para pantallas nítidas
const FPS = 20;
const DURACION = 5.5;       // ciclo de la animación (s)
const FONDO_CORREO = '#eef6fa';
const PUERTO = 9339;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SALIDA = perfil ? 'marca/foto-perfil-animada.gif' : 'public/icons/logo-animado.gif';

// Mismo encuadre que scripts/generar_iconos.mjs (cuadro con luz de agua, radio 22 %, símbolo al 72 %).
// El logo tiene que ser el <svg> principal (si va anidado en otro, Chrome no congela bien su tiempo):
// se amplía su viewBox para que quepa el cuadro y se dibuja el cuadro dentro, en las mismas coordenadas.
const tam = LADO * 0.72, desp = (LADO - tam) / 2, s = tam / 64;
const vx = -(desp - 0.6 * s) / s, vy = -(desp + 1 * s) / s, vl = LADO / s;
const cuadro = `<defs><radialGradient id="luz" cx="30%" cy="12%" r="95%"><stop offset="0" stop-color="#15406a"/><stop offset="0.7" stop-color="#071425"/></radialGradient></defs>
  <rect x="${vx}" y="${vy}" width="${vl}" height="${vl}" rx="${perfil ? 0 : vl * 0.22}" fill="url(#luz)"/>`;
const logo = fs.readFileSync('public/logo-animado-oscuro.svg', 'utf8')
  .replace(/<svg[^>]*viewBox="4 2 56 56">/, `<svg id="logo" xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="${vx} ${vy} ${vl} ${vl}" style="display:block">
  ${cuadro}`);
const html = `<!doctype html><html><body style="margin:0;background:${FONDO_CORREO}">${logo}</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'logo-gif-'));
const pagina = path.join(tmp, 'logo.html');
fs.writeFileSync(pagina, html);

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${path.join(tmp, 'perfil')}`,
  '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${LADO + 100},${LADO + 100}`, `file:///${pagina.replace(/\\/g, '/')}`], { stdio: 'ignore' });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let objetivo;
  for (let i = 0; i < 50 && !objetivo; i++) {
    await esperar(200);
    try { objetivo = (await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json()).find((t) => t.type === 'page'); } catch { /* aún arrancando */ }
  }
  if (!objetivo) throw new Error('Chrome no ha arrancado');

  const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
  await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
  let id = 0;
  const pendientes = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (pendientes.has(d.id)) { pendientes.get(d.id)(d); pendientes.delete(d.id); } };
  const cdp = (method, params = {}) => new Promise((r) => { pendientes.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });

  await esperar(500);
  await cdp('Runtime.evaluate', { expression: "document.getElementById('logo').pauseAnimations()" });
  const n = Math.round(DURACION * FPS);
  for (let i = 0; i < n; i++) {
    // Fija el instante y espera a que el navegador lo pinte (dos fotogramas) antes de capturar
    await cdp('Runtime.evaluate', {
      expression: `document.getElementById('logo').setCurrentTime(${(i / FPS).toFixed(3)}); new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))`,
      awaitPromise: true,
    });
    const r = await cdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: LADO, height: LADO, scale: 1 } });
    fs.writeFileSync(path.join(tmp, `f${String(i).padStart(3, '0')}.png`), Buffer.from(r.result.data, 'base64'));
  }
  ws.close();

  // Unir con Pillow: paleta adaptativa común y bucle infinito
  const py = `
import glob, sys
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/f*.png'))
ims = [Image.open(f).convert('RGB') for f in fs]
perfil = ${perfil ? 'True' : 'False'}
if perfil:
    # A 512 px el degradado de la ola se ve a franjas: paleta de 256 colores sacada de varios fotogramas
    # (la burbuja cambia de color a lo largo del ciclo) y tramado para suavizar
    w, h = ims[0].size
    muestra = Image.new('RGB', (w * 6, h))
    for k, i in enumerate(range(0, len(ims), max(1, len(ims) // 6))):
        if k < 6: muestra.paste(ims[i], (k * w, 0))
    pal = muestra.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    fr = [im.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG) for im in ims]
else:
    pal = ims[0].quantize(colors=128, method=Image.Quantize.MEDIANCUT)
    fr = [im.quantize(palette=pal, dither=Image.Dither.NONE) for im in ims]
fr[0].save(sys.argv[2], save_all=True, append_images=fr[1:], duration=${Math.round(1000 / FPS)}, loop=0, optimize=True, disposal=1)
print(len(fr), 'fotogramas')`;
  console.log(execFileSync('python', ['-c', py, tmp, SALIDA]).toString().trim(), `→ ${SALIDA} (${(fs.statSync(SALIDA).size / 1024).toFixed(0)} KB)`);
} finally {
  chrome.kill();
  await esperar(300);
  fs.rmSync(tmp, { recursive: true, force: true });
}
