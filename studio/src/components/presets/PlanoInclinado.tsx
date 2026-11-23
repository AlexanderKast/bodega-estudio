import { AbsoluteFill, useCurrentFrame } from "remotion";
import { tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  children: React.ReactNode;
  rotX?: number; // inclinación hacia atrás, grados
  rotY?: number;
  rotZ?: number;
  escala?: number;
  deslizar?: number; // u que recorre la cámara sobre el plano en toda la escena
  foco?: [number, number]; // franja nítida: inicio y fin en % del alto del contenido
  desenfoque?: number; // px fuera de foco
  x?: number; // desplazamiento del plano en % del ancho
  y?: number;
};

/**
 * La interfaz como objeto físico (referencia Linear): el contenido va sobre un plano inclinado, con una franja de
 * foco nítida y el resto desenfocado, y la cámara se desliza despacio sobre él. El desenfoque se hace con dos copias
 * (una nítida enmascarada a la franja, otra desenfocada debajo) para que la franja siga al plano en 3D.
 */
export const PlanoInclinado: React.FC<Props> = ({
  children,
  rotX = 32,
  rotY = -16,
  rotZ = 10,
  escala = 1.15,
  deslizar = 120,
  foco = [30, 62],
  desenfoque = 9,
  x = 0,
  y = 0,
}) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const recorrido = tween(f, 0, 150, "glide");
  const mascara = `linear-gradient(to bottom, transparent ${foco[0] - 12}%, black ${foco[0]}%, black ${foco[1]}%, transparent ${foco[1] + 12}%)`;
  const plano: React.CSSProperties = {
    transform: `translate(${x}%, ${y}%) translateY(${-recorrido * deslizar * u}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${escala})`,
    transformStyle: "preserve-3d",
  };
  return (
    <AbsoluteFill style={{ perspective: 2000 * u, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", ...plano }}>
        <div style={{ filter: `blur(${desenfoque * u}px)`, opacity: 0.85 }}>{children}</div>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: mascara, maskImage: mascara }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};
