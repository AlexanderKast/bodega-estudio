import { useId } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { posterizeTime, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

/**
 * Borde rasgado procedural: devuelve los puntos (en 0–1 a lo largo del borde) de un corte de papel con dos
 * escalas de ruido, dientes grandes + fibra fina, determinista por semilla. Es el sustituto del kit de bordes
 * escaneados hasta que haya escaneos propios (kb/13 §5: pendiente, con su licencia en CREDITOS.md).
 */
export const bordeRasgado = (seed: string, n = 90, amplitud = 1) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const grueso = random(`${seed}-g-${Math.floor(i / 6)}`) * 0.7;
    const fino = random(`${seed}-f-${i}`) * 0.3;
    return { t, o: (grueso + fino) * amplitud };
  });

type Props = {
  children: React.ReactNode;
  /** Cuadro en que el papel se arranca. */
  at?: number;
  /** Cuadros que tarda en salir el pedazo de arriba: 8–14, posterizado en 2s o 3s (pose a pose). */
  dur?: number;
  /** Altura del rasgado como fracción del alto (0–1). */
  y?: number;
  /** Amplitud de los dientes en px a 1080. */
  dientes?: number;
  /** Papel del pedazo que se va. */
  papel?: string;
  /** Lo que queda abajo (por defecto, el children va arriba y se arranca). */
  debajo?: React.ReactNode;
  cada?: number;
  seed?: string;
};

/**
 * Papel rasgado (estilo 5 collage, kb/13). La escena de arriba (`children`) es un papel que se arranca por
 * un borde dentado y deja ver `debajo`. El borde muestra la fibra blanca del corte, sombra de contacto, y
 * el pedazo sale girando con tiempo posterizado (pose a pose, sin suavidad digital), que es el ritmo del
 * collage. Sin escaneos: el borde es procedural (`bordeRasgado`).
 */
export const PaperTear: React.FC<Props> = ({
  children,
  at = 12,
  dur = 12,
  y = 0.55,
  dientes = 26,
  papel = "#EDE6D6",
  debajo,
  cada = 3,
  seed = "rasgado",
}) => {
  const frame = useCurrentFrame();
  const { u, ancho, alto } = useEscala();
  const id = `tear${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // La auditoría lee el evento en el cuadro real; el movimiento usa el tiempo posterizado (pose a pose).
  tween(frame, at, dur, "leaveSoft");
  const t = tween(posterizeTime(frame, cada), at, dur, "leaveSoft");
  const borde = bordeRasgado(seed, 90, dientes * u);
  const base = y * alto;
  const linea = borde.map((p) => `${(p.t * ancho).toFixed(1)},${(base + p.o).toFixed(1)}`).join(" L ");
  // Pedazo de arriba: polígono de 0 al borde. La fibra es una franja clara siguiendo el mismo borde, corrida.
  const arriba = `M 0,0 L ${ancho},0 L ${linea.split(" L ").reverse().join(" L ")} Z`;
  const fibra = borde.map((p) => `${(p.t * ancho).toFixed(1)},${(base + p.o * 1.35 + 5 * u).toFixed(1)}`).join(" L ");
  // Contorno total del pedazo: hasta el borde de la fibra, que queda un poco más abajo que el de la imagen.
  const pedazo = `M 0,0 L ${ancho},0 L ${fibra.split(" L ").reverse().join(" L ")} Z`;
  const dy = -t * alto * 0.9;
  const rot = -t * 9;
  return (
    <AbsoluteFill>
      <AbsoluteFill>{debajo}</AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `translateY(${dy}px) rotate(${rot}deg)`,
          transformOrigin: "0% 0%",
          filter: `drop-shadow(0 ${10 * u}px ${14 * u}px rgba(20,14,6,0.35))`,
        }}
      >
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <clipPath id={id} clipPathUnits="userSpaceOnUse">
            <path d={pedazo} />
          </clipPath>
        </svg>
        <AbsoluteFill style={{ clipPath: `url(#${id})` }}>
          <AbsoluteFill style={{ background: papel }} />
          <AbsoluteFill style={{ clipPath: `path('${arriba}')` }}>{children}</AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
