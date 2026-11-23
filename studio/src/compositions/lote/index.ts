import { escenasAnotacion } from "./DemosAnotacion";
import { escenasCaptions } from "./DemosCaptions";
import { escenasComposicion } from "./DemosComposicion";
import { escenasTexto } from "./DemosTexto";
import { escenasUI } from "./DemosUI";

/**
 * Demos de los presets del lote 2026-11-08 (referentes/lote-2026-11-08.md). Presets.tsx las busca cuando
 * un id de presets.manifest.json no está en sus escenas; viven aparte para no tocar las demás.
 * Las duraciones y cuadros de still van en presets.manifest.json (los lee scripts/stills.mjs).
 */
export const escenasLote: Record<string, React.FC> = {
  ...escenasTexto,
  ...escenasCaptions,
  ...escenasUI,
  ...escenasComposicion,
  // Kit de anotación (components/anotacion): una demo por pieza, en las tres pieles.
  ...escenasAnotacion,
};
