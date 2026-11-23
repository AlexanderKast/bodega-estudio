import { useCurrentFrame } from "remotion";
import { bordeHacia, type Punto } from "../../lib/anclas";
import { sfx, type SfxRole } from "../../lib/cues";
import { arrive, enterStyle, type CurveName } from "../../lib/motion";
import { curvaEntre, enTrayecto } from "../../lib/trayecto";
import { marca } from "../../marca/marca";
import { durTrazo, suavizar } from "./mano";
import { usePiel, type Piel } from "./pieles";
import { Trazo } from "./Trazo";

/**
 * Piezas del kit de anotación. Todas se colocan en las coordenadas de su contenedor (un `<Plano>`
 * del mundo o el cuadro) y comparten tres props: `inicio` (cuadro en que empieza el gesto), `piel`
 * y `color` (por defecto, los de `<Anotaciones>`). El orden interno de cada pieza es el de la mano:
 * primero el trazo, después la punta o el texto.
 */
type Comun = {
  inicio?: number;
  piel?: Piel;
  color?: string;
  semilla?: string;
  sonido?: SfxRole | false;
};

const rad = (g: number) => (g * Math.PI) / 180;

// ── Círculo de resalte ───────────────────────────────────────────────────────────────────────────
type CirculoProps = Comun & {
  en: Punto;
  rx: number;
  ry?: number;
  desde?: number;
  sentido?: 1 | -1; // -1 (por defecto) gira contra el reloj, como un diestro; 1, con el reloj
  grosor?: number;
  dur?: number;
  curva?: CurveName;
};

/** Rodea algo. A mano no cierra exacto: arranca arriba a la derecha, da la vuelta y se pasa un poco. */
export const Circulo: React.FC<CirculoProps> = ({
  en,
  rx,
  ry = rx * 0.82,
  desde = -60,
  inicio = 0,
  piel,
  color,
  semilla = "circulo",
  sonido = "tick",
  grosor,
  sentido = -1,
  dur,
  curva,
}) => {
  const { cfg } = usePiel(piel, color);
  const vuelta = 1 + cfg.sobrepaso;
  const n = 56;
  const pts: Punto[] = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = rad(desde) + sentido * t * vuelta * 2 * Math.PI;
    // La mano abre el trazo: el final queda un poco por fuera del arranque.
    const k = 1 + (cfg.sobrepaso > 0 ? 0.07 * (t - 0.5) : 0);
    return { x: en.x + Math.cos(a) * rx * k, y: en.y + Math.sin(a) * ry * k };
  });
  return (
    <Trazo
      d={suavizar(pts)}
      inicio={inicio}
      piel={piel}
      color={color}
      semilla={semilla}
      sonido={sonido}
      anclar={false}
      grosor={grosor}
      dur={dur}
      curva={curva}
    />
  );
};

// ── Flecha ───────────────────────────────────────────────────────────────────────────────────────
type FlechaProps = Comun & {
  de: Punto;
  a: Punto;
  curvatura?: number;
  cabeza?: number;
  grosor?: number;
  dur?: number;
};

/** Cuánto dura una flecha completa (cuerpo + punta), para encadenar lo que venga después. */
export const durFlecha = (de: Punto, a: Punto, curvatura = 0.18) =>
  durTrazo(curvaEntre(de, a, curvatura)) + 2;

