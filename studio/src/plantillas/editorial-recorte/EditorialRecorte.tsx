import { loadFont as cargarSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AnilloPunteado, Trazo } from "../../components/anotacion";
import { BlurStack } from "../../components/presets/BlurStack";
import { CutoutObject } from "../../components/presets/CutoutObject";
import { Look } from "../../components/presets/Look";
import { tiemposSandwich, TypeSandwich } from "../../components/presets/TypeSandwich";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, leave, mix, type SpringName, staggerDelay, tween } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, esVideo, rellenarHuecos, resolverMedia, zColores, zMedia } from "../base";

/**
 * Plantilla · familia `editorial-recorte` (referentes/lote-2026-11-08.md).
 * Videos de origen (recetas en referentes/_raw/videos/<id>/receta.json):
 *   - tiktok-7581551601349954824 → variante "gris-script"
 *   - tiktok-7622319703679110421 → variante "acento-azul"
 *   - tiktok-7671829994292776200 → variante "noche-amarilla"
 *   - tiktok-7545813836503289144 → variante "crema-marco"
 *
 * Qué se tomó (técnica medida): un objeto recortado por idea sobre cartulina lisa; titular grotesco con la
 * palabra clave en serif itálica de acento (TypeSandwich) y frase de apoyo que entra por palabra con blur
 * (BlurStack); contraste de escala tipográfica; objetos que caen al papel con ease-out largo y sombra que se
 * acorta al apoyarse (CutoutObject). Por variante: scroll vertical continuo de ~30 % del alto en 19 f (move) y
 * barra negra que sube como suelo (gris-script); tarjeta de acento pleno de 4 f entre escenas y banda vertical de
 * color detrás del objeto (acento-azul); fondo negro cálido con rejilla de 1 px, curva guía que se dibuja, cortes
 * secos y objetos que entran girados con desenfoque de movimiento (noche-amarilla); cartel crema con viñeta,
 * marco oscuro que entra tras un barrido de arco, círculos punteados que se dibujan y zoom-through al recorte para
 * cerrar el bloque (crema-marco). Tipos de beat: objeto, tarjeta (flash card), lista (viñetas rombo que se
 * llenan cada 15 f) y cifra (contador + resaltador que barre la frase).
 *
 * Qué NO se copió (kb/10): textos, temas, objetos, fotos, logos y firmas de los creadores; el glow amarillo
 * (AI-23, aquí acento plano); la bombilla con círculo siempre visible (AI-12: el punteado gira lento y solo
 * acompaña la entrada); la misma sombra pegada a todos los recortes (AI-33: la sombra cambia con la altura del
 * objeto); el marco Antes/Después del editor; la caligrafía script (se reemplaza por Instrument Serif itálica,
 * licencia OFL). Los textos por defecto son genéricos del estudio.
 */

const serif = cargarSerif("italic", { weights: ["400"], subsets: ["latin"] });

// ── Variantes: una por video miembro, con su paleta, ritmo y tratamiento medidos ──
type Transicion = "scroll" | "flash" | "corte" | "destello";
type Variante = {
  fondo: string;
  texto: string;
  acento: string;
  secundario: string;
  /** Fondo oscuro: cambia sombras, objeto de muestra y tamaño del cierre. */
  oscuro: boolean;
  /** Fondo del beat "tarjeta": acento pleno (flash card) o tinta; y color del texto encima. */
  tarjeta: "acento" | "texto";
  sobreTarjeta: "fondo" | "claro";
  /** Fondo del cierre; vacío = fondo. */
  cierreFondo?: string;
  apoyoSerif: boolean;
  grotescaSecundaria: boolean;
  pesoTitular: number;
  sizeTitular: number;
  escalaSerif: number;
  alinear: "izquierda" | "centro";
  transicion: Transicion;
  solape: number;
  /** Entrada de la frase de apoyo: duración por palabra y cuadros entre palabras. */
  palabra: { dur: number; cada: number };
  objeto: { resorte: SpringName; rotIni: number; escIni: number; blur: number; desdeX: number; desdeY: number; dur: number };
  banda: "horizontal" | "vertical" | null;
  rejilla: number;
  curvas: boolean;
  punteado: boolean;
  marco: boolean;
  vineta: number;
  grano: number;
  tinte: string;
};

