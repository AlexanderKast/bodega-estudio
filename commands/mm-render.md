---
description: Render y master de una pieza aprobada en el VPS de Bodega o en este equipo (acepta props para plantillas)
argument-hint: "<Pieza>-<formato> [--props archivo.json]"
---

**Localiza el estudio primero.** Todo corre dentro del repo, no en la carpeta de la sesión: usa la primera que exista
entre `$BODEGA_ESTUDIO_HOME`, la raíz de este plugin y `~/bodega-estudio` (la que tiene `scripts/verify.mjs`) y
corre cada comando con `cd` a esa carpeta. Si no hay ninguna, dilo y da el comando para clonarla.

Para `$ARGUMENTS`, con la puerta 2 ya aprobada (y la animática, si es un explainer):

1. `node scripts/verify.mjs --comp <Pieza>-<formato>` en verde.
2. `scripts/host.sh run 'cd studio && npx remotion render src/index.ts <Pieza>-<formato> out/<Pieza>-<formato>.mp4 --timeout=180000'`.
   En modo vps sube antes lo que falte (`scripts/host.sh subir <rutas>`) y trae el render (`scripts/host.sh traer studio/out/<Pieza>-<formato>.mp4`).
   - Si el pedido trae `--props archivo.json`, pásalo tal cual: `--props=<ruta del JSON>`. El archivo y la media que cite
     tienen que estar donde corre el render (en modo vps, súbelos con `scripts/host.sh subir`).
   - Para una plantilla del catálogo es más corto `node scripts/plantilla.mjs <id> --props archivo.json --render`, que
     además valida las props contra el esquema antes de renderizar.
   - Comprueba que el `.mp4` es nuevo antes de seguir: si el render falla, el archivo anterior sigue ahí.
3. `scripts/master.sh studio/out/<Pieza>-<formato>.mp4` (agrega `--audio` si hay metraje con su audio).
4. Antes de entregar, el bucle del crítico (skill `master-motion`, paso 9): `scripts/critica/medir-pieza.sh` y el
   agente `critico-motion` hasta que el veredicto sea "pasa" con el umbral del brief. Las plantillas del catálogo no
   pasan por el crítico: se revisan con la hoja de fotogramas de `plantilla.mjs --stills`.
5. Poster con ffmpeg y reporte: ruta, duración, peso, LUFS y pico. Entrega solo con el sí de la persona.
