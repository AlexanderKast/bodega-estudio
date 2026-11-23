# 06 · Color y textura (grano, halation, gradientes con ruido)

> El vector perfecto (color plano, bordes perfectos, gradientes lisos) es una de las firmas más claras del render sintético. La textura "física" vende el acabado.

## 1. Paleta

- **Estructura**: 1 color dominante (60 %), 1 secundario (30 %), 1 acento (10 %) + 2 neutros (fondo y texto). Máx. 5 colores con nombre por pieza.
- **Neutros con temperatura**: nunca `#000`/`#FFF` puros. Negro cálido `#0E0C0A`–`#16130F`, negro frío `#0A0D12`; blanco `#F4F1EA` (papel) o `#F7F7F5`.
- **Trabajar en OKLCH** para escalas y gradientes: interpolar en `oklch` evita el gris sucio del centro en gradientes RGB. CSS: `linear-gradient(in oklch, …)`; Remotion: `interpolateColors()` interpola en RGB → para gradientes animados importantes, convertir con `culori` y interpolar en OKLCH.
- **Contraste**: texto sobre fondo ≥ 4.5:1 (captions) y ≥ 3:1 (titulares grandes).
- Evitar la combinación por defecto "morado→azul/cian" (`#7C3AED → #06B6D4`, `#8B5CF6 → #3B82F6`) salvo marca que lo exija (`10-anti-look-ia.md`).

## 2. Grano de película

Valores de partida (1080p, mezcla `overlay` o `soft-light`):

| Look | Opacidad | Tamaño de grano | Animación |
|---|---|---|---|
| Sutil (comercial/UI) | 4–7 % | 1–1.5 px | Nuevo patrón cada frame (o cada 2 f "on twos") |
| Film 35 mm | 8–14 % | 1.5–2 px | Cada frame |
| 16 mm / editorial fuerte | 15–25 % | 2–3 px | Cada frame + ligero gate weave (0.5–1 px) |

Reglas: el grano **se mueve** (estático parece suciedad en la pantalla); más grano en sombras que en altas luces (en film); aplicarlo **después** del color, como última capa antes del export.

### Grano en Remotion (SVG `feTurbulence`, determinista por frame)

