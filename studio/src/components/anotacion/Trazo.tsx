import { evolvePath } from "@remotion/paths";
import { useId } from "react";
import { useCurrentFrame } from "remotion";
import { sfx, type SfxRole } from "../../lib/cues";
import {
  arrive,
  semilla as semillaViva,
  type CurveName,
} from "../../lib/motion";
import { aMano, cajaDe, durTrazo } from "./mano";
import { usePiel, type Piel } from "./pieles";

export type TrazoProps = {
  d: string; // path limpio en las coordenadas del contenedor (mundo o cuadro)
  inicio?: number; // cuadro en que la punta toca el papel
  dur?: number; // por defecto sale del largo del trazo
  color?: string;
  grosor?: number;
  piel?: Piel;
  semilla?: string;
  sonido?: SfxRole | false;
  anclar?: boolean; // false en formas cerradas: el temblor también afecta los extremos
  curva?: CurveName;
  opacidad?: number; // multiplica la de la piel (guías tenues, barridos)
  punteado?: [number, number]; // [raya, hueco] en px: la línea se dibuja ya punteada
};

/**
 * Trazo que se dibuja como lo hace una mano: arranca, acelera y frena (a doses en la piel marcador), con el pulso y el
 * grosor de la piel activa. Es la base de todo el kit de anotación. Se coloca dentro de un
 * `<Plano>` o una `<Capa>` y usa sus mismas coordenadas, así queda pegado a lo que señala.
 */
export const Trazo: React.FC<TrazoProps> = ({
  d,
  inicio = 0,
  dur,
  color,
  grosor,
  piel,
  semilla = "trazo",
  sonido = false,
  anclar = true,
  curva = "move",
  opacidad = 1,
  punteado,
}) => {
  const frame = useCurrentFrame();
  const idMascara = `trazo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { cfg, color: tinta, mudo } = usePiel(piel, color);
  const duracion = dur ?? durTrazo(d);
  if (sonido && !mudo) sfx(frame, sonido, inicio);
  // La mano no dibuja a 30 por segundo: el trazo avanza cada `paso` cuadros, contados desde su inicio.
  const cuadro =
    inicio + Math.floor((frame - inicio) / cfg.paso) * cfg.paso;
  const pasadas = Array.from({ length: cfg.pasadas }, (_, i) =>
    arrive(cuadro, inicio + i * 2, duracion, curva),
  );
  if (pasadas[0] <= 0) return null;
  const vivo = cfg.hierve > 0 ? semillaViva(frame, cfg.hierve, 3) : 0;
  const ancho = grosor ?? cfg.grosor;
  const caja = cfg.rugoso ? cajaDe(d, ancho * 3) : null;
  const cajaMascara = punteado ? cajaDe(d, ancho * 2 + 8) : null;
  const filtro = `tiza-${semilla.replace(/[^\w-]/g, "")}`;
  return (
    <svg
      width={1}
      height={1}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        opacity: cfg.opacidad * opacidad,
      }}
    >
      {caja ? (
        <filter
          id={filtro}
          filterUnits="userSpaceOnUse"
          x={caja.x}
          y={caja.y}
          width={caja.ancho}
          height={caja.alto}
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={3 + vivo}
            result="grano"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grano"
            scale={ancho * 0.55}
            xChannelSelector="R"
            yChannelSelector="G"
            result="roto"
          />
          <feColorMatrix
            in="grano"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.4 1.25"
            result="poros"
          />
          <feComposite in="roto" in2="poros" operator="in" />
        </filter>
      ) : null}
      <g filter={caja ? `url(#${filtro})` : undefined}>
        {pasadas.map((p, i) => {
          if (p <= 0) return null;
          const camino = aMano(
            d,
            cfg.temblor,
            `${semilla}-${i}-${vivo}`,
            anclar,
          );
          const { strokeDasharray, strokeDashoffset } = evolvePath(p, camino);
          // Punteado: las rayas no pueden animarse con el mismo dasharray, así que el avance va en una máscara.
          if (punteado && cajaMascara) {
            return (
              <g key={i}>
                <mask
                  id={`${idMascara}-${i}`}
                  maskUnits="userSpaceOnUse"
                  x={cajaMascara.x}
                  y={cajaMascara.y}
                  width={cajaMascara.ancho}
                  height={cajaMascara.alto}
                >
                  <path
                    d={camino}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={ancho + 8}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                </mask>
                <path
                  d={camino}
                  fill="none"
                  stroke={tinta}
                  strokeWidth={i === 0 ? ancho : ancho * 0.7}
                  strokeOpacity={i === 0 ? 1 : 0.6}
                  strokeLinecap="round"
                  strokeDasharray={`${punteado[0]} ${punteado[1]}`}
                  mask={`url(#${idMascara}-${i})`}
                />
              </g>
            );
          }
          return (
            <path
              key={i}
              d={camino}
              fill="none"
              stroke={tinta}
              strokeWidth={i === 0 ? ancho : ancho * 0.7}
              strokeOpacity={i === 0 ? 1 : 0.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}
      </g>
    </svg>
  );
};
