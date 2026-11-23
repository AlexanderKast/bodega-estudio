import { AbsoluteFill, Img, OffthreadVideo } from "remotion";
import { z } from "zod";
import type { TimedWord } from "../../components/presets/KaraokeCaption";
import { useEscala } from "../../lib/escala";
import { FPS } from "../../lib/formatos";
import { marca } from "../../marca/marca";
import { esVideo, resolverMedia } from "../base";

/**
 * Piezas compartidas por las plantillas del lote 2026-11-08 (talking-head-insertos, split-stack, tutorial-pasos):
 * palabras con tiempos en el formato de Whisper, tiempos de ejemplo con ritmo de habla y el panel de media
 * que se dibuja solo cuando no hay material (la plantilla se ve completa sin footage).
 */

/**
 * Palabras con tiempos en SEGUNDOS, con la forma que deja Whisper (`{word, start, end}`): la salida de
 * `loadWords()` de lib/cues.ts se pega tal cual. La plantilla las pasa a cuadros (TimedWord) por dentro.
 */
export const zPalabras = z
  .array(z.object({ word: z.string(), start: z.number().min(0), end: z.number().min(0) }))
  .describe("palabras de Whisper en segundos: [{word, start, end}]");
export type Palabra = z.infer<typeof zPalabras>[number];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ%$]+/g, "");

/** Segundos → TimedWord en cuadros. Quita la puntuación de borde; `mayus` pone en mayúsculas esas palabras. */
export const aCuadros = (ps: Palabra[], mayus: string[] = []): TimedWord[] => {
  const m = mayus.map(norm);
  return ps
    .map((p) => {
      const limpio = p.word.trim().replace(/^[¿¡"«(]+|[.,;:"»)]+$/g, "");
      const start = Math.round(p.start * FPS);
      return {
        text: m.includes(norm(limpio)) ? limpio.toUpperCase() : limpio,
        start,
        end: Math.max(start + 1, Math.round(p.end * FPS)),
      };
    })
    .filter((w) => w.text.length > 0);
};

/** Segundo en que termina la voz (0 sin palabras). */
export const finVoz = (ps: Palabra[]) => ps.reduce((m, p) => Math.max(m, p.end), 0);

/** Segundo en que empieza la n-ésima aparición de `palabra` (0 si no está: solo se usa para armar defaults). */
export const inicioDe = (ps: Palabra[], palabra: string, n = 1) => {
  const t = norm(palabra);
  let visto = 0;
  for (const p of ps) if (norm(p.word) === t && ++visto === n) return p.start;
  return 0;
};

const r2 = (x: number) => Math.round(x * 100) / 100;

/**
 * Tiempos de ejemplo con ritmo de habla (para los defaults, no para entregar): la palabra dura según su largo,
 * hay respiro de 0,05 s entre palabras, 0,22 s tras coma y 0,42 s tras punto. Así los golpes del subtítulo no
 * caen a intervalos fijos (AI-11). En una pieza real se reemplazan por las palabras de Whisper.
 */
export const palabrasDe = (texto: string, inicio = 0.3): Palabra[] => {
  let t = inicio;
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      const largo = w.replace(/[^\p{L}\p{N}]/gu, "").length;
      const dur = 0.13 + 0.047 * largo + (i % 4 === 2 ? 0.04 : 0);
      const p = { word: w, start: r2(t), end: r2(t + dur) };
      t += dur + 0.05 + (/[,;:]$/.test(w) ? 0.22 : /[.!?]$/.test(w) ? 0.42 : 0);
      return p;
    });
};

/** Duraciones en segundos entre cortes dados como palabras de la voz (para repartir beats por defecto). */
export const tramosEntre = (ps: Palabra[], cortes: [string, number?][], fin: number) => {
  const marcas = [0, ...cortes.map(([w, n]) => inicioDe(ps, w, n ?? 1)), fin];
  return marcas.slice(1).map((m, i) => r2(Math.max(0.6, m - marcas[i])));
};

type TipoPanel = "persona" | "pantalla" | "broll";