const VARIANTES = {
  /** tiktok-7581551601349954824: monocromo gris, script + grotesca negra, scroll vertical y barra negra. */
  "gris-script": {
    fondo: "#eceff1",
    texto: "#1d1d1b",
    acento: "#1d1d1b",
    secundario: "#a6a8ab",
    tarjeta: "texto",
    sobreTarjeta: "fondo",
    oscuro: false,
    cierreFondo: "#c9ccd0",
    apoyoSerif: true,
    grotescaSecundaria: false,
    pesoTitular: 800,
    sizeTitular: 132,
    escalaSerif: 1.16,
    alinear: "izquierda",
    transicion: "scroll",
    solape: 19,
    palabra: { dur: 10, cada: 4 },
    objeto: { resorte: "heavy", rotIni: -14, escIni: 0.78, blur: 0, desdeX: 260, desdeY: 0, dur: 30 },
    banda: "horizontal",
    rejilla: 0,
    curvas: false,
    punteado: true,
    marco: false,
    vineta: 0.16,
    grano: 0.05,
    tinte: "#a6a8ab",
  },
  /** tiktok-7622319703679110421: cartulina gris, acento azul único, flash cards de 4 f y banda vertical. */
  "acento-azul": {
    fondo: "#eceff1",
    texto: "#1d1d1b",
    acento: "#b112e3",
    secundario: "#3a3a37",
    tarjeta: "acento",
    sobreTarjeta: "claro",
    oscuro: false,
    apoyoSerif: false,
    grotescaSecundaria: false,
    pesoTitular: 800,
    sizeTitular: 124,
    escalaSerif: 1.2,
    alinear: "izquierda",
    transicion: "flash",
    solape: 0,
    palabra: { dur: 8, cada: 5 },
    objeto: { resorte: "snappy", rotIni: 8, escIni: 0.82, blur: 0, desdeX: 0, desdeY: 120, dur: 15 },
    banda: "vertical",
    rejilla: 0,
    curvas: false,
    punteado: false,
    marco: false,
    vineta: 0.3,
    grano: 0.04,
    tinte: "#7757bd",
  },
  /** tiktok-7671829994292776200: negro cálido con rejilla, acento amarillo plano, cortes al golpe. */
  "noche-amarilla": {
    fondo: "#1d1d1b",
    texto: "#f4f9fc",
    acento: "#c03bfb",
    secundario: "#a6a8ab",
    tarjeta: "acento",
    sobreTarjeta: "fondo",
    oscuro: true,
    apoyoSerif: false,
    grotescaSecundaria: false,
    pesoTitular: 600,
    sizeTitular: 60,
    escalaSerif: 1.9,
    alinear: "izquierda",
    transicion: "corte",
    solape: 0,
    palabra: { dur: 14, cada: 5 },
    objeto: { resorte: "critical", rotIni: -30, escIni: 0.7, blur: 22, desdeX: -220, desdeY: 260, dur: 20 },
    banda: null,
    rejilla: 0.5,
    curvas: true,
    punteado: false,
    marco: false,
    vineta: 0.45,
    grano: 0.06,
    tinte: "#140b18",
  },
  /** tiktok-7545813836503289144: cartel crema con viñeta, sans + serif, marco, punteado y zoom-through. */
  "crema-marco": {
    fondo: "#f4f9fc",
    texto: "#1d1d1b",
    acento: "#1d1d1b",
    secundario: "#5f6164",
    tarjeta: "texto",
    sobreTarjeta: "fondo",
    oscuro: false,
    apoyoSerif: false,
    grotescaSecundaria: true,
    pesoTitular: 700,
    sizeTitular: 96,
    escalaSerif: 1.22,
    alinear: "centro",
    transicion: "destello",
    solape: 8,
    palabra: { dur: 12, cada: 6 },
    objeto: { resorte: "heavy", rotIni: -6, escIni: 0.7, blur: 0, desdeX: 0, desdeY: 0, dur: 20 },
    banda: null,
    rejilla: 0.16,
    curvas: false,
    punteado: true,
    marco: true,
    vineta: 0.5,
    grano: 0.05,
    tinte: "#a6a8ab",
  },
} satisfies Record<string, Variante>;

type NombreVariante = keyof typeof VARIANTES;

// ── Schema ──
const zBeat = z.object({
  tipo: z
    .enum(["objeto", "tarjeta", "lista", "cifra"])
    .default("objeto")
    .describe("objeto: recorte + titular · tarjeta: color pleno, texto por palabra · lista: viñetas · cifra: contador"),
  apoyo: z.string().default("").describe("frase chica de apoyo, 3–6 palabras (entra por palabra con blur)"),
  titular: z.string().describe("titular; *palabra* = acento en serif itálica; ' / ' parte la línea"),
  segundos: z.number().min(0.8).max(8),
  media: zMedia.describe("recorte PNG con alfa, imagen o video; vacío = objeto de muestra"),
  items: z.array(z.string()).max(4).default([]).describe("solo tipo lista: 2–4 items"),
  cifra: z.number().default(0).describe("solo tipo cifra"),
  sufijo: z.string().default("").describe("solo tipo cifra: %, x, ' de 10'…"),
});

export const schema = z.object({
  variante: z
    .enum(["gris-script", "acento-azul", "noche-amarilla", "crema-marco"])
    .default("gris-script")
    .describe("tratamiento medido de cada video de la familia: paleta, ritmo y transición"),
  beats: z.array(zBeat).min(1).max(12),
  cierre: z.object({
    texto: z.string().describe("frase final; *palabra* = acento"),
    firma: z.string().default("").describe("@usuario o marca, chica"),
    logo: zMedia,
    segundos: z.number().min(0.8).max(5).default(2.2),
  }),
  colores: zColores.describe("vacío = paleta de la variante"),
});

