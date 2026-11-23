import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, springPreset, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  /** Unidades en total (100 = "de cada 100"). */
  total?: number;
  /** Cuántas se encienden. */
  valor: number;
  cols?: number;
  /** Lado de cada unidad en px a 1080. */
  lado?: number;
  delay?: number;
  /** Cuadros que tarda en encenderse la última unidad: 30–60 (construir en 1–2 s). */
  build?: number;
  frase?: string;
};

/**
 * Grilla de unidades tipo isotipo (estilo 11 data viz, kb/13): "37 de cada 100" se ve como 37 cuadros
 * encendidos sobre 100. Primero aparece la grilla neutra entera (la base de comparación), después se
 * encienden las unidades en orden de lectura con stagger no lineal y spring pop; el número grande cuenta
 * al mismo ritmo, con cifras tabulares. Un dato por plano.
 */
export const UnitGrid: React.FC<Props> = ({ total = 100, valor, cols = 10, lado = 46, delay = 0, build = 45, frase }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const gap = lado * 0.28;
  const base = arrive(frame, delay, 12, "arriveGentle");
  const inicio = delay + 10;
  // Por filas: cada fila es una ráfaga de ≤ 5 f (0,4 f por unidad + 0–1 f de desfase), las filas arrancan con
  // stagger no lineal y la última espera 8 f más (acento). Contraste rápido/lento, no metrónomo (AI-11).
  const filas = Math.ceil(valor / cols);
  const inicioFila = (r: number) => staggerDelay(r, filas, build) + (r === filas - 1 && filas > 1 ? 8 : 0);
  const encendidas = Array.from(
    { length: valor },
    (_, i) => inicio + inicioFila(Math.floor(i / cols)) + Math.floor((i % cols) * 0.4 + random(`unit-${i}`)),
  );
  const cuenta = encendidas.filter((t) => frame >= t).length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 90 * u }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${lado * u}px)`, gap: gap * u, opacity: base }}>
        {Array.from({ length: total }, (_, i) => {
          const on = i < valor;
          const s = on ? springPreset(frame, fps, "pop", encendidas[i]) : 0;
          return (
            <div key={i} style={{ width: lado * u, height: lado * u, borderRadius: 6 * u, background: marca.colores.linea, position: "relative" }}>
              {on && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 6 * u,
                    background: marca.colores.acento,
                    opacity: Math.min(1, s * 2),
                    transform: `scale(${0.6 + 0.4 * s})`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div>
        <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 200 * u, lineHeight: 0.9, color: marca.colores.acento, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.04em" }}>
          {cuenta}
        </div>
        <div style={{ fontFamily: marca.fuenteTexto, fontSize: 38 * u, color: marca.colores.suave, marginTop: 16 * u, maxWidth: 560 * u, opacity: arrive(frame, inicio + build, 14, "arrive") }}>
          {frase ?? `de cada ${total}`}
        </div>
      </div>
    </div>
  );
};
