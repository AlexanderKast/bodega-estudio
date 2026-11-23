import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ChipCaption } from "../../components/presets/ChipCaption";
import { Cursor } from "../../components/presets/Cursor";
import { Pill } from "../../components/presets/Pill";
import { PunchIn } from "../../components/presets/PunchIn";
import { ScreenFrame } from "../../components/presets/ScreenFrame";
import { SplitStack } from "../../components/presets/SplitStack";
import { tiemposSandwich, TypeSandwich } from "../../components/presets/TypeSandwich";
import { ventanas } from "../../components/presets/WordWindowCaption";
import { sfx } from "../../lib/cues";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, mix, tween } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, microReencuadre, rellenarHuecos, zColores, zMedia } from "../base";
import { aCuadros, finVoz, MediaPanel, palabrasDe, tramosEntre, zPalabras } from "../talking-head-insertos/comun";

/**
 * Familia `split-stack` (referentes/lote-2026-11-08.md).
 * Videos de origen: 7gMbZTdLlxs (infografia), tiktok-7697333991984221462 (ai-real), zlOCQxQYnYc (ugc-paneles).
 *
 * Qué se tomó (técnica medida en las recetas):
 * - Pantalla dividida arriba/abajo (SplitStack): gráficos, UI o B-roll arriba que cambian por beat en corte seco;
 *   el presentador abajo con push de 3–5 % en cada cambio de beat.
 * - Caption de la voz en la costura (50 % en 7gMbZTdLlxs, 40 % en zlOCQxQYnYc) o de una palabra en versalitas al
 *   82 % sobre el panel real (tiktok-7697333991984221462), con la palabra clave en chip de acento.
 * - Una keyword grande en color por idea, no por frase (7gMbZTdLlxs), y el dato como gráfico que se cuenta, no
 *   dentro de un clip (AI-47).
 * - Barra superior de 6 % con lockup de dos marcas y etiquetas «IA:» / «REAL:» por panel (tiktok-7697333991984221462).
 * - Paneles que se abren desde la costura y CTA final en pill propia (zlOCQxQYnYc).
 *
 * Qué NO se copió: footage, voces, guiones, cifras, logos, interfaces ni marcas de los creadores; el halftone
 * decorativo y el vidrio (AI-30, AI-22), el cian con glow y la pill degradada de zlOCQxQYnYc, las tarjetas iguales
 * (AI-26). Textos y datos por defecto son genéricos del estudio.
 */

type Variante = {
  acento: string;
  /** Fondo y tinta del panel de arriba. */
  panel: string;
  tinta: string;
  fondo: string;
  texto: string;
  proporcion: number;
  entrada: "deslizar" | "abrir";
  costura: number;
  barra: boolean;
  etiquetas: boolean;
  cta: boolean;
  caption: { y: "costura" | number; size: number; max: number; minLargo: number; mayus: boolean };
  push: number;
  mayusClave: boolean;
  /** Maqueta de UI clara (panel claro) u oscura. */
  ui: { fondo: string; tinta: string };
};

const VARIANTES: Record<"infografia" | "ai-real" | "ugc-paneles", Variante> = {
  // 7gMbZTdLlxs: navy #0A1F5C + amarillo #FFD60A, 50/50, caption por palabra a 50 %, keyword en mayúsculas
  // con pop de 8 f, cortes cada ~2,8 s, push-in de 4 % en el host.
  infografia: {
    acento: "#FFD60A",
    panel: "#0A1F5C",
    tinta: "#F3F5FB",
    fondo: "#14110F",
    texto: "#F7F5F0",
    proporcion: 0.5,
    entrada: "deslizar",
    costura: 0,
    barra: false,
    etiquetas: false,
    cta: false,
    caption: { y: "costura", size: 50, max: 2, minLargo: 99, mayus: false },
    push: 1.04,
    mayusClave: true,
    ui: { fondo: "#0B5D3B", tinta: "#EAF5EF" },
  },
  // tiktok-7697333991984221462: barra negra 6 % con lockup, panel lavanda #ECEEF8 con tinta #14141A, acento coral
  // #E8684A, subtítulo de 1 palabra en versalitas al 82 %, titulares ease-out de 16–26 f.
  "ai-real": {
    acento: "#E8684A",
    panel: "#ECEEF8",
    tinta: "#14141A",
    fondo: "#0B0B0F",
    texto: "#F7F6F2",
    proporcion: 0.47,
    entrada: "deslizar",
    costura: 0,
    barra: true,
    etiquetas: true,
    cta: false,
    caption: { y: 0.82, size: 58, max: 1, minLargo: 6, mayus: true },
    push: 1.0,
    mayusClave: false,
    ui: { fondo: "#FBFBFE", tinta: "#14141A" },
  },
  // zlOCQxQYnYc: pantalla 40 / presentador 60, paneles marino #103450, acento cian #3DD6F0 sin glow, palabra con
  // pop de 6 f, CTA en pill al final.
  "ugc-paneles": {
    acento: "#3DD6F0",
    panel: "#103450",
    tinta: "#F1F7FA",
    fondo: "#0A0A0A",
    texto: "#F6F8F8",
    proporcion: 0.4,
    entrada: "abrir",
    costura: 4,
    barra: false,
    etiquetas: false,
    cta: true,
    caption: { y: "costura", size: 56, max: 2, minLargo: 6, mayus: false },
    push: 1.03,
    mayusClave: false,
    ui: { fondo: "#F4F6F8", tinta: "#0F2F4A" },
  },
};