type Props = z.infer<typeof schema>;
type Beat = z.infer<typeof zBeat>;
type Pal = Variante & { tarjetaColor: string; sobreTarjetaColor: string };

const paleta = (nombre: NombreVariante, c: Props["colores"]): Pal => {
  const v: Variante = VARIANTES[nombre];
  const fondo = c.fondo ?? v.fondo;
  const texto = c.texto ?? v.texto;
  const acento = c.acento ?? v.acento;
  return {
    ...v,
    fondo,
    texto,
    acento,
    tarjetaColor: v.tarjeta === "acento" ? acento : texto,
    sobreTarjetaColor: v.sobreTarjeta === "claro" ? "#F7F7F5" : fondo,
  };
};

const lineas = (t: string) =>
  t
    .split(/\s*\/\s*|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
const sinAcentos = (t: string) => t.replace(/\*/g, "");
const palabras = (t: string) => t.split(" ").filter(Boolean).length;

/**
 * Pasos de cámara: empujes cortos (glide, 20 f) encadenados cada 26/33 f desde `desde`.
 * Mantienen viva la escena larga (AI-08) y dan un evento nuevo antes de 30 f (densidad de anuncio)
 * sin caer en metrónomo (AI-11: el intervalo alterna).
 */
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

// ── Piezas ──
const Muestra: React.FC<{ tinta: string; luz: string }> = ({ tinta, luz }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 400 400" width="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`${id}g`} cx="36%" cy="30%" r="75%">
          <stop offset="0%" stopColor={luz} />
          <stop offset="100%" stopColor={tinta} />
        </radialGradient>
      </defs>
      <path d="M200 26c84 0 150 62 154 150s-58 176-150 182S44 304 46 196 116 26 200 26z" fill={`url(#${id}g)`} />
      <path d="M118 150c22-50 92-74 140-40" fill="none" stroke={luz} strokeOpacity={0.55} strokeWidth={10} strokeLinecap="round" />
    </svg>
  );
};

const contenidoRecorte = (media: string, p: Pal): React.ReactNode => {
  if (!media) return <Muestra tinta={p.oscuro ? "#5E5C58" : p.texto} luz={p.oscuro ? "#EDEBE6" : "#D8D8D8"} />;
  const url = resolverMedia(media);
  return esVideo(media) ? (
    <OffthreadVideo src={url} muted style={{ width: "100%", display: "block" }} />
  ) : (
    <Img src={url} style={{ width: "100%", display: "block" }} />
  );
};

