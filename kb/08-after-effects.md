# 08 · After Effects → TypeScript para Remotion

> Las expresiones clásicas de AE traducidas a funciones puras de `frame`. Todas son deterministas. Convención: `t` en segundos = `frame / fps`.

## 0. Equivalencias base

| AE | Remotion |
|---|---|
| `time` | `frame / fps` |
| `thisComp.frameDuration` | `1 / fps` |
| `inPoint` | `from` de la `<Sequence>` (dentro de la secuencia `useCurrentFrame()` ya empieza en 0) |
| `linear(t, tMin, tMax, a, b)` | `interpolate(t, [tMin, tMax], [a, b], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})` |
| `ease(t, …)` | igual con `easing: Easing.bezier(0.333, 0, 0.667, 1)` |
| `easeIn` / `easeOut` | `Easing.bezier(0.333,0,1,1)` / `Easing.bezier(0,0,0.667,1)` (aprox.) |
| `valueAtTime(t)` | llamar a la misma función con otro frame: `f(frame - delay)` |
| `velocityAtTime(t)` | derivada numérica: `(f(fr) - f(fr - 1)) * fps` |
| `random(seed)` / `seedRandom` | `random(seed)` de `remotion` (determinista por string/número) |
| `wiggle(freq, amp)` | `noise2D` de `@remotion/noise` (ver §3) |
| Keyframes | arrays `[{frame, value, easing}]` evaluados con `interpolate` por tramos |

```ts
// kb/ae/keys.ts — evaluar keyframes estilo AE
import {interpolate, Easing} from 'remotion';
type EasingFunction = (t: number) => number;
export type Key = {f: number; v: number; ease?: EasingFunction};
export const keys = (frame: number, ks: Key[]) => {
  if (frame <= ks[0].f) return ks[0].v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (frame <= b.f) return interpolate(frame, [a.f, b.f], [a.v, b.v], {easing: b.ease ?? Easing.bezier(0.333, 0, 0.667, 1)});
  }
  return ks[ks.length - 1].v;
};
```

## 1. Inertial bounce (después del último keyframe)

AE (versión comunitaria, base Dan Ebberts):
```js
amp = .1; freq = 2.0; decay = 2.0;
// ... v = velocityAtTime(key(n).time - thisComp.frameDuration/10);
value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);
```

TypeScript:
```ts
/** Oscilación amortiguada que continúa la velocidad de llegada. */
export const inertialBounce = (opts: {
  frame: number; fps: number;
  value: number;          // valor ya calculado por los keyframes
  arriveFrame: number;    // frame del último keyframe
  arriveVelocity: number; // unidades/s justo antes de llegar (derivada numérica)
  amp?: number; freq?: number; decay?: number;
}) => {
  const {frame, fps, value, arriveFrame, arriveVelocity, amp = 0.1, freq = 2, decay = 2} = opts;
  const t = (frame - arriveFrame) / fps;
  if (t <= 0 || t > 4) return value;
  return value + arriveVelocity * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
};
```
Valores: UI `amp 0.05–0.08, freq 2–3, decay 4–6`; juguetón `amp 0.1, freq 2, decay 2–3`. Para la velocidad: `arriveVelocity = (keys(arriveFrame) - keys(arriveFrame - 1)) * fps` **con easing lineal en el último tramo** (si el último keyframe tiene ease-in a 0, la velocidad es 0 y no rebota — igual que en AE).

## 2. Overshoot por cálculo (Ebberts) — ideal para texto

AE: `endVal + amp*(Math.sin((t-dur)*w)/Math.exp(decay*(t-dur))/w)` tras un tramo lineal de `dur`.

```ts
export const overshoot = (frame: number, fps: number, from: number, to: number,
  {dur = 0.1, freq = 3, decay = 5, delay = 0} = {}) => {
  const t = frame / fps - delay;
  if (t <= 0) return from;
  if (t < dur) return from + (to - from) * (t / dur);
  const amp = (to - from) / dur;          // velocidad del tramo lineal
  const w = freq * Math.PI * 2;
  const tt = t - dur;
  return to + amp * (Math.sin(tt * w) / Math.exp(decay * tt) / w);
};
// Por letra (textIndex): delay = i * 0.04
```

## 3. Bounce (rebote con pérdida de energía, "keyframe bounce back")

```ts
/** Rebote físico contra un suelo: amplitud y periodo decrecen. */
export const bounceBack = (frame: number, fps: number, startFrame: number, v0: number,
  {e = 0.6, g = 5000, nMax = 6} = {}) => {   // e = coef. restitución, g = gravedad px/s²
  let t = (frame - startFrame) / fps;
  if (t < 0) return 0;
  let v = Math.abs(v0);
  for (let n = 0; n < nMax; n++) {
    const seg = (2 * v) / g;
    if (t < seg) return v * t - 0.5 * g * t * t;   // altura sobre el suelo
    t -= seg; v *= e;
  }
  return 0;
};
```

## 4. Wiggle → ruido coherente

`wiggle(freq, amp)` de AE es ruido suavizado (no `Math.random`).

