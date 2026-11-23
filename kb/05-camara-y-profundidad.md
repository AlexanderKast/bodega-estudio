# 05 · Cámara y profundidad (2.5D, parallax, DOF, motion blur)

> La "cámara" es lo que más separa un motion pro de una diapositiva animada. Incluso en piezas 2D, una cámara que respira (push-in, drift) cambia la percepción de calidad.

## 1. Cámara virtual en Remotion (2.5D con CSS 3D)

Modelo: un contenedor con `perspective` y capas con `translateZ`. La cámara se mueve aplicando la transformación **inversa** al "mundo".

```tsx
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';

const glide = Easing.bezier(0.45, 0, 0.55, 1);

export const Mundo25D: React.FC<{layers: {z: number; node: React.ReactNode}[]}> = ({layers}) => {
  const f = useCurrentFrame();
  const camZ = interpolate(f, [0, 150], [0, 220], {easing: glide, extrapolateRight: 'clamp'}); // push-in
  const camX = interpolate(f, [0, 150], [-30, 30], {easing: glide, extrapolateRight: 'clamp'}); // truck
  const rotY = interpolate(f, [0, 150], [-2, 2], {easing: glide, extrapolateRight: 'clamp'});   // pan sutil
  return (
    <AbsoluteFill style={{perspective: 1400, perspectiveOrigin: '50% 50%'}}>
      <AbsoluteFill style={{transformStyle: 'preserve-3d', transform: `translate3d(${-camX}px,0,${camZ}px) rotateY(${rotY}deg)`}}>
        {layers.map((l, i) => (
          <AbsoluteFill key={i} style={{transform: `translateZ(${l.z}px) scale(${1 - l.z / 1400})`}}>{l.node}</AbsoluteFill>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- `scale(1 - z/perspective)` compensa el tamaño para que la capa se vea del tamaño diseñado en el frame 0 (truco de AE: "escala compensada" al mover capas en Z).
- `perspective` 1000–2000 px: lentes "normales". < 800 = gran angular exagerado; > 3000 = tele (poco parallax).
- Para escenas complejas con luces/sombras reales: `@remotion/three` (React Three Fiber) o render en Blender (`09-blender.md`).

## 2. Movimientos de cámara (vocabulario + valores)

| Movimiento | Qué hace | Valores típicos (1080p, por plano de 3–5 s) |
|---|---|---|
| Push-in (dolly in) | Acerca al sujeto, sube tensión | scale 1.00 → 1.06–1.12, o Z +150–300 px |
| Pull-out | Revela contexto, cierre | scale 1.10 → 1.00 |
| Truck / pan lateral | Recorre una escena | 40–120 px en 3–5 s |
| Pedestal / tilt | Sube/baja revelando | 30–80 px |
| Drift (handheld suave) | "Respira", evita lo estático | ruido Perlin 2–6 px, 0.15–0.3 Hz, rotación ±0.3° |
| Shake (impacto) | Golpe, beat fuerte | 8–20 px durante 6–10 f con decay exponencial |
| Snap zoom | Énfasis cómico/energía | scale ×1.3–2 en 3–5 f, `snap` |
| Rack focus | Cambia el foco entre capas | blur de capa A 0→8 px y B 8→0 px en 12–20 f |
| Orbit (3D) | Producto/logo 3D | 10–30° en 3–5 s |

**Regla**: una cámara nunca está 100 % quieta en planos > 2 s, salvo decisión estilística (estética "lock-off" documentada).

### Drift/handheld con ruido determinista

```ts
import {noise2D} from '@remotion/noise';

export const handheld = (frame: number, fps: number, amp = 4, hz = 0.2, seed = 'cam') => {
  const t = (frame / fps) * hz;
  return {
    x: noise2D(seed + 'x', t, 0) * amp,
    y: noise2D(seed + 'y', t, 0) * amp,
    r: noise2D(seed + 'r', t, 0) * 0.3,   // grados
  };
};
```

## 3. Parallax

- Velocidad de capa ∝ 1 / distancia. Con 3 planos: fondo 0.2×, medio 0.5×, frente 1.0× (y "foreground occluder" a 1.4× para profundidad extra).
- **Foreground elements** (hojas, partículas, bordes desenfocados que cruzan el frente) = el truco más barato para que se sienta cinematográfico.
- Parallax de fotos: separar sujeto del fondo (rembg/SAM en servidor con GPU), rellenar el hueco del fondo (inpainting), animar sujeto 1× y fondo 0.3× + escala opuesta ligera.
- Mapa de profundidad (Depth Anything / ZoeDepth) → desplazamiento por píxel (efecto "3D photo") en shader o en Blender (displace con la imagen como textura).

## 4. Profundidad de campo (DOF)

| Distancia al plano de foco | Blur (1080p) |
|---|---|
| Plano en foco | 0 px |
| Capa media | 2–4 px |
| Fondo | 6–14 px |
| Foreground cercano | 10–25 px |

- CSS `filter: blur()` es gaussiano; el bokeh real es de disco. Para fondos con luces, mejor renderizar el DOF en Blender (Cycles/EEVEE con `dof.use_dof = True`, `aperture_fstop` 1.4–2.8) o usar imágenes con bokeh real.
- **Rendimiento**: `blur()` grande en Remotion es caro; pre-renderizar fondos desenfocados como imágenes cuando no cambian.
- Además del blur: bajar contraste y saturación 10–20 % y añadir neblina en capas lejanas (perspectiva atmosférica).

## 5. Motion blur

- **Shutter 180°** (default de cine): el blur cubre la mitad del intervalo entre frames. A 30 fps = 1/60 s de exposición.
- Activar cuando un elemento se mueve > ~20–30 px/frame o rota rápido. Sin blur en movimientos rápidos = look "stop motion"/sintético.

```tsx
import {CameraMotionBlur} from '@remotion/motion-blur';

