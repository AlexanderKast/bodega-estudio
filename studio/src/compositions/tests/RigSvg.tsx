import { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Anotaciones, Callout, Lupa } from "../../components/anotacion";
import { CutoutObject, Look } from "../../components/presets";
import { enMundo, type Punto, type Xf } from "../../lib/anclas";
import { sinAuditar } from "../../lib/audit";
import { BlurCamara } from "../../lib/blur";
import { tween } from "../../lib/motion";
import { Mundo, Plano, encuadrar, velocidadCamara } from "../../lib/mundo";
import { Capa } from "../../lib/rig";
import {
  SvgObjeto,
  reagrupar,
  useSvgRig,
  xfParte,
  xfRaiz,
  type SvgRig,
} from "../../lib/svg-rig";
import { mover, track, trackObj, velocidad } from "../../lib/timeline";

/**
 * Escena de prueba del rig de SVG (no es una pieza): el despertador de `assets/prueba-f3` (generado,
 * recortado y vectorizado por `scripts/assets`) se dibuja trazo a trazo, se rellena, y se mueve por
 * partes dentro de un `<Mundo>`: giran las manecillas, suenan las campanas y el cuerpo salta. Encima,
 * una lupa que amplía el eje en vivo y un callout pegado a una campana que se mueve. La luz de la
 * escena es una sola: la sombra del reloj (`<Capa sombra>`) y la del megáfono (`CutoutObject`) caen
 * hacia el mismo lado. Comprueba svg-rig.tsx, luz.tsx y el blur adaptativo.
 */
export const RIG_SVG_DURACION = 250;

const PAPEL = "#EFE9DC";
const LAPIZ = "#2A2722";
const TINTA = "#C4311C";
const ANCHO_RELOJ = 520;
const MANECILLAS = "manecillas";
const CARA = "#F7FBDE"; // color de la capa de la cara, para tapar lo que dejan las manecillas al girar
const EJE: [number, number] = [316, 528]; // centro de las manecillas, en el viewBox
const CAMPANA: Punto = { x: 548, y: 150 }; // lomo de la campana derecha, en el viewBox

const T = {
  trazo: 6,
  relleno: 58,
  megafono: 78,
  giro: 104,
  lupa: 96,
  suena: 156,
  callout: 172,
  abre: 150,
};

/**
 * El vectorizador separa por color. Aquí se arman las piezas con sentido: las manecillas con sus
 * sombras pintadas (que estaban en la capa verde) y las campanas con el martillo (repartidos en las
 * dos capas oscuras), cada una con su pivote.
 */
const prepararReloj = (rig: SvgRig) =>
  reagrupar(rig, {
    [MANECILLAS]: {
      paths: ["capa-03-beda95-p02", "capa-03-beda95-p03", "capa-04-ee7c0b-p01"],
      pivote: EJE,
    },
    campanas: {
      paths: [
        "capa-01-3b423c-p02",
        "capa-05-282215-p02",
        "capa-05-282215-p03",
        "capa-05-282215-p04",
        "capa-05-282215-p05",
      ],
      pivote: [315, 300],
    },
  });

// ── Animación (funciones del cuadro: las usan el reloj, la lupa y las anclas). ──
const rotManecillas = (f: number) =>
  mover(f, { de: 0, a: 330, inicio: T.giro, dur: 38, anticipa: 0.04, asienta: 0.02 });

/** Las campanas vibran: golpes alternos que se apagan. */
const rotCampanas = (f: number) =>
  track(f, [
    { t: T.suena, v: 0 },
    { t: T.suena + 3, v: 7, curva: "arriveGentle" },
    { t: T.suena + 6, v: -7, curva: "aeEasy" },
    { t: T.suena + 9, v: 6, curva: "aeEasy" },
    { t: T.suena + 12, v: -6, curva: "aeEasy" },
    { t: T.suena + 15, v: 5, curva: "aeEasy" },
    { t: T.suena + 18, v: -4, curva: "aeEasy" },
    { t: T.suena + 22, v: 3, curva: "aeEasy" },
    { t: T.suena + 26, v: -2, curva: "aeEasy" },
    { t: T.suena + 32, v: 0, curva: "arriveGentle" },
  ]);

/** El cuerpo salta con el timbrazo: sube rápido, cae y se asienta. */
const salto = (f: number) =>
  track(f, [
    { t: T.suena, v: 0 },
    { t: T.suena + 7, v: 1, curva: "arrive" },
    { t: T.suena + 16, v: 0, curva: "leaveSoft" },
    { t: T.suena + 20, v: 0.18, curva: "arriveGentle" },
    { t: T.suena + 25, v: 0, curva: "leaveSoft" },
  ]);

const relojXf = (f: number): Xf => {
  const s = salto(f);
  return { x: 0, y: -34 * s, rot: -2.5 * s, pivote: [0, 330] };
};

type Pantalla = { ancho: number; alto: number };

