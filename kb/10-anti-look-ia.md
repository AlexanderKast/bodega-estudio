# 10 · Anti-look IA: "tells" y qué hacer en su lugar

> Lista de patrones que delatan motion/diseño generado por IA o por plantilla, cada uno con **alternativa** y **regla verificable por un linter** (`motion-lint`). Los IDs (`AI-xx`) son estables para referenciarlos en el código (`// motion-lint-disable AI-03: razón`).

## 1. Motion

| ID | Tell | Qué hacer en su lugar | Regla lintable |
|---|---|---|---|
| AI-01 | Easing lineal en movimientos | Tokens de `01-easing-y-curvas.md` | `interpolate()` sobre `translate*/scale/rotate` sin `easing` → error |
| AI-02 | Todo entra a la vez | Stagger 2–5 f, jerarquía temporal | ≥ 3 hermanos con el mismo frame de inicio → error |
| AI-03 | Fades uniformes (solo opacidad, misma duración en todo) | Combinar con `y`/blur/máscara; duraciones distintas por jerarquía | > 60 % de las entradas son solo `opacity` → warning; varianza de duraciones = 0 → warning |
| AI-04 | Misma duración para todo (p. ej. todo 30 f) | Duración por tamaño/distancia (`02-tiempos.md`) | ≥ 80 % de animaciones con la misma `durationInFrames` → warning |
| AI-05 | Entradas y salidas simétricas (salida = entrada al revés) | Salida más corta con curva `-in` | salida con curva `-out` o duración ≥ entrada → warning |
| AI-06 | `ease-in-out` / CSS `ease` en todo | Asimetría `arrive`/`leave` | literal `'ease'`, `'ease-in-out'`, `Easing.inOut(Easing.ease)` → warning |
| AI-07 | Scale-from-0 "pop" en todo | Pop solo en iconos/badges; texto con máscara | `scale` de 0→1 en > 2 elementos por escena → warning |
| AI-08 | Cámara muerta (frame 100 % estático) | Push-in 3–8 %, drift, parallax | > 60 f sin transform en raíz/cámara → warning |
| AI-09 | Sin motion blur en movimientos rápidos | `CameraMotionBlur` 180° | Δpos > 30 px/f sin blur → warning |
| AI-10 | Bounce/elastic exagerado en UI corporativa | Overshoot ≤ 8–12 % o spring crítico | spring con ζ < 0.35 en texto/UI → warning |
| AI-11 | Ritmo metronómico (cada evento en cada beat, o cada 1.0 s exacto) | Acentos en beats seleccionados, swing, contraste rápido/lento | intervalos entre eventos con desviación estándar < 2 f → warning |
| AI-12 | Rotaciones/flotaciones infinitas sin motivo ("todo levita") | Movimiento con intención; drift sutil global | > 3 elementos con loop sinusoidal simultáneo → warning |
| AI-13 | Typewriter para cualquier texto | Mask reveal por línea/palabra | typewriter en texto que no es terminal/chat → info |
| AI-14 | Transiciones aleatorias (cada corte distinto) | 2–3 tipos de transición por pieza | > 3 presentaciones distintas → warning |
| AI-15 | Cross-dissolve como transición universal | Corte en el beat, match cut, push con blur | `fade()` > 30 % de transiciones → warning |

## 2. Diseño visual

