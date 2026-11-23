import { loadFont as cargarPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, random, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { BlenderLayer } from "../../components/presets/BlenderLayer";
import { CameraRig } from "../../components/presets/CameraRig";
import { GlitchHit } from "../../components/presets/GlitchHit";
import { Look } from "../../components/presets/Look";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, enterStyle, leave, mix, springPreset, staggerDelay, tween } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, esVideo, resolverMedia, zColores, zMedia } from "../base";

/**
 * Plantilla `showcase-dispositivo` (kb/14). Pantallas que se suceden dentro de un dispositivo dibujado en código
 * (teléfono o laptop), con la cámara como narradora: el dispositivo entra, la cámara se pega a la pantalla, se
 * inclina, y al final retrocede para el cierre. Cada pantalla es una pieza (inicio, bloqueo, cámara/captura,
 * mapa, titular, rejilla con onda, eco, datos) y cada cambio es un golpe corto (fundido, empuje, flash, tinta,
 * bloques). Si hay un render 3D del dispositivo (Blender en el VPS de Bodega o en este equipo), entra por `render3d`.
 *
 * Videos de origen (referentes/lote-2026-11-08.md, recetas en referentes/_raw/videos/<id>/receta.json):
 * - DiH9Pek312c → variante `telefono-3d`: el teléfono vuela girando y asienta (arriveSoft 29 f), los iconos salen
 *   despedidos en un golpe (5 f), push-in a pantalla completa con swap (move 20 f), swaps por fundido de 10 f y
 *   flash de 8 f, inclinación de ~25° siguiendo el mapa, retroceso final lento (glide 40 f) con balanceo mínimo.
 * - tiktok-7693603336481803542 → variante `laptop-catalogo`: laptop fijo en 3/4, "una pieza = una técnica" dentro
 *   de la pantalla, flash de 6 f, mancha de tinta como máscara (8 f), pixelado por bloques (7 f), eco de una
 *   palabra, rejilla con onda (arriveSoft 40 f), dashboard que cuenta, revelado de la marca letra a letra.
 *
 * Qué se tomó: la secuencia lógica de pantallas como guion visual, el empuje de cámara en vez del corte, el golpe
 * visual alineado a un acento, los tiempos medidos de cada swap y el cierre con el dispositivo quieto.
 * Qué NO se copió (kb/10): la interfaz del compositor, su franja de degradado magenta→violeta (AI-20), los
 * wallpapers, nombres y logos de las apps de la fuente, el laptop renderizado y su reflejo, el asterisco y el
 * rótulo del autor, el glow; tampoco el teléfono flotando en el vacío (AI-31): aquí apoya sobre una superficie
 * con sombra de contacto. Pantallas, textos y cifras son props con defaults de una app ficticia.
 *
 * Fuente extra: Playfair Display itálica (subtítulos de los titulares), Google Fonts, licencia OFL.
 */

const playfair = cargarPlayfair("italic", { weights: ["400"], subsets: ["latin"] });

const VARIANTES = ["telefono-3d", "laptop-catalogo"] as const;
type NombreVariante = (typeof VARIANTES)[number];

const CAMBIOS = ["fundido", "empuje", "flash", "tinta", "bloques"] as const;
type Cambio = (typeof CAMBIOS)[number];

type Variante = {
  fuente: string;
  dispositivo: "telefono" | "laptop";
  camaraLibre: boolean; // la laptop no mueve la cámara (medido): todo pasa dentro de la pantalla
  fondo: string;
  piso: string;
  texto: string;
  suave: string;
  acento: string;
  secundario: string;
  claro: string;
  noche: string;
  cuerpo: string;
  dur: Record<Cambio, number>;
  grano: number;
  vineta: number;
  tinte: string;
};

const V: Record<NombreVariante, Variante> = {
  "telefono-3d": {
    fuente: "DiH9Pek312c",
    dispositivo: "telefono",
    camaraLibre: true,
    fondo: "#2A2A2E",
    piso: "#38383D",
    texto: "#F2F2F0",
    suave: "#A3A3A8",
    acento: "#4C7DFF",
    secundario: "#E5294B",
    claro: "#EDEBE4",
    noche: "#101624",
    cuerpo: "#1B1B1E",
    dur: { fundido: 10, empuje: 20, flash: 8, tinta: 10, bloques: 8 },
    grano: 0.05,
    vineta: 0.3,
    tinte: "#2A2A2E",
  },
  "laptop-catalogo": {
    fuente: "tiktok-7693603336481803542",
    dispositivo: "laptop",
    camaraLibre: false,
    fondo: "#2A2826",
    piso: "#33302D",
    texto: "#F1EFEA",
    suave: "#A29C94",
    acento: "#E8501C",
    secundario: "#1F3FD8",
    claro: "#E9ECEA",
    noche: "#0B1220",
    cuerpo: "#161617",
    dur: { fundido: 8, empuje: 12, flash: 6, tinta: 8, bloques: 7 },
    grano: 0.06,
    vineta: 0.4,
    tinte: "#2A2826",
  },
};

const TIPOS = ["inicio", "bloqueo", "media", "mapa", "titular", "rejilla", "eco", "datos"] as const;
const ENCUADRES = ["dispositivo", "pantalla", "inclinado"] as const;

