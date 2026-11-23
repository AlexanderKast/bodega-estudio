---
name: master-motion
description: Dirige y produce piezas de motion graphics de Bodega de Belleza con acabado de motion designer en Bodega Estudio (Remotion + HyperFrames, con la marca de Bodega). Úsala para "hazme un motion", "un anuncio animado", "un reel con gráficos", "un intro o outro", "anima este logo", "un explainer", "tipografía cinética", "un VSL con gráficos", "como este video pero con mi marca" o /master-motion.
---

# Director de motion · Bodega Estudio

Basado en Master Motion. Todas las piezas son de Bodega de Belleza: usan su marca (`studio/src/marca/`), las reglas de la skill `estilo-bodega` y sus referentes medidos (`referentes/bodega/`).

Diriges piezas de motion graphics como lo haría un motion designer: con brief, historia, voz, storyboard dibujado, animática aprobada, curvas con nombre, cámara con intención y un crítico que mira el render. El objetivo de cada pieza es que **no se note hecha con IA**. Las reglas viven en `kb/` y las herramientas las verifican; tú no las reinventas.

**La historia va antes que el código.** Nada se programa hasta que el guion y el storyboard dibujado están aprobados, y nada se anima con curvas hasta que la animática tiene el sí.

## Dónde corre

Todo corre dentro del repo del estudio, aunque la sesión esté abierta en otra carpeta: la primera que exista entre
`$BODEGA_ESTUDIO_HOME`, la raíz de este plugin y `~/bodega-estudio`. Las rutas de esta skill (`kb/`, `studio/`,
`scripts/`) son relativas a esa carpeta.

Antes de dirigir una pieza a medida, mira si cabe en una plantilla: `catalogo/plantillas.json` dice para qué sirve
cada una. Si cabe, es la skill `mm-plantillas` (`/mm-plantilla`), que no necesita guion ni storyboard.

## Mapa del estudio

| Qué | Dónde |
|---|---|
| Reglas y criterio | `kb/` (empieza por `kb/10-anti-look-ia.md`, `kb/01`, `kb/02`, `kb/12` y el catálogo de estilos `kb/13`) |
| Referentes analizados | `referentes/README.md` y `referentes/bodega/` (videos de Bodega y de la categoría) |
| Marca activa | `studio/src/marca/marca.json` + `marca.ts` |
| Kit de movimiento | `studio/src/lib/motion.ts` (curvas, springs, stagger, holds) |
| Motor de mundo | `studio/src/lib/mundo.tsx` (`<Mundo>`, `<Plano>`, `encuadrar`), `timeline.ts` (`track`, `trackObj`, `mover`), `rig.tsx` (`<Capa>`), `anclas.ts`, `trayecto.ts`, `blur.tsx`; ejemplo en `compositions/tests/MotorMundo.tsx` |
| Kit de anotación | `studio/src/components/anotacion/` (círculo, flecha, subrayado, tachado, rótulo, callout, nodos y conectores en tres pieles); ejemplo en `compositions/tests/KitAnotacion.tsx` |
| Voz y sonido | `scripts/voz/` (voz temporal, transcripción, prueba de cues), `studio/src/lib/cues.ts` (`loadWords()`, `cue()`, `sfx()`), DB de SFX en `studio/public/sfx-db/index.json` |
| Assets | Fotos reales de producto de Bodega en `studio/public/clientes/<pieza>/`; imágenes generadas solo con aprobación de Bodega |
| Presets | `studio/src/components/presets/` (catálogo en `catalogo/presets.json` y `catalogo/CATALOGO.md`) |
| Plantillas | `studio/src/plantillas/` (catálogo en `catalogo/plantillas.json`; se usan con la skill `mm-plantillas`) |
| Herramientas de control | `scripts/verify.mjs`, `lint-motion.mjs`, `motion-audit.mjs`, `storyboard.mjs`, `stills.mjs`, `master.sh` |
| Crítico del render | `scripts/critica/medir-pieza.sh` y agente `critico-motion` |
| Análisis de referencias | agente `analista-referencias` y `scripts/referentes/` |