```ts
import {noise2D} from '@remotion/noise';
export const wiggle = (frame: number, fps: number, freq: number, amp: number, seed = 'w', octaves = 1) => {
  const t = (frame / fps) * freq;
  let v = 0, a = 1, f = 1, norm = 0;
  for (let o = 0; o < octaves; o++) { v += noise2D(seed, t * f, o * 10) * a; norm += a; a *= 0.5; f *= 2; }
  return (v / norm) * amp;
};
// Cámara en mano: x = wiggle(f, fps, 0.3, 4, 'cx'); y = wiggle(f, fps, 0.3, 4, 'cy')
// "Y axis jitter" ocasional: multiplicar por (random(`j${Math.floor(frame/6)}`) > 0.85 ? 1 : 0)
```

## 5. `loopOut()` / `loopIn()`

```ts
/** Equivalente a loopOut(type) sobre una función definida en [0, period]. */
export const loopOut = (frame: number, period: number, f: (fr: number) => number,
  type: 'cycle' | 'pingpong' | 'offset' | 'continue' = 'cycle') => {
  if (frame <= period) return f(frame);
  const n = Math.floor(frame / period), r = frame % period;
  switch (type) {
    case 'cycle': return f(r);
    case 'pingpong': return n % 2 === 0 ? f(r) : f(period - r);
    case 'offset': return f(r) + n * (f(period) - f(0));
    case 'continue': { const vel = f(period) - f(period - 1); return f(period) + vel * (frame - period); }
  }
};
```
Uso típico: rotación de un engranaje `loopOut(frame, 60, fr => keys(fr, [...]), 'offset')`; flotación `pingpong`.

## 6. Otras expresiones frecuentes

```ts
// rotation: time*90  → giro continuo 90°/s (linear OK: es un loop)
const rot = (frame / fps) * 90;

// Delay en cadena (follow the leader / valueAtTime(time - i*d))
const seguidor = (i: number) => lider(frame - i * 3);   // 3 f de retraso por elemento

// Autofade (fade in/out por in/out point, 20 f)
const autofade = (frame: number, dur: number, tr = 20) =>
  Math.min(interpolate(frame, [0, tr], [0, 1], {extrapolateRight: 'clamp'}), interpolate(frame, [dur - tr, dur], [1, 0], {extrapolateLeft: 'clamp'}));

// Snap zoom in/out (4 f)
const snapZoom = (frame: number, dur: number, extra = 2, tr = 4) =>
  1 + interpolate(frame, [0, tr], [extra, 0], {easing: Easing.out(Easing.quad), extrapolateRight: 'clamp'})
    + interpolate(frame, [dur - tr, dur], [0, extra], {easing: Easing.in(Easing.quad), extrapolateLeft: 'clamp'});

// Squash & stretch ligado a la velocidad (mantener área)
const squash = (vel: number, k = 0.0004) => { const s = 1 + Math.min(Math.abs(vel) * k, 0.25); return {sx: 1 / Math.sqrt(s), sy: s}; };

// Counter / número con formato (Slider Control + Math.round)
const count = Math.round(interpolate(frame, [0, 40], [0, 12500], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateRight: 'clamp'})).toLocaleString('es-CO');
```

## 7. Presets de texto de AE → código

El **Text Animator** con **Range Selector** = un offset por carácter con una curva de forma.

| Preset AE | Traducción |
|---|---|
| Fade Up Characters | por letra: `opacity 0→1`, `y 20→0`, stagger 1 f |
| Typewriter | `slice(0, n)` con `n = floor(frame / 1.5)` |
| Slide Up Words (con máscara) | ver `03-tipografia-cinetica.md` LineReveal por palabra |
| Tracking In / Out | `letterSpacing` animado |
| Blur By Word | `filter: blur(10px)→0` + opacidad por palabra |
| Random Fade Up (Order: Random) | orden por `random('seed'+i)` en vez de índice |
| Range Selector "Ramp Up / Smooth" | `influencia(i) = clamp((progreso*(n+suavizado) - i)/suavizado, 0, 1)` |

```ts
/** Range selector: progress 0→1 recorre los caracteres; smooth = nº de caracteres de transición. */
export const rangeSelector = (i: number, n: number, progress: number, smooth = 3) =>
  Math.max(0, Math.min(1, (progress * (n + smooth) - i) / smooth));
```

## 8. Plugins de AE y su sustituto

| AE | Sustituto |
|---|---|
| Motion Blur de capa / RSMB | `@remotion/motion-blur` `CameraMotionBlur` |
| Echo / Trail | `<Trail>` |
| Fractal Noise | `feTurbulence` / `@remotion/noise` / shader |
| Turbulent Displace | `feDisplacementMap` con `feTurbulence` |
| Deep Glow | capas de `blur` en `screen` a distintos radios (8, 24, 64 px) |
| Trapcode Particular | partículas con `random(seed)` + `noise3D`, o Three.js |
| Element 3D | `@remotion/three` o render de Blender con alfa |
| Shape layer Trim Paths | SVG `stroke-dasharray`/`stroke-dashoffset` (`@remotion/paths` `evolvePath()`) |
| Repeater | `Array.from({length: n}).map(...)` con transform acumulado |

