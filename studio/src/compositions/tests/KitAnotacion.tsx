import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  Anotaciones,
  Callout,
  Circulo,
  Conector,
  Flecha,
  Nodo,
  Rotulo,
  Subrayado,
  Tachado,
  durFlecha,
  durNodo,
  type Caja,
  type Piel,
} from "../../components/anotacion";
import { Look } from "../../components/presets";
import { marca } from "../../marca/marca";

/**
 * Hoja de prueba del kit de anotación (no es una pieza): las mismas anotaciones en las tres pieles,
 * una por columna. Sirve para revisar trazo, orden de los gestos y legibilidad de cada piel.
 */
export const KIT_ANOTACION_DURACION = 210;

const c = marca.colores;
const COLUMNAS: {
  piel: Piel;
  titulo: string;
  tinta: string;
  fondo: string;
  papel?: string;
  objeto: string;
}[] = [
  {
    piel: "marcador",
    titulo: "Marcador",
    tinta: "#C4311C",
    fondo: "#EFE9DC",
    papel: "texturas/papel-crema.jpg",
    objeto: "#2A2722",
  },
  {
    piel: "vector",
    titulo: "Vector",
    tinta: c.acento,
    fondo: c.fondo,
    objeto: c.superficie,
  },
  {
    piel: "tiza",
    titulo: "Tiza",
    tinta: "#F1EEE4",
    fondo: "#23262A",
    papel: "texturas/papel-grafito.jpg",
    objeto: "#3A3F45",
  },
];

const A: Caja = { x: 170, y: 900, ancho: 210, alto: 92 };
const B: Caja = { x: 470, y: 900, ancho: 210, alto: 92 };

const Columna: React.FC<{ i: number }> = ({ i }) => {
  const col = COLUMNAS[i];
  const t = 8 + i * 14; // cada columna arranca un poco después
  const flechaDe = { x: 500, y: 660 };
  const flechaA = { x: 420, y: 520 };
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
      <Anotaciones piel={col.piel} color={col.tinta} mudo={i > 0}>
        <Rotulo
          en={{ x: 60, y: 140 }}
          texto={col.titulo}
          tam={56}
          inicio={t}
          color={col.piel === "vector" ? c.texto : col.tinta}
        />
        <Subrayado
          de={{ x: 60, y: 190 }}
          ancho={250}
          doble
          inicio={t + 10}
          semilla={`sub-${i}`}
        />
        <Rotulo
          en={{ x: 400, y: 140 }}
          texto="lo viejo"
          tam={36}
          inicio={t + 6}
          color={col.piel === "vector" ? c.suave : col.tinta}
        />
        <Tachado
          de={{ x: 400, y: 142 }}
          ancho={150}
          inicio={t + 124}
          semilla={`tach-${i}`}
        />

        {/* El objeto que se anota. */}
        <div
          style={{
            position: "absolute",
            left: 210,
            top: 320,
            width: 220,
            height: 160,
            borderRadius: 14,
            background: col.objeto,
            boxShadow: `0 24px 40px -18px ${c.sombraCalida}`,
          }}
        />
        <Circulo
          en={{ x: 320, y: 400 }}
          rx={176}
          ry={128}
          inicio={t + 26}
          semilla={`circ-${i}`}
        />
        <Flecha
          de={flechaDe}
          a={flechaA}
          curvatura={-0.25}
          inicio={t + 50}
          semilla={`fl-${i}`}
        />
        <Rotulo
          en={{ x: 372, y: 706 }}
          texto="esto importa"
          tam={34}
          inicio={t + 50 + durFlecha(flechaDe, flechaA, -0.25) - 4}
        />
        <Callout
          ancla={{ x: 392, y: 352 }}
          en={{ x: 478, y: 262 }}
          texto="dato"
          inicio={t + 76}
          semilla={`call-${i}`}
        />

        {/* Diagrama que se construye. */}
        <Nodo {...A} texto="causa" inicio={t + 96} semilla={`na-${i}`} />
        <Conector
          de={A}
          a={B}
          inicio={t + 96 + durNodo(A)}
          semilla={`con-${i}`}
        />
        <Nodo
          {...B}
          texto="efecto"
          inicio={t + 96 + durNodo(A) + 12}
          semilla={`nb-${i}`}
          relleno={col.piel === "vector" ? c.acentoProfundo : col.objeto}
        />
      </Anotaciones>
    </div>
  );
};

export const KitAnotacion: React.FC = () => (
  <AbsoluteFill style={{ background: c.fondo }}>
    {COLUMNAS.map((_, i) => (
      <Columna key={i} i={i} />
    ))}
    <Look grain={0.05} vignette={0.25} />
  </AbsoluteFill>
);
