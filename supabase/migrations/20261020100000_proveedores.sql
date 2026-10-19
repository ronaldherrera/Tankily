-- Proveedores y plataformas de Tankily (Administración → Proveedores): para qué sirve cada servicio,
-- dónde se gestiona, con qué cuenta, cuánto cuesta y qué hay que renovar. Solo administradores.
-- Nunca se guardan aquí claves ni contraseñas: esas viven en los secretos de Supabase y de GitHub.

create table public.proveedores (
  id bigint generated always as identity primary key,
  nombre text not null check (char_length(nombre) between 1 and 60),
  categoria text not null default 'otros' check (categoria in
    ('infraestructura','correo','acceso','analitica','seo','pagos','traduccion','otros')),
  para_que text check (char_length(para_que) <= 400),
  enlace text check (enlace is null or enlace like 'https://%'),
  cuenta text check (char_length(cuenta) <= 120),
  coste text check (char_length(coste) <= 120),
  estado text not null default 'activo' check (estado in ('activo','pendiente','descartado')),
  renovar_el date,
  notas text check (char_length(notas) <= 1000),
  orden int not null default 0,
  creado_en timestamptz not null default now()
);
alter table public.proveedores enable row level security;
create policy "proveedores: administradores" on public.proveedores for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
revoke all on public.proveedores from anon;

