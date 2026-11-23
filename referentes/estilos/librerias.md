# Estilos y técnicas desde librerías, plantillas y showcases técnicos

Investigación del 2026-11-07 para ampliar el repertorio de Master Motion. Alcance: librerías de código, marketplaces
de plantillas y showcases técnicos (Codrops, GSAP, motion.dev, react-bits, magicui, aceternity, Remotion, HyperFrames,
LottieFiles, Rive, Jitter, Cavalry, Rotato/Shots, Motion Array, Envato).

Ninguna técnica de esta lista repite los 17 presets que ya existen (MaskTitle, CharCascade, WordRotator, LineDraw,
CountUp, MarkerHighlight, LowerThird, KaraokeCaption, CameraRig, Parallax, DepthCards, LogoSting, SplitReveal,
GlitchHit, BlenderLayer, LottieLayer, Look, transiciones whip/zoomThrough/maskWipe, Terminal, PlanoInclinado). Cuando
una se parece a un preset existente, se explica en qué se diferencia.

Regla de licencias para el repo (MIT): se puede **reimplementar** cualquier técnica (los algoritmos no tienen
licencia). Solo se puede **copiar código** de recursos MIT/Apache/CC0 y cada copia va a `CREDITOS.md`. GSAP y
Remotion tienen licencias propias: se usan como dependencias, no se vendorizan.

---

## 1. ScrambleResolve: decodificado de texto con barrido

**Qué es.** Cada carácter pasa por glifos aleatorios antes de llegar al definitivo, y la resolución avanza de
izquierda a derecha (o desde el centro) mientras un `clip-path` descubre la línea. CharCascade anima posición y
opacidad. Este anima el contenido del glifo.

**Implementación (Remotion).** El pseudoaleatorio sale de una semilla (`random(seed + i + frame)` de Remotion) para que
el render sea determinista. Por carácter `i`: `tResolve(i) = delay + i * stagger`. Si `frame < tResolve(i)`, se dibuja
`GLYPHS[floor(random(i, floor(frame / hold)) * GLYPHS.length)]`; si no, el carácter real. El barrido en paralelo es
`clip-path: inset(0 X% 0 0)`, con X de 100 a 0 en ease out. La variante "desde el centro" ordena los índices por
`|i - n/2|`. Los glifos van en monoespaciada o con `font-variant-numeric: tabular-nums` para que el ancho no tiemble.

**Parámetros medibles.** Glifos: `A–Z0–9` o un set de marca (`/\\|_-+*`). Cambio de glifo cada 2–3 frames a 30 fps
(`hold`), no cada frame, porque si no se vuelve ruido. Stagger de 1–2 frames por carácter. Barrido de 0.6 s en
`power2.out`, según el snippet de Codrops. Duración total de 0.6–1.2 s por línea.

**Licencia.** El efecto se reimplementa (unas 30 líneas). GSAP ScrambleTextPlugin está bajo la Standard "No Charge"
License de Webflow: gratis y comercial, pero no es MIT; sirve en HyperFrames como dependencia, no para copiarlo al repo.
Los ejemplos de motion.dev sirven como referencia visual.

**Ejemplos.**
- https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/ (scramble más clip-path en paralelo, con código)
- https://motion.dev/examples/react-scramble-text-stagger-center (scramble con stagger desde el centro)
- https://gsap.com/text/ (ScrambleText oficial)

**Gastado.** Medio: es el "hacker text" de las plantillas tech. Para darle oficio: usarlo solo en datos o términos
técnicos (un número, un nombre de modelo), nunca en titulares completos. Glifos de la marca, resolución que termina con
un leve overshoot de peso o color en el carácter final, y sonido de tick sincronizado al `hold`.

---

## 2. BayerDither: tramado ordenado como textura y como revelado

**Qué es.** Tramado ordenado con matriz de Bayer: convierte gradientes y fotos en un patrón de puntos de 1 bit. Sirve
como look (alternativa al grano de `Look`) y como transición, si se anima el umbral.

**Implementación.** En un fragment shader (Remotion con `@remotion/three` o un canvas WebGL, o bien HyperFrames):
`Bayer2(a) = fract(a.x/2 + a.y*a.y*0.75)` y la versión recursiva `Bayer4/8` según el tutorial. El píxel queda encendido
si `luma + (bayer - 0.5) * k > threshold`. Revelado: `threshold` pasa de 1 a 0 en ease in-out y la imagen "se imprime"
por niveles de trama. Con ruido fbm modulando el umbral, el revelado se vuelve orgánico. Sin WebGL hay alternativa:
pre-render en Python/ffmpeg en el VPS de Bodega o en este equipo (`ordered dither`) y luego usar `<OffthreadVideo>`.

