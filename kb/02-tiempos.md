# 02 · Tiempos: duraciones, stagger y holds

> Valores para **video** (no UI interactiva). El video se mira sin interacción, así que las animaciones pueden ser ~1.5–2× más largas que los tokens de UI de Material/Apple, pero nunca "flotar". Conversión: `frames = segundos × fps`. A 60 fps duplicar los frames de 30 fps.

## 1. Tabla de duraciones por tipo de elemento

| Elemento / acción | Segundos | 30 fps | 60 fps | Curva sugerida |
|---|---|---|---|---|
| Micro-feedback (tick, pulso, highlight de palabra) | 0.10–0.20 | 3–6 | 6–12 | `arriveGentle` |
| Icono / badge pop | 0.25–0.40 | 8–12 | 15–24 | `springPop` |
| Botón / chip / card pequeña entra | 0.30–0.45 | 9–14 | 18–27 | `arrive` / `springSnappy` |
| Palabra o línea de texto entra | 0.35–0.60 | 10–18 | 21–36 | `arrive` |
| Titular grande (por línea) | 0.50–0.80 | 15–24 | 30–48 | `arriveSoft` |
| Panel / card grande / mockup de teléfono | 0.60–0.90 | 18–27 | 36–54 | `arriveSoft` / `springSmooth` |
| Logo reveal completo | 1.20–2.50 | 36–75 | 72–150 | mezcla + hold |
| Movimiento A→B en cuadro | 0.40–0.80 | 12–24 | 24–48 | `move` |
| Salida de cualquier elemento | 60–75 % de su entrada | — | — | `leave` |
| Transición corte/whip/zoom | 0.25–0.50 | 8–15 | 15–30 | `snap` |
| Transición suave (dissolve, wipe lento) | 0.50–1.00 | 15–30 | 30–60 | `glide` |
| Push-in / dolly de cámara | 2–6 | 60–180 | 120–360 | `glide` |
| Drift ambiental (bg, partículas) | 4–10 por ciclo | 120–300 | 240–600 | `linear` / sine en loop |
| Count-up de número | 0.8–1.6 | 24–48 | 48–96 | `arriveSoft` (rápido al inicio, frena en el valor final) |
| Barra de progreso / gráfico crece | 0.6–1.2 | 18–36 | 36–72 | `arriveSoft` |

**Regla de distancia**: para movimientos espaciales, `duración ≈ base + k·√distancia`. Útil: `frames30 = 8 + 0.9 * Math.sqrt(px)` (100 px → 17 f; 400 px → 26 f; 1080 px → 38 f). Lo largo tarda más pero no proporcionalmente.

**Regla de tamaño/peso**: objetos que ocupan > 40 % del cuadro: +30 % de duración y `mass` 1.5–2 en springs.

## 2. Stagger (escalonado)

| Qué se escalona | Offset entre elementos | 30 fps | 60 fps |
|---|---|---|---|
| Letras (tipografía cinética) | 0.02–0.04 s | 1 | 1–2 (o 2–3 a 60) |
| Palabras | 0.05–0.10 s | 2–3 | 3–6 |
| Líneas de texto | 0.08–0.15 s | 3–5 | 5–9 |
| Items de lista / bullets | 0.08–0.12 s | 3–4 | 5–7 |
| Cards de una grilla | 0.05–0.08 s | 2 | 3–5 |
| Capas de un logo (forma → texto → tagline) | 0.15–0.30 s | 5–9 | 9–18 |

- **Stagger total máximo**: el último elemento debe empezar antes de `0.6 s` (18 f a 30 fps) después del primero; si hay muchos elementos, bajar el offset o agrupar.
- **Stagger no lineal** (se ve más orgánico): `delay(i) = total * easeOutQuad(i / (n-1))` → los primeros salen rápido, los últimos se espacian.
- **Desde el centro / desde el foco**: en grillas, ordenar por distancia al punto focal, no por índice.
- **Overlap**: cada elemento empieza mientras el anterior aún se mueve (offset < duración). Si el offset ≥ duración, se ve "en fila india" mecánica.

```ts
// Stagger con curva y orden por distancia al foco
import {interpolate, Easing} from 'remotion';

export const staggerDelay = (i: number, n: number, totalFrames: number) =>
  n <= 1 ? 0 : Math.round(totalFrames * Easing.out(Easing.quad)(i / (n - 1)));

export const byDistance = <T extends {x: number; y: number}>(items: T[], fx: number, fy: number) =>
  [...items].sort((a, b) => Math.hypot(a.x - fx, a.y - fy) - Math.hypot(b.x - fx, b.y - fy));
```

## 3. Holds (tiempo quieto)

