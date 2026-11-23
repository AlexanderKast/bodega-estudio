import { Img, Loop, OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import { springPreset } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  src: string; // staticFile(...) o URL. Video con alfa (ProRes 4444 / WebM VP9) o imagen PNG.
  kind?: "video" | "image";
  width?: number; // px en lienzo de 1080
  delay?: number;
  shadow?: boolean;
  loopFrames?: number; // si el render de Blender es más corto que la escena
};

/**
 * Capa 3D renderizada en Blender (servidor, Cycles GPU) y compuesta en Remotion.
 * Entra con spring heavy (objeto pesado) y apoya en una sombra de contacto,
 * para que no flote en el vacío (AI-31).
 */
export const BlenderLayer: React.FC<Props> = ({ src, kind = "video", width = 620, delay = 0, shadow = true, loopFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const s = springPreset(frame, fps, "heavy", delay);
  const w = width * u;
  return (
    <div style={{ position: "relative", width: w, transform: `translateY(${(1 - s) * 260 * u}px)`, opacity: Math.min(1, s * 2.5) }}>
      {shadow ? (
        <div
          style={{
            position: "absolute",
            left: "12%",
            right: "12%",
            bottom: -18 * u,
            height: 40 * u,
            borderRadius: "50%",
            background: "rgba(8,5,3,0.55)",
            filter: `blur(${22 * u}px)`,
            transform: `scaleX(${0.6 + 0.4 * s})`,
          }}
        />
      ) : null}
      {kind === "video" ? (
        loopFrames ? (
          <div style={{ position: "relative", width: w, aspectRatio: "9 / 16" }}>
            <Loop durationInFrames={loopFrames}>
              <OffthreadVideo src={src} transparent muted style={{ width: w }} />
            </Loop>
          </div>
        ) : (
          <OffthreadVideo src={src} transparent muted style={{ width: w, position: "relative" }} />
        )
      ) : (
        <Img src={src} style={{ width: w, position: "relative" }} />
      )}
    </div>
  );
};
