// Crea las claves VAPID de las notificaciones push (una sola vez: si se cambian, todas las suscripciones
// dejan de valer y cada persona tiene que volver a activarlas).
// La privada va solo a los secretos de la Edge Function `push`, sin mostrarse. La pública no es secreta:
// se escribe en src/lib/clavePush.js para la web y también se guarda como secreto de la función.
// Uso: node scripts/claves_push.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const PROYECTO = 'ivizkgmogzvscygcxepy';
const ARCHIVO = 'src/lib/clavePush.js';
if (/CLAVE_PUSH = '[^']+'/.test(fs.existsSync(ARCHIVO) ? fs.readFileSync(ARCHIVO, 'utf8') : '') && !process.argv.includes('--cambiar')) {
  console.error(`Ya hay claves (${ARCHIVO}). Cambiarlas anula todas las suscripciones; si de verdad quieres, añade --cambiar.`);
  process.exit(1);
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = publicKey.export({ format: 'jwk' });
const priv = privateKey.export({ format: 'jwk' });
const publica = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, 'base64url'), Buffer.from(pub.y, 'base64url')]).toString('base64url');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
console.log('Guardando las claves en los secretos de la función…');
execFileSync(npx, ['supabase', 'secrets', 'set', `VAPID_PUBLICA=${publica}`, `VAPID_PRIVADA=${priv.d}`, '--project-ref', PROYECTO],
  { stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32', timeout: 120000 });
fs.writeFileSync(ARCHIVO, `// Clave pública VAPID de las notificaciones push (generada con scripts/claves_push.mjs; no es secreta)\nexport const CLAVE_PUSH = '${publica}';\n`);
console.log(`Listo. Clave pública escrita en ${ARCHIVO}.`);
