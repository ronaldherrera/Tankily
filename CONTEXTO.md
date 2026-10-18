# ESTADO ACTUAL DEL PROYECTO: TANKILY

Resumen técnico y funcional para sincronizar personas o modelos de IA. Actualizado el 13/10/2026 (compatibilidad, mantenimiento, calculadoras y SEO).

## Qué es
Red social y herramienta de gestión para acuariofilia, **pensada para todo el mundo**: español, inglés, alemán, portugués (Brasil), francés, italiano, neerlandés y polaco. **Todo gira en torno a los tanques**: cada usuario tiene varios acuarios o estanques, con habitantes, mediciones del agua y diario de mantenimiento. Alrededor: muro social, foro, compraventa entre aficionados, directorio de tiendas y la enciclopedia WikiTank. Compite con TodoMarino, Reef2Reef y foros similares. Se monetiza con publicidad (campañas propias + AdSense), un plan Pro para tiendas y, más adelante, afiliados.

## Stack
- Next.js 16 (App Router) con **export estático** (`output: 'export'`), desplegado en Hostinger por FTP con GitHub Actions al hacer push a `main`.
- Supabase (proyecto `ivizkgmogzvscygcxepy`): auth, Postgres con RLS en todas las tablas, Storage (bucket `media`) y Realtime.
- CSS propio en `src/app/globals.css` (+ `src/app/[lang]/wiki/wiki.css`) y `lucide-react`. Fuentes: Bricolage Grotesque (títulos) y Geist (texto).

## Idiomas, unidades y países
- **Rutas por idioma**: todo vive en `src/app/[lang]/` (`/es/`, `/en/`, `/de/`, `/pt/`, `/fr/`, `/it/`, `/nl/`, `/pl/`). Lista en `src/i18n/config.js`. El layout raíz está ahí (`<html lang>` correcto por idioma). La raíz `/` (`src/app/(raiz)/`) redirige al idioma guardado o al del navegador. Las URLs inexistentes van a `src/app/global-not-found.js`. En Hostinger, `.htaccess` redirige las URLs antiguas sin idioma a `/es/…`.
- **Textos**: nunca escritos en el JSX. Español e inglés van en `src/i18n/textos/<sección>.js` (objetos `es` y `en`); el resto de idiomas, en un archivo completo por idioma en `src/i18n/idiomas/<código>.js`. Al añadir una clave nueva hay que añadirla en todos (`npm run i18n` avisa) y se usan con `const { t } = useT()` → `t('foro.titulo')`, `t('perfil.tanques', { n })` (plurales `{ uno, otros }` y, en polaco, también `pocos`/`muchos`; se elige con Intl.PluralRules). En componentes de servidor: `traducir(lang, clave)`.
- **Enlaces**: importar `Link` de `@/components/Enlace` (añade el prefijo de idioma) y `useNavegar()` en lugar de `useRouter()`.
- **Catálogos** (`src/lib/constantes.js`) guardan solo claves; los nombres visibles salen del diccionario (`tipos.<clave>`, `parametros.<clave>`, `mercado.categorias.<clave>`…).
- **Unidades**: en la base de datos siempre métrico (litros, cm, °C). `useUnidades()` (`src/lib/unidades.js`) convierte para mostrar y al guardar. Preferencia por usuario (métrico/imperial) en Ajustes y en "Más"; por defecto imperial solo si el navegador está en en-US.
- **Ubicación**: `pais` (ISO alfa-2) + `provincia` (provincia en España, región en texto libre fuera) en perfiles, anuncios y tiendas. Componente `SelectorUbicacion`. Anuncios con `moneda`. Nombres de país con `Intl.DisplayNames` (solo en el navegador, para evitar errores de hidratación).
- **Fechas y números** con el locale del idioma (`src/lib/formatRelativeTime.js`).
- **WikiTank en otros idiomas**: de momento muestra el contenido en español con un aviso, `noindex` y canónica a `/es/`. Traducir los Markdown es la fase 3.
- **Funciones nuevas con los 8 idiomas juntos**: `src/i18n/textos/cuidado.js` (compatibilidad, tareas, panel Hoy) y `src/i18n/textos/herramientas.js` (calculadoras) exportan `es…pl` en el mismo archivo; `diccionarios.js` los mezcla (`MULTI`). Para funciones nuevas, mejor este formato.
- **Añadir un idioma**: código en `IDIOMAS`/`LOCALES`/`NOMBRES_IDIOMA` (`src/i18n/config.js`), archivo `src/i18n/idiomas/<código>.js` copiando la estructura y registrarlo en `src/i18n/diccionarios.js`. `node scripts/comparar_idioma.mjs <código>` lista las claves que faltan.

