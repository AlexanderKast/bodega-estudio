#!/usr/bin/env node
/**
 * Checklist de cierre (kb/12 §3 paso 7): todo lo que tiene que pasar antes de mostrar o entregar.
 *
 *   node scripts/verify.mjs            tipos, linter, pruebas de las herramientas, KB y auditoría dinámica
 *   node scripts/verify.mjs --fast     sin auditoría dinámica (la que renderiza)
 *   node scripts/verify.mjs --genre vsl --comp MiVsl-vertical
 *                                      además audita esa composición con la densidad de su género
 *   node scripts/verify.mjs --render studio/out/mi-pieza.mp4 [--genre explainer] [--host vps]
 *                                      además mide ese render con scripts/critica/medir-pieza.sh (flujo óptico);
 *                                      funciona también con --fast. Los hallazgos no tumban el verify: los
 *                                      confirma el agente critico-motion mirando las tiras (kb/10 §6.1).
 *
 * Sale 1 en el primer paso que falle.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const fast = argv.includes("--fast");
const opt = (name) => (argv.includes(`--${name}`) ? argv[argv.indexOf(`--${name}`) + 1] : undefined);
const render = opt("render");
const host = opt("host");
// --render y --host son de la medición; lo demás (--genre, --comp) pasa a la auditoría dinámica.
const solo_medicion = ["--render", "--host"];
const passthrough = argv.filter((a, i) => a !== "--fast" && !solo_medicion.includes(a) && !solo_medicion.includes(argv[i - 1]));
const node = process.execPath;
const s = (f) => join(root, "scripts", f);

const steps = [
  ["Tipos (tsc)", node, [join(root, "studio/node_modules/typescript/bin/tsc"), "--noEmit"], join(root, "studio")],
  ["Linter anti-look-IA", node, [s("lint-motion.mjs")]],
  ["Prueba del linter", node, [s("test-lint.mjs")]],
  ["KB con fuentes", node, [s("check-kb.mjs")]],
  ["DB de SFX y paleta", node, [s("sfx-db/check.mjs")]],
  ["Catálogo al día", node, [s("catalogo.mjs"), "--check"]],
  ...(fast
    ? []
    : [
        ["Prueba de la auditoría", node, [s("test-audit.mjs")]],
        ["Auditoría dinámica", node, [s("motion-audit.mjs"), ...passthrough]],
      ]),
  ...(render
    ? [
        [
          "Medición del render",
          "bash",
          [
            "scripts/critica/medir-pieza.sh",
            render,
            ...(opt("genre") ? ["--genre", opt("genre")] : []),
            ...(host ? ["--host", host] : []),
          ],
        ],
      ]
    : []),
];

for (const [name, cmd, args, cwd = root] of steps) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.status !== 0) {
    console.log(`FALLA ${name} (${secs} s)\n${r.stdout}${r.stderr}`);
    process.exit(1);
  }
  const lines = r.stdout.trim().split("\n");
  // La medición cierra con la ruta de resultados; su resumen es la línea que empieza por "medir-pieza".
  const last = (lines.findLast((l) => l.startsWith("medir-pieza ")) || lines.pop() || "ok").trim();
  console.log(`ok    ${name.padEnd(24)} ${secs.padStart(5)} s  ${last}`);
}
console.log("\nverify: todo en verde");
