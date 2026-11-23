# 13 · Catálogo de estilos

> Menú de direcciones de arte para que cada pieza no salga igual. El brief elige **un estilo base** (y como mucho un
> acento de otro) de este catálogo, y la puerta de estilo lo muestra en styleframes antes de animar.
> Fichas completas con fuentes, ejemplos y trucos: `referentes/estilos/escuelas.md`, `redes.md` y `librerias.md`
> (investigación del 2026-11-07, 176 fuentes con URL).

## 0. Cómo usarlo

1. En el brief: estilo base + (opcional) un acento + **por qué** ese estilo sirve a ese mensaje y ese formato.
2. Decidir al principio, no al final: **frame rate de animación** (en 1s, 2s o 3s), **paleta** (n.º de tintas),
   **textura** (ninguna, grano, papel, impresión) y **motor** (Remotion, Blender, dibujo, físico). La señal más común
   de barato es un efecto "aplicado al final y a todo" (`referentes/estilos/redes.md`, notas).
3. Los rangos de abajo son de oficio para arrancar. Antes de fijarlos en un storyboard se miden contra la referencia
   concreta (agente `analista-referencias`).
4. Toda variación de textura (grano, boil, registro, glitch) cambia por cuadro **con semilla fija**: determinista en
   render, viva en pantalla.
5. Lo que el linter y `motion-audit` revisan sigue valiendo en todos los estilos. Los estilos "a saltos" (collage,
   cel, riso, stop motion) cuantizan el tiempo a propósito: declararlo con `motion-lint-disable AI-01: estilo en 2s`.

## 1. Las 20 direcciones

`Rinde` usa: R = reel/short, A = anuncio, E = explainer, V = VSL, L = lanzamiento. Motor: RM = Remotion,
BL = Blender (el VPS de Bodega), DB = dibujo a mano, FX = material físico/escaneo.

| # | Estilo | Firma medible | Rinde | Motor | Presets que lo sirven hoy | Falta |
|---|---|---|---|---|---|---|
| 1 | **Cinética suiza / brutalista** | Retícula estricta, grotesca, 1–2 tintas; cambio por golpe cada 6–15 f; stagger 1–2 f por letra; curvas expo o corte duro | R A L | RM | MaskTitle, CharCascade, SplitReveal, WordRotator | StretchRepeater, VariableAxisType, retícula como constante |
| 2 | **Editorial-documental** (Vox / Johnny Harris) | Base papel/sepia + **un** acento; planos 3–6 s, mapas 8–12 s; 10–20 cortes/min; nombres aparecen cuando se dicen | E V | RM | MarkerHighlight, LineDraw, Parallax, CameraRig | MapTrace (d3-geo), DocumentCutout, textura papel |
| 3 | **Retención creator** (MrBeast / Hormozi) | Corte cada 1–3 s; punch-in 10–20 %; captions 1–3 palabras MAYÚS con palabra activa; SFX en cada golpe | R A | RM + Whisper | KaraokeCaption, cues/sfx | PunchIn por evento, WordWindowCaption |
| 4 | **Nativo 9:16** (capa transversal) | 25–35 % tapado por UI; ~180 px arriba, ~380 abajo, ~140 der.; primer cambio < 1 s | R A L | RM | `useEscala().zona` | Overlay de zonas seguras solo en Studio |
| 5 | **Collage / papel rasgado** | Piezas en 2s–3s, sin easing (pose a pose); stagger 2–4 f "a mano"; bordes y cinta escaneados | R E L | RM + FX | Look (grano) | PosterizeTime, PaperTear, kit de bordes escaneados |
| 6 | **Cel / frame a frame / doodle** | Dibujos en 2s; line boil 2–3 versiones a 8–12 fps; write-on de trazos 6–12 f | E A R | DB + RM | LineDraw | BoilLine (feTurbulence con semilla por 2 f) |
| 7 | **2D pictórico con grano** | Pastel/acuarela; grano, aberración y light leak en dosis bajas; holds largos | L A | DB/RM | Look | LightLeak nativo de `@remotion/transitions` |
| 8 | **Anime-inspired** | Holds 12–24 f → acción de 3–4 f → hold; flashes de 1–2 f; shake 4–8 f; líneas de velocidad | L R | DB + RM | GlitchHit (flash) | SpeedLines, ImpactFrame |
| 9 | **Liquid & morph** (incl. vidrio) | Overshoot y follow-through; transiciones 12–24 f; forma asentada ≥ 1 s; 2–4 colores | A L | RM / BL | — | ShapeMorph, GooeyMerge |
| 10 | **Isométrico** | 30° exactos; 3 tonos por cara + 1 acento; cada pieza 8–15 f con overshoot 5–10 %; stagger por flujo | E V | RM / BL orto | DepthCards | IsoScene (función `iso(x,y,z)`) |
| 11 | **Data viz animada** | Un dato por plano; construir 1–2 s y sostener 2–3 s; números tabulares; 1 serie con color | E V | RM + d3 | CountUp | BarRace, UnitGrid, ejes con escala real |
| 12 | **Analógico: glitch / VHS / datamosh** | **Una** época; glitch en eventos de 2–6 f; RGB 2–8 px; datamosh solo en 1 transición | R L | RM + ffmpeg | GlitchHit | NoiseBlockTransition, VHSLayer, datamosh real en servidor |
| 13 | **Risografía e impresión** | 2–3 tintas riso por `multiply`; registro desfasado 1–4 px variable; trama; 8–12 fps | R A | RM | Look | RisoLayer |
| 14 | **Dither / pixel / 1-bit** | Paleta limitada; Bayer ordenado pensado desde el diseño, no como filtro | R L | RM | — | BayerDither (textura y revelado por umbral) |
| 15 | **3D soft / clay / satisfying** | Squash & stretch; impacto 6–10 f + asiento 12–20 f; roughness 0,5–0,8; un gag por plano | R A L | BL | BlenderLayer | Escenas Blender con shape keys / cloth con presión |
| 16 | **Producto premium / keynote** (incl. "UI como objeto") | Negro + color del producto; cámara ease-in-out 2–5 s; texto con blur de entrada; montaje al beat 0,5–1 s | L A V | BL + RM | PlanoInclinado, CameraRig, BlenderLayer | DeviceOrbit con grabación real |
| 17 | **Stop motion / miniatura real** | Sets físicos, luz práctica, 12 fps; el set rota como transición | A L | FX | — | Solo con material grabado |
| 18 | **Coded / generativo / ASCII** | Reglas en vez de keyframes; cientos de elementos; un evento claro cada 2–4 s; monocromo; mono | R L V | RM | Terminal | ScrambleResolve, ProceduralArray, AsciiLayer |
| 19 | **Mixed media que salta de dimensión** | 2D ↔ 3D ↔ live action como giro narrativo, uno por pieza | L A | RM + BL + video | BlenderLayer, Parallax | Match cut de técnica (plantilla de transición) |
| 20 | **Y2K / cromo** (restringido) | Cromo con entorno real, burbuja con bisel, 1 neón como acento | L | BL | — | Solo con brief que lo pida: choca con AI-anti-glow de `kb/10` |

