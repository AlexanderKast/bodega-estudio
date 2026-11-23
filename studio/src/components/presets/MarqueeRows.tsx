import { AbsoluteFill, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  rows: string[];
  /** Fila destacada en acento (por defecto, la del medio; -1 = ninguna). */
  highlight?: number;
  /** Velocidad base en px por cuadro sobre 1080. Cada fila la varía un poco y alterna dirección. */
  speed?: number;
  size?: number;
  /** Inclinación del bloque en grados. */
  angle?: number;
  delay?: number;
  exitAt?: number;
  /** Alterna filas llenas y en contorno. */
  outline?: boolean;
  /** La fila destacada va sobre una banda de acento (texto en color de fondo). */
  band?: boolean;
  /** Repeticiones del texto por mitad de fila. */
  copies?: number;
  color?: string;
  accent?: string;
  ink?: string;
};

/**
 * Filas de texto en marquee (kb/13, técnica MarqueeRows). Cada fila lleva dos mitades idénticas y se corre en
 * porcentaje módulo 50 %, así el bucle es perfecto sin medir el texto. La velocidad es constante (un marquee
 * es lineal por definición) pero cada fila tiene la suya y alterna dirección. La entrada sí va con curva:
 * las filas suben desde su máscara con stagger no lineal desde la destacada hacia afuera, y llegan con un
 * empujón de velocidad que se apaga con arriveSoft hasta el ritmo de crucero. La salida acelera con `leave`.
 * La fila destacada va en acento (o en banda). Sale de los pins
 * e1_AfqPShz92pVnWLX7DayXdFiNEe5S7pk1c1xxu2XQpMVFLnqNpm0a (filas diagonales, relleno y contorno),
 * e1_AfqPShzf2uYi-QJJpXt3THMB2dxgS094z5zVcGkeus4WjVWWUmQg (filas rotadas a velocidad opuesta) y
 * e1_AfqPShyILVHq2RGs_j1pfrtDnCxua4BKFE3KapTpMuBOu2wLaOci (filas pegadas con recorte en el borde).
 */
export const MarqueeRows: React.FC<Props> = ({
  rows,
  highlight,
  speed = 3,
  size = 150,
  angle = -12,
  delay = 0,
  exitAt,
  outline = true,
  band = false,
  copies = 6,
  color = marca.colores.texto,
  accent = marca.colores.acento,
  ink = marca.colores.fondo,
}) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const hi = highlight ?? Math.floor(rows.length / 2);
  const focus = hi >= 0 ? hi : (rows.length - 1) / 2;
  const maxRank = Math.ceil(Math.max(focus, rows.length - 1 - focus));
  const fs = size * u;

  return (
    <AbsoluteFill style={{ overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: "180%", transform: `rotate(${angle}deg)`, display: "flex", flexDirection: "column", gap: fs * 0.06 }}>
        {rows.map((text, i) => {
          const isHi = i === hi;
          const rank = Math.round(Math.abs(i - focus));
          const start = delay + staggerDelay(rank, maxRank + 1, 12);
          const reveal = arrive(frame, start, 18, "arriveSoft");
          const kick = arrive(frame, start, 28, "arriveSoft");
          const out = exitAt === undefined ? 0 : leave(frame, exitAt + staggerDelay(maxRank - rank, maxRank + 1, 6), 16, "leave");

          const unit = `${text.toUpperCase()} · `;
          const halfPx = copies * [...unit].length * 0.6 * fs; // estimación: solo escala la velocidad, el bucle no depende de ella
          const dir = i % 2 === 0 ? -1 : 1;
          const v = speed * u * (1 + 0.22 * ((i * 7) % 3)) * (isHi ? 0.8 : 1);
          // Marquee: velocidad constante a propósito; el empujón de entrada y la salida van con curva del kit.
          const px = v * frame + (1 - kick) * 520 * u + out * 1400 * u + i * 137 * u;
          const pct = (((px / halfPx) * 50) % 50 + 50) % 50;
          const shift = dir < 0 ? -pct : pct - 50;

          const filled = !outline || i % 2 === 0 || isHi;
          const fill = isHi ? (band ? ink : accent) : filled ? color : "transparent";
          return (
            <div
              key={i}
              style={{
                overflow: "hidden",
                background: isHi && band ? accent : undefined,
                padding: isHi && band ? `${fs * 0.04}px 0` : undefined,
                opacity: 1 - out * 0.5,
              }}
            >
              <div
                style={{
                  display: "flex",
                  whiteSpace: "nowrap",
                  width: "max-content",
                  transform: `translateY(${(1 - reveal) * 105}%) translateX(${shift}%)`,
                  fontFamily: marca.fuenteTitulo,
                  fontWeight: 700,
                  fontSize: fs,
                  lineHeight: 0.98,
                  letterSpacing: "-0.035em",
                  color: fill,
                  WebkitTextStroke: filled ? undefined : `${1.6 * u}px ${color}`,
                }}
              >
                {[0, 1].map((h) => (
                  <span key={h}>{unit.repeat(copies)}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
