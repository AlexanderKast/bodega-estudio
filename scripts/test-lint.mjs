#!/usr/bin/env node
// Verifica que motion-lint detecte cada tell del fixture. Sale 0 solo si encuentra todos.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const r = spawnSync(process.execPath, [join(here, "lint-motion.mjs"), join(here, "fixtures")], { encoding: "utf8" });
const expected = ["AI-01", "CURVE-01", "AI-06", "AI-10", "AI-05", "T-01", "AI-24", "AI-21", "AI-20", "AI-07", "AI-22", "AI-02", "F-01", "KIT-01"];
const missing = expected.filter((id) => !r.stdout.includes(` ${id} `));
if (r.status !== 1) console.log(`El linter debía salir con 1 y salió con ${r.status}`);
if (missing.length) console.log(`No detectó: ${missing.join(", ")}\n\n${r.stdout}`);
const ok = r.status === 1 && missing.length === 0;
console.log(ok ? `test-lint: OK (${expected.length} reglas detectadas)` : "test-lint: FALLA");
process.exit(ok ? 0 : 1);
