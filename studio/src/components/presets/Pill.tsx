import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, byDistance, leave, springPreset, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

export type PillItem = {
  texto: string;
  /** Emoji o glifo corto (≤ 2 caracteres). */
  icono?: string;
  numero?: number | string;
  /** Posición del centro de la pill dentro del cluster, en px sobre 1080. Sin x/y se reparte en abanico. */
  x?: number;
  y?: number;
};

type Tono = "claro" | "acento" | "oscuro";

type Props = {
  /**
   * "top": etiqueta fija arriba al centro (TopPill), dentro de la zona segura.
   * "paso": paso numerado (número en círculo + etiqueta), alineado a la izquierda.
   * "cluster": varias pills que salen desde un punto y se reparten con stagger por distancia.
   */
  variante?: "top" | "paso" | "cluster";
  texto?: string;
  icono?: string;
  numero?: number | string;
  /** Solo cluster. */
  items?: PillItem[];
  /** Origen del cluster (px sobre 1080, relativo a la caja). Por defecto el centro. */
  origen?: { x: number; y: number };
  /** Caja del cluster en px sobre 1080. */
  ancho?: number;
  alto?: number;
  delay?: number;
  exitAt?: number;
  size?: number;
  tono?: Tono;
  colorAcento?: string;
  colorClaro?: string;
  colorOscuro?: string;
};

const fmtNumero = (n: number | string) => (typeof n === "number" && n < 10 ? `0${n}` : `${n}`);

/**
 * Pills y callouts. Técnica: la cápsula se abre desde su icono (clip-path de izquierda a derecha,
 * arrive 12 f) mientras el icono o número hace pop (springs.pop, desde 0,6); el texto entra 4 f
 * después con micro-subida. En el cluster cada pill vuela desde el origen a su sitio con
 * springs.snappy, ordenadas por distancia al origen y con stagger no lineal (las cercanas primero).
 * Salidas con leave en 60–70 % del tiempo de entrada, en orden inverso.
 * Medido de: tiktok-7698456660611796231 (píldora fija al 16 % de alto, sans semibold), tiktok-7701672067120368948
 * (píldoras blancas y chips de paso naranja), tiktok-7698861538307788033 (PASO 01, HISTORIA / PÚBLICO /
 * OBJETIVO alrededor de un icono, golpe de 5 f), tiktok-7702620779518643478 (chips con pop de 8 f) y
 * zlOCQxQYnYc (pill "Comment" con spring de rebote leve).
 * La TopPill va centrada a propósito (así se lee como etiqueta de formato); paso y cluster no.
 */