/** Recorte con la entrada de la variante: desliza desde un lado, gira y se enfoca mientras cae al papel. */
const Recorte: React.FC<{ media: string; p: Pal; at: number; out: number; x: number; y: number; ancho: number; seed: string }> = ({
  media,
  p,
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
  const e = arrive(frame, at, o.dur, "arriveSoft");
  const tx = (1 - e) * o.desdeX * u;
  const ty = (1 - e) * o.desdeY * u;
  const blur = (1 - arrive(frame, at, 9, "arriveGentle")) * o.blur * u;
  return (
    <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px)`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>
      <CutoutObject
        x={x}
        y={y}
        ancho={ancho}
        at={at}
        out={out}
        rotacion={o.rotIni > 0 ? 3 : -4}
        rotacionInicial={o.rotIni}
        escalaInicial={o.escIni}
        resorte={o.resorte}
        sombra={{ angulo: 52, largo: 40, opacidad: p.oscuro ? 0.6 : 0.26, color: p.oscuro ? "#050403" : "#2B2B2B" }}
        deriva={5}
        seed={seed}
      >
        {contenidoRecorte(media, p)}
      </CutoutObject>
    </AbsoluteFill>
  );
};

/** Círculo punteado que se dibuja y gira lento mientras dura la escena: el `AnilloPunteado` del kit de anotación. */
const Punteado: React.FC<{ x: number; y: number; r: number; at: number; dur: number; color: string }> = ({ x, y, r, at, dur, color }) => {
  const { u, ancho: W, alto: H } = useEscala();
  return (
    <AbsoluteFill>
      <AnilloPunteado
        piel="vector"
        color={color}
        en={{ x: x * W, y: y * H }}
        r={r * u}
        patron={[14 * u, 11 * u]}
        grosor={3 * u}
        desde={-90}
        inicio={at}
        dur={24}
        curva="move"
        giro={40}
        durGiro={Math.max(30, dur)}
      />
    </AbsoluteFill>
  );
};

/** Curva guía fina que cruza el cuadro y se dibuja (noche-amarilla): un `Trazo` del kit en piel vector. */
const Curva: React.FC<{ i: number; color: string }> = ({ i, color }) => {
  const { u, ancho: W, alto: H } = useEscala();
  const a = 0.18 + 0.12 * (i % 3);
  const d = `M ${-0.1 * W} ${a * H} C ${0.35 * W} ${(a + 0.5) * H}, ${0.6 * W} ${(a - 0.1) * H}, ${1.1 * W} ${(a + 0.55) * H}`;
  return (
    <AbsoluteFill>
      <Trazo piel="vector" d={d} color={color} grosor={2 * u} opacidad={0.4} inicio={2} dur={26} curva="glide" />
    </AbsoluteFill>
  );
};

/** Bloque de texto anclado arriba, dentro de la zona segura. */
const Arriba: React.FC<{ p: Pal; children: React.ReactNode; top?: number }> = ({ p, children, top }) => {
  const { zona } = useEscala();
  return (
    <AbsoluteFill
      style={{
        padding: `${top ?? zona.arriba}px ${zona.lados}px 0`,
        alignItems: p.alinear === "centro" ? "center" : "flex-start",
        textAlign: p.alinear === "centro" ? "center" : "left",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Frase de apoyo + titular sándwich. Devuelve el cuadro en que termina de llegar el acento. */
const Titular: React.FC<{ b: Beat; p: Pal; delay: number; size?: number; escala?: number; color?: string; acento?: string }> = ({
  b,
  p,
  delay,
  size,
  escala,
  color,
  acento,
}) => {
  const { u } = useEscala();
  const n = palabras(b.apoyo);
  const finApoyo = b.apoyo ? delay + p.palabra.cada * Math.max(0, n - 1) + p.palabra.dur : delay;
  const tTitular = b.apoyo ? Math.max(delay + 6, finApoyo - 5) : delay;
  return (
    <div>
      {b.apoyo ? (
        <div style={{ fontStyle: p.apoyoSerif ? "italic" : "normal", marginBottom: 10 * u }}>
          <BlurStack
            lineas={[b.apoyo]}
            delay={delay}
            dur={p.palabra.dur}
            stagger={p.palabra.cada * Math.max(0, n - 1)}
            distancia={36}
            blurMax={16}
            size={p.apoyoSerif ? 54 : 40}
            peso={p.apoyoSerif ? 400 : 500}
            color={p.apoyoSerif ? p.texto : p.secundario}
            fuente={p.apoyoSerif ? serif.fontFamily : marca.fuenteTexto}
            alinear={p.alinear}
            deriva={false}
          />
        </div>
      ) : null}
      {b.titular ? (
        <TypeSandwich
          lineas={lineas(b.titular)}
          delay={tTitular}
          size={size ?? p.sizeTitular}
          peso={p.pesoTitular}
          escalaSerif={escala ?? p.escalaSerif}
          color={color ?? (p.grotescaSecundaria ? p.secundario : p.texto)}
          colorAcento={acento ?? p.acento}
          fuenteAcento={serif.fontFamily}
          alinear={p.alinear}
        />
      ) : null}
    </div>
  );
};

// ── Eventos de cada beat (cuadros locales), los mismos que usan las piezas al animar ──
/** Inicios de un BlurStack de una línea: primera palabra en `delay`, la última en `delay + stagger`. */
const tiemposBlur = (texto: string, delay: number, stagger: number) => {
  const n = palabras(texto);
  return Array.from({ length: n }, (_, k) => delay + staggerDelay(k, n, stagger));
};

const tiemposTitular = (b: Beat, p: Pal, delay: number) => {
  const n = palabras(b.apoyo);
  const finApoyo = b.apoyo ? delay + p.palabra.cada * Math.max(0, n - 1) + p.palabra.dur : delay;
  const tTitular = b.apoyo ? Math.max(delay + 6, finApoyo - 5) : delay;
  return [
    ...(b.apoyo ? tiemposBlur(b.apoyo, delay, p.palabra.cada * Math.max(0, n - 1)) : []),
    ...(b.titular ? tiemposSandwich(lineas(b.titular), tTitular) : []),
  ];
};

const eventosBeat = (b: Beat, p: Pal, dur: number, i: number): number[] => {
  const ev = [0];
  if (b.tipo === "objeto") {
    const tObj = p.marco ? 12 : 1;
    ev.push(tObj, ...tiemposTitular(b, p, p.marco ? 26 : 4));
    if (p.banda === "horizontal" && i % 2 === 1) ev.push(3);
    if (p.banda === "vertical") ev.push(2);
    if (p.marco) ev.push(4, 14, 34, 41);
    if (p.punteado && !p.marco) ev.push(tObj + 8);
  } else if (b.tipo === "tarjeta") {
    const ls = lineas(sinAcentos(b.titular));
    const n = ls.reduce((s, l) => s + palabras(l), 0);
    if (b.apoyo) ev.push(...tiemposBlur(b.apoyo, 3, 10));
    ev.push(...tiemposBlur(ls.join(" "), b.apoyo ? 12 : 4, Math.min(48, 7 * Math.max(0, n - 1))));
  } else if (b.tipo === "lista") {
    if (b.media) ev.push(6);
    ev.push(...tiemposTitular(b, p, 3), ...b.items.flatMap((_, k) => [30 + k * 15 - 4, 30 + k * 15, 30 + k * 15 + 8]));
  } else {
    const t0 = b.titular ? 16 : 4;
    const tApoyo = t0 + 22;
    ev.push(t0, ...(b.media ? [t0 + 10] : []), ...(b.titular ? tiemposTitular({ ...b, apoyo: "" }, p, 3) : []));
    if (b.apoyo) ev.push(tApoyo + 12, ...tiemposBlur(b.apoyo, tApoyo, 14));
  }
  return ev;
};

// ── Beats ──
type BeatProps = { b: Beat; p: Pal; dur: number; i: number };

const BeatObjeto: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const frame = useCurrentFrame();
  const { u, ancho: W, alto: H } = useEscala();
  const x = p.marco ? 0.5 : 0.56;
  const y = p.marco ? 0.63 : 0.6;
  const ancho = p.marco ? 420 : 560;
  const tObj = p.marco ? 12 : 1;
  // Banda horizontal (suelo negro) en los beats impares; banda vertical de acento detrás del objeto.
  const bandaH = p.banda === "horizontal" && i % 2 === 1 ? arrive(frame, 3, 20, "arriveSoft") : 0;
  const bandaV = p.banda === "vertical" ? arrive(frame, 2, 12, "arrive") : 0;
  const marcoIn = p.marco ? arrive(frame, 4, 20, "arriveSoft") : 0;
  const arcoFuera = p.marco ? leave(frame, 14, 8, "leaveSoft") : 0;
  const arcoD = `M ${-0.1 * W} ${0.82 * H} Q ${0.5 * W} ${0.35 * H} ${1.1 * W} ${0.44 * H}`;
  return (
    <AbsoluteFill>
      {p.curvas ? <Curva i={i} color={p.texto} /> : null}
      {p.banda === "horizontal" && i % 2 === 1 ? (
        <AbsoluteFill style={{ top: 0.73 * H, backgroundColor: p.texto, transform: `translateY(${(1 - bandaH) * 101}%)` }} />
      ) : null}
      {p.banda === "vertical" ? (
        <div
          style={{
            position: "absolute",
            left: 0.6 * W,
            width: 0.27 * W,
            top: 0,
            bottom: 0,
            backgroundColor: p.acento,
            clipPath: `inset(0 0 ${(1 - bandaV) * 100}% 0)`,
          }}
        />
      ) : null}
      {p.marco ? (
        <>
          {/* Barrido de arco: un `Trazo` del kit, ancho y tenue. */}
          <AbsoluteFill style={{ opacity: 1 - arcoFuera }}>
            <Trazo piel="vector" d={arcoD} color={p.secundario} grosor={70 * u} opacidad={0.28} inicio={0} dur={10} curva="snap" />
          </AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: 0.5 * W,
              top: y * H,
              width: 600 * u,
              height: 780 * u,
              border: `${14 * u}px solid #3a3a37`,
              backgroundColor: "#fafbfc",
              boxShadow: `${18 * u}px ${24 * u}px ${40 * u}px rgba(27,23,23,0.22)`,
              transform: `translate(-50%, -50%) translateX(${(1 - marcoIn) * -0.7 * W}px) rotate(${(1 - marcoIn) * -8}deg)`,
            }}
          />
        </>
      ) : null}
      {p.punteado && !p.marco ? <Punteado x={x} y={y} r={ancho * 0.6} at={tObj + 8} dur={dur} color={i % 2 === 1 && p.banda ? p.secundario : p.texto} /> : null}
      <Recorte media={b.media} p={p} at={tObj} out={dur - 10} x={x} y={y} ancho={ancho} seed={`er${i}`} />
      {p.marco ? (
        <>
          <Punteado x={0.36} y={0.55} r={70} at={34} dur={dur} color={p.texto} />
          <Punteado x={0.64} y={0.7} r={54} at={41} dur={dur} color={p.texto} />
        </>
      ) : null}
      <Arriba p={p}>
        <Titular b={b} p={p} delay={p.marco ? 26 : 4} />
      </Arriba>
    </AbsoluteFill>
  );
};

