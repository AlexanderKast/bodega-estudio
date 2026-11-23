import { AbsoluteFill, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, mix, staggerDelay, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  /** Palabra que se repite en los cuatro lados de cada anillo. */
  word: string;
  /** Palabra al fondo del túnel (opcional). */
  center?: string;
  rings?: number;
  /** Separación entre anillos en px sobre 1080. */
  gap?: number;
  /** Cuántos anillos avanza la cámara durante el push. */
  push?: number;
  delay?: number;
  /** Cuadros del push: arranca, toma velocidad y frena (curva move). */
  duration?: number;
  /** Lado del anillo en px sobre 1080 (la boca del túnel). */
  ring?: number;
  /** Perspectiva CSS en px sobre 1080: menor = más gran angular. */
  perspective?: number;
  /** Giro de cámara durante el push, en grados. */
  roll?: number;
  /** Cada cuántos anillos va uno en acento (0 = ninguno). */
  accentEvery?: number;
  color?: string;
  accent?: string;
  /** Color hacia el que se funden los anillos lejanos (niebla). */
  fog?: string;
};

/**
 * Túnel de anillos de texto con push de cámara (kb/13, técnica TextTunnel). Cada anillo es un marco cuadrado
 * con la palabra corriendo por sus cuatro lados, colocado en Z con perspectiva CSS 3D. La cámara avanza
 * `push` anillos con la curva `move`: arranca, toma velocidad y frena. Los anillos se reciclan en módulo
 * (el que pasa la cámara vuelve al fondo) y la profundidad los apaga hacia `fog`, así no hay saltos. Los
 * anillos aparecen del fondo hacia la boca con stagger no lineal antes del push. Sale de los pins
 * e1_AfqPShyzb2-W_PEUPD9aU0l0Sz_oERklfRHU0rlEichg283mEQ3d (corredor de texto con palabra al fondo),
 * e1_AfqPShy-V7kAuxfFcquUqJzl8vVID6aHePorHdyCECA-4eFQ7hk7 (cuadros concéntricos, zoom infinito) y
 * e1_AfqPShwiE7W3Pucf2XK1piFz_5I5OpukVteXswRUcr-NG4WamiU3 (cámara que varía la distancia).
 */
export const TextTunnel: React.FC<Props> = ({
  word,
  center,
  rings = 9,
  gap = 300,
  push = 3,
  delay = 0,
  duration = 96,
  ring = 980,
  perspective = 760,
  roll = 6,
  accentEvery = 4,
  color = marca.colores.texto,
  accent = marca.colores.acento,
  fog = marca.colores.fondo,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const G = gap * u;
  const depth = rings * G;
  const intro = 16; // los anillos terminan de aparecer antes del push
  const camP = tween(frame, delay + intro, duration, "move");
  const cam = camP * push * G;
  const side = ring * u;
  const fs = side * 0.105;
  const strip = `${word.toUpperCase()} · `.repeat(6);

  const sideStrip = (rot: number, fill: string) => (
    <div
      key={rot}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: side,
        height: fs * 1.05,
        marginLeft: -side / 2,
        marginTop: -fs * 0.525,
        transform: `rotate(${rot}deg) translateY(${-side / 2 + fs * 0.525}px)`,
        overflow: "hidden",
        whiteSpace: "nowrap",
        fontFamily: marca.fuenteTitulo,
        fontWeight: 700,
        fontSize: fs,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        color: fill,
        textAlign: "center",
      }}
    >
      <span style={{ display: "inline-block", transform: "translateX(-25%)" }}>{strip}</span>
    </div>
  );

  return (
    <AbsoluteFill style={{ perspective: perspective * u, perspectiveOrigin: "50% 50%", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformStyle: "preserve-3d", transform: `rotateZ(${mix(camP, 0, roll)}deg)` }}>
        {center ? (
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `translateZ(${-depth + G * 0.5 + cam * 0.35}px)`,
              opacity: arrive(frame, delay + 10, 20, "arriveSoft"),
            }}
          >
            <div
              style={{
                fontFamily: marca.fuenteTitulo,
                fontWeight: 700,
                fontSize: side * 0.42,
                letterSpacing: "-0.05em",
                lineHeight: 0.9,
                color: accent,
                textTransform: "uppercase",
              }}
            >
              {center}
            </div>
          </AbsoluteFill>
        ) : null}
        {Array.from({ length: rings }, (_, i) => {
          // Z del anillo con la cámara aplicada, reciclado en [-depth, 0).
          const raw = -i * G + cam;
          const z = (((raw % depth) + depth) % depth) - depth + G * 0.2;
          const near = Math.min(1, Math.max(0, -z / (G * 0.8))); // se apaga al rozar la cámara
          const far = 1 - Math.min(1, Math.max(0, -z / depth)) ** 1.6; // niebla hacia el fondo
          // Los anillos cercanos (más grandes en pantalla) tardan más en asentarse que los del fondo.
          const durAnillo = rings <= 1 ? 14 : 16 - Math.round((4 * i) / (rings - 1));
          const appear = arrive(frame, delay + staggerDelay(rings - 1 - i, rings, intro - 4), durAnillo, "arriveSoft");
          const fill = accentEvery > 0 && i % accentEvery === 0 ? accent : color;
          return (
            <AbsoluteFill key={i} style={{ transform: `translateZ(${z}px)`, opacity: near * far * appear }}>
              {[0, 90, 180, 270].map((r) => sideStrip(r, fill))}
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% 50%, transparent 40%, ${fog} 100%)`, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
