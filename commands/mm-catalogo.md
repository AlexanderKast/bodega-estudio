---
description: Muestra el catálogo de Bodega Estudio (plantillas y presets) y cómo invocar cada una
argument-hint: "[filtro: tutorial, producto, anotación…]"
---

Muestra el catálogo de Bodega Estudio. Filtro pedido: $ARGUMENTS

1. Localiza el estudio: la primera carpeta que exista entre `$BODEGA_ESTUDIO_HOME`, la raíz de este plugin
   (`${CLAUDE_PLUGIN_ROOT}`), `~/bodega-estudio` y `/opt/bodega/estudio` (la que tiene `scripts/catalogo.mjs`). Si no hay ninguna, dilo y da el comando
   para clonarla; no sigas.
2. Lee `catalogo/plantillas.json` y `catalogo/presets.json` de esa carpeta. No los regeneres salvo que la persona lo
   pida o falten: en ese caso, `node scripts/catalogo.mjs`.
3. Responde con:
   - **Plantillas:** una tabla con id, para qué sirve (`cuando`), formatos y el comando `/mm-plantilla <id>`. Con filtro,
     solo las que coinciden por `resumen` o `cuando`; si ninguna coincide, dilo y lista las más cercanas.
   - **Presets:** solo los grupos con la cantidad de cada uno, salvo que el filtro apunte a presets; entonces lista los
     que coinciden con su `resumen`.
   - La ruta de la página con los ejemplos en video (`catalogo/index.html`) y la de `catalogo/CATALOGO.md`.
4. Si la persona quiere ver los ejemplos, abre `catalogo/index.html` en el navegador: cada tarjeta reproduce su video
   al pasar el cursor. Si faltan miniaturas o videos, se generan en el VPS de Bodega o en este equipo con
   `node scripts/catalogo.mjs --miniaturas --videos`.

No renderices nada desde este comando: para usar una plantilla es `/mm-plantilla`.
