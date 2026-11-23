import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, mix, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

// Space Grotesk es variable (wght 300–700, OFL). Se cargan todos los pesos para que el eje viaje completo.
loadFont("normal", { weights: ["300", "400", "500", "600", "700"], subsets: ["latin"] });

type Props = {
  text: string;
  delay?: number;
  size?: number;
  /** Peso de partida y de llegada del eje wght. */
  from?: number;
  to?: number;
  /** Índice de letra desde donde sale la onda (por defecto, el centro de la palabra). */
  focus?: number;
  /** Cuadro en que la onda vuelve a pasar: aligera la palabra y regresa (acento de ritmo). */
  pulseAt?: number;
};

/**
 * Peso de fuente animado por letra (estilo 1, kb/13 §2). La onda sale del foco: las letras cercanas ganan
 * peso primero y las lejanas después, con stagger no lineal por distancia. El tracking se cierra a medida
 * que la palabra engorda, como en un cartel. `pulseAt` repite la onda hacia el peso ligero y vuelve.
 */
export const VariableAxisType: React.FC<Props> = ({ text, delay = 0, size = 170, from = 300, to = 700, focus, pulseAt }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const chars = [...text];
  const f = focus ?? (chars.length - 1) / 2;
  const maxDist = Math.max(f, chars.length - 1 - f, 1);
  const enter = arrive(frame, delay, 10, "arriveGentle");
  return (
    <div
      style={{
        fontFamily: marca.fuenteTitulo,
        fontSize: size * u,
        lineHeight: 1,
        whiteSpace: "pre",
        color: marca.colores.texto,
        opacity: enter,
        letterSpacing: `${mix(arrive(frame, delay, 22, "arriveSoft"), 0.02, -0.045)}em`,
      }}
    >
      {chars.map((c, i) => {
        const d = staggerDelay(Math.round(Math.abs(i - f)), Math.round(maxDist) + 1, 12);
        const up = arrive(frame, delay + d, 16, "arriveSoft");
        let w = mix(up, from, to);
        if (pulseAt !== undefined) {
          const dip = arrive(frame, pulseAt + d, 8, "move") - arrive(frame, pulseAt + 8 + d, 12, "move");
          w = mix(dip, w, from + (to - from) * 0.25);
        }
        return (
          <span key={i} style={{ fontVariationSettings: `"wght" ${Math.round(w)}` }}>
            {c}
          </span>
        );
      })}
    </div>
  );
};
