import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { CardCarousel } from "../../components/presets/CardCarousel";
import { ChipCaption } from "../../components/presets/ChipCaption";
import { Pill } from "../../components/presets/Pill";
import { PunchIn } from "../../components/presets/PunchIn";
import { ScreenFrame, type ZonaZoom } from "../../components/presets/ScreenFrame";
import { ventanas } from "../../components/presets/WordWindowCaption";
import { sfx } from "../../lib/cues";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, type CurveName, leave, springPreset } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, microReencuadre, rellenarHuecos, zColores, zMedia } from "../base";
import { aCuadros, finVoz, inicioDe, MediaPanel, palabrasDe, zPalabras } from "./comun";

/**
 * Familia `talking-head-insertos` (referentes/lote-2026-11-08.md).
 * Videos de origen: tiktok-7701672067120368948 (pantalla-pasos), tiktok-7702620779518643478 (insertos-pecho),
 * tiktok-7698456660611796231 (pill-fija), tiktok-7690371798784871701 (cortes-rapidos).
 *
 * Qué se tomó (técnica medida en las recetas):
 * - Presentador a cuadro completo con punch-in por golpe: corte seco a 1,08–1,12 o zoom de 4 f con snap.
 * - Subtítulo de 1–3 palabras por golpe con la palabra clave en chip de acento (ChipCaption), a la altura que mide
 *   cada video (50 %, 70 %, 68 %, 75 %); en insertos-pecho las claves van en MAYÚSCULAS.
 * - Pill fija arriba con la promesa (TopPill al 14–16 %), que se retira cuando un inserto ocupa la parte de arriba.
 * - Insertos en tiempos dados por props: captura en marco redondeado (ScreenFrame) con zoom digital a regiones,
 *   chip "Paso N" y nota; y carrusel de tarjetas con una héroe (CardCarousel). Según la variante la captura va en
 *   panel arriba con burbuja del presentador y subtítulo a su derecha (7701672067120368948), flotando sobre el
 *   pecho con entrada por desenfoque (7702620779518643478) o a pantalla completa con corte seco (7698456660611796231,
 *   7690371798784871701).
 *
 * Qué NO se copió: footage, rostros, voces, textos, sitios y marcas de los creadores; los teléfonos inclinados
 * flotando (AI-31), el halo naranja del carrusel (AI-23), las tarjetas idénticas (AI-26), los rayos de énfasis a
 * intervalo fijo (AI-11) y el subtítulo sin animación (AI-03: aquí cada golpe entra en 8 f). Los textos por defecto
 * son genéricos del estudio.
 */

type Variante = {
  acento: string;
  fondo: string;
  texto: string;
  /** Altura del subtítulo (fracción del alto, centro de la línea). */
  captionY: number;
  captionSize: number;
  max: number;
  /** 99 = solo las `claves` van en chip; 5 = cada golpe elige su palabra más larga. */
  minLargo: number;
  mayusClaves: boolean;
  /** Escala del plano cerrado en los golpes impares (los pares vuelven a 1). */
  punch: number;
  punchDur: number;
  captura: "panel" | "pecho" | "completa";
  entrada: number;
  curvaEntrada: CurveName;
  salida: number;
  zoom: { curva: CurveName; dur?: number };
  pantalla: { fondo: string; tinta: string };
};

