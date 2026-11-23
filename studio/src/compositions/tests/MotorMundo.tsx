import { evolvePath } from "@remotion/paths";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Look } from "../../components/presets";
import { enMundo, type Punto, type Xf } from "../../lib/anclas";
import { sinAuditar } from "../../lib/audit";
import { BlurCamara } from "../../lib/blur";
import { arrive } from "../../lib/motion";
import { Mundo, Plano, encuadrar, velocidadCamara } from "../../lib/mundo";
import { Capa } from "../../lib/rig";
import {
  conRetraso,
  estirar,
  track,
  trackObj,
  velocidad,
} from "../../lib/timeline";
import { curvaEntre, enTrayecto } from "../../lib/trayecto";
import { marca } from "../../marca/marca";

/**
 * Escena de prueba del motor (no es una pieza): un solo mundo con tres estaciones, una ficha que
 * persiste y viaja entre ellas, un brazo con mano (padre e hijo con retraso), cámara 2.5D con
 * paralaje y foco, anotaciones pegadas a objetos que se mueven y motion blur de obturador.
 * Comprueba timeline.ts, rig.tsx, mundo.tsx, anclas.ts, trayecto.ts y blur.tsx juntos.
 */
export const MOTOR_MUNDO_DURACION = 270;

const c = marca.colores;
const A: Punto = { x: -1250, y: 0 };
const B: Punto = { x: 0, y: 0 };
const C: Punto = { x: 1300, y: 20 };
const LARGO_BRAZO = 250;
const HOMBRO: Punto = { x: B.x, y: B.y + 150 };

// Tiempos (cuadros).
const T = {
  viajeAB: 52,
  llegaB: 92,
  impulso: 100,
  golpe: 113,
  suelta: 127,
  llegaC: 168,
  abre: 204,
  fin: 236,
};

/** Rotación del brazo: reposo, toma impulso hacia atrás, lanza acelerando y se asienta. */
const rotBrazo = (f: number) =>
  track(f, [
    { t: T.impulso, v: 0 },
    { t: T.golpe, v: -22, curva: "aeEasy" },
    { t: T.suelta, v: 58, curva: "leaveSoft" },
    { t: T.suelta + 16, v: 74, curva: "arrive" },
    { t: T.suelta + 40, v: 0, curva: "move" },
  ]);

const brazoXf = (f: number): Xf => ({
  x: HOMBRO.x,
  y: HOMBRO.y,
  rot: rotBrazo(f),
});
const PUNTA: Punto = { x: 0, y: -LARGO_BRAZO };

/** Posición, ángulo y deformación de la ficha: sigue un arco, viaja en la mano y sale lanzada. */
const ficha = (f: number) => {
  const enMano = (g: number) => enMundo([brazoXf(g)], PUNTA);
  const posa = sinAuditar(() => enMano(T.llegaB));
  const sale = sinAuditar(() => enMano(T.suelta));
  const dAB = curvaEntre({ x: A.x, y: A.y - 40 }, posa, 0.28);
  const dBC = curvaEntre(sale, { x: C.x, y: C.y - 40 }, 0.34);
  const pAB = (g: number) =>
    track(g, [
      { t: T.viajeAB, v: 0 },
      { t: T.llegaB, v: 1, curva: "move" },
    ]);
  const pBC = (g: number) =>
    track(g, [
      { t: T.suelta, v: 0 },
      { t: T.llegaC, v: 1, curva: "arriveSoft" },
    ]);
  if (f < T.llegaB) {
    const pos = enTrayecto(dAB, pAB(f));
    return {
      ...pos,
      ...estirar(velocidad(pAB, f) * 1300, 0.0025, 0.14),
      dAB,
      dBC,
    };
  }
  if (f < T.suelta) {
    const p = enMano(f);
    return { x: p.x, y: p.y, rot: rotBrazo(f), largo: 1, ancho: 1, dAB, dBC };
  }
  const pos = enTrayecto(dBC, pBC(f));
  return {
    ...pos,
    ...estirar(velocidad(pBC, f) * 1400, 0.0025, 0.14),
    dAB,
    dBC,
  };
};

