# Plantilla-TutorialPasos

Familia `tutorial-pasos` del lote 2026-11-08 (`referentes/lote-2026-11-08.md`): tarjeta "PASO N" entre secciones,
screencast en marco con zoom a región y cursor, y resultado final con zoom-out. Se replica la técnica, no el material.

- **Archivo:** `TutorialPasos.tsx` · export `tutorialPasos` · id `Plantilla-TutorialPasos`
- **Formatos:** `vertical` (9:16) y `horizontal` (16:9)
- **Duración:** `segundosIntro + Σ (tarjeta + segundos del paso) + resultado.segundos`, con la tarjeta escalada por
  el ritmo de la variante (pizarra ×1, movil ×0,7). Con los defaults: 34,3 s (pizarra) y 32,5 s (movil).
  Las palabras que pasen del final se recortan.
- Usa `../talking-head-insertos/comun.tsx` (palabras de Whisper y paneles de maqueta).

## De qué viene

| Variante | Video | Qué cambia |
| --- | --- | --- |
| `pizarra` | n50KkoucMpU (16:9) | marco azul #2F52A0 con filete claro alrededor de todo; tarjeta de pizarra #1E2022 con madera #C9A978 y subrayado #F28C28 que crece en 18 f; grabación de escritorio 16:9; zoom `move` 24 f con anotación rectangular; solo las `claves` van en chip |
| `movil` | tHzfsCsWL6M (9:16) | sin marco, fondo #050607; tarjetas 30 % más cortas con flash #F08A24 de 5 f; grabación de móvil 9:16 (en 16:9 va a la izquierda y el paso en grande a la derecha); zoom `arrive` 14 f con círculo a mano; resultado con flash y temblor de 6 px que decae |

No se copió: grabaciones, prompts, clips de IA de relleno, clips de películas, voces ni marcas de los canales; el
glow cian del título (AI-23), la barra de export lineal (AI-01), el estrobo constante (AI-12) y los 9 min de largo.

## Props

| Prop | Tipo | Qué hace |
| --- | --- | --- |
| `variante` | enum | una por video de origen |
| `titulo` | `string[]` | titular de apertura; `*palabra*` va en serif itálica (TypeSandwich) |
| `etiqueta` | texto | rótulo chico de la apertura ("Tutorial · 3 pasos") |
| `segundosIntro` / `segundosTarjeta` | número | largo de la apertura y de cada tarjeta PASO N |
| `pasos[]` | objeto | `titulo`, `segundos` del screencast, `media` (grabación), `zonas[]` (`x,y,w,h` en 0–1 de la grabación, `en` s desde que arranca el screencast, `nota`). El cursor hace clic en cada zona después del zoom; al cerrar el paso hay zoom-out automático |
| `resultado` | `{media, texto, segundos}` | plano final con zoom-out 1,3 → 1,0 en 40 f y temblor que se apaga |
| `voz` | ruta/URL | voz en off (audio); vacío = sin audio |
| `palabras` | `[{word, start, end}]` en s | subtítulo con chip en la palabra clave |
| `claves` | `string[]` | palabras que siempre van en chip |
| `colores` | `{fondo, texto, acento}` | vacío = paleta de la variante |

## Render

```bash
npx remotion render src/index.ts Plantilla-TutorialPasos-horizontal out/tutorial.mp4 --props=props.json
npx remotion render src/index.ts Plantilla-TutorialPasos-vertical out/tutorial-v.mp4 --props=props.json
```

Palabras desde Whisper sobre la misma pista de `voz`:

```bash
jq '[.segments[].words[] | {word, start, end}]' whisper.json > palabras.json
jq --slurpfile w palabras.json '.palabras = $w[0]' props.json > props.final.json
```

Para que las tarjetas caigan en la voz: `segundosIntro` = segundo en que se dice el primer "paso"; los `segundos` de
cada paso = (inicio del siguiente "paso" − inicio de este − segundosTarjeta).

```json
{
  "variante": "pizarra",
  "titulo": ["Tu primer video", "*con IA*"],
  "etiqueta": "Tutorial",
  "segundosIntro": 6,
  "segundosTarjeta": 2,
  "pasos": [
    {
      "titulo": "Busca una referencia", "segundos": 8.2, "media": "clientes/acme/paso1.mp4",
      "zonas": [{ "x": 0.05, "y": 0.1, "w": 0.3, "h": 0.36, "en": 0.7, "nota": "Galería" }]
    },
    { "titulo": "Genera los clips", "segundos": 5.2, "media": "clientes/acme/paso2.mp4", "zonas": [] }
  ],
  "resultado": { "media": "clientes/acme/final.mp4", "texto": "Hecho en una tarde", "segundos": 4.8 },
  "voz": "clientes/acme/voz.wav",
  "palabras": [{ "word": "Hoy", "start": 0.3, "end": 0.5 }],
  "claves": ["referencia", "clips"],
  "colores": {}
}
```