**Combinaciones que funcionan:** 2+11 (explainer con datos y mapas), 3+4 (todo lo social), 1+16 (lanzamiento),
5+13 (marca personal con carácter), 18+1 (IA con tipografía), 6 doodle + 3 (talking head con énfasis dibujado).
**Chocan:** 12+16, 20+2, 15+2, y cualquier mezcla de épocas analógicas (VHS + CRT + pixel + cromo).

**Para Bodega de Belleza (provisional hasta F3):** 3 + 4 en reels de producto, 2 + 11 en explicaciones de
producto, 16 o 1 con acento 18 en lanzamientos y campañas. Lo que mida `skills/estilo-bodega` con el material de Bodega
manda sobre esta línea.

## 2. Técnicas nuevas para la librería (de librerías y showcases)

Ninguna repite los presets actuales. "Licencia" indica si el código de referencia se puede traer al repo MIT.

| Técnica | Qué hace | Implementación | Sirve a | Licencia de la referencia |
|---|---|---|---|---|
| **ScrambleResolve** | Glifos aleatorios con semilla que se resuelven mientras un `clip-path` descubre la línea | Split por carácter, `random(seed+i+floor(f/2))` | 18, 1 | Reimplementar (react-bits es MIT + Commons Clause) |
| **BayerDither** | Trama 1 bit a dos tintas; revelado animando el umbral | Matriz 4×4/8×8 en SVG pattern o canvas | 14, 13 | Algoritmo público |
| **NoiseBlockTransition** | Bloques cambian en el orden de un mapa de ruido, con warp y RGB máximos a mitad | Presentation custom de `TransitionSeries` | 12, 18 | Reimplementar |
| **ShapeMorph** | Un path se transforma en otro con ease in-out fuerte y overshoot | flubber (dep. npm) o paths con mismo n.º de puntos | 9 | flubber por verificar; GSAP MorphSVG solo como dep. |
| **GooeyMerge** | Formas que se funden como líquido | `feGaussianBlur` + `feColorMatrix` sobre alfa, posiciones en spring | 9 | Técnica pública |
| **TurbulenceType / BoilLine** | Texto o trazo que "hierve" | `feTurbulence` + `feDisplacementMap`, semilla cambia cada 2 f | 6, 5 | Técnica pública |
| **StretchRepeater** | Palabra repetida N veces con `scaleY` elástico y stagger 2–3 f | Copias apiladas + spring | 1 | Reimplementar |
| **VariableAxisType** | Animar `wght`/`wdth`/`slnt` por carácter | `font-variation-settings` por letra | 1 | Necesita fuente variable OFL (Inter y Space Grotesk lo son) |
| **CylinderText** | Texto en anillo 3D que se deforma con la velocidad | CSS 3D por carácter o Blender | 1, 16 | Reimplementar |
| **ProceduralArray** | Forma replicada en retícula con falloff que modula escala/rotación/color | Función de índice + distancia al foco (estilo duplicador de Cavalry) | 18 | Reimplementar |
| **DeviceOrbit** | Dispositivo 3D con grabación real, órbita y zoom al detalle | Blender en servidor + video de pantalla como textura | 16 | Propio (skills `blender-*`) |
| **LightLeak / ClockWipe** | Recursos nativos de `@remotion/transitions` | Timing en spring, nunca lineal | 7, 16 | Remotion License (ya en uso) |
| **SharedElementMorph** | Un elemento viaja y cambia tamaño/radio entre escenas | FLIP: medir A y B, interpolar con spring | 16, 11 | Técnica pública |
| **BeamConnector** | Pulso que recorre un conector entre nodos | Dash animado sobre path | 10, 18 | magicui MIT, pero **gastado si lleva glow**: sin halo, un solo pulso con intención |