| ID | Tell | Qué hacer en su lugar | Regla lintable |
|---|---|---|---|
| AI-20 | Gradiente morado→azul/cian ("VibeCode purple", `#7C3AED→#06B6D4`, `#8B5CF6→#3B82F6`) | Paleta derivada de la marca; neutros cálidos + 1 acento | gradiente con hue inicial 255–295° y final 185–235° (OKLCH) → warning |
| AI-21 | Inter/Roboto/system-ui como display, centrado | Display con carácter, alineación a grilla izquierda | `fontFamily` genérica en texto ≥ 72 px → warning; > 50 % bloques centrados → warning |
| AI-22 | Glassmorphism por defecto (`backdrop-filter: blur` + borde blanco 10–20 %) | Superficies sólidas con textura, sombras con dirección | `backdropFilter` en > 1 superficie por escena → warning |
| AI-23 | Glow neón y rejillas sobre fondo negro (look "AI startup") | Fondo con temperatura y grano; glow solo en fuentes de luz motivadas | `box-shadow`/`drop-shadow` de color saturado con blur > 30 px en > 2 elementos → warning |
| AI-24 | Negro `#000` y blanco `#FFF` puros | `#0E0C0A`, `#F4F1EA`, etc. | hex exactos como fondo → warning |
| AI-25 | Gradientes lisos sin grano (banding) | Ruido 2–4 % + grano | gradiente > 30 % del cuadro sin capa de ruido → warning |
| AI-26 | Cards idénticas con icono arriba en grilla de 3 | Composición asimétrica, tamaños jerárquicos, 1 héroe | ≥ 3 cards con mismo tamaño y estructura → info |
| AI-27 | Esquinas redondeadas iguales en todo (`16px`) y sombras `rgba(0,0,0,0.1)` | Sistema de radios (0/4/24) por jerarquía, sombras con dirección única | un solo `borderRadius` en > 90 % de elementos → info |
| AI-28 | Emojis o iconos genéricos (Lucide/Heroicons sin tocar) como protagonistas | Iconografía propia, ilustración, foto real | icono de librería > 160 px → info |
| AI-29 | Borde de color a la izquierda en cards/quotes (3–4 px) | Jerarquía por tipo y espacio | `borderLeft` de color en cards → info |
| AI-30 | Partículas/bokeh/"orbes" flotando sin función | Foreground occluders reales, textura de cámara | > 20 partículas genéricas sin interacción → info |
| AI-31 | Mockups 3D de teléfono girando en el vacío | Mano/contexto real, cámara con intención, sombra en superficie | — (revisión humana) |
| AI-32 | Sin textura física: bordes perfectos, sin grano, sin viñeta, sin aberración | Look pass de `06-color-y-textura.md` | composición final sin `<Grain>`/`<Look>` → info |

## 3. Contenido y narrativa

| ID | Tell | Alternativa |
|---|---|---|
| AI-40 | Copy genérico en pantalla ("Unlock your potential", "Revolutionize…") | Copy concreto con números y verbos del producto |
| AI-41 | Imágenes de stock/IA con manos o texto deformado, piel plástica | Foto real, ilustración propia, o IA revisada a mano (upscale + retoque) |
| AI-42 | Voz TTS plana sin pausas | Dirigir la voz (pausas, énfasis), respiraciones, ducking de música |
| AI-43 | Música de librería genérica sin estructura con el video | Editar al tema (intro/build/drop), cortes en downbeats |
| AI-44 | Final sin hold (corta justo al aparecer el logo) | Hold 1.5–2.5 s + cola de audio |

## 4. Esqueleto del linter

```ts
// scripts/motion-lint.ts (idea): analizar el AST de las composiciones + muestrear frames renderizados
type Finding = {id: string; level: 'error' | 'warning' | 'info'; file: string; line: number; msg: string};

// Estático (ts-morph / babel):
//  - AI-01: CallExpression interpolate(...) cuyo objeto destino alimenta transform y sin propiedad `easing`
//  - AI-06: StringLiteral 'ease' | 'ease-in-out' en style.transition / animation
//  - AI-20: colores en linear-gradient → convertir con culori a oklch y comparar hues
//  - AI-21: fontFamily en estilos con fontSize >= 72
//  - AI-24: backgroundColor '#000'/'#000000'/'#fff'/'#ffffff'
// Dinámico (render de baja resolución, 1 frame cada 3):
//  - AI-02/04/11: registrar inicio/duración de cada animación (instrumentar helpers del kit: arrive(), leave()...)
//  - AI-08: diff de transform del contenedor raíz entre frames
//  - AI-09: velocidad de bounding boxes vs presencia de blur
// Salida: lista Finding[] + resumen; CI falla con cualquier `error`.
```

> Clave práctica: si todas las animaciones pasan por helpers del kit (`arrive()`, `leave()`, `stagger()`, `springPreset()`), el linter dinámico puede registrar cada animación sin parsear CSS arbitrario.

## 5. Tells nuevos de los referentes (2026-11-07)

