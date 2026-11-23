# Créditos e inspiración

Bodega Estudio parte de Master Motion (MIT, Alexander Cast; ver `UPSTREAM.md`).

Master Motion es un proyecto de **Alexander Cast (El Master IA)**, construido con estructura, código, base de
conocimiento y método propios. El código del repositorio se publica bajo licencia MIT a su nombre (`LICENSE`).
Nos apoyamos en el trabajo de otras personas, y lo reconocemos aquí.

## Inspiración

- **Motion Architect**, de Enrique Rocha ([github.com/Hainrixz/motion-architect](https://github.com/Hainrixz/motion-architect), MIT).
  Fue el punto de partida del concepto: un agente de Claude Code que hace motion graphics con Remotion a partir de
  referencias y marca. Master Motion se reconstruyó con estructura propia. No conserva código, textos ni recursos
  de ese repositorio, salvo los efectos de sonido CC0 de terceros listados abajo.
  y montaje con ffmpeg, que se integraron en `skills/`.
- **16 referentes en video** analizados en `referentes/` (fichas con autor y enlace). De ellos se tomaron métodos y
  criterios, nunca piezas, textos ni código.
- **Educadores y fuentes de la base de conocimiento:** cada archivo de `kb/` lista sus fuentes, con URL y fecha.

## Herramientas que usa (no incluidas en el repositorio)

| Herramienta | Licencia | Nota |
|---|---|---|
| [Remotion](https://www.remotion.dev) | Remotion License | Gratis para personas y empresas de hasta 3 personas; las empresas más grandes necesitan una licencia de empresa. Quien use Master Motion debe cumplir esa licencia. **Bodega de Belleza, como empresa de más de 3 personas, necesita la Company License de Remotion para usar este estudio** (remotion.pro). |
| [HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen) | Apache 2.0 | Segundo motor de render (HTML + GSAP) |
| [GSAP](https://gsap.com) | Licencia estándar de GSAP | Con HyperFrames |
| [Blender](https://www.blender.org) | GPL | Se usa como programa; las escenas y renders son propios |
| [earshot](https://github.com/Leonxlnx/earshot) (Leon Lin) | MIT | Genera en código el banco de SFX de `studio/public/sfx-db` |
| [@kumoproductions/mcp-aftereffects](https://github.com/kumoproductions/mcp-aftereffects) | MIT | Puente opcional con After Effects |
| [lottie-web](https://github.com/airbnb/lottie-web) | MIT | Dependencia npm |
| [Caveat](https://fonts.google.com/specimen/Caveat) (Impallari Type) | OFL 1.1 | Letra manuscrita de las pieles marcador y tiza del kit de anotación (vía `@remotion/google-fonts`) |
| [NumPy](https://numpy.org) y [SciPy](https://scipy.org) | BSD-3-Clause | Flujo óptico de `scripts/critica/` (Lucas-Kanade propio); ya estaban instalados en el VPS de Bodega o en este equipo |
| [FLUX.2 klein 4B](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B) (Black Forest Labs) | Apache 2.0 | Generación con imagen de referencia |
| [BiRefNet](https://github.com/ZhengPeng7/BiRefNet) (Peng Zheng y otros) | MIT | Quita el fondo en `scripts/assets/recortar.py` |
| [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) 5.3 con datos `spa` y `eng` | Apache-2.0 | Cuenta las palabras en pantalla para el hold de lectura (L-01) en `scripts/critica/`; instalado en el VPS de Bodega o en este equipo el 2026-11-10 |

## Material de terceros incluido

### Efectos de sonido

- `studio/public/sfx/{casino,impact,interface,ui}`: [Kenney](https://kenney.nl), CC0 (dominio público).
- `studio/public/sfx/keyboard`: *Keyboard Soundpack #1*, de unicae_games ([opengameart.org](https://opengameart.org)), CC0.
- `studio/public/sfx-db/`: sonidos renderizados con earshot, generados en código, del commit `4ac3d2a`.
  Licencia MIT, Copyright (c) 2026 Leon Lin:

```
MIT License

Copyright (c) 2026 Leon Lin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Fuentes

Space Grotesk, Inter y JetBrains Mono, de Google Fonts (SIL Open Font License 1.1). Se cargan al renderizar con
`@remotion/google-fonts`; no están copiadas en el repositorio.

Instrument Serif (itálica), de Instrument, en Google Fonts (SIL Open Font License 1.1): la usa el preset
`TypeSandwich` para la palabra de acento. Se carga igual, con `@remotion/google-fonts`.

Anton, de Vernon Adams, en Google Fonts (SIL Open Font License 1.1): la usan las plantillas
`Plantilla-CollageImpacto`, `Plantilla-AntesDespues` y `Plantilla-ShowcaseDispositivo` para la condensada de impacto.
Playfair Display, de Claus Eggers Sørensen, en Google Fonts (SIL Open Font License 1.1): serif de las plantillas
`Plantilla-AntesDespues` y `Plantilla-ShowcaseDispositivo`. Ambas se cargan con `@remotion/google-fonts`.

| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) con modelos Whisper de OpenAI | MIT | Transcripción local (`scripts/voz/whisper_local.py`) |
