# 03 · Tipografía cinética

> Cómo animar texto para que se vea de motion designer y no de plantilla. Tiempos en frames a 30 fps salvo que se diga.

## 1. Decisiones tipográficas antes de animar

| Decisión | Regla | Por qué |
|---|---|---|
| Familia | 1 display con carácter + 1 de texto. Evitar Inter/Roboto/Poppins como display (ver `10-anti-look-ia.md`). Buenas display: Söhne Breit, GT America Extended, Neue Machina, PP Neue Montreal, Monument Extended, Druk, Editorial New, Fraunces, Instrument Serif, Space Grotesk (con moderación). | La tipografía es 50 % de la identidad. |
| Peso | Contraste fuerte: display 700–900 vs texto 400. Variable fonts permiten animar `wght`. | Jerarquía legible en 1 s. |
| Tamaño en 1080×1920 | Titular 96–160 px, subtítulo 48–64 px, captions 56–72 px, mínimo legible 36 px. En 1920×1080: titular 120–200 px, cuerpo ≥ 40 px. | Lectura en móvil. |
| Tracking | Display grandes: −1 % a −3 % (`letter-spacing: -0.02em`). Mayúsculas pequeñas: +4 % a +10 %. | Los defaults de 0 se ven "de documento". |
| Interlineado | Display 0.9–1.05; texto 1.25–1.4. | Bloques compactos = look editorial. |
| Alineación | Izquierda o justificada a una grilla; **centrado solo con intención** (logo, frase única). | Centrado por defecto es tell de IA. |
| Mayúsculas | Máx. 1 nivel de jerarquía en ALL CAPS. | — |

Cargar la fuente con `@remotion/google-fonts` o `staticFile` + `loadFont`, y en HyperFrames con `document.fonts.load()` antes de medir.

## 2. Técnicas de animación (con parámetros)

| Técnica | Cómo | Parámetros |
|---|---|---|
| **Mask reveal (línea sube desde máscara)** | Contenedor `overflow: hidden`; el texto entra de `translateY(110%)` a `0`. | Por línea 15–20 f, `arrive`, stagger 3–4 f. El clásico de AE. |
| **Por palabra con blur** | `y: 30→0`, `opacity: 0→1`, `filter: blur(12px)→0`. | 10–14 f por palabra, stagger 2–3 f, opacidad termina al 60 %. |
| **Por letra (split chars)** | Cada letra `y: 100%→0` o `rotateX(-90°)→0` con `transform-origin: bottom`. | 8–12 f, stagger 1 f, `springSnappy`. Solo en titulares de ≤ 20 caracteres. |
| **Tracking in** | `letter-spacing: 0.3em → -0.02em` + opacidad. | 30–45 f, `arriveSoft`. Logos y títulos de cierre. |
| **Weight morph** | Variable font `font-variation-settings: 'wght' 200 → 800`. | 12–20 f. Énfasis sobre palabra clave. |
| **Scale punch (palabra clave)** | `scale 1 → 1.12 → 1` con spring. | `springPop`, sincronizado con el beat/voz. |
| **Highlight marker** | Rectángulo detrás de la palabra, `scaleX 0→1` con `transform-origin: left`. | 8–12 f, `arrive`, color de acento, ligera rotación −1°…−2°. |
| **Subrayado que se dibuja** | SVG `stroke-dashoffset` de largo → 0. | 12–18 f, `arrive`. |
| **Scramble / decode** | Caracteres aleatorios con semilla que se resuelven de izq. a der. | 1 carácter resuelto cada 1–2 f; usar `random(seed)` de Remotion. |
| **Typewriter** | Revelar n caracteres = `floor(interpolate(...))`. | 1–2 f por carácter + cursor parpadeando 15 f on/off. Solo si el concepto lo pide (terminal, chat). |
| **Kinetic layout (palabras que empujan)** | Al entrar una palabra, las anteriores se desplazan con `springSmooth`. | Medir anchos con `measureText()` de `@remotion/layout-utils`. |
| **Captions karaoke** | Palabra activa con color/escala; inactivas 50–60 % opacidad. | Activación en el timestamp ± 0 f; transición de color 3–4 f. |

