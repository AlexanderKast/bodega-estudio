# Guion narrativo

Un explainer no es una fila de escenas: es **una imagen que cambia mientras alguien cuenta por qué**. El guion se
escribe y se aprueba antes de generar la voz, un boceto o una línea de código. Vive en
`studio/storyboards/<Pieza>.guion.md`; la locución sola, sin marcas, en `studio/storyboards/<Pieza>.guion.txt`.

Aplica a explainers, VSL y cualquier pieza con locución que explique algo. Tipografía cinética, anuncios cortos,
intros y logos no lo necesitan: les basta la tabla de beats de `storyboard.md`.

## Método

1. **La frase.** «Al terminar, quien lo ve entiende que ___.» Una sola. Si necesita una «y», son dos piezas.
2. **La metáfora visual central.** Un objeto o lugar físico, que se pueda dibujar y que tenga estados. Prueba:
   ¿se puede contar toda la pieza señalando un solo dibujo que va cambiando? Si cada beat pide un dibujo nuevo, no
   hay metáfora, hay diapositivas.
3. **El objeto que persiste.** Qué elemento está de principio a fin, cómo se reconoce (una marca que lo distingue
   de los demás) y en qué estado queda en cada beat. Es la misma capa en el `<Mundo>`, no una copia por escena.
4. **El arco**, en cuatro actos. Las proporciones son una guía de partida; los valores medidos en los referentes
   están en `kb/15-narrativa-explainer.md` (lo escribe la Fase 0 del plan).

   | Acto | Qué hace | Estado del diagrama | Parte de la pieza |
   |---|---|---|---|
   | **Problema** | Muestra algo que al espectador ya le pasó | El objeto en su estado normal, y la primera grieta | primer 20 % |
   | **Tensión** | Explica el mecanismo; el problema crece | El diagrama se construye y se llena | 20–55 % |
   | **Revelación** | Le pone nombre o lo da vuelta | Reencuadre: la cámara abre o el objeto se transforma | 55–80 % |
   | **Cierre** | Qué hacer con eso | El objeto del inicio, cambiado, y hold final | último 20 % |

5. **Los beats.** Una fila por frase de la voz. Cada beat cambia el estado del diagrama; si no cambia nada, sobra.
6. **Las pruebas**, antes de pedir el sí:
   - *Radio:* la columna de voz sola se entiende con los ojos cerrados.
   - *Mudo:* la columna «se ve» sola cuenta la misma historia sin audio.
   - *Cronómetro:* leído en voz alta dura lo que pide el brief (de 80 a 110 palabras para 30–45 s).

## Reglas

- **Una idea por beat.** La voz no describe lo que se ve: lo que se ve muestra lo que la voz no dice.
- **Una anotación por beat como máximo**, y siempre sobre algo que ya está en pantalla. La anotación es el foco:
  dos a la vez son dos focos. Se nombra con las piezas del kit (`studio/src/components/anotacion/`): `Circulo`,
  `Flecha`, `Subrayado`, `Tachado`, `Rotulo`, `Callout`, `Nodo`, `Conector`.
- **Cada anotación entra en una palabra.** Se escribe cuál («círculo en *lo primero*»): esa palabra será su `cue`.
- **La palabra de `cue` de cada beat** es una palabra que Whisper escriba igual que el guion: nada de cifras
  («veinte» sale como «20»), siglas ni nombres propios raros. Si se repite, se anota la aparición (`mesa:2`).
- **Texto en pantalla:** de 2 a 6 palabras, literal y entre comillas; no repite la frase de la voz.
- **Cifras con fuente**, en `studio/src/data/<pieza>.json`.
- El cierre vuelve al objeto del inicio. Hold final de 1,5 a 2,5 s (AI-44).

## Plantilla (`studio/storyboards/<Pieza>.guion.md`)