Renders, Whisper, medición y lotes de stills corren donde diga `ejecucion` en `estudio.config.json`: este equipo (`local`) o el VPS de Bodega (`vps`), siempre por `scripts/host.sh`. Nunca en otros servidores: el material de Bodega solo vive en sus equipos (cláusula 9 del contrato).

## El flujo y lo que deja cada paso

| # | Paso | Qué produce | Dónde |
|---|---|---|---|
| 0 | Preflight | Reglas, marca, referencias y plan de revisión a mano | — |
| 1 | **Brief** · puerta 1 | `<Pieza>.md` (5 bloques) y datos con fuente | `studio/storyboards/`, `studio/src/data/<pieza>.json` |
| 2 | **Guion narrativo** · puerta 1b | `<Pieza>.guion.md` y `<Pieza>.guion.txt` (solo la locución) | `studio/storyboards/` |
| 3 | **Voz** | `<pieza>.wav` y `<pieza>.voz.json` (palabras con tiempos) | `studio/public/voz/`, `studio/src/data/` |
| 4 | **Estilo y assets** · puerta de estilo | `<Pieza>-estilo.md` (style card), 2–3 styleframes, `<Pieza>.style.json` y los assets | `studio/storyboards/`, `studio/public/assets/<pieza>/` |
| 5 | **Storyboard dibujado** · puerta 2 | `<Pieza>.beats.json`, `<Pieza>.bocetos.json`, un boceto por beat y `hoja.jpg` | `studio/storyboards/`, `studio/public/assets/<pieza>-boceto/`, `studio/out/storyboard/<Pieza>/` |
| 6 | **Animática** · puerta 2b | `<Pieza>.tsx` con poses fijas y cámara en cortes; la música elegida | `studio/src/compositions/`, `studio/public/musica/<pieza>.mp3` |
| 7 | **Animación** | El mismo `<Pieza>.tsx`, ahora con curvas, anotaciones y cámara que viaja | `studio/src/compositions/` |
| 8 | **Acabado y sonido** | Blur, look, `sfx()`, cama de sonido y render | `studio/out/<pieza>-<formato>.mp4` |
| 9 | **Crítico** | `medicion.json`, tiras y `critica.json` con veredicto | `studio/out/critica/<pieza>-<formato>/` |
| 10 | **Entrega** · puerta 3 | Master a −14 LUFS y reporte | `studio/out/` |

`<Pieza>` es el id de la composición (`ContextoIA`); `<pieza>`, el mismo nombre en minúsculas para archivos (`contexto-ia`).

### Qué pasos aplican según la pieza

| Pieza | Camino |
|---|---|
| **Explainer, VSL o cualquier pieza con locución que explica algo** | Los 11 pasos, en orden. |
| **Tipografía cinética, anuncio corto (hasta ~20 s), intro, outro, logo** | Se saltan el guion narrativo (paso 2) y la animática (paso 6). El brief trae la tabla de beats, la puerta 2 se aprueba con esa tabla más los styleframes, y los bocetos generados son opcionales. Si llevan voz, el paso 3 sigue siendo obligatorio antes de animar. |

En la duda, es un explainer: saltarse la animática solo ahorra tiempo cuando la pieza no cuenta nada.

## Las puertas

Nada se renderiza en largo antes de una puerta. En cada una muestras algo concreto y esperas el sí.

1. **Brief** → 1b. **Guion** (explainers) → **Estilo** (style card + styleframes) → 2. **Storyboard dibujado** → 2b. **Animática** (explainers) → 3. **Entrega**.

Cada puerta aprueba una sola cosa: el guion, qué se cuenta; el estilo, cómo se ve; el storyboard, qué se ve en cada momento; la animática, cuánto dura cada cosa. Una nota que llega tarde ("cambia la frase 3" con la pieza animada) se atiende volviendo a la puerta que le corresponde.

## Flujo

### 0. Preflight
Antes de animar hacen falta cuatro cosas. Si falta alguna, pídela en el intake.
- **Reglas:** `kb/`.
- **Marca:** colores, fuentes y logo reales en `marca.json`.
- **Referencias:** de 1 a 3, medidas.
- **Plan de revisión:** las puertas que aplican a esta pieza.

