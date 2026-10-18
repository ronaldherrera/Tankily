# Tareas pendientes para ti

Cosas que no puedo hacer yo porque necesitan tus cuentas, tus datos, dinero o tu aprobación. Ordenadas por prioridad. Marca `[x]` al terminar.

---

## 🔴 Antes de publicar (bloqueantes)

- [x] **Revisar y aprobar el commit.** Todo el trabajo está sin commit. Cuando lo revises, dime "haz el commit" y lo hago (y el push, que despliega a Hostinger). Tras el push, mira en GitHub → Actions que el despliegue sale en verde: ahora, antes de publicar, pasa lint, textos, pruebas automáticas y comprobación de enlaces.
- [x] **Supabase → Authentication → URL Configuration**
  - Site URL: `https://tankily.com`
  - Redirect URLs: `https://tankily.com/**` y `http://localhost:3210/**`
  - Sin esto fallan la confirmación de email, la recuperación de contraseña, el enlace sin contraseña y el acceso con Google.
- [x] **Correo saliente propio (SMTP)** (18/10/2026): buzón `krill@tankily.com` en Hostinger (MX, SPF, DKIM y DMARC comprobados) y SMTP en Supabase (`smtp.hostinger.com:465`). Pendiente: probar el envío y activar las plantillas con la marca. ~~ El correo de Supabase por defecto solo permite unos pocos emails por hora y suele acabar en spam. Contrata un servicio (Resend, Brevo, Postmark o el SMTP de Hostinger) con un remitente tipo `hola@tankily.com` y configúralo en Supabase → Authentication → Emails → SMTP Settings.~~
- [ ] **Borrar los datos de demostración** (19 usuarios inventados, sus tanques, reseñas, etc.):
      `npx supabase db query --linked -f supabase/demo/limpiar_demo.sql`
- [ ] **Datos del titular en los textos legales** (nombre o razón social, NIF/CIF, dirección, email) en `src/i18n/textos/legal.js`. Mejor si los revisa un abogado.
- [ ] **Política de privacidad**: hay un borrador listo en `docs/borrador-privacidad.md` (revísalo, mejor con un abogado). Cubre:
  - Proveedor de traducción (MyMemory y/o DeepL) como encargado del tratamiento.
  - Acceso con Google, Apple, Facebook y Microsoft: qué datos recibimos (nombre, email, foto).
  - Google AdSense y su CMP (cuando lo actives).
- [x] **Borrar `public/propuestas-logo.html`** si ya no la necesitas (si no, se publicará). Dímelo y lo quito.

## 🟠 Primeras semanas

