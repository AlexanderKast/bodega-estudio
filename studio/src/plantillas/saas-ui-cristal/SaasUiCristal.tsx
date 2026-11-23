import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { BentoGrid, type CeldaBento } from "../../components/presets/BentoGrid";
import { CardMorph, type EstadoCard } from "../../components/presets/CardMorph";
import { Cursor, type PuntoCursor } from "../../components/presets/Cursor";
import { Look } from "../../components/presets/Look";
import { ScreenFrame } from "../../components/presets/ScreenFrame";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, enterStyle, leave, mix, springPreset, staggerDelay, tween } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, esVideo, resolverMedia, zColores, zMedia } from "../base";

/**
 * Plantilla `saas-ui-cristal` (kb/14). Anuncio de producto SaaS en UNA toma continua: cada idea nace de la
 * anterior con un empuje de cámara y desenfoque, nunca con un corte. Las escenas son piezas de interfaz:
 * gancho palabra a palabra, tarjetas de estado, contador dentro de una pill que muta a palabra clave, bento con
 * cámara que viaja de celda en celda, tarjeta que cambia de proporción (morph), captura con cursor y lista de
 * acciones con nodos. Cierre con barrido de dos barras y lockup con hold.
 *
 * Videos de origen (referentes/lote-2026-11-08.md, recetas en referentes/_raw/videos/<id>/receta.json):
 * - lpFv-bB-RuM → variante `noche-cristal`: toma continua en azul noche, empuje profundo (arriveSoft), palabras
 *   de una en una con blur, contador en pill (ease-out, los pasos se acercan al final), pill que se vacía y
 *   muta a tarjeta, chips apilados con hora, hold largo del lockup.
 * - tiktok-7521798862521060630 → `bento-inclinado`: grilla de widgets claros y oscuros sobre plano inclinado,
 *   cámara glide widget a widget y retroceso final, mosaicos que encajan con stagger (arrive 24 f).
 * - tiktok-7613879612723957012 → `morph-claro`: tarjeta que muta de vertical a horizontal con blur
 *   direccional (move 14 f), lista con nodos y línea que crece, barrido lateral entre ideas.
 * - tiktok-7698861538307788033 → `pasos-carbon`: carbón cálido con un acento coral, barra segmentada de
 *   pasos con número fantasma al 12 %, cambio de escena en 15–17 f (leave al salir, arrive al entrar).
 * - DryieyoUmLc → `hoja-cursor`: hoja clara sobre escritorio crema que se aleja (glide), cursor con arco que
 *   guía hasta la captura y el CTA.
 *
 * Paleta: las cinco variantes usan la marca de Bodega (marca.colores) y conservan lo que las distingue
 * (oscura o clara, cristal/sólido/papel). Solo alerta y aviso quedan como colores de estado de interfaz.
 *
 * Qué se tomó: la continuidad (empuje + blur entre ideas), el orden "gancho → estado → prueba → producto
 * funcionando → acciones → marca", los tiempos medidos de cada recurso y la jerarquía de una palabra por golpe.
 * Qué NO se copió (kb/10): glow neón, bloom y degradado cian→morado (AI-20/23); cristal en todo (AI-22: el
 * cristal es solo el tratamiento de `noche-cristal`, sin brillos); cuatro tarjetas idénticas (AI-26: la primera
 * es héroe y las demás cambian de tamaño); typewriter en titulares (AI-13); gradiente violeta y emoji del
 * morph; marcas, logos, copy, cifras, voz y música de los creadores. Textos y media son props con defaults
 * genéricos de un producto ficticio.
 */

const VARIANTES = ["noche-cristal", "bento-inclinado", "morph-claro", "pasos-carbon", "hoja-cursor"] as const;
type NombreVariante = (typeof VARIANTES)[number];

type Transicion = "empuje" | "paneo" | "barrido" | "subida" | "alejar";
type Variante = {
  fuente: string;
  fondoIni: string;
  fondoFin: string;
  sup: string; // superficie de tarjetas
  sup2: string; // superficie alterna (widgets oscuros, tarjeta del morph)
  texto: string;
  suave: string;
  acento: string;
  sobreAcento: string;
  alerta: string;
  aviso: string;
  trat: "cristal" | "solido" | "papel";
  trans: Transicion;
  ov: number; // cuadros de solape entre ideas (la transición)
  inclinado: boolean;
  pasos: boolean;
  grano: number;
  vineta: number;
  tinte: string;
  radio: number;
  pesoTitulo: number;
};

const V: Record<NombreVariante, Variante> = {
  "noche-cristal": {
    fuente: "lpFv-bB-RuM",
    fondoIni: marca.colores.sombraCalida,
    fondoFin: "#2b1636",
    sup: marca.colores.acentoProfundo,
    sup2: marca.colores.superficie,
    texto: marca.colores.texto,
    suave: marca.colores.suave,
    acento: marca.colores.acento,
    sobreAcento: marca.colores.texto,
    alerta: "#E5484D",
    aviso: "#F5C542",
    trat: "cristal",
    trans: "empuje",
    ov: 14,
    inclinado: false,
    pasos: false,
    grano: 0.06,
    vineta: 0.45,
    tinte: marca.colores.sombraCalida,
    radio: 28,
    pesoTitulo: 500,
  },
  "bento-inclinado": {
    fuente: "tiktok-7521798862521060630",
    fondoIni: "#e9edf0",
    fondoFin: "#dde1e4",
    sup: marca.colores.texto,
    sup2: marca.colores.fondo,
    texto: marca.colores.fondo,
    suave: "#5f6164",
    acento: marca.colores.acento,
    sobreAcento: marca.colores.texto,
    alerta: "#E8461E",
    aviso: "#19C93B",
    trat: "solido",
    trans: "paneo",
    ov: 12,
    inclinado: true,
    pasos: false,
    grano: 0.03,
    vineta: 0.45,
    tinte: marca.colores.suave,
    radio: 38,
    pesoTitulo: 600,
  },
  "morph-claro": {
    fuente: "tiktok-7613879612723957012",
    fondoIni: marca.colores.texto,
    fondoFin: "#e6eaed",
    sup: "#ffffff",
    sup2: marca.colores.acentoProfundo,
    texto: marca.colores.fondo,
    suave: "#5f6164",
    acento: marca.colores.acento,
    sobreAcento: marca.colores.texto,
    alerta: "#C2412D",
    aviso: marca.colores.suave,
    trat: "solido",
    trans: "barrido",
    ov: 10,
    inclinado: false,
    pasos: false,
    grano: 0.025,
    vineta: 0.15,
    tinte: marca.colores.suave,
    radio: 30,
    pesoTitulo: 700,
  },
  "pasos-carbon": {
    fuente: "tiktok-7698861538307788033",
    fondoIni: marca.colores.fondo,
    fondoFin: "#232321",
    sup: marca.colores.superficie,
    sup2: marca.colores.linea,
    texto: marca.colores.texto,
    suave: marca.colores.suave,
    acento: marca.colores.acento,
    sobreAcento: marca.colores.texto,
    alerta: marca.colores.acento,
    aviso: "#E9B44C",
    trat: "solido",
    trans: "subida",
    ov: 16,
    inclinado: false,
    pasos: true,
    grano: 0.05,
    vineta: 0.35,
    tinte: marca.colores.fondo,
    radio: 16,
    pesoTitulo: 700,
  },
  "hoja-cursor": {
    fuente: "DryieyoUmLc",
    fondoIni: "#eceff1",
    fondoFin: "#e1e5e8",
    sup: "#ffffff",
    sup2: "#e4d3ee",
    texto: marca.colores.fondo,
    suave: "#5f6164",
    acento: marca.colores.acento,
    sobreAcento: marca.colores.texto,
    alerta: marca.colores.suave,
    aviso: "#e4d3ee",
    trat: "papel",
    trans: "alejar",
    ov: 15,
    inclinado: false,
    pasos: false,
    grano: 0.04,
    vineta: 0.15,
    tinte: "#e1e5e8",
    radio: 22,
    pesoTitulo: 700,
  },
};

