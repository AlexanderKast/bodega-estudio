#!/usr/bin/env bash
# Procesa videos de referencia (local o en el VPS de Bodega con scripts/host.sh run): metadata, video 720p, transcripción y cuadros clave.
#
#   scripts/referentes/procesar.sh urls.txt [carpeta=trabajo/referentes]
#
# urls.txt: una URL por línea (YouTube, Shorts, Instagram Reels, TikTok) o un id de YouTube; # comenta.
#
# Por video deja en <carpeta>/<id>/: <id>.info.json, <id>.mp4, subtítulos .vtt (si YouTube los da) o
# whisper.json (faster-whisper, scripts/voz/whisper_local.py), y frames/ con cuadros por cambio de
# escena (sc_*.jpg) y un muestreo regular (t_*.jpg). En videos de hasta 3 min corre medir.py (medicion.json,
# tiras/). Después: texto.py y meta.py.
set -u
urls=$(realpath "${1:?uso: procesar.sh urls.txt [carpeta]}")
aqui=$(cd "$(dirname "$0")" && pwd)
source "$aqui/../lib/config.sh"
base="${2:-$ESTUDIO_TRABAJO/referentes}"
mkdir -p "$base" && cd "$base"

# Cookies opcionales (Instagram casi siempre las pide): YTDLP_COOKIES=/ruta/cookies.txt
cookies=()
[ -n "${YTDLP_COOKIES:-}" ] && cookies=(--cookies "$YTDLP_COOKIES")

# Id de carpeta: YouTube conserva su id (compatibilidad con referentes/); Instagram, TikTok y demás
# quedan como <plataforma>-<id>. Una línea puede ser URL completa o un id suelto de YouTube.
id_de() {
  yt-dlp -q --no-warnings "${cookies[@]}" --print "%(extractor_key)s|%(id)s" "$1" 2>/dev/null | head -1 |
    awk -F'|' '{ k=tolower($1); if (k ~ /^youtube/) print $2; else print k "-" $2 }'
}

# Metadata, subtítulos y video 720p por URL, con pausas para no gatillar límites (429).
grep -v '^[[:space:]]*\(#\|$\)' "$urls" | while read -r url; do
  case "$url" in *://*) ;; *) url="https://www.youtube.com/watch?v=$url" ;; esac
  id=$(id_de "$url")
  [ -z "$id" ] && { echo "FALLO id $url (¿cookies? YTDLP_COOKIES)"; continue; }
  mkdir -p "$id" && echo "$url" > "$id/fuente.url"
  yt-dlp -q --no-warnings "${cookies[@]}" --skip-download --write-info-json --write-auto-subs --write-subs \
    --sub-langs "es.*,en.*,-live_chat" --sub-format vtt --sleep-requests 2 \
    -o "$id/$id.%(ext)s" "$url" || echo "aviso: subtítulos de $id no bajaron (se transcribe con Whisper)"
  dur=$("$PY" -c "import json;print(int(json.load(open('$id/$id.info.json')).get('duration') or 0))" 2>/dev/null || echo 0)
  alto=$([ "$dur" -gt 3600 ] && echo 360 || echo 720)   # directos largos en 360p
  if ! ls "$id/$id.mp4" >/dev/null 2>&1; then
    # "res" ordena por el lado corto: un 9:16 baja a 720x1280, no a 405x720.
    yt-dlp -q --no-warnings "${cookies[@]}" --sleep-requests 2 -f "bv*+ba/b" -S "res:$alto,ext:mp4:m4a" \
      --merge-output-format mp4 -o "$id/$id.%(ext)s" "$url" || echo "FALLO descarga $id"
  fi
done

for d in $(ls -d */ | grep -v "^_"); do
  id=${d%/}
  [ -f "$id/$id.mp4" ] || continue
  echo "== $id $(date +%T)"
  dur=$("$PY" -c "import json;print(int(json.load(open('$id/$id.info.json')).get('duration') or 0))" 2>/dev/null || echo 0)
  if ! ls "$id"/*.vtt >/dev/null 2>&1 && [ ! -s "$id/whisper.json" ]; then
    # Sin el silencio final: Whisper alucina frases en bucle sobre el silencio (kb/07 §7).
    ffmpeg -loglevel error -y -i "$id/$id.mp4" -vn -ac 1 -ar 16000 -af "silenceremove=stop_periods=-1:stop_duration=2:stop_threshold=-45dB" -b:a 48k "$id/audio.mp3"
    "$PY" "$aqui/../voz/whisper_local.py" "$id/audio.mp3" "$id/whisper.json" --modelo "$WHISPER_MODELO" --idioma "$WHISPER_IDIOMA" --dispositivo "$WHISPER_DISPOSITIVO" --precision "$WHISPER_PRECISION" && echo "transcrito $id"
  fi
  if [ ! -d "$id/frames" ]; then
    mkdir -p "$id/frames"
    paso=$(( dur > 1200 ? 240 : (dur > 120 ? 30 : 2) ))
    ffmpeg -loglevel error -i "$id/$id.mp4" -vf "select='gt(scene,0.35)',scale=640:-2" -vsync vfr -frames:v 40 "$id/frames/sc_%03d.jpg"
    ffmpeg -loglevel error -i "$id/$id.mp4" -vf "fps=1/$paso,scale=640:-2" -frames:v 40 "$id/frames/t_%03d.jpg"
    echo "cuadros $id: $(ls "$id"/frames/*.jpg | wc -l)"
  fi
  # Medición de edición (cortes exactos, tiras por corte, energía de movimiento): shorts y piezas < 3 min.
  if [ "$dur" -le 180 ] && [ ! -s "$id/medicion.json" ]; then
    "$PY" "$aqui/medir.py" "$id" && echo "medido $id"
  fi
done
echo "LISTO $(date +%T)"
