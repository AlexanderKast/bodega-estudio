# Traducción Remotion ↔ GSAP / HyperFrames

> Para mover composiciones entre el estudio Remotion de Master Motion y HyperFrames (VSL, app-video-studio). Diferencia de fondo: **Remotion = el valor es función del frame** (`useCurrentFrame()`); **HyperFrames = el HTML define el tiempo y una timeline GSAP pausada se "busca" (seek)** frame a frame. En ambos el render es determinista: nada de reloj real.

## 1. Conceptos

| Concepto | Remotion | HyperFrames / GSAP |
|---|---|---|
| Unidad de tiempo | frames (`durationInFrames`, `from`) | segundos (`data-start`, `data-duration`, `duration` de GSAP) |
| fps | `fps` en `<Composition>` | 30 por defecto (configurable al render) |
| Composición raíz | `<Composition id width height fps durationInFrames component>` | `<div id="root" data-composition-id data-width data-height data-duration>` |
| Elemento con tiempo | `<Sequence from={30} durationInFrames={60}>` | `<el class="clip" data-start="1" data-duration="2" data-track-index="1">` |
| Encadenar en serie | `<Series>` / `<Series.Sequence>` | `data-start="intro"` (empieza al terminar `intro`), `"intro + 0.5"`, `"intro - 0.5"` |
| Capas | orden en el árbol / `zIndex` | `data-track-index` (pista de timeline, **no** z-index; usar CSS `z-index`) |
| Sub-composición | componente / `<Sequence>` anidado | `data-composition-src="compositions/x.html"` en un host con `data-start/duration` |
| Tiempo actual | `useCurrentFrame()` | el playhead lo controla el runtime; GSAP lo recibe por seek |
| Animación | `interpolate()`, `spring()` en render | `gsap.timeline({paused: true})` registrada en `window.__timelines[compositionId]` |
| Video | `<OffthreadVideo>` / `<Video>` | `<video data-start data-duration data-track-index muted playsinline>` (no `play()` desde JS) |
| Audio | `<Audio volume={(f)=>…}>` | `<audio data-start data-duration data-volume>` |
| Imágenes estáticas | `staticFile()` + `<Img>` | `<img src="assets/…">` |
| Fuentes | `@remotion/google-fonts` / `loadFont` | `@font-face` + `document.fonts.load()` antes de medir |
| Aleatoriedad | `random(seed)` | PRNG con semilla (mulberry32) — nunca `Math.random()` |
| Verificación | Studio + `npx remotion still` | `npx hyperframes lint`, `check`, `snapshot --at 0,0.6,2.9` |

## 2. Equivalencia de una animación

Remotion:
```tsx
const f = useCurrentFrame();
const y = interpolate(f, [0, 18], [32, 0], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateRight: 'clamp'});
const o = interpolate(f, [0, 11], [0, 1], {extrapolateRight: 'clamp'});
return <h1 style={{transform: `translateY(${y}px)`, opacity: o}}>Hola</h1>;
```

HyperFrames:
```html
<h1 id="t" class="clip" data-start="0" data-duration="3" data-track-index="0">Hola</h1>
<script>
  const tl = gsap.timeline({paused: true});
  tl.fromTo('#t', {y: 32}, {y: 0, duration: 18/30, ease: 'expo.out'}, 0)
    .fromTo('#t', {opacity: 0}, {opacity: 1, duration: 11/30, ease: 'none'}, 0);
  window.__timelines = window.__timelines || {};
  window.__timelines.intro = tl;          // clave = data-composition-id
</script>
```

Reglas de HyperFrames que importan al traducir: timeline `paused: true`; posición explícita (tercer argumento) en cada tween; preferir `fromTo()` (robusto ante seeks hacia atrás/aleatorios); animar `transform`/`opacity`, no `top/left/width/height`; no tocar media desde la timeline (animar un wrapper).

## 3. Easings

| Token del estudio | Remotion | GSAP |
|---|---|---|
| `arrive` | `Easing.bezier(0.16, 1, 0.3, 1)` | `"expo.out"` |
| `arriveSoft` | `Easing.bezier(0.22, 1, 0.36, 1)` | `"power4.out"` (≈ quint) |
| `arriveGentle` | `Easing.bezier(0.33, 1, 0.68, 1)` | `"power2.out"` (≈ cubic) |
| `leave` | `Easing.bezier(0.7, 0, 0.84, 0)` | `"expo.in"` |
| `leaveSoft` | `Easing.bezier(0.64, 0, 0.78, 0)` | `"power4.in"` |
| `move` | `Easing.bezier(0.65, 0, 0.35, 1)` | `"power2.inOut"` |
| `snap` | `Easing.bezier(0.85, 0, 0.15, 1)` | `CustomEase.create("snap", "0.85,0,0.15,1")` |
| `glide` | `Easing.bezier(0.45, 0, 0.55, 1)` | `"power1.inOut"` (≈ quad) / `"sine.inOut"` |
| `overshoot` | `Easing.bezier(0.34, 1.56, 0.64, 1)` | `"back.out(1.7)"` |
| `linear` | (sin easing) | `"none"` |
| `springSmooth` `{damping:200}` | `spring()` | `"power3.out"` (aprox.) o CustomEase muestreado |
| `springSnappy` | `spring()` | `"back.out(1.2)"` (aprox.) |
| `springPop` | `spring()` | `"elastic.out(1, 0.45)"` (aprox.) |

