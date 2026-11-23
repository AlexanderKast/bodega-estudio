import { AbsoluteFill, Series, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { Look } from "../../components/presets/Look";
import { CutoutObject } from "../../components/presets/CutoutObject";
import { BeforeAfter } from "../../components/presets/BeforeAfter";
import { SplitStack } from "../../components/presets/SplitStack";
import { GradientFlow } from "../../components/presets/GradientFlow";

/**
 * Escenas de muestra del lote de composición (CutoutObject, BeforeAfter, SplitStack, GradientFlow), 1920×1080.
 * Contenido placeholder con divs: sirven de catálogo y de test de stills.
 */

const PAPEL = "#EDE6D6";
const TINTA = "#1D1B16";

const Titulo: React.FC<{ texto: string; at: number; color?: string; size?: number; style?: React.CSSProperties }> = ({
  texto,
  at,
  color = marca.colores.texto,
  size = 96,
  style,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const p = arrive(frame, at, 16, "arrive");
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <div
        style={{
          fontFamily: marca.fuenteTitulo,
          fontWeight: 700,
          fontSize: size * u,
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          color,
          transform: `translateY(${(1 - p) * 105}%)`,
        }}
      >
        {texto}
      </div>
    </div>
  );
};

/** Placeholder de "pantalla" con barras de UI: tono y nivel de pulido distintos para antes y después. */
const PantallaFalsa: React.FC<{ pulida: boolean }> = ({ pulida }) => {
  const { u } = useEscala();
  const base = pulida ? marca.colores.superficie : "#3A3833";
  return (
    <AbsoluteFill style={{ background: base, padding: 40 * u, gap: 18 * u }}>
      <div style={{ height: 120 * u, borderRadius: 12 * u, background: pulida ? marca.colores.acento : "#5B5850" }} />
      {[0.9, 0.62, 0.78, 0.4].map((w, i) => (
        <div key={i} style={{ height: 26 * u, width: `${w * 100}%`, borderRadius: 4 * u, background: pulida ? marca.colores.linea : "#4C4A44" }} />
      ))}
      <div style={{ flex: 1, borderRadius: 12 * u, background: pulida ? marca.colores.acentoProfundo : "#46443E" }} />
    </AbsoluteFill>
  );
};

const DemoCutout: React.FC = () => {
  const { u } = useEscala();
  return (
    <AbsoluteFill style={{ background: PAPEL }}>
      <AbsoluteFill style={{ padding: `${150 * u}px ${130 * u}px`, justifyContent: "flex-start" }}>
        <Titulo texto="Una idea," at={6} color={TINTA} size={120} />
        <Titulo texto="un objeto." at={10} color={TINTA} size={120} />
      </AbsoluteFill>
      <CutoutObject x={0.66} y={0.52} ancho={560} at={14} out={78} sticker seed="demo-a" />
      <CutoutObject x={0.86} y={0.78} ancho={220} at={24} out={80} rotacion={9} rotacionInicial={24} resorte="snappy" seed="demo-b" />
      <Look grain={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};

const DemoBeforeAfter: React.FC = () => (
  <AbsoluteFill style={{ background: marca.colores.fondo }}>
    <Series>
      <Series.Sequence durationInFrames={80}>
        <BeforeAfter modo="tarjetas" antes={<PantallaFalsa pulida={false} />} despues={<PantallaFalsa pulida />} at={6} out={70} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <BeforeAfter
          modo="cortina"
          antes={<PantallaFalsa pulida={false} />}
          despues={<PantallaFalsa pulida />}
          etiquetaAntes="Original"
          etiquetaDespues="Edición final"
          at={4}
        />
      </Series.Sequence>
    </Series>
    <Look grain={0.06} vignette={0.45} />
  </AbsoluteFill>
);

const DemoSplitStack: React.FC = () => {
  const { u } = useEscala();
  const lockup = (
    <div style={{ display: "flex", alignItems: "center", gap: 18 * u, fontFamily: marca.fuenteMono, fontSize: 24 * u, color: marca.colores.texto }}>
      <span>MASTER MOTION</span>
      <span style={{ color: marca.colores.acento }}>×</span>
      <span>CLIENTE</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <SplitStack
        barra={lockup}
        proporcion={0.55}
        caption="esto sí vende"
        enfasis="vende"
        at={4}
        arriba={
          <AbsoluteFill style={{ background: marca.colores.superficie, padding: `${70 * u}px ${130 * u}px`, justifyContent: "center" }}>
            <Titulo texto="+38 % retención" at={22} size={110} />
            <div style={{ marginTop: 26 * u, display: "flex", gap: 14 * u, alignItems: "flex-end", height: 120 * u }}>
              {[0.35, 0.5, 0.42, 0.7, 1].map((h, i) => (
                <div key={i} style={{ width: 70 * u, height: `${h * 100}%`, borderRadius: 4 * u, background: i === 4 ? marca.colores.acento : marca.colores.linea }} />
              ))}
            </div>
          </AbsoluteFill>
        }
        abajo={
          <AbsoluteFill style={{ background: "#2A2620", alignItems: "center", justifyContent: "flex-end" }}>
            {/* Silueta de presentador. */}
            <div style={{ width: 200 * u, height: 200 * u, borderRadius: 999, background: "#6B6255", marginBottom: 20 * u }} />
            <div style={{ width: 460 * u, height: 140 * u, borderRadius: `${200 * u}px ${200 * u}px 0 0`, background: "#554D43" }} />
          </AbsoluteFill>
        }
      />
      <Look grain={0.06} vignette={0.35} />
    </AbsoluteFill>
  );
};

const DemoGradientFlow: React.FC = () => {
  const { u } = useEscala();
  return (
    <AbsoluteFill>
      <GradientFlow at={0}>
        <AbsoluteFill style={{ padding: `0 ${130 * u}px ${150 * u}px`, justifyContent: "flex-end" }}>
          <Titulo texto="Fondo vivo," at={20} size={110} />
          <Titulo texto="sin morado." at={25} size={110} color={marca.colores.acentoClaro} />
        </AbsoluteFill>
      </GradientFlow>
      <Look grain={0.04} vignette={0.4} />
    </AbsoluteFill>
  );
};

export const escenasComposicion: Record<string, React.FC> = {
  CutoutObject: DemoCutout,
  BeforeAfter: DemoBeforeAfter,
  SplitStack: DemoSplitStack,
  GradientFlow: DemoGradientFlow,
};

export const manifestComposicion: { id: string; duration: number; still: number }[] = [
  { id: "CutoutObject", duration: 90, still: 48 },
  { id: "BeforeAfter", duration: 170, still: 52 },
  { id: "SplitStack", duration: 75, still: 45 },
  { id: "GradientFlow", duration: 150, still: 90 },
];