const Estacion: React.FC<{ en: Punto; titulo: string; nota: string }> = ({
  en,
  titulo,
  nota,
}) => (
  <Capa x={en.x} y={en.y + 190} centrar>
    <div
      style={{
        width: 520,
        padding: "28px 34px",
        borderRadius: marca.radios.grande,
        background: c.superficie,
        border: `2px solid ${c.linea}`,
        boxShadow: `0 30px 60px -20px ${c.sombraCalida}`,
        color: c.texto,
      }}
    >
      <div
        style={{
          fontFamily: marca.fuenteMono,
          fontSize: 22,
          color: c.acento,
          letterSpacing: 2,
        }}
      >
        {nota}
      </div>
      <div
        style={{
          fontFamily: marca.fuenteTitulo,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.05,
          marginTop: 6,
        }}
      >
        {titulo}
      </div>
    </div>
  </Capa>
);

const Trazo: React.FC<{
  d: string;
  p: number;
  color?: string;
  grosor?: number;
  punteado?: boolean;
}> = ({ d, p, color = c.acento, grosor = 7, punteado }) => {
  if (p <= 0) return null;
  const { strokeDasharray, strokeDashoffset } = evolvePath(p, d);
  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      width={1}
      height={1}
    >
      {punteado ? (
        <>
          <mask id="motor-ruta">
            <path
              d={d}
              fill="none"
              stroke="#FEFEFE"
              strokeWidth={grosor + 2}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          </mask>
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray="4 22"
            mask="url(#motor-ruta)"
          />
        </>
      ) : (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
        />
      )}
    </svg>
  );
};

type Pantalla = { ancho: number; alto: number };

/** Cámara de la escena (cuadro → cámara): se define por lo que se quiere ver en cada momento. */
const camaraEn = (frame: number, pantalla: Pantalla) => {
  const verA = encuadrar(
    { x: A.x, y: A.y + 60, ancho: 900, alto: 760 },
    pantalla,
  );
  const verB = encuadrar(
    { x: B.x + 40, y: B.y + 30, ancho: 1150, alto: 900 },
    pantalla,
  );
  const verC = encuadrar(
    { x: C.x, y: C.y + 60, ancho: 950, alto: 780 },
    pantalla,
  );
  const verTodo = encuadrar(
    { x: 30, y: 60, ancho: 3500, alto: 1300 },
    pantalla,
    0.04,
  );
  return trackObj(frame, [
    { t: 0, ...verA },
    { t: T.viajeAB - 4, ...verA, curva: "hold" },
    { t: T.llegaB + 4, ...verB, curva: "move" },
    { t: T.suelta - 3, ...verB, curva: "hold" },
    { t: T.llegaC + 6, ...verC, curva: "move" },
    { t: T.abre, ...verC, curva: "hold" },
    { t: T.fin, ...verTodo, curva: "arriveSoft" },
  ]);
};

