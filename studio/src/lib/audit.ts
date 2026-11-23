import { getInputProps } from "remotion";

/**
 * Registro de auditoría de motion. Solo se activa cuando la composición se renderiza con la
 * input prop `__motionAudit: true` (lo hace scripts/motion-audit.mjs). En render normal no hace nada.
 *
 * Cada helper del kit avisa por consola en el cuadro en que arranca su animación, con el cuadro
 * absoluto de la composición. El script recoge esas líneas y mide stagger, duraciones, ritmo,
 * densidad de eventos y sonido (kb/10, kb/02, kb/07).
 */

type AuditGlobal = { __motionAbsFrame?: number; __motionAuditIdx?: number; __motionAuditLast?: number; __motionAuditMute?: boolean };
const g = globalThis as unknown as AuditGlobal;

let enabled: boolean | null = null;

export const auditOn = (): boolean => {
  if (enabled === null) {
    try {
      enabled = Boolean((getInputProps() as Record<string, unknown>).__motionAudit);
    } catch {
      enabled = false;
    }
  }
  return enabled;
};

/** Lo llama la raíz de cada composición con su cuadro absoluto, antes de que rendericen los hijos. */
export const setAuditFrame = (absoluteFrame: number) => {
  if (!auditOn()) return;
  g.__motionAbsFrame = absoluteFrame;
};

export type AuditEvent = {
  kind: "arrive" | "leave" | "tween" | "spring" | "sfx" | "blur";
  start: number; // cuadro absoluto
  duration?: number;
  curve?: string;
  dist?: number; // px que recorre el movimiento (lo llenan timeline.ts y la regla B-01 lo lee)
  role?: string;
  keep?: boolean;
  sound?: string;
  gain?: number;
  i: number; // orden de llamada dentro del cuadro
};

/**
 * Registra una animación. `frame` y `start` son locales (los del componente); se anota cuando
 * el cuadro local llega al inicio, con el cuadro absoluto de ese momento.
 */
export const auditEvent = (frame: number, start: number, e: Omit<AuditEvent, "start" | "i">) => {
  if (!auditOn() || g.__motionAuditMute) return;
  const abs = g.__motionAbsFrame ?? frame;
  if (g.__motionAuditLast !== abs) {
    g.__motionAuditLast = abs;
    g.__motionAuditIdx = 0;
  }
  const i = (g.__motionAuditIdx = (g.__motionAuditIdx ?? 0) + 1);
  const at = Math.max(0, Math.round(start));
  if (Math.round(frame) !== at) return;
  // Si el inicio local es negativo, el evento ya venía corriendo: se anota en el cuadro 0 local.
  // console.debug: el renderer no lo imprime, pero onBrowserLog lo recibe.
  console.debug(`MOTION_AUDIT ${JSON.stringify({ ...e, start: abs, i })}`);
};

/**
 * Silencia la auditoría para copias visuales de una misma escena (por ejemplo las franjas de GlitchHit):
 * `<AuditPausa activa />` antes de las copias y `<AuditPausa activa={false} />` después. React recorre los
 * hijos en orden, así que todo lo que queda entre las dos marcas no se cuenta dos veces.
 */
export const AuditPausa: React.FC<{ activa: boolean }> = ({ activa }) => {
  if (auditOn()) g.__motionAuditMute = activa;
  return null;
};

/**
 * Ejecuta `f` sin registrar eventos. Sirve para muestrear una animación en otro cuadro
 * (medir su velocidad, pedir el valor con retraso) sin que cuente como un evento nuevo.
 */
export const sinAuditar = <T,>(f: () => T): T => {
  const antes = g.__motionAuditMute;
  g.__motionAuditMute = true;
  try {
    return f();
  } finally {
    g.__motionAuditMute = antes;
  }
};
