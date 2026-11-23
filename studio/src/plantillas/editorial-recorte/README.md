# Plantilla-EditorialRecorte

Familia `editorial-recorte` del lote 2026-11-08 (`referentes/lote-2026-11-08.md`). Un objeto recortado por idea
sobre cartulina lisa, titular grotesco con la palabra clave en serif itálica de acento y frase de apoyo que entra
por palabra con blur. Se replica la técnica medida (ritmo, entradas, transiciones, composición, tipografía); textos,
objetos y fotos son props.

- Archivo: `EditorialRecorte.tsx` · export `editorialRecorte` · id `Plantilla-EditorialRecorte`
- Formatos: `vertical` (9:16, como los referentes) y `retrato` (4:5)
- Presets: `TypeSandwich`, `BlurStack`, `CutoutObject`, `Look`
- Duración: suma de `beats[].segundos` + `cierre.segundos` (por defecto 14,4 s + 2,2 s = 16,6 s, 498 f)

## Variantes (una por video)

| Variante | Video | Paleta | Ritmo y tratamiento |
| --- | --- | --- | --- |
| `gris-script` | tiktok-7581551601349954824 | `#E6E6E6` / `#111111` | apoyo en serif itálica cada 4 f, objeto que entra desde la izquierda (30 f), círculo punteado, barra negra que sube como suelo en los beats impares, scroll vertical de 30 % del alto en 19 f (move), cierre en tarjeta `#BDBDBD` |
| `acento-azul` | tiktok-7622319703679110421 | `#eceff1` / `#1d1d1b` / `#b112e3` | acento único violeta, objeto que sube y gira 8° (15 f), banda vertical de acento detrás, tarjeta de acento pleno de 4 f en cada cambio |
| `noche-amarilla` | tiktok-7671829994292776200 | `#1d1d1b` / `#f4f9fc` / `#c03bfb` | rejilla de 1 px, curva guía que se dibuja, grotesca chica + serif grande violeta plana (sin glow), objetos que entran girados con desenfoque, cortes secos |
| `crema-marco` | tiktok-7545813836503289144 | `#f4f9fc` / `#1d1d1b` / `#5f6164` | columna centrada, sans gris + serif oscura, barrido de arco y marco oscuro, círculos punteados, destello en los cambios y zoom-through al recorte si el último beat es `objeto` |

## Props

| Prop | Tipo | Qué hace |
| --- | --- | --- |
| `variante` | enum | una de las cuatro de arriba |
| `beats[]` | 1–12 | escenas en orden |
| `beats[].tipo` | `objeto` · `tarjeta` · `lista` · `cifra` | composición de la escena |
| `beats[].apoyo` | texto | frase chica de 3–6 palabras (entra por palabra) |
| `beats[].titular` | texto | `*palabra*` = acento en serif itálica; ` / ` parte la línea |
| `beats[].segundos` | 0,8–8 | duración de la escena (≥ 2,6 s para que el acento llegue a asentarse) |
| `beats[].media` | ruta/URL | recorte PNG con alfa, imagen o video; vacío = objeto de muestra |
| `beats[].items` | texto[] | solo `lista`: 2–4 items con viñeta rombo |
| `beats[].cifra`, `sufijo` | número, texto | solo `cifra`: contador y sufijo en serif |
| `cierre` | objeto | `texto`, `firma`, `logo`, `segundos` |
| `colores` | `fondo`, `texto`, `acento` | vacío = paleta de la variante |

## Ejemplo de props para render

```json
{
  "variante": "acento-azul",
  "beats": [
    { "tipo": "objeto", "apoyo": "Casi nadie lo revisa", "titular": "el *contrato*", "segundos": 2.8, "media": "clientes/acme/martillo.png", "items": [], "cifra": 0, "sufijo": "" },
    { "tipo": "cifra", "apoyo": "de los acuerdos se firman sin leer", "titular": "", "segundos": 3, "media": "", "items": [], "cifra": 7, "sufijo": " de 10" },
    { "tipo": "tarjeta", "apoyo": "", "titular": "Leer cinco minutos / ahorra cinco meses", "segundos": 2.2, "media": "", "items": [], "cifra": 0, "sufijo": "" },
    { "tipo": "lista", "apoyo": "", "titular": "Revisa *siempre*", "segundos": 3.4, "media": "", "items": ["Plazos", "Penalidades", "Quién firma"], "cifra": 0, "sufijo": "" }
  ],
  "cierre": { "texto": "Agenda tu *revisión*", "firma": "@acme.legal", "logo": "clientes/acme/logo.png", "segundos": 2.4 },
  "colores": {}
}
```

```bash
npx remotion render src/index.ts Plantilla-EditorialRecorte-vertical out/editorial.mp4 --props=props.json
```

## Paleta

Todas las variantes usan la marca de Bodega (`marca.json`). Los nombres de variante conservan el del video de origen
(p. ej. `crema-rojo`, `acento-azul`), pero los colores ya no son los del origen.
