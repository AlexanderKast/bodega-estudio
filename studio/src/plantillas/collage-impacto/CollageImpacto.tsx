import { loadFont as cargarAnton } from "@remotion/google-fonts/Anton";
import { loadFont as cargarSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { AnilloPunteado } from "../../components/anotacion";
import { CutoutObject } from "../../components/presets/CutoutObject";
import { Look } from "../../components/presets/Look";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, inertialBounce, leave, tween } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, esVideo, rellenarHuecos, resolverMedia, zColores, zMedia } from "../base";

/**
 * Plantilla · familia `collage-impacto` (referentes/lote-2026-11-08.md).
 * Videos de origen (recetas en referentes/_raw/videos/<id>/receta.json):
 *   - tiktok-7600179656922385685 → variante "crema-rojo"
 *   - tiktok-7684823088906636562 → variante "papel-tinta"
 *   - C-yZlQXN3rQ                → variante "gris-objeto"
 *
 * Qué se tomó (técnica medida): tipografía cinética de tres voces con roles fijos (condensada gigante = idea,
 * serif itálica = énfasis, grotesca diminuta = conector) y contraste de escala extremo (la idea llena el ancho, el
 * conector mide ~2,5 % del alto); letras de la idea que suben desde su máscara con blur y stagger de 1–2 f; el
 * titular escala 1 → 1,06 durante el hold; recortes en B/N que tocan u ocluyen las letras (con péndulo amortiguado
 * cuando cuelgan); caídas a negro de 4 f al golpe; escenas oscuras de foto con push-in lento del 4–5 %.
 * Por variante: cartel crema con bloque rojo detrás del recorte, rejilla parcial, cortes secos y fundido a negro
 * de 1 s al final (crema-rojo); papel técnico con rejilla y marcas de registro, sombra larga abajo-derecha,
 * empuje horizontal con blur en 8 f, flash rojo de 3 f y cierre con un disco que crece mientras los puntos de su
 * órbita se disuelven (papel-tinta); papel gris con viñeta fuerte y grano, una sola pieza por escena, tarjeta
 * octogonal con trama que se parte al centro y revela el objeto, blur dissolve de 6 f y cierre cenital que se
 * aleja hasta revelar el campo (gris-objeto).
 *
 * Qué NO se copió (kb/10): guiones, textos, fotos, rostros, escudos, logos y la marca de agua (código de barras)
 * de los creadores; el brillo azul-blanco del "texto de vidrio" (AI-23: aquí texto claro plano); las imágenes IA
 * plásticas (AI-41: la escena oscura usa la imagen del cliente); los pétalos giratorios sin función (AI-12); la
 * placa de anotaciones del inicio (resto del editor). Los textos por defecto son genéricos del estudio.
 */

// Anton (Vernon Adams, SIL OFL 1.1) y Instrument Serif itálica (Instrument, SIL OFL 1.1), vía @remotion/google-fonts.
const anton = cargarAnton("normal", { weights: ["400"], subsets: ["latin"] });
const serif = cargarSerif("italic", { weights: ["400"], subsets: ["latin"] });

type Transicion = "corte" | "empuje" | "disolver";
type Variante = {
  papel: string;
  tinta: string;
  acento: string;
  secundario: string;
  /** Fondo de las escenas oscuras y texto claro encima. */
  oscuro: string;
  luz: string;
  filtroOscuro: string;
  ideaCondensada: boolean;
  /** Tope del cuerpo de la idea (px a 1080) y ancho medio por carácter (em) para que llene la línea. */
  ideaMax: number;
  anchoChar: number;
  conector: number;
  /** Cuadros entre palabras de la frase. */
  cada: number;
  idea: "letras" | "fantasma";
  transicion: Transicion;
  solape: number;
  golpe: "tinta" | "acento";
  recorteBN: boolean;
  bloque: boolean;
  sombraLarga: boolean;
  punteado: boolean;
  tarjetaSplit: boolean;
  rejilla: "parcial" | "completa" | null;
  registro: boolean;
  vineta: number;
  grano: number;
  tinte: string;
  cierre: "fundido" | "disco" | "cenital";
};

