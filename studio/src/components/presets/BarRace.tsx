import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { mix, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

export type Corte = { at: number; label: string; valores: Record<string, number> };

type Props = {
  cortes: Corte[];
  /** La única serie con color (kb/13 estilo 11: una serie con color, el resto neutro). */
  destacar?: string;
  /** Cuadros de transición entre cortes: 18–30. Entre uno y otro, hold. */
  dur?: number;
  ancho?: number;
  alto?: number;
  unidad?: string;
  /** Máximo del eje. Por defecto, el mayor valor de todos los cortes (escala real, fija: no se reescala). */
  max?: number;
};

/**
 * Carrera de barras (estilo 11 data viz, kb/13). Los valores y las posiciones viajan juntos con curva move
 * entre cortes, así una barra que adelanta se ve pasar, no saltar. Eje con escala real y fija, números
 * tabulares, una sola serie en acento. La primera vez las barras crecen desde la base (1–2 s) y después
 * sostienen (2–3 s por corte en el storyboard).
 */
export const BarRace: React.FC<Props> = ({ cortes, destacar, dur = 24, ancho = 1300, alto = 560, unidad = "", max }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const nombres = Object.keys(cortes[0].valores);
  const tope = max ?? Math.max(...cortes.flatMap((c) => Object.values(c.valores)));
  const rango = (c: Corte) => {
    const orden = [...nombres].sort((a, b) => c.valores[b] - c.valores[a]);
    return Object.fromEntries(orden.map((n, i) => [n, i]));
  };
  // Estado: interpola entre cortes consecutivos.
  let val = { ...cortes[0].valores };
  let pos = rango(cortes[0]);
  let label = cortes[0].label;
  for (let i = 1; i < cortes.length; i++) {
    if (frame < cortes[i].at) break;
    const t = tween(frame, cortes[i].at, dur, "move");
    const r0 = rango(cortes[i - 1]);
    const r1 = rango(cortes[i]);
    val = Object.fromEntries(nombres.map((n) => [n, mix(t, cortes[i - 1].valores[n], cortes[i].valores[n])]));
    pos = Object.fromEntries(nombres.map((n) => [n, mix(t, r0[n], r1[n])]));
    if (t > 0.5) label = cortes[i].label;
  }
  // Construcción del dato (kb/13 estilo 11: 1–2 s), no una entrada: por eso tween y no arrive.
  const crecer = tween(frame, cortes[0].at, 36, "arriveSoft");
  const fila = alto / nombres.length;
  const etiqueta = 260;
  const barra = ancho - etiqueta - 180;
  return (
    <div style={{ position: "relative", width: ancho * u, height: (alto + 90) * u, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ position: "absolute", right: 0, top: -10 * u, fontFamily: marca.fuenteMono, fontSize: 64 * u, color: marca.colores.suave, fontWeight: 600 }}>
        {label}
      </div>
      {[0, 0.25, 0.5, 0.75, 1].map((k) => (
        <div key={k} style={{ position: "absolute", left: (etiqueta + barra * k) * u, top: 70 * u, height: alto * u, width: 1.5 * u, background: marca.colores.linea }}>
          <div style={{ position: "absolute", top: alto * u + 10 * u, transform: "translateX(-50%)", fontFamily: marca.fuenteMono, fontSize: 22 * u, color: marca.colores.suave }}>
            {Math.round(tope * k).toLocaleString("es-CO")}
          </div>
        </div>
      ))}
      {nombres.map((n) => {
        const on = n === destacar;
        const w = (val[n] / tope) * barra * crecer;
        return (
          <div key={n} style={{ position: "absolute", left: 0, top: (70 + pos[n] * fila) * u, height: fila * 0.72 * u, display: "flex", alignItems: "center" }}>
            <div style={{ width: (etiqueta - 24) * u, textAlign: "right", paddingRight: 24 * u, fontFamily: marca.fuenteTexto, fontWeight: 600, fontSize: 30 * u, color: on ? marca.colores.texto : marca.colores.suave }}>
              {n}
            </div>
            <div style={{ width: w * u, height: "100%", background: on ? marca.colores.acento : marca.colores.linea, borderRadius: `0 ${6 * u}px ${6 * u}px 0` }} />
            <div style={{ marginLeft: 16 * u, fontFamily: marca.fuenteMono, fontSize: 28 * u, color: on ? marca.colores.acento : marca.colores.suave, fontWeight: 600 }}>
              {Math.round(val[n] * crecer).toLocaleString("es-CO")}
              {unidad}
            </div>
          </div>
        );
      })}
    </div>
  );
};
