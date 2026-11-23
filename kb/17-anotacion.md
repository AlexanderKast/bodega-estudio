# 17 — Anotación: círculos, flechas, subrayados y rótulos medidos

Valores medidos el 2026-11-11 sobre seis explainers profesionales (siete tramos, 540 s en total) para el kit de
`studio/src/components/anotacion/`. Todo va en **cuadros a 30 fps** y en **% del ancho del cuadro** salvo que se
diga otra cosa. Las fichas con cada medición están en `referentes/fichas/` y el método al final (§9).

| Sigla | Referente | Estilo | Tramo medido | fps |
|---|---|---|---|---|
| VOX | Vox Darkroom, ficha `kXByOrRrO7c` | documental, tinta roja sobre archivo | 114–192 s | 23,976 |
| JH | Johnny Harris, ficha `aBppb2quqkE` | mapas + diagrama que se construye | 18–62 s y 150–228 s | 23,976 |
| KZ | Kurzgesagt, ficha `_lNF3_30lUE` | ilustración plana | 63–135 s | 25 |
| GA | Giant Ant para TED, ficha `QPmUAfuqM08` | ilustración plana, pieza completa | 0–70 s | 24 |
| RSA | RSA Animate, ficha `u6XAPnuFjJc` | pizarra en lienzo continuo | 204–276 s | 25 |
| MP | minutephysics, ficha `p_o4aY7xkXg` | marcador sobre papel, pieza completa | 0–86 s | 12 |

Límites que valen para todo el archivo: los seis son **16:9** (no se midió ningún explainer vertical), RSA solo
existe a 520×294 y MP a 480p, y en seis de los siete tramos el desfase con la voz se midió con subtítulos (± 0,3 s)
porque Whisper no estuvo disponible; solo VOX tiene tiempos por palabra.

## 1. Lo que cambia frente a lo que el kit suponía

1. **La duración de un gesto de énfasis no crece con su tamaño.** Un círculo de 8 % del ancho y uno de 49 % tardan
   lo mismo dentro de una misma pieza (VOX 6–11 f, MP 2,5–5 f, RSA 7–12 f). `durTrazo` hoy crece con la raíz del
   largo y llega a 26 f: es entre 2 y 3 veces más lento que VOX para un círculo grande.
2. **Hay dos clases de trazo y se cronometran distinto.** El **gesto** (círculo, flecha, subrayado, llave, caja)
   dura 5–12 f pase lo que pase. El **trazo de construcción** (ruta sobre un mapa, órbita, eje, contorno de un
   diagrama) va a velocidad casi constante, 4–15 px/f a 1080, y dura lo que su largo pida: 19–97 f.
3. **Casi nadie frena al final.** De 24 trazos de anotación con curva gradual medida, 18 son constantes o
   lento-rápido-lento, 4 aceleran y 2 salen rápido y frenan (otros 28 son golpes de 1 a 3 cuadros, sin curva que
   medir). El valor por defecto del kit (`arriveSoft`, salida rápida con frenada larga) es la forma menos frecuente.
4. **Ninguna anotación hierve.** En los siete tramos la línea ya dibujada queda quieta, incluida la pizarra.
5. **El documental va a doses.** En VOX los trazos y la cámara digital avanzan cada 2 cuadros (12 dibujos por
   segundo); en JH, KZ, GA y RSA van a unos. MP es 12 fps de origen.
6. **La anotación llega con la palabra o un instante antes**, nunca medio segundo tarde (§5).

## 2. Cuánto tarda en dibujarse cada pieza

