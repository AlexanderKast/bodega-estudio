import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Empaqueta el estudio para renderizar o auditar y borra el paquete al salir.
 *
 * `bundle()` de Remotion deja una carpeta de ~60 MB en el directorio temporal y no la borra: con cada
 * auditoría, hoja de stills o corrida caída se acumula una, y en el VPS de Bodega o en este equipo llenaron el disco raíz
 * (182 carpetas el 2026-11-11; con el disco lleno Chrome muere con «Page crashed»). Aquí la carpeta
 * es nuestra (`mkdtemp`) y se elimina cuando el proceso termina, también si termina por un error o
 * por Ctrl+C. Solo se borra esa carpeta, nunca otra.
 *
 * `bundle` es la función de `@remotion/bundler`, que cada script carga desde `studio/node_modules`.
 */
export const empaquetar = async (bundle, entryPoint) => {
  const outDir = mkdtempSync(join(tmpdir(), "master-motion-bundle-"));
  const limpiar = () => {
    try {
      rmSync(outDir, { recursive: true, force: true });
    } catch {
      // Si no se puede borrar (permisos, disco), el script no falla por eso.
    }
  };
  process.on("exit", limpiar);
  for (const senal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(senal, () => process.exit(130));
  }
  return bundle({ entryPoint, outDir, onProgress: () => {} });
};