export const Pill: React.FC<Props> = ({
  variante = "paso",
  texto = "",
  icono,
  numero,
  items = [],
  origen,
  ancho = 900,
  alto = 520,
  delay = 0,
  exitAt,
  size = 40,
  tono,
  colorAcento = marca.colores.acento,
  colorClaro = marca.colores.texto,
  colorOscuro = marca.colores.superficie,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, zona } = useEscala();

  const paleta = (t: Tono) =>
    t === "claro"
      ? { bg: colorClaro, fg: marca.colores.fondo, badge: colorAcento, badgeFg: marca.colores.fondo, borde: "transparent" }
      : t === "acento"
        ? { bg: colorAcento, fg: marca.colores.fondo, badge: marca.colores.fondo, badgeFg: colorAcento, borde: "transparent" }
        : { bg: colorOscuro, fg: colorClaro, badge: colorAcento, badgeFg: marca.colores.fondo, borde: marca.colores.linea };

  /** Una cápsula. `t0` = cuadro de entrada; `abre` permite desactivar el clip (cluster ya viaja). */
  const capsula = (it: PillItem, t0: number, t: Tono, s: number, out: number, abre = true) => {
    const c = paleta(t);
    const ancla = it.numero !== undefined ? fmtNumero(it.numero) : it.icono;
    const abrir = abre ? arrive(frame, t0, 12, "arrive") : 1;
    const pop = springPreset(frame, fps, "pop", t0 + 1);
    const txt = arrive(frame, t0 + 4, 10, "arriveGentle");
    const d = s * 1.55; // alto de la cápsula
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4 * s,
          height: d,
          padding: ancla ? `0 ${0.62 * s}px 0 ${0.16 * s}px` : `0 ${0.62 * s}px`,
          borderRadius: d,
          background: c.bg,
          boxShadow: `inset 0 0 0 ${1.5 * u}px ${c.borde}, 0 ${10 * u}px ${24 * u}px ${marca.colores.sombraCalida}88`,
          clipPath: `inset(0 ${(1 - abrir) * 100}% 0 0 round ${d}px)`,
          opacity: 1 - out,
          transform: `translateY(${-out * 14 * u}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {ancla && (
          <span
            style={{
              width: d - 0.32 * s,
              height: d - 0.32 * s,
              borderRadius: "50%",
              background: c.badge,
              color: c.badgeFg,
              display: "grid",
              placeItems: "center",
              fontFamily: it.numero !== undefined ? marca.fuenteMono : marca.fuenteTexto,
              fontWeight: 600,
              fontSize: (it.numero !== undefined ? 0.62 : 0.7) * s,
              transform: `scale(${0.6 + 0.4 * pop})`,
              flexShrink: 0,
            }}
          >
            {ancla}
          </span>
        )}
        <span
          style={{
            fontFamily: marca.fuenteTexto,
            fontWeight: 600,
            fontSize: s,
            letterSpacing: "-0.01em",
            color: c.fg,
            opacity: Math.min(1, txt / 0.6),
            transform: `translateY(${(1 - txt) * 8 * u}px)`,
            display: "inline-block",
          }}
        >
          {it.texto}
        </span>
      </div>
    );
  };

  if (variante === "top") {
    const s = size * 0.8 * u;
    const out = exitAt === undefined ? 0 : leave(frame, exitAt, 8);
    const baja = arrive(frame, delay, 14, "arriveSoft");
    return (
      <div
        style={{
          position: "absolute",
          top: zona.arriba,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(${(1 - baja) * -18 * u}px)`,
        }}
      >
        {capsula({ texto, icono, numero }, delay, tono ?? "claro", s, out)}
      </div>
    );
  }

  if (variante === "paso") {
    const s = size * u;
    const out = exitAt === undefined ? 0 : leave(frame, exitAt, 9);
    const entra = arrive(frame, delay, 14, "arrive");
    return (
      <div style={{ display: "inline-block", transform: `translateX(${(1 - entra) * -24 * u}px)` }}>
        {capsula({ texto, icono, numero: numero ?? 1 }, delay, tono ?? "oscuro", s, out)}
      </div>
    );
  }

  // ── Cluster ──
  const s = size * u;
  const o = origen ?? { x: ancho / 2, y: alto / 2 };
  const n = items.length;
  const colocados = items.map((it, i) => {
    if (it.x !== undefined && it.y !== undefined) return { ...it, x: it.x, y: it.y, i };
    // Abanico asimétrico: ángulos repartidos y radio alterno para que no quede un reloj perfecto.
    const ang = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2 + 0.35;
    const r = (i % 2 === 0 ? 0.36 : 0.46) * Math.min(ancho, alto * 1.6);
    return { ...it, x: o.x + Math.cos(ang) * r, y: o.y + Math.sin(ang) * r * 0.62, i };
  });
  const orden = byDistance(colocados, o.x, o.y);
  return (
    <div style={{ position: "relative", width: ancho * u, height: alto * u }}>
      {orden.map((it, k) => {
        const t0 = delay + staggerDelay(k, n, Math.min(16, n * 4));
        const vuelo = springPreset(frame, fps, "snappy", t0);
        const out = exitAt === undefined ? 0 : leave(frame, exitAt + (n - 1 - k) * 2, 8);
        const x = o.x + (it.x - o.x) * vuelo;
        const y = o.y + (it.y - o.y) * vuelo;
        return (
          <div
            key={it.i}
            style={{
              position: "absolute",
              left: x * u,
              top: y * u,
              transform: `translate(-50%, -50%) scale(${0.72 + 0.28 * Math.min(1, vuelo)})`,
              opacity: Math.min(1, vuelo * 2.5),
            }}
          >
            {capsula(it, t0, tono ?? (k === 0 ? "acento" : "oscuro"), s, out, false)}
          </div>
        );
      })}
    </div>
  );
};
