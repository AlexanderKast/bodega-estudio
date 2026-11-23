import { useId } from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, leave, mix, springPreset, type SpringName, wiggle } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { aEspacioLocal, sombrasDeLuz, useLuz } from "../../lib/luz";

/** Sombra propia del objeto. Lo que no se indique sale de la luz de la escena (`<Luz>` de lib/luz.tsx). */
type Sombra = {
  /** Dirección de la luz: hacia dónde cae la sombra, en grados (0 = derecha, 90 = abajo). */
  angulo?: number;
  /** Largo de la sombra proyectada en px a 1080, con el objeto ya apoyado. */
  largo?: number;
  /** Opacidad de la sombra larga (la de contacto va al doble, más corta). */
  opacidad?: number;
  /** Color de la sombra: tinta del papel, nunca negro puro. */
  color?: string;
};

type Props = {
  /** PNG con alfa (staticFile o URL). Sin `src` ni `children` dibuja una forma de muestra. */
  src?: string;
  /** Contenido propio en lugar de la imagen (por ejemplo un SVG). */
  children?: React.ReactNode;
  /** Ancho del objeto en px a 1080. */
  ancho?: number;
  /** Centro del objeto en 0–1 del cuadro. */
  x?: number;
  y?: number;
  /** Cuadro de entrada. */
  at?: number;
  /** Cuadro de salida. Por defecto, 12 f antes del final. `null` = no sale. */
  out?: number | null;
  /** Rotación de reposo y de arranque (grados). La entrada gira de una a otra. */
  rotacion?: number;
  rotacionInicial?: number;
  /** Escala de arranque: nunca desde 0 (kb/01 §4 regla 7); 0.6–0.8 para objetos que "caen" al papel. */
  escalaInicial?: number;
  /** Spring de la entrada: `heavy` para objetos grandes, `snappy` para chicos. */
  resorte?: SpringName;
  /** Borde blanco recortado tipo sticker. */
  sticker?: boolean;
  /** Grosor del borde sticker en px a 1080. */
  borde?: number;
  colorBorde?: string;
  sombra?: Sombra;
  /** Deriva mientras se sostiene, en px a 1080 (0 = quieto). */
  deriva?: number;
  seed?: string;
};

/** Forma de muestra: un recorte orgánico con dos tonos de la marca, para probar sombra y sticker sin asset. */
const Muestra: React.FC = () => (
  <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: "block" }}>
    <path
      d="M206 18c62 4 128 40 158 98s20 128-14 182-96 92-160 86S62 342 34 284 6 160 44 104 144 14 206 18z"
      fill={marca.colores.acento}
    />
    <path d="M150 112c40-18 104-10 132 26s20 92-16 122-98 30-132 0-24-130 16-148z" fill={marca.colores.acentoProfundo} />
    <circle cx="236" cy="168" r="30" fill={marca.colores.acentoClaro} />
  </svg>
);

/**
 * Objeto recortado sobre papel (refs: tiktok-7622319703679110421 martillo/reloj/balanza, tiktok-7581551601349954824,
 * tiktok-7684823088906636562 objeto 3D con sombra larga, tiktok-7600179656922385685 recorte de mano, C-yZlQXN3rQ).
 *
 * Técnica: el objeto "cae" al papel con un spring (escala + giro, ease-out largo de ~15–27 f como en las recetas).
 * La sombra es una silueta del mismo PNG corrida en la dirección de la luz y desenfocada; mientras
 * el objeto está "en el aire" (al entrar y al salir) la sombra es más larga, más difusa y más clara, y al apoyarse
 * se acorta y se endurece: eso vende la altura. Debajo va una sombra de contacto corta. Al sostenerse deriva con
 * `wiggle` lento (no un loop sinusoidal). La salida es más corta que la entrada y con curva -in (AI-05).
 * Sombras y borde sticker son filtros SVG sobre el alfa (feMorphology dilate + feFlood): la sombra toma el color
 * del papel (`sombra.color`) y respeta la silueta exacta del PNG.
 */
