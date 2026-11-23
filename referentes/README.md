# Referentes de video

16 videos analizados el 2026-11-07 (transcripción, cuadros clave, descripción, enlaces, skills y repos citados).
Cada uno tiene su ficha completa en `fichas/<id>.md` con el proceso paso a paso y marcas de tiempo, la técnica,
los resultados, los límites y lo que adopta el estudio. La síntesis entre todos está en `kb/12-metodos-de-referentes.md`.

El material crudo (videos, transcripciones, cuadros, skills de terceros) vive en el VPS de Bodega o en este equipo en
`trabajo/referentes/` y en `referentes/_raw/` del PC, fuera de git.

## Los 16 videos

| # | Video (ficha) | Canal | Tipo | Cómo lo hace | Resultado |
|---|---|---|---|---|---|
| 1 | [Motion Graphics con IA sin After Effects](fichas/11-0lvGltVA.md) | Vive de lo tuyo | Tutorial IA, collage | Skill "Director de Collage": guía de estilo de 14 campos → escenas de 2,5–4 s por capas → imágenes en Google Flow (Nano Banana) sobre croma → Claude Desktop recorta y anima en Remotion con un motor de cámara 3D (foco, apertura, iris, motion blur por diferencia de cámara) → fotogramas de control → export con aprobación | El más cercano a acabado de motion designer: collage documental con profundidad real, textura de película y letras al ritmo de la voz |
| 2 | [Cómo crear Motion Graphics con IA desde 0](fichas/2juhN4ckhrc.md) | Mirko Vigna | Tutorial IA, imagen → video | Hoja de producto multivista → imagen de referencia → clips con modelos de video de Artlist → montaje y edición | Clips vistosos pero con glow y cristal genérico; el texto y los datos dentro del clip fallan |
| 3 | [How I Make Motion Graphics with Claude + After Effects](fichas/3AIZ4FT61aw.md) | Artlist | Tutorial IA, Claude dentro de AE | MCP `@kumoproductions/mcp-aftereffects` + MCP de Artlist en Claude Desktop; 5 ejemplos: rastro por expresiones, callouts con tracking propio por CV, vidrio desde referencia, historia de email desde capturas, tipografía cinética de 375 capas desde un brief | Proyectos .aep editables reales; 375 capas y 2.500 keyframes en menos de 1 h; ~13 USD los 5 ejemplos; no juzga el movimiento, 3D débil |
| 4 | [Motion graphics con un prompt maestro](fichas/3rb-Wg4MjRk.md) | David Zamora | Tutorial IA, estilo → prompt | Claude analiza un video de referencia (movimiento, transiciones, color, tipo, ritmo) → prompt maestro → divide el guion en clips de 8 s → Google Flow → voz → CapCut | Estilo consistente entre clips, pero sin continuidad entre cortes ni control de curvas |
| 5 | [Motion Graphics Masterclass, Stream 34](fichas/7O2_OV4tLj4.md) | Ag Motion Designs | Masterclass After Effects (2 h) | Shape layers, Easy Ease con asas al extremo, una transformación por null, trim paths con taper, ondas de choque, coberturas circulares de 3 capas, eco tipográfico, glow de color propio | Oficio puro de AE: curvas "snap", escala global lenta como cámara, coberturas y trazos con acabado |
| 6 | [Apple Christmas Ad · 3D Motion Graphics](fichas/BaWrJajJRjA.md) | Kram.Visuals | Pieza de muestra 3D (17 s) | Solo AE: estudio high-key de producto, DOF en 3 capas, materiales táctiles (tela, burbuja iridiscente), túnel de tarjetas con fly-through, fundido a blanco | Look premium de producto; pieza no oficial (tiene erratas) |
| 7 | [Crea Motion Graphics con Claude (2 skills gratis)](fichas/C6KuUhNfZow.md) | Viegas Estudio | Tutorial IA, reels con talking head | Skills `motion-graphics-claude` y `editar-reels-claude`: entrevista → mapa de palabras clave → plan de gráficos → prueba de estilo → render; recorte del sujeto para poner elementos detrás y delante | Reels con cortes, subtítulos en 2 niveles y gráficos; la capa recortada quedó desfasada del video |
| 8 | [Motion Graphics virales con IA gratis](fichas/EWsYzp9d1Q8.md) | Alejavi Rivera | Tutorial IA, HyperFrames Studio + Open Design | Marca extraída desde URL → storyboard de 5–6 stills → render; estructura gancho → prueba → giro → CTA; voz ElevenLabs por ID | Piezas rápidas y gratis; flashes blancos y marcos con glow repetidos |
| 9 | [Insane Video Editing with Opus 5.5 (Claude Motion)](fichas/FJZkfjM8WhI.md) | kaye.creatives | Tutorial IA, edición talking head | Claude Code + MCP de Higgsfield; 2 pruebas: editar un reel (cortes, B-roll, split screen 9:16, Anton + serif) y motion design puro desde la voz con layout nuevo cada 2–3 s; notas de iteración con porcentajes | Buena edición base; el humano sigue ganando en push de cámara al ritmo, whooshes y transiciones 3D |
| 10 | [How I make motion graphics by typing to Claude](fichas/QZQqxNepbzs.md) | The Tech Girl | Tutorial IA, Claude Desktop + Remotion | Prompt de setup de Remotion + prompt de pieza (composición, contenido verificado en web, movimiento por viñetas, estilo, final, datos en archivo aparte) | Timeline animada de iPhone con look keynote; whoosh en cada corte y estética por defecto |
| 11 | [Claude Made These Animated Videos (No Remotion, $0)](fichas/bQ_8Eu-hWCs.md) | AI Madame | Tutorial IA, skill Explainer Card Director | HyperFrames + GSAP con layout fijo (ancla, tarjeta que voltea, tracker), cues por palabra de Whisper, sonido con earshot (roles, contención, presupuesto), render a 120 fps → 60 fps con motion blur y −14 LUFS | Explainers de 20–45 s muy prolijos y baratos; layout reconocible como plantilla |
| 12 | [Qué es el Motion Graphics](fichas/bXUfCy9kF94.md) | Koncepto | Explicación de fundamentos | Definición, 4 tipos (tipografía cinética, títulos, HUD/UI, explainers), software y estudios de referencia | Base conceptual y lista de estudios para estudiar (Psyop, Onesize, Autofuss…) |
| 13 | [Motion Graphics con IA desde 0 (Opus 5.5)](fichas/dTWwA2u42tc.md) | Tobías Simonetti | Tutorial IA, anuncio con HyperFrames | Claude arma una web que HyperFrames graba; "el prompt es el 10 %": reglas, marca, referencias y revisión; storyboard con stills; correcciones con [m:ss] | Explica por qué a todos les sale texto centrado con degradé; la primera versión salió mal y se corrige con reglas |
| 14 | [Product Animation Video with After Effects](fichas/fCZochdnlHA.md) | Never Still FX | Pieza de muestra (13 s) | Lata en 2.5D que gira y cambia de sabor en el pico del giro; palabra gigante detrás con eco de contorno | Ritmo y transición muy limpios; errores de producto (lima rotulada como limón, misma sombra en las 4 frutas) |
| 15 | [Claude ahora crea animaciones Motion Graphics](fichas/tieCG_Rqrp4.md) | David Zamora | Tutorial IA, Claude Design | Prompt en 5 bloques (qué, elementos, movimiento, datos, estilo) en la plantilla Animation + 2–3 iteraciones de 3–4 cambios | Gráficos de barras, diagramas de nodos con cometa y bucle; look violeta y vidrio por defecto |
| 16 | [Hyperframes: ¿se merece el hype?](fichas/vJ8rgCjkjUo.md) | Creatubers | Prueba de HyperFrames | Instalación (`npx hyperframes init`, `npx skills add heygen-com/hyperframes`), Claude vs DeepSeek sobre un video propio | Claude 27 min y 76,6 k tokens, DeepSeek 24 min y 0,06 USD; ambos genéricos; el render rompió el audio y las fuentes cayeron a Times |

