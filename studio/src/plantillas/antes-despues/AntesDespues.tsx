import { loadFont as cargarAnton } from "@remotion/google-fonts/Anton";
import { loadFont as cargarPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, random, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Look } from "../../components/presets/Look";
import { bordeRasgado } from "../../components/presets/PaperTear";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, enterStyle, leave, mix, posterizeTime, springPreset, tween } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, esVideo, resolverMedia, zColores, zMedia } from "../base";

/**
 * Plantilla `antes-despues` (kb/14). Escenario fijo de comparación: el material crudo ("antes") chico y el
 * tratado ("después") grande. El panel del después recorre estados: cada estado es un tratamiento de subtítulo
 * o de dato distinto, con su frase, su palabra clave y su transición de entrada. Es la prueba visual del
 * oficio (AI-51): se muestra la diferencia en lugar de decirla.
 *
 * Videos de origen (referentes/lote-2026-11-08.md, recetas en referentes/_raw/videos/<id>/receta.json):
 * - MoVlt-ptxIk → variante `tarjetas-perspectiva`: tarjeta ANTES chica a la izquierda (rotY +14°) y DESPUÉS
 *   1,5× más grande a la derecha (rotY −12°) con rótulos grandes en condensada; dentro, subtítulos palabra a
 *   palabra con salto de tamaño y de fuente, resalte rojo solo en la palabra clave, elipse a mano, cortina de
 *   6 f, rasgado de papel posterizado a 2 f y cortes secos entre tratamientos.
 * - tiktok-7519674033076571397 → variante `escenario-timeline`: tres paneles (original, edición final en marco
 *   de teléfono con bisel y captura de la línea de tiempo con cabezal), fondo durazno, frase completa que entra
 *   con desenfoque horizontal y palabra de acento en itálica de un color que llega una fracción después, cifra
 *   que cuenta, objeto desenfocado que cae (arriveSoft largo) y barridos de 8 f entre secciones.
 *
 * Qué se tomó: el layout chico/grande en perspectiva, los rótulos de estado, el ritmo palabra a palabra o frase a
 * frase de cada referencia, la cortina de borde duro, el rasgado pose a pose, el punch-in dentro del marco en los
 * tramos sin texto y la cifra con prefijo.
 * Qué NO se copió (kb/10): el footage y la voz de los creadores, sus textos, precios, logos ("MARK SUT", cajas y
 * marcas de terceros), los siete estilos juntos (AI-14: los defaults usan tres), el halo neón amplio y el
 * bokeh del timeline (AI-23/30: la etiqueta va sin glow) y las entradas siempre blur+opacidad (AI-03: hay
 * máscara, desplazamiento, cortina y escala). Media y textos son props; sin media se dibuja un panel de muestra.
 *
 * Fuentes extra: Anton (rótulos condensados) y Playfair Display itálica (palabra de acento), ambas de Google
 * Fonts con licencia OFL.
 */

const anton = cargarAnton("normal", { weights: ["400"], subsets: ["latin"] });
const playfair = cargarPlayfair("italic", { weights: ["400", "700"], subsets: ["latin"] });

const VARIANTES = ["tarjetas-perspectiva", "escenario-timeline"] as const;
type NombreVariante = (typeof VARIANTES)[number];

type Variante = {
  fuente: string;
  layout: "tarjetas" | "escenario";
  modo: "palabra" | "frase";
  fondo: string;
  fondo2: string;
  texto: string;
  suave: string;
  acento: string;
  tarjeta: string; // marco de las tarjetas / bisel
  azul: string;
  crema: string;
  reticula: string;
  periodico: string;
  papel: string[];
  grano: number;
  vineta: number;
  tinte: string;
};

const V: Record<NombreVariante, Variante> = {
  "tarjetas-perspectiva": {
    fuente: "MoVlt-ptxIk",
    layout: "tarjetas",
    modo: "palabra",
    fondo: "#eceff1",
    fondo2: "#e1e5e8",
    texto: "#1d1d1b",
    suave: "#5f6164",
    acento: "#b112e3",
    tarjeta: "#f7f9fa",
    azul: "#7757bd",
    crema: "#e4d3ee",
    reticula: "#1d1d1b",
    periodico: "#c9ccd0",
    papel: ["#d9cde3", "#b9a3c7", "#9a7fb0", "#7757bd"],
    grano: 0.03,
    vineta: 0.18,
    tinte: "#c9ccd0",
  },
  "escenario-timeline": {
    fuente: "tiktok-7519674033076571397",
    layout: "escenario",
    modo: "frase",
    fondo: "#e9e4ee",
    fondo2: "#f4f9fc",
    texto: "#1d1d1b",
    suave: "#5f6164",
    acento: "#c03bfb",
    tarjeta: "#d9cde3",
    azul: "#7757bd",
    crema: "#efe8f5",
    reticula: "#140b18",
    periodico: "#cfd2d6",
    papel: ["#e4d3ee", "#c9b3da", "#a98bc2", "#7757bd"],
    grano: 0.035,
    vineta: 0.16,
    tinte: "#e4d3ee",
  },
};