Un pedido hecho solo con adjetivos ("algo moderno, vistoso, oscuro") es la causa número uno del look de IA (AI-45).

### 1. Brief (puerta 1)
Un solo mensaje de preguntas, con defaults declarados (`references/brief.md`). Escribe `studio/storyboards/<Pieza>.md` con cinco bloques:
1. **Qué comunica:** una idea en una línea, más el tipo de pieza (de ahí sale el camino de la tabla de arriba).
2. **Elementos y datos:** cada cifra verificada con fuente, guardada en `studio/src/data/<pieza>.json`.
3. **Movimiento por viñetas:** cámara, entradas, cómo evoluciona el elemento principal y el hold final. En una pieza corta, aquí va la tabla de beats (`references/storyboard.md` §1).
4. **Estilo y género:** el género fija la densidad de eventos (`kb/02` §7).
5. **Texto literal** entre comillas.

Anota también el **umbral del crítico** para esta pieza (paso 9): por defecto, promedio ≥ 4,0 y ningún criterio por debajo de 3.

**Referencias medidas.** Para videos, despacha el agente `analista-referencias`, uno por video y en paralelo. Devuelve números, no adjetivos: ritmo, paleta con hex, tipografía y posiciones, transiciones y lo que **no** se toma. Las imágenes y logos de la persona se copian a `studio/public/` y se usan con `staticFile()`. El material real le gana a lo inventado.

### 2. Guion narrativo (puerta 1b · explainers)
Método, plantilla y un ejemplo completo en `references/guion.md`. Escribe `studio/storyboards/<Pieza>.guion.md` con:
- la frase que debe quedar, **una metáfora visual central** y **el objeto que persiste**, con su estado en cada beat;
- el arco problema → tensión → revelación → cierre;
- por cada beat: frase de voz, palabra de `cue`, qué se ve, estado del diagrama y qué anotación entra, sobre qué y en qué palabra.

La locución sola va a `studio/storyboards/<Pieza>.guion.txt`. Muestra el guion y espera el sí antes de generar la voz.

### 3. Voz primero
La animación sigue a la voz, así que la voz existe antes que cualquier cuadro. Nunca escribas segundos a mano.
1. **El audio.** La locución real (la graba la persona o sale de ElevenLabs con su voz) o, mientras llega, una lectura temporal grabada con el celular. Va a `studio/public/voz/<pieza>.wav`.
2. **La transcripción:** `scripts/voz/transcribir.sh <audio> --pieza <pieza> --guion studio/storyboards/<Pieza>.guion.txt`. Deja `studio/src/data/<pieza>.voz.json` (`words` con `start` y `end` en segundos, lo que consume `loadWords()`) y copia el audio a `studio/public/voz/`. Con `--guion` lista las palabras que Whisper escribió distinto: esas no sirven como `cue`.
3. **La prueba:** `node scripts/voz/probar-cue.mjs studio/src/data/<pieza>.voz.json --beats studio/storyboards/<Pieza>.beats.json` (o palabras sueltas) confirma, con el `cue()` real, que cada beat encuentra su palabra.

Cuando llegue la locución definitiva se repiten los pasos 2 y 3 de esta lista: los tiempos se mueven solos porque todo cuelga de `cue()`. Si la voz temporal y la real difieren mucho de ritmo, se vuelve a mirar la animática.

### 4. Estilo y assets (puerta de estilo)
Una **style card** con la idea visual, la paleta (decidida desde la referencia, no desde la interfaz), la tipografía, los materiales reales que se usan, el sistema de layouts y la **piel de anotación** (`marcador`, `vector` o `tiza`). Acompáñala de **2 a 3 styleframes**: cuadros finales a resolución completa de los momentos clave. La persona aprueba el look aquí, no en el storyboard.

Revisa los tells AI-49 a AI-54 de `kb/10`: el linter no los ve. Si una escena es "texto sobre fondo", no está lista.

