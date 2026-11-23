#!/usr/bin/env bash
# Mide un render propio del estudio: cortes, ráfagas y tiras (scripts/referentes/medir.py) más flujo óptico
# por zonas para sacar las curvas de velocidad reales de cada movimiento.
#
#   scripts/critica/medir-pieza.sh <render.mp4> [--genre anuncio|explainer|vsl|talking] [--nombre pieza]
#        [--referente <carpeta-o-medicion.json>] [--out carpeta] [--flujo auto|lk|farneback] [--estricto]
#        [--host local|vps]
#
# Deja en studio/out/critica/<pieza>/: medicion.json, contactos.jpg, tiras/, estados/ y, con --referente,
# lado-a-lado.jpg. El detalle de qué mide y qué marca está en la cabecera de medir_pieza.py y en kb/10 §6.
#
# Dónde corre: lo dice `ejecucion` en estudio.config.json (o --host local|vps). En local necesita ffmpeg y
# python3 con NumPy y SciPy. Con vps copia el video y los scripts a una carpeta temporal del VPS de Bodega,
# mide allá y trae la carpeta de resultados. En ese modo --referente puede ser una carpeta local (se copia) o
# una ruta que ya existe en el VPS.
#
# --estricto sale 1 si hay warnings. Sin él sale 0: los hallazgos son estimaciones que confirma el agente
# critico-motion mirando las tiras.
set -euo pipefail
aqui=$(cd "$(dirname "$0")" && pwd)
raiz=$(cd "$aqui/../.." && pwd)
source "$aqui/../lib/config.sh"
host="${MEDIR_HOST:-$ESTUDIO_EJECUCION}"
mp4="" nombre="" out="" ref=""
extra=()
while [ $# -gt 0 ]; do
  case "$1" in
    --host) host="$2"; shift 2 ;;
    --nombre) nombre="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    --referente) ref="$2"; shift 2 ;;
    --genre | --flujo) extra+=("$1" "$2"); shift 2 ;;
    --estricto) extra+=("$1"); shift ;;
    -h | --help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "opción desconocida: $1" >&2; exit 2 ;;
    *) mp4="$1"; shift ;;
  esac
done
[ -f "$mp4" ] || { echo "uso: medir-pieza.sh <render.mp4> [--genre ...] [--nombre ...] [--referente ...] [--host local|vps]" >&2; exit 2; }
case "$host" in local) host="" ;; vps) host="$ESTUDIO_VPS_ALIAS" ;; esac
nombre=${nombre:-$(basename "${mp4%.*}")}
nombre=${nombre//[^A-Za-z0-9._-]/-}
out=${out:-$raiz/studio/out/critica/$nombre}
mkdir -p "$out"

if [ -z "$host" ]; then
  py=""
  for c in "$PY" python3 python; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c "import numpy, scipy" >/dev/null 2>&1; then py=$c; break; fi
  done
  [ -n "$py" ] || { echo "Falta python3 con NumPy y SciPy (BSD-3). Instálalos (/bodega-doctor) o corre con --host vps." >&2; exit 2; }
  refarg=()
  [ -n "$ref" ] && refarg=(--referente "$ref")
  exec "$py" "$aqui/medir_pieza.py" "$mp4" --nombre "$nombre" --out "$out" "${refarg[@]}" "${extra[@]}"
fi

# Remoto: carpeta temporal propia en el VPS, que se borra al terminar. Va dentro de trabajo/ del clon para
# que el contenedor bodega-estudio (que tiene numpy y scipy) la vea en /estudio/trabajo.
base_tmp="${MEDIR_TMP:-$ESTUDIO_VPS_RUTA/trabajo}"
tmp=$(ssh "$host" "mkdir -p '$base_tmp' && mktemp -d '$base_tmp/medir-pieza.XXXXXX'")
case "$tmp" in */medir-pieza.*) ;; *) echo "carpeta temporal inesperada: $tmp" >&2; exit 1 ;; esac
trap 'ssh "$host" "rm -r -- \"$tmp\""' EXIT
ssh "$host" "mkdir -p '$tmp/scripts/critica' '$tmp/scripts/referentes' '$tmp/out'"
scp -q "$aqui/flujo.py" "$aqui/medir_pieza.py" "$host:$tmp/scripts/critica/"
scp -q "$aqui/../referentes/medir.py" "$host:$tmp/scripts/referentes/"
scp -q "$aqui/../motion-audit.mjs" "$host:$tmp/scripts/"
scp -q "$mp4" "$host:$tmp/$nombre.mp4"
refarg=""
if [ -n "$ref" ]; then
  if [ -e "$ref" ]; then
    carpeta=$ref
    [ -d "$ref" ] || carpeta=$(dirname "$ref")
    scp -qr "$carpeta" "$host:$tmp/ref"
    refarg="--referente ref"
  else
    refarg="--referente '$ref'"
  fi
fi
set +e
orden="python3 scripts/critica/medir_pieza.py '$nombre.mp4' --nombre '$nombre' --out out $refarg ${extra[*]:-}"
dentro="/estudio/trabajo/${tmp##*/}"
ssh "$host" "if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx '$ESTUDIO_VPS_CONTENEDOR' && [ '$base_tmp' = '$ESTUDIO_VPS_RUTA/trabajo' ]; then docker exec -w '$dentro' '$ESTUDIO_VPS_CONTENEDOR' bash -c $(printf '%q' "$orden"); else cd '$tmp' && $orden; fi"
codigo=$?
set -e
# Primero se trae el paquete completo; solo si llegó bien se reemplaza lo que había.
paquete=$(mktemp)
if ssh "$host" "tar -C '$tmp/out' -cf - ." >"$paquete" && tar -tf "$paquete" >/dev/null 2>&1; then
  rm -rf "$out/tiras" "$out/estados"
  tar -C "$out" -mxf "$paquete"
  rm -f "$paquete"
  echo "resultados en $out"
else
  rm -f "$paquete"
  trap - EXIT
  echo "No se pudieron traer los resultados; quedaron en $host:$tmp/out" >&2
  exit 1
fi
exit $codigo
