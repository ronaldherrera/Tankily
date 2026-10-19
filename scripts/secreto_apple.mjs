// Genera el "Secret Key (for OAuth)" de Apple para Supabase (Authentication → Providers → Apple).
// Apple obliga a que caduque como mucho a los 6 meses: hay que volver a generarlo y pegarlo antes.
//
// Uso (la clave .p8 no se sube nunca al repositorio; guárdala fuera, p. ej. en Documentos):
//   node scripts/secreto_apple.mjs "C:\ruta\AuthKey_J96R4VKA2Y.p8"
//
// Datos de Tankily (no son secretos): equipo 839J8P4YP6, clave J96R4VKA2Y, Services ID com.tankily.web
import fs from 'fs';
import crypto from 'crypto';

const EQUIPO = '839J8P4YP6';
const CLAVE_ID = 'J96R4VKA2Y';
const SERVICES_ID = 'com.tankily.web';
const SEIS_MESES = 180 * 24 * 3600;

const ruta = process.argv[2];
if (!ruta || !fs.existsSync(ruta)) {
  console.error('Indica la ruta del archivo .p8: node scripts/secreto_apple.mjs "C:\\ruta\\AuthKey_J96R4VKA2Y.p8"');
  process.exit(1);
}

const b64url = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
const ahora = Math.floor(Date.now() / 1000);
const cabecera = b64url({ alg: 'ES256', kid: CLAVE_ID });
const cuerpo = b64url({ iss: EQUIPO, iat: ahora, exp: ahora + SEIS_MESES, aud: 'https://appleid.apple.com', sub: SERVICES_ID });
const firma = crypto.sign('sha256', Buffer.from(`${cabecera}.${cuerpo}`), {
  key: fs.readFileSync(ruta, 'utf8'),
  dsaEncoding: 'ieee-p1363',
}).toString('base64url');

const caduca = new Date((ahora + SEIS_MESES) * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
console.log('\nPega esto en Supabase → Authentication → Providers → Apple → "Secret Key (for OAuth)":\n');
console.log(`${cabecera}.${cuerpo}.${firma}`);
console.log(`\nCaduca el ${caduca}: genera uno nuevo antes de esa fecha.\n`);