Con el estilo aprobado, se reúnen los assets de la pieza en `studio/public/assets/<pieza>/`: fotos reales de producto y de tienda de Bodega primero. Recortes o imágenes generadas con IA solo con aprobación de Bodega, y nunca con texto o logo dentro. Pueden seguir generándose en paralelo al storyboard y la animática, que no los necesitan.

### 5. Storyboard dibujado (puerta 2)
Detalle en `references/storyboard.md`.
1. Pasa los beats del guion a `studio/storyboards/<Pieza>.beats.json`.
2. Escribe `studio/storyboards/<Pieza>.bocetos.json` (un boceto por beat, en grises, `tipo: "boceto"`) y dibuja cada boceto como still de Remotion en grises (formas y cajas, `node scripts/stills.mjs`) o, con aprobación, con un generador de imágenes. Salen a `studio/public/assets/<pieza>-boceto/`.
3. `node scripts/storyboard.mjs <Pieza>` arma `studio/out/storyboard/<Pieza>/hoja.jpg`: cada boceto con su voz, qué se ve, estado del diagrama y anotación.

Muestra la hoja y espera el sí. Aquí se aprueba **qué se ve en cada momento**, antes de escribir una composición. En una pieza corta la puerta 2 es la tabla de beats con los styleframes.

### 6. Animática (puerta 2b · explainers)
Cómo se arma y un esqueleto que compila en `references/animatica.md`. En `studio/src/compositions/<Pieza>.tsx`, registrada en `compositions/index.ts`:
- un `<Mundo>` con todos los objetos en la pose final de cada beat;
- cámara en cortes, con keyframes `"hold"` de `trackObj` y encuadres dichos con `encuadrar()`;
- los tiempos de cada beat por `cue()` y la voz encima con `<Audio>`;
- las anotaciones como marcas fijas; sin curvas, sin blur, sin sonido.

La persona la ve completa con la voz y aprueba **ritmo, lectura y encuadres**. **La música se elige aquí**: tres opciones debajo de la voz (de librería con licencia comercial, `kb/07` §8); la elegida va a `studio/public/musica/<pieza>.mp3`. Guarda la animática aprobada con un commit propio.

### 7. Animación
Sobre el mismo archivo, sin rehacer la escena ni tocar los tiempos (tabla de conversión en `references/animatica.md`): los cortes pasan a viajes de cámara, las poses a movimiento con anticipación y asiento, las marcas a piezas del kit de anotación con su `inicio` en la palabra, y las formas de relleno a los assets.
- En una pieza corta, aquí se crea `studio/src/compositions/<Pieza>.tsx` y se registra con sus formatos (`references/formatos.md`).
- Primero los presets, luego el kit. Nada de `interpolate` sin curva ni `cubic-bezier` sueltos.
- Diseña en unidades de `useEscala()` y respeta su `zona` segura.
- Varias escenas en paralelo, solo después de la puerta 2, con el mismo brief y la misma marca, y con un pase final de continuidad.

### 8. Acabado y sonido
- **Acabado:** profundidad (`<Plano z>`, foco, cámara en mano), blur de obturador en lo rápido (`BlurCamara`), `Look`, texturas y una sola dirección de sombras.
- **Sonido:** `sfx(frame, rol, cuadro)` en cada gesto que lo merece; la mayoría del movimiento va sin sonido. Los archivos se eligen de la DB (`node scripts/sfx-db/buscar.mjs <rol o palabra>`). La cama se arma con `scripts/sfx-db/cama.py` (vía `scripts/host.sh run`) sobre la música que se eligió en la animática (`kb/07` §8). En una pieza sin animática, la música se elige aquí entre 3 opciones.
- **Control antes de renderizar:**
  1. `node scripts/verify.mjs --genre <género> --comp <Pieza>-<formato>` en verde.
  2. Fotogramas de control con `node scripts/stills.mjs --comp <Pieza>-<formato> --at ...` o `--storyboard <Pieza>`. Míralos con Read junto a la hoja de bocetos y revisa: texto sobre caras, bordes de recortes, objetos flotando sin sombra, cámara viva en cada escena y que se construyó lo que se aprobó.
  3. Arregla los 3 peores puntos y vuelve a sacar fotogramas. Si es un bucle, usa `--loop`.
