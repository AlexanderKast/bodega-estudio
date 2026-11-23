import { interpolateColors, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  before: string;
  mark: string;
  after?: string;
  delay?: number; // cuándo pasa el marcador
  size?: number;
};

/**
 * Marcador que barre la frase clave de izquierda a derecha (12 f, arrive) con un skew
 * leve, como trazo de rotulador. El texto marcado cambia a color de fondo cuando el
 * marcador lo cubre, para que se lea siempre.
 */
export const MarkerHighlight: React.FC<Props> = ({ before, mark, after = "", delay = 10, size = 84 }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const p = arrive(frame, delay, 12);
  const textIn = arrive(frame, 0, 16, "arriveGentle");
  return (
    <div
      style={{
        fontFamily: marca.fuenteTitulo,
        fontWeight: 700,
        fontSize: size * u,
        lineHeight: 1.15,
        letterSpacing: "-0.03em",
        color: marca.colores.texto,
        maxWidth: 1400 * u,
        opacity: Math.min(1, textIn / 0.6),
        transform: `translateY(${(1 - textIn) * 20 * u}px)`,
      }}
    >
      {before}{" "}
      <span style={{ position: "relative", whiteSpace: "nowrap" }}>
        <span
          style={{
            position: "absolute",
            inset: "8% -0.12em 2% -0.12em",
            background: marca.colores.acento,
            transform: `scaleX(${p}) skewX(-8deg)`,
            transformOrigin: "0% 50%",
            borderRadius: 3,
          }}
        />
        <span style={{ position: "relative", color: interpolateColors(p, [0.3, 0.7], [marca.colores.texto, marca.colores.fondo]) }}>
          {mark}
        </span>
      </span>{" "}
      {after}
    </div>
  );
};
