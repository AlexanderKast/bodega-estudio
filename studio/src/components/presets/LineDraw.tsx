import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive } from "../../lib/motion";

type Props = {
  d?: string; // path SVG en un viewBox de 1000×400
  delay?: number;
  duration?: number;
  color?: string;
  width?: number; // grosor del trazo
};

const DEFAULT_PATH = "M 40 300 C 220 80, 380 360, 560 190 S 860 60, 960 140";

/**
 * Trazo que se dibuja (Trim Paths de AE) con una cabeza que lo guía.
 * La cabeza adelanta al trazo 4 f y ambos frenan con arriveSoft.
 */
export const LineDraw: React.FC<Props> = ({ d = DEFAULT_PATH, delay = 0, duration = 34, color = marca.colores.acento, width = 10 }) => {
  const frame = useCurrentFrame();
  const p = arrive(frame, delay, duration, "arriveSoft");
  const head = arrive(frame, delay - 4, duration, "arriveSoft");
  const { strokeDasharray, strokeDashoffset } = evolvePath(p, d);
  const pt = getPointAtLength(d, head * getLength(d));
  return (
    <svg viewBox="0 0 1000 400" style={{ width: "100%", overflow: "visible" }}>
      <path d={d} fill="none" stroke={`${color}33`} strokeWidth={width} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
      <circle cx={pt?.x ?? 0} cy={pt?.y ?? 0} r={width * 1.6 * Math.min(1, head * 4)} fill={marca.colores.texto} />
    </svg>
  );
};
