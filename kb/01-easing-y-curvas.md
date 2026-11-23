# 01 · Easing y curvas

> Cómo pasar del Graph Editor de After Effects a `Easing.bezier()` y `spring()` de Remotion (y a `ease` de GSAP/HyperFrames). Valores exactos.

## 1. Speed graph vs value graph (AE) → código

- **Value graph**: eje Y = valor de la propiedad, eje X = tiempo. Es *literalmente* una `cubic-bezier` normalizada cuando la propiedad es 1D (opacidad, rotación, escala separada, posición con dimensiones separadas).
- **Speed graph**: eje Y = velocidad (px/s, °/s). Cada keyframe tiene **speed** (velocidad en el keyframe) e **influence** (0–100 %, qué tan lejos en el tiempo llega el handle).
- **Easy Ease (F9)** = speed 0 + influence 33.33 % en ambos lados → `cubic-bezier(0.333, 0, 0.667, 1)`.
- Arrastrar los handles del speed graph hacia los lados (más influence) = curva más "pesada": arranque más lento y llegada más larga. 80–100 % de influence = el look "AE pro".

### Fórmula de conversión AE → cubic-bezier (propiedad 1D, entre dos keyframes)

Con `Δv` = cambio de valor, `T` = duración, `avg = Δv / T` (velocidad media):

```
x1 = influenceOut           (0–1, del keyframe A)
y1 = influenceOut * (speedOut / avg)
x2 = 1 - influenceIn        (del keyframe B)
y2 = 1 - influenceIn * (speedIn / avg)
```

```ts
// kb/easing/ae.ts
import {Easing} from 'remotion';

/** Convierte speed/influence de AE (dos keyframes) a una función de easing de Remotion. */
export const aeEase = (opts: {
  speedOut: number;      // velocidad de salida del keyframe A (unidades/s)
  influenceOut: number;  // 0-100
  speedIn: number;       // velocidad de llegada al keyframe B (unidades/s)
  influenceIn: number;   // 0-100
  delta: number;         // valorB - valorA
  durationSec: number;
}) => {
  const avg = opts.delta / opts.durationSec;
  const io = opts.influenceOut / 100;
  const ii = opts.influenceIn / 100;
  return Easing.bezier(io, io * (opts.speedOut / avg), 1 - ii, 1 - ii * (opts.speedIn / avg));
};

// Easy Ease estándar: aeEase({speedOut:0, influenceOut:33.33, speedIn:0, influenceIn:33.33, delta, durationSec})
// → Easing.bezier(0.333, 0, 0.667, 1)
```

**Posición 2D con "Separate Dimensions" apagado**: AE mueve el objeto a lo largo de un path espacial y el speed graph controla la velocidad *sobre el path*. En Remotion: calcular `t = interpolate(frame, [a,b], [0,1], {easing})` y evaluar el path con ese `t` (p. ej. `@remotion/paths` → `getPointAtLength(path, t * getLength(path))`).

## 2. Tabla de curvas con nombre (sistema del estudio)

Usar **solo** estas. Un linter puede rechazar `cubic-bezier` fuera de la tabla.

| Token | cubic-bezier | Equivalente AE (aprox.) | GSAP | Uso |
|---|---|---|---|---|
| `arrive` | `0.16, 1, 0.3, 1` (expo-out) | A: speed alta/infl. 10 % → B: speed 0, infl. 85–95 % | `expo.out` | Entradas de texto/UI, "llega y frena" |
| `arriveSoft` | `0.22, 1, 0.36, 1` (quint-out) | B: infl. 70–80 % | `power4.out` | Entradas grandes o lentas |
| `arriveGentle` | `0.33, 1, 0.68, 1` (cubic-out) | B: infl. 50–60 % | `power2.out` | Micro-UI, fades |
| `leave` | `0.7, 0, 0.84, 0` (expo-in) | A: speed 0, infl. 85 % | `expo.in` | Salidas: aceleran y se van |
| `leaveSoft` | `0.64, 0, 0.78, 0` (quint-in) | A: infl. 70 % | `power4.in` | Salidas suaves |
| `move` | `0.65, 0, 0.35, 1` (cubic-in-out) | 65/65 % | `power2.inOut` | A→B dentro de cuadro |
| `snap` | `0.85, 0, 0.15, 1` | 85/85 % (curva "pro" de AE) | `expo.inOut` aprox. | Transiciones, whip, cámara rápida |
| `glide` | `0.45, 0, 0.55, 1` (quad-in-out) | 45/45 % | `power1.inOut` | Cámaras lentas, drifts |
| `aeEasy` | `0.333, 0, 0.667, 1` | Easy Ease F9 | — | Compatibilidad con proyectos AE |
| `overshoot` | `0.34, 1.56, 0.64, 1` (back-out) | — | `back.out(1.7)` | Pops de iconos/badges (preferir spring) |
| `anticipate` | `0.36, 0, 0.66, -0.56` (back-in) | — | `back.in(1.7)` | Salida con "carga" previa |
| `linear` | `0, 0, 1, 1` | Linear | `none` | **Solo** loops, rotaciones continuas, scroll de créditos, progreso de tiempo real |

