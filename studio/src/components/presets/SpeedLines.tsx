import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave, semilla } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  /** "radial": líneas de foco hacia un punto (impacto, revelación); "paralelo": velocidad lateral. */
  tipo?: "radial" | "paralelo";
  /** Cuadro en que aparecen y cuántos duran: 6–18 f, nunca de fondo permanente (kb/13 estilo 8). */
  at?: number;
  dur?: number;
  /** Foco del radial, en 0–1. */
  fx?: number;
  fy?: number;
  /** Radio libre alrededor del foco, en fracción del lado corto: ahí va el sujeto. */
  hueco?: number;
  cantidad?: number;
  color?: string;
  /** Cuadros por dibujo: 2 f = líneas redibujadas a 15 fps, como en animación limitada. */
  cada?: number;
  seed?: string;
};

/**
 * Líneas de velocidad de anime (estilo 8, kb/13). Cuñas finas que salen del borde hacia el foco y dejan un
 * hueco limpio para el sujeto; se redibujan con otra semilla cada 2 f (animación limitada, no un giro
 * continuo). Entran en 3 f y se van en 4 f: acompañan una acción de 3–4 f, no decoran un plano quieto.
 */
export const SpeedLines: React.FC<Props> = ({
  tipo = "radial",
  at = 0,
  dur = 12,
  fx = 0.5,
  fy = 0.5,
  hueco = 0.32,
  cantidad = 110,
  color = marca.colores.texto,
  cada = 2,
  seed = "speed",
}) => {
  const frame = useCurrentFrame();
  const { u, ancho, alto } = useEscala();
  const vis = arrive(frame, at, 3, "arriveGentle") * (1 - leave(frame, at + dur - 4, 4, "leave"));
  if (vis <= 0) return null;
  const s = semilla(frame, cada);
  const cx = fx * ancho;
  const cy = fy * alto;
  const R = Math.hypot(ancho, alto);
  const r0 = hueco * Math.min(ancho, alto);
  const formas: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const rnd = (k: string) => random(`${seed}-${s}-${i}-${k}`);
    if (tipo === "radial") {
      const ang = ((i + rnd("a") * 0.8) / cantidad) * Math.PI * 2;
      const grosor = (0.0006 + rnd("g") * 0.0035) * Math.PI;
      const dentro = r0 * (1 + rnd("l") * rnd("l2") * 1.6);
      const p = (r: number, a: number) => `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
      formas.push(`M ${p(dentro, ang)} L ${p(R, ang - grosor)} L ${p(R, ang + grosor)} Z`);
    } else {
      const y = (i / cantidad + rnd("y") * 0.02) * alto;
      const largo = (0.25 + rnd("l") * 0.55) * ancho;
      const x0 = rnd("x") * (ancho - largo);
      const g = (1 + rnd("g") * 3) * u;
      formas.push(`M ${x0},${y} L ${x0 + largo},${y - g / 2} L ${x0 + largo},${y + g / 2} Z`);
    }
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: vis }}>
      <svg width={ancho} height={alto}>
        <path d={formas.join(" ")} fill={color} />
      </svg>
    </AbsoluteFill>
  );
};