insert into public.proveedores (orden, categoria, nombre, para_que, enlace, cuenta, coste, estado, renovar_el, notas) values
 (10, 'infraestructura', 'Hostinger', 'Alojamiento de la web, dominio tankily.com y DNS (registros de Google, correo, SPF/DKIM/DMARC).', 'https://hpanel.hostinger.com', 'Cuenta personal', 'Plan Premium (compartido con otras 5 webs)', 'activo', null, 'El límite real son los inodos: 400.000 archivos entre las 6 webs. Revisa la fecha de renovación del dominio y del plan en el panel.'),
 (20, 'infraestructura', 'GitHub', 'Código de la web y publicación automática: cada push a main construye y sube por rsync/SSH a Hostinger.', 'https://github.com/ronaldherrera/Tankily', 'ronaldherrera', 'Gratis', 'activo', null, 'Secretos del deploy: SSH_PRIVATE_KEY, SSH_KNOWN_HOSTS, SSH_HOST, SSH_PORT, SSH_USER, SSH_RUTA. Los antiguos FTP_* se pueden borrar.'),
 (30, 'infraestructura', 'Supabase', 'Base de datos, cuentas de usuario, fotos, tareas programadas (avisos, recordatorios) y funciones: traducir, avisos y push.', 'https://supabase.com/dashboard/project/ivizkgmogzvscygcxepy', 'Cuenta personal', 'Comprueba el plan y sus límites en Billing', 'activo', null, 'Secretos de las funciones: SMTP_PASS, AVISOS_CLAVE, VAPID_PUBLICA, VAPID_PRIVADA y DEEPL_API_KEY.'),
 (40, 'correo', 'Correo Hostinger (krill@tankily.com)', 'Remitente de los correos de la cuenta (Supabase Auth) y de los avisos por email.', 'https://mail.hostinger.com', 'krill@tankily.com', 'Incluido en Hostinger', 'activo', null, 'SMTP smtp.hostinger.com:465. SPF, DKIM y DMARC en PASS. Si cambias la contraseña del buzón, actualízala en Supabase (SMTP) y en el secreto SMTP_PASS.'),
 (45, 'correo', 'Foto del remitente en Gmail', 'Que los correos de krill@tankily.com salgan con el logo de Tankily.', 'https://myaccount.google.com', 'krill@tankily.com (cuenta de Google sin Gmail)', 'Gratis', 'pendiente', null, 'Falló la verificación por SMS el 18/10/2026. Alternativa: Gravatar con la misma dirección.'),
 (50, 'acceso', 'Google Cloud (proyecto tankily)', 'Botón "Continuar con Google".', 'https://console.cloud.google.com/apis/credentials?project=tankily', 'Cuenta personal', 'Gratis', 'activo', null, 'Cliente OAuth "Tankily web", marca verificada y publicada. Separado del proyecto de Flox. Queda por borrar el proyecto duplicado inicio-sesion-512107.'),
 (60, 'acceso', 'Apple Developer', 'Botón "Continuar con Apple" (App ID com.tankily.app, Services ID com.tankily.web).', 'https://developer.apple.com/account', 'Cuenta personal (equipo 839J8P4YP6)', '99 $/año', 'activo', '2027-04-17', 'El secreto de Apple caduca cada 6 meses: node scripts/secreto_apple.mjs con la clave .p8 (guardada fuera del repositorio) y pégalo en Supabase → Auth → Apple.'),
 (70, 'seo', 'Google Search Console', 'Cómo aparece Tankily en Google: búsquedas, clics, errores de indexación y sitemap.', 'https://search.google.com/search-console?resource_id=sc-domain:tankily.com', 'Cuenta personal', 'Gratis', 'activo', null, 'Propiedad de dominio verificada por DNS (registro TXT en Hostinger).'),
 (80, 'seo', 'Bing Webmaster Tools', 'Indexación en Bing, DuckDuckGo, Yahoo, Ecosia y en las búsquedas de Copilot y ChatGPT.', 'https://www.bing.com/webmasters?siteUrl=https://tankily.com/', 'Cuenta personal (importada de Search Console)', 'Gratis', 'activo', null, 'Pendiente opcional: IndexNow para avisar al instante de páginas nuevas.'),
 (90, 'analitica', 'Umami Cloud', 'Visitas, procedencia, países, dispositivos y eventos (registro, tanque creado, push…). Sin cookies.', 'https://cloud.umami.is/analytics/eu/websites/a691d5e4-0df3-46f7-89c3-4f0802a1987a', 'Cuenta personal', 'Gratis (Hobby: 100.000 eventos/mes)', 'activo', null, 'Embudos "Registro" y "Activación" y 3 objetivos creados. El enganche por usuario está en Administración → Crecimiento.'),
 (100, 'pagos', 'Ko-fi', 'Donaciones ("invítame a un café") desde /apoyar/.', 'https://ko-fi.com/manage/supportreceived', 'Cuenta de Tankily', 'Sin comisión de Ko-fi en donaciones (solo la de Stripe)', 'activo', null, 'ko-fi.com/tankily: 3 € el café, mínimo 2 €, sin donaciones mensuales.'),
 (110, 'pagos', 'Stripe (cuenta Tankily)', 'Cobros de Ko-fi con tarjeta, Apple Pay y Google Pay. Más adelante, el plan Pro de tiendas.', 'https://dashboard.stripe.com', 'Cuenta personal, separada de Fycheo.es', 'Comisión por pago (~1,5 % + 0,25 € en tarjetas europeas)', 'activo', null, 'Persona física, transferencias manuales (el dinero se queda en Stripe hasta que lo pases). Radar Lite: si aparecen muchas donaciones mínimas sospechosas, pasar a Standard.'),
 (115, 'pagos', 'PayPal', 'Donaciones por PayPal en Ko-fi.', null, null, null, 'descartado', null, 'Decidido no usarlo: Stripe cubre tarjeta, Apple Pay y Google Pay.'),
 (120, 'traduccion', 'DeepL API Free', 'Traducción de publicaciones, comentarios y foro (función traducir), con caché compartida.', 'https://www.deepl.com/your-account/keys', 'Cuenta personal (una clave por proyecto)', 'Gratis: 500.000 caracteres/mes compartidos entre proyectos', 'pendiente', null, 'Clave "Tankily" en el secreto DEEPL_API_KEY. Mientras no esté, se usa MyMemory.'),
 (125, 'traduccion', 'MyMemory', 'Traductor de respaldo cuando no hay clave de DeepL.', 'https://mymemory.translated.net', 'Sin cuenta', 'Gratis (~5.000 caracteres/día)', 'activo', null, null),
 (130, 'otros', 'Google AdSense', 'Anuncios en la web.', 'https://adsense.google.com', null, null, 'pendiente', null, 'Pedir el alta cuando haya tráfico. Luego, variables NEXT_PUBLIC_ADSENSE_CLIENT y NEXT_PUBLIC_ADSENSE_SLOT en GitHub.'),
 (140, 'otros', 'Notificaciones push (Web Push)', 'Avisos en móvil y ordenador. Usa los servicios de Google, Apple y Mozilla, sin cuenta.', null, 'Sin cuenta', 'Gratis', 'activo', null, 'Claves VAPID en los secretos de Supabase y la pública en src/lib/clavePush.js. No cambiarlas: anularía todas las suscripciones.');