### Referencia completa easings.net (valores exactos)

| Familia | In | Out | InOut |
|---|---|---|---|
| Sine | `0.12, 0, 0.39, 0` | `0.61, 1, 0.88, 1` | `0.37, 0, 0.63, 1` |
| Quad | `0.11, 0, 0.5, 0` | `0.5, 1, 0.89, 1` | `0.45, 0, 0.55, 1` |
| Cubic | `0.32, 0, 0.67, 0` | `0.33, 1, 0.68, 1` | `0.65, 0, 0.35, 1` |
| Quart | `0.5, 0, 0.75, 0` | `0.25, 1, 0.5, 1` | `0.76, 0, 0.24, 1` |
| Quint | `0.64, 0, 0.78, 0` | `0.22, 1, 0.36, 1` | `0.83, 0, 0.17, 1` |
| Expo | `0.7, 0, 0.84, 0` | `0.16, 1, 0.3, 1` | `0.87, 0, 0.13, 1` |
| Circ | `0.55, 0, 1, 0.45` | `0, 0.55, 0.45, 1` | `0.85, 0, 0.15, 1` |
| Back | `0.36, 0, 0.66, -0.56` | `0.34, 1.56, 0.64, 1` | `0.68, -0.6, 0.32, 1.6` |

Elastic y Bounce no son expresables con una cubic-bezier → usar `spring()` o la expresión de bounce (`08-after-effects.md`).

### Tokens de sistemas de diseño (para UI dentro del video)

| Sistema | Token | Valor |
|---|---|---|
| Material 3 | standard | `0.2, 0, 0, 1` |
| Material 3 | standard-decelerate | `0, 0, 0, 1` |
| Material 3 | standard-accelerate | `0.3, 0, 1, 1` |
| Material 3 | emphasized-decelerate | `0.05, 0.7, 0.1, 1` |
| Material 3 | emphasized-accelerate | `0.3, 0, 0.8, 0.15` |
| Material 3 | emphasized (fallback CSS) | `0.2, 0, 0, 1` (el oficial es un path de 2 segmentos) |
| Material 2 / legacy | standard | `0.4, 0, 0.2, 1` |
| CSS | `ease` | `0.25, 0.1, 0.25, 1` |
| CSS | `ease-in` / `ease-out` / `ease-in-out` | `0.42,0,1,1` / `0,0,0.58,1` / `0.42,0,0.58,1` |
| Carbon (IBM) | entrance expressive | `0, 0, 0.3, 1` |
| Carbon (IBM) | exit expressive | `0.4, 0.14, 1, 1` |

> Regla: **`ease` y `ease-in-out` de CSS son los easings "por defecto" que delatan trabajo sin intención.** No usarlos en video.

## 3. Springs en Remotion

```ts
spring({frame, fps, config: {mass: 1, stiffness: 100, damping: 10, overshootClamping: false}, from: 0, to: 1, delay: 0, durationInFrames?: n})
```

- Defaults de Remotion: `mass 1, stiffness 100, damping 10` → **rebota** (ζ = 0.5).
- **Ratio de amortiguamiento** `ζ = damping / (2·√(stiffness·mass))`. ζ < 1 rebota, ζ = 1 crítico (llega lo más rápido sin pasarse), ζ > 1 sobreamortiguado (lento, sin rebote).
- `durationInFrames` **estira** la curva para que termine en N frames; no cambia su forma. Para que se sienta más rápido, subir `stiffness` o bajar `mass`.
- `measureSpring({fps, config})` devuelve cuántos frames tarda en asentarse (p. ej. `damping: 200` a 30 fps → 23 frames).

### Presets del estudio