export const schema = z.object({
  variante: z.enum(VARIANTES).default("telefono-3d").describe("dispositivo, paleta, cámara y golpes de cada video de origen"),
  dispositivo: z.enum(["auto", "telefono", "laptop"]).default("auto").describe("auto = el de la variante"),
  pantallas: z
    .array(
      z.object({
        tipo: z.enum(TIPOS),
        texto: z.string().default("").describe("titular, hora del bloqueo, rótulo del mapa o de los datos"),
        subtexto: z.string().default(""),
        items: z.array(z.string()).default([]).describe("bloqueo: notificaciones · datos: etiquetas de barras"),
        numero: z.number().default(0).describe("datos: cifra final (se muestra con signo y %)"),
        media: zMedia.describe("captura o video de la app del cliente; si hay, ocupa la pantalla"),
        segundos: z.number().min(1).max(6),
        encuadre: z.enum(ENCUADRES).default("dispositivo").describe("cámara: dispositivo entero, pegada a la pantalla o inclinada"),
        cambio: z.enum(CAMBIOS).default("fundido").describe("cómo entra esta pantalla sobre la anterior"),
      }),
    )
    .min(1),
  marca: z.string().describe("wordmark del splash final"),
  frase: z.string().default(""),
  render3d: zMedia.describe("video con alfa del dispositivo entrando (Blender); vacío = vuelo del dispositivo dibujado"),
  segundosCierre: z.number().min(1.5).max(5).default(2.6),
  colores: zColores,
});

type Props = z.infer<typeof schema>;
type Pantalla = Props["pantallas"][number];

// ── Utilidades ──────────────────────────────────────────────────────────────────────────────────

const JIT = [0, 2, -1, 3, -2, 1];

/** Tramos > max cuadros sin evento: ahí la cámara hace un re-encuadre corto (ritmo de anuncio, motion-audit D-01). */
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

// Eventos internos de cada tipo de pantalla (cuadros locales), los mismos que usan las piezas al animar.
const tInicio = (L: number) => ({ iconos: 4, ventana: 16, estallido: Math.max(20, L - 12) });
const tBloqueo = { reloj: 4, fecha: 9, notas: [18, 31] };
const tMapa = { ruta: 6, tarjeta: 14, pin: 40, giro: 0 };
const tDatos = (n: number) => ({ cifra: 4, dona: 8, barras: Array.from({ length: n }, (_, i) => 12 + i * 3 + JIT[i % JIT.length]) });

const eventosPantalla = (p: Pantalla, L: number): number[] => {
  switch (p.tipo) {
    case "inicio": {
      const t = tInicio(L);
      return [t.iconos, t.iconos + 6, t.iconos + 12, t.estallido];
    }
    case "bloqueo":
      return [tBloqueo.reloj, tBloqueo.fecha, ...tBloqueo.notas.slice(0, Math.max(1, p.items.length))];
    case "media":
      return [8, 10, Math.round(L * 0.6)];
    case "mapa":
      return [tMapa.ruta, tMapa.tarjeta, tMapa.pin];
    case "titular":
      return [3, 12, Math.round(L * 0.6)];
    case "rejilla":
      return [4, Math.round(L * 0.55)];
    case "eco":
      return [4, 6, 8, 10, Math.round(L * 0.5)];
    case "datos": {
      const t = tDatos(Math.max(4, p.items.length));
      return [t.cifra, t.dona, ...t.barras];
    }
  }
};

const Media: React.FC<{ src: string; estilo?: React.CSSProperties }> = ({ src, estilo }) => {
  const url = resolverMedia(src);
  const s: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", ...estilo };
  return esVideo(src) ? <OffthreadVideo src={url} muted style={s} /> : <Img src={url} style={s} />;
};

// ── Piezas de pantalla ──────────────────────────────────────────────────────────────────────────

type CtxPantalla = { p: Pantalla; v: Variante; L: number; w: number; h: number; u: number };

