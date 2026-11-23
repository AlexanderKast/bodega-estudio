import { useId } from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { arrive, curves, durationForDistance, leave, mix, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { marca } from "../../marca/marca";

/**
 * CardMorph — una tarjeta que muta de proporción y posición entre estados, con blur direccional.
 *
 * Técnica: los estados {w, h, x, y, radio, at} se encadenan con la curva `move` (A→B dentro de cuadro); la duración
 * sale del cambio más grande (tamaño o posición) por `durationForDistance`, acotada a 12–22 f. El "pegamento" del
 * morph es un desenfoque gaussiano con desviación distinta en X y en Y (filtro SVG): la tarjeta se borronea en la
 * dirección en que crece o viaja, y se enfoca al llegar. El color también se interpola. El contenido de cada estado
 * vive en una capa a tamaño completo de la tarjeta, así se re-acomoda con ella: el viejo sale rápido (`leave`, 6 f)
 * y el nuevo entra pasada la mitad del morph con `arrive`, desplazado y desenfocado.
 *
 * Origen: tiktok-7613879612723957012 (tarjeta vertical que muta a horizontal con blur de escala, move 14 f;
 * receta "nuevo:CardMorph"), tiktok-7697333991984221462 (tarjeta del host que se encoge con desenfoque, move 19 f).
 */

export type EstadoCard = {
  w: number; // u
  h: number;
  x: number; // centro, u
  y: number;
  at: number; // cuadro en que empieza el cambio hacia este estado (el primero: entrada)
  radio?: number;
  color?: string;
};

type Props = {
  estados: EstadoCard[];
  contenidos?: React.ReactNode[]; // uno por estado
  children?: React.ReactNode; // contenido persistente (no cambia, solo se re-acomoda)
  dur?: number; // fuerza la duración de cada morph
  blur?: number; // desenfoque máximo, u
  color?: string;
  entrada?: boolean;
  sombra?: boolean;
};

type Caja = { w: number; h: number; x: number; y: number; r: number; color: string };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const CardMorph: React.FC<Props> = ({
  estados,
  contenidos = [],
  children,
  dur,
  blur = 16,
  color = marca.colores.acento,
  entrada = true,
  sombra = true,
}) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const id = `morph-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (estados.length === 0) return null;

  const duraciones = estados.map((e, i) => {
    if (i === 0) return 0;
    const a = estados[i - 1];
    const cambio = Math.max(Math.abs(e.w - a.w), Math.abs(e.h - a.h), Math.hypot(e.x - a.x, e.y - a.y));
    return dur ?? Math.max(12, Math.min(22, durationForDistance(cambio)));
  });

  const caja = (fr: number, auditar: boolean): Caja & { k: number } => {
    const e0 = estados[0];
    let c: Caja = { w: e0.w, h: e0.h, x: e0.x, y: e0.y, r: e0.radio ?? 28, color: e0.color ?? color };
    let kActivo = 1;
    for (let i = 1; i < estados.length; i++) {
      const e = estados[i];
      const k = auditar ? tween(fr, e.at, duraciones[i], "move") : curves.move(clamp01((fr - e.at) / duraciones[i]));
      if (fr < e.at) continue;
      kActivo = k;
      c = {
        w: mix(k, c.w, e.w),
        h: mix(k, c.h, e.h),
        x: mix(k, c.x, e.x),
        y: mix(k, c.y, e.y),
        r: mix(k, c.r, e.radio ?? c.r),
        color: interpolateColors(k, [0, 1], [c.color, e.color ?? c.color]),
      };
    }
    return { ...c, k: kActivo };
  };

  const c = caja(f, true);
  const a = caja(f - 1, false);
  // Blur direccional: X por lo que crece en ancho o viaja en X; Y igual en vertical.
  const bx = Math.min(blur, Math.abs(c.x - a.x) * 0.45 + Math.abs(c.w - a.w) * 0.3) * u;
  const by = Math.min(blur, Math.abs(c.y - a.y) * 0.45 + Math.abs(c.h - a.h) * 0.3) * u;
  const conBlur = bx + by > 0.3;

  const e = entrada ? arrive(f, estados[0].at, 20, "arriveSoft") : 1;
  if (e <= 0) return null;

  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          left: (c.x - c.w / 2) * u,
          top: (c.y - c.h / 2) * u,
          width: c.w * u,
          height: c.h * u,
          borderRadius: c.r * u,
          background: c.color,
          overflow: "hidden",
          boxShadow: sombra ? `${-14 * u}px ${30 * u}px ${70 * u}px rgba(3,5,2,0.5)` : undefined,
          opacity: Math.min(1, e / 0.6),
          transform: `translateY(${(1 - e) * 60 * u}px) scale(${0.92 + 0.08 * e})`,
          filter: conBlur ? `url(#${id})` : undefined,
        }}
      >
        {children ? <div style={{ position: "absolute", inset: 0 }}>{children}</div> : null}
        {contenidos.map((nodo, i) => {
          const est = estados[i];
          if (!est) return null;
          const ini = i === 0 ? est.at + 8 : est.at + Math.round(duraciones[i] * 0.45);
          const q = arrive(f, ini, 14, "arrive");
          const sig = estados[i + 1];
          const fuera = sig ? leave(f, sig.at, 6) : 0;
          if (q <= 0 || fuera >= 1) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                opacity: Math.min(1, q / 0.6) * (1 - fuera),
                transform: `translateY(${((1 - q) * 22 - fuera * 10) * u}px)`,
                filter: `blur(${((1 - q) * 6 + fuera * 6) * u}px)`,
              }}
            >
              {nodo}
            </div>
          );
        })}
      </div>
    </>
  );
};
