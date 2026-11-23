#!/usr/bin/env python3
"""Flujo óptico por zonas sobre un render: velocidad real (no la del código) cuadro a cuadro.

Lo usa medir_pieza.py. Dos motores, el mismo resultado por zona:
  - Farnebäck de OpenCV, si `cv2` está instalado (no lo está en el VPS de Bodega o en este equipo al 2026-11-10).
  - Lucas-Kanade piramidal denso escrito con NumPy + SciPy (lo que sí hay en el servidor).

El video se lee con ffmpeg en gris y reducido a 480 px de lado largo. Las velocidades salen en
px por cuadro **normalizados a 1080 px de lado corto**, para que los umbrales de la KB (30 px/f de
kb/10 AI-09) valgan igual con un render a 540p o a 1080p.

Por cada par de cuadros y cada zona de la grilla:
  v      percentil 90 de la magnitud del flujo entre los píxeles que se mueven (0 si casi nada se mueve)
  dx,dy  vector medio de esos píxeles
  cob    fracción de la zona que se mueve
  fund   la zona cambia sin desplazarse (fundido, cambio de color, aparición en seco)
"""
import subprocess

import numpy as np

try:
    import cv2
except ImportError:  # el servidor no lo tiene: se usa el motor de NumPy
    cv2 = None
try:
    from scipy import ndimage as ndi
except ImportError:
    ndi = None

LADO = 480        # lado largo de la imagen de trabajo
TAU_T = 5.0       # cambio mínimo de un píxel entre cuadros (0–255) para contarlo; deja fuera el grano
MAG_MIN = 0.25    # px de trabajo: por debajo no es desplazamiento
LAMBDA = 30.0     # regularización de Lucas-Kanade (zonas sin textura no inventan flujo)
FUND_GRANDE = 0.03   # fracción de una zona que cambia sin moverse: evento aunque dure un cuadro
FUND_CHICO = 0.012   # ídem, pero solo cuenta si se sostiene 3 cuadros


def dimensiones(w, h):
    if w >= h:
        return LADO, max(2, int(round(LADO * h / w / 2)) * 2)
    return max(2, int(round(LADO * w / h / 2)) * 2), LADO


def grilla(w, h):
    """(columnas, filas): zonas más o menos cuadradas, 24 en 9:16 y 16:9, 25 en 1:1."""
    r = h / w
    if r > 1.3:
        return 4, 6
    if r < 0.77:
        return 6, 4
    return 5, 5


def cuadros(mp4, W, H):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", mp4, "-an", "-vf",
                          f"scale={W}:{H}:flags=area,format=gray", "-f", "rawvideo", "-"],
                         stdout=subprocess.PIPE)
    n = W * H
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(H, W)
    p.stdout.close()
    p.wait()


def _suave(img):
    f = img.astype(np.float32)
    if cv2 is not None:
        return cv2.blur(f, (3, 3))
    return ndi.uniform_filter(f, 3)


def _piramide(img, niveles):
    p = [img]
    for _ in range(niveles - 1):
        a = p[-1]
        h, w = a.shape[0] // 2 * 2, a.shape[1] // 2 * 2
        if h < 16 or w < 16:
            break
        a = a[:h, :w]
        p.append((a[0::2, 0::2] + a[1::2, 0::2] + a[0::2, 1::2] + a[1::2, 1::2]) * 0.25)
    return p


def _subir(f, h, w):
    g = np.repeat(np.repeat(f, 2, axis=0), 2, axis=1) * 2
    if g.shape[0] < h or g.shape[1] < w:
        g = np.pad(g, ((0, max(0, h - g.shape[0])), (0, max(0, w - g.shape[1]))), mode="edge")
    return np.ascontiguousarray(g[:h, :w])


_MALLAS = {}


def _malla(h, w):
    if (h, w) not in _MALLAS:
        _MALLAS[(h, w)] = np.mgrid[0:h, 0:w].astype(np.float32)
    return _MALLAS[(h, w)]


def lucas_kanade(a, b, niveles=4, ventana=11, iteraciones=2):
    """Flujo denso a→b (a(x) ≈ b(x+u)). Devuelve u, v, textura (traza del tensor) y residuo tras alinear."""
    pa, pb = _piramide(a, niveles), _piramide(b, niveles)
    u = v = None
    for A, B in zip(pa[::-1], pb[::-1]):
        h, w = A.shape
        if u is None:
            u, v = np.zeros((h, w), np.float32), np.zeros((h, w), np.float32)
        else:
            u, v = _subir(u, h, w), _subir(v, h, w)
        Iy, Ix = np.gradient(A)
        Sxx = ndi.uniform_filter(Ix * Ix, ventana) + LAMBDA
        Syy = ndi.uniform_filter(Iy * Iy, ventana) + LAMBDA
        Sxy = ndi.uniform_filter(Ix * Iy, ventana)
        det = Sxx * Syy - Sxy * Sxy
        yy, xx = _malla(h, w)
        for _ in range(iteraciones):
            Bw = ndi.map_coordinates(B, [yy + v, xx + u], order=1, mode="nearest")
            It = Bw - A
            Sxt = ndi.uniform_filter(Ix * It, ventana)
            Syt = ndi.uniform_filter(Iy * It, ventana)
            u = u + (-Syy * Sxt + Sxy * Syt) / det
            v = v + (Sxy * Sxt - Sxx * Syt) / det
        u, v = ndi.uniform_filter(u, 3), ndi.uniform_filter(v, 3)
    Bw = ndi.map_coordinates(B, [yy + v, xx + u], order=1, mode="nearest")
    return u, v, Sxx + Syy - 2 * LAMBDA, np.abs(Bw - A)


