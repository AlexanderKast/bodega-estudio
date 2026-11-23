import { useId } from "react";
import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave, staggerDelay, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Direccion = "arriba" | "abajo" | "izquierda" | "derecha";

type Props = {
  lineas: string[];
  /** Unidad que entra: cada palabra o cada línea completa. */
  por?: "palabra" | "linea";
  /** Hacia dónde viaja el texto al entrar; el blur se estira en ese eje. */
  direccion?: Direccion;
  /** Recorrido de entrada en px sobre 1080. */
  distancia?: number;
  /** Blur direccional máximo (px sobre 1080) en el eje del movimiento. */
  blurMax?: number;
  delay?: number;
  /** Duración de cada entrada en cuadros. */
  dur?: number;
  /** Ventana total del stagger (no lineal) en cuadros. */
  stagger?: number;
  /** Cuadro de salida: el texto sigue viajando y se vuelve a desenfocar. */
  exitAt?: number;
  /** Línea que queda nítida; las demás conservan un blur que crece con la distancia (filas tipo keynote). */
  foco?: number;
  /** Blur residual por fila de distancia al foco, px sobre 1080. */
  residuo?: number;
  size?: number;
  peso?: number;
  color?: string;
  fuente?: string;
  alinear?: "izquierda" | "centro";
  /** Deriva lenta del bloque (evita el cuadro muerto, AI-08). */
  deriva?: boolean;
};

const vector = (d: Direccion): [number, number] =>
  d === "arriba" ? [0, -1] : d === "abajo" ? [0, 1] : d === "izquierda" ? [-1, 0] : [1, 0];

/**
 * Entrada por palabra (o línea) con blur direccional + desplazamiento que se enfoca al llegar.
 * Técnica: cada unidad tiene su propio filtro SVG feGaussianBlur con stdDeviation anisótropa
 * (fuerte en el eje del movimiento, casi nula en el otro): es motion blur real, no un blur
 * redondo. Llega con curva arrive (expo-out, 14 f): el blur cae más rápido que el recorrido
 * (potencia 1,6) y la opacidad termina al 60 %. Stagger no lineal (staggerDelay) por orden de
 * lectura. La salida es la inversa con leave: sigue viajando en la misma dirección, se
 * re-desenfoca y dura el 65 % de la entrada, con stagger más corto. Opcional `foco`: una fila
 * queda nítida y las demás se asientan con blur residual creciente (pin "filas con desenfoque
 * progresivo y una nítida").
 * Medido de: tiktok-7545813836503289144 (palabras con blur y subida corta, ease-out 12 f,
 * salida desenfoque + fundido) y pins "nuevo:BlurStack" del catálogo de Pinterest
 * (filas de palabra con desenfoque direccional; filas con desenfoque progresivo y una nítida;
 * líneas con blur escalonado; enfoque 40 px → nítido en 12 f).
 */
export const BlurStack: React.FC<Props> = ({
  lineas,
  por = "palabra",
  direccion = "arriba",
  distancia = 70,
  blurMax = 26,
  delay = 0,
  dur = 14,
  stagger = 16,
  exitAt,
  foco,
  residuo = 0,
  size = 120,
  peso = 700,
  color = marca.colores.texto,
  fuente = marca.fuenteTitulo,
  alinear = "izquierda",
  deriva = true,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const base = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [vx, vy] = vector(direccion);

  const unidades = lineas.map((l) => (por === "palabra" ? l.split(" ") : [l]));
  const n = unidades.reduce((a, ws) => a + ws.length, 0);
  const durSalida = Math.max(4, Math.round(dur * 0.65));
  const drift = deriva ? tween(frame, delay, 150, "glide") : 0;

  let k = -1;
  return (
    <div
      style={{
        fontFamily: fuente,
        fontWeight: peso,
        fontSize: size * u,
        lineHeight: 1.02,
        letterSpacing: "-0.035em",
        color,
        textAlign: alinear === "centro" ? "center" : "left",
        transform: `translate(${vx * drift * 10 * u}px, ${vy * drift * 10 * u}px)`,
      }}
    >
      {unidades.map((ws, li) => {
        const resto = foco === undefined ? 0 : Math.abs(li - foco) * residuo;
        return (
          <div key={li} style={{ whiteSpace: "nowrap" }}>
            {ws.map((w, wi) => {
              k += 1;
              const t0 = delay + staggerDelay(k, n, stagger);
              // Las últimas unidades viajan un poco más y tardan más (los primeros salen rápido, kb/02 §2).
              const durK = n <= 1 ? dur : Math.max(4, dur - 1 + Math.round((3 * k) / (n - 1)));
              const distK = distancia * (durK / dur);
              const p = arrive(frame, t0, durK, "arrive");
              const tOut = exitAt === undefined ? 0 : leave(frame, exitAt + staggerDelay(k, n, Math.round(stagger * 0.5)), durSalida);
              // El blur se va antes que el recorrido: el texto "se enfoca" mientras aún frena.
              const enfoque = Math.pow(1 - p, 1.6) + tOut;
              const mov = (1 - p) * -1 + tOut; // −1 = viene de atrás, +1 = se va hacia adelante
              const b = Math.min(1, enfoque) * blurMax * u;
              const bx = Math.abs(vx) * b + resto * u * (1 - tOut) + 0.08 * b;
              const by = Math.abs(vy) * b + resto * u * (1 - tOut) + 0.08 * b;
              const op = Math.min(1, p / 0.6) * (1 - tOut);
              return (
                <span key={wi}>
                  <FiltroDireccional id={`${base}b${k}`} x={bx} y={by} />
                  <span
                    style={{
                      display: "inline-block",
                      opacity: op,
                      transform: `translate(${vx * mov * distK * u}px, ${vy * mov * distK * u}px)`,
                      filter: bx + by > 0.05 ? `url(#${base}b${k})` : undefined,
                    }}
                  >
                    {w}
                  </span>
                  {wi < ws.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** Filtro SVG propio de cada unidad: el stdDeviation anisótropo se reescribe en cada cuadro. */
const FiltroDireccional: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <filter id={id} x="-40%" y="-60%" width="180%" height="220%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
      </filter>
    </defs>
  </svg>
);
