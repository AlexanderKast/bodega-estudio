import { useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = { name: string; role: string; delay?: number; exitAt?: number };

/**
 * Rótulo de nombre: la barra de acento crece (10 f), el nombre se destapa con máscara
 * desde la izquierda (16 f) y el cargo entra 6 f después. Sale más rápido de lo que
 * entró y con curva leave (AI-05).
 */
export const LowerThird: React.FC<Props> = ({ name, role, delay = 0, exitAt }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const bar = arrive(frame, delay, 10);
  const nameP = arrive(frame, delay + 5, 16, "arriveSoft");
  const roleP = arrive(frame, delay + 11, 14);
  const out = exitAt === undefined ? 0 : leave(frame, exitAt, 10);
  return (
    <div
      style={{
        display: "flex",
        gap: 24 * u,
        alignItems: "stretch",
        transform: `translateX(${-out * 60 * u}px)`,
        opacity: 1 - out,
      }}
    >
      <div style={{ width: 8 * u, background: marca.colores.acento, transform: `scaleY(${bar})`, transformOrigin: "50% 100%" }} />
      <div>
        <div
          style={{
            fontFamily: marca.fuenteTitulo,
            fontWeight: 800,
            fontSize: 64 * u,
            letterSpacing: "-0.03em",
            color: marca.colores.texto,
            clipPath: `inset(0 ${(1 - nameP) * 100}% 0 0)`,
            transform: `translateX(${(1 - nameP) * -20 * u}px)`,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: marca.fuenteTexto,
            fontWeight: 500,
            fontSize: 30 * u,
            color: marca.colores.suave,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            marginTop: 6 * u,
            opacity: Math.min(1, roleP / 0.6),
            transform: `translateY(${(1 - roleP) * 14 * u}px)`,
          }}
        >
          {role}
        </div>
      </div>
    </div>
  );
};
