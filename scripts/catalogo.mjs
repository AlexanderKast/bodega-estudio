#!/usr/bin/env node
/**
 * Catálogo de plantillas y presets, generado desde el código.
 *
 *   node scripts/catalogo.mjs                 escribe catalogo/ (JSON, ejemplos de props, CATALOGO.md, index.html)
 *                                             y las tablas de kb/14-plantillas.md y del README
 *   node scripts/catalogo.mjs --check         no escribe: sale 1 si lo que hay en disco quedó viejo
 *   node scripts/catalogo.mjs --miniaturas    además renderiza catalogo/miniaturas/<id>.jpg (en el VPS de Bodega o en este equipo)
 *   node scripts/catalogo.mjs --miniaturas Plantilla-Molde,MaskTitle     solo esas
 *   node scripts/catalogo.mjs --videos        además renderiza catalogo/videos/<id>.mp4, el ejemplo en movimiento
 *                                             de cada plantilla y preset (en el VPS de Bodega o en este equipo; acepta la misma lista)
 *
 * La fuente es lo que cada plantilla declara en `studio/src/plantillas/<id>/` (resumen, cuándo usarla, formatos y
 * esquema zod) y `studio/src/compositions/presets.manifest.json`. Nada del catálogo se escribe a mano: para
 * cambiar una descripción se edita la plantilla o el manifiesto y se vuelve a correr este script.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { empaquetar } from "./lib/empaquetar.mjs";
import { availableParallelism } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studio = join(root, "studio");
const require = createRequire(join(studio, "package.json"));
const { bundle } = require("@remotion/bundler");
const { getCompositions, renderMedia, renderStill } = require("@remotion/renderer");

const argv = process.argv.slice(2);
const check = argv.includes("--check");
const conMiniaturas = argv.includes("--miniaturas");
const soloMini = conMiniaturas ? (argv[argv.indexOf("--miniaturas") + 1] ?? "") : "";
const filtroMini = soloMini && !soloMini.startsWith("--") ? soloMini.split(",") : null;
const conVideos = argv.includes("--videos");
const soloVideo = conVideos ? (argv[argv.indexOf("--videos") + 1] ?? "") : "";
const filtroVideo = soloVideo && !soloVideo.startsWith("--") ? soloVideo.split(",") : null;

const PROPORCION = { vertical: "9:16", retrato: "4:5", cuadrado: "1:1", horizontal: "16:9" };

// ── Datos ────────────────────────────────────────────────────────────────────────────────────────
const serveUrl = await empaquetar(bundle, join(studio, "src/index.ts"));
const comps = await getCompositions(serveUrl, { logLevel: "error" });
const interno = comps.find((c) => c.id === "Interno-Catalogo");
if (!interno) {
  console.error("No encontré la composición Interno-Catalogo (studio/src/Root.tsx).");
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(join(studio, "src/compositions/presets.manifest.json"), "utf8"));

const corto = (v) => {
  const s = JSON.stringify(v);
  return s === undefined ? "" : s.length > 60 ? `${s.slice(0, 57)}…` : s;
};
/** Tipo legible de un nodo de JSON Schema. */
const tipoDe = (n) => {
  if (!n || typeof n !== "object") return "cualquiera";
  if (n.enum) return n.enum.map((e) => JSON.stringify(e)).join(" | ");
  if (n.const !== undefined) return JSON.stringify(n.const);
  if (n.anyOf) return [...new Set(n.anyOf.map(tipoDe))].join(" o ");
  if (n.type === "array") return `lista de ${n.items?.type === "object" ? "objetos" : tipoDe(n.items)}`;
  if (n.type === "object") return "objeto";
  if (n.type === "string") return "texto";
  if (n.type === "number" || n.type === "integer") return "número";
  if (n.type === "boolean") return "sí/no";
  return n.type ?? "cualquiera";
};
/** Campos de un objeto del esquema; baja un nivel en objetos y en listas de objetos. */
const camposDe = (n, nivel = 0) => {
  if (!n?.properties) return [];
  const obligatorios = new Set(n.required ?? []);
  return Object.entries(n.properties).map(([nombre, v]) => {
    const interior = v.type === "array" && v.items?.type === "object" ? v.items : v.type === "object" ? v : null;
    return {
      nombre,
      // `zColor()` de Remotion marca sus campos con esta descripción interna.
      tipo: v.description === "__remotion-color" ? "color (hex)" : tipoDe(v),
      obligatorio: obligatorios.has(nombre),
      ...(v.default !== undefined ? { defecto: corto(v.default) } : {}),
      ...(v.description && v.description !== "__remotion-color" ? { descripcion: v.description } : {}),
      ...(interior && nivel < 1 ? { campos: camposDe(interior, nivel + 1) } : {}),
    };
  });
};

