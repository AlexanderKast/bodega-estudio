"""Transcribe un audio con faster-whisper (MIT) en este computador, sin servidor.

    python scripts/voz/whisper_local.py <audio> <salida.json> [--modelo medium] [--idioma es]
           [--dispositivo auto|cpu|cuda] [--precision int8|float16]

Escribe el mismo verbose_json que devolvía la API de Whisper: { text, language, duration, segments, words }
con tiempos por palabra en segundos, que es lo que lee scripts/voz/palabras.mjs.
En CPU usa int8 (un minuto de audio con `medium` tarda alrededor de un minuto en un CPU de 8 hilos; `small`
es unas 3 veces más rápido y un poco menos preciso). Si hay CUDA y dispositivo=auto, la usa sola.
La primera vez descarga el modelo a la caché de Hugging Face (~1,5 GB para medium).
"""
import argparse
import json
import sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("salida")
    ap.add_argument("--modelo", default="medium")
    ap.add_argument("--idioma", default="es")
    ap.add_argument("--dispositivo", default="auto")
    ap.add_argument("--precision", default="int8")
    ap.add_argument("--vad", action="store_true", help="filtra silencios con Silero antes de transcribir")
    a = ap.parse_args()
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("Falta faster-whisper: pip install faster-whisper (ver /bodega-doctor)", file=sys.stderr)
        return 2
    disp = a.dispositivo
    if disp == "auto":
        try:
            import ctranslate2

            disp = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
        except Exception:
            disp = "cpu"
    prec = a.precision if disp == "cpu" else ("float16" if a.precision == "int8" else a.precision)
    modelo = WhisperModel(a.modelo, device=disp, compute_type=prec)
    # El audio se decodifica con ffmpeg (16 kHz mono float32) y no con PyAV: las versiones nuevas de PyAV
    # rompen la API que usa faster-whisper y ffmpeg ya es requisito del estudio.
    import subprocess

    import numpy as np

    pcm = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", a.audio, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        check=True,
        capture_output=True,
    ).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    segs, info = modelo.transcribe(audio, language=a.idioma or None, word_timestamps=True, vad_filter=a.vad, beam_size=5)
    segmentos, palabras = [], []
    for s in segs:
        ws = [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3), "probability": round(w.probability, 3)} for w in (s.words or [])]
        palabras += ws
        segmentos.append({"id": s.id, "start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip(), "words": ws})
    datos = {
        "text": " ".join(s["text"] for s in segmentos).strip(),
        "language": info.language,
        "duration": round(info.duration, 3),
        "modelo": f"faster-whisper {a.modelo} ({disp}, {prec})",
        "segments": segmentos,
        "words": palabras,
    }
    with open(a.salida, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)
    print(f"whisper {a.modelo} en {disp}: {len(palabras)} palabras, {info.duration:.1f} s -> {a.salida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
