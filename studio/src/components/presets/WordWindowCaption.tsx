import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { springPreset } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import type { TimedWord } from "./KaraokeCaption";

type Props = {
  words: TimedWord[];
  /** Palabras por ventana: 1–3 (kb/13 estilo 3). */
  max?: number;
  /** Silencio en cuadros que obliga a abrir ventana nueva. */
  gap?: number;
  size?: number;
  /** Alto de la línea base desde arriba, en fracción del lienzo. Por defecto queda sobre la zona segura inferior. */
  y?: number;
};

/** Agrupa las palabras en ventanas cortas: corta por tamaño, por puntuación o por silencio. */
export const ventanas = (words: TimedWord[], max = 3, gap = 6) => {
  const out: TimedWord[][] = [];
  let cur: TimedWord[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= max || (prev && w.start - prev.end > gap) || /[.,!?;:]$/.test(prev?.text ?? ""))) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) out.push(cur);
  return out;
};

/**
 * Captions de retención (estilo 3, MrBeast / Hormozi, kb/13). Solo se ve una ventana de 1–3 palabras en
 * MAYÚSCULAS; cada ventana entra con spring pop desde 0,86 (nunca desde 0) y la palabra que se está
 * diciendo toma el acento. Contorno con `paint-order` para leerse sobre cualquier video. Centrado a
 * propósito: es el lenguaje del género, y queda dentro de la zona segura de Reels/TikTok.
 */
export const WordWindowCaption: React.FC<Props> = ({ words, max = 3, gap = 3, size = 96, y }) => {
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
  const fin = actual[actual.length - 1].end;
  const siguiente = grupos[idx + 1];
  // Se apaga si queda un silencio de más de 8 f antes de la siguiente ventana (las pausas cortas no parpadean).
  if (frame > fin + 8 && (!siguiente || frame < siguiente[0].start)) return null;
  const s = springPreset(frame, fps, "pop", actual[0].start);
  const top = y !== undefined ? y * alto : alto - zona.abajo - size * u * 1.4;
  return (
    <div
      style={{
        position: "absolute",
        left: zona.lados,
        right: zona.lados,
        top,
        display: "flex",
        justifyContent: "center",
        gap: `0 ${0.3 * size * u}px`,
        flexWrap: "wrap",
        fontFamily: marca.fuenteTitulo,
        fontWeight: 700,
        fontSize: size * u,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
        transform: `translateY(${(1 - s) * 18 * u}px) scale(${0.86 + 0.14 * s})`,
        opacity: Math.min(1, s * 2.5),
      }}
    >
      {actual.map((w, i) => {
        const on = frame >= w.start && frame < w.end + 2;
        return (
          <span
            key={i}
            style={{
              color: on ? marca.colores.acento : marca.colores.texto,
              WebkitTextStroke: `${10 * u}px ${marca.colores.fondo}`,
              paintOrder: "stroke fill",
              transform: `scale(${on ? 1.06 : 1})`,
              display: "inline-block",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
