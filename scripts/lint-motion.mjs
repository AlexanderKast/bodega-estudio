#!/usr/bin/env node
/**
 * motion-lint: detecta en el código los "tells" de motion hecho con IA (kb/10-anti-look-ia.md)
 * y las reglas de easing y tiempos (kb/01 §4, kb/02 §6).
 *
 * Uso:   node scripts/lint-motion.mjs [ruta=studio/src]
 * Sale 1 si hay algún error o warning; los "info" no bloquean.
 * Para excepciones justificadas, en la misma línea o la anterior:
 *   // motion-lint-disable AI-01: drift ambiental, lineal a propósito
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "studio", "package.json"));
const ts = require("typescript");

// Tabla de curvas permitidas (kb/01 §2). Cualquier Easing.bezier literal fuera de aquí avisa.
const TOKENS = [
  [0.16, 1, 0.3, 1], [0.22, 1, 0.36, 1], [0.33, 1, 0.68, 1], [0.7, 0, 0.84, 0], [0.64, 0, 0.78, 0],
  [0.65, 0, 0.35, 1], [0.85, 0, 0.15, 1], [0.45, 0, 0.55, 1], [0.333, 0, 0.667, 1],
  [0.34, 1.56, 0.64, 1], [0.36, 0, 0.66, -0.56],
];
const GENERIC_FONTS = /^(inter|roboto|arial|helvetica|system-ui|sans-serif|-apple-system)(\s*,.*)?$/i;
const PURE_BG = /^(#000|#000000|#fff|#ffffff|black|white)$/i;
const CSS_EASE = /^(ease|ease-in|ease-out|ease-in-out)$/;

const target = resolve(process.argv[2] ?? join(root, "studio", "src"));
const files = [];
const walk = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const f of readdirSync(p)) if (f !== "node_modules") walk(join(p, f));
  } else if (/\.(tsx?|jsx?)$/.test(p)) files.push(p);
};
walk(target);

const findings = [];

// F-01: familias cargadas en el proyecto (google-fonts, @remotion/fonts o @font-face).
// Se buscan en todo studio/src, aunque se lintee una sola carpeta.
const loadedFamilies = new Set();
const scanFonts = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const f of readdirSync(p)) if (f !== "node_modules") scanFonts(join(p, f));
    return;
  }
  if (!/\.(tsx?|jsx?|css)$/.test(p)) return;
  const t = readFileSync(p, "utf8");
  for (const m of t.matchAll(/@remotion\/google-fonts\/([A-Za-z0-9]+)/g)) {
    loadedFamilies.add(m[1].replace(/([a-z])([A-Z0-9])/g, "$1 $2").toLowerCase());
  }
  for (const m of t.matchAll(/(?:family|font-family)\s*[:=]\s*["'`]([^"'`]+)["'`]/g)) loadedFamilies.add(m[1].trim().toLowerCase());
};
scanFonts(join(root, "studio", "src"));
if (resolve(target) !== resolve(join(root, "studio", "src"))) scanFonts(target);

const hue = (hex) => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return null;
  const d = max - min;
  let x = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  x *= 60;
  return x < 0 ? x + 360 : x;
};

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rel = relative(root, file).replaceAll("\\", "/");
  const isKit = rel.endsWith("lib/motion.ts");
  const enLib = rel.includes("/src/lib/");

  const disabled = (line, id) => {
    const here = lines[line] ?? "";
    const prev = lines[line - 1] ?? "";
    const re = new RegExp(`motion-lint-disable[^\\n]*\\b${id}\\b`);
    return re.test(here) || re.test(prev);
  };
  const report = (node, id, level, msg) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
    if (disabled(line, id)) return;
    findings.push({ file: rel, line: line + 1, id, level, msg });
  };
  const num = (n) => {
    if (ts.isNumericLiteral(n)) return Number(n.text);
    if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(n.operand)) return -Number(n.operand.text);
    return null;
  };
  const strOf = (n) => (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ? n.text : ts.isTemplateExpression(n) ? n.getText(sf) : null);
  const propName = (p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null);

  let backdropCount = 0;

  const visit = (node) => {
    // ── Llamadas ──
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sf);
      const args = node.arguments;

      // AI-01: interpolate() alimentado por el frame sin easing = movimiento lineal.
      if (callee === "interpolate" && args.length >= 3 && /frame/i.test(args[0].getText(sf))) {
        const opts = args[3];
        const hasEasing = opts && ts.isObjectLiteralExpression(opts) && opts.properties.some((p) => propName(p) === "easing");
        if (!hasEasing) report(node, "AI-01", "error", "interpolate() sobre el frame sin easing: es lineal. Usa arrive()/tween() o un token de curves.");
        // KIT-01: con easing pero fuera del kit, la auditoría dinámica no ve ese movimiento.
        else if (!enLib) report(node, "KIT-01", "warning", "interpolate() directo sobre el frame: la auditoría no lo ve. Usa tween()/arrive() de lib/motion o track() de lib/timeline.");
      }

      // Curvas fuera de la tabla de tokens.
      if (/Easing\.bezier$/.test(callee) && args.length === 4) {
        const v = args.map(num);
        if (v.every((x) => x !== null) && !TOKENS.some((t) => t.every((x, i) => Math.abs(x - v[i]) < 1e-3))) {
          report(node, "CURVE-01", "warning", `Easing.bezier(${v.join(", ")}) no está en la tabla de curvas (kb/01 §2).`);
        }
      }

      // AI-06: Easing.ease / Easing.inOut(Easing.ease).
      if (/^Easing\.(inOut|in|out)$/.test(callee) && args[0] && /Easing\.ease\b/.test(args[0].getText(sf))) {
        report(node, "AI-06", "warning", `${node.getText(sf)} es el ease genérico de CSS. Usa un token (arrive/leave/move).`);
      }

      // AI-05: salida con curva de entrada y viceversa.
      if ((callee === "leave" || callee === "arrive") && args[3] && ts.isStringLiteral(args[3])) {
        const c = args[3].text;
        if (callee === "leave" && /^(arrive|overshoot)/.test(c)) report(node, "AI-05", "warning", `leave() con curva "${c}": las salidas usan curvas -in.`);
        if (callee === "arrive" && /^(leave|anticipate)/.test(c)) report(node, "AI-05", "warning", `arrive() con curva "${c}": las entradas usan curvas -out.`);
      }

      // T-01: duración de entrada/salida fuera de [3, 30] f a 30 fps (kb/02 §6).
      if ((callee === "arrive" || callee === "leave" || callee === "progress") && args[2]) {
        const d = num(args[2]);
        if (d !== null && (d < 3 || d > 30)) report(node, "T-01", "warning", `${callee}() de ${d} f: fuera de [3, 30] f para entradas/salidas (kb/02).`);
      }
    }

    // ── Literales de string ──
    const s = strOf(node);
    if (s !== null) {
      if (CSS_EASE.test(s) && node.parent && (ts.isPropertyAssignment(node.parent) || ts.isJsxAttribute(node.parent))) {
        report(node, "AI-06", "warning", `Easing CSS "${s}": delata trabajo sin intención.`);
      }
      if (/scale\(\s*0\s*\)/.test(s)) report(node, "AI-07", "warning", "scale(0): no escalar desde cero; arrancar en 0.6–0.96.");
      const grad = s.match(/linear-gradient\(([^)]*)\)/);
      if (grad) {
        const hexes = grad[1].match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? [];
        if (hexes.length >= 2) {
          const h1 = hue(hexes[0]);
          const h2 = hue(hexes[hexes.length - 1]);
          if (h1 !== null && h2 !== null && h1 >= 255 && h1 <= 295 && h2 >= 185 && h2 <= 235) {
            report(node, "AI-20", "warning", `Gradiente morado→azul (${hexes[0]} → ${hexes[hexes.length - 1]}): look "VibeCode". Deriva la paleta de la marca.`);
          }
        }
      }
    }

    // ── Propiedades de estilo ──
    if (ts.isPropertyAssignment(node)) {
      const name = propName(node);
      const val = strOf(node.initializer);
      if (name === "fontFamily" && val !== null && GENERIC_FONTS.test(val.trim())) {
        report(node, "AI-21", "warning", `fontFamily "${val}": fuente genérica. Usa las fuentes de la marca.`);
      } else if (name === "fontFamily" && val !== null && !val.includes("${")) {
        const first = val.split(",")[0].trim().replace(/^["']|["']$/g, "").toLowerCase();
        if (first && !loadedFamilies.has(first)) {
          report(node, "F-01", "error", `fontFamily "${val}" no está cargada (google-fonts, @remotion/fonts o @font-face): el render caería a otra fuente.`);
        }
      }
      if ((name === "background" || name === "backgroundColor") && val !== null && PURE_BG.test(val.trim())) {
        report(node, "AI-24", "warning", `Fondo ${val} puro: usa un negro/blanco con temperatura (#0E0C0A, #F4F1EA).`);
      }
      if (name === "backdropFilter") {
        backdropCount++;
        if (backdropCount === 2) report(node, "AI-22", "warning", "Más de un backdropFilter en el archivo: glassmorphism por defecto.");
      }
    }

    // AI-10: spring con rebote excesivo (ζ < 0.35).
    if (ts.isObjectLiteralExpression(node) && !isKit) {
      const get = (k) => {
        const p = node.properties.find((x) => ts.isPropertyAssignment(x) && propName(x) === k);
        return p ? num(p.initializer) : undefined;
      };
      const damping = get("damping");
      if (typeof damping === "number" && (get("stiffness") !== undefined || get("mass") !== undefined)) {
        const stiffness = get("stiffness") ?? 100;
        const mass = get("mass") ?? 1;
        const z = damping / (2 * Math.sqrt(stiffness * mass));
        if (z < 0.35) report(node, "AI-10", "warning", `Spring con ζ=${z.toFixed(2)} (< 0.35): rebote de juguete. Usa springs.pop o critical.`);
      }
    }

    // AI-02: ≥ 3 hermanos JSX con el mismo delay literal = todo entra a la vez.
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const counts = new Map();
      for (const child of node.children) {
        const el = ts.isJsxElement(child) ? child.openingElement : ts.isJsxSelfClosingElement(child) ? child : null;
        if (!el) continue;
        for (const a of el.attributes.properties) {
          if (ts.isJsxAttribute(a) && a.name.getText(sf) === "delay" && a.initializer && ts.isJsxExpression(a.initializer) && a.initializer.expression) {
            const v = num(a.initializer.expression);
            if (v !== null) counts.set(v, [...(counts.get(v) ?? []), a]);
          }
        }
      }
      for (const [v, attrs] of counts) {
        if (attrs.length >= 3) report(attrs[0], "AI-02", "warning", `${attrs.length} elementos hermanos con delay={${v}}: todo entra a la vez. Escalona 2–5 f.`);
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const order = { error: 0, warning: 1, info: 2 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.file.localeCompare(b.file) || a.line - b.line);
for (const f of findings) console.log(`${f.file}:${f.line}  ${f.level.padEnd(7)} ${f.id.padEnd(8)} ${f.msg}`);
const blocking = findings.filter((f) => f.level !== "info").length;
console.log(`\nmotion-lint: ${files.length} archivos · ${findings.filter((f) => f.level === "error").length} errores · ${findings.filter((f) => f.level === "warning").length} warnings · ${findings.filter((f) => f.level === "info").length} info`);
process.exit(blocking > 0 ? 1 : 0);
