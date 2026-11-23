#!/usr/bin/env bash
# Master de entrega (kb/07 §4, kb/12 §3 paso 8). Correr en el VPS de Bodega o en este equipo.
#
#   scripts/master.sh entrada.mp4 [salida.mp4] [--audio original.wav]
#
# 1. Si se pasa --audio, reemplaza la pista del render por el audio original SIN tocar su ganancia
#    (el overlay se renderiza mudo y el audio de metraje se remezcla al final; ficha vJ8rgCjkjUo).
# 2. Normaliza a −14 LUFS integrados con loudnorm en dos pasadas (redes sociales). Apunta a −1.5 dBTP porque el
#    AAC sube unas décimas el pico real al codificar; el control de abajo exige −1 dBTP en el archivo final.
# 3. Reporta: duración, fps, resolución, LUFS, pico real y silencios (para comparar con el plan de voz).
# Sale 1 si la entrega queda fuera de ±1 LU o con pico por encima de −1 dBTP.
set -euo pipefail
. "$(dirname "$0")/lib/config.sh"  # PY: el python del estudio (.venv o el del sistema)

in="${1:?uso: master.sh entrada.mp4 [salida.mp4] [--audio original.wav]}"
out="${2:-${in%.*}.master.mp4}"
[[ "$out" == --audio ]] && out="${in%.*}.master.mp4"
audio=""
for ((i = 1; i <= $#; i++)); do
  if [[ "${!i}" == "--audio" ]]; then j=$((i + 1)); audio="${!j}"; fi
done
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

src="$in"
if [[ -n "$audio" ]]; then
  ffmpeg -loglevel error -y -i "$in" -i "$audio" -map 0:v -map 1:a -c:v copy -c:a pcm_s16le -shortest "$tmp/mix.mov"
  src="$tmp/mix.mov"
  echo "audio original remezclado sin cambios de ganancia: $audio"
fi

# Pasada 1: medir.
stats="$(ffmpeg -hide_banner -i "$src" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')"
get() { echo "$stats" | "$PY" -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
# Pasada 2: aplicar con los valores medidos (lineal cuando se puede).
ffmpeg -loglevel error -y -i "$src" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$out"

# Reporte.
IFS=, read -r w h fps < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$out")
dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")"
ebu="$(ffmpeg -hide_banner -i "$out" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p')"
lufs="$(echo "$ebu" | awk '/I:/ {print $2; exit}')"
peak="$(echo "$ebu" | awk '/Peak:/ {print $2; exit}')"
echo "entrega: $out"
printf "  %sx%s · %s fps · %.2f s
" "$w" "$h" "$fps" "$dur"
echo "  loudness integrado: ${lufs} LUFS (objetivo −14 ±1) · pico real: ${peak} dBTP (máximo −1)"
echo "  silencios ≥ 0,25 s (para comparar con las entradas de voz del plan):"
ffmpeg -hide_banner -i "$out" -af silencedetect=n=-32dB:d=0.25 -f null - 2>&1 | grep -o "silence_\(start\|end\): [0-9.]*" | paste - - | sed 's/^/    /' | head -20 || true
[[ -z "$(ffmpeg -hide_banner -i "$out" -af silencedetect=n=-32dB:d=0.25 -f null - 2>&1 | grep -m1 silence_start || true)" ]] && echo "    (ninguno)"

ok=$("$PY" -c "print(1 if abs(float('$lufs') + 14) <= 1 and float('$peak') <= -0.9 else 0)")
[[ "$ok" == 1 ]] && echo "master: OK" || { echo "master: FUERA DE RANGO"; exit 1; }
