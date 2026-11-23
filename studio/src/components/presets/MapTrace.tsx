import { getLength, getPointAtLength } from "@remotion/paths";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, mix, springPreset, tween } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

export type Lugar = { nombre: string; lon: number; lat: number; dato?: string };
export type Caja = { oeste: number; este: number; sur: number; norte: number };

type Props = {
  lugares: Lugar[];
  /** Región a mostrar en grados (proyección equirectangular estirada al lienzo: es esquema, no cartografía). */
  caja: Caja;
  delay?: number;
  /** Cuadros de trazado por tramo: 18–30 deja leer cada nombre cuando aparece. */
  porTramo?: number;
  /** Pausa en cada parada antes del siguiente tramo. */
  pausa?: number;
  /** Papel, tinta y un solo acento (kb/13 estilo 2). */
  papel?: string;
  tinta?: string;
  acento?: string;
  /** Capa opcional bajo la ruta: contorno real, foto satelital o un SVG de d3-geo. */
  fondo?: React.ReactNode;
  /** Cada cuántos grados va la retícula. */
  reticula?: number;
};

/** Proyecta lon/lat a 0–1 dentro de la caja (equirectangular). */
export const proyectar = (lon: number, lat: number, c: Caja) => ({
  x: (lon - c.oeste) / (c.este - c.oeste),
  y: (c.norte - lat) / (c.norte - c.sur),
});

/**
 * Mapa editorial con ruta trazada (estilo 2, Vox / Johnny Harris, kb/13). Base de papel con retícula de
 * meridianos y paralelos, un solo acento para la ruta y las paradas. La ruta se dibuja tramo a tramo con
 * curva move; cada parada hace pop cuando el trazo llega y su nombre entra en ese momento ("los nombres
 * aparecen cuando se dicen"). La cámara empuja despacio hacia el punto activo con curva glide.
 * Sin dependencias de geodatos: el contorno real entra por `fondo` cuando la pieza lo necesite.
 */
export const MapTrace: React.FC<Props> = ({
  lugares,
  caja,
  delay = 0,
  porTramo = 24,
  pausa = 10,
  papel = "#EDE6D6",
  tinta = "#2A2620",
  acento = "#C2410C",
  fondo,
  reticula = 2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho, alto } = useEscala();
  const m = 0.14; // margen interno del mapa
  const pts = lugares.map((l) => {
    const p = proyectar(l.lon, l.lat, caja);
    return { ...l, x: (m + p.x * (1 - 2 * m)) * ancho, y: (m + p.y * (1 - 2 * m)) * alto };
  });
  // Tramos curvos: control desplazado a la izquierda de la cuerda, como una ruta dibujada a mano.
  const tramos = pts.slice(1).map((b, i) => {
    const a = pts[i];
    const cx = (a.x + b.x) / 2 - (b.y - a.y) * 0.22;
    const cy = (a.y + b.y) / 2 + (b.x - a.x) * 0.22;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  });
  const inicio = (i: number) => delay + 8 + i * (porTramo + pausa);
  const llegada = (i: number) => (i === 0 ? delay + 4 : inicio(i - 1) + porTramo);

  // Punto activo para la cámara: la punta del trazo.
  let foco = pts[0];
  tramos.forEach((d, i) => {
    const t = tween(frame, inicio(i), porTramo, "move");
    const pt = t > 0 ? getPointAtLength(d, getLength(d) * t) : null;
    if (pt) {
      foco = { ...foco, x: pt.x, y: pt.y };
    }
  });
  const push = tween(frame, delay, inicio(tramos.length) - delay + 20, "glide");
  const z = mix(push, 1, 1.12);
  const tx = (ancho / 2 - foco.x) * 0.35 * push;
  const ty = (alto / 2 - foco.y) * 0.35 * push;

  const lineas: React.ReactNode[] = [];
  for (let lon = Math.ceil(caja.oeste / reticula) * reticula; lon <= caja.este; lon += reticula) {
    const x = (m + proyectar(lon, 0, caja).x * (1 - 2 * m)) * ancho;
    lineas.push(<line key={`lon${lon}`} x1={x} x2={x} y1={0} y2={alto} />);
  }
  for (let lat = Math.ceil(caja.sur / reticula) * reticula; lat <= caja.norte; lat += reticula) {
    const y = (m + proyectar(0, lat, caja).y * (1 - 2 * m)) * alto;
    lineas.push(<line key={`lat${lat}`} x1={0} x2={ancho} y1={y} y2={y} />);
  }

  return (
    <AbsoluteFill style={{ background: papel, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: `${foco.x}px ${foco.y}px` }}>
        {fondo}
        <svg width={ancho} height={alto} style={{ position: "absolute", inset: 0 }}>
          <g stroke={tinta} strokeOpacity={0.22} strokeWidth={1.2 * u}>
            {lineas}
          </g>
          {tramos.map((d, i) => {
            const t = tween(frame, inicio(i), porTramo, "move");
            const len = getLength(d);
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={acento}
                strokeWidth={5 * u}
                strokeLinecap="round"
                strokeDasharray={`${len} ${len}`}
                strokeDashoffset={len * (1 - t)}
              />
            );
          })}
        </svg>
        {pts.map((p, i) => {
          const s = springPreset(frame, fps, "pop", llegada(i));
          const label = arrive(frame, llegada(i) + 3, 12, "arrive");
          return (
            <div key={p.nombre} style={{ position: "absolute", left: p.x, top: p.y }}>
              <div
                style={{
                  position: "absolute",
                  width: 22 * u,
                  height: 22 * u,
                  left: -11 * u,
                  top: -11 * u,
                  borderRadius: "50%",
                  background: papel,
                  border: `${5 * u}px solid ${acento}`,
                  opacity: Math.min(1, s * 2),
                  transform: `scale(${0.6 + 0.4 * s})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 26 * u,
                  top: -30 * u,
                  whiteSpace: "nowrap",
                  opacity: label,
                  transform: `translateX(${(1 - label) * -14 * u}px)`,
                  clipPath: `inset(0 ${(1 - label) * 100}% 0 0)`,
                }}
              >
                <div style={{ fontFamily: marca.fuenteTitulo, fontWeight: 700, fontSize: 46 * u, color: tinta, letterSpacing: "-0.02em" }}>
                  {p.nombre}
                </div>
                {p.dato && (
                  <div style={{ fontFamily: marca.fuenteMono, fontSize: 24 * u, color: tinta, opacity: 0.7, marginTop: 4 * u }}>{p.dato}</div>
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
