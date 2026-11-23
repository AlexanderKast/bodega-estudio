# Bodega Estudio

El estudio de video de **Bodega de Belleza** dentro de Claude Code. Junta el director de motion y las plantillas
de Master Motion con un editor de grabaciones, con la marca de Bodega y las reglas aprendidas de su material.

Corre en el computador donde se instala o en el VPS de Bodega (`estudio.config.json`). El material de Bodega no
sale de esos equipos.

## Comandos

| Comando | Para qué |
|---|---|
| `/bodega-doctor` | Revisa que el equipo (y el VPS) tenga todo; dice qué instalar |
| `/mm-catalogo` | Muestra las plantillas y presets |
| `/mm-plantilla` | Hace un video con una plantilla y tu contenido |
| `/master-motion` | Dirige una pieza a medida: brief → guion → voz → storyboard → animática → animación → crítico |
| `/mm-render` | Render y master de una pieza aprobada |
| `/replicar <url>` | Convierte la edición de un Reel o TikTok en plantilla propia |
| `/editar-crudo` | _Próximo (F4):_ edita grabaciones crudas con cortes, subtítulos y marca |
| `/podcast` | _Próximo (F5):_ corte largo y clips verticales del podcast |
| `/video-producto` | _Próximo (F6):_ producto + descripción + referente → video |

## Presets

La tabla la genera `node scripts/catalogo.mjs`; el catálogo visual está en `catalogo/index.html`.

<!-- catalogo:presets -->
| Grupo | Presets |
|---|---|
| Tipografía | MaskTitle · CharCascade · WordRotator · MarkerHighlight · ScrambleResolve · StretchRepeater · VariableAxisType · TextOnPath · TextWarp · TextTunnel · MarqueeRows · BlurStack · TypeSandwich |
| Datos | LineDraw · CountUp · MapTrace · BarRace · UnitGrid |
| Retención y captions | LowerThird · KaraokeCaption · WordWindowCaption · PunchIn · SpeedLines · ImpactFrame · ChipCaption · Pill |
| Forma, cámara y 3D | CameraRig · Parallax · DepthCards · LogoSting · BlenderLayer · ShapeMorph · GooeyMerge · IsoScene · CutoutObject |
| Transiciones | SplitReveal · Whip · ZoomThrough · MaskWipe · NoiseBlocks · ClockWipe · LightLeak |
| Texturas y estilos | GlitchHit · LottieLayer · Look · BoilLine · RisoLayer · BayerDither · PaperTear · SliceDisplace · GradientFlow |
| Renders de servidor | DeviceOrbit · ClayRebote · Datamosh |
| Interfaz y producto | Cursor · ScreenFrame · BentoGrid · CardMorph · CardCarousel · BeforeAfter · SplitStack |
| Anotación | Trazo · Circulo · Recuadro · Flecha · Subrayado · Tachado · Callout · Nodo · AnilloPunteado · Llave · DatoCallout · PasoTracker · Lupa |
<!-- /catalogo:presets -->

## Estructura

```
estudio.config.json   dónde corre (local | vps), modelo de Whisper, render
scripts/host.sh       único punto de ejecución (local o VPS por SSH)
scripts/doctor.sh     revisión del entorno
scripts/humo.sh       prueba de render de 5 s
studio/               Remotion: marca de Bodega, kit de movimiento, presets, plantillas
kb/                   criterio de motion (anti-look-IA, tiempos, tipografía, sonido…)
skills/               director de motion, plantillas y estilo-bodega
agents/               analista-referencias y critico-motion
referentes/bodega/    fichas medidas del material de Bodega y de la categoría
ops/                  Docker para el VPS de Bodega
trabajo/              material del cliente y temporales (fuera de git)
estudio.local.json    ajustes de este computador: carpetas del Escritorio, ejecucion (fuera de git)
```

En el computador del equipo, el material y las entregas van en `Escritorio\Bodega Estudio\` (01 Crudos … 05 Entregas).

## Instalar

Lo más fácil: pega en Claude Code el prompt de [PROMPT-INSTALACION.md](PROMPT-INSTALACION.md). Clona el estudio,
instala lo que falte, conecta el plugin y hace la prueba de render.

A mano:

```
/plugin marketplace add AlexanderKast/bodega-estudio
/plugin install bodega-estudio@bodega-estudio
```

Antes hay que clonar el estudio y sus programas: paso a paso en [INSTALAR.md](INSTALAR.md).

## Fases

| Fase | Entrega | Estado |
|---|---|---|
| F1 | Esqueleto, ejecución local/VPS, doctor, Docker | hecha |
| F2 | Marca de Bodega en el studio | hecha (catálogo con miniaturas y videos de ejemplo con la marca) |
| F3 | Entrenamiento con videos publicados, crudos, referentes y podcast | espera material |
| F4 | `/editar-crudo` | pendiente |
| F5 | `/podcast` | pendiente |
| F6 | `/video-producto` | pendiente |
| F7 | Instalación en el equipo de Bodega y en el VPS | pendiente |

Origen y licencias: `UPSTREAM.md` y `CREDITOS.md`.

## Licencia y marca

El código es MIT (ver `LICENSE`). La marca de Bodega de Belleza (logos de `studio/public/marca/`, `studio/src/marca/` y
el nombre) es de Inversiones Brush CS S.A.S. y **no** entra en la licencia MIT: no se usa fuera de piezas de Bodega.
El material de Bodega (crudos, podcast, conversaciones) nunca se sube a este repositorio.
