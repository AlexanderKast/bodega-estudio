import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  AnilloPunteado,
  Anotaciones,
  Callout,
  Circulo,
  Conector,
  DatoCallout,
  Flecha,
  Llave,
  Lupa,
  Nodo,
  PasoTracker,
  Recuadro,
  Rotulo,
  Subrayado,
  Tachado,
  Trazo,
  durFlecha,
  durNodo,
  type Caja,
  type Piel,
} from "../../components/anotacion";
import { Look } from "../../components/presets/Look";
import { useEscala } from "../../lib/escala";
import { marca } from "../../marca/marca";

/**
 * Demos del kit de anotación (components/anotacion): una escena por pieza, con la misma pieza en las
 * tres pieles (marcador sobre papel, vector sobre la marca, tiza sobre pizarra). Presets.tsx las
 * toma por id desde presets.manifest.json, igual que las demás demos del lote, así
 * `node scripts/stills.mjs Flecha,Lupa` saca su still. Diseñadas a 1920 × 1080 y escaladas con `u`.
 */
const c = marca.colores;

type Col = {
  piel: Piel;
  nombre: string;
  tinta: string;
  fondo: string;
  papel?: string;
  objeto: string;
  detalle: string;
};

const COLUMNAS: Col[] = [
  { piel: "marcador", nombre: "marcador", tinta: "#C4311C", fondo: "#EFE9DC", papel: "texturas/papel-crema.jpg", objeto: "#2A2722", detalle: "#EFE9DC" },
  { piel: "vector", nombre: "vector", tinta: c.acento, fondo: c.fondo, objeto: c.superficie, detalle: c.suave },
  { piel: "tiza", nombre: "tiza", tinta: "#F1EEE4", fondo: "#23262A", papel: "texturas/papel-grafito.jpg", objeto: "#3A3F45", detalle: "#F1EEE4" },
];

const OBJETO: Caja = { x: 300, y: 540, ancho: 230, alto: 170 };
const DETALLE: Caja = { x: 366, y: 584, ancho: 60, alto: 60 };

/** El objeto que se anota: una tarjeta con tres barras y una insignia chica (lo que amplía la lupa). */
const Objeto: React.FC<{ col: Col }> = ({ col }) => (
  <div
    style={{
      position: "absolute",
      left: OBJETO.x - OBJETO.ancho / 2,
      top: OBJETO.y - OBJETO.alto / 2,
      width: OBJETO.ancho,
      height: OBJETO.alto,
      borderRadius: 14,
      background: col.objeto,
      boxShadow: `0 24px 40px -18px ${c.sombraCalida}`,
    }}
  >
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ position: "absolute", left: 26, top: 30 + i * 22, width: 150 - i * 34, height: 9, borderRadius: 5, background: col.detalle, opacity: 0.5 }} />
    ))}
    <div
      style={{
        position: "absolute",
        left: DETALLE.x - (OBJETO.x - OBJETO.ancho / 2) - 20,
        top: DETALLE.y - (OBJETO.y - OBJETO.alto / 2) - 20,
        width: 40,
        height: 40,
        borderRadius: 9,
        background: col.tinta,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 7 + i * 10, top: 24 - i * 6, width: 6, height: 7 + i * 6, borderRadius: 2, background: col.objeto }} />
      ))}
    </div>
  </div>
);

type Pieza = (col: Col, t: number, i: number) => React.ReactNode;

