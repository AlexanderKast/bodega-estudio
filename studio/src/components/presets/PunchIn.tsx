import { AbsoluteFill, useCurrentFrame } from "remotion";
import { mix, tween } from "../../lib/motion";

export type Punch = {
  /** Cuadro del golpe (normalmente un corte o una palabra clave). */
  at: number;
  /** Escala después del golpe: 1 vuelve al plano abierto; 1,10–1,20 es el punch-in del género. */
  scale: number;
  /** Punto hacia el que se acerca, en 0–1 (por defecto la cara, un poco arriba del centro). */
  ox?: number;
  oy?: number;
  /** Cuadros del acercamiento: 0 = corte seco (lo normal), 3–4 = zoom rápido con snap. */
  dur?: number;
};

type Props = { punches: Punch[]; children: React.ReactNode };

/**
 * Punch-in por evento (estilo 3 retención, kb/13): el plano salta de escala 10–20 % en cada golpe para
 * fingir un corte de cámara sobre una sola toma. Por defecto es corte seco; con `dur` hace un zoom rápido
 * con curva snap. Entre golpes el encuadre se sostiene: no hay zoom lento continuo (eso es CameraRig).
 */
export const PunchIn: React.FC<Props> = ({ punches, children }) => {
  const frame = useCurrentFrame();
  const sorted = [...punches].sort((a, b) => a.at - b.at);
  let scale = 1;
  let ox = 0.5;
  let oy = 0.42;
  sorted.forEach((p) => {
    if (frame < p.at) return;
    const dur = p.dur ?? 0;
    const t = dur > 0 ? tween(frame, p.at, dur, "snap") : 1;
    scale = mix(t, scale, p.scale);
    ox = mix(t, ox, p.ox ?? 0.5);
    oy = mix(t, oy, p.oy ?? 0.42);
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${ox * 100}% ${oy * 100}%` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
