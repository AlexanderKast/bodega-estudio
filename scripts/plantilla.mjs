#!/usr/bin/env node
/**
 * Usa una plantilla del catálogo con contenido propio.
 *
 *   node scripts/plantilla.mjs <id> --props archivo.json [--formato vertical] [--nombre mi-pieza]
 *        [--stills] [--render]
 *
 *   <id>        `Plantilla-TutorialPasos` o solo `TutorialPasos` (ver catalogo/CATALOGO.md)
 *   --props     JSON con las props. Los campos que falten toman el valor por defecto de la plantilla.
 *   --formato   vertical | retrato | cuadrado | horizontal (por defecto, el primero que tenga la plantilla)
 *   --stills    saca 4 fotogramas de control y una hoja en studio/out/plantillas/<nombre>/
 *   --render    renderiza studio/out/<nombre>.mp4 (hazlo en el VPS de Bodega o en este equipo)
 *
 * Sin --stills ni --render solo valida: las props se comprueban contra el esquema de la plantilla y, si algo
 * no cuadra, el error nombra el campo. Las props validadas quedan en studio/out/props/<nombre>.json.
 * La media que citen las props (rutas relativas) tiene que estar en studio/public/ de la máquina que renderiza.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { empaquetar } from "./lib/empaquetar.mjs";
import { sheet } from "./lib/hoja.mjs";
import { validar } from "./lib/validar.mjs";
import { availableParallelism } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studio = join(root, "studio");
const require = createRequire(join(studio, "package.json"));
const { bundle } = require("@remotion/bundler");
const { getCompositions, renderStill, selectComposition } = require("@remotion/renderer");

const argv = process.argv.slice(2);
const arg = (n) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const idArg = argv.find((a, i) => !a.startsWith("--") && !(argv[i - 1] ?? "").match(/^--(props|formato|nombre)$/));
const uso = () => {
  console.error("uso: node scripts/plantilla.mjs <id> --props archivo.json [--formato vertical] [--nombre mi-pieza] [--stills] [--render]");
  process.exit(2);
};
if (!idArg || !arg("props")) uso();

const rutaProps = resolve(arg("props"));
if (!existsSync(rutaProps)) {
  console.error(`No existe el archivo de props: ${rutaProps}`);
  process.exit(2);
}
let props;
try {
  props = JSON.parse(readFileSync(rutaProps, "utf8"));
} catch (e) {
  console.error(`El archivo de props no es JSON válido: ${String(e.message ?? e)}`);
  process.exit(2);
}

const id = idArg.startsWith("Plantilla-") ? idArg : `Plantilla-${idArg}`;
const serveUrl = await empaquetar(bundle, join(studio, "src/index.ts"));
const comps = await getCompositions(serveUrl, { logLevel: "error" });
const disponibles = comps.filter((c) => c.id.startsWith(`${id}-`)).map((c) => c.id.slice(id.length + 1));
if (disponibles.length === 0) {
  const ids = [...new Set(comps.filter((c) => c.id.startsWith("Plantilla-")).map((c) => c.id.replace(/-[a-z]+$/, "")))];
  console.error(`No existe la plantilla ${id}. Las que hay:\n  ${ids.join("\n  ")}`);
  process.exit(2);
}
const formato = arg("formato") ?? disponibles[0];
if (!disponibles.includes(formato)) {
  console.error(`${id} no tiene formato ${formato}. Tiene: ${disponibles.join(", ")}`);
  process.exit(2);
}
const compId = `${id}-${formato}`;

// Primero contra el esquema de la plantilla, para que el error nombre el campo.
const ficha = comps.find((c) => c.id === "Interno-Catalogo")?.defaultProps.plantillas.find((p) => p.id === id);
const errores = ficha ? validar(ficha.esquema, props) : [];
if (errores.length > 0) {
  console.error(`Las props no cumplen el esquema de ${id} (${errores.length} ${errores.length === 1 ? "problema" : "problemas"}):`);
  for (const e of errores.slice(0, 25)) console.error(`  - ${e}`);
  console.error(`
Campos y ejemplo: catalogo/CATALOGO.md y catalogo/ejemplos/${id}.json`);
  process.exit(1);
}

// Después Remotion aplica los valores por defecto y calcula la duración con esas props.
let composition;
try {
  composition = await selectComposition({ serveUrl, id: compId, inputProps: props, logLevel: "error" });
} catch (e) {
  const texto = String(e.message ?? e);
  console.error(`Las props no cumplen el esquema de ${id}:\n${texto.split("\n").filter((l) => !l.trim().startsWith("at ")).slice(0, 30).join("\n")}`);
  console.error(`\nCampos y ejemplo: catalogo/CATALOGO.md y catalogo/ejemplos/${id}.json`);
  process.exit(1);
}

const nombre = (arg("nombre") ?? basename(rutaProps).replace(/\.json$/i, "")).replace(/[^A-Za-z0-9._-]/g, "-");
const segundos = (composition.durationInFrames / composition.fps).toFixed(1);
mkdirSync(join(studio, "out/props"), { recursive: true });
const propsGuardadas = join(studio, "out/props", `${nombre}.json`);
writeFileSync(propsGuardadas, `${JSON.stringify(props, null, 2)}\n`);
console.log(`ok    ${compId} · ${segundos} s · ${composition.width}x${composition.height} · props válidas → ${propsGuardadas}`);

if (argv.includes("--stills")) {
  const dir = join(studio, "out/plantillas", nombre);
  mkdirSync(dir, { recursive: true });
  const archivos = [];
  for (const parte of [0.15, 0.4, 0.65, 0.9]) {
    const frame = Math.min(composition.durationInFrames - 1, Math.round(composition.durationInFrames * parte));
    const salida = join(dir, `t${String(Math.round(parte * 100)).padStart(2, "0")}.png`);
    await renderStill({ composition, serveUrl, output: salida, frame, inputProps: props, logLevel: "error" });
    archivos.push(salida);
    console.log(`ok    fotograma al ${Math.round(parte * 100)} % · cuadro ${frame}`);
  }
  if (sheet(archivos, join(dir, "hoja.jpg"), { ancho: 480, cols: 4 })) console.log(`hoja de control → ${join(dir, "hoja.jpg")}`);
}

if (argv.includes("--render")) {
  const salida = join(studio, "out", `${nombre}.mp4`);
  const r = spawnSync(
    "npx",
    ["remotion", "render", "src/index.ts", compId, salida, `--props=${propsGuardadas}`, "--log=error", "--timeout=180000", `--concurrency=${Math.min(4, availableParallelism())}`],
    { cwd: studio, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (r.status !== 0 || !existsSync(salida)) {
    console.error("FALLA el render. Si dice «Page crashed», revisa el espacio en disco y la memoria (kb y studio/src/lib/blur.tsx).");
    process.exit(1);
  }
  console.log(`render → ${salida}\nsigue: bash scripts/master.sh ${salida}`);
}
process.exit(0);