Utilidades que comparten varios estilos y conviene tener en `lib/`: `posterizeTime(frame, n)` (estilos en 2s/3s),
`semilla(frame, cada)` (texturas vivas deterministas), `registro(capa, frame)` (riso/collage) y un overlay de zonas
seguras por plataforma.

## 3. Gastado: evitar aunque esté de moda

Con evidencia de catálogos de plantillas (detalle y URLs en `referentes/estilos/librerias.md`):

1. **Packs masivos de transiciones** (glitch, zoom, partículas): vienen de a cientos; GlitchHit queda como acento puntual.
2. **Liquid titles** como título por defecto: categoría entera en los catálogos de stock.
3. **"Kinetic typography" de pack**: titular centrado a pantalla completa, cada palabra con su movimiento y sin sistema.
4. **Text generate / typewriter de librerías de UI**: es el look de respuesta de chatbot; solo si la pieza muestra
   una IA respondiendo (como `Terminal`, que imprime salida real).
5. **Beams, glows, bento con spotlight, globo de puntos** (estética SaaS de componentes): coincide con AI-anti-glow y
   el degradado morado-azul de `kb/10`.
6. **Microanimaciones de Lottie de stock** (loader, check verde, confeti).
7. **Giro de dispositivo 360° sobre degradado** (preset de herramientas de mockup): usar DeviceOrbit con grabación real.
8. **Red neuronal de nodos conectados** como imagen de "IA" y partículas azules con glow sobre negro.

## 4. Licencias para traer código (el repo es MIT)

| Recurso | Licencia | Regla |
|---|---|---|
| magicui | MIT | Se puede copiar con crédito en `CREDITOS.md` |
| HyperFrames (HeyGen) | Apache-2.0 | Se puede, con NOTICE |
| Demos de Codrops | Una licencia por repo | Solo las que tengan LICENSE MIT, verificando cada una |
| react-bits | MIT + Commons Clause | No copiar: reimplementar |
| Aceternity UI | No verificada | Solo referencia |
| GSAP | Licencia propia de Webflow, comercial gratis | Dependencia sí, vendorizar no |
| LottieFiles (gratis) | Lottie Simple License | Assets sí, con crédito igual |
| Jitter, Cavalry, Rotato, Shots, Rive, Motion Array, Envato | Propietarias / stock | Solo referencia |

## 5. Backlog de presets por estilo

Prioridad por cuánto amplía el rango de Bodega de Belleza con el stack actual (todo Remotion salvo indicación):

- **P1 (hecho, 2026-11-07):** `posterizeTime` + `semilla` en `lib/`; ScrambleResolve; StretchRepeater; VariableAxisType; BoilLine;
  RisoLayer; BayerDither; MapTrace (editorial); WordWindowCaption + PunchIn (retención).