### Mask reveal por línea (Remotion)

```tsx
import {useCurrentFrame, interpolate, Easing} from 'remotion';

const arrive = Easing.bezier(0.16, 1, 0.3, 1);

export const LineReveal: React.FC<{lines: string[]; start?: number}> = ({lines, start = 0}) => {
  const frame = useCurrentFrame();
  return (
    <div>
      {lines.map((line, i) => {
        const f = frame - start - i * 4;              // stagger 4 f
        const y = interpolate(f, [0, 18], [110, 0], {easing: arrive, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div key={i} style={{overflow: 'hidden', lineHeight: 1}}>
            <div style={{transform: `translateY(${y}%)`}}>{line}</div>
          </div>
        );
      })}
    </div>
  );
};
```

### Captions palabra por palabra

- Fuente de timestamps: Whisper (`@remotion/install-whisper-cpp` o el servidor con GPU) → `createTikTokStyleCaptions()` de `@remotion/captions`, agrupando 2–4 palabras por página (`combineTokensWithinMilliseconds: 800–1200`).
- Posición vertical 9:16: centro del texto en 60–70 % de la altura (fuera de la UI de TikTok/Reels).
- Estilo pro: sin caja de fondo gris; usar stroke 6–10 px o sombra suave `0 4px 24px rgba(0,0,0,.45)`; 1 color de acento para la palabra activa.

## 3. Reglas de legibilidad y ritmo

1. Nunca animar más de una **unidad semántica** a la vez: una frase entra completa (por palabras) antes de que entre la siguiente.
2. La palabra más importante recibe *otro* tratamiento (peso, color, escala, timing distinto). Si todo se enfatiza, nada se enfatiza.
3. Salida de texto: más rápida (10–12 f, `leave`) y en bloque o con stagger inverso de 1–2 f.
4. Evitar `opacity` sola: combinar con `y`, `blur` o máscara.
5. El texto no rota más de ±3° en estado de lectura (sí durante la transición).
6. Contraste mínimo WCAG 4.5:1 en captions; 3:1 en titulares ≥ 96 px.
7. Máximo 7–9 palabras en pantalla a la vez en 9:16.

## 4. Reglas lintables

- `letterSpacing` explícito en todo texto ≥ 72 px.
- `textAlign: 'center'` en > 50 % de los bloques de texto de la composición → warning.
- `fontFamily` ∈ {Inter, Roboto, Arial, Helvetica, system-ui, Poppins, Montserrat} en texto ≥ 72 px → warning.
- Split por letras en textos > 24 caracteres → warning.
- Captions: `fontSize` ≥ 48 px en 1080×1920.

## Fuentes

- School of Motion — Text Animators en After Effects: https://schoolofmotion.com/blog/text-animators-after-effects (consultado 2026-11-07)
- School of Motion — Kinetic typography en After Effects: https://schoolofmotion.com/blog/kinetic-typography-after-effects-part-1 (consultado 2026-11-07)
- Remotion — `@remotion/captions` / `createTikTokStyleCaptions()`: https://www.remotion.dev/docs/captions/create-tiktok-style-captions (consultado 2026-11-07)
- Remotion — `measureText()` de `@remotion/layout-utils`: https://www.remotion.dev/docs/layout-utils/measure-text (consultado 2026-11-07)
- GSAP — SplitText (split por chars/words/lines con máscara): https://gsap.com/docs/v3/Plugins/SplitText/ (consultado 2026-11-07)
- HyperFrames — cargar fuentes antes de medir (`document.fonts.load`): https://hyperframes.heygen.com/guides/gsap-animation (consultado 2026-11-07)
- W3C — WCAG 2.2 contraste mínimo 1.4.3: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (consultado 2026-11-07)
