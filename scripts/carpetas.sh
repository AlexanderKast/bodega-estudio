#!/usr/bin/env bash
# Dice dónde están las carpetas de trabajo del equipo (en Windows: Escritorio\Bodega Estudio\…).
#
#   bash scripts/carpetas.sh            # una por línea: nombre=ruta
#   bash scripts/carpetas.sh entregas   # solo esa ruta
#
# Las define estudio.local.json (lo escribe scripts/instalar.ps1). Sin ese archivo van dentro de trabajo/.
set -euo pipefail
. "$(dirname "$0")/lib/config.sh"
declare -A c=(
  [carpeta]="$ESTUDIO_CARPETA"
  [crudos]="$ESTUDIO_CRUDOS"
  [podcast]="$ESTUDIO_PODCAST"
  [productos]="$ESTUDIO_PRODUCTOS"
  [referentes]="$ESTUDIO_REFERENTES"
  [entregas]="$ESTUDIO_ENTREGAS"
)
if [ $# -gt 0 ]; then
  [ -n "${c[$1]:-}" ] || { echo "carpeta desconocida: $1 (carpeta|crudos|podcast|productos|referentes|entregas)" >&2; exit 2; }
  printf '%s\n' "${c[$1]}"
  exit 0
fi
for k in carpeta crudos podcast productos referentes entregas; do printf '%s=%s\n' "$k" "${c[$k]}"; done
