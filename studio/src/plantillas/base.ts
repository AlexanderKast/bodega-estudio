import { zColor } from "@remotion/zod-types";
import { staticFile } from "remotion";
import { z } from "zod";
import type { Formato } from "../lib/formatos";
import { tween } from "../lib/motion";
import { marca } from "../marca/marca";

/**
 * Piezas compartidas de las plantillas replicadas desde referencias (kb/14-plantillas.md).
 * Cada plantilla declara sus props con zod: Remotion Studio las muestra en el panel de props y
 * `remotion render --props=archivo.json` las acepta, así la misma plantilla sirve para cualquier cliente.
 */

/** Colores sobre la marca activa. Vacío = marca del estudio. */
export const zColores = z
  .object({
    fondo: zColor().optional(),
    texto: zColor().optional(),
    acento: zColor().optional(),
  })
  .default({});

export const colores = (c: z.infer<typeof zColores>) => ({
  fondo: c.fondo ?? marca.colores.fondo,
  texto: c.texto ?? marca.colores.texto,
  acento: c.acento ?? marca.colores.acento,
  superficie: marca.colores.superficie,
});

/** Media del cliente: ruta dentro de `studio/public/` o URL. Vacío = panel de color (para maquetar sin material). */
export const zMedia = z.string().default("").describe("ruta en public/ o URL; vacío = panel liso");

export const resolverMedia = (m: string) => (/^https?:\/\//.test(m) ? m : staticFile(m.replace(/^\/+/, "")));
export const esVideo = (m: string) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(m);

/** Plantilla registrable: el componente recibe sus props ya validadas; la duración sale de las props. */
export type Plantilla<S extends z.ZodObject> = {
  id: string;
  /** De qué referencia viene (ficha en referentes/fichas/). */
  fuente: string;
  /** Qué hace, en una frase. Sale tal cual en el catálogo (`catalogo/plantillas.json`). */
  resumen: string;
  /** Para qué tipo de pieza conviene elegirla. Es lo que lee quien busca una plantilla sin conocerlas. */
  cuando: string;
  schema: S;
  componente: React.FC<z.infer<S>>;
  defaultProps: z.infer<S>;
  duracion: (props: z.infer<S>) => number;
  formatos: readonly Formato[];
};

// Las plantillas viven en un arreglo heterogéneo: el tipo genérico se borra al registrarlas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PlantillaRegistrada = Plantilla<any>;

export const definir = <S extends z.ZodObject>(p: Plantilla<S>): PlantillaRegistrada => p;

/**
 * Cuadros donde meter un evento de relleno para que ningún tramo entre `eventos` (cuadros locales en que de
 * verdad arranca algo) pase de `max` cuadros sin animación (ritmo de anuncio, motion-audit D-01). Los huecos se
 * parten en partes iguales con un swing de ±2 f para no caer en metrónomo (AI-11). Pasar solo inicios seguros:
 * un evento listado que no existe tapa un hueco que sigue ahí.
 */
export const rellenarHuecos = (eventos: number[], fin: number, max = 24) => {
  const ts = [...new Set([0, ...eventos.filter((t) => t >= 0 && t < fin).map(Math.round), Math.round(fin)])].sort((a, b) => a - b);
  const extra: number[] = [];
  for (let i = 1; i < ts.length; i++) {
    const gap = ts[i] - ts[i - 1];
    if (gap <= max) continue;
    const k = Math.ceil(gap / max) - 1;
    for (let j = 1; j <= k; j++) extra.push(Math.round(ts[i - 1] + (gap * j) / (k + 1) + (j % 2 ? 2 : -2)));
  }
  return extra;
};

/**
 * Micro re-encuadre de cámara en cada cuadro de relleno: escala ±1,2 % y giro ±0,4° con glide (16–24 f).
 * Alterna el sentido, así en una pieza larga el encuadre oscila en vez de acumular zoom.
 */
export const microReencuadre = (frame: number, rellenos: number[]) => {
  let s = 1;
  let rz = 0;
  rellenos.forEach((t, j) => {
    const k = tween(frame, t, 16 + (j % 3) * 4, "glide");
    const dir = j % 2 ? -1 : 1;
    s += dir * 0.012 * k;
    rz += dir * 0.4 * k;
  });
  return `scale(${s.toFixed(5)}) rotate(${rz.toFixed(4)}deg)`;
};