/**
 * Media del cliente o, si la ruta está vacía, un panel de maqueta del mismo tipo: silueta del presentador,
 * interfaz de app con barra y columnas, o B-roll con formas grandes. Nada de iconos genéricos (AI-28).
 */
export const MediaPanel: React.FC<{
  src: string;
  tipo: TipoPanel;
  fondo: string;
  tinta: string;
  etiqueta?: string;
  /** Solo para copias (la burbuja del avatar): la voz suena una vez. */
  silencio?: boolean;
}> = ({ src, tipo, fondo, tinta, etiqueta, silencio = false }) => {
  const { u } = useEscala();
  if (src) {
    const url = resolverMedia(src);
    const estilo = { width: "100%", height: "100%", objectFit: "cover" as const };
    return (
      <AbsoluteFill>
        {esVideo(src) ? <OffthreadVideo src={url} muted={silencio} style={estilo} /> : <Img src={url} style={estilo} />}
      </AbsoluteFill>
    );
  }
  // color-mix acepta cualquier formato de color que llegue por props (hex corto, rgb(), nombres).
  const tono = (a: number) => `color-mix(in srgb, ${tinta} ${Math.round(a * 100)}%, transparent)`;
  return (
    <AbsoluteFill style={{ background: fondo, overflow: "hidden" }}>
      {tipo === "persona" && (
        <svg width="100%" height="100%" viewBox="0 0 100 150" preserveAspectRatio="xMidYMax meet" style={{ position: "absolute", inset: 0 }}>
          <circle cx={50} cy={50} r={17} fill={tono(0.16)} />
          <path d="M10 150 C 12 108, 26 92, 50 90 C 74 92, 88 108, 90 150 Z" fill={tono(0.12)} />
          <rect x={44} y={66} width={12} height={16} rx={5} fill={tono(0.14)} />
        </svg>
      )}
      {tipo === "pantalla" && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "7%", background: tono(0.07), borderBottom: `${1.5 * u}px solid ${tono(0.12)}` }} />
          <div style={{ position: "absolute", left: 0, top: "7%", bottom: 0, width: "22%", background: tono(0.04) }}>
            {[0.12, 0.2, 0.28, 0.36, 0.5].map((y, i) => (
              <div key={i} style={{ position: "absolute", left: "14%", top: `${y * 100}%`, width: `${[62, 48, 56, 40, 52][i]}%`, height: "2.4%", borderRadius: 4 * u, background: tono(i === 1 ? 0.3 : 0.14) }} />
            ))}
          </div>
          <div style={{ position: "absolute", left: "27%", top: "13%", width: "40%", height: "4.5%", borderRadius: 6 * u, background: tono(0.26) }} />
          <div style={{ position: "absolute", left: "27%", top: "22%", width: "42%", height: "38%", borderRadius: 10 * u, background: tono(0.1) }} />
          <div style={{ position: "absolute", left: "72%", top: "22%", width: "23%", height: "17%", borderRadius: 10 * u, background: tono(0.16) }} />
          <div style={{ position: "absolute", left: "72%", top: "43%", width: "23%", height: "17%", borderRadius: 10 * u, background: tono(0.08) }} />
          <div style={{ position: "absolute", left: "27%", top: "66%", width: "68%", height: "24%", borderRadius: 10 * u, border: `${1.5 * u}px solid ${tono(0.16)}` }} />
        </>
      )}
      {tipo === "broll" && (
        <>
          <div style={{ position: "absolute", left: "-12%", top: "18%", width: "70%", aspectRatio: "1", borderRadius: "50%", background: tono(0.1) }} />
          <div style={{ position: "absolute", right: "-6%", bottom: "-10%", width: "58%", height: "62%", borderRadius: 18 * u, background: tono(0.07), transform: "rotate(-8deg)" }} />
          <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "16%", height: 2 * u, background: tono(0.2) }} />
        </>
      )}
      {etiqueta ? (
        <div
          style={{
            position: "absolute",
            left: 28 * u,
            bottom: 24 * u,
            fontFamily: marca.fuenteMono,
            fontSize: 18 * u,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: tono(0.5),
          }}
        >
          {etiqueta}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
