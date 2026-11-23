#!/usr/bin/env node
/**
 * Busca en la DB de SFX (studio/public/sfx-db/index.json).
 *
 *   node scripts/sfx-db/buscar.mjs whoosh                 por palabra (id, categoría, rol o descripción)
 *   node scripts/sfx-db/buscar.mjs --rol hit --max 0.5    por rol y duración máxima en segundos
 *   node scripts/sfx-db/buscar.mjs --roles                lista los roles con cuántos sonidos tiene cada uno
 *
 * Copia el `id` en `sfx(frame, rol, cuadro, { id })` o en studio/src/marca/sonido.json.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const db = JSON.parse(readFileSync(join(root, "studio/public/sfx-db/index.json"), "utf8"));
const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (args.includes("--roles")) {
  const count = {};
  for (const s of db.sounds) for (const r of s.roles) count[r] = (count[r] ?? 0) + 1;
  for (const [r, n] of Object.entries(count).sort((a, b) => b[1] - a[1])) console.log(`${r.padEnd(14)} ${n}`);
  process.exit(0);
}

const rol = opt("rol");
const max = opt("max") ? Number(opt("max")) : Infinity;
const palabras = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--"))).map((a) => a.toLowerCase());
const hits = db.sounds.filter(
  (s) =>
    (!rol || s.roles.includes(rol)) &&
    s.dur_s <= max &&
    palabras.every((p) => `${s.id} ${s.category} ${s.roles.join(" ")} ${s.desc}`.toLowerCase().includes(p)),
);
for (const s of hits.slice(0, 40)) {
  console.log(`${s.id.padEnd(38)} ${String(s.dur_s).padStart(6)} s  ${s.roles.join(",").padEnd(18)} ${s.license.padEnd(4)} ${(s.desc || "").slice(0, 70)}`);
}
console.log(`\n${hits.length} de ${db.count} sonidos${hits.length > 40 ? " (se muestran 40)" : ""}`);