/** Inicio: iconos que encajan y salen despedidos en el golpe (DiH9Pek312c). */
const Inicio: React.FC<CtxPantalla> = ({ v, L, w, h, u }) => {
  const f = useCurrentFrame();
  const t = tInicio(L);
  const cols = 4;
  const filas = 5;
  const lado = w * 0.17;
  const gx = (w - cols * lado) / (cols + 1);
  const tonos = [v.acento, v.secundario, "#F2C14E", "#2BB673", "#F08A3C", "#5BC0EB", v.claro, "#9AA5B1"];
  const estalla = tween(f, t.estallido, 8, "snap");
  const n = cols * filas;
  // Stagger no lineal, pero sin que la cola del stagger junte varios iconos en el mismo cuadro (AI-02).
  const inis = Array.from({ length: n }, (_, i) => t.iconos + staggerDelay(i, n, t.ventana));
  for (let i = 1; i < n; i++) inis[i] = Math.max(inis[i], inis[i - 1] + 1);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${v.noche} 0%, ${v.acento}55 100%)` }}>
      {Array.from({ length: n }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = gx + c * (lado + gx);
        const y = h * 0.12 + r * (lado + gx * 1.25);
        const ini = inis[i];
        const q = arrive(f, ini, i % 3 ? 10 : 12, i % 3 ? "arrive" : "arriveSoft");
        const dx = x + lado / 2 - w / 2;
        const dy = y + lado / 2 - h / 2;
        const lejos = 1.8 + random(`ic${i}`) * 1.2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x * u,
              top: y * u,
              width: lado * u,
              height: lado * u,
              borderRadius: lado * 0.26 * u,
              background: tonos[i % tonos.length],
              opacity: Math.min(1, q / 0.5) * (1 - estalla * 0.9),
              transform: `translate(${dx * estalla * lejos * u}px, ${dy * estalla * lejos * u}px) scale(${(0.7 + 0.3 * q) * (1 + estalla * 0.4)}) rotate(${estalla * (random(`rot${i}`) - 0.5) * 90}deg)`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: w * 0.06 * u, right: w * 0.06 * u, bottom: h * 0.03 * u, height: lado * 1.3 * u, borderRadius: lado * 0.4 * u, background: "#FFFFFF22", opacity: 1 - estalla }} />
    </AbsoluteFill>
  );
};

/** Bloqueo: reloj grande, fecha y notificaciones que bajan. */
const Bloqueo: React.FC<CtxPantalla> = ({ p, v, w, h, u }) => {
  const f = useCurrentFrame();
  const reloj = arrive(f, tBloqueo.reloj, 14, "arriveSoft");
  const fecha = arrive(f, tBloqueo.fecha, 12, "arrive");
  const notas = (p.items.length ? p.items : ["Tienes una novedad"]).slice(0, 2);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(200deg, ${v.acento} 0%, ${v.noche} 55%, ${v.secundario} 130%)` }}>
      <div style={{ position: "absolute", left: "50%", top: "62%", width: w * 1.1 * u, height: w * 1.1 * u, borderRadius: "50%", border: `${w * 0.05 * u}px solid ${v.secundario}88`, transform: "translateX(-50%)", filter: `blur(${2 * u}px)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.07 * u, textAlign: "center", fontFamily: marca.fuenteTexto, fontWeight: 500, fontSize: w * 0.05 * u, color: "#EEF1F7", ...enterStyle(fecha, 10 * u) }}>
        {p.subtexto}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: h * 0.1 * u,
          textAlign: "center",
          fontFamily: marca.fuenteTitulo,
          fontWeight: 500,
          fontSize: w * 0.27 * u,
          letterSpacing: "-0.04em",
          color: "#F4F6FA",
          ...enterStyle(reloj, 30 * u),
        }}
      >
        {p.texto}
      </div>
      {notas.map((txt, i) => {
        const q = arrive(f, tBloqueo.notas[i], i ? 14 : 16, i ? "arrive" : "arriveSoft");
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: w * 0.05 * u,
              right: w * 0.05 * u,
              top: (h * 0.42 + i * w * 0.22) * u,
              padding: `${w * 0.04 * u}px ${w * 0.05 * u}px`,
              borderRadius: w * 0.06 * u,
              background: "#F4F6FAE6",
              display: "flex",
              alignItems: "center",
              gap: w * 0.04 * u,
              ...enterStyle(q, -40 * u),
            }}
          >
            <div style={{ width: w * 0.1 * u, height: w * 0.1 * u, borderRadius: w * 0.025 * u, background: i ? v.secundario : v.acento, flexShrink: 0 }} />
            <div style={{ fontFamily: marca.fuenteTexto, fontWeight: 600, fontSize: w * 0.048 * u, color: "#16181D", lineHeight: 1.2 }}>{txt}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Captura del cliente, o visor de cámara de muestra con foco y disparo. */
const MediaPantalla: React.FC<CtxPantalla> = ({ p, v, L, w, h, u }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const push = tween(f, 0, L, "glide");
  const chip = arrive(f, 8, 12, "arriveGentle");
  const foco = springPreset(f, fps, "snappy", 10);
  const disparo = tween(f, Math.round(L * 0.6), 5, "snap");
  const destello = disparo > 0 && disparo < 1 ? 1 - disparo : 0;
  return (
    <AbsoluteFill style={{ background: v.noche }}>
      <AbsoluteFill style={{ transform: `scale(${1 + 0.08 * push})` }}>
        {p.media ? (
          <Media src={p.media} />
        ) : (
          <AbsoluteFill style={{ background: "linear-gradient(180deg, #9DB4C8 0%, #C9D6DF 45%, #6E8B5E 46%, #4E6B41 100%)" }}>
            <div style={{ position: "absolute", left: "8%", top: "28%", width: "38%", height: "22%", background: "#7C8E9C", clipPath: "polygon(0 100%, 45% 10%, 70% 55%, 100% 100%)" }} />
            <div style={{ position: "absolute", left: "40%", top: "24%", width: "56%", height: "26%", background: "#8A9BA8", clipPath: "polygon(0 100%, 35% 20%, 60% 50%, 80% 5%, 100% 100%)" }} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      {!p.media
        ? [1, 2].map((k) => (
            <div key={k}>
              <div style={{ position: "absolute", left: `${(k * 100) / 3}%`, top: 0, bottom: 0, width: 1.5 * u, background: "#FFFFFF55" }} />
              <div style={{ position: "absolute", top: `${(k * 100) / 3}%`, left: 0, right: 0, height: 1.5 * u, background: "#FFFFFF55" }} />
            </div>
          ))
        : null}
      {!p.media ? (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              width: w * 0.26 * u,
              height: w * 0.26 * u,
              border: `${3 * u}px solid #F2C14E`,
              borderRadius: 6 * u,
              transform: `translate(-50%, -50%) scale(${1.5 - 0.5 * Math.min(1, foco)})`,
              opacity: Math.min(1, foco * 2),
            }}
          />
          <div style={{ position: "absolute", left: "50%", bottom: h * 0.05 * u, width: w * 0.2 * u, height: w * 0.2 * u, borderRadius: "50%", border: `${5 * u}px solid #F4F6FA`, transform: `translateX(-50%) scale(${1 - 0.12 * destello})` }}>
            <div style={{ position: "absolute", inset: 6 * u, borderRadius: "50%", background: v.secundario }} />
          </div>
        </>
      ) : null}
      {p.texto ? (
        <div
          style={{
            position: "absolute",
            left: w * 0.06 * u,
            top: h * 0.06 * u,
            padding: `${w * 0.025 * u}px ${w * 0.045 * u}px`,
            borderRadius: 999,
            background: "#101624CC",
            color: "#F4F6FA",
            fontFamily: marca.fuenteTexto,
            fontWeight: 600,
            fontSize: w * 0.045 * u,
            ...enterStyle(chip, 12 * u),
          }}
        >
          {p.texto}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#F4F6FA", opacity: destello * 0.85 }} />
    </AbsoluteFill>
  );
};

