import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, enterStyle, leave, mix, springPreset, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  antes: React.ReactNode;
  despues: React.ReactNode;
  /** "tarjetas": dos tarjetas en perspectiva (antes chica, después grande). "cortina": un estado barre sobre el otro. */
  modo?: "tarjetas" | "cortina";
  etiquetaAntes?: string;
  etiquetaDespues?: string;
  /** Primer paso de la entrada. */
  at?: number;
  /** Cuadro de salida (opcional). */
  out?: number;
  /** Cortina: posición donde queda la costura al final (0 = todo después, 1 = todo antes). */
  reposo?: number;
  /** Cortina: cuadros del barrido de ida (la vuelta al reposo dura 60 %). */
  barrido?: number;
  acento?: string;
  /** Papel de las tarjetas y de las etiquetas. */
  tarjeta?: string;
  tinta?: string;
};

const Etiqueta: React.FC<{ texto: string; fondo: string; color: string; u: number; style?: React.CSSProperties }> = ({
  texto,
  fondo,
  color,
  u,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      padding: `${10 * u}px ${22 * u}px`,
      borderRadius: 999,
      background: fondo,
      color,
      fontFamily: marca.fuenteTitulo,
      fontWeight: 700,
      fontSize: 30 * u,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {texto}
  </div>
);

/**
 * Antes / después (refs: MoVlt-ptxIk dos tarjetas en perspectiva con rótulos grandes; tiktok-7519674033076571397
 * paneles «original / edición final» como prueba visual, AI-51; pins "nuevo:BeforeAfterSplit": tarjeta pequeña y
 * grande, píldoras Before/After).
 *
 * Modo tarjetas: entra por pasos (no todo a la vez, AI-02): la tarjeta "antes" llega chica y girada hacia el
 * centro (arriveSoft 20 f), su píldora a +6 f, la flecha se dibuja a +12 f, la tarjeta "después" cae con spring
 * heavy a +16 f (más grande, más peso) y su píldora a +24 f. Las tarjetas tienen sombra con una sola dirección.
 * Modo cortina: aparece el marco, la píldora "antes", la costura con manija baja desde arriba, barre con curva
 * `move` hasta casi el otro lado y vuelve al reposo con `arriveSoft` (asentamiento, no rebote). La píldora
 * "después" aparece cuando la cortina destapa su lado.
 */
export const BeforeAfter: React.FC<Props> = ({
  antes,
  despues,
  modo = "tarjetas",
  etiquetaAntes = "Antes",
  etiquetaDespues = "Después",
  at = 0,
  out,
  reposo = 0.5,
  barrido = 30,
  acento = marca.colores.acento,
  tarjeta = marca.colores.texto,
  tinta = marca.colores.fondo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho, alto, vertical } = useEscala();
  const q = out === undefined ? 0 : leave(frame, out, 12, "leaveSoft");
  const salida: React.CSSProperties = { opacity: 1 - q, transform: `translateY(${q * 40 * u}px)` };

  if (modo === "cortina") {
    const w = Math.min(ancho - 240 * u, vertical ? ancho * 0.86 : 1400 * u);
    const h = Math.min(alto - 220 * u, w * (vertical ? 1.35 : 0.6));
    const marco = arrive(frame, at, 22, "arriveSoft");
    const pAntes = arrive(frame, at + 8, 12, "arrive");
    const linea = arrive(frame, at + 16, 14, "arrive");
    const ida = tween(frame, at + 26, barrido, "move");
    const vuelta = tween(frame, at + 26 + barrido, Math.round(barrido * 0.6), "arriveSoft");
    // Costura: arranca a la derecha (todo antes), barre hasta 8 % y vuelve al reposo.
    const pos = mix(vuelta, mix(ida, 0.97, 0.08), reposo);
    const cx = pos * w;
    const pDespues = arrive(frame, at + 26 + Math.round(barrido * 0.4), 12, "arrive");
    const r = marca.radios.grande * u;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", ...salida }}>
        <div
          style={{
            position: "relative",
            width: w,
            height: h,
            borderRadius: r,
            overflow: "hidden",
            boxShadow: `0 ${24 * u}px ${60 * u}px ${marca.colores.sombraCalida}99`,
            ...enterStyle(marco, 30 * u),
          }}
        >
          <AbsoluteFill>{despues}</AbsoluteFill>
          <AbsoluteFill style={{ clipPath: `inset(0 ${w - cx}px 0 0)` }}>{antes}</AbsoluteFill>
          {/* Borde de la cortina con manija. */}
          <div
            style={{
              position: "absolute",
              left: cx - 2 * u,
              top: 0,
              width: 4 * u,
              height: h,
              background: tarjeta,
              transformOrigin: "50% 0%",
              transform: `scaleY(${linea})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: cx,
              top: h / 2,
              width: 76 * u,
              height: 76 * u,
              borderRadius: 999,
              background: tarjeta,
              boxShadow: `0 ${6 * u}px ${16 * u}px ${marca.colores.sombraCalida}88`,
              transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * linea})`,
              opacity: linea,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10 * u,
            }}
          >
            {[-1, 1].map((d) => (
              <div
                key={d}
                style={{
                  width: 0,
                  height: 0,
                  borderTop: `${9 * u}px solid transparent`,
                  borderBottom: `${9 * u}px solid transparent`,
                  [d < 0 ? "borderRight" : "borderLeft"]: `${12 * u}px solid ${tinta}`,
                }}
              />
            ))}
          </div>
          <Etiqueta
            texto={etiquetaAntes}
            fondo={tarjeta}
            color={tinta}
            u={u}
            style={{ left: 32 * u, top: 32 * u, ...enterStyle(pAntes, 16 * u), opacity: pAntes * Math.min(1, cx / (260 * u)) }}
          />
          <Etiqueta
            texto={etiquetaDespues}
            fondo={acento}
            color={tinta}
            u={u}
            style={{ right: 32 * u, top: 32 * u, ...enterStyle(pDespues, 16 * u) }}
          />
        </div>
      </AbsoluteFill>
    );
  }

  // ── Modo tarjetas ──
  const wA = Math.min(440 * u, ancho * (vertical ? 0.5 : 0.24));
  const hA = wA * 1.3;
  const wD = Math.min(640 * u, ancho * (vertical ? 0.72 : 0.36));
  const hD = wD * 1.3;
  const pA = arrive(frame, at, 20, "arriveSoft");
  const eA = arrive(frame, at + 6, 12, "arrive");
  const flecha = tween(frame, at + 12, 16, "arrive");
  const pD = springPreset(frame, fps, "heavy", at + 16);
  const eD = arrive(frame, at + 24, 12, "arrive");
  const r = marca.radios.grande * u;
  const sombra = `${18 * u}px ${30 * u}px ${50 * u}px ${marca.colores.sombraCalida}aa`;
  const tarjetaStyle = (w: number, h: number): React.CSSProperties => ({
    position: "relative",
    width: w,
    height: h,
    borderRadius: r,
    overflow: "hidden",
    background: tarjeta,
    padding: 14 * u,
    boxShadow: `0 ${sombra}`,
  });
  const interior: React.CSSProperties = { position: "relative", width: "100%", height: "100%", borderRadius: r * 0.6, overflow: "hidden" };
  return (
    <AbsoluteFill
      style={{
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: (vertical ? 60 : 110) * u,
        perspective: 1800 * u,
        ...salida,
      }}
    >
      <div
        style={{
          ...tarjetaStyle(wA, hA),
          opacity: Math.min(1, pA / 0.6),
          transform: `translateX(${(1 - pA) * -80 * u}px) rotateY(${mix(pA, 34, 16)}deg) rotateZ(${mix(pA, -5, -2)}deg)`,
          filter: `saturate(0.55) blur(${(1 - pA) * 6}px)`,
        }}
      >
        <div style={interior}>{antes}</div>
        <Etiqueta texto={etiquetaAntes} fondo={tinta} color={tarjeta} u={u} style={{ left: 30 * u, bottom: 30 * u, ...enterStyle(eA, 14 * u) }} />
      </div>
      {/* Flecha que conecta: se dibuja, no aparece. */}
      <svg
        width={120 * u}
        height={60 * u}
        viewBox="0 0 120 60"
        style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) ${vertical ? "rotate(90deg)" : ""}`, overflow: "visible" }}
      >
        <path
          d="M6 38 C 40 6, 76 6, 108 30 M 92 18 L 110 31 L 90 42"
          fill="none"
          stroke={acento}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - flecha}
        />
      </svg>
      <div
        style={{
          ...tarjetaStyle(wD, hD),
          opacity: Math.min(1, pD / 0.35),
          transform: `translateY(${(1 - pD) * 90 * u}px) rotateY(${mix(pD, -22, -8)}deg) rotateZ(${mix(pD, 4, 1.5)}deg) scale(${mix(pD, 0.88, 1)})`,
        }}
      >
        <div style={interior}>{despues}</div>
        <Etiqueta texto={etiquetaDespues} fondo={acento} color={tinta} u={u} style={{ right: 30 * u, bottom: 30 * u, ...enterStyle(eD, 14 * u) }} />
      </div>
    </AbsoluteFill>
  );
};
