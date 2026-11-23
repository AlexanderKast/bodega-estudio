import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, wiggle } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

// Matriz de Bayer 8×8 (dither ordenado, algoritmo público). Umbral = valor / 64.
const B4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const BAYER = Array.from({ length: 8 }, (_, y) =>
  Array.from({ length: 8 }, (_, x) => 4 * B4[y % 4][x % 4] + [0, 2, 3, 1][(y >> 2) * 2 + (x >> 2)]),
);

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

type Props = {
  /** Tinta de fondo y tinta de trama (dos tintas, 1 bit). */
  fondo?: string;
  tinta?: string;
  /** Tamaño del punto de trama en px a 1080: 4–8 se lee como pixel art; 2–3 como impresión. */
  punto?: number;
  /** Forma del campo de luz que se trama. */
  forma?: "radial" | "lineal";
  /** Foco del campo en 0–1. */
  fx?: number;
  fy?: number;
  delay?: number;
  /** Cuadros del revelado por umbral. */
  duration?: number;
};

/**
 * Dither ordenado de 1 bit (estilo 14, kb/13 §2). Un campo de luz (radial o lineal) se convierte en trama
 * de Bayer 8×8 a dos tintas, y el revelado anima el umbral: la imagen "se imprime" desde el foco hacia
 * afuera en patrones de trama, no con un fade. Se dibuja en un canvas a baja resolución y se escala con
 * `pixelated`, así el punto queda nítido en cualquier formato. El foco deriva apenas con wiggle.
 */
export const BayerDither: React.FC<Props> = ({
  fondo = marca.colores.fondo,
  tinta = marca.colores.acento,
  punto = 6,
  forma = "radial",
  fx = 0.68,
  fy = 0.42,
  delay = 0,
  duration = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho, alto } = useEscala();
  const ref = useRef<HTMLCanvasElement>(null);
  const cell = Math.max(1, punto * u);
  const w = Math.ceil(ancho / cell);
  const h = Math.ceil(alto / cell);
  const p = arrive(frame, delay, duration, "arriveSoft");
  const cx = fx + wiggle("dither-x", frame, fps, 0.3, 0.02);
  const cy = fy + wiggle("dither-y", frame, fps, 0.3, 0.02);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(w, h);
    const a = hex(fondo);
    const b = hex(tinta);
    const aspect = w / h;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const ny = y / h;
        const d = forma === "radial" ? Math.hypot((nx - cx) * aspect, ny - cy) / 0.9 : 1 - nx * 0.9 - ny * 0.25;
        // Luz del campo (1 en el foco) recortada por el revelado, que avanza desde el foco.
        const luz = Math.max(0, 1 - d) * Math.min(1, Math.max(0, (p * 1.4 - d) / 0.4));
        const on = luz > (BAYER[y % 8][x % 8] + 0.5) / 64;
        const c = on ? b : a;
        const k = (y * w + x) * 4;
        img.data[k] = c[0];
        img.data[k + 1] = c[1];
        img.data[k + 2] = c[2];
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [w, h, p, cx, cy, fondo, tinta, forma]);

  return (
    <AbsoluteFill style={{ background: fondo }}>
      <canvas ref={ref} width={w} height={h} style={{ width: w * cell, height: h * cell, imageRendering: "pixelated" }} />
    </AbsoluteFill>
  );
};
