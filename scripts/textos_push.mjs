// Copia a la Edge Function `push` los textos de las notificaciones de la web (los 8 idiomas), para que
// las push digan lo mismo que la página de notificaciones. Vuelve a ejecutarlo si cambian esos textos.
// Uso: node --import ./tests/resolver.mjs scripts/textos_push.mjs
import fs from 'node:fs';

const IDIOMAS = ['es', 'en', 'de', 'pt', 'fr', 'it', 'nl', 'pl'];
const textos = {};
for (const l of IDIOMAS) {
  const d = (await import(`../src/i18n/porIdioma/${l}.js`)).default;
  textos[l] = { tipos: d.notificaciones.tipos, alguien: d.notificaciones.alguien };
}
fs.writeFileSync('supabase/functions/push/textos.json', `${JSON.stringify(textos, null, 1)}\n`);
console.log('supabase/functions/push/textos.json actualizado');
