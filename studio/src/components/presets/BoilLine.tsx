import { useId } from "react";
import { useCurrentFrame } from "remotion";
import { semilla } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  children: React.ReactNode;
  /** Desplazamiento máximo en px (a 1080). 2–4 hierve; más de 6 se vuelve agua. */
  amount?: number;
  /** Cuadros que dura cada "dibujo": 2 f = 15 fps, 3 f = 10 fps (kb/13 estilo 6). */
  every?: number;
  /** Cuántos dibujos distintos alterna. El line boil clásico usa 2–3. */
  versions?: number;
  /** Frecuencia del ruido a 1080: más alta, temblor más fino. */
  frequency?: number;
  style?: React.CSSProperties;
};

/**
 * Line boil (estilo 6 cel/doodle y 5 collage, kb/13 §2): el trazo o el texto "hierve" como animación
 * dibujada a mano. feTurbulence + feDisplacementMap con una semilla que cambia cada `every` cuadros y
 * recorre solo `versions` dibujos: tiembla con ritmo de cel, no con el ruido continuo de un filtro.
 * Envuelve cualquier cosa: el SVG de LineDraw, texto o una ilustración.
 */
export const BoilLine: React.FC<Props> = ({ children, amount = 3, every = 3, versions = 3, frequency = 0.022, style }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const id = `boil${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const s = semilla(frame, every, versions);
  return (
    <div style={{ position: "relative", ...style }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={frequency / u} numOctaves={2} seed={s * 17 + 3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={amount * 2 * u} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div style={{ filter: `url(#${id})` }}>{children}</div>
    </div>
  );
};
