import { getLength, getPointAtLength } from "@remotion/paths";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { inertialBounce, mix, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Pt = [number, number];

const muestrear = (d: string, n: number): Pt[] => {
  const len = getLength(d);
  return Array.from({ length: n }, (_, i) => {
    const p = getPointAtLength(d, (len * i) / n);
    return [p?.x ?? 0, p?.y ?? 0];
  });
};

/** Rota y, si hace falta, invierte la lista B para que cada punto viaje la menor distancia posible hasta A. */
const alinear = (a: Pt[], b: Pt[]): Pt[] => {
  const n = a.length;
  let mejor = b;
  let costo = Infinity;
  for (const cand of [b, [...b].reverse()]) {
    for (let k = 0; k < n; k += 2) {
      let c = 0;
      for (let i = 0; i < n; i += 4) {
        const q = cand[(i + k) % n];
        c += (a[i][0] - q[0]) ** 2 + (a[i][1] - q[1]) ** 2;
      }
      if (c < costo) {
        costo = c;
        mejor = cand.map((_, i) => cand[(i + k) % n]);
      }
    }
  }
  return mejor;
};

type Props = {
  /** Trazados cerrados de un solo contorno, en el mismo viewBox. Formas con significado, no blobs. */
  shapes: string[];
  viewBox?: string;
  delay?: number;
  /** Cuadros del morph: 15–27 (0,5–0,9 s, kb/13 §2). */
  dur?: number;
  /** Cuadros de hold en cada forma: ≥ 9 (0,3 s). */
  hold?: number;
  size?: number;
  color?: string;
  /** Giro durante el morph, en grados: 5–15 da peso. */
  turn?: number;
  /** Puntos de muestreo: 120–200. */
  points?: number;
};

/**
 * Morph de trazados (estilo 9 liquid & morph, kb/13 §2). Cada forma se muestrea en el mismo número de
 * puntos con @remotion/paths y se alinea con la siguiente (rotación del índice y sentido) para que el morph
 * no se cruce sobre sí mismo. Curva move (ease in-out fuerte), un giro de 5–15° durante el viaje y un
 * rebote inercial de escala al llegar. Sin dependencias: reemplaza a flubber para contornos simples.
 */
export const ShapeMorph: React.FC<Props> = ({
  shapes,
  viewBox = "0 0 100 100",
  delay = 0,
  dur = 21,
  hold = 18,
  size = 420,
  color = marca.colores.acento,
  turn = 10,
  points = 160,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const formas = useMemo(() => {
    const out: Pt[][] = [muestrear(shapes[0], points)];
    for (let i = 1; i < shapes.length; i++) out.push(alinear(out[i - 1], muestrear(shapes[i], points)));
    return out;
  }, [shapes, points]);

  let pts = formas[0];
  let giro = 0;
  let escala = 1;
  for (let i = 1; i < formas.length; i++) {
    const start = delay + hold + (i - 1) * (dur + hold);
    if (frame < start) break;
    const t = tween(frame, start, dur, "move");
    const prev = pts;
    pts = prev.map((p, k) => [mix(t, p[0], formas[i][k][0]), mix(t, p[1], formas[i][k][1])]);
    giro = Math.sin(t * Math.PI) * turn;
    escala = 1 + inertialBounce(frame - (start + dur), fps, 0.05, 2.4, 7);
  }
  const d = `M ${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L ")} Z`;
  return (
    <svg width={size * u} height={size * u} viewBox={viewBox} style={{ overflow: "visible", transform: `rotate(${giro}deg) scale(${escala})` }}>
      <path d={d} fill={color} />
    </svg>
  );
};
