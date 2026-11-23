# 00 · Principios de motion profesional

> Borrador KB `master-motion`. Reglas accionables, no teoría. Cada regla tiene un **check** que un humano o un linter puede verificar.

## 1. Los 12 principios de Disney, traducidos a motion graphics

| Principio | En motion graphics significa | Check verificable |
|---|---|---|
| Squash & stretch | Escala no uniforme durante el impacto/aceleración (p. ej. `scaleX 1.12 / scaleY 0.9` 2–3 frames en el aterrizaje). Conservar área: `sx * sy ≈ 1`. | En elementos que "caen" o "rebotan" existe al menos un keyframe con `sx ≠ sy`. |
| Anticipation | Antes de un movimiento grande, un contra-movimiento pequeño (5–15 % de la distancia, 4–8 frames a 30 fps). | Movimientos > 300 px o > 90° tienen un keyframe previo en sentido contrario. |
| Staging | Un solo foco por momento. Lo secundario baja opacidad/contraste o espera. | En cualquier frame, ≤ 1 elemento está en su fase de entrada "rápida" (primer 40 % de su animación). |
| Straight ahead / pose to pose | En código casi siempre *pose to pose*: definir poses clave y dejar que el easing interpole. | — |
| Follow through & overlapping action | Partes de un objeto llegan a destiempo (texto → subrayado → icono). Usar offsets de 2–6 frames y overshoot que decae. | Grupos de ≥ 2 elementos que se mueven juntos tienen offsets ≠ 0. |
| Slow in / slow out | Nada arranca ni para a velocidad constante. Ver `01-easing-y-curvas.md`. | Cero `Easing.linear` en propiedades espaciales (posición, escala, rotación) salvo loops continuos. |
| Arcs | Movimientos orgánicos siguen arcos, no líneas rectas. En 2D: animar X e Y con easings distintos o usar un path. | Desplazamientos diagonales > 200 px usan curvas distintas en X e Y o un motion path. |
| Secondary action | Acción pequeña que apoya la principal (sombra que se mueve, brillo que cruza, partícula). | — |
| Timing | Peso = tiempo. Objetos grandes/pesados tardan más y aceleran menos. Ver `02-tiempos.md`. | Duración ∝ tamaño/distancia (no todo dura lo mismo). |
| Exaggeration | Exagerar 10–20 % lo que en la vida real sería sutil; los overshoots legibles están en 3–8 % del valor final. | — |
| Solid drawing | En 2.5D: perspectiva consistente, una sola fuente de luz, sombras coherentes. | Todas las sombras de una escena comparten ángulo. |
| Appeal | Forma y ritmo con intención; evitar lo genérico. Ver `10-anti-look-ia.md`. | — |

## 2. Reglas de oro del acabado "After Effects"

1. **Jerarquía temporal**: lo más importante entra primero *o* último, nunca "a la vez que todo". Stagger obligatorio (`02-tiempos.md`).
2. **Asimetría de curvas**: entradas = ease-out fuerte (llegan y frenan); salidas = ease-in (aceleran y se van). Salidas ≈ 60–75 % de la duración de la entrada.
3. **Holds que respiran**: después de que algo llega, dejarlo quieto ≥ 0.6 s para que se lea (texto: ver fórmula de lectura en `02-tiempos.md`). Durante el hold, micro-movimiento opcional (drift 1–2 % de escala o 4–12 px en 2–4 s) para que no se vea "congelado".
4. **Movimiento motivado**: cada movimiento tiene dirección narrativa (la cámara empuja hacia lo que importa; las transiciones siguen el vector del movimiento anterior).
5. **Continuidad de vector**: si A sale hacia la izquierda, B entra desde la derecha con la misma velocidad aparente (match de velocidad en el corte).
6. **Un sistema, no efectos sueltos**: 3–4 curvas con nombre, 3–5 duraciones tokenizadas, 1–2 familias tipográficas, paleta de 3–5 colores + neutros.
7. **Textura física**: grano, motion blur, ligera viñeta, imperfección. El píxel perfecto de vector puro delata el render sintético (ver `06-color-y-textura.md`).
8. **El audio manda**: los acentos visuales caen en beats/transientes del audio (± 1 frame). Ver `07-sonido-y-sync.md`.
9. **Menos es más**: si una animación no comunica nada, quitarla. Un frame estático bien compuesto vale más que 5 animaciones en paralelo.
10. **Deterministas**: todo valor animado depende de `frame` (Remotion) o del playhead (HyperFrames); nada de `Math.random()` sin semilla ni `Date.now()`.

## 3. Pipeline mental de un motion designer (orden de trabajo)

1. **Animatic / blocking**: poses clave con interpolación *hold* (sin easing). Validar ritmo con el audio.
2. **Spline pass**: aplicar curvas (speed/value graph). Aquí nace el 80 % del acabado.
3. **Overlap & offsets**: desfasar elementos, añadir follow-through.
4. **Polish**: overshoot, motion blur, micro-movimientos, secundarios.
5. **Look**: color grade, grano, halation, viñeta, aberración cromática sutil.
6. **Sound pass**: SFX en cada acento, mezcla, ducking de música bajo la voz.

En código: separar cada pasada en capas de la composición (`<Blocking/>` → props de easing → `<Look/>` envolvente) para poder iterar.

## 4. Checklist de entrega (QA de motion)

- [ ] Ninguna propiedad espacial con easing lineal (excepto loops).
- [ ] Ningún grupo de ≥ 3 elementos entra en el mismo frame.
- [ ] Todo texto visible el tiempo mínimo de lectura.
- [ ] Motion blur activo en movimientos > 30 px/frame.
- [ ] Grano/textura presente en el look final (salvo estilo flat deliberado y documentado).
- [ ] Safe areas respetadas (vertical 9:16: 250 px arriba / 400 px abajo libres de UI en 1080×1920).
- [ ] Cada transición tiene SFX o justificación de silencio.
- [ ] Render a 30 o 60 fps constante; sin frames duplicados por `durationInFrames` mal calculado.

## Fuentes

- Frank Thomas & Ollie Johnston, *The Illusion of Life* — resumen de los 12 principios: https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation (consultado 2026-11-07)
- School of Motion — "10 Key Lessons" (Animation Bootcamp: 12 principios aplicados en AE): https://schoolofmotion.com/blog/10-lessons-after-effects-courses (consultado 2026-11-07)
- School of Motion — Graph Editor (speed vs value graph): https://schoolofmotion.com/blog/graph-editor-after-effects (consultado 2026-11-07)
- Material Design 3 — Motion overview: https://m3.material.io/styles/motion/overview (consultado 2026-11-07)
- Remotion — Animating properties (determinismo con `useCurrentFrame`): https://www.remotion.dev/docs/animating-properties (consultado 2026-11-07)