## Reglas importantes
- Export estático = sin rutas dinámicas en tiempo de ejecución. Los detalles usan parámetros de consulta: `/tanque/?id=`, `/u/?n=`, `/post/?id=`, `/foro/hilo/?id=`, `/mercado/anuncio/?id=`, `/tiendas/tienda/?s=`. Toda página que use `useSearchParams` va envuelta en `<Suspense>`.
- Esquema versionado en `supabase/migrations/`. El prototipo anterior está archivado en el esquema `prototipo` (no expuesto por la API).
- Campos sensibles protegidos con permisos por columna: `perfiles.es_admin`, `tiendas.plan/verificada/pro_hasta`, `anuncios.destacado`, `foro_hilos.fijado/cerrado`. Solo se cambian con la service role (panel de Supabase o SQL).
- Las categorías del foro están en `FORO_CATEGORIAS` (código) y en la tabla `foro_categorias`: si se añade una, hay que tocar ambas y los diccionarios.

## Cuidado del tanque
- **Fichas técnicas**: `npm run especies` lee también las fichas de WikiTank (temperatura, pH, GH, salinidad, tamaño, litros mínimos, comportamiento, dificultad, reef safe, grupo mínimo) y las guarda en `especiesWiki.js` (campo `ficha`). Solo lectura: la wiki no se toca. Se ejecuta solo antes de cada build (`prebuild`), para que los buscadores no se queden con un índice viejo (pasó: tenían 516 especies con 1.848 en el catálogo).
- **Compatibilidad** (`src/lib/compatibilidad.js`, funciones puras): cruza habitantes entre sí y con la última medición del tanque. Detecta agua dulce/marina equivocada, especies no aptas para reef, rangos sin solape (temperatura, pH, GH, salinidad), mediciones fuera de rango (con tolerancia), litros insuficientes, grupos pequeños y agresivos con pacíficos. Se muestra en la pestaña Habitantes y como vista previa al añadir una especie.
- **Mantenimiento** (tabla `tareas`, privada del dueño; `src/lib/tareas.js`): tareas periódicas por tanque. El cambio de agua es una tarea virtual (frecuencia en `tanques.cambio_agua_cada_dias`, última vez = último evento del diario). Marcar "Hecho" apunta el evento en el diario. Un tanque nuevo nace con recordatorios sugeridos según su tipo. Panel **Hoy** en la portada con lo pendiente de todos los tanques.

## Traducción del contenido
Publicaciones, comentarios, hilos y respuestas guardan `idioma` (detectado al publicar con el detector de Chrome o, si no, el idioma de la interfaz). Si no coincide con el del lector se traduce (`src/lib/traduccion.js`, `TextoTraducible`) con "Traducido del francés · Ver original". Capas: caché local y tabla `traducciones` (lectura pública, escritura solo de la función) → traductor integrado de Chrome si el idioma ya está descargado → función `traducir` de Supabase (`supabase/functions/traducir`, solo traduce filas existentes): DeepL si hay secreto `DEEPL_API_KEY`; si no, la API gratuita de MyMemory (sin clave, ~5000 caracteres/día). Como mucho dos peticiones a la vez y un reintento → botón "Ver traducción". Las #etiquetas, @menciones y enlaces nunca se traducen.