const TIPOS = ["gancho", "tarjetas", "contador", "bento", "morph", "captura", "lista"] as const;

export const schema = z.object({
  variante: z
    .enum(VARIANTES)
    .default("noche-cristal")
    .describe("una por video de origen: paleta, tratamiento de tarjetas y tipo de transición"),
  escenas: z
    .array(
      z.object({
        tipo: z.enum(TIPOS),
        titulo: z.string().describe("rótulo de la escena (en contador: etiqueta de la cifra)"),
        items: z
          .array(z.string())
          .default([])
          .describe("gancho: palabras · tarjetas/bento: «etiqueta|valor» · morph: pasos · captura: textos del cursor · lista: «acción|hora» · contador: [palabra clave]"),
        desde: z.number().default(0).describe("contador: valor inicial"),
        hasta: z.number().default(0).describe("contador: valor final"),
        media: zMedia.describe("captura: pantalla o video del producto; vacío = interfaz de muestra"),
        segundos: z.number().min(1.2).max(8),
      }),
    )
    .min(1),
  marca: z.string().describe("wordmark del cierre"),
  frase: z.string().describe("frase bajo el wordmark"),
  cta: z.string().default("").describe("CTA que el cursor señala en el cierre; vacío = sin CTA"),
  segundosCierre: z.number().min(1.5).max(5).default(3),
  colores: zColores,
});

type Props = z.infer<typeof schema>;
type Escena = Props["escenas"][number];

// ── Utilidades de ritmo ──────────────────────────────────────────────────────────────────────────

const JIT = [0, 2, -1, 3, -2, 1];

/** Reparte n eventos entre ini y fin con un swing pequeño (evita el metrónomo, AI-11). */
const repartir = (n: number, ini: number, fin: number) =>
  Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.round(n <= 1 ? ini : ini + ((fin - ini) * i) / (n - 1) + JIT[i % JIT.length])),
  );

/**
 * Huecos de la escena que superan `max` cuadros: ahí entra un re-encuadre de cámara (tween glide corto),
 * así ningún tramo queda > 30 f sin un evento del kit (ritmo de anuncio, motion-audit D-01).
 */
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

