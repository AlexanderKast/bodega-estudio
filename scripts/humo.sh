#!/usr/bin/env bash
# Prueba de humo: renderiza Bodega-Humo-vertical (5 s) donde diga `ejecucion` y la pasa por el master.
#   bash scripts/humo.sh
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/lib/config.sh
salida=studio/out/humo/Bodega-Humo-vertical.mp4
inicio=$(date +%s)
scripts/host.sh run "cd studio && npx remotion render src/index.ts Bodega-Humo-vertical out/humo/Bodega-Humo-vertical.mp4 --timeout=$(node -p "require('./estudio.config.json').render?.timeout_ms ?? 180000") --log=error"
scripts/host.sh traer "$salida"
echo "render en $(( $(date +%s) - inicio )) s ($ESTUDIO_EJECUCION) → $salida"
ffprobe -v error -show_entries stream=width,height,r_frame_rate -show_entries format=duration -of default=nw=1 "$salida"
