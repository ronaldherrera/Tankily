# 🌊 Guía de Mantenimiento de WikiTank

¡Bienvenido! Esta es la guía rápida para añadir, modificar o reorganizar el contenido de la Wiki de Tankily.

## 1. Estructura de Carpetas
La Wiki se basa directamente en la estructura de carpetas de `WikiTank`:
- **Nivel 1**: Secciones principales (Acuarios, Algas, etc.).
- **Nivel 2**: Categorías o tipos de acuarios (Estanques koi, Nano acuario, etc.).
- **Nivel Especial**: Si creas una carpeta llamada `ESPECIES HABITUALES` dentro de un acuario, se activará automáticamente el modo **Pokédex** (carruseles interactivos).

## 2. Cómo añadir Especies (Pokédex)
Para que aparezcan los carruseles de peces o plantas:
1. Crea una subcarpeta dentro de `ESPECIES HABITUALES` (ej: `Variedades de koi`).
2. Mete las fotos (`.webp`) en esa carpeta.
3. Crea un archivo `.md` dentro (ej: `Variedades_koi.md`).
4. Usa este formato para cada especie:
   ```markdown
   ## Nombre de la Especie (Nombre Científico)
   ![](foto.webp)
   
   **Parámetro 1**: Valor
   **Parámetro 2**: Valor
   Notas y descripción...
   ```

## 3. Control de Visualización: El "Split"
Si quieres que el texto de un artículo se divida (para que la Pokédex o las tarjetas de subsección aparezcan en medio):
- Usa la etiqueta `<!-- SPLIT_HERE -->` en el lugar donde quieras la división.
- El texto **antes** de la etiqueta aparecerá arriba.
- El texto **después** de la etiqueta aparecerá abajo de las tarjetas/pokedex.

## 4. 🔄 Sincronización (IMPRESCINDIBLE)
La Wiki **no se actualiza sola** al guardar los archivos. Tienes que decirle que "mapee" los cambios:

1. Abre una terminal en la raíz del proyecto.
2. Ejecuta:
   ```bash
   node scripts/sync_wikitank.mjs
   ```
3. Refresca el navegador (F5) para ver los cambios.

---
*💡 Tankily Wiki Engine — Diseñado para ser rápido, modular y visual.*
