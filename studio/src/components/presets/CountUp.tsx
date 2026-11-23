import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, inertialBounce, mix } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  to: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label?: string;
  delay?: number;
  duration?: number; // 24–48 f (kb/02)
};

/**
 * Contador: corre rápido al inicio y frena en el valor (arriveSoft). Al llegar, el
 * número hace un inertial bounce de escala (expresión de AE) y la barra termina 6 f después.
 * Cifras tabulares para que el ancho no tiemble.
 */
export const CountUp: React.FC<Props> = ({ to, from = 0, prefix = "", suffix = "", decimals = 0, label, delay = 0, duration = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const p = arrive(frame, delay, duration, "arriveSoft");
  const value = mix(p, from, to);
  const bounce = inertialBounce(frame - (delay + duration * 0.8), fps, 0.05);
  const bar = arrive(frame, delay + 6, duration, "arriveSoft");
  const labelIn = arrive(frame, delay + 10, 16);
  return (
    <div style={{ fontFamily: marca.fuenteTitulo, color: marca.colores.texto }}>
      <div
        style={{
          fontSize: 260 * u,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          lineHeight: 0.9,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${1 + bounce})`,
          transformOrigin: "0% 100%",
        }}
      >
        {prefix}
        {value.toLocaleString("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        <span style={{ color: marca.colores.acento }}>{suffix}</span>
      </div>
      <div style={{ height: 10 * u, width: 520 * u, background: `${marca.colores.texto}1f`, marginTop: 28 * u, borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${bar * 100}%`, background: marca.colores.acento, borderRadius: 2 }} />
      </div>
      {label ? (
        <div
          style={{
            fontFamily: marca.fuenteTexto,
            fontSize: 38 * u,
            color: marca.colores.suave,
            marginTop: 22 * u,
            opacity: Math.min(1, labelIn / 0.6),
            transform: `translateY(${(1 - labelIn) * 16 * u}px)`,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
