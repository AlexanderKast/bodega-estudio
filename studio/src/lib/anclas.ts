/**
 * Transformaciones 2D encadenadas, para saber dónde queda en el mundo un punto de una capa que
 * cuelga de otra (el `toComp` de After Effects). Con esto una flecha o una etiqueta se pega a un
 * objeto aunque su padre se mueva, gire o escale.
 *
 * Uso: calcula las transformaciones de la escena una vez por cuadro (un objeto `escena(frame)`),
 * pásalas a las `<Capa>` y pide aquí los puntos que necesiten las anotaciones.
 */
export type Punto = { x: number; y: number };
export type Xf = {
  x?: number;
  y?: number;
  rot?: number; // grados
  escala?: number | [number, number];
  pivote?: [number, number]; // punto de la capa (px) alrededor del que gira y escala
};

/** Matriz afín [a, b, c, d, e, f] como la de CSS `matrix()`. */
export type Matriz = [number, number, number, number, number, number];
export const IDENTIDAD: Matriz = [1, 0, 0, 1, 0, 0];

export const mult = (m: Matriz, n: Matriz): Matriz => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

export const escalaXY = (e: Xf["escala"]): [number, number] => (Array.isArray(e) ? e : [e ?? 1, e ?? 1]);

/** Matriz de una capa: mueve a (x, y) y gira/escala alrededor de su pivote. */
export const matriz = (xf: Xf): Matriz => {
  const [sx, sy] = escalaXY(xf.escala);
  const [px, py] = xf.pivote ?? [0, 0];
  const r = ((xf.rot ?? 0) * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const a = cos * sx;
  const b = sin * sx;
  const c = -sin * sy;
  const d = cos * sy;
  return [a, b, c, d, (xf.x ?? 0) + px - (a * px + c * py), (xf.y ?? 0) + py - (b * px + d * py)];
};

export const aplicar = (m: Matriz, p: Punto): Punto => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });

/**
 * Posición en el mundo de un punto local de la última capa de la cadena (de padre a hijo).
 * `enMundo([brazo, mano], { x: 40, y: 0 })` da dónde está la punta de la mano.
 */
export const enMundo = (cadena: Xf[], punto: Punto = { x: 0, y: 0 }): Punto =>
  aplicar(
    cadena.reduce<Matriz>((m, xf) => mult(m, matriz(xf)), IDENTIDAD),
    punto,
  );

/** Punto del borde de un rectángulo centrado en `centro` mirando hacia `hacia` (para que una flecha no pise el objeto). */
export const bordeHacia = (centro: Punto, ancho: number, alto: number, hacia: Punto, margen = 0): Punto => {
  const dx = hacia.x - centro.x;
  const dy = hacia.y - centro.y;
  if (dx === 0 && dy === 0) return centro;
  const k = Math.min((ancho / 2 + margen) / Math.abs(dx || 1e-9), (alto / 2 + margen) / Math.abs(dy || 1e-9));
  return { x: centro.x + dx * k, y: centro.y + dy * k };
};
