import { evolvePath, getLength } from "@remotion/paths";
import { Fragment, useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import type { Xf } from "./anclas";
import { Capa } from "./rig";

/**
 * Rig de un SVG por capas: convierte una ilustración vectorizada en un objeto que se arma, se mueve
 * por partes y se anota. Es el paso de Illustrator a After Effects ("convertir capas en formas" y
 * emparentar): cada `<g id>` del SVG es una parte con su pivote, lista para `<Capa>`.
 *
 * Lee los SVG de `scripts/assets/vectorizar.py` (`studio/public/assets/<pieza>/*.svg`): un
 * `<g id="capa-NN-…" fill data-pivote="x,y">` por tinta, de atrás hacia adelante, con sus `<path>`
 * dentro, sin transforms. También sirve cualquier SVG con grupos con `id` y paths con `d`.
 *
 * Uso:
 *
 *   const rig = useSvgRig(staticFile("assets/prueba-f3/despertador-recorte.svg"));
 *   if (!rig) return null;
 *   <Capa x={…} y={…} rot={…}>                         // el objeto entero, en el mundo
 *     <SvgObjeto rig={rig} ancho={520}
 *       trazo={pTrazo} relleno={pRelleno}              // se dibuja y se rellena, en orden
 *       partes={{ "capa-04-ee7c0b": { rot: giro } }}   // cada parte, con su pivote
 *     />
 *   </Capa>
 *
 * Dos cosas que el vectorizador no resuelve y aquí sí: las capas salen por color, no por pieza
 * (`reagrupar()` saca paths sueltos a una parte propia), y la capa de abajo no siempre está entera
 * bajo la de arriba (la `tapa` de una parte pinta lo que queda al descubierto cuando se mueve).
 *
 * Las coordenadas de las partes (pivotes, puntos para anclar) son las del viewBox del SVG.
 * `xfRaiz()` y `xfParte()` dan las mismas transformaciones como `Xf`, para pedir con `enMundo()`
 * dónde queda un punto de una parte y pegarle una anotación.
 */
export type TrazoSvg = { id: string; d: string; largo: number; color?: string };
export type ParteSvg = {
  id: string;
  color: string;
  pivote: [number, number]; // en coordenadas del viewBox
  paths: TrazoSvg[];
  largo: number; // suma de los largos de sus paths
};
export type SvgRig = {
  ancho: number; // viewBox
  alto: number;
  partes: ParteSvg[]; // en el orden del archivo: de atrás hacia adelante
  porId: Record<string, ParteSvg>;
  largo: number;
};

const numeros = (s: string | null) => (s ?? "").split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n));

/** Interpreta el texto de un SVG por capas. Corre en el navegador que renderiza (usa DOMParser). */
export const leerSvg = (texto: string): SvgRig => {
  const doc = new DOMParser().parseFromString(texto, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) throw new Error("svg-rig: el archivo no es un SVG.");
  const vb = numeros(svg.getAttribute("viewBox"));
  const ancho = vb[2] ?? (Number(svg.getAttribute("width")) || 0);
  const alto = vb[3] ?? (Number(svg.getAttribute("height")) || 0);
  const partes: ParteSvg[] = [];
  doc.querySelectorAll("g[id]").forEach((g) => {
    const paths: TrazoSvg[] = [];
    g.querySelectorAll("path").forEach((p, i) => {
      const d = p.getAttribute("d");
      if (d) paths.push({ id: p.getAttribute("id") ?? `${g.id}-p${i + 1}`, d, largo: getLength(d) });
    });
    if (!paths.length) return;
    const piv = numeros(g.getAttribute("data-pivote"));
    partes.push({
      id: g.id,
      color: g.getAttribute("fill") ?? g.getAttribute("data-color") ?? "#000000",
      pivote: piv.length >= 2 ? [piv[0], piv[1]] : [ancho / 2, alto / 2],
      paths,
      largo: paths.reduce((s, p) => s + p.largo, 0),
    });
  });
  if (!partes.length) throw new Error("svg-rig: el SVG no tiene grupos con id y paths.");
  return armar(ancho, alto, partes);
};

const armar = (ancho: number, alto: number, partes: ParteSvg[]): SvgRig => ({
  ancho,
  alto,
  partes,
  porId: Object.fromEntries(partes.map((p) => [p.id, p])),
  largo: partes.reduce((s, p) => s + p.largo, 0),
});

