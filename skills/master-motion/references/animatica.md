# Animática

La animática es la pieza entera **sin animar**: cada objeto en la pose final de su beat, la cámara saltando de un
encuadre al siguiente y la voz encima. Se aprueba el ritmo antes de gastar una hora en curvas. Se hace para
explainers y piezas con locución; tipografía cinética, anuncios cortos, intros y logos se la saltan.

Se construye sobre el `<Mundo>` (`studio/src/lib/mundo.tsx`) y **es el mismo archivo que después será la pieza**:
`studio/src/compositions/<Pieza>.tsx`. Lo que se decide aquí (tiempos, coordenadas de mundo, encuadres, estados)
no se vuelve a escribir.

## Qué entra y qué no

| Entra | No entra todavía |
|---|---|
| La voz (`<Audio>`) y los tiempos por `cue()` | Curvas, springs, `mover()`, squash, retrasos |
| Todos los objetos, en su sitio del mundo y en la pose final de cada beat | Entradas y salidas |
| El objeto que persiste, como una sola capa con una pose por beat | Anotaciones del kit dibujándose (van como marcas fijas) |
| Cámara en cortes: keyframes `"hold"` de `trackObj` | Viajes de cámara, paralaje, foco, cámara en mano |
| Texto en pantalla literal, en su tamaño y sitio | Blur, `Look`, texturas, sombras, SFX |
| Formas simples o los bocetos como relleno | Assets finales (pueden entrar si ya existen) |

Si aparece una curva en la animática, se está animando antes de tiempo.

## Cómo se arma

1. **Tiempos desde la voz.** `loadWords(voz)` y un `cue(words, "palabra", n, FPS)` por beat, con las palabras del
   guion (`<Pieza>.beats.json`). Antes: `node scripts/voz/probar-cue.mjs studio/src/data/<pieza>.voz.json --beats studio/storyboards/<Pieza>.beats.json`.
2. **Mundo.** Un sitio fijo en px de mundo para cada cosa; (0, 0) es el centro. El lienzo es más grande que el
   cuadro: lo que la cámara no encuadra existe igual.
3. **Encuadres.** Un rectángulo del mundo por beat y `encuadrar(zona, pantalla)`: se dice qué se quiere ver, no
   dónde está la cámara.
4. **Cámara en cortes.** `trackObj(frame, [...])` con un keyframe por beat y `curva: "hold"` en todos menos el
   primero: mantiene el encuadre anterior y salta al llegar.
5. **Estados.** `track` y `trackObj` con `"hold"` para lo que cambia de valor o de pose; `frame >= T.beat` para lo
   que aparece. El objeto que persiste es una sola `<Capa>` con una pose por beat.
6. **Anotaciones como marcas fijas:** un recuadro punteado con su nombre donde irá cada pieza del kit. Sirve para
   ver que cabe en el encuadre y que no tapa nada.
7. Se registra en `compositions/index.ts` y se mira en `cd studio && npm run studio`, o se saca un borrador en
   `scripts/host.sh run`: `npx remotion render src/index.ts <Pieza>-<formato> out/<pieza>-animatica.mp4 --scale=0.5`.

## Esqueleto mínimo

Es la animática del ejemplo «Mesa» (`guion.md`). Compila contra `studio/src/lib/` y pasa el linter tal cual:

```tsx
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import voz from "../data/mesa.voz.json";
import { cue, loadWords } from "../lib/cues";
import { FPS } from "../lib/formatos";
import { Mundo, Plano, encuadrar } from "../lib/mundo";
import { Capa } from "../lib/rig";
import { track, trackObj } from "../lib/timeline";
import { marca } from "../marca/marca";

/**
 * ANIMÁTICA de «Mesa» (storyboards/Mesa.guion.md). Poses finales de cada beat, cámara en cortes y
 * la voz encima. Aquí se aprueba ritmo, lectura y encuadres; todavía no hay curvas ni anotaciones.
 */
const c = marca.colores;
const words = loadWords(voz);

// 1 · Tiempos: cada beat arranca en una palabra de la voz. Ningún segundo escrito a mano.
const T = {
  olvido: 0,
  mesa: cue(words, "distraída", 1, FPS),
  caida: cue(words, "cada", 1, FPS),
  ventana: cue(words, "eso", 1, FPS),
  tres: cue(words, "así", 1, FPS),
};
export const MESA_DURACION = Math.round(voz.duracion * FPS) + 60; // hold final de 2 s

// 2 · Mundo: todo tiene un sitio fijo en px de mundo. La mesa está en el centro.
const MESA = { x: 0, y: 0, ancho: 1700, alto: 560 };
const hueco = (i: number) => ({ x: -680 + i * 170, y: 0 }); // sitio de la hoja i sobre la mesa

// 3 · Encuadres: se dicen por lo que se quiere ver en cada beat, no por coordenadas de cámara.
const VER = {
  olvido: { x: -420, y: 0, ancho: 1000, alto: 640 },
  mesa: { x: 0, y: 0, ancho: 1900, alto: 800 },
  caida: { x: -620, y: 180, ancho: 1100, alto: 860 },
  ventana: { x: 0, y: 230, ancho: 2100, alto: 1250 },
  tres: { x: 0, y: -40, ancho: 1900, alto: 760 },
};

const Hoja: React.FC<{ doblada?: boolean }> = ({ doblada }) => (
  <div style={{ width: 140, height: 190, background: c.texto, border: `3px solid ${c.linea}`, borderTopRightRadius: doblada ? 46 : 0 }} />
);

/** Marca fija donde irá una anotación del kit. En la animática solo se juzga si cabe y si se lee. */
const Marca: React.FC<{ x: number; y: number; ancho: number; alto: number; nota: string }> = ({ x, y, ancho, alto, nota }) => (
  <Capa x={x} y={y} centrar>
    <div style={{ width: ancho, height: alto, border: `4px dashed ${c.acento}`, borderRadius: 24 }} />
    <div style={{ fontFamily: marca.fuenteMono, fontSize: 26, color: c.acento, marginTop: 8 }}>{nota}</div>
  </Capa>
);

export const Mesa: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pantalla = { ancho: width, alto: height };

  // Cámara en cortes: cada keyframe "hold" mantiene el encuadre anterior y salta al llegar.
  const camara = trackObj(frame, [
    { t: T.olvido, ...encuadrar(VER.olvido, pantalla) },
    { t: T.mesa, ...encuadrar(VER.mesa, pantalla), curva: "hold" },
    { t: T.caida, ...encuadrar(VER.caida, pantalla), curva: "hold" },
    { t: T.ventana, ...encuadrar(VER.ventana, pantalla), curva: "hold" },
    { t: T.tres, ...encuadrar(VER.tres, pantalla), curva: "hold" },
  ]);

  // Estado del diagrama: cuántas hojas hay en la mesa en cada beat.
  const hojas = track(frame, [
    { t: T.olvido, v: 6 },
    { t: T.mesa, v: 9, curva: "hold" },
    { t: T.tres, v: 3, curva: "hold" },
  ]);
  // El objeto que persiste: la primera hoja. Tiene una pose por beat y es siempre la misma capa.
  const primera = trackObj(frame, [
    { t: T.olvido, ...hueco(0), rot: -3 },
    { t: T.caida, x: -1010, y: 470, rot: -24, curva: "hold" },
    { t: T.tres, ...hueco(0), rot: 0, curva: "hold" },
  ]);
  const en = (t: number) => frame >= t;

  return (
    <AbsoluteFill style={{ background: c.fondo }}>
      <Audio src={staticFile(voz.audio)} />
      <Mundo camara={camara}>
        <Plano z={0}>
          <Capa x={MESA.x} y={MESA.y} centrar>
            <div style={{ width: MESA.ancho, height: MESA.alto, background: c.superficie, border: `6px solid ${c.linea}`, borderRadius: 18 }} />
          </Capa>
          {Array.from({ length: hojas - 1 }, (_, i) => (
            <Capa key={i} {...hueco(i + 1)} centrar>
              <Hoja />
            </Capa>
          ))}
          {en(T.caida) && !en(T.tres) && (
            <Capa x={860} y={0} centrar>
              <Hoja />
            </Capa>
          )}
          <Capa {...primera} centrar>
            <Hoja doblada />
          </Capa>

          {!en(T.mesa) && <Marca {...hueco(0)} ancho={220} alto={260} nota="círculo · «lo primero»" />}
          {en(T.ventana) && !en(T.tres) && <Marca x={0} y={-380} ancho={620} alto={90} nota="callout · ventana de contexto" />}
          {en(T.tres) && <Marca x={-510} y={0} ancho={560} alto={280} nota="círculo · «las tres»" />}
        </Plano>
      </Mundo>
    </AbsoluteFill>
  );
};
```