```tsx
import {AbsoluteFill, useCurrentFrame} from 'remotion';

export const Grain: React.FC<{opacity?: number; freq?: number}> = ({opacity = 0.08, freq = 0.9}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg width="100%" height="100%">
        <filter id={`g${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
```

Alternativa más rápida y realista: un video de grano escaneado (4K, 10 s, loop) en `<OffthreadVideo>` con `mixBlendMode: 'overlay'`. En ffmpeg al final: `noise=alls=12:allf=t+u` (12 = intensidad, `t` temporal).

## 3. Halation (film)

Brillo rojizo-anaranjado alrededor de altas luces (luz que rebota en la base del negativo). Receta (AE, ffmpeg o shader):

1. Aislar altas luces: umbral de luminancia ≈ 0.75–0.85.
2. Teñir: multiplicar por `#FF4A1C`–`#FF6A2A` (rojo-naranja).
3. Desenfocar: 8–25 px (1080p).
4. Mezclar con `screen`/`add` al 20–45 %.

En Remotion: duplicar la capa de highlights (o el frame completo) con `filter: brightness(…) contrast(…) blur(14px)` + `mix-blend-mode: screen` y un tinte; o shader WebGL en `@remotion/three`. Bloom ≠ halation: el bloom es blanco/del color de la luz; la halation es roja/naranja y más pegada al borde.

## 4. Otros "defectos" que venden realismo

| Efecto | Valor sutil | Nota |
|---|---|---|
| Viñeta | 15–30 % de oscurecimiento en esquinas, radio 70–85 % | `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,.35))` |
| Aberración cromática | 1–3 px de desfase R/B en bordes, más en esquinas | Más de 4 px = efecto glitch, no lente |
| Gate weave | 0.3–1 px de jitter de posición por frame | Solo estéticas film |
| Lens distortion | barril 2–5 % | Para UI "filmada" |
| Bloom | blur 20–60 px de altas luces al 10–25 % | Pantallas, neones |
| Dither | ruido ±1–2/255 en gradientes | **Obligatorio** para evitar banding en H.264/H.265 |

## 5. Gradientes con ruido (anti-banding y look orgánico)

- Los gradientes suaves en 8 bits generan **banding** al comprimir. Siempre sumar ruido (2–4 %) sobre gradientes grandes.
- **Mesh / "aurora" gradient** con 3–5 manchas radiales grandes, desenfocadas, moviéndose lento (ciclo 8–20 s) con `noise2D` → fondo vivo. Saturación moderada; evitar morado/azul por defecto.
- Grano encima del gradiente con `soft-light` 6–10 %.
- Export: `-pix_fmt yuv420p10le` (H.265 10-bit) o ProRes para masters; para redes, H.264 con `-tune grain` si hay mucho grano y bitrate ≥ 12 Mb/s en 1080p.

```css
/* Gradiente interpolado en OKLCH + capa de ruido */
.bg { background: linear-gradient(135deg in oklch, oklch(0.32 0.08 40), oklch(0.18 0.04 260)); }
```

## 6. Color grade final

- Orden: balance → contraste (curva S suave) → split toning (sombras frías/teal leve, luces cálidas) → saturación → halation/bloom → grano → viñeta.
- En Remotion se puede aplicar un LUT con un shader o renderizar limpio y gradear en ffmpeg: `lut3d=file=look.cube` (en el servidor, con NVENC para encode).
- Mantener negros en ≥ 2–4 % (no aplastar a 0) para look film; blancos ≤ 95 %.

## 7. Reglas lintables

- Colores `#000000` o `#FFFFFF` exactos como fondo → warning.
- Gradiente que ocupa > 30 % del cuadro sin capa de ruido/grano por encima → warning (banding).
- Gradiente lineal de hue morado (260–290°) a azul/cian (190–230°) → warning tell IA.
- Composición final sin `<Grain>` ni filtro de ruido → info (salvo `style: flat` declarado).
- Más de 5 colores saturados (C > 0.1 en OKLCH) distintos en un frame → warning.

## Textura después de comprimir (2026-11-07)

Grano, rejillas de puntos y patrones finos se validan sobre el MP4 final en H.264, no sobre el PNG: la compresión se los come (ficha `tieCG_Rqrp4`). Si no se ve en el MP4, subir contraste o tamaño de la textura, no la opacidad de golpe. El cambio de color de una escena ocurre en un evento de movimiento, nunca solo (ficha `7O2_OV4tLj4`).

## Un solo estilo entre los assets generados de una pieza (2026-11-10)

Medido en la prueba de `scripts/assets/` (tres objetos con Z-Image Turbo en el VPS de Bodega o en este equipo, `studio/public/assets/prueba-f3/`):

1. **Una style card, un `style.json`.** El párrafo de estilo (técnica, material, luz, lo que no lleva) va idéntico en todos los assets; por asset solo cambia la descripción del objeto. Cambiar una palabra del estilo a mitad de pieza obliga a regenerar todo.
2. **Un solo modelo y los mismos ajustes** (pasos, cfg, tamaño) para todo el juego. Mezclar modelos se nota más que mezclar semillas: la referencia de imagen con otro modelo dio un objeto más oscuro y granulado que sus hermanos.
3. **El negativo tiene que estar activo.** Con cfg 1 (el ajuste de fábrica de los modelos turbo) el negativo se ignora: salieron cifras en la esfera de un reloj y una semilla se fue a fotorrealista. Con cfg 2 no pasó ninguna de las dos cosas; con cfg 3 aparecen marcos y sobresaturación.
4. **Paleta por nombre en el prompt y por hex después.** El modelo entiende "lime green", no `#A3E635`: el lima salió pastel. El hex se impone al final: `vectorizar.py --paleta` en SVG, o corrección de color sobre el PNG.
5. **La luz se declara una vez** ("soft diffuse light from the top left") y coincide con el ángulo de `sombra` de `CutoutObject`. Dos objetos con el brillo en lados opuestos delatan el collage (kb/10).
6. **Semilla fija por asset, guardada en `manifest.json`.** Corregir un objeto es cambiar su descripción o su semilla, nunca el estilo.
7. **Se juzga en hoja de contactos** (`hoja.py`), todos juntos sobre el mismo papel, no uno por uno. Lo que más se sale del grupo se regenera con otra semilla. Señales a mirar: cuánta pincelada tiene cada uno, si alguno trae un color fuera de paleta, si el contorno es igual de limpio.
8. **Nunca texto ni cifras dentro de la imagen** (kb/12). Ojo con objetos que los llevan por naturaleza (relojes, teclados, billetes, pantallas, etiquetas): se revisa cada uno a ojo.
9. **Lo que unifica al final es lo compartido en Remotion:** el mismo papel de `public/texturas/`, el mismo borde de recorte, la misma sombra y el grano encima de todo (§2).

## Fuentes

- MDN — `feTurbulence`: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence (consultado 2026-11-07)
- MDN — interpolación de color en gradientes (`in oklch`): https://developer.mozilla.org/en-US/docs/Web/CSS/color-interpolation-method (consultado 2026-11-07)
- Effect.app — Film halation explicado (Kodak Vision3, halation vs bloom): https://effect.app/effects/halation (consultado 2026-11-07)
- Luttie — "Halation explained": https://luttie.app/blog/what-is-halation-in-film (consultado 2026-11-07)
- FFmpeg Filters — `noise`, `lut3d`, `tmix`: https://ffmpeg.org/ffmpeg-filters.html (consultado 2026-11-07)
- Remotion — `interpolateColors()`: https://www.remotion.dev/docs/interpolate-colors (consultado 2026-11-07)
- Evil Martians — "OKLCH in CSS: why we moved from RGB and HSL": https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl (consultado 2026-11-07)
- Tongyi-MAI — Z-Image-Turbo, ficha del modelo (8 pasos, sin CFG de fábrica): https://huggingface.co/Tongyi-MAI/Z-Image-Turbo (consultado 2026-11-10)
- Black Forest Labs — FLUX.2 [klein] 4B, ficha del modelo (Apache 2.0, edición con referencias): https://huggingface.co/black-forest-labs/FLUX.2-klein-4B (consultado 2026-11-10)
- ZhengPeng7 — BiRefNet (MIT), segmentación para quitar fondo: https://github.com/ZhengPeng7/BiRefNet (consultado 2026-11-10)
- BRIA AI — RMBG-2.0, ficha del modelo (CC BY-NC 4.0, no comercial): https://huggingface.co/briaai/RMBG-2.0 (consultado 2026-11-10)