export const CutoutObject: React.FC<Props> = ({
  src,
  children,
  ancho = 520,
  x = 0.62,
  y = 0.52,
  at = 0,
  out,
  rotacion = -4,
  rotacionInicial = -16,
  escalaInicial = 0.72,
  resorte = "heavy",
  sticker = false,
  borde = 10,
  colorBorde = marca.colores.acentoClaro,
  sombra = {},
  deriva = 6,
  seed = "cutout",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { u, ancho: W, alto: H } = useEscala();
  // La luz es la de la escena (la misma que usan las `<Capa sombra>` del rig); `sombra` la ajusta para este objeto.
  const escena = useLuz();
  const luz = {
    angulo: sombra.angulo ?? escena.angulo,
    largo: sombra.largo ?? escena.largo,
    opacidad: sombra.opacidad ?? escena.opacidad,
    color: sombra.color ?? escena.color,
  };
  const { color } = luz;

  const salida = out === null ? null : (out ?? durationInFrames - 12);
  const p = springPreset(frame, fps, resorte, at);
  const aparece = arrive(frame, at, 6, "arriveGentle");
  const q = salida === null ? 0 : leave(frame, salida, 10, "leave");

  // "Altura" del objeto sobre el papel: 1 en el aire, 0 apoyado. Gobierna la sombra.
  const altura = Math.max(0, 1 - Math.min(1, p)) + q;
  const quieto = Math.min(1, p) * (1 - q);
  const dx = wiggle(`${seed}-x`, frame, fps, 0.3, deriva * u) * quieto;
  const dy = wiggle(`${seed}-y`, frame, fps, 0.25, deriva * 0.7 * u) * quieto;
  const dr = wiggle(`${seed}-r`, frame, fps, 0.2, 0.9) * quieto;

  const escala = mix(p, escalaInicial, 1) * (1 - 0.12 * q);
  const rot = mix(p, rotacionInicial, rotacion) + dr + q * 8;
  const caida = (1 - Math.min(1, p)) * -70 * u + q * 40 * u;
  const opacidad1 = aparece * (1 - q);

  const w = ancho * u;
  // La sombra se calcula en el espacio del cuadro y se lleva al espacio girado del objeto.
  const s = sombrasDeLuz(luz, altura, u);
  const [ox, oy] = aEspacioLocal(s.larga.dx, s.larga.dy, rot, escala);
  const b = borde * u;
  const id = `cut${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const contenido = children ?? (src ? <Img src={src} style={{ width: "100%", display: "block" }} /> : <Muestra />);
  // Base de alfa de las sombras: si hay sticker, la silueta incluye el borde.
  const alfa = sticker ? (
    <feMorphology in="SourceAlpha" operator="dilate" radius={b} result="alfa" />
  ) : (
    <feComponentTransfer in="SourceAlpha" result="alfa" />
  );
  const sombraFiltro = (fid: string, ddx: number, ddy: number, desenfoque: number, op: number) => (
    <filter id={fid} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
      {alfa}
      <feFlood floodColor={color} floodOpacity={Math.max(0, Math.min(1, op))} />
      <feComposite in2="alfa" operator="in" />
      <feGaussianBlur stdDeviation={desenfoque} />
      <feOffset dx={ddx} dy={ddy} />
    </filter>
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x * W + dx,
          top: y * H + dy + caida,
          width: w,
          transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${escala})`,
          opacity: opacidad1,
        }}
      >
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            {/* Sombra larga proyectada en el papel: más larga, clara y difusa cuanto más alto está el objeto. */}
            {sombraFiltro(`${id}l`, ox, oy, s.larga.desenfoque, s.larga.opacidad)}
            {/* Sombra de contacto: corta y densa; desaparece cuando el objeto sube. */}
            {sombraFiltro(`${id}c`, ox * 0.1, oy * 0.1 + 3 * u, s.contacto.desenfoque, s.contacto.opacidad)}
            <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="140%">
              <feMorphology in="SourceAlpha" operator="dilate" radius={b} result="borde" />
              <feFlood floodColor={colorBorde} />
              <feComposite in2="borde" operator="in" result="sticker" />
              <feMerge>
                <feMergeNode in="sticker" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, filter: `url(#${id}l)`, mixBlendMode: "multiply" }}>{contenido}</div>
        <div style={{ position: "absolute", inset: 0, filter: `url(#${id}c)`, mixBlendMode: "multiply" }}>{contenido}</div>
        <div style={{ position: "relative", width: "100%", filter: sticker ? `url(#${id}s)` : undefined }}>{contenido}</div>
      </div>
    </AbsoluteFill>
  );
};
