# Plantilla-ShowcaseDispositivo (`showcase-dispositivo`)

Pantallas que se suceden dentro de un teléfono o laptop dibujados en código; la cámara entra, se pega a la pantalla,
se inclina y retrocede para el splash. Export: `showcaseDispositivo` en `ShowcaseDispositivo.tsx` (falta registrarla
en `plantillas/index.ts`).

## De qué viene

Familia `showcase-dispositivo` de `referentes/lote-2026-11-08.md`. Recetas en `referentes/_raw/videos/<id>/receta.json`.

| Variante | Video | Qué aporta |
| --- | --- | --- |
| `telefono-3d` | DiH9Pek312c | vuelo con giro (arriveSoft 29 f), iconos que estallan en un golpe con glitch, push-in a pantalla (move 20 f), fundido 10 f, flash 8 f, inclinación ~25°, retroceso glide 40 f y balanceo |
| `laptop-catalogo` | tiktok-7693603336481803542 | laptop fijo en 3/4, una pieza = una técnica, flash 6 f, mancha de tinta 8 f, bloques 7 f, eco, rejilla con onda, dashboard, marca letra a letra |

No se copió: la interfaz del compositor y su franja magenta→violeta, wallpapers, nombres y logos de apps, el laptop
renderizado y su reflejo, el asterisco y el rótulo del autor, el glow; el dispositivo no flota en el vacío (apoya en
una superficie con sombra de contacto).

## Props

- `variante`: dispositivo, paleta, cámara (la laptop no la mueve) y duración de los golpes.
- `dispositivo`: `auto` (el de la variante), `telefono` o `laptop`.
- `pantallas[]`: `{ tipo, texto, subtexto, items[], numero, media, segundos, encuadre, cambio }`.
  - `tipo`: `inicio` (iconos que estallan al final), `bloqueo` (hora en `texto`, fecha en `subtexto`,
    notificaciones en `items`), `media` (captura/video de la app; vacío = visor de cámara de muestra), `mapa`
    (ruta que se dibuja, `texto`/`subtexto` en la tarjeta), `titular`, `rejilla`, `eco` (palabra en `texto`),
    `datos` (`numero` con signo y %, barras con `items`).
  - `media`: si hay, ocupa la pantalla en el tipo `media`.
  - `encuadre`: `dispositivo`, `pantalla` (la cámara llena el cuadro con la pantalla) o `inclinado`.
  - `cambio`: cómo entra sobre la anterior: `fundido`, `empuje`, `flash`, `tinta`, `bloques`.
- `marca`, `frase`: splash final y frase bajo el dispositivo.
- `render3d`: video con alfa del teléfono entrando (Blender en el VPS de Bodega o en este equipo); reemplaza el vuelo dibujado en el
  primer segundo y se funde con el dispositivo.
- `segundosCierre`, `colores` (`fondo`, `texto`, `acento` en hex).

Duración = suma de `segundos` + `segundosCierre`. Por defecto 5 pantallas, 14 s. Formatos: vertical, retrato,
cuadrado. Los tramos sin evento > 22 f reciben un re-encuadre corto de cámara.

Fuente extra cargada en el archivo: Playfair Display itálica (Google Fonts, OFL). Pendiente anotarla en
`CREDITOS.md` al integrar.

## Ejemplo de props para render

```json
{
  "variante": "laptop-catalogo",
  "dispositivo": "auto",
  "pantallas": [
    { "tipo": "titular", "texto": "NODO", "subtexto": "estudio de datos", "items": [], "numero": 0, "media": "", "segundos": 1.8, "encuadre": "dispositivo", "cambio": "fundido" },
    { "tipo": "rejilla", "texto": "señal en vivo", "subtexto": "", "items": [], "numero": 0, "media": "", "segundos": 1.6, "encuadre": "dispositivo", "cambio": "tinta" },
    { "tipo": "eco", "texto": "cada", "subtexto": "", "items": [], "numero": 0, "media": "", "segundos": 1.4, "encuadre": "dispositivo", "cambio": "flash" },
    { "tipo": "datos", "texto": "Conversión del trimestre", "subtexto": "", "items": ["E", "F", "M", "A", "M", "J"], "numero": 212, "media": "", "segundos": 1.8, "encuadre": "dispositivo", "cambio": "bloques" },
    { "tipo": "media", "texto": "Tablero real", "subtexto": "", "items": [], "numero": 0, "media": "clientes/nodo/tablero.png", "segundos": 1.8, "encuadre": "dispositivo", "cambio": "flash" }
  ],
  "marca": "nodo",
  "frase": "Datos con intención.",
  "render3d": "",
  "segundosCierre": 2.2,
  "colores": {}
}
```

`npx remotion render src/index.ts Plantilla-ShowcaseDispositivo-vertical out/showcase.mp4 --props=props.json` (en el VPS de Bodega o en este equipo).