**Parámetros medibles.** Tamaño de "pixel" de 4–10 px (el tutorial usa 10). Matriz Bayer8: según el autor, más allá de
8×8 casi no se nota diferencia. Paleta de dos tintas de la marca (tinta más papel), no blanco y negro puro. Revelado de
0.8–1.4 s.

**Licencia.** Código de demo en https://github.com/zavalit/bayer-dithering-webgl-demo (la licencia del repo está por
verificar antes de copiar). La fórmula es de dominio público (Bayer, 1973); conviene reimplementarla.

**Ejemplos.**
- https://tympanus.net/codrops/2025/07/30/interactive-webgl-backgrounds-a-quick-guide-to-bayer-dithering/
- https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/
- https://tympanus.net/Tutorials/BayerDithering

**Gastado.** En ascenso: es el look "web 2025" de portafolios. Para darle oficio: usarlo con intención narrativa
(archivo, impresión, dato) y no como fondo decorativo. Dos tintas de marca, tamaño de punto ligado a la retícula, y
nunca sobre caras.

---

## 3. NoiseBlockTransition: transición por bloques de ruido con warp cromático

**Qué es.** Transición entre dos planos donde un mapa de ruido pixelado decide qué bloque cambia primero. Durante el
cambio, el plano se deforma (warp) y separa RGB. Se distingue de GlitchHit en que no es un golpe de 3–6 frames: es una
disolución estructurada y con dirección.

**Implementación.** Shader con dos texturas (fotograma saliente y entrante) y un uniform `progress`.
`blockUv = floor(uv * uNoisePixelSize) / uNoisePixelSize` y `mask = step(noise(blockUv), progress)`. El warp se escala
por `dt = parabola(progress, 2)`, que es máximo a mitad de la transición. El RGB shift también se escala por `dt`. En
Remotion encaja como `presentation` propia de `@remotion/transitions`, con un canvas WebGL por fotograma. Otra opción es
una máscara de bloques en SVG/CSS sin warp (variante barata).

**Parámetros medibles.** Bloques de 8–24 columnas. `uDisplaceIntensity` de 0.02–0.06 en UV. RGB shift de 2–6 px como
máximo. Duración de 12–20 frames a 30 fps. Ruido estático (no cambia con el tiempo) para que el patrón se lea.

**Licencia.** Snippet publicado en Codrops (la licencia del repo del autor está por verificar). La demo de WebGL Image
Transitions de Codrops vive en su propio repo. Se reimplementa.

**Ejemplos.**
- https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/ (shader "Video Carousel Transition")
- https://tympanus.net/Development/webGLImageTransitions/
- https://jitter.video/ (plantilla "Pixelated Slideshow" en la home)

**Gastado.** Bajo si el RGB shift es sutil. Riesgo: con aberración fuerte cae en el "glitch de plantilla" que se
describe abajo. Lo mejor es que el ruido sea la textura de la marca (trama de la sección 2, retícula), no Perlin
genérico.

---

## 4. ShapeMorph: morph de trazados SVG

**Qué es.** Un ícono o forma se transforma en otro (por ejemplo logo → ícono de producto → número), con interpolación de
trazado. LineDraw solo dibuja el trazo, y LogoSting anima un logo fijo.

**Implementación (Remotion).** `flubber.interpolate(fromPath, toPath, { maxSegmentLength: 2 })` devuelve `f(t)`, y
`d={f(interpolate(frame, [a, b], [0, 1], { easing }))}`. Si las formas tienen distinto número de piezas se usa
`flubber.separate`/`combine`. Hay que precalcular la función una sola vez con `useMemo`. En HyperFrames, MorphSVGPlugin
de GSAP. En AE, Shape morph nativo.

**Parámetros medibles.** Duración de 0.5–0.9 s en `cubic-bezier(0.7, 0, 0.2, 1)` (ease in-out fuerte, nada de lineal).
Hold de 0.3 s en cada forma. Añadir una rotación de 5–15° o un overshoot de escala de 1.04 en la llegada para dar peso.
`maxSegmentLength` de 2–4 (más bajo es más suave y más pesado).

