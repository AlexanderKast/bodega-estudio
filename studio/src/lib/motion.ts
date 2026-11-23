import { Easing, interpolate, random, spring } from "remotion";
import { auditEvent } from "./audit";

/**
 * Kit de motion del estudio. Valores de kb/01-easing-y-curvas.md y kb/02-tiempos.md.
 * Regla: todas las animaciones pasan por estos helpers, así el linter y la revisión
 * hablan el mismo idioma (tokens con nombre, no números sueltos).
 */

// ── Curvas con nombre (kb/01 §2). No usar cubic-bezier fuera de esta tabla. ──
export const curves = {
  arrive: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: llega y frena
  arriveSoft: Easing.bezier(0.22, 1, 0.36, 1), // quint-out: entradas grandes
  arriveGentle: Easing.bezier(0.33, 1, 0.68, 1), // cubic-out: micro-UI, fades
  leave: Easing.bezier(0.7, 0, 0.84, 0), // expo-in: salidas
  leaveSoft: Easing.bezier(0.64, 0, 0.78, 0), // quint-in
  move: Easing.bezier(0.65, 0, 0.35, 1), // A→B dentro de cuadro
  snap: Easing.bezier(0.85, 0, 0.15, 1), // whip, transiciones rápidas
  glide: Easing.bezier(0.45, 0, 0.55, 1), // cámaras lentas, drifts
  aeEasy: Easing.bezier(0.333, 0, 0.667, 1), // Easy Ease (F9) de After Effects
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1), // back-out (preferir springs.pop)
  anticipate: Easing.bezier(0.36, 0, 0.66, -0.56), // back-in
};
export type CurveName = keyof typeof curves;

// ── Springs (kb/01 §3). ζ = damping / (2·√(stiffness·mass)). ──
export const springs = {
  smooth: { damping: 200, stiffness: 100, mass: 1 }, // ζ 10, sin rebote
  critical: { stiffness: 170, damping: 26, mass: 1 }, // ζ 1.0, precisa
  snappy: { stiffness: 200, damping: 20, mass: 1 }, // ζ 0.71
  pop: { stiffness: 260, damping: 14, mass: 1 }, // ζ 0.43, iconos/badges
  bouncy: { stiffness: 100, damping: 8, mass: 1 }, // ζ 0.4, usar poco
  heavy: { mass: 2, stiffness: 80, damping: 15 }, // ζ 0.59, objetos grandes
};
export type SpringName = keyof typeof springs;
type SpringConfig = { damping: number; stiffness: number; mass: number };

export const dampingRatio = (c: SpringConfig) => c.damping / (2 * Math.sqrt(c.stiffness * c.mass));

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Progreso 0→1 de una entrada (curva -out por defecto). */
export const arrive = (frame: number, start: number, duration: number, curve: CurveName = "arrive") => {
  auditEvent(frame, start, { kind: "arrive", duration, curve });
  return interpolate(frame, [start, start + duration], [0, 1], { easing: curves[curve], ...clamp });
};

/** Progreso 0→1 de una salida (curva -in). La salida dura 60–75 % de la entrada. */
export const leave = (frame: number, start: number, duration: number, curve: CurveName = "leave") => {
  auditEvent(frame, start, { kind: "leave", duration, curve });
  return interpolate(frame, [start, start + duration], [0, 1], { easing: curves[curve], ...clamp });
};

/** Movimiento genérico con curva elegida. */
export const tween = (frame: number, start: number, duration: number, curve: CurveName) => {
  auditEvent(frame, start, { kind: "tween", duration, curve });
  return interpolate(frame, [start, start + duration], [0, 1], { easing: curves[curve], ...clamp });
};

/** Spring con token y retardo. */
export const springPreset = (frame: number, fps: number, name: SpringName = "smooth", delay = 0) => {
  auditEvent(frame, delay, { kind: "spring", curve: name });
  return spring({ frame: frame - delay, fps, config: springs[name] });
};

