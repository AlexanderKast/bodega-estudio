import { auditEvent } from "./audit";

/**
 * Sincronía con la voz (kb/07 §2, kb/12 §3 paso 4): ninguna composición usa segundos tecleados.
 * Las palabras vienen del JSON de Whisper que genera el VPS de Bodega (verbose_json con palabras,
 * o una lista plana {word, start, end} en segundos).
 */

export type Word = { word: string; start: number; end: number }; // segundos

type WhisperJson = { segments?: { words?: Word[] }[]; words?: Word[] } | Word[];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ%$]+/g, "");

/** Normaliza cualquier salida de Whisper a una lista de palabras con tiempos. */
export const loadWords = (json: WhisperJson): Word[] => {
  if (Array.isArray(json)) return json;
  if (json.words) return json.words;
  return (json.segments ?? []).flatMap((s) => s.words ?? []);
};

/**
 * Cuadro en que se dice la n-ésima aparición de `palabra` (1 = la primera).
 * `edge: "end"` devuelve el final de la palabra. Lanza un error si no la encuentra:
 * mejor fallar en el render que animar a destiempo.
 */
export const cue = (words: Word[], palabra: string, n = 1, fps = 30, edge: "start" | "end" = "start"): number => {
  const target = norm(palabra);
  let seen = 0;
  for (const w of words) {
    if (norm(w.word) === target && ++seen === n) return Math.round((edge === "start" ? w.start : w.end) * fps);
  }
  throw new Error(`cue: no encontré "${palabra}" (aparición ${n}) en la transcripción`);
};

/** Roles de sonido (kb/12 §5): un sonido por gesto y con causa visible. */
export type SfxRole =
  | "pop"
  | "land"
  | "bell"
  | "whoosh.short"
  | "whoosh.long"
  | "riser"
  | "hit"
  | "tick"
  | "snap"
  | "click"
  | "glitch";

/**
 * Marca un sonido en el cuadro del gesto visual (`at`, local al componente). No suena por sí solo:
 * en modo auditoría queda en `sfx-cues.json` y `scripts/sfx-db/cama.py` arma la pista en el servidor.
 * `id` elige un sonido concreto de la DB (`node scripts/sfx-db/buscar.mjs`); sin `id` se usa el de la
 * paleta de la pieza para ese rol (`studio/src/marca/sonido.json`). `gain` en dB sobre el nivel del rol.
 * Llamarlo en cada render del componente, igual que los helpers de motion.
 */
export const sfx = (frame: number, role: SfxRole, at: number, opts: { keep?: boolean; id?: string; gain?: number } = {}) => {
  auditEvent(frame, at, { kind: "sfx", role, keep: opts.keep ?? false, sound: opts.id, gain: opts.gain });
};