| Token | config | ζ | Asienta (30 fps aprox.) | Uso |
|---|---|---|---|---|
| `springSmooth` | `{damping: 200}` | 10 | ~23 f | Entradas sin rebote, transiciones (`springTiming`) |
| `springCritical` | `{stiffness: 170, damping: 26}` | 1.0 | ~20 f | UI "precisa", llega sin pasarse |
| `springSnappy` | `{stiffness: 200, damping: 20}` | 0.71 | ~18 f | Botones, chips, cards |
| `springPop` | `{stiffness: 260, damping: 14}` | 0.43 | ~30 f | Iconos, badges, likes (overshoot visible ~10 %) |
| `springBouncy` | `{damping: 8}` | 0.4 | ~45 f | Personajes, juguetón (usar poco) |
| `springHeavy` | `{mass: 2, stiffness: 80, damping: 15}` | 0.59 | ~50 f | Objetos grandes, 3D, logos pesados |

### Conversión desde Apple (SwiftUI `duration` + `bounce`)

Apple parametriza springs por duración percibida y bounce (0 = sin rebote, 0.15 snappy, 0.3 bouncy). Conversión (mass = 1):

```ts
export const appleSpring = (durationSec: number, bounce = 0) => {
  const stiffness = Math.pow((2 * Math.PI) / durationSec, 2);
  const damping = bounce >= 0
    ? (4 * Math.PI * (1 - bounce)) / durationSec
    : (4 * Math.PI) / (durationSec * (1 + bounce));
  return {mass: 1, stiffness, damping};
};
// appleSpring(0.5, 0)    → {stiffness ≈ 157.9, damping ≈ 25.1}  (= .smooth)
// appleSpring(0.5, 0.15) → .snappy ; appleSpring(0.5, 0.3) → .bouncy
```

### Spring → GSAP/HyperFrames

GSAP no tiene spring físico nativo. Opciones: (a) `CustomEase.create("springPop", "M0,0 C...")` muestreando el spring de Remotion; (b) `ease: "elastic.out(1, 0.4)"` como aproximación de `springPop`; (c) `back.out(1.4)` para `springSnappy`. Ver `traduccion-hyperframes.md` §3.

## 4. Reglas de easing (lintables)

1. `easing` es obligatorio en todo `interpolate()` de posición/escala/rotación. Sin `easing` = lineal = rechazo (salvo `// motion-lint: linear-ok` con razón).
2. Toda `interpolate()` lleva `extrapolateLeft/Right: 'clamp'` salvo que se quiera extrapolar a propósito.
3. Entradas usan curvas `*-out` o spring; salidas `*-in`. Una salida con curva `out` es error.
4. Prohibidos `cubic-bezier` fuera de la tabla de tokens y prohibido CSS `ease`/`ease-in-out` literal.
5. Overshoot ≤ 12 % del recorrido en UI/texto; personajes hasta 25 %.
6. Opacidad: nunca la única propiedad animada en una entrada principal (ver `10-anti-look-ia.md`). Fades de opacidad usan `arriveGentle` o `glide`, nunca `overshoot`.
7. Si dos propiedades del mismo elemento se animan juntas (y + opacidad), la opacidad termina antes: duración de opacidad ≈ 50–70 % de la del movimiento.

## Fuentes

- Adobe — Speed graph, Easy Ease (speed 0, influence 33.33 %): https://helpx.adobe.com/after-effects/desktop/animate-in-after-effects/speed-between-keyframes/speed.html (consultado 2026-11-07)
- School of Motion — Graph Editor, speed vs value graph: https://schoolofmotion.com/blog/graph-editor-after-effects (consultado 2026-11-07)
- easings.net — tabla de funciones y cubic-bezier: https://easings.net/ (consultado 2026-11-07)
- Remotion — `spring()` (defaults, `durationInFrames`, `overshootClamping`): https://www.remotion.dev/docs/spring (consultado 2026-11-07)
- Remotion — `measureSpring()`: https://www.remotion.dev/docs/measure-spring (consultado 2026-11-07)
- Remotion — `Easing`: https://www.remotion.dev/docs/easing (consultado 2026-11-07)
- Material Design 3 — Easing and duration tokens: https://m3.material.io/styles/motion/easing-and-duration/tokens-specs (consultado 2026-11-07)
- Carbon Design System — Motion (curvas productive/expressive): https://v10.carbondesignsystem.com/guidelines/motion/overview/ (consultado 2026-11-07)
- Apple WWDC23 — "Animate with springs" (duration + bounce): https://developer.apple.com/videos/play/wwdc2023/10158/ (consultado 2026-11-07)
- GSAP — Eases: https://gsap.com/docs/v3/Eases/ (consultado 2026-11-07)