const partir = (s: string) => {
  const [a = "", b = ""] = s.split("|").map((t) => t.trim());
  return [a, b] as const;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Tiempos por tipo: los usa la escena para animar y la composición para medir los huecos.
const tTarjetas = (L: number, n: number) => ({
  cards: Array.from({ length: n }, (_, i) => 5 + staggerDelay(i, n, 14)),
  empuje: Math.round(L * 0.42),
  durEmpuje: Math.round(L * 0.45),
});
const tContador = (L: number) => {
  const dur = clamp(Math.round(L * 0.42), 30, 72);
  const k = 10 + dur + 4;
  return { pill: 4, cuenta: 10, dur, alertas: [16, 27], morph: k, clave: k + 8, check: k + 16 };
};
const tBento = (L: number, ov: number, n: number) => {
  const paradas = Math.min(n, 4);
  const por = clamp(Math.round((L - ov - 26 - 34) / Math.max(1, paradas)), 20, 34);
  const swing = [0, 4, -3, 2];
  return {
    por,
    paradas,
    eventos: [4, 12, 22, ...Array.from({ length: paradas }, (_, k) => 26 + k * por + swing[k]), 26 + paradas * por],
  };
};
const tMorph = (L: number, ov: number, n: number) => {
  const paso = (L - ov - 14) / Math.max(1, n);
  return Array.from({ length: n }, (_, i) => 4 + Math.round(i * paso) + JIT[i % JIT.length]);
};
const tCaptura = (L: number, ov: number) => {
  const clic1 = Math.round(L * 0.32);
  const zoom = Math.round(L * 0.5);
  const clic2 = Math.min(L - ov - 6, zoom + 26);
  return { filas: [12, 17, 21, 26, 29], cursor: 10, clic1, zoom, clic2 };
};
const tLista = (L: number, ov: number, n: number) => repartir(n, 6, L - ov - 18);

const eventosDe = (e: Escena, L: number, ov: number): number[] => {
  const n = e.items.length;
  switch (e.tipo) {
    case "gancho":
      return repartir(Math.max(1, n), 0, Math.max(0, L - ov - 14));
    case "tarjetas": {
      const t = tTarjetas(L, n);
      return [2, ...t.cards, ...t.cards.map((c) => c + 12), ...t.cards.map((c) => c + 16), t.empuje];
    }
    case "contador": {
      const t = tContador(L);
      return [2, t.pill, t.cuenta, ...t.alertas, t.morph, t.clave, t.check];
    }
    case "bento":
      return [2, ...tBento(L, ov, n).eventos];
    case "morph": {
      const t = tMorph(L, ov, n);
      return [2, ...t, ...t.map((x) => x + 8)];
    }
    case "captura": {
      const t = tCaptura(L, ov);
      return [2, ...t.filas, t.cursor, t.clic1 - 14, t.clic1, t.zoom, t.clic2 - 12, t.clic2];
    }
    case "lista":
      return [2, ...tLista(L, ov, n)];
  }
};

// ── Geometría y superficies ─────────────────────────────────────────────────────────────────────

type Geo = { W: number; H: number; x0: number; cw: number; yTop: number; yBot: number; yEy: number; yMain: number };

const useGeo = (v: Variante): Geo & { u: number } => {
  const { u, ancho, alto, zona } = useEscala();
  const W = ancho / u;
  const H = alto / u;
  const x0 = zona.lados / u;
  const cw = Math.min(W - 2 * x0, 1100);
  const yTop = zona.arriba / u;
  const yBot = H - zona.abajo / u;
  const yEy = yTop + (v.pasos ? 52 : 0);
  return { u, W, H, x0, cw, yTop, yBot, yEy, yMain: yEy + 96 };
};

/** Tratamiento de la tarjeta según la variante. El cristal (blur de fondo) solo existe en `noche-cristal`. */
const superficie = (v: Variante, u: number, alterna = false): React.CSSProperties => {
  if (v.trat === "cristal") {
    return {
      background: `linear-gradient(160deg, ${v.sup}2E 0%, ${v.sup}12 60%)`,
      border: `${1.5 * u}px solid ${v.sup}38`,
      backdropFilter: `blur(${18 * u}px)`,
      boxShadow: `0 ${26 * u}px ${50 * u}px rgba(1,3,14,0.45)`,
    };
  }
  if (v.trat === "papel") {
    return {
      background: alterna ? v.sup2 : v.sup,
      border: `${1.5 * u}px solid ${v.texto}1A`,
      boxShadow: `${-6 * u}px ${14 * u}px ${24 * u}px rgba(40,38,20,0.16)`,
    };
  }
  return {
    background: alterna ? v.sup2 : v.sup,
    boxShadow: `${-12 * u}px ${24 * u}px ${48 * u}px rgba(10,8,6,0.28)`,
  };
};

const textoSobre = (v: Variante, alterna: boolean) => (alterna && v.trat !== "papel" ? (v.sup2 === marca.colores.fondo ? marca.colores.texto : v.sobreAcento) : v.texto);

const Media: React.FC<{ src: string }> = ({ src }) => {
  const url = resolverMedia(src);
  const estilo = { width: "100%", height: "100%", objectFit: "cover" as const };
  return esVideo(src) ? <OffthreadVideo src={url} muted style={estilo} /> : <Img src={url} style={estilo} />;
};

// ── Piezas comunes ──────────────────────────────────────────────────────────────────────────────

/** Rótulo de escena: línea de acento + texto corto, arriba a la izquierda. */
const Rotulo: React.FC<{ texto: string; v: Variante; geo: Geo; u: number; at?: number }> = ({ texto, v, geo, u, at = 2 }) => {
  const f = useCurrentFrame();
  const p = arrive(f, at, 12, "arriveGentle");
  const linea = tween(f, at + 3, 14, "arrive");
  if (!texto) return null;
  return (
    <div style={{ position: "absolute", left: geo.x0 * u, top: geo.yEy * u, display: "flex", alignItems: "center", gap: 16 * u }}>
      <div style={{ width: 44 * u * linea, height: 4 * u, borderRadius: 2 * u, background: v.acento }} />
      <div
        style={{
          fontFamily: marca.fuenteTexto,
          fontWeight: 600,
          fontSize: 30 * u,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: v.suave,
          ...enterStyle(p, 14 * u),
        }}
      >
        {texto}
      </div>
    </div>
  );
};

/** Barra segmentada + número fantasma (variante `pasos-carbon`). */
const Pasos: React.FC<{ i: number; n: number; v: Variante; geo: Geo; u: number }> = ({ i, n, v, geo, u }) => {
  const f = useCurrentFrame();
  const llena = tween(f, 6, 18, "arriveSoft");
  const fantasma = arrive(f, 4, 16, "arriveSoft");
  return (
    <>
      <div style={{ position: "absolute", left: geo.x0 * u, top: geo.yTop * u, width: geo.cw * u, display: "flex", gap: 10 * u }}>
        {Array.from({ length: n }, (_, k) => (
          <div key={k} style={{ flex: 1, height: 8 * u, borderRadius: 4 * u, background: `${v.texto}24`, overflow: "hidden" }}>
            <div style={{ width: `${(k < i ? 1 : k === i ? llena : 0) * 100}%`, height: "100%", background: v.acento }} />
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: geo.x0 * u,
          top: (geo.yTop + 20) * u,
          fontFamily: marca.fuenteTitulo,
          fontWeight: 700,
          fontSize: 340 * u,
          lineHeight: 1,
          letterSpacing: "-0.06em",
          color: v.texto,
          opacity: 0.12 * fantasma,
          transform: `translateY(${(1 - fantasma) * 40 * u}px)`,
        }}
      >
        {String(i + 1).padStart(2, "0")}
      </div>
    </>
  );
};

/**
 * Plano de una idea: entra desde la anterior y sale hacia la siguiente con la transición de la variante.
 * `relleno` son los re-encuadres de cámara que cubren los tramos largos.
 */
const Plano: React.FC<{
  L: number;
  v: Variante;
  primero: boolean;
  ultimo: boolean;
  relleno: number[];
  children: React.ReactNode;
}> = ({ L, v, primero, ultimo, relleno, children }) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const e = primero ? arrive(f, 0, 14, "arrive") : arrive(f, 0, 20, "arriveSoft");
  const s = ultimo ? 0 : leave(f, L - v.ov, v.ov, "leave");

  let sc = 1;
  let tx = 0;
  let ty = 0;
  let blur = 0;
  let op = Math.min(1, e / 0.6) * (1 - s);
  switch (v.trans) {
    case "empuje":
      sc = mix(e, 0.8, 1) * (1 + 0.7 * s);
      blur = (1 - e) * 16 + s * 22;
      break;
    case "paneo":
      tx = (1 - e) * 260 - s * 300;
      sc = mix(e, 0.96, 1);
      blur = (1 - e) * 8 + s * 10;
      break;
    case "barrido":
      tx = (1 - e) * -200 + s * 340;
      blur = (1 - e) * 10 + s * 16;
      break;
    case "subida":
      ty = (1 - e) * 110 - s * 130;
      blur = (1 - e) * 10 + s * 14;
      break;
    case "alejar":
      sc = mix(e, 1.18, 1) * mix(s, 1, 0.6);
      blur = (1 - e) * 8 + s * 6;
      op = Math.min(1, e / 0.6) * (1 - s * s);
      break;
  }
  // Re-encuadres: deriva de cámara con intención (push leve alternando lado), uno por tramo largo.
  relleno.forEach((t, i) => {
    const k = tween(f, t, 20 + (i % 3) * 4, "glide");
    sc *= 1 + 0.02 * k;
    tx += (i % 2 ? -1 : 1) * 12 * k;
    ty += -5 * k;
  });
  return (
    <AbsoluteFill
      style={{
        opacity: op,
        transform: `translate(${tx * u}px, ${ty * u}px) scale(${sc})`,
        filter: blur > 0.2 ? `blur(${blur * u}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ── Escenas ─────────────────────────────────────────────────────────────────────────────────────

type Ctx = { e: Escena; v: Variante; L: number; geo: Geo; u: number; marcaNombre: string };

/** Gancho: una palabra por golpe, entra con blur y la anterior se va (lpFv-bB-RuM, 10 f arriveGentle). */
const Gancho: React.FC<Ctx> = ({ e, v, L, geo, u }) => {
  const f = useCurrentFrame();
  const palabras = e.items.length ? e.items : [e.titulo];
  const ts = repartir(palabras.length, 0, Math.max(0, L - v.ov - 14));
  return (
    <AbsoluteFill>
      {palabras.map((w, i) => {
        const p = arrive(f, ts[i], 10, "arriveGentle");
        const fuera = i < palabras.length - 1 ? leave(f, ts[i + 1], 6, "leave") : 0;
        if (p <= 0 || fuera >= 1) return null;
        const ultima = i === palabras.length - 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: geo.x0 * u,
              top: (geo.yTop + (geo.yBot - geo.yTop) * 0.36) * u,
              fontFamily: marca.fuenteTitulo,
              fontWeight: v.pesoTitulo,
              fontSize: 150 * u,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: ultima ? v.acento : v.texto,
              opacity: Math.min(1, p / 0.6) * (1 - fuera),
              transform: `translateY(${((1 - p) * 26 - fuera * 18) * u}px)`,
              filter: `blur(${((1 - p) * 10 + fuera * 10) * u}px)`,
            }}
          >
            {w}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Tarjetas de estado: la primera es héroe; avisos que saltan; empuje profundo hacia la héroe. */
const Tarjetas: React.FC<Ctx> = ({ e, v, L, geo, u }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = e.items.map(partir);
  const n = items.length;
  const t = tTarjetas(L, n);
  const empuje = tween(f, t.empuje, t.durEmpuje, "arriveSoft");
  const gap = 22;
  const hHero = 330;
  const hChica = 250;
  const resto = Math.max(1, n - 1);
  const wChica = (geo.cw - gap * (resto - 1)) / resto;
  const yIni = geo.yMain + 40;
  const cajas = items.map((_, i) =>
    i === 0
      ? { x: geo.x0, y: yIni, w: geo.cw, h: hHero }
      : { x: geo.x0 + (i - 1) * (wChica + gap), y: yIni + hHero + gap, w: wChica, h: hChica },
  );
  const hero = cajas[0];
  const ox = hero ? hero.x + hero.w / 2 : geo.W / 2;
  const oy = hero ? hero.y + hero.h / 2 : geo.H / 2;
  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${ox * u}px ${oy * u}px`,
        transform: `scale(${1 + 0.38 * empuje})`,
      }}
    >
      <Rotulo texto={e.titulo} v={v} geo={geo} u={u} />
      {items.map(([etq, val], i) => {
        const c = cajas[i];
        const esHero = i === 0;
        const alterna = v.inclinado && i % 2 === 1;
        const p = arrive(f, t.cards[i], esHero ? 22 : 16, esHero ? "arriveSoft" : "arrive");
        const barra = tween(f, t.cards[i] + 12, 30, "arriveSoft");
        const aviso = i > 0 && i <= 2 ? springPreset(f, fps, "pop", t.cards[i] + 16) : 0;
        const desenfoque = esHero ? 0 : empuje * 7;
        const tinta = textoSobre(v, alterna);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x * u,
              top: c.y * u,
              width: c.w * u,
              height: c.h * u,
              borderRadius: (esHero ? v.radio : v.radio * 0.7) * u,
              padding: (esHero ? 40 : 28) * u,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: tinta,
              ...superficie(v, u, alterna),
              opacity: Math.min(1, p / 0.6),
              transform: `translateY(${(1 - p) * 50 * u}px) scale(${0.94 + 0.06 * p})`,
              filter: `blur(${((1 - p) * 8 + desenfoque) * u}px)`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: marca.fuenteTexto, fontWeight: 500, fontSize: (esHero ? 30 : 24) * u, color: alterna ? `${tinta}AA` : v.suave }}>
                {etq}
              </div>
              {i > 0 && i <= 2 ? (
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `${15 * u}px solid transparent`,
                    borderRight: `${15 * u}px solid transparent`,
                    borderBottom: `${26 * u}px solid ${i === 1 ? v.alerta : v.aviso}`,
                    transform: `scale(${0.6 + 0.4 * aviso})`,
                    opacity: Math.min(1, aviso * 2),
                  }}
                />
              ) : null}
            </div>
            <div>
              <div
                style={{
                  fontFamily: marca.fuenteTitulo,
                  fontWeight: 700,
                  fontSize: (esHero ? 118 : 64) * u,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.95,
                }}
              >
                {val}
              </div>
              <div style={{ marginTop: 18 * u, height: 8 * u, borderRadius: 4 * u, background: `${tinta}22`, overflow: "hidden" }}>
                <div style={{ width: `${barra * (esHero ? 72 : 40 + 15 * i) }%`, height: "100%", background: v.acento }} />
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Contador dentro de una pill; la pill se vacía y muta a la palabra clave con un check (lpFv-bB-RuM). */
const Contador: React.FC<Ctx> = ({ e, v, L, geo, u }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = tContador(L);
  const pill = arrive(f, t.pill, 18, "arriveSoft");
  const cuenta = tween(f, t.cuenta, t.dur, "arrive");
  const valor = Math.round(mix(cuenta, e.desde, e.hasta));
  const morph = tween(f, t.morph, 18, "move");
  const vacia = leave(f, t.morph, 6, "leave");
  const clave = arrive(f, t.clave, 14, "arrive");
  const check = springPreset(f, fps, "pop", t.check);
  const palabra = e.items[0] ?? "";
  const wP = Math.min(geo.cw, 760);
  const hP = 140;
  const wK = Math.min(geo.cw, 640);
  const hK = 300;
  const w = mix(morph, wP, palabra ? wK : wP);
  const h = mix(morph, hP, palabra ? hK : hP);
  const cx = geo.W / 2;
  const cy = (geo.yMain + geo.yBot) / 2 - 40;
  const alertas = t.alertas.map((at, k) => ({ p: springPreset(f, fps, "pop", at), x: k ? cx + wP * 0.48 : cx - wP * 0.46, y: k ? cy + 190 : cy - 180, c: k ? v.aviso : v.alerta }));
  return (
    <AbsoluteFill>
      <Rotulo texto={e.titulo} v={v} geo={geo} u={u} />
      {alertas.map((a, k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: a.x * u,
            top: a.y * u,
            width: 0,
            height: 0,
            borderLeft: `${(k ? 22 : 30) * u}px solid transparent`,
            borderRight: `${(k ? 22 : 30) * u}px solid transparent`,
            borderBottom: `${(k ? 38 : 52) * u}px solid ${a.c}`,
            opacity: Math.min(1, a.p * 2) * (1 - morph * 0.7),
            transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * a.p}) rotate(${k ? 8 : -6}deg)`,
            filter: `blur(${(k ? 3 : 1.5) * u}px)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: (cx - w / 2) * u,
          top: (cy - h / 2) * u,
          width: w * u,
          height: h * u,
          borderRadius: mix(morph, 999, v.radio * 1.2) * u,
          border: `${2.5 * u}px solid ${v.acento}`,
          boxSizing: "border-box",
          ...superficie(v, u),
          opacity: Math.min(1, pill / 0.6),
          transform: `scale(${0.9 + 0.1 * pill})`,
          filter: `blur(${(1 - pill) * 10 * u}px)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            padding: `0 ${44 * u}px`,
            gap: 18 * u,
            opacity: 1 - vacia,
            filter: `blur(${vacia * 8 * u}px)`,
            fontFamily: marca.fuenteTexto,
            fontWeight: 500,
            fontSize: 44 * u,
            color: v.texto,
            whiteSpace: "nowrap",
          }}
        >
          {e.titulo}:
          <span style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 64 * u, color: v.acento, fontVariantNumeric: "tabular-nums" }}>
            {valor}
          </span>
        </div>
        {palabra ? (
          <div style={{ position: "absolute", left: 48 * u, bottom: 40 * u, overflow: "hidden" }}>
            <div
              style={{
                fontFamily: marca.fuenteTitulo,
                fontWeight: 700,
                fontSize: 120 * u,
                letterSpacing: "-0.04em",
                lineHeight: 1.02,
                color: v.texto,
                transform: `translateY(${(1 - clave) * 110}%)`,
              }}
            >
              {palabra}
            </div>
          </div>
        ) : null}
        {palabra ? (
          <div
            style={{
              position: "absolute",
              right: 36 * u,
              top: 36 * u,
              width: 64 * u,
              height: 64 * u,
              borderRadius: 999,
              background: v.acento,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.min(1, check * 2),
              transform: `scale(${0.6 + 0.4 * check})`,
            }}
          >
            <svg width={30 * u} height={30 * u} viewBox="0 0 30 30">
              <path d="M6 16 L12 22 L24 9" fill="none" stroke={v.sobreAcento} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const LAYOUT_BENTO: Omit<CeldaBento, "titulo" | "valor">[] = [
  { col: 0, fila: 0, w: 2, h: 1, tono: "acento" },
  { col: 0, fila: 1, w: 1, h: 2, tono: "oscuro" },
  { col: 1, fila: 1, tono: "claro" },
  { col: 1, fila: 2, tono: "superficie" },
  { col: 0, fila: 3, w: 2, h: 1, tono: "claro" },
  { col: 0, fila: 4, w: 1, h: 1, tono: "oscuro" },
];

/** Bento: la cámara viaja de celda en celda y retrocede a la grilla (tiktok-7521798862521060630). */
const Bento: React.FC<Ctx> = ({ e, v, L, geo, u }) => {
  const items = e.items.slice(0, LAYOUT_BENTO.length).map(partir);
  const t = tBento(L, v.ov, items.length);
  const celdas: CeldaBento[] = items.map(([titulo, valor], i) => {
    const pct = /%\s*$/.test(valor) ? parseFloat(valor.replace(",", ".")) : NaN;
    return { ...LAYOUT_BENTO[i], titulo, valor, barra: Number.isFinite(pct) ? clamp(Math.abs(pct) / 100, 0, 1) : undefined };
  });
  const filas = Math.max(1, ...celdas.map((c) => c.fila + (c.h ?? 1)));
  const alto = Math.min(geo.yBot - geo.yMain - 20, filas * 300);
  const claro = { fondo: v.trat === "cristal" ? "#ece3f2" : v.sup, texto: v.trat === "cristal" ? marca.colores.sombraCalida : v.texto, suave: v.suave };
  const oscuro = { fondo: v.sup2, texto: v.trat === "papel" ? v.texto : v.sup2 === marca.colores.fondo ? marca.colores.texto : v.sobreAcento, suave: v.suave };
  return (
    <AbsoluteFill>
      <Rotulo texto={e.titulo} v={v} geo={geo} u={u} />
      <div style={{ position: "absolute", left: 0, top: geo.yMain * u, width: geo.W * u, height: (geo.yBot - geo.yMain) * u }}>
        <BentoGrid
          celdas={celdas}
          columnas={2}
          filas={filas}
          ancho={geo.cw}
          alto={alto}
          gap={22}
          radio={v.radio}
          delay={4}
          foco={{ x: 0.2, y: 0.1 }}
          inclinado={v.inclinado}
          rotX={22}
          rotZ={-6}
          camara={{ recorrido: [0, 1, 3, 4].slice(0, t.paradas), inicio: 26, porCelda: t.por, zoom: 1.6, volver: true }}
          colores={{
            acento: { fondo: v.acento, texto: v.sobreAcento, suave: `${v.sobreAcento}AA` },
            claro,
            oscuro,
            superficie: { fondo: v.trat === "cristal" ? "#2b1636" : v.sup, texto: v.trat === "cristal" ? v.texto : v.texto, suave: v.suave },
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/** Morph: la tarjeta cambia de proporción por paso, con nodos que se encienden (tiktok-7613879612723957012). */
const Morph: React.FC<Ctx> = ({ e, v, L, geo, u }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(1, e.items.length);
  const ts = tMorph(L, v.ov, n);
  const cx = geo.W / 2;
  const cy = (geo.yMain + geo.yBot) / 2 - 60;
  const formas = [
    { w: Math.min(geo.cw * 0.62, 600), h: 760 },
    { w: geo.cw, h: 460 },
    { w: Math.min(geo.cw * 0.74, 700), h: 620 },
    { w: geo.cw * 0.9, h: 380 },
  ];
  const disponible = geo.yBot - geo.yMain - 160;
  const estados: EstadoCard[] = ts.map((at, i) => {
    const fo = formas[i % formas.length];
    return { w: fo.w, h: Math.min(fo.h, disponible), x: cx + (i % 2 ? 0 : -geo.cw * 0.06), y: cy, at, radio: i % 2 ? v.radio * 0.8 : v.radio * 1.4 };
  });
  const tinta = v.trat === "papel" ? v.texto : v.sobreAcento;
  const fondoCard = v.trat === "cristal" ? v.acento : v.trans === "barrido" ? v.sup2 : v.trat === "papel" ? v.sup2 : v.acento;
  return (
    <AbsoluteFill>
      <Rotulo texto={e.titulo} v={v} geo={geo} u={u} />
      <CardMorph
        estados={estados}
        color={fondoCard}
        blur={30}
        contenidos={e.items.map((txt, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, padding: 44 * u, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontFamily: marca.fuenteMono, fontSize: 26 * u, color: tinta, opacity: 0.7 }}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 76 * u, letterSpacing: "-0.035em", lineHeight: 1, color: tinta }}>{txt}</div>
          </div>
        ))}
      />
      {/* Nodos con línea conectora que crece al paso de la tarjeta. */}
      <div style={{ position: "absolute", left: geo.x0 * u, top: (geo.yBot - 60) * u, width: geo.cw * u, height: 24 * u }}>
        <div style={{ position: "absolute", left: 12 * u, right: 12 * u, top: 10 * u, height: 4 * u, background: `${v.texto}1F` }} />
        <div
          style={{
            position: "absolute",
            left: 12 * u,
            top: 10 * u,
            height: 4 * u,
            background: v.acento,
            width: ((geo.cw - 24) * u * ts.reduce((acc, at, i) => acc + (i === 0 ? 0 : tween(f, at, 14, "move") / Math.max(1, n - 1)), 0)),
          }}
        />
        {ts.map((at, i) => {
          const p = springPreset(f, fps, "snappy", at + 6);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (12 + ((geo.cw - 24) * i) / Math.max(1, n - 1)) * u,
                top: 12 * u,
                width: 24 * u,
                height: 24 * u,
                borderRadius: 999,
                border: `${3 * u}px solid ${v.acento}`,
                background: p > 0.5 ? v.acento : v.fondoIni,
                boxSizing: "border-box",
                transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * Math.min(1.1, p)})`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Interfaz de muestra cuando no hay captura del cliente. */
const InterfazMuestra: React.FC<{ v: Variante; ancho: number; alto: number; u: number }> = ({ v, ancho, alto, u }) => {
  const f = useCurrentFrame();
  const oscura = v.trat === "cristal" || v.pasos;
  const fondo = oscura ? marca.colores.fondo : "#F7F7F4";
  const linea = oscura ? "#FFFFFF1A" : "#1414141A";
  const tinta = oscura ? marca.colores.texto : marca.colores.fondo;
  const t = [12, 17, 21, 26, 29];
  return (
    <div style={{ position: "absolute", inset: 0, background: fondo, display: "flex" }}>
      <div style={{ width: ancho * 0.24 * u, borderRight: `${1.5 * u}px solid ${linea}`, padding: 28 * u, boxSizing: "border-box" }}>
        {[0.8, 0.6, 0.7, 0.5].map((w, i) => (
          <div key={i} style={{ height: 16 * u, width: `${w * 100}%`, borderRadius: 8 * u, background: i === 1 ? v.acento : linea, marginBottom: 26 * u }} />
        ))}
      </div>
      <div style={{ flex: 1, padding: 36 * u, boxSizing: "border-box" }}>
        <div style={{ height: 30 * u, width: "46%", borderRadius: 8 * u, background: tinta, opacity: 0.85, marginBottom: 40 * u }} />
        {t.map((at, i) => {
          const p = arrive(f, at, i % 2 ? 12 : 14, "arriveGentle");
          const activa = i === 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22 * u,
                padding: `${20 * u}px ${18 * u}px`,
                marginBottom: 14 * u,
                borderRadius: 14 * u,
                background: activa ? `${v.acento}26` : "transparent",
                border: `${1.5 * u}px solid ${activa ? v.acento : linea}`,
                ...enterStyle(p, 16 * u),
              }}
            >
              <div style={{ width: 44 * u, height: 44 * u, borderRadius: 999, background: activa ? v.acento : linea }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14 * u, width: `${70 - i * 7}%`, borderRadius: 7 * u, background: tinta, opacity: 0.75, marginBottom: 10 * u }} />
                <div style={{ height: 12 * u, width: `${45 + i * 5}%`, borderRadius: 6 * u, background: linea }} />
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            right: 40 * u,
            bottom: alto * 0.08 * u,
            padding: `${18 * u}px ${34 * u}px`,
            borderRadius: 999,
            background: v.acento,
            color: v.sobreAcento,
            fontFamily: marca.fuenteTexto,
            fontWeight: 600,
            fontSize: 26 * u,
          }}
        >
          Continuar
        </div>
      </div>
    </div>
  );
};

/** Captura del producto en una ventana; el cursor hace dos clics y la cámara se acerca (DryieyoUmLc). */
const Captura: React.FC<Ctx> = ({ e, v, L, geo, u, marcaNombre }) => {
  const t = tCaptura(L, v.ov);
  const alturaUtil = geo.yBot - geo.yMain - 60;
  const ancho = geo.cw;
  const alto = Math.min(alturaUtil, geo.H > geo.W ? ancho * 1.25 : ancho * 0.66);
  const izq = (geo.W - ancho) / 2;
  const arriba = geo.yMain + 20;
  const [et1 = "", et2 = ""] = e.items;
  const puntos: PuntoCursor[] = [
    { x: geo.W * 0.86, y: geo.H * 0.84, at: t.cursor },
    { x: izq + ancho * 0.8, y: arriba + 48 + alto * 0.86, at: t.clic1, clic: true, etiqueta: et1 || undefined },
    { x: izq + ancho * 0.52, y: arriba + 48 + alto * 0.42, at: t.clic2, clic: true, etiqueta: et2 || undefined, arco: -0.2 },
  ];
  return (
    <AbsoluteFill>
      <Rotulo texto={e.titulo} v={v} geo={geo} u={u} />
      <div style={{ position: "absolute", left: izq * u, top: arriba * u }}>
        <ScreenFrame
          ancho={ancho}
          alto={alto}
          radio={v.radio}
          ventana
          titulo={`${marcaNombre.toLowerCase().replace(/\s+/g, "")}.app`}
          delay={2}
          zonas={[{ x: ancho * 0.24, y: alto * 0.16, w: ancho * 0.7, h: alto * 0.42, at: t.zoom, anotacion: "rect" }]}
          zoomMax={1.6}
          colorMarco={v.trat === "cristal" ? marca.colores.sombraCalida : v.sup}
          colorBorde={`${v.texto}24`}
          colorAnotacion={v.acento}
        >
          {e.media ? <Media src={e.media} /> : <InterfazMuestra v={v} ancho={ancho} alto={alto} u={u} />}
        </ScreenFrame>
      </div>
      <Cursor
        puntos={puntos}
        colorFlecha="#F6F5F0"
        colorBorde="#141414"
        colorOnda={v.acento}
        colorEtiqueta={v.acento}
        colorTextoEtiqueta={v.sobreAcento}
      />
    </AbsoluteFill>
  );
};

/** Lista de acciones: chips apilados con hora y línea de nodos que baja (lpFv-bB-RuM + tiktok-7613879612723957012). */
const Lista: React.FC<Ctx> = ({ e, v, L, geo, u }) => {
  const f = useCurrentFrame();
  const items = e.items.map(partir);
  const ts = tLista(L, v.ov, items.length);
  const alto = 150;
  const sep = 34;
  const y0 = geo.yMain + 60;
  const crece = ts.reduce((acc, at, i) => acc + (i === 0 ? 0 : tween(f, at, 16, "arriveSoft")), 0);
  return (
    <AbsoluteFill>
      <Rotulo texto={e.titulo} v={v} geo={geo} u={u} />
      <div
        style={{
          position: "absolute",
          left: (geo.x0 + 22) * u,
          top: (y0 + alto / 2) * u,
          width: 4 * u,
          height: crece * (alto + sep) * u,
          background: v.acento,
          borderRadius: 2 * u,
        }}
      />
      {items.map(([txt, hora], i) => {
        const p = arrive(f, ts[i], i % 2 ? 14 : 12, "arriveSoft");
        const atenua = i < items.length - 1 ? tween(f, ts[i + 1], 10, "arriveGentle") : 0;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: geo.x0 * u,
                top: (y0 + i * (alto + sep) + alto / 2 - 24) * u,
                width: 48 * u,
                height: 48 * u,
                borderRadius: 999,
                background: v.acento,
                border: `${5 * u}px solid ${v.fondoIni}`,
                boxSizing: "border-box",
                transform: `scale(${0.6 + 0.4 * p})`,
                opacity: Math.min(1, p / 0.4),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: (geo.x0 + 80) * u,
                top: (y0 + i * (alto + sep)) * u,
                width: (geo.cw - 80) * u,
                height: alto * u,
                borderRadius: v.radio * 0.8 * u,
                padding: `0 ${36 * u}px`,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 8 * u,
                ...superficie(v, u),
                ...enterStyle(p, 40 * u),
                opacity: Math.min(1, p / 0.6) * (1 - 0.5 * atenua),
              }}
            >
              <div style={{ fontFamily: marca.fuenteTexto, fontWeight: 600, fontSize: 40 * u, color: v.texto }}>{txt}</div>
              {hora ? <div style={{ fontFamily: marca.fuenteMono, fontSize: 26 * u, color: v.suave }}>{hora}</div> : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const ESCENAS: Record<Escena["tipo"], React.FC<Ctx>> = {
  gancho: Gancho,
  tarjetas: Tarjetas,
  contador: Contador,
  bento: Bento,
  morph: Morph,
  captura: Captura,
  lista: Lista,
};

/** Cierre: dos barras barren el cuadro (sin bloom), entra el wordmark y se sostiene (AI-44). */
const Cierre: React.FC<{ v: Variante; marcaNombre: string; frase: string; cta: string; geo: Geo; u: number }> = ({ v, marcaNombre, frase, cta, geo, u }) => {
  const f = useCurrentFrame();
  const barraA = tween(f, 0, 14, "snap");
  const barraB = tween(f, 4, 16, "snap");
  const wm = arrive(f, 10, 18, "arriveSoft");
  const fr = arrive(f, 20, 12, "arrive");
  const subraya = tween(f, 26, 16, "arriveSoft");
  const pCta = arrive(f, 32, 12, "arriveGentle");
  const y = geo.yTop + (geo.yBot - geo.yTop) * 0.34;
  const yCta = y + 330;
  return (
    <AbsoluteFill>
      {[barraA, barraB].map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: (y + (i ? 120 : -10)) * u,
            width: geo.W * 0.7 * u,
            height: (i ? 40 : 90) * u,
            borderRadius: 999,
            background: i ? v.texto : v.acento,
            opacity: b > 0 && b < 1 ? 1 : 0,
            transform: `translateX(${mix(b, -geo.W * 0.8, geo.W * 1.1) * u}px) skewX(-12deg)`,
          }}
        />
      ))}
      <div style={{ position: "absolute", left: geo.x0 * u, top: y * u, overflow: "hidden" }}>
        <div
          style={{
            fontFamily: marca.fuenteTitulo,
            fontWeight: 700,
            fontSize: 180 * u,
            letterSpacing: "-0.05em",
            lineHeight: 1.02,
            color: v.texto,
            transform: `translateY(${(1 - wm) * 105}%)`,
          }}
        >
          {marcaNombre}
        </div>
      </div>
      <div style={{ position: "absolute", left: geo.x0 * u, top: (y + 200) * u, width: 160 * u * subraya, height: 6 * u, borderRadius: 3 * u, background: v.acento }} />
      <div
        style={{
          position: "absolute",
          left: geo.x0 * u,
          top: (y + 232) * u,
          maxWidth: geo.cw * u,
          fontFamily: marca.fuenteTexto,
          fontWeight: 500,
          fontSize: 46 * u,
          lineHeight: 1.2,
          color: v.suave,
          ...enterStyle(fr, 18 * u),
        }}
      >
        {frase}
      </div>
      {cta ? (
        <>
          <div
            style={{
              position: "absolute",
              left: geo.x0 * u,
              top: yCta * u,
              padding: `${24 * u}px ${44 * u}px`,
              borderRadius: 999,
              background: v.acento,
              color: v.sobreAcento,
              fontFamily: marca.fuenteTexto,
              fontWeight: 600,
              fontSize: 38 * u,
              ...enterStyle(pCta, 20 * u),
            }}
          >
            {cta}
          </div>
          <Cursor
            puntos={[
              { x: geo.W * 0.88, y: geo.H * 0.86, at: 36 },
              { x: geo.x0 + 150, y: yCta + 50, at: 54, clic: true },
            ]}
            colorFlecha="#F6F5F0"
            colorBorde="#141414"
            colorOnda={v.acento}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ── Composición ─────────────────────────────────────────────────────────────────────────────────

const largos = (p: Props) => p.escenas.map((e) => Math.max(V[p.variante].ov + 24, cuadros(e.segundos)));

export const SaasUiCristal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const base = V[p.variante];
  const v: Variante = {
    ...base,
    fondoIni: p.colores.fondo ?? base.fondoIni,
    fondoFin: p.colores.fondo ?? base.fondoFin,
    texto: p.colores.texto ?? base.texto,
    acento: p.colores.acento ?? base.acento,
  };
  const geo = useGeo(v);
  const { u } = geo;
  const Ls = largos(p);
  const inicios = Ls.reduce<number[]>((acc, L, i) => [...acc, i === 0 ? 0 : acc[i - 1] + Ls[i - 1] - v.ov], []);
  const finEscenas = inicios.length ? inicios[inicios.length - 1] + Ls[Ls.length - 1] - v.ov : 0;
  const luz = tween(frame, 0, durationInFrames, "glide");
  const fondo = interpolateColors(luz, [0, 1], [v.fondoIni, v.fondoFin]);

  return (
    <AbsoluteFill style={{ backgroundColor: fondo }}>
      {/* La luz sube hacia el centro de la pieza (medido en lpFv-bB-RuM), con temperatura de la variante. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(90% 60% at 50% ${70 - 25 * luz}%, ${v.fondoFin}CC 0%, transparent 70%)`,
          opacity: 0.4 + 0.5 * luz,
        }}
      />
      {p.escenas.map((e, i) => {
        const L = Ls[i];
        const Comp = ESCENAS[e.tipo];
        const relleno = rellenar(eventosDe(e, L, v.ov), L - v.ov);
        return (
          <Sequence key={i} from={inicios[i]} durationInFrames={L} layout="none">
            <Plano L={L} v={v} primero={i === 0} ultimo={false} relleno={relleno}>
              {v.pasos && e.tipo !== "gancho" ? <Pasos i={i} n={p.escenas.length} v={v} geo={geo} u={u} /> : null}
              <Comp e={e} v={v} L={L} geo={geo} u={u} marcaNombre={p.marca} />
            </Plano>
          </Sequence>
        );
      })}
      <Sequence from={finEscenas} durationInFrames={cuadros(p.segundosCierre)} layout="none">
        <Plano L={cuadros(p.segundosCierre)} v={v} primero={false} ultimo relleno={[]}>
          <Cierre v={v} marcaNombre={p.marca} frase={p.frase} cta={p.cta} geo={geo} u={u} />
        </Plano>
      </Sequence>
      <Look grain={v.grano} vignette={v.vineta} warmth={v.tinte} />
    </AbsoluteFill>
  );
};

export const saasUiCristal = definir({
  id: "Plantilla-SaasUiCristal",
  fuente: "saas-ui-cristal: lpFv-bB-RuM, tiktok-7521798862521060630, tiktok-7613879612723957012, tiktok-7698861538307788033, DryieyoUmLc",
  resumen: "Una toma continua donde cada idea sale de la anterior: tarjetas de cristal, contador, bento, morph y captura con cursor.",
  cuando: "Presentar un software o una función: anuncio de producto, lanzamiento o demo de interfaz.",
  schema,
  componente: SaasUiCristal,
  defaultProps: {
    variante: "noche-cristal",
    escenas: [
      { tipo: "gancho", titulo: "", items: ["Cada", "segundo", "cuenta"], desde: 0, hasta: 0, media: "", segundos: 1.8 },
      { tipo: "tarjetas", titulo: "Estado del turno", items: ["Tickets abiertos|128", "Espera|2:40", "Resueltos|86 %", "Canales|4"], desde: 0, hasta: 0, media: "", segundos: 2.8 },
      { tipo: "contador", titulo: "Agentes activos", items: ["SLA al día"], desde: 12, hasta: 200, media: "", segundos: 3.4 },
      { tipo: "bento", titulo: "Tu semana", items: ["Respuesta media|38 s", "Satisfacción|4,8", "Escalados|22 %", "Turnos cubiertos|14", "Idiomas|6"], desde: 0, hasta: 0, media: "", segundos: 3.6 },
      { tipo: "morph", titulo: "Una llamada, resuelta", items: ["Detecta el motivo", "Busca el pedido", "Propone el cambio", "Confirma por correo"], desde: 0, hasta: 0, media: "", segundos: 3.6 },
      { tipo: "captura", titulo: "Así se ve por dentro", items: ["Abrir caso", "Enviar guía"], desde: 0, hasta: 0, media: "", segundos: 3.4 },
      { tipo: "lista", titulo: "Hecho en 4 minutos", items: ["Correo enviado|16:11", "Guía compartida|16:15", "Caso cerrado|16:18"], desde: 0, hasta: 0, media: "", segundos: 2.8 },
    ],
    marca: "Cauce",
    frase: "Soporte que atiende mientras duermes.",
    cta: "",
    segundosCierre: 3,
    colores: {},
  },
  duracion: (p) => {
    const ov = V[p.variante].ov;
    const Ls = largos(p);
    return Ls.reduce((s, L) => s + L - ov, 0) + cuadros(p.segundosCierre);
  },
  formatos: ["vertical", "retrato", "cuadrado"],
});
