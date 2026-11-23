import { TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../marca/marca";
import {
  BlenderLayer,
  CameraRig,
  CharCascade,
  CountUp,
  DepthCards,
  GlitchHit,
  KaraokeCaption,
  LineDraw,
  LogoSting,
  Look,
  LottieLayer,
  LowerThird,
  MarkerHighlight,
  MaskTitle,
  Parallax,
  SplitReveal,
  WordRotator,
  ScrambleResolve,
  StretchRepeater,
  VariableAxisType,
  BoilLine,
  RisoLayer,
  BayerDither,
  MapTrace,
  WordWindowCaption,
  PunchIn,
  ShapeMorph,
  GooeyMerge,
  IsoScene,
  BarRace,
  UnitGrid,
  LightLeak,
  PaperTear,
  SpeedLines,
  ImpactFrame,
  noiseBlocks,
  clockWipeSpring,
  maskWipe,
  snapTiming,
  whip,
  zoomThrough,
} from "../components/presets";
import { useEscala } from "../lib/escala";
import { escenasLote } from "./lote";
import manifest from "./presets.manifest.json";

/**
 * Una escena de muestra por preset. Sirven de catálogo visual y de test:
 * scripts/stills.mjs renderiza el cuadro `still` de cada una.
 */

const Stage: React.FC<{ children: React.ReactNode; pad?: boolean }> = ({ children, pad = true }) => {
  const { u } = useEscala();
  return (
    <AbsoluteFill style={{ background: marca.colores.fondo }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 60% at 22% 30%, ${marca.colores.acento}1c 0%, transparent 70%)`,
        }}
      />
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

const Panel: React.FC<{ title: string; tone: "surface" | "accent" }> = ({ title, tone }) => {
  const { u } = useEscala();
  const bg = tone === "accent" ? marca.colores.acento : marca.colores.superficie;
  const fg = tone === "accent" ? marca.colores.fondo : marca.colores.texto;
  return (
    <AbsoluteFill style={{ background: bg, justifyContent: "flex-end", padding: 140 * u }}>
      <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 800, fontSize: 170 * u, letterSpacing: "-0.05em", color: fg, lineHeight: 0.9 }}>
        {title}
      </div>
    </AbsoluteFill>
  );
};

const TransitionDemo: React.FC<{ kind: "whip" | "zoom" | "wipe" }> = ({ kind }) => {
  const timing = snapTiming(kind === "wipe" ? 14 : 10);
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={35}>
          <Panel title="Antes" tone="surface" />
        </TransitionSeries.Sequence>
        {kind === "whip" ? (
          <TransitionSeries.Transition presentation={whip({ direction: "left" })} timing={timing} />
        ) : kind === "zoom" ? (
          <TransitionSeries.Transition presentation={zoomThrough()} timing={timing} />
        ) : (
          <TransitionSeries.Transition presentation={maskWipe()} timing={timing} />
        )}
        <TransitionSeries.Sequence durationInFrames={35}>
          <Panel title="Después" tone="accent" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Look />
    </AbsoluteFill>
  );
};

// Transiciones P2: bloques de ruido, clock wipe con spring y light leak como overlay sobre un corte.
const P2TransitionDemo: React.FC<{ kind: "noise" | "clock" | "leak" }> = ({ kind }) => {
  const { width, height } = useVideoConfig();
  const antes = (
    <TransitionSeries.Sequence durationInFrames={kind === "leak" ? 30 : 35}>
      <Panel title="Antes" tone="surface" />
    </TransitionSeries.Sequence>
  );
  const despues = (
    <TransitionSeries.Sequence durationInFrames={kind === "leak" ? 30 : 35}>
      <Panel title="Después" tone="accent" />
    </TransitionSeries.Sequence>
  );
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {antes}
        {kind === "noise" ? (
          <TransitionSeries.Transition presentation={noiseBlocks({ width, height, cols: 16 })} timing={snapTiming(16)} />
        ) : kind === "clock" ? (
          <TransitionSeries.Transition {...clockWipeSpring(width, height, 24)} />
        ) : (
          <TransitionSeries.Overlay durationInFrames={20}>
            <LightLeak duration={20} />
          </TransitionSeries.Overlay>
        )}
        {despues}
      </TransitionSeries>
      <Look />
    </AbsoluteFill>
  );
};

/** Sostiene el último cuadro de un render más corto que la escena (hold, no loop ni negro). */
const Sostener: React.FC<{ hasta: number; children: React.ReactNode }> = ({ hasta, children }) => {
  const frame = useCurrentFrame();
  return frame > hasta ? <Freeze frame={hasta}>{children}</Freeze> : <>{children}</>;
};

const PhotoLike: React.FC<{ hue: string; label: string }> = ({ hue, label }) => {
  const { u } = useEscala();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${hue} 0%, ${marca.colores.fondo} 85%)`,
        justifyContent: "flex-end",
        padding: 120 * u,
      }}
    >
      <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 800, fontSize: 120 * u, color: marca.colores.texto, letterSpacing: "-0.04em" }}>
        {label}
      </div>
    </AbsoluteFill>
  );
};

