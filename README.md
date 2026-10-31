# Tankily

**Red social y herramienta de gestión para acuaristas, en 8 idiomas.** Cada usuario registra sus acuarios y estanques con sus habitantes, mediciones del agua y diario de mantenimiento. Alrededor hay un muro social, un foro, compraventa entre aficionados, un directorio de tiendas y WikiTank, una enciclopedia con 1.847 fichas de especies.

🌐 **[tankily.com](https://tankily.com)** · En producción desde 2026, con usuarios reales

<!-- Añadir aquí 2–3 capturas: portada, ficha de un tanque y comprobación de compatibilidad -->
<!-- ![Tankily](docs/capturas/portada.png) -->

---

## Qué tiene de interesante

| | |
| --- | --- |
| **8 idiomas de verdad** | Rutas por idioma (`/es/`, `/en/`, `/de/`, `/pt/`, `/fr/`, `/it/`, `/nl/`, `/pl/`), plurales correctos con `Intl.PluralRules` (incluidas las formas del polaco), unidades métricas o imperiales por usuario y fechas y números con el formato de cada país. Un script impide publicar si falta una clave en algún idioma. |
| **Motor de compatibilidad** | Funciones puras que cruzan los habitantes de un tanque entre sí y con la última medición del agua. Detectan rangos de temperatura, pH, GH o salinidad que no se solapan, especies no aptas para arrecife, litros insuficientes, grupos demasiado pequeños y agresivos junto a pacíficos. |
| **Seguridad en la base de datos** | RLS en todas las tablas de Supabase, permisos por columna en los campos sensibles (`es_admin`, plan de la tienda, destacados) y un freno antispam con un trigger genérico (`limitar_frecuencia`) en publicaciones, mensajes, anuncios y reseñas. |
| **Traducción del contenido** | Las publicaciones guardan su idioma. Si no coincide con el del lector, se traducen con caché en local y en la base de datos, y siempre se puede ver el original. |
| **Despliegue con control de calidad** | GitHub Actions ejecuta el lint, la comprobación de idiomas y los tests antes de compilar. Si algo falla, no se publica. Después del build comprueba que ningún enlace interno esté roto. |
| **SEO** | Calculadoras y fichas de especies estáticas e indexables en 8 idiomas, con `hreflang`, canónicas, datos estructurados (JSON-LD), `sitemap.xml` generado y PWA instalable. |

## Stack

- **Next.js 16** (App Router) con export estático
- **Supabase**: Postgres con RLS, Auth, Storage, Realtime y Edge Functions
- **CSS propio** con tokens de tema (claro y oscuro) y `lucide-react`
- **GitHub Actions**: despliegue a Hostinger por rsync y SSH (solo sube lo que cambia)
- **Node test runner**: tests de la lógica pura (calculadoras, compatibilidad y tareas), sin dependencias

## Decisiones técnicas

**¿Por qué export estático?** El hosting es compartido y no ejecuta Node. Toda la lógica sensible vive en Postgres (RLS, triggers y funciones), así que el cliente solo pide datos que tiene permiso para ver. A cambio, las páginas de detalle usan parámetros (`/tanque/?id=`) en lugar de rutas dinámicas. Cómo generar páginas indexables por contenido está documentado en `docs/PENDIENTES.md`.

**¿Por qué los textos nunca están en el JSX?** Para añadir un idioma basta con un archivo de diccionario y registrarlo. `npm run i18n` y `scripts/comparar_idioma.mjs` señalan las claves que faltan.

**¿Por qué siempre en métrico en la base de datos?** Un único formato para guardar. La conversión a imperial se hace al mostrar y al guardar (`useUnidades()`).

## Estructura

```
src/
  app/[lang]/        páginas por idioma (tanques, foro, mercado, tiendas, wiki, herramientas…)
  components/        componentes de interfaz
  lib/               lógica: compatibilidad, cálculos, tareas, unidades, SEO, geo
  i18n/              configuración, diccionarios y textos por sección
supabase/
  migrations/        esquema versionado
tests/               tests de la lógica pura
scripts/             i18n, índice de especies, iconos, comprobación de enlaces
```

## Arrancar en local

```bash
npm install
# Crea .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

```bash
npm test         # tests de la lógica
npm run i18n     # comprueba las claves de los 8 idiomas
npm run build    # export estático en out/
```

---

Diseñado y desarrollado por **Ronald Herrera** · [ronaldherrera.es](https://ronaldherrera.es) · [LinkedIn](https://linkedin.com/in/ronald-sc-herrera)
