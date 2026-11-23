import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { mix, tween } from "../../lib/motion";

export type ParallaxLayer = { node: React.ReactNode; depth: number; blur?: number }; // depth 0 = fondo, 1 = cámara

type Props = { layers: ParallaxLayer[]; travel?: number; push?: number };

/**
 * Parallax 2.5D (kb/05): la cámara viaja `travel` px en X y empuja `push`; cada capa
 * se mueve en proporción a su profundidad. Las capas cercanas pueden llevar blur
 * de foco (DOF falso) para separar planos.
 */
export const Parallax: React.FC<Props> = ({ layers, travel = 160, push = 0.08 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = tween(frame, 0, durationInFrames, "glide");
  return (
    <AbsoluteFill>
      {layers.map((l, i) => {
        const x = mix(p, travel / 2, -travel / 2) * l.depth;
        const s = 1 + push * p * l.depth;
        return (
          <AbsoluteFill key={i} style={{ transform: `translateX(${x}px) scale(${s})`, filter: l.blur ? `blur(${l.blur}px)` : undefined }}>
            {l.node}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
