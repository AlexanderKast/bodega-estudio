# Plantilla-AntesDespues (`antes-despues`)

Escenario fijo de comparación: el material crudo chico y el tratado grande; el panel grande recorre estados de
subtítulo o de dato con su transición. Export: `antesDespues` en `AntesDespues.tsx` (falta registrarla en
`plantillas/index.ts`).

## De qué viene

Familia `antes-despues` de `referentes/lote-2026-11-08.md`. Recetas en `referentes/_raw/videos/<id>/receta.json`.

| Variante | Video | Qué aporta |
| --- | --- | --- |
| `tarjetas-perspectiva` | MoVlt-ptxIk | ANTES chica (rotY +14°) y DESPUÉS 1,5× (rotY −12°), rótulos condensados, palabra a palabra, resalte violeta, elipse a mano, cortina de 6 f, rasgado posterizado a 2 f |
| `escenario-timeline` | tiktok-7519674033076571397 | original + edición final con bisel + timeline con cabezal, fondo durazno, frase con blur horizontal y palabra en itálica de acento, cifra que cuenta, barrido de 8 f |

No se copió: footage, voz, textos, precios y logos de los creadores, los siete estilos juntos (los defaults usan
tres: video, retícula, crema), el halo neón y el bokeh del timeline, entradas siempre blur+opacidad.

## Props

- `variante`: layout, paleta y ritmo (palabra a palabra o frase a frase).
- `antes`: clip crudo (ruta en `public/` o URL). Vacío = silueta de muestra.
- `etiquetaAntes`, `etiquetaDespues`: rótulos.
- `estados[]`: `{ estilo, texto, clave, media, segundos, entrada }`.
  - `estilo`: `video`, `papel`, `color`, `reticula`, `periodico`, `crema`, `dato` (usar 2–3 por pieza).
  - `texto`: frase; en `escenario-timeline` varias frases separadas por ` / `. En `dato` el primer número cuenta
    (admite prefijo `$`, `€`, `USD`… y decimales con coma).
  - `clave`: palabra resaltada en acento.
  - `media`: clip de este estado; vacío = el de `antes`.
  - `entrada`: `corte`, `cortina`, `rasgado` (el estado anterior se arranca encima) o `barrido`.
- `timeline`: `{ etiqueta, media }`, solo `escenario-timeline` (vacío = pistas de muestra).
- `colores`: `fondo`, `texto`, `acento` en hex.

Duración = suma de `segundos` de los estados. Por defecto 6 estados, 11,7 s. Formatos: vertical, retrato. Los tramos
sin texto > 22 f reciben un punch-in del marco (como los cortes al golpe del original).

Fuentes extra cargadas en el archivo: Anton y Playfair Display itálica (Google Fonts, OFL). Pendiente anotarlas en
`CREDITOS.md` al integrar.

## Ejemplo de props para render

```json
{
  "variante": "escenario-timeline",
  "antes": "clientes/envios/crudo.mp4",
  "etiquetaAntes": "Original",
  "etiquetaDespues": "Edición final",
  "estados": [
    { "estilo": "video", "texto": "Si tu paquete / pesa más de 9 kilos", "clave": "paquete", "media": "clientes/envios/broll1.mp4", "segundos": 2.2, "entrada": "corte" },
    { "estilo": "dato", "texto": "desde $4,99 por kilo", "clave": "kilo", "media": "", "segundos": 2.4, "entrada": "barrido" },
    { "estilo": "video", "texto": "llega en 48 horas / a todo el país", "clave": "horas", "media": "clientes/envios/broll2.mp4", "segundos": 2.6, "entrada": "barrido" }
  ],
  "timeline": { "etiqueta": "Línea de tiempo", "media": "" },
  "colores": {}
}
```

`npx remotion render src/index.ts Plantilla-AntesDespues-vertical out/antes-despues.mp4 --props=props.json` (en el VPS de Bodega o en este equipo).

## Paleta

Todas las variantes usan la marca de Bodega (`marca.json`). Los nombres de variante conservan el del video de origen
(p. ej. `crema-rojo`, `acento-azul`), pero los colores ya no son los del origen.