## Calculadoras y SEO
- `/herramientas/` y `/herramientas/<especies|compatibilidad|volumen|cambio|co2|dureza|salinidad>/`: páginas de servidor, estáticas e indexables en 8 idiomas. Fórmulas en `src/lib/calculos.js`. La de compatibilidad (`CompatibilidadEspecies.js`, cargada con `next/dynamic` por el índice de especies) usa `analizarCompatibilidad` y acepta `?con=<nombre científico>` desde las fichas de WikiTank. "Qué especies" (`BuscadorEspecies.js`) usa `especiesQueEncajan` (también en `compatibilidad.js`, con pruebas).
- Tipos de tanque: `/tanques/<tipo>/` estáticas (`tanques/[tipo]/page.js`, `slugTipo`/`tipoDeSlug` en constantes; los chips son enlaces).
- Categorías del foro: `/foro/<slug>/` estáticas (`foro/[categoria]/page.js` + `CategoriaCliente.js`); `/foro/categoria/?c=` solo redirige.
- Secciones de cliente (tanques, foro, mercado, tiendas, wiki, explorar): `page.js` es un envoltorio de servidor con título/descripción/canónica (`seo.<sección>` en `textos/seo.js`) que pinta `<Sección>Cliente.js`. La portada va en el HTML estático; `data-sesion` (script del tema) la oculta a quien tiene sesión guardada.
- Canónica y hreflang con `alternativas(lang, ruta)` (`src/lib/seo.js`) en cada página indexable. **El layout no declara canónica** (si lo hace, todas las páginas heredan la de la portada).
- `sitemap.xml` y `robots.txt` generados en el build (`src/app/sitemap.js`, `src/app/robots.js`).

