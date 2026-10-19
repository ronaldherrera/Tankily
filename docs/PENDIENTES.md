# Tareas pendientes para ti

Cosas que no puedo hacer yo porque necesitan tus cuentas, tus datos, dinero o tu aprobación. Ordenadas por prioridad. Marca `[x]` al terminar.

---

## 🔴 Antes de publicar (bloqueantes)

- [x] **Revisar y aprobar el commit.** Todo el trabajo está sin commit. Cuando lo revises, dime "haz el commit" y lo hago (y el push, que despliega a Hostinger). Tras el push, mira en GitHub → Actions que el despliegue sale en verde: ahora, antes de publicar, pasa lint, textos, pruebas automáticas y comprobación de enlaces.
- [x] **Supabase → Authentication → URL Configuration**
  - Site URL: `https://tankily.com`
  - Redirect URLs: `https://tankily.com/**` y `http://localhost:3210/**`
  - Sin esto fallan la confirmación de email, la recuperación de contraseña, el enlace sin contraseña y el acceso con Google.
- [x] **Correo saliente propio (SMTP)** (18/10/2026): buzón `krill@tankily.com` en Hostinger (MX, SPF, DKIM y DMARC comprobados) y SMTP en Supabase (`smtp.hostinger.com:465`). Plantillas con la marca activadas y enlaces a tankily.com/…/verificar/: el correo de prueba llega a la bandeja principal (SPF, DKIM y DMARC en PASS). ~~ El correo de Supabase por defecto solo permite unos pocos emails por hora y suele acabar en spam. Contrata un servicio (Resend, Brevo, Postmark o el SMTP de Hostinger) con un remitente tipo `hola@tankily.com` y configúralo en Supabase → Authentication → Emails → SMTP Settings.~~
- [ ] **Borrar los datos de demostración** (19 usuarios inventados, sus tanques, reseñas, etc.):
      `npx supabase db query --linked -f supabase/demo/limpiar_demo.sql`
- [x] **Datos del titular en los textos legales** (19/10/2026): nombre y contacto (`hola@ronaldherrera.es`) puestos en `src/lib/titular.js`, en los 8 idiomas. **Al empezar a facturar**: alta censal (modelo 037) y rellenar ahí `nif` y `domicilio` (puede ser una oficina virtual); salen solos en el aviso legal y la privacidad. ~~**Datos del titular en los textos legales** (nombre o razón social, NIF/CIF, dirección, email) en `src/i18n/textos/legal.js`. Mejor si los revisa un abogado.~~
- [ ] **Política de privacidad** (19/10/2026: ya incluye en los 8 idiomas Supabase, Hostinger —web y correo—, MyMemory/DeepL y AdSense; incluye también el acceso con Google; falta que la revise un profesional): hay un borrador listo en `docs/borrador-privacidad.md` (revísalo, mejor con un abogado). Cubre:
  - Proveedor de traducción (MyMemory y/o DeepL) como encargado del tratamiento.
  - Acceso con Google, Apple, Facebook y Microsoft: qué datos recibimos (nombre, email, foto).
  - Google AdSense y su CMP (cuando lo actives).
- [x] **Borrar `public/propuestas-logo.html`** si ya no la necesitas (si no, se publicará). Dímelo y lo quito.

## 🟠 Primeras semanas

- [ ] **⏰ Renovar el secreto de "Iniciar sesión con Apple" antes del 17 de abril de 2027** (Apple lo hace caducar cada 6 meses; si caduca, nadie podrá entrar con Apple). `node scripts/secreto_apple.mjs "ruta\AuthKey_J96R4VKA2Y.p8"` y pegar el resultado en Supabase → Authentication → Providers → Apple → Secret Key. Datos: equipo 839J8P4YP6, clave J96R4VKA2Y, Services ID `com.tankily.web`, App ID `com.tankily.app`.

- [ ] **Logo de Tankily en el avatar de los correos** (Gmail): crear una cuenta de Google con `krill@tankily.com` (Nombre: Tankily, sin apellidos) y subir `public/icons/icon-512.png` como foto. El 18/10/2026 falló la verificación por SMS ("no entregado"): reintentar otro día o con otro móvil. Mientras, Gravatar (gravatar.com) con la misma dirección y el mismo logo.