const zBeat = z.object({
  tipo: z.enum(["dato", "titular", "ui", "broll"]).describe("qué va arriba en este beat"),
  segundos: z.number().min(0.6).max(15),
  palabra: z.string().describe("keyword grande en acento (1–3 palabras)"),
  detalle: z.string().default("").describe("línea chica de apoyo; en titular va en serif itálica"),
  valor: z.number().default(0).describe("solo dato: cifra final"),
  desde: z.number().default(0).describe("solo dato: cifra de arranque"),
  prefijo: z.string().default(""),
  sufijo: z.string().default(""),
  media: zMedia.describe("ui: captura · broll: clip o imagen"),
});

export const schema = z.object({
  variante: z.enum(["infografia", "ai-real", "ugc-paneles"]).describe("infografia=7gMbZTdLlxs · ai-real=tiktok-7697333991984221462 · ugc-paneles=zlOCQxQYnYc"),
  media: zMedia.describe("video del presentador (panel de abajo), con su voz"),
  palabras: zPalabras,
  claves: z.array(z.string()).default([]),
  beats: z.array(zBeat).min(1),
  marcas: z.array(z.string()).default([]).describe("lockup de la barra superior (variante ai-real)"),
  etiquetaArriba: z.string().default("IA:"),
  etiquetaAbajo: z.string().default("REAL:"),
  cta: z.string().default("").describe("pill final (variante ugc-paneles); vacío = sin CTA"),
  segundosCola: z.number().min(0.3).max(4).default(1),
  colores: zColores,
});

type Props = z.infer<typeof schema>;
type Beat = Props["beats"][number];

const duracion = (p: Props) =>
  cuadros(Math.max(p.beats.reduce((s, b) => s + b.segundos, 0), finVoz(p.palabras)) + p.segundosCola);

/** Keyword grande: cada palabra sube desde una máscara, la primera más rápida (10 f) y las demás más largas. */
const Clave: React.FC<{ texto: string; color: string; size: number; delay: number; mayus: boolean }> = ({ texto, color, size, delay, mayus }) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const palabras = (mayus ? texto.toUpperCase() : texto).split(" ").filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${0.24 * size * u}px`, fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: size * u, lineHeight: 0.98, letterSpacing: "-0.03em", color }}>
      {palabras.map((w, k) => {
        const p = arrive(f, delay + k * 3, 10 + k * 3, "arrive");
        return (
          <span key={k} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.06em" }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 108}%) rotate(${(1 - p) * 3}deg)`, transformOrigin: "0 100%" }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

const Detalle: React.FC<{ texto: string; color: string; delay: number }> = ({ texto, color, delay }) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const p = arrive(f, delay, 14, "arriveGentle");
  if (!texto) return null;
  return (
    <div style={{ fontFamily: marca.fuenteTexto, fontWeight: 500, fontSize: 34 * u, color, opacity: 0.78 * Math.min(1, p / 0.6), transform: `translateY(${(1 - p) * 12 * u}px)`, marginTop: 18 * u }}>
      {texto}
    </div>
  );
};

