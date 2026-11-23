import { useId } from "react";
import { noise2D } from "@remotion/noise";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { marca } from "../../marca/marca";
import { arrive, semilla, staggerDelay } from "../../lib/motion";
import { useEscala } from "../../lib/escala";

type Props = {
  /** Tintas de las manchas (3–5). Por defecto salen de la marca: verdes y un claro cálido, nada de morado→azul. */
  colores?: string[];
  /** Color de base sobre el que se mezclan. */
  fondo?: string;
  /** Cantidad de manchas; si hay más que colores, los colores se repiten. */
  manchas?: number;
  /** Segundos de un ciclo de deriva (kb/06: 8–20 s para un fondo vivo que no distrae). */
  ciclo?: number;
  /** Cuánto viaja cada mancha, en fracción del cuadro. */
  recorrido?: number;
  /** Desenfoque de las manchas en px a 1080. */
  blur?: number;
  /** Opacidad del grano encima (0 = sin grano). Sin grano el gradiente bandea (AI-25). */
  grano?: number;
  /** Cuadro en que las manchas empiezan a aparecer (escalonadas desde la más grande). */
  at?: number;
  seed?: string;
  children?: React.ReactNode;
};

/** Manchas por defecto: verde profundo, acento, verde claro y sombra cálida de la marca (kb/06 §mesh). */
const paletaMarca = [
  marca.colores.acentoProfundo,
  marca.colores.acento,
  marca.colores.superficie,
  marca.colores.acentoClaro,
  marca.colores.sombraCalida,
];

/**
 * Gradiente de malla que fluye (pins "nuevo:GradientFlow": cinta ondulada tras texto minimal, ondas concéntricas
 * borrosas en loop lento, esfera de gradiente con wiggle(0.5, 280) de AE; kb/06 "mesh / aurora gradient").
 *
 * Técnica: 3–6 manchas radiales grandes, cada una con su centro, radio y tinta, que derivan con `noise2D` de
 * @remotion/noise sobre un ciclo de 8–20 s (movimiento continuo, no easing: es un campo, no un objeto que va de
 * A a B). El radio también respira con su propio ruido para que la malla cambie de forma y no solo se traslade.
 * Las manchas se mezclan con `screen` sobre un fondo oscuro de la marca y se desenfocan fuerte; encima va grano
 * vivo (semilla cada 2 f) para matar el banding. La entrada escalona las manchas con `staggerDelay`.
 */
export const GradientFlow: React.FC<Props> = ({
  colores = paletaMarca,
  fondo = marca.colores.fondo,
  manchas = 5,
  ciclo = 14,
  recorrido = 0.22,
  blur = 90,
  grano = 0.08,
  at = 0,
  seed = "flow",
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, ancho, alto } = useEscala();
  const id = `flow${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const t = frame / fps / Math.max(1, ciclo);
  const lado = Math.max(ancho, alto);

  const blobs = Array.from({ length: manchas }, (_, i) => {
    // Base repartida en una espiral suelta para que no queden alineadas ni en grilla.
    const ang = i * 2.399;
    const rad = 0.18 + 0.12 * ((i * 7) % 3);
    const bx = 0.5 + Math.cos(ang) * rad;
    const by = 0.5 + Math.sin(ang) * rad * 0.8;
    const nx = noise2D(`${seed}-x-${i}`, t, i * 0.37);
    const ny = noise2D(`${seed}-y-${i}`, i * 0.37, t);
    const nr = noise2D(`${seed}-r-${i}`, t * 0.7, i);
    const r = lado * (0.32 + 0.08 * ((i * 5) % 4) / 3) * (1 + 0.18 * nr);
    return { i, x: (bx + nx * recorrido) * ancho, y: (by + ny * recorrido) * alto, r, color: colores[i % colores.length] };
  });
  // Entrada desde la mancha más grande: primero llega la masa, después el detalle.
  const orden = [...blobs].sort((a, b) => b.r - a.r).map((b) => b.i);

  return (
    <AbsoluteFill style={{ background: fondo, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: `blur(${blur * u}px)` }}>
        {blobs.map((b) => {
          const p = arrive(frame, at + staggerDelay(orden.indexOf(b.i), manchas, 18), 24, "arriveSoft");
          return (
            <div
              key={b.i}
              style={{
                position: "absolute",
                left: b.x - b.r,
                top: b.y - b.r,
                width: b.r * 2,
                height: b.r * 2,
                borderRadius: "50%",
                background: `radial-gradient(closest-side, ${b.color} 0%, color-mix(in srgb, ${b.color} 70%, transparent) 38%, transparent 100%)`,
                mixBlendMode: "screen",
                opacity: p * 0.9,
                transform: `scale(${0.85 + 0.15 * p})`,
              }}
            />
          );
        })}
      </AbsoluteFill>
      {children && <AbsoluteFill>{children}</AbsoluteFill>}
      {grano > 0 && (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: grano, mixBlendMode: "overlay", pointerEvents: "none" }}>
          <filter id={id}>
            <feTurbulence type="fractalNoise" baseFrequency={0.8 / u} numOctaves={2} seed={semilla(frame, 2) % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${id})`} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
