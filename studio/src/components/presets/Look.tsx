import { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Luz, type LuzEscena } from "../../lib/luz";
import { marca } from "../../marca/marca";

/** Ajuste de tonos por zonas, como unas curvas con dos puntos más unos niveles de salida. */
export type Tonos = {
  /** Sombras, de −1 a 1: positivo las abre (más claras y con detalle), negativo las hunde. */
  sombras?: number;
  /** Luces, de −1 a 1: positivo las sube, negativo las comprime (recupera blancos quemados). */
  luces?: number;
  /** Nivel de salida del negro, 0–0,3: subirlo da el negro lavado de papel o de película. */
  negro?: number;
  /** Nivel de salida del blanco, 0,7–1: bajarlo apaga los blancos puros de pantalla. */
  blanco?: number;
};

type Props = Tonos & {
  grain?: number; // opacidad del grano, 0.04–0.10
  vignette?: number; // 0–1
  warmth?: string; // tinte de sombras (temperatura), color CSS
  /** Dirección de luz de la escena: con `children`, las sombras de `CutoutObject` y de `<Capa sombra>` la siguen. */
  luz?: Partial<LuzEscena>;
  /** Con `children`, Look envuelve la escena: aplica los tonos a su contenido y le comparte la luz. */
  children?: React.ReactNode;
};

const PUNTOS = 17;
// Peso de cada zona: las sombras pesan en el cuarto bajo de la curva y las luces en el cuarto alto;
// ninguna mueve el negro ni el blanco. 2,37 hace que ±1 desplace ±0,25 su zona.
const pesoSombras = (x: number) => 2.37 * x * Math.pow(1 - x, 3);
const pesoLuces = (x: number) => 2.37 * Math.pow(x, 3) * (1 - x);

/** Tabla de la curva de tonos para `feFuncR/G/B type="table"` (sirve también para dibujarla). */
export const curvaTonos = ({ sombras = 0, luces = 0, negro = 0, blanco = 1 }: Tonos): number[] =>
  Array.from({ length: PUNTOS }, (_, i) => {
    const x = i / (PUNTOS - 1);
    const y = Math.min(1, Math.max(0, x + sombras * pesoSombras(x) + luces * pesoLuces(x)));
    return Number((negro + y * (blanco - negro)).toFixed(4));
  });

const hayTonos = (t: Tonos) => Boolean(t.sombras || t.luces || t.negro || (t.blanco !== undefined && t.blanco !== 1));

/**
 * Pase de look final (kb/06): grano animado, viñeta y un tinte de la marca en las sombras.
 * Va como última capa de toda composición: quita el "plano digital" (AI-25, AI-32).
 *
 * Además, luces y sombras por separado (`sombras`, `luces`, `negro`, `blanco`): una curva de tonos
 * por filtro SVG. Sin esos valores el aspecto es el de siempre. Dos formas de uso:
 *
 * - Capa final, como hasta ahora: `<Look />` al final de la composición. Los tonos se aplican a lo
 *   que queda debajo (`backdrop-filter`).
 * - Envolviendo la escena: `<Look luz={{ angulo: 120 }} sombras={0.3}>…</Look>`. Aplica los tonos a
 *   su contenido y además fija la luz de la escena (`lib/luz.tsx`) para que todas las sombras caigan
 *   hacia el mismo lado. Si solo hace falta la luz, también sirve `<Luz>` suelto.
 */
export const Look: React.FC<Props> = ({
  grain = 0.07,
  vignette = 0.5,
  warmth = marca.colores.sombraCalida,
  sombras,
  luces,
  negro,
  blanco,
  luz,
  children,
}) => {
  const frame = useCurrentFrame();
  const id = `look-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // Semilla distinta cada 2 frames: el grano vive, pero no parpadea como estática.
  const seed = Math.floor(frame / 2) % 97;
  const tonos = { sombras, luces, negro, blanco };
  const conTonos = hayTonos(tonos);
  const tabla = conTonos ? curvaTonos(tonos).join(" ") : "";
  const capas = (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {conTonos ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="table" tableValues={tabla} />
              <feFuncG type="table" tableValues={tabla} />
              <feFuncB type="table" tableValues={tabla} />
            </feComponentTransfer>
          </filter>
        </svg>
      ) : null}
      {conTonos && !children ? <AbsoluteFill style={{ backdropFilter: `url(#${id})` }} /> : null}
      <AbsoluteFill style={{ background: warmth, mixBlendMode: "soft-light", opacity: 0.35 }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(130% 100% at 50% 45%, transparent 45%, rgba(8,6,4,${vignette}) 100%)`,
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: grain, mixBlendMode: "overlay" }}>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
  if (!children) return capas;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: conTonos ? `url(#${id})` : undefined }}>
        <Luz {...luz}>{children}</Luz>
      </AbsoluteFill>
      {capas}
    </AbsoluteFill>
  );
};
