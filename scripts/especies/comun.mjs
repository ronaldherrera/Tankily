// Utilidades compartidas por las herramientas de scripts/especies/ (no se usan en la web).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const RAIZ = process.cwd();
// Fuera del proyecto: el servidor de desarrollo vigila toda la carpeta (también node_modules) y
// reescribir la caché cada pocos segundos le hacía acumular memoria hasta caerse
export const CACHE = path.join(os.homedir(), '.cache', 'tankily-especies');
fs.mkdirSync(CACHE, { recursive: true });

// Identificación educada ante las APIs públicas (Wikimedia la exige)
export const UA = 'TankilyWikiBot/1.0 (https://tankily.com; catálogo de especies de acuario)';

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export async function pedir(url, { json = true, intentos = 3 } = {}) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: json ? 'application/json' : '*/*' } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return null;
      return json ? await res.json() : res;
    } catch (e) {
      if (i >= intentos) { console.warn(`  ⚠ ${url}: ${e.message}`); return null; }
      await esperar(2000 * i);
    }
  }
}

// Caché en disco por fuente, para no repetir consultas entre ejecuciones
export function cache(nombre) {
  const archivo = path.join(CACHE, `${nombre}.json`);
  let datos = {};
  try { datos = JSON.parse(fs.readFileSync(archivo, 'utf8')); } catch { /* vacía */ }
  return {
    get: (k) => datos[k],
    has: (k) => k in datos,
    set: (k, v) => { datos[k] = v; fs.writeFileSync(archivo, JSON.stringify(datos, null, 1)); },
  };
}
