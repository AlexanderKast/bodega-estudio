# Instalar Bodega Estudio con un prompt

Abre Claude Code en el computador donde se va a instalar (en cualquier carpeta), copia el bloque de abajo completo y
pégalo como mensaje. Claude revisa el equipo, te pide permiso antes de instalar programas y deja todo listo. Toma unos
20 minutos la primera vez, casi todo en descargas.

```text
Instala Bodega Estudio en este computador siguiendo estos pasos, en orden. Respóndeme en español.

1. Revisa el sistema operativo.
   - Si es Windows, sigue con el paso 2.
   - Si es macOS o Linux, sigue la guía https://github.com/AlexanderKast/bodega-estudio/blob/main/INSTALAR.md
     paso a paso (sus comandos de macOS/Linux) y salta al paso 6.

2. Si no tienes git, pídeme permiso y luego instálalo con:
   winget install --id Git.Git --exact --accept-package-agreements --accept-source-agreements
   Después actualiza el PATH de la sesión o pídeme reabrir la terminal.

3. Si no existe la carpeta $HOME\bodega-estudio, clona el estudio ahí:
   git clone https://github.com/AlexanderKast/bodega-estudio.git $HOME\bodega-estudio
   Si ya existe y es el estudio, no la borres: el instalador la actualiza.

4. Corre el instalador desde PowerShell:
   powershell -ExecutionPolicy Bypass -File $HOME\bodega-estudio\scripts\instalar.ps1
   - Si sale con código 2, faltan programas (Node.js, FFmpeg, Python 3.12 o Git). Muéstrame la lista y, si te doy
     permiso, vuelve a correrlo agregando -InstalarProgramas (los instala con winget).
   - Si falla en otro paso, muéstrame el error, revisa INSTALAR.md del estudio y propón el arreglo antes de seguir.
   - Es largo (npm ci y la descarga de faster-whisper): córrelo con un tiempo de espera de 10 minutos o más.

5. Cuando termine, confírmame tres cosas con lo que muestra la salida:
   - que el doctor dijo «Listo: nada obligatorio falta»,
   - que la prueba de render creó studio\out\humo\Bodega-Humo-vertical.mp4,
   - que el plugin bodega-estudio quedó conectado.

6. Dime en una lista corta qué quedó instalado, los avisos opcionales (tesseract, licencia de Remotion) y que debo
   cerrar y volver a abrir Claude Code para usar /bodega-doctor, /mm-catalogo y /mm-plantilla.

Reglas: no borres carpetas existentes, no cambies configuraciones del sistema más allá de lo que hace el instalador
(variable de usuario BODEGA_ESTUDIO_HOME) y no subas a ningún lado material de Bodega.
```

Si prefieres hacerlo a mano: [INSTALAR.md](INSTALAR.md).
