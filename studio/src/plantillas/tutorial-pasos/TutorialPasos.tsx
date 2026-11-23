import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { ChipCaption } from "../../components/presets/ChipCaption";
import { Cursor, type PuntoCursor } from "../../components/presets/Cursor";
import { Pill } from "../../components/presets/Pill";
import { ScreenFrame, type ZonaZoom } from "../../components/presets/ScreenFrame";
import { TypeSandwich } from "../../components/presets/TypeSandwich";
import { sfx } from "../../lib/cues";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { arrive, type CurveName, leave, mix, springPreset, tween, wiggle } from "../../lib/motion";
import { marca } from "../../marca/marca";
import { definir, resolverMedia, zColores, zMedia } from "../base";
import { aCuadros, finVoz, inicioDe, MediaPanel, palabrasDe, zPalabras } from "../talking-head-insertos/comun";

/**
 * Familia `tutorial-pasos` (referentes/lote-2026-11-08.md).
 * Videos de origen: n50KkoucMpU (pizarra, 16:9) y tHzfsCsWL6M (movil, 9:16).
 *
 * Qué se tomó (técnica medida en las recetas):
 * - Tarjeta "PASO N" entre secciones: pizarra con marco de madera sobre el azul del marco del video y subrayado
 *   que crece en 18 f con `arrive` (n50KkoucMpU); en movil, tarjeta oscura con flash de acento de 5 f (tHzfsCsWL6M).
 * - Screencast en marco redondeado (ScreenFrame) con zoom a la región de acción (move 24 f en n50KkoucMpU, ease-out
 *   rápido en tHzfsCsWL6M), cursor visible que hace clic en cada zona, nota anotada y zoom-out al cerrar el paso.
 * - Chip del paso fijo arriba a la izquierda mientras dura la sección (ancla de progreso).
 * - Resultado final con zoom-out 1,3 → 1,0 en 40 f con `arrive` y temblor que se apaga; flash naranja en movil.
 * - Marco de color alrededor de todo el video con filete claro (n50KkoucMpU); en movil, sin marco y tarjetas
 *   30 % más cortas (4,6 cortes cada 10 s contra 1,4).
 *
 * Qué NO se copió: grabaciones, prompts, clips de IA de relleno, clips de películas, voz y marca de los canales;
 * el glow cian del título de tHzfsCsWL6M (AI-23), la barra de export lineal (AI-01), la vibración estroboscópica
 * constante (AI-12: aquí el temblor decae en 1,5 s) y la estructura de 9 min (se reduce a 3 pasos). Textos por
 * defecto genéricos del estudio.
 */

type Variante = {
  marco: string | null;
  filete: string;
  fondo: string;
  acento: string;
  texto: string;
  pizarra: string;
  madera: string | null;
  pantalla: "escritorio" | "movil";
  ritmoTarjeta: number;
  zoom: { curva: CurveName; dur: number };
  temblor: number;
  flash: boolean;
  ui: { fondo: string; tinta: string };
  minLargo: number;
};

const VARIANTES: Record<"pizarra" | "movil", Variante> = {
  // n50KkoucMpU: marco #2F52A0 con filete blanco, pizarra #1E2022 con madera #C9A978, subrayado #F28C28 de 18 f,
  // zoom de screencast move 24 f, tarjeta con hold largo.
  pizarra: {
    marco: "#2F52A0",
    filete: "#EDEDE8",
    fondo: "#1E2022",
    acento: "#F28C28",
    texto: "#F4F1EA",
    pizarra: "#1E2022",
    madera: "#C9A978",
    pantalla: "escritorio",
    ritmoTarjeta: 1,
    zoom: { curva: "move", dur: 24 },
    temblor: 1.5,
    flash: false,
    ui: { fondo: "#202226", tinta: "#E9ECEF" },
    minLargo: 99,
  },
  // tHzfsCsWL6M: fondo #050607, UI móvil #1E1F22, flash #F08A24 de 5 f, zoom-out ease-out de 40 f con temblor,
  // planos de ~2 s.
  movil: {
    marco: null,
    filete: "#2A2C30",
    fondo: "#050607",
    acento: "#F08A24",
    texto: "#F2F4F5",
    pizarra: "#111316",
    madera: null,
    pantalla: "movil",
    ritmoTarjeta: 0.7,
    zoom: { curva: "arrive", dur: 14 },
    temblor: 6,
    flash: true,
    ui: { fondo: "#1E1F22", tinta: "#E6F6FB" },
    minLargo: 6,
  },
};

