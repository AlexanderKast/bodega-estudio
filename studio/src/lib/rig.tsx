import { createContext, useContext } from "react";
import { escalaXY, type Xf } from "./anclas";
import { filtroSombra, useLuz } from "./luz";

/**
 * Capa con transformación propia que hereda la de su padre: el parenting y los null objects de
 * After Effects. Una `<Capa>` dentro de otra se mueve, gira y escala con ella, y además tiene su
 * movimiento propio alrededor de su pivote. Una `<Capa>` sin contenido visible es un null.
 *
 * El origen de la capa es su punto (x, y); el contenido se dibuja alrededor de ese origen. Con
 * `centrar`, el contenido queda centrado en él. El pivote va en px medidos desde el origen
 * (por ejemplo el hombro de un brazo: `pivote={[0, 0]}` y el brazo dibujado hacia abajo).
 *
 * Para el retraso entre padre e hijo (overlap, drag) usa `conRetraso` de `timeline.ts`; para saber
 * dónde queda un punto de la capa en el mundo, `enMundo` de `anclas.ts` con las mismas `Xf`.
 *
 * `sombra` proyecta la sombra de la capa según la luz de la escena (`<Luz>` de `luz.tsx`): es la
 * altura sobre el soporte, de 0 (apoyada) a 1 (en el aire). Aunque la capa o sus padres giren, la
 * sombra cae siempre hacia el mismo lado, igual que la de `CutoutObject`.
 */
type Props = Xf & {
  children?: React.ReactNode;
  opacidad?: number;
  centrar?: boolean;
  desenfoque?: number; // px
  sombra?: number; // altura 0–1; sin valor, no proyecta sombra
  estilo?: React.CSSProperties;
};

/** Giro y escala acumulados de las capas que envuelven a esta (para orientar la sombra). */
const RigCtx = createContext<{ rot: number; escala: number }>({ rot: 0, escala: 1 });

export const Capa: React.FC<Props> = ({
  x = 0,
  y = 0,
  rot = 0,
  escala,
  pivote = [0, 0],
  opacidad = 1,
  centrar = false,
  desenfoque = 0,
  sombra,
  estilo,
  children,
}) => {
  const [sx, sy] = escalaXY(escala);
  const padre = useContext(RigCtx);
  const luz = useLuz();
  const acumulado = { rot: padre.rot + rot, escala: padre.escala * Math.sqrt(Math.abs(sx * sy)) };
  const filtros = [
    desenfoque > 0.05 ? `blur(${desenfoque.toFixed(2)}px)` : "",
    sombra === undefined ? "" : filtroSombra(luz, sombra, acumulado),
  ].filter(Boolean);
  return (
    <RigCtx.Provider value={acumulado}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          transformOrigin: `${pivote[0]}px ${pivote[1]}px`,
          transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
          opacity: opacidad,
          filter: filtros.length ? filtros.join(" ") : undefined,
          ...estilo,
        }}
      >
        {centrar ? (
          <div style={{ position: "absolute", left: 0, top: 0, transform: "translate(-50%, -50%)", width: "max-content" }}>{children}</div>
        ) : (
          children
        )}
      </div>
    </RigCtx.Provider>
  );
};