- [x] **Donaciones ("invítame a un café")** (19/10/2026): ko-fi.com/tankily con Stripe propio (cuenta nueva, transferencias manuales; sin PayPal, decidido), 3 € el café, sin mensuales; enlazado en `/apoyar/`.
  1. Crea la cuenta en [ko-fi.com](https://ko-fi.com) (sin comisión en donaciones sueltas; Buy Me a Coffee cobra un 5 %) y conecta PayPal y/o Stripe para cobrar.
  2. En la página de Ko-fi: moneda en euros, precio del "café" (p. ej. 3 €), activa las donaciones mensuales y, si quieres, una meta ("servidor de este año").
  3. Pásame el enlace (tipo `ko-fi.com/tankily`) y lo pongo en `src/lib/apoyo.js`.
  4. Lo que entre cuenta como ingreso de la actividad: coméntalo con tu gestor y menciónalo en el aviso legal.

- [x] **Acceso con Google** (19/10/2026): proyecto de Google Cloud `tankily` (no el de Flox), cliente "Tankily web", app publicada en producción y activada en Supabase. Apple, Facebook y Microsoft siguen pendientes. ~~**Acceso con cuentas externas**: guía paso a paso en `docs/acceso-con-cuentas-externas.md`. Empieza por Google (gratis, 15 min). Apple cuesta 99 $/año.~~
- [x] **Traducción de más calidad** (20/10/2026): DeepL activo (plan Developer: crédito único de 1 M de caracteres, no mensual). Si se agota o falla, la función `traducir` pasa sola a MyMemory. ~~**Traducción de más calidad**: clave gratuita de DeepL API Free y~~
      `npx supabase secrets set DEEPL_API_KEY=tu_clave --project-ref ivizkgmogzvscygcxepy`
      (hoy traduce MyMemory, gratis pero limitado a ~5.000 caracteres/día).
- [ ] **Google AdSense**: alta de la web, verificación del dominio y variables `NEXT_PUBLIC_ADSENSE_CLIENT` y `NEXT_PUBLIC_ADSENSE_SLOT` en GitHub → Settings → Secrets and variables → Actions → Variables. `ads.txt` se genera solo.
- [x] **Google Search Console** (19/10/2026): `tankily.com` verificado por DNS (TXT en Hostinger), sitemap enviado y marca de la app de Google verificada y publicada (la pantalla de Google dice "Tankily"). Falta Bing Webmaster Tools (se puede importar desde Search Console). ~~**Google Search Console** (y Bing Webmaster Tools): verificar `tankily.com` y enviar `https://tankily.com/sitemap.xml`.~~
- [ ] **Revisión nativa de las traducciones** de la interfaz (de, pt, fr, it, nl, pl): están hechas, pero no revisadas por hablantes nativos.
- [ ] **Plan Pro para tiendas**: decidir precios por país/moneda y darte de alta en Stripe para cobrar. Hoy el Pro se activa a mano desde Supabase.

## 🟡 Cuando haya tráfico

- [x] **Analítica** (19/10/2026): hecho el panel **Admin → Crecimiento** (activos día/7/30, embudo de activación, altas por semana, retención por semana de registro; tabla `actividad_diaria`) y preparado Umami (script + eventos: registro, acceso_social, tanque_creado, publicacion, hilo, respuesta_foro, anuncio, push_activado, instalar_app, apoyar). Política de privacidad actualizada en 8 idiomas. Umami activo (cuenta en cloud.umami.is, ID en `src/lib/analitica.js`). ~~**Analítica respetuosa con la privacidad** (Plausible, Umami o similar) para saber qué páginas funcionan. Dime cuál y la integro.~~
- [ ] **Redes sociales de Tankily** (Instagram, TikTok, Facebook, X) con el logo y el manual de marca (`marca/manual-de-marca.html`).
- [x] **Valorar Vercel u otro hosting con servidor** (descartado de momento: las páginas propias se generan en el build nocturno). ~~**Valorar Vercel u otro hosting con servidor** para que cada tanque, hilo y anuncio tenga una URL indexable por Google (hoy usan `?id=` y no se indexan bien).~~
- [x] **Apple Developer** (ya activo: "Continuar con Apple" funciona desde el 19/10/2026) (99 $/año) si quieres "Continuar con Apple" o, más adelante, app de iOS.

---

_Lista generada por Claude. Lo que vaya surgiendo mientras trabajo se añade abajo._

## Añadido durante la sesión de noche

- [x] **Hacerte administrador** (18/10/2026, `ronald.herrera`) para usar el nuevo panel `/admin/` (resumen, denuncias, tiendas Pro y verificación, campañas). Cuando tengas tu cuenta creada en la web, ejecuta (cambiando `tu_usuario`):
      `npx supabase db query --linked "update perfiles set es_admin = true where usuario = 'tu_usuario'"`
      Aparecerá "Admin" en el menú lateral.
- [x] **Contraseñas** (18/10/2026): mínimo 8 con mayúsculas, minúsculas y números; la web valida lo mismo. La protección contra contraseñas filtradas solo existe en el plan Pro de Supabase: activarla si algún día se cambia de plan.
- [x] **WikiTank en inglés, alemán y francés** (20/10/2026): 121 artículos traducidos con DeepL (~671.000 caracteres del crédito único), guardados bloque a bloque en `WikiTank-traducciones/<idioma>.json` (solo se retraduce lo que cambie: `node --import ./tests/resolver.mjs scripts/traducir_wiki.mjs --prueba` y luego con `DEEPL_API_KEY`). Indexables, con hreflang entre es/en/de/fr y en el sitemap. Las páginas de grupos de especies siguen en español (las fichas ya están en todos los idiomas). Portugués, italiano, neerlandés y polaco: pendiente de crédito (~224.000 caracteres cada uno).
- [x] **IndexNow (Bing)** (20/10/2026): tras cada publicación se avisa de las páginas nuevas o cambiadas (`scripts/indexnow.mjs`, clave en `public/82f5….txt`).
- [x] **Aviso al autor de su contenido oculto** (20/10/2026): etiqueta "Oculto · en revisión" en publicaciones, comentarios, hilos, respuestas y anuncios ocultados por denuncias.
- [x] **Páginas propias para cada tanque, hilo y anuncio (SEO)** (20/10/2026): `/es/tanque/<nombre>-<id>/`, `/es/foro/hilo/<titulo>-<id>/` y `/es/mercado/anuncio/<titulo>-<id>/`, solo en el idioma del contenido (columna `idioma`; ~10 archivos por elemento), con el contenido en el HTML, datos estructurados (DiscussionForumPosting, Product) y en el sitemap. Se regeneran cada noche (deploy.yml, 3:30 UTC). Los enlaces internos siguen con `?id=`. Código: `src/lib/paginasPublicas.js`, `src/components/paginas/`. ~~**Decidir: páginas propias para cada tanque, hilo y anuncio (SEO).** Hoy un tanque se abre como `/tanque/?id=…`: para Google todas esas direcciones son la misma página, así que no indexa tanques, hilos del foro ni anuncios uno a uno (sí lo hace con la wiki, las calculadoras y las secciones). La solución es generar en cada publicación una página fija por contenido público (`/tanque/arrecife-del-salon-123/`) leyendo Supabase durante el build, y volver a publicar automáticamente cada noche con GitHub Actions para incluir lo nuevo. Es un cambio de arquitectura de un par de días y **no obliga a cambiar de hosting** (alternativa al punto "Valorar Vercel" de arriba). Te lo propongo para cuando la comunidad tenga contenido real. Dime si lo hago.~~
- [ ] **(Opcional) Limpiar la plantilla de los .md de WikiTank.** 30 archivos de grupos de especies (p. ej. `WikiTank/Acuarios/Acuario marino — arrecife de coral (reef)/Especies habituales/Corales/Corales.md`) empiezan con "## ESTRUCTURA DE FICHA …", una plantilla para redactar. La web ya la oculta al mostrar la página, así que no corre prisa; si la quitas de los archivos, el ocultado simplemente deja de tener efecto.
- [x] **Emails de la cuenta con la marca y en el idioma del usuario.** (activadas el 18/10/2026) Están listos en `supabase/plantillas/` (confirmación, nueva contraseña, enlace para entrar y cambio de email), en los 8 idiomas: cada uno elige el idioma con el que se registró el usuario y, si no lo sabe, va en español. Para activarlos: Supabase → Authentication → Emails → Templates, y en cada tipo pega el asunto y el HTML:
  - _Confirm signup_ → `confirmacion.html`, asunto "Confirma tu cuenta · Confirm your account — Tankily"
  - _Reset password_ → `recuperacion.html`, asunto "Nueva contraseña · New password — Tankily"
  - _Magic link_ → `enlace.html`, asunto "Tu enlace para entrar · Your sign-in link — Tankily"
  - _Change email address_ → `cambio_email.html`, asunto "Confirma tu nuevo email · Confirm your new email — Tankily"
    Hazlo después de publicar la web (el logo del email se carga de tankily.com) y, mejor, con el SMTP propio ya configurado. Para cambiar un texto: edita `supabase/plantillas/textos.json` y ejecuta `node scripts/generar_plantillas_email.mjs`.

## 💡 Propuestas que necesitan tu decisión (no las he hecho)

- [x] **Ocultar automáticamente lo muy denunciado** (hecho el 19/10/2026: con 5 denuncias de personas distintas; se vuelve a mostrar desde Admin): si una publicación, hilo o anuncio recibe, por ejemplo, 3 denuncias de usuarios distintos, se oculta hasta que lo revises en `/admin/`. Protege la comunidad de noche y en fines de semana. ¿Con cuántas denuncias?
- [x] **Avisos por email** (activos desde el 19/10/2026, probado: el correo llega): mensajes nuevos y respuestas del foro (cada 15 min, solo lo que sigue sin leer pasados 10 min, máx. 1 correo por tipo y hora) y resumen semanal opcional los lunes (pendientes + tareas de mantenimiento). Preferencias y baja en `/avisos/` (enlace en Ajustes y en cada correo, más baja de un clic en Gmail). Piezas: migración `20261019120000_avisos_email.sql` (tabla `avisos_email`, pg_cron + pg_net), Edge Function `avisos`. Nunca escribe a las cuentas demo (`*.invalid`). Para activarlo:
  1. `npx supabase secrets set SMTP_PASS="<contraseña de krill@tankily.com>" --project-ref ivizkgmogzvscygcxepy`
  2. `node scripts/clave_avisos.mjs` (crea la clave entre pg_cron y la función, sin mostrarla)
  ~~"te han respondido en el foro", "tienes un mensaje", y un resumen semanal opcional.~~
- [x] **Recordatorios de mantenimiento y empujón de activación** (19/10/2026): cada día a las 7:00 UTC, email y/o push con las tareas que vencen (cada vencimiento avisa una vez) y un único email a quien a los 2 días no ha creado su tanque. Interruptores en `/avisos/`. Migraciones `20261019170000_recordatorios.sql` y `20261019180000_baja_recordatorios.sql`; nombres de tareas copiados con `scripts/textos_push.mjs`.
- [x] **Notificaciones push** (activas desde el 19/10/2026; claves VAPID creadas, envío comprobado. En el PC de Ronald Windows no las mostraba: revisar Configuración → Notificaciones si hiciera falta): al momento, para mensajes, respuestas del foro y actividad (comentarios, menciones, ecos, reseñas, seguidores; los "me gusta" no). Se activan por dispositivo en `/avisos/`; en iPhone/iPad solo desde la app instalada (iOS 16.4+). Piezas: migración `20261019140000_notificaciones_push.sql` (tabla `push_suscripciones`, triggers en `mensajes` y `notificaciones`), Edge Function `push` (textos copiados de la web con `scripts/textos_push.mjs`), `public/sw.js`, `src/lib/push.js`. ~~en la app instalada para mensajes y respuestas (necesita claves de envío; gratis).~~
- [ ] **Límites del freno antispam**: los he puesto holgados (punto 40 del informe). Si en la práctica alguien legítimo choca con ellos, se suben en un minuto.
- [ ] **(Contenido de WikiTank) Salinidad de las fichas marinas.** Muchas fichas dan 1,023–1,025 de densidad (≈31–33 ppt), algo por debajo de los ~35 ppt (1,026) habituales en reef. La web ya lo tolera (punto 45 del informe), pero si quieres que el "agua ideal" que muestra coincida con la práctica, habría que revisar esos rangos en los .md (yo no los toco).
- [x] **(Contenido) Más especies en WikiTank.** (19/10/2026: el catálogo ya tiene 1.848 especies, con ficha en los 8 idiomas.) ~~**(Contenido) Más especies en WikiTank.** Hoy hay 167 fichas de especie (Fishipedia, 2.314). Cada ficha nueva que añadas en una carpeta "Especies habituales" (con el formato de siempre: `### Nombre común (Nombre científico)`, foto y líneas `**Campo**: valor`) aparece sola en el catálogo, con su página, en el buscador y en las herramientas. Si quieres, puedo **redactarte borradores** de fichas nuevas (las especies más buscadas que faltan) para que tú los revises y los añadas; no los meto yo en la wiki.~~

## 📱 Ver la web desde fuera de casa

Antes de salir, haz **doble clic en `ver-desde-fuera.cmd`** (en la carpeta del proyecto). Genera la web (un minuto) y muestra un enlace `https://….trycloudflare.com/es/` que puedes abrir desde el móvil o el trabajo. Deja el ordenador encendido y sin suspender; para cerrarlo, cierra esa ventana. El enlace cambia cada vez y deja de funcionar al cerrarla. No lo compartas. También puedes pedirme "abre el túnel" y te paso el enlace.
