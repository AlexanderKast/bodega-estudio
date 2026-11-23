#!/usr/bin/env bash
# Único punto de ejecución del estudio. Según `ejecucion` en estudio.config.json corre aquí o en el VPS de Bodega.
#
#   scripts/host.sh info                      dónde va a correr y con qué
#   scripts/host.sh run '<comando>'           corre el comando en la raíz del repo (local) o del clon del VPS
#   scripts/host.sh subir <ruta> [<ruta>...]  copia archivos o carpetas del repo al VPS, misma ruta relativa
#   scripts/host.sh traer <ruta>              trae del VPS una ruta relativa del repo (p. ej. studio/out/pieza.mp4)
#
# En modo local, subir y traer no hacen nada. En modo vps el comando corre dentro del contenedor del estudio
# (ops/docker-compose.yml) si está levantado, y si no directo en el clon (`ruta_repo`).
# Los crudos y el podcast son datos personales de Bodega: solo viajan a su VPS, nunca a otro servidor.
set -euo pipefail
source "$(dirname "$0")/lib/config.sh"
accion="${1:-info}"; shift || true
rel() { local p; p=$(cd "$(dirname "$1")" && pwd)/$(basename "$1"); echo "${p#"$ESTUDIO_RAIZ"/}"; }

if [ "$ESTUDIO_EJECUCION" = local ]; then
  case "$accion" in
    info) echo "ejecucion: local · repo: $ESTUDIO_RAIZ · python: $PY · whisper: $WHISPER_MODELO ($WHISPER_DISPOSITIVO)" ;;
    run) cd "$ESTUDIO_RAIZ" && exec bash -c "$*" ;;
    subir | traer) exit 0 ;;
    *) echo "acción desconocida: $accion (info|run|subir|traer)" >&2; exit 2 ;;
  esac
  exit 0
fi

h="$ESTUDIO_VPS_ALIAS" r="$ESTUDIO_VPS_RUTA"
remoto() {
  # Dentro del contenedor si está corriendo; si no, en el clon del VPS.
  ssh "$h" "if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx '$ESTUDIO_VPS_CONTENEDOR'; then docker exec -w /estudio '$ESTUDIO_VPS_CONTENEDOR' bash -c $(printf '%q' "$1"); else cd '$r' && bash -lc $(printf '%q' "$1"); fi"
}
case "$accion" in
  info)
    echo "ejecucion: vps · ssh $h · repo remoto $r"
    ssh -o ConnectTimeout=8 "$h" "cd '$r' && git log -1 --format='commit %h %ad' 2>/dev/null; nproc; free -h | head -2" ;;
  run) remoto "$*" ;;
  subir)
    for p in "$@"; do
      [ -e "$p" ] || { echo "no existe: $p" >&2; exit 2; }
      rp=$(rel "$p"); ssh "$h" "mkdir -p '$r/$(dirname "$rp")'"
      scp -qr "$p" "$h:$r/$(dirname "$rp")/"
      echo "subido → $h:$r/$rp"
    done ;;
  traer)
    rp="${1:?uso: host.sh traer <ruta relativa del repo>}"
    mkdir -p "$ESTUDIO_RAIZ/$(dirname "$rp")"
    scp -qr "$h:$r/$rp" "$ESTUDIO_RAIZ/$(dirname "$rp")/"
    echo "traído ← $rp" ;;
  *) echo "acción desconocida: $accion (info|run|subir|traer)" >&2; exit 2 ;;
esac
