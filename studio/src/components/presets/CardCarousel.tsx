import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { arrive, mix, springPreset, springs, staggerDelay, type SpringName } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { marca } from "../../marca/marca";

/**
 * CardCarousel — carrusel de tarjetas en perspectiva que avanza por pasos con spring.
 *
 * Técnica: el índice activo es continuo (inicial + Σ delta·spring de cada paso), así un salto de dos posiciones
 * viaja por la intermedia y el spring `snappy` (ζ 0.71) deja un asentamiento corto, sin rebote de juguete (AI-10).
 * Cada tarjeta se ubica por su distancia d al índice: la activa al frente y derecha; las vecinas se separan, rotan
 * en Y hacia el centro, retroceden en Z, se oscurecen y se desenfocan (profundidad de campo), y a partir de |d| > 2 se
 * apagan. La activa es la héroe (AI-26): único borde de acento, sin halo (AI-23). Entrada desde el centro hacia
 * afuera con stagger no lineal, y desenfoque leve proporcional a la velocidad del giro (AI-09).
 *
 * Origen: tiktok-7697333991984221462 (carrusel 3D, arriveSoft 41 f), tiktok-7702620779518643478 (tres tarjetas con
 * la central escalada, move 18 f; no tomar el borde luminoso) y pins "carrusel de tarjetas de cristal con póster
 * central" / "carrusel con tarjeta de vidrio degradado central" / "carrusel de tarjetas con swipe" (nuevo:CardCarousel).
 */

export type TarjetaCarrusel = {
  titulo: string;
  etiqueta?: string;
  color?: string;
  colorTexto?: string;
  contenido?: React.ReactNode; // reemplaza el arte por defecto
};

export type PasoCarrusel = number | { at: number; delta: number };

type Props = {
  tarjetas: TarjetaCarrusel[];
  pasos?: PasoCarrusel[]; // cuadros de avance (+1) o {at, delta}
  inicial?: number;
  ancho?: number; // u de cada tarjeta
  alto?: number;
  separacion?: number; // u entre la activa y la vecina
  rotacion?: number; // grados de las vecinas
  profundidad?: number; // u hacia atrás por posición
  muelle?: SpringName;
  delay?: number;
  colorBorde?: string;
  colorFondo?: string;
};

export const CardCarousel: React.FC<Props> = ({
  tarjetas,
  pasos = [],
  inicial = 0,
  ancho = 470,
  alto = 640,
  separacion = 400,
  rotacion = 38,
  profundidad = 300,
  muelle = "snappy",
  delay = 0,
  colorBorde = marca.colores.acento,
  colorFondo = marca.colores.superficie,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const lista = pasos.map((p) => (typeof p === "number" ? { at: p, delta: 1 } : p));

  let idx = inicial;
  let antes = inicial;
  for (const p of lista) {
    idx += p.delta * springPreset(f, fps, muelle, p.at);
    antes += p.delta * spring({ frame: f - 1 - p.at, fps, config: springs[muelle] });
  }
  const vel = Math.abs(idx - antes);
  const n = tarjetas.length;
  const rango = tarjetas.map((_, i) => Math.abs(i - inicial));
  const orden = [...rango].map((r, i) => ({ r, i })).sort((a, b) => a.r - b.r || a.i - b.i);

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1700 * u, perspectiveOrigin: "50% 45%" }}>
      {tarjetas.map((t, i) => {
        const d = i - idx;
        const ad = Math.abs(d);
        const sg = Math.sign(d);
        const x = sg * separacion * (ad <= 1 ? ad : 1 + (ad - 1) * 0.62);
        const ry = -sg * rotacion * Math.min(ad, 1);
        const z = -profundidad * Math.pow(Math.min(ad, 2.6), 0.9);
        const visible = Math.max(0, Math.min(1, 2.6 - ad));
        const heroe = Math.max(0, 1 - ad * 2);
        const pos = orden.findIndex((o) => o.i === i);
        const e = arrive(f, delay + staggerDelay(pos, n, Math.min(16, 3 * n)), 22, "arriveSoft");
        if (visible <= 0 || e <= 0) return null;
        const fondo = t.color ?? colorFondo;
        const texto = t.colorTexto ?? marca.colores.texto;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: ancho * u,
              height: alto * u,
              marginLeft: (-ancho / 2) * u,
              marginTop: (-alto / 2) * u,
              borderRadius: mix(heroe, 22, 30) * u,
              background: fondo,
              color: texto,
              overflow: "hidden",
              boxSizing: "border-box",
              border: `${2 * u}px solid ${heroe > 0.5 ? colorBorde : marca.colores.linea}`,
              boxShadow: `0 ${40 * u}px ${80 * u}px rgba(3,5,2,${0.35 + 0.25 * heroe})`,
              opacity: visible * Math.min(1, e / 0.6),
              zIndex: 100 - Math.round(ad * 10),
              transform: `translate3d(${x * u}px, ${(1 - e) * 90 * u}px, ${z * u}px) rotateY(${ry}deg)`,
              filter: `brightness(${1 - 0.4 * Math.min(ad, 1.4)}) blur(${(Math.min(ad, 2) * 2.2 + Math.min(3, vel * 30) + (1 - e) * 8) * u}px)`,
            }}
          >
            {t.contenido ?? (
              <div style={{ position: "absolute", inset: 0, padding: 34 * u, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: `${6 * u}px ${14 * u}px`,
                    borderRadius: 8 * u,
                    border: `${1.5 * u}px solid ${texto}`,
                    fontFamily: marca.fuenteMono,
                    fontSize: 18 * u,
                    letterSpacing: "0.06em",
                    opacity: 0.8,
                  }}
                >
                  {t.etiqueta ?? String(i + 1).padStart(2, "0")}
                </div>
                {/* Arte de relleno: bloques asimétricos, no un icono genérico (AI-28). */}
                <div style={{ position: "relative", flex: 1, margin: `${26 * u}px 0` }}>
                  <div style={{ position: "absolute", left: 0, top: "8%", width: "62%", height: "54%", borderRadius: 14 * u, background: texto, opacity: 0.14 }} />
                  <div style={{ position: "absolute", right: 0, top: "34%", width: "46%", height: "48%", borderRadius: 999, background: texto, opacity: 0.22 }} />
                  <div style={{ position: "absolute", left: "12%", bottom: 0, width: "30%", height: 8 * u, borderRadius: 4 * u, background: texto, opacity: 0.5 }} />
                </div>
                <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 64 * u, letterSpacing: "-0.03em", lineHeight: 0.95 }}>{t.titulo}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
