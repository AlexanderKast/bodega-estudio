import { createContext, useContext } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Punto } from "./anclas";
import { sinAuditar } from "./audit";
import { wiggle } from "./motion";

/**
 * Mundo con cámara: la composición única con cámara 2.5D de After Effects. La pieza vive en un
 * lienzo continuo, mucho más grande que el cuadro, y la cámara viaja por él. Los objetos no se
 * montan y desmontan por escena: están en el mundo y la cámara decide qué se ve.
 *
 * - Las coordenadas del mundo van en px; el (0, 0) cae en el centro del cuadro cuando la cámara
 *   está en (0, 0) con zoom 1.
 * - Cada `<Plano z>` es una profundidad. z = 0 es el plano principal; z > 0 queda más lejos (se
 *   mueve menos y crece menos al acercarse); z < 0 queda más cerca (pasa rápido por delante).
 * - Lo dibujado en un plano conserva su tamaño de diseño cuando el zoom es 1: la profundidad solo
 *   cambia cuánto responde a la cámara, así se maqueta sin calcular perspectiva.
 * - El zoom es un dolly: la cámara avanza, no es un escalado plano, por eso hay paralaje al acercar.
 *
 * La cámara se anima con `trackObj` de `timeline.ts` y se pasa en la prop `camara`.
 */
export type Camara = {
  x: number;
  y: number;
  zoom?: number; // 1 = tamaño de diseño en el plano z = 0
  rot?: number; // grados
  foco?: number; // profundidad que queda nítida
};

type Ctx = { cam: Required<Camara>; ancho: number; alto: number; focal: number; apertura: number };
const MundoCtx = createContext<Ctx | null>(null);

/** Escala con la que se ve un plano a profundidad `z` (1 en z = 0 con zoom 1). */
const escalaPlano = (focal: number, zoom: number, z: number) => {
  const d = focal / zoom + z;
  return d > 1 ? focal / d : 0;
};

type MundoProps = {
  camara: Camara;
  children: React.ReactNode;
  focal?: number; // px; más bajo = perspectiva más marcada
  apertura?: number; // px de desenfoque por cada 100 px de distancia al plano de foco (0 = todo nítido)
  mano?: number; // px de deriva de cámara en mano (0 = trípode)
  semilla?: string;
  estilo?: React.CSSProperties;
};

export const Mundo: React.FC<MundoProps> = ({ camara, children, focal = 1200, apertura = 0, mano = 0, semilla = "mundo", estilo }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const cam: Required<Camara> = {
    x: camara.x + (mano ? wiggle(`${semilla}-x`, frame, fps, 0.4, mano) : 0),
    y: camara.y + (mano ? wiggle(`${semilla}-y`, frame, fps, 0.33, mano * 0.7) : 0),
    zoom: camara.zoom ?? 1,
    rot: (camara.rot ?? 0) + (mano ? wiggle(`${semilla}-r`, frame, fps, 0.25, mano * 0.03) : 0),
    foco: camara.foco ?? 0,
  };
  return (
    <MundoCtx.Provider value={{ cam, ancho: width, alto: height, focal, apertura }}>
      <AbsoluteFill style={{ overflow: "hidden", ...estilo }}>
        <AbsoluteFill style={{ transform: `rotate(${-cam.rot}deg)` }}>{children}</AbsoluteFill>
      </AbsoluteFill>
    </MundoCtx.Provider>
  );
};

export const useMundo = (): Ctx => {
  const c = useContext(MundoCtx);
  if (!c) throw new Error("<Plano> y useMundo() van dentro de <Mundo>.");
  return c;
};

type PlanoProps = {
  z?: number;
  children: React.ReactNode;
  opacidad?: number;
};

/** Una profundidad del mundo. Sus hijos (normalmente `<Capa>`) se colocan en coordenadas de mundo. */
export const Plano: React.FC<PlanoProps> = ({ z = 0, children, opacidad = 1 }) => {
  const { cam, ancho, alto, focal, apertura } = useMundo();
  const s = escalaPlano(focal, cam.zoom, z);
  if (s === 0) return null; // quedó detrás de la cámara
  const s0 = escalaPlano(focal, 1, z);
  const blur = (apertura * Math.abs(z - cam.foco)) / 100;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        transformOrigin: "0 0",
        transform: `translate(${ancho / 2 - cam.x * s}px, ${alto / 2 - cam.y * s}px) scale(${s / s0})`,
        opacity: opacidad,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

/** Dónde cae en pantalla un punto del mundo (sin la rotación de cámara). Para rótulos fijos que señalan algo del mundo. */
export const proyectar = (camara: Camara, pantalla: { ancho: number; alto: number }, punto: Punto, z = 0, focal = 1200): Punto => {
  const zoom = camara.zoom ?? 1;
  const s = escalaPlano(focal, zoom, z);
  const s0 = escalaPlano(focal, 1, z);
  return { x: pantalla.ancho / 2 + punto.x * (s / s0) - camara.x * s, y: pantalla.alto / 2 + punto.y * (s / s0) - camara.y * s };
};

/**
 * Cámara que encuadra un rectángulo del plano z = 0 (centro y tamaño en px de mundo), dejando
 * `margen` (0–0,5) de aire. Sirve para definir los keyframes de cámara por lo que se quiere ver.
 */
export const encuadrar = (zona: { x: number; y: number; ancho: number; alto: number }, pantalla: { ancho: number; alto: number }, margen = 0.12): Required<Pick<Camara, "x" | "y" | "zoom">> => ({
  x: zona.x,
  y: zona.y,
  zoom: Math.min(pantalla.ancho / zona.ancho, pantalla.alto / zona.alto) * (1 - margen * 2),
});

/**
 * Velocidad de la cámara en pantalla, en px por cuadro, para el plano a profundidad `z`: cuánto se
 * desplaza lo que está en el centro y en las esquinas del cuadro entre medio cuadro antes y medio
 * después (traslación y zoom juntos; se queda con el mayor). Es el dato que pide `<BlurCamara
 * velocidad>` para elegir las muestras. `camara` es la función de cámara de la escena (cuadro →
 * cámara); se evalúa sin registrar eventos en la auditoría. Los planos cercanos (z < 0) van más
 * rápido que el principal: pide la del plano más cercano que tenga bordes duros.
 */
export const velocidadCamara = (
  camara: (frame: number) => Camara,
  frame: number,
  pantalla: { ancho: number; alto: number },
  z = 0,
  focal = 1200,
): number =>
  sinAuditar(() => {
    const ahora = camara(frame);
    const antes = camara(frame - 0.5);
    const despues = camara(frame + 0.5);
    const s = escalaPlano(focal, ahora.zoom ?? 1, z);
    const k = s / escalaPlano(focal, 1, z);
    if (!(k > 0)) return 0;
    let max = 0;
    for (const [u, v] of [
      [0, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      // Punto del mundo que ahora cae en esa parte del cuadro.
      const punto = { x: ((u * pantalla.ancho) / 2 + ahora.x * s) / k, y: ((v * pantalla.alto) / 2 + ahora.y * s) / k };
      const a = proyectar(antes, pantalla, punto, z, focal);
      const b = proyectar(despues, pantalla, punto, z, focal);
      max = Math.max(max, Math.hypot(b.x - a.x, b.y - a.y));
    }
    return max;
  });