const ESTILOS = ["video", "papel", "color", "reticula", "periodico", "crema", "dato"] as const;
const ENTRADAS = ["corte", "cortina", "rasgado", "barrido"] as const;

export const schema = z.object({
  variante: z.enum(VARIANTES).default("tarjetas-perspectiva").describe("layout, paleta y ritmo de cada video de origen"),
  antes: zMedia.describe("clip crudo del cliente (panel chico)"),
  etiquetaAntes: z.string().default("Antes"),
  etiquetaDespues: z.string().default("Después"),
  estados: z
    .array(
      z.object({
        estilo: z.enum(ESTILOS).describe("tratamiento del panel grande; usar 2–3 por pieza (AI-14)"),
        texto: z.string().describe("frase; en escenario-timeline, varias frases separadas por « / »"),
        clave: z.string().default("").describe("palabra resaltada (acento); vacío = ninguna"),
        media: zMedia.describe("clip o imagen de este estado; vacío = el clip de «antes»"),
        segundos: z.number().min(0.8).max(6),
        entrada: z.enum(ENTRADAS).default("corte"),
      }),
    )
    .min(1),
  timeline: z
    .object({ etiqueta: z.string().default("Línea de tiempo"), media: zMedia })
    .default({ etiqueta: "Línea de tiempo", media: "" })
    .describe("solo escenario-timeline: captura propia del timeline; vacío = pistas de muestra"),
  colores: zColores,
});

type Props = z.infer<typeof schema>;
type Estado = Props["estados"][number];

// ── Utilidades ──────────────────────────────────────────────────────────────────────────────────

const JIT = [0, 2, -1, 3, -2, 1];
const repartir = (n: number, ini: number, fin: number) =>
  Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.round(n <= 1 ? ini : ini + ((fin - ini) * i) / (n - 1) + JIT[i % JIT.length])),
  );

/** Tramos > max cuadros sin evento: ahí va un punch-in del marco (ritmo de anuncio, motion-audit D-01). */
const rellenar = (eventos: number[], fin: number, max = 22) => {
  const ts = [...new Set([0, ...eventos.filter((t) => t >= 0 && t < fin), fin])].sort((a, b) => a - b);
  const extra: number[] = [];
  for (let i = 1; i < ts.length; i++) {
    const gap = ts[i] - ts[i - 1];
    if (gap <= max) continue;
    const k = Math.ceil(gap / max) - 1;
    for (let j = 1; j <= k; j++) extra.push(Math.round(ts[i - 1] + (gap * j) / (k + 1) + (j % 2 ? 2 : -2)));
  }
  return extra;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]/g, "");

const esClave = (w: string, clave: string) => clave !== "" && norm(w) === norm(clave);
const frasesDe = (e: Estado) => e.texto.split("/").map((s) => s.trim()).filter(Boolean);
const palabrasDe = (e: Estado) => e.texto.split(/\s+/).filter(Boolean);

/** Cola de salida que necesita el estado según la entrada del siguiente (el rasgado y el barrido se solapan). */
const COLA: Record<Estado["entrada"], number> = { corte: 0, cortina: 0, rasgado: 16, barrido: 8 };

/** Tiempos de las unidades de texto del estado (palabras o frases). */
const tiemposTexto = (e: Estado, v: Variante, L: number) => {
  const n = v.modo === "palabra" ? palabrasDe(e).length : frasesDe(e).length;
  return repartir(Math.max(1, n), 4, Math.max(4, L - (v.modo === "palabra" ? 12 : 16)));
};

const eventosEstado = (e: Estado, v: Variante, L: number) => {
  const ts = tiemposTexto(e, v, L);
  const extra = v.modo === "frase" ? ts.map((t) => t + 5) : [];
  const dato = e.estilo === "dato" ? [6, 10] : [];
  const fondo = e.estilo === "papel" ? [2, 5, 9] : e.estilo === "color" ? [8, 15] : [];
  return [0, ...ts, ...extra, ...dato, ...fondo];
};

// ── Media y paneles de muestra ──────────────────────────────────────────────────────────────────

const Media: React.FC<{ src: string; estilo?: React.CSSProperties }> = ({ src, estilo }) => {
  const url = resolverMedia(src);
  const s: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", ...estilo };
  return esVideo(src) ? <OffthreadVideo src={url} muted style={s} /> : <Img src={url} style={s} />;
};

/** Persona de muestra (silueta) para maquetar sin material. */
const Persona: React.FC<{ u: number; tono?: string; fondo?: string }> = ({ u, tono = "#3B3733", fondo = "#9A948C" }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${fondo} 0%, #6F6A63 100%)` }}>
    <div style={{ position: "absolute", left: "50%", top: "30%", width: "34%", aspectRatio: "1", borderRadius: "50%", background: tono, transform: "translateX(-50%)" }} />
    <div style={{ position: "absolute", left: "50%", top: "56%", width: "86%", height: "60%", borderRadius: `${200 * u}px ${200 * u}px 0 0`, background: tono, transform: "translateX(-50%)" }} />
  </AbsoluteFill>
);

