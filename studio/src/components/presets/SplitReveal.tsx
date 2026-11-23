import { AbsoluteFill, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = { children: React.ReactNode; label?: string; at?: number };

/**
 * Dos paneles tapan el cuadro con una etiqueta en la costura; en `at` se abren hacia
 * arriba y abajo (curva snap, 16 f) y destapan la escena. El contenido de atrás
 * hace un leve zoom-out mientras se abre, para que no se sienta pegado.
 */
export const SplitReveal: React.FC<Props> = ({ children, label = "", at = 24 }) => {
  const frame = useCurrentFrame();
  const { u } = useEscala();
  const p = tween(frame, at, 16, "snap");
  const labelOut = tween(frame, at - 4, 8, "leave");
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${1.08 - 0.08 * p})` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ top: 0, height: "50.2%", background: marca.colores.superficie, transform: `translateY(${-p * 100}%)` }} />
      <AbsoluteFill style={{ top: "49.8%", height: "50.2%", background: marca.colores.superficie, transform: `translateY(${p * 100}%)` }} />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 120 * u, opacity: 1 - labelOut }}>
        <div
          style={{
            fontFamily: marca.fuenteTexto,
            fontWeight: 600,
            fontSize: 30 * u,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: marca.colores.suave,
            transform: `translateY(${-labelOut * 20 * u}px)`,
          }}
        >
          {label}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