const BeatTarjeta: React.FC<BeatProps> = ({ b, p }) => {
  const frame = useCurrentFrame();
  const { u, zona } = useEscala();
  const cubre = arrive(frame, 0, 5, "snap");
  const ls = lineas(sinAcentos(b.titular));
  const n = ls.reduce((s, l) => s + palabras(l), 0);
  return (
    <AbsoluteFill style={{ backgroundColor: p.tarjetaColor, clipPath: `inset(${(1 - cubre) * 100}% 0 0 0)` }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${zona.lados * 1.4}px` }}>
        {b.apoyo ? (
          <div style={{ marginBottom: 18 * u, fontStyle: "italic" }}>
            <BlurStack lineas={[b.apoyo]} delay={3} dur={9} stagger={10} size={46} peso={400} fuente={serif.fontFamily} color={p.sobreTarjetaColor} alinear="centro" deriva={false} />
          </div>
        ) : null}
        <BlurStack
          lineas={ls}
          delay={b.apoyo ? 12 : 4}
          dur={8}
          stagger={Math.min(48, 7 * Math.max(0, n - 1))}
          distancia={24}
          blurMax={14}
          size={62}
          peso={500}
          fuente={marca.fuenteTexto}
          color={p.sobreTarjetaColor}
          alinear="centro"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const BeatLista: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const frame = useCurrentFrame();
  const { u, alto: H } = useEscala();
  const tItems = 30;
  return (
    <AbsoluteFill>
      {b.media ? <Recorte media={b.media} p={p} at={6} out={dur - 10} x={0.72} y={0.74} ancho={380} seed={`erl${i}`} /> : null}
      <Arriba p={p}>
        <Titular b={b} p={p} delay={3} size={p.sizeTitular * 0.8} />
        <div style={{ marginTop: 0.05 * H, display: "flex", flexDirection: "column", gap: 26 * u, alignItems: p.alinear === "centro" ? "center" : "flex-start" }}>
          {b.items.map((it, k) => {
            const t0 = tItems + k * 15;
            const hueco = arrive(frame, t0 - 4, 8, "arriveGentle");
            const lleno = arrive(frame, t0 + 8, 10, "arrive");
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 22 * u }}>
                <div
                  style={{
                    width: 26 * u,
                    height: 26 * u,
                    border: `${3 * u}px solid ${p.texto}`,
                    transform: `rotate(45deg) scale(${0.7 + 0.3 * hueco})`,
                    opacity: hueco,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ width: "70%", height: "70%", backgroundColor: p.acento === p.texto ? p.texto : p.acento, transform: `scale(${0.4 + 0.6 * lleno})`, opacity: lleno }} />
                </div>
                <div style={{ fontStyle: "italic" }}>
                  <BlurStack lineas={[it]} por="linea" direccion="izquierda" delay={t0} dur={12} distancia={40} blurMax={18} size={66} peso={400} fuente={serif.fontFamily} color={p.texto} deriva={false} />
                </div>
              </div>
            );
          })}
        </div>
      </Arriba>
    </AbsoluteFill>
  );
};

const BeatCifra: React.FC<BeatProps> = ({ b, p, dur, i }) => {
  const frame = useCurrentFrame();
  const { u, alto: H } = useEscala();
  const t0 = b.titular ? 16 : 4;
  const sube = arrive(frame, t0, 14, "arriveSoft");
  const cuenta = tween(frame, t0, 36, "arrive");
  const valor = Math.round(mix(cuenta, 0, b.cifra));
  const tApoyo = t0 + 22;
  const marca1 = arrive(frame, tApoyo + 12, 14, "arriveGentle");
  return (
    <AbsoluteFill>
      {b.media ? <Recorte media={b.media} p={p} at={t0 + 10} out={dur - 10} x={0.68} y={0.76} ancho={400} seed={`erc${i}`} /> : null}
      <Arriba p={p}>
        {b.titular ? <Titular b={{ ...b, apoyo: "" }} p={p} delay={3} size={p.sizeTitular * 0.6} escala={1.5} /> : null}
        <div
          style={{
            marginTop: 0.03 * H,
            fontFamily: marca.fuenteTitulo,
            fontWeight: 700,
            fontSize: 300 * u,
            lineHeight: 0.9,
            letterSpacing: "-0.06em",
            color: p.acento,
            fontVariantNumeric: "tabular-nums",
            opacity: Math.min(1, sube / 0.6),
            transform: `translateY(${(1 - sube) * 50 * u}px)`,
          }}
        >
          {valor.toLocaleString("es-CO")}
          <span style={{ fontFamily: serif.fontFamily, fontStyle: "italic", fontWeight: 400, fontSize: "0.42em", letterSpacing: "-0.01em", color: p.texto }}>{b.sufijo}</span>
        </div>
        {b.apoyo ? (
          <div style={{ position: "relative", marginTop: 26 * u, display: "inline-block" }}>
            <div
              style={{
                position: "absolute",
                left: -8 * u,
                right: -8 * u,
                top: "38%",
                bottom: "-6%",
                backgroundColor: p.acento,
                opacity: p.acento === p.texto ? 0.16 : 0.32,
                transform: `scaleX(${marca1})`,
                transformOrigin: "0% 50%",
              }}
            />
            <BlurStack lineas={[b.apoyo]} delay={tApoyo} dur={10} stagger={14} distancia={20} blurMax={12} size={48} peso={500} fuente={marca.fuenteTexto} color={p.texto} alinear={p.alinear} deriva={false} />
          </div>
        ) : null}
      </Arriba>
    </AbsoluteFill>
  );
};

const BEATS: Record<Beat["tipo"], React.FC<BeatProps>> = { objeto: BeatObjeto, tarjeta: BeatTarjeta, lista: BeatLista, cifra: BeatCifra };

/** Entrada y salida de cada escena según la transición de la variante, más los pasos de cámara. */
const Transito: React.FC<{ p: Pal; dur: number; primero: boolean; zoom: boolean; rellenos: number[]; children: React.ReactNode }> = ({
  p,
  dur,
  primero,
  zoom,
  rellenos,
  children,
}) => {
  const frame = useCurrentFrame();
  const { u, alto: H } = useEscala();
  const S = p.solape;
  let ty = 0;
  let blur = 0;
  let op = 1;
  if (p.transicion === "scroll") {
    const entra = primero ? 1 : tween(frame, 0, S, "move");
    const sale = tween(frame, dur, S, "move");
    ty = (1 - entra) * 0.3 * H - sale * 0.3 * H;
    op = 1 - sale;
  } else if (p.transicion === "destello") {
    const entra = primero ? 1 : arrive(frame, 0, 12, "arriveGentle");
    const sale = leave(frame, dur, S, "leaveSoft");
    blur = (1 - entra) * 16 * u + sale * 20 * u;
    op = Math.min(1, entra / 0.6) * (1 - sale);
  }
  const z = zoom ? tween(frame, dur - 10, 10, "snap") : 0;
  // Pasos de cámara solo donde la escena se queda quieta más de 24 f (empujes glide de 20 f que se suman).
  const cam = 1 + rellenos.reduce((s, t) => s + tween(frame, t, 20, "glide"), 0) * 0.012;
  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${ty}px) scale(${cam * (1 + z * 7)})`,
        transformOrigin: zoom ? "50% 63%" : "50% 55%",
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
        opacity: op,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Tarjeta de acento pleno de 4 f entre escenas (acento-azul). */
const Flash: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const sube = arrive(frame, 0, 3, "snap");
  return <AbsoluteFill style={{ backgroundColor: color, clipPath: `inset(${(1 - sube) * 100}% 0 0 0)` }} />;
};

/** Destello claro en el cambio de escena (crema-marco). */
const Destello: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const sube = arrive(frame, 0, 4, "arriveGentle");
  const baja = leave(frame, 4, 5, "leave");
  return <AbsoluteFill style={{ backgroundColor: color, opacity: 0.85 * sube * (1 - baja) }} />;
};

const Rejilla: React.FC<{ color: string; opacidad: number }> = ({ color, opacidad }) => {
  const { u, ancho: W, alto: H } = useEscala();
  const paso = 118 * u;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: opacidad }}>
      <defs>
        <pattern id={id} width={paso} height={paso} patternUnits="userSpaceOnUse" x={W / 2} y={H / 2}>
          <path d={`M ${paso} 0 L 0 0 0 ${paso}`} fill="none" stroke={color} strokeWidth={1.2 * u} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
    </svg>
  );
};

