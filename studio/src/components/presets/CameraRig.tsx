import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { tween, wiggle } from "../../lib/motion";

type Props = {
  children: React.ReactNode;
  push?: number; // 0.03–0.08 = push-in de 3 a 8 %
  drift?: number; // px de deriva de mano
  seed?: string;
};

/**
 * Cámara viva: push-in lento con glide durante toda la escena y deriva de mano
 * con wiggle de 0.4 Hz. Evita el cuadro muerto (AI-08) sin marear.
 */
export const CameraRig: React.FC<Props> = ({ children, push = 0.05, drift = 6, seed = "cam" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const p = tween(frame, 0, durationInFrames, "glide");
  const x = wiggle(`${seed}-x`, frame, fps, 0.4, drift);
  const y = wiggle(`${seed}-y`, frame, fps, 0.35, drift * 0.7);
  const r = wiggle(`${seed}-r`, frame, fps, 0.25, 0.25);
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${1 + push * p}) rotate(${r}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};
