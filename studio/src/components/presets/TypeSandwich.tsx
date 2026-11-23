import { loadFont as cargarSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave, staggerDelay, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

// Instrument Serif (Instrument, SIL OFL 1.1): solo existe en 400, en redonda e itálica. Aquí se usa la itálica.
const serif = cargarSerif("italic", { weights: ["400"], subsets: ["latin"] });

type Props = {
  /** Líneas del titular. Las palabras entre asteriscos van en serif itálica de acento: "Lo que *nadie*". */
  lineas: string[];
  delay?: number;
  size?: number;
  /** Peso de la grotesca. */
  peso?: number;
  /** Escala óptica de la serif (su ojo medio es más bajo que el de la grotesca). */
  escalaSerif?: number;
  /** Cuadros que espera el acento después de que llega la última palabra grotesca. */
  esperaAcento?: number;
  exitAt?: number;
  color?: string;
  colorAcento?: string;
  fuente?: string;
  fuenteAcento?: string;
  alinear?: "izquierda" | "centro";
};

type Pieza = { texto: string; acento: boolean };

const piezas = (linea: string): Pieza[] =>
  linea
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .flatMap((trozo): Pieza[] =>
      trozo.startsWith("*")
        ? [{ texto: trozo.slice(1, -1), acento: true }]
        : trozo
            .split(" ")
            .filter(Boolean)
            .map((t) => ({ texto: t, acento: false })),
    );

const ritmo = (filas: Pieza[][], delay: number, esperaAcento: number) => {
  const grotescas = filas.flat().filter((p) => !p.acento).length;
  const acentos = filas.flat().filter((p) => p.acento).length;
  // Duración por grotesca: las que llegan después se asientan más lento (16 → 20 f).
  const durG = (g: number) => (grotescas <= 1 ? 18 : 16 + Math.round((4 * g) / (grotescas - 1)));
  const ventana = Math.min(16, grotescas * 3);
  // El acento arranca cuando la última grotesca ya llegó al 70 %.
  const t0Acento = delay + ventana + Math.round(durG(grotescas - 1) * 0.7) + esperaAcento;
  return { grotescas, acentos, durG, ventana, t0Acento };
};

/** Cuadros en que arranca cada pieza del titular (para que una plantilla mida sus huecos sin adivinar). */
export const tiemposSandwich = (lineas: string[], delay = 0, esperaAcento = 4): number[] => {
  const r = ritmo(lineas.map(piezas), delay, esperaAcento);
  return [
    ...Array.from({ length: r.grotescas }, (_, g) => delay + staggerDelay(g, r.grotescas, r.ventana)),
    ...Array.from({ length: r.acentos }, (_, a) => r.t0Acento + staggerDelay(a, r.acentos, 6)),
  ];
};

/**
 * Titular "sándwich": grotesca en peso alto con una (o dos) palabras de acento en serif itálica.
 * Técnica: la grotesca entra por palabra desde una máscara (sube 105 %, arriveSoft 18 f, stagger
 * no lineal); el acento NO comparte ese ritmo: espera a que llegue la última palabra grotesca y
 * entra después con otra curva (arriveGentle, 24 f) y otro gesto: se enfoca desde blur 14 px,
 * baja desde arriba y el tracking se cierra de +0,12 em a −0,01 em. Su hueco está reservado desde
 * el cuadro 0, así la línea no salta. Al salir, el acento se va primero y más rápido (leave 8 f)
 * y la grotesca lo sigue hacia abajo en la máscara.
 * Medido de: tiktok-7622319703679110421 (grotesca negra de tracking cerrado + serif itálica de
 * contraste en la palabra clave, entrada por palabra con blur), tiktok-7581551601349954824 (script +
 * grotesca 800 que entra con máscara de abajo arriba), tiktok-7671829994292776200 y
 * tiktok-7660733665353272583 (contraste de familias en el titular).
 */
export const TypeSandwich: React.FC<Props> = ({
  lineas,
  delay = 0,
  size = 150,
  peso = 700,
  escalaSerif = 1.16,
  esperaAcento = 4,
  exitAt,
  color = marca.colores.texto,
  colorAcento = marca.colores.acento,
  fuente = marca.fuenteTitulo,
  fuenteAcento = serif.fontFamily,
  alinear = "izquierda",
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const filas = lineas.map(piezas);
  const { grotescas, acentos, durG, ventana, t0Acento } = ritmo(filas, delay, esperaAcento);

  let g = -1;
  let a = -1;
  return (
    <div
      style={{
        fontFamily: fuente,
        fontWeight: peso,
        fontSize: size * u,
        lineHeight: 0.96,
        letterSpacing: "-0.045em",
        color,
        textAlign: alinear === "centro" ? "center" : "left",
      }}
    >
      {filas.map((fila, fi) => (
        <div key={fi} style={{ whiteSpace: "nowrap" }}>
          {fila.map((p, pi) => {
            const sep = pi < fila.length - 1 ? " " : "";
            if (!p.acento) {
              g += 1;
              const t0 = delay + staggerDelay(g, grotescas, ventana);
              const e = arrive(frame, t0, durG(g), "arriveSoft");
              const out = exitAt === undefined ? 0 : leave(frame, exitAt + 4 + staggerDelay(g, grotescas, 6), 12);
              return (
                <span key={pi}>
                  <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.06em" }}>
                    <span
                      style={{
                        display: "inline-block",
                        transform: `translateY(${(1 - e) * 105 + out * 105}%) rotate(${(1 - e) * 3}deg)`,
                        transformOrigin: "0% 100%",
                      }}
                    >
                      {p.texto}
                    </span>
                  </span>
                  {sep}
                </span>
              );
            }
            a += 1;
            const t0 = t0Acento + staggerDelay(a, acentos, 6);
            const e = arrive(frame, t0, 24, "arriveGentle");
            const asienta = tween(frame, t0, 30, "arriveSoft");
            const out = exitAt === undefined ? 0 : leave(frame, exitAt, 8, "leaveSoft");
            return (
              <span key={pi}>
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: fuenteAcento,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: `${escalaSerif}em`,
                    lineHeight: 0.8,
                    letterSpacing: `${0.12 - 0.13 * asienta}em`,
                    color: colorAcento,
                    opacity: Math.min(1, e / 0.6) * (1 - out),
                    transform: `translateY(${(1 - e) * -0.22 + out * 0.18}em)`,
                    filter: `blur(${(1 - e) * 14 * u + out * 10 * u}px)`,
                    paddingRight: "0.04em",
                  }}
                >
                  {p.texto}
                </span>
                {sep}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
