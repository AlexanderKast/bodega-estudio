#!/usr/bin/env bash
# Deja una pieza terminada en la carpeta de entregas del equipo: 05 Entregas\<AAAA-MM-DD>\<nombre>.<ext>.
#
#   bash scripts/entregar.sh <archivo> [nombre sin extensión]
#
# Nunca pisa: si ya existe ese nombre en la carpeta del día, agrega " (2)", " (3)"… Imprime la ruta final.
# Úsalo al final de /mm-render, /mm-plantilla o /master-motion, cuando la pieza ya pasó el master y el crítico.
set -euo pipefail
. "$(dirname "$0")/lib/config.sh"
src=${1:?uso: entregar.sh <archivo> [nombre]}
[ -f "$src" ] || { echo "no existe: $src" >&2; exit 2; }
ext=${src##*.}
base=${2:-$(basename "$src" ".$ext")}
dia="$ESTUDIO_ENTREGAS/$(date +%Y-%m-%d)"
mkdir -p "$dia"
dst="$dia/$base.$ext"
n=2
while [ -e "$dst" ]; do dst="$dia/$base ($n).$ext"; n=$((n + 1)); done
cp "$src" "$dst"
printf '%s\n' "$dst"
