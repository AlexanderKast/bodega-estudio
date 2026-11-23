import { loadFont as cargarSerif } from "@remotion/google-fonts/InstrumentSerif";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { useId } from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { BlurStack } from "../../components/presets/BlurStack";
import { CutoutObject } from "../../components/presets/CutoutObject";
import { Look } from "../../components/presets/Look";
import { Pill } from "../../components/presets/Pill";
import { TypeSandwich } from "../../components/presets/TypeSandwich";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, leave, mix, type SpringName, tween, wiggle } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, esVideo, resolverMedia, zColores, zMedia } from "../base";

/**
 * Plantilla · familia `explicador-objetos-3d` (referentes/lote-2026-11-08.md).
 * Videos de origen (recetas en referentes/_raw/videos/<id>/receta.json):
 *   - tiktok-7660733665353272583 → variante "lavanda-contraste"
 *   - tiktok-7560567761760505110 → variante "calido-ventana"
 *
 * Qué se tomó (técnica medida): explicador de texto cinético con una palabra por golpe, sans semibold + serif
 * itálica en la palabra clave (TypeSandwich), 1–3 niveles apilados; un objeto 3D gris por idea que entra
 * desenfocado (profundidad de campo) y flota con deriva lenta; lista numerada en pills que se apilan cada 0,9 s
 * (Pill "paso"); cifra que corre con ease-out y pill con número; resaltador único detrás de la palabra de la nota.
 * Por variante: alternancia claro/oscuro para marcar el giro del argumento, con barra que sube en 6 f al cambiar de
 * valor y swap con blur cuando no cambia, disco oscuro con aro punteado detrás del objeto, puntos grises con
 * desenfoque y arcos finos de fondo, cierre con bloques de línea de tiempo y un punto naranja que los recorre
 * (lavanda-contraste); fondo cálido con luz de ventana proyectada, banda diagonal de acento detrás del objeto,
 * follaje desenfocado que cruza el cuadro como oclusor en el cambio de escena, texto chico palabra a palabra y
 * cierre con una ruta que se dibuja hasta un pin con etiqueta (calido-ventana).
 *
 * Qué NO se copió (kb/10): guiones, cifras, retratos de personas públicas, iconos de marcas y redes sociales,
 * objetos 3D y rótulo "Minimalist style" con su marco; el halo/glow de los iconos (AI-23); los puntos de fondo son
 * pocos, con desenfoque de profundidad y deriva (AI-30/AI-12: no orbes ni loops). Textos por defecto genéricos.
 */

const serif = cargarSerif("italic", { weights: ["400"], subsets: ["latin"] });

type Variante = {
  claro: string;
  oscuro: string;
  texto: string;
  textoOscuro: string;
  acento: string;
  secundario: string;
  pillOscura: string;
  pillClara: string;
  /** Segundo acento: punto de la línea de tiempo o ruta. */
  punto: string;
  fondo: "puntos" | "ventana";
  transicion: "barra" | "follaje";
  solape: number;
  size: number;
  escalaSerif: number;
  peso: number;
  /** Cuadros entre palabras de la nota. */
  cada: number;
  objeto: { dof: number; resorte: SpringName; escIni: number; rotIni: number; desdeX: number; desdeY: number };
  apoyoObjeto: "disco" | "banda";
  cifraSombra: boolean;
  cierre: "timeline" | "ruta";
  vineta: number;
  grano: number;
  tinte: string;
};

const VARIANTES = {
  /** tiktok-7660733665353272583: lavanda/negro alternados, objetos 3D grises con DOF, pills, resaltador amarillo. */
  "lavanda-contraste": {
    claro: "#efe8f5",
    oscuro: "#1d1d1b",
    texto: "#1d1d1b",
    textoOscuro: "#f4f9fc",
    acento: "#b112e3",
    secundario: "#c9ccd0",
    pillOscura: "#2a2a28",
    pillClara: "#FFFFFF",
    punto: "#b112e3",
    fondo: "puntos",
    transicion: "barra",
    solape: 8,
    size: 64,
    escalaSerif: 1.75,
    peso: 600,
    cada: 5,
    objeto: { dof: 18, resorte: "smooth", escIni: 0.86, rotIni: -8, desdeX: 0, desdeY: 90 },
    apoyoObjeto: "disco",
    cifraSombra: false,
    cierre: "timeline",
    vineta: 0.14,
    grano: 0.04,
    tinte: "#c9ccd0",
  },
  /** tiktok-7560567761760505110: cálido con luz de ventana, objetos isométricos, acento naranja, follaje oclusor. */
  "calido-ventana": {
    claro: "#e4d3ee",
    oscuro: "#140b18",
    texto: "#1d1d1b",
    textoOscuro: "#f4f9fc",
    acento: "#b112e3",
    secundario: "#a6a8ab",
    pillOscura: "#1d1d1b",
    pillClara: "#FFFFFF",
    punto: "#b112e3",
    fondo: "ventana",
    transicion: "follaje",
    solape: 0,
    size: 46,
    escalaSerif: 1.6,
    peso: 600,
    cada: 7,
    objeto: { dof: 10, resorte: "heavy", escIni: 0.8, rotIni: 0, desdeX: 0, desdeY: 220 },
    apoyoObjeto: "banda",
    cifraSombra: true,
    cierre: "ruta",
    vineta: 0.3,
    grano: 0.035,
    tinte: "#7757bd",
  },
} satisfies Record<string, Variante>;