## Crecimiento y negocio
- **App instalable (PWA)**: `src/app/manifest.js`, iconos en `public/icons/` y `public/apple-touch-icon.png` (se regeneran con `node scripts/generar_iconos.mjs`). Imagen para compartir enlaces: `public/og.jpg`.
- **Primeros pasos** (`components/PrimerosPasos.js`): lista de bienvenida en la portada para usuarios nuevos; se marca sola.
- **WikiTank → usuarios**: en la ficha de cada especie, "Añadir a mi tanque" con comprobación de compatibilidad (`components/wiki/AnadirATanque.js`); sin sesión invita a registrarse.
- **Logros** (`components/perfil/Logros.js`): 12 insignias calculadas con datos públicos, pestaña en el perfil.
- **Panel de administración** `/admin/` (solo `perfiles.es_admin`): resumen, denuncias, tiendas (Pro y verificación por funciones `admin_*` de la base de datos) y campañas.
- **Estadísticas de tiendas** (tabla `tienda_visitas`, función `registrar_visita_tienda`): vistas de la ficha y clics en contacto y web; las tiendas Pro las ven en "Gestionar tienda".
- **Datos estructurados** (`lib/datosEstructurados.js`): organización y buscador en la portada, herramienta y migas en las calculadoras, artículo y migas en WikiTank (que además tiene meta descripción).
- **Acceso con cuentas externas y enlace sin contraseña**: ver `docs/acceso-con-cuentas-externas.md`.
- **Freno antispam** (migración `20261015100000_limite_frecuencia.sql`): trigger `limitar_frecuencia(columna, máximo, periodo)` en publicaciones, comentarios, hilos, respuestas, anuncios, mensajes, reseñas y denuncias; lanza `LIMITE_FRECUENCIA`, que la web traduce con `mensajeError` (`lib/errores.js`). Admins y procesos sin usuario no tienen límite.
- **Anuncios destacados**: la web usa el campo calculado `destacado_ahora` (admin o tienda con Pro vigente), no la columna `destacado`.
- **Ubicación del usuario** (`lib/ubicacion.js`): `useUbicacion()` (perfil o, si no, `paisProbable()` por zona horaria/idioma; sin GPS) y `usePaisInicial()` (filtro inicial por país en mercado y tiendas solo si hay resultados; "Ver todos" se recuerda en sessionStorage). También `components/tiendas/TiendasCerca.js` y las unidades por defecto.
- **Catálogo de especies de WikiTank**: `lib/catalogoEspecies.js` (solo servidor; lee en el build los .md de las carpetas "Especies habituales", une duplicados por nombre científico y resuelve formatos raros de cabecera con la foto) → `/wiki/especies/` (catálogo con filtros, `CatalogoCliente.js`) y `/wiki/especies/<slug>/` (página de la especie, `FichaEspecieContenido.js` pinta la ficha en el servidor). `lib/fichaEspecie.js` (lectura de campos) lo comparten el catálogo y `scripts/indexar_especies.mjs`, que añade `slug` a `especiesWiki.js` (ejecutar con `npm run especies`).
- **Fichas ampliadas** (`especies/<Peces|Plantas|Corales|Invertebrados>/<Grupo>.md`, mismo formato que la wiki): especies que no son «habituales» de ningún tipo de acuario. El catálogo las une a las de la wiki (si una especie está en las dos, manda la wiki) y el índice de herramientas también las recoge. Las fotos salen de Wikimedia Commons con licencia libre (`npm run especies:fotos` → `public/especies/<slug>.webp` y el crédito en `especies/fotos.json`, que la ficha muestra junto a la foto; las revisadas a ojo y descartadas van en `especies/fotos-descartadas.json`; `node scripts/especies/hoja.mjs recientes hoja.jpg [desde]` hace una hoja de contactos de 48 fotos para revisarlas; acepta también «todas» o un .txt con nombres de archivo. Hay que revisarlas siempre: Commons devuelve muchos dibujos antiguos, ejemplares de museo y conchas vacías). `npm run especies:validar` contrasta nombres y familias con GBIF y, en los peces, temperatura, pH y tamaño con FishBase (solo como referencia, su licencia no permite copiar; una petición cada 10 s y caché en `~/.cache/tankily-especies/`, fuera del proyecto). Tras añadir fichas: `npm run especies:validar`, `npm run especies:fotos` y `npm run especies`.
- **Distancia y envíos**: `lib/geo.js` (centros de las provincias de España, `distanciaKm`, `ordenarPorDistancia`, `aproximada` si se sitúa por provincia), `usePuntoUsuario()` en `lib/ubicacion.js` (perfil o "Usar mi ubicación", que solo se guarda en sessionStorage) y `components/OrdenCercania.js`. Tiendas con `lat`/`lng` desde su dirección (`lib/geocodificar.js`, Nominatim, al guardar). `envio_alcance` (provincia/pais/internacional) en anuncios y tiendas.
- **¿Es Pro?** Siempre con `esPro(tienda)` (`lib/tiendas.js`): `plan` sigue en 'pro' tras caducar `pro_hasta`. En SQL, `plan = 'pro' and (pro_hasta is null or pro_hasta >= current_date)`.
- **Invitación a registrarse** (`components/InvitacionRegistro.js`) en tanques y tiendas para visitantes; **errores**: `app/[lang]/error.js` y `components/ErrorCarga.js` (listas que no cargan).
- **Emails de la cuenta**: plantillas en `supabase/plantillas/` (generadas desde `textos.json` con `scripts/generar_plantillas_email.mjs`); el registro guarda `idioma` en los metadatos del usuario.

## Diseño
Oscuro abisal o claro (selector de tema), con cristal (`.cristal`, `.cristal-fijo`, `.cristal-refracta`; la refracción SVG solo en modales y fichas por rendimiento) sobre una luz de cáusticas estática. Cada tipo de tanque tiene un "color de agua" (`TIPOS_TANQUE`), y la interfaz se tiñe con él mediante `--agua`. Los colores son tokens por tema en `:root` / `:root[data-tema='claro']`.

