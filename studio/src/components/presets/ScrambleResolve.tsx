import { random, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, semilla, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  text: string;
  delay?: number;
  /** Cuadros hasta que resuelve la última letra. Por defecto 1,5 f por letra, máximo 24 f. */
  duration?: number;
  size?: number;
  font?: "mono" | "titulo";
  seed?: string;
};

const GLIFOS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/<>*+=";

/**
 * Texto que se descifra (estilo 18 coded y 1 suizo, kb/13 §2). Cada letra muestra glifos con semilla
 * que cambia cada 2 f (15 fps de "ruido" legible, no estática) hasta fijarse en su turno de un stagger
 * no lineal. Un clip-path con curva arrive descubre la línea por delante del descifrado.
 * Mono por defecto: el ancho fijo evita que la línea tiemble mientras cambian los glifos.
 * Reimplementado desde cero (la referencia de react-bits es MIT + Commons Clause, kb/13 §4).
 */
export const ScrambleResolve: React.FC<Props> = ({
  text,
  delay = 0,
  duration,
  size = 110,
  font = "mono",
  seed = "scramble",
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const chars = [...text];
  const total = duration ?? Math.min(24, Math.round(chars.length * 1.5));
  const reveal = arrive(frame, delay, Math.max(6, Math.round(total * 0.6)), "arriveSoft");
  const tick = semilla(frame, 2);
  return (
    <div
      style={{
        fontFamily: font === "mono" ? marca.fuenteMono : marca.fuenteTitulo,
        fontWeight: font === "mono" ? 600 : 700,
        fontSize: size * u,
        letterSpacing: font === "mono" ? "-0.02em" : "-0.04em",
        lineHeight: 1,
        whiteSpace: "pre",
        color: marca.colores.texto,
        clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
      }}
    >
      {chars.map((c, i) => {
        const lockAt = delay + 4 + staggerDelay(i, chars.length, total);
        const locked = frame >= lockAt || c === " ";
        const glyph = locked ? c : GLIFOS[Math.floor(random(`${seed}-${i}-${tick}`) * GLIFOS.length)];
        // La letra recién fijada toma el acento 3 f y vuelve al texto: marca el "clic" del descifrado.
        const fresh = locked && c !== " " && frame - lockAt < 3;
        return (
          <span key={i} style={{ color: locked ? (fresh ? marca.colores.acento : marca.colores.texto) : marca.colores.suave }}>
            {glyph}
          </span>
        );
      })}
    </div>
  );
};
