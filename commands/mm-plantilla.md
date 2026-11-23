---
description: Hace un video con una plantilla del catálogo de Bodega Estudio y tu contenido (elige, valida props, fotogramas de control y render)
argument-hint: "[id de plantilla] [qué quieres: tema, textos, material, formato]"
---

Usa la skill `mm-plantillas` para este pedido: $ARGUMENTS

- Si el pedido empieza con un id del catálogo (`Plantilla-TutorialPasos` o solo `TutorialPasos`), usa esa plantilla.
- Si no trae id, lee `catalogo/plantillas.json` del estudio y propón las 2 o 3 que encajan, con tu recomendación primero.
- Sin argumentos, muestra la lista del catálogo (una línea por plantilla: para qué sirve y formatos) y pregunta qué quiere hacer.

Sigue los pasos de la skill en orden: localizar el estudio, elegir, reunir el contenido en un solo mensaje, validar las
props con `scripts/plantilla.mjs`, mostrar la hoja de fotogramas y, con el sí de la persona, renderizar en el VPS de Bodega o en este equipo.