## Mapa de la app (bajo /es/ y /en/)
- `/`: portada para visitantes + muro (Para ti / Siguiendo), con tiempo real.
- `/tanques/`, `/tanques/nuevo/` (`?id=` para editar), `/tanque/?id=`: resumen, parámetros con gráficas, habitantes (autocompletado desde WikiTank), diario y publicaciones.
- `/foro/`, `/foro/categoria/?c=`, `/foro/hilo/?id=` (votos y solución), `/foro/nuevo/`.
- `/mercado/`, `/mercado/anuncio/?id=`, `/mercado/nuevo/`. El contacto va por `/mensajes/`.
- `/tiendas/`, `/tiendas/tienda/?s=` (reseñas y JSON-LD), `/tiendas/gestionar/`, `/tiendas/pro/` (planes).
- `/herramientas/` (calculadoras).
- `/u/?n=`, `/perfil/editar/`, `/ajustes/` (tema, idioma, unidades, exportar datos y borrar cuenta), `/notificaciones/`, `/mensajes/`, `/explorar/`, `/legal/*`, `/wiki/`.

## Publicidad
`<Publicidad ubicacion="…">` muestra, por orden: una campaña de la tabla `campanas` (la gestiona un admin), AdSense (si hay `NEXT_PUBLIC_ADSENSE_CLIENT`/`_SLOT`; el consentimiento lo gestiona el CMP certificado de Google) o la autopromoción del plan Pro. `ads.txt` se genera en cada build.

## Scripts
- `npm run i18n`: comprueba que todas las claves usadas existen en todos los idiomas y que ambos diccionarios tienen las mismas claves. Ejecutar antes de cada commit.
- `npm run especies`: regenera `src/lib/especiesWiki.js` (índice de especies de WikiTank con sus fichas técnicas).
- **Movimiento** (`globals.css`, sección "Movimiento de la plataforma"): curvas `--muelle` (con rebote, para lo que llega o se pulsa) y `--muelle-suave` (para lo que se recoloca); `--hover` usa el muelle suave. Las listas y rejillas (`.rejilla-*`, `.lista-*`, `.catalogo-rejilla`…) entran en cascada solas al montarse; las publicaciones del muro, con `--i` desde Feed. Al cambiar de página, `#principal` hace un fundido con Web Animations (AppShell). Lo que se despliega dentro de la página lleva la clase `despliega` (crece desde 0 con `@starting-style` + `interpolate-size`). Pestañas con marca deslizante y `AlturaFluida` (ui.js) para contenedores que cambian de alto. Todo respeta `prefers-reduced-motion`. Para listas nuevas: usar una de esas clases o añadirla al selector.
- **Seguridad (revisión del 16–18/10/2026, migración `20261016120000_seguridad_privacidad.sql`)**: la función `traducir` lee el original con los permisos de quien pide (cliente anon + su Authorization) y usa la service role solo para la caché; comentarios y traducciones guardadas solo se ven si se puede ver la publicación; las reseñas solo editan `puntuacion` y `texto`; al editar publicaciones e hilos el tanque vinculado tiene que ser tuyo; `anon` no tiene permisos de escritura en ninguna tabla. Al crear tablas nuevas: RLS desde el principio y revisar los permisos por columna de UPDATE.
- **Nombres de usuario** (`lib/usuario.js` y `perfiles_usuario_check`): 3–20 caracteres, minúsculas, números, `_`, `.` y `-`; punto y guion nunca al principio ni al final ni dos seguidos. Las @menciones (`MENCION`, también en el trigger `tras_publicacion` y en `traducir`) no incluyen el punto o guion final de una frase.
- **Contraseñas**: mínimo 8 con mayúsculas, minúsculas y números, igual en Supabase Auth y en la web (`lib/contrasena.js`).
- **Menú "Más" del móvil**: no abre página; la barra inferior crece hacia arriba (`.barra-movil.abierta`, filas de rejilla 0fr→1fr con `--muelle-suave`) y muestra `components/shell/MenuMas.js`. Se cierra al tocar fuera, con Escape o al navegar. `/mas/` sigue existiendo para el enlace directo y usa el mismo componente.
- **Zonas seguras** (notch, barra de estado, barra de gestos): variables `--seg-arriba/abajo/izq/der` y `--sobre-barra` en `globals.css`; todo elemento fijo o pegado arriba/abajo debe usarlas.
- **Aviso de instalar la app** (`components/shell/AvisoApp.js`, textos en `textos/instalar.js`): solo en móvil y tablet, si no está ya instalada. Dice que aún no hay app en las tiendas: en Android muestra el botón "Instalar" (evento `beforeinstallprompt`, capturado en `<head>` por `SCRIPT_INSTALAR` de `lib/instalarApp.js`); en iPhone/iPad, los pasos de Compartir → Añadir a pantalla de inicio. Sale 4 s después del aviso de cookies (nunca a la vez) y, al cerrarlo, no vuelve en 14 días (`tk-aviso-app`).
- `public/sw.js`: service worker mínimo, solo muestra `public/offline.html` si una navegación falla por red (sin caché de contenido). Se registra en `AppShell` solo en producción; `.htaccess` lo sirve con `no-cache`. Si cambias la página sin conexión, sube la versión de `CACHE`.
- `npm run fuera` (o doble clic en `ver-desde-fuera.cmd`, que antes hace el build): sirve `out/` solo en este equipo (127.0.0.1:3300) y abre un túnel rápido de Cloudflare (`cloudflared`, instalado en Windows) que da un enlace `https://….trycloudflare.com` para ver la web desde fuera. Se cierra con Ctrl+C.
- `npm run enlaces` (tras el build): comprueba que ningún enlace interno de `out/` lleva a una página inexistente; el despliegue lo ejecuta después del build.
- `npm test`: pruebas de la lógica pura (calculadoras, compatibilidad, tareas) con el ejecutor de pruebas de Node, sin dependencias (`tests/*.test.mjs`; `tests/resolver.mjs` resuelve el alias `@/`). El despliegue de GitHub Actions ejecuta lint, `npm run i18n` y `npm test` antes del build: si algo falla, no se publica.

