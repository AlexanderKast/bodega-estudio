#!/usr/bin/env node
/**
 * Pasa la respuesta de Whisper (verbose_json con palabras) al JSON de voz del estudio. Lo llama transcribir.sh.
 *
 *   node scripts/voz/palabras.mjs <whisper.json> <salida.json> [--audio voz/x.wav] [--idioma es]
 *        [--duracion 12.3] [--guion guion.txt]
 *
 * Salida: { audio, idioma, duracion, texto, words: [{ word, start, end }] } con tiempos en segundos. Es una de
 * las formas que acepta loadWords() de studio/src/lib/cues.ts (objeto con `words`).
 */
import { readFileSync, writeFileSync } from "node:fs";

const [entrada, salida] = process.argv.slice(2);
const opt = (n) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : undefined);
if (!entrada || !salida) {
  console.error("uso: palabras.mjs <whisper.json> <salida.json> [--audio ...] [--idioma es] [--duracion s] [--guion txt]");
  process.exit(2);
}

let crudo;
try {
  crudo = JSON.parse(readFileSync(entrada, "utf8"));
} catch {
  console.error(`Whisper no devolvió JSON:\n${readFileSync(entrada, "utf8").slice(0, 400)}`);
  process.exit(1);
}
const duracion = Number(opt("duracion")) || crudo.duration || 0;
const r3 = (n) => Math.round(n * 1000) / 1000;
const todas = (crudo.words ?? (crudo.segments ?? []).flatMap((s) => s.words ?? []))
  .map((w) => ({ word: String(w.word ?? "").trim(), start: r3(w.start), end: r3(w.end) }))
  .filter((w) => w.word && Number.isFinite(w.start) && Number.isFinite(w.end));
// Lo que Whisper escribe después de que acaba el audio es una alucinación sobre silencio (kb/07 §7).
const words = duracion ? todas.filter((w) => w.start < duracion) : todas;
if (!words.length) {
  console.error("Whisper no devolvió palabras con tiempos. Respuesta:\n" + JSON.stringify(crudo).slice(0, 400));
  process.exit(1);
}

const texto = String(crudo.text ?? words.map((w) => w.word).join(" ")).trim();
writeFileSync(salida, JSON.stringify({ audio: opt("audio") ?? null, idioma: opt("idioma") ?? crudo.language ?? null, duracion: r3(duracion), texto, words }, null, 2) + "\n");

const fin = words[words.length - 1].end;
console.log(`palabras → ${salida}`);
console.log(`${words.length} palabras · voz hasta ${fin.toFixed(2)} s de ${duracion.toFixed(2)} s · ${(words.length / Math.max(fin - words[0].start, 0.1)).toFixed(1)} palabras/s`);
if (todas.length !== words.length) console.log(`aviso: se quitaron ${todas.length - words.length} palabras escritas después del final del audio`);
const largas = words.filter((w) => w.end - w.start > 1.5);
if (largas.length) console.log(`aviso: palabras de más de 1,5 s (revisa el audio ahí): ${largas.map((w) => `"${w.word}" @${w.start}`).join(", ")}`);

// Misma normalización que cue() en studio/src/lib/cues.ts.
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ%$]+/g, "");
if (opt("guion")) {
  const dichas = new Set(words.map((w) => norm(w.word)));
  const delGuion = readFileSync(opt("guion"), "utf8").split(/\s+/).filter((p) => norm(p));
  const faltan = [...new Set(delGuion.filter((p) => !dichas.has(norm(p))).map((p) => p.replace(/^[^\p{L}\p{N}%$]+|[^\p{L}\p{N}%$]+$/gu, "")))];
  console.log(`guion: ${delGuion.length} palabras, transcripción: ${words.length}`);
  console.log(faltan.length ? `no aparecen tal cual en la transcripción (no las uses en cue()): ${faltan.join(", ")}` : "todas las palabras del guion están en la transcripción");
}
