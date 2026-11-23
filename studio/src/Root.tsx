import { Composition, Folder, useCurrentFrame } from "remotion";
import { composiciones } from "./compositions";
import { setAuditFrame } from "./lib/audit";
import { FORMATOS, FPS } from "./lib/formatos";
import { plantillas } from "./plantillas";
import { datosCatalogo } from "./plantillas/catalogo";

/**
 * Registro de Remotion. Cada pieza de `compositions/index.ts` se publica en los formatos que declara,
 * con el id `<Pieza>-<formato>` (por ejemplo `Bodega-Reel-vertical`).
 * Cada composición va envuelta en el reloj de auditoría (lib/audit.ts): en render normal no hace nada.
 */
const conReloj = new Map<React.FC, React.FC>();
const auditada = (Pieza: React.FC): React.FC => {
  let envuelta = conReloj.get(Pieza);
  if (!envuelta) {
    envuelta = () => {
      setAuditFrame(useCurrentFrame());
      return <Pieza />;
    };
    conReloj.set(Pieza, envuelta);
  }
  return envuelta;
};

/** Igual que `auditada`, pero pasa las props (las plantillas de plantillas/ tienen schema). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conRelojProps = new Map<React.FC<any>, React.FC<Record<string, unknown>>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const auditadaConProps = (Pieza: React.FC<any>): React.FC<Record<string, unknown>> => {
  let envuelta = conRelojProps.get(Pieza);
  if (!envuelta) {
    envuelta = (props) => {
      setAuditFrame(useCurrentFrame());
      return <Pieza {...props} />;
    };
    conRelojProps.set(Pieza, envuelta);
  }
  return envuelta;
};

/** Composición sin imagen: solo transporta datos en sus props (ver `plantillas/catalogo.ts`). */
const SoloDatos: React.FC<Record<string, unknown>> = () => null;

export const Raiz: React.FC = () => (
  <>
    {composiciones.map((c) => (
      <Folder key={c.id} name={c.id}>
        {c.formatos.map((f) => (
          <Composition
            key={f}
            id={`${c.id}-${f}`}
            component={auditada(c.componente)}
            durationInFrames={c.duracion}
            fps={FPS}
            width={FORMATOS[f].ancho}
            height={FORMATOS[f].alto}
          />
        ))}
      </Folder>
    ))}
    <Folder name="Plantillas">
      {plantillas.map((p) =>
        p.formatos.map((f) => (
          <Composition
            key={`${p.id}-${f}`}
            id={`${p.id}-${f}`}
            component={auditadaConProps(p.componente)}
            schema={p.schema}
            defaultProps={p.defaultProps}
            calculateMetadata={({ props }) => ({ durationInFrames: p.duracion(props) })}
            durationInFrames={p.duracion(p.defaultProps)}
            fps={FPS}
            width={FORMATOS[f].ancho}
            height={FORMATOS[f].alto}
          />
        )),
      )}
    </Folder>
    {/* Las composiciones `Interno-*` no son piezas: la auditoría y los lotes de stills las saltan. */}
    <Folder name="Interno">
      <Composition
        id="Interno-Catalogo"
        component={SoloDatos}
        defaultProps={{ plantillas: datosCatalogo() }}
        durationInFrames={1}
        fps={FPS}
        width={FORMATOS.horizontal.ancho}
        height={FORMATOS.horizontal.alto}
      />
    </Folder>
  </>
);
