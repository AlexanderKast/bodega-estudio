---
name: mm-plantillas
description: Usa una plantilla de video del catálogo de Bodega Estudio con contenido propio, desde cualquier carpeta. Úsala para "hazme un video con la plantilla…", "un tutorial por pasos de…", "un antes y después de…", "un video de mi app en un teléfono", "edita esta grabación con subtítulos y capturas", "qué plantillas tenemos", "muéstrame el catálogo" o /mm-plantilla y /mm-catalogo. Elige la plantilla, arma y valida las props, saca fotogramas de control y renderiza en este equipo o en el VPS de Bodega.
---

# Plantillas de Bodega Estudio

Una plantilla es una pieza de video ya diseñada a la que solo se le cambia el contenido (textos, media, colores)
con un JSON de props. Esta skill sirve para usarlas sin abrir el estudio. Para una pieza a medida, con guion y
storyboard propios, la skill es `master-motion`.

## 0. Localiza el estudio

Todo corre dentro del repo del estudio, no en la carpeta donde está abierta la sesión. Es la carpeta que tiene
`scripts/catalogo.mjs` y `studio/package.json`. Búscala en este orden y usa la primera que exista:

1. `$BODEGA_ESTUDIO_HOME`
2. La raíz de este plugin (`${CLAUDE_PLUGIN_ROOT}`), si tiene `studio/package.json`
3. `~/bodega-estudio`

Llámala `$MM`. Si ninguna existe, dilo y da el paso de `INSTALAR.md` para clonarla; no sigas.
Si `studio/node_modules` no existe, corre `/bodega-doctor` antes.
Cada comando de abajo se corre con `cd "$MM"` delante.

## 1. Elegir

Lee `$MM/catalogo/plantillas.json`: por plantilla trae `resumen`, `cuando` (para qué pieza conviene), `formatos`,
`campos` y la ruta de un `ejemplo` de props.

- Si la persona nombró una plantilla, úsala.
- Si describió lo que quiere, propón **las 2 o 3 que encajan** comparando su pedido con `cuando`, con una línea
  cada una y tu recomendación primero. Si ninguna encaja, dilo y ofrece `/master-motion` (pieza a medida) o
  `/replicar <url>` (plantilla nueva a partir de una referencia). No fuerces una plantilla.
- Para ver el catálogo completo: `$MM/catalogo/index.html` (página con el ejemplo en video de cada una) o `$MM/catalogo/CATALOGO.md`.

## 2. Reunir el contenido

Mira los `campos` de la plantilla elegida y pide **en un solo mensaje** lo que falte: los textos, la media
(grabación, capturas, fotos) y el formato. Declara los valores por defecto que vas a usar para lo demás.

- **Media:** las rutas de las props son relativas a `studio/public/` o URLs. Copia el material de la persona a
  `$MM/studio/public/clientes/<pieza>/` y cita esa ruta. Si `ejecucion` es `vps`, súbela con
  `scripts/host.sh subir studio/public/clientes/<pieza>`.
- **Palabras de la voz** (`palabras` en TalkingHeadInsertos, SplitStack y TutorialPasos): salen de
  `bash scripts/voz/transcribir.sh <audio o video> --pieza <pieza>`, que deja
  `studio/src/data/<pieza>.voz.json`; el arreglo `words` de ese archivo es el valor del campo.
- **Colores:** vacío usa la marca de Bodega (`studio/src/marca/marca.json`). No se cambian salvo que Bodega lo pida para una submarca.
- El texto lo escribe la persona o sale de su material. No inventes cifras, nombres ni logos.

## 3. Armar y validar las props

Parte del ejemplo (`$MM/catalogo/ejemplos/<id>.json`), cámbiale el contenido y guárdalo en
`$MM/studio/out/props/<pieza>.json`. Después:

```bash
cd "$MM" && node scripts/plantilla.mjs <id> --props studio/out/props/<pieza>.json --formato <formato>
```

Si las props no cumplen el esquema, el error nombra el campo («beats[1].segundos: esperaba número y llegó
texto»). Corrige el JSON y repite; no toques la plantilla para que acepte un dato mal formado.

## 4. Fotogramas de control

```bash
cd "$MM" && node scripts/plantilla.mjs <id> --props studio/out/props/<pieza>.json --formato <formato> --stills
```

Deja cuatro fotogramas y `hoja.jpg` en `studio/out/plantillas/<pieza>/`. Mira la hoja con Read y revisa: textos
que se cortan o no caben, media que no cargó (panel liso donde debía ir una imagen), contraste con los colores
del cliente y zona segura. Muestra la hoja a la persona antes de renderizar.

## 5. Render y entrega

El render corre donde diga `ejecucion` en `estudio.config.json` (este equipo o el VPS de Bodega). En modo vps,
sube antes las props y la media:

```bash
scripts/host.sh subir studio/out/props/<pieza>.json studio/public/clientes/<pieza>   # solo en modo vps
scripts/host.sh run 'node scripts/plantilla.mjs <id> --props studio/out/props/<pieza>.json --formato <formato> --render && bash scripts/master.sh studio/out/<pieza>.mp4'
scripts/host.sh traer studio/out/<pieza>.master.mp4                                    # solo en modo vps
```

`master.sh` deja el audio en −14 LUFS. Entrega ruta, duración, peso y LUFS. Si el render muere con «Page
crashed», revisa el espacio libre (`df -h`) y baja `render.concurrencia` en `estudio.config.json` antes de
reintentar.

## Reglas

- Una plantilla se usa cambiando props. Si lo que piden exige tocar el código de la plantilla, ya no es este
  flujo: es `master-motion` o una variante nueva de la plantilla, y se dice.
- El catálogo se genera del código. Si creas o cambias una plantilla: `node scripts/catalogo.mjs` (y
  `--miniaturas <id> --videos <id>` con `scripts/host.sh run`). `node scripts/verify.mjs` falla si el catálogo quedó viejo.
- No se usa footage, música, logos ni textos de terceros sin licencia.
