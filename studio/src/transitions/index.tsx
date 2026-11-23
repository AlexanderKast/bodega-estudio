import { linearTiming, springTiming, type TransitionPresentation, type TransitionPresentationComponentProps } from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { AbsoluteFill, random } from "remotion";
import { curves, springs } from "../lib/motion";

/**
 * Transiciones del estudio (kb/04). Regla AI-14: máximo 2–3 tipos por pieza.
 * Todas usan la curva snap; la "velocidad" se vende con blur, no con duración.
 */

/** Timing estándar: 10 f con curva snap (whip, zoom). */
export const snapTiming = (durationInFrames = 10) => linearTiming({ durationInFrames, easing: curves.snap });

// ── Whip pan: barrido lateral con blur direccional (SVG, solo en X) ──
type WhipProps = { direction?: "left" | "right" };

const Whip: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const dir = passedProps.direction === "right" ? 1 : -1;
  const entering = presentationDirection === "entering";
  const x = entering ? (1 - p) * -dir * 100 : p * dir * 100;
  const blur = Math.sin(p * Math.PI) * 60;
  const id = `whip-${presentationDirection}`;
  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={id}>
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `translateX(${x}%)`, filter: blur > 0.5 ? `url(#${id})` : undefined }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const whip = (props: WhipProps = {}): TransitionPresentation<WhipProps> => ({ component: Whip, props });

// ── Zoom-through: la escena saliente se acerca y se desenfoca; la entrante llega desde atrás ──
const ZoomThrough: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const entering = presentationDirection === "entering";
  const scale = entering ? 0.82 + 0.18 * p : 1 + 0.6 * p;
  const blur = entering ? (1 - p) * 14 : p * 18;
  const opacity = entering ? Math.min(1, p * 2) : 1 - Math.max(0, p * 2 - 1);
  return <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)`, opacity }}>{children}</AbsoluteFill>;
};

export const zoomThrough = (): TransitionPresentation<Record<string, never>> => ({ component: ZoomThrough, props: {} });

// ── Mask wipe diagonal: la entrante se destapa con un borde inclinado ──
const MaskWipe: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ transform: `translateX(${-p * 8}%)` }}>{children}</AbsoluteFill>;
  }
  const edge = p * 140 - 20; // % del ancho
  return (
    <AbsoluteFill style={{ clipPath: `polygon(0 0, ${edge + 20}% 0, ${edge}% 100%, 0 100%)` }}>
      <AbsoluteFill style={{ transform: `translateX(${(1 - p) * 6}%)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const maskWipe = (): TransitionPresentation<Record<string, never>> => ({ component: MaskWipe, props: {} });

// ── Noise blocks: disolución por bloques en el orden de un mapa de ruido, con RGB a mitad (kb/13 §2) ──
type NoiseBlockProps = {
  /** Columnas de la grilla: 8–24. Las filas salen del formato. */
  cols?: number;
  /** "ruido" con dirección de izquierda a derecha, o "bayer" (orden de la trama de 1 bit de la marca). */
  orden?: "ruido" | "bayer";
  /** Separación RGB máxima en px, a mitad de la transición: 2–6. */
  rgb?: number;
  seed?: string;
  width: number;
  height: number;
};

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const NoiseBlock: React.FC<TransitionPresentationComponentProps<NoiseBlockProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { cols = 16, orden = "ruido", rgb = 4, seed = "bloques", width, height } = passedProps;
  const rows = Math.max(1, Math.round((cols * height) / width));
  const dt = Math.sin(p * Math.PI); // máximo a mitad: ahí van el warp y el RGB
  const id = `nb-${presentationDirection}`;
  const shift = rgb * dt;
  const filtro = (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <filter id={id} x="-2%" y="0" width="104%" height="100%">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={shift} result="r2" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-shift} result="b2" />
        <feBlend in="r2" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b2" mode="screen" />
      </filter>
    </svg>
  );
  const fx = shift > 0.3 ? `url(#${id})` : undefined;
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill style={{ filter: fx, transform: `translateX(${dt * -0.6}%)` }}>
        {filtro}
        {children}
      </AbsoluteFill>
    );
  }
  // Máscara: un SVG con los bloques ya revelados. El ruido es estático (no cambia con el tiempo) para que el patrón se lea.
  const rects: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const n = orden === "bayer" ? (BAYER4[(r % 4) * 4 + (c % 4)] + 0.5) / 16 : random(`${seed}-${r}-${c}`);
      const key = orden === "bayer" ? n : 0.55 * n + 0.45 * (c / Math.max(1, cols - 1));
      if (key < p * 1.02) rects.push(`<rect x='${c}' y='${r}' width='1.02' height='1.02'/>`);
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cols} ${rows}' preserveAspectRatio='none' shape-rendering='crispEdges'>${rects.join("")}</svg>`;
  const mask = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <AbsoluteFill
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        filter: fx,
        transform: `translateX(${dt * 0.6}%)`,
      }}
    >
      {filtro}
      {children}
    </AbsoluteFill>
  );
};

export const noiseBlocks = (props: NoiseBlockProps): TransitionPresentation<NoiseBlockProps> => ({ component: NoiseBlock, props });

/**
 * ClockWipe nativo de Remotion con timing en spring (kb/13 §2: nunca lineal). Devuelve presentación y timing
 * listos para `<TransitionSeries.Transition {...clockWipeSpring(w, h)} />`. 18–30 f.
 */
export const clockWipeSpring = (width: number, height: number, durationInFrames = 24) => ({
  presentation: clockWipe({ width, height }),
  timing: springTiming({ config: springs.critical, durationInFrames }),
});