Notas sobre el esqueleto:

- `T` es el único sitio donde viven los tiempos. Toda la animación posterior se escribe relativa a `T.<beat>`.
- `trackObj` exige que todos los keyframes traigan las mismas propiedades (`x`, `y`, `zoom` aquí).
- Un keyframe `"hold"` no registra evento en la auditoría: la animática da densidad cero en `motion-audit`, y
  está bien. No se le corre `verify --genre` hasta que sea animación.
- `voz.audio` es la ruta que dejó `transcribir.sh` (`voz/<pieza>.wav` bajo `studio/public/`).

## Qué se aprueba (puerta 2b)

La persona ve la animática completa con la voz, no stills. Se pregunta por:

- **Ritmo:** ¿cada beat dura lo que necesita? ¿Algún corte llega tarde o temprano respecto de la palabra?
- **Lectura:** ¿alcanza a leerse cada texto y a entenderse cada estado antes del siguiente corte?
- **Encuadres:** ¿se sabe dónde mirar en cada uno? ¿El objeto que persiste se reconoce al cambiar de plano?
- **Historia:** con el audio apagado, ¿se sigue?

**La música se elige aquí**, no al final: tres opciones (de librería con licencia
comercial) probadas debajo de la voz en la animática. La elegida queda en `studio/public/musica/<pieza>.mp3`.

Las notas se dan en números y sobre el guion: «el beat 3 arranca en *cuando*, no en *cada*», «el encuadre 4 más
abierto, 15 %». Cambiar una palabra de `cue` o una zona de `VER` cuesta una línea. Si la nota es de guion (falta
un beat, sobra una frase), se vuelve al guion y a la voz: es el momento barato para hacerlo.

## De la animática a la animación

No se rehace la escena. Se cambia, en este orden y sin tocar `T`, las coordenadas ni `VER`:

| En la animática | En la animación | Con qué |
|---|---|---|
| Keyframes de cámara `"hold"` | Viaje con curva, y un keyframe `"hold"` antes para sostener el encuadre | `trackObj` con `"move"` / `"arriveSoft"`; ver `compositions/tests/MotorMundo.tsx` |
| Poses que saltan (`"hold"`) | Movimiento con anticipación y asiento | `mover()`, `track` con curva, `conRetraso`, `estirar` de `lib/timeline.ts` |
| `frame >= T.beat` | Entrada con curva `-out` o spring, salida más corta | `arrive`, `enterStyle` de `lib/motion.ts` |
| `<Marca>` | La pieza del kit en las mismas coordenadas, con `inicio={cue(...)}` en su palabra | `Circulo`, `Flecha`, `Callout`… de `components/anotacion` |
| Formas de relleno | Assets de la pieza | `CutoutObject`, SVG por partes en `<Capa>` |
| Un plano | Fondo y primer plano con profundidad, foco y cámara en mano | `<Plano z>`, `apertura`, `mano` de `<Mundo>` |
| Nada | Blur de obturador, look, sonido | `BlurCamara` de `lib/blur.tsx`, `Look`, `sfx()` |

Regla de la cámara al convertir un corte en viaje: el viaje **termina** en `T.beat` más unos cuadros, no empieza
ahí. La cámara llega cuando la voz nombra lo que se ve.

La animática aprobada se guarda con un commit propio antes de empezar a animar: es la referencia de ritmo contra
la que se compara la pieza terminada.