- [ ] **Donaciones ("invítame a un café")**: la página `/apoyar/` y su enlace en el menú ya están hechos, con el botón en "Muy pronto".
  1. Crea la cuenta en [ko-fi.com](https://ko-fi.com) (sin comisión en donaciones sueltas; Buy Me a Coffee cobra un 5 %) y conecta PayPal y/o Stripe para cobrar.
  2. En la página de Ko-fi: moneda en euros, precio del "café" (p. ej. 3 €), activa las donaciones mensuales y, si quieres, una meta ("servidor de este año").
  3. Pásame el enlace (tipo `ko-fi.com/tankily`) y lo pongo en `src/lib/apoyo.js`.
  4. Lo que entre cuenta como ingreso de la actividad: coméntalo con tu gestor y menciónalo en el aviso legal.

- [ ] **Acceso con cuentas externas**: guía paso a paso en `docs/acceso-con-cuentas-externas.md`. Empieza por Google (gratis, 15 min). Apple cuesta 99 $/año.
- [ ] **Traducción de más calidad**: clave gratuita de DeepL API Free y
      `npx supabase secrets set DEEPL_API_KEY=tu_clave --project-ref ivizkgmogzvscygcxepy`
      (hoy traduce MyMemory, gratis pero limitado a ~5.000 caracteres/día).
- [ ] **Google AdSense**: alta de la web, verificación del dominio y variables `NEXT_PUBLIC_ADSENSE_CLIENT` y `NEXT_PUBLIC_ADSENSE_SLOT` en GitHub → Settings → Secrets and variables → Actions → Variables. `ads.txt` se genera solo.
- [ ] **Google Search Console** (y Bing Webmaster Tools): verificar `tankily.com` y enviar `https://tankily.com/sitemap.xml`.
- [ ] **Revisión nativa de las traducciones** de la interfaz (de, pt, fr, it, nl, pl): están hechas, pero no revisadas por hablantes nativos.
- [ ] **Plan Pro para tiendas**: decidir precios por país/moneda y darte de alta en Stripe para cobrar. Hoy el Pro se activa a mano desde Supabase.

## 🟡 Cuando haya tráfico

- [ ] **Analítica respetuosa con la privacidad** (Plausible, Umami o similar) para saber qué páginas funcionan. Dime cuál y la integro.
- [ ] **Redes sociales de Tankily** (Instagram, TikTok, Facebook, X) con el logo y el manual de marca (`marca/manual-de-marca.html`).
- [ ] **Valorar Vercel u otro hosting con servidor** para que cada tanque, hilo y anuncio tenga una URL indexable por Google (hoy usan `?id=` y no se indexan bien).
- [ ] **Apple Developer** (99 $/año) si quieres "Continuar con Apple" o, más adelante, app de iOS.

---

_Lista generada por Claude. Lo que vaya surgiendo mientras trabajo se añade abajo._

## Añadido durante la sesión de noche

- [x] **Hacerte administrador** (18/10/2026, `ronald.herrera`) para usar el nuevo panel `/admin/` (resumen, denuncias, tiendas Pro y verificación, campañas). Cuando tengas tu cuenta creada en la web, ejecuta (cambiando `tu_usuario`):
      `npx supabase db query --linked "update perfiles set es_admin = true where usuario = 'tu_usuario'"`
      Aparecerá "Admin" en el menú lateral.
- [x] **Contraseñas** (18/10/2026): mínimo 8 con mayúsculas, minúsculas y números; la web valida lo mismo. La protección contra contraseñas filtradas solo existe en el plan Pro de Supabase: activarla si algún día se cambia de plan.
- [ ] **Decidir: páginas propias para cada tanque, hilo y anuncio (SEO).** Hoy un tanque se abre como `/tanque/?id=…`: para Google todas esas direcciones son la misma página, así que no indexa tanques, hilos del foro ni anuncios uno a uno (sí lo hace con la wiki, las calculadoras y las secciones). La solución es generar en cada publicación una página fija por contenido público (`/tanque/arrecife-del-salon-123/`) leyendo Supabase durante el build, y volver a publicar automáticamente cada noche con GitHub Actions para incluir lo nuevo. Es un cambio de arquitectura de un par de días y **no obliga a cambiar de hosting** (alternativa al punto "Valorar Vercel" de arriba). Te lo propongo para cuando la comunidad tenga contenido real. Dime si lo hago.
- [ ] **(Opcional) Limpiar la plantilla de los .md de WikiTank.** 30 archivos de grupos de especies (p. ej. `WikiTank/Acuarios/Acuario marino — arrecife de coral (reef)/Especies habituales/Corales/Corales.md`) empiezan con "## ESTRUCTURA DE FICHA …", una plantilla para redactar. La web ya la oculta al mostrar la página, así que no corre prisa; si la quitas de los archivos, el ocultado simplemente deja de tener efecto.
- [ ] **Emails de la cuenta con la marca y en el idioma del usuario.** Están listos en `supabase/plantillas/` (confirmación, nueva contraseña, enlace para entrar y cambio de email), en los 8 idiomas: cada uno elige el idioma con el que se registró el usuario y, si no lo sabe, va en español. Para activarlos: Supabase → Authentication → Emails → Templates, y en cada tipo pega el asunto y el HTML:
  - _Confirm signup_ → `confirmacion.html`, asunto "Confirma tu cuenta · Confirm your account — Tankily"
  - _Reset password_ → `recuperacion.html`, asunto "Nueva contraseña · New password — Tankily"
  - _Magic link_ → `enlace.html`, asunto "Tu enlace para entrar · Your sign-in link — Tankily"
  - _Change email address_ → `cambio_email.html`, asunto "Confirma tu nuevo email · Confirm your new email — Tankily"
    Hazlo después de publicar la web (el logo del email se carga de tankily.com) y, mejor, con el SMTP propio ya configurado. Para cambiar un texto: edita `supabase/plantillas/textos.json` y ejecuta `node scripts/generar_plantillas_email.mjs`.

## 💡 Propuestas que necesitan tu decisión (no las he hecho)

- [ ] **Ocultar automáticamente lo muy denunciado**: si una publicación, hilo o anuncio recibe, por ejemplo, 3 denuncias de usuarios distintos, se oculta hasta que lo revises en `/admin/`. Protege la comunidad de noche y en fines de semana. ¿Con cuántas denuncias?
- [ ] **Avisos por email** (necesita el SMTP propio): "te han respondido en el foro", "tienes un mensaje", y un resumen semanal opcional con la actividad de los tanques que sigues. Es lo que más hace volver a la gente.
- [ ] **Notificaciones push** en la app instalada para mensajes y respuestas (necesita claves de envío; gratis).
- [ ] **Límites del freno antispam**: los he puesto holgados (punto 40 del informe). Si en la práctica alguien legítimo choca con ellos, se suben en un minuto.
- [ ] **(Contenido de WikiTank) Salinidad de las fichas marinas.** Muchas fichas dan 1,023–1,025 de densidad (≈31–33 ppt), algo por debajo de los ~35 ppt (1,026) habituales en reef. La web ya lo tolera (punto 45 del informe), pero si quieres que el "agua ideal" que muestra coincida con la práctica, habría que revisar esos rangos en los .md (yo no los toco).
- [ ] **(Contenido) Más especies en WikiTank.** Hoy hay 167 fichas de especie (Fishipedia, 2.314). Cada ficha nueva que añadas en una carpeta "Especies habituales" (con el formato de siempre: `### Nombre común (Nombre científico)`, foto y líneas `**Campo**: valor`) aparece sola en el catálogo, con su página, en el buscador y en las herramientas. Si quieres, puedo **redactarte borradores** de fichas nuevas (las especies más buscadas que faltan) para que tú los revises y los añadas; no los meto yo en la wiki.

## 📱 Ver la web desde fuera de casa

Antes de salir, haz **doble clic en `ver-desde-fuera.cmd`** (en la carpeta del proyecto). Genera la web (un minuto) y muestra un enlace `https://….trycloudflare.com/es/` que puedes abrir desde el móvil o el trabajo. Deja el ordenador encendido y sin suspender; para cerrarlo, cierra esa ventana. El enlace cambia cada vez y deja de funcionar al cerrarla. No lo compartas. También puedes pedirme "abre el túnel" y te paso el enlace.