| ID | Tell | Qué hacer | Cómo se verifica |
|---|---|---|---|
| AI-33 | Recortes (frutas, objetos) pegados alrededor del producto con la misma sombra | Objetos en la misma escena de Blender con la misma luz, o foto real con sombra coherente | Revisión humana |
| AI-45 | Brief sin reglas, marca, referencias ni revisión ("vistoso, moderno, oscuro") | Preflight de 4 insumos y brief en 5 bloques (skill `master-motion`) | Puerta 1 de la skill |
| AI-46 | El titular repite lo que dice el subtítulo o la voz | El texto grande lleva el dato o la palabra clave; la voz cuenta el resto | Revisión humana |
| AI-47 | Datos, cifras o gráficas dentro de un clip generado | Se dibujan en código desde el JSON de datos (`CountUp`, `LineDraw`) | Revisión humana |
| AI-48 | Texto que asoma antes de su entrada | Máscara u ocultar hasta el inicio | Fotogramas de control; pendiente en `motion-audit` |

## 5b. Tells de dirección de arte (lección de la demo v0.1.0, 2026-11-07)

La primera versión de la demo pasó el linter y la auditoría en 0 y aun así se veía "igual que todo". El linter caza
errores de **oficio** (curvas, tiempos, fuentes); estos son errores de **dirección de arte** y solo los frena la
puerta de estilo (style card + styleframes aprobados, skill `master-motion` paso 2b):

| ID | Tell | Qué hacer en su lugar |
|---|---|---|
| AI-49 | La pieza es una sucesión de tarjetas de texto sobre un mismo fondo oscuro | Cada escena con una imagen protagonista distinta; el texto acompaña, no es la escena |
| AI-50 | Todo abstracto: sin foto, material, objeto, textura física ni metraje real | Material real del producto o del proceso (capturas reales, render 3D con luz, papel, objetos) |
| AI-51 | Se dice lo que el producto hace en vez de mostrarlo funcionando | Prueba visual: el producto trabajando en cuadro, el antes y el después |
| AI-52 | Una sola composición repetida (titular arriba a la izquierda, mismo tamaño) | Sistema de layouts con contraste de escala y de valor (claro/oscuro) entre escenas |
| AI-53 | Paleta de "dark mode de herramienta dev" por defecto | Decidir la paleta desde la referencia y la idea, no desde la interfaz |
| AI-54 | Sin referencia visual: la dirección sale del modelo | Mínimo 2 referencias visuales aprobadas antes de diseñar |

## 6. Qué herramienta verifica qué

- `scripts/lint-motion.mjs` (estático): AI-01, AI-02, AI-05, AI-06, AI-07, AI-10, AI-20, AI-21, AI-22, AI-24, CURVE-01, T-01 y **F-01** (fuente no cargada).
- `scripts/motion-audit.mjs` (dinámico, renderiza sin guardar imágenes): AI-02, AI-04, AI-11, **D-01** (densidad por género) y sonido **S-01** (risers), **S-02** (whoosh largos), **S-03** (gestos por 10 s), **S-04** (sonido tapado por un hit).
- `scripts/stills.mjs`: fotogramas de control, hoja de storyboard y cierre de bucle.
- `scripts/critica/medir-pieza.sh` (sobre el **render**, con flujo óptico por zonas): mide lo que se ve moverse, no lo que el código dice. Marca **AI-01** (velocidad constante de punta a punta), **V-01** (frenada en seco: termina a más del 70 % de su velocidad con el elemento a la vista, o cae a menos del 35 % de un cuadro al siguiente), **V-02** (salida en seco: la mitad o más del contenido desaparece en un solo cuadro, sin salida ni transición; cuenta también los cuadros vacíos que deja), **AI-02** (tres o más grupos separados arrancan en el mismo cuadro), **D-01** (hueco sin eventos nuevos sobre el umbral del género, el mismo de `motion-audit`), **AI-08** (cuadro congelado, sin deriva, más de 2 s), **AI-09** (más de 30 px/f: confirmar el blur en la tira), **L-01** (contenido que llega y se va antes del hold de lectura, `readingHold`) y **AI-44** (hold final de menos de 1,5 s).
- `agents/critico-motion.md` (mira el render medido): historia, mirada, oficio (los 12 principios de `kb/00`), acabado y **AI-49 a AI-54**, que ninguna herramienta de código puede ver. Devuelve puntajes, los 5 peores momentos y veredicto.
- `scripts/verify.mjs`: corre el linter, las pruebas y la auditoría en orden; con `--render <mp4>` suma la medición del render.

### 6.1 El bucle: construir → medir → criticar → corregir

Las cuatro herramientas miran cosas distintas y ninguna reemplaza a otra. La demo v0.1.0 pasó las dos primeras en 0 y se veía igual que todo (§5b): por eso el cierre de una pieza es el veredicto del crítico, no el verde del linter.

