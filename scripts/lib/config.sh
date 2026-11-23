#!/usr/bin/env bash
# Lee estudio.config.json y deja variables de entorno para los demás scripts. Se usa con:
#   source "$(dirname "$0")/lib/config.sh"     (o la ruta relativa que toque)
# Las variables de entorno ya definidas ganan sobre el archivo (ESTUDIO_EJECUCION=vps scripts/... por ejemplo).
ESTUDIO_RAIZ=${ESTUDIO_RAIZ:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}
_cfg="$ESTUDIO_RAIZ/estudio.config.json"
# estudio.local.json (fuera de git, lo escribe scripts/instalar.ps1) pisa lo que quiera de estudio.config.json en este
# computador: carpetas del Escritorio, ejecucion local|vps, modelo de Whisper. Así `git pull` nunca choca.
_local="$ESTUDIO_RAIZ/estudio.local.json"
if [ -f "$_local" ] && ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8").replace(/^﻿/, ""))' "$_local" 2>/dev/null; then
  echo "aviso: estudio.local.json no es JSON válido; se ignora (vuelve a correr scripts/instalar.ps1 para rehacerlo)" >&2
  _local="$ESTUDIO_RAIZ/.estudio.local.invalido"
fi
_leer() {
  [ -f "$_cfg" ] || [ -f "$_local" ] || { echo "$2"; return; }
  node -e '
    const fs = require("fs");
    const leer = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "")) : {});
    const unir = (a, b) => {
      for (const k of Object.keys(b)) {
        const v = b[k];
        a[k] = v && typeof v === "object" && !Array.isArray(v) ? unir(a[k] && typeof a[k] === "object" ? a[k] : {}, v) : v;
      }
      return a;
    };
    const c = unir(leer(process.argv[1]), leer(process.argv[4]));
    const v = process.argv[2].split(".").reduce((o, k) => (o == null ? o : o[k]), c);
    process.stdout.write(v == null || v === "" ? process.argv[3] : String(v));
  ' "$_cfg" "$1" "$2" "$_local"
}
# Ruta de Windows (C:\Users\...) a ruta de bash cuando hace falta.
_ruta() { if [ -n "$1" ] && command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s' "$1"; fi; }
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
# Carpetas del equipo (en Windows, Escritorio\Bodega Estudio\...; ver estudio.local.json). Sin archivo local van dentro
# de trabajo/. El material de Bodega se lee de ahí y las entregas se copian a ESTUDIO_ENTREGAS.
export ESTUDIO_CARPETA=${ESTUDIO_CARPETA:-$(_ruta "$(_leer carpetas.raiz "$ESTUDIO_TRABAJO")")}
export ESTUDIO_CRUDOS=${ESTUDIO_CRUDOS:-$(_ruta "$(_leer carpetas.crudos "$ESTUDIO_TRABAJO/crudos")")}
export ESTUDIO_PODCAST=${ESTUDIO_PODCAST:-$(_ruta "$(_leer carpetas.podcast "$ESTUDIO_TRABAJO/podcast")")}
export ESTUDIO_PRODUCTOS=${ESTUDIO_PRODUCTOS:-$(_ruta "$(_leer carpetas.productos "$ESTUDIO_TRABAJO/productos")")}
export ESTUDIO_REFERENTES=${ESTUDIO_REFERENTES:-$(_ruta "$(_leer carpetas.referentes "$ESTUDIO_TRABAJO/referentes-equipo")")}
export ESTUDIO_ENTREGAS=${ESTUDIO_ENTREGAS:-$(_ruta "$(_leer carpetas.entregas "$ESTUDIO_TRABAJO/entregas")")}
case "$ESTUDIO_EJECUCION" in local | vps) ;; *) echo "estudio.config.json: ejecucion debe ser local o vps (es '$ESTUDIO_EJECUCION')" >&2; exit 2 ;; esac
# Python: el .venv del estudio si existe; si no, el primero que exista.
if [ -z "${PY:-}" ]; then
  for c in "$ESTUDIO_RAIZ/.venv/Scripts/python.exe" "$ESTUDIO_RAIZ/.venv/bin/python"; do [ -x "$c" ] && { PY=$c; break; }; done
fi
if [ -z "${PY:-}" ]; then
  for c in python3 python py; do command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null && { PY=$c; break; }; done
fi
export PY=${PY:-python3}