| Pieza | Referente (n) | Tamaño (% del ancho) | Dibujo (f a 30) | Curva | Paso |
|---|---|---|---|---|---|
| Círculo o elipse a mano | VOX (3) | 27×19 a 49×27 | 6,3 · 8,8 · 11,3 | arranque corto quieto 2–3 cuadros, salta al 80–90 % y cierra | 2 |
| Círculo con rotulador real | VOX (1) | 30×13 | 20 | irregular, la mano tapa | 2 |
| Círculo a mano, fino | JH (1) | 6,4×9,3 | 24 hasta cerrar, 36 con la cola | constante | 1 |
| Círculo de carboncillo (título) | JH (1) | 64×50 | 18 | constante | 1 |
| Círculo de marcador | MP (5) | 8 a 28 de diámetro | 2,5–5 (cota superior, 1–2 cuadros a 12 fps) | media vuelta por cuadro | 1 |
| Contorno de bocadillo | RSA (3) | 25×12,5 | 7–12 | constante | 1 |
| Flecha a mano | VOX (4) | largo 13–30 | 6,3–12,5, mediana 9,4 | punto quieto 2–3 cuadros y cuerpo de golpe | 1–2 |
| Flecha a mano | JH (1) | largo 7 | 16 | lento-rápido-lento | 1 |
| Flecha vectorial (eje, cota) | KZ (4) | largo 9–36 | 10–19 | constante con freno en los últimos 4 cuadros | 1 |
| Flecha de línea simple | RSA (2) | largo 24–35 | 10–11 | constante | 1 |
| Flecha de marcador | MP (4) | largo 15–75 | 2,5–10, mediana 6,25 | 1–4 pasos de 12 fps | 1 |
| Subrayado o línea recta | MP (2) | largo 49 y 65 | 5 | 2 pasos | 1 |
| Resaltador (barrido) | VOX (1) | 26×3,4 | 6,3 | constante, izquierda a derecha | 2 |
| Llave | MP (3) | largo 20–48 | 5–7,5 | 2–3 pasos | 1 |
| Caja de trazo recto | JH (1) | 6,9 de lado | 22 | lento-rápido-lento | 1 |
| Cinta detrás de un título | JH (1) | 48×15 | 14 | acelera | 1 |
| Etiqueta en caja (abre en vertical) | KZ (9) | 11–26 × 2–4,4 | 5–7, mediana 6 | ease-out | 1 |
| Ruta punteada sobre mapa | JH (3) | largo 8,6 · 10,2 · 14,3 | 26 · 22 · 25 | constante | 1–2 |
| Línea del globo al sol | JH (1) | largo 13,6 | 19 | constante | 1 |
| Arco grueso alrededor del globo | JH (1) | largo ≈ 37 | 61 (relleno grueso en 18) | acelera | 1 |
| Órbita completa | KZ (1) | largo 131 | 97 | ease-in de 1,8 s y luego constante | 1 |
| Estela (dos líneas paralelas) | GA (1) | largo 40 | 49 | constante | 1 |
| Línea roja sobre mapa, rotulador real | VOX (1) | largo 75 | 60 | a tirones | 2 |
| Barrido de rectángulo de relleno | KZ (2) | 73×39 | 18–22 | ease-in-out | 1 |
| Borrado en reversa de un círculo | JH (1) | 6,4×9,3 | 24 | constante | 1 |

Velocidad de los trazos de construcción, en px por cuadro a 1080 de ancho y 30 fps: JH ruta 3,6–6,1 · JH línea al
sol 7,7 · GA estela 8,8 · KZ ejes 10 · VOX mapa 13,5 · KZ órbita 14,6. Mediana 9.

Subrayado propiamente dicho solo aparece en MP (n=2). En RSA, GA, KZ y JH no hay ninguno: el énfasis se hace con
color (palabra en rojo, RSA: 18–27 f por palabra), con una caja del color del objeto (KZ) o con un resaltador (VOX).

## 3. Forma del trazo

| Dato | VOX | JH | KZ | GA | RSA | MP |
|---|---|---|---|---|---|---|
| Grosor del trazo (% del ancho) | 0,3–0,4 digital · 0,6–0,8 rotulador real | 0,2–0,4 · 2,3 carboncillo | 0,63 línea · 1,0–1,2 flecha | 0,12–0,2 | 0,45–0,55 · 0,85 titular | 0,7 (0,35–1,29) · 1,3 repasado |
| En px a 1080 de ancho | 3,2–4,3 · 6,5–8,6 | 2,2–4,3 · 25 | 6,8 · 11–13 | 1,3–2,2 | 4,9–5,9 · 9,2 | 7,6 · 14 |
| Vueltas de un círculo | 1,05 · 1,1 · 1,1 · 1,5 · 1,5 · 1,6 | 1,15 · 1,8 | 1,0 | — | 1,0 | 1,0–1,05 |
| Punta de flecha después del cuerpo (f) | 1,3–2,5 | 0 (va desde el inicio) | 0 (viaja con el trazo) | — | 0–2 | 0 en 3 de 4 |
| Hierve | no | no | no | no | no | no |
| Pasadas | 1 | 1 (2 en el carboncillo) | 1 | 1 | 1 | 1 (2 solo para énfasis) |
| Resaltador: alto (% del ancho) | 3,4–4,4 | 2,2 | — | — | — | — |

