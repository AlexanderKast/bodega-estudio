import { useCurrentFrame, useVideoConfig } from "remotion";
import { arrive, curves, durationForDistance, enterStyle, leave, springPreset, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { marca } from "../../marca/marca";

/**
 * Cursor — flecha que recorre una lista de puntos como lo haría una mano.
 *
 * Técnica: cada tramo es una curva cuadrática (la mano nunca va en línea recta: se abomba hacia un lado),
 * recorrida con la curva `move` y una duración que sale de la distancia (`durationForDistance`, kb/02 §1).
 * `at` es el cuadro en que el cursor LLEGA al punto; el viaje arranca antes. Mientras viaja se inclina con la
 * velocidad y deja dos fantasmas de estela si va rápido (AI-09). El clic hace squash de 3 f, se suelta con
 * `springs.pop` y deja dos ondas que se expanden con curvas distintas. La etiqueta sigue al cursor con 3 f de
 * retraso (follow-through) y cambia de texto con una entrada corta.
 *
 * Origen: DryieyoUmLc (cursor ease-in-out con arco, 24 f), tiktok-7698861538307788033 (cursor ~12 f entre
 * objetivos, press de 3 f), tiktok-7697333991984221462 y tiktok-7701672067120368948 (cursor de UI, aeEasy 10 f;
 * receta "nuevo:CursorClick").
 */

export type PuntoCursor = {
  x: number; // u, en el lienzo de 1080 de lado corto
  y: number;
  at: number; // cuadro en que llega
  clic?: boolean;
  etiqueta?: string; // reemplaza el texto del chip desde que llega a este punto
  arco?: number; // curvatura de este tramo (fracción de la distancia; negativo = hacia el otro lado)
};

type Props = {
  puntos: PuntoCursor[];
  tamano?: number; // alto de la flecha, u
  arco?: number; // curvatura por defecto de los tramos
  salida?: number; // cuadro en que el cursor se va
  etiqueta?: string; // texto inicial del chip que lo acompaña
  colorFlecha?: string;
  colorBorde?: string;
  colorOnda?: string;
  colorEtiqueta?: string;
  colorTextoEtiqueta?: string;
};

type Tramo = { ini: number; dur: number; a: PuntoCursor; b: PuntoCursor; cx: number; cy: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const planear = (puntos: PuntoCursor[], arcoBase: number): Tramo[] =>
  puntos.slice(1).map((b, i) => {
    const a = puntos[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ideal = durationForDistance(dist);
    const minIni = a.at + (a.clic ? 6 : 2); // tras un clic la mano espera a soltar
    const ini = Math.max(minIni, b.at - ideal);
    const k = b.arco ?? arcoBase;
    // Control a mitad de tramo, desplazado en perpendicular: la trayectoria se abomba.
    return { ini, dur: Math.max(3, b.at - ini), a, b, cx: (a.x + b.x) / 2 - (dy / dist) * dist * k, cy: (a.y + b.y) / 2 + (dx / dist) * dist * k };
  });

const bezier = (t: Tramo, p: number) => {
  const q = 1 - p;
  return { x: q * q * t.a.x + 2 * q * p * t.cx + p * p * t.b.x, y: q * q * t.a.y + 2 * q * p * t.cy + p * p * t.b.y };
};

/** Posición en un cuadro. Con `auditar` pasa por tween() (lo ve el motion-audit); sin él es puro (estela, velocidad). */
const posicion = (tramos: Tramo[], puntos: PuntoCursor[], fr: number, auditar: boolean) => {
  let pos = { x: puntos[0].x, y: puntos[0].y };
  for (const t of tramos) {
    const p = auditar ? tween(fr, t.ini, t.dur, "move") : curves.move(clamp01((fr - t.ini) / t.dur));
    if (fr >= t.ini) pos = bezier(t, p);
  }
  return pos;
};

export const Cursor: React.FC<Props> = ({
  puntos,
  tamano = 38,
  arco = 0.16,
  salida,
  etiqueta,
  colorFlecha = marca.colores.texto,
  colorBorde = marca.colores.fondo,
  colorOnda = marca.colores.acento,
  colorEtiqueta = marca.colores.acento,
  colorTextoEtiqueta = marca.colores.fondo,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  if (puntos.length === 0) return null;

  const tramos = planear(puntos, arco);
  const pos = posicion(tramos, puntos, f, true);
  const prev = posicion(tramos, puntos, f - 1, false);
  const vx = pos.x - prev.x;
  const vy = pos.y - prev.y;
  const rapidez = Math.hypot(vx, vy);

  // Entrada y salida: aparece en su primer punto, nunca escala desde 0.
  const entra = arrive(f, puntos[0].at, 8, "arriveGentle");
  const sale = salida !== undefined ? leave(f, salida, 6) : 0;
  const opacidad = Math.min(1, entra / 0.6) * (1 - sale);
  if (opacidad <= 0) return null;

  // Clic: squash de 3 f y suelta con pop (el rebote del pop sobrepasa un poco el tamaño: se siente la mano).
  const clics = puntos.filter((p) => p.clic);
  let squash = 0;
  for (const c of clics) {
    const aprieta = arrive(f, c.at, 3, "arriveGentle");
    const suelta = springPreset(f, fps, "pop", c.at + 3);
    squash += aprieta * (1 - suelta);
  }
  const inclinacion = Math.max(-10, Math.min(10, vx * 0.35)) + (1 - entra) * -8;
  const escala = 0.9 + 0.1 * entra;

  // Etiqueta: el último texto definido hasta este cuadro.
  let texto = etiqueta;
  let cambio = puntos[0].at + 4;
  for (const p of puntos) {
    if (p.etiqueta !== undefined && f >= p.at) {
      texto = p.etiqueta;
      cambio = p.at;
    }
  }
  const lag = posicion(tramos, puntos, f - 3, false);
  const entraTexto = arrive(f, cambio, 9, "arrive");

  const flecha = (x: number, y: number, alpha: number, key: string, rot = inclinacion) => (
    <svg
      key={key}
      width={(tamano * 22) / 30 * u}
      height={tamano * u}
      viewBox="0 0 22 30"
      style={{
        position: "absolute",
        left: x * u,
        top: y * u,
        overflow: "visible",
        opacity: alpha,
        transformOrigin: "0 0",
        transform: `translate(${(-2 / 30) * tamano * u}px, ${(-1.5 / 30) * tamano * u}px) rotate(${rot}deg) scale(${escala * (1 - 0.1 * squash)}, ${escala * (1 - 0.2 * squash)})`,
        filter: `drop-shadow(0 ${3 * u}px ${5 * u}px rgba(4,6,3,0.45))`,
      }}
    >
      <path
        d="M2 1.5 L2 24.5 L7.6 19.2 L11.4 27.6 L15.2 26 L11.5 17.8 L19 17.6 Z"
        fill={colorFlecha}
        stroke={colorBorde}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );

  const estela = rapidez > 16 ? [1, 2].map((k) => ({ k, p: posicion(tramos, puntos, f - k, false) })) : [];

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: opacidad }}>
      {clics.map((c, i) => {
        if (f < c.at || f > c.at + 28) return null;
        const r1 = arrive(f, c.at + 1, 20, "arrive");
        const r2 = arrive(f, c.at + 4, 16, "arriveSoft");
        return (
          <div key={`onda-${i}`}>
            <div
              style={{
                position: "absolute",
                left: c.x * u,
                top: c.y * u,
                width: (16 + 120 * r1) * u,
                height: (16 + 120 * r1) * u,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `${(3.5 * (1 - r1) + 0.5) * u}px solid ${colorOnda}`,
                opacity: (1 - r1) * 0.9,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: c.x * u,
                top: c.y * u,
                width: (10 + 70 * r2) * u,
                height: (10 + 70 * r2) * u,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: colorOnda,
                opacity: 0.22 * (1 - r2),
              }}
            />
          </div>
        );
      })}

      {texto ? (
        <div
          style={{
            position: "absolute",
            left: (lag.x + tamano * 0.55) * u,
            top: (lag.y + tamano * 0.95) * u,
            padding: `${8 * u}px ${16 * u}px`,
            borderRadius: 10 * u,
            background: colorEtiqueta,
            color: colorTextoEtiqueta,
            fontFamily: marca.fuenteTexto,
            fontWeight: 600,
            fontSize: 22 * u,
            whiteSpace: "nowrap",
            overflow: "hidden",
            boxShadow: `0 ${8 * u}px ${18 * u}px rgba(4,6,3,0.4)`,
          }}
        >
          <div key={texto} style={enterStyle(entraTexto, 12 * u)}>
            {texto}
          </div>
        </div>
      ) : null}

      {estela.map(({ k, p }) => flecha(p.x, p.y, k === 1 ? 0.28 : 0.12, `estela-${k}`))}
      {flecha(pos.x, pos.y, 1, "flecha")}
    </div>
  );
};
