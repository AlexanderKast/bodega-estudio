#!/usr/bin/env bash
# Lee estudio.config.json y deja variables de entorno para los demás scripts. Se usa con:
#   source "$(dirname "$0")/lib/config.sh"     (o la ruta relativa que toque)
# Las variables de entorno ya definidas ganan sobre el archivo (ESTUDIO_EJECUCION=vps scripts/... por ejemplo).
ESTUDIO_RAIZ=${ESTUDIO_RAIZ:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}
_cfg="$ESTUDIO_RAIZ/estudio.config.json"
_leer() {
  [ -f "$_cfg" ] || { echo "$2"; return; }
  node -e '
    const c = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const v = process.argv[2].split(".").reduce((o, k) => (o == null ? o : o[k]), c);
    process.stdout.write(v == null || v === "" ? process.argv[3] : String(v));
  ' "$_cfg" "$1" "$2"
}
export ESTUDIO_RAIZ
export ESTUDIO_EJECUCION=${ESTUDIO_EJECUCION:-$(_leer ejecucion local)}
export ESTUDIO_VPS_ALIAS=${ESTUDIO_VPS_ALIAS:-$(_leer vps.alias_ssh bodega-vps)}
export ESTUDIO_VPS_RUTA=${ESTUDIO_VPS_RUTA:-$(_leer vps.ruta_repo /opt/bodega/estudio)}
export ESTUDIO_VPS_CONTENEDOR=${ESTUDIO_VPS_CONTENEDOR:-$(_leer vps.contenedor bodega-estudio)}
export WHISPER_MODELO=${WHISPER_MODELO:-$(_leer whisper.modelo medium)}
export WHISPER_DISPOSITIVO=${WHISPER_DISPOSITIVO:-$(_leer whisper.dispositivo auto)}
export WHISPER_PRECISION=${WHISPER_PRECISION:-$(_leer whisper.precision int8)}
export WHISPER_IDIOMA=${WHISPER_IDIOMA:-$(_leer whisper.idioma es)}
export ESTUDIO_TRABAJO=${ESTUDIO_TRABAJO:-$ESTUDIO_RAIZ/$(_leer carpeta_trabajo trabajo)}
case "$ESTUDIO_EJECUCION" in local | vps) ;; *) echo "estudio.config.json: ejecucion debe ser local o vps (es '$ESTUDIO_EJECUCION')" >&2; exit 2 ;; esac
# Python: el .venv del estudio si existe; si no, el primero que exista.
if [ -z "${PY:-}" ]; then
  for c in "$ESTUDIO_RAIZ/.venv/Scripts/python.exe" "$ESTUDIO_RAIZ/.venv/bin/python"; do [ -x "$c" ] && { PY=$c; break; }; done
fi
if [ -z "${PY:-}" ]; then
  for c in python3 python py; do command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null && { PY=$c; break; }; done
fi
export PY=${PY:-python3}
