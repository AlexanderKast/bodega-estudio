#!/usr/bin/env python3
"""Prueba del medidor con un clip sintético de errores conocidos (NumPy + ffmpeg, ~10 s de cómputo).

    python3 scripts/critica/prueba-sintetica.py [--flujo lk|farneback]

Genera 12 s a 540×960 con: un bloque que cruza a velocidad constante (AI-01), el mismo recorrido con
ease-out (no debe marcarse), tres bloques separados que arrancan en el mismo cuadro con rumbos distintos
(AI-02), 3 s de cuadro congelado (D-01 y AI-08), un bloque que va rápido y frena de un cuadro al siguiente
(V-01), todo el contenido desapareciendo en un cuadro (V-02) y un final sin hold (AI-44). Sale 1 si el
medidor no encuentra exactamente eso.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np

W, H, FPS, DUR = 540, 960, 30, 12.0
rng = np.random.default_rng(7)
TEX = (rng.random((90, 150)) > 0.5).astype(np.uint8) * 200 + 40   # bloque con textura tipo texto


def ease_out(t):
    return 1 - (1 - t) ** 3


def pos(t, t0, t1, a, b, curva=lambda x: x):
    if t <= t0:
        return a
    if t >= t1:
        return b
    return a + (b - a) * curva((t - t0) / (t1 - t0))


def cuadro(i):
    t = i / FPS
    img = np.full((H, W), 24, np.float32)
    frenazo = pos(t, 8.5, 8.5 + 8 / FPS, 360, 200) if t < 8.5 + 8 / FPS else pos(t, 8.5 + 8 / FPS, 9.1, 200, 185)
    bloques = [
        (pos(t, 0.5, 1.5, 20, 360), 80),                                  # lineal
        (frenazo if t >= 8.5 else pos(t, 2.5, 3.3, 20, 360, ease_out), 250),   # ease-out; luego frena en un cuadro
        (pos(t, 4.0, 4.6, 20, 200, ease_out), 430),                       # tres a la vez, rumbos distintos
        (pos(t, 4.0, 4.6, 370, 190, ease_out), 640),
        (190, pos(t, 4.0, 4.6, 860, 780, ease_out)),
    ]
    if t >= 10.0:                                                         # todo desaparece en un cuadro
        bloques = []
    if t > 11.2:                                                          # termina moviéndose: sin hold final
        bloques = [(pos(t, 11.2, 11.9, 20, 300, ease_out), 80)]
    for b in bloques:
        if b is None:
            continue
        x, y = b
        x0, y0 = int(round(x)), int(round(y))
        img[y0:y0 + 90, x0:x0 + 150] = TEX
    img += rng.normal(0, 3, img.shape)                                    # grano
    return np.clip(img, 0, 255).astype(np.uint8)


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    conservar = sys.argv[sys.argv.index("--conservar") + 1] if "--conservar" in sys.argv else None
    motor = sys.argv[sys.argv.index("--flujo") + 1] if "--flujo" in sys.argv else "auto"
    aqui = os.path.dirname(os.path.abspath(__file__))
    with tempfile.TemporaryDirectory() as tmp:
        mp4 = os.path.join(tmp, "sintetico.mp4")
        p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}",
                              "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", mp4],
                             stdin=subprocess.PIPE)
        for i in range(int(DUR * FPS)):
            p.stdin.write(cuadro(i).tobytes())
        p.stdin.close()
        p.wait()
        out = os.path.join(tmp, "out")
        r = subprocess.run([sys.executable, os.path.join(aqui, "medir_pieza.py"), mp4, "--out", out,
                            "--genre", "explainer", "--flujo", motor], capture_output=True, text=True, encoding="utf-8")
        print(r.stdout, r.stderr[-2000:] if r.returncode else "")
        med = json.load(open(os.path.join(out, "medicion.json"), encoding="utf-8"))
        if conservar:   # deja el clip y la salida para mirarlos
            import shutil
            shutil.copytree(tmp, conservar, dirs_exist_ok=True)
    h = med["hallazgos"]

    def hay(id_, desde, hasta, nivel="warning"):
        return any(x["id"] == id_ and x["nivel"] == nivel and desde <= x["t_s"] <= hasta for x in h)

    pruebas = {
        "AI-01 en el cruce lineal (0,5 s)": hay("AI-01", 0.3, 0.7),
        "sin AI-01 en el ease-out (2,5 s)": not hay("AI-01", 2.3, 3.5),
        "un solo AI-01 en toda la pieza": sum(1 for x in h if x["id"] == "AI-01") == 1,
        "AI-02 en los tres arranques (4,0 s)": hay("AI-02", 3.9, 4.1),
        "D-01 en el hueco de 3 s": hay("D-01", 4.0, 5.0),
        "AI-08 cuadro congelado": hay("AI-08", 4.0, 5.0),
        "AI-44 sin hold final": hay("AI-44", 10.5, 12.0, "info"),
        "V-01 en el frenazo (8,77 s)": hay("V-01", 8.6, 8.9, "info"),
        "sin V-01 en los ease-out": sum(1 for x in h if x["id"] == "V-01") == 1,
        "V-02 en la salida en seco (10,0 s)": hay("V-02", 9.9, 10.1),
        "una sola V-02": sum(1 for x in h if x["id"] == "V-02") == 1,
        "el ease-out se clasifica ease-out": any(m["forma"] == "ease-out" and 2.4 <= m["t_ini_s"] <= 2.6 for m in med["movimientos"]),
    }
    for nombre, ok in pruebas.items():
        print(("ok    " if ok else "FALLA ") + nombre)
    print(f"prueba-sintetica ({med['metodo_flujo']}): {sum(pruebas.values())}/{len(pruebas)}")
    sys.exit(0 if all(pruebas.values()) else 1)


if __name__ == "__main__":
    main()