const Fuente: React.FC<{ src: string; u: number; gris?: boolean; desenfoque?: number }> = ({ src, u, gris, desenfoque = 0 }) => {
  const filtro = `${gris ? "grayscale(1) contrast(1.25)" : ""} ${desenfoque > 0.2 ? `blur(${desenfoque}px)` : ""}`.trim() || undefined;
  return src ? <Media src={src} estilo={{ filter: filtro }} /> : <AbsoluteFill style={{ filter: filtro }}><Persona u={u} /></AbsoluteFill>;
};

// ── Texto por estilo ────────────────────────────────────────────────────────────────────────────

type CtxEstado = { e: Estado; v: Variante; L: number; w: number; h: number; u: number; src: string };

/** Palabras acumuladas (modo palabra): cada una entra en su golpe; la clave va en acento. */
const Acumulado: React.FC<CtxEstado & { size: number; color: string; mezcla?: boolean; marcador?: boolean; elipse?: boolean; peso?: number; top?: number }> = ({
  e,
  v,
  L,
  w,
  u,
  size,
  color,
  mezcla = false,
  marcador = false,
  elipse = false,
  peso = 700,
  top = 0.14,
  h,
}) => {
  const f = useCurrentFrame();
  const palabras = palabrasDe(e);
  const ts = tiemposTexto(e, v, L);
  // La plantilla crema cambia de fuente y tamaño palabra a palabra (MoVlt-ptxIk).
  const estilos = [
    { fontFamily: marca.fuenteTitulo, fontWeight: 700, k: 1, fontStyle: "normal" as const, tt: "none" as const },
    { fontFamily: playfair.fontFamily, fontWeight: 400, k: 0.86, fontStyle: "italic" as const, tt: "none" as const },
    { fontFamily: marca.fuenteTexto, fontWeight: 500, k: 0.6, fontStyle: "normal" as const, tt: "none" as const },
    { fontFamily: anton.fontFamily, fontWeight: 400, k: 1.18, fontStyle: "normal" as const, tt: "uppercase" as const },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: w * 0.08 * u,
        right: w * 0.08 * u,
        top: h * top * u,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        columnGap: size * 0.28 * u,
        rowGap: size * 0.1 * u,
      }}
    >
      {palabras.map((pw, i) => {
        const dur = i % 2 ? 8 : 6;
        const p = arrive(f, ts[i], dur, "arrive");
        if (p <= 0) return null;
        const clave = esClave(pw, e.clave);
        const es = mezcla ? estilos[i % estilos.length] : estilos[0];
        const barra = marcador && clave ? tween(f, ts[i] + 2, 8, "arrive") : 0;
        const traza = elipse && clave ? tween(f, ts[i] + 4, 12, "aeEasy") : 0;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              fontFamily: es.fontFamily,
              fontWeight: mezcla ? es.fontWeight : peso,
              fontStyle: es.fontStyle,
              textTransform: es.tt,
              fontSize: size * (mezcla ? es.k : 1) * u,
              lineHeight: 1,
              letterSpacing: es.fontFamily === marca.fuenteTitulo ? "-0.03em" : "0",
              color: clave && !marcador ? v.acento : color,
              opacity: Math.min(1, p / 0.5),
              transform: `translateY(${(1 - p) * size * 0.35 * u}px)`,
            }}
          >
            {marcador && clave ? (
              <span
                style={{
                  position: "absolute",
                  left: -0.12 * size * u,
                  right: -0.12 * size * u,
                  top: 0.04 * size * u,
                  bottom: -0.06 * size * u,
                  background: v.acento,
                  transformOrigin: "0% 50%",
                  transform: `scaleX(${barra})`,
                  zIndex: -1,
                }}
              />
            ) : null}
            <span style={{ position: "relative" }}>{pw}</span>
            {elipse && clave ? (
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: "absolute", left: "-18%", top: "-35%", width: "136%", height: "170%", overflow: "visible" }}>
                <path
                  d="M 62 4 C 92 4, 100 20, 88 31 C 74 41, 22 41, 8 30 C -4 20, 10 5, 40 4 C 52 3.5, 64 5, 72 8"
                  fill="none"
                  stroke={v.acento}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - traza}
                />
              </svg>
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

/** Ventana de una palabra con la siguiente en fantasma al 35 % (estilo video de MoVlt-ptxIk). */
const Ventana: React.FC<CtxEstado> = ({ e, v, L, w, h, u }) => {
  const f = useCurrentFrame();
  const palabras = palabrasDe(e);
  const ts = tiemposTexto(e, v, L);
  let i = 0;
  for (let k = 0; k < ts.length; k++) if (f >= ts[k]) i = k;
  const p = arrive(f, ts[i], 8, "arrive");
  const sig = palabras[i + 1];
  const actual = palabras[i] ?? "";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: h * 0.55 * u,
        display: "flex",
        justifyContent: "center",
        gap: 16 * u,
        fontFamily: marca.fuenteTitulo,
        fontWeight: 700,
        fontSize: w * 0.085 * u,
        textTransform: "lowercase",
        textShadow: `0 ${3 * u}px ${10 * u}px rgba(0,0,0,0.45)`,
      }}
    >
      <span
        key={i}
        style={{
          color: esClave(actual, e.clave) ? v.acento : "#F5F4EF",
          opacity: f >= ts[0] ? Math.min(1, p / 0.5) : 0,
          transform: `scale(${0.92 + 0.08 * p})`,
        }}
      >
        {actual}
      </span>
      {sig ? <span style={{ color: "#F5F4EF", opacity: 0.35 * Math.min(1, p / 0.5) }}>{sig}</span> : null}
    </div>
  );
};

