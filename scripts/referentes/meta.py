"""Resume la metadata de cada referente: canal, duración, capítulos, descripción y enlaces citados.

  python3 scripts/referentes/meta.py [carpeta=trabajo/referentes] > meta.txt
"""
import glob
import json
import re
import sys

base = sys.argv[1] if len(sys.argv) > 1 else "trabajo/referentes"
for f in sorted(glob.glob(f"{base}/*/*.info.json")):
    d = json.load(open(f))
    desc = d.get("description") or ""
    enlaces = sorted(set(re.findall(r"https?://[^\s)\]>\"]+", desc)))
    print(f"\n##### {d['id']} · {d.get('channel')} · {d.get('title')}")
    print(f"vistas {d.get('view_count')} · subido {d.get('upload_date')} · {round((d.get('duration') or 0) / 60, 1)} min")
    for c in (d.get("chapters") or [])[:30]:
        s = int(c["start_time"])
        print(f"  [{s // 60}:{s % 60:02d}] {c['title']}")
    print("DESCRIPCIÓN:", re.sub(r"\n+", " ⏎ ", desc))
    print("ENLACES:")
    for e in enlaces:
        print("  ", e)