El temblor del pulso (px de desviación) **no se pudo medir**: a 720p el trazo de VOX ocupa 2–3 px y la desviación
queda por debajo de la resolución. Los valores `temblor` del kit siguen siendo a ojo.

## 4. Cuánto permanece y cómo sale

| Qué | Referente (n) | Permanece (s) | Cómo sale |
|---|---|---|---|
| Círculo o flecha de énfasis sobre foto | VOX (9) | 1,5–2,75, mediana 1,8 | corte al plano siguiente |
| Resaltador | VOX (2) | 2,3 · 5,3 | corte |
| Rótulo en caja | VOX (5) | 2,7–5,8, mediana 3,5 | corte (4) o fundido (1) |
| Etiqueta en caja de un diagrama | KZ (9) | 2,3–5,1, mediana 3,3 | cierra a línea en 4 cuadros, en reversa de su entrada |
| Línea o flecha de un diagrama | KZ (4) | 1,7–5,8 | se retrae en reversa, con 2–8 cuadros de anticipación |
| Marca que identifica un objeto | JH (2) | 41,7 y ≥ 31,9 | se borra en reversa (24 f) o sigue hasta el final |
| Rótulos de un diagrama que crece | JH (7) | 5,5–67,7 | no salen |
| Dibujo o palabra de pizarra continua | RSA (29) | 5–47, mediana ≈ 9 | la cámara lo deja fuera; nada se borra |
| Dibujo terminado en pizarra por hojas | MP (18) | 0,25–2,25, mediana 0,96 | corte seco a papel limpio |

Dos reglas salen de aquí. Un resalte de énfasis vive **1,5 s como mínimo** y se va con el plano, no por su cuenta.
Una marca que identifica un objeto del diagrama (el país, el nodo) **no sale**: viaja con el objeto y escala con la
cámara hasta que el diagrama cambia.

## 5. Desfase entre la voz y la anotación

`desfase = inicio de la anotación − inicio de la palabra que acompaña` (negativo: la anotación llega antes).

| Referente | n | Mediana (s) | Rango (s) | Precisión |
|---|---|---|---|---|
| VOX | 16 | −0,08 | −1,67 a +0,61 | por palabra (Whisper), ± 0,04 |
| GA | 14 | −0,12 | −0,79 a +0,43 | subtítulos por palabra, ± 0,15 |
| KZ (transiciones y zooms) | 16 | −0,13 | −0,42 a +0,14 | por frase, ± 0,1 |
| RSA | 20 | −0,1 | −2,55 a +0,95 | subtítulos, ± 0,3 |
| MP | 35 | −0,1 | −2,1 a +2,7 | subtítulos por línea, ± 0,5 |
| JH diagrama | 14 | −0,33 | −0,77 a +0,82 | subtítulos, ± 0,3 |
| JH mapa | 10 | −0,71 | −1,31 a +0,08 | subtítulos, ± 0,3 |

- El centro está entre **−0,1 y −0,3 s**: la anotación empieza 3 a 9 cuadros antes de la palabra. En VOX, 10 de 16
  caen dentro de ± 0,25 s.
- Llega más temprano (−1 a −2,5 s) cuando completa algo que ya se estaba dibujando y la voz va lenta (RSA, JH mapa).
- Llega tarde (+0,4 a +0,8 s) solo cuando espera a otro evento, o cuando es **la respuesta**: en GA el cero aparece
  0,42 s después de que la voz lo nombra.
- En KZ la etiqueta entra 3–6 cuadros después del pico de su objeto y, si son varias, escalonadas 2–4 cuadros.

## 6. Rótulos

| Dato | VOX | JH | KZ | GA | RSA | MP |
|---|---|---|---|---|---|---|
| Familia | grotesca geométrica bold | condensada bold + serif + serif itálica, cada una con un rol | sans geométrica redondeada | monolínea capilar | rotulación a mano en mayúsculas | manuscrita de imprenta |
| Alto (% del alto del cuadro, 16:9) | 5,9 (caja 5,8–6,0) | 2,8–3,9; gigantes 20 | 3,1 (caja 7,8) | 3,9 | titular 9,8 · segunda línea 6,2 · en diagrama 4 | 10 (5–14) |
| Soporte | caja roja ajustada al texto | sin caja | caja del color del objeto, sin radio ni sombra | sin caja | sin caja | sin caja |
| Entrada | fundido 7,5–12,5 f, o ya puesto en el corte | fundido 4–13 f | línea que abre en vertical, 5–7 f | letra a letra, 36 f | se escribe, 7–35 f por renglón | se escribe, 5,8 f por palabra |
| Palabras por rótulo | 1–4 | 1 | 1–2 | 4 (un solo rótulo en la pieza) | 1–6, mediana 3 | 1–6, mediana 3 |