/** Todo lo animado vive dentro del blur: así cada muestra del obturador calcula su propio instante. */
const Escena: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const camara = camaraEn(frame, { ancho: width, alto: height });

  // ── Escena: todas las transformaciones se calculan una vez por cuadro. ──
  const brazo = brazoXf(frame);
  const mano: Xf = {
    x: PUNTA.x,
    y: PUNTA.y,
    rot: conRetraso(rotBrazo, frame, 3) - rotBrazo(frame),
  };
  const fi = ficha(frame);

  // Anotaciones.
  const pCirculo = arrive(frame, 10, 20, "arriveSoft");
  const pRotulo = arrive(frame, 22, 14);
  const pFlecha = arrive(frame, T.llegaC + 12, 16, "arriveSoft");
  const pRotuloC = arrive(frame, T.llegaC + 22, 14);
  const pRuta = arrive(frame, T.abre + 6, 26, "arriveSoft");
  const rotuloC: Punto = { x: C.x + 330, y: C.y - 300 };
  const dFlecha = curvaEntre(
    { x: rotuloC.x - 30, y: rotuloC.y + 40 },
    { x: fi.x + 70, y: fi.y - 50 },
    -0.22,
  );
  const dCirculo = `M ${A.x + 78} ${A.y - 52} a 78 70 0 1 0 6 22`;

  return (
    <Mundo
      camara={{ ...camara, foco: 0 }}
      apertura={0.55}
      mano={3}
      semilla="motor"
    >
      {/* Fondo lejano: se mueve poco y queda fuera de foco. */}
      <Plano z={900}>
        {[-2100, -900, 400, 1700, 2900].map((x, i) => (
          <Capa key={x} x={x} y={i % 2 ? -260 : 180} centrar>
            <div
              style={{
                width: 620,
                height: 620,
                borderRadius: i % 2 ? 310 : 80,
                background: c.superficie,
                border: `3px solid ${c.linea}`,
                transform: `rotate(${i * 17}deg)`,
              }}
            />
          </Capa>
        ))}
      </Plano>

      {/* Plano principal. */}
      <Plano z={0}>
        <Trazo d={fi.dAB} p={pRuta} color={c.suave} grosor={5} punteado />
        <Estacion en={A} titulo="Una idea" nota="01 · ORIGEN" />
        <Estacion
          en={{ x: B.x, y: B.y + 60 }}
          titulo="El motor"
          nota="02 · PROCESO"
        />
        <Estacion en={C} titulo="Una historia" nota="03 · RESULTADO" />

        {/* Brazo (padre) y mano (hija, con 3 f de retraso). */}
        <Capa {...brazo}>
          <div
            style={{
              position: "absolute",
              left: -11,
              top: -LARGO_BRAZO,
              width: 22,
              height: LARGO_BRAZO,
              borderRadius: 11,
              background: c.suave,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -26,
              top: -26,
              width: 52,
              height: 52,
              borderRadius: 26,
              background: c.acentoProfundo,
              border: `4px solid ${c.suave}`,
            }}
          />
          <Capa {...mano}>
            <div
              style={{
                position: "absolute",
                left: -46,
                top: -8,
                width: 92,
                height: 26,
                borderRadius: 13,
                background: c.texto,
              }}
            />
          </Capa>
        </Capa>

        {/* La ficha: el mismo objeto de principio a fin. */}
        <Capa x={fi.x} y={fi.y} rot={fi.rot} escala={[fi.largo, fi.ancho]}>
          <div
            style={{
              position: "absolute",
              left: -44,
              top: -44,
              width: 88,
              height: 88,
              borderRadius: 44,
              background: c.acento,
              boxShadow: `0 18px 30px -10px ${c.sombraCalida}`,
            }}
          />
        </Capa>

        {/* Anotaciones en coordenadas de mundo: se quedan pegadas a lo que señalan. */}
        <Trazo d={dCirculo} p={pCirculo} color={c.texto} grosor={6} />
        <Capa
          x={A.x + 150}
          y={A.y - 150}
          opacidad={Math.min(1, pRotulo / 0.6)}
          estilo={{ translate: `0 ${(1 - pRotulo) * 16}px` }}
        >
          <div
            style={{
              fontFamily: marca.fuenteTexto,
              fontWeight: 600,
              fontSize: 34,
              color: c.texto,
              whiteSpace: "nowrap",
            }}
          >
            empieza aquí
          </div>
        </Capa>
        <Trazo d={dFlecha} p={pFlecha} color={c.texto} grosor={6} />
        <Capa
          x={rotuloC.x}
          y={rotuloC.y}
          centrar
          opacidad={Math.min(1, pRotuloC / 0.6)}
        >
          <div
            style={{
              fontFamily: marca.fuenteTexto,
              fontWeight: 600,
              fontSize: 34,
              color: c.texto,
              whiteSpace: "nowrap",
            }}
          >
            la misma ficha
          </div>
        </Capa>
      </Plano>

      {/* Primer plano: pasa rápido por delante. */}
      <Plano z={-420}>
        {[-1700, -420, 760, 1900].map((x, i) => (
          <Capa key={x} x={x} y={i % 2 ? 560 : -540} centrar>
            <div
              style={{
                width: 380,
                height: 240,
                borderRadius: 120,
                background: c.acentoProfundo,
                opacity: 0.55,
              }}
            />
          </Capa>
        ))}
      </Plano>
    </Mundo>
  );
};

export const MotorMundo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pantalla = { ancho: width, alto: height };
  const camara = (f: number) => camaraEn(f, pantalla);
  // Lo más rápido que hay en pantalla en este cuadro: el primer plano (z = −420), que pasa por
  // delante más rápido que el principal, o la ficha cuando sale lanzada. Con ese dato el blur
  // pone las muestras justas: 1 cuando todo está quieto y unas 25 en el pico del viaje. `fondo`
  // activa el promedio exacto: sin él, tantas muestras agrisarían los verdes oscuros de la marca.
  const vCamara = velocidadCamara(camara, frame, pantalla, -420);
  const vFicha = sinAuditar(() => {
    const a = ficha(frame - 0.5);
    const b = ficha(frame + 0.5);
    return Math.hypot(b.x - a.x, b.y - a.y) * (camara(frame).zoom ?? 1);
  });
  return (
    <AbsoluteFill style={{ background: c.fondo }}>
      <BlurCamara velocidad={Math.max(vCamara, vFicha)} fondo={c.fondo}>
        <Escena />
      </BlurCamara>
      <Look />
    </AbsoluteFill>
  );
};
