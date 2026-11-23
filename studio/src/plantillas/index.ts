import { antesDespues } from "./antes-despues/AntesDespues";
import type { PlantillaRegistrada } from "./base";
import { collageImpacto } from "./collage-impacto/CollageImpacto";
import { editorialRecorte } from "./editorial-recorte/EditorialRecorte";
import { explicadorObjetos } from "./explicador-objetos-3d/ExplicadorObjetos";
import { molde } from "./molde/Molde";
import { saasUiCristal } from "./saas-ui-cristal/SaasUiCristal";
import { showcaseDispositivo } from "./showcase-dispositivo/ShowcaseDispositivo";
import { splitStack } from "./split-stack/SplitStackPlantilla";
import { talkingHeadInsertos } from "./talking-head-insertos/TalkingHeadInsertos";
import { tutorialPasos } from "./tutorial-pasos/TutorialPasos";

/**
 * Plantillas replicadas desde referencias (kb/14-plantillas.md). Para una nueva: /replicar <url>,
 * o copia `molde/` a `plantillas/<id>/`, ajústala a la receta del analista y agrégala aquí.
 * Root las publica como `<id>-<formato>` con su schema: props editables en Studio y por --props.
 */
export const plantillas: PlantillaRegistrada[] = [
  molde,
  // Lote 2026-11-08 (referentes/lote-2026-11-08.md): una plantilla por familia de técnica.
  editorialRecorte,
  collageImpacto,
  explicadorObjetos,
  saasUiCristal,
  antesDespues,
  showcaseDispositivo,
  talkingHeadInsertos,
  splitStack,
  tutorialPasos,
];