## 9. Puente MCP: Claude operando After Effects

Cuando un cliente exige un `.aep` editable, Claude puede construirlo dentro de After Effects por MCP. El camino por defecto del estudio sigue siendo Remotion/HyperFrames (render determinista, linter, git).

- **Paquete:** `@kumoproductions/mcp-aftereffects` (MIT, Windows y macOS, AE 2024–2026, Node ≥ 24). Es el que usa el tutorial de Artlist (ficha `referentes/fichas/3AIZ4FT61aw.md`).
- **Registro:** Claude Code → `claude mcp add aftereffects -- npx -y @kumoproductions/mcp-aftereffects`. Claude Desktop → `mcpServers.aftereffects = { command: "npx", args: ["-y", "@kumoproductions/mcp-aftereffects"] }`.
- **En AE:** Preferences → Scripting & Expressions → activar "Allow Scripts to Write Files and Access Network". AE abierto con el proyecto, **sin diálogos modales** (bloquean el script). No hace falta plugin ni panel para una sola instancia.
- **Cómo opera:** scripts por intercambio de archivos; cada operación es un grupo de deshacer atómico (Ctrl+Z borra el build entero: guardar versiones), y renderiza cuadros sueltos para que Claude revise.
- **Auditar sin tocar:** `env AE_MCP_READONLY=1` → solo lectura (inspeccionar y renderizar cuadros). Útil para revisar `.aep` de terceros o plantillas compradas.
- **Lo que hace bien:** capas, shapes, texto, keyframes, expresiones (rastros con `valueAtTime`, follows), efectos, cámaras, importar media, render de stills. Tracking y beats se calculan en código fuera de AE y se vuelcan como keyframes.
- **Límites medidos:** revisa stills, no el movimiento (el easing lo juzga una persona o nuestro linter); efectos pesados pueden colgar AE; 3D con modelos generados es débil (el 3D va por Blender); chats largos encarecen tokens.
- **Prueba real (2026-11-07, AE 26.5 build 89):** expone 11 herramientas (`ae_catalog`, `ae_comp_info`, `ae_context`, `ae_do` con 218 operaciones, `ae_layer_info`, `ae_project_export_json`, `ae_project_import_json`, `ae_project_info`, `ae_render_frame`, `ae_save_project`, `ae_version_info`); `eval.run` viene desactivado por política. Comp de prueba (titular por máscara con stagger de 4 f, barra, push 100 → 104 %) armada, renderizada en 3 cuadros y guardada en ~2 min, con 0,5–1 s por llamada y sin diálogos. Las curvas quedaron como se pidieron, leídas de los keyframes: `arrive` = influencia de salida 16 % y de llegada 88 % con velocidad 0; `glide` = 45 %/45 %. La traducción de `motion.ts` a speed/influence de AE funciona.
- **Fuentes:** AE usa las fuentes instaladas en Windows, no las de `@remotion/google-fonts`. Para que un .aep coincida con el render de Remotion, instalar las fuentes de la marca en el sistema (en la prueba, Bricolage Grotesque no estaba y se usó Bahnschrift SemiBold). Desde 2026-11-07 Bricolage Grotesque y Geist (variables, Google Fonts, OFL) están instaladas para el usuario en el PC (`%LOCALAPPDATA%\Microsoft\Windows\Fonts`); After Effects las ve después de reiniciarlo.
- **Privacidad:** nombres de capas, expresiones y rutas del proyecto viajan al servicio de IA. Con proyectos bajo NDA, usar copia de prueba.
- **Estado en Bodega Estudio:** After Effects no viene conectado. Este archivo queda como guía para traducir expresiones de AE a Remotion.

## Fuentes

- Dan Ebberts (MotionScript) — "Realistic Bounce and Overshoot": https://motionscript.com/articles/bounce-and-overshoot.html (consultado 2026-11-07)
- Harry Frank (Graymachine) — Top 5 expressions (Inertial Bounce v1.2, autofade, snap zoom, jitter): https://www.graymachine.com/top-5-effects-expressions (consultado 2026-11-07)
- Adobe — Expression language reference (`wiggle`, `loopOut`, `valueAtTime`): https://helpx.adobe.com/after-effects/using/expression-language-reference.html (consultado 2026-11-07)
- Docs for Adobe — After Effects Expression Reference (no oficial, comunidad): https://ae-expressions.docsforadobe.dev/ (consultado 2026-11-07)
- Remotion — `interpolate()` y `random()`: https://www.remotion.dev/docs/interpolate , https://www.remotion.dev/docs/random (consultado 2026-11-07)
- Remotion — `@remotion/paths` (`evolvePath`, `interpolatePath`): https://www.remotion.dev/docs/paths (consultado 2026-11-07)
- kumoproductions — mcp-aftereffects (README, npm v0.3.2): https://github.com/kumoproductions/mcp-aftereffects (consultado 2026-11-07)
- Artlist — How I Make Motion Graphics with Claude + After Effects: https://youtu.be/3AIZ4FT61aw (consultado 2026-11-07)
