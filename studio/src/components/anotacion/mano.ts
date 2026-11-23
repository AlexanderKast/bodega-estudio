import { getLength, getPointAtLength } from "@remotion/paths";
import { random } from "remotion";
import type { Punto } from "../../lib/anclas";

/**
 * Generador de línea a mano. Toma un path limpio, lo muestrea y desplaza cada punto sobre su normal
 * con un ruido lento (el pulso de la mano, no vibración). Es determinista: la misma semilla da el
 * mismo trazo en cada cuadro y en cada máquina. Los extremos casi no se desvían, así una flecha
 * sigue saliendo y llegando donde debe.
 */

/** Curva suave por una lista de puntos (Catmull-Rom → Bézier cúbica). */
export const suavizar = (pts: Punto[]): string => {
  if (pts.length < 2) return "";
  const f = (n: number) => n.toFixed(2);
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
};

/** Puntos sobre un path cada `paso` px (mínimo 2). */
export const muestrear = (d: string, paso = 14): Punto[] => {
  const largo = getLength(d);
  const n = Math.max(2, Math.ceil(largo / paso));
  const pts: Punto[] = [];
  for (let i = 0; i <= n; i++) {
    const p = getPointAtLength(d, (largo * i) / n);
    if (p) pts.push({ x: p.x, y: p.y });
  }
  return pts;
};

/** Ruido lento en 1D: un valor al azar cada `cada` puntos, unidos con coseno. */
const pulso = (semilla: string, i: number, cada: number) => {
  const t = i / cada;
  const k = Math.floor(t);
  const a = random(`${semilla}-${k}`) * 2 - 1;
  const b = random(`${semilla}-${k + 1}`) * 2 - 1;
  return a + (b - a) * ((1 - Math.cos((t - k) * Math.PI)) / 2);
};

/** Desvía los puntos sobre su normal. `anclar` reduce la desviación en los extremos. */
export const temblar = (
  pts: Punto[],
  amp: number,
  semilla: string,
  anclar = true,
): Punto[] =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    const t = i / (pts.length - 1);
    const peso = anclar ? Math.min(1, 5 * t, 5 * (1 - t)) : 1;
    const n =
      (pulso(semilla, i, 5) * 0.75 + pulso(`${semilla}-f`, i, 2) * 0.25) *
      amp *
      peso;
    return { x: p.x + (-dy / l) * n, y: p.y + (dx / l) * n };
  });

const cache = new Map<string, string>();

/** Versión a mano de un path. Con `temblor` 0 devuelve el path tal cual (piel vector). */
export const aMano = (
  d: string,
  temblor: number,
  semilla: string,
  anclar = true,
): string => {
  if (temblor <= 0) return d;
  const k = `${d}|${temblor}|${semilla}|${anclar}`;
  let r = cache.get(k);
  if (!r) {
    r = suavizar(temblar(muestrear(d), temblor, semilla, anclar));
    if (cache.size > 4000) cache.clear();
    cache.set(k, r);
  }
  return r;
};

/**
 * Cuánto tarda un gesto de énfasis (círculo, flecha, subrayado): 6–12 cuadros y casi no crece con
 * el tamaño. Medido en referentes: flechas de 150–320 px en 6–12 f, círculo de 1.300 px en 9 f (kb/17 §2).
 */
export const durTrazo = (d: string) =>
  Math.min(12, Math.max(6, Math.round(5 + 0.2 * Math.sqrt(getLength(d)))));

/** Cuánto tarda un trazo de construcción (ruta, contorno de diagrama): unos 9 px por cuadro (kb/17 §2). */
export const durRuta = (d: string) =>
  Math.min(100, Math.max(18, Math.round(getLength(d) / 9)));

/** Caja que contiene un path, con margen (para el área de los filtros SVG). */
export const cajaDe = (d: string, margen = 24) => {
  const pts = muestrear(d, 24);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs) - margen;
  const y = Math.min(...ys) - margen;
  return {
    x,
    y,
    ancho: Math.max(...xs) - x + margen,
    alto: Math.max(...ys) - y + margen,
  };
};
