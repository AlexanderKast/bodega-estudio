import { useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { byDistance, springPreset } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

export type DepthCard = { title: string; body: string; x: number; y: number; w: number; h: number; z?: number };

type Props = { cards: DepthCard[]; delay?: number; focus?: { x: number; y: number } };

/**
 * Tarjetas en perspectiva con tamaños jerárquicos (una héroe, no grilla de 3 iguales: AI-26).
 * Entran ordenadas por distancia al foco, con spring heavy para las grandes y snappy
 * para las chicas, y quedan inclinadas en Y como en un plano 3D.
 * Coordenadas en un lienzo de 1080 de alto.
 */
export const DepthCards: React.FC<Props> = ({ cards, delay = 0, focus = { x: 700, y: 540 } }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const order = byDistance(cards, focus.x, focus.y);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1800 * u }}>
      {cards.map((c, i) => {
        const rank = order.indexOf(c);
        const big = c.w * c.h > 200000;
        const s = springPreset(frame, fps, big ? "heavy" : "snappy", delay + rank * 3);
        const z = c.z ?? 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x * u,
              top: c.y * u,
              width: c.w * u,
              height: c.h * u,
              borderRadius: (big ? 22 : 12) * u,
              background: big ? marca.colores.acento : marca.colores.superficie,
              color: big ? marca.colores.fondo : marca.colores.texto,
              padding: 36 * u,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              boxShadow: `${-30 * u}px ${40 * u}px ${70 * u}px rgba(10,6,4,0.55)`,
              opacity: Math.min(1, s * 2),
              transform: `translate3d(0, ${(1 - s) * 220 * u}px, ${z * u}px) rotateY(${-14 + (1 - s) * -20}deg) rotateX(${(1 - s) * 18}deg)`,
              transformOrigin: "50% 100%",
            }}
          >
            <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 800, fontSize: (big ? 76 : 40) * u, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {c.title}
            </div>
            <div style={{ fontFamily: marca.fuenteTexto, fontSize: (big ? 30 : 22) * u, opacity: 0.75, marginTop: 10 * u }}>{c.body}</div>
          </div>
        );
      })}
    </div>
  );
};