const VARIANTES = {
  /** tiktok-7600179656922385685: condensada roja gigante sobre cartel crema, recortes B/N y dips a negro. */
  "crema-rojo": {
    papel: "#eceff1",
    tinta: "#1d1d1b",
    acento: "#b112e3",
    secundario: "#5f6164",
    oscuro: "#1d1d1b",
    luz: "#eceff1",
    filtroOscuro: "grayscale(1) contrast(1.1) brightness(0.5)",
    ideaCondensada: true,
    ideaMax: 380,
    anchoChar: 0.5,
    conector: 46,
    cada: 9,
    idea: "letras",
    transicion: "corte",
    solape: 0,
    golpe: "tinta",
    recorteBN: true,
    bloque: true,
    sombraLarga: false,
    punteado: false,
    tarjetaSplit: false,
    rejilla: "parcial",
    registro: false,
    vineta: 0.4,
    grano: 0.05,
    tinte: "#a6a8ab",
    cierre: "fundido",
  },
  /** tiktok-7684823088906636562: papel blanco técnico, objetos con sombra larga, escenas sepia, empuje con blur. */
  "papel-tinta": {
    papel: "#fafbfc",
    tinta: "#1d1d1b",
    acento: "#b112e3",
    secundario: "#bdbfc2",
    oscuro: "#140b18",
    luz: "#f4f9fc",
    filtroOscuro: "grayscale(0.6) brightness(0.6)",
    ideaCondensada: true,
    ideaMax: 300,
    anchoChar: 0.5,
    conector: 34,
    cada: 6,
    idea: "letras",
    transicion: "empuje",
    solape: 8,
    golpe: "acento",
    recorteBN: false,
    bloque: false,
    sombraLarga: true,
    punteado: true,
    tarjetaSplit: false,
    rejilla: "completa",
    registro: true,
    vineta: 0.22,
    grano: 0.04,
    tinte: "#7757bd",
    cierre: "disco",
  },
  /** C-yZlQXN3rQ: un objeto B/N por escena sobre papel gris con viñeta, tarjeta que se parte, cierre cenital. */
  "gris-objeto": {
    papel: "#a6a8ab",
    tinta: "#111111",
    acento: "#111111",
    secundario: "#5f6164",
    oscuro: "#1d1d1b",
    luz: "#eceff1",
    filtroOscuro: "grayscale(1) brightness(0.5)",
    ideaCondensada: false,
    ideaMax: 118,
    anchoChar: 0.62,
    conector: 44,
    cada: 4,
    idea: "fantasma",
    transicion: "disolver",
    solape: 6,
    golpe: "tinta",
    recorteBN: true,
    bloque: false,
    sombraLarga: false,
    punteado: false,
    tarjetaSplit: true,
    rejilla: null,
    registro: false,
    vineta: 0.55,
    grano: 0.07,
    tinte: "#5f6164",
    cierre: "cenital",
  },
} satisfies Record<string, Variante>;

type NombreVariante = keyof typeof VARIANTES;

// ── Schema ──
const zBeat = z.object({
  tipo: z
    .enum(["impacto", "frase", "objeto", "oscuro"])
    .default("frase")
    .describe("impacto: palabra que llena el ancho · frase: 1–3 niveles · objeto: recorte protagonista · oscuro: foto de fondo"),
  texto: z.string().describe("' / ' parte la línea; *idea* = condensada grande; _énfasis_ = serif itálica; el resto, conector chico"),
  segundos: z.number().min(0.6).max(8),
  recorte: zMedia.describe("PNG con alfa (objeto que toca las letras); vacío = sin objeto o pieza de muestra"),
  imagen: zMedia.describe("foto o video: fondo de la escena oscura o tarjeta que se parte (gris-objeto)"),
  golpe: z.boolean().default(false).describe("caída a negro (o flash de acento) de 4 f al entrar, sobre el golpe"),
});

export const schema = z.object({
  variante: z
    .enum(["crema-rojo", "papel-tinta", "gris-objeto"])
    .default("crema-rojo")
    .describe("tratamiento medido de cada video de la familia: paleta, ritmo y transición"),
  beats: z.array(zBeat).min(1).max(14),
  cierre: z.object({
    texto: z.string().describe("mismo formato que los beats"),
    firma: z.string().default(""),
    recorte: zMedia,
    segundos: z.number().min(1).max(6).default(2.8),
  }),
  colores: zColores.describe("fondo = papel, texto = tinta, acento = color de la idea; vacío = paleta de la variante"),
});

type Props = z.infer<typeof schema>;
type Beat = z.infer<typeof zBeat>;
type Pal = Variante;

const paleta = (nombre: NombreVariante, c: Props["colores"]): Pal => {
  const v: Variante = VARIANTES[nombre];
  return { ...v, papel: c.fondo ?? v.papel, tinta: c.texto ?? v.tinta, acento: c.acento ?? v.acento };
};