**Licencia.** flubber (veltman): la licencia en GitHub está por verificar (se usa como dependencia npm). GSAP
MorphSVG: Standard License de Webflow, gratis y comercial, no MIT.

**Ejemplos.**
- https://github.com/veltman/flubber
- https://veltman.github.io/flubber/demos/basic-svg.html
- https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/

**Gastado.** El "blob que se transforma" sí está gastado. Para darle oficio: morph entre formas con significado (un
dato que se convierte en ícono), con trazo de la marca, y nunca blobs morados.

---

## 5. GooeyMerge: metaballs con filtro SVG

**Qué es.** Elementos (puntos, letras, píldoras de UI) que al acercarse se funden como líquido. Se hace con desenfoque
más umbral de alfa.

**Implementación.** El filtro SVG
`<feGaussianBlur stdDeviation="10"/> <feColorMatrix mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/>`
se aplica a un `<g>` que agrupa todas las formas (tienen que estar en el mismo SourceGraphic, ver Stack Overflow). Las
posiciones se animan con `spring()` de Remotion. Para un resultado nítido se compone el texto encima sin filtro
(`feComposite in="SourceGraphic"`).

**Parámetros medibles.** `stdDeviation` de 8–14 px a 1080p. Matriz alfa `20 -9` (contraste/umbral), que es el punto de
partida canónico. Spring con `damping` 12–16 y `mass` 0.6–1 para el "estirón". Formas de 40–120 px.

**Licencia.** Técnica estándar (SVG 1.1). Las demos de Codrops están cada una en su repo, con su propia licencia (muchas
son MIT, ver más abajo). Se reimplementa.

**Ejemplos.**
- https://tympanus.net/codrops/tag/gooey/
- https://tympanus.net/codrops/tag/filter/
- https://stackoverflow.com/questions/71612006/how-to-create-svg-gooey-effect

**Gastado.** Medio: el "loader líquido" de Lottie y de los packs liquid. Para darle oficio: usarlo para explicar
relaciones (dos ideas que se unen, una burbuja de chat que nace de otra) y en paleta plana de marca, sin brillos.

---

## 6. TurbulenceType: tipografía con desplazamiento por turbulencia

**Qué es.** Texto que ondula o "hierve" (boiling line) con `feTurbulence` y `feDisplacementMap`. Da un acabado orgánico
o de dibujo a mano sin rotoscopiar.

**Implementación.** `<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed={s}/>` seguido de
`<feDisplacementMap scale={k}/>`. Para el *boil* se cambia `seed` cada 2–3 frames (en pasos discretos, como en
animación tradicional a doses), no de forma continua. Para entrada o salida, `scale` pasa de 30 a 0.

**Parámetros medibles.** `baseFrequency` de 0.01–0.04. `scale` de 2–6 para el boil sutil y de 20–40 para la
transición. Seed nueva cada 2 frames a 24 fps (cadencia "on twos").

**Licencia.** Técnica SVG estándar. El componente Squiggly Text de Aceternity usa justo esto con Motion. Ojo: la página
de licencia de Aceternity que se consultó solo cubre Pro, y la licencia de los componentes gratuitos no quedó
verificada, así que no se copia código, solo se toma como referencia.

**Ejemplos.**
- https://ui.aceternity.com/components (Squiggly Text: "SVG turbulence and displacement filters")
- https://tympanus.net/codrops/tag/svg/page/2/ (texturas y distorsión con primitivas de filtro)
- https://tympanus.net/codrops/tag/distortion/

**Gastado.** Poco, si se usa a doses y sutil. Se vuelve barato cuando el boil es continuo y rápido (parece un error de
render).

---

## 7. StretchRepeater: tipografía estirada y repetida

**Qué es.** Una palabra se repite en N copias apiladas, con `scaleY` (o `scaleX`) creciente o un estirón elástico que
rebota y vuelve a su sitio. Es un recurso de motion poster editorial.

**Implementación (Remotion).** N copias con `transform-origin` en la base. La copia k tiene
`scaleY = 1 + amp * spring(frame - k*stagger)` y `opacity` o color alternos. Para el "snap": spring con overshoot en
`scaleX` 1 → 1.6 → 1 y fondo con máscara por línea. Fuente condensada o variable con eje `wdth`, para estirar sin
deformar (ver sección 8).