```markdown
# <Pieza> · guion

**La frase:** Al terminar, quien lo ve entiende que …
**Metáfora visual central:** …
**Objeto que persiste:** … · se reconoce por … 
**Duración:** … s · … palabras · formato …

## Estados del objeto
| Beat | Estado |
|---|---|

## Beats
| # | Acto | Voz | Cue | Qué se ve | Estado del diagrama | Anotación (pieza · sobre qué · en qué palabra) | Encuadre |
|---|---|---|---|---|---|---|---|

## Texto en pantalla
- "…"

## Locución completa
(lo mismo que <Pieza>.guion.txt)
```

Con el guion aprobado, los beats se pasan tal cual a `studio/storyboards/<Pieza>.beats.json` (formato en
`storyboard.md`). Si el guion cambia después, cambia primero aquí y luego en el JSON.

## Ejemplo completo: «Mesa»

**La frase:** Al terminar, quien lo ve entiende que la IA no olvida por descuido: solo ve lo que cabe en su ventana
de contexto.
**Metáfora visual central:** una mesa de trabajo vista desde arriba. Cada mensaje es una hoja; lo que no cabe en
la mesa se cae al piso.
**Objeto que persiste:** la primera hoja · se reconoce por la esquina doblada.
**Duración:** 23 s de voz + 2 s de hold · 86 palabras · 16:9.

### Estados del objeto
| Beat | La primera hoja | La mesa |
|---|---|---|
| 1 | Sola sobre la mesa, a la izquierda | 1 hoja → 6 hojas |
| 2 | En su sitio, una más de la fila | Llena: 9 hojas |
| 3 | Cae por el borde izquierdo | Llena + 1 que empuja |
| 4 | En el piso, encima del montón | Dos zonas: mesa y piso |
| 5 | Vuelve a la mesa y es la primera | 3 hojas arriba, el resto libre |

### Beats
| # | Acto | Voz | Cue | Qué se ve | Estado del diagrama | Anotación | Encuadre |
|---|---|---|---|---|---|---|---|
| 1 | Problema | Le explicas todo a la IA y, veinte mensajes después, se le olvida lo primero que dijiste. | `explicas` | Una hoja sobre la mesa; llegan más desde la derecha | 1 → 6 hojas | `Circulo` · la primera hoja · en *primero* | Cerrado sobre la primera hoja |
| 2 | Tensión | No es que sea distraída. Trabaja sobre una mesa, y en esa mesa solo cabe cierta cantidad de hojas. | `distraída` | La mesa completa, con el borde marcado | 9 hojas, mesa llena | `Subrayado` doble · el borde derecho · en *cabe* | Abre a toda la mesa |
| 3 | Tensión | Cada mensaje nuevo es otra hoja. Cuando la mesa se llena, las primeras se caen al piso. | `cada` | Una hoja nueva empuja la fila; la de la esquina doblada cae | Llena + 1; la primera, fuera | `Flecha` · de la hoja nueva a la que cae · en *caen* | Borde izquierdo y piso |
| 4 | Revelación | Eso es la ventana de contexto: lo que cabe en la mesa, no lo que tú le contaste. | `eso` | Plano general: la mesa arriba y el montón abajo | Dos zonas: lo que ve y lo que ya no | `Callout` «ventana de contexto» · el borde · en *ventana* | El más abierto de la pieza |
| 5 | Cierre | Así que no le des más hojas. Dale las tres que importan, y ponlas arriba. | `así` | La mesa se despeja; quedan tres hojas, la primera es la de la esquina doblada | 3 hojas y espacio libre; hold | `Circulo` · las tres hojas · en *tres* | Vuelve a la mesa |

### Texto en pantalla
- "ventana de contexto"

La voz temporal de este ejemplo, su transcripción y sus beats están en `scripts/voz/ejemplos/` y
`references/ejemplos/Mesa.beats.json`. Al transcribirla, Whisper escribió «20» donde el guion dice «veinte»:
por eso ningún `cue` usa esa palabra.
