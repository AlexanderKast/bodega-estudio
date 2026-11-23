# 12 · Métodos de los referentes: qué funciona y qué adoptamos

> Síntesis de 16 videos analizados el 2026-11-07. Índice y resultados por video en `referentes/README.md`;
> proceso detallado con marcas de tiempo en `referentes/fichas/<id>.md`.

## 1. Cuatro familias de proceso

| Familia | Videos | Cómo funciona | Techo de calidad |
|---|---|---|---|
| **A. Claude escribe código que se renderiza** (Remotion, HyperFrames, motor propio) | 1, 8, 10, 11, 13, 16 | Claude dirige y programa; el render es determinista cuadro a cuadro | El más alto **si hay motor y reglas** (cámara, foco, curvas, textura). Sin reglas sale genérico (13, 16) |
| **B. Claude opera software profesional** (After Effects por MCP) | 3 | Crea capas, keyframes y expresiones reales en un `.aep` editable | Alto en 2D y editable a mano; no juzga el movimiento, 3D débil |
| **C. Modelos de video generan el plano** (Flow, Artlist, Higgsfield) + montaje | 2, 4, 9 | Imagen de referencia → clip de 6–8 s → edición | Vistoso pero sin continuidad entre cortes, sin curvas propias y con texto que falla |
| **D. Oficio manual** (AE, 3D) | 5, 6, 14 | Graph editor, nulls, shape layers, luz y materiales | La referencia de acabado que las otras imitan |

Fuera de las familias: 12 (fundamentos) y 15 (Claude Design para bocetar gráficos de datos y diagramas).

**Decisión del estudio:** familia A como motor (Remotion, con HyperFrames como segundo motor), con el oficio de D
traducido a código (`kb/01`, `kb/08`) y Blender para el 3D. B es una salida opcional cuando un cliente exige `.aep`
(`kb/08` §9). C solo para B-roll sin texto, nunca para gráficos, datos ni tipografía.

## 2. Qué separa el acabado profesional del "hecho con IA"

Lo que coincide en los 16:

1. **El prompt es el 10 %** (13). El look de IA no viene del modelo sino de pedir sin reglas, sin marca, sin
   referencias y sin revisión (8, 13, 16). Un brief de adjetivos ("vistoso, sincronizado, fondo oscuro") produce
   partículas doradas, texto centrado y glow.
2. **Motor propio de cámara** (1, 5, 6): profundidad real (foco por distancia, blur por capa), cámara que nunca se
   queda quieta y que avanza hacia lo que va a pasar (13), motion blur en lo rápido (1, 11, 16).
3. **Curvas de autor** (5): Easy Ease con asas al extremo (≈ `snap`), una transformación por null, escala global
   lenta. El movimiento "flotante" sin curvas es el tell más repetido (2, 4, 8, 15).
4. **El texto nunca sale de un modelo de video** (1, 2, 4): lo pone el motor, con fuentes cargadas localmente
   (16 cayó a Times New Roman).
5. **Transiciones con sentido** (1, 5, 14): iris desde un hueco del plano, un objeto que tapa la lente, cambio de
   contenido en el pico de velocidad de un giro. Nunca la misma transición en cada corte (8, 15).
6. **Sonido con contención** (11, 3): cada sonido tiene una causa visible y la mayoría del movimiento va sin sonido.
   Whoosh en cada corte es el tell sonoro más común (10, 9).
7. **Puertas de revisión** (1, 3, 7, 8, 13): storyboard con stills antes de animar, fotogramas de control antes de
   mostrar, export solo con aprobación. Los stills no juzgan el movimiento (3): para eso está el linter.
8. **Material real del cliente** (3, 7, 14): capturas reales, logos reales, producto con todas sus caras. Lo
   inventado (caras, frutas pegadas con la misma sombra, UI ficticia) delata.

Estéticas por defecto que aparecen en casi todos y quedan prohibidas (ya en `kb/10`): vidrio con borde brillante,
grilla en perspectiva sobre negro, glow neón, degradado lila-azul, texto centrado sobre video oscurecido, partículas
decorativas, mascotas con rebote exagerado.

