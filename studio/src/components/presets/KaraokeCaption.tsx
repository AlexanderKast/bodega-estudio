import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

export type TimedWord = { text: string; start: number; end: number }; // frames

type Props = { words: TimedWord[]; size?: number };

/**
 * Subtítulo palabra a palabra sincronizado a la voz (words.json de Whisper/WhisperX).
 * La palabra activa sube 4 % y toma el acento; las dichas quedan llenas y las que
 * vienen al 35 %. Un subrayado corre bajo la palabra activa.
 */
export const KaraokeCaption: React.FC<Props> = ({ words, size = 72 }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  return (
    <div
      style={{
        fontFamily: marca.fuenteTitulo,
        fontWeight: 800,
        fontSize: size * u,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        display: "flex",
        flexWrap: "wrap",
        gap: `0 ${0.28 * size * u}px`,
        maxWidth: 1300 * u,
      }}
    >
      {words.map((w, i) => {
        const on = arrive(frame, w.start, 4, "arriveGentle");
        const off = arrive(frame, w.end, 5, "arriveGentle");
        const active = on * (1 - off);
        const seen = frame >= w.start;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              color: active > 0.5 ? marca.colores.acento : marca.colores.texto,
              opacity: seen ? 1 : 0.35,
              transform: `translateY(${-active * 4 * u}px) scale(${1 + active * 0.04})`,
            }}
          >
            {w.text}
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -6 * u,
                height: 6 * u,
                background: marca.colores.acento,
                transform: `scaleX(${active})`,
                transformOrigin: "0% 50%",
              }}
            />
          </span>
        );
      })}
    </div>
  );
};