const VARIANTES: Record<"pantalla-pasos" | "insertos-pecho" | "pill-fija" | "cortes-rapidos", Variante> = {
  // tiktok-7701672067120368948: acento #E8774C, subtítulo al 50 % en el selfie, pantalla en marco 3–48 % con
  // avatar + subtítulo al 76 %, zoom digital ease-out de 8 f, chip "Paso N" arriba a la izquierda.
  "pantalla-pasos": {
    acento: "#E8774C",
    fondo: "#121212",
    texto: "#F6F3EE",
    captionY: 0.5,
    captionSize: 70,
    max: 3,
    minLargo: 99,
    mayusClaves: false,
    punch: 1.08,
    punchDur: 0,
    captura: "panel",
    entrada: 3,
    curvaEntrada: "snap",
    salida: 8,
    zoom: { curva: "arrive", dur: 10 },
    pantalla: { fondo: "#EFEEEA", tinta: "#1A1714" },
  },
  // tiktok-7702620779518643478: acento #E27B58, fondo de insertos #1B1310, subtítulo al 70 % con claves en
  // mayúsculas, reencuadres ease-out de 12 f, insertos sobre el pecho que entran por desenfoque (18–20 f).
  "insertos-pecho": {
    acento: "#E27B58",
    fondo: "#1B1310",
    texto: "#F5EDE4",
    captionY: 0.7,
    captionSize: 66,
    max: 2,
    minLargo: 99,
    mayusClaves: true,
    punch: 1.06,
    punchDur: 4,
    captura: "pecho",
    entrada: 18,
    curvaEntrada: "arriveSoft",
    salida: 9,
    zoom: { curva: "arriveSoft" },
    pantalla: { fondo: "#F5E9DD", tinta: "#1B1310" },
  },
  // tiktok-7698456660611796231: chip morado #6B3FE0 en cada golpe, subtítulo al 68 %, píldora fija al 16 %,
  // selfie alterna abierto/cerrado (1,0 ↔ 1,12) en corte seco, zoom largo glide sobre la pantalla filmada.
  "pill-fija": {
    acento: "#6B3FE0",
    fondo: "#1C2230",
    texto: "#F7F5F0",
    captionY: 0.68,
    captionSize: 72,
    max: 3,
    minLargo: 5,
    mayusClaves: false,
    punch: 1.12,
    punchDur: 0,
    captura: "completa",
    entrada: 2,
    curvaEntrada: "snap",
    salida: 6,
    zoom: { curva: "glide", dur: 54 },
    pantalla: { fondo: "#1F2636", tinta: "#E8ECF4" },
  },
  // tiktok-7690371798784871701: rojo #D93A4A, subtítulo al 75 % de 2 palabras, punch-in ~10 % en cada corte,
  // capturas a pantalla completa con corte seco y golpe de 5 f (snap).
  "cortes-rapidos": {
    acento: "#D93A4A",
    fondo: "#0B0B14",
    texto: "#F7F4F0",
    captionY: 0.75,
    captionSize: 64,
    max: 2,
    minLargo: 7,
    mayusClaves: false,
    punch: 1.1,
    punchDur: 0,
    captura: "completa",
    entrada: 2,
    curvaEntrada: "snap",
    salida: 5,
    zoom: { curva: "snap", dur: 5 },
    pantalla: { fondo: "#14141F", tinta: "#F1F1F5" },
  },
};

const zZona = z.object({
  x: z.number().min(0).max(1).describe("borde izquierdo, fracción del ancho de la captura"),
  y: z.number().min(0).max(1),
  w: z.number().min(0.03).max(1),
  h: z.number().min(0.03).max(1),
  en: z.number().min(0).describe("segundos desde que entra el inserto"),
  nota: z.string().default("").describe("texto de la nota; vacío = solo zoom"),
});

const zInserto = z.object({
  tipo: z.enum(["captura", "carrusel"]),
  at: z.number().min(0).describe("segundo en que entra"),
  duracion: z.number().min(0.6).max(40),
  media: zMedia.describe("captura o grabación de pantalla (solo tipo captura)"),
  titulo: z.string().default("").describe("captura: texto del chip de paso · carrusel: cabecera de la sección"),
  paso: z.number().int().min(0).max(9).default(0).describe("número del chip de paso; 0 = sin chip"),
  zonas: z.array(zZona).default([]),
  tarjetas: z.array(z.string()).default([]).describe("solo carrusel: título de cada tarjeta"),
});

export const schema = z.object({
  variante: z
    .enum(["pantalla-pasos", "insertos-pecho", "pill-fija", "cortes-rapidos"])
    .describe("pantalla-pasos=7701672067120368948 · insertos-pecho=7702620779518643478 · pill-fija=7698456660611796231 · cortes-rapidos=7690371798784871701"),
  media: zMedia.describe("video del presentador, con su voz; vacío = silueta"),
  palabras: zPalabras,
  claves: z.array(z.string()).default([]).describe("palabras que van en chip (sin tildes da igual)"),
  pill: z.string().default("").describe("promesa fija arriba (3–4 palabras); vacío = sin pill"),
  golpes: z.array(z.number().min(0)).default([]).describe("segundos de los punch-in; alternan cerrado/abierto"),
  insertos: z.array(zInserto).default([]),
  segundosCola: z.number().min(0.3).max(4).default(1.2),
  colores: zColores,
});

type Props = z.infer<typeof schema>;
type Inserto = Props["insertos"][number];

const duracion = (p: Props) =>
  cuadros(Math.max(1, finVoz(p.palabras), ...p.insertos.map((i) => i.at + i.duracion)) + p.segundosCola);

