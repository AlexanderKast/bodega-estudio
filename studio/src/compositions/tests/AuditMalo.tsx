import { AbsoluteFill, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { sfx } from "../../lib/cues";
import { arrive } from "../../lib/motion";
import { track } from "../../lib/timeline";

/**
 * Composición de prueba con tells a propósito: scripts/test-audit.mjs verifica que
 * motion-audit los detecte. No es un ejemplo a seguir.
 * - 5 elementos con el mismo inicio y la misma duración (AI-02, AI-04)
 * - golpes exactos cada 30 f (AI-11, ritmo de metrónomo)
 * - un hueco de 4 s sin eventos (D-01 con género "anuncio")
 * - 2 risers, 3 whoosh largos y un pop pegado al hit (reglas de sonido)
 * - un desplazamiento de 900 px en 10 f sin motion blur (B-01)
 */
const N = 5;

export const AUDIT_MALO_DURATION = 300;

export const AuditMalo: React.FC = () => {
  const frame = useCurrentFrame();
  const items = Array.from({ length: N }, (_, i) => arrive(frame, 10, 20));
  const beats = [40, 70, 100, 130, 160, 190].map((b) => arrive(frame, b, 20));
  arrive(frame, 280, 20); // tras un hueco de 90 f
  track(frame, [
    { t: 282, v: 0 },
    { t: 292, v: 900 },
  ]); // 900 px en 10 f sin blur (B-01)
  sfx(frame, "riser", 60);
  sfx(frame, "riser", 150);
  sfx(frame, "whoosh.long", 70);
  sfx(frame, "whoosh.long", 100);
  sfx(frame, "whoosh.long", 130);
  sfx(frame, "hit", 160, { keep: true });
  sfx(frame, "pop", 163);
  return (
    <AbsoluteFill style={{ background: marca.colores.fondo, color: marca.colores.texto, fontFamily: marca.fuenteTexto }}>
      {items.map((p, i) => (
        <div key={i} style={{ opacity: p }}>
          ítem {i}
        </div>
      ))}
      {beats.map((p, i) => (
        <div key={`b${i}`} style={{ opacity: p }}>
          golpe {i}
        </div>
      ))}
    </AbsoluteFill>
  );
};