| Paso | Herramienta | Qué mira | Qué no puede ver |
|---|---|---|---|
| Construir | `lint-motion.mjs` | El código: curvas, fuentes, colores, staggers escritos | Si el resultado se mueve bien |
| Construir | `motion-audit.mjs` | Los eventos que emiten los helpers del kit: cuándo arranca cada animación y cada sonido | Lo que no pasa por el kit (CSS a mano, video, 3D) y cómo se ve |
| Medir | `critica/medir-pieza.sh` | Los píxeles del render: velocidad real por zona, cuadro a cuadro | Si la historia se entiende; qué es texto y qué no |
| Criticar | agente `critico-motion` | Hoja de contactos, tiras y medición: rúbrica de 5 criterios | Nada que no esté en una imagen o un número (no lee el código antes de puntuar) |
| Corregir | quien construye | Los 5 peores momentos, cada uno con tiempo, causa y corrección | — |

```
scripts/host.sh run 'cd /opt/bodega/estudio/studio && npx remotion render src/index.ts <Pieza>-<formato> out/<pieza>.mp4'
scripts/critica/medir-pieza.sh studio/out/<pieza>.mp4 --genre <género> --host vps
# agente critico-motion sobre studio/out/critica/<pieza>/  →  critica.json
# corregir los peores momentos, volver a renderizar y repetir hasta "pasa"
```

Reglas del bucle:

1. **Quien construye no critica.** El crítico es un agente aparte, sin el storyboard ni el código delante al puntuar historia y mirada.
2. **Umbral por defecto:** promedio ≥ 4,0 y ningún criterio por debajo de 3. Se puede cambiar por pieza, antes de criticar, no después.
3. **La medición es una estimación.** El flujo óptico no distingue un fundido de una aparición en seco, no ve dentro de un color plano se confunde donde dos objetos se cruzan y lee una máscara que termina de revelar o un barrido de luz como un objeto que frena en seco (falsos V-01 y AI-09). Cada hallazgo trae su tira (`tiras/hallazgo_NN.jpg`): si la tira lo contradice, gana la tira.
4. **Contra un referente:** `medir-pieza.sh <render> --referente <carpeta del referente>` agrega `comparacion` (ritmo, formas de movimiento, eventos por 10 s) y `lado-a-lado.jpg` con los mismos momentos de las dos piezas; el crítico en modo `comparar` dice qué tiene el cuadro del referente que el nuestro no.
5. **Lectura:** con `tesseract` (instalado en el VPS de Bodega o en este equipo) el script cuenta las palabras nuevas de cada llegada, por zona, y marca L-01 contra `max(1, 0,4 + palabras / 3,5)` s (`02-tiempos.md` §3). El OCR se equivoca con texto pequeño o a medio revelar, así que deja un cuadro de cada llegada en `estados/` y el crítico confirma el conteo. Sin `tesseract` (por ejemplo, midiendo en el PC) L-01 queda como aviso informativo y las cuenta el crítico.
6. **Tres vueltas sin pasar** es señal de que el problema es de guion o de dirección de arte, no de curvas: se vuelve a la puerta de estilo, no se sigue puliendo.

El medidor tiene su propia prueba con un clip sintético de errores conocidos: `python3 scripts/critica/prueba-sintetica.py` (lineal, tres arranques a la vez, cuadro congelado, frenazo, salida en seco, final sin hold).

## Fuentes

- Paralect — "Signs of AI slop in design: 21 patterns": https://www.paralect.com/blog/signs-of-ai-slop-in-design (consultado 2026-11-07)
- Developers Digest — "AI Design Slop: 16 Patterns That Mark a Site as Vibe-Coded": https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it (consultado 2026-11-07)
- Impeccable — catálogo "Slop" (gradientes morados, glass, neón): https://impeccable.style/slop/ (consultado 2026-11-07)
- prg.sh — "Why Your AI Keeps Building the Same Purple Gradient Website": https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website (consultado 2026-11-07)
- Mohit Phogat — "AI Design Slop: Why Every AI-Built Interface Looks the Same": https://mohitphogat.medium.com/ai-design-slop-why-every-ai-built-interface-looks-the-same-and-how-to-fix-it-bf874e0b470c (consultado 2026-11-07)
- Anthropic — skill `frontend-design` (evitar Inter, gradientes morados, layouts genéricos): https://github.com/anthropics/skills/tree/main/skills/frontend-design (consultado 2026-11-07)
