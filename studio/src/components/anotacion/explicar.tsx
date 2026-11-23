import { evolvePath } from "@remotion/paths";
import { useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { bordeHacia, type Punto } from "../../lib/anclas";
import { AuditPausa } from "../../lib/audit";
import { sfx, type SfxRole } from "../../lib/cues";
import {
  arrive,
  enterStyle,
  inertialBounce,
  mix,
  springPreset,
  staggerDelay,
  tween,
  type CurveName,
} from "../../lib/motion";
import { curvaEntre } from "../../lib/trayecto";
import { marca } from "../../marca/marca";
import { aMano, durTrazo } from "./mano";
import { usePiel, type Piel, type PielCfg } from "./pieles";
import { Circulo, Recuadro, Rotulo, Tachado, type Caja } from "./piezas";
import { Trazo } from "./Trazo";

/**
 * Piezas del kit para explicar: agrupar (`Llave`), dar una cifra (`DatoCallout`), llevar la cuenta de
 * un proceso (`PasoTracker`), ampliar un detalle (`Lupa`) y rodear con un anillo punteado
 * (`AnilloPunteado`). Mismas props comunes que el resto del kit (`inicio`, `piel`, `color`, `semilla`,
 * `sonido`) y el mismo orden de la mano: primero el trazo, después la punta o el texto.
 */
type Comun = {
  inicio?: number;
  piel?: Piel;
  color?: string;
  semilla?: string;
  sonido?: SfxRole | false;
};

const rad = (g: number) => (g * Math.PI) / 180;
const f2 = (n: number) => n.toFixed(2);

/** Ancho aproximado de un texto del kit (no se puede medir el DOM antes de pintar). Sirve para tachar y subrayar. */
export const anchoTexto = (texto: string, tam: number, cfg: PielCfg) =>
  texto.length * tam * cfg.escalaFuente * (cfg.temblor > 0 ? 0.37 : 0.55);

/** Círculo como path, desde el ángulo `a0` (grados) y en el sentido del reloj. */
const dCirculo = (c: Punto, r: number, a0 = 0) => {
  const x0 = c.x + Math.cos(rad(a0)) * r;
  const y0 = c.y + Math.sin(rad(a0)) * r;
  const x1 = c.x - Math.cos(rad(a0)) * r;
  const y1 = c.y - Math.sin(rad(a0)) * r;
  return `M ${f2(x0)} ${f2(y0)} A ${r} ${r} 0 1 1 ${f2(x1)} ${f2(y1)} A ${r} ${r} 0 1 1 ${f2(x0)} ${f2(y0)}`;
};

// ── Anillo punteado ──────────────────────────────────────────────────────────────────────────────
type AnilloProps = Comun & {
  en: Punto;
  r: number;
  patron?: [number, number]; // [raya, hueco] en px
  grosor?: number;
  desde?: number; // ángulo en que arranca el dibujo (0 = derecha, −90 = arriba)
  dur?: number;
  curva?: CurveName;
  giro?: number; // grados que rota mientras se sostiene (0 = quieto)
  durGiro?: number;
};

/**
 * Anillo punteado que se dibuja alrededor de algo y, si se pide, gira lento mientras dura la toma.
 * Más liviano que el círculo de resalte: acompaña a un recorte sin competir con él.
 */
export const AnilloPunteado: React.FC<AnilloProps> = ({
  en,
  r,
  patron = [12, 10],
  grosor,
  desde = 0,
  dur = 22,
  curva = "move",
  giro = 0,
  durGiro = 60,
  inicio = 0,
  piel,
  color,
  semilla = "anillo",
  sonido = false,
}) => {
  const frame = useCurrentFrame();
  const id = `anillo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { cfg, color: tinta, mudo } = usePiel(piel, color);
  if (sonido && !mudo) sfx(frame, sonido, inicio);
  const p = tween(frame, inicio, dur, curva);
  const g = giro ? tween(frame, inicio, durGiro, "glide") * giro : 0;
  if (p <= 0) return null;
  const ancho = grosor ?? cfg.grosor * 0.5;
  const avance = dCirculo(en, r, desde);
  const { strokeDasharray, strokeDashoffset } = evolvePath(p, avance);
  const m = r + ancho + cfg.temblor * 2 + 12;
  return (
    <svg
      width={1}
      height={1}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        opacity: cfg.opacidad,
      }}
    >
      <mask
        id={id}
        maskUnits="userSpaceOnUse"
        x={en.x - m}
        y={en.y - m}
        width={m * 2}
        height={m * 2}
      >
        <path
          d={avance}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={ancho + cfg.temblor * 2 + 8}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
        />
      </mask>
      <g mask={`url(#${id})`}>
        <path
          d={aMano(dCirculo(en, r), cfg.temblor, semilla, false)}
          fill="none"
          stroke={tinta}
          strokeWidth={ancho}
          strokeLinecap={cfg.temblor > 0 ? "round" : "butt"}
          strokeDasharray={`${patron[0]} ${patron[1]}`}
          transform={g ? `rotate(${g} ${en.x} ${en.y})` : undefined}
        />
      </g>
    </svg>
  );
};

// ── Llave ────────────────────────────────────────────────────────────────────────────────────────
type LlaveProps = Comun & {
  de: Punto;
  a: Punto;
  lado?: 1 | -1; // hacia dónde apunta el pico: 1 = a la izquierda del sentido de→a (como `curvaEntre`)
  fondo?: number; // cuánto sobresale el pico, en px
  texto?: string;
  tam?: number;
  grosor?: number;
};

const geoLlave = (de: Punto, a: Punto, lado: 1 | -1, fondo?: number) => {
  const dx = a.x - de.x;
  const dy = a.y - de.y;
  const largo = Math.hypot(dx, dy) || 1;
  const e = { x: dx / largo, y: dy / largo };
  const n = { x: e.y * lado, y: -e.x * lado };
  const h = fondo ?? Math.min(60, Math.max(26, largo * 0.12));
  const r = Math.min(h, largo / 4);
  const P = (s: number, t: number) =>
    `${f2(de.x + e.x * s + n.x * t)} ${f2(de.y + e.y * s + n.y * t)}`;
  const m = largo / 2;
  const d = `M ${P(0, 0)} Q ${P(0, h / 2)} ${P(r, h / 2)} L ${P(m - r, h / 2)} Q ${P(m, h / 2)} ${P(m, h)} Q ${P(m, h / 2)} ${P(m + r, h / 2)} L ${P(largo - r, h / 2)} Q ${P(largo, h / 2)} ${P(largo, 0)}`;
  const pico: Punto = {
    x: de.x + e.x * m + n.x * h,
    y: de.y + e.y * m + n.y * h,
  };
  return { d, pico, n, h };
};

/** Cuánto tarda en dibujarse una llave, para encadenar lo que venga después. */
export const durLlave = (de: Punto, a: Punto, lado: 1 | -1 = 1, fondo?: number) =>
  durTrazo(geoLlave(de, a, lado, fondo).d);

/**
 * Llave (corchete) que agrupa varios elementos: va de `de` a `a` por el borde del grupo y el pico
 * señala hacia `lado`. Con `texto`, el rótulo entra junto al pico cuando la llave termina.
 */
export const Llave: React.FC<LlaveProps> = ({
  de,
  a,
  lado = 1,
  fondo,
  texto,
  tam = 34,
  inicio = 0,
  piel,
  color,
  semilla = "llave",
  sonido = "tick",
  grosor,
}) => {
  const { d, pico, n } = geoLlave(de, a, lado, fondo);
  const horizontal = Math.abs(n.x) >= Math.abs(n.y);
  const en: Punto = horizontal
    ? { x: pico.x + Math.sign(n.x) * tam * 0.5, y: pico.y }
    : { x: pico.x, y: pico.y + Math.sign(n.y) * tam * 0.95 };
  return (
    <>
      <Trazo
        d={d}
        inicio={inicio}
        piel={piel}
        color={color}
        semilla={semilla}
        sonido={sonido}
        grosor={grosor}
      />
      {texto ? (
        <Rotulo
          en={en}
          texto={texto}
          tam={tam}
          alinear={horizontal ? (n.x > 0 ? "izq" : "der") : "centro"}
          inicio={inicio + durTrazo(d) - 3}
          piel={piel}
          color={color}
        />
      ) : null}
    </>
  );
};

// ── Dato con cifra ───────────────────────────────────────────────────────────────────────────────
type DatoProps = Comun & {
  ancla: Punto;
  en: Punto; // borde del bloque más cercano al ancla, a media altura
  valor: number;
  desde?: number;
  decimales?: number;
  prefijo?: string;
  unidad?: string;
  rotulo?: string;
  tam?: number; // cuerpo de la cifra
  durConteo?: number;
  curvatura?: number;
  colorRotulo?: string;
};

/** Cifra en español: punto de miles y coma decimal, sin depender del ICU del navegador que renderiza. */
export const cifra = (v: number, decimales = 0) => {
  const [ent, dec] = Math.abs(v).toFixed(decimales).split(".");
  return `${v < 0 ? "−" : ""}${ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${dec ? `,${dec}` : ""}`;
};

/**
 * Cifra grande anclada a un punto: aparece el punto sobre el objeto, sale la guía, la cifra entra
 * contando (rápido al principio, frena al llegar) con su unidad, y al final entra el rótulo que dice
 * qué mide. `ancla` puede venir de `enMundo()` para seguir a un objeto que se mueve.
 */
export const DatoCallout: React.FC<DatoProps> = ({
  ancla,
  en,
  valor,
  desde = 0,
  decimales = 0,
  prefijo = "",
  unidad = "",
  rotulo,
  tam = 96,
  durConteo = 30,
  curvatura = 0.08,
  colorRotulo,
  inicio = 0,
  piel,
  color,
  semilla = "dato",
  sonido = "pop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { nombre, cfg, color: tinta, mudo } = usePiel(piel, color);
  const alDerecho = en.x >= ancla.x;
  const llegada: Punto = { x: en.x + (alDerecho ? -16 : 16), y: en.y };
  const d = curvaEntre(ancla, llegada, alDerecho ? curvatura : -curvatura);
  const tCifra = inicio + 4 + durTrazo(d) - 3;
  const pPunto = arrive(frame, inicio, 8, "overshoot");
  const pEntra = arrive(frame, tCifra, 12);
  const pCuenta = arrive(frame, tCifra, durConteo, "arriveSoft");
  const pRotulo = arrive(frame, tCifra + 10, 14);
  const rebote = inertialBounce(
    frame - (tCifra + durConteo * 0.8),
    fps,
    0.04,
  );
  if (sonido && !mudo) sfx(frame, sonido, inicio);
  const vector = nombre === "vector";
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
      {pEntra > 0 ? (
        <div
          style={{
            position: "absolute",
            left: en.x,
            top: en.y,
            width: "max-content",
            transform: `translate(${alDerecho ? "0" : "-100%"}, -50%)`,
          }}
        >
          <div
            style={{
              ...enterStyle(pEntra, 18),
              textAlign: alDerecho ? "left" : "right",
              color: tinta,
            }}
          >
            <div
              style={{
                fontFamily: vector ? marca.fuenteTitulo : cfg.fuente,
                fontWeight: 700,
                fontSize: tam * (vector ? 1 : 1.18),
                lineHeight: 0.92,
                letterSpacing: vector ? "-0.03em" : undefined,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                transform: `scale(${1 + rebote})`,
                transformOrigin: alDerecho ? "0% 100%" : "100% 100%",
              }}
            >
              {prefijo}
              {cifra(mix(pCuenta, desde, valor), decimales)}
              {unidad ? (
                <span
                  style={{
                    fontSize: "0.46em",
                    marginLeft: "0.14em",
                    letterSpacing: 0,
                  }}
                >
                  {unidad}
                </span>
              ) : null}
            </div>
            {rotulo && pRotulo > 0 ? (
              <div
                style={{
                  ...enterStyle(pRotulo, 10),
                  fontFamily: cfg.fuente,
                  fontWeight: cfg.pesoFuente,
                  fontSize: tam * 0.3 * cfg.escalaFuente,
                  lineHeight: 1.1,
                  marginTop: tam * 0.1,
                  color: colorRotulo ?? tinta,
                  whiteSpace: "pre",
                }}
              >
                {rotulo}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
};

// ── Pasos ────────────────────────────────────────────────────────────────────────────────────────
type PasoTrackerProps = Comun & {
  en: Punto; // centro de la insignia del primer paso
  pasos: string[];
  cambios: number[]; // cuadro en que cada paso pasa a ser el activo (uno por paso; pueden faltar los últimos)
  tam?: number;
  direccion?: "columna" | "fila";
  separacion?: number; // px entre pasos (alto de fila o ancho de columna)
  hechos?: "tachado" | "atenuado"; // por defecto: tachado en marcador y tiza, atenuado en vector
  anchos?: number[]; // ancho real de cada texto, si la estimación no alcanza
};

/**
 * Lista de pasos numerados que lleva la cuenta: entran escalonados y en espera (atenuados); en su
 * `cambio` cada paso se marca como activo (círculo a mano o insignia llena) y el anterior queda
 * tachado o atenuado. Sirve para que el espectador sepa siempre en qué punto del proceso está.
 */
export const PasoTracker: React.FC<PasoTrackerProps> = ({
  en,
  pasos,
  cambios,
  tam = 34,
  direccion = "columna",
  separacion,
  hechos,
  anchos,
  inicio = 0,
  piel,
  color,
  semilla = "pasos",
  sonido = "tick",
}) => {
  const frame = useCurrentFrame();
  const { nombre, cfg, color: tinta, fondo, mudo } = usePiel(piel, color);
  const vector = nombre === "vector";
  const modo = hechos ?? (vector ? "atenuado" : "tachado");
  const rB = tam * 0.74; // radio de la insignia
  const sep = separacion ?? (direccion === "columna" ? tam * 2.3 : tam * 9);
  return (
    <>
      {pasos.map((texto, i) => {
        const cx = en.x + (direccion === "fila" ? i * sep : 0);
        const cy = en.y + (direccion === "columna" ? i * sep : 0);
        const tAct = cambios[i];
        const tHecho = cambios[i + 1];
        const pIn = arrive(
          frame,
          inicio + staggerDelay(i, pasos.length, Math.min(20, pasos.length * 5)),
          12,
        );
        if (pIn <= 0) return null;
        const pAct = tAct === undefined ? 0 : arrive(frame, tAct, 10);
        const pHecho =
          tHecho === undefined ? 0 : arrive(frame, tHecho, 12, "arriveGentle");
        if (vector && sonido && !mudo && tAct !== undefined) sfx(frame, sonido, tAct);
        const xTexto = cx + rB + tam * 0.5;
        const ancho = anchos?.[i] ?? anchoTexto(texto, tam, cfg);
        const opTexto =
          mix(pAct, 0.55, 1) * mix(pHecho, 1, modo === "atenuado" ? 0.4 : 0.62);
        const numero: React.CSSProperties = {
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: vector ? marca.fuenteMono : cfg.fuente,
          fontWeight: vector ? 600 : cfg.pesoFuente,
          fontSize: tam * (vector ? 0.78 : cfg.escalaFuente),
          lineHeight: 1,
        };
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: cx - rB,
                top: cy - rB,
                width: rB * 2,
                height: rB * 2,
                ...enterStyle(pIn, 12),
                opacity: Math.min(1, pIn / 0.6) * opTexto,
              }}
            >
              {vector ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: `2px solid ${tinta}`,
                      opacity: 0.55,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: tinta,
                      opacity: pAct,
                      transform: `scale(${mix(pAct, 0.86, 1)})`,
                    }}
                  />
                  <div style={{ ...numero, color: tinta, opacity: 1 - pAct }}>
                    {i + 1}
                  </div>
                  <div style={{ ...numero, color: fondo, opacity: pAct }}>
                    {i + 1}
                  </div>
                </>
              ) : (
                <div style={{ ...numero, color: tinta }}>{i + 1}</div>
              )}
            </div>
            {!vector && tAct !== undefined ? (
              <Circulo
                en={{ x: cx, y: cy }}
                rx={rB * 1.02}
                ry={rB * 0.94}
                inicio={tAct}
                piel={piel}
                color={color}
                semilla={`${semilla}-c${i}`}
                sonido={sonido}
                grosor={cfg.grosor * 0.75}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: xTexto,
                top: cy,
                width: "max-content",
                transform: "translate(0, -50%)",
              }}
            >
              <div
                style={{
                  ...enterStyle(pIn, 12),
                  opacity: Math.min(1, pIn / 0.6) * opTexto,
                  fontFamily: cfg.fuente,
                  fontWeight: cfg.pesoFuente,
                  fontSize: tam * cfg.escalaFuente,
                  lineHeight: 1.05,
                  color: tinta,
                  whiteSpace: "pre",
                }}
              >
                {texto}
              </div>
            </div>
            {modo === "tachado" && tHecho !== undefined ? (
              <Tachado
                de={{ x: xTexto, y: cy + tam * 0.06 }}
                ancho={ancho}
                inicio={tHecho}
                piel={piel}
                color={color}
                semilla={`${semilla}-t${i}`}
                sonido={false}
                grosor={cfg.grosor * 0.7}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// ── Lupa ─────────────────────────────────────────────────────────────────────────────────────────
type LupaProps = Comun & {
  zona: Caja; // la zona del mundo que se amplía (centro y tamaño)
  en: Punto; // centro del inset
  tam?: number; // diámetro (círculo) o ancho (rect) del inset
  forma?: "circulo" | "rect";
  fondo?: string; // color detrás del contenido ampliado; por defecto, el `fondo` de <Anotaciones>
  marcar?: boolean; // rodea la zona de origen antes de sacar la guía
  curvatura?: number;
  children: React.ReactNode; // el mismo contenido del plano, en las mismas coordenadas
};

const bordeElipse = (c: Punto, rx: number, ry: number, hacia: Punto): Punto => {
  const dx = hacia.x - c.x;
  const dy = hacia.y - c.y;
  if (dx === 0 && dy === 0) return c;
  const k = 1 / Math.hypot(dx / rx, dy / ry);
  return { x: c.x + dx * k, y: c.y + dy * k };
};

const geoLupa = (zona: Caja, en: Punto, tam: number, forma: "circulo" | "rect", curvatura: number) => {
  const alto = forma === "circulo" ? tam : (tam * zona.alto) / zona.ancho;
  const aumento = forma === "circulo" ? tam / Math.max(zona.ancho, zona.alto) : tam / zona.ancho;
  const m = 1.16; // la marca queda un poco por fuera de la zona
  const borde = (c: Punto, w: number, h: number, hacia: Punto): Punto =>
    forma === "circulo" ? bordeElipse(c, w / 2, h / 2, hacia) : bordeHacia(c, w, h, hacia);
  const sale = borde(zona, zona.ancho * m + 10, zona.alto * m + 10, en);
  const llega = borde(en, tam + 14, alto + 14, zona);
  return { alto, aumento, m, d: curvaEntre(sale, llega, curvatura) };
};

/** Cuánto tarda una lupa completa (marca, guía e inset), para encadenar lo que venga después. */
export const durLupa = (zona: Caja, en: Punto, tam = 360, forma: "circulo" | "rect" = "circulo", curvatura = 0.1) =>
  9 + durTrazo(geoLupa(zona, en, tam, forma, curvatura).d) + 14;

/**
 * Inset que muestra ampliada una zona del mundo: se rodea la zona, sale la guía y aparece el inset
 * con el borde de la piel. Los `children` son el mismo contenido que se quiere ampliar, en las
 * coordenadas del contenedor (normalmente un componente `<Contenido />` que también está en el plano):
 * la lupa lo vuelve a dibujar recortado y escalado, así el detalle sigue vivo si el original se mueve.
 * La copia no cuenta en la auditoría de motion.
 */
export const Lupa: React.FC<LupaProps> = ({
  zona,
  en,
  tam = 360,
  forma = "circulo",
  fondo,
  marcar = true,
  curvatura = 0.1,
  children,
  inicio = 0,
  piel,
  color,
  semilla = "lupa",
  sonido = "pop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { nombre, cfg, color: tinta, fondo: soporte, mudo } = usePiel(piel, color);
  const vector = nombre === "vector";
  const { alto, aumento, m, d } = geoLupa(zona, en, tam, forma, curvatura);
  const tGuia = inicio + (marcar ? 9 : 0);
  const tInset = tGuia + durTrazo(d) - 3;
  const pop = springPreset(frame, fps, "snappy", tInset);
  const pInset = arrive(frame, tInset, 6, "arriveGentle");
  if (sonido && !mudo) sfx(frame, sonido, tInset);
  const radio = forma === "circulo" ? "50%" : vector ? marca.radios.medio : 10;
  return (
    <>
      {marcar ? (
        forma === "circulo" ? (
          <Circulo
            en={zona}
            rx={(zona.ancho * m) / 2}
            ry={(zona.alto * m) / 2}
            inicio={inicio}
            dur={12}
            piel={piel}
            color={color}
            semilla={`${semilla}-z`}
            sonido={false}
            grosor={cfg.grosor * 0.7}
          />
        ) : (
          <Recuadro
            x={zona.x}
            y={zona.y}
            ancho={zona.ancho * m}
            alto={zona.alto * m}
            inicio={inicio}
            dur={12}
            piel={piel}
            color={color}
            semilla={`${semilla}-z`}
            sonido={false}
            grosor={cfg.grosor * 0.7}
          />
        )
      ) : null}
      <Trazo
        d={d}
        inicio={tGuia}
        piel={piel}
        color={color}
        semilla={`${semilla}-g`}
        grosor={cfg.grosor * 0.7}
      />
      {pInset > 0 ? (
        <div
          style={{
            position: "absolute",
            left: en.x - tam / 2,
            top: en.y - alto / 2,
            width: tam,
            height: alto,
            transform: `scale(${mix(pop, 0.84, 1)})`,
            opacity: pInset,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: radio,
              overflow: "hidden",
              // A mano, el recorte queda un pelo por dentro del borde: el trazo lo tapa aunque no cierre exacto.
              clipPath: vector
                ? undefined
                : forma === "circulo"
                  ? "circle(48.4% at 50% 50%)"
                  : "inset(4px round 10px)",
              background: fondo ?? soporte,
              boxShadow: vector
                ? `0 26px 50px -18px ${marca.colores.sombraCalida}`
                : undefined,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: tam / 2 - zona.x * aumento,
                top: alto / 2 - zona.y * aumento,
                width: 0,
                height: 0,
                transformOrigin: "0 0",
                transform: `scale(${aumento})`,
              }}
            >
              <AuditPausa activa />
              {children}
              <AuditPausa activa={false} />
            </div>
          </div>
          {vector ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: radio,
                border: `${cfg.grosor * 0.8}px solid ${tinta}`,
              }}
            />
          ) : null}
        </div>
      ) : null}
      {vector ? null : forma === "circulo" ? (
        <Circulo
          en={en}
          rx={tam / 2}
          ry={tam / 2}
          inicio={tInset + 1}
          piel={piel}
          color={color}
          semilla={`${semilla}-b`}
          sonido={false}
          grosor={cfg.grosor * 1.2}
        />
      ) : (
        <Recuadro
          x={en.x}
          y={en.y}
          ancho={tam}
          alto={alto}
          inicio={tInset + 1}
          piel={piel}
          color={color}
          semilla={`${semilla}-b`}
          sonido={false}
          grosor={cfg.grosor * 1.2}
        />
      )}
    </>
  );
};