## Recursos citados y su estado

| Recurso | Video | Estado |
|---|---|---|
| Skill "Director de Collage" + guía PDF (27 págs.) | 1 | Descargada y revisada (Drive público) |
| Skill "Explainer Card Director" v5 (AI Madame) | 11 | Descargada y revisada; licencia prohíbe republicarla: solo se usa el método |
| `Leonxlnx/earshot` (MIT, ★4.175) — banco de 252 SFX en código, mezcla y crítica de sonido | 11 | Clonado en el servidor y evaluado; integrar en 3 fases (ver `kb/12` §5) |
| `heygen-com/hyperframes` (Apache 2.0, ★80.550) | 8, 11, 13, 16 | Clonado; skills nuevas `style-sampling` y `reverse-any-video` son Pro (pagas) |
| `kumoproductions/mcp-aftereffects` (MIT, v0.3.2) | 3 | Revisado; documentado en `kb/08` §9; no instalado (no hay AE en el PC) |
| Prompts de kaye.creatives (Higgsfield) | 9 | Revisados; las 2 skills .zip piden sesión en Higgsfield |
| Prompts de The Tech Girl (setup + iPhone timeline) | 10 | Revisados |
| Biblioteca de skills de AI Madame (35 ítems) | 11 | Listada; no descargada salvo la citada |
| Prompts de David Zamora (Skool), Mirko Vigna (comunidad), skills de Viegas (Skool) | 4, 15, 2, 7 | Bloqueados por login: no se crean cuentas; método reconstruido desde el video |
| MCP de Artlist | 3 | Requiere suscripción; descartado |

