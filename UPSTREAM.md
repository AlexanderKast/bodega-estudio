# Origen

Bodega Estudio parte de una copia de **Master Motion** (repo privado `AlexanderKast/master-motion`, MIT a nombre de
Alexander Cast), commit `6505cae278d262fae0830345776b94bb61459613` (2026-11-17, v0.2.1). No es un fork vivo: las
mejoras de Master Motion se traen a mano, revisando que no reintroduzcan rutas o marca de otros proyectos.

Qué se quitó de la copia:
- Blender, After Effects, ComfyUI (`scripts/assets/`), ACE-Step (`scripts/musica/`), Pinterest, datamosh y la voz
  temporal con Kokoro: dependían del servidor de IA Master Tech y no se entregan a Bodega.
- Las demos, referentes, voces y marca de El Master IA, y la plantilla `glosario-hibrido`.
- El pipeline de videos de apps (skills `video-director`, `kinetic-type`, `video-assembly` y
  `tutorial-voice-captions`): dependía de Blender y de la grabación de apps, y traía material de otro cliente. Si F4
  necesita alinear guion con ASR, se porta `tutorial-voice-captions/scripts/captions.py` sin sus ejemplos.
- Los videos y miniaturas del catálogo (se regeneran con la marca de Bodega: `node scripts/catalogo.mjs --miniaturas --videos`).

Qué cambió:
- La ejecución pesada va por `scripts/host.sh` según `estudio.config.json` (`local` o `vps`).
- Whisper corre con faster-whisper en el equipo (`scripts/voz/whisper_local.py`), en CPU si no hay GPU.
- La marca es la de Bodega de Belleza (`studio/src/marca/`).

Para traer un cambio de Master Motion: `git -C <clon de master-motion> log 6505cae..` y aplicar a mano archivo por
archivo; después `node scripts/verify.mjs` y `git grep -n -i "servidor-casa\|/srv/data\|el master ia\|effix"` sin resultados.
