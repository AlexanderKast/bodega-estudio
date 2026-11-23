#!/usr/bin/env node
// Verifica que motion-audit detecte cada tell de la composición de prueba Test-AuditMalo.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const r = spawnSync(process.execPath, [join(here, "motion-audit.mjs"), "--comp", "Test-AuditMalo-horizontal", "--genre", "anuncio"], { encoding: "utf8" });
const expected = ["AI-02", "AI-04", "AI-11", "D-01", "S-01", "S-02", "S-04", "B-01"];
const missing = expected.filter((id) => !r.stdout.includes(` ${id} `));
if (r.status !== 1) console.log(`La auditoría debía salir con 1 y salió con ${r.status}\n${r.stderr}`);
if (missing.length) console.log(`No detectó: ${missing.join(", ")}\n\n${r.stdout}`);
const ok = r.status === 1 && missing.length === 0;
console.log(ok ? `test-audit: OK (${expected.length} reglas detectadas)` : "test-audit: FALLA");
process.exit(ok ? 0 : 1);
