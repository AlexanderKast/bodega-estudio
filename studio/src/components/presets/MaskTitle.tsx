import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  lines: string[];
  delay?: number;
  size?: number; // px en lienzo de 1080
  highlight?: string[];
  exitAt?: number; // frame de salida (opcional)
  color?: string;
};

/**
 * Titular que sube por línea desde detrás de una máscara (kb/03). Cada línea gira
 * 4° y se endereza al llegar: el "peso" que da AE con rotación + máscara.
 * Duración 20 f por línea (titular grande), stagger no lineal, salida al 70 %.
 */
export const MaskTitle: React.FC<Props> = ({
  lines,
  delay = 0,
  size = 132,
  highlight = [],
  exitAt,
  color = marca.colores.texto,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const dur = 20;
  return (
    <div
      style={{
        fontFamily: marca.fuenteTitulo,
        fontWeight: 800,
        fontSize: size * u,
        lineHeight: 0.98,
        letterSpacing: "-0.04em",
        color,
      }}
    >
      {lines.map((line, i) => {
        const start = delay + staggerDelay(i, lines.length, Math.min(14, lines.length * 4));
        const p = arrive(frame, start, dur, "arriveSoft");
        const out = exitAt === undefined ? 0 : leave(frame, exitAt + i * 2, Math.round(dur * 0.7));
        const y = (1 - p) * 112 - out * 112;
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
            <div
              style={{
                transform: `translateY(${y}%) rotate(${(1 - p) * 4}deg)`,
                transformOrigin: "0% 100%",
              }}
            >
              {line.split(" ").map((w, j) => (
                <span key={j} style={{ color: highlight.includes(w.replace(/[.,!?]/g, "")) ? marca.colores.acento : undefined }}>
                  {w}
                  {j < line.split(" ").length - 1 ? " " : ""}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