type NombreVariante = keyof typeof VARIANTES;

// ── Schema ──
const zBeat = z.object({
  tipo: z.enum(["objeto", "lista", "cifra"]).default("objeto").describe("objeto: recorte 3D + texto · lista: pills numeradas · cifra: contador + pill"),
  fondo: z.enum(["claro", "oscuro"]).default("claro").describe("alternar claro/oscuro marca el giro del argumento"),
  texto: z.string().describe("1–3 niveles separados por ' / '; *palabra* = serif itálica de acento"),
  nota: z.string().default("").describe("línea chica bajo el objeto; *palabra* lleva el resaltador"),
  segundos: z.number().min(0.8).max(8),
  media: zMedia.describe("objeto 3D (PNG con alfa), imagen o video; vacío = objeto de muestra"),
  items: z.array(z.string()).max(5).default([]).describe("solo lista: 2–5 items"),
  cifra: z.number().default(0).describe("solo cifra"),
  sufijo: z.string().default("").describe("solo cifra: palabra en serif itálica bajo el número"),
  pill: z.string().default("").describe("solo cifra: número + etiqueta, p. ej. '02 meses'"),
});

export const schema = z.object({
  variante: z
    .enum(["lavanda-contraste", "calido-ventana"])
    .default("lavanda-contraste")
    .describe("tratamiento medido de cada video de la familia: paleta, ritmo y transición"),
  beats: z.array(zBeat).min(1).max(14),
  cierre: z.object({
    texto: z.string(),
    firma: z.string().default(""),
    media: zMedia,
    segundos: z.number().min(1).max(6).default(2.8),
  }),
  colores: zColores.describe("fondo = escena clara, texto = tinta, acento = resaltador/acento; vacío = paleta de la variante"),
});

type Props = z.infer<typeof schema>;
type Beat = z.infer<typeof zBeat>;
type Pal = Variante;

const paleta = (nombre: NombreVariante, c: Props["colores"]): Pal => {
  const v: Variante = VARIANTES[nombre];
  return { ...v, claro: c.fondo ?? v.claro, texto: c.texto ?? v.texto, acento: c.acento ?? v.acento };
};