/** Mapa: la ruta se dibuja (move), el pin cae y la tarjeta sube con el dato. */
const Mapa: React.FC<CtxPantalla> = ({ p, v, w, h, u }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ruta = tween(f, tMapa.ruta, 36, "move");
  const tarjeta = arrive(f, tMapa.tarjeta, 16, "arriveSoft");
  const pin = springPreset(f, fps, "pop", tMapa.pin);
  const giro = tween(f, tMapa.giro, 70, "glide");
  return (
    <AbsoluteFill style={{ background: v.claro, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${-8 * giro}deg) scale(${1.15 + 0.1 * giro})` }}>
        <svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect x="58" y="18" width="34" height="46" rx="4" fill="#CFE3C4" />
          <rect x="6" y="120" width="40" height="30" rx="4" fill="#CFE3C4" />
          <path d="M-10 60 L110 40" stroke="#FFFFFF" strokeWidth="7" />
          <path d="M20 -10 L36 210" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M-10 150 L110 120" stroke="#FFFFFF" strokeWidth="5" />
          <path d="M70 -10 L62 210" stroke="#FFFFFF" strokeWidth="4" />
          <path d="M-10 95 L110 105" stroke="#FFFFFF" strokeWidth="3" />
          <path
            d="M30 178 L34 140 L64 128 L66 100 L32 92 L28 56 L68 44"
            fill="none"
            stroke={v.acento}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - ruta}
          />
          <circle cx="30" cy="178" r="3.2" fill={v.acento} />
        </svg>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "66%",
          top: "21%",
          width: w * 0.1 * u,
          height: w * 0.1 * u,
          borderRadius: "50% 50% 50% 0",
          background: v.secundario,
          transform: `translate(-50%, ${(1 - Math.min(1, pin)) * -60 * u}px) rotate(-45deg) scale(${0.7 + 0.3 * pin})`,
          opacity: Math.min(1, pin * 3),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: w * 0.05 * u,
          right: w * 0.05 * u,
          bottom: h * 0.04 * u,
          padding: w * 0.05 * u,
          borderRadius: w * 0.06 * u,
          background: "#FBFAF6",
          boxShadow: `0 ${8 * u}px ${20 * u}px rgba(20,24,30,0.18)`,
          ...enterStyle(tarjeta, 40 * u),
        }}
      >
        <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: w * 0.075 * u, color: "#16181D", letterSpacing: "-0.03em" }}>{p.texto}</div>
        {p.subtexto ? <div style={{ fontFamily: marca.fuenteTexto, fontSize: w * 0.042 * u, color: "#5E6570", marginTop: 6 * u }}>{p.subtexto}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Titular: palabra por máscara sobre color pleno y subtítulo en serif itálica (laptop-catalogo). */
const Titular: React.FC<CtxPantalla> = ({ p, v, L, w, u }) => {
  const f = useCurrentFrame();
  const q = arrive(f, 3, 14, "arrive");
  const s = arrive(f, 12, 12, "arriveSoft");
  const aire = tween(f, Math.round(L * 0.6), 20, "glide");
  return (
    <AbsoluteFill style={{ background: v.acento, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            fontFamily: marca.fuenteTitulo,
            fontWeight: 700,
            fontSize: w * 0.17 * u,
            letterSpacing: `${-0.05 + 0.03 * aire}em`,
            lineHeight: 1.02,
            color: "#141110",
            transform: `translateY(${(1 - q) * 105}%)`,
          }}
        >
          {p.texto}
        </div>
      </div>
      {p.subtexto ? (
        <div style={{ fontFamily: playfair.fontFamily, fontStyle: "italic", fontSize: w * 0.055 * u, color: "#141110", marginTop: 4 * u, ...enterStyle(s, 12 * u) }}>{p.subtexto}</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Rejilla de puntos con dos ondas que la recorren (arriveSoft 40 f). */
const Rejilla: React.FC<CtxPantalla> = ({ p, v, L, w, h, u }) => {
  const f = useCurrentFrame();
  const o1 = tween(f, 4, 40, "arriveSoft");
  const o2 = tween(f, Math.round(L * 0.55), 36, "arriveSoft");
  const cols = 16;
  const filas = Math.max(6, Math.round((cols * h) / w));
  const paso = w / cols;
  const maxD = Math.hypot(w, h) / 2;
  const onda = (d: number, k: number) => (k > 0 && k < 1 ? Math.exp(-(((d - k * maxD) / (paso * 1.6)) ** 2)) : 0);
  return (
    <AbsoluteFill style={{ background: v.noche }}>
      {Array.from({ length: cols * filas }, (_, i) => {
        const x = (i % cols) * paso + paso / 2;
        const y = Math.floor(i / cols) * paso + paso / 2;
        const d = Math.hypot(x - w / 2, y - h / 2);
        const a = Math.max(onda(d, o1), onda(d, o2));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x * u,
              top: y * u,
              width: paso * 0.22 * u,
              height: paso * 0.22 * u,
              borderRadius: "50%",
              background: a > 0.3 ? v.acento : "#8C97AD",
              opacity: 0.35 + 0.65 * a,
              transform: `translate(-50%, -50%) scale(${1 + 1.6 * a})`,
            }}
          />
        );
      })}
      {p.texto ? (
        <div style={{ position: "absolute", left: w * 0.06 * u, bottom: h * 0.06 * u, fontFamily: marca.fuenteMono, fontSize: w * 0.035 * u, color: v.suave, letterSpacing: "0.08em", textTransform: "uppercase" }}>{p.texto}</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Eco: la palabra se repite en contorno desde el centro hacia afuera y luego se estira. */
const Eco: React.FC<CtxPantalla> = ({ p, v, L, w, u }) => {
  const f = useCurrentFrame();
  const estira = tween(f, Math.round(L * 0.5), 18, "snap");
  const filas = [-3, -2, -1, 0, 1, 2, 3];
  return (
    <AbsoluteFill style={{ background: v.claro, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {filas.map((k) => {
        const d = Math.abs(k);
        const q = arrive(f, 4 + d * 2, 8 + d * 2, "arrive");
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: marca.fuenteTitulo,
              fontWeight: 700,
              fontSize: w * 0.15 * u,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              color: k === 0 ? "#141110" : "transparent",
              WebkitTextStroke: k === 0 ? undefined : `${1.5 * u}px ${v.acento}`,
              opacity: Math.min(1, q / 0.5) * (k === 0 ? 1 : 1 - d * 0.18),
              transform: `translateY(calc(-50% + ${k * w * 0.15 * (0.9 + 0.35 * estira) * q * u}px)) scaleY(${1 + 0.25 * estira * (k === 0 ? 0 : 1)})`,
            }}
          >
            {p.texto}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Datos: cifra que cuenta, dona y barras con stagger (laptop-catalogo, dashboard). */
const Datos: React.FC<CtxPantalla> = ({ p, v, w, h, u }) => {
  const f = useCurrentFrame();
  const etiquetas = p.items.length ? p.items : ["L", "M", "X", "J", "V", "S"];
  const t = tDatos(etiquetas.length);
  const cuenta = tween(f, t.cifra, 28, "arrive");
  const dona = tween(f, t.dona, 30, "arriveSoft");
  const valor = Math.round(p.numero * cuenta);
  const r = 15.9;
  return (
    <AbsoluteFill style={{ background: v.claro, padding: w * 0.07 * u, boxSizing: "border-box" }}>
      <div style={{ fontFamily: marca.fuenteMono, fontSize: w * 0.034 * u, color: "#5E6570", letterSpacing: "0.06em", textTransform: "uppercase" }}>{p.texto}</div>
      <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: w * 0.18 * u, letterSpacing: "-0.05em", color: "#141110", lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
        {valor >= 0 ? "+" : ""}
        {valor}
        <span style={{ color: v.acento }}>%</span>
      </div>
      <svg viewBox="0 0 36 36" style={{ position: "absolute", right: w * 0.08 * u, top: h * 0.08 * u, width: w * 0.24 * u, height: w * 0.24 * u, transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#D3D7DA" strokeWidth="3.4" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={v.acento} strokeWidth="3.4" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - 0.68 * dona} />
      </svg>
      <div style={{ position: "absolute", left: w * 0.07 * u, right: w * 0.07 * u, bottom: h * 0.08 * u, height: h * 0.42 * u, display: "flex", alignItems: "flex-end", gap: w * 0.03 * u }}>
        {etiquetas.map((et, i) => {
          const q = arrive(f, t.barras[i], 12 + (i % 3) * 2, "arriveSoft");
          const alto = 0.3 + 0.7 * random(`barra-${i}-${p.texto}`);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 * u, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", height: `${alto * q * 88}%`, borderRadius: 6 * u, background: i === etiquetas.length - 2 ? v.acento : "#141110" }} />
              <div style={{ fontFamily: marca.fuenteMono, fontSize: w * 0.03 * u, color: "#5E6570" }}>{et}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const PIEZAS: Record<Pantalla["tipo"], React.FC<CtxPantalla>> = {
  inicio: Inicio,
  bloqueo: Bloqueo,
  media: MediaPantalla,
  mapa: Mapa,
  titular: Titular,
  rejilla: Rejilla,
  eco: Eco,
  datos: Datos,
};

/** Entrada de una pantalla sobre la anterior: fundido, empuje, flash, mancha de tinta o bloques. */
const Swap: React.FC<{ cambio: Cambio | null; T: number; w: number; h: number; u: number; v: Variante; children: React.ReactNode }> = ({ cambio, T, w, h, u, v, children }) => {
  const f = useCurrentFrame();
  if (!cambio) return <AbsoluteFill>{children}</AbsoluteFill>;
  switch (cambio) {
    case "fundido": {
      const k = arrive(f, 0, T, "arriveGentle");
      return <AbsoluteFill style={{ opacity: k }}>{children}</AbsoluteFill>;
    }
    case "empuje": {
      const k = tween(f, 0, T, "move");
      return <AbsoluteFill style={{ transform: `translateY(${(1 - k) * h * u}px)`, filter: k < 1 ? `blur(${(1 - k) * 10 * u}px)` : undefined }}>{children}</AbsoluteFill>;
    }
    case "flash": {
      const sube = tween(f, 0, 3, "snap");
      const baja = leave(f, 3, Math.max(3, T - 3), "leave");
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ opacity: f >= 3 ? 1 : 0 }}>{children}</AbsoluteFill>
          <AbsoluteFill style={{ background: "#F6F4EE", opacity: sube * (1 - baja) }} />
        </AbsoluteFill>
      );
    }
    case "tinta": {
      const k = tween(f, 0, T, "arrive");
      const r = k * 135;
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: "#0B0B0B", clipPath: `circle(${Math.min(140, r * 1.12)}% at 72% 38%)` }} />
          <AbsoluteFill style={{ clipPath: `circle(${r}% at 72% 38%)` }}>{children}</AbsoluteFill>
        </AbsoluteFill>
      );
    }
    case "bloques": {
      const k = tween(f, 0, T, "snap");
      const cols = 8;
      const filas = Math.max(6, Math.round((cols * h) / w));
      const bw = (w * u) / cols;
      const bh = (h * u) / filas;
      let d = "";
      for (let i = 0; i < cols * filas; i++) {
        if (random(`blq${i}${v.fuente}`) < k * 1.02) d += `M${((i % cols) * bw).toFixed(1)} ${(Math.floor(i / cols) * bh).toFixed(1)} h${(bw + 0.5).toFixed(1)} v${(bh + 0.5).toFixed(1)} h${(-bw - 0.5).toFixed(1)} Z `;
      }
      if (k >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
      return <AbsoluteFill style={{ clipPath: d ? `path('${d}')` : "inset(50% 50% 50% 50%)" }}>{children}</AbsoluteFill>;
    }
  }
};

/** Splash final dentro de la pantalla: punto de acento y la marca letra a letra. */
const Splash: React.FC<{ v: Variante; marcaNombre: string; w: number; u: number }> = ({ v, marcaNombre, w, u }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punto = springPreset(f, fps, "pop", 2);
  const letras = [...marcaNombre];
  return (
    <AbsoluteFill style={{ background: v.noche, alignItems: "center", justifyContent: "center", gap: w * 0.04 * u }}>
      <div style={{ width: w * 0.09 * u, height: w * 0.09 * u, borderRadius: "50%", background: v.acento, transform: `scale(${0.6 + 0.4 * punto})`, opacity: Math.min(1, punto * 2) }} />
      <div style={{ display: "flex", overflow: "hidden" }}>
        {letras.map((l, i) => {
          const q = arrive(f, 8 + i * 2, 10 + (i % 3) * 2, "arrive");
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                fontFamily: marca.fuenteTitulo,
                fontWeight: 700,
                fontSize: w * 0.14 * u,
                letterSpacing: "-0.03em",
                color: "#F4F6FA",
                transform: `translateY(${(1 - q) * 105}%)`,
              }}
            >
              {l}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Dispositivos dibujados ──────────────────────────────────────────────────────────────────────

type Geo = { pw: number; ph: number; sw: number; sh: number; borde: number; radio: number; tapa: number; base: number };

const geometria = (tipo: "telefono" | "laptop", W: number, H: number): Geo => {
  if (tipo === "telefono") {
    const ph = Math.min(H * 0.6, W * 1.12);
    const pw = ph / 2.05;
    const borde = pw * 0.035;
    return { pw, ph, sw: pw - 2 * borde, sh: ph - 2 * borde, borde, radio: pw * 0.17, tapa: 0, base: 0 };
  }
  const pw = Math.min(W * 0.88, H * 1.25);
  const ph = pw * 0.64;
  const borde = pw * 0.028;
  return { pw, ph, sw: pw - 2 * borde, sh: ph - 2 * borde - pw * 0.02, borde, radio: pw * 0.03, tapa: pw * 0.02, base: pw * 0.06 };
};

const Telefono: React.FC<{ g: Geo; v: Variante; u: number; children: React.ReactNode }> = ({ g, v, u, children }) => (
  <div style={{ position: "relative", width: g.pw * u, height: g.ph * u }}>
    {[0.2, 0.3].map((top, i) => (
      <div key={i} style={{ position: "absolute", left: -4 * u, top: g.ph * top * u, width: 6 * u, height: g.ph * 0.07 * u, borderRadius: 3 * u, background: "#3A3A3E" }} />
    ))}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: g.radio * u,
        background: v.cuerpo,
        boxShadow: `inset 0 0 0 ${2 * u}px #4A4A50, ${-18 * u}px ${30 * u}px ${60 * u}px rgba(6,6,8,0.5)`,
      }}
    />
    <div style={{ position: "absolute", left: g.borde * u, top: g.borde * u, width: g.sw * u, height: g.sh * u, borderRadius: (g.radio - g.borde) * u, overflow: "hidden", background: v.noche }}>
      {children}
    </div>
    <div style={{ position: "absolute", left: "50%", top: (g.borde + g.sw * 0.04) * u, width: g.sw * 0.3 * u, height: g.sw * 0.085 * u, borderRadius: 999, background: "#0A0A0B", transform: "translateX(-50%)" }} />
  </div>
);