/**
 * Agrupa paths sueltos en partes nuevas con significado. El vectorizador separa por color, no por
 * pieza: las campanas de un reloj y su cuerpo salen en la misma capa oscura. Con esto se sacan esos
 * paths (por su `id`) a una parte propia, con su pivote, que se puede mover aparte:
 *
 *   reagrupar(rig, { campanas: { paths: ["capa-01-…-p02", "capa-05-…-p03"], pivote: [315, 300] } })
 *
 * Cada path conserva su color. La parte nueva queda encima de la última capa de la que tomó paths.
 */
export const reagrupar = (rig: SvgRig, grupos: Record<string, { paths: string[]; pivote?: [number, number] }>): SvgRig => {
  const tomados = new Map<string, string>(); // id de path → id del grupo
  for (const [gid, g] of Object.entries(grupos)) for (const pid of g.paths) tomados.set(pid, gid);
  const nuevas = new Map<string, { paths: TrazoSvg[]; tras: number }>();
  const restantes: ParteSvg[] = rig.partes.map((parte, i) => {
    const paths = parte.paths.filter((p) => {
      const gid = tomados.get(p.id);
      if (!gid) return true;
      const n = nuevas.get(gid) ?? { paths: [], tras: i };
      n.paths.push({ ...p, color: p.color ?? parte.color });
      n.tras = i;
      nuevas.set(gid, n);
      return false;
    });
    return { ...parte, paths, largo: paths.reduce((s, p) => s + p.largo, 0) };
  });
  const partes: ParteSvg[] = [];
  restantes.forEach((parte, i) => {
    if (parte.paths.length) partes.push(parte);
    for (const [gid, n] of nuevas) {
      if (n.tras !== i) continue;
      partes.push({
        id: gid,
        color: n.paths[0].color ?? "#000000",
        pivote: grupos[gid].pivote ?? [rig.ancho / 2, rig.alto / 2],
        paths: n.paths,
        largo: n.paths.reduce((s, p) => s + p.largo, 0),
      });
    }
  });
  return armar(rig.ancho, rig.alto, partes);
};

const cache = new Map<string, SvgRig>();

/**
 * Carga y prepara un SVG por capas (una vez por archivo; el render espera con `delayRender`).
 * Devuelve `null` mientras carga. Llámalo fuera de `<BlurCamara>` y pasa el rig por props: así el
 * archivo se pide una sola vez y no una por muestra del obturador.
 */
export const useSvgRig = (src: string): SvgRig | null => {
  const [rig, setRig] = useState<SvgRig | null>(() => cache.get(src) ?? null);
  const [espera] = useState(() => (cache.has(src) ? null : delayRender(`svg-rig: ${src}`)));
  useEffect(() => {
    const listo = cache.get(src);
    if (listo) {
      setRig(listo);
      if (espera !== null) continueRender(espera);
      return;
    }
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`svg-rig: no se pudo leer ${src} (${r.status})`);
        return r.text();
      })
      .then((texto) => {
        const nuevo = leerSvg(texto);
        cache.set(src, nuevo);
        setRig(nuevo);
        if (espera !== null) continueRender(espera);
      })
      .catch((e) => cancelRender(e));
  }, [src, espera]);
  return rig;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Reparte un avance global 0–1 entre varios tramos que van uno detrás de otro, según su peso (el
 * largo de cada trazo): devuelve el avance 0–1 de cada tramo. Así un dibujo de varias partes se
 * traza a velocidad de mano constante, no cada parte en el mismo tiempo.
 */
export const repartir = (p: number, pesos: number[]): number[] => {
  const total = pesos.reduce((s, w) => s + w, 0) || 1;
  let antes = 0;
  return pesos.map((w) => {
    const local = w > 0 ? clamp01((p * total - antes) / w) : p >= antes / total ? 1 : 0;
    antes += w;
    return local;
  });
};

/** Reparte un avance global 0–1 en `n` avances escalonados que se solapan (`solape` = cuántos a la vez). */
export const escalonar = (p: number, n: number, solape = 2): number[] =>
  Array.from({ length: n }, (_, i) => clamp01((p * (n - 1 + solape) - i) / solape));

type DibujoProps = {
  parte: ParteSvg;
  trazo?: number; // 0–1: cuánto del contorno de la parte está dibujado
  relleno?: number; // 0–1: opacidad del relleno
  grosor?: number; // px del viewBox
  colorTrazo?: string; // tinta del contorno mientras se dibuja; por defecto, el color de la parte
};

/**
 * Dibuja una parte en las coordenadas del viewBox. El contorno avanza por sus paths en orden; el
 * relleno se asienta aparte. Con `colorTrazo` (lápiz, tiza) el contorno se retira al llegar el relleno.
 */
