import { Lottie, type LottieAnimationData } from "@remotion/lottie";
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

type Props = { src: string; width?: number; loop?: boolean; playbackRate?: number };

/**
 * Puente con After Effects: una animación exportada con Bodymovin (JSON Lottie)
 * se reproduce cuadro a cuadro dentro de la composición. Ver kb/08-after-effects.md.
 */
export const LottieLayer: React.FC<Props> = ({ src, width = 400, loop = false, playbackRate = 1 }) => {
  const [handle] = useState(() => delayRender(`Cargando Lottie ${src}`));
  const [data, setData] = useState<LottieAnimationData | null>(null);
  useEffect(() => {
    fetch(src)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, src]);
  if (!data) return null;
  return (
    <div style={{ width }}>
      <Lottie animationData={data} loop={loop} playbackRate={playbackRate} />
    </div>
  );
};
