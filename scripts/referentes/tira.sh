#!/usr/bin/env bash
# Tira de cuadros de un tramo, con el tiempo del video en cada celda, para medir gestos a ojo.
#
#   scripts/referentes/tira.sh <video.mp4> <t0> <dur> <salida.jpg> [paso=1] [roi=x,y,w,h] [ancho_celda=240] [cols=8]
#
# paso: cada cuántos cuadros se toma uno (1 = fps completo). roi: recorte en fracciones del cuadro (0–1).
# Se lee de izquierda a derecha y de arriba abajo. Para una hoja de contactos de un tramo largo: paso 12–15.
set -euo pipefail
. "$(dirname "$0")/../lib/config.sh"  # PY: el python del estudio (.venv o el del sistema)
mp4="${1:?uso: tira.sh <video.mp4> <t0> <dur> <salida.jpg> [paso] [roi] [ancho] [cols]}"
t0="$2" dur="$3" out="$4" paso="${5:-1}" roi="${6:-0,0,1,1}" ancho="${7:-240}" cols="${8:-8}"
IFS=, read -r rx ry rw rh <<<"$roi"
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=avg_frame_rate -of csv=p=0 "$mp4")
celdas=$("$PY" -c "import math;print(max(1, math.ceil($dur * ($fps) / $paso)))")
filas=$(( (celdas + cols - 1) / cols ))
ffmpeg -loglevel error -y -ss "$t0" -t "$dur" -i "$mp4" -an -vf \
  "select='not(mod(n\,$paso))',crop=iw*$rw:ih*$rh:iw*$rx:ih*$ry,scale=$ancho:-2,drawtext=text='%{pts\:flt\:$t0}':fontsize=12:fontcolor=white:box=1:boxcolor=black@0.65:x=2:y=2,tile=${cols}x${filas}:padding=2" \
  -vsync vfr -frames:v 1 -q:v 3 "$out"
echo "$out: $celdas celdas (${cols}x${filas}), paso $paso cuadro(s) a $fps fps, desde $t0 s"
