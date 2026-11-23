import { useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { mix, springPreset } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

export type Gota = {
  /** Posición de salida y de llegada, en px a 1080 dentro del lienzo del componente. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Radio en px a 1080: 40–120. */
  r: number;
  /** Cuadro en que arranca su viaje. */
  at: number;
  label?: string;
};

type Props = {
  gotas: Gota[];
  width?: number;
  height?: number;
  color?: string;
  /** Desenfoque del umbral en px a 1080: 8–14. Más alto, puentes más gruesos. */
  blur?: number;
};

/**
 * Metaballs (estilo 9, kb/13 §2): formas que se funden como líquido al acercarse. Desenfoque + umbral de
 * alfa (matriz 20/−9, el punto de partida canónico) sobre un solo grupo SVG, así todas las gotas comparten
 * el mismo SourceGraphic. Las posiciones viajan con spring heavy (estirón con peso). Las etiquetas van
 * encima sin filtro para quedar nítidas. Para explicar relaciones (dos ideas que se unen), en color plano.
 */
export const GooeyMerge: React.FC<Props> = ({ gotas, width = 1400, height = 700, color = marca.colores.acento, blur = 12 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const id = `goo${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pos = gotas.map((g) => {
    const s = springPreset(frame, fps, "heavy", g.at);
    return { x: mix(s, g.from.x, g.to.x), y: mix(s, g.from.y, g.to.y), r: g.r, label: g.label };
  });
  return (
    <div style={{ position: "relative", width: width * u, height: height * u }}>
      <svg width={width * u} height={height * u} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
        </filter>
        <g filter={`url(#${id})`} fill={color}>
          {pos.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} />
          ))}
        </g>
      </svg>
      {pos.map((p, i) =>
        p.label ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x * u,
              top: p.y * u,
              transform: "translate(-50%, -50%)",
              fontFamily: marca.fuenteTitulo,
              fontWeight: 700,
              fontSize: Math.max(26, p.r * 0.34) * u,
              color: marca.colores.fondo,
              whiteSpace: "nowrap",
              letterSpacing: "-0.02em",
            }}
          >
            {p.label}
          </div>
        ) : null,
      )}
    </div>
  );
};