- La letra manuscrita se usa al doble o más del cuerpo de una tipografía de imprenta: 9,8–10 % del alto en RSA y MP
  frente a 2,8–5,9 % en VOX, JH, KZ y GA. Son piezas distintas, no una comparación dentro de la misma pieza.
- En los bocadillos el texto va primero y el contorno después (MP 7 de 7, RSA 3 de 3).
- La voz lleva el texto: MP escribe 49 palabras para unas 281 habladas; GA no escribe ni la cifra que la voz dice.

## 7. Por piel del kit

| Piel | Referentes | Gesto (f) | Trazo de construcción | Grosor a 1080 (px) | Vueltas | Paso | Hierve | Curva |
|---|---|---|---|---|---|---|---|---|
| `marcador` | VOX, JH | 6–12 (VOX) · 16–24 (JH, más lento y parejo) | 4–8 px/f, constante | 3–4 digital, 6,5–8,6 rotulador real | 1,1 normal, 1,5–1,8 para énfasis | 2 en documental | no | constante o lento-rápido-lento |
| `vector` | KZ, GA | 10–19 flechas · 6 etiquetas | 9–15 px/f, constante con freno de 4 cuadros | 7 líneas, 11–13 flechas | 1,0 | 1 | no | constante; pops con exceso de 6–33 % |
| `tiza` | RSA, MP | 5–12 | 51 % del ancho por segundo al escribir (RSA) | 5–6 texto, 7,6–9 titular, 14 repasado | 1,0–1,05 | 1 | no | constante |

Ningún referente es de tiza sobre pizarra oscura: RSA y MP son marcador negro sobre blanco. El borde roto y la
opacidad de la piel `tiza` no tienen medición.

## 8. Cambios que pide esto en el kit

No se editó `pieles.tsx` ni `mano.ts`. Esta es la lista exacta, con el valor de hoy, el propuesto y la medición.

### `studio/src/components/anotacion/pieles.tsx`

| Campo | Hoy | Propuesto | Sustento |
|---|---|---|---|
| `marcador.grosor` | 7 | **5** (9 con rotulador grueso, por prop) | VOX digital 3,2–4,3 px; rotulador real 6,5–8,6 px. 5 deja margen para pantalla de teléfono |
| `marcador.sobrepaso` | 0,08 | **0,12** | vueltas 1,05–1,15 en 4 de 8 círculos de VOX y JH |
| `marcador.hierve` | 0 | 0 (se queda) | ninguna anotación hierve |
| `marcador.escalaFuente` | 1,3 | **1,6** (indicativo) | manuscrita 9,8–10 % del alto frente a 2,8–5,9 % de imprenta, entre piezas distintas |
| `vector.grosor` | 5 | **7** | KZ línea 6,8 px; flechas 11–13 px por prop |
| `vector.sobrepaso` | 0 | 0 (se queda) | KZ 1,0 vueltas |
| `tiza.pasadas` | 2 | **1** | RSA y MP dibujan de una pasada; repasan solo para énfasis |
| `tiza.hierve` | 4 | **0** | los cuadros de hold son idénticos en MP y RSA |
| `tiza.sobrepaso` | 0,05 | **0,02** | 1,0–1,05 vueltas |
| `tiza.grosor` | 8 | 8 (se queda) | MP 7,6 px, RSA titular 9,2 px |
| `tiza.escalaFuente` | 1,3 | **1,6** (indicativo) | igual que `marcador` |
| `temblor`, `opacidad`, `rugoso` | — | sin cambio | no se pudieron medir (§3, §7) |

Campos nuevos en `PielCfg`:

- `paso: number` — cada cuántos cuadros avanza el trazo: `marcador` **2**, `vector` 1, `tiza` 1. En una comp a
  30 fps equivale a dibujar a 12–15 por segundo.
- `sobrepasoEnfasis: number` — fracción de vuelta extra cuando el círculo es el énfasis del beat: `marcador`
  **0,5** (VOX 1,5–1,6; JH 1,8), `vector` 0, `tiza` 0.
- `grosorEnfasis: number` — `tiza` **14** (MP repasa a 1,3 % del ancho), `marcador` 9, `vector` 12.

### `studio/src/components/anotacion/mano.ts`