const zZona = z.object({
  x: z.number().min(0).max(1).describe("borde izquierdo, fracción del ancho de la grabación"),
  y: z.number().min(0).max(1),
  w: z.number().min(0.03).max(1),
  h: z.number().min(0.03).max(1),
  en: z.number().min(0).describe("segundos desde que arranca el screencast del paso"),
  nota: z.string().default(""),
});

const zPaso = z.object({
  titulo: z.string().describe("2–5 palabras: va en la tarjeta y en el chip"),
  segundos: z.number().min(1.5).max(90).describe("largo del screencast del paso"),
  media: zMedia.describe("grabación de pantalla del paso"),
  zonas: z.array(zZona).default([]),
});

export const schema = z.object({
  variante: z.enum(["pizarra", "movil"]).describe("pizarra=n50KkoucMpU · movil=tHzfsCsWL6M"),
  titulo: z.array(z.string()).min(1).describe("líneas del titular de apertura; *palabra* va en serif itálica"),
  etiqueta: z.string().default("Tutorial"),
  segundosIntro: z.number().min(1).max(10).default(2.6),
  segundosTarjeta: z.number().min(0.8).max(5).default(2),
  pasos: z.array(zPaso).min(1),
  resultado: z.object({
    media: zMedia,
    texto: z.string(),
    segundos: z.number().min(1.5).max(20),
  }),
  voz: zMedia.describe("voz en off (mp3/wav/m4a); vacío = sin audio"),
  palabras: zPalabras,
  claves: z.array(z.string()).default([]),
  colores: zColores,
});

type Props = z.infer<typeof schema>;
type Paso = Props["pasos"][number];

/** Línea de tiempo en cuadros: intro → (tarjeta + screencast) por paso → resultado. */
const plan = (p: Props) => {
  const v = VARIANTES[p.variante];
  const intro = cuadros(p.segundosIntro);
  const tarjeta = Math.max(18, cuadros(p.segundosTarjeta * v.ritmoTarjeta));
  let t = intro;
  const pasos = p.pasos.map((x, i) => {
    const a = t;
    t += tarjeta;
    const b = t;
    const dur = cuadros(x.segundos);
    t += dur;
    return { x, n: i + 1, tarjeta: a, pantalla: b, dur };
  });
  const resultado = { desde: t, dur: cuadros(p.resultado.segundos) };
  return { intro, tarjeta, pasos, resultado, total: t + resultado.dur };
};

const duracion = (p: Props) => plan(p).total;

