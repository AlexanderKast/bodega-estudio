import { useCurrentFrame, useVideoConfig } from "remotion";
import { arrive, byDistance, type CurveName, durationForDistance, mix, staggerDelay, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { marca } from "../../marca/marca";

/**
 * BentoGrid — grilla bento de widgets que se arma en cadena desde el foco y una cámara que la recorre.
 *
 * Técnica: las celdas se ordenan por distancia al foco (`byDistance`) y entran con stagger no lineal
 * (`staggerDelay`, total ≤ 18 f, kb/02 §2), desde afuera hacia su sitio: "encajan" en la grilla. Las grandes tardan
 * más y usan `arriveSoft`; las chicas `arrive`. Cada celda puede traer una barra que se llena con su propio tiempo
 * (micro-animación distinta por widget). La cámara opcional viaja celda a celda sobre un plano inclinado con `glide`,
 * con swing en los tiempos para no caer en metrónomo (AI-11), atenúa las celdas que no mira y al final retrocede a la
 * grilla completa con `move`. Radios por jerarquía: grandes `radio`, chicas 60 % (AI-27).
 *
 * Origen: tiktok-7521798862521060630 (bento de widgets en plano ~25°, mosaicos arrive 24 f escalonados, cámara
 * glide 30 f entre widgets, retroceso move 50 f; receta "nuevo:BentoGrid") y pin "grilla bento de tarjetas verdes
 * con iconos y gráficos" (catalogo.json, nuevo:BentoGrid).
 */

export type CeldaBento = {
  col: number;
  fila: number;
  w?: number; // columnas que ocupa
  h?: number; // filas que ocupa
  tono?: "claro" | "oscuro" | "acento" | "superficie";
  titulo?: string;
  valor?: string;
  detalle?: string;
  barra?: number; // 0–1: barra que se llena al entrar
  contenido?: React.ReactNode; // reemplaza el contenido por defecto
};

export type CamaraBento = {
  recorrido: number[]; // índices de celdas, en orden de visita
  inicio: number;
  porCelda?: number; // cuadros por parada (aprox.; lleva swing)
  zoom?: number; // zoom máximo sobre una celda
  volver?: boolean; // retrocede a la grilla completa al final
};

type Props = {
  celdas: CeldaBento[];
  columnas?: number;
  filas?: number;
  ancho?: number; // u
  alto?: number;
  gap?: number;
  radio?: number;
  delay?: number;
  foco?: { x: number; y: number }; // 0–1 sobre la grilla
  camara?: CamaraBento;
  inclinado?: boolean;
  rotX?: number;
  rotZ?: number;
  colores?: Partial<Record<NonNullable<CeldaBento["tono"]>, { fondo: string; texto: string; suave: string }>>;
};

type Cam = { s: number; cx: number; cy: number };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const TONOS: Record<NonNullable<CeldaBento["tono"]>, { fondo: string; texto: string; suave: string }> = {
  claro: { fondo: marca.colores.texto, texto: marca.colores.fondo, suave: marca.colores.acentoProfundo },
  oscuro: { fondo: marca.colores.sombraCalida, texto: marca.colores.texto, suave: marca.colores.suave },
  acento: { fondo: marca.colores.acento, texto: marca.colores.fondo, suave: marca.colores.acentoProfundo },
  superficie: { fondo: marca.colores.superficie, texto: marca.colores.texto, suave: marca.colores.suave },
};

export const BentoGrid: React.FC<Props> = ({
  celdas,
  columnas = 4,
  filas = 3,
  ancho = 1560,
  alto = 860,
  gap = 20,
  radio = 30,
  delay = 0,
  foco = { x: 0.5, y: 0.5 },
  camara,
  inclinado = true,
  rotX = 24,
  rotZ = -9,
  colores = {},
}) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u } = useEscala();
  const cw = (ancho - gap * (columnas - 1)) / columnas;
  const ch = (alto - gap * (filas - 1)) / filas;

  const cajas = celdas.map((c, i) => {
    const w = c.w ?? 1;
    const h = c.h ?? 1;
    const left = c.col * (cw + gap);
    const top = c.fila * (ch + gap);
    const width = w * cw + (w - 1) * gap;
    const height = h * ch + (h - 1) * gap;
    return { i, c, left, top, width, height, x: left + width / 2, y: top + height / 2, grande: w * h >= 3 };
  });
  const fx = foco.x * ancho;
  const fy = foco.y * alto;
  const orden = byDistance(cajas, fx, fy);
  const ventanaStagger = Math.min(18, 3 * cajas.length);

  // ── Cámara: paradas con swing, glide entre celdas y retroceso final ──
  type Parada = { at: number; dur: number; t: Cam; curva: CurveName };
  const paradas: Parada[] = (() => {
    if (!camara) return [];
    const por = camara.porCelda ?? 28;
    const swing = [0, 4, -3, 2, -2, 3];
    let prev: Cam = { s: 1, cx: ancho / 2, cy: alto / 2 };
    const lista: Parada[] = camara.recorrido
      .filter((idx) => cajas[idx] !== undefined)
      .map((idx, k) => {
        const b = cajas[idx];
        const s = Math.max(1, Math.min(camara.zoom ?? 2.1, Math.min(ancho / b.width, alto / b.height) * 0.6));
        const t: Cam = { s, cx: b.x, cy: b.y };
        const dur = Math.max(20, Math.min(34, durationForDistance(Math.hypot(t.cx - prev.cx, t.cy - prev.cy)) + 6));
        prev = t;
        return { at: camara.inicio + k * por + swing[k % swing.length], dur, t, curva: "glide" };
      });
    if (camara.volver !== false && lista.length > 0) {
      const ult = lista[lista.length - 1];
      lista.push({ at: ult.at + por, dur: 44, t: { s: 1, cx: ancho / 2, cy: alto / 2 }, curva: "move" });
    }
    return lista;
  })();

  let cam: Cam = { s: 1, cx: ancho / 2, cy: alto / 2 };
  for (const p of paradas) {
    const k = tween(f, p.at, p.dur, p.curva);
    if (f < p.at) continue;
    cam = { s: Math.exp(mix(k, Math.log(cam.s), Math.log(p.t.s))), cx: mix(k, cam.cx, p.t.cx), cy: mix(k, cam.cy, p.t.cy) };
  }
  const zoomMax = Math.max(1.0001, ...paradas.map((p) => p.t.s));
  const cerca = clamp01((cam.s - 1) / (zoomMax - 1));
  const mirada = cajas.reduce((a, b) => (Math.hypot(b.x - cam.cx, b.y - cam.cy) < Math.hypot(a.x - cam.cx, a.y - cam.cy) ? b : a), cajas[0]);

  // Respiración global: push-in lento para que el plano nunca quede muerto (AI-08).
  const respira = tween(f, 0, durationInFrames, "glide");

  const grilla = (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: ancho * u,
        height: alto * u,
        transformOrigin: "0 0",
        transform: `translate(${(ancho / 2 - cam.cx * cam.s) * u}px, ${(alto / 2 - cam.cy * cam.s) * u}px) scale(${cam.s})`,
      }}
    >
      {cajas.map((b) => {
        const rango = orden.indexOf(b);
        const ini = delay + staggerDelay(rango, cajas.length, ventanaStagger);
        const p = arrive(f, ini, b.grande ? 24 : 18, b.grande ? "arriveSoft" : "arrive");
        const dx = b.x - fx;
        const dy = b.y - fy;
        const n = Math.hypot(dx, dy) || 1;
        const lejos = (1 - p) * 80;
        const tono = { ...TONOS[b.c.tono ?? "superficie"], ...(colores[b.c.tono ?? "superficie"] ?? {}) };
        const atenua = b === mirada ? 0 : cerca * 0.42;
        const llena = b.c.barra !== undefined ? arrive(f, ini + 12, 30, "arriveSoft") * b.c.barra : 0;
        const r = (b.grande ? radio : radio * 0.6) * u;
        return (
          <div
            key={b.i}
            style={{
              position: "absolute",
              left: b.left * u,
              top: b.top * u,
              width: b.width * u,
              height: b.height * u,
              borderRadius: r,
              background: tono.fondo,
              color: tono.texto,
              boxSizing: "border-box",
              padding: (b.grande ? 38 : 26) * u,
              overflow: "hidden",
              opacity: Math.min(1, p / 0.5),
              transform: `translate(${(dx / n) * lejos * u}px, ${(dy / n) * lejos * u}px) scale(${0.9 + 0.1 * p})`,
              filter: `blur(${(1 - p) * 6 * u}px) brightness(${1 - atenua})`,
              boxShadow: `${-10 * u}px ${18 * u}px ${36 * u}px rgba(3,5,2,0.45)`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {b.c.contenido ?? (
              <>
                <div style={{ fontFamily: marca.fuenteTexto, fontWeight: 500, fontSize: 22 * u, color: tono.suave, letterSpacing: "0.01em" }}>
                  {b.c.titulo}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: marca.fuenteTitulo,
                      fontWeight: 700,
                      fontSize: Math.min(b.height * 0.34, b.grande ? 150 : 84) * u,
                      letterSpacing: "-0.04em",
                      lineHeight: 0.95,
                    }}
                  >
                    {b.c.valor}
                  </div>
                  {b.c.detalle ? (
                    <div style={{ fontFamily: marca.fuenteTexto, fontSize: 20 * u, color: tono.suave, marginTop: 8 * u }}>{b.c.detalle}</div>
                  ) : null}
                  {b.c.barra !== undefined ? (
                    <div style={{ marginTop: 16 * u, height: 10 * u, borderRadius: 5 * u, background: tono.suave, opacity: 0.9, overflow: "hidden" }}>
                      <div style={{ width: `${llena * 100}%`, height: "100%", borderRadius: 5 * u, background: tono.texto }} />
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2200 * u, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: ancho * u,
          height: alto * u,
          transform: inclinado
            ? `rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${0.92 + 0.04 * respira})`
            : `scale(${1 + 0.03 * respira})`,
          transformStyle: "preserve-3d",
        }}
      >
        {grilla}
      </div>
    </div>
  );
};
