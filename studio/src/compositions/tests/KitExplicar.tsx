import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  AnilloPunteado,
  Anotaciones,
  DatoCallout,
  Llave,
  Lupa,
  PasoTracker,
  Rotulo,
  durLlave,
  type Caja,
  type Piel,
} from "../../components/anotacion";
import { Look } from "../../components/presets";
import type { Punto } from "../../lib/anclas";
import { marca } from "../../marca/marca";

/**
 * Segunda hoja de prueba del kit de anotación (no es una pieza): las piezas para explicar
 * (`PasoTracker`, `Llave`, `DatoCallout`, `Lupa` y `AnilloPunteado`) en las tres pieles, una por
 * columna. La primera hoja es `KitAnotacion`.
 */
export const KIT_EXPLICAR_DURACION = 240;

const c = marca.colores;
const COLUMNAS: {
  piel: Piel;
  titulo: string;
  tinta: string;
  fondo: string;
  papel?: string;
  objeto: string;
  detalle: string;
}[] = [
  {
    piel: "marcador",
    titulo: "Marcador",
    tinta: "#C4311C",
    fondo: "#EFE9DC",
    papel: "texturas/papel-crema.jpg",
    objeto: "#2A2722",
    detalle: "#EFE9DC",
  },
  {
    piel: "vector",
    titulo: "Vector",
    tinta: c.acento,
    fondo: c.fondo,
    objeto: c.superficie,
    detalle: c.suave,
  },
  {
    piel: "tiza",
    titulo: "Tiza",
    tinta: "#F1EEE4",
    fondo: "#23262A",
    papel: "texturas/papel-grafito.jpg",
    objeto: "#3A3F45",
    detalle: "#F1EEE4",
  },
];

const PASOS = ["guion", "animática", "animación"];
const OBJETO: Caja = { x: 170, y: 560, ancho: 220, alto: 190 };
const DETALLE: Caja = { x: 226, y: 606, ancho: 64, alto: 64 };
const ANCLA: Punto = { x: 150, y: 512 };

/** El objeto que se anota: una tarjeta con barras y un detalle chico (lo que amplía la lupa). */
const Objeto: React.FC<{ fondo: string; detalle: string; acento: string }> = ({
  fondo,
  detalle,
  acento,
}) => (
  <div
    style={{
      position: "absolute",
      left: OBJETO.x - OBJETO.ancho / 2,
      top: OBJETO.y - OBJETO.alto / 2,
      width: OBJETO.ancho,
      height: OBJETO.alto,
      borderRadius: 14,
      background: fondo,
      boxShadow: `0 24px 40px -18px ${c.sombraCalida}`,
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 26,
          top: 30 + i * 22,
          width: 150 - i * 34,
          height: 9,
          borderRadius: 5,
          background: detalle,
          opacity: 0.5,
        }}
      />
    ))}
    {/* Detalle chico: una insignia con tres puntos, ilegible a tamaño real. */}
    <div
      style={{
        position: "absolute",
        left: DETALLE.x - (OBJETO.x - OBJETO.ancho / 2) - 22,
        top: DETALLE.y - (OBJETO.y - OBJETO.alto / 2) - 22,
        width: 44,
        height: 44,
        borderRadius: 10,
        background: acento,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 8 + i * 11,
            top: 26 - i * 7,
            width: 7,
            height: 7 + i * 7,
            borderRadius: 2,
            background: fondo,
          }}
        />
      ))}
    </div>
  </div>
);

const Columna: React.FC<{ i: number }> = ({ i }) => {
  const col = COLUMNAS[i];
  const t = 8 + [0, 9, 23][i]; // cada columna arranca después, a intervalos desiguales (sin ritmo de metrónomo)
  const llaveDe: Punto = { x: 388, y: 216 };
  const llaveA: Punto = { x: 388, y: 404 };
  const tLlave = t + 30;
  const lupaEn: Punto = { x: 430, y: 880 };
  const objeto = (
    <Objeto fondo={col.objeto} detalle={col.detalle} acento={col.tinta} />
  );
  return (
    <div
      style={{
        position: "absolute",
        left: i * 640,
        top: 0,
        width: 640,
        height: 1080,
        overflow: "hidden",
        background: col.fondo,
      }}
    >
      {col.papel ? (
        <Img
          src={staticFile(col.papel)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.9,
          }}
        />
      ) : null}
      <Anotaciones piel={col.piel} color={col.tinta} fondo={col.fondo} mudo={i > 0}>
        <Rotulo
          en={{ x: 60, y: 110 }}
          texto={col.titulo}
          tam={56}
          inicio={t}
          color={col.piel === "vector" ? c.texto : col.tinta}
        />

        {/* Pasos: el activo se marca; los anteriores quedan tachados (o atenuados en vector). */}
        <PasoTracker
          en={{ x: 86, y: 232 }}
          pasos={PASOS}
          cambios={[t + 22, t + 79, t + 147]}
          tam={34}
          inicio={t + 8}
          semilla={`pasos-${i}`}
        />
        {/* Llave: agrupa los tres pasos y les pone nombre. */}
        <Llave
          de={llaveDe}
          a={llaveA}
          texto="proceso"
          fondo={40}
          tam={32}
          inicio={tLlave}
          semilla={`llave-${i}`}
        />

        {/* El objeto, con un anillo punteado y una cifra anclada. */}
        {objeto}
        <AnilloPunteado
          en={OBJETO}
          r={140}
          desde={-90}
          giro={30}
          durGiro={170}
          inicio={tLlave + durLlave(llaveDe, llaveA) + 6}
          semilla={`anillo-${i}`}
        />
        <DatoCallout
          ancla={ANCLA}
          en={{ x: 372, y: 560 }}
          valor={87}
          unidad="%"
          rotulo={"lo ve\nhasta el final"}
          tam={92}
          inicio={t + 96}
          semilla={`dato-${i}`}
        />

        {/* Lupa: amplía el detalle chico del objeto. */}
        <Lupa
          zona={DETALLE}
          en={lupaEn}
          tam={250}
          inicio={t + 157}
          semilla={`lupa-${i}`}
          curvatura={-0.16}
        >
          {objeto}
        </Lupa>
      </Anotaciones>
    </div>
  );
};

export const KitExplicar: React.FC = () => (
  <AbsoluteFill style={{ background: c.fondo }}>
    {COLUMNAS.map((_, i) => (
      <Columna key={i} i={i} />
    ))}
    <Look grain={0.05} vignette={0.25} />
  </AbsoluteFill>
);
