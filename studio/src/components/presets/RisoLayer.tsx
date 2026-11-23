import { useId } from "react";
import { AbsoluteFill, Freeze, random, useCurrentFrame } from "remotion";
import { posterizeTime, semilla } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  /** Dibuja el contenido de una tinta. Se llama una vez por tinta con su color. */
  render: (tinta: string, i: number) => React.ReactNode;
  /** 2–3 tintas riso. Por defecto, verde y negro de riso sobre papel crema. */
  tintas?: string[];
  papel?: string;
  /** Desfase máximo de registro en px (a 1080): 1–4 (kb/13 estilo 13). */
  registro?: number;
  /** Cuadros por dibujo: 3 f = 10 fps, el ritmo de impresión. 1 deja el movimiento a 30 fps. */
  cada?: number;
  /** Opacidad de la trama de papel y tinta irregular. */
  textura?: number;
};

/**
 * Risografía (estilo 13, kb/13). Cada tinta es una copia del contenido en un solo color, compuesta con
 * `multiply` sobre papel: donde se pisan, se mezclan como tinta real. El registro se desfasa 1–4 px y
 * cambia cada `cada` cuadros (desplazamiento de impresión, no temblor continuo), y el tiempo del
 * contenido también se posteriza a esa cadencia. Encima va una trama de papel con tinta irregular.
 */
export const RisoLayer: React.FC<Props> = ({
  render,
  tintas = ["#00A95C", "#1D1D1B"],
  papel = "#F2ECDF",
  registro = 3,
  cada = 3,
  textura = 0.35,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const s = semilla(frame, cada);
  const id = `riso${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <AbsoluteFill style={{ background: papel, overflow: "hidden" }}>
      <Freeze frame={posterizeTime(frame, cada)}>
        {tintas.map((t, i) => {
          // La primera tinta es la referencia; las demás se corren respecto de ella.
          const dx = i === 0 ? 0 : (random(`riso-x-${i}-${s}`) * 2 - 1) * registro * u;
          const dy = i === 0 ? 0 : (random(`riso-y-${i}-${s}`) * 2 - 1) * registro * u;
          return (
            <AbsoluteFill key={i} style={{ mixBlendMode: "multiply", transform: `translate(${dx}px, ${dy}px)` }}>
              {render(t, i)}
            </AbsoluteFill>
          );
        })}
      </Freeze>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: textura }}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9 / u} numOctaves={1} seed={s % 7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.41  0 0 0 0 0.35  0 0 0 -2.4 1.4" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};
