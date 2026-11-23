# Storyboard

El storyboard se aprueba **antes de programar**. Lo que se muestra en la puerta 2 son bocetos y texto, no stills
de una composición ya hecha: si algo no funciona, se cambia un dibujo, no una escena construida.

## 1. Tabla de beats (toda pieza)

En `studio/storyboards/<Pieza>.md` para piezas cortas, o dentro de `<Pieza>.guion.md` para explainers (`guion.md`).

| # | Tiempo | Voz | Texto en pantalla | Acción principal | Cámara | Sonido (rol) | Transición |
|---|---|---|---|---|---|---|---|

- Una idea visible por beat (2,5–4 s), de 2 a 6 palabras en pantalla.
- Ritmo: contraste rápido / lento; nunca golpes cada N cuadros exactos (AI-11).
- La cámara avanza hacia lo que va a pasar (`kb/05`).
- 2 o 3 tipos de transición por pieza (`kb/04`).
- Final con hold de 1,5–2,5 s (AI-44).
- Con voz, la columna Tiempo no se escribe a mano: sale de `cue()` sobre `studio/src/data/<pieza>.voz.json`.

Para tipografía cinética, anuncios cortos, intros y logos, la puerta 2 es esta tabla más los styleframes de la
puerta de estilo. Los bocetos de abajo son opcionales en esas piezas y obligatorios en un explainer.

## 2. Storyboard dibujado (explainers)

Un boceto por beat (still de Remotion en grises o, con aprobación de Bodega, imagen generada) y una hoja que los junta con el texto de cada beat.

### 2.1 Los beats: `studio/storyboards/<Pieza>.beats.json`

Es el guion aprobado en forma de datos. Lo leen la hoja de storyboard y `scripts/voz/probar-cue.mjs`.

```json
{
  "pieza": "Mesa",
  "formato": "horizontal",
  "bocetos": "assets/mesa-boceto",
  "beats": [
    {
      "id": "01-olvido",
      "acto": "problema",
      "voz": "Le explicas todo a la IA y, veinte mensajes después, se le olvida lo primero que dijiste.",
      "cue": "explicas",
      "se_ve": "Una mesa de trabajo vista desde arriba con una sola hoja; llegan más hojas desde la derecha.",
      "diagrama": "Mesa con 1 hoja → 6 hojas. La primera lleva una esquina doblada.",
      "anotacion": "Círculo sobre la primera hoja al decir «lo primero»."
    }
  ]
}
```

- `formato`: `horizontal`, `vertical` o `cuadrado`. `bocetos`: carpeta bajo `studio/public/`.
- `cue`: la palabra de la voz en que arranca el beat (`palabra:2` para la segunda aparición).
- `boceto` (opcional): nombre del archivo si no es `<id>.png`.
- Ejemplo completo: `references/ejemplos/Mesa.beats.json`.

### 2.2 Los bocetos: `studio/storyboards/<Pieza>.bocetos.json`

Es la lista de bocetos de la pieza (mismo formato que en Master Motion), uno por beat y con el
mismo `id`. Los bocetos usan `tipo: "boceto"`, que pide el cuadro completo con la composición descrita.

```json
{
  "pieza": "mesa-boceto",
  "prompt_estilo": "Rough storyboard thumbnail sketch, loose black marker lines on off-white paper, flat mid-gray marker shading, simple shapes, no detail, no color, drawn quickly by a storyboard artist",
  "paleta": [{ "nombre": "black", "hex": "#14110D" }, { "nombre": "mid gray", "hex": "#8C8A84" }, { "nombre": "off-white", "hex": "#F4F1EA" }],
  "negativo": "photo, 3d render, color, glossy, gradient, detailed illustration, frame, border",
  "modelo": "zimage",
  "assets": [
    { "id": "01-olvido", "tipo": "boceto", "tamano": [1024, 576], "descripcion": "A desk seen from directly above with one sheet of paper with a folded corner on the left, five more blank sheets sliding in from the right edge" }
  ]
}
```

- **En grises y a mano**, nunca con el estilo final: el boceto decide composición y encuadre, no el look. Un
  boceto bonito hace que se apruebe el dibujo y no la idea.
- La `descripcion` va en inglés y dice **qué hay y dónde** (izquierda, arriba, tamaño relativo, desde qué ángulo):
  es el encuadre del beat. El objeto que persiste se describe igual en todos, con su marca.
- **Sin texto en la imagen.** `generar.py` lo excluye siempre; los rótulos y las anotaciones van escritos en el
  campo `anotacion` del beat.
- `tamano`: `[1024, 576]` horizontal, `[576, 1024]` vertical, `[768, 768]` cuadrado.
- `pieza` termina en `-boceto` para no mezclarlos con los assets finales de `studio/public/assets/<pieza>/`.
- Ejemplo: `references/ejemplos/Mesa.bocetos.json`.

Bodega Estudio no trae generador de imágenes local. Dos caminos:

- **Still en grises:** una composición de bocetos con cajas y formas (`studio/src/compositions/<Pieza>Bocetos.tsx`),
  exportada beat a beat con `node scripts/stills.mjs --comp <Pieza>Bocetos-<formato> --at ...` a
  `studio/public/assets/<pieza>-boceto/<id>.png`. Es el camino por defecto.
- **Imagen generada:** solo con aprobación de Bodega (gasta créditos), con el mismo `descripcion` como prompt.

Un boceto que no sirve se rehace solo: se corrige su `descripcion` y se vuelve a sacar ese still.

### 2.3 La hoja: `node scripts/storyboard.mjs <Pieza>`

Arma `studio/out/storyboard/<Pieza>/hoja.jpg`: cada boceto con su número, acto, `cue`, voz, qué se ve, estado del
diagrama y anotación debajo. Solo usa ffmpeg (no Remotion), así que sale en segundos. Un beat sin imagen queda
con un recuadro gris y un aviso: la hoja también sirve para ver qué falta.

### 2.4 Qué se aprueba en la puerta 2

Se muestra la hoja y se pregunta por tres cosas: **si la historia se sigue leyendo solo los dibujos**, si cada
encuadre deja claro dónde mirar, y si el objeto que persiste se reconoce de un cuadro al siguiente. El estilo ya
se aprobó en su puerta; el ritmo se aprueba en la animática (`animatica.md`).

## 3. Después: hoja de la composición

Cuando ya existe la animática o la pieza, `studio/storyboards/<Pieza>.json` y
`node scripts/stills.mjs --storyboard <Pieza>` sacan un still por beat de la composición real, para ponerlo al
lado de la hoja de bocetos y ver que se construyó lo que se aprobó:

```json
{ "comp": "<Pieza>-horizontal", "scenes": [{ "name": "01-olvido", "at": 0.8 }, { "name": "05-tres", "at": 21 }] }
```
