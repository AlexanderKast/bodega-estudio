import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { AuditPausa } from "../../lib/audit";
import { marca } from "../../marca/marca";

type Props = { children: React.ReactNode; at: number; frames?: number; seed?: string };

/**
 * Glitch sobrio: solo dura 3–4 frames en un golpe de audio. Corta el cuadro en
 * franjas desplazadas y deja un fantasma de acento desfasado. Determinista
 * (random con semilla), así el render siempre da lo mismo.
 */
export const GlitchHit: React.FC<Props> = ({ children, at, frames = 4, seed = "glitch" }) => {
  const frame = useCurrentFrame();
  const local = frame - at;
  if (local < 0 || local >= frames) return <AbsoluteFill>{children}</AbsoluteFill>;
  const bands = 6;
  return (
    <AbsoluteFill>
      {/* La primera franja cuenta para la auditoría; el fantasma y las demás son copias visuales. */}
      <AbsoluteFill style={{ clipPath: `inset(0 0 ${100 - 100 / bands}% 0)` }}>{children}</AbsoluteFill>
      <AuditPausa activa />
      <AbsoluteFill style={{ transform: `translateX(${(random(`${seed}-g-${local}`) - 0.5) * 30}px)`, opacity: 0.55, mixBlendMode: "screen" }}>
        <AbsoluteFill style={{ background: marca.colores.acento, mixBlendMode: "multiply" }} />
        {children}
      </AbsoluteFill>
      {Array.from({ length: bands }).map((_, i) => {
        if (i === 0) return null; // ya está arriba, contada
        const top = (i / bands) * 100;
        const shift = (random(`${seed}-${local}-${i}`) - 0.5) * 80 * (random(`${seed}-on-${local}-${i}`) > 0.4 ? 1 : 0);
        return (
          <AbsoluteFill key={i} style={{ clipPath: `inset(${top}% 0 ${100 - top - 100 / bands}% 0)`, transform: `translateX(${shift}px)` }}>
            {children}
          </AbsoluteFill>
        );
      })}
      <AuditPausa activa={false} />
    </AbsoluteFill>
  );
};
