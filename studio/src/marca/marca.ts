import { loadFont as cargarTitulo } from "@remotion/google-fonts/Anton";
import { loadFont as cargarTexto } from "@remotion/google-fonts/Archivo";
import { loadFont as cargarMono } from "@remotion/google-fonts/JetBrainsMono";
import datos from "./marca.json";

/**
 * Marca de Bodega de Belleza. Los valores salen de `tokens-bodega.json` (manual oficial); si el manual cambia,
 * se actualizan los dos archivos. Impact no está en Google Fonts: se pide primero la Impact del sistema y,
 * si no existe (Linux, VPS), entra Anton, que es el respaldo que pide el manual.
 * Acumin no tiene licencia en Bodega, así que el texto va en Archivo (D-023 del repo de la app).
 */
const anton = cargarTitulo("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const texto = cargarTexto("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });
const mono = cargarMono("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const marca = {
  ...datos,
  fuenteTitulo: `Impact, ${anton.fontFamily}`,
  fuenteTexto: texto.fontFamily,
  fuenteMono: mono.fontFamily,
};

export type Marca = typeof marca;
