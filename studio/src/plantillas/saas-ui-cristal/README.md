# Plantilla-SaasUiCristal (`saas-ui-cristal`)

Anuncio de producto SaaS en una sola toma: cada idea nace de la anterior con empuje de cámara y desenfoque, sin
cortes. Export: `saasUiCristal` en `SaasUiCristal.tsx` (falta registrarla en `plantillas/index.ts`).

## De qué viene

Familia `saas-ui-cristal` de `referentes/lote-2026-11-08.md`. Recetas en `referentes/_raw/videos/<id>/receta.json`.

| Variante | Video | Qué aporta |
| --- | --- | --- |
| `noche-cristal` | lpFv-bB-RuM | negro violeta de la marca, empuje profundo, contador en pill que muta a palabra clave, tarjetas de cristal (sin glow) |
| `bento-inclinado` | tiktok-7521798862521060630 | gris claro con viñeta, widgets claros/oscuros, bento sobre plano inclinado, paneo lateral |
| `morph-claro` | tiktok-7613879612723957012 | fondo perla, tarjeta que muta de proporción con blur direccional, nodos, barrido rápido (10 f) |
| `pasos-carbon` | tiktok-7698861538307788033 | negro de la marca + violeta, barra de pasos con número fantasma, subida con blur (16 f) |
| `hoja-cursor` | DryieyoUmLc | hoja blanca sobre escritorio gris claro, tarjetas de papel, la idea se aleja (zoom-out) y el cursor guía |

No se copió: glow, bloom y degradado cian→morado, cristal en todo, cuatro tarjetas idénticas, typewriter, gradiente
violeta, emoji, ni marcas, copy, cifras, voz o música de los creadores.

## Props

- `variante`: una de las cinco de arriba (paleta, tratamiento de tarjetas, transición y solape).
- `escenas[]`: `{ tipo, titulo, items[], desde, hasta, media, segundos }`.
  - `gancho`: `items` = palabras, una por golpe.
  - `tarjetas`: `items` = `"etiqueta|valor"`; la primera es héroe y se hace el empuje hacia ella.
  - `contador`: `titulo` = etiqueta, `desde`→`hasta` = cifra, `items[0]` = palabra clave en la que muta la pill.
  - `bento`: `items` = `"etiqueta|valor"` (hasta 6); un valor con `%` llena una barra.
  - `morph`: `items` = pasos; la tarjeta cambia de proporción en cada uno.
  - `captura`: `media` = pantalla o video del producto (vacío = interfaz de muestra); `items` = textos del cursor en los dos clics.
  - `lista`: `items` = `"acción|hora"`.
- `marca`, `frase`: cierre. `cta`: si no está vacío, el cursor lo señala y hace clic.
- `segundosCierre`: hold del lockup (AI-44).
- `colores`: `fondo`, `texto`, `acento` en hex de 6 dígitos (vacío = paleta de la variante).

Duración = suma de `segundos` de las escenas − solape de la variante por escena + `segundosCierre`. Por defecto:
7 escenas, 21,1 s (634 f). Formatos: vertical, retrato, cuadrado. Ritmo: los tramos sin evento > 22 f reciben un
re-encuadre corto de cámara (ritmo de anuncio).

## Ejemplo de props para render

```json
{
  "variante": "pasos-carbon",
  "escenas": [
    { "tipo": "gancho", "titulo": "", "items": ["Tu", "agenda", "sola"], "desde": 0, "hasta": 0, "media": "", "segundos": 1.6 },
    { "tipo": "contador", "titulo": "Citas confirmadas", "items": ["Sin llamadas"], "desde": 8, "hasta": 140, "media": "", "segundos": 3.2 },
    { "tipo": "morph", "titulo": "Cómo funciona", "items": ["Recibe el mensaje", "Ofrece horarios", "Confirma y recuerda"], "desde": 0, "hasta": 0, "media": "", "segundos": 3.4 },
    { "tipo": "captura", "titulo": "Por dentro", "items": ["Ver agenda", "Mover cita"], "desde": 0, "hasta": 0, "media": "clientes/agenda/captura.png", "segundos": 3.4 },
    { "tipo": "lista", "titulo": "Esta mañana", "items": ["Cita movida|9:02", "Recordatorio enviado|9:15"], "desde": 0, "hasta": 0, "media": "", "segundos": 2.6 }
  ],
  "marca": "Turnia",
  "frase": "Tu agenda se llena sola.",
  "cta": "Pruébalo gratis",
  "segundosCierre": 3,
  "colores": {}
}
```

`npx remotion render src/index.ts Plantilla-SaasUiCristal-vertical out/saas.mp4 --props=props.json` (en el VPS de Bodega o en este equipo).
