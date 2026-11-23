# Plantilla-ExplicadorObjetos

Familia `explicador-objetos-3d` del lote 2026-11-08 (`referentes/lote-2026-11-08.md`). Explicador de texto cinético
(sans semibold + serif itálica en la palabra clave, una palabra por golpe) con un objeto 3D por idea que entra
desenfocado y flota, pills numeradas, cifra que corre y resaltador único. Se replica la técnica medida; guion,
cifras y objetos son props.

- Archivo: `ExplicadorObjetos.tsx` · export `explicadorObjetos` · id `Plantilla-ExplicadorObjetos`
- Formatos: `vertical` (9:16) y `retrato` (4:5)
- Presets: `TypeSandwich`, `CutoutObject`, `Pill`, `BlurStack`, `Look`
- Duración: suma de `beats[].segundos` + `cierre.segundos` (por defecto 15,4 s + 2,8 s = 18,2 s, 546 f)

## Variantes (una por video)

| Variante | Video | Paleta | Ritmo y tratamiento |
| --- | --- | --- | --- |
| `lavanda-contraste` | tiktok-7660733665353272583 | `#efe8f5` / `#1d1d1b` / resaltador `#b112e3` / punto `#b112e3` | escenas claras y oscuras alternadas: al cambiar de valor la escena sube como barra en 6 f, si no cambia el contenido entra con blur; disco oscuro con aro punteado detrás del objeto; puntos grises con profundidad y arcos finos; pills cada 0,9 s; cierre con bloques de línea de tiempo y punto violeta que los recorre |
| `calido-ventana` | tiktok-7560567761760505110 | `#f4f9fc→#d9cde3` / `#1d1d1b` / `#b112e3` | luz de ventana proyectada fija, banda diagonal de acento detrás del objeto, texto chico palabra a palabra, follaje desenfocado que cruza y tapa cada cambio (24 f) mientras la escena cae por abajo, contador con sombra suave, cierre con ruta que se dibuja hasta un pin con etiqueta |

## Props

| Prop | Tipo | Qué hace |
| --- | --- | --- |
| `variante` | enum | una de las dos de arriba |
| `beats[]` | 1–14 | escenas en orden |
| `beats[].tipo` | `objeto` · `lista` · `cifra` | recorte 3D + texto · pills numeradas · contador + pill |
| `beats[].fondo` | `claro` · `oscuro` | alternar marca el giro del argumento |
| `beats[].texto` | texto | 1–3 niveles separados por ` / `; `*palabra*` = serif itálica |
| `beats[].nota` | texto | línea chica bajo el objeto; `*palabra*` lleva el resaltador |
| `beats[].segundos` | 0,8–8 | duración |
| `beats[].media` | ruta/URL | objeto 3D (PNG con alfa), imagen o video; vacío = objeto de muestra |
| `beats[].items` | texto[] | solo `lista`: 2–5 items |
| `beats[].cifra`, `sufijo`, `pill` | número, texto, texto | solo `cifra`: valor, palabra en serif y pill "02 meses" (número + etiqueta) |
| `cierre` | objeto | `texto`, `firma`, `media`, `segundos` |
| `colores` | `fondo`, `texto`, `acento` | escena clara, tinta y resaltador/acento; vacío = paleta de la variante |

## Ejemplo de props para render

```json
{
  "variante": "calido-ventana",
  "beats": [
    { "tipo": "objeto", "fondo": "claro", "texto": "Abrimos un *café* / en marzo", "nota": "", "segundos": 3, "media": "clientes/cafe/local-iso.png", "items": [], "cifra": 0, "sufijo": "", "pill": "" },
    { "tipo": "cifra", "fondo": "claro", "texto": "", "nota": "", "segundos": 3.4, "media": "clientes/cafe/reloj.png", "items": [], "cifra": 48000, "sufijo": "visitas", "pill": "02 meses" },
    { "tipo": "lista", "fondo": "oscuro", "texto": "Lo que *funcionó*", "nota": "", "segundos": 3.6, "media": "", "items": ["Fotos reales", "Un horario fijo", "Responder rápido"], "cifra": 0, "sufijo": "", "pill": "" }
  ],
  "cierre": { "texto": "Ven a *probarlo*", "firma": "Calle 10 #4-21", "media": "", "segundos": 2.8 },
  "colores": {}
}
```

```bash
npx remotion render src/index.ts Plantilla-ExplicadorObjetos-vertical out/explicador.mp4 --props=props.json
```

## Paleta

Todas las variantes usan la marca de Bodega (`marca.json`). Los nombres de variante conservan el del video de origen
(p. ej. `crema-rojo`, `acento-azul`), pero los colores ya no son los del origen.
