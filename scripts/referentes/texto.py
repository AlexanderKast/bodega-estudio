"""Convierte subtítulos VTT (con líneas repetidas de los automáticos) o whisper.json en transcript.txt con [m:ss].

  python3 scripts/referentes/texto.py [carpeta=trabajo/referentes]
"""
import glob
import json
import os
import re
import sys

base = sys.argv[1] if len(sys.argv) > 1 else "trabajo/referentes"


def marca(s: float) -> str:
    s = int(s)
    return f"[{s // 60}:{s % 60:02d}]"


for d in sorted(glob.glob(f"{base}/*/")):
    vid = os.path.basename(d.rstrip("/"))
    if vid.startswith("_"):
        continue
    partes, fuente, ultimo = [], None, -99.0
    vtts = sorted(glob.glob(os.path.join(d, "*.vtt")), key=lambda p: ("orig" not in p, len(p)))
    w = os.path.join(d, "whisper.json")
    if vtts:
        fuente, vistos = os.path.basename(vtts[0]), []
        for bloque in open(vtts[0], encoding="utf8").read().split("\n\n"):
            m = re.search(r"(\d+):(\d+):(\d+)\.\d+ -->", bloque)
            if not m:
                continue
            t = int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3])
            for linea in bloque.split("\n")[1:]:
                linea = re.sub(r"<[^>]+>", "", linea).strip()
                if not linea or "-->" in linea or linea in vistos[-3:]:
                    continue
                vistos.append(linea)
                if t - ultimo >= 20:
                    partes.append(f"\n{marca(t)} ")
                    ultimo = t
                partes.append(linea + " ")
    elif os.path.exists(w):
        fuente = "whisper.json"
        for s in json.load(open(w))["segments"]:
            if s["start"] - ultimo >= 20:
                partes.append(f"\n{marca(s['start'])} ")
                ultimo = s["start"]
            partes.append(s["text"].strip() + " ")
    if partes:
        texto = "".join(partes).strip()
        open(os.path.join(d, "transcript.txt"), "w", encoding="utf8").write(f"# {vid} · fuente: {fuente}\n{texto}\n")
        print(vid, fuente, len(texto.split()), "palabras")
    else:
        print(vid, "SIN TEXTO")
