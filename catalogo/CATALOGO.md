# Catálogo de Bodega Estudio

Generado por `node scripts/catalogo.mjs`. No lo edites a mano: cambia la plantilla o el manifiesto y vuelve a generarlo.

## Plantillas (10)

Una plantilla es una pieza completa a la que se le cambia el contenido por props. Se invoca con
`/mm-plantilla <id>` o con `node scripts/plantilla.mjs <id> --props archivo.json`.

| Plantilla | Para qué | Formatos | Duración de muestra |
|---|---|---|---|
| `Plantilla-Molde` | Un reel corto de frases sobre video o fotos, o como punto de partida para una plantilla nueva. | 9:16, 4:5, 1:1 | 6.2 s |
| `Plantilla-EditorialRecorte` | Explicar una idea en 3 a 6 pasos con objetos o productos recortados: consejos, listas y cifras con look editorial. | 9:16, 4:5 | 16.6 s |
| `Plantilla-CollageImpacto` | Un mensaje fuerte y corto: manifiesto, apertura de campaña o gancho que tiene que frenar el scroll. | 9:16, 4:5 | 17.2 s |
| `Plantilla-ExplicadorObjetos` | Explicar un concepto abstracto con objetos como metáfora, sin persona en cámara. | 9:16, 4:5 | 18.2 s |
| `Plantilla-SaasUiCristal` | Presentar un software o una función: anuncio de producto, lanzamiento o demo de interfaz. | 9:16, 4:5, 1:1 | 21.1 s |
| `Plantilla-AntesDespues` | Mostrar transformaciones: rediseños, ediciones de foto, estilos generados con IA o resultados de un servicio. | 9:16, 4:5 | 11.7 s |
| `Plantilla-ShowcaseDispositivo` | Mostrar una app o una web dentro del dispositivo: recorrido de pantallas o anuncio de app. | 9:16, 4:5, 1:1 | 14 s |
| `Plantilla-TalkingHeadInsertos` | Editar una grabación tuya hablando a cámara, con su transcripción por palabras, sin montarla a mano. | 9:16 | 33.4 s |
| `Plantilla-SplitStack` | Una grabación a cámara que necesita datos, titulares o B-roll visibles todo el tiempo. | 9:16 | 27.7 s |
| `Plantilla-TutorialPasos` | Enseñar un proceso en pantalla a partir de una grabación de pantalla y una locución. | 9:16, 16:9 | 34.3 s |

### Plantilla-Molde

Texto con gancho letra a letra, cortes secos y punch-in sobre tu material, con rótulo abajo a la izquierda.

