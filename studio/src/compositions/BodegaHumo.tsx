import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useEscala } from "../lib/escala";
import { arrive, leave, springPreset, tween } from "../lib/motion";
import { marca } from "../marca/marca";

export const BODEGA_HUMO_DURACION = 150;

/**
 * Prueba de humo del estudio (scripts/humo.sh): 5 s con el logo real de Bodega y un titular en Impact.
 * Sirve para confirmar que el equipo o el VPS renderizan con la marca. No es una pieza de entrega.
 * Tiempos (kb/02): logo entra 0–18 f, titular 10–32 f, filete 24–44 f, hold y salida corta en 132–150 f.
 */
export const BodegaHumo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const logo = springPreset(frame, fps, "pop", 0);
  const titulo = arrive(frame, 10, 22, "arriveSoft");
  const filete = tween(frame, 24, 20, "move");
  const salida = leave(frame, 132, 18);
  return (
    <AbsoluteFill
      style={{
        background: marca.colores.fondo,
        alignItems: "center",
        justifyContent: "center",
        opacity: 1 - salida,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48 * u }}>
        <Img
          src={staticFile(marca.logos.sobreOscuro)}
          style={{ width: 520 * u, transform: `scale(${0.85 + 0.15 * logo})`, opacity: Math.min(1, logo * 2) }}
        />
        <div
          style={{
            fontFamily: marca.fuenteTitulo,
            fontSize: 120 * u,
            lineHeight: 0.95,
            textTransform: "uppercase",
            color: marca.colores.acentoClaro,
            clipPath: `inset(0 0 ${(1 - titulo) * 100}% 0)`,
            transform: `translateY(${(1 - titulo) * 30 * u}px)`,
          }}
        >
          Bodega Estudio
        </div>
        <div style={{ width: 360 * u * filete, height: 6 * u, background: marca.colores.acento, borderRadius: 3 * u }} />
        <div style={{ fontFamily: marca.fuenteTexto, fontSize: 36 * u, color: marca.colores.suave, opacity: arrive(frame, 36, 16) }}>
          Prueba de render
        </div>
      </div>
    </AbsoluteFill>
  );
};
