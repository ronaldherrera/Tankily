// Ver Tankily desde fuera de casa: sirve la versión de producción (out/) solo en este ordenador
// y abre un túnel rápido de Cloudflare (sin cuenta) que da un enlace https://…trycloudflare.com.
// El enlace es público pero imposible de adivinar, y deja de funcionar al cerrar esta ventana
// (Ctrl+C) o si el ordenador se apaga o se suspende.
// Uso: npm run fuera   (antes, npm run build si has cambiado algo)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const RAIZ = path.join(process.cwd(), 'out');
const PUERTO = 3300;
const CLOUDFLARED = ['C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', 'C:\\Program Files\\cloudflared\\cloudflared.exe']
  .find((p) => fs.existsSync(p)) || 'cloudflared';

if (!fs.existsSync(path.join(RAIZ, 'index.html')) && !fs.existsSync(path.join(RAIZ, 'es', 'index.html'))) {
  console.error('No hay versión de producción en out/. Ejecuta antes: npm run build');
  process.exit(1);
}

// Servidor estático mínimo (como el hosting): carpetas → index.html, y 404.html si no existe
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.md': 'text/markdown; charset=utf-8',
};
const servidor = http.createServer((pet, res) => {
  let ruta;
  try { ruta = decodeURIComponent(pet.url.split('?')[0]); } catch { ruta = '/'; }
  if (ruta === '/') { res.writeHead(302, { Location: '/es/' }); res.end(); return; }
  let archivo = path.normalize(path.join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; } // nada fuera de out/
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  if (!fs.existsSync(archivo)) {
    res.writeHead(404, { 'Content-Type': TIPOS['.html'] });
    fs.createReadStream(path.join(RAIZ, '404.html')).on('error', () => res.end()).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(archivo).pipe(res);
});

// Solo en este ordenador: desde fuera se entra únicamente por el túnel
servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log(`Web servida en http://localhost:${PUERTO}/es/ — abriendo el túnel…`);
  const tunel = spawn(CLOUDFLARED, ['tunnel', '--url', `http://localhost:${PUERTO}`, '--no-autoupdate'], { windowsHide: true });
  let avisado = false;
  const leer = (datos) => {
    const enlace = datos.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
    if (enlace && !avisado) {
      avisado = true;
      console.log('\n==============================================================');
      console.log('  Abre esto desde el móvil o el trabajo:');
      console.log(`  ${enlace}/es/`);
      console.log('  (No lo compartas. Para cerrarlo: Ctrl+C o cierra esta ventana)');
      console.log('==============================================================\n');
    }
  };
  tunel.stdout.on('data', leer);
  tunel.stderr.on('data', leer);
  tunel.on('error', () => {
    console.error('No se encuentra cloudflared. Instálalo con: winget install --id Cloudflare.cloudflared -e');
    process.exit(1);
  });
  tunel.on('exit', (codigo) => { console.log(`El túnel se ha cerrado (${codigo}).`); servidor.close(); process.exit(0); });
  const cerrar = () => { tunel.kill(); servidor.close(); process.exit(0); };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
});
