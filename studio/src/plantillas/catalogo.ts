import { z } from "zod";
import { FPS } from "../lib/formatos";
import { plantillas } from "./index";

/**
 * Datos del catálogo de plantillas, sacados de lo que cada plantilla declara (id, resumen, cuándo usarla,
 * formatos y esquema zod). `Root` los publica en la composición `Interno-Catalogo` y `scripts/catalogo.mjs`
 * los lee de ahí para escribir `catalogo/`. Así el catálogo no se escribe a mano: si cambia un esquema,
 * cambia el catálogo, y `catalogo.mjs --check` avisa cuando lo que hay en disco quedó viejo.
 */
export const datosCatalogo = () =>
  plantillas.map((p) => {
    let esquema: unknown;
    try {
      // `io: "input"` describe lo que se escribe en el JSON de props (los campos con default son opcionales).
      esquema = z.toJSONSchema(p.schema, { unrepresentable: "any", io: "input" });
    } catch (e) {
      esquema = { error: String(e) };
    }
    return {
      id: p.id,
      fuente: p.fuente,
      resumen: p.resumen,
      cuando: p.cuando,
      formatos: [...p.formatos],
      segundos: Math.round((p.duracion(p.defaultProps) / FPS) * 10) / 10,
      esquema,
      ejemplo: p.defaultProps,
    };
  });