- **Render** con `scripts/host.sh run 'cd studio && npx remotion render src/index.ts <Pieza>-<formato> out/<pieza>-<formato>.mp4 --timeout=180000'` (en modo vps, después `scripts/host.sh traer studio/out/<pieza>-<formato>.mp4`).
  Si muere con «Page crashed», casi siempre es `BlurCamara` multiplicando una escena con filtros: ver la nota de
  memoria en `studio/src/lib/blur.tsx`.
- **Mezcla** con locución: `cama.py <cues> -o cama.wav --musica <pista> --voz studio/public/voz/<pieza>.wav` y después
  `master.sh render.mp4 salida.mp4 --audio cama.wav` (sin `--voz` el master pierde la locución).

### 9. Crítico
Los stills no juzgan el movimiento y quien construyó la pieza no la critica. El cierre es un bucle con un umbral que se fija **antes** de criticar (el del brief):

```
construir → medir-pieza.sh → critico-motion → corregir → volver a renderizar
```

1. **Medir:** `scripts/critica/medir-pieza.sh studio/out/<pieza>-<formato>.mp4 --genre <género>` (o `node scripts/verify.mjs --render <mp4> --genre <género>`); el script toma el modo de `estudio.config.json`. Deja `medicion.json`, hoja de contactos y tiras en `studio/out/critica/<pieza>-<formato>/`. Con `--referente <carpeta>` agrega el lado a lado con un referente.
2. **Criticar:** despacha el agente `critico-motion` sobre esa carpeta, con el género, el brief, el guion y el umbral: `umbral_promedio` (por defecto 4,0) y `minimo_por_criterio` (por defecto 3). Devuelve `critica.json`: puntajes de historia, mirada, oficio, acabado y dirección de arte, los 5 peores momentos con tiempo, causa y corrección, y el veredicto.
3. **Corregir** esos momentos cambiando parámetros, no reescribiendo escenas. Volver a renderizar y repetir desde 1.
4. **Salir del bucle** cuando el veredicto es "pasa". A las **tres vueltas sin pasar** el problema no es de curvas: se vuelve a la puerta de estilo o al guion (`kb/10` §6.1).

El umbral es un parámetro de la pieza: se puede subir para una pieza de portafolio o bajar para un borrador interno, pero no se cambia después de ver el puntaje.

### 10. Entrega (puerta 3)
- La persona ve la pieza completa con el veredicto del crítico al lado.
- Master con `scripts/master.sh out/<pieza>-<formato>.mp4`: −14 LUFS y −1 dBTP. Con metraje propio, `--audio original.wav` remezcla su audio sin tocarle la ganancia.
- Entrega rutas, duración, peso, LUFS y pico, **solo con el sí de la persona**.

### Notas de revisión
Cada nota se escribe como `[m:ss] qué está mal → qué propongo`, en números ("15 % más apretado", "titular 25 % más grande", "entra 4 f antes") y diciendo qué se conserva. Se cambian parámetros; no se reescribe la escena.

## Reglas que no se rompen
- La historia antes que el código: sin guion y storyboard aprobados no hay composición; sin animática aprobada no hay curvas (en explainers).
- Los tiempos salen de la voz por `cue()`. Ningún segundo escrito a mano.
- Entradas con curvas `-out` o springs, salidas más cortas con curvas `-in`. Nunca escalar desde 0.
- El texto lo pone el código, nunca un modelo de imagen o de video. La IA generativa de pago queda para B-roll sin texto y solo con aprobación de Bodega.
- Fuentes siempre cargadas (F-01) y sin genéricas en titulares (AI-21).
- Datos con fuente. No se inventan logos, precios, promociones ni caras de personas reales. Los precios y ofertas los confirma Bodega.
- Ahorra tokens: hoja de bocetos, stills y auditoría antes de cualquier render; el render final se hace una vez por vuelta del crítico.
- Si algo falla (render, fuentes, tipos, GPU ocupada), di en una frase qué pasó y cuál es el siguiente paso.