/** Flecha curva entre dos puntos. El cuerpo se dibuja y la punta aterriza al final, orientada por la curva. */
export const Flecha: React.FC<FlechaProps> = ({
  de,
  a,
  curvatura = 0.18,
  cabeza = 26,
  inicio = 0,
  dur,
  piel,
  color,
  semilla = "flecha",
  sonido = "whoosh.short",
  grosor,
}) => {
  const frame = useCurrentFrame();
  const { nombre, cfg, color: tinta } = usePiel(piel, color);
  const d = curvaEntre(de, a, curvatura);
  const cuerpo = dur ?? durTrazo(d);
  const fin = enTrayecto(d, 1);
  const ala = (signo: number): Punto => ({
    x: a.x + Math.cos(rad(fin.rot + 180 + signo * 27)) * cabeza,
    y: a.y + Math.sin(rad(fin.rot + 180 + signo * 27)) * cabeza,
  });
  const tPunta = inicio + cuerpo - 1;
  const pPunta = arrive(frame, tPunta, 4, "overshoot");
  return (
    <>
      <Trazo
        d={d}
        inicio={inicio}
        dur={cuerpo}
        piel={piel}
        color={color}
        semilla={semilla}
        sonido={sonido}
        grosor={grosor}
      />
      {nombre === "vector" ? (
        pPunta > 0 ? (
          <svg
            width={1}
            height={1}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            <path
              d={`M ${a.x} ${a.y} L ${ala(1).x} ${ala(1).y} L ${ala(-1).x} ${ala(-1).y} Z`}
              fill={tinta}
              stroke={tinta}
              strokeWidth={(grosor ?? cfg.grosor) * 0.6}
              strokeLinejoin="round"
              style={{
                transformOrigin: `${a.x}px ${a.y}px`,
                transform: `scale(${0.4 + 0.6 * pPunta})`,
                opacity: Math.min(1, pPunta * 2),
              }}
            />
          </svg>
        ) : null
      ) : (
        <>
          <Trazo
            d={`M ${ala(1).x} ${ala(1).y} L ${a.x} ${a.y}`}
            inicio={tPunta}
            dur={5}
            piel={piel}
            color={color}
            semilla={`${semilla}-a`}
            grosor={grosor}
          />
          <Trazo
            d={`M ${a.x} ${a.y} L ${ala(-1).x} ${ala(-1).y}`}
            inicio={tPunta + 3}
            dur={5}
            piel={piel}
            color={color}
            semilla={`${semilla}-b`}
            grosor={grosor}
          />
        </>
      )}
    </>
  );
};

// ── Subrayado y tachado ──────────────────────────────────────────────────────────────────────────
type LineaProps = Comun & {
  de: Punto;
  ancho: number;
  doble?: boolean;
  grosor?: number;
};

/** Subraya un texto: una pasada con una panza leve; `doble` vuelve por debajo. */
export const Subrayado: React.FC<LineaProps> = ({
  de,
  ancho,
  doble = false,
  inicio = 0,
  piel,
  color,
  semilla = "subrayado",
  sonido = "tick",
  grosor,
}) => {
  const ida = `M ${de.x} ${de.y} Q ${de.x + ancho * 0.5} ${de.y + ancho * 0.018} ${de.x + ancho} ${de.y - ancho * 0.008}`;
  const vuelta = `M ${de.x + ancho * 0.97} ${de.y + 11} Q ${de.x + ancho * 0.5} ${de.y + 15 + ancho * 0.01} ${de.x + ancho * 0.06} ${de.y + 12}`;
  return (
    <>
      <Trazo
        d={ida}
        inicio={inicio}
        piel={piel}
        color={color}
        semilla={semilla}
        sonido={sonido}
        grosor={grosor}
      />
      {doble ? (
        <Trazo
          d={vuelta}
          inicio={inicio + durTrazo(ida) - 1}
          piel={piel}
          color={color}
          semilla={`${semilla}-2`}
          grosor={grosor}
        />
      ) : null}
    </>
  );
};

/** Tacha un texto con una línea que sube un poco, como se tacha a mano. `de` es el borde izquierdo a media altura. */
export const Tachado: React.FC<LineaProps> = ({
  de,
  ancho,
  inicio = 0,
  piel,
  color,
  semilla = "tachado",
  sonido = "tick",
  grosor,
}) => (
  <Trazo
    d={`M ${de.x - 8} ${de.y + ancho * 0.03} L ${de.x + ancho + 8} ${de.y - ancho * 0.03}`}
    inicio={inicio}
    piel={piel}
    color={color}
    semilla={semilla}
    sonido={sonido}
    grosor={grosor}
    curva="snap"
  />
);

// ── Rótulo ───────────────────────────────────────────────────────────────────────────────────────
type RotuloProps = Comun & {
  en: Punto;
  texto: string;
  tam?: number;
  alinear?: "izq" | "centro" | "der";
  caja?: boolean;
};