// ── Texto de tres voces ──
type Token = { t: string; tipo: "idea" | "enfasis" | "conector" };
const lineas = (t: string) =>
  t
    .split(/\s*\/\s*|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
const tokens = (linea: string): Token[] =>
  linea
    .split(/(\*[^*]+\*|_[^_]+_)/)
    .filter((s) => s.trim())
    .flatMap((tr): Token[] =>
      tr.startsWith("*")
        ? [{ t: tr.slice(1, -1), tipo: "idea" }]
        : tr.startsWith("_")
          ? [{ t: tr.slice(1, -1), tipo: "enfasis" }]
          : tr
              .split(" ")
              .filter(Boolean)
              .map((w) => ({ t: w, tipo: "conector" as const })),
    );
const pasoDe = (k: Token, p: Pal) => (k.tipo === "conector" ? p.cada : p.cada + 6);
/** Cuadros que tarda el texto completo en entrar (para encadenar lo que viene después). */
const duracionTexto = (t: string, p: Pal) => lineas(t).flatMap(tokens).reduce((s, k) => s + pasoDe(k, p), 0) + 12;

/** Idea: letras que suben desde la máscara con blur (o llegan "fantasma" y se solidifican, gris-objeto). */
const Idea: React.FC<{ t: string; at: number; size: number; color: string; p: Pal }> = ({ t, at, size, color, p }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const chars = Array.from(t);
  const paso = chars.length > 8 ? 1 : 2;
  const fantasma = p.idea === "fantasma";
  const solida = fantasma ? arrive(frame, at + 4, 8, "arriveGentle") : 1;
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "bottom",
        paddingTop: "0.04em",
        fontFamily: p.ideaCondensada ? anton.fontFamily : marca.fuenteTitulo,
        fontWeight: p.ideaCondensada ? 400 : 700,
        fontSize: size * u,
        lineHeight: 0.92,
        letterSpacing: p.ideaCondensada ? "-0.005em" : "-0.045em",
        textTransform: p.ideaCondensada ? "uppercase" : "none",
        color,
        opacity: fantasma ? 0.3 + 0.7 * solida : 1,
      }}
    >
      {chars.map((ch, i) => {
        const e = arrive(frame, at + i * paso, 9, "arrive");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              transform: fantasma ? `translateY(${(1 - e) * 22}%)` : `translateY(${(1 - e) * 104}%)`,
              filter: e < 0.98 ? `blur(${(1 - e) * 12 * u}px)` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

const Palabra: React.FC<{ k: Token; at: number; size: number; color: string; p: Pal }> = ({ k, at, size, color, p }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  if (k.tipo === "enfasis") {
    const e = arrive(frame, at, 12, "arriveSoft");
    return (
      <span
        style={{
          display: "inline-block",
          fontFamily: serif.fontFamily,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: size * u,
          lineHeight: 0.9,
          letterSpacing: "-0.01em",
          color,
          opacity: Math.min(1, e / 0.6),
          transform: `scale(${0.9 + 0.1 * e})`,
          transformOrigin: "0% 100%",
          filter: e < 0.98 ? `blur(${(1 - e) * 14 * u}px)` : undefined,
        }}
      >
        {k.t}
      </span>
    );
  }
  const e = arrive(frame, at, 10, "arriveGentle");
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: marca.fuenteTexto,
        fontWeight: 500,
        fontSize: size * u,
        lineHeight: 1,
        letterSpacing: "-0.015em",
        color,
        opacity: Math.min(1, e / 0.6),
        transform: `translateY(${(1 - e) * 14 * u}px)`,
        filter: e < 0.98 ? `blur(${(1 - e) * 8 * u}px)` : undefined,
      }}
    >
      {k.t}
    </span>
  );
};

