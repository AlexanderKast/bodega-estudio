# 14 · Plantillas replicadas

> Reels, TikToks y Shorts ya editados que se midieron y se volvieron plantilla Remotion con props editables.
> Se replica la técnica (ritmo, transiciones, comportamiento del texto, encuadre), nunca el material del creador.
> Comando: `/replicar <url> [url...]` (`commands/replicar.md`).

## 0. Flujo

1. **Medir** en el VPS de Bodega o en este equipo: `scripts/referentes/procesar.sh urls.txt` baja el video (YouTube, Shorts, Instagram,
   TikTok; Instagram suele pedir `YTDLP_COOKIES=/ruta/cookies.txt`) y, si dura hasta 3 min, corre
   `scripts/referentes/medir.py`: `medicion.json` (cortes exactos, planos, ráfagas de movimiento con forma estimada,
   golpes de audio, % de cortes sobre golpe, bpm) y `tiras/corte_NN.jpg` (±0,5 s a fps completo por corte).
2. **Analizar** con `agents/analista-referencias.md` en modo `receta`: beats mapeados a presets del estudio y la
   lista de props de la plantilla. La receta pasa por la persona que pidió la plantilla antes de construir.
3. **Construir**: copiar `studio/src/plantillas/molde/` a `plantillas/<id>/`, ajustarla a la receta y registrarla en
   `plantillas/index.ts`. Si un beat pide `nuevo:<Preset>`, ese preset se hace aparte con su still y manifest
   (regla de `kb/13` §5).
4. **Controlar**: `node scripts/verify.mjs` en verde y still lado a lado con la referencia en los mismos cortes.
5. **Catalogar**: ficha en `referentes/fichas/<id>.md` y fila en la tabla de abajo.

## 1. Cómo se usa una plantilla

- En Remotion Studio: carpeta **Plantillas**, cada una en sus formatos (`<id>-vertical`, `-retrato`, `-cuadrado`).
  El panel de props edita textos, segundos por beat, media y colores; la duración se recalcula sola.
- En render: `npx remotion render src/index.ts <id>-vertical out/x.mp4 --props=props.json` (en el VPS de Bodega o en este equipo).
- Media: ruta dentro de `studio/public/` o URL. Vacío deja un panel liso para maquetar sin material.
- Colores vacíos = marca activa (`studio/src/marca/`). Para un cliente: `colores` en las props o su `marca.json`.

## 2. Reglas

- Los tiempos salen de `medicion.json`, no a ojo; la forma del easing se confirma en las tiras.
- Si la referencia rompe `kb/10-anti-look-ia.md` (easing lineal, todo a la vez, texto centrado sin razón), la plantilla
  no lo copia: queda anotado en la ficha.
- Sin footage, música, logos, textos ni fuentes sin licencia del creador. Lo de terceros que se use va a `CREDITOS.md`.

## 3. Catálogo

<!-- catalogo:plantillas -->
| Plantilla | Para qué | Formatos | Qué hace |
| --- | --- | --- | --- |
| `Plantilla-Molde` | Un reel corto de frases sobre video o fotos, o como punto de partida para una plantilla nueva. | 9:16, 4:5, 1:1 | Texto con gancho letra a letra, cortes secos y punch-in sobre tu material, con rótulo abajo a la izquierda. |
| `Plantilla-EditorialRecorte` | Explicar una idea en 3 a 6 pasos con objetos o productos recortados: consejos, listas y cifras con look editorial. | 9:16, 4:5 | Un objeto recortado por idea sobre cartulina, con titular grotesco y una palabra de acento en serif itálica. |
| `Plantilla-CollageImpacto` | Un mensaje fuerte y corto: manifiesto, apertura de campaña o gancho que tiene que frenar el scroll. | 9:16, 4:5 | Tipografía condensada gigante sobre papel, con recortes que tocan las letras y caídas a negro al golpe. |
| `Plantilla-ExplicadorObjetos` | Explicar un concepto abstracto con objetos como metáfora, sin persona en cámara. | 9:16, 4:5 | Texto cinético sans y serif itálica alternando fondo claro y oscuro, con objetos 3D flotando y pills. |
| `Plantilla-SaasUiCristal` | Presentar un software o una función: anuncio de producto, lanzamiento o demo de interfaz. | 9:16, 4:5, 1:1 | Una toma continua donde cada idea sale de la anterior: tarjetas de cristal, contador, bento, morph y captura con cursor. |
| `Plantilla-AntesDespues` | Mostrar transformaciones: rediseños, ediciones de foto, estilos generados con IA o resultados de un servicio. | 9:16, 4:5 | El antes chico y el después grande en perspectiva, recorriendo varios resultados con cortina, rasgado o barrido. |
| `Plantilla-ShowcaseDispositivo` | Mostrar una app o una web dentro del dispositivo: recorrido de pantallas o anuncio de app. | 9:16, 4:5, 1:1 | Pantallas que se suceden al golpe dentro de un teléfono o una laptop, con render 3D opcional. |
| `Plantilla-TalkingHeadInsertos` | Editar una grabación tuya hablando a cámara, con su transcripción por palabras, sin montarla a mano. | 9:16 | Presentador a cámara con punch-in en los golpes, subtítulo con chip de acento, pill fija y capturas insertadas. |
| `Plantilla-SplitStack` | Una grabación a cámara que necesita datos, titulares o B-roll visibles todo el tiempo. | 9:16 | Pantalla partida: gráficos o B-roll arriba, presentador abajo y el subtítulo en la costura con palabras clave en color. |
| `Plantilla-TutorialPasos` | Enseñar un proceso en pantalla a partir de una grabación de pantalla y una locución. | 9:16, 16:9 | Tutorial por pasos: tarjeta PASO N entre secciones, screencast con zoom a la región y cursor, y resultado final. |
<!-- /catalogo:plantillas -->

El detalle de cada plantilla (campos, ejemplo de props y miniatura) está en `catalogo/CATALOGO.md` y en
`catalogo/index.html`; ambos, como esta tabla, los genera `node scripts/catalogo.mjs`.

Cada plantilla trae `README.md` en su carpeta (`studio/src/plantillas/<familia>/`) con props, variantes y un ejemplo
de props para render. Las fichas de los 27 videos de origen están en `referentes/fichas/` (índice en
`referentes/README.md`).

## Fuentes

- Remotion, "Defining a schema for your props": https://www.remotion.dev/docs/schemas (consultado 2026-11-07)
- Remotion, "@remotion/zod-types": https://www.remotion.dev/docs/zod-types (consultado 2026-11-07)
- Remotion, "calculateMetadata()": https://www.remotion.dev/docs/calculate-metadata (consultado 2026-11-07)
- yt-dlp, "Format selection" y "Sorting formats": https://github.com/yt-dlp/yt-dlp#format-selection (consultado 2026-11-07)
- FFmpeg filters, "select, aselect" (detección de escena): https://ffmpeg.org/ffmpeg-filters.html#select_002c-aselect (consultado 2026-11-07)