## Lote 2026-11-08 (27 piezas → 9 plantillas)

Reels, TikToks y Shorts medidos con `medir.py` y agrupados por técnica; propuesta y familias en
`lote-2026-11-08.md`, plantillas en `kb/14-plantillas.md` §3.

| Video (ficha) | Autor | Duración | Familia | Técnica dominante |
|---|---|---|---|---|
| [No te parálises, inténtalo. Edición estilo Julian Alborna. #](fichas/tiktok-7581551601349954824.md) | devoneditor | 8.5 s | `editorial-recorte` | Minimalismo monocromo con un objeto recortado por idea, par tipografico script + grotesca negra y desplazamiento vertical continuo con barra |
| [De una simple voz en off a una edición que complementa el sp](fichas/tiktok-7622319703679110421.md) | davidaponte.21 | 51.3 s | `editorial-recorte` | Explicacion de voz en off con un objeto recortado por idea sobre cartulina gris, titular grotesco con palabra serif italica en azul y tarjet |
| [Semana 4 Haciendo Motion Graphics ☝️🤓 ¿Se ve Elegante? ¿Esta](fichas/tiktok-7671829994292776200.md) | clean.creator | 19.8 s | `editorial-recorte` | Tipografia mixta grotesca + serif italica con acento amarillo sobre objetos 3D y siluetas en blanco/negro, cortando al beat sobre fondo negr |
| [Comenta CEREBRO y te comparto el tutorial de cómo hice esta ](fichas/tiktok-7545813836503289144.md) | imdayisbz | 13.07 s | `editorial-recorte` | Cartel editorial sobre fondo crema con viñeta: texto sans+serif que entra por palabras con desenfoque, recorte B/N flotando en marco, anotac |
| [así que ya saben #edicion #videos #animacion #motiongraphics](fichas/tiktok-7600179656922385685.md) | dresk.edit | 23.01 s | `collage-impacto` | Tipografia cinetica de impacto (condensada roja gigante) sobre cartel crema con recortes B/N y objetos reales (ojo-anzuelo, cartera, fajo de |
| [Semana 5 Haciendo Motion Graphics Virales 🙌 // Pronto Traere](fichas/tiktok-7684823088906636562.md) | clean.creator | 31.018 s | `collage-impacto` | Narración en tipografía cinética que alterna escenas blancas de papel con objetos 3D recortados y sombras largas (grid, círculos de puntos,  |
| [Un solo objeto 3D en blanco y negro sobre papel con grano y ](fichas/C-yZlQXN3rQ.md) | — | 14.071 s | `collage-impacto` | Un solo objeto 3D en blanco y negro sobre papel con grano y viñeta, encadenado por desenfoque y match cut de una línea guía, y cierre con zo |
| [Intentando Mejorar el Nivel de mis Motion Graphics. ¿Se ve b](fichas/tiktok-7660733665353272583.md) | clean.creator | 37.48 s | `explicador-objetos-3d` | Explicador en texto cinetico que mezcla sans bold + italica serif sobre fondos alternados claro/oscuro, con objetos 3D grises flotando (cere |
| [Minimalist Reels Editing || Dm now for your edits || #motion](fichas/tiktok-7560567761760505110.md) | sumama.bashir6 | 19.9 s | `explicador-objetos-3d` | Escenas minimalistas calidas con objetos 3D isometricos, luz de ventana proyectada y follaje desenfocado como oclusor, con texto pequeno pal |
| [Anuncio de producto de una sola toma continua en azul noche ](fichas/lpFv-bB-RuM.md) | — | 49.087 s | `saas-ui-cristal` | Anuncio de producto de una sola toma continua en azul noche donde cada idea (alertas, contador, SLA, llamada, árbol de decisión, consola) em |
| [A little widget animation. #widget #animation #satisfyingvid](fichas/tiktok-7521798862521060630.md) | refined.motion | 16.83 s | `saas-ui-cristal` | Bento de widgets UI en 3D sobre plano inclinado: la camara viaja de widget en widget mientras cada uno se anima (calendario, bateria, reloj, |
| [Let’s Edit ⚡️ #videoviral #editing #motiongraphics #motiongr](fichas/tiktok-7613879612723957012.md) | danushkmotion | 18.26 s | `saas-ui-cristal` | Tarjetas que mutan de proporcion (vertical a horizontal) con blur direccional sobre fondo gris claro; titulares sans condensada italica por  |
| [➡️ LINK EN MI PERFIL 🔥 #ClaudeAI #Remotion #MotionGraphics #](fichas/tiktok-7698861538307788033.md) | danielbrown.ia | 47.415 s | `saas-ui-cristal` | Explainer de 4 pasos con tipografía grotesca condensada, tarjetas UI animadas y subtítulo palabra a palabra con chip de acento, sobre fondo  |
| [Explicador de dos tarjetas comparativas con anotaciones a ma](fichas/DryieyoUmLc.md) | — | 13.537 s | `saas-ui-cristal` | Explicador de dos tarjetas comparativas con anotaciones a mano alzada que se dibujan sobre un cerebro 3D, hoja que se aleja y cursor que guí |
| [Últimamente te aparecen un montón de videos de motion graphi](fichas/tiktok-7701672067120368948.md) | agustin.paulise | 65.408 s | `talking-head-insertos` | Talking head vertical con subtítulos de 1-3 palabras (acento naranja en la palabra clave) intercalado con grabaciones de pantalla en marco r |
| [Edita reels con Claude Code Opus 5.5 🚀 Le pedí a Claude que ](fichas/tiktok-7702620779518643478.md) | viegasestudio | 72.516 s | `talking-head-insertos` | Talking head continuo con subtítulos palabra a palabra (palabras clave en MAYÚSCULAS naranja) e insertos gráficos de marca que entran sobre  |
| [hacer este tipo de motions “rápidos” y genéricos esta al alc](fichas/tiktok-7698456660611796231.md) | mauritenss | 170.815 s | `talking-head-insertos` | Tutorial en live action de mano: cortes rápidos entre selfie y pantalla de monitor filmada, con subtítulo palabra a palabra con chip morado, |
| [Cómo crear "Motion Graphics" profesionales en 10 minutos con](fichas/tiktok-7690371798784871701.md) | melisaescobarta | 31.8 s | `talking-head-insertos` | Tutorial a camara con capturas de pantalla reales por paso, subtitulos de palabra por golpe y piezas generadas por IA como prueba visual. |
| [🚀 Fracasó con su idea y creó una empresa millonaria](fichas/7gMbZTdLlxs.md) | Luis René | 115.68 s | `split-stack` | Short de storytelling con presentador y cortes cada ~2.8 s en split-screen: arriba infografias/UI animadas y B-roll, abajo el host, con keyw |
| [Motion graphics con IA: cómo crear animaciones profesionales](fichas/tiktok-7697333991984221462.md) | billycreative_ | 50.509 s | `split-stack` | Pantalla dividida «AI vs REAL»: panel superior de motion graphics SaaS claro (tarjetas, halftone, mockups de UI) sobre panel inferior de tal |
| [Anuncio estilo UGC de una presentadora hablando a cámara con](fichas/zlOCQxQYnYc.md) | — | 48.553 s | `split-stack` | Anuncio estilo UGC de una presentadora hablando a cámara con capturas de pantalla en paneles apilados, captions de una frase en cian y pills |
| [Antes/después de subtitulado: dos tarjetas con perspectiva d](fichas/MoVlt-ptxIk.md) | — | 16.625 s | `antes-despues` | Antes/después de subtitulado: dos tarjetas con perspectiva donde la tarjeta AFTER recorre siete plantillas de subtítulo palabra a palabra (v |
| [¡Así es como se ve la magic! 🪄   Este es solo un ejemplo de ](fichas/tiktok-7519674033076571397.md) | solotres.vfx | 16.138 s | `antes-despues` | Compuesto antes/después: clip original pequeño + edición final grande en marco de teléfono + captura de timeline con etiqueta de neón, sobre |
| [Tutorial de screencast en siete pasos con tarjetas de pizarr](fichas/n50KkoucMpU.md) | — | 556.513 s | `tutorial-pasos` | Tutorial de screencast en siete pasos con tarjetas de pizarra "STEP N" entre secciones, abierto por un montaje de clips 3D generados con IA  |
| [CapCut | Smooth Zoom Out AND Tremor Strobe Tutorial 💀🔥 | #sh](fichas/tHzfsCsWL6M.md) | Orcyl Edits  | 58.61 s | `tutorial-pasos` | Tutorial de screen-recording de CapCut movil (keyframes + grafica de velocidad + efecto Tremor Strobe), con titulo con niebla/glow y resulta |
| [Mockup 3D de teléfono que gira y empuja a pantalla completa ](fichas/DiH9Pek312c.md) | — | 15.232 s | `showcase-dispositivo` | Mockup 3D de teléfono que gira y empuja a pantalla completa mientras sus pantallas de app se suceden (inicio, bloqueo, cámara, mapa, splash) |
| [Do you want a tutorial ?⬇️ #motion #motiongraphics #claude #](fichas/tiktok-7693603336481803542.md) | motionlovee | 14.4 s | `showcase-dispositivo` | Catalogo de micro-piezas de motion generadas por codigo dentro de la pantalla de un laptop con reflejo, cada una con su paleta, tipografia y |

## Estándar de explainers 2026-11-11 (6 videos, 7 tramos)

Explainers profesionales medidos para fijar los valores del kit de anotación, del guion y del crítico (Fase 0 del
plan de explainers). Síntesis en `kb/15-narrativa-explainer.md`, `kb/16-composicion-y-mirada.md` y
`kb/17-anotacion.md`; puntaje del crítico y umbral del piloto en [`explainers-estandar.md`](explainers-estandar.md).
Lo crudo está en `trabajo/referentes/_explainers-f0/` y en `referentes/_raw/explainers-f0/`.

| Video (ficha) | Canal | Tramo medido | Estilo | Lo que aporta al estándar |
|---|---|---|---|---|
| [This photo triggered China's Cultural Revolution](fichas/kXByOrRrO7c.md) | Vox (Darkroom) | 114–192 s | documental, tinta roja a mano sobre archivo | Círculo 6–11 f y flecha 6–12 f a 30 fps sin importar el tamaño, a doses y sin blur; resalte en pantalla 1,8 s de mediana; anotación 0,08 s antes de la palabra. Crítico: 4,3 |
| [The International Date Line, Explained](fichas/aBppb2quqkE.md) | Johnny Harris | 18–62 s y 150–228 s | mapas escaneados + diagrama que crece | Marca roja que persiste 42 s pegada al objeto; rutas a velocidad constante (22–26 f); zooms de 1 s con ease-in-out; rótulos que no salen |
| [How Small Is An Atom? Spoiler: Very Small.](fichas/_lNF3_30lUE.md) | Kurzgesagt | 63–135 s | ilustración plana | 72 s sin cortes; etiqueta que abre en 6 f después de su objeto; único referente con motion blur (estela de 38–150 px) |
| [What is net-zero?](fichas/QPmUAfuqM08.md) | TED · Giant Ant | completo, 70 s | ilustración plana en una toma | Arco completo con proporciones; metáfora que se transforma; un agente recurrente; la respuesta llega 0,42 s después de la palabra. Crítico: 3,7 |
| [RSA ANIMATE: Drive](fichas/u6XAPnuFjJc.md) | Royal Society of Arts · Cognitive Media | 204–276 s | pizarra en lienzo continuo | Nada se borra; cámara quieta 87 % del tiempo y saltos de 0,56 s; énfasis con palabra en rojo (8,8 % de la tinta) |
| [Minute Physics: What is Gravity?](fichas/p_o4aY7xkXg.md) | minutephysics | completo, 86 s | marcador sobre papel a 12 fps | 18 hojas con corte seco; el hold lo decide la voz; texto primero y contorno después. Crítico: 3,8 |

