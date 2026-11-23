import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, enterStyle, mix, staggerDelay, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  lines: string[];
  /** "letra": cada letra sube y baja en la onda. "linea": cada línea ondea entera como bandera. */
  mode?: "letra" | "linea";
  size?: number;
  delay?: number;
  /** Amplitud máxima de la onda en px sobre 1080. */
  amplitude?: number;
  /** Letras por ciclo de onda (longitud de onda). */
  wavelength?: number;
  /** Ciclos por segundo. */
  speed?: number;
  /** Desfase de la onda entre líneas, en ciclos. */
  linePhase?: number;
  /** Cuadro en que la onda se asienta. Por defecto, 40 f después de entrar. */
  settleAt?: number;
  /** Fracción de amplitud que queda viva después de asentarse (0 = quieto). */
  rest?: number;
  /** Índice de línea en acento (-1 = ninguna). */
  accentLine?: number;
  color?: string;
  accent?: string;
};

/**
 * Texto que ondula por letra (kb/13, técnica TextWarp). Una onda senoidal recorre la palabra: cada letra se
 * desplaza en Y, se inclina con la pendiente de la onda y se estira un poco en la cresta (squash & stretch),
 * que es lo que la hace leer "líquida". La amplitud entra con arriveSoft y se asienta con glide hasta `rest`,
 * así la onda tiene un golpe y después respira. Las líneas entran con stagger no lineal y llevan un desfase
 * de fase, la ola baja en diagonal. Variante "linea": la línea entera se cizalla y se corre en X como una
 * bandera. Sale de los pins e1_AfqPShy-JpsbFRmhvKl81naCOgoAJwD-6GwgiJepWdSjPq7GPZvz5w (LIQUID en 3 filas),
 * e1_AfqPShxwsgH4arkYlCCHhBElKbgTvHNWWb4g1HDPrUPzs8eywqI2 (ripple creciente por fila) y
 * e1_AfqPShyWnRz5S2M8hghDy-EdL93HR77YL6fuxE2-S80ZoR_LCY6_hg (bloque como bandera).
 */
export const TextWarp: React.FC<Props> = ({
  lines,
  mode = "letra",
  size = 190,
  delay = 0,
  amplitude = 34,
  wavelength = 5,
  speed = 0.55,
  linePhase = 0.18,
  settleAt,
  rest = 0.3,
  accentLine = -1,
  color = marca.colores.texto,
  accent = marca.colores.acento,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const t = frame / fps;
  const settle = settleAt ?? delay + 40;
  // Envolvente: entra con golpe y se asienta. La onda en sí es periódica a propósito (es la técnica).
  const env = arrive(frame, delay, 24, "arriveSoft") * mix(tween(frame, settle, 36, "glide"), 1, rest);
  const A = amplitude * u * env;

  return (
    <div
      style={{
        fontFamily: marca.fuenteTitulo,
        fontWeight: 700,
        fontSize: size * u,
        lineHeight: 0.92,
        letterSpacing: "-0.04em",
        textTransform: "uppercase",
      }}
    >
      {lines.map((line, li) => {
        const start = delay + staggerDelay(li, lines.length, Math.min(14, lines.length * 4));
        const p = arrive(frame, start, 18, "arrive");
        const fill = li === accentLine ? accent : color;
        if (mode === "linea") {
          const ph = 2 * Math.PI * (speed * t - li * linePhase);
          return (
            <div key={li} style={{ ...enterStyle(p, 40 * u), color: fill }}>
              <div
                style={{
                  transform: `translateX(${Math.sin(ph) * A * 1.4}px) skewX(${Math.cos(ph) * (A / u) * 0.35}deg)`,
                  transformOrigin: "50% 100%",
                  whiteSpace: "pre",
                }}
              >
                {line}
              </div>
            </div>
          );
        }
        return (
          <div key={li} style={{ ...enterStyle(p, 40 * u), color: fill, whiteSpace: "pre" }}>
            {[...line].map((c, ci) => {
              const ph = 2 * Math.PI * (speed * t - ci / wavelength - li * linePhase);
              const k = A / Math.max(1, amplitude * u); // 0–1: cuánto de la onda está viva
              return (
                <span
                  key={ci}
                  style={{
                    display: "inline-block",
                    transform: `translateY(${Math.sin(ph) * A}px) rotate(${Math.cos(ph) * 7 * k}deg) scaleY(${1 - Math.sin(ph) * 0.1 * k})`,
                    transformOrigin: "50% 100%",
                  }}
                >
                  {c}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
