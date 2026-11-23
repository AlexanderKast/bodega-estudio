import { getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import type { Punto } from "./anclas";

/**
 * Seguir un path con orientación por la tangente (Auto-Orient de After Effects). `p` va de 0 a 1.
 * Devuelve posición y ángulo en grados, listos para una `<Capa>`.
 */
export const enTrayecto = (d: string, p: number, orientar = true): { x: number; y: number; rot: number } => {
  const largo = getLength(d);
  const l = Math.max(0, Math.min(1, p)) * largo;
  const pt = getPointAtLength(d, l) ?? { x: 0, y: 0 };
  if (!orientar) return { x: pt.x, y: pt.y, rot: 0 };
  // En los extremos la tangente puede degenerar: se mide un poco hacia adentro.
  const tg = getTangentAtLength(d, Math.max(0.01, Math.min(largo - 0.01, l))) ?? { x: 1, y: 0 };
  return { x: pt.x, y: pt.y, rot: (Math.atan2(tg.y, tg.x) * 180) / Math.PI };
};

/**
 * Curva suave entre dos puntos, como la traza una mano: un arco cuya panza es `curvatura` veces la
 * distancia (positivo curva a la izquierda del sentido de avance). Base de flechas y conectores.
 */
export const curvaEntre = (a: Punto, b: Punto, curvatura = 0.18): string => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = mx + dy * curvatura;
  const cy = my - dx * curvatura;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};