## 3. Método del estudio actualizado

1. **Preflight de 4 insumos** (13): reglas (`kb/`), marca (`brand.json`, desde URL si hace falta, 8), 1–3
   referencias con su ficha medida, y plan de revisión. Sin los 4 no se anima.
2. **Brief en 5 bloques** (15, 10, 3): qué comunica (una idea, 12) · elementos y datos (verificados con fuente, 11)
   · movimiento por viñetas (cámara, entradas, final) · estilo con tokens · texto literal entre comillas.
   Datos en un JSON aparte, nunca dentro de la animación (10).
3. **Referencia medida, no copiada** (4, 11, 1): ritmo (cortes/10 s, plano mediano), paleta con hex, tamaños y
   posiciones de texto, transiciones, "lo que no se toma". Se convierte en un `style.json` que leen los presets.
4. **Guion con tabla de beats** (11): línea de voz · texto en pantalla · acción principal · rol de sonido · cambio
   de estado. Con voz real, la animación sigue a la voz (cues por palabra desde Whisper en el servidor; nunca segundos
   tecleados). Una idea visible por escena de 2,5–4 s y 2–6 palabras en pantalla (1).
5. **Puerta de storyboard** (8, 13): un still por escena en su cuadro clave, hoja de contactos, aprobación.
6. **Build con presets y kit** (`studio/src/lib/motion.ts`), escenas en paralelo solo después de aprobar estilo y
   storyboard (13), con el mismo `style.json` para todas.
7. **Control antes de mostrar** (1, 3, 10): `tsc` + `lint-motion` + fotogramas de control; arreglar los 3 peores
   puntos; preview completo.
8. **Sonido al final** (3, 13): música elegida entre 3 opciones sin tocar la imagen; SFX por roles con contención;
   master a −14 LUFS y pico −1 dBTP; el audio de metraje original se remezcla sin tocar su ganancia (16).
9. **Notas de revisión cuantificadas** (9, 3, 13): `[m:ss] qué está mal → qué propongo`, en números
   ("15 % más apretado", "texto 25 % más grande"), con qué se conserva y por qué.
10. **Entrega** solo con aprobación; render final una vez, en el VPS de Bodega o en este equipo.

## 4. Reglas nuevas para la KB (aplicar en la próxima ola)

| Regla | Destino | Ficha |
|---|---|---|
| Para atravesar una capa en z, la cámara llega a z + 0,8 × perspective | `kb/05` | 1 |
| La cámara avanza hacia el siguiente evento; avanzar y retroceder en < 1 s es error | `kb/05`, linter | 13 |
| Escala global lenta (100 → 90 % en 3 s) como cámara mínima | `kb/05`, `CameraRig` opción `breath` | 5 |
| Densidad de eventos por género: anuncio ≤ 1 s (gancho ≤ 0,5 s), explainer ≤ 1,2 s, VSL ≤ 1,5–2 s, talking head ≤ 3 s | `kb/02`, linter | 13, 9 |
| El contenido cambia en el cuadro de máxima velocidad u oclusión (giro, whip) | `kb/04` | 14, 5 |
| Datos, cifras y gráficas siempre en código, nunca dentro de un clip generado | `kb/10` §3 | 2 |
| AI-45 brief sin reglas · AI-46 titular que repite el subtítulo · AI-33 recortes con la misma sombra | `kb/10` | 13, 16, 14 |
| Texto visible antes de su entrada = error | linter | 1 |
| Textura (grano, rejilla) se valida sobre el MP4 H.264, no sobre el PNG | `kb/06` | 15 |
| Whisper: recortar silencio final y usar VAD (alucina frases en bucle) | `kb/07` §1 | 11, 5 |
| HyperFrames tiene motion blur propio (`data-motion-blur`) | `kb/05`, `traduccion-hyperframes` | 11 |

## 5. Sonido: integrar earshot (Leonxlnx, MIT)

Es la pieza que más le falta al estudio: Claude no oye. earshot trae 252 SFX hechos en código (sin licencias),
kits de mezcla medidos sobre películas de lanzamiento profesionales y una crítica automática del sonido final.
Plan en el VPS de Bodega o en este equipo, con versión fijada a un commit (está en alfa):

