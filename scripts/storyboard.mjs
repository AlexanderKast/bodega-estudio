#!/usr/bin/env node
/**
 * Hoja de storyboard dibujado (puerta 2): un boceto por beat con su texto debajo. Se arma ANTES de programar,
 * con los bocetos que genera scripts/assets/generar.py y los beats del guion. No usa Remotion.
 *
 *   node scripts/storyboard.mjs <Pieza | ruta.beats.json> [--cols 3] [--fuente ruta.ttf] [--out carpeta]
 *
 * Lee studio/storyboards/<Pieza>.beats.json (o el archivo que se le pase):
 *   { "formato": "horizontal" | "vertical" | "cuadrado",
 *     "bocetos": "assets/<pieza>-boceto",            carpeta bajo studio/public (salida de generar.py)
 *     "beats": [{ "id": "01-olvido", "acto": "problema", "voz": "...", "cue": "olvida",
 *                 "se_ve": "...", "diagrama": "...", "anotacion": "...", "boceto": "01-olvido.png" }] }
 * `boceto` es opcional (por defecto <id>.png). Un beat sin imagen sale con un recuadro gris y se avisa.
 *
 * Deja studio/out/storyboard/<Pieza>/<id>.png (una celda por beat) y hoja.jpg. Necesita ffmpeg con drawtext.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sheet } from "./lib/hoja.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studio = join(root, "studio");
const args = process.argv.slice(2);
const opt = (n) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
const pieza = args.find((a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").startsWith("--"));
if (!pieza) {
  console.error("uso: node scripts/storyboard.mjs <Pieza> [--cols 3] [--fuente ruta.ttf] [--out carpeta]");
  process.exit(2);
}
const archivo = pieza.endsWith(".json") ? resolve(pieza) : join(studio, "storyboards", `${pieza}.beats.json`);
const nombre = pieza.endsWith(".json") ? basename(pieza).replace(/(\.beats)?\.json$/, "") : pieza;
if (!existsSync(archivo)) {
  console.error(`Falta ${archivo} (formato en skills/master-motion/references/storyboard.md)`);
  process.exit(2);
}
const sb = JSON.parse(readFileSync(archivo, "utf8"));
if (!Array.isArray(sb.beats) || !sb.beats.length) {
  console.error(`${archivo} no tiene beats`);
  process.exit(2);
}

// Celda: el boceto arriba y el texto del beat debajo, sobre papel.
const CELDAS = { horizontal: [640, 360, 3], vertical: [420, 746, 4], cuadrado: [520, 520, 3] };
const [ANCHO, ALTO_IMG, COLS] = CELDAS[sb.formato ?? "horizontal"] ?? CELDAS.horizontal;
const LETRA = 18;
const INTERLINEA = 4;
const RENGLON = Math.ceil(LETRA * 1.4) + INTERLINEA; // alto real de un renglón en drawtext: el de la fuente más line_spacing
const MARGEN = 16;
const PAPEL = "0xF4F1EA";
const TINTA = "0x14110D";
const VACIO = "0x8C8A84";

const fuente = [opt("fuente"), process.env.STORYBOARD_FUENTE, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial.ttf"].find((f) => f && existsSync(f));
if (!fuente) {
  console.error("No encontré una fuente .ttf para los textos. Pasa una con --fuente ruta.ttf");
  process.exit(2);
}

// drawtext no parte renglones: se parte aquí por ancho aproximado de letra.
const porRenglon = Math.floor((ANCHO - MARGEN * 2) / (LETRA * 0.5));
const partir = (texto) => {
  const out = [];
  let linea = "";
  for (const palabra of String(texto).split(/\s+/).filter(Boolean)) {
    if (linea && (linea + " " + palabra).length > porRenglon) {
      out.push(linea);
      linea = "   " + palabra;
    } else linea = linea ? `${linea} ${palabra}` : palabra;
  }
  if (linea) out.push(linea);
  return out;
};
const textoDe = (b, i) => {
  const cabeza = [String(i + 1).padStart(2, "0"), b.acto?.toUpperCase(), b.cue ? `cue «${b.cue}»` : null].filter(Boolean).join(" · ");
  return [
    cabeza,
    ...(b.voz ? partir(`VOZ: «${b.voz}»`) : []),
    ...(b.se_ve ? partir(`SE VE: ${b.se_ve}`) : []),
    ...(b.diagrama ? partir(`DIAGRAMA: ${b.diagrama}`) : []),
    ...(b.anotacion ? partir(`ANOTA: ${b.anotacion}`) : []),
  ];
};
const textos = sb.beats.map(textoDe);
const altoTexto = Math.max(...textos.map((t) => t.length)) * RENGLON + MARGEN * 2;
const alto = ALTO_IMG + altoTexto + ((ALTO_IMG + altoTexto) % 2);

const out = resolve(opt("out") ?? join(studio, "out/storyboard", nombre));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// ffmpeg corre dentro de una carpeta temporal con la fuente y el texto al lado: así el filtro no lleva rutas
// con dos puntos (C:/...), que drawtext no acepta sin escapar.
const tmp = mkdtempSync(join(tmpdir(), "storyboard-"));
copyFileSync(fuente, join(tmp, "f.ttf"));

const carpeta = join(studio, "public", sb.bocetos ?? `assets/${nombre.toLowerCase()}-boceto`);
const celdas = [];
let sinBoceto = 0;
let fallas = 0;
sb.beats.forEach((b, i) => {
  const img = join(carpeta, b.boceto ?? `${b.id}.png`);
  const hay = existsSync(img);
  if (!hay) sinBoceto++;
  writeFileSync(join(tmp, "t.txt"), textos[i].join("\n"));
  const entrada = hay ? ["-i", img] : ["-f", "lavfi", "-i", `color=c=${VACIO}:s=${ANCHO}x${ALTO_IMG}`];
  const filtro = [
    `scale=${ANCHO}:${ALTO_IMG}:force_original_aspect_ratio=decrease`,
    `pad=${ANCHO}:${ALTO_IMG}:(ow-iw)/2:(oh-ih)/2:color=0x24231F`,
    `pad=${ANCHO}:${alto}:0:0:color=${PAPEL}`,
    `drawbox=x=0:y=0:w=${ANCHO}:h=${alto}:color=${TINTA}@0.35:t=1`,
    `drawtext=fontfile=f.ttf:textfile=t.txt:expansion=none:x=${MARGEN}:y=${ALTO_IMG + MARGEN}:fontsize=${LETRA}:fontcolor=${TINTA}:line_spacing=${INTERLINEA}`,
  ].join(",");
  const celda = join(out, `${String(i + 1).padStart(2, "0")}-${String(b.id).replace(/[^\w.-]+/g, "_")}.png`);
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", ...entrada, "-vf", filtro, "-frames:v", "1", celda], { cwd: tmp, stdio: "inherit" });
  if (r.status === 0) {
    celdas.push(celda);
    console.log(`${hay ? "ok   " : "aviso"} ${b.id}${hay ? "" : ` · sin boceto (${img})`}`);
  } else {
    fallas++;
    console.log(`FALLA ${b.id}`);
  }
});
rmSync(tmp, { recursive: true, force: true });

const hoja = join(out, "hoja.jpg");
if (celdas.length && sheet(celdas, hoja, { ancho: ANCHO, cols: Number(opt("cols") ?? COLS) })) {
  console.log(`hoja de storyboard → ${hoja} (${celdas.length} beats${sinBoceto ? `, ${sinBoceto} sin boceto` : ""})`);
} else fallas++;
process.exit(fallas ? 1 : 0);
