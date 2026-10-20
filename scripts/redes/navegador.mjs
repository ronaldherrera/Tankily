// Chrome sin ventana controlado por el protocolo de depuración (sin dependencias), para las piezas de redes:
// capturas de tankily.com en tamaño móvil, láminas de carrusel y vídeos (ver generar.mjs).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export async function abrirNavegador({ puerto = 9351 } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tankily-redes-'));
  const proceso = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${path.join(tmp, 'perfil')}`,
    '--hide-scrollbars', '--lang=es-ES', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
  let objetivo;
  for (let i = 0; i < 60 && !objetivo; i++) {
    await esperar(200);
    try { objetivo = (await (await fetch(`http://127.0.0.1:${puerto}/json`)).json()).find((t) => t.type === 'page'); } catch { /* arrancando */ }
  }
  if (!objetivo) throw new Error('Chrome no ha arrancado');
  const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
  await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
  let id = 0;
  const pendientes = new Map();
  const oyentes = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (pendientes.has(d.id)) { pendientes.get(d.id)(d); pendientes.delete(d.id); } else if (d.method) oyentes.forEach((f) => f(d));
  };
  const cdp = (method, params = {}) => new Promise((r) => { pendientes.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  await cdp('Page.enable');
  await cdp('Runtime.enable');

  const cargado = () => new Promise((r) => { const f = (d) => { if (d.method === 'Page.loadEventFired') { oyentes.splice(oyentes.indexOf(f), 1); r(); } }; oyentes.push(f); });
  const evaluar = async (expression) => {
    const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };

  return {
    cdp, evaluar,
    // Abre una URL con tamaño de móvil (o el que se pida) y espera a que termine de pintar
    async ir(url, { ancho = 390, alto = 844, escala = 3, movil = true, pausa = 1800 } = {}) {
      await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: escala, mobile: movil });
      const c = cargado();
      await cdp('Page.navigate', { url });
      await c;
      await evaluar('document.fonts.ready.then(() => true)');
      await esperar(pausa);
    },
    // Captura PNG; `completa` incluye toda la altura de la página
    async capturar({ completa = false, alto } = {}) {
      let clip;
      if (completa || alto) {
        const m = await evaluar('({ w: document.documentElement.clientWidth, h: document.documentElement.scrollHeight })');
        clip = { x: 0, y: 0, width: m.w, height: alto ? Math.min(alto, m.h) : m.h, scale: 1 };
      }
      const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!clip, ...(clip ? { clip } : {}) });
      return Buffer.from(r.result.data, 'base64');
    },
    async cerrar() {
      ws.close();
      proceso.kill();
      await esperar(800);
      // En Windows Chrome tarda en soltar su perfil: si no se deja borrar, queda en la carpeta temporal del sistema
      try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* se limpiará con los temporales */ }
    },
  };
}