/** Stagger no lineal: los primeros salen rápido, los últimos se espacian (kb/02 §2). */
export const staggerDelay = (i: number, n: number, totalFrames: number) =>
  n <= 1 ? 0 : Math.round(totalFrames * Easing.out(Easing.quad)(i / (n - 1)));

/** Ordena por distancia al punto focal (stagger desde el foco, no por índice). */
export const byDistance = <T extends { x: number; y: number }>(items: T[], fx: number, fy: number) =>
  [...items].sort((a, b) => Math.hypot(a.x - fx, a.y - fy) - Math.hypot(b.x - fx, b.y - fy));

/** Duración de un desplazamiento según la distancia, a 30 fps (kb/02 §1). */
export const durationForDistance = (px: number) => Math.round(8 + 0.9 * Math.sqrt(Math.abs(px)));

/** Hold de lectura en frames (kb/02 §3). */
export const readingHold = (words: number, fps = 30) => Math.round(Math.max(1, 0.4 + words / 3.5) * fps);

/** Speed/influence de After Effects → curva de Remotion (kb/01 §1). */
export const aeEase = (o: {
  speedOut: number;
  influenceOut: number;
  speedIn: number;
  influenceIn: number;
  delta: number;
  durationSec: number;
}) => {
  const avg = o.delta / o.durationSec;
  const io = o.influenceOut / 100;
  const ii = o.influenceIn / 100;
  return Easing.bezier(io, io * (o.speedOut / avg), 1 - ii, 1 - ii * (o.speedIn / avg));
};

/** Spring estilo Apple (duración percibida + bounce) → config de Remotion. */
export const appleSpring = (durationSec: number, bounce = 0): SpringConfig => ({
  mass: 1,
  stiffness: Math.pow((2 * Math.PI) / durationSec, 2),
  damping:
    bounce >= 0 ? (4 * Math.PI * (1 - bounce)) / durationSec : (4 * Math.PI) / (durationSec * (1 + bounce)),
});

/**
 * Expresión "inertial bounce" de After Effects: después de llegar, oscila y se apaga.
 * Devuelve un offset multiplicador del último movimiento (0 cuando se asienta).
 */
export const inertialBounce = (framesSinceArrival: number, fps: number, amp = 0.06, freq = 2.2, decay = 6) => {
  if (framesSinceArrival <= 0) return 0;
  const t = framesSinceArrival / fps;
  return amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
};

/** Wiggle determinista (equivalente a wiggle(freq, amp) de AE), suavizado con coseno. */
export const wiggle = (seed: string, frame: number, fps: number, freq = 1, amp = 1) => {
  const t = (frame / fps) * freq;
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  const s = (1 - Math.cos(f * Math.PI)) / 2;
  return (a + (b - a) * s) * amp;
};

/**
 * Entrada estándar: sube, aparece y se enfoca. La opacidad termina antes que el
 * movimiento (60 % del tiempo), nunca escala desde 0 (kb/01 §4 regla 7).
 */
export const enterStyle = (p: number, distance = 24): React.CSSProperties => ({
  opacity: Math.min(1, p / 0.6),
  transform: `translateY(${(1 - p) * distance}px) scale(${0.96 + 0.04 * p})`,
  filter: `blur(${(1 - p) * 8}px)`,
});

export const mix = (p: number, a: number, b: number) => a + (b - a) * p;

/**
 * Tiempo posterizado: congela el cuadro en bloques de `n` (animar "en 2s" o "en 3s").
 * A 30 fps, n=2 da 15 fps (cel), n=3 da 10 fps (riso, collage, stop motion). kb/13 estilos 5, 6, 13.
 */
export const posterizeTime = (frame: number, n = 2) => Math.floor(frame / Math.max(1, n)) * Math.max(1, n);

/**
 * Semilla determinista que cambia cada `cada` cuadros, para texturas vivas (grano, boil, registro).
 * Con `versiones` recorre un ciclo corto (el line boil clásico usa 2–3 dibujos). kb/13 §2.
 */
export const semilla = (frame: number, cada = 2, versiones = 0) => {
  const i = Math.floor(frame / Math.max(1, cada));
  return versiones > 0 ? i % versiones : i;
};
