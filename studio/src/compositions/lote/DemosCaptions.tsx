import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { springPreset, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { Look } from "../../components/presets/Look";
import type { TimedWord } from "../../components/presets/KaraokeCaption";
import { ChipCaption } from "../../components/presets/ChipCaption";
import { Pill } from "../../components/presets/Pill";
import { BlurStack } from "../../components/presets/BlurStack";
import { TypeSandwich } from "../../components/presets/TypeSandwich";

/**
 * Escenas de muestra del lote de captions y titulares (ChipCaption, Pill, BlurStack, TypeSandwich).
 * 1920×1080 a 30 fps. Se registran desde fuera: aquí solo se exportan las escenas y su manifiesto.
 */

const Escenario: React.FC<{ children: React.ReactNode; tono?: "fondo" | "superficie"; pad?: boolean }> = ({
  children,
  tono = "fondo",
  pad = true,
}) => {
  const { u } = useEscala();
  const frame = useCurrentFrame();
  // Push-in lento de la escena (3 %), para que el cuadro no quede muerto.
  const push = tween(frame, 0, 150, "glide");
  return (
    <AbsoluteFill style={{ background: marca.colores[tono] }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(65% 55% at 20% 28%, ${marca.colores.acento}18 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          padding: pad ? `${110 * u}px ${150 * u}px` : 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          transform: `scale(${1 + push * 0.03})`,
          transformOrigin: "30% 45%",
        }}
      >
        {children}
      </AbsoluteFill>
      <Look />
    </AbsoluteFill>
  );
};

/** Construye TimedWord[] a partir de [texto, duración en cuadros, silencio después]. */
const linea = (desde: number, partes: [string, number, number?][]): TimedWord[] => {
  let t = desde;
  return partes.map(([text, d, pausa = 1]) => {
    const w = { text, start: t, end: t + d };
    t += d + pausa;
    return w;
  });
};

const voz = linea(8, [
  ["Este", 6],
  ["video", 8],
  ["lo", 4],
  ["hizo", 7, 2],
  ["Claude,", 12, 6],
  ["con", 5],
  ["animaciones", 14],
  ["y", 3],
  ["sonido", 10, 4],
  ["incluidos.", 14],
]);

const EscenaChipCaption: React.FC = () => (
  <Escenario tono="superficie">
    <ChipCaption words={voz} claves={["claude", "animaciones", "incluidos"]} size={84} />
  </Escenario>
);

const EscenaPill: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  // El punto focal del cluster: un disco de acento que aparece justo antes que las pills.
  const foco = springPreset(frame, fps, "pop", 24);
  return (
    <Escenario>
      <Pill variante="top" texto="Hecho con IA" icono="IA" delay={2} exitAt={104} />
      <div style={{ marginTop: 40 * u }}>
        <Pill variante="paso" numero={1} texto="Aterriza tu idea" delay={12} exitAt={100} />
      </div>
      <div style={{ position: "relative", marginTop: 10 * u, marginLeft: 120 * u }}>
        <div
          style={{
            position: "absolute",
            left: 450 * u - 46 * u,
            top: 260 * u - 46 * u,
            width: 92 * u,
            height: 92 * u,
            borderRadius: "50%",
            background: marca.colores.acento,
            transform: `scale(${0.6 + 0.4 * foco})`,
            opacity: Math.min(1, foco * 3),
          }}
        />
        <Pill
          variante="cluster"
          delay={28}
          exitAt={96}
          origen={{ x: 450, y: 260 }}
          items={[
            { texto: "Historia", numero: 1 },
            { texto: "Público", numero: 2 },
            { texto: "Objetivo", numero: 3 },
            { texto: "Ritmo", numero: 4 },
          ]}
        />
      </div>
    </Escenario>
  );
};

const EscenaBlurStack: React.FC = () => (
  <Escenario>
    <BlurStack
      lineas={["Menos plantilla.", "Más criterio", "de motion designer."]}
      foco={1}
      residuo={7}
      delay={6}
      exitAt={96}
      size={128}
    />
  </Escenario>
);

const EscenaTypeSandwich: React.FC = () => (
  <Escenario tono="superficie">
    <TypeSandwich lineas={["Motion con", "*criterio* de", "diseñador"]} delay={6} exitAt={90} size={170} />
  </Escenario>
);

export const escenasCaptions: Record<string, React.FC> = {
  ChipCaption: EscenaChipCaption,
  Pill: EscenaPill,
  BlurStack: EscenaBlurStack,
  TypeSandwich: EscenaTypeSandwich,
};

export const manifestCaptions: { id: string; duration: number; still: number }[] = [
  { id: "ChipCaption", duration: 120, still: 60 },
  { id: "Pill", duration: 120, still: 70 },
  { id: "BlurStack", duration: 120, still: 56 },
  { id: "TypeSandwich", duration: 110, still: 66 },
];