/** Texto que sube por palabra desde una máscara; la duración crece con el índice (no todo dura lo mismo). */
const Linea: React.FC<{ texto: string; size: number; color: string; delay: number; peso?: number; alinear?: "left" | "center" }> = ({
  texto,
  size,
  color,
  delay,
  peso = 700,
  alinear = "left",
}) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: alinear === "center" ? "center" : "flex-start",
        gap: `0 ${0.26 * size * u}px`,
        fontFamily: marca.fuenteTitulo,
        fontWeight: peso,
        fontSize: size * u,
        lineHeight: 1.02,
        letterSpacing: "-0.03em",
        color,
      }}
    >
      {texto
        .split(" ")
        .filter(Boolean)
        .map((w, k) => {
          const p = arrive(f, delay + k * 2, 12 + k * 2, "arriveSoft");
          return (
            <span key={k} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.08em" }}>
              <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 110}%)` }}>{w}</span>
            </span>
          );
        })}
    </div>
  );
};

const Intro: React.FC<{ p: Props; v: Variante; dur: number; acento: string; texto: string }> = ({ p, v, dur, acento, texto }) => {
  const f = useCurrentFrame();
  const { u, zona, horizontal } = useEscala();
  const raya = tween(f, 2, 16, "arrive");
  const sale = leave(f, dur - 7, 7);
  return (
    <AbsoluteFill style={{ background: v.fondo, justifyContent: "center", padding: `0 ${zona.lados}px`, opacity: 1 - sale }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 * u, marginBottom: 30 * u }}>
        <div style={{ width: 56 * u * raya, height: 4 * u, background: acento }} />
        <div style={{ fontFamily: marca.fuenteMono, fontSize: 24 * u, letterSpacing: "0.16em", textTransform: "uppercase", color: texto, opacity: 0.7 * raya }}>
          {p.etiqueta} · {p.pasos.length} pasos
        </div>
      </div>
      <TypeSandwich lineas={p.titulo} size={horizontal ? 132 : 118} delay={6} exitAt={dur - 9} color={texto} colorAcento={acento} />
    </AbsoluteFill>
  );
};

const Tarjeta: React.FC<{ x: Paso; n: number; v: Variante; dur: number; acento: string; texto: string }> = ({ x, n, v, dur, acento, texto }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho, horizontal } = useEscala();
  const w = horizontal ? Math.min(ancho * 0.62, 1180 * u) : ancho * 0.84;
  const h = w * (horizontal ? 0.56 : 0.72);
  const e = arrive(f, 0, 16, "arriveSoft");
  const sale = leave(f, dur - 7, 7, "leaveSoft");
  const sello = springPreset(f, fps, "pop", 5);
  const raya = tween(f, 15, 18, "arrive");
  const flash = v.flash ? 1 - tween(f, 0, 5, "arriveGentle") : 0;
  sfx(f, "whoosh.short", 0);
  sfx(f, "pop", 5);
  return (
    <AbsoluteFill style={{ background: v.marco ?? v.fondo, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: w,
          height: h,
          boxSizing: "border-box",
          background: v.pizarra,
          border: v.madera ? `${16 * u}px solid ${v.madera}` : `${2 * u}px solid ${v.filete}`,
          borderRadius: (v.madera ? 10 : 26) * u,
          boxShadow: `0 ${30 * u}px ${70 * u}px rgba(3,5,8,0.45)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26 * u,
          padding: `0 ${50 * u}px`,
          opacity: Math.min(1, e / 0.5) * (1 - sale),
          transform: `translateY(${((1 - e) * 46 - sale * 30) * u}px) scale(${0.94 + 0.06 * e})`,
          filter: e < 1 ? `blur(${(1 - e) * 10 * u}px)` : undefined,
        }}
      >
        <div
          style={{
            padding: `${8 * u}px ${20 * u}px`,
            borderRadius: 8 * u,
            background: acento,
            color: v.pizarra,
            fontFamily: marca.fuenteTitulo,
            fontWeight: 700,
            fontSize: 38 * u,
            letterSpacing: "0.04em",
            transform: `scale(${0.7 + 0.3 * sello}) rotate(${(1 - sello) * -4}deg)`,
          }}
        >
          PASO {String(n).padStart(2, "0")}
        </div>
        <div style={{ textAlign: "center" }}>
          <Linea texto={x.titulo} size={horizontal ? 84 : 76} color={texto} delay={9} alinear="center" />
          <div style={{ height: 6 * u, marginTop: 14 * u, background: acento, borderRadius: 3 * u, transformOrigin: "0 50%", transform: `scaleX(${raya})` }} />
        </div>
      </div>
      {flash > 0.01 && <AbsoluteFill style={{ background: acento, opacity: flash * 0.85 }} />}
    </AbsoluteFill>
  );
};

