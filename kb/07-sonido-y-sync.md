# 07 · Sonido y sincronía

> En motion pro, **el audio dirige la animación**: se construye la pista (voz + música + SFX) primero y se anima sobre sus marcas. Un video con buen sonido y animación media se percibe mejor que al revés.

## 1. Flujo de trabajo

1. **Locución** (ElevenLabs o grabación) → normalizar → transcribir con Whisper (timestamps por palabra) en el servidor (GPU).
2. **Música**: elegir por BPM y estructura (intro / build / drop / outro). Extraer beats y downbeats (`librosa.beat.beat_track`, `madmom` o `aubio`) → `beats.json`.
3. **Marcas**: lista de eventos `{t, tipo: 'beat'|'downbeat'|'palabra'|'acento', etiqueta}`.
4. **Animar sobre las marcas** (Remotion lee el JSON; HyperFrames lo usa para `data-start`).
5. **SFX** al final: uno por acento visual.
6. **Mezcla y loudness** (ffmpeg en el servidor).

## 2. Reglas de sincronía

| Evento visual | Debe caer en | Tolerancia |
|---|---|---|
| Corte duro | beat o downbeat | ± 1 f (a 30 fps = ±33 ms) |
| Impacto / pop / hit | transiente del SFX o kick | 0 f a −1 f (la imagen puede adelantarse 1 f, nunca atrasarse) |
| Palabra en caption | inicio de la palabra (Whisper) | ± 1 f |
| Énfasis tipográfico | sílaba tónica de la palabra clave | ± 2 f |
| Inicio de transición whip | 4–6 f antes del beat (el corte cae en el beat) | — |
| Riser | termina exactamente en el hit | 0 f |

- **Frame de un tiempo**: `frame = Math.round(seg * fps)`. A 120 BPM, un beat = 0.5 s = 15 f a 30 fps; compás de 4 = 60 f. Elegir BPM que den frames enteros: a 30 fps → 60, 75, 90, 100, 120, 150 BPM (beat = 30, 24, 20, 18, 15, 12 f).
- **No todo en el beat**: animar en beats *seleccionados* (downbeats y acentos); los demás elementos con stagger entre beats. Todo en cada beat = metrónomo mecánico.
- Contra-ritmo: elementos secundarios en la corchea (medio beat) dan swing.

```ts
// beats.json → helper
import beats from './beats.json'; // [{t: 0.48, down: true}, ...]
export const beatFrames = (fps: number, soloDownbeats = false) =>
  beats.filter(b => !soloDownbeats || b.down).map(b => Math.round(b.t * fps));

// pulso visual ligado al beat más cercano
export const pulse = (frame: number, frames: number[], dur = 8) => {
  const last = [...frames].reverse().find(b => b <= frame);
  if (last === undefined) return 0;
  const d = frame - last;
  return d > dur ? 0 : Math.exp(-d / (dur / 3));   // 1 en el beat, decae
};
```

## 3. Audio reactivo (Remotion)

```tsx
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const src = staticFile('musica.mp3');
export const Barras = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const data = useAudioData(src);
  if (!data) return null;
  const bins = visualizeAudio({fps, frame, audioData: data, numberOfSamples: 32, smoothing: true});
  const graves = bins.slice(0, 4).reduce((a, b) => a + b, 0) / 4; // energía de bajos → escala del logo
  return <div style={{transform: `scale(${1 + graves * 0.15})`}} />;
};
```

- Para archivos largos usar `useWindowedAudioData()` (no carga todo el archivo).
- Reactividad sutil: escala 2–6 %, brillo 5–15 %. Más que eso marea.

## 4. Mezcla (valores objetivo)

| Elemento | Nivel |
|---|---|
| Master integrado (redes: YouTube, IG, TikTok, Spotify) | **−14 LUFS**, true peak ≤ **−1 dBTP** |
| Master para VSL / web propia | −16 LUFS (recomendación AES TD1008), −14 si se publica también en redes |
| Voz | protagonista; música por debajo 15–20 dB mientras habla |
| Música sin voz | sube 6–10 dB en 0.3–0.5 s (ducking release) |
| SFX (whoosh, pop, UI clicks) | −6 a −12 dB relativos a la voz; nunca tapar una palabra |
| Fades de música | in 0.2–0.5 s; out 1–2 s (o cortar en downbeat con cola de reverb) |

```tsx
// Ducking en Remotion con callback de volumen por frame
<Audio
  src={staticFile('musica.mp3')}
  volume={(f) => (vozActivaEn(f) ? 0.12 : 0.45)}  // suavizar con interpolate entre estados (≥ 8 f)
/>
```

ffmpeg (servidor) para el master:

```bash
ffmpeg -i mezcla.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=summary -ar 48000 master.wav
# ducking automático voz→música
ffmpeg -i musica.wav -i voz.wav -filter_complex "[0][1]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=300[m];[m][1]amix=inputs=2:normalize=0" mix.wav
```

## 5. Diseño de SFX por tipo de animación

| Animación | SFX | Offset |
|---|---|---|
| Whip / push | whoosh (cola corta) | arranca 3–5 f antes del pico de velocidad |
| Pop de icono/badge | pop, click suave, "bloop" | 0 f |
| Texto que entra por palabras | ticks muy suaves o nada | 0 f |
| Zoom through | whoosh + impacto sub | impacto en el corte |
| Logo reveal | riser 1–2 s → hit + reverb | hit en el frame de resolución |
| UI (tap, toggle) | click de UI real | −1 f |
| Count-up de número | tick por dígito al final o "rolling" corto | — |
| Glitch | digital crunch 4–8 f | 0 f |

