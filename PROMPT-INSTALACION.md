# Instalar Bodega Estudio con un prompt

Antes: el computador necesita **Claude Code instalado y con sesión iniciada**, unos 15 GB libres y conexión a
internet. Abre Claude Code (en cualquier carpeta), copia el bloque de abajo completo y pégalo como mensaje. Claude
revisa el equipo, pide permiso antes de instalar programas y deja todo listo. La primera vez toma unos 20 a 30
minutos, casi todo en descargas.

Al terminar queda:

```
C:\Users\<usuario>\bodega-estudio\        el programa (no hace falta abrirlo)
Escritorio\Bodega Estudio\
  01 Crudos\        grabaciones sin editar
  02 Podcast\       episodios completos
  03 Productos\     una carpeta por producto: fotos y descripción
  04 Referentes\    videos o links de reels que les gustan
  05 Entregas\      videos terminados, por fecha
  LEEME.txt
  Actualizar Bodega Estudio.cmd
```

```text
Instala Bodega Estudio en este computador siguiendo estos pasos, en orden. Respóndeme en español y avísame en
una línea cada vez que empieces un paso.

1. Revisa el sistema operativo.
   - Si es Windows, sigue con el paso 2.
   - Si es macOS o Linux, sigue la guía https://github.com/AlexanderKast/bodega-estudio/blob/main/INSTALAR.md
     paso a paso (sus comandos de macOS/Linux), crea las carpetas de trabajo que describe y salta al paso 6.

2. Si no tienes git, pídeme permiso y luego instálalo con:
   winget install --id Git.Git --exact --accept-package-agreements --accept-source-agreements
   Después actualiza el PATH de la sesión o pídeme reabrir la terminal.

3. Si no existe la carpeta $HOME\bodega-estudio, clona el estudio ahí:
   git clone https://github.com/AlexanderKast/bodega-estudio.git $HOME\bodega-estudio
   Si ya existe y es el estudio, no la borres: el instalador la actualiza.

4. Corre el instalador desde PowerShell:
   powershell -ExecutionPolicy Bypass -File $HOME\bodega-estudio\scripts\instalar.ps1
   - Si sale con código 2, faltan programas (Node.js, FFmpeg, Python 3.12 o Git). Muéstrame la lista y, si te doy
     permiso, vuelve a correrlo agregando -InstalarProgramas (los instala con winget, junto con Tesseract, que es
     opcional).
   - Si falla en otro paso, muéstrame el error, revisa INSTALAR.md del estudio y propón el arreglo antes de seguir.
   - Es largo (npm ci, faster-whisper y el modelo de Whisper de ~1,5 GB): córrelo en segundo plano o con un tiempo
     de espera de 30 minutos, y no lo lances dos veces a la vez.

5. Cuando termine, confírmame con lo que muestra la salida:
   - que el doctor dijo «Listo: nada obligatorio falta»,
   - que la prueba de render creó studio\out\humo\Bodega-Humo-vertical.mp4,
   - que el plugin bodega-estudio quedó conectado,
   - que en el Escritorio quedó la carpeta «Bodega Estudio» con 01 Crudos, 02 Podcast, 03 Productos,
     04 Referentes, 05 Entregas, LEEME.txt y «Actualizar Bodega Estudio.cmd».

6. Dime en una lista corta qué quedó instalado, dónde está cada cosa, los avisos opcionales (licencia de Remotion,
   y si el Escritorio se sincroniza con OneDrive) y que debo cerrar y volver a abrir Claude Code para usar
   /bodega-doctor, /mm-catalogo y /mm-plantilla.

Reglas: no borres ni muevas carpetas o archivos existentes, no cambies configuraciones del sistema más allá de lo que
hace el instalador (programas con mi permiso, la variable de usuario BODEGA_ESTUDIO_HOME y, si instala Tesseract, su
carpeta en el PATH del usuario) y no subas a ningún lado material de Bodega.
```

Si prefieres hacerlo a mano: [INSTALAR.md](INSTALAR.md). Para actualizar después: doble clic en
`Actualizar Bodega Estudio.cmd` dentro de la carpeta del Escritorio.