const camaraEn = (f: number, pantalla: Pantalla) =>
  trackObj(f, [
    { t: 0, ...encuadrar({ x: 0, y: 10, ancho: 1500, alto: 900 }, pantalla, 0.06) },
    { t: T.lupa - 8, ...encuadrar({ x: 0, y: 10, ancho: 1500, alto: 900 }, pantalla, 0.06), curva: "hold" },
    { t: T.lupa + 16, ...encuadrar({ x: -210, y: 10, ancho: 1500, alto: 900 }, pantalla, 0.02), curva: "move" },
    { t: T.abre, ...encuadrar({ x: -210, y: 10, ancho: 1500, alto: 900 }, pantalla, 0.02), curva: "hold" },
    { t: T.abre + 30, ...encuadrar({ x: 150, y: -20, ancho: 1900, alto: 1060 }, pantalla, 0.02), curva: "move" },
  ]);

/** El reloj animado. Se dibuja dos veces: en el mundo y dentro de la lupa. */
const Reloj: React.FC<{ rig: SvgRig; sombra?: boolean }> = ({ rig, sombra = true }) => {
  const frame = useCurrentFrame();
  const pTrazo = tween(frame, T.trazo, 56, "aeEasy");
  const pRelleno = tween(frame, T.relleno, 34, "arriveGentle");
  const s = salto(frame);
  return (
    <Capa {...relojXf(frame)} sombra={sombra ? s * 0.8 : undefined}>
      <SvgObjeto
        rig={rig}
        ancho={ANCHO_RELOJ}
        trazo={pTrazo}
        relleno={pRelleno}
        colorTrazo={LAPIZ}
        grosor={3.5}
        partes={{
          [MANECILLAS]: { rot: rotManecillas(frame), tapa: CARA },
          campanas: { rot: rotCampanas(frame) },
        }}
      />
    </Capa>
  );
};

const Escena: React.FC<{ rig: SvgRig }> = ({ rig }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const camara = camaraEn(frame, { ancho: width, alto: height });
  const raiz = xfRaiz(rig, ANCHO_RELOJ);
  // Dónde quedan en el mundo el eje de las manecillas y el lomo de la campana (que vibra y salta).
  const { eje, campana } = sinAuditar(() => ({
    eje: enMundo([relojXf(frame), raiz], { x: EJE[0], y: EJE[1] }),
    campana: enMundo([relojXf(frame), raiz, xfParte(rig, "campanas", { rot: rotCampanas(frame) })], CAMPANA),
  }));
  return (
    <Mundo camara={camara} mano={2} semilla="rig">
      <Plano z={0}>
        {/* El papel es parte del mundo: se mueve con la cámara. */}
        {[-2, -1, 0, 1].flatMap((i) =>
          [-1, 0].map((j) => (
            <Img
              key={`${i}-${j}`}
              src={staticFile("texturas/papel-crema.jpg")}
              style={{
                position: "absolute",
                left: i * 1024,
                top: j * 1024,
                width: 1024,
                height: 1024,
              }}
            />
          )),
        )}
        <Reloj rig={rig} />
        {/* Recorte PNG con la misma luz: su sombra cae hacia el mismo lado que la del reloj. */}
        <CutoutObject
          src={staticFile("assets/prueba-f3/megafono-papel.png")}
          ancho={380}
          x={690 / width}
          y={170 / height}
          at={T.megafono}
          out={null}
          rotacion={6}
          rotacionInicial={-10}
          deriva={3}
          seed="megafono"
        />
        <Anotaciones piel="marcador" color={TINTA} fondo={PAPEL}>
          <Lupa
            zona={{ x: eje.x, y: eje.y, ancho: 150, alto: 150 }}
            en={{ x: -640, y: -150 }}
            tam={330}
            inicio={T.lupa}
            curvatura={0.14}
            semilla="lupa-eje"
          >
            <Reloj rig={rig} sombra={false} />
          </Lupa>
          <Callout
            ancla={campana}
            en={{ x: 380, y: -330 }}
            texto="suena una sola vez"
            tam={36}
            inicio={T.callout}
            semilla="call-campana"
          />
        </Anotaciones>
      </Plano>
    </Mundo>
  );
};

export const RigSvg: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // El SVG se carga fuera del blur: una sola vez, no una por muestra del obturador.
  const crudo = useSvgRig(staticFile("assets/prueba-f3/despertador-recorte.svg"));
  const rig = useMemo(() => (crudo ? prepararReloj(crudo) : null), [crudo]);
  const pantalla = { ancho: width, alto: height };
  const camara = (f: number) => camaraEn(f, pantalla);
  // Lo más rápido en pantalla: la cámara o la punta de las manecillas cuando giran.
  const zoom = sinAuditar(() => camara(frame).zoom);
  const vManecillas = Math.abs(velocidad(rotManecillas, frame)) * (Math.PI / 180) * 175 * zoom;
  const vCamara = velocidadCamara(camara, frame, pantalla);
  return (
    <AbsoluteFill style={{ background: PAPEL }}>
      <Look grain={0.05} vignette={0.22} warmth="#3A2A16" sombras={0.18} luces={-0.2} negro={0.03} luz={{ angulo: 52, largo: 40, opacidad: 0.34, color: "#3B2E1E" }}>
        <BlurCamara velocidad={Math.max(vCamara, vManecillas)} fondo={PAPEL}>{rig ? <Escena rig={rig} /> : null}</BlurCamara>
      </Look>
    </AbsoluteFill>
  );
};