export const ParteDibujo: React.FC<DibujoProps> = ({ parte, trazo = 1, relleno = 1, grosor = 3, colorTrazo }) => {
  if (trazo <= 0 && relleno <= 0) return null;
  const avances = repartir(
    trazo,
    parte.paths.map((p) => p.largo),
  );
  const opTrazo = colorTrazo ? 1 - relleno : 1;
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {parte.paths.map((p, i) => {
        const a = avances[i];
        const conTrazo = a > 0 && opTrazo > 0.01 && (colorTrazo !== undefined || a < 1 || relleno < 1);
        const dash = conTrazo ? evolvePath(a, p.d) : null;
        return (
          <path
            key={p.id}
            d={p.d}
            fill={p.color ?? parte.color}
            fillOpacity={relleno}
            fillRule="evenodd"
            stroke={conTrazo ? (colorTrazo ?? p.color ?? parte.color) : "none"}
            strokeOpacity={opTrazo}
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={dash?.strokeDasharray}
            strokeDashoffset={dash?.strokeDashoffset}
          />
        );
      })}
    </svg>
  );
};

/** Transformación que lleva el viewBox del SVG al tamaño pedido, con el centro del dibujo en el origen. */
export const xfRaiz = (rig: SvgRig, ancho: number): Xf => {
  const k = ancho / rig.ancho;
  return { x: (-rig.ancho / 2) * k, y: (-rig.alto / 2) * k, escala: k, pivote: [0, 0] };
};

/** La `Xf` de una parte con su pivote puesto (el del archivo, salvo que la `xf` traiga otro). */
export const xfParte = (rig: SvgRig, id: string, xf: Xf = {}): Xf => ({ ...xf, pivote: xf.pivote ?? rig.porId[id]?.pivote ?? [0, 0] });

type ParteAnimada = Xf & {
  opacidad?: number;
  sombra?: number;
  /**
   * Color que queda debajo cuando la parte se mueve. El vectorizador no siempre deja la capa de
   * abajo entera: el contorno de la cara de un reloj rodea las manecillas, y al girarlas se ve su
   * silueta en el color del fondo. Con `tapa` se pinta esa silueta, quieta y en este color, bajo la parte.
   */
  tapa?: string;
};

type ObjetoProps = {
  rig: SvgRig;
  ancho: number; // px que mide el dibujo a lo ancho
  /** Transformación propia de cada parte, por id. El pivote por defecto es el del archivo. */
  partes?: Record<string, ParteAnimada>;
  /** Avance 0–1 del dibujo de los contornos, repartido entre todas las partes en `orden`. */
  trazo?: number;
  /** Avance 0–1 del relleno, escalonado por partes en `orden`. */
  relleno?: number;
  /** Orden en que se dibujan las partes (ids). Por defecto, el del archivo: de atrás hacia adelante. */
  orden?: string[];
  grosor?: number;
  colorTrazo?: string;
};

/**
 * El objeto completo: todas las partes del rig, cada una en su `<Capa>` con su pivote, apiladas en
 * el orden del archivo. Va dentro de la `<Capa>` que mueve el objeto entero; su centro cae en el
 * origen de esa capa.
 */
export const SvgObjeto: React.FC<ObjetoProps> = ({ rig, ancho, partes = {}, trazo = 1, relleno = 1, orden, grosor = 3, colorTrazo }) => {
  const ids = orden ?? rig.partes.map((p) => p.id);
  const avTrazo = repartir(
    trazo,
    ids.map((id) => rig.porId[id]?.largo ?? 0),
  );
  const avRelleno = escalonar(relleno, ids.length);
  return (
    <Capa {...xfRaiz(rig, ancho)}>
      {rig.partes.map((parte) => {
        const i = ids.indexOf(parte.id);
        const { opacidad, sombra, tapa, ...xf } = partes[parte.id] ?? {};
        const relleno1 = i < 0 ? 1 : avRelleno[i];
        return (
          <Fragment key={parte.id}>
            {tapa && relleno1 > 0 ? (
              <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                {parte.paths.map((p) => (
                  <path key={p.id} d={p.d} fill={tapa} stroke={tapa} strokeWidth={2} strokeLinejoin="round" opacity={relleno1} />
                ))}
              </svg>
            ) : null}
            <Capa {...xfParte(rig, parte.id, xf)} opacidad={opacidad} sombra={sombra}>
              <ParteDibujo parte={parte} trazo={i < 0 ? 1 : avTrazo[i]} relleno={relleno1} grosor={grosor} colorTrazo={colorTrazo} />
            </Capa>
          </Fragment>
        );
      })}
    </Capa>
  );
};
