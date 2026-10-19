// Copia a las Edge Functions los textos de la web que usan (los 8 idiomas), para que digan lo mismo:
// `push` → tipos de notificación; `avisos` → nombres de las tareas de mantenimiento.
// Vuelve a ejecutarlo si cambian esos textos.
// Uso: node --import ./tests/resolver.mjs scripts/textos_push.mjs
import fs from 'node:fs';

const IDIOMAS = ['es', 'en', 'de', 'pt', 'fr', 'it', 'nl', 'pl'];
const textos = {};
const tareas = {};
for (const l of IDIOMAS) {
  const d = (await import(`../src/i18n/porIdioma/${l}.js`)).default;
  textos[l] = { tipos: d.notificaciones.tipos, alguien: d.notificaciones.alguien };
  tareas[l] = d.tareas.tipos;
}
fs.writeFileSync('supabase/functions/push/textos.json', `${JSON.stringify(textos, null, 1)}\n`);
fs.writeFileSync('supabase/functions/avisos/tareas.json', `${JSON.stringify(tareas, null, 1)}\n`);
console.log('Textos copiados a supabase/functions/push/textos.json y supabase/functions/avisos/tareas.json');
