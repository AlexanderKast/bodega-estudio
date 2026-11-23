import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { springPreset } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  word: string;
  /** Copias apiladas, incluida la final. 4–6 funciona; más se vuelve textura. */
  copies?: number;
  delay?: number;
  size?: number;
  /** Cuadros entre copias: 2–3 f (kb/13 técnica StretchRepeater). */
  every?: number;
};

/**
 * Palabra repetida en columna (estilo 1, cinética suiza). Cada copia cae estirada en Y (scaleY 2,2) y se
 * asienta desde la base con spring snappy, en cascada de `every` cuadros. Las copias de arriba van en
 * contorno y se apagan hacia el tope; solo la última va llena y en acento: la repetición lleva la vista
 * a una sola palabra. Alineado a la izquierda, sobre retícula.
 */
export const StretchRepeater: React.FC<Props> = ({ word, copies = 5, delay = 0, size = 150, every = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  return (
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.8 }}>
      {Array.from({ length: copies }, (_, i) => {
        const last = i === copies - 1;
        const s = springPreset(frame, fps, "snappy", delay + i * every);
        const fade = 0.25 + 0.75 * (i / Math.max(1, copies - 1));
        return (
          <div
            key={i}
            style={{
              fontFamily: marca.fuenteTitulo,
              fontWeight: 700,
              fontSize: size * u,
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              color: last ? marca.colores.acento : "transparent",
              WebkitTextStroke: last ? undefined : `${1.6 * u}px ${marca.colores.texto}`,
              opacity: Math.min(1, s * 2) * (last ? 1 : fade),
              transform: `scaleY(${2.2 - 1.2 * s})`,
              transformOrigin: "0% 100%",
            }}
          >
            {word}
          </div>
        );
      })}
    </div>
  );
};
