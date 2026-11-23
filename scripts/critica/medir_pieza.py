#!/usr/bin/env python3
"""Mide un render propio: lo que se ve moverse, no lo que el código dice que se mueve.

    python3 scripts/critica/medir_pieza.py <render.mp4> [--genre explainer] [--nombre pieza]
            [--out carpeta] [--referente carpeta-o-medicion.json] [--flujo auto|lk|farneback] [--estricto]

Normalmente se llama con medir-pieza.sh (que también sabe correrlo en el VPS de Bodega o en este equipo). Deja en la carpeta
de salida (por defecto studio/out/critica/<pieza>/):

  medicion.json        todo lo medido (abajo) + lo que ya mide scripts/referentes/medir.py (cortes, ritmo,
                       ráfagas por plano, golpes de audio)
  contactos.jpg        hoja de contactos de toda la pieza con el tiempo en cada celda
  tiras/corte_NN.jpg   ±0,5 s alrededor de cada corte, a fps completo (de medir.py)
  tiras/hallazgo_NN.jpg  los cuadros del tramo de cada hallazgo
  estados/estado_NN.jpg  un cuadro de cada llegada de contenido, las que menos duran primero (para contar palabras)
  lado-a-lado.jpg      con --referente: 8 momentos de la pieza arriba y los mismos del referente abajo

Qué detecta (ids de kb/10 §6; todo es estimación por flujo óptico: si la tira lo contradice, gana la tira):
  AI-01  movimiento lineal: velocidad constante de punta a punta
  V-01   frenada en seco: termina a más del 70 % de su velocidad máxima, o cae a menos del 35 % de un
         cuadro al siguiente yendo rápido (info)
  V-02   salida en seco: el contenido de media pantalla o más desaparece en un solo cuadro, sin salida
  AI-02  tres o más grupos separados arrancan en el mismo cuadro
  D-01   hueco sin ningún evento nuevo por encima del umbral del género
  AI-08  cuadro congelado (sin deriva) más de 2 s
  AI-09  más de 30 px/f: confirmar en la tira que lleva motion blur (info)
  L-01   contenido que llega y se va antes del hold de lectura (readingHold de studio/src/lib/motion.ts)
  AI-44  hold final de menos de 1,5 s (info)

Dependencias: ffmpeg, NumPy y SciPy (ya están en el VPS de Bodega o en este equipo). Opcionales, NO instaladas al 2026-11-10 y
pendientes del OK de IA Master Tech antes de instalarlas (anotar en CREDITOS.md si se aprueban):
  - opencv-python-headless (Apache-2.0): activa Farnebäck con --flujo farneback; probado en el PC con
    OpenCV 5.0, da los mismos hallazgos que el motor propio en prueba-sintetica.py.
Con `tesseract` en el PATH (tesseract-ocr + tesseract-ocr-spa, Apache-2.0; instalado en el VPS de Bodega o en este equipo el
2026-11-10 con el OK de IA Master Tech) L-01 cuenta las palabras nuevas de cada llegada, por zona, y pasa a
warning. Sin él, L-01 es info y las palabras las cuenta el crítico en estados/. El OCR falla con texto
muy pequeño o a medio revelar: el crítico confirma en el still.

Límites conocidos: no ve movimiento dentro de un color plano, bajo una cámara que no para lo que llega no
abre un movimiento propio, los giros y escalas en el sitio salen sin rumbo, y un flash o un glitch puede
dar picos de velocidad falsos. Por eso cada hallazgo lleva su tira.
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, "..", "referentes"))
sys.path.insert(0, AQUI)
import flujo  # noqa: E402
import medir as ref  # noqa: E402  (scripts/referentes/medir.py)

UMBRAL_V = 1.5        # px/f a 1080: por debajo es deriva o push lento, no un evento
RAPIDO = 30.0         # px/f a 1080 (kb/10 AI-09)
CONGELADO_S = 2.0     # kb/10 AI-08: 60 f a 30 fps
HOLD_FINAL_S = 1.5    # kb/10 AI-44
MAX_TIRAS = 24
MAX_ESTADOS = 60


def umbrales_genero():
    """Los de D-01 en scripts/motion-audit.mjs; la copia de abajo solo se usa si ese archivo no está."""
    por_defecto = {"anuncio": 1.0, "explainer": 2.5, "vsl": 2.0, "talking": 3.0}
    try:
        src = open(os.path.join(AQUI, "..", "motion-audit.mjs"), encoding="utf-8").read()
        cuerpo = re.search(r"GENRE_GAP\s*=\s*\{([^}]*)\}", src).group(1)
        return {k: float(v) for k, v in re.findall(r"(\w+)\s*:\s*([\d.]+)", cuerpo)} or por_defecto
    except (OSError, AttributeError):
        return por_defecto


def reading_hold_s(palabras):
    """readingHold de studio/src/lib/motion.ts (kb/02 §3), en segundos."""
    return max(1.0, 0.4 + palabras / 3.5)


def tramos(activo, min_len=3, puente=1):
    """Tramos [a, b] de True, uniendo cortes de hasta `puente` cuadros."""
    out, a, ultimo = [], None, None
    for i, x in enumerate(activo):
        if x:
            if a is None:
                a = i
            elif i - ultimo > puente + 1:
                out.append((a, ultimo))
                a = i
            ultimo = i
    if a is not None:
        out.append((a, ultimo))
    return [(a, b) for a, b in out if b - a + 1 >= min_len]


def forma(nucleo):
    n, pico = len(nucleo), max(nucleo)
    ini, fin = nucleo[0] / pico, nucleo[-1] / pico
    cv = float(np.std(nucleo) / np.mean(nucleo))
    if n < 4:
        f = "golpe"
    elif n >= 6 and cv < 0.22 and ini >= 0.6 and fin >= 0.6:
        f = "lineal"
    else:
        pos = int(np.argmax(nucleo)) / (n - 1)
        f = "ease-out" if pos <= 0.35 else ("ease-in" if pos >= 0.65 else "ease-in-out")
    return f, round(ini, 2), round(fin, 2), round(cv, 2)


def partir_por_giro(trs, v, dx, dy, min_len=3):
    """Parte un tramo donde el rumbo de la zona se invierte y se queda invertido: ahí entró otro objeto."""
    out = []
    for a, b in trs:
        ini, previo = a, None
        for i in range(a, b + 1):
            if v[i] <= 0 or np.hypot(dx[i], dy[i]) < 0.3 * v[i]:
                continue
            u = np.array([dx[i], dy[i]]) / np.hypot(dx[i], dy[i])
            sigue = i + 1 > b or (dx[i + 1] * previo[0] + dy[i + 1] * previo[1] < 0 if previo is not None else False)
            if previo is not None and float(u @ previo) < -0.3 and sigue and i - ini >= min_len:
                out.append((ini, i - 1))
                ini = i
            previo = u
        out.append((ini, b))
    return [(a, b) for a, b in out if b - a + 1 >= min_len]


def movimientos(fl, fps, cortes_f):
    """Une los tramos por zona en movimientos: zonas vecinas, a la vez y con el mismo rumbo."""
    v, dx, dy = fl["v"], fl["dx"], fl["dy"]
    F, filas, cols = v.shape
    segs = []
    for f in range(filas):
        for c in range(cols):
            for a, b in partir_por_giro(tramos(v[:, f, c] >= UMBRAL_V), v[:, f, c], dx[:, f, c], dy[:, f, c]):
                vec = np.array([dx[a:b + 1, f, c].sum(), dy[a:b + 1, f, c].sum()])
                segs.append({"z": (f, c), "a": a, "b": b, "vec": vec, "tray": float(v[a:b + 1, f, c].sum())})
    segs.sort(key=lambda s: s["a"])
    padre = list(range(len(segs)))

    def rumbo(s, desde):
        """Vector unitario de la zona en 3 cuadros desde `desde`; None si tiembla o gira en el sitio."""
        r = slice(max(s["a"], min(desde, s["b"] - 2)), min(desde, s["b"] - 2) + 3)
        f, c = s["z"]
        vec = np.array([dx[r, f, c].mean(), dy[r, f, c].mean()])
        n = np.linalg.norm(vec)
        return None if n < 0.3 * v[r, f, c].mean() else vec / n

    def raiz(i):
        while padre[i] != i:
            padre[i] = padre[padre[i]]
            i = padre[i]
        return i

    for i, s in enumerate(segs):
        for j in range(i + 1, len(segs)):
            t = segs[j]
            if t["a"] > s["b"] + 1:
                break
            if abs(s["z"][0] - t["z"][0]) > 1 or abs(s["z"][1] - t["z"][1]) > 1:
                continue
            # Rumbo de cada zona en los primeros cuadros en que coinciden (no el neto: dos objetos que se
            # cruzan dentro de una zona la dejarían sin rumbo y uniría a los dos).
            o = max(s["a"], t["a"])
            vs, vt = rumbo(s, min(o, s["b"])), rumbo(t, o)
            if vs is None or vt is None:
                unir = abs(s["a"] - t["a"]) <= 1          # sin rumbo claro: solo si arrancan juntas
            else:
                unir = float(vs @ vt) >= 0.3
            if unir:
                padre[raiz(j)] = raiz(i)
    grupos = {}
    for i, s in enumerate(segs):
        grupos.setdefault(raiz(i), []).append(s)
    out = []
    for g in grupos.values():
        a, b = min(s["a"] for s in g), max(s["b"] for s in g)
        zonas = sorted({s["z"] for s in g})
        zi = tuple(np.array(zonas).T)
        serie = v[:, zi[0], zi[1]].max(axis=1)
        nucleo = [float(x) for x in serie[a:b + 1]]
        ini_pad = a
        while ini_pad > max(0, a - 2) and ini_pad not in cortes_f:
            ini_pad -= 1
        fin_pad = min(F - 1, b + 2)
        f_, ini, fin, cv = forma(nucleo)
        vec = sum(s["vec"] for s in g)
        activas = (v[a:b + 1][:, zi[0], zi[1]] >= UMBRAL_V).sum(axis=1).max()
        out.append({
            "a": a, "b": b, "t_ini_s": round(a / fps, 3), "t_fin_s": round((b + 1) / fps, 3), "frames": b - a + 1,
            "zonas": [list(z) for z in zonas], "global": bool(activas >= 0.6 * filas * cols),
            "direccion_grados": round(math.degrees(math.atan2(-vec[1], vec[0]))) % 360,
            "pico_px_f": round(max(nucleo), 1), "recorrido_px": round(sum(nucleo)),
            "forma": f_, "ini_rel": ini, "fin_rel": fin, "cv": cv,
            "termina_en_corte": any(x in cortes_f for x in range(b + 1, b + 4)),
            "curva_desde_f": ini_pad, "curva": [round(float(x), 1) for x in serie[ini_pad:fin_pad + 1]],
        })
    out.sort(key=lambda m: (m["a"], -len(m["zonas"])))
    for i, m in enumerate(out, 1):
        m["id"] = i
    return out


def coherente(grupo, fl):
    """¿El arranque de todos esos grupos se explica con un solo movimiento (traslación + zoom + giro)?

    Ajusta una semejanza de 4 parámetros a los vectores de las zonas: si el residuo es bajo, es la cámara,
    una transición o un solo objeto que escala, no varias entradas independientes.
    """
    A, Y = [], []
    for m in grupo:
        for f, c in m["zonas"]:
            s = slice(m["a"], min(m["a"] + 4, m["b"] + 1))
            A += [[1.0, 0.0, c, -f], [0.0, 1.0, f, c]]
            Y += [fl["dx"][s, f, c].mean(), fl["dy"][s, f, c].mean()]
    A, Y = np.array(A), np.array(Y)
    sol = np.linalg.lstsq(A, Y, rcond=None)[0]
    return bool(np.linalg.norm(A @ sol - Y) / (np.linalg.norm(Y) + 1e-6) < 0.35)


def zona_mini(fl, f, c):
    h, w = fl["mini"].shape[1:]
    return (slice(round(f * h / fl["filas"]), round((f + 1) * h / fl["filas"])),
            slice(round(c * w / fl["cols"]), round((c + 1) * w / fl["cols"])))


def lectura(fl, fps, activo_z, cortes_f):
    """Cuánto dura en pantalla lo que llega a cada zona, desde que se asienta hasta que cambia o se va.

    Por zona: cada vez que queda quieta con contenido nuevo se sigue su "tinta" (los píxeles que se
    despegan del fondo) comparando cada cuadro con el de 0,2 s antes; el contenido se da por ido cuando
    más de la mitad de la tinta cambia en ese lapso, o cuando ya no queda tinta. Así una deriva o un push
    lento no lo cortan, y un texto al que se le suma otra línea sigue contando. Las llegadas del mismo
    cuadro (±2 f) se juntan en una. Sin OCR no se sabe si es texto ni cuántas palabras tiene: eso lo
    cuenta el crítico en el still.
    """
    mini = fl["mini"]
    F, llegadas, paso = len(mini), [], max(2, round(0.2 * fps))

    def tinta_de(img):
        return np.abs(img - np.median(img)) > 24

    def distinto(cur, ref):
        """Píxeles que cambian aunque se permita correr la imagen ±1 px (un asentamiento o una deriva no cuentan)."""
        d = np.abs(cur - ref)
        for sy in (-1, 0, 1):
            for sx in (-1, 0, 1):
                if sy or sx:
                    d = np.minimum(d, np.abs(np.roll(cur, (sy, sx), axis=(-2, -1)) - ref))
        return d > 24

    for f in range(fl["filas"]):
        for c in range(fl["cols"]):
            z = zona_mini(fl, f, c)
            quieta = ~activo_z[:, f, c]
            for x in cortes_f:
                if x < F:
                    quieta[x] = False
            fin_previo = None
            for a, b in tramos(quieta, min_len=4, puente=0):
                base = mini[a][z].astype(np.int16)
                tinta = tinta_de(base)
                antes, fin_previo = fin_previo, b
                if tinta.mean() < 0.02:
                    continue
                if antes is not None:
                    vieja = mini[antes][z].astype(np.int16)
                    tinta_vieja = tinta_de(vieja)
                    igual = tinta_vieja.any() and distinto(base, vieja)[tinta_vieja].mean() < 0.5
                    if igual and (tinta & ~tinta_vieja).sum() < 0.3 * tinta.sum():
                        continue                  # es lo mismo que ya estaba: no es una llegada nueva
                hasta = min(F, a + int(12 * fps))
                if hasta - a <= paso + 1:
                    continue
                serie = mini[a:hasta, z[0], z[1]].astype(np.int16)
                ref, cur = serie[:-paso], serie[paso:]
                tin = np.abs(ref - np.median(ref, axis=(1, 2), keepdims=True)) > 24
                n = tin.sum(axis=(1, 2))
                ido = (n < 0.01 * tinta.size) | ((distinto(cur, ref) & tin).sum(axis=(1, 2)) > 0.5 * np.maximum(n, 1))
                llegadas.append((a, (f, c), (int(np.argmax(ido)) + paso if ido.any() else hasta - a) / fps,
                                 not ido.any() and hasta == F))
    llegadas.sort()
    grupos = []
    for L in llegadas:
        if grupos and L[0] - grupos[-1][0][0] <= 2:
            grupos[-1].append(L)
        else:
            grupos.append([L])
    return [{"a": g[0][0], "t_s": round(g[0][0] / fps, 3), "permanencia_s": round(float(np.median([x[2] for x in g])), 2),
             "permanencia_min_s": round(min(x[2] for x in g), 2), "hasta_el_final": all(x[3] for x in g),
             "zonas": [list(x[1]) for x in g]} for g in grupos]


def ff(args):
    return subprocess.run(["ffmpeg", "-v", "error", "-y", *args], capture_output=True, check=False).returncode == 0


def tira(mp4, destino, t0, dur, fps, vertical):
    """Mosaico de los cuadros de [t0, t0+dur] (máx. 40 celdas). Devuelve cómo leerlo."""
    t0 = max(0.0, t0)
    n = max(1, round(dur * fps))
    paso = math.ceil(n / 40)
    celdas = math.ceil(n / paso)
    cols = 8 if vertical else 6
    vf = f"select='not(mod(n\\,{paso}))',scale={180 if vertical else 240}:-2,tile={cols}x{math.ceil(celdas / cols)}:padding=2"
    ff(["-ss", f"{t0:.3f}", "-i", mp4, "-t", f"{dur:.3f}", "-an", "-vf", vf, "-frames:v", "1", destino])
    return {"archivo": os.path.relpath(destino, os.path.dirname(os.path.dirname(destino))).replace("\\", "/"),
            "desde_s": round(t0, 3), "paso_s": round(paso / fps, 4), "columnas": cols, "celdas": celdas}


def contactos(mp4, destino, dur, vertical):
    paso = max(0.5, round(dur / 48, 2))
    celdas, cols = math.ceil(dur / paso), 8
    base = f"fps=1/{paso},scale={180 if vertical else 240}:-2"
    cola = f",tile={cols}x{math.ceil(celdas / cols)}:padding=2"
    reloj = ",drawtext=text='%{pts\\:hms}':fontsize=13:fontcolor=white:box=1:boxcolor=black@0.6:x=3:y=3"
    con_tiempo = ff(["-i", mp4, "-an", "-vf", base + reloj + cola, "-frames:v", "1", destino])
    if not con_tiempo:
        ff(["-i", mp4, "-an", "-vf", base + cola, "-frames:v", "1", destino])
    return {"archivo": "contactos.jpg", "paso_s": paso, "columnas": cols, "celdas": celdas, "tiempo_en_celda": con_tiempo}


def ocr_cajas(jpg):
    """Palabras del cuadro con su posición relativa (x, y en 0–1), con `tesseract` (Apache-2.0). None si no hay."""
    if not shutil.which("tesseract"):
        return None
    r = subprocess.run(["tesseract", jpg, "stdout", "-l", "spa+eng", "--psm", "11", "tsv"], capture_output=True, check=False)
    if r.returncode != 0:
        return None
    ancho = alto = None
    out = []
    for linea in r.stdout.decode("utf-8", "replace").splitlines()[1:]:
        c = linea.split("\t")
        if len(c) < 12:
            continue
        if c[0] == "1":
            ancho, alto = float(c[8]), float(c[9])
        texto = c[11].strip()
        if c[0] == "5" and ancho and float(c[10]) >= 50 and re.fullmatch(r"[^\W\d_]{2,}[.,:;!?]?|\d[\d.,%]*", texto):
            out.append((texto.lower().strip(".,:;!?"), (float(c[6]) + float(c[8]) / 2) / ancho, (float(c[7]) + float(c[9]) / 2) / alto))
    return out


def metricas(m):
    r, out = m.get("ritmo", {}), {}
    for k in ("cortes_10s", "plano_medio_s", "plano_mediana_s"):
        if k in r:
            out[k] = r[k]
    a = m.get("audio", {})
    out["cortes_en_golpe_pct"], out["bpm_estimado"] = a.get("cortes_en_golpe_pct"), a.get("bpm_estimado")
    fm = m.get("formas_movimiento", {})
    tot = sum(v for k, v in fm.items() if k != "quieto") or 1
    for k in ("ease-out", "ease-in-out", "ease-in", "constante", "golpe"):
        out[f"rafagas_{k}_pct"] = round(100 * fm.get(k, 0) / tot)
    out.update({f"flujo_{k}": v for k, v in m.get("resumen", {}).items() if isinstance(v, (int, float))})
    return out


def comparar(med, ruta_ref, mp4, salida, vertical):
    carpeta = ruta_ref if os.path.isdir(ruta_ref) else os.path.dirname(ruta_ref)
    archivo = os.path.join(ruta_ref, "medicion.json") if os.path.isdir(ruta_ref) else ruta_ref
    r = json.load(open(archivo, encoding="utf-8"))
    mp, mr = metricas(med), metricas(r)
    filas = [{"metrica": k, "pieza": mp[k], "referente": mr.get(k),
              "delta": round(mp[k] - mr[k], 2) if isinstance(mp[k], (int, float)) and isinstance(mr.get(k), (int, float)) else None}
             for k in mp]
    out = {"referente": r.get("id"), "medicion_referente": archivo, "metricas": filas,
           "nota": "rafagas_* salen de medir.py en ambos (misma vara). flujo_* solo se compara si el referente "
                   "también se midió con medir-pieza.sh; si falta, mídelo: medir-pieza.sh <referente.mp4> --nombre ref-<id>."}
    video = next((p for p in (os.path.join(carpeta, f"{r.get('id')}.mp4"), r.get("archivo") or "") if p and os.path.exists(p)), None)
    if video:
        n = 8
        cw, ch = (180, 320) if vertical else (320, 180)
        tmp = []
        for k, (v, d) in enumerate(((mp4, med["duracion_s"]), (video, r["duracion_s"]))):
            t = os.path.join(salida, f"_lado{k}.jpg")
            ff(["-i", v, "-an", "-vf", f"fps={n}/{d:.3f},scale={cw}:{ch}:force_original_aspect_ratio=decrease,"
                f"pad={cw}:{ch}:(ow-iw)/2:(oh-ih)/2,tile={n}x1:padding=2", "-frames:v", "1", t])
            tmp.append(t)
        if ff(["-i", tmp[0], "-i", tmp[1], "-filter_complex", "vstack", os.path.join(salida, "lado-a-lado.jpg")]):
            out["lado_a_lado"] = {"archivo": "lado-a-lado.jpg", "celdas": n,
                                  "lectura": "arriba la pieza, abajo el referente; cada columna es la misma fracción de la duración"}
        for t in tmp:
            if os.path.exists(t):
                os.remove(t)
    return out


def main():
    ap = argparse.ArgumentParser(description="Mide un render del estudio (flujo óptico por zonas).")
    ap.add_argument("mp4")
    ap.add_argument("--out")
    ap.add_argument("--nombre")
    ap.add_argument("--genre", choices=sorted(umbrales_genero()))
    ap.add_argument("--referente")
    ap.add_argument("--flujo", default="auto", choices=["auto", "lk", "farneback"])
    ap.add_argument("--estricto", action="store_true", help="sale 1 si hay warnings")
    a = ap.parse_args()
    for flujo_salida in (sys.stdout, sys.stderr):   # consola de Windows en cp1252
        flujo_salida.reconfigure(encoding="utf-8", errors="replace")

    mp4 = a.mp4
    pieza = a.nombre or os.path.splitext(os.path.basename(mp4))[0]
    salida = a.out or os.path.join(AQUI, "..", "..", "studio", "out", "critica", pieza)
    for d in ("tiras", "estados"):
        shutil.rmtree(os.path.join(salida, d), ignore_errors=True)
        os.makedirs(os.path.join(salida, d))

    # 1. Lo que ya mide medir.py sobre referentes.
    fps, dur, w, h, tiene_audio = ref.probe(mp4)
    vertical = h > w
    cs = [t for t in ref.cortes(mp4) if 0.05 < t < dur - 0.05]
    bordes = [0.0] + cs + [dur]
    planos = [round(y - x, 3) for x, y in zip(bordes, bordes[1:])]
    e = ref.energia(mp4, w, h)
    fr = [round(t * fps) for t in bordes]
    por_plano = [{"desde_s": round(bordes[k], 3), "hasta_s": round(bordes[k + 1], 3), "dur_s": planos[k],
                  "movimiento": ref.rafagas(e, fr[k], min(fr[k + 1], len(e)), fps)} for k in range(len(planos))]
    gs = ref.golpes(mp4) if tiene_audio else []
    en_golpe = sum(1 for t in cs if any(abs(t - g) <= 2 / fps for g in gs))
    inter = sorted(y - x for x, y in zip(gs, gs[1:]) if 0.25 < y - x < 1.5)
    formas_r = {}
    for p in por_plano:
        for r in p["movimiento"]:
            formas_r[r["forma"]] = formas_r.get(r["forma"], 0) + 1
    ref.tiras(mp4, salida, cs, fps)
    ordenados = sorted(planos)

    # 2. Flujo óptico por zonas.
    cortes_f = {round(t * fps) for t in cs}
    fl = flujo.medir(mp4, w, h, cortes_f, a.flujo, lambda i: print(f"  flujo: cuadro {i}", file=sys.stderr))
    F = len(fl["v"])
    movs = movimientos(fl, fps, cortes_f)
    # Movimiento por zona solo si dura 3 cuadros o más: un parpadeo suelto del códec no rompe un hold.
    mov_z = np.zeros(fl["v"].shape, bool)
    for f in range(fl["filas"]):
        for c in range(fl["cols"]):
            for x, y in tramos(fl["v"][:, f, c] >= UMBRAL_V):
                mov_z[x:y + 1, f, c] = True
    activo_z = mov_z | fl["fund"]
    activo = activo_z.any(axis=(1, 2))
    for c in cortes_f:
        if c < F:
            activo[c] = True
    quietos = [(x, y) for x, y in tramos(~activo, min_len=4, puente=0)]

    hall = []

    def anotar(id_, nivel, t0, t1, msg, **extra):
        hall.append({"id": id_, "nivel": nivel, "t_s": round(t0, 2), "t_fin_s": round(t1, 2), "msg": msg, **extra})

    nz = fl["filas"] * fl["cols"]
    fund_zonas = fl["fund"].sum(axis=(1, 2))

    # V-02: salida en seco. Tinta = píxeles que se despegan del fondo de su zona; si la mitad o más de las
    # zonas con contenido se vacían de un cuadro al siguiente, la escena no tuvo salida.
    tinta = np.zeros(fl["v"].shape, np.float32)
    for f in range(fl["filas"]):
        for c in range(fl["cols"]):
            z = zona_mini(fl, f, c)
            serie = fl["mini"][:, z[0], z[1]].astype(np.int16)
            tinta[:, f, c] = (np.abs(serie - np.median(serie, axis=(1, 2), keepdims=True)) > 24).mean(axis=(1, 2))
    salidas, ultimo = [], -10
    for t in range(1, F):
        con = tinta[t - 1] >= 0.02
        vaciadas = con & (tinta[t] <= 0.4 * tinta[t - 1])
        se_fue = tinta[t].sum() <= 0.5 * tinta[t - 1].sum()        # desaparece, no solo cambia de zona
        barrido = (fl["v"][t - 1] >= UMBRAL_V).sum() >= 0.5 * nz     # un whip o una cortina sí es una salida
        if se_fue and not barrido and con.sum() >= 2 and vaciadas.sum() >= max(2, 0.5 * con.sum()) and t - ultimo > 3:
            vacios = 0
            while t + vacios < F and tinta[t + vacios].max() < 0.02:
                vacios += 1
            salidas.append({"t_s": round(t / fps, 3), "zonas": int(vaciadas.sum()), "de": int(con.sum()), "cuadros_vacios": vacios})
            anotar("V-02", "warning", t / fps, (t + max(vacios, 1)) / fps,
                   f"Salida en seco en {t / fps:.2f} s: {int(vaciadas.sum())} de {int(con.sum())} zonas con contenido se vacían en un cuadro"
                   + (f" y quedan {vacios} cuadros vacíos" if vacios else "") + ". Dale salida escalonada o una transición.")
            ultimo = t

    # AI-01 / V-01 / AI-09
    def sale_o_lo_tapan(m):
        """El movimiento termina porque el elemento desaparece o porque una transición global lo pisa."""
        zi = tuple(np.array(m["zonas"]).T)
        se_va = fl["fund"][m["b"]:m["b"] + 4][:, zi[0], zi[1]].any()
        return bool(se_va) or any(g["global"] and g["a"] <= m["b"] + 3 and g["b"] >= m["b"] for g in movs if g is not m)

    rapidos, frenazos = [], []
    for m in movs:
        donde = f"{m['t_ini_s']:.2f}–{m['t_fin_s']:.2f} s"
        if m["forma"] == "lineal" and m["pico_px_f"] >= 6 and m["recorrido_px"] >= 60:
            anotar("AI-01", "warning", m["t_ini_s"], m["t_fin_s"],
                   f"Movimiento lineal en {donde}: ~{m['pico_px_f']} px/f constantes durante {m['frames']} f "
                   f"(arranca al {round(m['ini_rel'] * 100)} % y frena al {round(m['fin_rel'] * 100)} % del pico). Ponle curva del kit.",
                   movimiento=m["id"])
        elif (m["forma"] != "lineal" and m["fin_rel"] >= 0.7 and m["frames"] >= 6 and m["pico_px_f"] >= 8
              and not m["termina_en_corte"] and not sale_o_lo_tapan(m)):
            anotar("V-01", "info", m["t_ini_s"], m["t_fin_s"],
                   f"Frenada en seco en {m['t_fin_s']:.2f} s: termina al {round(m['fin_rel'] * 100)} % de su velocidad máxima "
                   "y el elemento sigue a la vista. Le falta frenar.", movimiento=m["id"])
        else:
            # Frenazo a mitad de curva: iba rápido y en un cuadro queda a menos del 35 % (un ease-out fuerte
            # del kit baja a ~42 % por cuadro), y se queda lento. No cuenta si ahí cambia la escena.
            cv_, ini = m["curva"], m["curva_desde_f"]
            zi_m = tuple(np.array(m["zonas"]).T)
            for k in range(len(cv_) - 2):
                f0 = ini + k
                if (cv_[k] >= max(20.0, 0.6 * m["pico_px_f"]) and cv_[k + 1] <= 0.35 * cv_[k] and cv_[k + 2] <= 0.5 * cv_[k]
                        and fl["fund"][f0:f0 + 3][:, zi_m[0], zi_m[1]].any(axis=0).mean() < 0.5 and not any(x in cortes_f for x in (f0, f0 + 1, f0 + 2))):
                    frenazos.append((cv_[k], f0, cv_[k + 1], m["id"]))
                    break
        cambia_escena = fund_zonas[max(0, m["a"] - 1):m["b"] + 2].max() >= 0.33 * nz
        if not m["global"] and not cambia_escena and sum(1 for x in m["curva"] if x > RAPIDO) >= 3:
            rapidos.append(m)
    # Solo los 5 más fuertes: una máscara que termina de revelar o un contador también dan frenazo.
    for antes, f0, despues, mid in sorted(frenazos, reverse=True)[:5]:
        anotar("V-01", "info", f0 / fps, (f0 + 2) / fps,
               f"Frenazo en {(f0 + 1) / fps:.2f} s: pasa de {antes} a {despues} px/f en un cuadro. Si es un objeto a la vista "
               "(no una máscara que termina de revelar), alarga la frenada o asiéntalo con un spring.", movimiento=mid)
    for m in sorted(rapidos, key=lambda m: -m["pico_px_f"])[:5]:
        anotar("AI-09", "info", m["t_ini_s"], m["t_fin_s"],
               f"Pico de {m['pico_px_f']} px/f en {m['t_ini_s']:.2f}–{m['t_fin_s']:.2f} s (3 cuadros o más sobre {RAPIDO:.0f} px/f): "
               "confirma en la tira que lleva motion blur.", movimiento=m["id"])

    # AI-02: arranques en el mismo cuadro
    simult, i = [], 0
    while i < len(movs):
        g = [m for m in movs[i:] if m["a"] - movs[i]["a"] <= 1]
        if len(g) >= 3 and not any(m["global"] for m in g):
            una_camara = coherente(g, fl)
            simult.append({"t_s": g[0]["t_ini_s"], "grupos": len(g), "movimientos": [m["id"] for m in g],
                           "zonas": sum(len(m["zonas"]) for m in g), "un_solo_vector": una_camara})
            t1 = min(g[0]["t_ini_s"] + 0.6, max(m["t_fin_s"] for m in g))
            if fund_zonas[max(0, g[0]["a"] - 2):g[0]["a"] + 3].max() >= 0.5 * nz:
                anotar("AI-02", "info", g[0]["t_ini_s"], t1,
                       f"{len(g)} grupos arrancan en {g[0]['t_ini_s']:.2f} s junto a un flash o un cambio de escena: "
                       "suele ser un solo efecto de golpe. Confirma en la tira.")
            elif una_camara:
                anotar("AI-02", "info", g[0]["t_ini_s"], t1,
                       f"{len(g)} grupos separados arrancan en {g[0]['t_ini_s']:.2f} s con el mismo vector: es un movimiento "
                       "de cámara o una transición, o son entradas sin escalonar. Confirma en la tira.")
            else:
                anotar("AI-02", "warning", g[0]["t_ini_s"], t1,
                       f"{len(g)} grupos separados arrancan en el mismo cuadro ({g[0]['t_ini_s']:.2f} s) con rumbos distintos: escalona 2–5 f.")
        i += len(g)

    # D-01 / AI-08 / AI-44: huecos sin eventos nuevos y cuadro muerto
    fund_ini = [x for x, _ in tramos(fl["fund"].any(axis=(1, 2)), min_len=1, puente=1)]
    # Evento nuevo: arranca un movimiento, un fundido, un plano, o se asienta contenido nuevo en una zona
    # (bajo una cámara que no para, lo que llega no abre un movimiento propio).
    lect = lectura(fl, fps, activo_z, cortes_f)
    eventos = sorted({m["a"] for m in movs} | set(fund_ini) | {c for c in cortes_f if c < F} | {L["a"] for L in lect})
    hold_final = (quietos[-1][1] - quietos[-1][0] + 1) / fps if quietos and quietos[-1][1] >= F - 2 else 0.0
    umbral = umbrales_genero().get(a.genre) if a.genre else None
    huecos = []
    for x, y in zip([0] + eventos, eventos + [F]):
        if y - x < 0.5 * fps:
            continue
        dentro = [(qa, qb) for qa, qb in quietos if qa >= x and qb <= y]
        qa, qb = max(dentro, key=lambda q: q[1] - q[0]) if dentro else (x, x)
        cambio = float(np.abs(fl["mini"][qb].astype(np.int16) - fl["mini"][qa]).mean()) if qb > qa else 0.0
        huecos.append({"desde_s": round(x / fps, 2), "hasta_s": round(y / fps, 2), "hueco_s": round((y - x) / fps, 2),
                       "quieto_s": round((qb - qa + 1) / fps, 2) if dentro else 0.0, "deriva": cambio > 0.4,
                       "es_hold_final": y >= F - 0.2 * fps})
    for hc in huecos:
        if hc["es_hold_final"]:
            continue
        congelado = hc["quieto_s"] >= CONGELADO_S and not hc["deriva"]
        if umbral and hc["hueco_s"] > umbral:
            anotar("D-01", "warning", hc["desde_s"], hc["hasta_s"],
                   f"{hc['hueco_s']} s sin ningún evento nuevo desde {hc['desde_s']} s (máximo {umbral} s para {a.genre}); "
                   f"{hc['quieto_s']} s de eso con el cuadro quieto{'' if hc['deriva'] else ' y sin deriva'}.")
        if congelado:
            anotar("AI-08", "warning", hc["desde_s"], hc["hasta_s"],
                   f"Cuadro congelado {hc['quieto_s']} s desde {hc['desde_s']} s: ni deriva ni push de cámara.")
    if hold_final < HOLD_FINAL_S:
        anotar("AI-44", "info", max(0, dur - 1), dur, f"Hold final de {hold_final:.2f} s (se piden 1,5–2,5 s más cola de audio).")

    # L-01: cuánto dura en pantalla lo que llega a cada zona
    hay_ocr = bool(shutil.which("tesseract"))
    candidatas = sorted((L for L in lect if not L["hasta_el_final"]), key=lambda L: L["permanencia_s"])[:MAX_ESTADOS]
    vigentes = {}                                     # (palabra, zona) -> hasta qué segundo sigue en pantalla
    cortas = 0
    for k, L in enumerate(sorted(candidatas, key=lambda L: L["a"]), 1):
        jpg = os.path.join(salida, "estados", f"estado_{k:02d}.jpg")
        lado = "540:-2" if vertical else "-2:540"
        ff(["-ss", f"{L['t_s'] + 2 / fps:.3f}", "-i", mp4, "-an", "-vf", f"scale={lado}", "-frames:v", "1", jpg])
        L["still"] = f"estados/estado_{k:02d}.jpg"
        cajas = ocr_cajas(jpg) if hay_ocr else None
        if cajas is None:
            L["palabras"] = None
        else:
            # Solo cuentan las palabras que caen en las zonas de esta llegada y que no venían de una anterior.
            zonas = {tuple(z) for z in L["zonas"]}
            nuevas = []
            for texto, x, y in cajas:
                z = (min(fl["filas"] - 1, int(y * fl["filas"])), min(fl["cols"] - 1, int(x * fl["cols"])))
                if z in zonas and vigentes.get((texto, z), -1) < L["t_s"]:
                    nuevas.append(texto)
                    vigentes[(texto, z)] = L["t_s"] + L["permanencia_s"]
            L["palabras"], L["texto"] = len(nuevas), " ".join(nuevas)
        L["hold_minimo_s"] = round(reading_hold_s(L["palabras"] or 1), 2)
        if L["permanencia_s"] < L["hold_minimo_s"] - 1 / fps:
            if (L["palabras"] or 0) >= 2:             # una palabra suelta suele ser un resto del OCR
                anotar("L-01", "warning", L["t_s"], L["t_s"] + L["permanencia_s"],
                       f"{L['palabras']} palabras («{L['texto'][:60]}») en pantalla {L['permanencia_s']} s desde {L['t_s']} s: "
                       f"el hold de lectura es {L['hold_minimo_s']} s.", still=L["still"])
            elif L["palabras"] is None and cortas < 6:
                cortas += 1
                anotar("L-01", "info", L["t_s"], L["t_s"] + L["permanencia_s"],
                       f"Lo que llega en {L['t_s']} s cambia a los {L['permanencia_s']} s: si es texto, no alcanza ni el mínimo de 1 s. "
                       f"Mira {L['still']}.", still=L["still"])

    orden = {"warning": 0, "info": 1}
    hall.sort(key=lambda x: (orden[x["nivel"]], x["t_s"]))
    for k, x in enumerate(hall[:MAX_TIRAS], 1):
        t0 = x["t_s"] - 0.2
        x["tira"] = tira(mp4, os.path.join(salida, "tiras", f"hallazgo_{k:02d}.jpg"), t0, min(4.0, x["t_fin_s"] - t0 + 0.3), fps, vertical)

    nucleos = [m for m in movs if m["frames"] >= 4]
    cuenta = {}
    for m in nucleos:
        cuenta[m["forma"]] = cuenta.get(m["forma"], 0) + 1
    tot = len(nucleos) or 1
    warnings = sum(1 for x in hall if x["nivel"] == "warning")
    resumen = {
        "movimientos": len(movs), "eventos_10s": round(len(eventos) / dur * 10, 1),
        "lineal_pct": round(100 * cuenta.get("lineal", 0) / tot), "ease_out_pct": round(100 * cuenta.get("ease-out", 0) / tot),
        "ease_in_out_pct": round(100 * cuenta.get("ease-in-out", 0) / tot), "ease_in_pct": round(100 * cuenta.get("ease-in", 0) / tot),
        "duracion_mediana_f30": round(float(np.median([m["frames"] for m in nucleos])) * 30 / fps, 1) if nucleos else 0,
        "pico_mediano_px_f": round(float(np.median([m["pico_px_f"] for m in nucleos])), 1) if nucleos else 0,
        "quieto_pct": round(100 * float((~activo).mean())), "hueco_max_s": max((x["hueco_s"] for x in huecos if not x["es_hold_final"]), default=0),
        "hold_final_s": round(hold_final, 2), "arranques_simultaneos": len(simult), "salidas_en_seco": len(salidas), "frenazos": len(frenazos), "warnings": warnings, "info": len(hall) - warnings,
    }
    med = {
        "id": pieza, "archivo": os.path.abspath(mp4), "fps": round(fps, 3), "duracion_s": round(dur, 3), "ancho": w, "alto": h,
        "formato": "9:16" if h > w * 1.5 else ("1:1" if abs(h - w) < w * 0.1 else ("4:5" if h > w else "16:9")),
        "genero": a.genre, "umbral_hueco_s": umbral,
        "metodo_flujo": {"farneback": f"Farnebäck (OpenCV {getattr(flujo.cv2, '__version__', '')})",
                         "lk": "Lucas-Kanade piramidal denso (NumPy/SciPy)"}[fl["motor"]],
        "unidades": "velocidades en px por cuadro normalizados a 1080 px de lado corto; zonas como [fila, columna] desde arriba-izquierda",
        "grilla": {"columnas": fl["cols"], "filas": fl["filas"]},
        "ocr": "tesseract" if hay_ocr else None,
        "resumen": resumen, "hallazgos": hall,
        "movimientos": [{k: v for k, v in m.items() if k not in ("a", "b")} for m in movs],
        "arranques_simultaneos": simult, "salidas_en_seco": salidas, "huecos": huecos, "lectura": [{k: v for k, v in L.items() if k != "a"} for L in lect],
        "contactos": contactos(mp4, os.path.join(salida, "contactos.jpg"), dur, vertical),
        "cortes_s": cs,
        "ritmo": {"cortes": len(cs), "cortes_10s": round(len(cs) / dur * 10, 1), "plano_medio_s": round(sum(planos) / len(planos), 2),
                  "plano_mediana_s": ordenados[len(ordenados) // 2], "min_s": ordenados[0], "max_s": ordenados[-1], "planos_s": planos},
        "planos": por_plano, "formas_movimiento": formas_r,
        "audio": {"golpes_s": gs, "bpm_estimado": round(60 / inter[len(inter) // 2]) if inter else None, "cortes_en_golpe": en_golpe,
                  "cortes_en_golpe_pct": round(100 * en_golpe / len(cs)) if cs else 0},
        "velocidad_max_por_frame": [round(float(x), 1) for x in fl["v"].max(axis=(1, 2))],
        "zonas_activas_por_frame": [int(x) for x in (fl["v"] >= UMBRAL_V).sum(axis=(1, 2))],
        "zonas_en_fundido_por_frame": [int(x) for x in fl["fund"].sum(axis=(1, 2))],
        "energia_por_frame": e,
        "nota": "Estimación por flujo óptico: fundidos y cambios de color no cuentan como desplazamiento. Si la tira contradice un hallazgo, gana la tira.",
    }
    if a.referente:
        med["comparacion"] = comparar(med, a.referente, mp4, salida, vertical)
    with open(os.path.join(salida, "medicion.json"), "w", encoding="utf-8") as f:
        json.dump(med, f, ensure_ascii=False)

    for x in hall:
        print(f"{x['nivel'].ljust(7)} {x['id'].ljust(6)} {x['msg']}")
    print(f"medir-pieza {pieza}: {len(movs)} movimientos ({fl['motor']}) · {cuenta} · {warnings} warnings · "
          f"{len(hall) - warnings} info · {os.path.normpath(os.path.join(salida, 'medicion.json'))}")
    sys.exit(1 if a.estricto and warnings else 0)


if __name__ == "__main__":
    main()
