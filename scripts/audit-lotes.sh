#!/usr/bin/env bash
# Auditoría dinámica de TODAS las composiciones en lotes chicos, para servidores cargados.
#
#   scripts/audit-lotes.sh [tamaño-de-lote=6]
#
# `node scripts/verify.mjs` audita las ~110 composiciones en un solo proceso: si Chrome se cae a mitad
# («Page crashed», casi siempre por memoria cuando hay otros renders en la máquina) se pierde todo.
# Este script reparte las composiciones en lotes, reintenta el lote que se cae y, si vuelve a caerse,
# lo repite composición por composición para aislar la que tumba la página.
# Deja el resumen en studio/out/audit-lotes.log y sale 1 si hubo hallazgos o caídas.
set -uo pipefail
raiz=$(cd "$(dirname "$0")/.." && pwd)
cd "$raiz"
tam="${1:-6}"
log="studio/out/audit-lotes.log"
mkdir -p studio/out
: >"$log"

mapfile -t ids < <(cd studio && npx remotion compositions src/index.ts -q 2>/dev/null | tr ' ' '\n' | grep -v '^$' | grep -v '^Test-AuditMalo' | grep -v '^Interno-')
total=${#ids[@]}
[ "$total" -gt 0 ] || { echo "no pude listar las composiciones" >&2; exit 2; }
echo "$total composiciones en lotes de $tam"

auditar() { # $1 = ids separados por coma; deja la salida en studio/out/lote.log
  node scripts/motion-audit.mjs --comp "$1" >studio/out/lote.log 2>&1 </dev/null
}
hallazgos() { grep -E ' (warning|error) +[A-Z]+-[0-9]+' studio/out/lote.log | grep -v MOTION_AUDIT >>"$log" || true; }

hechas=0
for ((i = 0; i < total; i += tam)); do
  lote=("${ids[@]:i:tam}")
  lista=$(IFS=,; echo "${lote[*]}")
  auditar "$lista" || true
  if grep -q "Page crashed" studio/out/lote.log; then auditar "$lista" || true; fi
  if grep -q "Page crashed" studio/out/lote.log; then
    for c in "${lote[@]}"; do
      auditar "$c" || true
      if grep -q "Page crashed" studio/out/lote.log; then echo "CAIDA $c" >>"$log"; else hallazgos; fi
    done
  else
    hallazgos
  fi
  hechas=$((hechas + ${#lote[@]}))
  echo "  $hechas / $total"
done

echo "--- hallazgos y caídas:"
cat "$log"
[ -s "$log" ] && exit 1
echo "auditoría por lotes: $total composiciones, sin hallazgos ni caídas"
