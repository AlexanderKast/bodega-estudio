import { createContext, useContext } from "react";
import { marca } from "../marca/marca";

/**
 * Luz de la escena: una sola dirección para todas las sombras. En After Effects es la luz de la
 * comp; aquí es un contexto. `<Luz angulo={…}>` (o `<Look luz={…}>` cuando envuelve la escena) la
 * fija una vez, y la leen `CutoutObject` y las `<Capa sombra>` del rig: así un recorte y una pieza
 * animada por partes proyectan la sombra hacia el mismo lado, con el mismo largo y el mismo color.
 */
export type LuzEscena = {
  /** Hacia dónde cae la sombra, en grados (0 = derecha, 90 = abajo). */
  angulo: number;
  /** Largo de la sombra con el objeto apoyado, en px a 1080. */
  largo: number;
  /** Opacidad de la sombra larga (la de contacto va más densa y más corta). */
  opacidad: number;
  /** Color de la sombra: la tinta del soporte, nunca negro puro. */
  color: string;
};

/** La luz que `CutoutObject` traía fija: sin `<Luz>` nada cambia. */
export const LUZ_BASE: LuzEscena = { angulo: 38, largo: 46, opacidad: 0.3, color: marca.colores.sombraCalida };

const LuzCtx = createContext<LuzEscena>(LUZ_BASE);

export const Luz: React.FC<Partial<LuzEscena> & { children: React.ReactNode }> = ({ children, ...luz }) => {
  const base = useContext(LuzCtx);
  return <LuzCtx.Provider value={{ ...base, ...luz }}>{children}</LuzCtx.Provider>;
};

export const useLuz = (): LuzEscena => useContext(LuzCtx);

/**
 * Geometría de las dos sombras de un objeto a cierta `altura` sobre el soporte (0 = apoyado,
 * 1 = en el aire): la larga se aleja, se difumina y se aclara al subir; la de contacto es corta y
 * densa y desaparece cuando el objeto despega. Valores en px de pantalla (`u` = escala del lienzo).
 */
export const sombrasDeLuz = (luz: LuzEscena, altura = 0, u = 1) => {
  const a = (luz.angulo * Math.PI) / 180;
  const largo = (luz.largo + altura * 70) * u;
  const dx = Math.cos(a) * largo;
  const dy = Math.sin(a) * largo;
  return {
    larga: { dx, dy, desenfoque: ((10 + altura * 26) * u) / 2, opacidad: luz.opacidad * (1 - altura * 0.45) },
    contacto: {
      dx: dx * 0.1,
      dy: dy * 0.1 + 3 * u,
      desenfoque: (2 + altura * 8) * u,
      opacidad: luz.opacidad * 1.8 * Math.max(0, 1 - altura * 1.6),
    },
    color: luz.color,
  };
};

/** Lleva un desplazamiento de pantalla al espacio de una capa girada `rot` grados y escalada `escala`. */
export const aEspacioLocal = (dx: number, dy: number, rot: number, escala = 1): [number, number] => {
  const r = (-rot * Math.PI) / 180;
  const e = escala || 1;
  return [(Math.cos(r) * dx - Math.sin(r) * dy) / e, (Math.sin(r) * dx + Math.cos(r) * dy) / e];
};

const tinta = (color: string, opacidad: number) =>
  `color-mix(in srgb, ${color} ${(Math.max(0, Math.min(1, opacidad)) * 100).toFixed(1)}%, transparent)`;

/**
 * Las mismas dos sombras como `filter` de CSS (`drop-shadow` sigue la silueta real de la capa).
 * `rot` y `escala` son los acumulados de la capa, para que la sombra caiga hacia la luz aunque la
 * capa gire.
 */
export const filtroSombra = (luz: LuzEscena, altura = 0, o: { rot?: number; escala?: number; u?: number } = {}) => {
  const { rot = 0, escala = 1, u = 1 } = o;
  const s = sombrasDeLuz(luz, altura, u);
  const una = (x: { dx: number; dy: number; desenfoque: number; opacidad: number }) => {
    const [ox, oy] = aEspacioLocal(x.dx, x.dy, rot, escala);
    // En drop-shadow el radio es el doble de la desviación estándar del desenfoque.
    return `drop-shadow(${ox.toFixed(2)}px ${oy.toFixed(2)}px ${((x.desenfoque * 2) / (escala || 1)).toFixed(2)}px ${tinta(s.color, x.opacidad)})`;
  };
  return `${una(s.contacto)} ${una(s.larga)}`;
};
