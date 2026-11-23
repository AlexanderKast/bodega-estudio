# 09 · Blender (bpy headless, geometry nodes, cámaras, render con alfa)

> Bodega Estudio no trae Blender; esta guía queda como referencia por si un proyecto lo necesita.

> Blender corre donde diga `ejecucion` en `estudio.config.json` (este equipo o el VPS de Bodega) (RTX 4060 Ti, OptiX). El PC solo prepara la escena/script y recibe los frames. Salida típica: secuencia PNG RGBA o video con alfa para componer en Remotion/HyperFrames.

## 1. Ejecución headless

```bash
# Render de animación completa con un script de setup
blender -b escena.blend -P setup.py -- --out trabajo/renders/job01 --fps 30 --samples 128

# Solo un rango de frames (paralelizar en trozos)
blender -b escena.blend -E CYCLES -o trabajo/renders/job01/f_#### -F PNG -s 1 -e 90 -a

# Escena 100 % generada por script (sin .blend)
blender -b --factory-startup -P generar.py -- --config job.json
```

- `-b` background, `-P` script, `--` separa los args propios (leer con `sys.argv[sys.argv.index('--')+1:]`).
- Orden importa: `-o/-F/-s/-e` **antes** de `-a`/`-f`.
- `--factory-startup` evita addons/preferencias locales (reproducible).

## 2. Setup de render reproducible (Cycles GPU + alfa)

```python
# setup.py
import bpy, sys, argparse
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
p = argparse.ArgumentParser(); p.add_argument('--out'); p.add_argument('--fps', type=int, default=30); p.add_argument('--samples', type=int, default=128)
a = p.parse_args(argv)

sc = bpy.context.scene
r = sc.render
r.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'          # RTX → OPTIX; fallback 'CUDA'
prefs.get_devices()
for d in prefs.devices: d.use = (d.type != 'CPU')
sc.cycles.device = 'GPU'
sc.cycles.samples = a.samples
sc.cycles.use_denoising = True
sc.cycles.denoiser = 'OPTIX'

r.resolution_x, r.resolution_y, r.resolution_percentage = 1080, 1920, 100
r.fps = a.fps
r.film_transparent = True                    # fondo transparente
r.image_settings.file_format = 'PNG'
r.image_settings.color_mode = 'RGBA'
r.image_settings.color_depth = '16'          # evita banding al componer
r.use_motion_blur = True
r.motion_blur_shutter = 0.5                  # = shutter 180°
sc.view_settings.view_transform = 'AgX'      # (Blender ≥ 4.0) o 'Filmic' en 3.x
sc.view_settings.look = 'None'
r.filepath = a.out.rstrip('/') + '/f_'
bpy.ops.render.render(animation=True)
```

- **EEVEE** para previews rápidos: `r.engine = 'BLENDER_EEVEE_NEXT'` en Blender 4.2–4.x; en 5.x el identificador volvió a `'BLENDER_EEVEE'`. Verificar con `bpy.app.version`.
- **Sombras sobre fondo transparente**: plano suelo con `obj.is_shadow_catcher = True` (Cycles) → la sombra queda en el alfa y se compone sobre el fondo de Remotion.
- **Pases** para composición fina: `view_layer.use_pass_z`, `use_pass_mist`, cryptomatte → exportar OpenEXR multilayer (`'OPEN_EXR_MULTILAYER'`, `'ZIP'`).
- Color: Remotion trabaja en sRGB; con AgX el PNG ya sale en display sRGB. No re-aplicar gamma.

## 3. Cámaras con lenguaje de motion design

```python
import bpy, math
from mathutils import Vector
sc = bpy.context.scene
cam_data = bpy.data.cameras.new('Cam'); cam_data.lens = 50          # 35–85 mm = "producto premium"
cam_data.dof.use_dof = True; cam_data.dof.aperture_fstop = 2.0
cam = bpy.data.objects.new('Cam', cam_data); sc.collection.objects.link(cam); sc.camera = cam

target = bpy.data.objects.new('Target', None); sc.collection.objects.link(target)
c = cam.constraints.new('TRACK_TO'); c.target = target; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
cam_data.dof.focus_object = target

def key(obj, frame, loc):
    obj.location = Vector(loc); obj.keyframe_insert('location', frame=frame)

key(cam, 1, (0, -6.0, 1.2))     # push-in + orbita ligera
key(cam, 90, (0.8, -4.6, 1.35))

# Easing estilo AE: Bézier con handles AUTO_CLAMPED (≈ easy ease); o curvas con nombre
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
# Alternativas: kp.interpolation = 'EXPO'; kp.easing = 'EASE_OUT'  (equivale a `arrive`)
```

> En Blender ≥ 4.4 las acciones usan *slotted actions*; si `action.fcurves` no existe, iterar `action.layers[0].strips[0].channelbag(slot).fcurves`. Comprobar la versión del servidor.