/** Frase completa con desenfoque horizontal; la palabra clave llega en itálica de acento (tiktok-7519674033076571397). */
const Frases: React.FC<CtxEstado & { color: string; top: number; grande?: boolean }> = ({ e, v, L, w, h, u, color, top, grande }) => {
  const f = useCurrentFrame();
  const frases = frasesDe(e);
  const ts = tiemposTexto(e, v, L);
  return (
    <>
      {frases.map((fr, i) => {
        const p = arrive(f, ts[i], 8, "arrive");
        const fuera = i < frases.length - 1 ? leave(f, ts[i + 1], 6, "leaveSoft") : 0;
        if (p <= 0 || fuera >= 1) return null;
        const acento = arrive(f, ts[i] + 5, 10, "arriveSoft");
        const palabras = fr.split(/\s+/);
        const size = (grande ? 0.13 : 0.1) * w;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: w * 0.08 * u,
              right: w * 0.06 * u,
              top: h * top * u,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              columnGap: size * 0.25 * u,
              opacity: Math.min(1, p / 0.6) * (1 - fuera),
              transform: `translateX(${((1 - p) * 40 - fuera * 60) * u}px)`,
              filter: `blur(${((1 - p) * 8 + fuera * 6) * u}px)`,
            }}
          >
            {palabras.map((pw, k) => {
              const clave = esClave(pw, e.clave);
              return (
                <span
                  key={k}
                  style={{
                    fontFamily: clave ? playfair.fontFamily : marca.fuenteTitulo,
                    fontStyle: clave ? "italic" : "normal",
                    fontWeight: clave ? 400 : 700,
                    fontSize: size * (clave ? 1.15 : 1) * u,
                    letterSpacing: clave ? "0" : "-0.03em",
                    lineHeight: 1.05,
                    color: clave ? v.acento : color,
                    textShadow: `0 ${2 * u}px ${8 * u}px rgba(0,0,0,0.35)`,
                    display: "inline-block",
                    opacity: clave ? Math.min(1, acento / 0.6) : 1,
                    transform: clave ? `translateY(${(1 - acento) * 18 * u}px)` : undefined,
                  }}
                >
                  {pw}
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

/** Cifra que cuenta (primer número del texto) con el resto como pie (estilo dato). */
const Dato: React.FC<CtxEstado> = ({ e, v, w, h, u }) => {
  const f = useCurrentFrame();
  const m = e.texto.match(/^(.*?)([\d]+(?:[.,]\d+)?)(.*)$/);
  const antes = m ? m[1].trim() : "";
  const numero = m ? parseFloat(m[2].replace(",", ".")) : 0;
  const decimales = m && /[.,](\d+)/.test(m[2]) ? m[2].split(/[.,]/)[1].length : 0;
  const coma = m ? m[2].includes(",") : false;
  const resto = m ? m[3].trim() : e.texto;
  const pr = arrive(f, 4, 10, "arrive");
  const cuenta = tween(f, 6, 24, "arrive");
  const pie = arrive(f, 10, 12, "arriveSoft");
  const valor = (numero * cuenta).toFixed(decimales);
  const prefijoMatch = antes.match(/([$€£]|USD|COP|MXN)$/);
  const prefijo = prefijoMatch ? prefijoMatch[1] : "";
  const previo = prefijo ? antes.slice(0, -prefijo.length).trim() : antes;
  return (
    <div style={{ position: "absolute", left: w * 0.09 * u, top: h * 0.3 * u, right: w * 0.06 * u }}>
      {previo ? (
        <div style={{ fontFamily: playfair.fontFamily, fontStyle: "italic", fontSize: w * 0.11 * u, color: "#FFFDF8", ...enterStyle(pr, 16 * u) }}>{previo}</div>
      ) : null}
      <div
        style={{
          fontFamily: marca.fuenteTitulo,
          fontWeight: 700,
          fontSize: w * 0.2 * u,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          color: "#FFFDF8",
          fontVariantNumeric: "tabular-nums",
          textShadow: `0 ${4 * u}px ${16 * u}px rgba(0,0,0,0.3)`,
          opacity: Math.min(1, cuenta / 0.2),
        }}
      >
        {prefijo}
        {coma ? valor.replace(".", ",") : valor}
      </div>
      {resto ? (
        <div style={{ marginTop: 10 * u, fontFamily: marca.fuenteTexto, fontWeight: 600, fontSize: w * 0.065 * u, color: "#FFFDF8", ...enterStyle(pie, 14 * u) }}>
          {resto.split(/\s+/).map((pw, k) => (
            <span key={k} style={{ color: esClave(pw, e.clave) ? v.acento : undefined, fontFamily: esClave(pw, e.clave) ? playfair.fontFamily : undefined, fontStyle: esClave(pw, e.clave) ? "italic" : undefined }}>
              {pw}{" "}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// ── Estado del panel grande ─────────────────────────────────────────────────────────────────────

const Fondo: React.FC<CtxEstado> = (c) => {
  const { e, v, u, w, h, src } = c;
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  switch (e.estilo) {
    case "video":
      return (
        <AbsoluteFill>
          <Fuente src={src} u={u} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 40%, rgba(10,8,6,0.45) 100%)" }} />
        </AbsoluteFill>
      );
    case "papel": {
      // Bosque de papel en capas (MoVlt-ptxIk) con el recorte en B/N tipo sticker.
      const capas = [2, 5, 9].map((at, k) => arrive(f, at, 14 + k * 2, "arriveSoft"));
      return (
        <AbsoluteFill style={{ background: v.papel[0] }}>
          {capas.map((p, k) => (
            <svg key={k} viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: `${48 - k * 9}%`, transform: `translateY(${(1 - p) * 30}%)` }}>
              <path
                d={`M0 60 L0 ${22 + k * 4} ${Array.from({ length: 9 }, (_, i) => `L${i * 12 + 6} ${8 + k * 6 + random(`m${k}${i}`) * 14} L${i * 12 + 12} ${24 + k * 4 + random(`n${k}${i}`) * 8}`).join(" ")} L100 60 Z`}
                fill={v.papel[k + 1]}
              />
            </svg>
          ))}
          <div
            style={{
              position: "absolute",
              right: w * 0.06 * u,
              bottom: h * 0.08 * u,
              width: w * 0.62 * u,
              height: h * 0.46 * u,
              border: `${8 * u}px solid #F4F2EC`,
              borderRadius: 10 * u,
              overflow: "hidden",
              transform: `rotate(-3deg) translateY(${(1 - capas[2]) * 40 * u}px)`,
              boxShadow: `${-6 * u}px ${12 * u}px ${18 * u}px rgba(20,24,20,0.3)`,
            }}
          >
            <Fuente src={src} u={u} gris />
          </div>
        </AbsoluteFill>
      );
    }
    case "color": {
      const a = springPreset(f, fps, "snappy", 8);
      const b = springPreset(f, fps, "snappy", 15);
      return (
        <AbsoluteFill style={{ background: v.azul }}>
          <div style={{ position: "absolute", left: w * 0.06 * u, bottom: h * 0.06 * u, width: w * 0.3 * u, height: w * 0.3 * u, background: v.acento, transform: `scale(${0.6 + 0.4 * a})`, opacity: Math.min(1, a * 2) }} />
          <div style={{ position: "absolute", right: w * 0.08 * u, top: h * 0.06 * u, width: w * 0.18 * u, height: w * 0.22 * u, background: "#b112e3", transform: `scale(${0.6 + 0.4 * b})`, opacity: Math.min(1, b * 2) }} />
        </AbsoluteFill>
      );
    }
    case "reticula":
      return (
        <AbsoluteFill
          style={{
            background: v.reticula,
            backgroundImage: `linear-gradient(#FFFFFF16 ${1.5 * u}px, transparent ${1.5 * u}px), linear-gradient(90deg, #FFFFFF16 ${1.5 * u}px, transparent ${1.5 * u}px)`,
            backgroundSize: `${w * 0.2 * u}px ${w * 0.2 * u}px`,
          }}
        />
      );
    case "periodico":
      return (
        <AbsoluteFill style={{ background: v.periodico }}>
          {Array.from({ length: 3 }, (_, col) => (
            <div key={col} style={{ position: "absolute", left: `${4 + col * 32}%`, top: "4%", width: "28%", transform: `rotate(${(random(`rot${col}`) - 0.5) * 3}deg)` }}>
              {Array.from({ length: 34 }, (_, k) => (
                <div key={k} style={{ height: 5 * u, marginBottom: 7 * u, width: `${60 + random(`l${col}-${k}`) * 40}%`, background: "#8F8C85", opacity: 0.55 }} />
              ))}
            </div>
          ))}
        </AbsoluteFill>
      );
    case "crema":
      return <AbsoluteFill style={{ background: v.crema }} />;
    case "dato": {
      // Fondo de clip desenfocado y un objeto que cae desenfocado mientras cuenta (arriveSoft largo).
      const cae = tween(f, 6, 37, "arriveSoft");
      return (
        <AbsoluteFill style={{ background: `linear-gradient(170deg, ${v.fondo2} 0%, ${v.tarjeta} 100%)` }}>
          {src ? <Fuente src={src} u={u} desenfoque={14 * u} /> : null}
          <div
            style={{
              position: "absolute",
              left: w * 0.58 * u,
              top: mix(cae, -0.25, 0.66) * h * u,
              width: w * 0.3 * u,
              height: w * 0.26 * u,
              borderRadius: 10 * u,
              background: "#9a7fb0",
              filter: `blur(${5 * u}px)`,
              transform: `rotate(${mix(cae, -24, 8)}deg)`,
              opacity: 0.85,
            }}
          />
        </AbsoluteFill>
      );
    }
  }
};

const Texto: React.FC<CtxEstado> = (c) => {
  const { e, v, w } = c;
  if (v.modo === "frase") {
    if (e.estilo === "dato") return <Dato {...c} />;
    const claro = ["video", "color", "reticula", "papel"].includes(e.estilo);
    return <Frases {...c} color={claro ? "#FFFDF8" : v.texto} top={e.estilo === "video" ? 0.45 : 0.18} grande={e.estilo !== "video"} />;
  }
  switch (e.estilo) {
    case "video":
      return <Ventana {...c} />;
    case "papel":
      return <Acumulado {...c} size={w * 0.13} color="#141414" top={0.08} />;
    case "color":
      return <Acumulado {...c} size={w * 0.06} color="#F4F3FF" peso={600} top={0.42} />;
    case "reticula":
      return <Acumulado {...c} size={w * 0.09} color="#F5F4EF" marcador top={0.4} />;
    case "periodico":
      return <Acumulado {...c} size={w * 0.07} color="#1A1917" elipse top={0.44} peso={600} />;
    case "crema":
      return <Acumulado {...c} size={w * 0.12} color="#151513" mezcla top={0.12} />;
    case "dato":
      return <Dato {...c} />;
  }
};

/** Un estado dentro del panel: su entrada, su punch-in en tramos largos y su salida si el siguiente rasga o barre. */
const PanelEstado: React.FC<CtxEstado & { salida: Estado["entrada"] | null; primero: boolean }> = (c) => {
  const { e, v, L, w, h, u, salida, primero } = c;
  const f = useCurrentFrame();
  // Entrada.
  let clip: string | undefined;
  let tx = 0;
  let sc = 1;
  let blur = 0;
  if (e.entrada === "cortina" && !primero) {
    const k = tween(f, 0, 6, "snap");
    clip = `inset(0 0 0 ${(1 - k) * 100}%)`;
  } else if (e.entrada === "barrido" && !primero) {
    const k = tween(f, 0, 8, "snap");
    tx = (1 - k) * w;
    blur = (1 - k) * 14;
  } else {
    const k = arrive(f, 0, e.entrada === "rasgado" ? 9 : 5, "arrive");
    sc = 1.05 - 0.05 * k;
  }
  // Punch-in dentro del marco en los tramos sin texto (como los cortes al golpe del original).
  const punch = rellenar(eventosEstado(e, v, L), L);
  let pz = 1;
  punch.forEach((t, i) => {
    const k = tween(f, t, 4, "snap");
    pz *= 1 + (i % 2 ? -0.04 : 0.06) * k;
  });
  // Salida (cola solapada sobre el siguiente estado).
  let piezaClip: string | undefined;
  let fibraClip: string | undefined;
  let dy = 0;
  let rot = 0;
  if (salida === "barrido") {
    const k = tween(f, L, 8, "snap");
    tx -= k * w;
    blur += k * 14;
  }
  if (salida === "rasgado") {
    tween(f, L, 14, "leaveSoft"); // el evento se audita en el cuadro real; el movimiento va posterizado
    const t = tween(posterizeTime(f, 2), L, 14, "leaveSoft");
    if (f >= L) {
      const borde = bordeRasgado(`tear-${e.texto}`, 60, 22);
      const base = h * 0.55;
      const pts = (desp: number) => borde.map((p) => `${(p.t * 100).toFixed(2)}% ${((base + p.o * desp + (desp > 1 ? 5 : 0)) * u).toFixed(1)}px`);
      piezaClip = `polygon(0% 0%, 100% 0%, ${pts(1).reverse().join(", ")})`;
      fibraClip = `polygon(0% 0%, 100% 0%, ${pts(1.35).reverse().join(", ")})`;
      dy = -t * h * 0.95;
      rot = -t * 9;
    }
  }
  const ctx = { ...c };
  const contenido = (
    <AbsoluteFill style={{ clipPath: clip, transform: `translateX(${tx * u}px) scale(${sc})`, filter: blur > 0.2 ? `blur(${blur * u}px)` : undefined }}>
      <AbsoluteFill style={{ transform: `scale(${pz})` }}>
        <Fondo {...ctx} />
      </AbsoluteFill>
      <Texto {...ctx} />
    </AbsoluteFill>
  );
  if (!piezaClip) return contenido;
  return (
    <AbsoluteFill style={{ transform: `translateY(${dy * u}px) rotate(${rot}deg)`, transformOrigin: "0% 0%", filter: `drop-shadow(0 ${10 * u}px ${14 * u}px rgba(20,14,6,0.35))` }}>
      <AbsoluteFill style={{ clipPath: fibraClip, background: "#f4f9fc" }} />
      <AbsoluteFill style={{ clipPath: piezaClip }}>{contenido}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Escenario ───────────────────────────────────────────────────────────────────────────────────

type Caja = { x: number; y: number; w: number; h: number };

/** Encaja una caja de proporción fija dentro de un rectángulo objetivo (fracciones del lienzo). */
const encajar = (W: number, H: number, fx: number, fy: number, fw: number, fh: number, aspecto: number): Caja => {
  let w = fw * W;
  let h = w * aspecto;
  if (h > fh * H) {
    h = fh * H;
    w = h / aspecto;
  }
  return { x: fx * W, y: fy * H, w, h };
};

const Rotulo: React.FC<{ texto: string; x: number; y: number; size: number; color: string; p: number; u: number; condensada: boolean }> = ({ texto, x, y, size, color, p, u, condensada }) => (
  <div style={{ position: "absolute", left: x * u, top: y * u, overflow: "hidden" }}>
    <div
      style={{
        fontFamily: condensada ? anton.fontFamily : marca.fuenteTexto,
        fontWeight: condensada ? 400 : 600,
        fontSize: size * u,
        lineHeight: 1.05,
        textTransform: condensada ? "uppercase" : "none",
        letterSpacing: condensada ? "0.01em" : "-0.01em",
        color,
        transform: `translateY(${(1 - p) * 105}%)`,
      }}
    >
      {texto}
    </div>
  </div>
);

/** Pistas de muestra del timeline con cabezal a velocidad constante (como en un editor real). */
const Pistas: React.FC<{ u: number; acento: string; total: number }> = ({ u, acento, total }) => {
  const f = useCurrentFrame();
  const colores = ["#7757bd", "#b112e3", "#c03bfb", "#a6a8ab"];
  const cabezal = Math.min(1, f / Math.max(1, total)); // el cabezal de un editor avanza lineal: es lo que se imita
  return (
    <AbsoluteFill style={{ padding: `${70 * u}px ${24 * u}px ${20 * u}px ${110 * u}px`, boxSizing: "border-box" }}>
      {colores.map((c, fila) => {
        let x = 0;
        return (
          <div key={fila} style={{ position: "relative", height: `${100 / colores.length - 4}%`, marginBottom: "4%" }}>
            {Array.from({ length: 7 }, (_, k) => {
              const ancho = 6 + random(`clip-${fila}-${k}`) * 14;
              const izq = x;
              x += ancho + 1.2;
              if (izq > 100) return null;
              return <div key={k} style={{ position: "absolute", left: `${izq}%`, width: `${Math.min(ancho, 100 - izq)}%`, top: 0, bottom: 0, borderRadius: 4 * u, background: c, opacity: 0.85 }} />;
            })}
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 50 * u, bottom: 10 * u, left: `calc(${110 * u}px + ${cabezal} * (100% - ${134 * u}px))`, width: 3 * u, background: acento }} />
    </AbsoluteFill>
  );
};

const largos = (p: Props) => p.estados.map((e) => cuadros(e.segundos));

export const AntesDespues: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { u, ancho, alto } = useEscala();
  const base = V[p.variante];
  const v: Variante = { ...base, fondo: p.colores.fondo ?? base.fondo, texto: p.colores.texto ?? base.texto, acento: p.colores.acento ?? base.acento };
  const W = ancho / u;
  const H = alto / u;
  const tarjetas = v.layout === "tarjetas";

  const cajaA = tarjetas ? encajar(W, H, 0.04, 0.42, 0.36, 0.36, 1.78) : encajar(W, H, 0.06, 0.26, 0.33, 0.33, 1.72);
  const cajaD = tarjetas ? encajar(W, H, 0.42, 0.19, 0.55, 0.58, 1.8) : encajar(W, H, 0.42, 0.15, 0.52, 0.5, 1.74);
  const cajaT = encajar(W, H, 0.05, 0.69, 0.9, 0.16, 0.34);

  const pA = arrive(frame, 0, 20, "arriveSoft");
  const rA = arrive(frame, 6, 12, "arrive");
  const pD = springPreset(frame, fps, "heavy", 10);
  const rD = arrive(frame, 18, 14, "arriveGentle");
  const pT = arrive(frame, 8, 18, "arriveSoft");
  const deriva = tween(frame, 0, durationInFrames, "glide");

  const Ls = largos(p);
  const inicios = Ls.reduce<number[]>((acc, L, i) => [...acc, i === 0 ? 0 : acc[i - 1] + Ls[i - 1]], []);
  const sombra = `${18 * u}px ${28 * u}px ${44 * u}px rgba(30,24,18,0.28)`;
  const radio = (tarjetas ? 18 : 28) * u;
  const srcAntes = p.antes;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(175deg, ${v.fondo} 0%, ${v.fondo2} 100%)` }}>
      <AbsoluteFill style={{ perspective: 1800 * u, transform: `translateY(${-10 * deriva * u}px) scale(${1 + 0.03 * deriva})` }}>
        {/* Antes: chico, desaturado, girado hacia el centro. */}
        <div
          style={{
            position: "absolute",
            left: cajaA.x * u,
            top: cajaA.y * u,
            width: cajaA.w * u,
            height: cajaA.h * u,
            borderRadius: radio,
            overflow: "hidden",
            boxShadow: sombra,
            opacity: Math.min(1, pA / 0.6),
            transform: `translateX(${(1 - pA) * -70 * u}px) rotateY(${mix(pA, 30, tarjetas ? 14 : 6)}deg)`,
            filter: `saturate(0.6) blur(${(1 - pA) * 6 * u}px)`,
          }}
        >
          <Fuente src={srcAntes} u={u} />
        </div>
        <Rotulo
          texto={tarjetas ? p.etiquetaAntes : p.etiquetaAntes.toLowerCase()}
          x={cajaA.x + (tarjetas ? 18 : 0)}
          y={cajaA.y - (tarjetas ? 112 : 54)}
          size={tarjetas ? 92 : 34}
          color={v.texto}
          p={rA}
          u={u}
          condensada={tarjetas}
        />
        {/* Después: grande, cae con peso; adentro recorre los estados. */}
        <div
          style={{
            position: "absolute",
            left: cajaD.x * u,
            top: cajaD.y * u,
            width: cajaD.w * u,
            height: cajaD.h * u,
            borderRadius: radio,
            overflow: "hidden",
            background: v.tarjeta,
            boxShadow: sombra,
            border: tarjetas ? undefined : `${7 * u}px solid ${v.tarjeta}`,
            boxSizing: "border-box",
            opacity: Math.min(1, pD / 0.35),
            transform: `translateY(${(1 - pD) * 90 * u}px) rotateY(${mix(pD, -24, tarjetas ? -12 : -4)}deg) scale(${mix(pD, 0.9, 1)})`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: tarjetas ? 0 : 20 * u, overflow: "hidden" }}>
            {p.estados.map((e, i) => {
              const sig = p.estados[i + 1];
              const cola = sig ? COLA[sig.entrada] : 0;
              const L = Ls[i];
              const w = cajaD.w - (tarjetas ? 0 : 14);
              const h = cajaD.h - (tarjetas ? 0 : 14);
              return (
                <Sequence key={i} from={inicios[i]} durationInFrames={L + cola} layout="none">
                  <AbsoluteFill style={{ zIndex: cola > 0 ? 2 : 1 }}>
                    <PanelEstado e={e} v={v} L={L} w={w} h={h} u={u} src={e.media || srcAntes} salida={sig && cola > 0 ? sig.entrada : null} primero={i === 0} />
                  </AbsoluteFill>
                </Sequence>
              );
            })}
          </div>
        </div>
        <Rotulo
          texto={tarjetas ? p.etiquetaDespues : p.etiquetaDespues.toLowerCase()}
          x={cajaD.x + (tarjetas ? 10 : cajaD.w * 0.42)}
          y={cajaD.y - (tarjetas ? 112 : 54)}
          size={tarjetas ? 92 : 34}
          color={v.texto}
          p={rD}
          u={u}
          condensada={tarjetas}
        />
        {/* Timeline (solo escenario-timeline): captura del cliente o pistas de muestra; la etiqueta sin halo. */}
        {!tarjetas ? (
          <div
            style={{
              position: "absolute",
              left: cajaT.x * u,
              top: cajaT.y * u,
              width: cajaT.w * u,
              height: cajaT.h * u,
              borderRadius: 22 * u,
              overflow: "hidden",
              background: "#1B1B1D",
              boxShadow: sombra,
              ...enterStyle(pT, 50 * u),
            }}
          >
            {p.timeline.media ? <Media src={p.timeline.media} /> : <Pistas u={u} acento={v.acento} total={durationInFrames} />}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                fontFamily: marca.fuenteTitulo,
                fontWeight: 700,
                fontSize: 64 * u,
                letterSpacing: "-0.02em",
                color: v.acento,
                textShadow: `0 ${2 * u}px ${6 * u}px rgba(0,0,0,0.5)`,
                whiteSpace: "nowrap",
              }}
            >
              {p.timeline.etiqueta}
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
      <Look grain={v.grano} vignette={v.vineta} warmth={v.tinte} />
    </AbsoluteFill>
  );
};

export const antesDespues = definir({
  id: "Plantilla-AntesDespues",
  fuente: "antes-despues: MoVlt-ptxIk, tiktok-7519674033076571397",
  resumen: "El antes chico y el después grande en perspectiva, recorriendo varios resultados con cortina, rasgado o barrido.",
  cuando: "Mostrar transformaciones: rediseños, ediciones de foto, estilos generados con IA o resultados de un servicio.",
  schema,
  componente: AntesDespues,
  defaultProps: {
    variante: "tarjetas-perspectiva",
    antes: "",
    etiquetaAntes: "Antes",
    etiquetaDespues: "Después",
    estados: [
      { estilo: "video", texto: "un buen corte se siente", clave: "corte", media: "", segundos: 1.8, entrada: "corte" },
      { estilo: "reticula", texto: "el resalte va solo en la idea", clave: "idea", media: "", segundos: 1.8, entrada: "cortina" },
      { estilo: "video", texto: "cada palabra entra cuando se dice", clave: "dice", media: "", segundos: 1.9, entrada: "corte" },
      { estilo: "crema", texto: "menos efectos, más intención", clave: "intención", media: "", segundos: 2, entrada: "rasgado" },
      { estilo: "reticula", texto: "y la gente se queda", clave: "queda", media: "", segundos: 1.6, entrada: "corte" },
      { estilo: "crema", texto: "eso es editar con criterio", clave: "criterio", media: "", segundos: 2.6, entrada: "corte" },
    ],
    timeline: { etiqueta: "Línea de tiempo", media: "" },
    colores: {},
  },
  duracion: (p) => largos(p).reduce((s, L) => s + L, 0),
  formatos: ["vertical", "retrato"],
});
