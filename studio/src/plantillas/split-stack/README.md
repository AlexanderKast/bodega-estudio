# Plantilla-SplitStack

Familia `split-stack` del lote 2026-11-08 (`referentes/lote-2026-11-08.md`): gráficos, UI o B-roll arriba por
beats, presentador abajo, caption en la costura y keywords en color. Se replica la técnica, no el material.

- **Archivo:** `SplitStackPlantilla.tsx` · export `splitStack` · id `Plantilla-SplitStack`
- **Formatos:** `vertical` (9:16)
- **Duración:** `max(suma de beats, fin de la voz) + segundosCola`; el último beat se estira hasta el final.
  Con los defaults, 27,7 s.
- Usa `../talking-head-insertos/comun.tsx` (palabras de Whisper y paneles de maqueta).

## De qué viene

| Variante | Video | Qué cambia |
| --- | --- | --- |
| `infografia` | 7gMbZTdLlxs | navy #0A1F5C + amarillo #FFD60A; 50/50; caption de 2 palabras en la costura; keyword en mayúsculas; push de 4 % en el host en cada beat |
| `ai-real` | tiktok-7697333991984221462 | barra negra de 6 % con lockup de `marcas`; panel lavanda #ECEEF8 con tinta oscura; etiquetas `IA:` / `REAL:`; acento coral #E8684A; subtítulo de 1 palabra en versalitas al 82 % |
| `ugc-paneles` | zlOCQxQYnYc | pantalla 40 / presentador 60; paneles marino #103450; acento cian #3DD6F0 sin glow; paneles que se abren desde la costura; CTA final en pill (`cta`) |

No se copió: footage, voces, guiones, cifras, logos ni interfaces de los creadores; halftone y vidrio (AI-30, AI-22),
cian con glow y pill degradada, tarjetas iguales (AI-26).

## Props

| Prop | Tipo | Qué hace |
| --- | --- | --- |
| `variante` | enum | una por video de origen |
| `media` | ruta/URL | presentador (panel de abajo, con voz); vacío = silueta |
| `palabras` | `[{word, start, end}]` en s | voz de Whisper → caption con chip en la palabra clave |
| `claves` | `string[]` | palabras que siempre van en chip |
| `beats[]` | objeto | `tipo` (`dato` cifra que se cuenta · `titular` grotesca + serif itálica · `ui` captura en ventana con cursor · `broll` clip con push lento), `segundos`, `palabra` (keyword en acento), `detalle`, `valor`/`desde`/`prefijo`/`sufijo` (dato), `media` (ui, broll) |
| `marcas` | `string[]` | lockup de la barra (`ai-real`) |
| `etiquetaArriba` / `etiquetaAbajo` | texto | etiquetas de panel (`ai-real`) |
| `cta` | texto | pill final (`ugc-paneles`); vacío = sin CTA |
| `segundosCola` | número | aire al final |
| `colores` | `{fondo, texto, acento}` | vacío = paleta de la variante |

## Render

```bash
npx remotion render src/index.ts Plantilla-SplitStack-vertical out/split.mp4 --props=props.json
```

Palabras desde Whisper (`verbose_json` con palabras), aplanadas a `{word, start, end}`:

```bash
jq '[.segments[].words[] | {word, start, end}]' whisper.json > palabras.json
jq --slurpfile w palabras.json '.palabras = $w[0]' props.json > props.final.json
```

Los `segundos` de cada beat se sacan de las mismas palabras: cada beat arranca en la palabra que abre la idea.

```json
{
  "variante": "infografia",
  "media": "clientes/acme/host.mp4",
  "palabras": [{ "word": "Hace", "start": 0.3, "end": 0.56 }],
  "claves": ["flujo", "semana"],
  "beats": [
    { "tipo": "dato", "segundos": 4.9, "palabra": "Hace", "detalle": "dictar era lento", "valor": 5, "desde": 0, "prefijo": "", "sufijo": " años", "media": "" },
    { "tipo": "titular", "segundos": 3.7, "palabra": "El flujo", "detalle": "no la herramienta", "valor": 0, "desde": 0, "prefijo": "", "sufijo": "", "media": "" },
    { "tipo": "ui", "segundos": 5.2, "palabra": "Sin muletillas", "detalle": "dictado.app", "valor": 0, "desde": 0, "prefijo": "", "sufijo": "", "media": "clientes/acme/app.png" },
    { "tipo": "broll", "segundos": 3.5, "palabra": "Una semana", "detalle": "mide lo que recuperas", "valor": 0, "desde": 0, "prefijo": "", "sufijo": "", "media": "clientes/acme/oficina.mp4" }
  ],
  "marcas": ["ACME", "ESTUDIO"],
  "etiquetaArriba": "IA:",
  "etiquetaAbajo": "REAL:",
  "cta": "Comenta GUÍA",
  "segundosCola": 1,
  "colores": {}
}
```
