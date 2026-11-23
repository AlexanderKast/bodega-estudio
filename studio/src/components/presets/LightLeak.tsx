import { AbsoluteFill, useCurrentFrame } from "remotion";
import { arrive, leave, mix } from "../../lib/motion";

type Props = {
  /** Duración del destello en cuadros: 15–24 (kb/13 §2). Debe coincidir con el Overlay que lo contiene. */
  duration?: number;
  /** Tintas del destello, de la más intensa a la de borde. Por defecto, cálidos que no chocan con el lima. */
  tintas?: [string, string];
  /** Opacidad máxima: 0,6–0,8. */
  peak?: number;
  /** Lado por donde entra la luz. */
  from?: "left" | "right";
};

/**
 * Light leak (estilo 7 pictórico y 16 keynote, kb/13): la fuga de luz de película que tapa el corte entre
 * dos secuencias. Va dentro de `<TransitionSeries.Overlay durationInFrames={duration}>` o como capa suelta.
 * Dos manchas cálidas cruzan en diagonal con modo `screen`; sube rápido (35 % del tiempo) y se apaga
 * despacio. Hecho en casa: no agrega dependencias ni licencias nuevas.
 */
export const LightLeak: React.FC<Props> = ({ duration = 20, tintas = ["#FFB36B", "#E8572A"], peak = 0.7, from = "left" }) => {
  const frame = useCurrentFrame();
  const up = arrive(frame, 0, Math.round(duration * 0.35), "arriveGentle");
  const down = leave(frame, Math.round(duration * 0.35), duration - Math.round(duration * 0.35), "leaveSoft");
  const o = up * (1 - down) * peak;
  const t = frame / Math.max(1, duration);
  const dir = from === "left" ? 1 : -1;
  const x = 50 + dir * mix(t, -40, 35);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: o }}>
      <AbsoluteFill style={{ background: `radial-gradient(45% 70% at ${x}% ${mix(t, 30, 55)}%, ${tintas[0]} 0%, transparent 70%)` }} />
      <AbsoluteFill
        style={{ background: `radial-gradient(70% 90% at ${x + dir * 18}% ${mix(t, 70, 40)}%, ${tintas[1]} 0%, transparent 65%)`, opacity: 0.8 }}
      />
    </AbsoluteFill>
  );
};