- **P2 (hecho, 2026-11-08):** ShapeMorph; GooeyMerge; IsoScene; BarRace/UnitGrid; NoiseBlockTransition (`noiseBlocks`);
  LightLeak/ClockWipe con spring (`clockWipeSpring`); PaperTear. Notas: ShapeMorph no usa flubber (muestreo con
  `@remotion/paths`, solo contornos simples de un trazo); LightLeak es propio, sin dependencia nueva; el borde de
  PaperTear es procedural (`bordeRasgado`): **el kit de bordes escaneados sigue pendiente** hasta tener escaneos propios.
- **P3 (hecho, 2026-11-08):** SpeedLines e ImpactFrame (Remotion); DeviceOrbit (`blender/estilo/device_orbit.py`, grabación
  real como textura, alfa → `public/blender/device-orbit.webm`); clay con squash & stretch (`blender/estilo/clay_rebote.py`
  → `public/blender/clay-rebote.mp4`); datamosh real (`scripts/datamosh.py`: borra el cuadro I de B en MPEG-4 Part 2 y
  deja que sus vectores pinten sobre A → `public/datamosh/demo.mp4`). Pendiente: escenas "inflado" (cloth con presión) y
  el kit de bordes escaneados de P2
  (2026-11-10: hay una base procedural en `studio/public/texturas/`, papeles y bordes de escáner hechos con
  `scripts/assets/texturas.py`; los escaneos propios siguen pendientes).
- **Lote de referencias (hecho, 2026-11-08):** 18 presets medidos en 27 videos y 290 pins de Pinterest
  (`referentes/lote-2026-11-08.md`, `referentes/pinterest/catalogo.md`): TextOnPath, TextWarp, TextTunnel,
  SliceDisplace, MarqueeRows, ChipCaption, Pill, BlurStack, TypeSandwich, Cursor, ScreenFrame, BentoGrid, CardMorph,
  CardCarousel, CutoutObject, BeforeAfter, SplitStack, GradientFlow.
- **P4 (candidatos del lote, por frecuencia):** ConcentricRings (3 pins), ProceduralArray (3), CutoutPop (3),
  ExtrudedType (3, Blender), KaleidoMirror (2), CutoutCollage (2 videos), ZoomOutTremor (parámetros de CapCut en
  `referentes/recursos.md`), StepBoard, DeviceScreenSwap, SmearType (CC Smear), RadialDial, FlipTiles,
  ParticleDisintegrate, CylinderText, BeamConnector, HeatMapText, LetterGridBlocks, ChromaTrail (1 cada uno).

Cada preset nuevo entra con su still en `stills.mjs`, su entrada en `presets.manifest.json` y `verify` en verde.

## Fuentes

- Envato, "11 motion design trends shaping 2026" — https://elements.envato.com/learn/motion-design-trends (consultado 2026-11-07)
- Videobolt, "Top Motion Graphics Trends for 2026" — https://blog.videobolt.net/post/top-motion-graphics-trends-2026 (consultado 2026-11-07)
- It's Nice That, "Forward-thinking graphic trends 2026" — https://www.itsnicethat.com/features/forward-thinking-graphic-trends-2026-graphic-design-120126 (consultado 2026-11-07)
- Envato, "Squishy 3D trend" — https://elements.envato.com/learn/squishy-3d-trend (consultado 2026-11-07)
- Choppity, análisis del estilo de edición de Alex Hormozi — https://www.choppity.com/tools/recreate-video-editing-style/alex-hormozi/ (consultado 2026-11-07)
- od2.in, simulador de zonas seguras Reels/TikTok/Shorts — https://od2.in/reels-safe-zone (consultado 2026-11-07)
- Meta, zona segura para Stories y Reels — https://www.facebook.com/business/help/980593475366490 (consultado 2026-11-07)
- Art of the Title, Vertigo (Saul Bass / John Whitney) — https://www.artofthetitle.com/title/vertigo/ (consultado 2026-11-07)
- Envato Elements, plantillas AE más vendidas (evidencia de lo gastado) — https://elements.envato.com/lp/create/after-effects-templates/best/ (consultado 2026-11-07)
- LottieFiles, animaciones gratis destacadas — https://lottiefiles.com/featured-free-animations (consultado 2026-11-07)
- Magic UI — https://magicui.net/ (consultado 2026-11-07)
- Listas completas de fuentes: `referentes/estilos/escuelas.md` (45), `redes.md` (58), `librerias.md` (73).
