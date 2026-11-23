---
description: Revisa que este equipo (y el VPS de Bodega, si se usa) tenga todo lo que necesita Bodega Estudio
argument-hint: "[--vps]"
---

**Localiza el estudio primero:** la primera que exista entre `$BODEGA_ESTUDIO_HOME`, la raíz de este plugin
(`${CLAUDE_PLUGIN_ROOT}`) y `~/bodega-estudio` (la que tiene `scripts/doctor.sh`).

1. Corre `bash scripts/doctor.sh $ARGUMENTS` desde esa carpeta y muestra el resultado tal cual.
2. Si falta algo obligatorio, explica en una línea por cosa qué es y para qué sirve, y ofrece correr el comando de
   instalación que propone el doctor. **No instales nada sin el sí de la persona.** En Windows los comandos `winget`
   pueden pedir permisos de administrador: avísalo antes.
3. Si falta `studio/node_modules`, el comando es `cd studio && npm ci` (unos 2 a 4 minutos la primera vez).
4. Con todo en verde, ofrece la prueba de humo: `bash scripts/humo.sh`, que renderiza 5 segundos con la marca de
   Bodega donde diga `ejecucion` en `estudio.config.json` y muestra el resultado.
5. Si la persona quiere cambiar dónde corre (este equipo o el VPS), edita `ejecucion` en `estudio.config.json` y
   vuelve a correr el doctor.
