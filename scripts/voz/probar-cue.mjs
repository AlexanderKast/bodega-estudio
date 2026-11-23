#!/usr/bin/env node
/**
 * Comprueba que cue() encuentra las palabras que la pieza va a usar, con el código real de
 * studio/src/lib/cues.ts (se empaqueta con el esbuild del estudio). Correr antes de animar: un cue que no
 * existe tumba el render.
 *
 *   node scripts/voz/probar-cue.mjs <voz.json> palabra [palabra:2 ...] [--fps 30]
 *   node scripts/voz/probar-cue.mjs <voz.json> --beats studio/storyboards/<Pieza>.beats.json
 *
 * `palabra:2` pide la segunda aparición. Con --beats prueba el `cue` de cada beat. Sale 1 si alguna falta.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const studio = join(root, "studio");
const args = process.argv.slice(2);
const opt = (n) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
const fps = Number(opt("fps") ?? 30);
const sueltos = args.filter((a, i) => !a.startsWith("--") && !["--fps", "--beats"].includes(args[i - 1]));
const [archivo, ...palabras] = sueltos;
if (!archivo) {
  console.error("uso: probar-cue.mjs <voz.json> palabra [palabra:2 ...] [--fps 30] | --beats <Pieza>.beats.json");
  process.exit(2);
}

const pedidos = palabras.map((p) => ({ nombre: p, palabra: p.split(":")[0], n: Number(p.split(":")[1] ?? 1) }));
if (opt("beats")) {
  for (const b of JSON.parse(readFileSync(opt("beats"), "utf8")).beats) {
    if (!b.cue) continue;
    const [palabra, n] = String(b.cue).split(":");
    pedidos.push({ nombre: `${b.id} · ${b.cue}`, palabra, n: Number(n ?? 1) });
  }
}
if (!pedidos.length) {
  console.error("No hay palabras que probar.");
  process.exit(2);
}

const require = createRequire(join(studio, "package.json"));
const { buildSync } = require("esbuild");
const salida = join(studio, "node_modules/.cache/master-motion/cues.mjs");
buildSync({ entryPoints: [join(studio, "src/lib/cues.ts")], bundle: true, format: "esm", platform: "node", outfile: salida, logLevel: "error" });
const { cue, loadWords } = await import(pathToFileURL(salida).href);

const words = loadWords(JSON.parse(readFileSync(archivo, "utf8")));
let fallas = 0;
for (const p of pedidos) {
  try {
    const f = cue(words, p.palabra, p.n, fps);
    console.log(`ok    ${p.nombre.padEnd(28)} cuadro ${String(f).padStart(5)} (${(f / fps).toFixed(2)} s)`);
  } catch (e) {
    fallas++;
    console.log(`FALLA ${p.nombre.padEnd(28)} ${e.message}`);
  }
}
console.log(`${words.length} palabras en ${archivo} · ${pedidos.length - fallas}/${pedidos.length} cues encontrados a ${fps} fps`);
process.exit(fallas ? 1 : 0);