/** Texto del kit con la letra de la piel. En vector puede llevar caja (`caja`), como etiqueta de diagrama. */
export const Rotulo: React.FC<RotuloProps> = ({
  en,
  texto,
  tam = 34,
  alinear = "izq",
  caja = false,
  inicio = 0,
  piel,
  color,
}) => {
  const frame = useCurrentFrame();
  const { nombre, cfg, color: tinta } = usePiel(piel, color);
  // La letra de imprenta (vector) entra con fundido; la manuscrita se escribe de izquierda a derecha,
  // a doses en marcador, y tarda según su largo (kb/17: en los referentes el rótulo se traza, no aparece).
  const escrita = nombre !== "vector";
  const durEscrita = Math.min(20, Math.max(7, Math.round(texto.length * 1.1)));
  const cuadro = escrita ? inicio + Math.floor((frame - inicio) / cfg.paso) * cfg.paso : frame;
  const p = escrita ? arrive(cuadro, inicio, durEscrita, "move") : arrive(frame, inicio, 12);
  if (p <= 0) return null;
  const conCaja = caja && nombre === "vector";
  const tx = alinear === "izq" ? "0" : alinear === "centro" ? "-50%" : "-100%";
  return (
    <div
      style={{
        position: "absolute",
        left: en.x,
        top: en.y,
        width: "max-content",
        transform: `translate(${tx}, -50%)`,
      }}
    >
      <div
        style={{
          ...(escrita ? { clipPath: `inset(-20% ${((1 - p) * 112 - 8).toFixed(1)}% -20% -4%)` } : enterStyle(p, 14)),
          fontFamily: cfg.fuente,
          fontWeight: cfg.pesoFuente,
          fontSize: tam * cfg.escalaFuente,
          lineHeight: 1.05,
          color: tinta,
          whiteSpace: "pre",
          ...(conCaja
            ? {
                padding: `${tam * 0.3}px ${tam * 0.55}px`,
                borderRadius: marca.radios.chico,
                background: marca.colores.superficie,
                border: `2px solid ${marca.colores.linea}`,
              }
            : {}),
        }}
      >
        {texto}
      </div>
    </div>
  );
};

// ── Callout ──────────────────────────────────────────────────────────────────────────────────────
type CalloutProps = Comun & {
  ancla: Punto;
  en: Punto;
  texto: string;
  tam?: number;
  curvatura?: number;
};

/**
 * Señala un punto y lo nombra: aparece el punto sobre el objeto, sale la línea guía hacia el
 * rótulo y entra el texto. `ancla` puede venir de `enMundo()` para seguir a un objeto que se mueve.
 */
export const Callout: React.FC<CalloutProps> = ({
  ancla,
  en,
  texto,
  tam = 34,
  curvatura = 0.08,
  inicio = 0,
  piel,
  color,
  semilla = "callout",
  sonido = "pop",
}) => {
  const frame = useCurrentFrame();
  const { cfg, color: tinta, mudo } = usePiel(piel, color);
  const alDerecho = en.x >= ancla.x;
  const llegada: Punto = { x: en.x + (alDerecho ? -14 : 14), y: en.y };
  const d = curvaEntre(ancla, llegada, alDerecho ? curvatura : -curvatura);
  const pPunto = arrive(frame, inicio, 8, "overshoot");
  if (sonido && !mudo) sfx(frame, sonido, inicio);
  return (
    <>
      {pPunto > 0 ? (
        <div
          style={{
            position: "absolute",
            left: ancla.x,
            top: ancla.y,
            width: cfg.grosor * 2.6,
            height: cfg.grosor * 2.6,
            borderRadius: "50%",
            background: tinta,
            transform: `translate(-50%, -50%) scale(${0.5 + 0.5 * pPunto})`,
            opacity: Math.min(1, pPunto * 2),
          }}
        />
      ) : null}
      <Trazo
        d={d}
        inicio={inicio + 4}
        piel={piel}
        color={color}
        semilla={semilla}
        grosor={cfg.grosor * 0.7}
      />
      <Rotulo
        en={en}
        texto={texto}
        tam={tam}
        alinear={alDerecho ? "izq" : "der"}
        inicio={inicio + 4 + durTrazo(d) - 3}
        piel={piel}
        color={color}
        caja
      />
    </>
  );
};

// ── Nodos y conectores (diagramas que se construyen) ─────────────────────────────────────────────
export type Caja = { x: number; y: number; ancho: number; alto: number }; // x, y = centro

type NodoProps = Comun &
  Caja & { texto: string; tam?: number; relleno?: string };

