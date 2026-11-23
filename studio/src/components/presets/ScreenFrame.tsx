import { random, useCurrentFrame } from "remotion";
import { arrive, type CurveName, curves, durationForDistance, enterStyle, leave, mix, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { marca } from "../../marca/marca";
import { Circulo, Recuadro } from "../anotacion";

/**
 * ScreenFrame — captura o video en un marco redondeado con sombra, con zoom digital a regiones.
 *
 * Técnica: el contenido vive en un viewport fijo (el marco no se mueve) y una "cámara" recorre zonas
 * {x, y, w, h, at}: el zoom se interpola en escala logarítmica (se percibe uniforme) y el centro se acota para no
 * mostrar fuera de la captura. Cada zona usa una curva del kit (por defecto `arriveSoft`: pico rápido y frenada,
 * como los zooms de Screen Studio). Mientras la cámara se mueve rápido el contenido se desenfoca un poco (AI-09).
 * Al llegar, una anotación del kit (`Recuadro` en piel vector o `Circulo` en piel marcador, components/anotacion)
 * se dibuja con `aeEasy` en 14 f y una nota la acompaña con tamaño constante en pantalla. Variante `ventana` con barra de título.
 *
 * Origen: tiktok-7701672067120368948 (grabación en marco redondeado, zooms digitales ease-out de 8 f),
 * n50KkoucMpU (screencast con zoom a la zona de acción), tHzfsCsWL6M (zoom-out suave 130 → 100 %),
 * DiH9Pek312c (ventana dentro del plano), DryieyoUmLc (anotaciones que se dibujan, 12 f ease-in-out).
 */

export type ZonaZoom = {
  x: number; // u, relativas al área de contenido
  y: number;
  w: number;
  h: number;
  at: number;
  dur?: number;
  curva?: CurveName;
  anotacion?: "rect" | "circulo";
  nota?: string;
};

type Props = {
  children: React.ReactNode;
  ancho?: number; // u del área de contenido
  alto?: number;
  radio?: number;
  ventana?: boolean;
  titulo?: string;
  zonas?: ZonaZoom[];
  zoomMax?: number;
  margen?: number; // fracción del viewport que ocupa la zona al llegar
  delay?: number;
  entrada?: boolean;
  colorMarco?: string;
  colorBorde?: string;
  colorAnotacion?: string;
  colorNota?: string;
  colorTextoNota?: string;
};

type Cam = { s: number; cx: number; cy: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const BARRA = 48;

export const ScreenFrame: React.FC<Props> = ({
  children,
  ancho = 1500,
  alto = 860,
  radio = 26,
  ventana = false,
  titulo = "",
  zonas = [],
  zoomMax = 2.6,
  margen = 0.78,
  delay = 0,
  entrada = true,
  colorMarco = marca.colores.superficie,
  colorBorde = marca.colores.linea,
  colorAnotacion = marca.colores.acento,
  colorNota = marca.colores.acento,
  colorTextoNota = marca.colores.fondo,
}) => {
  const f = useCurrentFrame();
  const { u } = useEscala();

  const objetivo = (z: ZonaZoom): Cam => {
    const s = Math.max(1, Math.min(zoomMax, Math.min(ancho / z.w, alto / z.h) * margen));
    const mx = ancho / (2 * s);
    const my = alto / (2 * s);
    return { s, cx: Math.min(ancho - mx, Math.max(mx, z.x + z.w / 2)), cy: Math.min(alto - my, Math.max(my, z.y + z.h / 2)) };
  };

  // Duración de cada zona: por distancia del centro más el cambio de zoom (kb/02 §1).
  const plan = (() => {
    let prev: Cam = { s: 1, cx: ancho / 2, cy: alto / 2 };
    return zonas.map((z) => {
      const t = objetivo(z);
      const recorrido = Math.hypot(t.cx - prev.cx, t.cy - prev.cy) + Math.abs(Math.log(t.s / prev.s)) * 420;
      const dur = z.dur ?? Math.max(12, Math.min(30, durationForDistance(recorrido) + 4));
      prev = t;
      return { z, t, dur, curva: z.curva ?? ("arriveSoft" as CurveName) };
    });
  })();

  const camara = (fr: number, auditar: boolean): Cam => {
    let c: Cam = { s: 1, cx: ancho / 2, cy: alto / 2 };
    for (const p of plan) {
      const k = auditar ? tween(fr, p.z.at, p.dur, p.curva) : curves[p.curva](clamp01((fr - p.z.at) / p.dur));
      if (fr < p.z.at) continue;
      c = { s: Math.exp(mix(k, Math.log(c.s), Math.log(p.t.s))), cx: mix(k, c.cx, p.t.cx), cy: mix(k, c.cy, p.t.cy) };
    }
    return c;
  };

  const cam = camara(f, true);
  const antes = camara(f - 1, false);
  const vel = Math.abs(Math.log(cam.s / antes.s)) * 60 + Math.hypot(cam.cx - antes.cx, cam.cy - antes.cy) * cam.s * 0.05;
  const desenfoque = Math.min(4, vel) * u;

  const e = entrada ? arrive(f, delay, 22, "arriveSoft") : 1;
  const barra = ventana ? BARRA : 0;

  return (
    <div
      style={{
        width: ancho * u,
        height: (alto + barra) * u,
        borderRadius: radio * u,
        background: colorMarco,
        border: `${1.5 * u}px solid ${colorBorde}`,
        overflow: "hidden",
        position: "relative",
        boxShadow: `0 ${34 * u}px ${90 * u}px rgba(3,5,2,0.6), 0 ${6 * u}px ${14 * u}px rgba(3,5,2,0.45)`,
        opacity: Math.min(1, e / 0.6),
        transform: `translateY(${(1 - e) * 50 * u}px) scale(${1.04 - 0.04 * e})`,
        filter: `blur(${(1 - e) * 10 * u}px)`,
      }}
    >
      {ventana ? (
        <div
          style={{
            height: barra * u,
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            padding: `0 ${20 * u}px`,
            borderBottom: `${1.5 * u}px solid ${colorBorde}`,
            boxSizing: "border-box",
          }}
        >
          {[marca.colores.suave, marca.colores.linea, marca.colores.linea].map((c, i) => (
            <div key={i} style={{ width: 13 * u, height: 13 * u, borderRadius: "50%", background: c, opacity: i === 0 ? 0.55 : 1 }} />
          ))}
          <div style={{ marginLeft: 14 * u, fontFamily: marca.fuenteMono, fontSize: 18 * u, color: marca.colores.suave, letterSpacing: "0.03em" }}>
            {titulo}
          </div>
        </div>
      ) : null}

      <div style={{ position: "relative", width: ancho * u, height: alto * u, overflow: "hidden" }}>
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
          <div style={{ position: "absolute", inset: 0, filter: desenfoque > 0.15 ? `blur(${desenfoque / cam.s}px)` : undefined }}>{children}</div>

          {/* Anotaciones del kit, en unidades `u` (el contenedor escala): rectángulo limpio o círculo a mano. */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: `scale(${u})` }}>
            {plan.map((p, i) => {
              if (!p.z.anotacion) return null;
              const ini = p.z.at + p.dur - 4;
              const siguiente = plan[i + 1]?.z.at;
              const fuera = siguiente !== undefined ? leave(f, siguiente, 6) : 0;
              if (fuera >= 1) return null;
              const pad = 12;
              const comun = { inicio: ini, dur: 14, curva: "aeEasy" as CurveName, color: colorAnotacion, grosor: 4 / cam.s, sonido: false as const };
              return (
                <div key={i} style={{ opacity: 1 - fuera }}>
                  {p.z.anotacion === "rect" ? (
                    <Recuadro
                      piel="vector"
                      x={p.z.x + p.z.w / 2}
                      y={p.z.y + p.z.h / 2}
                      ancho={p.z.w + pad * 2}
                      alto={p.z.h + pad * 2}
                      radio={16}
                      semilla={`rect-${i}`}
                      {...comun}
                    />
                  ) : (
                    <Circulo
                      piel="marcador"
                      en={{ x: p.z.x + p.z.w / 2, y: p.z.y + p.z.h / 2 }}
                      rx={p.z.w * 0.64}
                      ry={p.z.h * 0.68}
                      desde={-126 + random(`circ-${i}`) * 34}
                      sentido={1}
                      semilla={`circ-${i}`}
                      {...comun}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {plan.map((p, i) => {
            if (!p.z.nota) return null;
            const q = arrive(f, p.z.at + p.dur + 6, 12, "arrive");
            const siguiente = plan[i + 1]?.z.at;
            const fuera = siguiente !== undefined ? leave(f, siguiente, 6) : 0;
            if (q <= 0 || fuera >= 1) return null;
            const base = enterStyle(q, 14);
            return (
              <div
                key={`nota-${i}`}
                style={{
                  position: "absolute",
                  left: (p.z.x - 12) * u,
                  top: (p.z.y + p.z.h + 22) * u,
                  transformOrigin: "0 0",
                  transform: `scale(${1 / cam.s})`,
                }}
              >
                <div
                  style={{
                    ...base,
                    opacity: Number(base.opacity) * (1 - fuera),
                    padding: `${10 * u}px ${18 * u}px`,
                    borderRadius: 12 * u,
                    background: colorNota,
                    color: colorTextoNota,
                    fontFamily: marca.fuenteTexto,
                    fontWeight: 600,
                    fontSize: 24 * u,
                    whiteSpace: "nowrap",
                    boxShadow: `0 ${10 * u}px ${22 * u}px rgba(3,5,2,0.45)`,
                  }}
                >
                  {p.z.nota}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
