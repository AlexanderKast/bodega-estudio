#!/usr/bin/env python3
"""Mide la edición de un video de referencia corto (Reel, TikTok, Short).

    python3 scripts/referentes/medir.py <carpeta-del-video>    # la que deja procesar.sh

Corre en el VPS de Bodega o en este equipo. Solo usa ffmpeg/ffprobe y la biblioteca estándar (sin numpy).
Deja en la carpeta:
  medicion.json  cortes exactos, planos, energía de movimiento por plano con forma de curva estimada,
                 golpes de audio y cuántos cortes caen sobre un golpe.
  tiras/corte_NN.jpg  los cuadros de ±0,5 s alrededor de cada corte, a fps completo, en mosaico
                 (se leen de izquierda a derecha y de arriba abajo; el corte cae en la celda central).

La forma de la curva (ease-out, ease-in-out, ease-in, constante) es una estimación a partir de cuánto
cambia la imagen cuadro a cuadro; el analista la confirma mirando las tiras.
"""
import json
import math
import os
import re
import subprocess
import sys
from array import array

UMBRAL_CORTE = 0.30   # score de escena de ffmpeg
MAX_TIRAS = 30
ANCHO_E = 64          # ancho de la imagen reducida para la energía
SR = 8000             # muestreo del audio para golpes


def run(cmd, binario=False):
    r = subprocess.run(cmd, capture_output=True, check=False)
    return r.stdout if binario else (r.stdout.decode("utf-8", "replace"), r.stderr.decode("utf-8", "replace"))


def probe(mp4):
    out, _ = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", mp4])
    d = json.loads(out)
    v = next(s for s in d["streams"] if s["codec_type"] == "video")
    num, den = (v.get("avg_frame_rate") or v["r_frame_rate"]).split("/")
    fps = float(num) / float(den or 1)
    rot = 0
    for sd in v.get("side_data_list", []):
        rot = int(sd.get("rotation", 0) or 0)
    w, h = int(v["width"]), int(v["height"])
    if abs(rot) == 90:
        w, h = h, w
    tiene_audio = any(s["codec_type"] == "audio" for s in d["streams"])
    return fps, float(d["format"]["duration"]), w, h, tiene_audio


def cortes(mp4):
    _, err = run(["ffmpeg", "-hide_banner", "-i", mp4, "-an", "-vf",
                  f"select='gt(scene,{UMBRAL_CORTE})',showinfo", "-f", "null", "-"])
    return [round(float(m), 3) for m in re.findall(r"pts_time:([0-9.]+)", err)]


def energia(mp4, w, h):
    """Diferencia media absoluta entre cuadros consecutivos (0–255) sobre la imagen reducida a gris."""
    alto = max(2, int(round(ANCHO_E * h / w / 2)) * 2)
    raw = run(["ffmpeg", "-v", "error", "-i", mp4, "-an", "-vf", f"scale={ANCHO_E}:{alto},format=gray",
               "-f", "rawvideo", "-"], binario=True)
    n = ANCHO_E * alto
    cuadros = len(raw) // n
    e, prev = [0.0], raw[0:n]
    for i in range(1, cuadros):
        cur = raw[i * n:(i + 1) * n]
        e.append(round(sum(abs(a - b) for a, b in zip(cur, prev)) / n, 2))
        prev = cur
    return e