/** Tramos [desde, hasta) del total que no tapan los cuadros ocupados. */
const libres = (total: number, ocupados: [number, number][]) => {
  const orden = [...ocupados].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let t = 0;
  for (const [a, b] of orden) {
    if (a > t) out.push([t, a]);
    t = Math.max(t, b);
  }
  if (t < total) out.push([t, total]);
  return out;
};

/** Avance del carrusel con swing: los pasos no caen a intervalos iguales. */
const pasosCarrusel = (i: Inserto, dur: number) => {
  const n = Math.max(1, i.tarjetas.length);
  return Array.from({ length: n - 1 }, (_, k) => Math.round(dur * (0.12 + (0.66 * (k + 1)) / n + ((k + 1) % 2 ? 0.035 : 0))));
};

/** Entrada y salida de un inserto: corte casi seco (2–3 f, snap) o desenfoque largo según la variante. */
const Capa: React.FC<{ dur: number; v: Variante; children: React.ReactNode }> = ({ dur, v, children }) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const e = arrive(f, 0, v.entrada, v.curvaEntrada);
  const s = leave(f, dur - v.salida, v.salida, "leaveSoft");
  const blando = v.entrada > 6;
  const blur = blando ? (1 - e) * 16 + s * 10 : 0;
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(1, e / 0.5) * (1 - s),
        filter: blur > 0.2 ? `blur(${blur * u}px)` : undefined,
        transform: blando ? `scale(${1.04 - 0.04 * e + 0.02 * s})` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Captura: React.FC<{ i: Inserto; dur: number; v: Variante; acento: string; fondo: string; texto: string; host: string }> = ({
  i,
  dur,
  v,
  acento,
  fondo,
  texto,
  host,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho, alto, zona } = useEscala();
  const A = ancho / u;
  const H = alto / u;
  // Geometría por variante, en u (lado corto = 1080).
  const geo =
    v.captura === "panel"
      ? { w: A - 96, h: H * 0.42, top: H * 0.055 }
      : v.captura === "pecho"
        ? { w: A * 0.78, h: A * 0.78 * 0.62, top: H * 0.4 }
        : { w: A - 72, h: H - (zona.arriba / u) * 0.6 - (zona.abajo / u) * 0.55, top: (zona.arriba / u) * 0.6 };
  const zonas: ZonaZoom[] = i.zonas.map((z) => ({
    x: z.x * geo.w,
    y: z.y * geo.h,
    w: z.w * geo.w,
    h: z.h * geo.h,
    at: cuadros(z.en),
    curva: v.zoom.curva,
    dur: v.zoom.dur,
    anotacion: z.nota ? "rect" : undefined,
    nota: z.nota || undefined,
  }));
  sfx(f, v.entrada > 6 ? "whoosh.short" : "snap", 0);
  const izq = (A - geo.w) / 2;
  const chipTop = v.captura === "pecho" ? geo.top - 78 : geo.top + 22;
  const avatar = springPreset(f, fps, "pop", 5);
  const D = 196;
  return (
    <Capa dur={dur} v={v}>
      {v.captura !== "pecho" && <AbsoluteFill style={{ background: fondo }} />}
      <div style={{ position: "absolute", left: izq * u, top: geo.top * u }}>
        <ScreenFrame ancho={geo.w} alto={geo.h} zonas={zonas} entrada={false} radio={v.captura === "completa" ? 20 : 28} colorAnotacion={acento} colorNota={acento}>
          <MediaPanel src={i.media} tipo="pantalla" fondo={v.pantalla.fondo} tinta={v.pantalla.tinta} etiqueta="captura · sin media" />
        </ScreenFrame>
      </div>
      {i.paso > 0 && (
        <div style={{ position: "absolute", left: (izq + 22) * u, top: chipTop * u }}>
          <Pill variante="paso" numero={i.paso} texto={i.titulo || `Paso ${i.paso}`} tono="acento" size={32} delay={4} exitAt={dur - 10} colorAcento={acento} />
        </div>
      )}
      {v.captura === "panel" && (
        // Burbuja del presentador con anillo de acento: no se pierde la cara mientras habla la pantalla.
        <div
          style={{
            position: "absolute",
            left: zona.lados,
            top: H * 0.762 * u - (D / 2) * u,
            width: D * u,
            height: D * u,
            borderRadius: "50%",
            overflow: "hidden",
            border: `${6 * u}px solid ${acento}`,
            boxSizing: "border-box",
            transform: `scale(${0.7 + 0.3 * avatar})`,
            opacity: Math.min(1, avatar * 3),
          }}
        >
          <MediaPanel src={host} tipo="persona" fondo={marca.colores.superficie} tinta={texto} silencio />
        </div>
      )}
    </Capa>
  );
};

