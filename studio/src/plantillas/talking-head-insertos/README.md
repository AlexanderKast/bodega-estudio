# Plantilla-TalkingHeadInsertos

Familia `talking-head-insertos` del lote 2026-11-08 (`referentes/lote-2026-11-08.md`). Se replica la técnica
(ritmo, subtítulos, insertos, composición), no el material: textos y media son props.

- **Archivo:** `TalkingHeadInsertos.tsx` · export `talkingHeadInsertos` · id `Plantilla-TalkingHeadInsertos`
- **Formatos:** `vertical` (9:16)
- **Duración:** `max(fin de la voz, fin del último inserto) + segundosCola`. Con los defaults, 33,4 s.
- **Compartido:** `comun.tsx` (palabras de Whisper, tiempos de ejemplo, panel de maqueta) también lo usan
  `split-stack` y `tutorial-pasos`.

## De qué viene

| Variante | Video | Qué cambia |
| --- | --- | --- |
| `pantalla-pasos` | tiktok-7701672067120368948 | acento #E8774C; subtítulo al 50 %; la captura va en panel arriba (3–48 %) con burbuja del presentador y subtítulo a su derecha al 76 %; zoom digital `arrive` 10 f; solo las `claves` van en chip |
| `insertos-pecho` | tiktok-7702620779518643478 | acento #E27B58; subtítulo al 70 % de 2 palabras con las claves en MAYÚSCULAS; la captura flota sobre el pecho; insertos entran por desenfoque (18 f `arriveSoft`); punch con zoom de 4 f |
| `pill-fija` | tiktok-7698456660611796231 | chip #6B3FE0 en cada golpe (la palabra más larga); subtítulo al 68 %; corte seco 1,0 ↔ 1,12; captura a pantalla completa con zoom largo `glide` de 54 f |
| `cortes-rapidos` | tiktok-7690371798784871701 | rojo #D93A4A; subtítulo al 75 % de 2 palabras; punch 1,1 en cada golpe; captura a pantalla completa con corte seco y zoom `snap` de 5 f |

No se copió: footage, voces, textos, sitios ni marcas de los creadores; teléfonos flotando (AI-31), halo del carrusel
(AI-23), tarjetas idénticas (AI-26), rayos a intervalo fijo (AI-11), subtítulo sin animación (AI-03).

## Props

| Prop | Tipo | Qué hace |
| --- | --- | --- |
| `variante` | enum | una por video de origen (tabla de arriba) |
| `media` | ruta/URL | video del presentador **con su voz** (suena); vacío = silueta de maqueta |
| `palabras` | `[{word, start, end}]` en segundos | voz de Whisper; se pasan a cuadros por dentro |
| `claves` | `string[]` | palabras que van en chip (en `insertos-pecho`, también en mayúsculas) |
| `pill` | texto | promesa fija arriba (3–4 palabras); se retira cuando un inserto ocupa la parte de arriba |
| `golpes` | `number[]` (s) | punch-in: los impares cierran (escala de la variante), los pares vuelven a 1 |
| `insertos[]` | objeto | `tipo` (`captura`/`carrusel`), `at` y `duracion` en s, `media`, `titulo`, `paso` (0 = sin chip), `zonas[]` (`x,y,w,h` en 0–1 de la captura, `en` s desde que entra, `nota`), `tarjetas[]` (carrusel) |
| `segundosCola` | número | aire después del último evento |
| `colores` | `{fondo, texto, acento}` | vacío = la paleta de la variante |

## Render

```bash
# en el VPS de Bodega o en este equipo (render pesado); media dentro de studio/public/
npx remotion render src/index.ts Plantilla-TalkingHeadInsertos-vertical out/th.mp4 --props=props.json
```

Las palabras salen del JSON de Whisper (`verbose_json` con palabras). Se aplanan a `{word, start, end}` y se pegan
en `palabras` (es la misma salida de `loadWords()` de `lib/cues.ts`):

```bash
jq '[.segments[].words[] | {word, start, end}]' whisper.json > palabras.json
jq --slurpfile w palabras.json '.palabras = $w[0]' props.json > props.final.json
```

Los `at` de los insertos y los `golpes` se toman de esas mismas palabras (el segundo en que se dice "paso", la
palabra del remate), no a ojo.

```json
{
  "variante": "insertos-pecho",
  "media": "clientes/acme/selfie.mp4",
  "palabras": [{ "word": "Nadie", "start": 0.3, "end": 0.58 }, { "word": "te", "start": 0.63, "end": 0.86 }],
  "claves": ["magia", "prompt", "estilos"],
  "pill": "Tu video en dos pasos",
  "golpes": [1.9, 4.6, 8.1, 12.4],
  "insertos": [
    {
      "tipo": "captura", "at": 7.9, "duracion": 9.4, "media": "clientes/acme/pantalla-1.mp4",
      "titulo": "Elige una referencia", "paso": 1,
      "zonas": [{ "x": 0.26, "y": 0.2, "w": 0.45, "h": 0.42, "en": 1.4, "nota": "Copia el prompt" }],
      "tarjetas": []
    },
    {
      "tipo": "carrusel", "at": 22.4, "duracion": 4.6, "media": "", "titulo": "El mismo clip · 3 estilos",
      "paso": 0, "zonas": [], "tarjetas": ["Editorial", "Kinético", "Papel"]
    }
  ],
  "segundosCola": 1.2,
  "colores": {}
}
```
