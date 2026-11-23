# 04 · Transiciones

> Una transición pro **continúa un movimiento**; no "decora un corte". Regla base: la dirección, velocidad y punto focal de la salida de A determinan la entrada de B.

## 1. Catálogo con parámetros

| Transición | Cuándo | Duración (30 fps) | Curva | Implementación |
|---|---|---|---|---|
| **Corte duro** | Por defecto. Cambio de idea, en el beat. | 0 f | — | `<Series>` o `TransitionSeries` sin transición |
| **Corte en movimiento (match cut)** | A y B comparten forma/posición/vector | 0 f + motion blur | — | Alinear el objeto de A y B en el frame del corte |
| **Whip pan** | Energía alta, cambio de lugar | 8–12 f | `snap` | Translate X ±120 % + blur direccional 40–80 px en el pico |
| **Push / slide** | Secuencias, lista de features | 12–20 f | `snap` / `springSmooth` | `@remotion/transitions/slide` |
| **Zoom through** | Entrar "dentro" de un objeto/pantalla | 12–18 f | `leave` hasta el corte, `arrive` después | Scale A 1→4 + blur; B entra de 0.6→1 |
| **Mask / shape wipe** | Revelar con forma de marca | 15–24 f | `snap` | `clip-path` animado o `@remotion/transitions/wipe`, `iris` |
| **Luma / gradient wipe** | Look cinematográfico suave | 18–30 f | `glide` | Gradiente animado como máscara (`mask-image`) |
| **Dissolve (cross-fade)** | Paso de tiempo, tono emotivo | 15–30 f | `glide` | `fade()` — **usar poco** (ver tells) |
| **Dip to color** | Cierre de capítulo | 10 f out + 2–4 f hold + 10 f in | `leave`/`arrive` | Capa sólida de color de marca |
| **Light leak / flash** | Música con golpe, estética film | 6–12 f | — | Overlay en `screen`/`add` de un leak real (stock) a 40–70 % |
| **Glitch / RGB split** | Tech, error, energía | 4–8 f | — | Desfase de canales 4–16 px + slices; nunca > 10 f |
| **Morph (shape → shape)** | Logo, iconos, UI que se transforma | 15–24 f | `move` | `@remotion/paths` `interpolatePath()` / GSAP MorphSVG |
| **Camera move transition** | Escenas en un mismo "mundo" 2.5D | 20–40 f | `snap` | Mover la cámara virtual de un grupo a otro (ver `05`) |

## 2. Reglas de oro

1. **Dirección narrativa**: avanzar = de derecha a izquierda (la cámara va hacia la derecha) en culturas LTR; volver = al revés. Mantenerlo en toda la pieza.
2. **Velocidad continua**: la velocidad de salida de A en el frame de corte ≈ velocidad de entrada de B. Por eso `snap` (alta velocidad en el centro) es la curva de transición: el corte cae en el pico de velocidad, escondido por el blur.
3. **El corte cae en el beat** (± 1 f) o en un transiente de SFX (`07-sonido-y-sync.md`).
4. **Máximo 2–3 tipos de transición por pieza**. Variedad excesiva = plantilla.
5. **Transición = SFX**: whoosh para whip/push, impacto para zoom/flash, riser para builds de 1–2 s.
6. **Motion blur obligatorio** en whip/push/zoom (sin él, el ojo ve los dos cuadros y se nota sintético).
7. **Elementos persistentes**: si un elemento (logo, personaje, UI) existe en A y B, no lo cortes; transiciona alrededor de él.

## 3. Código (Remotion)

```tsx
import {TransitionSeries, springTiming, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {Easing} from 'remotion';

const snap = Easing.bezier(0.85, 0, 0.15, 1);

export const Escenas = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={75}><EscenaA /></TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: 'from-right'})}
      timing={linearTiming({durationInFrames: 14, easing: snap})}
    />
    <TransitionSeries.Sequence durationInFrames={90}><EscenaB /></TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={wipe({direction: 'from-left'})}
      timing={springTiming({config: {damping: 200}, durationInFrames: 20, durationRestThreshold: 0.001})}
    />
    <TransitionSeries.Sequence durationInFrames={60}><EscenaC /></TransitionSeries.Sequence>
  </TransitionSeries>
);
```

> Ojo: en `TransitionSeries` la transición **solapa** las escenas; la duración total = suma de secuencias − suma de transiciones.

### Whip pan casero con blur direccional

```tsx
const WhipOut: React.FC<{children: React.ReactNode; dur?: number}> = ({children, dur = 10}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur], [0, 1], {easing: Easing.bezier(0.7, 0, 0.84, 0), extrapolateRight: 'clamp'});
  const x = -120 * t;                         // % del ancho
  const blur = 60 * Math.sin(Math.PI * t);    // máximo en el centro del movimiento
  return <AbsoluteFill style={{transform: `translateX(${x}%)`, filter: `blur(${blur * 0.15}px)`}}>{children}</AbsoluteFill>;
};
```

Para blur **direccional** real (solo eje X) usar `<Trail>`/`<CameraMotionBlur>` de `@remotion/motion-blur` o un filtro SVG `feGaussianBlur stdDeviation="40 0"`.

### Presentación custom (máscara con forma de marca)

`TransitionPresentation` recibe `presentationProgress` (0→1) y `presentationDirection` (`entering`/`exiting`); devolver un `clipPath` que crece desde el punto focal: `circle(${p * 150}% at 70% 40%)`.

## 4. Reglas lintables

- `fade()` en > 30 % de las transiciones de una pieza → warning ("dissolve por defecto").
- > 3 presentaciones distintas en una misma composición → warning.
- Transiciones `slide/whip/zoom` sin `CameraMotionBlur`/`Trail` o blur equivalente → warning.
- Transición sin SFX dentro de ± 2 f → info.
- Duración de transición > 30 f a 30 fps sin comentario → warning.

## Transiciones de los referentes (2026-11-07)

- **El contenido cambia en el pico:** etiqueta, palabra o color cambian en el cuadro de máxima velocidad u oclusión del objeto (giro de producto, whip), con motion blur. Equivale a un match cut sobre algo que sigue en cuadro (fichas `fCZochdnlHA`, `7O2_OV4tLj4`).
- **La transición sale de la historia:** iris desde un hueco del plano, un objeto en primer término que tapa la lente, un objeto que lleva al siguiente. El corte cae en el pico del movimiento, nunca con la cámara parada (ficha `11-0lvGltVA`).
- **Variedad acotada:** 2 o 3 tipos por pieza (AI-14). Repetir la misma transición en cada corte (espejo con blur, flash blanco) es el tell más común de los tutoriales.

## Fuentes

- Remotion — `TransitionSeries` y presentaciones (`fade`, `slide`, `wipe`, `flip`, `clockWipe`, `iris`): https://www.remotion.dev/docs/transitions/transitionseries (consultado 2026-11-07)
- Remotion — `springTiming()` (recomendación de `durationRestThreshold` bajo): https://www.remotion.dev/docs/transitions/timings/springtiming (consultado 2026-11-07)
- Remotion — Presentaciones custom: https://www.remotion.dev/docs/transitions/presentations/custom (consultado 2026-11-07)
- School of Motion — "Six Essential Motion Design Transitions" (dissolve, infinite zoom, morph…): https://schoolofmotion.com/blog/six-essential-motion-design-transitions-tutorial (consultado 2026-11-07)
- Ben Marriott — tutoriales de transiciones y "motion matching" (canal YouTube): https://www.youtube.com/@BenMarriott (consultado 2026-11-07)
- GSAP — MorphSVGPlugin: https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/ (consultado 2026-11-07)
