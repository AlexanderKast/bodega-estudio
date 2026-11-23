import type { Formato } from "../lib/formatos";
import { BodegaHumo, BODEGA_HUMO_DURACION } from "./BodegaHumo";
import { BodegaIcono } from "./BodegaIcono";
import { presetCompositions } from "./Presets";
import { AuditMalo, AUDIT_MALO_DURATION } from "./tests/AuditMalo";
import { KitAnotacion, KIT_ANOTACION_DURACION } from "./tests/KitAnotacion";
import { KitExplicar, KIT_EXPLICAR_DURACION } from "./tests/KitExplicar";
import { MotorMundo, MOTOR_MUNDO_DURACION } from "./tests/MotorMundo";
import { RigSvg, RIG_SVG_DURACION } from "./tests/RigSvg";

type Pieza = { id: string; componente: React.FC; duracion: number; formatos: readonly Formato[] };

/**
 * Piezas del estudio. Para una pieza nueva: crea `compositions/<Pieza>.tsx`, agrégala aquí con sus
 * formatos y sigue la skill master-motion (brief → storyboard → build → control → render).
 */
export const composiciones: Pieza[] = [
  // Prueba de humo del estudio (scripts/humo.sh).
  { id: "Bodega-Humo", componente: BodegaHumo, duracion: BODEGA_HUMO_DURACION, formatos: ["vertical", "horizontal"] },
  // Ícono del plugin (.claude-plugin/icon.png): un cuadro quieto.
  { id: "Bodega-Icono", componente: BodegaIcono, duracion: 1, formatos: ["cuadrado"] },
  // Catálogo de presets en 16:9 (se adaptan a cualquier formato con useEscala).
  ...presetCompositions.map((p) => ({ id: p.id, componente: p.component, duracion: p.durationInFrames, formatos: ["horizontal"] as const })),
  // Escena de prueba del motor de explainers (lib/timeline, rig, mundo, anclas, trayecto, blur).
  { id: "Motor-Mundo", componente: MotorMundo, duracion: MOTOR_MUNDO_DURACION, formatos: ["horizontal"] },
  // Hoja de prueba del kit de anotación en sus tres pieles (components/anotacion).
  { id: "Kit-Anotacion", componente: KitAnotacion, duracion: KIT_ANOTACION_DURACION, formatos: ["horizontal"] },
  // Segunda hoja del kit: pasos, llave, cifra anclada, lupa y anillo punteado.
  { id: "Kit-Explicar", componente: KitExplicar, duracion: KIT_EXPLICAR_DURACION, formatos: ["horizontal"] },
  // Escena de prueba del rig de SVG por capas (lib/svg-rig, lib/luz y blur adaptativo).
  { id: "Motor-SvgRig", componente: RigSvg, duracion: RIG_SVG_DURACION, formatos: ["horizontal"] },
  // Pruebas de las herramientas (no son piezas): scripts/test-audit.mjs.
  { id: "Test-AuditMalo", componente: AuditMalo, duracion: AUDIT_MALO_DURATION, formatos: ["horizontal"] },
];
