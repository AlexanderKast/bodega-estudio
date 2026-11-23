#!/usr/bin/env node
/**
 * Stills de control (kb/12 §3, pasos 5 y 7). Un solo bundle para todo; las salidas van a studio/out/stills/.
 *
 *   node scripts/stills.mjs                         un still por preset (cuadro `still` de presets.manifest.json)
 *   node scripts/stills.mjs MaskTitle,CountUp       solo esos presets
 *   node scripts/stills.mjs --comp <Id> --at 0.5,2,3.5
 *                                                   stills en esos segundos + hoja de contactos
 *   node scripts/stills.mjs --comp <Id> --cada 0.5  un still cada 0,5 s de toda la composición
 *     … --props '{"variante":"papel-tinta"}'        input props (plantillas con schema); también ruta a un .json
 *     … --out antes                                 nombre de la carpeta de salida (por defecto, el id): sirve para
 *                                                   guardar un «antes» y un «después» sin que se pisen
 *   node scripts/stills.mjs --storyboard <Id>       un still por escena de studio/storyboards/<Id>.json
 *                                                   ({"comp": "<Id>-vertical", "scenes": [{"name": "Gancho", "at": 1.2}, ...]})
 *                                                   + hoja de contactos de la animática o de la pieza ya armada
 *                                                   (la hoja de bocetos de la puerta 2 es scripts/storyboard.mjs)
 *   node scripts/stills.mjs --loop <Id>             compara el cuadro 0 con el último (SSIM ≥ 0.98): el bucle cierra
 *
 * Correr en el VPS de Bodega o en este equipo para lotes grandes. Sale 1 si algo falla.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { empaquetar } from "./lib/empaquetar.mjs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sheet } from "./lib/hoja.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studio = join(root, "studio");
const require = createRequire(join(studio, "package.json"));
const { bundle } = require("@remotion/bundler");
const { getCompositions, renderStill, selectComposition } = require("@remotion/renderer");

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const outDir = join(studio, "out/stills");
mkdirSync(outDir, { recursive: true });

const propsArg = arg("props");
const inputProps = propsArg ? JSON.parse(existsSync(propsArg) ? readFileSync(propsArg, "utf8") : propsArg) : {};

const serveUrl = await empaquetar(bundle, join(studio, "src/index.ts"));
const comps = await getCompositions(serveUrl, { logLevel: "error" });
const findComp = (id) => {
  const c = comps.find((x) => x.id === id) ?? comps.find((x) => x.id.startsWith(`${id}-`));
  if (!c) throw new Error(`No existe la composición ${id}`);
  return c;
};
const still = async (comp, frame, output) => {
  const f = Math.min(comp.durationInFrames - 1, Math.max(0, Math.round(frame)));
  await renderStill({ composition: comp, serveUrl, output, frame: f, logLevel: "error", inputProps });
  return f;
};
let failed = 0;

if (arg("loop")) {
  const comp = findComp(arg("loop"));
  const a = join(outDir, `${comp.id}-loop-first.png`);
  const b = join(outDir, `${comp.id}-loop-last.png`);
  await still(comp, 0, a);
  await still(comp, comp.durationInFrames - 1, b);
  const r = spawnSync("ffmpeg", ["-i", a, "-i", b, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
  const ssim = Number((r.stderr.match(/All:([0-9.]+)/) ?? [])[1]);
  const ok = ssim >= 0.98;
  console.log(`${ok ? "ok   " : "FALLA"} bucle ${comp.id}: SSIM primer/último cuadro = ${Number.isFinite(ssim) ? ssim.toFixed(4) : "?"} (mínimo 0.98)`);
  process.exit(ok ? 0 : 1);
}

if (arg("comp") || arg("storyboard")) {
  let comp;
  let shots;
  if (arg("storyboard")) {
    const file = join(studio, "storyboards", `${arg("storyboard")}.json`);
    if (!existsSync(file)) throw new Error(`Falta ${file}`);
    const sb = JSON.parse(readFileSync(file, "utf8"));
    comp = findComp(sb.comp ?? arg("storyboard"));
    shots = sb.scenes.map((s, i) => ({ name: `${String(i + 1).padStart(2, "0")}-${s.name}`, at: s.at }));
  } else {
    comp = findComp(arg("comp"));
    // Las props valen solo para esta composición (cada plantilla tiene su schema): se resuelve aparte, con su duración.
    if (propsArg) comp = await selectComposition({ serveUrl, id: comp.id, inputProps, logLevel: "error" });
    const cada = Number(arg("cada") ?? 0);
    const total = comp.durationInFrames / comp.fps;
    const at = cada > 0 ? Array.from({ length: Math.ceil(total / cada) }, (_, i) => Number((i * cada).toFixed(3))) : (arg("at") ?? "").split(",").filter(Boolean).map(Number);
    if (!at.length) throw new Error("Usa --at 0.5,2,3.5 (segundos) o --cada 0.5");
    shots = at.map((t) => ({ name: `t${t}s`, at: t }));
  }
  const dir = join(outDir, arg("out") ?? comp.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (const s of shots) {
    const file = join(dir, `${s.name.replace(/[^\w.-]+/g, "_")}.png`);
    try {
      const f = await still(comp, s.at * comp.fps, file);
      files.push(file);
      console.log(`ok    ${comp.id} · ${s.name} · cuadro ${f}`);
    } catch (e) {
      failed++;
      console.log(`FALLA ${comp.id} · ${s.name}: ${e.message}`);
    }
  }
  if (files.length && sheet(files, join(dir, "hoja.jpg"))) console.log(`hoja de contactos → ${join(dir, "hoja.jpg")}`);
  process.exit(failed ? 1 : 0);
}

// Modo por defecto: presets del manifiesto.
const manifest = JSON.parse(readFileSync(join(studio, "src/compositions/presets.manifest.json"), "utf8"));
const only = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2].split(",") : null;
for (const p of manifest.filter((m) => !only || only.includes(m.id))) {
  const out = join(outDir, `${p.id}.png`);
  try {
    await still(findComp(`Preset-${p.id}-horizontal`), p.still, out);
    console.log(`ok    ${p.id} → studio/out/stills/${p.id}.png`);
  } catch (e) {
    failed++;
    console.log(`FALLA ${p.id}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
