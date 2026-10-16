// Genera las plantillas de los emails de la cuenta (Supabase Auth) en supabase/plantillas/*.html
// a partir de supabase/plantillas/textos.json. Cada plantilla lleva los 8 idiomas y elige el del
// usuario con .Data.idioma (se guarda al registrarse); si no lo hay, español.
// Uso: node scripts/generar_plantillas_email.mjs
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'supabase', 'plantillas');
const textos = JSON.parse(fs.readFileSync(path.join(DIR, 'textos.json'), 'utf8'));
const IDIOMAS = ['es', 'en', 'de', 'pt', 'fr', 'it', 'nl', 'pl'];
const SITIO = 'https://tankily.com';

// Colores de la marca en versión clara (los clientes de correo no respetan bien el modo oscuro)
const C = { fondo: '#eef6fa', tarjeta: '#ffffff', tinta: '#0b1f33', texto: '#3c5266', suave: '#7a8fa3', ola: '#4fc3e8', boton: '#0b1f33' };

function bloque({ titulo, texto, boton }, { pie, lema }) {
  return `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:${C.tinta};font-weight:700;">${titulo}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${C.texto};">${texto}</p>
      <p style="margin:0 0 28px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${C.boton};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${boton}</a></p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:${C.suave};">${pie}</p>
    </td></tr>
    <tr><td style="padding:16px 8px 0;font-size:12px;color:${C.suave};text-align:center;">Tankily · ${lema}</td></tr>`;
}

function plantilla(tipo) {
  const t = textos[tipo];
  // {{ if eq .Data.idioma "en" }} … {{ else if … }} … {{ else }} (español) {{ end }}
  const ramas = IDIOMAS.slice(1).map((l, i) => `{{ ${i ? 'else if' : 'if'} eq (printf "%v" .Data.idioma) "${l}" }}${bloque(t[l], textos.comun[l])}`).join('\n    ');
  return `<!doctype html>
<!-- Generado por scripts/generar_plantillas_email.mjs: edita textos.json y vuelve a generarlo -->
<html>
<body style="margin:0;padding:0;background:${C.fondo};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
    <tr><td style="padding:0 8px 16px;">
      <a href="${SITIO}" style="text-decoration:none;"><img src="${SITIO}/icons/icon-192.png" width="40" height="40" alt="Tankily" style="display:block;border:0;border-radius:10px;"></a>
    </td></tr>
    <tr><td style="background:${C.tarjeta};border-radius:18px;padding:32px 28px;border-top:4px solid ${C.ola};">
    ${ramas}
    {{ else }}${bloque(t.es, textos.comun.es)}
    {{ end }}
  </table>
</td></tr>
</table>
</body>
</html>
`;
}

for (const tipo of ['confirmacion', 'recuperacion', 'enlace', 'cambio_email']) {
  fs.writeFileSync(path.join(DIR, `${tipo}.html`), plantilla(tipo));
}
const asuntos = Object.fromEntries(['confirmacion', 'recuperacion', 'enlace', 'cambio_email'].map((k) => [k, textos[k].asunto]));
console.log('Plantillas generadas en supabase/plantillas/. Asuntos:', asuntos);
