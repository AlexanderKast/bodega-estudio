#!/usr/bin/env bash
# Voz primero: transcribe una locución con faster-whisper y deja las palabras con sus tiempos en el formato
# que consume loadWords() de studio/src/lib/cues.ts.
#
#   scripts/voz/transcribir.sh <audio> [--pieza <slug>] [--out ruta.json] [--idioma es]
#        [--guion guion.txt] [--host local|vps] [--sin-copia]
#
# Deja:
#   studio/src/data/<slug>.voz.json   { audio, idioma, duracion, texto, words: [{ word, start, end }] } en segundos
#   studio/public/voz/<slug>.<ext>    copia del audio para <Audio src={staticFile("voz/<slug>.<ext>")} />
#                                     (--sin-copia no la hace; con --out el JSON va a esa ruta)
#
# En la composición:
#   import voz from "../data/<slug>.voz.json";
#   const words = loadWords(voz);
#   const t = cue(words, "palabra", 1, fps);
#
# --guion compara contra el texto del guion y lista las palabras que Whisper escribió distinto (cifras, siglas,
# nombres): esas son las que harían fallar a cue(). Se corrige la palabra del cue, no el JSON.
#
# Dónde corre: lo dice `ejecucion` en estudio.config.json (o --host). local = faster-whisper en este equipo
# (scripts/voz/whisper_local.py); vps = se sube el audio al VPS de Bodega, se transcribe allá y vuelve el JSON.
# Si WHISPER_URL está definida, se usa esa API compatible con OpenAI en lugar de faster-whisper.
# El audio se prepara antes (mono, 16 kHz y sin el silencio final, porque Whisper alucina sobre el silencio,
# kb/07 §7). Necesita ffmpeg y node. No instala nada.
set -euo pipefail
aqui=$(cd "$(dirname "$0")" && pwd)
raiz=$(cd "$aqui/../.." && pwd)
source "$aqui/../lib/config.sh"
host="${VOZ_HOST:-$ESTUDIO_EJECUCION}"
url="${WHISPER_URL:-}"
audio="" pieza="" out="" idioma="$WHISPER_IDIOMA" guion="" copia=1
while [ $# -gt 0 ]; do
  case "$1" in
    --host) host="$2"; shift 2 ;;
    --pieza) pieza="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    --idioma) idioma="$2"; shift 2 ;;
    --guion) guion="$2"; shift 2 ;;
    --sin-copia) copia=0; shift ;;
    -h | --help) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "opción desconocida: $1" >&2; exit 2 ;;
    *) audio="$1"; shift ;;
  esac
done
[ -f "$audio" ] || { echo "uso: transcribir.sh <audio> [--pieza slug] [--out ruta.json] [--idioma es] [--guion guion.txt] [--host local|vps]" >&2; exit 2; }
[ -z "$guion" ] || [ -f "$guion" ] || { echo "no existe el guion: $guion" >&2; exit 2; }
for c in ffmpeg ffprobe node; do
  command -v "$c" >/dev/null 2>&1 || { echo "falta $c" >&2; exit 2; }
done
ext="${audio##*.}"
pieza=${pieza:-$(basename "${audio%.*}")}
pieza=${pieza//[^A-Za-z0-9._-]/-}
out=${out:-$raiz/studio/src/data/$pieza.voz.json}
mkdir -p "$(dirname "$out")"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$audio")
# Mono, 16 kHz y sin el silencio final. Quitar solo la cola no mueve ningún tiempo.
ffmpeg -loglevel error -y -i "$audio" -vn -ac 1 -ar 16000 \
  -af "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.25,areverse" "$tmp/voz.flac"

whisper_local() { # <flac> <json>
  "$PY" "$aqui/whisper_local.py" "$1" "$2" --modelo "$WHISPER_MODELO" --idioma "$idioma"     --dispositivo "$WHISPER_DISPOSITIVO" --precision "$WHISPER_PRECISION"
}
if [ -n "$url" ]; then
  curl -sS --fail-with-body --max-time 1800 "$url" -F "file=@$tmp/voz.flac" -F "model=${WHISPER_MODEL:-whisper-1}"     -F "response_format=verbose_json" -F "timestamp_granularities[]=word" -F "language=$idioma" >"$tmp/whisper.json"
elif [ "$host" = vps ]; then
  # Carpeta temporal propia dentro del clon del VPS; se borra al terminar.
  rt="trabajo/tmp-voz-$$"
  mkdir -p "$raiz/$rt" && cp "$tmp/voz.flac" "$raiz/$rt/voz.flac"
  trap 'rm -rf "$tmp" "$raiz/$rt"; "$raiz/scripts/host.sh" run "rm -rf $rt" >/dev/null 2>&1 || true' EXIT
  "$raiz/scripts/host.sh" subir "$raiz/$rt" >/dev/null
  "$raiz/scripts/host.sh" run "source scripts/lib/config.sh && \$PY scripts/voz/whisper_local.py $rt/voz.flac $rt/whisper.json --modelo $WHISPER_MODELO --idioma $idioma --dispositivo $WHISPER_DISPOSITIVO --precision $WHISPER_PRECISION"
  "$raiz/scripts/host.sh" traer "$rt/whisper.json" >/dev/null
  cp "$raiz/$rt/whisper.json" "$tmp/whisper.json"
else
  whisper_local "$tmp/voz.flac" "$tmp/whisper.json"
fi

rel="voz/$pieza.$ext"
[ "$copia" = 1 ] || rel=$(basename "$audio")
args=("$tmp/whisper.json" "$out" --audio "$rel" --idioma "$idioma" --duracion "$dur")
[ -z "$guion" ] || args+=(--guion "$guion")
node "$aqui/palabras.mjs" "${args[@]}"

if [ "$copia" = 1 ]; then
  mkdir -p "$raiz/studio/public/voz"
  cp "$audio" "$raiz/studio/public/voz/$pieza.$ext"
  echo "audio   → studio/public/voz/$pieza.$ext"
fi