const Pantalla: React.FC<{ x: Paso; n: number; v: Variante; dur: number; acento: string; texto: string }> = ({ x, n, v, dur, acento, texto }) => {
  const f = useCurrentFrame();
  const { u, ancho, alto, zona, horizontal } = useEscala();
  const A = ancho / u;
  const H = alto / u;
  const borde = v.marco ? 18 : 0;
  const movil = v.pantalla === "movil";
  // Geometría en u (lado corto = 1080).
  const g = (() => {
    if (!movil) {
      const W = horizontal ? Math.min(A - 2 * (borde + 170), (H - 2 * (borde + 100)) * (16 / 9)) : A - 2 * (borde + 40);
      const Hh = W * (9 / 16);
      return { W, H: Hh, left: (A - W) / 2, top: horizontal ? (H - Hh) / 2 + 20 : H * 0.44 - Hh / 2 };
    }
    const Hh = horizontal ? H - 2 * (borde + 80) : H - zona.arriba / u - (zona.abajo / u) * 0.85;
    const W = Hh * (9 / 16);
    return { W, H: Hh, left: horizontal ? A * 0.3 - W / 2 : (A - W) / 2, top: horizontal ? (H - Hh) / 2 : zona.arriba / u };
  })();

  const zonas: ZonaZoom[] = x.zonas.map((z) => ({
    x: z.x * g.W,
    y: z.y * g.H,
    w: z.w * g.W,
    h: z.h * g.H,
    at: cuadros(z.en),
    curva: v.zoom.curva,
    dur: v.zoom.dur,
    anotacion: z.nota ? (movil ? "circulo" : "rect") : undefined,
    nota: z.nota || undefined,
  }));
  // Zoom-out al cerrar el paso, si queda aire después de la última zona.
  const ultima = zonas.length ? zonas[zonas.length - 1].at : 0;
  if (zonas.length && dur - 34 > ultima + 24) zonas.push({ x: 0, y: 0, w: g.W, h: g.H, at: dur - 34, dur: 22, curva: "arriveSoft" });

  // El cursor llega a cada zona después del zoom y hace clic.
  const puntos: PuntoCursor[] = [{ x: g.W * 0.92, y: g.H * 1.06, at: 0 }];
  x.zonas.forEach((z) => {
    const at = Math.max(puntos[puntos.length - 1].at + 10, cuadros(z.en) + 12);
    if (at < dur - 8) puntos.push({ x: (z.x + z.w / 2) * g.W, y: (z.y + z.h / 2) * g.H, at, clic: true });
  });
  puntos.forEach((pt) => pt.clic && sfx(f, "click", pt.at));

  const lateral = movil && horizontal;
  return (
    <AbsoluteFill style={{ background: v.fondo }}>
      <div style={{ position: "absolute", left: g.left * u, top: g.top * u }}>
        <ScreenFrame ancho={g.W} alto={g.H} zonas={zonas} delay={2} radio={movil ? 44 : 22} colorAnotacion={acento} colorNota={acento} colorMarco={v.ui.fondo}>
          <MediaPanel src={x.media} tipo="pantalla" fondo={v.ui.fondo} tinta={v.ui.tinta} etiqueta={`paso ${n} · sin grabación`} />
          {puntos.length > 1 && <Cursor puntos={puntos} salida={dur - 6} colorOnda={acento} />}
        </ScreenFrame>
      </div>
      {lateral ? (
        // En 16:9 con grabación de móvil, la columna derecha lleva el paso en grande.
        <div style={{ position: "absolute", left: A * 0.52 * u, right: zona.lados, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 * u }}>
          <Pill variante="paso" numero={n} texto={`Paso ${n}`} tono="acento" size={34} delay={4} exitAt={dur - 9} colorAcento={acento} />
          <Linea texto={x.titulo} size={96} color={texto} delay={8} />
        </div>
      ) : (
        <div style={{ position: "absolute", left: (borde + 30) * u + (horizontal ? 0 : zona.lados - 30 * u), top: (horizontal ? borde + 30 : Math.max(borde + 40, g.top - 96)) * u }}>
          <Pill variante="paso" numero={n} texto={x.titulo} tono="acento" size={horizontal ? 30 : 34} delay={6} exitAt={dur - 9} colorAcento={acento} />
        </div>
      )}
    </AbsoluteFill>
  );
};

const Resultado: React.FC<{ p: Props; v: Variante; acento: string; texto: string }> = ({ p, v, acento, texto }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, zona } = useEscala();
  const zoom = tween(f, 0, 40, "arrive"); // movimiento de cámara, no entrada: 40 f medidos en tHzfsCsWL6M
  const calma = 1 - tween(f, 0, 45, "arriveGentle");
  const dx = wiggle("res-x", f, fps, 12, v.temblor) * calma;
  const dy = wiggle("res-y", f, fps, 11, v.temblor) * calma;
  const flash = v.flash ? 1 - tween(f, 0, 6, "arriveGentle") : 0;
  sfx(f, "hit", 0);
  return (
    <AbsoluteFill style={{ background: v.fondo }}>
      <AbsoluteFill style={{ transform: `translate(${dx * u}px, ${dy * u}px) scale(${mix(zoom, 1.3, 1)})` }}>
        <MediaPanel src={p.resultado.media} tipo="broll" fondo={v.pizarra} tinta={texto} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: zona.lados, right: zona.lados, bottom: zona.abajo + 120 * u }}>
        <div style={{ fontFamily: marca.fuenteMono, fontSize: 24 * u, letterSpacing: "0.16em", color: acento, marginBottom: 14 * u, opacity: arrive(f, 12, 10, "arriveGentle") }}>
          RESULTADO
        </div>
        <Linea texto={p.resultado.texto} size={92} color={texto} delay={16} />
      </div>
      {flash > 0.01 && <AbsoluteFill style={{ background: acento, opacity: flash * 0.9 }} />}
    </AbsoluteFill>
  );
};

