// Crea (o cambia) la clave que comparten pg_cron y la Edge Function `avisos`, sin mostrarla:
// la guarda en Vault (avisos_clave) y como secreto de la función (AVISOS_CLAVE).
// Uso: node scripts/clave_avisos.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PROYECTO = 'ivizkgmogzvscygcxepy';
const clave = crypto.randomBytes(32).toString('hex');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
// La salida de la CLI no se muestra (podría repetir la clave); los errores sí
const ejecutar = (args) => execFileSync(npx, args, { stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32', timeout: 120000 });

const sql = path.join(os.tmpdir(), `clave-avisos-${process.pid}.sql`);
fs.writeFileSync(sql, `do $$ begin
  if exists (select 1 from vault.secrets where name = 'avisos_clave') then
    perform vault.update_secret((select id from vault.secrets where name = 'avisos_clave'), '${clave}');
  else
    perform vault.create_secret('${clave}', 'avisos_clave', 'Clave de pg_cron para la Edge Function avisos');
  end if;
end $$;`);
try {
  console.log('1/2 Guardando la clave en Vault…');
  ejecutar(['supabase', 'db', 'query', '--linked', '-f', sql]);
  console.log('2/2 Guardando la clave en los secretos de la función…');
  ejecutar(['supabase', 'secrets', 'set', `AVISOS_CLAVE=${clave}`, '--project-ref', PROYECTO]);
  console.log('Clave de avisos guardada en Vault y en los secretos de la función.');
} finally {
  fs.rmSync(sql, { force: true });
}
