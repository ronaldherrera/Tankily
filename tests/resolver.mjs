// Permite importar el código de src/ desde las pruebas de Node (node --test) sin herramientas extra:
// resuelve el alias "@/" a src/ y añade la extensión .js que Next permite omitir.
import { existsSync } from 'node:fs';
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = new URL('../src/', import.meta.url);

export async function resolve(especificador, contexto, siguiente) {
  let url = null;
  if (especificador.startsWith('@/')) url = new URL(especificador.slice(2), SRC);
  else if ((especificador.startsWith('./') || especificador.startsWith('../')) && contexto.parentURL?.startsWith('file:')) {
    url = new URL(especificador, contexto.parentURL);
  }
  if (url && !/\.(m?js|json)$/.test(url.pathname)) {
    for (const extra of ['.js', '/index.js']) {
      const candidato = fileURLToPath(url) + extra;
      if (existsSync(candidato)) return siguiente(pathToFileURL(candidato).href, contexto);
    }
  }
  return siguiente(url ? url.href : especificador, contexto);
}

// Al cargarse con --import, se registra a sí mismo como gancho de resolución
if (!globalThis.__resolverTankily) {
  globalThis.__resolverTankily = true;
  register(import.meta.url);
}
