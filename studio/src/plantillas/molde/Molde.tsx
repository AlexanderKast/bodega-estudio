import { AbsoluteFill, Img, OffthreadVideo, Sequence } from "remotion";
import { z } from "zod";
import { CharCascade } from "../../components/presets/CharCascade";
import { MaskTitle } from "../../components/presets/MaskTitle";
import { PunchIn } from "../../components/presets/PunchIn";
import { useEscala } from "../../lib/escala";
import { cuadros } from "../../lib/formatos";
import { colores, definir, esVideo, resolverMedia, zColores, zMedia } from "../base";

/**
 * Molde de plantilla replicada (kb/14-plantillas.md). No viene de una referencia: es el punto de partida
 * que /replicar copia a `plantillas/<id>/` y ajusta a la receta medida del video.
 * Estructura típica de un short editado: gancho letra a letra, beats con corte seco y punch-in a mitad
 * de plano, titular por máscara abajo a la izquierda (fuera de la interfaz de Reels/TikTok) y cierre.
 */
export const schema = z.object({
  beats: z
    .array(
      z.object({
        texto: z.string().describe("2–5 palabras; la primera línea del beat"),
        segundos: z.number().min(0.4).max(6),
        media: zMedia,
        punch: z.boolean().default(true).describe("punch-in rápido (3 f, snap) a mitad del plano"),
      }),
    )
    .min(1),
  cierre: z.string().describe("texto del último plano"),
  segundosCierre: z.number().min(0.8).max(5).default(2),
  colores: zColores,
});

type Props = z.infer<typeof schema>;

const Media: React.FC<{ src: string; fondo: string }> = ({ src, fondo }) => {
  if (!src) return <AbsoluteFill style={{ backgroundColor: fondo }} />;
  const url = resolverMedia(src);
  const estilo = { width: "100%", height: "100%", objectFit: "cover" as const };
  return esVideo(src) ? <OffthreadVideo src={url} muted style={estilo} /> : <Img src={url} style={estilo} />;
};

/** Texto anclado abajo a la izquierda sobre la zona segura. */
const Rotulo: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { zona } = useEscala();
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: `${zona.arriba}px ${zona.lados}px ${zona.abajo}px` }}>
      {children}
    </AbsoluteFill>
  );
};

export const Molde: React.FC<Props> = ({ beats, cierre, segundosCierre, colores: c }) => {
  const col = colores(c);
  let desde = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: col.fondo }}>
      {beats.map((b, i) => {
        const dur = cuadros(b.segundos);
        const inicio = desde;
        desde += dur;
        return (
          <Sequence key={i} from={inicio} durationInFrames={dur}>
            <PunchIn punches={b.punch ? [{ at: Math.round(dur * 0.55), scale: i % 2 ? 1.1 : 1.16, dur: 3 }] : []}>
              <Media src={b.media} fondo={col.superficie} />
            </PunchIn>
            <Rotulo>
              {i === 0 ? (
                <CharCascade text={b.texto} size={128} color={col.texto} delay={3} />
              ) : (
                <MaskTitle lines={[b.texto]} size={112} color={col.texto} delay={2} />
              )}
            </Rotulo>
          </Sequence>
        );
      })}
      <Sequence from={desde} durationInFrames={cuadros(segundosCierre)}>
        <Rotulo>
          <MaskTitle lines={[cierre]} size={150} color={col.acento} delay={4} />
        </Rotulo>
      </Sequence>
    </AbsoluteFill>
  );
};

export const molde = definir({
  id: "Plantilla-Molde",
  fuente: "ninguna (molde base)",
  resumen: "Texto con gancho letra a letra, cortes secos y punch-in sobre tu material, con rótulo abajo a la izquierda.",
  cuando: "Un reel corto de frases sobre video o fotos, o como punto de partida para una plantilla nueva.",
  schema,
  componente: Molde,
  defaultProps: {
    beats: [
      { texto: "Nadie te dice esto", segundos: 1.6, media: "", punch: true },
      { texto: "El corte va al golpe", segundos: 1.1, media: "", punch: true },
      { texto: "Y el texto respira", segundos: 1.5, media: "", punch: true },
    ],
    cierre: "Síguelo",
    segundosCierre: 2,
    colores: {},
  },
  duracion: (p) => p.beats.reduce((s, b) => s + cuadros(b.segundos), 0) + cuadros(p.segundosCierre),
  formatos: ["vertical", "retrato", "cuadrado"],
});
