#!/usr/bin/env bash
# Recorta un tramo de un video ya bajado con procesar.sh y lo deja medido como si fuera una pieza corta.
#
#   scripts/referentes/tramo.sh <carpeta-del-video> <inicio_s> <dur_s> [genero=explainer]
#
# Crea <carpeta>-t<inicio>/ junto a la original con: el mp4 del tramo, info.json (título, canal, URL con
# &t=), whisper.json con tiempos por palabra (para medir el desfase voz → anotación), medicion.json y tiras/
# de medir.py, critica/ con la medición de scripts/critica/medir_pieza.py (el mismo formato que usa una pieza
# propia) y contactos-4fps.jpg. Corre en el VPS de Bodega o en este equipo.
set -euo pipefail
. "$(dirname "$0")/../lib/config.sh"  # PY: el python del estudio (.venv o el del sistema)
src=$(realpath "${1:?uso: tramo.sh <carpeta> <inicio_s> <dur_s> [genero]}")
ini="$2" dur="$3" genero="${4:-explainer}"
aqui=$(cd "$(dirname "$0")" && pwd)
id=$(basename "$src")
dst="$src-t$ini"
tid=$(basename "$dst")
whisper="${WHISPER_URL:-http://localhost:8000/v1/audio/transcriptions}"
mkdir -p "$dst"
ffmpeg -loglevel error -y -ss "$ini" -t "$dur" -i "$src/$id.mp4" -c:v libx264 -preset fast -crf 15 -c:a aac -b:a 160k "$dst/$tid.mp4"
"$PY" - "$src/$id.info.json" "$dst/$tid.info.json" "$id" "$ini" "$dur" <<'PY'
import json, os, sys
src, dst, vid, ini, dur = sys.argv[1:]
d = json.load(open(src, encoding="utf-8")) if os.path.exists(src) else {}
json.dump({"id": vid, "title": d.get("title"), "channel": d.get("channel"), "upload_date": d.get("upload_date"),
           "duration": float(dur), "tramo_inicio_s": float(ini), "duracion_original_s": d.get("duration"),
           "webpage_url": f"https://www.youtube.com/watch?v={vid}&t={int(float(ini))}s"},
          open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
PY
echo "https://www.youtube.com/watch?v=$id&t=${ini%.*}s" > "$dst/fuente.url"
ffmpeg -loglevel error -y -i "$dst/$tid.mp4" -vn -ac 1 -ar 16000 -b:a 64k "$dst/audio.mp3"
curl -s --max-time 900 "$whisper" -F file=@"$dst/audio.mp3" -F model=deepdml/faster-whisper-large-v3-turbo-ct2 \
  -F response_format=verbose_json -F "timestamp_granularities[]=word" -F "timestamp_granularities[]=segment" \
  > "$dst/whisper.json" || echo "aviso: Whisper no respondió ($tid)"
"$PY" "$aqui/medir.py" "$dst"
"$PY" "$aqui/../critica/medir_pieza.py" "$dst/$tid.mp4" --genre "$genero" --nombre "ref-$tid" --out "$dst/critica" || true
bash "$aqui/tira.sh" "$dst/$tid.mp4" 0 "$dur" "$dst/contactos-4fps.jpg" \
  "$("$PY" -c "import json;print(max(1, round(json.load(open('$dst/medicion.json')).get('fps', 30) / 4)))")" 0,0,1,1 200 10
echo "LISTO $tid"
