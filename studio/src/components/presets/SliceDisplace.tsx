import { useId } from "react";
import { random, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, durationForDistance, leave, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  /** Contenido a rebanar. Si no hay children, se usa `text` con la tipografía de la marca. */
  children?: React.ReactNode;
  text?: string;
  size?: number;
  /** Número de franjas. */
  slices?: number;
  /** "x": franjas horizontales que se corren en X. "y": columnas que se corren en Y. */
  axis?: "x" | "y";
  /** Desplazamiento máximo en px sobre 1080. */
  amount?: number;
  delay?: number;
  /** Cuadros que tarda cada franja en realinearse. */
  duration?: number;
  /** Fantasma en acento que va detrás de cada franja y se recoge al alinear. */
  ghost?: boolean;
  exitAt?: number;
  seed?: string;
  color?: string;
  accent?: string;
};

/**
 * Contenido cortado en franjas que se desplazan y vuelven a alinearse (kb/13, técnica SliceDisplace).
 * Se apilan N copias del contenido, cada una recortada con clip-path a su franja. Cada franja arranca
 * corrida (dirección alterna, magnitud con semilla) y se alinea con `arrive` (expo-out: el corte duro
 * llega rápido y frena justo en el registro). El orden de llegada sale del centro hacia los bordes con
 * stagger no lineal, no de arriba abajo. `ghost` deja un eco en acento más corrido que se recoge con la
 * franja. Salida: las franjas se vuelven a romper con `leave`. Sale de los pins
 * e1_AfqPShzjMr1GQfqsWgY3cPN1OjrcNjo1mevGoBxSvCxDrAYc3uM (ENERGY IN MOTION, franjas con corte duro),
 * e1_AfqPShzEgBVUWphmm0EXj9qLNxzjEOACuaeKUeaYNJFse8Dfzy9g (palabra rebanada con desfase lateral) y
 * e1_AfqPShxsS_uNTwSIywmqgbt6tDshBdnxCrVYRbhEobyiOUvP67oc (columnas con desfase vertical).
 */
export const SliceDisplace: React.FC<Props> = ({
  children,
  text = "",
  size = 210,
  slices = 7,
  axis = "x",
  amount = 160,
  delay = 0,
  duration = 22,
  ghost = true,
  exitAt,
  seed = "slice",
  color = marca.colores.texto,
  accent = marca.colores.acento,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const fid = `slice-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const content = children ?? (
    <div
      style={{
        fontFamily: marca.fuenteTitulo,
        fontWeight: 700,
        fontSize: size * u,
        lineHeight: 0.9,
        letterSpacing: "-0.045em",
        textTransform: "uppercase",
        whiteSpace: "pre",
        color,
      }}
    >
      {text}
    </div>
  );

  const mid = (slices - 1) / 2;
  const maxRank = Math.ceil(mid);
  const band = 100 / slices;
  const clip = (k: number) =>
    axis === "x"
      ? `inset(${k * band}% -60% ${100 - (k + 1) * band}% -60%)`
      : `inset(-60% ${100 - (k + 1) * band}% -60% ${k * band}%)`;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Silueta plana en acento para el fantasma: inunda el color y lo recorta con el alfa del contenido. */}
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id={fid} colorInterpolationFilters="sRGB">
          <feFlood floodColor={accent} />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      </svg>
      <div style={{ visibility: "hidden" }}>{content}</div>
      {Array.from({ length: slices }, (_, k) => {
        const rank = Math.round(Math.abs(k - mid));
        const start = delay + staggerDelay(rank, maxRank + 1, 10);
        const magN = amount * (0.35 + 0.65 * random(`${seed}-${k}`));
        // Cada franja tarda según lo que tiene que recorrer (durationForDistance, kb/02 §1).
        const durK = Math.max(6, Math.round((duration * durationForDistance(magN)) / durationForDistance(amount)));
        const p = arrive(frame, start, durK, "arrive");
        const out = exitAt === undefined ? 0 : leave(frame, exitAt + staggerDelay(maxRank - rank, maxRank + 1, 6), 12, "leave");
        const dir = k % 2 === 0 ? 1 : -1;
        const mag = magN * u;
        const off = dir * mag * (1 - p) - dir * mag * 1.4 * out;
        const move = (d: number) => (axis === "x" ? `translateX(${d}px)` : `translateY(${d}px)`);
        const vis = Math.min(1, p * 3) * (1 - out);
        return (
          <div key={k} style={{ position: "absolute", inset: 0, clipPath: clip(k) }}>
            {ghost ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: move(off * 1.35),
                  opacity: Math.min(1, Math.abs(off) / (12 * u)) * 0.9 * vis,
                  filter: `url(#${fid})`,
                }}
              >
                {content}
              </div>
            ) : null}
            <div style={{ position: "absolute", inset: 0, transform: move(off), opacity: vis }}>{content}</div>
          </div>
        );
      })}
    </div>
  );
};