const Laptop: React.FC<{ g: Geo; v: Variante; u: number; encendido: number; children: React.ReactNode }> = ({ g, v, u, encendido, children }) => (
  <div style={{ position: "relative", width: g.pw * u, height: (g.ph + g.base) * u }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: g.pw * u, height: g.ph * u, borderRadius: `${g.radio * u}px ${g.radio * u}px ${g.radio * 0.4 * u}px ${g.radio * 0.4 * u}px`, background: v.cuerpo, boxShadow: `inset 0 0 0 ${2 * u}px #3C3C40` }} />
    <div style={{ position: "absolute", left: g.borde * u, top: g.borde * u, width: g.sw * u, height: g.sh * u, borderRadius: g.radio * 0.35 * u, overflow: "hidden", background: "#050608" }}>
      <AbsoluteFill style={{ opacity: encendido, filter: encendido < 1 ? `brightness(${0.4 + 0.6 * encendido})` : undefined }}>{children}</AbsoluteFill>
    </div>
    {/* Base del teclado en perspectiva: un trapecio que se abre hacia el frente. */}
    <div
      style={{
        position: "absolute",
        left: -g.pw * 0.07 * u,
        top: g.ph * u,
        width: g.pw * 1.14 * u,
        height: g.base * u,
        background: `linear-gradient(180deg, #3A3A3E 0%, ${v.cuerpo} 100%)`,
        clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0 100%)",
        borderRadius: `0 0 ${g.radio * u}px ${g.radio * u}px`,
      }}
    />
  </div>
);