**Parámetros medibles.** N = 5–9 copias. Stagger de 2–3 frames. Amplitud de estirón 0.3–0.8. Spring `stiffness` 180–260
y `damping` 14–18. Colores: 2 tonos de marca alternos, nunca un degradado.

**Licencia.** Las plantillas de Jitter solo funcionan dentro de Jitter (sin código exportable). La técnica se
reimplementa.

**Ejemplos.**
- https://jitter.video/template/stretched-type-repeater/
- https://jitter.video/template/stretch-snap-text/
- https://tympanus.net/codrops/2023/07/13/inspiration-for-text-block-transitions/

**Gastado.** Medio-alto en Jitter y en Instagram de diseño. Para darle oficio: un solo uso por pieza, en la palabra
clave, con la retícula de marca. No se usa como fondo en loop.

---

## 8. VariableAxisType: animación de ejes de fuente variable

**Qué es.** Animar `wght`, `wdth`, `slnt` u `opsz` por carácter: la letra se engorda, se ensancha o se inclina en lugar
de moverse. Es "movimiento sin desplazamiento", muy de motion editorial.

**Implementación (Remotion).** `font-variation-settings: "wght" ${w}, "wdth" ${d}` por `<span>` de carácter, con `w`
calculado por `interpolate` y stagger, o con una "ola" `sin(frame*f - i*phase)`. Hace falta una fuente variable cargada
con `@remotion/google-fonts` o una local (Inter, Roboto Flex, Fraunces, Recursive). El ancho de línea cambia, así que se
reserva el ancho máximo o se alinea a la izquierda. En AE se hace igual con ejes variables (beta).

**Parámetros medibles.** `wght` 300 → 800, `wdth` 75 → 125 (según la fuente). Ola con período de 1.2–2 s y desfase de
0.15–0.3 rad por carácter. Entrada con stagger de 1–2 frames y ease out expo.

**Licencia.** Fuentes Google Fonts bajo OFL (compatibles; se documentan en `CREDITOS.md`). La técnica es CSS estándar.

**Ejemplos.**
- https://www.youtube.com/watch?v=aWZUS59HVsQ (Variable Font Kinetic Type en AE)
- https://www.facebook.com/codrops/posts/today-we-have-a-new-demo-for-you-text-character-animations-with-gsap-nineteen-ch/1787526780043464/ (Codrops menciona una herramienta de animación de fuentes variables con OpenType)
- https://tympanus.net/codrops/tag/typography/

**Gastado.** Poco en video, solo algo en web. Para darle oficio: ligar el peso a algo con sentido (volumen de voz, un
dato que sube) en vez de una ola decorativa.

---

## 9. CylinderText: texto en anillo o cilindro 3D

**Qué es.** Texto distribuido en un círculo o un cilindro que gira en 3D y se deforma según la velocidad. El "sello
rotatorio" y la cinta 3D de palabras.

**Implementación.** Remotion y CSS 3D: cada carácter `rotateY(i * 360/n) translateZ(r)` dentro de un contenedor con
`perspective`, y el contenedor rota con `interpolate`. La distorsión por velocidad sale de `skewX` proporcional a la
derivada de la rotación. Con calidad 3D real: Three.js (`@remotion/three`) con texto en SDF (troika), o Blender (Curve
modifier sobre texto, render en el VPS de Bodega o en este equipo).

**Parámetros medibles.** Radio de 0.3–0.45 × el ancho del cuadro. 1 vuelta cada 6–10 s (lento y legible). Perspectiva
de 800–1500 px. Caras traseras al 20–35 % de opacidad para que el frente se lea.

**Licencia.** Código de los tutoriales de Codrops (licencia por repo, por verificar). Troika es MIT, aunque eso no se
verificó en esta ronda. Se reimplementa.

**Ejemplos.**
- https://tympanus.net/codrops/2025/02/03/building-an-on-scroll-3d-circle-text-animation-with-three-js-and-shaders/
- https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/
- https://github.com/ehaakana/codrops-text-demo (WebGL Text con Troika, MIT)

**Gastado.** El sello circular rotatorio ("• scroll • scroll •") está muy gastado en web. El cilindro como plano de
video con lectura de una frase sigue siendo fresco. Nada de cromados.

---

## 10. ProceduralArray: duplicador con falloff (estilo Cavalry)

**Qué es.** Una forma base se replica en retícula, radial o sobre un trazado, y un "falloff" (distancia a un punto,
ruido, gradiente) modula escala, rotación o color de cada copia. Es la base de la animación procedural de Cavalry.