- **Cuándo usarla:** Un reel corto de frases sobre video o fotos, o como punto de partida para una plantilla nueva.
- **Formatos:** 9:16, 4:5, 1:1 (`Plantilla-Molde-vertical`, `Plantilla-Molde-retrato`, `Plantilla-Molde-cuadrado`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-Molde.json`
- **Origen:** ninguna (molde base)

Campos:

- `beats` · lista de objetos · obligatorio
  - `texto` · texto · obligatorio · 2–5 palabras; la primera línea del beat
  - `segundos` · número · obligatorio
  - `media` · texto · por defecto "" · ruta en public/ o URL; vacío = panel liso
  - `punch` · sí/no · por defecto true · punch-in rápido (3 f, snap) a mitad del plano
- `cierre` · texto · obligatorio · texto del último plano
- `segundosCierre` · número · por defecto 2
- `colores` · objeto · por defecto {}
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-EditorialRecorte

Un objeto recortado por idea sobre cartulina, con titular grotesco y una palabra de acento en serif itálica.

- **Cuándo usarla:** Explicar una idea en 3 a 6 pasos con objetos o productos recortados: consejos, listas y cifras con look editorial.
- **Formatos:** 9:16, 4:5 (`Plantilla-EditorialRecorte-vertical`, `Plantilla-EditorialRecorte-retrato`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-EditorialRecorte.json`
- **Origen:** tiktok-7581551601349954824, tiktok-7622319703679110421, tiktok-7671829994292776200, tiktok-7545813836503289144

Campos:

- `variante` · "gris-script" | "acento-azul" | "noche-amarilla" | "crema-marco" · por defecto "gris-script" · tratamiento medido de cada video de la familia: paleta, ritmo y transición
- `beats` · lista de objetos · obligatorio
  - `tipo` · "objeto" | "tarjeta" | "lista" | "cifra" · por defecto "objeto" · objeto: recorte + titular · tarjeta: color pleno, texto por palabra · lista: viñetas · cifra: contador
  - `apoyo` · texto · por defecto "" · frase chica de apoyo, 3–6 palabras (entra por palabra con blur)
  - `titular` · texto · obligatorio · titular; *palabra* = acento en serif itálica; ' / ' parte la línea
  - `segundos` · número · obligatorio
  - `media` · texto · por defecto "" · recorte PNG con alfa, imagen o video; vacío = objeto de muestra
  - `items` · lista de texto · por defecto [] · solo tipo lista: 2–4 items
  - `cifra` · número · por defecto 0 · solo tipo cifra
  - `sufijo` · texto · por defecto "" · solo tipo cifra: %, x, ' de 10'…
- `cierre` · objeto · obligatorio
  - `texto` · texto · obligatorio · frase final; *palabra* = acento
  - `firma` · texto · por defecto "" · @usuario o marca, chica
  - `logo` · texto · por defecto "" · ruta en public/ o URL; vacío = panel liso
  - `segundos` · número · por defecto 2.2
- `colores` · objeto · por defecto {} · vacío = paleta de la variante
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-CollageImpacto

Tipografía condensada gigante sobre papel, con recortes que tocan las letras y caídas a negro al golpe.

- **Cuándo usarla:** Un mensaje fuerte y corto: manifiesto, apertura de campaña o gancho que tiene que frenar el scroll.
- **Formatos:** 9:16, 4:5 (`Plantilla-CollageImpacto-vertical`, `Plantilla-CollageImpacto-retrato`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-CollageImpacto.json`
- **Origen:** tiktok-7600179656922385685, tiktok-7684823088906636562, C-yZlQXN3rQ

Campos:

- `variante` · "crema-rojo" | "papel-tinta" | "gris-objeto" · por defecto "crema-rojo" · tratamiento medido de cada video de la familia: paleta, ritmo y transición
- `beats` · lista de objetos · obligatorio
  - `tipo` · "impacto" | "frase" | "objeto" | "oscuro" · por defecto "frase" · impacto: palabra que llena el ancho · frase: 1–3 niveles · objeto: recorte protagonista · oscuro: foto de fondo
  - `texto` · texto · obligatorio · ' / ' parte la línea; *idea* = condensada grande; _énfasis_ = serif itálica; el resto, conector chico
  - `segundos` · número · obligatorio
  - `recorte` · texto · por defecto "" · PNG con alfa (objeto que toca las letras); vacío = sin objeto o pieza de muestra
  - `imagen` · texto · por defecto "" · foto o video: fondo de la escena oscura o tarjeta que se parte (gris-objeto)
  - `golpe` · sí/no · por defecto false · caída a negro (o flash de acento) de 4 f al entrar, sobre el golpe
- `cierre` · objeto · obligatorio
  - `texto` · texto · obligatorio · mismo formato que los beats
  - `firma` · texto · por defecto ""
  - `recorte` · texto · por defecto "" · ruta en public/ o URL; vacío = panel liso
  - `segundos` · número · por defecto 2.8
- `colores` · objeto · por defecto {} · fondo = papel, texto = tinta, acento = color de la idea; vacío = paleta de la variante
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-ExplicadorObjetos

Texto cinético sans y serif itálica alternando fondo claro y oscuro, con objetos 3D flotando y pills.

- **Cuándo usarla:** Explicar un concepto abstracto con objetos como metáfora, sin persona en cámara.
- **Formatos:** 9:16, 4:5 (`Plantilla-ExplicadorObjetos-vertical`, `Plantilla-ExplicadorObjetos-retrato`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-ExplicadorObjetos.json`
- **Origen:** tiktok-7660733665353272583, tiktok-7560567761760505110

Campos:

- `variante` · "lavanda-contraste" | "calido-ventana" · por defecto "lavanda-contraste" · tratamiento medido de cada video de la familia: paleta, ritmo y transición
- `beats` · lista de objetos · obligatorio
  - `tipo` · "objeto" | "lista" | "cifra" · por defecto "objeto" · objeto: recorte 3D + texto · lista: pills numeradas · cifra: contador + pill
  - `fondo` · "claro" | "oscuro" · por defecto "claro" · alternar claro/oscuro marca el giro del argumento
  - `texto` · texto · obligatorio · 1–3 niveles separados por ' / '; *palabra* = serif itálica de acento
  - `nota` · texto · por defecto "" · línea chica bajo el objeto; *palabra* lleva el resaltador
  - `segundos` · número · obligatorio
  - `media` · texto · por defecto "" · objeto 3D (PNG con alfa), imagen o video; vacío = objeto de muestra
  - `items` · lista de texto · por defecto [] · solo lista: 2–5 items
  - `cifra` · número · por defecto 0 · solo cifra
  - `sufijo` · texto · por defecto "" · solo cifra: palabra en serif itálica bajo el número
  - `pill` · texto · por defecto "" · solo cifra: número + etiqueta, p. ej. '02 meses'
- `cierre` · objeto · obligatorio
  - `texto` · texto · obligatorio
  - `firma` · texto · por defecto ""
  - `media` · texto · por defecto "" · ruta en public/ o URL; vacío = panel liso
  - `segundos` · número · por defecto 2.8
- `colores` · objeto · por defecto {} · fondo = escena clara, texto = tinta, acento = resaltador/acento; vacío = paleta de la variante
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-SaasUiCristal

Una toma continua donde cada idea sale de la anterior: tarjetas de cristal, contador, bento, morph y captura con cursor.

- **Cuándo usarla:** Presentar un software o una función: anuncio de producto, lanzamiento o demo de interfaz.
- **Formatos:** 9:16, 4:5, 1:1 (`Plantilla-SaasUiCristal-vertical`, `Plantilla-SaasUiCristal-retrato`, `Plantilla-SaasUiCristal-cuadrado`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-SaasUiCristal.json`
- **Origen:** saas-ui-cristal: lpFv-bB-RuM, tiktok-7521798862521060630, tiktok-7613879612723957012, tiktok-7698861538307788033, DryieyoUmLc

Campos:

- `variante` · "noche-cristal" | "bento-inclinado" | "morph-claro" | "pasos-carbon" | "hoja-cursor" · por defecto "noche-cristal" · una por video de origen: paleta, tratamiento de tarjetas y tipo de transición
- `escenas` · lista de objetos · obligatorio
  - `tipo` · "gancho" | "tarjetas" | "contador" | "bento" | "morph" | "captura" | "lista" · obligatorio
  - `titulo` · texto · obligatorio · rótulo de la escena (en contador: etiqueta de la cifra)
  - `items` · lista de texto · por defecto [] · gancho: palabras · tarjetas/bento: «etiqueta|valor» · morph: pasos · captura: textos del cursor · lista: «acción|hora» · contador: [palabra clave]
  - `desde` · número · por defecto 0 · contador: valor inicial
  - `hasta` · número · por defecto 0 · contador: valor final
  - `media` · texto · por defecto "" · captura: pantalla o video del producto; vacío = interfaz de muestra
  - `segundos` · número · obligatorio
- `marca` · texto · obligatorio · wordmark del cierre
- `frase` · texto · obligatorio · frase bajo el wordmark
- `cta` · texto · por defecto "" · CTA que el cursor señala en el cierre; vacío = sin CTA
- `segundosCierre` · número · por defecto 3
- `colores` · objeto · por defecto {}
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-AntesDespues

El antes chico y el después grande en perspectiva, recorriendo varios resultados con cortina, rasgado o barrido.

- **Cuándo usarla:** Mostrar transformaciones: rediseños, ediciones de foto, estilos generados con IA o resultados de un servicio.
- **Formatos:** 9:16, 4:5 (`Plantilla-AntesDespues-vertical`, `Plantilla-AntesDespues-retrato`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-AntesDespues.json`
- **Origen:** antes-despues: MoVlt-ptxIk, tiktok-7519674033076571397

Campos:

- `variante` · "tarjetas-perspectiva" | "escenario-timeline" · por defecto "tarjetas-perspectiva" · layout, paleta y ritmo de cada video de origen
- `antes` · texto · por defecto "" · clip crudo del cliente (panel chico)
- `etiquetaAntes` · texto · por defecto "Antes"
- `etiquetaDespues` · texto · por defecto "Después"
- `estados` · lista de objetos · obligatorio
  - `estilo` · "video" | "papel" | "color" | "reticula" | "periodico" | "crema" | "dato" · obligatorio · tratamiento del panel grande; usar 2–3 por pieza (AI-14)
  - `texto` · texto · obligatorio · frase; en escenario-timeline, varias frases separadas por « / »
  - `clave` · texto · por defecto "" · palabra resaltada (acento); vacío = ninguna
  - `media` · texto · por defecto "" · clip o imagen de este estado; vacío = el clip de «antes»
  - `segundos` · número · obligatorio
  - `entrada` · "corte" | "cortina" | "rasgado" | "barrido" · por defecto "corte"
- `timeline` · objeto · por defecto {"etiqueta":"Línea de tiempo","media":""} · solo escenario-timeline: captura propia del timeline; vacío = pistas de muestra
  - `etiqueta` · texto · por defecto "Línea de tiempo"
  - `media` · texto · por defecto "" · ruta en public/ o URL; vacío = panel liso
- `colores` · objeto · por defecto {}
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-ShowcaseDispositivo

Pantallas que se suceden al golpe dentro de un teléfono o una laptop, con render 3D opcional.

- **Cuándo usarla:** Mostrar una app o una web dentro del dispositivo: recorrido de pantallas o anuncio de app.
- **Formatos:** 9:16, 4:5, 1:1 (`Plantilla-ShowcaseDispositivo-vertical`, `Plantilla-ShowcaseDispositivo-retrato`, `Plantilla-ShowcaseDispositivo-cuadrado`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-ShowcaseDispositivo.json`
- **Origen:** showcase-dispositivo: DiH9Pek312c, tiktok-7693603336481803542

Campos:

- `variante` · "telefono-3d" | "laptop-catalogo" · por defecto "telefono-3d" · dispositivo, paleta, cámara y golpes de cada video de origen
- `dispositivo` · "auto" | "telefono" | "laptop" · por defecto "auto" · auto = el de la variante
- `pantallas` · lista de objetos · obligatorio
  - `tipo` · "inicio" | "bloqueo" | "media" | "mapa" | "titular" | "rejilla" | "eco" | "datos" · obligatorio
  - `texto` · texto · por defecto "" · titular, hora del bloqueo, rótulo del mapa o de los datos
  - `subtexto` · texto · por defecto ""
  - `items` · lista de texto · por defecto [] · bloqueo: notificaciones · datos: etiquetas de barras
  - `numero` · número · por defecto 0 · datos: cifra final (se muestra con signo y %)
  - `media` · texto · por defecto "" · captura o video de la app del cliente; si hay, ocupa la pantalla
  - `segundos` · número · obligatorio
  - `encuadre` · "dispositivo" | "pantalla" | "inclinado" · por defecto "dispositivo" · cámara: dispositivo entero, pegada a la pantalla o inclinada
  - `cambio` · "fundido" | "empuje" | "flash" | "tinta" | "bloques" · por defecto "fundido" · cómo entra esta pantalla sobre la anterior
- `marca` · texto · obligatorio · wordmark del splash final
- `frase` · texto · por defecto ""
- `render3d` · texto · por defecto "" · video con alfa del dispositivo entrando (Blender); vacío = vuelo del dispositivo dibujado
- `segundosCierre` · número · por defecto 2.6
- `colores` · objeto · por defecto {}
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-TalkingHeadInsertos

Presentador a cámara con punch-in en los golpes, subtítulo con chip de acento, pill fija y capturas insertadas.

- **Cuándo usarla:** Editar una grabación tuya hablando a cámara, con su transcripción por palabras, sin montarla a mano.
- **Formatos:** 9:16 (`Plantilla-TalkingHeadInsertos-vertical`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-TalkingHeadInsertos.json`
- **Origen:** referentes/lote-2026-11-08.md · talking-head-insertos (tiktok-7701672067120368948, tiktok-7702620779518643478, tiktok-7698456660611796231, tiktok-7690371798784871701)

Campos:

- `variante` · "pantalla-pasos" | "insertos-pecho" | "pill-fija" | "cortes-rapidos" · obligatorio · pantalla-pasos=7701672067120368948 · insertos-pecho=7702620779518643478 · pill-fija=7698456660611796231 · cortes-rapidos=7690371798784871701
- `media` · texto · por defecto "" · video del presentador, con su voz; vacío = silueta
- `palabras` · lista de objetos · obligatorio · palabras de Whisper en segundos: [{word, start, end}]
  - `word` · texto · obligatorio
  - `start` · número · obligatorio
  - `end` · número · obligatorio
- `claves` · lista de texto · por defecto [] · palabras que van en chip (sin tildes da igual)
- `pill` · texto · por defecto "" · promesa fija arriba (3–4 palabras); vacío = sin pill
- `golpes` · lista de número · por defecto [] · segundos de los punch-in; alternan cerrado/abierto
- `insertos` · lista de objetos · por defecto []
  - `tipo` · "captura" | "carrusel" · obligatorio
  - `at` · número · obligatorio · segundo en que entra
  - `duracion` · número · obligatorio
  - `media` · texto · por defecto "" · captura o grabación de pantalla (solo tipo captura)
  - `titulo` · texto · por defecto "" · captura: texto del chip de paso · carrusel: cabecera de la sección
  - `paso` · número · por defecto 0 · número del chip de paso; 0 = sin chip
  - `zonas` · lista de objetos · por defecto []
  - `tarjetas` · lista de texto · por defecto [] · solo carrusel: título de cada tarjeta
- `segundosCola` · número · por defecto 1.2
- `colores` · objeto · por defecto {}
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-SplitStack

Pantalla partida: gráficos o B-roll arriba, presentador abajo y el subtítulo en la costura con palabras clave en color.

- **Cuándo usarla:** Una grabación a cámara que necesita datos, titulares o B-roll visibles todo el tiempo.
- **Formatos:** 9:16 (`Plantilla-SplitStack-vertical`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-SplitStack.json`
- **Origen:** referentes/lote-2026-11-08.md · split-stack (7gMbZTdLlxs, tiktok-7697333991984221462, zlOCQxQYnYc)

Campos:

- `variante` · "infografia" | "ai-real" | "ugc-paneles" · obligatorio · infografia=7gMbZTdLlxs · ai-real=tiktok-7697333991984221462 · ugc-paneles=zlOCQxQYnYc
- `media` · texto · por defecto "" · video del presentador (panel de abajo), con su voz
- `palabras` · lista de objetos · obligatorio · palabras de Whisper en segundos: [{word, start, end}]
  - `word` · texto · obligatorio
  - `start` · número · obligatorio
  - `end` · número · obligatorio
- `claves` · lista de texto · por defecto []
- `beats` · lista de objetos · obligatorio
  - `tipo` · "dato" | "titular" | "ui" | "broll" · obligatorio · qué va arriba en este beat
  - `segundos` · número · obligatorio
  - `palabra` · texto · obligatorio · keyword grande en acento (1–3 palabras)
  - `detalle` · texto · por defecto "" · línea chica de apoyo; en titular va en serif itálica
  - `valor` · número · por defecto 0 · solo dato: cifra final
  - `desde` · número · por defecto 0 · solo dato: cifra de arranque
  - `prefijo` · texto · por defecto ""
  - `sufijo` · texto · por defecto ""
  - `media` · texto · por defecto "" · ui: captura · broll: clip o imagen
- `marcas` · lista de texto · por defecto [] · lockup de la barra superior (variante ai-real)
- `etiquetaArriba` · texto · por defecto "IA:"
- `etiquetaAbajo` · texto · por defecto "REAL:"
- `cta` · texto · por defecto "" · pill final (variante ugc-paneles); vacío = sin CTA
- `segundosCola` · número · por defecto 1
- `colores` · objeto · por defecto {}
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

### Plantilla-TutorialPasos

Tutorial por pasos: tarjeta PASO N entre secciones, screencast con zoom a la región y cursor, y resultado final.

- **Cuándo usarla:** Enseñar un proceso en pantalla a partir de una grabación de pantalla y una locución.
- **Formatos:** 9:16, 16:9 (`Plantilla-TutorialPasos-vertical`, `Plantilla-TutorialPasos-horizontal`)
- **Ejemplo de props:** `catalogo/ejemplos/Plantilla-TutorialPasos.json`
- **Origen:** referentes/lote-2026-11-08.md · tutorial-pasos (n50KkoucMpU, tHzfsCsWL6M)

Campos:

- `variante` · "pizarra" | "movil" · obligatorio · pizarra=n50KkoucMpU · movil=tHzfsCsWL6M
- `titulo` · lista de texto · obligatorio · líneas del titular de apertura; *palabra* va en serif itálica
- `etiqueta` · texto · por defecto "Tutorial"
- `segundosIntro` · número · por defecto 2.6
- `segundosTarjeta` · número · por defecto 2
- `pasos` · lista de objetos · obligatorio
  - `titulo` · texto · obligatorio · 2–5 palabras: va en la tarjeta y en el chip
  - `segundos` · número · obligatorio · largo del screencast del paso
  - `media` · texto · por defecto "" · grabación de pantalla del paso
  - `zonas` · lista de objetos · por defecto []
- `resultado` · objeto · obligatorio
  - `media` · texto · por defecto "" · ruta en public/ o URL; vacío = panel liso
  - `texto` · texto · obligatorio
  - `segundos` · número · obligatorio
- `voz` · texto · por defecto "" · voz en off (mp3/wav/m4a); vacío = sin audio
- `palabras` · lista de objetos · obligatorio · palabras de Whisper en segundos: [{word, start, end}]
  - `word` · texto · obligatorio
  - `start` · número · obligatorio
  - `end` · número · obligatorio
- `claves` · lista de texto · por defecto []
- `colores` · objeto · por defecto {}
  - `fondo` · color (hex)
  - `texto` · color (hex)
  - `acento` · color (hex)

## Presets (74)

Un preset es una pieza suelta (un titular, una transición, una anotación) para armar composiciones propias.
Cada uno tiene su escena de muestra `Preset-<Id>-horizontal`.

### Tipografía

| Preset | Qué hace |
|---|---|
| `MaskTitle` | Titular cuyas líneas salen de una máscara |
| `CharCascade` | Texto que entra letra por letra con spring |
| `WordRotator` | Una palabra de la frase que va cambiando |
| `MarkerHighlight` | Resaltador a mano sobre una palabra |
| `ScrambleResolve` | Texto que se descifra hasta quedar legible |
| `StretchRepeater` | Repetición suiza de una palabra estirada |
| `VariableAxisType` | Fuente variable con el peso en onda |
| `TextOnPath` | Texto que recorre un trayecto curvo |
| `TextWarp` | Texto deformado en arco u onda |
| `TextTunnel` | Túnel de texto en profundidad |
| `MarqueeRows` | Filas de texto que corren en sentidos opuestos |
| `BlurStack` | Pila de líneas donde solo una queda nítida |
| `TypeSandwich` | Un objeto metido entre dos capas de titular |

### Datos

| Preset | Qué hace |
|---|---|
| `LineDraw` | Línea o forma que se dibuja |
| `CountUp` | Cifra que cuenta hasta su valor |
| `MapTrace` | Ruta que se traza sobre un mapa editorial |
| `BarRace` | Barras que compiten y se adelantan |
| `UnitGrid` | Proporción en una rejilla de unidades (37 de cada 100) |

### Retención y captions

| Preset | Qué hace |
|---|---|
| `LowerThird` | Rótulo de nombre y cargo |
| `KaraokeCaption` | Subtítulo que se ilumina palabra a palabra |
| `WordWindowCaption` | Subtítulo en ventanas de 1 a 3 palabras |
| `PunchIn` | Golpe de encuadre en cada evento |
| `SpeedLines` | Líneas de velocidad de anime |
| `ImpactFrame` | Cuadro de impacto: flash invertido y temblor |
| `ChipCaption` | Subtítulo con la palabra clave en un chip de color |
| `Pill` | Etiqueta fija en forma de pastilla |

### Forma, cámara y 3D

| Preset | Qué hace |
|---|---|
| `CameraRig` | Cámara viva: deriva, empuje y mano |
| `Parallax` | Planos que se mueven a distinta velocidad |
| `DepthCards` | Tarjetas apiladas con profundidad |
| `LogoSting` | Cierre de logo |
| `BlenderLayer` | Render 3D de Blender con alfa como capa |
| `ShapeMorph` | Una forma que se convierte en otra |
| `GooeyMerge` | Formas que se funden como gotas |
| `IsoScene` | Diagrama isométrico que se arma |
| `CutoutObject` | Objeto recortado que cae al papel con su sombra |

### Transiciones

| Preset | Qué hace |
|---|---|
| `SplitReveal` | La escena se abre en dos y revela la siguiente |
| `Whip` | Barrido rápido de cámara |
| `ZoomThrough` | Zoom que atraviesa hacia la siguiente escena |
| `MaskWipe` | Barrido por máscara |
| `NoiseBlocks` | Bloques de ruido que tapan y destapan |
| `ClockWipe` | Barrido de reloj con spring |
| `LightLeak` | Fuga de luz entre escenas |

### Texturas y estilos

| Preset | Qué hace |
|---|---|
| `GlitchHit` | Glitch corto de acento |
| `LottieLayer` | Animación de After Effects exportada con Bodymovin |
| `Look` | Acabado de la pieza: grano, viñeta, temperatura y tonos |
| `BoilLine` | Trazo que hierve como dibujado a mano |
| `RisoLayer` | Risografía con fuera de registro |
| `BayerDither` | Trama de un bit (dither) |
| `PaperTear` | Papel que se arranca para revelar |
| `SliceDisplace` | Imagen cortada en franjas que se desplazan |
| `GradientFlow` | Fondo de color que fluye despacio |

### Renders de servidor

| Preset | Qué hace |
|---|---|
| `DeviceOrbit` | Grabación real dentro de un teléfono 3D que orbita |
| `ClayRebote` | Plastilina con squash & stretch |
| `Datamosh` | Datamosh real entre dos tomas |

### Interfaz y producto

| Preset | Qué hace |
|---|---|
| `Cursor` | Cursor que viaja y hace clic |
| `ScreenFrame` | Captura de pantalla con zoom a una región |
| `BentoGrid` | Rejilla bento que se arma por celdas |
| `CardMorph` | Tarjeta que se transforma en otra |
| `CardCarousel` | Carrusel de tarjetas |
| `BeforeAfter` | Comparación antes y después con cortina |
| `SplitStack` | Pantalla partida: gráfico arriba, presentador abajo |

### Anotación

| Preset | Qué hace |
|---|---|
| `Trazo` | Línea que se dibuja como a mano, base del kit |
| `Circulo` | Círculo de resalte alrededor de algo |
| `Recuadro` | Recuadro dibujado alrededor de una zona |
| `Flecha` | Flecha curva entre dos puntos |
| `Subrayado` | Subrayado simple o doble |
| `Tachado` | Tachado de una palabra |
| `Callout` | Punto, línea guía y rótulo que nombra algo |
| `Nodo` | Cajas y conectores de un diagrama que se construye |
| `AnilloPunteado` | Anillo punteado que marca una zona |
| `Llave` | Llave que agrupa varios elementos con su rótulo |
| `DatoCallout` | Cifra grande que sale de un punto del objeto |
| `PasoTracker` | Lista de pasos que lleva la cuenta |
| `Lupa` | Lupa que amplía una zona en un recuadro |