/** Bloque de texto: cada línea se arma con sus voces; una línea solo de idea llena el ancho útil. */
const Texto: React.FC<{ texto: string; p: Pal; delay: number; tope: number; claro?: boolean; alinear?: "izquierda" | "centro" }> = ({
  texto,
  p,
  delay,
  tope,
  claro = false,
  alinear = "izquierda",
}) => {
  const { u, ancho: W, zona } = useEscala();
  const util = (W - 2 * zona.lados) / u;
  const colorIdea = claro && p.acento === p.tinta ? p.luz : p.acento;
  const colorTexto = claro ? p.luz : p.tinta;
  let t = delay;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinear === "centro" ? "center" : "flex-start", gap: 4 * u }}>
      {lineas(texto).map((l, li) => {
        const ks = tokens(l);
        const soloIdea = ks.every((k) => k.tipo === "idea");
        const largo = ks.reduce((s, k) => s + Array.from(k.t).length, 0) + Math.max(0, ks.length - 1);
        const ajuste = util / (Math.max(1, largo) * p.anchoChar);
        const sizeIdea = soloIdea ? Math.min(tope, ajuste) : Math.min(tope * 0.55, ajuste, 200);
        const sizeEnfasis = Math.max(p.conector * 1.9, sizeIdea * 0.62);
        return (
          <div key={li} style={{ display: "flex", alignItems: "baseline", gap: `0 ${0.24 * p.conector * u}px`, whiteSpace: "nowrap" }}>
            {ks.map((k, ki) => {
              const at = t;
              t += pasoDe(k, p);
              return k.tipo === "idea" ? (
                <Idea key={ki} t={k.t} at={at} size={sizeIdea} color={colorIdea} p={p} />
              ) : (
                <Palabra key={ki} k={k} at={at} size={k.tipo === "enfasis" ? sizeEnfasis : p.conector} color={k.tipo === "enfasis" ? colorTexto : claro ? p.luz : p.tinta} p={p} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** Cuadros (locales a la escena) en que arranca cada token del texto: los mismos que usa `Texto`. */
const tiemposTexto = (texto: string, p: Pal, delay: number) => {
  let t = delay;
  return lineas(texto)
    .flatMap(tokens)
    .map((k) => {
      const at = t;
      t += pasoDe(k, p);
      return at;
    });
};

/** Inicios seguros de cada escena según su tipo; con ellos `Transito` mide dónde se queda quieta. */
const eventosBeat = (b: Beat, p: Pal, dur: number): number[] => {
  const ev = [0, ...(b.golpe ? [2] : [])];
  switch (b.tipo) {
    case "impacto":
      return [...ev, 10, ...tiemposTexto(b.texto, p, 3), ...(b.recorte ? [8] : [])];
    case "frase":
      return [...ev, ...tiemposTexto(b.texto, p, 3), ...(b.recorte ? [10] : [])];
    case "oscuro":
      return [...ev, ...tiemposTexto(b.texto, p, 4)];
    case "objeto": {
      if (p.tarjetaSplit) {
        const tSplit = Math.max(24, Math.round(dur * 0.36));
        return [...ev, 3, tSplit, tSplit + 2, tSplit + 9, ...tiemposTexto(b.texto, p, tSplit + 16)];
      }
      return [...ev, 5, ...(p.bloque ? [2] : []), ...(p.punteado ? [16] : []), ...tiemposTexto(b.texto, p, p.bloque ? 12 : 8)];
    }
  }
};

// ── Media ──
const Muestra: React.FC<{ tono: string; luz: string }> = ({ tono, luz }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 400 400" width="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`${id}g`} cx="34%" cy="28%" r="80%">
          <stop offset="0%" stopColor={luz} />
          <stop offset="100%" stopColor={tono} />
        </radialGradient>
      </defs>
      <path d="M200 30c86 0 146 70 146 166s-60 174-150 174S54 300 54 200 114 30 200 30z" fill={`url(#${id}g)`} />
    </svg>
  );
};

const contenido = (media: string, p: Pal, cover = false): React.ReactNode => {
  if (!media) return <Muestra tono={p.tinta === "#111111" ? "#3E3E3C" : "#2A2A2A"} luz="#E4E2DE" />;
  const url = resolverMedia(media);
  const estilo: React.CSSProperties = cover ? { width: "100%", height: "100%", objectFit: "cover" } : { width: "100%", display: "block" };
  return esVideo(media) ? <OffthreadVideo src={url} muted style={estilo} /> : <Img src={url} style={estilo} />;
};

/** Recorte que sube desde abajo y cae al papel; en B/N si la variante lo pide; con péndulo si cuelga. */
const Recorte: React.FC<{ media: string; p: Pal; at: number; out: number; x: number; y: number; ancho: number; seed: string; cuelga?: boolean }> = ({
  media,
  p,
  at,
  out,
  x,
  y,
  ancho,
  seed,
  cuelga = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho: W, alto: H } = useEscala();
  const sube = arrive(frame, at, cuelga ? 24 : 12, "arriveSoft");
  const angulo = cuelga ? inertialBounce(frame - at - 12, fps, 0.16, 1 / 2.2, 0.55) * 57 : 0;
  const pivoteY = y * H - 520 * u;
  return (
    <AbsoluteFill
      style={{
        transform: cuelga ? `translateX(${(1 - sube) * 0.5 * W}px) rotate(${angulo + (1 - sube) * -14}deg)` : `translateY(${(1 - sube) * 260 * u}px)`,
        transformOrigin: `${x * W}px ${pivoteY}px`,
      }}
    >
      {cuelga ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <line x1={x * W} y1={pivoteY - 600 * u} x2={x * W} y2={y * H - ancho * 0.42 * u} stroke="#9A9692" strokeWidth={2.5 * u} />
        </svg>
      ) : null}
      <CutoutObject
        x={x}
        y={y}
        ancho={ancho}
        at={at}
        out={out}
        rotacion={cuelga ? 0 : -3}
        rotacionInicial={cuelga ? 0 : -10}
        escalaInicial={0.8}
        resorte="heavy"
        sombra={
          p.sombraLarga
            ? { angulo: 45, largo: 96, opacidad: 0.24, color: "#2A2A2A" }
            : { angulo: 70, largo: 30, opacidad: 0.3, color: p.tinta === "#111111" ? "#262624" : "#3A3632" }
        }
        deriva={cuelga ? 0 : 5}
        seed={seed}
      >
        <div style={{ filter: p.recorteBN ? "grayscale(1) contrast(1.15)" : undefined }}>{contenido(media, p)}</div>
      </CutoutObject>
    </AbsoluteFill>
  );
};

/** Círculo punteado que se dibuja alrededor del objeto (papel-tinta): el `AnilloPunteado` del kit de anotación. */
const Punteado: React.FC<{ x: number; y: number; r: number; at: number; color: string }> = ({ x, y, r, at, color }) => {
  const { u, ancho: W, alto: H } = useEscala();
  return (
    <AbsoluteFill>
      <AnilloPunteado piel="vector" color={color} en={{ x: x * W, y: y * H }} r={r * u} patron={[10 * u, 9 * u]} grosor={3 * u} inicio={at} dur={21} curva="move" />
    </AbsoluteFill>
  );
};

const Rejilla: React.FC<{ p: Pal; modo: "parcial" | "completa"; registro: boolean }> = ({ p, modo, registro }) => {
  const { u, ancho: W, alto: H } = useEscala();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const paso = (modo === "parcial" ? 58 : 96) * u;
  const caja = modo === "parcial" ? { x: 0.3 * W, y: 0.24 * H, w: 0.42 * W, h: 0.28 * H } : { x: 0, y: 0, w: W, h: H };
  const cruz = (cx: number, cy: number) => (
    <g key={`${cx}-${cy}`} stroke={p.tinta} strokeWidth={1.5 * u} strokeOpacity={0.5}>
      <line x1={cx - 18 * u} y1={cy} x2={cx + 18 * u} y2={cy} />
      <line x1={cx} y1={cy - 18 * u} x2={cx} y2={cy + 18 * u} />
      <circle cx={cx} cy={cy} r={8 * u} fill="none" />
    </g>
  );
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id={id} width={paso} height={paso} patternUnits="userSpaceOnUse" x={caja.x} y={caja.y}>
          <path d={`M ${paso} 0 L 0 0 0 ${paso}`} fill="none" stroke={p.secundario} strokeWidth={1.1 * u} />
        </pattern>
      </defs>
      <rect x={caja.x} y={caja.y} width={caja.w} height={caja.h} fill={`url(#${id})`} opacity={modo === "parcial" ? 0.5 : 0.42} />
      {registro ? [cruz(60 * u, 60 * u), cruz(W - 60 * u, 60 * u), cruz(60 * u, H - 60 * u), cruz(W - 60 * u, H - 60 * u)] : null}
    </svg>
  );
};

// ── Beats ──
type BeatProps = { b: Beat; p: Pal; dur: number; i: number };

const Zona: React.FC<{ children: React.ReactNode; y?: number; centro?: boolean }> = ({ children, y, centro }) => {
  const { zona, alto: H } = useEscala();
  return (
    <AbsoluteFill
      style={{
        padding: `${y === undefined ? zona.arriba : y * H}px ${zona.lados}px 0`,
        justifyContent: "flex-start",
        alignItems: centro ? "center" : "flex-start",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const BeatImpacto: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const frame = useCurrentFrame();
  const hold = tween(frame, 10, Math.max(30, dur - 10), "glide");
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${1 + hold * 0.06})`, transformOrigin: "50% 45%" }}>
        <Zona y={0.34}>
          <Texto texto={b.texto} p={p} delay={3} tope={p.ideaMax} />
        </Zona>
      </AbsoluteFill>
      {b.recorte ? <Recorte media={b.recorte} p={p} at={8} out={dur - 8} x={0.62} y={0.4} ancho={300} seed={`ci${i}`} cuelga /> : null}
    </AbsoluteFill>
  );
};

const BeatFrase: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  return (
    <AbsoluteFill>
      <Zona y={0.26}>
        <Texto texto={b.texto} p={p} delay={3} tope={p.ideaMax * 0.62} />
      </Zona>
      {b.recorte ? <Recorte media={b.recorte} p={p} at={10} out={dur - 9} x={0.56} y={0.68} ancho={440} seed={`cf${i}`} /> : null}
    </AbsoluteFill>
  );
};

const BeatObjeto: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const frame = useCurrentFrame();
  const { ancho: W, alto: H } = useEscala();
  if (p.tarjetaSplit) return <BeatTarjeta b={b} p={p} dur={dur} i={i} />;
  const bloque = p.bloque ? arrive(frame, 2, 12, "arriveSoft") : 0;
  return (
    <AbsoluteFill>
      {p.bloque ? (
        <div
          style={{
            position: "absolute",
            left: 0.14 * W,
            top: 0.6 * H,
            width: 0.56 * W,
            height: 0.17 * H,
            backgroundColor: p.acento,
            transform: `translateX(${(1 - bloque) * -0.8 * W}px)`,
          }}
        />
      ) : null}
      {p.punteado ? <Punteado x={0.52} y={0.6} r={300} at={16} color={p.tinta} /> : null}
      <Recorte media={b.recorte} p={p} at={5} out={dur - 9} x={p.bloque ? 0.4 : 0.52} y={0.6} ancho={p.bloque ? 420 : 470} seed={`co${i}`} />
      <Zona>
        <Texto texto={b.texto} p={p} delay={p.bloque ? 12 : 8} tope={p.ideaMax * 0.5} />
      </Zona>
    </AbsoluteFill>
  );
};

/** Tarjeta octogonal con trama que entra, se parte al centro y revela el objeto entre las mitades (gris-objeto). */
const BeatTarjeta: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const frame = useCurrentFrame();
  const { u, ancho: W, alto: H } = useEscala();
  const entra = arrive(frame, 3, 16, "arriveSoft");
  const tSplit = Math.max(24, Math.round(dur * 0.36));
  const abre = tween(frame, tSplit, 14, "move");
  const lineasIn = tween(frame, tSplit + 9, 10, "glide");
  const cw = 560 * u;
  const ch = 700 * u;
  const cx = W / 2;
  const cy = 0.5 * H;
  const sep = abre * 200 * u;
  const octo = "polygon(7% 0, 93% 0, 100% 6%, 100% 94%, 93% 100%, 7% 100%, 0 94%, 0 6%)";
  const mitad = (lado: "izq" | "der") => (
    <div
      style={{
        position: "absolute",
        left: cx - cw / 2,
        top: cy - ch / 2,
        width: cw,
        height: ch,
        transform: `translate(${lado === "izq" ? -sep : sep}px, ${(1 - entra) * 40 * u}px)`,
        opacity: Math.min(1, entra / 0.6),
        clipPath: lado === "izq" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
        filter: `drop-shadow(${6 * u}px ${10 * u}px ${12 * u}px rgba(20,20,18,0.35))`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, clipPath: octo, backgroundColor: "#5E5E5A", border: `${3 * u}px solid #C9C9C4` }}>
        <div style={{ position: "absolute", inset: 0, filter: "grayscale(1) contrast(1.2)" }}>{b.imagen ? contenido(b.imagen, p, true) : null}</div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(10,10,10,0.42) ${1.2 * u}px, transparent ${1.9 * u}px)`,
            backgroundSize: `${6 * u}px ${6 * u}px`,
            mixBlendMode: "multiply",
          }}
        />
      </div>
    </div>
  );
  const top = cy - ch / 2;
  const bottom = cy + ch / 2;
  const xi = cx - sep;
  const xd = cx + sep;
  return (
    <AbsoluteFill>
      {mitad("izq")}
      {mitad("der")}
      {abre > 0.05 ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: lineasIn }}>
          <g stroke="#6A6A66" strokeWidth={2 * u}>
            <line x1={xi} y1={top} x2={xi + (xd - xi) * lineasIn} y2={top + (bottom - top) * lineasIn} />
            <line x1={xd} y1={top} x2={xd - (xd - xi) * lineasIn} y2={top + (bottom - top) * lineasIn} />
          </g>
        </svg>
      ) : null}
      {frame >= tSplit ? <Recorte media={b.recorte} p={p} at={tSplit + 2} out={dur - 8} x={0.5} y={0.5} ancho={360} seed={`ct${i}`} /> : null}
      <Zona>
        <Texto texto={b.texto} p={p} delay={tSplit + 16} tope={p.ideaMax} />
      </Zona>
    </AbsoluteFill>
  );
};

const BeatOscuro: React.FC<BeatProps> = ({ b, p, dur }) => {
  const frame = useCurrentFrame();
  const push = tween(frame, 0, Math.max(30, dur), "glide");
  return (
    <AbsoluteFill style={{ backgroundColor: p.oscuro }}>
      {b.imagen ? (
        <AbsoluteFill style={{ transform: `scale(${1.02 + push * 0.045})`, filter: p.filtroOscuro }}>{contenido(b.imagen, p, true)}</AbsoluteFill>
      ) : null}
      <Zona y={0.4} centro>
        <Texto texto={b.texto} p={p} delay={4} tope={p.ideaMax * 0.7} claro alinear="centro" />
      </Zona>
    </AbsoluteFill>
  );
};

const BEATS: Record<Beat["tipo"], React.FC<BeatProps>> = { impacto: BeatImpacto, frase: BeatFrase, objeto: BeatObjeto, oscuro: BeatOscuro };

/** Entrada/salida de cada escena según la variante, golpe opcional y pasos de cámara. */
const Transito: React.FC<{ p: Pal; dur: number; primero: boolean; golpe: boolean; rellenos: number[]; children: React.ReactNode }> = ({
  p,
  dur,
  primero,
  golpe,
  rellenos,
  children,
}) => {
  const frame = useCurrentFrame();
  const { u, ancho: W } = useEscala();
  const S = p.solape;
  let tx = 0;
  let blur = 0;
  let op = 1;
  if (p.transicion === "empuje") {
    const entra = primero ? 1 : tween(frame, 0, S, "snap");
    const sale = tween(frame, dur, S, "snap");
    tx = (1 - entra) * W - sale * W;
    blur = ((1 - entra) + sale) * 22 * u;
  } else if (p.transicion === "disolver") {
    const entra = primero ? 1 : arrive(frame, 0, 12, "arriveGentle");
    const sale = leave(frame, dur, S, "leaveSoft");
    blur = (1 - entra) * 24 * u + sale * 26 * u;
    op = Math.min(1, entra / 0.6) * (1 - sale);
  }
  const dip = golpe ? 1 - leave(frame, 2, 4, "leave") : 0;
  // Pasos de cámara (empujes glide de 20 f que se suman) solo donde la escena pasa de 24 f sin evento (D-01).
  const cam = 1 + rellenos.reduce((s, t) => s + tween(frame, t, 20, "glide"), 0) * 0.011;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${tx}px) scale(${cam})`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined, opacity: op }}>{children}</AbsoluteFill>
      {golpe && dip > 0.01 ? <AbsoluteFill style={{ backgroundColor: p.golpe === "acento" ? p.acento : p.tinta === "#111111" ? "#0A0A0A" : p.tinta, opacity: dip }} /> : null}
    </AbsoluteFill>
  );
};

// ── Cierres ──
const CierreFundido: React.FC<{ c: Props["cierre"]; p: Pal; dur: number }> = ({ c, p, dur }) => {
  const frame = useCurrentFrame();
  const negro = tween(frame, Math.max(10, dur - 30), 30, "glide");
  const tFirma = duracionTexto(c.texto, p) + 2;
  return (
    <AbsoluteFill style={{ backgroundColor: p.papel }}>
      <Zona y={0.42}>
        <Texto texto={c.texto} p={p} delay={4} tope={p.ideaMax * 0.5} />
        {c.firma ? <Firma texto={c.firma} at={tFirma} color={p.secundario} /> : null}
      </Zona>
      <AbsoluteFill style={{ backgroundColor: p.oscuro, opacity: negro }} />
    </AbsoluteFill>
  );
};

/** Disco central que crece mientras los puntos de su órbita se disuelven escalonados (papel-tinta). */
const CierreDisco: React.FC<{ c: Props["cierre"]; p: Pal; dur: number }> = ({ c, p }) => {
  const frame = useCurrentFrame();
  const { u, ancho: W, alto: H } = useEscala();
  const crece = tween(frame, 12, 55, "leaveSoft");
  const aparece = arrive(frame, 0, 14, "arriveSoft");
  const n = 24;
  const cx = W / 2;
  const cy = 0.6 * H;
  const tFirma = duracionTexto(c.texto, p) + 6;
  return (
    <AbsoluteFill style={{ backgroundColor: p.papel }}>
      <Rejilla p={p} modo="completa" registro={false} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={(90 + 190 * crece) * u * (0.85 + 0.15 * aparece)} fill={p.tinta} opacity={aparece} />
        {Array.from({ length: n }, (_, k) => {
          const a = (k / n) * Math.PI * 2 - Math.PI / 2;
          const r = (k % 2 ? 330 : 360) * u;
          const fuera = leave(frame, 16 + k * 2, 8, "leaveSoft");
          const entra = arrive(frame, 2 + k, 10, "arriveGentle");
          return <circle key={k} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={(k % 3 ? 9 : 13) * u} fill={p.tinta} opacity={entra * (1 - fuera)} />;
        })}
      </svg>
      <Zona>
        <Texto texto={c.texto} p={p} delay={6} tope={p.ideaMax * 0.5} />
        {c.firma ? <Firma texto={c.firma} at={tFirma} color={p.tinta} /> : null}
      </Zona>
    </AbsoluteFill>
  );
};

/** Disco claro con el objeto sobre negro con grano; se aleja cenital y se dibuja el campo alrededor (gris-objeto). */
const CierreCenital: React.FC<{ c: Props["cierre"]; p: Pal; dur: number }> = ({ c, p, dur }) => {
  const frame = useCurrentFrame();
  const { u, ancho: W, alto: H } = useEscala();
  const llega = tween(frame, 0, 28, "arriveSoft");
  const aleja = tween(frame, 30, Math.min(90, Math.max(30, dur - 40)), "glide");
  const traza = tween(frame, 34, 30, "glide");
  const escala = (2.6 - 1.6 * llega) * (1 - 0.6 * aleja);
  const fw = 0.86 * W;
  const fh = 1.5 * W;
  const campo = [
    `M ${-fw / 2} ${-fh / 2} H ${fw / 2} V ${fh / 2} H ${-fw / 2} Z`,
    `M ${-fw / 2} 0 H ${fw / 2}`,
    `M ${-fw * 0.3} ${-fh / 2} V ${-fh * 0.33} H ${fw * 0.3} V ${-fh / 2}`,
    `M ${-fw * 0.3} ${fh / 2} V ${fh * 0.33} H ${fw * 0.3} V ${fh / 2}`,
  ];
  const tFirma = 12 + duracionTexto(c.texto, p);
  return (
    <AbsoluteFill style={{ backgroundColor: p.oscuro }}>
      <AbsoluteFill style={{ transform: `scale(${escala})`, transformOrigin: "50% 52%" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g transform={`translate(${W / 2} ${0.52 * H})`} fill="none" stroke="#3A3A38" strokeWidth={3 * u}>
            {campo.map((d, k) => (
              <path key={k} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - traza} />
            ))}
            <circle r={0.18 * fw} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - traza} />
            <circle r={150 * u} fill="#A8A9A4" stroke="none" />
          </g>
        </svg>
        <div style={{ position: "absolute", left: W / 2 - 110 * u, top: 0.52 * H - 120 * u, width: 220 * u, filter: "grayscale(1) contrast(1.15)" }}>
          {contenido(c.recorte, p)}
        </div>
      </AbsoluteFill>
      <Zona>
        <Texto texto={c.texto} p={p} delay={10} tope={p.ideaMax} claro />
        {c.firma ? <Firma texto={c.firma} at={tFirma} color={p.luz} /> : null}
      </Zona>
    </AbsoluteFill>
  );
};

const Firma: React.FC<{ texto: string; at: number; color: string }> = ({ texto, at, color }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const e = arrive(frame, at, 11, "arriveGentle");
  return (
    <div
      style={{
        marginTop: 28 * u,
        fontFamily: marca.fuenteTexto,
        fontWeight: 600,
        fontSize: 32 * u,
        letterSpacing: "0.02em",
        color,
        opacity: Math.min(1, e / 0.6),
        transform: `translateY(${(1 - e) * 10 * u}px)`,
      }}
    >
      {texto}
    </div>
  );
};

const CIERRES = { fundido: CierreFundido, disco: CierreDisco, cenital: CierreCenital };

export const CollageImpacto: React.FC<Props> = ({ variante, beats, cierre, colores: c }) => {
  const p = paleta(variante, c);
  const tramos = beats.reduce<{ inicio: number; dur: number }[]>((acc, b) => {
    const inicio = acc.length ? acc[acc.length - 1].inicio + acc[acc.length - 1].dur : 0;
    return [...acc, { inicio, dur: cuadros(b.segundos) }];
  }, []);
  const finBeats = tramos.length ? tramos[tramos.length - 1].inicio + tramos[tramos.length - 1].dur : 0;
  const Cierre = CIERRES[p.cierre];
  return (
    <AbsoluteFill style={{ backgroundColor: p.papel }}>
      {p.rejilla ? <Rejilla p={p} modo={p.rejilla} registro={p.registro} /> : null}
      {beats.map((b, i) => {
        const { inicio, dur } = tramos[i];
        const Comp = BEATS[b.tipo];
        return (
          <Sequence key={i} from={inicio} durationInFrames={dur + p.solape} name={`beat ${i + 1} · ${b.tipo}`}>
            <Transito p={p} dur={dur} primero={i === 0} golpe={b.golpe} rellenos={rellenarHuecos(eventosBeat(b, p, dur), dur)}>
              <Comp b={b} p={p} dur={dur} i={i} />
            </Transito>
          </Sequence>
        );
      })}
      <Sequence from={finBeats} durationInFrames={cuadros(cierre.segundos)} name="cierre">
        <Cierre c={cierre} p={p} dur={cuadros(cierre.segundos)} />
      </Sequence>
      <Look grain={p.grano} vignette={p.vineta} warmth={p.tinte} />
    </AbsoluteFill>
  );
};

export const collageImpacto = definir({
  id: "Plantilla-CollageImpacto",
  fuente: "tiktok-7600179656922385685, tiktok-7684823088906636562, C-yZlQXN3rQ",
  resumen: "Tipografía condensada gigante sobre papel, con recortes que tocan las letras y caídas a negro al golpe.",
  cuando: "Un mensaje fuerte y corto: manifiesto, apertura de campaña o gancho que tiene que frenar el scroll.",
  schema,
  componente: CollageImpacto,
  defaultProps: {
    variante: "crema-rojo",
    beats: [
      { tipo: "frase", texto: "Tu mensaje / *compite* / con _todo_", segundos: 2.4, recorte: "", imagen: "", golpe: false },
      { tipo: "impacto", texto: "*tres / segundos*", segundos: 2.2, recorte: "", imagen: "", golpe: true },
      { tipo: "frase", texto: "para que alguien / *decida* / si se _queda_", segundos: 2.6, recorte: "", imagen: "", golpe: false },
      { tipo: "objeto", texto: "Lo que no se ve / *no se vende*", segundos: 2.8, recorte: "", imagen: "", golpe: false },
      { tipo: "oscuro", texto: "y casi nadie / *lo dice*", segundos: 2.4, recorte: "", imagen: "", golpe: true },
      { tipo: "impacto", texto: "*claridad*", segundos: 2, recorte: "", imagen: "", golpe: true },
    ],
    cierre: { texto: "Di una cosa. / Dila _bien_.", firma: "@tumarca", recorte: "", segundos: 2.8 },
    colores: {},
  },
  duracion: (p) => p.beats.reduce((s, b) => s + cuadros(b.segundos), 0) + cuadros(p.cierre.segundos),
  formatos: ["vertical", "retrato"],
});