**Implementación (Remotion).** Se genera la lista de N instancias `{x, y, i}` y para cada una
`f = falloff(distancia(x, y, foco(frame)))`, con `foco` animado y `falloff = smoothstep(r1, r0, d)`. Luego
`scale = lerp(sMin, sMax, f)` y `rotate = f * 90`. Con ruido: `noise2D(x*fx, y*fy + frame*v)` de `@remotion/noise`.
Hasta unas 2.000 instancias va bien en SVG; por encima, canvas. En Cavalry o AE (Repeater) es nativo.

**Parámetros medibles.** Retícula de 12×12 a 32×32. Radio de falloff de 15–35 % del cuadro. El foco viaja con ease
in-out en 1.5–3 s. Paleta de 2–3 tonos asignados por índice (`i % 3`), no un arcoíris.

**Licencia.** Cavalry es software propietario (sin código reutilizable). `@remotion/noise` viene con la licencia de
Remotion (gratis hasta 3 personas, licencia de empresa por encima). La técnica se reimplementa.

**Ejemplos.**
- https://schoolofmotion.com/blog/getting-started-with-cavalry-5-things-every-beginner-should-know (Duplicator)
- https://www.youtube.com/watch?v=JMrRz2DGvd4 (duplicators, color arrays, noise behaviours, falloffs)
- https://cavalry.studio/en/

**Gastado.** El fondo de puntos que ondulan está gastado. Para darle oficio: que el array sea el mensaje (cada punto es
un cliente o un dato) y que el foco siga la narración o el cursor de la demo.

---

## 11. DeviceOrbit: mockup 3D de dispositivo con pantalla grabada

**Qué es.** iPhone o laptop 3D con una grabación de pantalla real, una cámara que orbita y se acerca a un detalle de la
UI. Es el lenguaje de Rotato y Shots. Se diferencia de PlanoInclinado (plano 2.5D inclinado) en que hay geometría y
reflejos reales.

**Implementación.** Blender en el VPS de Bodega o en este equipo: modelo de dispositivo, textura de video en la pantalla (emisión), cámara
con curva Bézier y DOF, render EEVEE/Cycles con alfa, y composición en Remotion con `BlenderLayer`. Alternativa
ligera: `@remotion/three` con un GLB del dispositivo y `VideoTexture`. Ya hay skills `blender-phone-3d` y
`blender-macbook-3d` que se pueden reaprovechar.

**Parámetros medibles.** Órbita de 15–35° en 3–5 s. Zoom final hasta 1.6–2.5× sobre el elemento de UI. Ease in-out con
hold de 0.5 s en el detalle. f/2.8–4 equivalente de desenfoque. Sombra de contacto suave, sin reflejos "chrome".

**Licencia.** Rotato y Shots.so son herramientas propietarias (solo referencia). Los modelos de dispositivo hay que
comprarlos o hacerlos propios, y las marcas Apple tienen sus reglas de uso. Las plantillas de Jitter dependen de la
plataforma.

**Ejemplos.**
- https://rotato.app/blog/mockup-video-examples
- https://shots.so/
- https://jitter.video/templates/devices/

**Gastado.** Alto: el giro de 360° de iPhone flotando con fondo degradado es plantilla pura. Para darle oficio: una
sola órbita motivada (de la vista general al botón que importa), un fondo de la marca y que la grabación de pantalla
sea real con el cursor coreografiado.

---

## 12. LightLeakOverlay y ClockWipe nativos de Remotion

**Qué es.** Dos recursos oficiales de `@remotion/transitions` que el estudio todavía no usa: el overlay de *light leak*
entre secuencias (`TransitionSeries.Overlay`, desde v4.0.415) y el `clockWipe()` circular. No son whip, zoomThrough ni
maskWipe.

**Implementación.** `<TransitionSeries.Overlay durationInFrames={20}><LightLeak/></TransitionSeries.Overlay>` entre dos
`Sequence`. Para el wipe: `presentation={clockWipe({ width, height })}` y se cambia `linearTiming` por
`springTiming`, o por una curva propia, para no caer en el easing lineal (regla de `kb/10-anti-look-ia.md`).

**Parámetros medibles.** Light leak de 15–24 frames, en tonos cálidos de la marca o tintado, opacidad máxima del 60–80 %
y modo `screen`. ClockWipe de 18–30 frames, con el origen del barrido fuera del centro (el componente acepta tamaño, y
el centro descentrado se consigue con un wrapper).