const scenes: Record<string, React.FC> = {
  MaskTitle: () => (
    <Stage>
      <MaskTitle lines={["Cada cuadro", "tiene una", "intención."]} highlight={["intención"]} delay={4} />
    </Stage>
  ),
  CharCascade: () => (
    <Stage>
      <CharCascade text="Movimiento" delay={4} />
    </Stage>
  ),
  WordRotator: () => (
    <Stage>
      <WordRotator prefix="Hacemos" words={["videos.", "marcas.", "ventas."]} every={36} delay={4} />
    </Stage>
  ),
  LineDraw: () => (
    <Stage>
      <div style={{ width: "70%" }}>
        <LineDraw delay={4} />
      </div>
    </Stage>
  ),
  CountUp: () => (
    <Stage>
      <CountUp to={4870} prefix="+" suffix=" leads" label="en los primeros 30 días de campaña" delay={4} />
    </Stage>
  ),
  MarkerHighlight: () => (
    <Stage>
      <MarkerHighlight before="El 80 % de la gente ve tus videos" mark="sin sonido" after="en el feed." delay={14} />
    </Stage>
  ),
  LowerThird: () => (
    <Stage>
      <div style={{ marginTop: "auto" }}>
        <LowerThird name="Bodega de Belleza" role="Medellín" delay={6} exitAt={72} />
      </div>
    </Stage>
  ),
  KaraokeCaption: () => (
    <Stage>
      <KaraokeCaption
        words={[
          { text: "Lo", start: 6, end: 12 },
          { text: "que", start: 12, end: 18 },
          { text: "no", start: 18, end: 26 },
          { text: "se", start: 26, end: 31 },
          { text: "mueve,", start: 31, end: 44 },
          { text: "no", start: 48, end: 54 },
          { text: "se", start: 54, end: 59 },
          { text: "ve.", start: 59, end: 78 },
        ]}
      />
    </Stage>
  ),
  CameraRig: () => (
    <AbsoluteFill style={{ background: marca.colores.fondo }}>
      <CameraRig push={0.06}>
        <PhotoLike hue="#5a2a18" label="Cámara viva" />
      </CameraRig>
      <Look />
    </AbsoluteFill>
  ),
  Parallax: () => {
    const { u } = useEscala();
    return (
      <AbsoluteFill style={{ background: marca.colores.fondo }}>
        <Parallax
          travel={220}
          layers={[
            { depth: 0.2, node: <AbsoluteFill style={{ background: `radial-gradient(60% 70% at 70% 40%, #3b1d12 0%, ${marca.colores.fondo} 80%)` }} /> },
            {
              depth: 0.55,
              node: (
                <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 160 * u }}>
                  <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 800, fontSize: 200 * u, color: marca.colores.texto, letterSpacing: "-0.05em" }}>
                    Profundidad
                  </div>
                </AbsoluteFill>
              ),
            },
            {
              depth: 1,
              blur: 6,
              node: (
                <AbsoluteFill>
                  <div style={{ position: "absolute", right: 120 * u, top: 120 * u, width: 360 * u, height: 360 * u, borderRadius: "50%", background: marca.colores.acento, opacity: 0.85 }} />
                </AbsoluteFill>
              ),
            },
          ]}
        />
        <Look />
      </AbsoluteFill>
    );
  },
  DepthCards: () => (
    <Stage pad={false}>
      <DepthCards
        delay={4}
        cards={[
          { title: "Guion", body: "Hook en 3 s", x: 980, y: 170, w: 640, h: 560 },
          { title: "Storyboard", body: "Tiempos exactos", x: 380, y: 260, w: 420, h: 300 },
          { title: "Render", body: "En el servidor", x: 520, y: 620, w: 380, h: 260 },
        ]}
      />
    </Stage>
  ),
  LogoSting: () => (
    <Stage>
      <LogoSting wordmark="Bodega de Belleza" logo={staticFile(marca.logos.sobreOscuro)} tagline="Bodega Estudio" delay={6} />
    </Stage>
  ),
  SplitReveal: () => (
    <AbsoluteFill>
      <SplitReveal label="Capítulo 02" at={22}>
        <PhotoLike hue="#123a33" label="La escena" />
      </SplitReveal>
      <Look />
    </AbsoluteFill>
  ),
  GlitchHit: () => (
    <AbsoluteFill>
      <GlitchHit at={20}>
        <Panel title="Golpe" tone="surface" />
      </GlitchHit>
      <Look />
    </AbsoluteFill>
  ),
  BlenderLayer: () => {
    const { u } = useEscala();
    return (
      <Stage>
        <div style={{ display: "flex", alignItems: "center", gap: 120 * u, width: "100%" }}>
          <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 800, fontSize: 120 * u, color: marca.colores.texto, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
            3D real,
            <br />
            <span style={{ color: marca.colores.acento }}>no mockup.</span>
          </div>
          <BlenderLayer src={staticFile("blender/telefono.webm")} width={560} delay={4} loopFrames={24} />
        </div>
      </Stage>
    );
  },
  LottieLayer: () => {
    const { u } = useEscala();
    return (
      <Stage>
        <div style={{ display: "flex", alignItems: "center", gap: 80 * u }}>
          <LottieLayer src={staticFile("lottie/trazo.json")} width={360 * u} />
          <div style={{ fontFamily: marca.fuenteTexto, fontSize: 44 * u, color: marca.colores.suave, maxWidth: 700 * u }}>
            Animación de After Effects exportada con Bodymovin y reproducida cuadro a cuadro.
          </div>
        </div>
      </Stage>
    );
  },
  Whip: () => <TransitionDemo kind="whip" />,
  ZoomThrough: () => <TransitionDemo kind="zoom" />,
  MaskWipe: () => <TransitionDemo kind="wipe" />,
  Look: () => (
    <AbsoluteFill>
      <PhotoLike hue="#6b3a1c" label="Grano, viñeta, temperatura" />
      <Look grain={0.09} vignette={0.6} />
    </AbsoluteFill>
  ),
  // ── P1 del catálogo de estilos (kb/13 §5) ──
  ScrambleResolve: () => {
    const { u } = useEscala();
    return (
      <Stage>
        <div style={{ fontFamily: marca.fuenteMono, fontSize: 30 * u, color: marca.colores.suave, marginBottom: 28 * u }}>render · Bodega Estudio</div>
        <ScrambleResolve text="CÓDIGO, NO PLANTILLA" delay={4} />
      </Stage>
    );
  },
  StretchRepeater: () => (
    <Stage>
      <StretchRepeater word="Ritmo" delay={4} />
    </Stage>
  ),
  VariableAxisType: () => (
    <Stage>
      <VariableAxisType text="Peso" delay={4} pulseAt={48} />
    </Stage>
  ),
  BoilLine: () => {
    const { u } = useEscala();
    return (
      <Stage>
        <BoilLine amount={3}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 170 * u, color: marca.colores.texto, letterSpacing: "-0.04em" }}>
              Hecho a mano
            </div>
            <svg width={1080 * u} height={60 * u} viewBox="0 0 1080 60" style={{ display: "block" }}>
              <path d="M 8 38 C 220 14, 520 52, 760 26 S 1010 30, 1068 18" fill="none" stroke={marca.colores.acento} strokeWidth={9} strokeLinecap="round" />
            </svg>
          </div>
        </BoilLine>
      </Stage>
    );
  },
  RisoLayer: () => {
    const { u } = useEscala();
    return (
      <AbsoluteFill>
        <RisoLayer
          render={(t, i) =>
            i === 0 ? (
              <AbsoluteFill>
                <div style={{ position: "absolute", left: 520 * u, top: 300 * u, width: 520 * u, height: 520 * u, borderRadius: "50%", background: t }} />
              </AbsoluteFill>
            ) : (
              <AbsoluteFill style={{ justifyContent: "flex-end", padding: 140 * u }}>
                <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 190 * u, letterSpacing: "-0.05em", lineHeight: 0.88, color: t }}>
                  Tinta
                  <br />
                  y registro
                </div>
              </AbsoluteFill>
            )
          }
        />
      </AbsoluteFill>
    );
  },
  BayerDither: () => {
    const { u } = useEscala();
    return (
      <AbsoluteFill>
        <BayerDither delay={2} duration={34} />
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: 140 * u }}>
          <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 150 * u, letterSpacing: "-0.05em", color: marca.colores.texto, lineHeight: 0.9 }}>
            Un bit,
            <br />
            dos tintas.
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  },
  MapTrace: () => (
    <MapTrace
      caja={{ oeste: -78.5, este: -72, sur: 2.2, norte: 7.8 }}
      lugares={[
        { nombre: "Medellín", lon: -75.57, lat: 6.25, dato: "6,25° N · 75,57° O" },
        { nombre: "Bogotá", lon: -74.07, lat: 4.71, dato: "4,71° N · 74,07° O" },
        { nombre: "Cali", lon: -76.53, lat: 3.45, dato: "3,45° N · 76,53° O" },
      ]}
      delay={4}
    />
  ),
  WordWindowCaption: () => (
    <AbsoluteFill>
      <PunchIn punches={[{ at: 30, scale: 1.14 }, { at: 62, scale: 1 }]}>
        <PhotoLike hue="#3a2a1a" label="" />
      </PunchIn>
      <WordWindowCaption
        words={[
          { text: "Nadie", start: 4, end: 12 },
          { text: "ve", start: 12, end: 18 },
          { text: "tu", start: 18, end: 24 },
          { text: "video", start: 24, end: 34 },
          { text: "si", start: 38, end: 44 },
          { text: "no", start: 44, end: 50 },
          { text: "engancha.", start: 50, end: 70 },
        ]}
      />
      <Look />
    </AbsoluteFill>
  ),
  PunchIn: () => (
    <AbsoluteFill>
      <PunchIn punches={[{ at: 20, scale: 1.12 }, { at: 44, scale: 1.2, ox: 0.3, oy: 0.7, dur: 4 }, { at: 70, scale: 1 }]}>
        <PhotoLike hue="#16352c" label="Golpe de encuadre" />
      </PunchIn>
      <Look />
    </AbsoluteFill>
  ),
  // ── P2 del catálogo de estilos (kb/13 §5) ──
  ShapeMorph: () => {
    const { u } = useEscala();
    return (
      <Stage>
        <div style={{ display: "flex", alignItems: "center", gap: 120 * u }}>
          <ShapeMorph
            delay={2}
            shapes={[
              // Círculo → play → flecha de crecimiento: de "un video" a "resultado".
              "M 50 8 A 42 42 0 1 1 49.9 8 Z",
              "M 22 10 L 88 50 L 22 90 Z",
              "M 50 6 L 92 50 L 66 50 L 66 94 L 34 94 L 34 50 L 8 50 Z",
            ]}
          />
          <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 110 * u, color: marca.colores.texto, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
            Del play
            <br />
            al resultado.
          </div>
        </div>
      </Stage>
    );
  },
  GooeyMerge: () => (
    <Stage>
      <GooeyMerge
        gotas={[
          { from: { x: 260, y: 350 }, to: { x: 590, y: 350 }, r: 130, at: 10, label: "Idea" },
          { from: { x: 1140, y: 350 }, to: { x: 835, y: 350 }, r: 110, at: 16, label: "Método" },
          { from: { x: 715, y: 350 }, to: { x: 715, y: 560 }, r: 54, at: 46 },
        ]}
      />
    </Stage>
  ),
  IsoScene: () => (
    <AbsoluteFill style={{ background: marca.colores.fondo }}>
      <IsoScene
        delay={4}
        cajas={[
          { x: -6, y: -1, w: 3, d: 3, h: 1, label: "guion" },
          { x: -2, y: -1, w: 3, d: 3, h: 2, label: "board" },
          { x: 2, y: -1, w: 3, d: 3, h: 3, tono: "acento", label: "render" },
          { x: -2, y: 3, w: 3, d: 3, h: 1, label: "audio" },
        ]}
      />
      <Look />
    </AbsoluteFill>
  ),
  BarRace: () => (
    <Stage>
      <BarRace
        destacar="Reels"
        unidad=" k"
        cortes={[
          { at: 4, label: "2024", valores: { YouTube: 82, Reels: 40, TikTok: 64, LinkedIn: 22, Blog: 30 } },
          { at: 56, label: "2025", valores: { YouTube: 86, Reels: 78, TikTok: 75, LinkedIn: 31, Blog: 24 } },
          { at: 100, label: "2026", valores: { YouTube: 88, Reels: 112, TikTok: 81, LinkedIn: 44, Blog: 19 } },
        ]}
      />
    </Stage>
  ),
  UnitGrid: () => (
    <Stage>
      <UnitGrid valor={37} delay={4} frase="de cada 100 personas ven el video sin sonido" />
    </Stage>
  ),
  NoiseBlocks: () => <P2TransitionDemo kind="noise" />,
  ClockWipe: () => <P2TransitionDemo kind="clock" />,
  LightLeak: () => <P2TransitionDemo kind="leak" />,
  PaperTear: () => {
    const { u } = useEscala();
    return (
      <AbsoluteFill>
        <PaperTear
          at={14}
          debajo={<PhotoLike hue="#5a2a18" label="Lo que había debajo" />}
        >
          <AbsoluteFill style={{ background: "#EDE6D6", padding: 140 * u, justifyContent: "flex-start" }}>
            <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 170 * u, color: "#1D1D1B", letterSpacing: "-0.05em", lineHeight: 0.9 }}>
              Arranca
              <br />
              la página.
            </div>
          </AbsoluteFill>
        </PaperTear>
        <Look />
      </AbsoluteFill>
    );
  },
  // ── P3 del catálogo de estilos (kb/13 §5) ──
  SpeedLines: () => {
    const { u } = useEscala();
    return (
      <AbsoluteFill style={{ background: marca.colores.fondo }}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 300 * u, height: 300 * u, borderRadius: "50%", background: marca.colores.acento }} />
        </AbsoluteFill>
        <SpeedLines at={14} dur={16} hueco={0.2} />
        <Look />
      </AbsoluteFill>
    );
  },
  ImpactFrame: () => (
    <AbsoluteFill>
      <ImpactFrame at={24} fx={0.3} fy={0.75}>
        <Panel title="Impacto." tone="surface" />
      </ImpactFrame>
      <Look />
    </AbsoluteFill>
  ),
  // Renders de el VPS de Bodega (blender/estilo/*.py y scripts/datamosh.py), compuestos en Remotion.
  DeviceOrbit: () => {
    const { u } = useEscala();
    return (
      <Stage>
        <div style={{ display: "flex", alignItems: "center", gap: 60 * u, width: "100%" }}>
          <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 104 * u, color: marca.colores.texto, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
            La grabación
            <br />
            <span style={{ color: marca.colores.acento }}>es real.</span>
          </div>
          <Sostener hasta={104}>
            <BlenderLayer src={staticFile("blender/device-orbit.webm")} width={760} delay={2} shadow={false} />
          </Sostener>
        </div>
      </Stage>
    );
  },
  ClayRebote: () => (
    <AbsoluteFill style={{ background: "#E9E1D3" }}>
      <Sostener hasta={89}>
        <OffthreadVideo src={staticFile("blender/clay-rebote.mp4")} muted />
      </Sostener>
    </AbsoluteFill>
  ),
  Datamosh: () => (
    <AbsoluteFill style={{ background: marca.colores.fondo, justifyContent: "center", alignItems: "center" }}>
      <OffthreadVideo src={staticFile("datamosh/demo.mp4")} muted style={{ height: "100%" }} />
      <Look />
    </AbsoluteFill>
  ),
};

/** Escenas sueltas, para reusarlas en piezas (MasterMotion-Catálogo). */
export const presetScenes = scenes;

export const presetCompositions = manifest.map((m) => {
  const component = scenes[m.id] ?? escenasLote[m.id];
  if (!component) throw new Error(`Falta la escena del preset ${m.id}`);
  return { id: `Preset-${m.id}`, component, durationInFrames: m.duration };
});
