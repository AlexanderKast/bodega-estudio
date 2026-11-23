import { CameraMotionBlur, Trail } from "@remotion/motion-blur";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import { auditEvent, auditOn } from "./audit";

/**
 * Cuántas muestras necesita el obturador para que el barrido no se vea a escalones.
 *
 * Con velocidad `v` (px por cuadro en pantalla) y obturador `o`, lo que se mueve se barre
 * `v · o / 360` px. Las muestras reparten ese barrido en copias; si entre dos copias quedan más de
 * ~2 px, un borde duro (y sobre todo el texto) se ve como una escalera de bandas en vez de un
 * difuminado. Por eso:
 *
 *   muestras = ⌈ v · (o / 360) / paso ⌉      (paso = 2 px por defecto, tope `max`)
 *
 * A 180° (obturador de cine), medido en 1920 × 1080:
 *
 *   velocidad (px/cuadro)   barrido (px)   muestras
 *   hasta 4                 2              1 (no hace falta blur)
 *   16                      8              4
 *   32                      16             8
 *   48                      24             12
 *   64                      32             16
 *   96                      48             24
 *   160 o más               80             40 (tope; más rápido que esto ya es un whip: usa la transición)
 *
 * Con 8 muestras fijas, todo lo que pase de ~32 px/cuadro deja bandas (un viaje de cámara normal
 * llega a 60–100 en el pico). Formas grandes y blandas aguantan `paso={3}`; texto fino sobre fondo
 * de mucho contraste, `paso={1.5}`.
 */
export const muestrasPara = (velocidad: number, obturador = 180, paso = 2, max = 40) =>
  Math.max(1, Math.min(max, Math.ceil((Math.abs(velocidad) * (obturador / 360)) / Math.max(0.5, paso))));

type BlurProps = {
  children: React.ReactNode;
  obturador?: number; // grados; 180 = cine
  /** Muestras fijas. Se ignora si llega `velocidad`. */
  muestras?: number;
  /**
   * Velocidad en pantalla de lo más rápido que hay dentro, en px por cuadro (la de la cámara con
   * `velocidadCamara()` de mundo.tsx, la de un objeto con `velocidad()` de timeline.ts). Con ella las
   * muestras se ajustan cuadro a cuadro: una sola cuando casi nada se mueve (render barato) y las
   * necesarias en el pico (sin bandas).
   */
  velocidad?: number;
  paso?: number; // px máximos entre dos muestras
  maxMuestras?: number;
  /**
   * Color opaco del fondo de la escena. Con él las muestras se promedian de forma exacta (ver
   * abajo) y se puede subir a 40 sin que cambie el color. Sin él (escena con transparencia, blur
   * sobre un video) se usa el promedio aditivo, que pierde precisión: no pasa de 12 muestras.
   */
  fondo?: string;
  activo?: boolean;
};

/** Con el promedio aditivo, más de 12 muestras agrisan los tonos oscuros (cada copia pesa 1/n y se redondea a 8 bits). */
const MAX_ADITIVO = 12;

/**
 * Motion blur de obturador (el interruptor de motion blur de After Effects). Renderiza sus hijos
 * varias veces dentro del intervalo del obturador y las promedia: lo que se mueve rápido se barre
 * y lo quieto queda nítido. Va alrededor de lo que se mueve (el `<Mundo>`, una capa rápida), no
 * de toda la pieza: multiplica el costo del render por el número de muestras, así que el render
 * final corre en el VPS de Bodega o en este equipo.
 *
 * Importante: lo animado tiene que calcularse DENTRO del blur (un componente hijo que llame a
 * `useCurrentFrame()`). Si los valores se calculan afuera y se pasan por props, todas las muestras
 * reciben el mismo instante y no hay barrido. La `velocidad`, en cambio, se calcula afuera.
 *
 * Dos formas de promediar:
 * - Con `fondo` (recomendado): cada muestra es una capa opaca y la capa k se apila con opacidad
 *   1/k (1, 1/2, 1/3…). El resultado es el promedio exacto, lo quieto queda idéntico al original y
 *   el número de muestras no altera el color. El intervalo va centrado en el cuadro.
 * - Sin `fondo`: `CameraMotionBlur` de Remotion (suma copias con peso 1/n). Respeta la
 *   transparencia, pero con muchas muestras los oscuros se agrisan; por eso se limita a 12.
 *
 * Costo en memoria: cada muestra vuelve a pintar todo lo que envuelve. Con muchas capas con filtro SVG
 * (la piel `tiza`, sombras) y más de ~16 muestras, Chrome se queda sin memoria y el render muere con
 * «Page crashed». Por eso `velocidad` debe ser la de la cámara, no la de un objeto suelto que cruza una
 * escena quieta: a ese objeto se le da `desenfoque` propio en su `<Capa>`. Si aun así el barrido deja
 * escalones, baja el obturador a 90° antes de subir las muestras (piloto AgenteIA, 2026-11-11).
 *
 * En la auditoría no se aplica (no hay píxeles) y deja constancia de que la pieza tiene blur, para
 * la regla B-01.
 */
export const BlurCamara: React.FC<BlurProps> = ({
  children,
  obturador = 180,
  muestras = 8,
  velocidad,
  paso = 2,
  maxMuestras = 40,
  fondo,
  activo = true,
}) => {
  const frame = useCurrentFrame();
  if (activo) auditEvent(frame, 0, { kind: "blur" });
  if (!activo || auditOn()) return <>{children}</>;
  const tope = fondo ? maxMuestras : Math.min(maxMuestras, MAX_ADITIVO);
  const n = Math.max(1, Math.round(velocidad === undefined ? Math.min(muestras, tope) : muestrasPara(velocidad, obturador, paso, tope)));
  if (!fondo) {
    return (
      <CameraMotionBlur shutterAngle={obturador} samples={n}>
        {children}
      </CameraMotionBlur>
    );
  }
  const abierto = obturador / 360; // fracción del cuadro con el obturador abierto
  return (
    <AbsoluteFill style={{ isolation: "isolate" }}>
      {Array.from({ length: n }, (_, k) => (
        // Siempre el mismo árbol para la muestra k: al cambiar el número de muestras React no desmonta las demás.
        <AbsoluteFill key={k} style={{ background: fondo, opacity: 1 / (k + 1) }}>
          <Freeze frame={frame + abierto * ((k + 0.5) / n - 0.5)}>{children}</Freeze>
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

/** Estela: copias atrasadas que se desvanecen (el efecto Echo de After Effects). Para trazos y objetos lanzados. */
export const Estela: React.FC<{ children: React.ReactNode; capas?: number; atraso?: number; opacidad?: number }> = ({
  children,
  capas = 4,
  atraso = 0.4,
  opacidad = 0.5,
}) => {
  const frame = useCurrentFrame();
  auditEvent(frame, 0, { kind: "blur" });
  if (auditOn()) return <>{children}</>;
  return (
    <Trail layers={capas} lagInFrames={atraso} trailOpacity={opacidad}>
      {children}
    </Trail>
  );
};