| Función | Hoy | Propuesto | Sustento |
|---|---|---|---|
| `durTrazo(d)` | `clamp(6, 26, durationForDistance(L) − 4)`, o sea 4 + 0,9·√L | `clamp(6, 12, round(5 + 0,2·√L))` | VOX: flechas de 146–324 px en 6,3–12,5 f; círculo de ≈ 1.300 px en 8,8 f. Con la fórmula nueva: 150 px → 7 f, 320 px → 9 f, 1.300 px → 12 f |
| `durRuta(d)` (nueva) | no existe | `clamp(18, 100, round(L / 9))` | trazos de construcción a 3,6–14,6 px/f, mediana 9 (§2) |

### `Trazo.tsx` y `piezas.tsx`

| Dónde | Hoy | Propuesto | Sustento |
|---|---|---|---|
| `Trazo`, prop `curva` por defecto | `"arriveSoft"` | `"move"` (lento-rápido-lento) para gestos | 18 de 24 trazos con curva gradual son constantes o lento-rápido-lento; 2 frenan |
| `Trazo` en modo ruta | — | velocidad constante con freno en los últimos 4 cuadros; hace falta una curva nueva o una excepción a AI-01 para trazos de construcción | KZ, JH, GA |
| `durFlecha` | `durTrazo + 5` | `durTrazo + 2` | punta 0–2,5 f después del cuerpo |
| Punta de `Flecha` | `dur={5}` | `dur={2}` | VOX 1,3–2,5 f; RSA 0–2; KZ y MP 0 |
| Arranque del gesto en `marcador` | arranca al 0 % | 2–3 cuadros con un tramo corto quieto y después el resto | VOX: 4 de 9 trazos digitales animados |
| `Callout`, texto respecto al contorno | — | texto primero, contorno después | MP 7 de 7, RSA 3 de 3 |
| Etiqueta de `Nodo` | — | entra 3–6 cuadros después del pico del nodo; varias, escalonadas 2–4 cuadros | KZ |
| Salida de anotación de diagrama | — | en reversa de la entrada, 4–6 cuadros, con 2–8 de anticipación | KZ |

## 9. Cómo se midió

1. `scripts/referentes/procesar.sh` baja el video a 720p; `tramo.sh` recorta el tramo, corre `medir.py` y
   `scripts/critica/medir_pieza.py` y deja una hoja de contactos a 4 cuadros por segundo.
2. `tira.sh` saca tiras a fps completo con el tiempo en cada celda y recorte por zona.
3. `trazo.py` cuenta, cuadro a cuadro, la tinta nueva de una zona (por diferencia contra un cuadro base o por color
   con `--tinta`) y devuelve inicio, fin, forma, paso y permanencia. Se validó contra una tira: el círculo de prueba
   de VOX dio 10,567–10,859 s frente a 10,56–10,85 s leídos a ojo.
4. El agente `analista-referencias` confirmó cada valor en su tira; si la tira contradecía al medidor, ganó la tira.

`trazo.py` falla con tinta negra cuando la mano está en cuadro (cuenta el capuchón del marcador y pierde lo que la
mano tapa): en MP fue fiable en 5 de 78 zonas y en RSA se reemplazó por un conteo por píxel. A 12 fps cada cuadro
vale 2,5 f a 30, así que las duraciones de MP son cotas superiores.

## Fuentes

- Vox, "This photo triggered China's Cultural Revolution" (serie Darkroom): https://www.youtube.com/watch?v=kXByOrRrO7c (tramo 114–192 s, medido 2026-11-11)
- Johnny Harris, "The International Date Line, Explained": https://www.youtube.com/watch?v=aBppb2quqkE (tramos 18–62 s y 150–228 s, medido 2026-11-11)
- Kurzgesagt – In a Nutshell, "How Small Is An Atom? Spoiler: Very Small.": https://www.youtube.com/watch?v=_lNF3_30lUE (tramo 63–135 s, medido 2026-11-11)
- TED, "What is net-zero? | Kristen Bell + Giant Ant": https://www.youtube.com/watch?v=QPmUAfuqM08 (pieza completa, medido 2026-11-11)
- Royal Society of Arts, "RSA ANIMATE: Drive: The surprising truth about what motivates us": https://www.youtube.com/watch?v=u6XAPnuFjJc (tramo 204–276 s, medido 2026-11-11)
- minutephysics, "Minute Physics: What is Gravity?": https://www.youtube.com/watch?v=p_o4aY7xkXg (pieza completa, medido 2026-11-11)
