import { useCurrentFrame } from "remotion";
import { arrive } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { marca } from "../../marca/marca";

export type LineaTerminal = { texto: string; tipo?: "comando" | "ok" | "info" | "final" };

type Props = {
  titulo: string;
  lineas: LineaTerminal[];
  delay?: number;
  ancho?: number; // u
};

/**
 * Terminal con la salida **real** de un comando del estudio (copiada tal cual, no inventada: AI-50/51).
 * Las líneas aparecen como en una consola: el comando se escribe, Enter, y cada línea de salida se imprime de golpe
 * cuando "termina" su paso. La espera sale del tiempo real que reporta la línea ("8.8 s"), comprimido en escala
 * logarítmica: los pasos lentos se sienten lentos sin frenar la pieza, y el ritmo nunca es de metrónomo (AI-11).
 * Es el único caso donde el efecto máquina de escribir es legítimo (AI-13).
 */
const espera = (l: LineaTerminal) => {
  if (!l.texto) return 1;
  const s = l.texto.match(/(\d+(?:\.\d+)?) s\b/);
  return s ? Math.round(2 + 6 * Math.log10(1 + Number(s[1]))) : l.tipo === "final" ? 9 : 3;
};

const agenda = (lineas: LineaTerminal[], delay: number) => {
  let t = delay;
  return lineas.map((l) => {
    if (l.tipo === "comando") {
      const dur = Math.max(6, Math.round(l.texto.length / 3));
      const ini = t;
      t = ini + dur + 7; // Enter y la pausa antes de que el proceso responda
      return { ini, dur };
    }
    t += espera(l);
    return { ini: t, dur: 0 };
  });
};
export const Terminal: React.FC<Props> = ({ titulo, lineas, delay = 0, ancho = 1500 }) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const C = marca.colores;
  const tiempos = agenda(lineas, delay);
  const color = (t?: LineaTerminal["tipo"]) =>
    t === "ok" ? "#D7E6C8" : t === "final" ? C.acento : t === "comando" ? C.texto : "#7E8A74";
  return (
    <div
      style={{
        width: ancho * u,
        borderRadius: 18 * u,
        background: "#0A0D08",
        border: `${1.5 * u}px solid #1E2618`,
        boxShadow: `0 ${50 * u}px ${120 * u}px rgba(0,0,0,0.65)`,
        fontFamily: marca.fuenteMono,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: `${16 * u}px ${26 * u}px`, borderBottom: `${1.5 * u}px solid #1A2115`, color: "#6E7A66", fontSize: 22 * u, letterSpacing: "0.04em" }}>
        {titulo}
      </div>
      <div style={{ padding: `${26 * u}px ${30 * u}px ${34 * u}px`, fontSize: 27 * u, lineHeight: 1.6 }}>
        {lineas.map((l, i) => {
          const { ini, dur } = tiempos[i];
          if (l.tipo === "comando") {
            const p = arrive(f, ini, dur, "arriveGentle");
            const n = Math.round(l.texto.length * p);
            return (
              <div key={i} style={{ color: color(l.tipo), whiteSpace: "pre" }}>
                <span style={{ color: C.acento }}>❯ </span>
                {l.texto.slice(0, n)}
                {p < 1 ? <span style={{ background: C.texto, color: "transparent" }}>_</span> : null}
              </div>
            );
          }
          // La consola imprime la línea entera en un cuadro: no hay animación que auditar.
          return (
            <div key={i} style={{ color: color(l.tipo), whiteSpace: "pre", opacity: f >= ini ? 1 : 0, fontWeight: l.tipo === "final" ? 600 : 400 }}>
              {l.texto || " "}
            </div>
          );
        })}
      </div>
    </div>
  );
};