const plantillas = interno.defaultProps.plantillas.map((p) => ({
  id: p.id,
  resumen: p.resumen,
  cuando: p.cuando,
  fuente: p.fuente,
  formatos: p.formatos,
  composiciones: p.formatos.map((f) => `${p.id}-${f}`),
  segundos: p.segundos,
  campos: camposDe(p.esquema),
  ejemplo: `catalogo/ejemplos/${p.id}.json`,
  miniatura: `catalogo/miniaturas/${p.id}.jpg`,
  video: `catalogo/videos/${p.id}.mp4`,
  invocar: `/mm-plantilla ${p.id}`,
}));
const presets = manifest.map((m) => ({
  id: m.id,
  grupo: m.grupo,
  resumen: m.resumen,
  composicion: `Preset-${m.id}-horizontal`,
  segundos: Math.round((m.duration / 30) * 10) / 10,
  miniatura: `catalogo/miniaturas/Preset-${m.id}.jpg`,
  video: `catalogo/videos/Preset-${m.id}.mp4`,
}));
const grupos = [...new Set(presets.map((p) => p.grupo))];

// ── Salidas de texto ─────────────────────────────────────────────────────────────────────────────
const json = (v) => `${JSON.stringify(v, null, 2)}\n`;
const proporciones = (p) => p.formatos.map((f) => PROPORCION[f] ?? f).join(", ");
const lineaCampo = (c, sangria = "") =>
  `${sangria}- \`${c.nombre}\` · ${c.tipo}${c.obligatorio ? " · obligatorio" : ""}${c.defecto ? ` · por defecto ${c.defecto}` : ""}${c.descripcion ? ` · ${c.descripcion}` : ""}`;

const md = [
  "# Catálogo de Bodega Estudio",
  "",
  "Generado por `node scripts/catalogo.mjs`. No lo edites a mano: cambia la plantilla o el manifiesto y vuelve a generarlo.",
  "",
  `## Plantillas (${plantillas.length})`,
  "",
  "Una plantilla es una pieza completa a la que se le cambia el contenido por props. Se invoca con",
  "`/mm-plantilla <id>` o con `node scripts/plantilla.mjs <id> --props archivo.json`.",
  "",
  "| Plantilla | Para qué | Formatos | Duración de muestra |",
  "|---|---|---|---|",
  ...plantillas.map((p) => `| \`${p.id}\` | ${p.cuando} | ${proporciones(p)} | ${p.segundos} s |`),
  "",
  ...plantillas.flatMap((p) => [
    `### ${p.id}`,
    "",
    p.resumen,
    "",
    `- **Cuándo usarla:** ${p.cuando}`,
    `- **Formatos:** ${proporciones(p)} (${p.composiciones.map((c) => `\`${c}\``).join(", ")})`,
    `- **Ejemplo de props:** \`${p.ejemplo}\``,
    `- **Origen:** ${p.fuente}`,
    "",
    "Campos:",
    "",
    ...p.campos.flatMap((c) => [lineaCampo(c), ...(c.campos ?? []).map((s) => lineaCampo(s, "  "))]),
    "",
  ]),
  `## Presets (${presets.length})`,
  "",
  "Un preset es una pieza suelta (un titular, una transición, una anotación) para armar composiciones propias.",
  "Cada uno tiene su escena de muestra `Preset-<Id>-horizontal`.",
  "",
  ...grupos.flatMap((g) => [
    `### ${g}`,
    "",
    "| Preset | Qué hace |",
    "|---|---|",
    ...presets.filter((p) => p.grupo === g).map((p) => `| \`${p.id}\` | ${p.resumen} |`),
    "",
  ]),
].join("\n");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// El ejemplo en movimiento: la miniatura hace de póster y el video se carga al pasar el cursor o al tocar.
const muestra = (nombre, etiqueta) =>
  `<video class="muestra" muted loop playsinline preload="none" poster="miniaturas/${nombre}.jpg" src="videos/${nombre}.mp4" aria-label="${esc(etiqueta)}" tabindex="0"></video>`;
