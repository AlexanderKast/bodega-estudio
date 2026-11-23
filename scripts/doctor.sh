#!/usr/bin/env bash
# Revisa que este equipo (o el VPS, con --vps) tenga lo que necesita Bodega Estudio. No instala nada: dice qué
# falta y cómo instalarlo. Sale 1 si falta algo obligatorio.
#
#   bash scripts/doctor.sh          revisa este equipo
#   bash scripts/doctor.sh --vps    revisa además el VPS de Bodega (ssh + docker o clon)
set -uo pipefail
source "$(dirname "$0")/lib/config.sh"
so=linux
case "$(uname -s 2>/dev/null)" in MINGW* | MSYS* | CYGWIN*) so=windows ;; Darwin) so=macos ;; esac
fallas=0 avisos=0
ok() { printf '  ✓ %s\n' "$1"; }
mal() { printf '  ✗ %s\n      → %s\n' "$1" "$2"; fallas=$((fallas + 1)); }
aviso() { printf '  ! %s\n      → %s\n' "$1" "$2"; avisos=$((avisos + 1)); }
como() { # <windows> <macos> <linux>
  case "$so" in windows) echo "$1" ;; macos) echo "$2" ;; *) echo "$3" ;; esac
}

echo "Bodega Estudio · revisión de $(hostname) ($so) · ejecucion: $ESTUDIO_EJECUCION"
echo "Obligatorio:"
if command -v node >/dev/null 2>&1; then
  v=$(node -p 'process.versions.node'); m=${v%%.*}
  [ "$m" -ge 22 ] && ok "node $v" || mal "node $v (se necesita 22 o más)" "$(como 'winget install OpenJS.NodeJS.LTS' 'brew install node@22' 'nvm install 22')"
else mal "node no está" "$(como 'winget install OpenJS.NodeJS.LTS' 'brew install node@22' 'nvm install 22')"; fi
for c in ffmpeg ffprobe; do
  command -v $c >/dev/null 2>&1 && ok "$c $($c -version 2>/dev/null | head -1 | awk '{print $3}')" || mal "$c no está" "$(como 'winget install Gyan.FFmpeg' 'brew install ffmpeg' 'sudo apt install ffmpeg')"
done
if "$PY" -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
  ok "python $("$PY" -c 'import platform; print(platform.python_version())') ($PY)"
  "$PY" -c "import numpy, scipy" 2>/dev/null && ok "numpy y scipy (medición del crítico)" || mal "faltan numpy/scipy" "$PY -m pip install numpy scipy  (o un entorno propio: python -m venv .venv)"
  if "$PY" -c "import faster_whisper" 2>/dev/null; then ok "faster-whisper (modelo $WHISPER_MODELO, $WHISPER_DISPOSITIVO)"
  else mal "falta faster-whisper (transcripción)" "$PY -m pip install faster-whisper"; fi
else mal "python 3.10+ no está" "$(como 'winget install Python.Python.3.12' 'brew install python@3.12' 'sudo apt install python3 python3-pip')"; fi
if [ -d "$ESTUDIO_RAIZ/studio/node_modules/remotion" ]; then ok "dependencias de studio/ instaladas"
else mal "studio/node_modules no existe" "cd \"$ESTUDIO_RAIZ/studio\" && npm ci"; fi
command -v git >/dev/null 2>&1 && ok "git" || mal "git no está" "$(como 'winget install Git.Git' 'xcode-select --install' 'sudo apt install git')"

echo "Opcional:"
command -v yt-dlp >/dev/null 2>&1 && ok "yt-dlp (bajar referentes)" || aviso "sin yt-dlp: /replicar no puede bajar videos por URL" "$PY -m pip install yt-dlp"
command -v tesseract >/dev/null 2>&1 && ok "tesseract (lectura de textos del crítico)" || aviso "sin tesseract: el crítico no cuenta palabras en pantalla (L-01)" "$(como 'winget install UB-Mannheim.TesseractOCR' 'brew install tesseract tesseract-lang' 'sudo apt install tesseract-ocr tesseract-ocr-spa')"
"$PY" -c "import ctranslate2,sys; sys.exit(0 if ctranslate2.get_cuda_device_count() > 0 else 1)" 2>/dev/null && ok "GPU CUDA para Whisper" || ok "Whisper en CPU (más lento; usa whisper.modelo small si tarda)"
libre=$(df -Pk "$ESTUDIO_RAIZ" 2>/dev/null | awk 'NR==2 {print int($4/1048576)}')
[ -n "$libre" ] && { [ "$libre" -ge 10 ] && ok "disco libre: ${libre} GB" || aviso "disco libre: ${libre} GB" "deja al menos 10 GB para renders y modelos"; }
hilos=$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo "?")
ok "hilos de CPU: $hilos"
[ -f "$ESTUDIO_RAIZ/.remotion-licencia" ] && ok "licencia de Remotion registrada" || aviso "no hay registro de la licencia de Remotion" "Bodega necesita la Company License (remotion.pro). Cuando la compre, anota su id en .remotion-licencia"

if [ "${1:-}" = --vps ] || [ "$ESTUDIO_EJECUCION" = vps ]; then
  echo "VPS de Bodega ($ESTUDIO_VPS_ALIAS):"
  if ssh -o ConnectTimeout=8 -o BatchMode=yes "$ESTUDIO_VPS_ALIAS" true 2>/dev/null; then
    ok "ssh $ESTUDIO_VPS_ALIAS"
    if ssh "$ESTUDIO_VPS_ALIAS" "docker ps --format '{{.Names}}' | grep -qx '$ESTUDIO_VPS_CONTENEDOR'" 2>/dev/null; then
      ok "contenedor $ESTUDIO_VPS_CONTENEDOR corriendo"
      ssh "$ESTUDIO_VPS_ALIAS" "docker exec -w /estudio $ESTUDIO_VPS_CONTENEDOR bash scripts/doctor.sh" | sed 's/^/    /' || fallas=$((fallas + 1))
    elif ssh "$ESTUDIO_VPS_ALIAS" "test -f '$ESTUDIO_VPS_RUTA/scripts/doctor.sh'"; then
      aviso "contenedor apagado; se usa el clon $ESTUDIO_VPS_RUTA" "cd $ESTUDIO_VPS_RUTA/ops && docker compose up -d --build"
      ssh "$ESTUDIO_VPS_ALIAS" "cd '$ESTUDIO_VPS_RUTA' && bash scripts/doctor.sh" | sed 's/^/    /' || fallas=$((fallas + 1))
    else mal "no hay clon en $ESTUDIO_VPS_RUTA" "en el VPS: git clone <repo> $ESTUDIO_VPS_RUTA && cd $ESTUDIO_VPS_RUTA/ops && docker compose up -d --build"; fi
  else mal "no hay ssh a $ESTUDIO_VPS_ALIAS" "agrega el Host $ESTUDIO_VPS_ALIAS en ~/.ssh/config con la llave del VPS (ver INSTALAR.md)"; fi
fi

echo
if [ "$fallas" -eq 0 ]; then echo "Listo: nada obligatorio falta ($avisos avisos)."; else echo "Faltan $fallas cosas obligatorias ($avisos avisos)."; exit 1; fi
