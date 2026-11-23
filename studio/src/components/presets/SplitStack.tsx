import { AbsoluteFill, useCurrentFrame } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  /** Mitad de arriba (por lo general la infografía o el motion). */
  arriba: React.ReactNode;
  /** Mitad de abajo (por lo general el presentador). */
  abajo: React.ReactNode;
  /** Fracción del alto útil que ocupa la mitad de arriba (0.3–0.7). */
  proporcion?: number;
  /** Caption sobre la costura (1–4 palabras). Vacío = sin caption. */
  caption?: string;
  /** Palabra del caption que va en acento. */
  enfasis?: string;
  /** Lockup de la barra superior (logos, "AI × REAL"...). Sin él no hay barra. */
  barra?: React.ReactNode;
  /** Alto de la barra como fracción del alto (la referencia mide 6 %). */
  altoBarra?: number;
  /** "deslizar": las mitades entran desde sus bordes. "abrir": nacen desde la costura. */
  entrada?: "deslizar" | "abrir";
  at?: number;
  /** Grosor de la costura en px a 1080 (0 = corte limpio). */
  costura?: number;
  acento?: string;
  fondo?: string;
};

/**
 * Pantalla dividida arriba/abajo (refs: 7gMbZTdLlxs host + infografía con caption en la costura a 50 %;
 * tiktok-7697333991984221462 barra negra de 6 % con lockup de dos marcas, panel «AI» arriba y «REAL» abajo;
 * zlOCQxQYnYc split pantalla/presentadora con etiquetas).
 *
 * Entrada escalonada: barra (arrive 12 f) → mitad de arriba (arriveSoft 20 f, +3) → mitad de abajo (+7, más
 * pesada: 22 f) → costura que se dibuja de izquierda a derecha (+14) → caption que sube por máscara (+18).
 * Cada mitad recorta su contenido (overflow hidden) y le da un contra-movimiento leve (parallax de 6 %), así
 * el contenido no viaja pegado al panel.
 */
export const SplitStack: React.FC<Props> = ({
  arriba,
  abajo,
  proporcion = 0.5,
  caption = "",
  enfasis = "",
  barra,
  altoBarra = 0.06,
  entrada = "deslizar",
  at = 0,
  costura = 6,
  acento = marca.colores.acento,
  fondo = marca.colores.fondo,
}) => {
  const frame = useCurrentFrame();
  const { u, alto } = useEscala();
  const hBarra = barra ? altoBarra * alto : 0;
  const util = alto - hBarra;
  const hArriba = util * proporcion;
  const hAbajo = util - hArriba;
  const yCostura = hBarra + hArriba;

  const pBarra = arrive(frame, at, 12, "arrive");
  const pArriba = arrive(frame, at + 3, 20, "arriveSoft");
  const pAbajo = arrive(frame, at + 7, 22, "arriveSoft");
  const pCostura = tween(frame, at + 14, 14, "arrive");
  const pCaption = arrive(frame, at + 18, 12, "arrive");

  const abrir = entrada === "abrir";
  // "deslizar": entran desde su borde. "abrir": crecen desde la costura (clip) con un leve empuje.
  const panel = (p: number, h: number, dir: -1 | 1): React.CSSProperties =>
    abrir
      ? { clipPath: dir < 0 ? `inset(${(1 - p) * 100}% 0 0 0)` : `inset(0 0 ${(1 - p) * 100}% 0)` }
      : { transform: `translateY(${dir * (1 - p) * h}px)` };
  const contra = (p: number, h: number, dir: -1 | 1) => `translateY(${-dir * (1 - p) * h * 0.06}px) scale(${1.06 - 0.06 * p})`;

  const palabras = caption.split(" ").filter(Boolean);
  return (
    <AbsoluteFill style={{ background: fondo, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: hBarra, height: hArriba, overflow: "hidden", ...panel(pArriba, hArriba + hBarra, -1) }}>
        <AbsoluteFill style={{ transform: contra(pArriba, hArriba, -1) }}>{arriba}</AbsoluteFill>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: yCostura, height: hAbajo, overflow: "hidden", ...panel(pAbajo, hAbajo, 1) }}>
        <AbsoluteFill style={{ transform: contra(pAbajo, hAbajo, 1) }}>{abajo}</AbsoluteFill>
      </div>
      {costura > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: yCostura - (costura * u) / 2,
            height: costura * u,
            background: acento,
            transformOrigin: "0% 50%",
            transform: `scaleX(${pCostura})`,
          }}
        />
      )}
      {barra && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: hBarra,
            background: marca.colores.sombraCalida,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateY(${-(1 - pBarra) * hBarra}px)`,
          }}
        >
          <div style={{ opacity: pBarra, transform: `translateY(${(1 - pBarra) * -10 * u}px)` }}>{barra}</div>
        </div>
      )}
      {palabras.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: yCostura,
            display: "flex",
            justifyContent: "center",
            transform: "translateY(-50%)",
          }}
        >
          <div style={{ overflow: "hidden", padding: `0 ${4 * u}px`, borderRadius: marca.radios.chico * u }}>
            <div
              style={{
                display: "flex",
                gap: 16 * u,
                padding: `${12 * u}px ${28 * u}px`,
                background: marca.colores.fondo,
                borderRadius: marca.radios.chico * u,
                fontFamily: marca.fuenteTitulo,
                fontWeight: 700,
                fontSize: 56 * u,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
                transform: `translateY(${(1 - pCaption) * 110}%)`,
              }}
            >
              {palabras.map((w, i) => (
                <span key={i} style={{ color: w.toLowerCase() === enfasis.toLowerCase() ? acento : marca.colores.texto }}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

