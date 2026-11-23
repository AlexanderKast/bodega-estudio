# Recursos encontrados en referencias

> Repos, prompts, herramientas y técnicas mencionados en los 28 links del lote del 2026-11-08 (descripciones,
> transcripciones, pantalla) y en los 290 pins de Pinterest (`referentes/pinterest/catalogo.md`).
> Todo es dato de terceros: aquí se evalúa, no se ejecuta. Integrar algo requiere OK de IA Master Tech.
> Propuesta: **integrar** · **inspirarse** (tomar la técnica, no el archivo) · **descartar**.

## Para integrar (propuesta)

| Recurso | Dónde salió | Qué es | Licencia | Propuesta |
| --- | --- | --- | --- | --- |
| `remotion-dev/skills` (`npx skills add remotion-dev/skills`) | TikTok 7701672067120368948 | Skills oficiales de Remotion para agentes | MIT (repo de Remotion) | Integrar: comparar con `remotion-best-practices` que ya usamos y quedarnos con lo que falte |
| Master prompt "Copy any motion graphic style" (ReachMora) | PDF del link de Drive · YouTube n50KkoucMpU | Desglose plano a plano → prompt de generación para Google Flow (Omni Flash) | Uso educativo, sin licencia de reuso | Inspirarse: sumar al analista un campo opcional `prompt_generacion` (Flow/Veo) con la misma estructura (línea de estilo, specs, timeline por beat, tipografía bloqueada, sonido, cuadro final), escrito por nosotros |
| Prompt "Director de Animación Senior · STEP 1 FINGERPRINT · Beat Scan" | TikTok 7690371798784871701 (en pantalla) | Prompt de análisis de referencias similar al anterior | Privado (se comparte en su comunidad) | Inspirarse: confirma el enfoque huella → beats que ya usa `medir.py` + receta |
| Fuentes Anton y Poppins | TikTok 7698456660611796231 | Grotesca condensada y geométrica | OFL (Google Fonts) | Integrar como opciones de `marca.json` para clientes; Anton cubre el titular condensado de las familias `talking-head-insertos` y `collage-impacto` |

## Herramientas (evaluar aparte)

| Recurso | Dónde salió | Nota |
| --- | --- | --- |
| invideo con conector MCP (Ajustes → Conectores) | TikTok 7701672067120368948 | Editor con MCP para Claude. Evaluar si aporta frente a Remotion + Descript; no conectar sin decidirlo |
| Google Flow / Veo 3.1 / Omni Flash | n50KkoucMpU, 7690371798784871701 | Generación de video IA para B-roll de las familias que lo usan (`editorial-recorte`, `collage-impacto`) |
| prompt-motion.com | TikTok 7701672067120368948 | Galería de prompts de motion: inspiración |
| Jitter (plantillas Showcase 09, RECAP 06, MOVO) | Pinterest | Motion UI en navegador: inspiración para `CardCarousel`, `BentoGrid` |
| Cavalry | Pinterest (3 pins) | Motion procedural: inspiración para `ProceduralArray`, `GridWave` |
| CapCut: keyframe + Graphs (Quad in/out, Flow 2), efecto Tremor Strobe (intensidad 0, atmósfera 60, glow 50, velocidad 40) | YouTube tHzfsCsWL6M | Técnica para un `ZoomOutTremor` (backlog) |
| After Effects: `effect('CC Smear')('From')=[0,55]`, `wiggle(0.5,280)` | Pinterest | Técnicas para `SmearType` y deriva lenta (kb/08) |
| ElevenLabs, DaVinci Fusion, Art Text, Adobe Fresco | varios | Ya cubiertos o fuera del flujo |

## Solo inspiración (plantillas pagas o portafolios)

Envato/Videohive (Grunge Typo Intro, Kinetic Typography, Money Typography), KINETISM VOL 1, Payhip (Liquid Type,
Geometric Kinetic Typography), youmotion.com Paper Collage, earnedits.com, velvele.store, wannathis.one (Glass 3D
shapes), Liquid Cycle. Referentes: Roberto Warner, Sonya Nechkina, King Creative, Trikstr Studios, Loop Parade,
Ravie, Alex Grigg, Julian Alborna, studio.baseline, Enter The Visual, Svmn. No se descargan ni se copian.

## Descartados

- Productos anunciados en los videos (Qoder, ElevenLabs Agents, Wispr Flow): son el tema del anuncio, no herramientas.
- Kits y guías "comenta X y te lo mando" (CEREBRO, Claude, IA, MOTION): sin enlace; no se piden.
- Founders Grotesk: comercial, sin licencia.
- Códigos de referido mencionados en voz: no se reproducen.