## Datos de demostración
`supabase/demo/`: `generar_demo.mjs` crea `datos_demo.sql` (19 usuarios de 10 países y todos los niveles, 4 tiendas gratis/Pro/verificada, 17 tanques con habitantes, mediciones, diario y tareas, publicaciones, comentarios, me gusta, seguidores, foro con soluciones, anuncios en 6 monedas, reseñas, mensajes y 2 campañas). Usuarios con correo `@demo.tankily.invalid` y sin contraseña (no se puede entrar con ellos). **Antes del lanzamiento**: `npx supabase db query --linked -f supabase/demo/limpiar_demo.sql` lo borra todo en cascada.

## Pendiente
- Activar el acceso con Google, Apple, Facebook y Microsoft siguiendo `docs/acceso-con-cuentas-externas.md` (los botones aparecen solos al activar cada proveedor en Supabase).
- Traducción: ya es automática con MyMemory (gratis, ~5000 caracteres/día). Para más volumen y calidad, clave de DeepL (gratis hasta 500 000 caracteres/mes): `npx supabase secrets set DEEPL_API_KEY=… --project-ref ivizkgmogzvscygcxepy`. Mencionar el proveedor de traducción en la política de privacidad (borrador en `docs/borrador-privacidad.md`).
- **Borrar los datos de demostración antes de abrir al público** (ver arriba).
- Fase 3: traducir WikiTank (Markdown en `WikiTank/`) empezando por inglés y alemán, y quitar el `noindex` de esos idiomas.
- Revisión de los textos de interfaz por hablantes nativos (están traducidos, pero no revisados).
- Cobro del plan Pro (Stripe, varias monedas). El Pro se activa a mano desde `/admin/`.
- Legal: rellenar los datos del titular en `src/i18n/textos/legal.js`, revisar los textos y ampliar para EE. UU. (CCPA).
- Supabase Auth: Site URL y Redirect URLs del dominio, incluyendo `/es/` y `/en/`.
- URLs indexables por tanque, hilo o anuncio: o pasar a un hosting con servidor, o generar en el build una página por contenido público leyendo Supabase (propuesta en `docs/PENDIENTES.md`).
- Activar las plantillas de email de `supabase/plantillas/` en Supabase (pasos en `docs/PENDIENTES.md`).
