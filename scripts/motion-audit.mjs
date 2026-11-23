#!/usr/bin/env node
/**
 * motion-audit: auditoría dinámica. Renderiza cada composición en modo auditoría (sin guardar
 * imágenes), recoge cuándo arranca cada animación del kit y cada cue de sonido, y mide:
 *
 *   AI-02  ≥ 3 animaciones con el mismo inicio, duración y curva (todo entra a la vez)
 *   AI-04  ≥ 80 % de las entradas con la misma duración (n ≥ 5)
 *   AI-11  ritmo de metrónomo: ≥ 75 % de los intervalos entre golpes a ±1 f de la mediana (n ≥ 5)
 *   D-01   hueco sin eventos nuevos mayor al umbral del género (solo con --genre)
 *   S-01   más de 1 riser · S-02 más de 2 whoosh largos · S-03 más de 10 sonidos en 10 s
 *   S-04   sonido chico a menos de 0,25 s de un hit (info)
 *
 * Además escribe `studio/out/audit/<comp>.sfx-cues.json` con los cues de sonido en segundos.
 *
 * Uso: node scripts/motion-audit.mjs [--comp Id1,Id2] [--genre anuncio|explainer|vsl|talking]
 *      Sin --comp audita todas menos las de prueba (Test-*). Sale 1 si hay warnings o errores.
 *      Correr en el VPS de Bodega o en este equipo para piezas largas.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { empaquetar } from "./lib/empaquetar.mjs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studio = join(root, "studio");
const require = createRequire(join(studio, "package.json"));
const { bundle } = require("@remotion/bundler");
const { getCompositions, renderFrames } = require("@remotion/renderer");

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const only = arg("comp")?.split(",");
const genre = arg("genre");
// Intervalo máximo sin un evento nuevo, en segundos (kb/12 §4, kb/02).
const GENRE_GAP = { anuncio: 1, explainer: 2.5, vsl: 2, talking: 3 };
if (genre && !(genre in GENRE_GAP)) {
  console.error(`--genre debe ser uno de: ${Object.keys(GENRE_GAP).join(", ")}`);
  process.exit(2);
}

const inputProps = { __motionAudit: true };
const serveUrl = await empaquetar(bundle, join(studio, "src/index.ts"));
const all = await getCompositions(serveUrl, { inputProps, logLevel: "error" });
const targets = all.filter((c) => (only ? only.includes(c.id) : !c.id.startsWith("Test-") && !c.id.startsWith("Interno-")));
if (targets.length === 0) {
  console.error("No hay composiciones que coincidan.");
  process.exit(2);
}

const findings = [];
const add = (comp, id, level, msg) => findings.push({ comp, id, level, msg });
mkdirSync(join(studio, "out/audit"), { recursive: true });

for (const comp of targets) {
  const events = [];
  await renderFrames({
    composition: comp,
    serveUrl,
    inputProps,
    outputDir: null,
    imageFormat: "none",
    onStart: () => {},
    onFrameUpdate: () => {},
    onBrowserLog: (log) => {
      if (log.text.startsWith("MOTION_AUDIT ")) events.push(JSON.parse(log.text.slice(13)));
    },
    concurrency: Math.min(4, availableParallelism()),
    logLevel: "error",
  });
  const fps = comp.fps;
  const motion = events.filter((e) => e.kind !== "sfx" && e.kind !== "blur");
  const conBlur = events.some((e) => e.kind === "blur");
  const entries = motion.filter((e) => e.kind === "arrive" || e.kind === "spring");
  const sounds = events.filter((e) => e.kind === "sfx").sort((a, b) => a.start - b.start);

  // AI-02: mismo inicio + misma duración + misma curva en ≥ 3 llamadas distintas.
  const groups = new Map();
  for (const e of motion.filter((x) => x.kind === "arrive")) {
    const k = `${e.start}|${e.duration}|${e.curve}`;
    groups.set(k, (groups.get(k) ?? 0) + 1);
  }
  for (const [k, n] of groups) {
    if (n >= 3) add(comp.id, "AI-02", "warning", `${n} entradas arrancan juntas en el cuadro ${k.split("|")[0]} con la misma duración: escalona 2–5 f.`);
  }

  // B-01: movimiento rápido sin motion blur (kb/05). Con curva suave el pico ronda 1,8 veces la media.
  if (!conBlur) {
    const rapidos = motion.filter((e) => e.dist && e.duration && (e.dist / e.duration) * 1.8 > 30);
    if (rapidos.length) {
      const peor = rapidos.sort((a, b) => b.dist / b.duration - a.dist / a.duration)[0];
      add(comp.id, "B-01", "warning", `${rapidos.length} movimiento(s) superan 30 px por cuadro sin motion blur (el peor: ${Math.round(peor.dist)} px en ${peor.duration} f desde el cuadro ${peor.start}). Envuelve lo que se mueve en <BlurCamara>.`);
    }
  }

  // AI-04: duraciones uniformes.
  const durs = entries.filter((e) => typeof e.duration === "number").map((e) => e.duration);
  if (durs.length >= 5) {
    const counts = durs.reduce((m, d) => m.set(d, (m.get(d) ?? 0) + 1), new Map());
    const [d, n] = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (n / durs.length >= 0.8) add(comp.id, "AI-04", "warning", `${n} de ${durs.length} entradas duran ${d} f: la duración debe seguir al tamaño y la distancia (kb/02).`);
  }

  // Golpes: inicios agrupados (lo que arranca a menos de 8 f se cuenta como un mismo golpe).
  const starts = [...new Set(motion.map((e) => e.start))].sort((a, b) => a - b);
  const beats = [];
  for (const s of starts) if (!beats.length || s - beats[beats.length - 1] >= 8) beats.push(s);
  const intervals = beats.slice(1).map((b, i) => b - beats[i]);

  // AI-11: metrónomo.
  if (intervals.length >= 5) {
    const sorted = [...intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const near = intervals.filter((x) => Math.abs(x - median) <= 1).length;
    if (near / intervals.length >= 0.75) add(comp.id, "AI-11", "warning", `${near} de ${intervals.length} golpes caen cada ${median} f exactos: ritmo de metrónomo. Varía con acentos y contraste rápido/lento.`);
  }

  // D-01: densidad de eventos según el género (el hold final no cuenta).
  if (genre && beats.length) {
    const max = Math.round(GENRE_GAP[genre] * fps);
    const gaps = [beats[0], ...intervals];
    const worst = Math.max(...gaps);
    if (worst > max) {
      const at = worst === beats[0] ? 0 : beats[intervals.indexOf(worst)];
      add(comp.id, "D-01", "warning", `Hueco de ${worst} f sin eventos nuevos desde el cuadro ${at} (máximo ${max} f para ${genre}).`);
    }
  }

  // Sonido (kb/12 §5).
  const roleCount = (r) => sounds.filter((s) => s.role === r).length;
  if (roleCount("riser") > 1) add(comp.id, "S-01", "warning", `${roleCount("riser")} risers: máximo 1 por pieza.`);
  if (roleCount("whoosh.long") > 2) add(comp.id, "S-02", "warning", `${roleCount("whoosh.long")} whoosh largos: máximo 2 por pieza.`);
  for (let i = 0; i < sounds.length; i++) {
    const inWindow = sounds.filter((s) => s.start >= sounds[i].start && s.start < sounds[i].start + 10 * fps).length;
    if (inWindow > 10) {
      add(comp.id, "S-03", "warning", `${inWindow} sonidos en 10 s desde el cuadro ${sounds[i].start}: máximo ~10 gestos.`);
      break;
    }
  }
  const small = new Set(["pop", "tick", "click", "snap", "land"]);
  for (const h of sounds.filter((s) => s.role === "hit")) {
    for (const s of sounds) {
      if (small.has(s.role) && !s.keep && Math.abs(s.start - h.start) < 0.25 * fps) {
        add(comp.id, "S-04", "info", `"${s.role}" en el cuadro ${s.start}, a menos de 0,25 s del hit del cuadro ${h.start}: el hit lo tapa.`);
      }
    }
  }

  writeFileSync(
    join(studio, `out/audit/${comp.id}.sfx-cues.json`),
    JSON.stringify({ comp: comp.id, fps, duracion_s: +(comp.durationInFrames / fps).toFixed(3), cues: sounds.map((s) => ({ role: s.role, t: +(s.start / fps).toFixed(3), keep: s.keep, id: s.sound, gain: s.gain })) }, null, 2),
  );
  console.log(`· ${comp.id}: ${motion.length} animaciones, ${beats.length} golpes, ${sounds.length} sonidos`);
}

const order = { error: 0, warning: 1, info: 2 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.comp.localeCompare(b.comp));
console.log("");
for (const f of findings) console.log(`${f.comp}  ${f.level.padEnd(7)} ${f.id.padEnd(6)} ${f.msg}`);
const blocking = findings.filter((f) => f.level !== "info").length;
console.log(`\nmotion-audit: ${targets.length} composiciones · ${blocking} warnings/errores · ${findings.length - blocking} info`);
process.exit(blocking > 0 ? 1 : 0);