**Nota de nombres GSAP**: `power1` = quad, `power2` = cubic, `power3` = quart, `power4` = quint (en la familia "power" de GSAP el número es exponente − 1).

**Spring exacto en GSAP**: muestrear el spring de Remotion y crear un CustomEase:
```ts
import {spring, measureSpring} from 'remotion';
const config = {stiffness: 260, damping: 14};               // springPop
const fps = 30, n = measureSpring({fps, config});           // frames hasta asentarse
const pts = Array.from({length: n + 1}, (_, i) => `${(i / n).toFixed(4)},${spring({frame: i, fps, config}).toFixed(4)}`);
// CustomEase.create('springPop', 'M0,0 L' + pts.join(' L'))  // path SVG lineal por tramos, y > 1 permitido
```

## 4. Tiempos y stagger

| Remotion | GSAP |
|---|---|
| `durationInFrames: 18` | `duration: 18 / fps` (0.6 s a 30 fps) |
| `delay` / `frame - i*3` | `stagger: {each: 3/30}` o posición `i * 0.1` |
| stagger con curva | `stagger: {each: 0.08, ease: 'power2.out'}` / `{amount: 0.5}` |
| desde el centro / grilla | `stagger: {grid: [r, c], from: 'center'}` (en Remotion: ordenar por distancia) |
| `<Series>` | `data-start="clipAnterior"` o timeline secuencial con `'>'` |
| `TransitionSeries` (solape) | `data-start="a - 0.5"` + tweens de salida/entrada en esa ventana |
| `spring({delay})` | posición en la timeline |

## 5. Efectos

| Efecto | Remotion | HyperFrames |
|---|---|---|
| Motion blur | `<CameraMotionBlur shutterAngle samples>` | `data-motion-blur="on"` en la raíz (shutter 240° por defecto, tier `capture` opcional); o post en ffmpeg (`tmix`) |
| Ruido / wiggle | `@remotion/noise` | simplex-noise con semilla en la función de update / `gsap.utils.random` con semilla propia |
| Paths / morph | `@remotion/paths` (`evolvePath`, `interpolatePath`) | `stroke-dashoffset` con GSAP, MorphSVGPlugin |
| Split de texto | manual (`.split('')`) o `measureText` | SplitText (cargar fuente antes) |
| 3D | `@remotion/three` | Three.js con render manual por seek (`onUpdate` de la timeline) |
| Lottie | `@remotion/lottie` | lottie-web con `goToAndStop(frame, true)` en `onUpdate` |
| Captions | `@remotion/captions` | JSON de palabras → `data-start` por palabra o tweens posicionados |
| Grano | `<Grain>` SVG `feTurbulence` con `seed={frame}` | Overlay de video de grano como clip o canvas con PRNG seeded por tiempo |

## 6. Checklist de portabilidad

- [ ] Ningún valor depende de reloj real (`Date.now`, `performance.now`, `requestAnimationFrame` libre).
- [ ] Todos los tiempos expresados en un único lugar (constantes en frames → convertir a segundos para HyperFrames).
- [ ] Easings tomados de la tabla de tokens (mismo nombre en ambos lados).
- [ ] Media (video/audio) controlada por el framework, nunca por la animación.
- [ ] Fuentes cargadas antes de medir texto.
- [ ] Verificar 3 frames: inicio, mitad de movimiento, final (`remotion still` / `hyperframes snapshot`).

## Fuentes

- HyperFrames — repositorio y README: https://github.com/heygen-com/hyperframes (consultado 2026-11-07)
- HyperFrames — Compositions (HTML → frames, 30 fps por defecto): https://hyperframes.heygen.com/concepts/compositions (consultado 2026-11-07)
- HyperFrames — Data attributes (`data-start` relativo, tracks no son capas): https://hyperframes.heygen.com/concepts/data-attributes (consultado 2026-11-07)
- HyperFrames — GSAP animation guide (timeline pausada, `window.__timelines`, reglas): https://hyperframes.heygen.com/guides/gsap-animation (consultado 2026-11-07)
- HeyGen Research — "HTML to Video: seek, don't play": https://www.heygen.com/research/html-to-video (consultado 2026-11-07)
- GSAP — Eases y CustomEase: https://gsap.com/docs/v3/Eases/ , https://gsap.com/docs/v3/Eases/CustomEase/ (consultado 2026-11-07)
- GSAP — Staggers: https://gsap.com/resources/getting-started/Staggers/ (consultado 2026-11-07)
- Remotion — `Sequence`, `Series`, `TransitionSeries`: https://www.remotion.dev/docs/sequence , https://www.remotion.dev/docs/series (consultado 2026-11-07)
- Remotion — `spring()` / `measureSpring()`: https://www.remotion.dev/docs/spring (consultado 2026-11-07)
