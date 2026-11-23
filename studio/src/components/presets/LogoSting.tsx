import { Img, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, springPreset, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  wordmark: string;
  tagline?: string;
  mark?: React.ReactNode;
  delay?: number;
  /** Logo oficial completo (símbolo + wordmark), p. ej. staticFile(marca.logos.sobreOscuro). Reemplaza al
   *  símbolo y al wordmark de texto: la marca nunca se redibuja (reglas de marca.json). */
  logo?: string;
  /** Ancho del logo en px de un lienzo de 1080. */
  logoAncho?: number;
};

/**
 * Sting de logo (kb/02: build 1–2 s, golpe, hold 1.5–2.5 s):
 * 1) el símbolo se abre con máscara circular y spring pop (escala desde 0.6, nunca 0),
 * 2) el wordmark se destapa con máscara 6 f después, 3) un brillo cruza el wordmark,
 * 4) tagline al final. Luego queda quieto con un push mínimo.
 * Con `logo`, el logo oficial entra con el mismo pop y la misma máscara, y el brillo cruza solo sus trazos.
 */
export const LogoSting: React.FC<Props> = ({ wordmark, tagline, mark, delay = 0, logo, logoAncho = 820 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useEscala();
  const m = springPreset(frame, fps, "pop", delay);
  const maskR = arrive(frame, delay, 16, "arriveSoft");
  const word = arrive(frame, delay + 6, 20, "arriveSoft");
  const sweep = tween(frame, delay + 22, 26, "move");
  const tag = arrive(frame, delay + 30, 16);
  const size = 150 * u;
  const lineaTag = (alinear: "left" | "center") =>
    tagline ? (
      <div
        style={{
          fontFamily: marca.fuenteTexto,
          fontSize: 34 * u,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textAlign: alinear,
          color: marca.colores.suave,
          marginTop: 18 * u,
          opacity: Math.min(1, tag / 0.6),
          transform: `translateY(${(1 - tag) * 14 * u}px)`,
        }}
      >
        {tagline}
      </div>
    ) : null;
  if (logo) {
    const ancho = logoAncho * u;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            width: ancho,
            clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
            transform: `scale(${0.92 + 0.08 * m}) translateX(${(1 - word) * -40 * u}px)`,
          }}
        >
          <Img src={logo} style={{ width: ancho, display: "block" }} />
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(100deg, transparent ${sweep * 180 - 40}%, ${marca.colores.texto}cc ${sweep * 180 - 25}%, transparent ${sweep * 180 - 10}%)`,
              mixBlendMode: "overlay",
              WebkitMaskImage: `url(${logo})`,
              maskImage: `url(${logo})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
          />
        </div>
        {lineaTag("center")}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 40 * u }}>
      <div
        style={{
          width: size,
          height: size,
          clipPath: `circle(${maskR * 72}% at 50% 50%)`,
          transform: `scale(${0.6 + 0.4 * m}) rotate(${(1 - m) * -30}deg)`,
        }}
      >
        {mark ?? (
          <svg viewBox="0 0 100 100" width={size} height={size}>
            <rect width="100" height="100" rx="26" fill={marca.colores.acento} />
            <path d="M24 70 L44 30 L56 54 L64 40 L78 70 Z" fill={marca.colores.fondo} />
          </svg>
        )}
      </div>
      <div>
        <div
          style={{
            position: "relative",
            fontFamily: marca.fuenteTitulo,
            fontWeight: 800,
            fontSize: 140 * u,
            letterSpacing: "-0.05em",
            lineHeight: 0.95,
            color: marca.colores.texto,
            clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
            transform: `translateX(${(1 - word) * -40 * u}px)`,
          }}
        >
          {wordmark}
          <span
            style={{
              position: "absolute",
              inset: 0,
              // La franja viaja de −40 % a 140 %: entra y sale completa del wordmark.
              background: `linear-gradient(100deg, transparent ${sweep * 180 - 40}%, ${marca.colores.texto}cc ${sweep * 180 - 25}%, transparent ${sweep * 180 - 10}%)`,
              mixBlendMode: "overlay",
            }}
          />
        </div>
        {lineaTag("left")}
      </div>
    </div>
  );
};
