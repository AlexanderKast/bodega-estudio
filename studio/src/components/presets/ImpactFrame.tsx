import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { inertialBounce, wiggle } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { SpeedLines } from "./SpeedLines";

type Props = {
  children: React.ReactNode;
  /** Cuadro del golpe. */
  at: number;
  /** Cuadros del flash invertido a dos tintas: 1–2 (kb/13 estilo 8). */
  flash?: number;
  /** Cuadros de temblor después del golpe: 4–8, amortiguado. */
  shake?: number;
  /** Amplitud del temblor en px a 1080. */
  fuerza?: number;
  /** Líneas de foco durante el golpe. */
  lineas?: boolean;
  fx?: number;
  fy?: number;
};

/**
 * Impact frame de anime (estilo 8, kb/13): en el cuadro del golpe la imagen pasa 1–2 f a dos tintas
 * invertidas (alto contraste, sin color), con líneas de foco; después tiembla 4–8 f amortiguado y el
 * plano sostiene. Ritmo hold → acción 3–4 f → hold. No va en cada corte: es el acento de una pieza.
 */
export const ImpactFrame: React.FC<Props> = ({ children, at, flash = 2, shake = 6, fuerza = 18, lineas = true, fx = 0.5, fy = 0.5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const enFlash = frame >= at && frame < at + flash;
  const t = frame - (at + flash);
  const temblando = t >= 0 && t < shake;
  // Temblor: wiggle rápido multiplicado por una envolvente que se apaga (inertialBounce normalizado).
  const env = temblando ? Math.abs(inertialBounce(t + 1, fps, 1, 3, 9)) + (1 - t / shake) * 0.6 : 0;
  const dx = env * wiggle("impact-x", frame, fps, 14, fuerza * u);
  const dy = env * wiggle("impact-y", frame, fps, 14, fuerza * 0.7 * u);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${temblando || enFlash ? 1.03 : 1})`,
          filter: enFlash ? "grayscale(1) invert(1) contrast(3.2) brightness(1.1)" : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
      {lineas && <SpeedLines at={at} dur={flash + shake} fx={fx} fy={fy} color={enFlash ? marca.colores.fondo : marca.colores.texto} />}
    </AbsoluteFill>
  );
};
