#!/usr/bin/env python3
"""Mide cuánto tarda en dibujarse una anotación (círculo, flecha, subrayado, rótulo) en un video de referencia.

    python3 scripts/referentes/trazo.py <video.mp4> <t0> <t1> --roi x,y,w,h [--tinta #D8232A] [--tol 70]
            [--umbral 26] [--json]

t0 es un instante justo ANTES de que empiece el trazo (el cuadro limpio que sirve de base) y t1 uno posterior
a que termine; si t1 se alarga, también mide cuánto permanece. --roi son fracciones del cuadro (0–1) que
encierran la anotación con algo de margen.

Cuenta, cuadro a cuadro, cuántos píxeles de la zona difieren del cuadro base ("tinta"). Con --tinta #hex
cuenta en cambio los píxeles de ese color (distancia RGB menor que --tol): es lo que sirve cuando debajo hay
metraje con grano o cámara en movimiento y la anotación es de un color que el fondo no tiene (marcador rojo
sobre foto en blanco y negro). De esa curva saca:
  inicio_s / fin_s     primer cuadro con ≥ 5 % y primer cuadro con ≥ 95 % de la tinta final
  dur_s, dur_f30       duración del trazo en segundos y en cuadros a 30 fps
  forma                sale-rapido-y-frena · constante · acelera · lento-rapido-lento (según dónde cae el 50 %)
  paso_cuadros         cada cuántos cuadros cambia el dibujo (1 = a unos, 2 = a doses…)
  permanece_s          desde que termina hasta que la tinta baja a la mitad o la zona cambia de golpe
  hierve               true si la tinta ya dibujada sigue cambiando (línea que "hierve")

Límite: si la cámara se mueve bajo la anotación, la diferencia contra el cuadro base también crece; por eso
se confirma siempre en la tira (tira.sh). Corre en el VPS de Bodega o en este equipo: ffmpeg + NumPy.
"""
import argparse
import json
import subprocess
import sys

import numpy as np

ANCHO = 480


def probe(mp4):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,avg_frame_rate", "-of", "json", mp4],
                         capture_output=True, check=True).stdout
    s = json.loads(out)["streams"][0]
    n, d = s["avg_frame_rate"].split("/")
    return int(s["width"]), int(s["height"]), float(n) / float(d or 1)


def cuadros(mp4, t0, t1, roi, w, h, color=False):
    x, y, rw, rh = roi
    cw, ch = max(2, int(rw * w) // 2 * 2), max(2, int(rh * h) // 2 * 2)
    ow = min(ANCHO, cw) // 2 * 2
    oh = max(2, int(round(ow * ch / cw / 2)) * 2)
    vf = f"crop={cw}:{ch}:{int(x * w)}:{int(y * h)},scale={ow}:{oh},format={'rgb24' if color else 'gray'}"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", mp4, "-an",
                          "-vf", vf, "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    c = 3 if color else 1
    n = len(raw) // (ow * oh * c)
    fr = np.frombuffer(raw[: n * ow * oh * c], np.uint8).astype(np.int32)
    return fr.reshape(n, oh, ow, 3) if color else fr.reshape(n, oh, ow)


def forma(prog):
    """Dónde cae el 50 % del avance dentro de la duración del trazo."""
    if len(prog) < 3:
        return "golpe (≤ 2 cuadros)"
    t50 = next(i for i, p in enumerate(prog) if p >= 0.5) / (len(prog) - 1)
    if t50 < 0.38:
        return "sale-rapido-y-frena"
    if t50 > 0.62:
        return "acelera"
    v = np.diff(prog)
    k = max(1, len(v) // 4)
    centro, puntas = v[k:-k].mean() if len(v) > 2 * k else v.mean(), (v[:k].mean() + v[-k:].mean()) / 2
    return "lento-rapido-lento" if centro > 1.6 * max(puntas, 1e-6) else "constante"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mp4")
    ap.add_argument("t0", type=float)
    ap.add_argument("t1", type=float)
    ap.add_argument("--roi", default="0,0,1,1")
    ap.add_argument("--umbral", type=int, default=26)
    ap.add_argument("--tinta", help="#RRGGBB del trazo; sin él se mide diferencia contra el cuadro base")
    ap.add_argument("--tol", type=int, default=70)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    roi = [float(v) for v in a.roi.split(",")]
    w, h, fps = probe(a.mp4)
    fr = cuadros(a.mp4, a.t0, a.t1, roi, w, h, bool(a.tinta))
    if len(fr) < 4:
        sys.exit("ventana demasiado corta")
    if a.tinta:
        ref = np.array([int(a.tinta.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)], np.int32)
        masc = np.sqrt(((fr - ref) ** 2).sum(axis=3)) < a.tol      # cuadro × alto × ancho
        tinta = np.clip(masc.mean(axis=(1, 2)) - masc[0].mean(), 0, None)
        fr = masc.astype(np.int32) * 255                             # para "hierve": cambia la forma, no el fondo
    else:
        base = fr[0]
        tinta = np.array([(np.abs(f - base) > a.umbral).mean() for f in fr])
    # Meseta: el nivel más alto que se sostiene ≥ 6 cuadros (la anotación ya dibujada y quieta).
    suave = np.array([np.median(tinta[i:i + 6]) for i in range(len(tinta) - 5)]) if len(tinta) > 8 else tinta
    meseta = float(suave.max())
    if meseta < 0.002:
        sys.exit("no hay tinta nueva en la zona (revisa --roi, t0 y --umbral)")
    i0 = int(np.argmax(tinta >= 0.05 * meseta))
    i1 = int(np.argmax(tinta >= 0.95 * meseta))
    prog = np.clip(tinta[i0:i1 + 1] / meseta, 0, 1)
    cambios = [i for i in range(i0 + 1, i1 + 1) if abs(tinta[i] - tinta[i - 1]) > 0.01 * meseta]
    pasos = np.diff(cambios) if len(cambios) > 2 else np.array([1])
    # Permanencia: hasta que la tinta cae a la mitad o salta a más del doble (corte o barrido).
    fin = len(tinta)
    for i in range(i1 + 1, len(tinta)):
        if tinta[i] < 0.5 * meseta or tinta[i] > 2.2 * meseta:
            fin = i
            break
    quieto = fr[i1 + 2: min(fin, i1 + 32)]
    hierve = bool(len(quieto) > 6 and np.mean([(np.abs(x - y) > a.umbral).mean() for x, y in zip(quieto, quieto[1:])])
                  > 0.06 * meseta)
    dur_s = (i1 - i0) / fps
    r = {
        "fps": round(fps, 3), "roi": roi, "base_s": a.t0, "modo": f"color {a.tinta} ±{a.tol}" if a.tinta else "diferencia",
        "inicio_s": round(a.t0 + i0 / fps, 3), "fin_s": round(a.t0 + i1 / fps, 3),
        "dur_s": round(dur_s, 3), "dur_f30": round(dur_s * 30, 1), "dur_cuadros_nativos": i1 - i0,
        "forma": forma(list(prog)), "paso_cuadros": int(np.median(pasos)),
        "tinta_pct_zona": round(meseta * 100, 2),
        "permanece_s": round((fin - i1) / fps, 3), "permanencia_cortada_por_ventana": fin == len(tinta),
        "hierve": hierve,
        "avance": [round(float(p), 2) for p in prog],
    }
    if a.json:
        print(json.dumps(r, ensure_ascii=False))
    else:
        for k, v in r.items():
            print(f"{k}: {v}")


if __name__ == "__main__":
    main()