def golpes(mp4):
    """Onsets de audio: subidas fuertes de energía RMS en ventanas de 10 ms."""
    raw = run(["ffmpeg", "-v", "error", "-i", mp4, "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
              binario=True)
    s = array("h")
    s.frombytes(raw[: len(raw) // 2 * 2])
    hop = SR // 100
    rms = [math.sqrt(sum(x * x for x in s[i:i + hop]) / hop) for i in range(0, len(s) - hop, hop)]
    flux = [0.0] + [max(0.0, rms[i] - rms[i - 1]) for i in range(1, len(rms))]
    if not flux:
        return []
    orden = sorted(flux)
    umbral = max(orden[int(len(orden) * 0.95)], 1.0)
    out, ultimo = [], -1.0
    for i, f in enumerate(flux):
        t = i / 100
        if f >= umbral and f >= max(flux[max(0, i - 5):i + 6]) and t - ultimo > 0.12:
            out.append(round(t, 2))
            ultimo = t
    return out


def forma(curva):
    """Clasifica una ráfaga de movimiento según dónde cae el pico y cuánto tarda en apagarse."""
    if len(curva) < 4 or max(curva) < 2.0:
        return "quieto"
    pico = max(curva)
    i = curva.index(pico)
    activos = [k for k, v in enumerate(curva) if v >= pico * 0.25]
    a, b = activos[0], activos[-1]
    largo = b - a + 1
    if largo <= 2:
        return "golpe"
    pos = (i - a) / (largo - 1)
    plano = sum(1 for v in curva[a:b + 1] if v >= pico * 0.6) / largo
    if plano > 0.7:
        return "constante"
    if pos <= 0.3:
        return "ease-out"
    if pos >= 0.7:
        return "ease-in"
    return "ease-in-out"


def rafagas(e, desde, hasta, fps):
    """Ráfagas de movimiento dentro de un plano (sin el cuadro del corte)."""
    seg = e[desde + 1:hasta]
    if not seg:
        return []
    base = sorted(seg)[len(seg) // 2]
    umbral = max(2.0, base * 1.8)
    out, i = [], 0
    while i < len(seg):
        if seg[i] >= umbral:
            j = i
            while j < len(seg) and seg[j] >= umbral * 0.5:
                j += 1
            ini = max(0, i - 2)
            curva = seg[ini:j + 2]
            out.append({"t": round((desde + 1 + ini) / fps, 3), "frames": len(curva),
                        "pico": round(max(curva), 1), "forma": forma(curva)})
            i = j
        else:
            i += 1
    return out


def tiras(mp4, carpeta, ts, fps):
    os.makedirs(os.path.join(carpeta, "tiras"), exist_ok=True)
    n = max(1, round(fps))
    cols = 8 if n <= 32 else 10
    filas = math.ceil(n / cols)
    for k, t in enumerate(ts[:MAX_TIRAS], 1):
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, t - 0.5):.3f}", "-i", mp4, "-t", "1", "-an",
             "-vf", f"scale=180:-2,tile={cols}x{filas}:padding=2", "-frames:v", "1",
             os.path.join(carpeta, "tiras", f"corte_{k:02d}.jpg")])


def main():
    carpeta = sys.argv[1].rstrip("/")
    vid = os.path.basename(carpeta)
    mp4 = os.path.join(carpeta, f"{vid}.mp4")
    fps, dur, w, h, tiene_audio = probe(mp4)
    cs = [t for t in cortes(mp4) if 0.05 < t < dur - 0.05]
    bordes = [0.0] + cs + [dur]
    planos = [round(b - a, 3) for a, b in zip(bordes, bordes[1:])]
    e = energia(mp4, w, h)
    fr = [round(t * fps) for t in bordes]
    por_plano = [{"desde_s": round(bordes[k], 3), "hasta_s": round(bordes[k + 1], 3), "dur_s": planos[k],
                  "movimiento": rafagas(e, fr[k], min(fr[k + 1], len(e)), fps)} for k in range(len(planos))]
    gs = golpes(mp4) if tiene_audio else []
    tol = 2 / fps
    en_golpe = sum(1 for t in cs if any(abs(t - g) <= tol for g in gs))
    inter = sorted(b - a for a, b in zip(gs, gs[1:]) if 0.25 < b - a < 1.5)
    bpm = round(60 / inter[len(inter) // 2]) if inter else None
    ordenados = sorted(planos)
    formas = {}
    for p in por_plano:
        for r in p["movimiento"]:
            formas[r["forma"]] = formas.get(r["forma"], 0) + 1
    tiras(mp4, carpeta, cs, fps)
    med = {
        "id": vid, "fps": round(fps, 3), "duracion_s": round(dur, 3), "ancho": w, "alto": h,
        "formato": "9:16" if h > w * 1.5 else ("1:1" if abs(h - w) < w * 0.1 else ("4:5" if h > w else "16:9")),
        "cortes_s": cs,
        "ritmo": {
            "cortes": len(cs), "cortes_10s": round(len(cs) / dur * 10, 1),
            "plano_medio_s": round(sum(planos) / len(planos), 2),
            "plano_mediana_s": ordenados[len(ordenados) // 2],
            "min_s": ordenados[0], "max_s": ordenados[-1],
            "planos_s": planos,
        },
        "planos": por_plano,
        "formas_movimiento": formas,
        "audio": {"golpes_s": gs, "bpm_estimado": bpm, "cortes_en_golpe": en_golpe,
                  "cortes_en_golpe_pct": round(100 * en_golpe / len(cs)) if cs else 0},
        "energia_por_frame": e,
        "nota": "formas estimadas por diferencia de cuadros; confirmar con tiras/",
    }
    with open(os.path.join(carpeta, "medicion.json"), "w", encoding="utf-8") as f:
        json.dump(med, f, ensure_ascii=False)
    r = med["ritmo"]
    print(f"{vid}: {r['cortes']} cortes, plano medio {r['plano_medio_s']} s, "
          f"{med['audio']['cortes_en_golpe_pct']}% en golpe, bpm~{bpm}, formas {formas}")


if __name__ == "__main__":
    main()