const Carrusel: React.FC<{ i: Inserto; dur: number; v: Variante; acento: string; fondo: string; texto: string }> = ({ i, dur, v, acento, fondo, texto }) => {
  const f = useCurrentFrame();
  const { u, alto, zona } = useEscala();
  const pasos = pasosCarrusel(i, dur);
  pasos.forEach((at) => sfx(f, "tick", at));
  const cab = arrive(f, 5, 14, "arrive");
  return (
    <Capa dur={dur} v={v}>
      <AbsoluteFill style={{ background: fondo }} />
      {i.titulo ? (
        <div
          style={{
            position: "absolute",
            left: zona.lados,
            top: zona.arriba * 0.55,
            fontFamily: marca.fuenteMono,
            fontSize: 24 * u,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: texto,
            opacity: 0.62 * Math.min(1, cab / 0.6),
            transform: `translateY(${(1 - cab) * 10 * u}px)`,
          }}
        >
          {i.titulo}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: alto * 0.86 }}>
        <CardCarousel
          tarjetas={i.tarjetas.map((t, k) => ({ titulo: t, etiqueta: `ESTILO ${String(k + 1).padStart(2, "0")}` }))}
          pasos={pasos}
          delay={3}
          colorBorde={acento}
          colorFondo={marca.colores.superficie}
        />
      </div>
    </Capa>
  );
};