Reglas: sin repetir el mismo archivo de SFX > 3 veces seguidas (variar pitch ±2–4 semitonos o usar variantes); SFX de librería con licencia (ElevenLabs SFX, Epidemic, Artlist, freesound CC0).

## 6. Reglas lintables

- Cortes (límites de `Sequence`/`TransitionSeries`) a > 2 f del beat más cercano (si hay `beats.json`) → warning.
- `Audio` de música sin curva de volumen ni ducking cuando hay pista de voz → warning.
- Master con integrado fuera de −14 ± 1 LUFS o TP > −1 dBTP (medido con `loudnorm print_format=json`) → error.
- Transición sin SFX dentro de ± 3 f → info.
- Mismo SFX > 3 veces consecutivas sin variación → warning.

## 7. Herramientas del estudio para la sincronía (2026-11-07)

- **Transcripción:** Whisper en el VPS de Bodega o en este equipo (speaches, large-v3-turbo). Recortar el silencio final o usar VAD antes de transcribir: Whisper alucina frases en bucle sobre el silencio (fichas `bQ_8Eu-hWCs`, `7O2_OV4tLj4`).
- **Cues por palabra:** `cue(words, "palabra", n)` de `studio/src/lib/cues.ts` devuelve el cuadro exacto; ninguna composición usa segundos tecleados.
- **Sonido por roles:** `sfx(frame, rol, cuadro, {keep})` marca cada gesto; `motion-audit` aplica la contención (≤ 1 riser, ≤ 2 whoosh largos, ~10 gestos por 10 s, nada chico pegado a un hit) y escribe `sfx-cues.json`. Tabla de roles y plan con earshot en `kb/12` §5.
- **Música al final:** se prueban 3 opciones sin tocar la imagen.
- **Master:** `scripts/master.sh` deja −14 LUFS y −1 dBTP, y reporta silencios para comparar con el plan de voz. El audio de metraje original se remezcla con `--audio` sin tocar su ganancia.

## 8. DB de SFX y música del estudio (2026-11-07)

**DB de SFX** (`studio/public/sfx-db/index.json`, 512 sonidos, 18 roles): 252 sonidos de earshot generados en código
(MIT) y 260 CC0 (Kenney, opengameart). Cada entrada tiene id, archivo, categoría, roles, descripción, duración,
momento del pico, ataque, brillo, nota, pico en dBFS y licencia.

- Buscar: `node scripts/sfx-db/buscar.mjs whoosh` · `--rol hit --max 0.5` · `--roles`.
- **Paleta por pieza** (`studio/src/marca/sonido.json`): un sonido por rol y su nivel en dB. Un solo kit por pieza; no
  se mezclan librerías dentro de una pieza.
- En la composición: `sfx(frame, "hit", cuadro, { keep: true })`; con `id` se elige un sonido concreto de la DB.
- **Cama de sonido:** `motion-audit` escribe `studio/out/audit/<comp>.sfx-cues.json` y, en el VPS de Bodega o en este equipo,
  `scripts/sfx-db/cama.py <cues> -o cama.wav [--musica pista.flac]` coloca el **pico** de cada sonido en el cuadro del
  gesto, aplica los niveles de la paleta y baja la música 9 dB antes de cada hit. Con locución, `--voz <audio>` la
  mezcla encima (pico −3 dBFS) para que el master no la pierda. Después:
  `scripts/master.sh pieza.mp4 --audio cama.wav`.
- La DB de SFX viene armada en `studio/public/sfx-db/`; este estudio no la reconstruye.
- Chequeo: `node scripts/sfx-db/check.mjs` (corre dentro de `verify`).

**Música:** en Bodega Estudio no se genera música en local (no hay GPU). Se usa música de librería con licencia comercial (la de `studio/public/musica/` o la que Bodega ya paga) o, solo con aprobación de Bodega, un generador pago. Toda pista nueva se anota con su licencia en `CREDITOS.md`.

## Fuentes

- Remotion — `visualizeAudio()`: https://www.remotion.dev/docs/visualize-audio (consultado 2026-11-07)
- Remotion — `useWindowedAudioData()`: https://www.remotion.dev/docs/use-windowed-audio-data (consultado 2026-11-07)
- Remotion — `<Audio>` y volumen por frame: https://www.remotion.dev/docs/audio/volume (consultado 2026-11-07)
- FFmpeg — `loudnorm`, `sidechaincompress`, `amix`: https://ffmpeg.org/ffmpeg-filters.html#loudnorm (consultado 2026-11-07)
- librosa — `beat.beat_track`: https://librosa.org/doc/main/generated/librosa.beat.beat_track.html (consultado 2026-11-07)
- AES TD1008 — Recommendations for Loudness of Internet Audio Streaming (recomienda entregar ~−16 LUFS; plataformas como YouTube/Spotify normalizan a ~−14): https://aes.org/community/technical-council/technical-document-aestd1008/ (consultado 2026-11-07)
- Telos Alliance — Understanding Loudness for Streaming Audio: https://docs.telosalliance.com/docs/understanding-loudness-for-streaming-audio (consultado 2026-11-07)
- HyperFrames — media controlada por el runtime (no hacer `play()`/`currentTime` desde GSAP): https://hyperframes.heygen.com/guides/gsap-animation (consultado 2026-11-07)
- Leon Lin — earshot (bank, kits, launch preset), commit 4ac3d2a: https://github.com/Leonxlnx/earshot (consultado 2026-11-07)
- ACE-Step — ACE-Step 1.5 (README, INFERENCE.md, licencia MIT), commit ca1e85f: https://github.com/ace-step/ACE-Step-1.5 (consultado 2026-11-07)