const tarjetaPlantilla = (p) => `
      <article class="tarjeta" data-texto="${esc(`${p.id} ${p.resumen} ${p.cuando}`.toLowerCase())}">
        ${muestra(p.id, `Ejemplo de ${p.id.replace("Plantilla-", "")}`)}
        <div class="cuerpo">
          <h3>${esc(p.id.replace("Plantilla-", ""))}</h3>
          <p>${esc(p.resumen)}</p>
          <p class="cuando"><strong>Úsala para:</strong> ${esc(p.cuando)}</p>
          <p class="meta">${esc(proporciones(p))} · muestra de ${p.segundos} s</p>
          <code>${esc(p.invocar)}</code>
          <details>
            <summary>Campos (${p.campos.length})</summary>
            <ul>${p.campos
              .map(
                (c) =>
                  `<li><code>${esc(c.nombre)}</code> <span>${esc(c.tipo)}</span>${c.descripcion ? ` <em>${esc(c.descripcion)}</em>` : ""}${
                    c.campos ? `<ul>${c.campos.map((s) => `<li><code>${esc(s.nombre)}</code> <span>${esc(s.tipo)}</span></li>`).join("")}</ul>` : ""
                  }</li>`,
              )
              .join("")}</ul>
          </details>
        </div>
      </article>`;
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Catálogo Bodega Estudio</title>
<style>
  :root { --fondo: #f6f4ee; --panel: #ffffff; --texto: #1c1b17; --suave: #6a675e; --linea: #dedacd; --acento: #3f6212; }
  @media (prefers-color-scheme: dark) { :root { --fondo: #0b0d09; --panel: #141810; --texto: #f2f5e8; --suave: #a3aa96; --linea: #2a3122; --acento: #a3e635; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--fondo); color: var(--texto); font: 16px/1.5 system-ui, sans-serif; }
  header, main { max-width: 1180px; margin: 0 auto; padding: 24px 16px; }
  h1 { font-size: 28px; margin: 0 0 4px; } h2 { font-size: 20px; margin: 40px 0 12px; } h3 { font-size: 17px; margin: 0 0 6px; }
  header p { color: var(--suave); margin: 0 0 16px; }
  input { width: 100%; max-width: 420px; padding: 10px 12px; border: 1px solid var(--linea); border-radius: 8px; background: var(--panel); color: inherit; font: inherit; }
  .rejilla { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .tarjeta { background: var(--panel); border: 1px solid var(--linea); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
  .muestra { display: block; width: 100%; background: #0b0d09; cursor: zoom-in; }
  .tarjeta .muestra { aspect-ratio: 9 / 16; max-height: 420px; object-fit: contain; }
  .cuerpo { padding: 14px; } .cuerpo p { margin: 0 0 8px; font-size: 14px; }
  .cuando, .meta { color: var(--suave); } .meta { font-size: 13px; }
  code { font: 13px ui-monospace, monospace; color: var(--acento); overflow-wrap: anywhere; }
  details { margin-top: 10px; font-size: 13px; } summary { cursor: pointer; color: var(--suave); }
  details ul { padding-left: 18px; margin: 6px 0; } details span { color: var(--suave); } details em { color: var(--suave); }
  .presets { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
  .preset { background: var(--panel); border: 1px solid var(--linea); border-radius: 10px; overflow: hidden; font-size: 13px; }
  .preset .muestra { aspect-ratio: 16 / 9; object-fit: cover; }
  dialog { border: 0; padding: 0; background: #0b0d09; border-radius: 12px; max-width: 94vw; max-height: 94vh; overflow: hidden; }
  dialog::backdrop { background: rgba(0, 0, 0, 0.78); }
  dialog video { display: block; max-width: 94vw; max-height: 94vh; }
  .ayuda { font-size: 14px; }
  .preset div { padding: 8px 10px; } .preset strong { display: block; } .preset span { color: var(--suave); }
  [hidden] { display: none !important; }
</style>
</head>
<body>
<header>
  <h1>Catálogo Bodega Estudio</h1>
  <p>${plantillas.length} plantillas y ${presets.length} presets. Generado desde el código con <code>node scripts/catalogo.mjs</code>.</p>
  <p class="ayuda">Pasa el cursor sobre un ejemplo para verlo en movimiento. Clic para verlo grande.</p>
  <input id="buscar" type="search" placeholder="Buscar: tutorial, producto, antes y después…" aria-label="Buscar en el catálogo">
</header>
<main>
  <h2>Plantillas</h2>
  <div class="rejilla">${plantillas.map(tarjetaPlantilla).join("")}
  </div>
${grupos
  .map(
    (g) => `  <h2>Presets · ${esc(g)}</h2>
  <div class="presets">${presets
    .filter((p) => p.grupo === g)
    .map(
      (p) => `
    <div class="preset" data-texto="${esc(`${p.id} ${p.resumen} ${g}`.toLowerCase())}">${muestra(`Preset-${p.id}`, `Ejemplo de ${p.id}`)}<div><strong>${esc(p.id)}</strong><span>${esc(p.resumen)}</span></div></div>`,
    )
    .join("")}
  </div>`,
  )
  .join("\n")}
</main>
<dialog id="grande" aria-label="Ejemplo ampliado"><video controls loop muted playsinline></video></dialog>
<script>
  const buscar = document.getElementById("buscar");
  buscar.addEventListener("input", () => {
    const q = buscar.value.trim().toLowerCase();
    for (const el of document.querySelectorAll("[data-texto]")) el.hidden = q !== "" && !el.dataset.texto.includes(q);
  });
  const grande = document.getElementById("grande");
  const videoGrande = grande.querySelector("video");
  for (const v of document.querySelectorAll("video.muestra")) {
    const tocar = () => v.play().catch(() => {});
    const parar = () => { v.pause(); v.currentTime = 0; };
    v.addEventListener("mouseenter", tocar);
    v.addEventListener("focus", tocar);
    v.addEventListener("mouseleave", parar);
    v.addEventListener("blur", parar);
    const abrir = () => { videoGrande.src = v.currentSrc || v.src; grande.showModal(); videoGrande.play().catch(() => {}); };
    v.addEventListener("click", abrir);
    v.addEventListener("keydown", (e) => { if (e.key === "Enter") abrir(); });
  }
  grande.addEventListener("click", (e) => { if (e.target === grande) grande.close(); });
  grande.addEventListener("close", () => { videoGrande.pause(); videoGrande.removeAttribute("src"); videoGrande.load(); });
</script>
</body>
</html>
`;

// Tablas que viven dentro de otros documentos, entre marcadores.
const tablaKb = [
  "| Plantilla | Para qué | Formatos | Qué hace |",
  "| --- | --- | --- | --- |",
  ...plantillas.map((p) => `| \`${p.id}\` | ${p.cuando} | ${proporciones(p)} | ${p.resumen} |`),
].join("\n");
const tablaReadme = ["| Grupo | Presets |", "|---|---|", ...grupos.map((g) => `| ${g} | ${presets.filter((p) => p.grupo === g).map((p) => p.id).join(" · ")} |`)].join("\n");
const entreMarcas = (archivo, nombre, contenido) => {
  const ruta = join(root, archivo);
  const texto = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
  const ini = `<!-- catalogo:${nombre} -->`;
  const fin = `<!-- /catalogo:${nombre} -->`;
  const a = texto.indexOf(ini);
  const b = texto.indexOf(fin);
  if (a < 0 || b < a) {
    console.error(`${archivo}: faltan los marcadores ${ini} … ${fin}`);
    process.exit(2);
  }
  return `${texto.slice(0, a + ini.length)}\n${contenido}\n${texto.slice(b)}`;
};

const salidas = new Map([
  ["catalogo/plantillas.json", json(plantillas)],
  ["catalogo/presets.json", json(presets)],
  ["catalogo/CATALOGO.md", `${md}\n`],
  ["catalogo/index.html", html],
  ...interno.defaultProps.plantillas.map((p) => [`catalogo/ejemplos/${p.id}.json`, json(p.ejemplo)]),
  ["kb/14-plantillas.md", entreMarcas("kb/14-plantillas.md", "plantillas", tablaKb)],
  ["README.md", entreMarcas("README.md", "presets", tablaReadme)],
]);

const viejos = [];
for (const [archivo, contenido] of salidas) {
  const ruta = join(root, archivo);
  const actual = existsSync(ruta) ? readFileSync(ruta, "utf8").replace(/\r\n/g, "\n") : null;
  if (actual === contenido) continue;
  viejos.push(archivo);
  if (!check) {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, contenido);
  }
}
if (check) {
  if (viejos.length > 0) {
    console.error(`catalogo: quedó viejo (${viejos.join(", ")}). Corre: node scripts/catalogo.mjs`);
    process.exit(1);
  }
  console.log(`catalogo: al día · ${plantillas.length} plantillas · ${presets.length} presets`);
  process.exit(0);
}
console.log(`catalogo: ${plantillas.length} plantillas · ${presets.length} presets · ${viejos.length} archivos escritos`);

// ── Miniaturas (render: el VPS de Bodega) ───────────────────────────────────────────────────────────
if (conMiniaturas) {
  const dir = join(root, "catalogo/miniaturas");
  mkdirSync(dir, { recursive: true });
  const trabajos = [
    ...plantillas.map((p) => ({ nombre: p.id, comp: p.composiciones[0], cuadro: null })),
    ...manifest.map((m) => ({ nombre: `Preset-${m.id}`, comp: `Preset-${m.id}-horizontal`, cuadro: m.still })),
  ].filter((t) => !filtroMini || filtroMini.includes(t.nombre) || filtroMini.includes(t.nombre.replace("Preset-", "")));
  let fallas = 0;
  for (const t of trabajos) {
    const composition = comps.find((c) => c.id === t.comp);
    if (!composition) {
      console.error(`FALLA ${t.nombre}: no existe ${t.comp}`);
      fallas++;
      continue;
    }
    // En una plantilla, el cuadro del 55 %: ya entró el contenido y todavía no llega el cierre.
    const frame = Math.min(composition.durationInFrames - 1, t.cuadro ?? Math.round(composition.durationInFrames * 0.55));
    try {
      await renderStill({ composition, serveUrl, output: join(dir, `${t.nombre}.jpg`), frame, imageFormat: "jpeg", jpegQuality: 78, scale: 0.3, logLevel: "error" });
      console.log(`ok    ${t.nombre} · cuadro ${frame}`);
    } catch (e) {
      console.error(`FALLA ${t.nombre}: ${String(e).split("\n")[0]}`);
      fallas++;
    }
  }
  console.log(`miniaturas: ${trabajos.length - fallas} de ${trabajos.length} en catalogo/miniaturas/`);
  if (fallas || !conVideos) process.exit(fallas ? 1 : 0);
}

// ── Videos de ejemplo (render: el VPS de Bodega) ────────────────────────────────────────────────────
if (conVideos) {
  const dir = join(root, "catalogo/videos");
  mkdirSync(dir, { recursive: true });
  const trabajos = [
    ...plantillas.map((p) => ({ nombre: p.id, comp: p.composiciones[0] })),
    ...manifest.map((m) => ({ nombre: `Preset-${m.id}`, comp: `Preset-${m.id}-horizontal` })),
  ].filter((t) => !filtroVideo || filtroVideo.includes(t.nombre) || filtroVideo.includes(t.nombre.replace("Preset-", "")));
  let fallas = 0;
  for (const t of trabajos) {
    const composition = comps.find((c) => c.id === t.comp);
    if (!composition) {
      console.error(`FALLA ${t.nombre}: no existe ${t.comp}`);
      fallas++;
      continue;
    }
    try {
      // Un tercio del tamaño (1080 → 360) y sin audio: es una vista previa para la página, no un entregable.
      await renderMedia({
        composition,
        serveUrl,
        outputLocation: join(dir, `${t.nombre}.mp4`),
        codec: "h264",
        crf: 30,
        scale: 1 / 3,
        muted: true,
        pixelFormat: "yuv420p",
        concurrency: Math.min(4, availableParallelism()),
        timeoutInMilliseconds: 180000,
        logLevel: "error",
      });
      console.log(`ok    ${t.nombre} · ${(composition.durationInFrames / composition.fps).toFixed(1)} s`);
    } catch (e) {
      console.error(`FALLA ${t.nombre}: ${String(e).split("\n")[0]}`);
      fallas++;
    }
  }
  console.log(`videos: ${trabajos.length - fallas} de ${trabajos.length} en catalogo/videos/`);
  process.exit(fallas ? 1 : 0);
}
process.exit(0);