const Cierre: React.FC<{ c: Props["cierre"]; p: Pal; dur: number }> = ({ c, p, dur }) => {
  const frame = useCurrentFrame();
  const { u, alto: H } = useEscala();
  const cubre = arrive(frame, 0, 9, "snap");
  const logo = arrive(frame, 6, 16, "arriveSoft");
  const nTexto = sinAcentos(c.texto).split(" ").length;
  const tFirma = 20 + nTexto * 3;
  const cam = 1 + pasos(frame, 40, dur) * 0.01;
  const oscuroCierre = p.oscuro;
  return (
    <AbsoluteFill style={{ backgroundColor: p.cierreFondo ?? p.fondo, clipPath: `inset(${(1 - cubre) * 100}% 0 0 0)` }}>
      <AbsoluteFill style={{ transform: `scale(${cam})`, justifyContent: "center", alignItems: p.alinear === "centro" ? "center" : "flex-start", padding: `0 ${72 * u}px`, gap: 30 * u }}>
        {c.logo ? (
          <Img
            src={resolverMedia(c.logo)}
            style={{ width: 300 * u, opacity: Math.min(1, logo / 0.6), transform: `scale(${0.92 + 0.08 * logo})`, filter: `blur(${(1 - logo) * 10 * u}px)` }}
          />
        ) : null}
        <TypeSandwich
          lineas={lineas(c.texto)}
          delay={c.logo ? 14 : 6}
          size={oscuroCierre ? 72 : p.sizeTitular}
          peso={p.pesoTitular}
          escalaSerif={oscuroCierre ? 1.8 : p.escalaSerif}
          color={p.grotescaSecundaria ? p.secundario : p.texto}
          colorAcento={p.acento}
          fuenteAcento={serif.fontFamily}
          alinear={p.alinear}
        />
        {c.firma ? (
          <div style={{ marginTop: 0.01 * H }}>
            <BlurStack lineas={[c.firma]} por="linea" delay={tFirma} dur={11} size={36} peso={600} fuente={marca.fuenteTexto} color={p.secundario} alinear={p.alinear} deriva={false} />
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const EditorialRecorte: React.FC<Props> = ({ variante, beats, cierre, colores: c }) => {
  const p = paleta(variante, c);
  const tramos = beats.reduce<{ inicio: number; dur: number }[]>((acc, b) => {
    const inicio = acc.length ? acc[acc.length - 1].inicio + acc[acc.length - 1].dur : 0;
    return [...acc, { inicio, dur: cuadros(b.segundos) }];
  }, []);
  const finBeats = tramos.length ? tramos[tramos.length - 1].inicio + tramos[tramos.length - 1].dur : 0;
  const ultimoObjeto = beats.map((b) => b.tipo).lastIndexOf("objeto");
  const zoomFinal = (i: number) => p.marco && i === ultimoObjeto && i === beats.length - 1;
  return (
    <AbsoluteFill style={{ backgroundColor: p.fondo }}>
      {p.rejilla > 0 ? <Rejilla color={p.oscuro ? "#3A3A3A" : p.secundario} opacidad={p.rejilla} /> : null}
      {beats.map((b, i) => {
        const { inicio, dur } = tramos[i];
        const Comp = BEATS[b.tipo];
        return (
          <Sequence key={i} from={inicio} durationInFrames={dur + p.solape} name={`beat ${i + 1} · ${b.tipo}`}>
            <Transito
              p={p}
              dur={dur}
              primero={i === 0}
              zoom={zoomFinal(i)}
              rellenos={rellenarHuecos([...eventosBeat(b, p, dur, i), ...(zoomFinal(i) ? [dur - 10] : [])], dur)}
            >
              <Comp b={b} p={p} dur={dur} i={i} />
            </Transito>
          </Sequence>
        );
      })}
      {p.transicion === "flash"
        ? tramos.slice(1).map((t, i) => (
            <Sequence key={`f${i}`} from={t.inicio - 1} durationInFrames={4} name="flash">
              <Flash color={p.acento} />
            </Sequence>
          ))
        : null}
      {p.transicion === "destello"
        ? tramos.slice(1).map((t, i) => (
            <Sequence key={`d${i}`} from={t.inicio - 4} durationInFrames={10} name="destello">
              <Destello color="#FFFDFB" />
            </Sequence>
          ))
        : null}
      <Sequence from={finBeats} durationInFrames={cuadros(cierre.segundos)} name="cierre">
        <Cierre c={cierre} p={p} dur={cuadros(cierre.segundos)} />
      </Sequence>
      <Look grain={p.grano} vignette={p.vineta} warmth={p.tinte} />
    </AbsoluteFill>
  );
};

export const editorialRecorte = definir({
  id: "Plantilla-EditorialRecorte",
  fuente: "tiktok-7581551601349954824, tiktok-7622319703679110421, tiktok-7671829994292776200, tiktok-7545813836503289144",
  resumen: "Un objeto recortado por idea sobre cartulina, con titular grotesco y una palabra de acento en serif itálica.",
  cuando: "Explicar una idea en 3 a 6 pasos con objetos o productos recortados: consejos, listas y cifras con look editorial.",
  schema,
  componente: EditorialRecorte,
  defaultProps: {
    variante: "gris-script",
    beats: [
      { tipo: "objeto", apoyo: "Si tienes una idea", titular: "no la *guardes*", segundos: 2.8, media: "", items: [], cifra: 0, sufijo: "" },
      { tipo: "cifra", apoyo: "de las ideas se quedan en la libreta", titular: "", segundos: 3, media: "", items: [], cifra: 8, sufijo: " de 10" },
      { tipo: "tarjeta", apoyo: "", titular: "Empezar mal / es mejor que no empezar", segundos: 2.2, media: "", items: [], cifra: 0, sufijo: "" },
      { tipo: "lista", apoyo: "", titular: "Lo que *sí* sirve", segundos: 3.4, media: "", items: ["Un borrador", "Una fecha", "Alguien que lo vea"], cifra: 0, sufijo: "" },
      { tipo: "objeto", apoyo: "La constancia le gana", titular: "al *talento*", segundos: 3, media: "", items: [], cifra: 0, sufijo: "" },
    ],
    cierre: { texto: "Guárdalo para *mañana*", firma: "@tumarca", logo: "", segundos: 2.2 },
    colores: {},
  },
  duracion: (p) => p.beats.reduce((s, b) => s + cuadros(b.segundos), 0) + cuadros(p.cierre.segundos),
  formatos: ["vertical", "retrato"],
});
