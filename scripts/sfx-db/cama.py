"""Arma la pista de sonido (cama) de una pieza a partir de sus cues (el VPS de Bodega, venv de earshot).

  python scripts/sfx-db/cama.py studio/out/audit/<comp>.sfx-cues.json -o studio/out/<pieza>.cama.wav \
      [--musica pista.wav [--musica-db -4]] [--voz locucion.wav [--voz-db -3]] [--paleta studio/src/marca/sonido.json]

Reglas (kb/12 §5, kb/07): el pico de cada sonido cae en el cuadro del gesto; cada rol tiene su nivel; la música
baja ~5 dB de base bajo los efectos y entre 6 y 12 dB antes de cada hit; todo se mezcla a 48 kHz estéreo con margen,
y `scripts/master.sh` deja la entrega en −14 LUFS.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
raiz = Path(__file__).resolve().parents[2]
public = raiz / "studio/public"

p = argparse.ArgumentParser()
p.add_argument("cues")
p.add_argument("-o", "--salida", required=True)
p.add_argument("--musica")
p.add_argument("--musica-db", type=float, help="pico de la música en dBFS; por defecto musica_db de la paleta (−16, cama bajo voz). Sin voz, la música manda: −4.")
p.add_argument("--voz", help="locución de la pieza: entra desde el cuadro 0 y manda sobre efectos y música (así master.sh --audio no la pierde)")
p.add_argument("--voz-db", type=float, default=-3, help="pico de la voz en dBFS")
p.add_argument("--paleta", default=str(raiz / "studio/src/marca/sonido.json"))
a = p.parse_args()

datos = json.loads(Path(a.cues).read_text())
db = {s["id"]: s for s in json.loads((public / "sfx-db/index.json").read_text())["sounds"]}
paleta = json.loads(Path(a.paleta).read_text())
largo = int(round(datos["duracion_s"] * SR)) + SR  # un segundo de cola
cama = np.zeros((largo, 2), dtype=np.float64)


def cargar(ruta: Path) -> np.ndarray:
    x, sr = sf.read(ruta, always_2d=True)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    if sr != SR:  # remuestreo lineal simple (los SFX ya vienen a 48 kHz)
        n = int(len(x) * SR / sr)
        idx = np.linspace(0, len(x) - 1, n)
        x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], axis=1)
    return x


usados = []
for c in datos["cues"]:
    sid = c.get("id") or paleta["roles"].get(c["role"])
    if not sid or sid not in db:
        print(f"aviso: sin sonido para el rol {c['role']} en {c['t']} s (agrega el rol a la paleta)")
        continue
    s = db[sid]
    x = cargar(public / s["file"])
    pico = float(s.get("peak_s") or np.argmax(np.abs(x).sum(axis=1)) / SR)
    nivel_db = paleta["niveles_db"].get(c["role"], -12) + (c.get("gain") or 0)
    x = x / (np.max(np.abs(x)) or 1) * 10 ** (nivel_db / 20)
    inicio = int(round((c["t"] - pico) * SR))
    if inicio < 0:
        x, inicio = x[-inicio:], 0
    fin = min(largo, inicio + len(x))
    cama[inicio:fin] += x[: fin - inicio]
    usados.append(f"{c['t']:6.2f} s  {c['role']:<13} {sid}  ({nivel_db:+.0f} dB)")

if a.musica:
    m = cargar(Path(a.musica))[:largo]
    m = m / (np.max(np.abs(m)) or 1) * 10 ** ((a.musica_db if a.musica_db is not None else paleta.get("musica_db", -16)) / 20)
    env = np.ones(len(m))
    for c in datos["cues"]:  # baja antes del golpe y vuelve después
        if c["role"] == "hit":
            t = int(c["t"] * SR)
            antes, despues = int(0.35 * SR), int(0.6 * SR)
            ini = max(0, t - antes)
            env[ini:t] = np.minimum(env[ini:t], np.linspace(1, 10 ** (-9 / 20), t - ini))
            fin = min(len(env), t + despues)
            env[t:fin] = np.minimum(env[t:fin], np.linspace(10 ** (-9 / 20), 1, fin - t))
    cama[: len(m)] += m * env[:, None]

if a.voz:
    v = cargar(Path(a.voz))[:largo]
    cama[: len(v)] += v / (np.max(np.abs(v)) or 1) * 10 ** (a.voz_db / 20)

pico_total = np.max(np.abs(cama)) or 1
if pico_total > 0.89:  # margen de −1 dB antes del master
    cama *= 0.89 / pico_total
sf.write(a.salida, cama.astype(np.float32), SR, subtype="PCM_24")
print("\n".join(usados))
print(f"cama: {a.salida} · {len(usados)} sonidos · {'con' if a.musica else 'sin'} música · {'con' if a.voz else 'sin'} voz · {largo / SR:.2f} s")