**Licencia.** Remotion License: gratis para individuos y empresas de hasta 3 personas, licencia de empresa por encima.
No es MIT, pero se usa como dependencia (el repo ya depende de Remotion).

**Ejemplos.**
- https://www.remotion.dev/docs/transitioning (sección Overlays con `LightLeak`)
- https://www.remotion.dev/docs/transitions/presentations/clock-wipe
- https://github.com/remotion-dev/remotion/blob/main/packages/transitions/src/presentations/clock-wipe.tsx

**Gastado.** El light leak es un clásico de las plantillas de boda y vlog. Con oficio: una sola vez, en el cambio de
acto, tintado con el color de marca. El ClockWipe como reloj literal es kitsch; el barrido descentrado y parcial (con
borde de 2 px de color) se ve más de autor.

---

## 13. SharedElementMorph: transición de elemento compartido (FLIP)

**Qué es.** Un elemento (una tarjeta, una foto, una cifra) viaja y cambia de tamaño y radio de una composición a la
otra, y la escena nueva se construye alrededor. Es el layout animation de Motion llevado a video.

**Implementación (Remotion).** Se definen los rectángulos `A = {x, y, w, h, r}` (escena 1) y `B` (escena 2). Durante la
transición se interpola cada campo con `spring()`, `borderRadius` incluido. Para que el contenido interno no se deforme
se aplica la corrección FLIP: el contenedor escala y el hijo hace la escala inversa, o se anima `width/height` reales
porque en render no hay coste de layout. El resto de los elementos entra con stagger después de que llega el
compartido.

**Parámetros medibles.** Spring `stiffness` 170–220, `damping` 22–26, sin rebote visible (`bounce` ≤ 0.15).
Duración percibida de 0.5–0.8 s. Los elementos secundarios entran 4–8 frames después de que el compartido se asienta,
con stagger de 2 frames.

**Licencia.** Motion (motion.dev) es MIT (no se verificó en esta ronda; está en su repo de GitHub). No se usa en
render, solo se reimplementa la lógica FLIP con `spring()`.

**Ejemplos.**
- https://motion.dev/docs/react-layout-animations
- https://motion.dev/docs/animate-view
- https://github.com/codrops/ContentLayoutTransition (Codrops, MIT)

**Gastado.** Poco en video. Es de las técnicas que más "motion designer" se ve, porque da continuidad espacial real
entre planos.

---

## 14. BeamConnector: haces que recorren conectores o bordes

**Qué es.** Un destello o gradiente corto recorre un trazado entre nodos (el animated beam de magicui) o el borde de una
tarjeta (border beam). Sirve para explicar flujos ("tu dato va de A a B").

**Implementación (Remotion).** Trazado SVG entre nodos con una curva cúbica. Un segundo `<path>` con
`stroke-dasharray = [L*0.12, L]` y `stroke-dashoffset` animado de L a 0, y gradiente lineal en el trazo (o máscara). Al
llegar, el nodo destino recibe un pulso de escala de 1.06 en spring. Se diferencia de LineDraw en que el trazo no se
dibuja: un pulso viaja por un trazo que ya existe.

**Parámetros medibles.** Longitud del pulso de 8–15 % del trazado. Viaje de 0.6–1.0 s en ease in-out. Desfase de 6–10
frames entre conectores. Trazo base al 15–25 % de opacidad y pulso en el color de acento de la marca.

**Licencia.** magicui es MIT (repo `magicuidesign/magicui`): el código se puede adaptar citándolo en `CREDITOS.md`.
`border-beam` (Libraries.dev) tiene licencia por verificar.

**Ejemplos.**
- https://github.com/magicuidesign/magicui
- https://magicui.net/ ("beams" entre sus componentes)
- https://github.com/Jakubantalik/Libraries.dev (paquete `border-beam`)

**Gastado.** **Alto**: el beam morado-azul con glow es la firma visual de las landings de SaaS con IA de 2024–2026. Solo
se usa sin glow, con un color de marca plano y cuando el diagrama explica un flujo real. Nunca en el borde de tarjetas
decorativas.

---

## Estilos gastados en plantillas que hay que evitar

Con evidencia de catálogo y tendencias:

1. **Packs de transiciones masivos (glitch, zoom, partículas, split).** Envato promociona un pack de "800 options,
   including overlay, zoom, particle, glitch, and split transitions"
   (https://elements.envato.com/lp/create/after-effects-templates/best/). Cuando un recurso viene en lotes de cientos,
   ya no distingue a nadie. GlitchHit se usa como acento puntual, no como transición por defecto.
2. **Liquid titles y liquid motion.** Envato tiene una categoría completa de "Liquid Title"
   (https://elements.envato.com/video-templates/liquid+title), y Bottle Rocket lista "Liquid Motion" y "Glitchy Visuals"
   como tendencias de 2026 (https://bottlerocketmedia.net/animation-and-motion-graphics-trends/). Si está en la lista de
   tendencias genérica, en la calle ya se ve como plantilla.
3. **Kinetic typography en packs de 10–16 títulos.** Motion Array tiene decenas de packs llamados literalmente "Kinetic
   Typography" con 14–16 animaciones intercambiables
   (https://motionarray.com/after-effects-templates/kinetic-typography-24112/,
   https://motionarray.com/motion-graphics-templates/kinetic-typography-86456/,
   https://motionarray.com/after-effects-templates/kinetic-big-titles-2495765/). La señal de plantilla: titulares a
   pantalla completa, centrados, cada palabra con su propio movimiento y ningún sistema que los una.
4. **Text Generate / Typewriter de librerías de UI.** Aceternity ofrece "Text Generate Effect" (fade palabra por
   palabra) y "Typewriter Effect" como componentes de un comando (https://ui.aceternity.com/components). Es el look de
   respuesta de chatbot: si se usa, debe ser porque la pieza muestra una IA respondiendo, no como entrada de titular.
5. **Beams, glows y bordes animados de SaaS.** magicui vende "marquees, bento grids, globes, beams"
   (https://magicui.net/) y react-bits más de 165 componentes animados
   (https://github.com/Philotheephilix/reactbits.dev-skill/blob/main/react-bits/SKILL.md). Esa estética (beam con glow,
   bento con spotlight, globo con puntos) coincide con la lista anti-look-IA del estudio (glow neón, degradado
   morado-azul).
6. **Microanimaciones genéricas de Lottie.** Las etiquetas destacadas de LottieFiles son loading, loader, success, check
   y confetti (https://lottiefiles.com/featured-free-animations). Un check verde o un confeti de stock delata la pieza;
   si hace falta, se anima uno propio con la marca.
7. **Giro de dispositivo 360° sobre degradado.** Es el preset de las herramientas de mockup (Rotato, Shots, Jitter
   devices). Ver la sección 11 para la versión con oficio.

---

## Licencias destacables (resumen)

| Recurso | Licencia | ¿Se puede copiar código al repo MIT? |
|-|-|-|
| magicui | MIT | Sí, con crédito en `CREDITOS.md` |
| react-bits | MIT + Commons Clause | Uso sí; **no** se puede revender. Mejor reimplementar, porque el repo es MIT puro |
| Aceternity UI (gratis) | No verificada (la página de licencia es de Pro) | No, solo como referencia |
| GSAP (todos los plugins) | Standard "No Charge" License de Webflow, comercial gratis | Como dependencia sí; vendorizar no |
| Remotion y paquetes `@remotion/*` | Remotion License (gratis hasta 3 personas) | Dependencia, ya en uso |
| HyperFrames (HeyGen) | Apache-2.0 | Sí, con NOTICE/crédito; el registry tiene unos 450 bloques editables |
| Codrops | Cada demo es un repo con su propia licencia; muchas son MIT (ContentLayoutTransition, Theodore) | Solo las de LICENSE MIT, verificando cada repo |
| LottieFiles (gratis) | Lottie Simple License: comercial y sin atribución obligatoria | Los assets sí; el Marketplace de pago no |
| flubber | Por verificar en el repo | Como dependencia npm |
| Jitter, Cavalry, Rotato, Shots, Rive Marketplace | Propietarias o ligadas a su plataforma | No, solo referencia |
| Motion Array y Envato Elements | Suscripción de stock | No, solo referencia y evidencia de lo gastado |

No se revisaron en profundidad Spline community ni Rive community (solo se confirmó que existe el Marketplace de Rive y
cómo funcionan sus state machines). Quedan pendientes para otra ronda.

---

## Fuentes

Todas consultadas el 2026-11-07 (resultados de búsqueda y scrape de Firecrawl).

1. https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/
2. https://motion.dev/examples/react-scramble-text-stagger-center
3. https://motion.dev/examples
4. https://gsap.com/text/
5. https://gsap.com/community/standard-license/
6. https://gsap.com/pricing/
7. https://tympanus.net/codrops/2025/07/30/interactive-webgl-backgrounds-a-quick-guide-to-bayer-dithering/
8. https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/
9. https://tympanus.net/Tutorials/BayerDithering
10. https://github.com/zavalit/bayer-dithering-webgl-demo
11. https://tympanus.net/Development/webGLImageTransitions/
12. https://jitter.video/
13. https://github.com/veltman/flubber
14. https://veltman.github.io/flubber/demos/basic-svg.html
15. https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/
16. https://tympanus.net/codrops/tag/gooey/
17. https://tympanus.net/codrops/tag/filter/
18. https://stackoverflow.com/questions/71612006/how-to-create-svg-gooey-effect
19. https://ui.aceternity.com/components
20. https://ui.aceternity.com/licence
21. https://tympanus.net/codrops/tag/svg/page/2/
22. https://tympanus.net/codrops/tag/distortion/
23. https://jitter.video/template/stretched-type-repeater/
24. https://jitter.video/template/stretch-snap-text/
25. https://tympanus.net/codrops/2023/07/13/inspiration-for-text-block-transitions/
26. https://www.youtube.com/watch?v=aWZUS59HVsQ
27. https://www.facebook.com/codrops/posts/today-we-have-a-new-demo-for-you-text-character-animations-with-gsap-nineteen-ch/1787526780043464/
28. https://tympanus.net/codrops/tag/typography/
29. https://tympanus.net/codrops/2025/02/03/building-an-on-scroll-3d-circle-text-animation-with-three-js-and-shaders/
30. https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/
31. https://github.com/ehaakana/codrops-text-demo
32. https://schoolofmotion.com/blog/getting-started-with-cavalry-5-things-every-beginner-should-know
33. https://www.youtube.com/watch?v=JMrRz2DGvd4
34. https://cavalry.studio/en/
35. https://rotato.app/blog/mockup-video-examples
36. https://rotato.app/
37. https://shots.so/
38. https://jitter.video/templates/devices/
39. https://jitter.video/templates/
40. https://www.remotion.dev/docs/transitioning
41. https://www.remotion.dev/docs/transitions/presentations/clock-wipe
42. https://github.com/remotion-dev/remotion/blob/main/packages/transitions/src/presentations/clock-wipe.tsx
43. https://www.remotion.dev/docs/license/pricing
44. https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
45. https://www.remotion.dev/showcase
46. https://www.remotion.dev/templates/
47. https://motion.dev/docs/react-layout-animations
48. https://motion.dev/docs/animate-view
49. https://github.com/codrops/ContentLayoutTransition
50. https://github.com/codrops/Theodore
51. https://github.com/codrops/TextCharacterAnimations
52. https://tympanus.net/Demos/TextCharacterAnimations/
53. https://github.com/magicuidesign/magicui
54. https://magicui.net/
55. https://github.com/Jakubantalik/Libraries.dev
56. https://github.com/DavidHDev/react-bits
57. https://reactbits.dev/
58. https://github.com/Philotheephilix/reactbits.dev-skill/blob/main/react-bits/SKILL.md
59. https://github.com/heygen-com/hyperframes
60. https://github.com/heygen-com/hyperframes/blob/main/CLAUDE.md
61. https://hyperframes.heygen.com/
62. https://lottiefiles.com/page/license
63. https://lottiefiles.com/featured-free-animations
64. https://help.lottiefiles.com/hc/en-us/articles/900002475966-how-do-i-give-attribution-for-a-lottie-animation-i-ve-used
65. https://rive.app/marketplace/
66. https://rive.app/docs/editor/state-machine/state-machine
67. https://elements.envato.com/lp/create/after-effects-templates/best/
68. https://elements.envato.com/video-templates/liquid+title
69. https://bottlerocketmedia.net/animation-and-motion-graphics-trends/
70. https://motionarray.com/after-effects-templates/kinetic-typography-24112/
71. https://motionarray.com/motion-graphics-templates/kinetic-typography-86456/
72. https://motionarray.com/after-effects-templates/kinetic-big-titles-2495765/
73. https://varg.ai/how-to/component/codrops.slideshow-animations
