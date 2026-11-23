import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { springPreset } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

const COS30 = Math.cos(Math.PI / 6);

/** Proyección isométrica exacta (30°): unidades de mundo → px de pantalla. z sube. */
export const iso = (x: number, y: number, z: number, unidad = 1) => ({
  sx: (x - y) * COS30 * unidad,
  sy: ((x + y) * 0.5 - z) * unidad,
});

export type CajaIso = {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  /** "acento" pinta la pieza con el lima de la marca; el resto va en 3 tonos neutros. */
  tono?: "base" | "acento";
  label?: string;
};

type Props = {
  cajas: CajaIso[];
  /** px por unidad de mundo, a 1080. */
  unidad?: number;
  delay?: number;
  /** Cuadros entre piezas, en el orden del flujo (el orden del array): 3–6. */
  every?: number;
  /** Altura desde la que cae cada pieza, en unidades. */
  drop?: number;
};

// Tres tonos por cara (arriba, izquierda, derecha) + acento, kb/13 estilo 10.
const TONOS = {
  base: [marca.colores.linea, marca.colores.superficie, marca.colores.sombraCalida],
  acento: [marca.colores.acentoClaro, marca.colores.acento, marca.colores.acentoProfundo],
};

/**
 * Escena isométrica (estilo 10, kb/13). Cajas en 30° exactos con tres tonos por cara y un solo acento.
 * Cada pieza cae desde `drop` unidades con spring pop (asienta en 8–15 f con overshoot de 5–10 %), en
 * cascada siguiendo el orden del flujo que se explica, no todas a la vez. Pintado por profundidad
 * (x + y), así las piezas de adelante tapan a las de atrás. Para diagramas de proceso y sistemas.
 */
export const IsoScene: React.FC<Props> = ({ cajas, unidad = 60, delay = 0, every = 4, drop = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const un = unidad * u;
  const orden = cajas.map((c, i) => ({ c, i })).sort((a, b) => a.c.x + a.c.y + a.c.h * 0.01 - (b.c.x + b.c.y + b.c.h * 0.01));
  const pts = (arr: { sx: number; sy: number }[]) => arr.map((p) => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");
  // Encuadre: caja envolvente de la escena ya asentada, con 25 % de aire. La escena queda centrada sola.
  const esquinas = cajas.flatMap((c) =>
    [0, c.w].flatMap((dx) => [0, c.d].flatMap((dy) => [0, c.h].map((dz) => iso(c.x + dx, c.y + dy, dz, un)))),
  );
  const minX = Math.min(...esquinas.map((p) => p.sx));
  const maxX = Math.max(...esquinas.map((p) => p.sx));
  const minY = Math.min(...esquinas.map((p) => p.sy)) - drop * un;
  const maxY = Math.max(...esquinas.map((p) => p.sy));
  const aire = 0.25 * Math.max(maxX - minX, maxY - minY);
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${minX - aire} ${minY - aire} ${maxX - minX + 2 * aire} ${maxY - minY + 2 * aire}`}
      style={{ overflow: "visible" }}
    >
      {orden.map(({ c, i }) => {
        const s = springPreset(frame, fps, "pop", delay + i * every);
        const z0 = (1 - s) * drop;
        const [top, left, right] = TONOS[c.tono ?? "base"];
        const P = (x: number, y: number, z: number) => iso(x, y, z + z0, un);
        const { x, y, w, d, h } = c;
        const cima = [P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)];
        const izq = [P(x, y + d, h), P(x + w, y + d, h), P(x + w, y + d, 0), P(x, y + d, 0)];
        const der = [P(x + w, y, h), P(x + w, y + d, h), P(x + w, y + d, 0), P(x + w, y, 0)];
        const centro = P(x + w / 2, y + d / 2, h);
        return (
          <g key={i} opacity={Math.min(1, s * 3)}>
            <polygon points={pts(izq)} fill={left} />
            <polygon points={pts(der)} fill={right} />
            <polygon points={pts(cima)} fill={top} />
            {c.label && (
              <text
                x={centro.sx}
                y={centro.sy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily={marca.fuenteMono}
                fontSize={0.5 * un}
                fill={c.tono === "acento" ? marca.colores.fondo : marca.colores.texto}
                transform={`translate(${centro.sx} ${centro.sy}) matrix(${COS30} 0.5 ${-COS30} 0.5 0 0) translate(${-centro.sx} ${-centro.sy})`}
              >
                {c.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
