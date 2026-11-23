import { spawnSync } from "node:child_process";

/**
 * Hoja de contactos con ffmpeg: celdas de `ancho` px en `cols` columnas. Todas las imágenes tienen que
 * tener la misma proporción. La usan scripts/stills.mjs y scripts/storyboard.mjs.
 */
export const sheet = (files, output, { ancho = 480, cols = 4 } = {}) => {
  const n = files.length;
  const c = Math.min(cols, n);
  const inputs = files.flatMap((f) => ["-i", f]);
  const scaled = files.map((_, i) => `[${i}]scale=${ancho}:-2[s${i}]`).join(";");
  // Posición de cada celda: columna × ancho, fila × alto (todas miden lo mismo).
  const cells = files.map((_, i) => `${i % c ? Array(i % c).fill("w0").join("+") : "0"}_${Math.floor(i / c) ? Array(Math.floor(i / c)).fill("h0").join("+") : "0"}`).join("|");
  const filter = n === 1 ? `${scaled};[s0]copy[o]` : `${scaled};${files.map((_, i) => `[s${i}]`).join("")}xstack=inputs=${n}:layout=${cells}:fill=black[o]`;
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", ...inputs, "-filter_complex", filter, "-map", "[o]", output], { stdio: "inherit" });
  return r.status === 0;
};