// ── Cámara ──────────────────────────────────────────────────────────────────────────────────────

type Cam = { s: number; rx: number; ry: number; rz: number; ty: number };

const camaras = (tipo: "telefono" | "laptop", g: Geo, W: number, H: number, cy: number) => {
  const llenar = Math.max(W / g.sw, H / g.sh) * 1.02;
  const centro = H / 2 - cy;
  const base: Cam = tipo === "telefono" ? { s: 1, rx: 4, ry: -10, rz: 0, ty: 0 } : { s: 1, rx: 6, ry: -16, rz: 0, ty: 0 };
  return {
    dispositivo: base,
    pantalla: { s: llenar, rx: 0, ry: 0, rz: 0, ty: centro },
    inclinado: { s: 1.3, rx: 24, ry: -6, rz: -10, ty: centro * 0.6 },
    lejos: { s: 0.68, rx: 10, ry: -14, rz: 4, ty: -H * 0.07 },
  } satisfies Record<string, Cam>;
};

const mezclar = (a: Cam, b: Cam, k: number): Cam => ({ s: mix(k, a.s, b.s), rx: mix(k, a.rx, b.rx), ry: mix(k, a.ry, b.ry), rz: mix(k, a.rz, b.rz), ty: mix(k, a.ty, b.ty) });