Valores: lentes 35–50 mm para escenas, 85–135 mm para producto/close-up (menos distorsión, DOF más cremoso); `aperture_fstop` 1.4–2.8 para DOF visible; push-in 10–25 % de la distancia en 3 s.

## 4. Geometry Nodes por script

```python
import bpy
ng = bpy.data.node_groups.new('GN_Grid', 'GeometryNodeTree')
ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
n = ng.nodes; l = ng.links
gin, gout = n.new('NodeGroupInput'), n.new('NodeGroupOutput')
grid = n.new('GeometryNodeMeshGrid'); grid.inputs['Vertices X'].default_value = 12; grid.inputs['Vertices Y'].default_value = 12
inst = n.new('GeometryNodeInstanceOnPoints')
cube = n.new('GeometryNodeMeshCube'); cube.inputs['Size'].default_value = (0.12, 0.12, 0.12)
l.new(grid.outputs['Mesh'], inst.inputs['Points']); l.new(cube.outputs['Mesh'], inst.inputs['Instance'])
l.new(inst.outputs['Instances'], gout.inputs['Geometry'])

obj = bpy.context.active_object
mod = obj.modifiers.new('GN', 'NODES'); mod.node_group = ng
```

- Animar parámetros: insertar keyframes en `mod['Socket_2']` (el identificador del socket se lee en `ng.interface.items_tree`) o usar el nodo **Scene Time** para animación procedural.
- Patrones útiles: *instance on points* + *random value* (semilla fija) para campos de objetos; *simulation zone* (Blender ≥ 3.6) para partículas/seguimiento; *Curve to Mesh* para cintas/trazos; *String to Curves* para tipografía 3D animable.
- **Animation Nodes** (addon de Jacques Lucke) está discontinuado; sus casos de uso hoy se cubren con Geometry Nodes + simulation zones.

## 5. Componer el render en Remotion / HyperFrames

```bash
# Secuencia PNG RGBA → WebM VP9 con alfa (para <OffthreadVideo transparent>)
ffmpeg -framerate 30 -i f_%04d.png -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 18 -row-mt 1 obj.webm
# → ProRes 4444 con alfa (master / AE)
ffmpeg -framerate 30 -i f_%04d.png -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le obj.mov
```

```tsx
// Remotion: video con alfa sobre el fondo diseñado
<OffthreadVideo src={staticFile('blender/obj.webm')} transparent />
// o secuencia de imágenes, frame exacto:
<Img src={staticFile(`blender/f_${String(frame + 1).padStart(4, '0')}.png`)} />
```

- Mantener **los mismos fps y duración** entre Blender y la composición (Blender empieza en frame 1; Remotion en 0 → `+1`).
- Sombras/reflejos: renderizar pase de sombra aparte y mezclar en `multiply` a 40–70 %.
- Agregar el mismo grano/halation global **encima** del render 3D para unificarlo con el 2D (`06-color-y-textura.md`).
- HyperFrames: el WebM con alfa va en `<video>` con `data-start`/`data-duration`; animar el wrapper, no el `<video>`.

## 6. Reglas verificables

- `film_transparent = True` y `color_mode = 'RGBA'` en todo render destinado a composición.
- `color_depth = '16'` o EXR cuando hay gradientes/fondos suaves.
- `use_motion_blur = True` en renders con movimiento de cámara/objeto.
- Semillas fijas: `sc.cycles.seed` constante (y `use_animated_seed = True` solo si se quiere ruido variable en el tiempo).
- fps de Blender == fps de la composición.

## Fuentes

- Blender Manual — Command Line Arguments: https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html (consultado 2026-11-07)
- Blender Manual — Film (Transparent) / Render Output: https://docs.blender.org/manual/en/latest/render/cycles/render_settings/film.html (consultado 2026-11-07)
- Blender Manual — Shadow Catcher: https://docs.blender.org/manual/en/latest/render/cycles/object_settings/object_data.html#shadow-catcher (consultado 2026-11-07)
- Blender Python API — `bpy.types.NodeTreeInterface` / Geometry Nodes: https://docs.blender.org/api/current/bpy.types.NodeTreeInterface.html (consultado 2026-11-07)
- Blender Manual — Geometry Nodes (Simulation Zone): https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html (consultado 2026-11-07)
- Animation Nodes (repo del addon, estado de mantenimiento): https://github.com/JacquesLucke/animation_nodes (consultado 2026-11-07)
- Silvia Sellán — Blender Course III: rendering desde scripts: https://www.silviasellan.com/posts/blender_course_scripting/ (consultado 2026-11-07)
- Remotion — `<OffthreadVideo transparent>`: https://www.remotion.dev/docs/offthreadvideo (consultado 2026-11-07)
