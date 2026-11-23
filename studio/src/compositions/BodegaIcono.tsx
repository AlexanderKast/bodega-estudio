import { AbsoluteFill, Img, staticFile } from "remotion";
import { marca } from "../marca/marca";

/**
 * Ícono del plugin (.claude-plugin/icon.png): el logo oficial sobre violeta, sin redibujarlo (reglas de marca.json).
 * Se genera con: cd studio && npx remotion still src/index.ts Bodega-Icono-cuadrado ../.claude-plugin/icon.png
 * No es una pieza: un solo cuadro quieto.
 */
export const BodegaIcono: React.FC = () => (
  <AbsoluteFill style={{ background: marca.colores.acento, alignItems: "center", justifyContent: "center" }}>
    <Img src={staticFile(marca.logos.sobreVioleta)} style={{ width: "78%" }} />
  </AbsoluteFill>
);
