#!/usr/bin/env node
// Verifica la DB de SFX: cada archivo del índice existe y cada rol de la paleta apunta a un id real.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const pub = join(root, "studio/public");
const db = JSON.parse(readFileSync(join(pub, "sfx-db/index.json"), "utf8"));
const paleta = JSON.parse(readFileSync(join(root, "studio/src/marca/sonido.json"), "utf8"));
const ids = new Set(db.sounds.map((s) => s.id));
const faltanArchivos = db.sounds.filter((s) => !existsSync(join(pub, s.file))).map((s) => s.file);
const faltanIds = Object.entries(paleta.roles).filter(([, id]) => !ids.has(id));
const sinNivel = Object.keys(paleta.roles).filter((r) => typeof paleta.niveles_db[r] !== "number");
for (const f of faltanArchivos.slice(0, 10)) console.log(`FALTA archivo ${f}`);
for (const [r, id] of faltanIds) console.log(`FALTA en la DB el id de la paleta: ${r} → ${id}`);
for (const r of sinNivel) console.log(`FALTA nivel en la paleta para el rol ${r}`);
const ok = !faltanArchivos.length && !faltanIds.length && !sinNivel.length;
console.log(`sfx-db: ${db.count} sonidos · paleta ${Object.keys(paleta.roles).length - faltanIds.length}/${Object.keys(paleta.roles).length} roles${ok ? " · OK" : " · FALLA"}`);
process.exit(ok ? 0 : 1);