def farneback(a, b):
    f = cv2.calcOpticalFlowFarneback(a.astype(np.uint8), b.astype(np.uint8), None, 0.5, 4, 15, 3, 5, 1.1, 0)
    u, v = f[..., 0], f[..., 1]
    h, w = a.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    Bw = cv2.remap(b, xx + u, yy + v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    Ix, Iy = cv2.Sobel(a, cv2.CV_32F, 1, 0, ksize=3) / 8, cv2.Sobel(a, cv2.CV_32F, 0, 1, ksize=3) / 8
    return u, v, cv2.blur(Ix * Ix + Iy * Iy, (11, 11)), np.abs(Bw - a)


def metodo(preferido="auto"):
    if preferido in ("auto", "farneback") and cv2 is not None:
        return "farneback"
    if preferido == "farneback":
        raise SystemExit("Falta OpenCV (pip: opencv-python-headless, Apache-2.0). Usa --flujo lk o pide el OK para instalarlo.")
    if ndi is None:
        raise SystemExit("Faltan NumPy/SciPy (BSD-3) u OpenCV (Apache-2.0) para el flujo óptico.")
    return "lk"


def medir(mp4, w, h, cortes_f=(), motor="auto", progreso=None):
    """Recorre el video y devuelve las series por zona. `cortes_f`: cuadros donde arranca un plano nuevo."""
    motor = metodo(motor)
    W, H = dimensiones(w, h)
    cols, filas = grilla(w, h)
    k = 1080.0 / min(W, H)                     # px de trabajo → px a 1080 de lado corto
    xs = [round(c * W / cols) for c in range(cols + 1)]
    ys = [round(f * H / filas) for f in range(filas + 1)]
    cortes_f = set(cortes_f)
    V, DX, DY, COB, FUND, MINI = [], [], [], [], [], []
    prev = None
    for i, raw in enumerate(cuadros(mp4, W, H)):
        cur = _suave(raw)
        h4, w4 = H // 4 * 4, W // 4 * 4
        MINI.append(cur[:h4, :w4].reshape(h4 // 4, 4, w4 // 4, 4).mean(axis=(1, 3)).astype(np.uint8))
        v = np.zeros((filas, cols), np.float32)
        dx, dy, cob = np.zeros_like(v), np.zeros_like(v), np.zeros_like(v)
        fund = np.zeros((filas, cols), np.float32)   # fracción de la zona que cambia sin desplazarse
        if prev is not None and i not in cortes_f:
            dif = np.abs(cur - prev)
            cambia = dif > TAU_T
            if cambia.mean() > 0.0005:
                u, w_, _, res = (farneback if motor == "farneback" else lucas_kanade)(prev, cur)
                mag = np.hypot(u, w_)
                mueve = cambia & (mag >= MAG_MIN) & (res < 0.6 * dif + 2)
                aparece = (dif > 2 * TAU_T) & ~mueve       # el doble: el parpadeo del códec y el glow no son fundidos
                for f in range(filas):
                    for c in range(cols):
                        z = (slice(ys[f], ys[f + 1]), slice(xs[c], xs[c + 1]))
                        m = mueve[z]
                        n, tot = int(m.sum()), m.size
                        if n >= max(8, 0.004 * tot):
                            v[f, c] = np.percentile(mag[z][m], 90) * k
                            dx[f, c], dy[f, c] = u[z][m].mean() * k, w_[z][m].mean() * k
                            cob[f, c] = n / tot
                        ap = int(aparece[z].sum())
                        fund[f, c] = ap / tot if ap > 2 * n else 0.0
        V.append(v), DX.append(dx), DY.append(dy), COB.append(cob), FUND.append(fund)
        prev = cur
        if progreso and i % 300 == 0:
            progreso(i)
    # Fundido: un cambio grande vale con un solo cuadro (aparición en seco); uno chico (un rótulo) tiene
    # que sostenerse 3 cuadros, o el parpadeo del códec en un hold contaría como evento.
    ap = np.array(FUND)
    chico = ap >= FUND_CHICO
    sostenido = np.zeros_like(chico)
    if len(chico) >= 3:
        tres = chico[:-2] & chico[1:-1] & chico[2:]
        sostenido[:-2] |= tres
        sostenido[1:-1] |= tres
        sostenido[2:] |= tres
    fund = (ap >= FUND_GRANDE) | sostenido
    return {"v": np.array(V), "dx": np.array(DX), "dy": np.array(DY), "cob": np.array(COB),
            "fund": fund, "mini": np.array(MINI), "cols": cols, "filas": filas,
            "k": k, "motor": motor, "trabajo": [W, H]}