/** Tres columnas, una por piel; cada una arranca un poco después de la anterior. */
const Tres: React.FC<{ titulo: string; pieza: Pieza }> = ({ titulo, pieza }) => {
  const { u } = useEscala();
  return (
    <AbsoluteFill style={{ background: c.fondo }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${u})` }}>
        {COLUMNAS.map((col, i) => (
          <div key={col.piel} style={{ position: "absolute", left: i * 640, top: 0, width: 640, height: 1080, overflow: "hidden", background: col.fondo }}>
            {col.papel ? <Img src={staticFile(col.papel)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} /> : null}
            <div
              style={{
                position: "absolute",
                left: 56,
                top: 64,
                fontFamily: marca.fuenteMono,
                fontSize: 20,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: col.piel === "marcador" ? "#6B655A" : col.piel === "vector" ? c.suave : "#A9ADB2",
              }}
            >
              {titulo} · {col.nombre}
            </div>
            <Anotaciones piel={col.piel} color={col.tinta} fondo={col.fondo} mudo={i > 0}>
              {pieza(col, 8 + [0, 7, 19][i % 3], i)}
            </Anotaciones>
          </div>
        ))}
      </div>
      <Look grain={0.05} vignette={0.25} />
    </AbsoluteFill>
  );
};

const A: Caja = { x: 180, y: 540, ancho: 200, alto: 92 };
const B: Caja = { x: 464, y: 540, ancho: 200, alto: 92 };
const tintaTexto = (col: Col) => (col.piel === "vector" ? c.texto : col.tinta);

const PIEZAS: Record<string, Pieza> = {
  Trazo: (_, t, i) => <Trazo d="M 110 640 C 210 400, 400 780, 530 450" inicio={t} semilla={`trazo-${i}`} sonido="tick" />,
  Circulo: (col, t, i) => (
    <>
      <Objeto col={col} />
      <Circulo en={OBJETO} rx={186} ry={136} inicio={t + 4} semilla={`circ-${i}`} />
    </>
  ),
  Recuadro: (col, t, i) => (
    <>
      <Objeto col={col} />
      <Recuadro x={OBJETO.x} y={OBJETO.y} ancho={OBJETO.ancho + 56} alto={OBJETO.alto + 56} inicio={t + 4} semilla={`rec-${i}`} />
    </>
  ),
  Flecha: (col, t, i) => {
    const de = { x: 520, y: 760 };
    const a = { x: 410, y: 620 };
    return (
      <>
        <Objeto col={col} />
        <Flecha de={de} a={a} curvatura={-0.25} inicio={t + 4} semilla={`fl-${i}`} />
        <Rotulo en={{ x: 392, y: 806 }} texto="esto importa" tam={34} inicio={t + 4 + durFlecha(de, a, -0.25) - 4} />
      </>
    );
  },
  Subrayado: (col, t, i) => (
    <>
      <Rotulo en={{ x: 120, y: 520 }} texto="lo importante" tam={58} inicio={t} color={tintaTexto(col)} />
      <Subrayado de={{ x: 120, y: 574 }} ancho={col.piel === "vector" ? 380 : 330} doble inicio={t + 12} semilla={`sub-${i}`} />
    </>
  ),
  Tachado: (col, t, i) => (
    <>
      <Rotulo en={{ x: 170, y: 540 }} texto="lo de antes" tam={58} inicio={t} color={col.piel === "vector" ? c.suave : col.tinta} />
      <Tachado de={{ x: 170, y: 544 }} ancho={col.piel === "vector" ? 320 : 276} inicio={t + 22} semilla={`tach-${i}`} />
    </>
  ),
  Callout: (col, t, i) => (
    <>
      <Objeto col={col} />
      <Callout ancla={{ x: 372, y: 490 }} en={{ x: 452, y: 372 }} texto="dato" inicio={t + 4} semilla={`call-${i}`} />
    </>
  ),
  Nodo: (_, t, i) => (
    <>
      <Nodo {...A} texto="causa" inicio={t} semilla={`na-${i}`} />
      <Conector de={A} a={B} inicio={t + durNodo(A) + 4} semilla={`con-${i}`} />
      <Nodo {...B} texto="efecto" inicio={t + durNodo(A) + 21} semilla={`nb-${i}`} />
    </>
  ),
  AnilloPunteado: (col, t, i) => (
    <>
      <Objeto col={col} />
      <AnilloPunteado en={OBJETO} r={176} desde={-90} giro={36} durGiro={80} inicio={t + 4} semilla={`an-${i}`} sonido="tick" />
    </>
  ),
  Llave: (col, t, i) => (
    <>
      {["idea", "guion", "voz"].map((texto, k) => (
        <Rotulo key={texto} en={{ x: 130, y: 440 + k * 100 }} texto={texto} tam={46} inicio={t + [0, 6, 15][k]} color={tintaTexto(col)} />
      ))}
      <Llave de={{ x: 330, y: 400 }} a={{ x: 330, y: 680 }} fondo={44} texto="antes de animar" tam={30} inicio={t + 31} semilla={`llave-${i}`} />
    </>
  ),
  DatoCallout: (col, t, i) => (
    <>
      <Objeto col={col} />
      <DatoCallout ancla={{ x: 250, y: 596 }} en={{ x: 300, y: 820 }} valor={1250} unidad="h" rotulo={"de render\nal mes"} tam={88} inicio={t + 4} curvatura={-0.2} semilla={`dato-${i}`} />
    </>
  ),
  PasoTracker: (_, t, i) => (
    <PasoTracker en={{ x: 130, y: 440 }} pasos={["guion", "animática", "animación"]} cambios={[t + 20, t + 52, t + 84]} tam={42} separacion={104} inicio={t} semilla={`pasos-${i}`} />
  ),
  Lupa: (col, t, i) => (
    <>
      <Objeto col={col} />
      <Lupa zona={DETALLE} en={{ x: 420, y: 846 }} tam={250} inicio={t + 6} curvatura={-0.2} semilla={`lupa-${i}`}>
        <Objeto col={col} />
      </Lupa>
    </>
  ),
};

export const escenasAnotacion: Record<string, React.FC> = Object.fromEntries(
  Object.entries(PIEZAS).map(([id, pieza]) => [id, () => <Tres titulo={id} pieza={pieza} />]),
);
