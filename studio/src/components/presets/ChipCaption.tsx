import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave, springPreset, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import type { TimedWord } from "./KaraokeCaption";
import { ventanas } from "./WordWindowCaption";

type Props = {
  words: TimedWord[];
  /** Palabras por golpe: 1–3. */
  max?: number;
  /** Silencio en cuadros que obliga a abrir golpe nuevo. */
  gap?: number;
  size?: number;
  /**
   * "clave": un chip por golpe, sobre la palabra marcada (o la más larga si ninguna está marcada).
   * "activa": el chip sigue a la palabra que se está diciendo (tiktok-7698861538307788033).
   */
  modo?: "clave" | "activa";
  /** Palabras que siempre van en chip (sin tildes ni puntuación, en minúsculas). */
  claves?: string[];
  /** Largo mínimo para que la regla "palabra más larga" elija chip. */
  minLargo?: number;
  /** Alto de la línea base desde arriba, en fracción del lienzo. Por defecto queda sobre la zona segura inferior. */
  y?: number;
  alinear?: "centro" | "izquierda";
  colorChip?: string;
  colorTexto?: string;
  /** Color del texto dentro del chip. */
  colorSobreChip?: string;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]/g, "");

/** Índice de la palabra clave de un golpe: primero las marcadas, si no la más larga (≥ minLargo). */
const claveDe = (g: TimedWord[], claves: string[], minLargo: number) => {
  const marcadas = claves.map(norm);
  const i = g.findIndex((w) => marcadas.includes(norm(w.text)));
  if (i >= 0) return i;
  let mejor = -1;
  g.forEach((w, j) => {
    if (norm(w.text).length >= minLargo && (mejor < 0 || norm(w.text).length > norm(g[mejor].text).length)) mejor = j;
  });
  return mejor;
};

/**
 * Subtítulo de 1–3 palabras por golpe con la palabra clave dentro de un chip de acento.
 * Técnica: el golpe reemplaza al anterior en corte (lenguaje del género); sus palabras suben 12 px
 * con micro-stagger no lineal (arriveGentle, 8 f) y las que aún no se dicen esperan al 40 %. El chip
 * crece desde 0,7 con springs.pop justo en el start de su palabra, con un giro de −3° que se
 * endereza, y la palabra dentro se oscurece al color de fondo. Si queda un silencio, el golpe sale
 * con blur hacia arriba (leave, 6 f).
 * Medido de: tiktok-7701672067120368948 (acento naranja en la clave, 2 palabras por golpe),
 * tiktok-7698456660611796231 (chip morado, 68 % de alto), tiktok-7698861538307788033 (chip coral que
 * sigue a la activa, las que vienen al 35 %), tiktok-7702620779518643478 (clave con blur-in 5 f) y
 * zlOCQxQYnYc (pop 0,9→1 en 6 f).
 * Centrado por defecto a propósito: es como se leen los captions en Reels/TikTok (todos los referentes).
 */
export const ChipCaption: React.FC<Props> = ({
  words,
  max = 3,
  gap = 6,
  size = 72,
  modo = "clave",
  claves = [],
  minLargo = 5,
  y,
  alinear = "centro",
  colorChip = marca.colores.acento,
  colorTexto = marca.colores.texto,
  colorSobreChip = marca.colores.fondo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, alto, zona } = useEscala();
  const grupos = ventanas(words, max, gap);
  let idx = -1;
  grupos.forEach((g, i) => {
    if (frame >= g[0].start) idx = i;
  });
  if (idx < 0) return null;
  const actual = grupos[idx];
  const inicio = actual[0].start;
  const fin = actual[actual.length - 1].end;
  const siguiente = grupos[idx + 1];
  // Silencio largo antes del siguiente golpe: sale con blur hacia arriba en vez de quedarse colgado.
  const salidaEn = fin + 8;
  const hayHueco = !siguiente || siguiente[0].start > salidaEn + 6;
  const out = hayHueco ? leave(frame, salidaEn, 6, "leaveSoft") : 0;
  if (out >= 1) return null;

  const clave = modo === "clave" ? claveDe(actual, claves, minLargo) : -1;
  const s = size * u;
  const top = y !== undefined ? y * alto : alto - zona.abajo - s * 1.7;

  return (
    <div
      style={{
        position: "absolute",
        left: zona.lados,
        right: zona.lados,
        top,
        display: "flex",
        justifyContent: alinear === "centro" ? "center" : "flex-start",
        alignItems: "baseline",
        flexWrap: "wrap",
        gap: `${0.12 * s}px ${0.24 * s}px`,
        fontFamily: marca.fuenteTitulo,
        fontWeight: 700,
        fontSize: s,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        opacity: 1 - out,
        transform: `translateY(${-out * 18 * u}px)`,
        filter: out > 0 ? `blur(${out * 10 * u}px)` : undefined,
      }}
    >
      {actual.map((w, i) => {
        const sube = arrive(frame, inicio + staggerDelay(i, actual.length, 4), 8, "arriveGentle");
        const dicha = frame >= w.start;
        const enChip = modo === "clave" ? i === clave : dicha && frame < w.end + 2;
        // El chip nace en el start de su palabra (en modo clave) o en cada palabra activa.
        const c = enChip ? springPreset(frame, fps, "pop", w.start) : 0;
        const tinta = enChip ? arrive(frame, w.start, 4, "arriveGentle") : 0;
        return (
          <span
            key={`${idx}-${i}`}
            style={{
              position: "relative",
              display: "inline-block",
              padding: `0 ${0.14 * s}px`,
              margin: `0 ${-0.14 * s}px`,
              opacity: Math.min(1, sube / 0.6) * (dicha ? 1 : 0.4),
              transform: `translateY(${(1 - sube) * 12 * u}px)`,
            }}
          >
            {enChip && (
              <span
                style={{
                  position: "absolute",
                  inset: `${0.02 * s}px 0 ${-0.04 * s}px 0`,
                  background: colorChip,
                  borderRadius: 0.14 * s,
                  transform: `scale(${0.7 + 0.3 * c}) rotate(${(1 - c) * -3}deg)`,
                  opacity: Math.min(1, c * 3),
                  transformOrigin: "50% 60%",
                }}
              />
            )}
            <span style={{ position: "relative", color: tinta > 0.5 ? colorSobreChip : colorTexto }}>{w.text}</span>
          </span>
        );
      })}
    </div>
  );
};