export const TalkingHeadInsertos: React.FC<Props> = (p) => {
  const v = VARIANTES[p.variante];
  const f = useCurrentFrame();
  const { u, alto } = useEscala();
  const acento = p.colores.acento ?? v.acento;
  const fondo = p.colores.fondo ?? v.fondo;
  const texto = p.colores.texto ?? v.texto;
  const total = duracion(p);
  const palabras = aCuadros(p.palabras, v.mayusClaves ? p.claves : []);
  const ins = p.insertos.map((i) => ({ i, desde: cuadros(i.at), dur: Math.max(12, cuadros(i.duracion)) }));
  const enPanel = ins.some((x) => x.i.tipo === "captura" && v.captura === "panel" && f >= x.desde && f < x.desde + x.dur);
  // La pill se retira cuando un inserto ocupa la parte de arriba (todo menos la captura sobre el pecho).
  const tapan = ins.filter((x) => !(x.i.tipo === "captura" && v.captura === "pecho")).map((x): [number, number] => [x.desde, x.desde + x.dur]);
  const tramosPill = p.pill ? libres(total, tapan).filter(([a, b]) => b - a >= 45) : [];

  // Inicios seguros de la pieza (cuadros absolutos): golpes del subtítulo, punch-ins con zoom, insertos y pill.
  // Donde pasan más de 24 f sin ninguno, la cámara hace un micro re-encuadre (ritmo de anuncio, motion-audit D-01).
  const eventos = [
    ...ventanas(palabras, v.max, 6).map((g) => g[0].start),
    ...(v.punchDur > 0 ? p.golpes.map((s) => cuadros(s)) : []),
    ...ins.flatMap(({ i, desde, dur }) => [
      desde,
      desde + dur - v.salida,
      ...(i.tipo === "captura"
        ? [...i.zonas.map((z) => desde + cuadros(z.en)), ...(i.paso > 0 ? [desde + 4] : []), ...(v.captura === "panel" ? [desde + 5] : [])]
        : [...(i.titulo ? [desde + 5] : []), ...pasosCarrusel(i, dur).map((t) => desde + t)]),
    ]),
    ...tramosPill.flatMap(([a, b], k) => [a + (k === 0 ? 6 : 3), b - 10]),
  ];
  const camara = microReencuadre(f, rellenarHuecos(eventos, total));

  const size = v.captionSize;
  const yCaption = (enPanel ? 0.762 : v.captionY) - (size * u * 0.6) / alto;
  const caption = (
    <ChipCaption
      words={palabras}
      max={v.max}
      size={size}
      claves={p.claves}
      minLargo={v.minLargo}
      y={yCaption}
      alinear={enPanel ? "izquierda" : "centro"}
      colorChip={acento}
      colorTexto={texto}
      colorSobreChip={v.captura === "pecho" ? fondo : texto}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: fondo, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: camara, transformOrigin: "50% 42%" }}>
        <PunchIn punches={p.golpes.map((s, k) => ({ at: cuadros(s), scale: k % 2 === 0 ? v.punch : 1, dur: v.punchDur }))}>
          <MediaPanel src={p.media} tipo="persona" fondo={marca.colores.superficie} tinta={texto} etiqueta="presentador · sin media" />
        </PunchIn>
        {ins.map(({ i, desde, dur }, k) => (
          <Sequence key={k} from={desde} durationInFrames={dur} name={`${i.tipo} ${k + 1}`}>
            {i.tipo === "captura" ? (
              <Captura i={i} dur={dur} v={v} acento={acento} fondo={fondo} texto={texto} host={p.media} />
            ) : (
              <Carrusel i={i} dur={dur} v={v} acento={acento} fondo={fondo} texto={texto} />
            )}
          </Sequence>
        ))}
        {tramosPill.map(([a, b], k) => (
          <Sequence key={`pill-${k}`} from={a} durationInFrames={b - a} name="pill fija">
            <Pill variante="top" texto={p.pill} tono="claro" size={40} delay={k === 0 ? 6 : 3} exitAt={b - a - 10} colorAcento={acento} />
          </Sequence>
        ))}
        {enPanel ? (
          // Durante la captura en panel el subtítulo se corre a la derecha de la burbuja del presentador.
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, left: 220 * u }}>{caption}</div>
        ) : (
          caption
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Props por defecto: guion genérico del estudio con tiempos de habla de ejemplo. ──
const GUION =
  "Nadie te cuenta cómo se arma un video así. Parece magia, pero son dos pasos y un truco. " +
  "Paso uno: entra a la galería y elige una referencia que te guste. Copia el prompt y fíjate qué modelo te recomienda. " +
  "Paso dos: pégalo en tu editor, ajusta tu marca y genera. Mira, el mismo clip en tres estilos distintos. " +
  "Y el truco: lo repites con cualquier tema. Guárdalo para tu próximo video.";

const voz = palabrasDe(GUION);
const p1 = inicioDe(voz, "Paso", 1);
const p2 = inicioDe(voz, "Paso", 2);
const mira = inicioDe(voz, "Mira");
const truco = inicioDe(voz, "truco", 2);

export const talkingHeadInsertos = definir({
  id: "Plantilla-TalkingHeadInsertos",
  fuente:
    "referentes/lote-2026-11-08.md · talking-head-insertos (tiktok-7701672067120368948, tiktok-7702620779518643478, tiktok-7698456660611796231, tiktok-7690371798784871701)",
  resumen: "Presentador a cámara con punch-in en los golpes, subtítulo con chip de acento, pill fija y capturas insertadas.",
  cuando: "Editar una grabación tuya hablando a cámara, con su transcripción por palabras, sin montarla a mano.",
  schema,
  componente: TalkingHeadInsertos,
  defaultProps: {
    variante: "pantalla-pasos",
    media: "",
    palabras: voz,
    claves: ["magia", "truco", "referencia", "prompt", "marca", "estilos", "cualquier"],
    pill: "Tu video en dos pasos",
    golpes: [inicioDe(voz, "Parece"), inicioDe(voz, "truco", 1), p1 - 0.1, inicioDe(voz, "Copia"), truco, inicioDe(voz, "Guárdalo")],
    insertos: [
      {
        tipo: "captura",
        at: p1,
        duracion: Math.round((p2 - p1 - 0.15) * 100) / 100,
        media: "",
        titulo: "Elige una referencia",
        paso: 1,
        zonas: [
          { x: 0.26, y: 0.2, w: 0.45, h: 0.42, en: 1.4, nota: "" },
          { x: 0.7, y: 0.2, w: 0.26, h: 0.2, en: 3.9, nota: "Copia el prompt" },
        ],
        tarjetas: [],
      },
      {
        tipo: "captura",
        at: p2,
        duracion: Math.round((mira - p2 - 0.1) * 100) / 100,
        media: "",
        titulo: "Genera con tu marca",
        paso: 2,
        zonas: [{ x: 0.26, y: 0.64, w: 0.7, h: 0.28, en: 1.1, nota: "Ajusta tu marca" }],
        tarjetas: [],
      },
      {
        tipo: "carrusel",
        at: mira,
        duracion: Math.round((truco - mira + 0.2) * 100) / 100,
        media: "",
        titulo: "El mismo clip · 3 estilos",
        paso: 0,
        zonas: [],
        tarjetas: ["Editorial", "Kinético", "Papel"],
      },
    ],
    segundosCola: 1.2,
    colores: {},
  },
  duracion,
  formatos: ["vertical"],
});