/** Inicios seguros del panel de arriba en un beat (cuadros locales), los mismos que usa PanelBeat al animar. */
const eventosBeat = (b: Beat): number[] => {
  switch (b.tipo) {
    case "broll":
      return [0, 6, 14, ...b.palabra.split(" ").filter(Boolean).map((_, k) => 6 + k * 3)];
    case "ui":
      return [0, 3, 5, ...b.palabra.split(" ").filter(Boolean).map((_, k) => 3 + k * 3)];
    case "titular":
      return [0, ...tiemposSandwich(b.detalle ? [b.palabra, `*${b.detalle}*`] : [b.palabra], 2)];
    default:
      return [0, 2, 24, ...b.palabra.split(" ").filter(Boolean).map((_, k) => 18 + k * 3)];
  }
};

/** Contenido del panel de arriba para un beat (cuadros locales al beat). */
const PanelBeat: React.FC<{ b: Beat; dur: number; v: Variante; acento: string; alto: number }> = ({ b, dur, v, acento, alto }) => {
  const f = useCurrentFrame();
  const { u, ancho, zona } = useEscala();
  const pad = zona.lados;
  const anchoU = (ancho - pad * 2) / u;
  sfx(f, b.tipo === "dato" ? "tick" : "whoosh.short", 0);

  if (b.tipo === "broll") {
    const push = tween(f, 0, dur, "glide");
    return (
      <AbsoluteFill style={{ background: v.panel }}>
        <AbsoluteFill style={{ transform: `scale(${mix(push, 1.02, 1.1)})` }}>
          <MediaPanel src={b.media} tipo="broll" fondo={v.panel} tinta={v.tinta} etiqueta="b-roll · sin media" />
        </AbsoluteFill>
        <div style={{ position: "absolute", left: pad, right: pad, bottom: 56 * u, textShadow: `0 ${4 * u}px ${18 * u}px ${marca.colores.sombraCalida}` }}>
          <Clave texto={b.palabra} color={acento} size={96} delay={6} mayus={v.mayusClave} />
          <Detalle texto={b.detalle} color={v.tinta} delay={14} />
        </div>
      </AbsoluteFill>
    );
  }

  if (b.tipo === "ui") {
    const h = Math.min(alto / u - 250, anchoU * 0.56);
    return (
      <AbsoluteFill style={{ background: v.panel, padding: `${54 * u}px ${pad}px`, boxSizing: "border-box" }}>
        <Clave texto={b.palabra} color={acento} size={70} delay={3} mayus={v.mayusClave} />
        <div style={{ marginTop: 26 * u }}>
          <ScreenFrame ancho={anchoU} alto={h} ventana titulo={b.detalle || "app"} delay={5} colorAnotacion={acento} colorNota={acento}>
            <MediaPanel src={b.media} tipo="pantalla" fondo={v.ui.fondo} tinta={v.ui.tinta} />
            <Cursor
              puntos={[
                { x: anchoU * 0.9, y: h * 1.05, at: 0 },
                { x: anchoU * 0.58, y: h * 0.42, at: 22, clic: true },
                { x: anchoU * 0.4, y: h * 0.78, at: Math.min(dur - 8, 50), clic: true },
              ]}
              colorOnda={acento}
            />
          </ScreenFrame>
        </div>
      </AbsoluteFill>
    );
  }

  if (b.tipo === "titular") {
    return (
      <AbsoluteFill style={{ background: v.panel, justifyContent: "center", padding: `0 ${pad}px`, boxSizing: "border-box" }}>
        <TypeSandwich lineas={b.detalle ? [b.palabra, `*${b.detalle}*`] : [b.palabra]} size={124} delay={2} color={v.tinta} colorAcento={acento} />
      </AbsoluteFill>
    );
  }

  // dato: la cifra se cuenta (rápido al inicio, frena en el valor) y la keyword entra cuando la cifra casi llegó.
  const p = arrive(f, 2, 28, "arriveSoft");
  const valor = Math.round(mix(p, b.desde, b.valor));
  return (
    <AbsoluteFill style={{ background: v.panel, justifyContent: "center", padding: `0 ${pad}px`, boxSizing: "border-box" }}>
      <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 210 * u, lineHeight: 0.9, letterSpacing: "-0.05em", color: v.tinta, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: acento }}>{b.prefijo}</span>
        {valor.toLocaleString("es-CO")}
        <span style={{ color: acento, fontSize: "0.5em", letterSpacing: "-0.02em" }}>{b.sufijo}</span>
      </div>
      <div style={{ marginTop: 22 * u }}>
        <Clave texto={b.palabra} color={acento} size={64} delay={18} mayus={v.mayusClave} />
      </div>
      <Detalle texto={b.detalle} color={v.tinta} delay={24} />
    </AbsoluteFill>
  );
};