const dCaja = (c: Caja, r: number) => {
  const x0 = c.x - c.ancho / 2;
  const y0 = c.y - c.alto / 2;
  const x1 = c.x + c.ancho / 2;
  const y1 = c.y + c.alto / 2;
  return `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} L ${x0 + r + 10} ${y0}`;
};

/** Contorno de una caja (centro + tamaño) con esquinas de radio `r`, como lo cierra una mano. */
export const dRecuadro = (c: Caja, r = 10) => dCaja(c, r);

type RecuadroProps = Comun &
  Caja & { radio?: number; grosor?: number; dur?: number; curva?: CurveName };

/** Enmarca una zona con un rectángulo: la versión recta del círculo de resalte. */
export const Recuadro: React.FC<RecuadroProps> = ({
  x,
  y,
  ancho,
  alto,
  radio,
  inicio = 0,
  piel,
  color,
  semilla = "recuadro",
  sonido = "tick",
  grosor,
  dur,
  curva,
}) => {
  const { nombre } = usePiel(piel, color);
  return (
    <Trazo
      d={dCaja(
        { x, y, ancho, alto },
        radio ?? (nombre === "vector" ? marca.radios.medio : 10),
      )}
      inicio={inicio}
      piel={piel}
      color={color}
      semilla={semilla}
      sonido={sonido}
      anclar={false}
      grosor={grosor}
      dur={dur}
      curva={curva}
    />
  );
};

/** Caja de diagrama: se dibuja el borde, se asienta el relleno y entra el texto. */
export const Nodo: React.FC<NodoProps> = ({
  x,
  y,
  ancho,
  alto,
  texto,
  tam = 30,
  relleno,
  inicio = 0,
  piel,
  color,
  semilla = "nodo",
  sonido = "tick",
}) => {
  const frame = useCurrentFrame();
  const { nombre, cfg, color: tinta } = usePiel(piel, color);
  const r = nombre === "vector" ? marca.radios.medio : 10;
  // Sin `relleno`, cada piel pone el suyo: la superficie de la marca en vector y un lavado de la
  // propia tinta en marcador y tiza (un bloque oscuro de marca sobre papel claro no pertenece a la hoja).
  const lavado = relleno === undefined && cfg.relleno !== null;
  const fondoCaja = relleno ?? (lavado ? tinta : marca.colores.superficie);
  const opFondo = lavado ? (cfg.relleno ?? 1) : 1;
  const d = dCaja({ x, y, ancho, alto }, r);
  const dur = durTrazo(d);
  const pFondo = arrive(
    frame,
    inicio + Math.round(dur * 0.5),
    12,
    "arriveGentle",
  );
  return (
    <>
      {pFondo > 0 ? (
        <div
          style={{
            position: "absolute",
            left: x - ancho / 2,
            top: y - alto / 2,
            width: ancho,
            height: alto,
            borderRadius: r,
            background: fondoCaja,
            opacity: pFondo * opFondo,
          }}
        />
      ) : null}
      <Trazo
        d={d}
        inicio={inicio}
        dur={dur}
        piel={piel}
        color={color}
        semilla={semilla}
        sonido={sonido}
        anclar={false}
      />
      <Rotulo
        en={{ x, y }}
        texto={texto}
        tam={tam}
        alinear="centro"
        inicio={inicio + dur - 4}
        piel={piel}
        color={color}
      />
    </>
  );
};

type ConectorProps = Comun & {
  de: Caja;
  a: Caja;
  curvatura?: number;
  margen?: number;
};

/** Flecha entre dos nodos: sale del borde de uno y llega al borde del otro, sin pisarlos. */
export const Conector: React.FC<ConectorProps> = ({
  de,
  a,
  curvatura = 0.12,
  margen = 16,
  ...resto
}) => (
  <Flecha
    de={bordeHacia(de, de.ancho, de.alto, a, margen)}
    a={bordeHacia(a, a.ancho, a.alto, de, margen + 6)}
    curvatura={curvatura}
    cabeza={22}
    {...resto}
  />
);

/** Cuánto tarda en dibujarse un nodo, para encadenar el siguiente paso del diagrama. */
export const durNodo = (c: Caja) => durTrazo(dCaja(c, 10)) + 8;
