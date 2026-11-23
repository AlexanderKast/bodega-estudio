import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { springPreset, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = { text: string; delay?: number; size?: number; color?: string };

/**
 * Letra por letra con spring snappy (ζ 0.71: un toque de overshoot, no rebote de juguete).
 * Cada letra cae girando −8° y se asienta. Stagger total ≤ 18 f (kb/02 §2).
 */
export const CharCascade: React.FC<Props> = ({ text, delay = 0, size = 150, color = marca.colores.texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const chars = [...text];
  const total = Math.min(18, chars.length * 1.5);
  return (
    <div
      style={{
        fontFamily: marca.fuenteTitulo,
        fontWeight: 800,
        fontSize: size * u,
        letterSpacing: "-0.045em",
        color,
        whiteSpace: "pre",
        lineHeight: 1,
      }}
    >
      {chars.map((c, i) => {
        const s = springPreset(frame, fps, "snappy", delay + staggerDelay(i, chars.length, total));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: Math.min(1, s * 1.8),
              transform: `translateY(${(1 - s) * 0.55}em) rotate(${(1 - s) * -8}deg)`,
              transformOrigin: "50% 100%",
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};
