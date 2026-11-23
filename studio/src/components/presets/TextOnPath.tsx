import { useId } from "react";
import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave, mix, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  text: string;
  /** Curva SVG en coordenadas del `viewBox` (por defecto 1600 × 700). */
  path?: string;
  viewBox?: [number, number];
  /** Ancho del bloque en px sobre 1080 (el alto sale del viewBox). */
  width?: number;
  /** Cuerpo en unidades del viewBox. */
  size?: number;
  delay?: number;
  /** Recorrido del texto: startOffset (%) de partida y de llegada. */
  from?: number;
  to?: number;
  /** Cuadros que tarda el texto en llegar por la curva. */
  travel?: number;
  /** Deriva lenta después de llegar, en % del trazo (0 = quieto). */
  drift?: number;
  /** Trazo visible que se dibuja antes que el texto. */
  showPath?: boolean;
  /** Copias en contorno que siguen al texto con retraso (el "smear" de AE). 0–4. */
  echoes?: number;
  exitAt?: number;
  color?: string;
  pathColor?: string;
  echoColor?: string;
  font?: string;
  weight?: number;
};

/**
 * Texto que corre sobre una curva (kb/13, técnica TextOnPath). El trazo se dibuja primero con pathLength=1
 * (arriveSoft, 18 f) y el texto entra por la curva animando startOffset con `arriveSoft`: llega rápido y frena
 * en su sitio. Detrás van `echoes` copias en contorno, cada una 2 f más tarde y más tenue, que hacen de
 * CC Smear y se recogen solas cuando el texto se detiene. Salida: el texto sigue de largo con `leave` y el
 * trazo se borra. Sale de los pins e1_AfqPShxgj4upTIKY7gnBye6IPK9ZMUxQfpaUWNrfhuKje7Xl4hlK (texto sobre
 * curva con smear), e1_AfqPShxcTtDJ2_PTn50x-XMQPcIQ4P3h-ojTvVG8c1aALKyyEqxN (texto a lo largo de un tubo) y
 * e1_AfqPShwRBBNtkbe6oY5mnuIgq4ZuY-ZtbfufnPWdkSXPW7hZphCJug (copias con desfase).
 */
export const TextOnPath: React.FC<Props> = ({
  text,
  path = "M 40 560 C 380 120, 700 660, 1040 330 S 1440 90, 1570 170",
  viewBox = [1600, 700],
  width = 1500,
  size = 118,
  delay = 0,
  from = 100,
  to = 6,
  travel = 40,
  drift = 0,
  showPath = true,
  echoes = 3,
  exitAt,
  color = marca.colores.acento,
  pathColor = marca.colores.linea,
  echoColor = marca.colores.texto,
  font = marca.fuenteTitulo,
  weight = 700,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const id = `top-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [vw, vh] = viewBox;

  const draw = showPath ? arrive(frame, delay, 18, "arriveSoft") : 0;
  const textStart = delay + (showPath ? 8 : 0);
  const out = exitAt === undefined ? 0 : leave(frame, exitAt, 18, "leave");
  const undraw = exitAt === undefined ? 0 : leave(frame, exitAt + 6, 14, "leaveSoft");

  // Offset del texto en un cuadro dado: llegada con curva, deriva con glide y salida acelerando.
  const offsetAt = (f: number) => {
    const p = tween(f, textStart, travel, "arriveSoft");
    const d = drift === 0 ? 0 : tween(f, textStart + travel, 90, "glide") * drift;
    const o = exitAt === undefined ? 0 : leave(f, exitAt, 18, "leave");
    return mix(p, from, to) - d - o * (to + 110);
  };

  const label = (offset: number, key: string, style: React.SVGProps<SVGTextElement>) => (
    <text key={key} fontFamily={font} fontWeight={weight} fontSize={size} letterSpacing={-0.02 * size} {...style}>
      <textPath href={`#${id}`} startOffset={`${offset}%`}>
        {text}
      </textPath>
    </text>
  );

  const visible = Math.min(1, arrive(frame, textStart, 6, "arriveGentle") * 1.2) * (1 - out * 0.6);

  return (
    <svg width={width * u} height={(width * u * vh) / vw} viewBox={`0 0 ${vw} ${vh}`} style={{ overflow: "visible", display: "block" }}>
      <path
        id={id}
        d={path}
        pathLength={1}
        fill="none"
        stroke={pathColor}
        strokeWidth={showPath ? 3 : 0}
        strokeLinecap="round"
        strokeDasharray="1 1"
        strokeDashoffset={1 - draw + undraw}
      />
      {Array.from({ length: echoes }, (_, k) => {
        const lag = (k + 1) * 2;
        const gap = Math.abs(offsetAt(frame - lag) - offsetAt(frame));
        // La copia solo se ve mientras el texto corre: cuando se separa menos de 0,4 % desaparece.
        const alpha = Math.min(1, gap / 3) * (0.5 - k * 0.12);
        return label(offsetAt(frame - lag), `e${k}`, {
          fill: "none",
          stroke: echoColor,
          strokeWidth: 1.6,
          opacity: Math.max(0, alpha) * visible,
        });
      }).reverse()}
      {label(offsetAt(frame), "main", { fill: color, opacity: visible })}
    </svg>
  );
};
