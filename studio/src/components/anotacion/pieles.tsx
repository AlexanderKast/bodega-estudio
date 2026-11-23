import { loadFont as cargarCaveat } from "@remotion/google-fonts/Caveat";
import { createContext, useContext } from "react";
import { marca } from "../../marca/marca";

/**
 * Pieles del kit de anotación: la misma flecha o el mismo círculo se dibuja como marcador sobre
 * foto (documental), como vector limpio (diagrama) o como tiza/lápiz (pizarra). La piel y el color
 * se fijan una vez por pieza con `<Anotaciones>` y cada pieza del kit los toma de ahí.
 */
const caveat = cargarCaveat("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export type Piel = "marcador" | "vector" | "tiza";

export type PielCfg = {
  temblor: number; // px que se desvía el pulso (0 = geometría exacta)
  grosor: number; // px del trazo
  pasadas: number; // veces que la mano repasa la línea
  hierve: number; // cada cuántos cuadros se redibuja (0 = quieto)
  sobrepaso: number; // cuánto se pasa un círculo al cerrar (fracción de vuelta)
  opacidad: number;
  rugoso: boolean; // borde roto de tiza
  fuente: string;
  pesoFuente: number;
  escalaFuente: number; // la manuscrita necesita más cuerpo para leerse igual
  paso: number; // cada cuántos cuadros avanza el trazo (2 = a doses, como dibuja una mano; kb/17 §8)
  relleno: number | null; // opacidad del lavado de tinta que rellena cajas; null = superficie de la marca
};

export const PIELES: Record<Piel, PielCfg> = {
  marcador: {
    temblor: 2.4,
    grosor: 5,
    pasadas: 1,
    hierve: 0,
    sobrepaso: 0.12,
    opacidad: 0.97,
    rugoso: false,
    fuente: caveat.fontFamily,
    pesoFuente: 700,
    escalaFuente: 1.5,
    paso: 2,
    relleno: 0.12, // pasada de resaltador: se lee sobre papel claro sin tapar la textura
  },
  vector: {
    temblor: 0,
    grosor: 7,
    pasadas: 1,
    hierve: 0,
    sobrepaso: 0,
    opacidad: 1,
    rugoso: false,
    fuente: marca.fuenteTexto,
    pesoFuente: 600,
    escalaFuente: 1,
    paso: 1,
    relleno: null,
  },
  tiza: {
    temblor: 1.9,
    grosor: 8,
    pasadas: 1,
    hierve: 0,
    sobrepaso: 0.02,
    opacidad: 0.9,
    rugoso: true,
    fuente: caveat.fontFamily,
    pesoFuente: 600,
    escalaFuente: 1.5,
    paso: 1,
    relleno: 0.1, // tiza frotada sobre la pizarra
  },
};

type Ctx = { piel: Piel; color: string; fondo: string; mudo: boolean };
const AnotacionCtx = createContext<Ctx>({
  piel: "marcador",
  color: marca.colores.texto,
  fondo: marca.colores.fondo,
  mudo: false,
});

/**
 * Fija la piel y la tinta de las anotaciones que contiene. `fondo` es el color del soporte (papel,
 * pizarra, fondo de la marca): lo usan las piezas que necesitan tapar o contrastar (lupa, insignias).
 * `mudo` apaga los cues de sonido de todo lo que contiene: para copias y hojas de comparación, donde
 * el mismo gesto aparece varias veces y solo una debe sonar.
 */
export const Anotaciones: React.FC<{
  piel: Piel;
  color?: string;
  fondo?: string;
  mudo?: boolean;
  children: React.ReactNode;
}> = ({ piel, color = marca.colores.texto, fondo = marca.colores.fondo, mudo = false, children }) => (
  <AnotacionCtx.Provider value={{ piel, color, fondo, mudo }}>
    {children}
  </AnotacionCtx.Provider>
);

/** Piel y color vigentes; las props de la pieza mandan sobre el contexto. */
export const usePiel = (piel?: Piel, color?: string) => {
  const ctx = useContext(AnotacionCtx);
  const nombre = piel ?? ctx.piel;
  return { nombre, cfg: PIELES[nombre], color: color ?? ctx.color, fondo: ctx.fondo, mudo: ctx.mudo };
};