const lineas = (t: string) =>
  t
    .split(/\s*\/\s*|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Pasos de cámara (glide 20 f, cada 26/33 f): escena viva y evento antes de 30 f sin metrónomo. */
const pasos = (frame: number, desde: number, hasta: number) => {
  let s = 0;
  let t = desde;
  let k = 0;
  while (t < hasta - 12) {
    s += tween(frame, t, 20, "glide");
    t += k % 2 ? 33 : 26;
    k += 1;
  }
  return s;
};

// ── Fondos ──
const PUNTOS = [
  { x: 0.12, y: 0.18, r: 22, b: 0 },
  { x: 0.84, y: 0.12, r: 30, b: 6 },
  { x: 0.7, y: 0.3, r: 12, b: 0 },
  { x: 0.08, y: 0.46, r: 40, b: 10 },
  { x: 0.92, y: 0.5, r: 18, b: 0 },
  { x: 0.24, y: 0.66, r: 14, b: 0 },
  { x: 0.78, y: 0.72, r: 46, b: 12 },
  { x: 0.16, y: 0.86, r: 26, b: 4 },
  { x: 0.56, y: 0.9, r: 16, b: 0 },
  { x: 0.44, y: 0.08, r: 10, b: 0 },
  { x: 0.9, y: 0.88, r: 22, b: 3 },
  { x: 0.34, y: 0.4, r: 8, b: 0 },
];

const FondoPuntos: React.FC<{ p: Pal; oscuro: boolean }> = ({ p, oscuro }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho: W, alto: H } = useEscala();
  const color = oscuro ? "#2A2A2E" : p.secundario;
  return (
    <AbsoluteFill style={{ backgroundColor: oscuro ? p.oscuro : p.claro }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path
          d={`M ${0.55 * W} ${-0.05 * H} C ${1.1 * W} ${0.1 * H}, ${1.05 * W} ${0.34 * H}, ${0.72 * W} ${0.4 * H}`}
          fill="none"
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={26 * u}
          strokeLinecap="round"
        />
        <path d={`M ${-0.1 * W} ${0.78 * H} C ${0.2 * W} ${0.7 * H}, ${0.3 * W} ${0.98 * H}, ${0.5 * W} ${1.05 * H}`} fill="none" stroke={color} strokeOpacity={0.4} strokeWidth={18 * u} strokeLinecap="round" />
      </svg>
      {PUNTOS.map((d, k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: d.x * W + wiggle(`pt${k}x`, frame, fps, 0.15, 10 * u),
            top: d.y * H + wiggle(`pt${k}y`, frame, fps, 0.12, 14 * u),
            width: d.r * 2 * u,
            height: d.r * 2 * u,
            borderRadius: "50%",
            backgroundColor: color,
            opacity: oscuro ? 0.6 : 0.75,
            filter: d.b ? `blur(${d.b * u}px)` : undefined,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Fondo cálido en degradado con la luz de una ventana proyectada (gobo) fija. */
const FondoVentana: React.FC<{ p: Pal; oscuro: boolean }> = ({ p, oscuro }) => {
  const { u, ancho: W, alto: H } = useEscala();
  const base = oscuro ? p.oscuro : p.claro;
  const luz = oscuro ? "rgba(242,232,223,0.10)" : "rgba(255,249,242,0.55)";
  const panel = (x: number, y: number) => (
    <polygon
      key={`${x}-${y}`}
      points={[
        [x, y],
        [x + 0.2 * W, y + 0.02 * H],
        [x + 0.16 * W, y + 0.18 * H],
        [x - 0.04 * W, y + 0.16 * H],
      ]
        .map(([a, b]) => `${a},${b}`)
        .join(" ")}
      fill={luz}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: base }}>
      <AbsoluteFill style={{ background: oscuro ? "linear-gradient(170deg, #2b1636 0%, #140b18 90%)" : "linear-gradient(170deg, #f4f9fc 0%, #e4d3ee 55%, #d9cde3 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: `blur(${14 * u}px)` }}>
        {panel(0.3 * W, 0.08 * H)}
        {panel(0.54 * W, 0.105 * H)}
        {panel(0.26 * W, 0.28 * H)}
        {panel(0.5 * W, 0.305 * H)}
      </svg>
    </AbsoluteFill>
  );
};

// ── Piezas ──
const Muestra: React.FC<{ oscuro: boolean }> = ({ oscuro }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 400 400" width="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`${id}g`} cx="35%" cy="30%" r="78%">
          <stop offset="0%" stopColor={oscuro ? "#E9E9EC" : "#FBFBFD"} />
          <stop offset="60%" stopColor="#A9A9AE" />
          <stop offset="100%" stopColor="#5C5C62" />
        </radialGradient>
      </defs>
      <rect x="70" y="70" width="260" height="260" rx="72" fill={`url(#${id}g)`} transform="rotate(-12 200 200)" />
    </svg>
  );
};

const contenido = (media: string, oscuro: boolean): React.ReactNode => {
  if (!media) return <Muestra oscuro={oscuro} />;
  const url = resolverMedia(media);
  return esVideo(media) ? <OffthreadVideo src={url} muted style={{ width: "100%", display: "block" }} /> : <Img src={url} style={{ width: "100%", display: "block" }} />;
};

/** Objeto 3D que entra desenfocado (profundidad de campo) desde abajo y flota con deriva lenta. */
const Objeto: React.FC<{ media: string; p: Pal; oscuro: boolean; at: number; out: number; x: number; y: number; ancho: number; seed: string }> = ({
  media,
  p,
  oscuro,
  at,
  out,
  x,
  y,
  ancho,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const o = p.objeto;
  const foco = arrive(frame, at, 20, "arriveSoft");
  const sube = arrive(frame, at, 24, "arriveSoft");
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${(1 - sube) * o.desdeX * u}px, ${(1 - sube) * o.desdeY * u}px)`,
        filter: foco < 0.98 ? `blur(${(1 - foco) * o.dof * u}px)` : undefined,
      }}
    >
      <CutoutObject
        x={x}
        y={y}
        ancho={ancho}
        at={at}
        out={out}
        rotacion={o.rotIni ? -3 : 0}
        rotacionInicial={o.rotIni}
        escalaInicial={o.escIni}
        resorte={o.resorte}
        sombra={{ angulo: 80, largo: 34, opacidad: oscuro ? 0.5 : 0.22, color: oscuro ? "#020202" : p.fondo === "ventana" ? "#3a1d47" : "#4A4A55" }}
        deriva={9}
        seed={seed}
      >
        {contenido(media, oscuro)}
      </CutoutObject>
    </AbsoluteFill>
  );
};

/** Nota chica palabra a palabra; las *palabras* llevan el resaltador que barre después de llegar. */
const Nota: React.FC<{ texto: string; p: Pal; delay: number; color: string }> = ({ texto, p, delay, color }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const ws = texto.split(" ").filter(Boolean);
  return (
    <div style={{ fontFamily: marca.fuenteTexto, fontWeight: 600, fontSize: (p.size * 0.78) * u, letterSpacing: "-0.015em", color, lineHeight: 1.15 }}>
      {ws.map((w, k) => {
        const marcada = /^\*.*\*[.,!?]*$/.test(w);
        const limpia = w.replace(/\*/g, "");
        const t0 = delay + k * p.cada;
        const e = arrive(frame, t0, 9, "arriveGentle");
        const barre = marcada ? arrive(frame, t0 + 7, 11, "arrive") : 0;
        return (
          <span key={k}>
            <span
              style={{
                position: "relative",
                display: "inline-block",
                opacity: Math.min(1, e / 0.6),
                transform: `translateY(${(1 - e) * 10 * u}px)`,
                filter: e < 0.98 ? `blur(${(1 - e) * 8 * u}px)` : undefined,
                fontFamily: marcada ? serif.fontFamily : undefined,
                fontStyle: marcada ? "italic" : undefined,
                fontWeight: marcada ? 400 : undefined,
                fontSize: marcada ? "1.18em" : undefined,
                color: marcada ? p.texto : undefined,
                padding: marcada ? "0 0.08em" : undefined,
              }}
            >
              {marcada ? (
                <span
                  style={{
                    position: "absolute",
                    inset: "8% -2% 4%",
                    backgroundColor: p.acento,
                    transform: `scaleX(${barre})`,
                    transformOrigin: "0% 50%",
                    zIndex: -1,
                  }}
                />
              ) : null}
              <span style={{ position: "relative", color: marcada ? marca.colores.texto : undefined }}>{limpia}</span>
            </span>
            {k < ws.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};

const Texto: React.FC<{ texto: string; p: Pal; delay: number; oscuro: boolean; size?: number }> = ({ texto, p, delay, oscuro, size }) => (
  <TypeSandwich
    lineas={lineas(texto)}
    delay={delay}
    size={size ?? p.size}
    peso={p.peso}
    escalaSerif={p.escalaSerif}
    color={oscuro ? p.textoOscuro : p.texto}
    colorAcento={oscuro ? p.textoOscuro : p.texto}
    fuente={marca.fuenteTexto}
    fuenteAcento={serif.fontFamily}
  />
);

const Arriba: React.FC<{ children: React.ReactNode; y?: number }> = ({ children, y }) => {
  const { zona, alto: H } = useEscala();
  return <AbsoluteFill style={{ padding: `${y === undefined ? zona.arriba : y * H}px ${zona.lados}px 0`, alignItems: "flex-start" }}>{children}</AbsoluteFill>;
};

// ── Beats ──
type BeatProps = { b: Beat; p: Pal; dur: number; i: number };

const BeatObjeto: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const frame = useCurrentFrame();
  const { u, ancho: W, alto: H, zona } = useEscala();
  const oscuro = b.fondo === "oscuro";
  const x = 0.52;
  const y = 0.52;
  const ancho = 500;
  const disco = p.apoyoObjeto === "disco" && !oscuro ? arrive(frame, 4, 14, "arriveSoft") : 0;
  const aro = p.apoyoObjeto === "disco" && !oscuro ? tween(frame, 12, 24, "move") : 0;
  const gira = tween(frame, 12, Math.max(30, dur), "glide");
  const banda = p.apoyoObjeto === "banda" ? arrive(frame, 2, 16, "arriveSoft") : 0;
  const nPal = b.texto.replace(/\*/g, "").split(/\s+/).filter(Boolean).length;
  const tNota = 30 + nPal * 3;
  const rr = ancho * 0.58 * u;
  const largo = 2 * Math.PI * (rr + 26 * u);
  return (
    <AbsoluteFill>
      {p.apoyoObjeto === "banda" ? (
        <div
          style={{
            position: "absolute",
            left: -0.3 * W,
            width: 1.6 * W,
            top: y * H - 70 * u,
            height: 150 * u,
            backgroundColor: p.acento,
            transform: "rotate(-24deg)",
            clipPath: `inset(0 ${(1 - banda) * 100}% 0 0)`,
            opacity: oscuro ? 0.85 : 1,
          }}
        />
      ) : null}
      {p.apoyoObjeto === "disco" && !oscuro ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={x * W} cy={y * H} r={rr * (0.86 + 0.14 * disco)} fill={p.oscuro} opacity={disco} />
          <circle
            cx={x * W}
            cy={y * H}
            r={rr + 26 * u}
            fill="none"
            stroke={p.oscuro}
            strokeWidth={3 * u}
            strokeDasharray={`${largo * aro} ${largo}`}
            transform={`rotate(${-90 + gira * 50} ${x * W} ${y * H})`}
            opacity={0.8}
          />
        </svg>
      ) : null}
      <Objeto media={b.media} p={p} oscuro={oscuro} at={6} out={dur - 10} x={x} y={y} ancho={p.apoyoObjeto === "disco" && !oscuro ? 420 : ancho} seed={`eo${i}`} />
      <Arriba>
        <Texto texto={b.texto} p={p} delay={3} oscuro={oscuro} />
      </Arriba>
      {b.nota ? (
        <AbsoluteFill style={{ top: 0.74 * H, padding: `0 ${zona.lados}px` }}>
          <Nota texto={b.nota} p={p} delay={tNota} color={oscuro ? p.textoOscuro : p.texto} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const BeatLista: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const { u, alto: H } = useEscala();
  const oscuro = b.fondo === "oscuro";
  const nPal = b.texto.replace(/\*/g, "").split(/\s+/).filter(Boolean).length;
  const t0 = 22 + nPal * 3;
  return (
    <AbsoluteFill>
      {b.media ? <Objeto media={b.media} p={p} oscuro={oscuro} at={8} out={dur - 10} x={0.74} y={0.76} ancho={340} seed={`el${i}`} /> : null}
      <Arriba>
        <Texto texto={b.texto} p={p} delay={3} oscuro={oscuro} />
        <div style={{ marginTop: 0.05 * H, display: "flex", flexDirection: "column", gap: 22 * u, alignItems: "flex-start" }}>
          {b.items.map((it, k) => (
            <Pill
              key={k}
              variante="paso"
              numero={k + 1}
              texto={it}
              delay={t0 + k * 27}
              size={46}
              tono={oscuro ? "oscuro" : "claro"}
              colorAcento={p.acento}
              colorOscuro={p.pillOscura}
              colorClaro={oscuro ? p.textoOscuro : p.pillClara}
            />
          ))}
        </div>
      </Arriba>
    </AbsoluteFill>
  );
};

const BeatCifra: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const frame = useCurrentFrame();
  const { u, alto: H } = useEscala();
  const oscuro = b.fondo === "oscuro";
  const t0 = b.texto ? 18 : 4;
  const sube = arrive(frame, t0, 16, "arriveSoft");
  const cuenta = tween(frame, t0, 54, "arrive");
  const valor = Math.round(mix(cuenta, 0, b.cifra));
  const sufijo = arrive(frame, t0 + 34, 14, "arriveGentle");
  const m = b.pill.match(/^\s*(\d+)\s*(.*)$/);
  const color = oscuro ? p.textoOscuro : p.texto;
  return (
    <AbsoluteFill>
      {b.media ? <Objeto media={b.media} p={p} oscuro={oscuro} at={t0 + 6} out={dur - 10} x={0.7} y={0.66} ancho={380} seed={`ec${i}`} /> : null}
      <Arriba>
        {b.texto ? <Texto texto={b.texto} p={p} delay={3} oscuro={oscuro} /> : null}
        <div
          style={{
            marginTop: 0.04 * H,
            fontFamily: marca.fuenteTitulo,
            fontWeight: 700,
            fontSize: 168 * u,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
            color: p.acento,
            fontVariantNumeric: "tabular-nums",
            textShadow: p.cifraSombra ? `${4 * u}px ${8 * u}px ${18 * u}px rgba(20,11,24,0.28)` : undefined,
            opacity: Math.min(1, sube / 0.6),
            transform: `translateY(${(1 - sube) * 44 * u}px)`,
          }}
        >
          {valor.toLocaleString("es-CO")}
        </div>
        {b.sufijo ? (
          <div
            style={{
              alignSelf: "flex-start",
              marginLeft: 0.32 * 168 * u,
              fontFamily: serif.fontFamily,
              fontStyle: "italic",
              fontSize: 64 * u,
              color,
              opacity: Math.min(1, sufijo / 0.6),
              transform: `translateY(${(1 - sufijo) * -14 * u}px)`,
              filter: sufijo < 0.98 ? `blur(${(1 - sufijo) * 10 * u}px)` : undefined,
            }}
          >
            {b.sufijo}
          </div>
        ) : null}
        {b.pill ? (
          <div style={{ marginTop: 34 * u }}>
            <Pill
              variante="paso"
              numero={m ? m[1] : 1}
              texto={m ? m[2] : b.pill}
              delay={t0 + 12}
              size={44}
              tono={oscuro ? "oscuro" : "claro"}
              colorAcento={p.acento}
              colorOscuro={p.pillOscura}
              colorClaro={p.pillClara}
            />
          </div>
        ) : null}
      </Arriba>
    </AbsoluteFill>
  );
};

const BEATS: Record<Beat["tipo"], React.FC<BeatProps>> = { objeto: BeatObjeto, lista: BeatLista, cifra: BeatCifra };

/**
 * Entrada de cada escena. lavanda: si cambia el valor (claro↔oscuro) la escena nueva sube como barra en 6 f; si no,
 * su contenido entra con blur. calido: el contenido cae por abajo al salir (el follaje tapa el corte).
 */
const Escena: React.FC<{ b: Beat; p: Pal; dur: number; primero: boolean; cambia: boolean; children: React.ReactNode }> = ({
  b,
  p,
  dur,
  primero,
  cambia,
  children,
}) => {
  const frame = useCurrentFrame();
  const { u, alto: H } = useEscala();
  const oscuro = b.fondo === "oscuro";
  const barra = p.transicion === "barra" && cambia && !primero ? arrive(frame, 0, 6, "snap") : 1;
  const swap = p.transicion === "barra" && !cambia && !primero ? arrive(frame, 0, 10, "arriveGentle") : 1;
  const cae = p.transicion === "follaje" ? leave(frame, dur - 14, 14, "leave") : 0;
  const cam = 1 + pasos(frame, 46, dur) * 0.011;
  const Fondo = p.fondo === "puntos" ? FondoPuntos : FondoVentana;
  return (
    <AbsoluteFill style={{ clipPath: barra < 1 ? `inset(${(1 - barra) * 100}% 0 0 0)` : undefined }}>
      <Fondo p={p} oscuro={oscuro} />
      <AbsoluteFill
        style={{
          transform: `translateY(${cae * 0.5 * H}px) scale(${cam})`,
          opacity: Math.min(1, swap / 0.6),
          filter: swap < 0.98 ? `blur(${(1 - swap) * 16 * u}px)` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Follaje desenfocado de primer plano que cruza el cuadro y tapa el cambio de escena (calido-ventana). */
const Follaje: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, ancho: W, alto: H } = useEscala();
  const cruza = tween(frame, 0, 24, "move");
  const hojas = [
    { x: 0.1, y: 0.2, rx: 0.34, ry: 0.22, c: "#2b1636" },
    { x: 0.3, y: 0.55, rx: 0.42, ry: 0.3, c: "#3a1d47" },
    { x: 0.05, y: 0.82, rx: 0.36, ry: 0.24, c: "#24142b" },
    { x: 0.45, y: 0.1, rx: 0.3, ry: 0.2, c: "#4a2a5c" },
    { x: 0.5, y: 0.9, rx: 0.32, ry: 0.22, c: "#2b1636" },
    { x: 0.62, y: 0.42, rx: 0.3, ry: 0.36, c: "#24142b" },
  ];
  return (
    <AbsoluteFill style={{ transform: `translateX(${mix(cruza, 1.15, -1.25) * W}px)`, filter: `blur(${26 * u}px)` }}>
      <svg width={W * 1.2} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {hojas.map((h, k) => (
          <ellipse key={k} cx={h.x * W * 1.2} cy={h.y * H} rx={h.rx * W} ry={h.ry * H} fill={h.c} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// ── Cierres ──
const Firma: React.FC<{ texto: string; at: number; color: string }> = ({ texto, at, color }) => {
  const { u } = useEscala();
  return (
    <div style={{ marginTop: 26 * u }}>
      <BlurStack lineas={[texto]} por="linea" delay={at} dur={11} size={34} peso={600} fuente={marca.fuenteTexto} color={color} deriva={false} />
    </div>
  );
};

/** Bloques de línea de tiempo que se acomodan y un punto naranja que los recorre (lavanda-contraste). */
const CierreTimeline: React.FC<{ c: Props["cierre"]; p: Pal; dur: number }> = ({ c, p, dur }) => {
  const frame = useCurrentFrame();
  const { u, ancho: W, alto: H, zona } = useEscala();
  const anchos = [220, 150, 260, 180];
  const y0 = 0.66 * H;
  const util = W - 2 * zona.lados;
  const total = anchos.reduce((s, a) => s + a, 0) + 3 * 18;
  const k0 = util / (total * u);
  const recorre = tween(frame, 30, Math.max(30, dur - 46), "move");
  let x = zona.lados;
  return (
    <AbsoluteFill>
      <FondoPuntos p={p} oscuro={false} />
      <Objeto media={c.media} p={p} oscuro={false} at={4} out={dur + 30} x={0.66} y={0.44} ancho={380} seed="ect" />
      <Arriba>
        <Texto texto={c.texto} p={p} delay={6} oscuro={false} />
        {c.firma ? <Firma texto={c.firma} at={34} color={p.texto} /> : null}
      </Arriba>
      {anchos.map((a, k) => {
        const e = arrive(frame, 14 + k * 4, 12 + k * 2, "arriveSoft");
        const w = a * k0 * u;
        const left = x;
        x += w + 18 * k0 * u;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left,
              top: y0,
              width: w,
              height: 74 * u,
              borderRadius: 18 * u,
              backgroundColor: k % 2 ? p.secundario : p.oscuro,
              opacity: Math.min(1, e / 0.6),
              transform: `translateX(${(1 - e) * 60 * u}px)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: zona.lados + recorre * (util - 30 * u),
          top: y0 + 92 * u,
          width: 30 * u,
          height: 30 * u,
          borderRadius: "50%",
          backgroundColor: p.punto,
          opacity: arrive(frame, 26, 8, "arriveGentle"),
        }}
      />
    </AbsoluteFill>
  );
};

/** Ruta que se dibuja de gris a acento hasta un pin con etiqueta punteada (calido-ventana). */
const CierreRuta: React.FC<{ c: Props["cierre"]; p: Pal; dur: number }> = ({ c, p, dur }) => {
  const frame = useCurrentFrame();
  const { u, ancho: W, alto: H } = useEscala();
  const d = `M ${0.08 * W} ${0.9 * H} C ${0.4 * W} ${0.86 * H}, ${0.1 * W} ${0.66 * H}, ${0.46 * W} ${0.64 * H} S ${0.86 * W} ${0.5 * H}, ${0.7 * W} ${0.44 * H}`;
  const dibuja = tween(frame, 10, 40, "move");
  const { strokeDasharray, strokeDashoffset } = evolvePath(dibuja, d);
  const fin = getPointAtLength(d, getLength(d));
  const pin = arrive(frame, 46, 14, "arriveSoft");
  const etiqueta = arrive(frame, 54, 12, "arriveGentle");
  return (
    <AbsoluteFill>
      <FondoVentana p={p} oscuro={false} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d={d} fill="none" stroke={p.secundario} strokeWidth={14 * u} strokeLinecap="round" />
        <path d={d} fill="none" stroke={p.acento} strokeWidth={14 * u} strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
        <g transform={`translate(${fin?.x ?? 0} ${(fin?.y ?? 0) - (1 - pin) * 40 * u})`} opacity={Math.min(1, pin / 0.6)}>
          <path d={`M 0 0 C ${-34 * u} ${-40 * u}, ${-34 * u} ${-92 * u}, 0 ${-92 * u} C ${34 * u} ${-92 * u}, ${34 * u} ${-40 * u}, 0 0 Z`} fill={p.acento} />
          <circle cy={-62 * u} r={11 * u} fill={p.pillClara} />
        </g>
      </svg>
      {c.firma ? (
        <div
          style={{
            position: "absolute",
            left: (fin?.x ?? 0) - 160 * u,
            top: (fin?.y ?? 0) - 190 * u,
            padding: `${10 * u}px ${20 * u}px`,
            border: `${2.5 * u}px dashed ${p.texto}`,
            borderRadius: 14 * u,
            fontFamily: marca.fuenteTexto,
            fontWeight: 600,
            fontSize: 30 * u,
            color: p.texto,
            opacity: Math.min(1, etiqueta / 0.6),
            transform: `translateY(${(1 - etiqueta) * 12 * u}px)`,
          }}
        >
          {c.firma}
        </div>
      ) : null}
      {c.media ? <Objeto media={c.media} p={p} oscuro={false} at={20} out={dur + 30} x={0.3} y={0.78} ancho={300} seed="ecr" /> : null}
      <Arriba>
        <Texto texto={c.texto} p={p} delay={4} oscuro={false} />
      </Arriba>
    </AbsoluteFill>
  );
};

const CIERRES = { timeline: CierreTimeline, ruta: CierreRuta };

export const ExplicadorObjetos: React.FC<Props> = ({ variante, beats, cierre, colores: c }) => {
  const p = paleta(variante, c);
  const tramos = beats.reduce<{ inicio: number; dur: number }[]>((acc, b) => {
    const inicio = acc.length ? acc[acc.length - 1].inicio + acc[acc.length - 1].dur : 0;
    return [...acc, { inicio, dur: cuadros(b.segundos) }];
  }, []);
  const finBeats = tramos.length ? tramos[tramos.length - 1].inicio + tramos[tramos.length - 1].dur : 0;
  const Cierre = CIERRES[p.cierre];
  const durCierre = cuadros(cierre.segundos);
  return (
    <AbsoluteFill style={{ backgroundColor: p.claro }}>
      {beats.map((b, i) => {
        const { inicio, dur } = tramos[i];
        const Comp = BEATS[b.tipo];
        const cambia = i > 0 && beats[i - 1].fondo !== b.fondo;
        return (
          <Sequence key={i} from={inicio} durationInFrames={dur + p.solape} name={`beat ${i + 1} · ${b.tipo} · ${b.fondo}`}>
            <Escena b={b} p={p} dur={dur} primero={i === 0} cambia={cambia}>
              <Comp b={b} p={p} dur={dur} i={i} />
            </Escena>
          </Sequence>
        );
      })}
      <Sequence from={finBeats} durationInFrames={durCierre} name="cierre">
        <Cierre c={cierre} p={p} dur={durCierre} />
      </Sequence>
      {p.transicion === "follaje"
        ? [...tramos.slice(1).map((t) => t.inicio), finBeats].map((t, k) => (
            <Sequence key={`fo${k}`} from={t - 12} durationInFrames={24} name="follaje">
              <Follaje />
            </Sequence>
          ))
        : null}
      <Look grain={p.grano} vignette={p.vineta} warmth={p.tinte} />
    </AbsoluteFill>
  );
};

export const explicadorObjetos = definir({
  id: "Plantilla-ExplicadorObjetos",
  fuente: "tiktok-7660733665353272583, tiktok-7560567761760505110",
  resumen: "Texto cinético sans y serif itálica alternando fondo claro y oscuro, con objetos 3D flotando y pills.",
  cuando: "Explicar un concepto abstracto con objetos como metáfora, sin persona en cámara.",
  schema,
  componente: ExplicadorObjetos,
  defaultProps: {
    variante: "lavanda-contraste",
    beats: [
      { tipo: "objeto", fondo: "claro", texto: "Tu / *atención*", nota: "", segundos: 2.4, media: "", items: [], cifra: 0, sufijo: "", pill: "" },
      { tipo: "objeto", fondo: "claro", texto: "Parece / un *detalle*", nota: "hasta que lo *mides*", segundos: 3, media: "", items: [], cifra: 0, sufijo: "", pill: "" },
      { tipo: "lista", fondo: "oscuro", texto: "Y no... / *no es*", nota: "", segundos: 3.6, media: "", items: ["Más horas", "Más apps", "Más ganas"], cifra: 0, sufijo: "", pill: "" },
      { tipo: "cifra", fondo: "claro", texto: "En solo", nota: "", segundos: 3.4, media: "", items: [], cifra: 120000, sufijo: "personas", pill: "03 semanas" },
      { tipo: "objeto", fondo: "claro", texto: "Es algo / *simple*", nota: "un *sistema* que se repite", segundos: 3, media: "", items: [], cifra: 0, sufijo: "", pill: "" },
    ],
    cierre: { texto: "Empieza / *hoy*", firma: "@tumarca", media: "", segundos: 2.8 },
    colores: {},
  },
  duracion: (p) => p.beats.reduce((s, b) => s + cuadros(b.segundos), 0) + cuadros(p.cierre.segundos),
  formatos: ["vertical", "retrato"],
});