export const TutorialPasos: React.FC<Props> = (p) => {
  const v = VARIANTES[p.variante];
  const { u, horizontal } = useEscala();
  const acento = p.colores.acento ?? v.acento;
  const texto = p.colores.texto ?? v.texto;
  const vv = p.colores.fondo ? { ...v, fondo: p.colores.fondo } : v;
  const t = plan(p);
  const palabras = aCuadros(p.palabras);

  const contenido = (
    <>
      <Sequence durationInFrames={t.intro} name="intro">
        <Intro p={p} v={vv} dur={t.intro} acento={acento} texto={texto} />
      </Sequence>
      {t.pasos.map(({ x, n, tarjeta, pantalla, dur }) => (
        <Sequence key={n} from={tarjeta} durationInFrames={t.tarjeta + dur} name={`paso ${n}`}>
          <Sequence durationInFrames={t.tarjeta} name="tarjeta">
            <Tarjeta x={x} n={n} v={vv} dur={t.tarjeta} acento={acento} texto={texto} />
          </Sequence>
          <Sequence from={pantalla - tarjeta} durationInFrames={dur} name="screencast">
            <Pantalla x={x} n={n} v={vv} dur={dur} acento={acento} texto={texto} />
          </Sequence>
        </Sequence>
      ))}
      <Sequence from={t.resultado.desde} durationInFrames={t.resultado.dur} name="resultado">
        <Resultado p={p} v={vv} acento={acento} texto={texto} />
      </Sequence>
      <ChipCaption
        words={palabras}
        max={horizontal ? 3 : 2}
        size={horizontal ? 54 : 62}
        claves={p.claves}
        minLargo={v.minLargo}
        colorChip={acento}
        colorTexto={texto}
        colorSobreChip={vv.fondo}
      />
    </>
  );

  return (
    <AbsoluteFill style={{ background: v.marco ?? vv.fondo }}>
      {p.voz ? <Audio src={resolverMedia(p.voz)} /> : null}
      {v.marco ? (
        // Marco de color alrededor de todo el video con filete claro (n50KkoucMpU).
        <div style={{ position: "absolute", inset: 18 * u, borderRadius: 16 * u, overflow: "hidden", boxShadow: `0 0 0 ${2 * u}px ${v.filete}`, background: vv.fondo }}>
          {contenido}
        </div>
      ) : (
        contenido
      )}
    </AbsoluteFill>
  );
};

// ── Props por defecto: guion genérico del estudio; las secciones se alinean a la voz de ejemplo. ──
const GUION =
  "Hoy armamos un video con IA de principio a fin, sin editar a mano. " +
  "Paso uno: busca una referencia y copia su estructura, no su contenido. Abre la galería, elige un clip y guarda el prompt. " +
  "Paso dos: genera los clips. Pega el prompt, ajusta la duración y espera el render. " +
  "Paso tres: edita y exporta. Ordena las tomas, sube el ritmo y listo. " +
  "Este es el resultado, hecho en una tarde.";

const voz = palabrasDe(GUION);
const TARJETA = 2;
const r2 = (x: number) => Math.round(x * 100) / 100;
const pasoEn = [1, 2, 3].map((n) => inicioDe(voz, "Paso", n));
const este = inicioDe(voz, "Este");

export const tutorialPasos = definir({
  id: "Plantilla-TutorialPasos",
  fuente: "referentes/lote-2026-11-08.md · tutorial-pasos (n50KkoucMpU, tHzfsCsWL6M)",
  resumen: "Tutorial por pasos: tarjeta PASO N entre secciones, screencast con zoom a la región y cursor, y resultado final.",
  cuando: "Enseñar un proceso en pantalla a partir de una grabación de pantalla y una locución.",
  schema,
  componente: TutorialPasos,
  defaultProps: {
    variante: "pizarra",
    titulo: ["Tu primer video", "*con IA*"],
    etiqueta: "Tutorial",
    segundosIntro: r2(pasoEn[0]),
    segundosTarjeta: TARJETA,
    pasos: [
      {
        titulo: "Busca una referencia",
        segundos: r2(pasoEn[1] - pasoEn[0] - TARJETA),
        media: "",
        zonas: [
          { x: 0.05, y: 0.1, w: 0.3, h: 0.36, en: 0.7, nota: "Galería" },
          { x: 0.55, y: 0.56, w: 0.38, h: 0.3, en: 3.1, nota: "Guarda el prompt" },
        ],
      },
      {
        titulo: "Genera los clips",
        segundos: r2(pasoEn[2] - pasoEn[1] - TARJETA),
        media: "",
        zonas: [{ x: 0.3, y: 0.62, w: 0.5, h: 0.24, en: 1.4, nota: "Duración" }],
      },
      {
        titulo: "Edita y exporta",
        segundos: r2(este - pasoEn[2] - TARJETA),
        media: "",
        zonas: [{ x: 0.08, y: 0.68, w: 0.84, h: 0.24, en: 0.5, nota: "Línea de tiempo" }],
      },
    ],
    resultado: { media: "", texto: "Hecho en una tarde", segundos: r2(finVoz(voz) - este + 1.6) },
    voz: "",
    palabras: voz,
    claves: ["referencia", "estructura", "clips", "duración", "exporta", "resultado"],
    colores: {},
  },
  duracion,
  formatos: ["vertical", "horizontal"],
});
