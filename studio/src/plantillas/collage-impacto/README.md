# Plantilla-CollageImpacto

Familia `collage-impacto` del lote 2026-11-08 (`referentes/lote-2026-11-08.md`). Tipografía cinética de tres voces
(condensada gigante = idea, serif itálica = énfasis, grotesca diminuta = conector) sobre papel, con recortes en B/N
que tocan las letras, caídas a negro al golpe y escenas oscuras de foto. Se replica la técnica medida; guion,
recortes y fotos son props.

- Archivo: `CollageImpacto.tsx` · export `collageImpacto` · id `Plantilla-CollageImpacto`
- Formatos: `vertical` (9:16) y `retrato` (4:5)
- Presets: `CutoutObject`, `Look` (la idea por letra, el péndulo, la tarjeta que se parte y los cierres se resuelven
  dentro con el kit)
- Fuente nueva: **Anton** (Vernon Adams, SIL OFL 1.1) vía `@remotion/google-fonts/Anton` · falta su línea en
  `CREDITOS.md`
- Duración: suma de `beats[].segundos` + `cierre.segundos` (por defecto 14,4 s + 2,8 s = 17,2 s, 516 f)

## Variantes (una por video)

| Variante | Video | Paleta | Ritmo y tratamiento |
| --- | --- | --- | --- |
| `crema-rojo` | tiktok-7600179656922385685 | `#eceff1` / `#1d1d1b` / `#b112e3` | idea en condensada violeta que llena el ancho, conectores cada 9 f, bloque violeta detrás del recorte B/N, rejilla parcial, cortes secos con dips a negro de 4 f, cierre que funde a negro en 1 s |
| `papel-tinta` | tiktok-7684823088906636562 | `#fafbfc` / `#1d1d1b` / `#b112e3`, escenas oscuras `#140b18` | papel técnico con rejilla y marcas de registro, conectores diminutos cada 6 f, sombra larga abajo-derecha, círculo punteado, empuje horizontal con blur en 8 f, flash violeta de 3 f al golpe, cierre con disco que crece y puntos que se disuelven |
| `gris-objeto` | C-yZlQXN3rQ | `#8C8C88` / `#111111` / `#0A0A0A` | monocromo con viñeta fuerte y grano, grotesca 400 + clave 700 (2,5×) que llega fantasma y se solidifica, tarjeta octogonal con trama que se parte y revela el objeto, blur dissolve de 6 f, cierre cenital que se aleja y dibuja el campo |

## Props

| Prop | Tipo | Qué hace |
| --- | --- | --- |
| `variante` | enum | una de las tres de arriba |
| `beats[]` | 1–14 | escenas en orden |
| `beats[].tipo` | `impacto` · `frase` · `objeto` · `oscuro` | palabra que llena el ancho · 1–3 niveles · recorte protagonista · foto de fondo |
| `beats[].texto` | texto | ` / ` parte la línea; `*idea*` = condensada grande; `_énfasis_` = serif itálica; el resto, conector chico |
| `beats[].segundos` | 0,6–8 | duración |
| `beats[].recorte` | ruta/URL | PNG con alfa; en `impacto` cuelga y oscila sobre las letras |
| `beats[].imagen` | ruta/URL | fondo de `oscuro` o tarjeta que se parte en `gris-objeto` |
| `beats[].golpe` | booleano | caída a negro (o flash de acento) de 4 f al entrar |
| `cierre` | objeto | `texto`, `firma`, `recorte`, `segundos` |
| `colores` | `fondo`, `texto`, `acento` | papel, tinta y color de la idea; vacío = paleta de la variante |

## Ejemplo de props para render

```json
{
  "variante": "papel-tinta",
  "beats": [
    { "tipo": "oscuro", "texto": "en / *2019*", "segundos": 1.8, "recorte": "", "imagen": "clientes/acme/taller.jpg", "golpe": false },
    { "tipo": "objeto", "texto": "el taller / *estaba* / al límite", "segundos": 2.6, "recorte": "clientes/acme/llave.png", "imagen": "", "golpe": false },
    { "tipo": "frase", "texto": "hasta que / *quitamos* / lo que _sobraba_", "segundos": 2.6, "recorte": "", "imagen": "", "golpe": true },
    { "tipo": "impacto", "texto": "*menos / pasos*", "segundos": 2, "recorte": "clientes/acme/reloj.png", "imagen": "", "golpe": true }
  ],
  "cierre": { "texto": "No es hacer / *más*", "firma": "@acme", "recorte": "", "segundos": 2.8 },
  "colores": {}
}
```

```bash
npx remotion render src/index.ts Plantilla-CollageImpacto-vertical out/collage.mp4 --props=props.json
```

## Paleta

Todas las variantes usan la marca de Bodega (`marca.json`). Los nombres de variante conservan el del video de origen
(p. ej. `crema-rojo`, `acento-azul`), pero los colores ya no son los del origen.
