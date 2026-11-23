#!/usr/bin/env node
// Verifica que cada archivo de kb/ (menos README) cierre con "## Fuentes" y ≥ 3 fuentes con URL y fecha.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const kb = join(dirname(fileURLToPath(import.meta.url)), "..", "kb");
const files = readdirSync(kb).filter((f) => f.endsWith(".md") && f !== "README.md");
let bad = 0;
for (const f of files) {
  const text = readFileSync(join(kb, f), "utf8");
  const idx = text.lastIndexOf("## Fuentes");
  const sources = idx < 0 ? [] : text.slice(idx).split(/\r?\n/).filter((l) => /https?:\/\//.test(l) && /\d{4}-\d{2}-\d{2}/.test(l));
  const ok = sources.length >= 3;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FALLA"} ${f.padEnd(32)} ${sources.length} fuentes con URL y fecha`);
}
console.log(`\ncheck-kb: ${files.length} archivos · ${bad} con problemas`);
process.exit(bad || files.length === 0 ? 1 : 0);