- **Tiempo de lectura**: `holdSeg = max(1.0, 0.4 + palabras / 3.5)` (≈ 210 ppm, lectura cómoda en pantalla). 6 palabras → 2.1 s (63 f a 30 fps). Para audiencias de feed vertical: × 0.85.
- **Hold mínimo tras la llegada** de cualquier elemento informativo: 0.6 s (18 f).
- **Hold del logo final**: 1.5–2.5 s quieto (con drift 1–2 %).
- **Antes de una salida**: no salir en el mismo frame en que otro entra (dejar ≥ 4 f de solape o separación clara).
- **"Breath frames"**: entre secciones narrativas, 6–12 f donde nada nuevo entra (solo ambiente). Da ritmo y evita fatiga.

## 4. Ritmo global de una pieza

| Formato | Plano/escena promedio | Notas |
|---|---|---|
| Reel/TikTok 9:16 (hook) | 0.8–2.0 s | Primer cambio visual antes de 0.5 s; hook resuelto en 3 s |
| Anuncio 15–30 s | 1.5–3 s | 1 idea por plano |
| Explainer / VSL | 3–6 s | Cambiar algo (cámara, highlight, b-roll) cada ≤ 3 s aunque la escena siga |
| Logo sting | 3–6 s total | Build 1–2 s, hit, hold 1.5–2.5 s |

- **Ley del cambio visual**: en formatos sociales, ningún intervalo > 3 s sin un evento visual (movimiento, corte, highlight, zoom).
- **Contraste de ritmo**: alternar secuencias rápidas (cortes 8–15 f) con una lenta (60+ f). Todo al mismo tempo = monotonía (tell de IA, ver `10-anti-look-ia.md`).

## 5. fps

- **30 fps**: default para redes y VSL. Cumple con HyperFrames por defecto.
- **60 fps**: UI recordings, scroll de pantallas, gaming. Requiere motion blur más corto (shutter 180° a 60 fps = 1/120 s).
- **24 fps**: look "cine" para piezas narrativas; exige motion blur (sin blur se ve stroboscópico).
- No mezclar fps de fuentes sin conformar (video 24 en comp 30 → judder). Conformar con `playbackRate` o re-time en ffmpeg (`minterpolate` solo si no hay alternativa).

## 6. Reglas lintables

1. `durationInFrames` de cualquier animación de entrada ∈ [3, 30] a 30 fps (∈ [6, 60] a 60 fps). Fuera de rango requiere comentario.
2. Grupos de ≥ 3 elementos hermanos: delays no todos iguales (stagger obligatorio).
3. Stagger total del grupo ≤ 18 f a 30 fps.
4. Texto con N palabras visible ≥ `holdSeg(N)` frames entre fin de entrada e inicio de salida.
5. Salida ≤ entrada en duración.
6. Ningún tramo de > 90 f (30 fps) sin cambio de transform en ninguna capa (detectable muestreando frames).

## 7. Densidad de eventos por género (kb/12)

Intervalo máximo sin un evento visual nuevo (corte, entrada, highlight, cambio de layout):

| Género | Máximo sin evento | `motion-audit --genre` |
|---|---|---|
| Anuncio | 1 s (el gancho, primeros 3 s: 0,5 s) | `anuncio` |
| Explainer | 1,2 s | `explainer` |
| VSL | 1,5–2 s | `vsl` |
| Talking head | 3 s | `talking` |

El hold final del logo no cuenta. Corregido el 2026-11-07: "algo nuevo cada 0,5 s" en toda la pieza choca con el tiempo de lectura (§3) y la ficha `dTWwA2u42tc` lo descarta como regla universal; queda para el gancho. Variar los intervalos: golpes exactos cada N cuadros es AI-11 (lo mide `motion-audit`). La duración de un gráfico la fija su coreografía (entradas + `readingHold` + hold final), no un número redondo.

## Fuentes

- Material Design 3 — duraciones (short 50–200 ms, medium 250–400 ms, long 450–600 ms, extra-long 700–1000 ms): https://m3.material.io/styles/motion/easing-and-duration/tokens-specs (consultado 2026-11-07)
- Val Head / NN/g — "Animation duration" en interfaces (100–500 ms): https://www.nngroup.com/articles/animation-duration/ (consultado 2026-11-07)
- Apple Human Interface Guidelines — Motion: https://developer.apple.com/design/human-interface-guidelines/motion (consultado 2026-11-07)
- Remotion — `Sequence` y `delay` para escalonar: https://www.remotion.dev/docs/sequence (consultado 2026-11-07)
- GSAP — staggers (`each`, `from: "center"`, `ease`): https://gsap.com/resources/getting-started/Staggers/ (consultado 2026-11-07)
- HyperFrames — 30 fps por defecto, timing con `data-start`/`data-duration`: https://hyperframes.heygen.com/concepts/compositions (consultado 2026-11-07)
