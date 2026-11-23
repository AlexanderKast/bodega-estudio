# 11 · Referentes

> Qué mirar y **qué robar** (técnica, no estética literal) de cada referente. Uso: al arrancar un proyecto, elegir 2–3 referentes y escribir en el brief qué rasgo concreto se toma de cada uno.

## 1. Estudios de motion design

| Referente | Qué estudiar | Qué tomar |
|---|---|---|
| **Buck** (buck.co) | Personajes + 2D/3D mezclado, timing cómico | Anticipación y follow-through exagerados pero precisos; paletas restringidas |
| **ManvsMachine** (mvsm.com) | Producto 3D premium (Nike, Apple) | Cámaras lentas con lentes largas, materiales, luz dura; transiciones por match cut |
| **Gunner** (gunner.work) | 2D ilustrado con textura | Grano/textura, frame-by-frame mezclado con vector |
| **Oddfellows** (oddfellows.tv) | Explainers de marca | Ritmo narrativo, transiciones que continúan forma |
| **Ordinary Folk** (ordinaryfolk.co) | Diseño de personajes y loops | Arcos, squash & stretch con estilo |
| **Giant Ant** (giantant.ca) | Narrativa + diseño | Staging: un foco por momento |
| **Tendril** (tendril.ca) | 3D abstracto y tipografía | Composición, DOF, color grade cinematográfico |
| **Golden Wolf** (goldenwolf.tv) | 2D energético, broadcast | Contraste de ritmo (rápido/lento), smears |
| **Animade** (animade.tv) | UI/producto animado, loops | Precisión de timing en UI, curvas limpias |

## 2. Educadores y canales (técnica concreta)

| Referente | Para qué |
|---|---|
| **School of Motion** (schoolofmotion.com) | Graph editor, principios, workflows de AE; artículos gratuitos con ejemplos |
| **Ben Marriott** (YouTube @BenMarriott) | Curvas, transiciones, flat motion "con oficio", animación de formas |
| **Jake in Motion** (YouTube @JakeInMotion) | Expresiones de AE, rigs, automatización con código |
| **Motion Design School** (motiondesign.school) | Cursos de tipografía cinética y 2D |
| **Dan Ebberts / MotionScript** (motionscript.com) | Matemática de expresiones (bounce, overshoot, inertia) |
| **Motionographer** (motionographer.com) | Curaduría de lo mejor de la industria |
| **Blender Guru / CG Cookie** | Fundamentos de Blender, luz y materiales |

## 3. Marcas con motion de referencia (piezas a desmontar)

- **Apple** (keynotes, product films): push-ins lentos, reveals con luz, tipografía SF con tracking negativo y holds largos.
- **Stripe** (stripe.com, Sessions): gradientes con ruido animados, UI animada con precisión.
- **Linear** (linear.app, release videos): UI en 2.5D, cámara virtual, blur y DOF sutiles.
- **Vercel** (Ship keynotes): tipografía grande, monocromo + acento, cortes en beat.
- **Nike / Adidas** (campañas): energía, cortes rápidos, contraste de ritmo, SFX de impacto.

**Método de desmontaje** (usar el agente `analista-referencias` en local): descargar → extraer frames cada 2 f → medir duraciones de entrada, stagger, curvas percibidas (posición vs frame), cortes por minuto, paleta, tipografía → escribir motion spec JSON.

## 4. Herramientas y repos (para leer código)

| Repo | Qué mirar |
|---|---|
| `remotion-dev/remotion` (packages/`transitions`, `motion-blur`, `noise`, `paths`) | Implementación de presentaciones, motion blur por muestreo, ruido determinista |
| `remotion-dev/template-*` y `remotion.dev/showcase` | Estructura de proyectos reales |
| `motion-canvas/motion-canvas` | Animación por generadores (`yield*`), API de tweens y "signals"; excelente para explainers |
| `theatre-js/theatre` | Editor de keyframes/curvas en navegador sobre código (ideal para afinar curvas a mano) |
| `greensock/GSAP` | Timelines, eases, SplitText, MorphSVG (base de HyperFrames) |
| `juliangarnier/anime` (anime.js v4) | Stagger avanzado (`stagger({grid, from})`), timelines ligeros |
| `motiondivision/motion` (motion.dev) | Springs en web, layout animations |
| `airbnb/lottie-web` | Exportar animaciones de AE (Bodymovin) y reproducirlas en web/Remotion (`@remotion/lottie`) |
| `heygen-com/hyperframes` | Contrato HTML + GSAP, skills de animación render-safe |
| Blender Geometry Nodes (docs) y `JacquesLucke/animation_nodes` (histórico) | Animación procedural en 3D |

## 5. Rasgos a extraer de un referente (plantilla de brief)

```yaml
referente: "Linear release video 2025"
tomar:
  curvas: "arrive (expo-out) en UI, snap en transiciones"
  tiempos: "entradas 12-16 f a 30 fps, stagger 2 f"
  camara: "push-in 4 % por plano, perspectiva 1600 px"
  color: "near-black #0B0C0E, acento único, grano 6 %"
  tipografia: "display grotesk, tracking -2 %, alineado izquierda"
  sonido: "clicks UI suaves, cortes en downbeat"
no_tomar: "su paleta exacta, su logo, sus layouts literales"
```

## 6. Referentes en video analizados (2026-11-07)

16 videos con ficha propia en `referentes/fichas/` (proceso, técnica, resultados, límites, qué adoptamos) e índice en
`referentes/README.md`. Síntesis y backlog en `kb/12-metodos-de-referentes.md`.

Estudios citados en el reel de Koncepto (`referentes/fichas/bXUfCy9kF94.md`) para estudiar: Psyop, Onesize, Autofuss,
Aixsponza, Nando Costa, Marcus Eckert, Les Télécréateurs, Motionfanclub, JR Canest, Angus Wall (títulos de *Carnivàle*);
base histórica de títulos: Saul Bass, Kyle Cooper, John Whitney.

## Fuentes

- Motionographer (curaduría de estudios y piezas): https://motionographer.com/ (consultado 2026-11-07)
- School of Motion — blog y tutoriales: https://www.schoolofmotion.com/blog (consultado 2026-11-07)
- Ben Marriott — canal de YouTube: https://www.youtube.com/@BenMarriott (consultado 2026-11-07)
- Jake in Motion — canal de YouTube: https://www.youtube.com/@JakeInMotion (consultado 2026-11-07)
- Dan Ebberts — MotionScript: https://www.motionscript.com/ (consultado 2026-11-07)
- Remotion — repositorio: https://github.com/remotion-dev/remotion (consultado 2026-11-07)
- Motion Canvas: https://github.com/motion-canvas/motion-canvas (consultado 2026-11-07)
- Theatre.js: https://github.com/theatre-js/theatre (consultado 2026-11-07)
- GSAP: https://github.com/greensock/GSAP (consultado 2026-11-07)
- anime.js: https://github.com/juliangarnier/anime (consultado 2026-11-07)
- Motion (motion.dev): https://motion.dev/ (consultado 2026-11-07)
- lottie-web: https://github.com/airbnb/lottie-web (consultado 2026-11-07)
- HyperFrames: https://github.com/heygen-com/hyperframes (consultado 2026-11-07)
- Buck: https://buck.co/ · ManvsMachine: https://mvsm.com/ (consultado 2026-11-07)