const Etiqueta: React.FC<{ texto: string; color: string; delay: number }> = ({ texto, color, delay }) => {
  const f = useCurrentFrame();
  const { u, zona } = useEscala();
  const p = arrive(f, delay, 12, "arriveGentle");
  return (
    <div style={{ position: "absolute", left: zona.lados, top: 26 * u, fontFamily: marca.fuenteMono, fontWeight: 600, fontSize: 22 * u, letterSpacing: "0.1em", color, opacity: 0.7 * p }}>
      {texto}
    </div>
  );
};

/** Panel del presentador con el micro re-encuadre de relleno (lee el cuadro absoluto: vive fuera de los beats). */
const ReencuadreAbajo: React.FC<{ rellenos: number[]; children: React.ReactNode }> = ({ rellenos, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ transform: microReencuadre(f, rellenos), transformOrigin: "50% 36%" }}>{children}</AbsoluteFill>;
};

export const SplitStackPlantilla: React.FC<Props> = (p) => {
  const v = VARIANTES[p.variante];
  const { u, alto, zona } = useEscala();
  const acento = p.colores.acento ?? v.acento;
  const fondo = p.colores.fondo ?? v.fondo;
  const texto = p.colores.texto ?? v.texto;
  const total = duracion(p);

  // Inicio y largo de cada beat; el último se estira hasta el final de la pieza.
  let t = 0;
  const beats = p.beats.map((b, i) => {
    const desde = t;
    t += cuadros(b.segundos);
    return { b, desde, dur: i === p.beats.length - 1 ? Math.max(12, total - desde) : cuadros(b.segundos) };
  });

  const hBarra = v.barra ? 0.06 * alto : 0;
  const hArriba = (alto - hBarra) * v.proporcion;
  const yCostura = (hBarra + hArriba) / alto;
  const c = v.caption;
  const yCaption = (c.y === "costura" ? yCostura : c.y) - (c.size * u * 0.6) / alto;
  const palabras = aCuadros(p.palabras, c.mayus ? p.palabras.map((w) => w.word) : []);

  // Donde la pieza pasa más de 24 f sin un evento (beats, keyword, subtítulo, CTA), el presentador hace un
  // micro re-encuadre de cámara (ritmo de anuncio, motion-audit D-01). Cuadros absolutos.
  const ctaDesde = Math.max(0, total - cuadros(2.8));
  const eventos = [
    ...beats.flatMap(({ b, desde }) => eventosBeat(b).map((t) => desde + t)),
    ...ventanas(palabras, c.max, 6).map((g) => g[0].start),
    ...(v.etiquetas ? [16, 20] : []),
    ...(v.cta && p.cta ? [ctaDesde + 4] : []),
  ];
  const rellenos = rellenarHuecos(eventos, total);

  const arriba = (
    <AbsoluteFill style={{ background: v.panel }}>
      {beats.map(({ b, desde, dur }, i) => (
        <Sequence key={i} from={desde} durationInFrames={dur} name={`beat ${i + 1} · ${b.tipo}`}>
          <PanelBeat b={b} dur={dur} v={v} acento={acento} alto={hArriba} />
        </Sequence>
      ))}
      {v.etiquetas && p.etiquetaArriba ? <Etiqueta texto={p.etiquetaArriba} color={v.tinta} delay={16} /> : null}
    </AbsoluteFill>
  );

  const abajo = (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <ReencuadreAbajo rellenos={rellenos}>
        <PunchIn punches={beats.slice(1).map(({ desde }, k) => ({ at: desde, scale: k % 2 === 0 ? v.push : 1, oy: 0.36 }))}>
          <MediaPanel src={p.media} tipo="persona" fondo={marca.colores.superficie} tinta={texto} etiqueta="presentador · sin media" />
        </PunchIn>
      </ReencuadreAbajo>
      {v.etiquetas && p.etiquetaAbajo ? <Etiqueta texto={p.etiquetaAbajo} color={texto} delay={20} /> : null}
    </AbsoluteFill>
  );

  const barra =
    v.barra && p.marcas.length ? (
      <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 30 * u, letterSpacing: "0.04em", color: texto, display: "flex", gap: 22 * u }}>
        {p.marcas.map((m, i) => (
          <span key={i}>
            {i > 0 ? <span style={{ color: acento, marginRight: 22 * u }}>×</span> : null}
            {m}
          </span>
        ))}
      </div>
    ) : undefined;

  const yCta = alto - zona.abajo - 150 * u;

  return (
    <AbsoluteFill style={{ background: fondo }}>
      <SplitStack arriba={arriba} abajo={abajo} proporcion={v.proporcion} barra={barra} entrada={v.entrada} costura={v.costura} acento={acento} fondo={fondo} />
      <ChipCaption
        words={palabras}
        max={c.max}
        size={c.size}
        claves={p.claves}
        minLargo={c.minLargo}
        y={yCaption}
        colorChip={acento}
        colorTexto={texto}
        colorSobreChip={fondo}
      />
      {v.cta && p.cta ? (
        <Sequence from={ctaDesde} durationInFrames={total - ctaDesde} name="CTA">
          <div style={{ position: "absolute", left: 0, right: 0, top: yCta - zona.arriba, height: 200 * u }}>
            <Pill variante="top" texto={p.cta} tono="acento" size={46} delay={4} colorAcento={acento} />
          </div>
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

// ── Props por defecto: guion y datos genéricos del estudio, tiempos de habla de ejemplo. ──
const GUION =
  "Hace cinco años dictar era lento y casi nadie lo usaba. Hoy el setenta y tres por ciento de los equipos ya escribe hablando. " +
  "El secreto no es la herramienta, es el flujo. Hablas, la app limpia las muletillas y te deja el texto listo. " +
  "Así un correo de diez minutos sale en uno. Pruébalo una semana y mide cuánto tiempo recuperas.";

const voz = palabrasDe(GUION);
const seg = tramosEntre(voz, [["Hoy"], ["secreto"], ["Hablas"], ["Así"], ["Pruébalo"]], finVoz(voz));

export const splitStack = definir({
  id: "Plantilla-SplitStack",
  fuente: "referentes/lote-2026-11-08.md · split-stack (7gMbZTdLlxs, tiktok-7697333991984221462, zlOCQxQYnYc)",
  resumen: "Pantalla partida: gráficos o B-roll arriba, presentador abajo y el subtítulo en la costura con palabras clave en color.",
  cuando: "Una grabación a cámara que necesita datos, titulares o B-roll visibles todo el tiempo.",
  schema,
  componente: SplitStackPlantilla,
  defaultProps: {
    variante: "infografia",
    media: "",
    palabras: voz,
    claves: ["setenta", "flujo", "muletillas", "diez", "semana"],
    beats: [
      { tipo: "dato", segundos: seg[0], palabra: "Hace", detalle: "dictar era lento", valor: 5, desde: 0, prefijo: "", sufijo: " años", media: "" },
      { tipo: "dato", segundos: seg[1], palabra: "Ya dictan", detalle: "de los equipos", valor: 73, desde: 0, prefijo: "", sufijo: "%", media: "" },
      { tipo: "titular", segundos: seg[2], palabra: "El flujo", detalle: "no la herramienta", valor: 0, desde: 0, prefijo: "", sufijo: "", media: "" },
      { tipo: "ui", segundos: seg[3], palabra: "Sin muletillas", detalle: "dictado.app", valor: 0, desde: 0, prefijo: "", sufijo: "", media: "" },
      { tipo: "dato", segundos: seg[4], palabra: "Un correo", detalle: "de diez minutos a uno", valor: 1, desde: 10, prefijo: "", sufijo: " min", media: "" },
      { tipo: "broll", segundos: seg[5], palabra: "Una semana", detalle: "mide lo que recuperas", valor: 0, desde: 0, prefijo: "", sufijo: "", media: "" },
    ],
    marcas: ["TU MARCA", "ESTUDIO"],
    etiquetaArriba: "IA:",
    etiquetaAbajo: "REAL:",
    cta: "Comenta GUÍA",
    segundosCola: 1,
    colores: {},
  },
  duracion,
  formatos: ["vertical"],
});
