import { interpolate } from "remotion";
import { auditEvent, sinAuditar } from "./audit";
import { curves, inertialBounce, type CurveName } from "./motion";

/**
 * Keyframes de varios valores con curva por tramo: el equivalente a la línea de tiempo y el
 * graph editor de After Effects. `motion.ts` da tramos 0→1 sueltos; aquí una propiedad pasa por
 * A → B → C → D y cada tramo lleva su propia curva.
 *
 * Los tiempos van en cuadros locales del componente. La curva de un keyframe es la del tramo que
 * LLEGA a él. "hold" mantiene el valor anterior y salta al llegar (keyframe de retención).
 */
export type Curva = CurveName | "hold";
export type Key = { t: number; v: number; curva?: Curva };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const tramo = (frame: number, a: number, b: number, curva: Curva) =>
  curva === "hold" ? (frame >= b ? 1 : 0) : interpolate(frame, [a, b], [0, 1], { easing: curves[curva], ...clamp });

/** Valor de una propiedad en el cuadro `frame` según sus keyframes (ordenados por `t`). */
export const track = (frame: number, keys: Key[]): number => {
  if (keys.length === 0) return 0;
  let v = keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    const curva = b.curva ?? "move";
    if (b.v !== a.v && curva !== "hold") {
      auditEvent(frame, a.t, { kind: "tween", duration: b.t - a.t, curve: curva, dist: Math.abs(b.v - a.v) });
    }
    if (frame >= a.t) v = a.v + (b.v - a.v) * tramo(frame, a.t, b.t, curva);
  }
  return v;
};

/**
 * Varias propiedades que comparten keyframes (posición x/y, cámara x/y/zoom…). Cada keyframe trae
 * todas las propiedades; se registra un solo evento por tramo, con la distancia recorrida en x/y.
 */
export const trackObj = <T extends object>(frame: number, keys: (T & { t: number; curva?: Curva })[]): { [K in Exclude<keyof T, "t" | "curva">]: number } => {
  type Fila = Record<string, number> & { curva?: Curva };
  const filas = keys as unknown as Fila[];
  const props = Object.keys(filas[0] ?? {}).filter((k) => k !== "t" && k !== "curva");
  const out: Record<string, number> = {};
  for (const k of props) out[k] = filas[0][k];
  for (let i = 1; i < filas.length; i++) {
    const a = filas[i - 1];
    const b = filas[i];
    const curva = b.curva ?? "move";
    const cambia = props.some((k) => a[k] !== b[k]);
    if (cambia && curva !== "hold") {
      const dist = Math.hypot((b.x ?? 0) - (a.x ?? 0), (b.y ?? 0) - (a.y ?? 0));
      auditEvent(frame, a.t, { kind: "tween", duration: b.t - a.t, curve: curva, dist });
    }
    if (frame >= a.t) {
      const p = tramo(frame, a.t, b.t, curva);
      for (const k of props) out[k] = a[k] + (b[k] - a[k]) * p;
    }
  }
  return out as { [K in Exclude<keyof T, "t" | "curva">]: number };
};

/**
 * `valueAtTime` de After Effects: el valor de una animación `retraso` cuadros antes. Con esto un
 * hijo sigue a su padre tarde (overlap, drag). No cuenta como evento nuevo en la auditoría.
 */
export const conRetraso = <T,>(anim: (frame: number) => T, frame: number, retraso: number): T =>
  sinAuditar(() => anim(frame - retraso));

/** Velocidad de una animación en unidades por cuadro (derivada central). */
export const velocidad = (anim: (frame: number) => number, frame: number): number =>
  sinAuditar(() => anim(frame + 0.5) - anim(frame - 0.5));

/**
 * `loopOut` de After Effects: devuelve el cuadro remapeado dentro de [inicio, fin] para repetir un
 * tramo. "ciclo" vuelve a empezar; "vaiven" lo recorre de ida y vuelta.
 */
export const loop = (frame: number, inicio: number, fin: number, modo: "ciclo" | "vaiven" = "ciclo") => {
  const largo = Math.max(1, fin - inicio);
  if (frame <= inicio) return frame;
  const t = frame - inicio;
  if (modo === "ciclo") return inicio + (t % largo);
  const vuelta = Math.floor(t / largo) % 2 === 1;
  return vuelta ? fin - (t % largo) : inicio + (t % largo);
};

/**
 * Movimiento A→B con oficio: toma impulso hacia atrás (anticipación), viaja y, si se pide,
 * se asienta con una oscilación que se apaga (follow-through). Es lo que un animador pone a mano
 * con tres keyframes y una expresión de rebote.
 */
export const mover = (
  frame: number,
  o: { de: number; a: number; inicio: number; dur: number; anticipa?: number; asienta?: number; fps?: number; curva?: CurveName },
): number => {
  const { de, a, inicio, dur, anticipa = 0.06, asienta = 0, fps = 30, curva = "move" } = o;
  const delta = a - de;
  const tAnt = Math.max(2, Math.round(dur * 0.22));
  const keys: Key[] =
    anticipa > 0
      ? [
          { t: inicio, v: de },
          { t: inicio + tAnt, v: de - delta * anticipa, curva: "aeEasy" },
          { t: inicio + tAnt + dur, v: a, curva },
        ]
      : [
          { t: inicio, v: de },
          { t: inicio + dur, v: a, curva },
        ];
  const fin = keys[keys.length - 1].t;
  return track(frame, keys) + (asienta > 0 ? delta * inertialBounce(frame - fin, fps, asienta) : 0);
};

/**
 * Squash & stretch a partir de la velocidad: se estira en el eje del movimiento y se adelgaza en el
 * otro para conservar el volumen. `k` es cuánto se deforma por px/cuadro; `max` lo limita.
 */
export const estirar = (vel: number, k = 0.004, max = 0.22) => {
  const e = Math.min(max, Math.abs(vel) * k);
  return { largo: 1 + e, ancho: 1 / (1 + e) };
};
