import { AbsoluteFill } from "remotion";
import { marca } from "../../marca/marca";
import { useEscala } from "../../lib/escala";
import { Look } from "../../components/presets/Look";
import { TextOnPath } from "../../components/presets/TextOnPath";
import { TextWarp } from "../../components/presets/TextWarp";
import { TextTunnel } from "../../components/presets/TextTunnel";
import { SliceDisplace } from "../../components/presets/SliceDisplace";
import { MarqueeRows } from "../../components/presets/MarqueeRows";

/**
 * Escenas de muestra del lote de tipografía (TextOnPath, TextWarp, TextTunnel, SliceDisplace, MarqueeRows).
 * 1920 × 1080, fondo de marca, alineadas a la izquierda sobre retícula. El `still` de cada una cae con la
 * animación ya asentada para el catálogo.
 */

const Fondo: React.FC<{ children: React.ReactNode; pad?: boolean }> = ({ children, pad = true }) => {
  const { u } = useEscala();
  return (
    <AbsoluteFill style={{ background: marca.colores.fondo }}>
      <AbsoluteFill
        style={{
          padding: pad ? `${110 * u}px ${140 * u}px` : 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {children}
      </AbsoluteFill>
      <Look />
    </AbsoluteFill>
  );
};

const Rotulo: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { u } = useEscala();
  return (
    <div
      style={{
        position: "absolute",
        left: 140 * u,
        top: 90 * u,
        fontFamily: marca.fuenteMono,
        fontSize: 22 * u,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: marca.colores.suave,
      }}
    >
      {children}
    </div>
  );
};

export const escenasTexto: Record<string, React.FC> = {
  TextOnPath: () => (
    <Fondo>
      <Rotulo>Texto sobre curva · smear</Rotulo>
      <TextOnPath text="Sigue la curva" delay={4} drift={4} />
    </Fondo>
  ),
  TextWarp: () => (
    <Fondo>
      <TextWarp lines={["Líquido", "Líquido", "Líquido"]} delay={4} accentLine={2} />
    </Fondo>
  ),
  TextTunnel: () => (
    <Fondo pad={false}>
      <TextTunnel word="Bodega" center="Entra" delay={2} />
    </Fondo>
  ),
  SliceDisplace: () => {
    const { u } = useEscala();
    return (
      <Fondo>
        <SliceDisplace text={"Energía\nen motion"} delay={6} exitAt={78} />
        <div style={{ marginTop: 36 * u, fontFamily: marca.fuenteTexto, fontSize: 30 * u, color: marca.colores.suave }}>
          Franjas que se corren y vuelven al registro
        </div>
      </Fondo>
    );
  },
  MarqueeRows: () => (
    <Fondo pad={false}>
      <MarqueeRows rows={["Diseño", "Ritmo", "Bodega", "Belleza", "Oficio"]} band delay={2} />
    </Fondo>
  ),
};

export const manifestTexto: { id: string; duration: number; still: number }[] = [
  { id: "TextOnPath", duration: 120, still: 64 },
  { id: "TextWarp", duration: 120, still: 34 },
  { id: "TextTunnel", duration: 135, still: 70 },
  { id: "SliceDisplace", duration: 100, still: 14 },
  { id: "MarqueeRows", duration: 120, still: 60 },
];
