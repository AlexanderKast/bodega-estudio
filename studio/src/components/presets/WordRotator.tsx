import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  prefix: string;
  words: string[];
  every?: number; // frames que dura cada palabra
  delay?: number;
  size?: number;
};

/**
 * "Hacemos [videos|marcas|ventas]": la palabra del slot sale hacia arriba con blur
 * (curva leave, 9 f) y la nueva entra desde abajo (arrive, 14 f). Todas las palabras
 * comparten celda en un inline-grid, así el ancho no salta.
 */
export const WordRotator: React.FC<Props> = ({ prefix, words, every = 36, delay = 0, size = 110 }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  return (
    <div
      style={{
        fontFamily: marca.fuenteTitulo,
        fontWeight: 700,
        fontSize: size * u,
        letterSpacing: "-0.035em",
        color: marca.colores.texto,
        lineHeight: 1.05,
      }}
    >
      <span>{prefix} </span>
      <span style={{ display: "inline-grid", verticalAlign: "bottom", overflow: "hidden", paddingBottom: "0.1em" }}>
        {words.map((w, i) => {
          const start = delay + i * every;
          const isLast = i === words.length - 1;
          const pin = i === 0 ? arrive(frame, delay, 16, "arriveSoft") : arrive(frame, start, 14);
          const pout = isLast ? 0 : leave(frame, start + every, 9);
          const y = (1 - pin) * 100 - pout * 100;
          return (
            <span
              key={w}
              style={{
                gridArea: "1 / 1",
                color: marca.colores.acento,
                transform: `translateY(${y}%)`,
                filter: `blur(${(1 - pin) * 6 + pout * 10}px)`,
                opacity: frame < start - 1 ? 0 : 1,
              }}
            >
              {w}
            </span>
          );
        })}
      </span>
    </div>
  );
};