1. **Fase A (ligera):** las composiciones exportan un `sfx-cues.json` (`{rol, t, gain, pan, keep}`); un script
   propio arma la cama de sonido con las reglas de contención (un sonido por gesto, ≤ 1 riser y ≤ 2 whoosh largos
   por pieza, ~10 gestos por 10 s, nada pequeño a < 0,25 s de un golpe, la música baja 6–12 dB antes del golpe).
2. **Fase B (escuchar):** crítica y línea de tiempo de audio tras cada render final, con un perfil propio hecho
   con las mejores piezas publicadas de Bodega en lugar de los films de lanzamiento.
3. **Fase C (héroes):** sonidos grabados con licencia (ElevenLabs SFX) para stings, golpes y ambientes.

## 6. Backlog priorizado

**P1 (alto impacto, poco esfuerzo)** — hecho el 2026-11-07 en `feat/p1-flujo`, salvo dos reglas que siguen como revisión humana: "texto visible antes de entrar" (AI-48) e "inversión de cámara" (`kb/05`):
- Linter: fuentes cargadas, texto visible antes de entrar, densidad de eventos, inversión de cámara.
- `stills.mjs`: `--at` por segundos, modo `--storyboard`, chequeo de bucle (cuadro 0 = último).
- `cue(palabra, n)` sobre el JSON de Whisper y `sfxCue(rol, frame)`.
- `scripts/master.sh`: −14 LUFS, pico, silencios y fps de la entrega.
- Skill `master-motion`: preflight, brief en 5 bloques, tabla de beats, puerta de storyboard, formato de notas.
- Correcciones de KB de la tabla del §4.

**P2 (presets nuevos):**
- `CollageWorld`: cámara 3D con foco, `irisFrom(punto)` y `occluderWipe`.
- `FlipCard`, `StepTracker`, `StatCallout`, `BarChart`, `NodeFlow`, `TimelineScroller`.
- `SplitStack` 9:16, `EchoStack`, `RingPulse`, `FollowTrail`.
- `MaskTitle` modo por palabra, y `Look` con flicker y boil.

**P3 (pipeline en el servidor):**
- earshot fases A–C.
- `segment-subject.py` (elementos detrás del sujeto, con chequeo de sincronía).
- `track-points.py` → `TrackedCallout`.
- `ref-measure.py` (medición de referencias).
- Blender `can_scene.py` y la receta de estudio high-key.
- Versiones horizontal y vertical de cada preset.

**IA generativa (Higgsfield / Magnific):** no hace falta para nada de P1–P3. Sirve para B-roll sin texto por frase
(Higgsfield, como en 9), texturas y mapas PBR para Blender, y modelos 3D de apoyo (Magnific). Se pide aprobación
antes de gastar créditos.

## Fuentes

- Vive de lo tuyo — Motion Graphics con IA sin After Effects (Director de Collage): https://youtu.be/11-0lvGltVA (consultado 2026-11-07)
- Artlist — How I Make Motion Graphics with Claude + After Effects: https://youtu.be/3AIZ4FT61aw (consultado 2026-11-07)
- Ag Motion Designs — Motion Graphics Masterclass in After Effects (Stream 34): https://youtu.be/7O2_OV4tLj4 (consultado 2026-11-07)
- AI Madame — Claude Made These Animated Videos (Explainer Card Director): https://youtu.be/bQ_8Eu-hWCs (consultado 2026-11-07)
- Tobías Simonetti — Motion Graphics con IA desde 0: https://youtu.be/dTWwA2u42tc (consultado 2026-11-07)
- Creatubers — Hyperframes, ¿se merece el hype?: https://youtu.be/vJ8rgCjkjUo (consultado 2026-11-07)
- Leonxlnx — earshot (README, commit 4ac3d2a): https://github.com/Leonxlnx/earshot (consultado 2026-11-07)
- HeyGen — hyperframes, guía de motion blur (commit 841e90f): https://github.com/heygen-com/hyperframes (consultado 2026-11-07)
- Resto de videos (índice completo): `referentes/README.md` (consultado 2026-11-07)