<CameraMotionBlur shutterAngle={180} samples={10}>
  <EscenaRapida />
</CameraMotionBlur>
```

- `samples`: 6–10 para preview, 16–32 para render final (coste lineal en tiempo de render → hacerlo en el servidor).
- `shutterAngle`: 90° = más nítido (acción, deportes), 180° = natural, 270–360° = onírico/streaky.
- Envolver **solo** la parte que se mueve rápido, no toda la composición.
- `<Trail>` crea estelas (efecto estilizado), no es blur físico.
- En HyperFrames hay motion blur propio desde 2026 (opt-in): `data-motion-blur="on"` en la composición raíz, `data-motion-blur-shutter` (0–720°, 240 por defecto), `data-motion-blur-tier="capture"` para la versión más fiel, y `"off"` en un subárbol que ya trae su blur; correr `hyperframes check` después (ver `referentes/fichas/bQ_8Eu-hWCs.md`). Alternativas: `filter: blur()` direccional por velocidad, o renderizar a 120 fps y mezclar pares de cuadros a 60 fps con ffmpeg (`tmix`).

## 6. Reglas lintables

- Composición > 60 f sin ningún transform en el contenedor raíz/cámara → warning "cámara muerta".
- `translateX/Y` con delta > 30 px entre frames consecutivos y sin `CameraMotionBlur`/blur → warning.
- `filter: blur(>20px)` animado en capa a pantalla completa → warning de rendimiento (pre-render).
- `perspective` < 600 o > 4000 → info.
- Shake con amplitud > 30 px o duración > 15 f → warning.

## Reglas de cámara de los referentes (2026-11-07)

- **Atravesar una capa:** para meterse en algo que está en `z`, la cámara llega a `z + 0,8 × perspective` o más; si se queda corta, el empuje no se nota (Director de Collage, ficha `11-0lvGltVA`).
- **La cámara avanza hacia lo que va a pasar:** el movimiento anticipa la posición del siguiente evento. Avanzar y retroceder en menos de 1 s es un error de dirección (ficha `dTWwA2u42tc`). Revisión humana por ahora; pendiente como regla de `motion-audit`.
- **Cámara mínima "breath":** escala global lenta de 100 → 90 % (o 100 → 106 %) en ~3 s con `glide`, sobre toda la escena mientras pasan las acciones cortas. Cumple AI-08 sin mover la cámara a mano (masterclass de AE, ficha `7O2_OV4tLj4`).
- **DOF en tres capas:** primer plano desenfocado, héroe nítido, fondo desenfocado (anuncio de Apple, ficha `BaWrJajJRjA`).

## Fuentes

- Remotion — `<CameraMotionBlur>` (shutterAngle 180 por defecto, samples): https://www.remotion.dev/docs/motion-blur/camera-motion-blur (consultado 2026-11-07)
- Remotion — `@remotion/motion-blur` y `<Trail>`: https://www.remotion.dev/docs/motion-blur (consultado 2026-11-07)
- Remotion — `@remotion/noise` (`noise2D`, `noise3D`): https://www.remotion.dev/docs/noise (consultado 2026-11-07)
- Remotion — `@remotion/three`: https://www.remotion.dev/docs/three (consultado 2026-11-07)
- MDN — `perspective` y `transform-style: preserve-3d`: https://developer.mozilla.org/en-US/docs/Web/CSS/perspective (consultado 2026-11-07)
- Wikipedia — Rotary disc shutter / shutter angle: https://en.wikipedia.org/wiki/Rotary_disc_shutter (consultado 2026-11-07)
- School of Motion — "Working with Cameras in After Effects" (2.5D): https://schoolofmotion.com/blog/cameras-after-effects (consultado 2026-11-07)
