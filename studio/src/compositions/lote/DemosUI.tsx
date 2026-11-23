import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BentoGrid } from "../../components/presets/BentoGrid";
import { CameraRig } from "../../components/presets/CameraRig";
import { CardCarousel } from "../../components/presets/CardCarousel";
import { CardMorph } from "../../components/presets/CardMorph";
import { Cursor } from "../../components/presets/Cursor";
import { ScreenFrame } from "../../components/presets/ScreenFrame";
import { arrive, enterStyle, mix, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";
import { marca } from "../../marca/marca";

/**
 * Demos del lote de motion UI (Cursor, ScreenFrame, BentoGrid, CardMorph, CardCarousel).
 * Una escena por preset a 1920×1080, con contenido de relleno hecho con divs (sin imágenes externas).
 */

const C = marca.colores;

const Escenario: React.FC<{ children: React.ReactNode; luz?: [number, number] }> = ({ children, luz = [24, 28] }) => (
  <AbsoluteFill style={{ background: C.fondo }}>
    <AbsoluteFill style={{ background: `radial-gradient(70% 60% at ${luz[0]}% ${luz[1]}%, ${C.acento}18 0%, transparent 70%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(2,3,1,0.65) 100%)" }} />
    {children}
  </AbsoluteFill>
);

const Rotulo: React.FC<{ texto: string; delay: number }> = ({ texto, delay }) => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const p = arrive(f, delay, 16, "arrive");
  return (
    <div
      style={{
        position: "absolute",
        left: 120 * u,
        top: 84 * u,
        fontFamily: marca.fuenteMono,
        fontSize: 22 * u,
        letterSpacing: "0.08em",
        color: C.suave,
        textTransform: "uppercase",
        ...enterStyle(p, 14),
      }}
    >
      {texto}
    </div>
  );
};

// ── Cursor ────────────────────────────────────────────────────────────────
const OPCIONES = ["Vertical 9:16", "Horizontal 16:9", "Cuadrado 1:1"];

const EscenaCursor: React.FC = () => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const elegida = arrive(f, 36, 8, "arriveGentle");
  const presion = arrive(f, 72, 3, "arriveGentle") * (1 - arrive(f, 76, 10, "arrive"));
  const exportado = arrive(f, 78, 14, "arrive");
  return (
    <Escenario>
      <CameraRig push={0.035} drift={4} seed="cursor">
        <Rotulo texto="Cursor · clic con onda" delay={2} />
        <div
          style={{
            position: "absolute",
            left: 420 * u,
            top: 250 * u,
            width: 900 * u,
            padding: 48 * u,
            borderRadius: 28 * u,
            background: C.superficie,
            border: `${1.5 * u}px solid ${C.linea}`,
            boxShadow: `${-16 * u}px ${34 * u}px ${80 * u}px rgba(3,5,2,0.55)`,
            ...enterStyle(arrive(f, 0, 22, "arriveSoft"), 40),
          }}
        >
          <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 52 * u, color: C.texto, letterSpacing: "-0.03em" }}>Formato de salida</div>
          <div style={{ marginTop: 28 * u, display: "flex", flexDirection: "column", gap: 14 * u }}>
            {OPCIONES.map((o, i) => {
              const p = arrive(f, 6 + staggerDelay(i, OPCIONES.length, 9), 14, "arrive");
              const activa = i === 1 ? elegida : 0;
              return (
                <div
                  key={o}
                  style={{
                    height: 76 * u,
                    borderRadius: 14 * u,
                    padding: `0 ${26 * u}px`,
                    display: "flex",
                    alignItems: "center",
                    gap: 18 * u,
                    background: activa > 0 ? `rgba(163,230,53,${0.12 * activa})` : C.sombraCalida,
                    border: `${1.5 * u}px solid ${activa > 0.5 ? C.acento : C.linea}`,
                    fontFamily: marca.fuenteTexto,
                    fontSize: 28 * u,
                    color: C.texto,
                    ...enterStyle(p, 18),
                  }}
                >
                  <div style={{ width: 22 * u, height: 22 * u, borderRadius: "50%", border: `${2 * u}px solid ${C.suave}`, display: "grid", placeItems: "center" }}>
                    <div style={{ width: 12 * u * activa, height: 12 * u * activa, borderRadius: "50%", background: C.acento }} />
                  </div>
                  {o}
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 34 * u,
              width: 340 * u,
              height: 84 * u,
              borderRadius: 16 * u,
              background: exportado > 0 ? C.acentoClaro : C.acento,
              color: C.fondo,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: marca.fuenteTexto,
              fontWeight: 600,
              fontSize: 30 * u,
              transform: `scale(${1 - 0.05 * presion})`,
              ...{ opacity: Math.min(1, arrive(f, 16, 12, "arriveGentle") / 0.6) },
            }}
          >
            {exportado > 0.5 ? "Exportando…" : "Exportar"}
          </div>
        </div>
        <Cursor
          puntos={[
            { x: 1560, y: 900, at: 10 },
            { x: 720, y: 516, at: 36, clic: true, etiqueta: "Elegir" },
            { x: 640, y: 722, at: 72, clic: true, etiqueta: "Exportar", arco: -0.2 },
            { x: 1060, y: 700, at: 100 },
          ]}
          etiqueta="Bodega"
          salida={112}
        />
      </CameraRig>
    </Escenario>
  );
};

// ── ScreenFrame ───────────────────────────────────────────────────────────
const BARRAS = [0.42, 0.58, 0.5, 0.86, 0.64, 0.72, 0.48, 0.9, 0.6, 0.7, 0.55, 0.8];

const Tablero: React.FC = () => {
  const { u } = useEscala();
  const caja = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    borderRadius: 16 * u,
    background: C.sombraCalida,
    border: `${1.5 * u}px solid ${C.linea}`,
    ...extra,
  });
  const linea = (w: number, op = 0.5): React.CSSProperties => ({ width: w * u, height: 12 * u, borderRadius: 6 * u, background: C.suave, opacity: op });
  return (
    <AbsoluteFill style={{ background: C.fondo }}>
      <div style={caja({ left: 0, top: 0, width: 230 * u, height: 860 * u, borderRadius: 0, border: "none", borderRight: `${1.5 * u}px solid ${C.linea}` })}>
        <div style={{ padding: 30 * u, display: "flex", flexDirection: "column", gap: 26 * u }}>
          <div style={{ width: 44 * u, height: 44 * u, borderRadius: 12 * u, background: C.acento }} />
          {[120, 90, 140, 100, 80].map((w, i) => (
            <div key={i} style={linea(w, i === 1 ? 0.9 : 0.35)} />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 270 * u, top: 40 * u, fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 40 * u, color: C.texto }}>Ventas · noviembre</div>
      {[
        { l: 270, t: 120, v: "$48.2k", k: "Ingresos" },
        { l: 680, t: 120, v: "1.284", k: "Pedidos" },
        { l: 1090, t: 120, v: "3,9 %", k: "Conversión" },
      ].map((k, i) => (
        <div key={i} style={caja({ left: k.l * u, top: k.t * u, width: 380 * u, height: 200 * u, padding: 28 * u, boxSizing: "border-box" })}>
          <div style={{ fontFamily: marca.fuenteTexto, fontSize: 22 * u, color: C.suave }}>{k.k}</div>
          <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 64 * u, color: i === 0 ? C.acento : C.texto, marginTop: 18 * u }}>{k.v}</div>
        </div>
      ))}
      <div style={caja({ left: 270 * u, top: 350 * u, width: 1200 * u, height: 470 * u })}>
        <div style={{ position: "absolute", left: 40 * u, right: 40 * u, bottom: 50 * u, top: 60 * u, display: "flex", alignItems: "flex-end", gap: 22 * u }}>
          {BARRAS.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h * 100}%`, borderRadius: `${8 * u}px ${8 * u}px 0 0`, background: i === 7 ? C.acento : C.linea }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EscenaScreenFrame: React.FC = () => {
  const { u } = useEscala();
  return (
    <Escenario luz={[70, 20]}>
      <Rotulo texto="ScreenFrame · zoom a zona" delay={4} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 40 * u }}>
        <ScreenFrame
          ventana
          titulo="tablero.app/ventas"
          ancho={1500}
          alto={820}
          zonas={[
            { x: 270, y: 120, w: 380, h: 200, at: 34, anotacion: "rect", nota: "Ingresos +38 %" },
            { x: 1000, y: 380, w: 260, h: 420, at: 78, anotacion: "circulo", nota: "Pico del martes" },
            { x: 0, y: 0, w: 1500, h: 820, at: 124 },
          ]}
        >
          <Tablero />
        </ScreenFrame>
      </AbsoluteFill>
    </Escenario>
  );
};

// ── BentoGrid ─────────────────────────────────────────────────────────────
const EscenaBento: React.FC = () => (
  <Escenario luz={[40, 40]}>
    <BentoGrid
      delay={6}
      foco={{ x: 0.3, y: 0.35 }}
      celdas={[
        { col: 0, fila: 0, w: 2, h: 2, tono: "oscuro", titulo: "Calendario", valor: "14", detalle: "noviembre · 3 entregas" },
        { col: 2, fila: 0, tono: "claro", titulo: "Batería", valor: "86 %", barra: 0.86 },
        { col: 3, fila: 0, h: 2, tono: "acento", titulo: "Entregas", valor: "128", detalle: "este mes" },
        { col: 2, fila: 1, tono: "superficie", titulo: "Render", valor: "4K", barra: 0.6 },
        { col: 0, fila: 2, tono: "claro", titulo: "Clientes", valor: "32" },
        { col: 1, fila: 2, w: 2, tono: "oscuro", titulo: "Horas ahorradas", valor: "212 h", barra: 0.72 },
        { col: 3, fila: 2, tono: "superficie", titulo: "Errores", valor: "0" },
      ]}
      camara={{ recorrido: [0, 2, 5, 1], inicio: 44, porCelda: 26, zoom: 2 }}
    />
  </Escenario>
);

// ── CardMorph ─────────────────────────────────────────────────────────────
const EscenaCardMorph: React.FC = () => {
  const { u } = useEscala();
  const t = (size: number, color: string, peso = 700): React.CSSProperties => ({
    fontFamily: marca.fuenteTitulo,
    fontWeight: peso,
    fontSize: size * u,
    color,
    letterSpacing: "-0.035em",
    lineHeight: 0.95,
  });
  const chico = (color: string): React.CSSProperties => ({ fontFamily: marca.fuenteMono, fontSize: 18 * u, letterSpacing: "0.08em", color, textTransform: "uppercase" });
  return (
    <Escenario luz={[60, 50]}>
      <CameraRig push={0.03} drift={3} seed="morph">
        <Rotulo texto="CardMorph · vertical → horizontal → píldora" delay={2} />
        <CardMorph
          estados={[
            { w: 440, h: 640, x: 960, y: 560, radio: 36, at: 6, color: C.acento },
            { w: 1180, h: 430, x: 960, y: 580, radio: 30, at: 46, color: C.superficie },
            { w: 620, h: 132, x: 760, y: 330, radio: 66, at: 90, color: C.acentoClaro },
          ]}
          contenidos={[
            <div key="a" style={{ position: "absolute", inset: 0, padding: 40 * u, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={chico(C.acentoProfundo)}>brief 01</div>
              <div style={{ width: "70%", height: "34%", borderRadius: 20 * u, background: C.acentoProfundo, opacity: 0.35 }} />
              <div style={t(84, C.fondo)}>
                Una
                <br />
                tarjeta
              </div>
            </div>,
            <div key="b" style={{ position: "absolute", inset: 0, padding: 46 * u, display: "flex", gap: 46 * u, alignItems: "stretch" }}>
              <div style={{ width: 300 * u, borderRadius: 22 * u, background: C.linea }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={chico(C.suave)}>cliente · 2026</div>
                <div style={t(76, C.texto)}>que cambia de forma</div>
                <div style={{ display: "flex", gap: 12 * u }}>
                  {[180, 120, 220].map((w, i) => (
                    <div key={i} style={{ width: w * u, height: 14 * u, borderRadius: 7 * u, background: i === 0 ? C.acento : C.linea }} />
                  ))}
                </div>
              </div>
            </div>,
            <div key="c" style={{ position: "absolute", inset: 0, padding: `0 ${44 * u}px`, display: "flex", alignItems: "center", gap: 22 * u }}>
              <div style={{ width: 30 * u, height: 30 * u, borderRadius: "50%", background: C.acentoProfundo }} />
              <div style={t(46, C.fondo, 500)}>Listo para render</div>
            </div>,
          ]}
        />
      </CameraRig>
    </Escenario>
  );
};

// ── CardCarousel ──────────────────────────────────────────────────────────
const EscenaCarousel: React.FC = () => {
  const f = useCurrentFrame();
  const { u } = useEscala();
  const pasos = [40, 70, 98, { at: 124, delta: -2 }];
  // Rótulo del estilo activo: cambia con cada paso.
  const nombres = ["3D", "Duet", "Nodos", "Papel", "Riso"];
  let activo = 1;
  let desde = 0;
  for (const p of pasos) {
    const at = typeof p === "number" ? p : p.at;
    if (f >= at + 6) {
      activo += typeof p === "number" ? 1 : p.delta;
      desde = at + 6;
    }
  }
  const q = arrive(f, desde, 12, "arrive");
  return (
    <Escenario luz={[50, 30]}>
      <Rotulo texto="CardCarousel · un clip, cinco estilos" delay={2} />
      <CardCarousel
        inicial={1}
        delay={4}
        pasos={pasos}
        tarjetas={[
          { titulo: "3D", etiqueta: "estilo 01", color: C.superficie },
          { titulo: "Duet", etiqueta: "estilo 02", color: C.acento, colorTexto: C.fondo },
          { titulo: "Nodos", etiqueta: "estilo 03", color: C.acentoProfundo },
          { titulo: "Papel", etiqueta: "estilo 04", color: C.texto, colorTexto: C.fondo },
          { titulo: "Riso", etiqueta: "estilo 05", color: C.sombraCalida },
        ]}
      />
      <div
        style={{
          position: "absolute",
          left: 120 * u,
          bottom: 90 * u,
          fontFamily: marca.fuenteTitulo,
          fontWeight: 700,
          fontSize: 54 * u,
          color: C.texto,
          letterSpacing: "-0.03em",
          ...enterStyle(q, 16),
        }}
      >
        <span style={{ color: C.suave, fontWeight: 500 }}>Estilo </span>
        {nombres[Math.max(0, Math.min(nombres.length - 1, activo))]}
      </div>
      <div style={{ position: "absolute", right: 120 * u, bottom: 104 * u, display: "flex", gap: 10 * u }}>
        {nombres.map((n, i) => (
          <div key={n} style={{ width: mix(i === activo ? q : 0, 12, 40) * u, height: 12 * u, borderRadius: 6 * u, background: i === activo ? C.acento : C.linea }} />
        ))}
      </div>
    </Escenario>
  );
};

export const escenasUI: Record<string, React.FC> = {
  Cursor: EscenaCursor,
  ScreenFrame: EscenaScreenFrame,
  BentoGrid: EscenaBento,
  CardMorph: EscenaCardMorph,
  CardCarousel: EscenaCarousel,
};

export const manifestUI: { id: string; duration: number; still: number }[] = [
  { id: "Cursor", duration: 120, still: 40 },
  { id: "ScreenFrame", duration: 150, still: 66 },
  { id: "BentoGrid", duration: 210, still: 84 },
  { id: "CardMorph", duration: 120, still: 62 },
  { id: "CardCarousel", duration: 150, still: 84 },
];
