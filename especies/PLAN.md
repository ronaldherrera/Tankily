# Plan de ampliación del catálogo de especies

Objetivo: pasar de 511 a 1.800–2.000 especies en total (wiki + `especies/`), escritas a mano y por orden de
popularidad en el hobby. Cada tanda se contrasta con GBIF y FishBase (`npm run especies:validar`), se le buscan
fotos (`npm run especies:fotos`), las fotos se revisan a ojo (`node scripts/especies/hoja.mjs recientes hoja.jpg`)
y al final se regenera el índice (`npm run especies`).

Formato: el de las fichas de WikiTank (ver cualquier archivo de esta carpeta). Peces y gambas de agua dulce con
**GH**; marinos con **Salinidad** y **Reef Safe**; corales con **Tipo**, **Luz**, **Corriente** y **Agresividad**;
plantas con **Luz**, **CO2** y **Crecimiento**. Texto propio, nunca copiado (FishBase solo para comparar).

| Grupo | Archivo | Añadir | Estado (16/10/2026) |
|---|---|---|---|
| Plecos y loricáridos (L populares) | Peces/Siluros y plecos.md | +80 | ✓ (113 siluros en total) |
| Corydoras y calíctidos | Peces/Corydoras y calíctidos.md | +50 | ✓ 68 |
| Otros siluros | Peces/Siluros y plecos.md | +40 | ✓ (en Siluros y plecos) |
| Tetras y carácidos | Peces/Tetras y carácidos.md | +80 | ✓ 101 |
| Rasboras, danios y barbos | Peces/Rasboras, danios y barbos.md | +80 | ✓ 89 |
| Lochas | Peces/Lochas.md | +30 | 20 (ampliable) |
| Cíclidos del Malawi | Peces/Cíclidos del Malawi.md | +100 | 57 (ampliable) |
| Cíclidos del Tanganica | Peces/Cíclidos del Tanganica.md | +70 | 46 (ampliable) |
| Otros cíclidos africanos | Peces/Cíclidos africanos.md | +20 | ✓ 36 |
| Cíclidos sudamericanos | Peces/Cíclidos americanos.md | +80 | ✓ 100 (con centroamericanos) |
| Cíclidos centroamericanos | Peces/Cíclidos americanos.md | +40 | ✓ (en Cíclidos americanos) |
| Guramis, bettas y laberíntidos | Peces/Guramis y bettas.md | +40 | ✓ 45 |
| Vivíparos | Peces/Vivíparos.md | +30 | ✓ 31 |
| Killis | Peces/Killis, arcoíris y medakas.md | +60 | ✓ 97 (con arcoíris y medakas) |
| Arcoíris y ojos azules | Peces/Killis, arcoíris y medakas.md | +40 | ✓ (en Killis, arcoíris y medakas) |
| Gobios de agua dulce, globos y raros | Peces/Otros peces de agua dulce y salobre.md | +60 | ✓ 68 |
| Agua fría, estanque y autóctonos | Peces/Agua fría y estanque.md | +40 | 12 (ampliable) |
| Peces marinos | Peces/(archivos marinos) | +250 | ✓ 337 |
| Corales y anémonas | Corales/ | +120 | ✓ 134 |
| Invertebrados | Invertebrados/ | +90 | ✓ 110 |
| Plantas | Plantas/ | +130 | ✓ 182 |

Resultado: 1.813 especies en total (1.646 nuevas en `especies/`). Quedan por ampliar Malawi, Tanganica, lochas y agua fría.