// ── Composición ─────────────────────────────────────────────────────────────────────────────────

const largos = (p: Props) => p.pantallas.map((x) => cuadros(x.segundos));

export const ShowcaseDispositivo: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho, alto, zona } = useEscala();
  const base = V[p.variante];
  const v: Variante = { ...base, fondo: p.colores.fondo ?? base.fondo, texto: p.colores.texto ?? base.texto, acento: p.colores.acento ?? base.acento };
  const tipo = p.dispositivo === "auto" ? v.dispositivo : p.dispositivo;
  const W = ancho / u;
  const H = alto / u;
  const g = geometria(tipo, W, H);
  const cy = zona.arriba / u + (H - zona.arriba / u - zona.abajo / u) * 0.47;
  const cams = camaras(tipo, g, W, H, cy);

  const Ls = largos(p);
  const inicios = Ls.reduce<number[]>((acc, L, i) => [...acc, i === 0 ? 0 : acc[i - 1] + Ls[i - 1]], []);
  const inicioCierre = inicios.length ? inicios[inicios.length - 1] + Ls[Ls.length - 1] : 0;
  const LC = cuadros(p.segundosCierre);

  // Entrada del dispositivo: el teléfono vuela girando y asienta; la laptop sube y enciende la pantalla.
  const conRender = p.render3d !== "" && tipo === "telefono";
  const entrada = arrive(frame, conRender ? 26 : 0, tipo === "telefono" ? 29 : 24, "arriveSoft");
  const encendido = tween(frame, 6, 14, "arriveGentle");

  // Cámara: cambia de encuadre al inicio de cada pantalla (move 20 f) y retrocede en el cierre (glide 40 f).
  let cam: Cam = cams[v.camaraLibre ? p.pantallas[0]?.encuadre ?? "dispositivo" : "dispositivo"];
  p.pantallas.forEach((x, i) => {
    if (i === 0 || !v.camaraLibre) return;
    const k = tween(frame, inicios[i], 20, "move");
    if (frame >= inicios[i]) cam = mezclar(cam, cams[x.encuadre], k);
  });
  const retro = tween(frame, inicioCierre, 40, "glide");
  if (frame >= inicioCierre) cam = mezclar(cam, cams.lejos, retro);
  // Re-encuadres cortos en los tramos largos de cada pantalla.
  p.pantallas.forEach((x, i) => {
    rellenar(eventosPantalla(x, Ls[i]), Ls[i]).forEach((t, j) => {
      const k = tween(frame, inicios[i] + t, 20 + (j % 3) * 4, "glide");
      cam = { ...cam, s: cam.s * (1 + 0.015 * k), rz: cam.rz + (j % 2 ? -0.8 : 0.8) * k };
    });
  });
  // Balanceo mínimo del dispositivo quieto al final (medido en el cierre de DiH9Pek312c).
  const balanceo = frame >= inicioCierre ? Math.sin(((frame - inicioCierre) / fps) * 2.2) * 1.4 * retro : 0;

  const vuelo = tipo === "telefono" ? `translateY(${(1 - entrada) * 420 * u}px) rotateY(${(1 - entrada) * 75}deg) rotateZ(${(1 - entrada) * -22}deg) scale(${0.45 + 0.55 * entrada})` : `translateY(${(1 - entrada) * 120 * u}px) scale(${0.92 + 0.08 * entrada})`;
  const frase = arrive(frame, inicioCierre + 22, 14, "arriveSoft");
  const primeraEsInicio = p.pantallas[0]?.tipo === "inicio";
  const golpe = primeraEsInicio ? tInicio(Ls[0]).estallido : -100;

  const pantallas = (
    <>
      {p.pantallas.map((x, i) => {
        const sig = p.pantallas[i + 1];
        const cola = sig ? v.dur[sig.cambio] : LC > 0 ? v.dur.fundido : 0;
        const Pieza = PIEZAS[x.tipo];
        return (
          <Sequence key={i} from={inicios[i]} durationInFrames={Ls[i] + cola} layout="none">
            <Swap cambio={i === 0 ? null : x.cambio} T={v.dur[x.cambio]} w={g.sw} h={g.sh} u={u} v={v}>
              <Pieza p={x} v={v} L={Ls[i]} w={g.sw} h={g.sh} u={u} />
            </Swap>
          </Sequence>
        );
      })}
      <Sequence from={inicioCierre} durationInFrames={LC} layout="none">
        <Swap cambio="fundido" T={v.dur.fundido} w={g.sw} h={g.sh} u={u} v={v}>
          <Splash v={v} marcaNombre={p.marca} w={g.sw} u={u} />
        </Swap>
      </Sequence>
    </>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: v.fondo }}>
      {/* Superficie: el dispositivo apoya en un plano con luz (nada flotando en el vacío, AI-31). */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${v.fondo} 0%, ${v.fondo} 52%, ${v.piso} 100%)` }} />
      <CameraRig push={0.03} drift={2} seed="dispositivo">
        <AbsoluteFill style={{ perspective: 2600 * u }}>
          <div
            style={{
              position: "absolute",
              left: (W / 2) * u,
              top: cy * u,
              width: 0,
              height: 0,
              transformStyle: "preserve-3d",
              transform: `translateY(${cam.ty * u}px) scale(${cam.s}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz + balanceo}deg)`,
            }}
          >
            {/* Sombra de contacto sobre la superficie. */}
            <div
              style={{
                position: "absolute",
                left: -g.pw * 0.62 * u,
                top: (g.ph / 2 + g.base - g.ph * 0.02) * u,
                width: g.pw * 1.24 * u,
                height: g.pw * 0.16 * u,
                borderRadius: "50%",
                background: "radial-gradient(closest-side, rgba(4,4,6,0.55), rgba(4,4,6,0))",
                opacity: entrada,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: (-g.pw / 2) * u,
                top: (-g.ph / 2) * u,
                transform: vuelo,
                opacity: conRender ? Math.min(1, entrada / 0.4) : Math.min(1, entrada / 0.3),
              }}
            >
              <GlitchHit at={golpe} frames={4} seed="estallido">
                {tipo === "telefono" ? (
                  <Telefono g={g} v={v} u={u}>
                    {pantallas}
                  </Telefono>
                ) : (
                  <Laptop g={g} v={v} u={u} encendido={encendido}>
                    {pantallas}
                  </Laptop>
                )}
              </GlitchHit>
            </div>
          </div>
        </AbsoluteFill>
      </CameraRig>
      {conRender ? (
        <Sequence from={0} durationInFrames={36} layout="none">
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - leave(frame, 26, 8, "leaveSoft") }}>
            <BlenderLayer src={resolverMedia(p.render3d)} kind={esVideo(p.render3d) ? "video" : "image"} width={g.pw * 1.1} delay={0} shadow />
          </AbsoluteFill>
        </Sequence>
      ) : null}
      {p.frase ? (
        <div
          style={{
            position: "absolute",
            left: zona.lados,
            right: zona.lados,
            top: (H - zona.abajo / u - 120) * u,
            fontFamily: marca.fuenteTitulo,
            fontWeight: 500,
            fontSize: 64 * u,
            letterSpacing: "-0.03em",
            color: v.texto,
            ...enterStyle(frase, 24 * u),
          }}
        >
          {p.frase}
        </div>
      ) : null}
      <Look grain={v.grano} vignette={v.vineta} warmth={v.tinte} />
    </AbsoluteFill>
  );
};

export const showcaseDispositivo = definir({
  id: "Plantilla-ShowcaseDispositivo",
  fuente: "showcase-dispositivo: DiH9Pek312c, tiktok-7693603336481803542",
  resumen: "Pantallas que se suceden al golpe dentro de un teléfono o una laptop, con render 3D opcional.",
  cuando: "Mostrar una app o una web dentro del dispositivo: recorrido de pantallas o anuncio de app.",
  schema,
  componente: ShowcaseDispositivo,
  defaultProps: {
    variante: "telefono-3d",
    dispositivo: "auto",
    pantallas: [
      { tipo: "inicio", texto: "", subtexto: "", items: [], numero: 0, media: "", segundos: 2, encuadre: "dispositivo", cambio: "fundido" },
      { tipo: "bloqueo", texto: "10:24", subtexto: "Jueves 12", items: ["Tu ruta de hoy está lista", "Salida recomendada: 8:40"], numero: 0, media: "", segundos: 2.4, encuadre: "pantalla", cambio: "empuje" },
      { tipo: "media", texto: "Escanea la calle", subtexto: "", items: [], numero: 0, media: "", segundos: 2.2, encuadre: "pantalla", cambio: "fundido" },
      { tipo: "mapa", texto: "Llegas en 12 min", subtexto: "Por la ruta con menos semáforos", items: [], numero: 0, media: "", segundos: 2.6, encuadre: "inclinado", cambio: "flash" },
      { tipo: "datos", texto: "Tiempo ahorrado por semana", subtexto: "", items: ["L", "M", "X", "J", "V", "S"], numero: 38, media: "", segundos: 2.2, encuadre: "pantalla", cambio: "tinta" },
    ],
    marca: "Brújula",
    frase: "Llega sin preguntar.",
    render3d: "",
    segundosCierre: 2.6,
    colores: {},
  },
  duracion: (p) => largos(p).reduce((s, L) => s + L, 0) + cuadros(p.segundosCierre),
  formatos: ["vertical", "retrato", "cuadrado"],
});
