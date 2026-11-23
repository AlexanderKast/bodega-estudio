# Instalar Bodega Estudio

Para el equipo de Bodega de Belleza. La primera vez toma unos 20 minutos, casi todo en descargas.

## 0. Antes de empezar

- **Atajo:** en vez de seguir esta guía a mano, pega en Claude Code el prompt de
  [PROMPT-INSTALACION.md](PROMPT-INSTALACION.md) y Claude hace todo esto por ti.
- **Claude Code** instalado y con sesión iniciada (`claude` en la terminal responde).
- Windows 10/11, macOS o Linux, con 8 GB de RAM o más y 15 GB libres.

## 1. Programas del computador

En Windows, desde PowerShell (uno por uno):

```powershell
winget install OpenJS.NodeJS.LTS
```
```powershell
winget install Gyan.FFmpeg
```
```powershell
winget install Python.Python.3.12
```
```powershell
winget install Git.Git
```

Opcional, para que el crítico lea los textos en pantalla:

```powershell
winget install UB-Mannheim.TesseractOCR
```

Cierra y vuelve a abrir la terminal para que tome los programas nuevos.

En macOS: `brew install node ffmpeg python@3.12 git tesseract`. En Linux (Debian/Ubuntu):
`sudo apt install nodejs npm ffmpeg python3-venv git tesseract-ocr`.

## 2. Bajar el estudio

El estudio vive en una carpeta propia (`bodega-estudio` en tu usuario). Ahí quedan los programas del render y la
carpeta `trabajo/` con el material de Bodega; esa carpeta no se sube a ningún lado.

```powershell
git clone https://github.com/AlexanderKast/bodega-estudio.git $HOME\bodega-estudio
```
```powershell
cd $HOME\bodega-estudio\studio; npm ci
```

Python del estudio (queda dentro de la carpeta, no toca el resto del computador):

```powershell
cd $HOME\bodega-estudio; py -3.12 -m venv .venv
```
```powershell
.venv\Scripts\python -m pip install faster-whisper numpy scipy yt-dlp
```

En macOS o Linux: `python3 -m venv .venv && .venv/bin/pip install faster-whisper numpy scipy yt-dlp`.

Dile a Claude dónde está el estudio (una vez; luego cierra y abre la terminal):

```powershell
setx BODEGA_ESTUDIO_HOME "$HOME\bodega-estudio"
```

En macOS o Linux agrega `export BODEGA_ESTUDIO_HOME=~/bodega-estudio` a `~/.zshrc` o `~/.bashrc`.

## 3. Conectarlo a Claude Code

```powershell
claude plugin marketplace add AlexanderKast/bodega-estudio
```
```powershell
claude plugin install bodega-estudio@bodega-estudio
```

O desde una sesión de Claude Code:

```
/plugin marketplace add AlexanderKast/bodega-estudio
/plugin install bodega-estudio@bodega-estudio
```

## 4. Probar

Abre Claude Code y escribe `/bodega-doctor`. Tiene que decir **"Listo: nada obligatorio falta"**; si algo falta,
te dice el comando para instalarlo.

Después, la prueba de render (5 segundos con la marca de Bodega, sale en `studio/out/humo/`):

```powershell
cd $HOME\bodega-estudio; bash scripts/humo.sh
```

La primera vez descarga el navegador que usa el render (unos 100 MB). La primera transcripción descarga el modelo de
Whisper (unos 1,5 GB con `medium`).

## 5. Usarlo

En Claude Code, desde cualquier carpeta: `/mm-catalogo` para ver las plantillas, `/mm-plantilla` para hacer un video
con una de ellas, `/master-motion` para una pieza a medida. El catálogo visual está en
`bodega-estudio\catalogo\index.html` (ábrelo con un servidor local: `npx http-server catalogo -p 5190`).

## 6. Actualizar

Cuando IA Master Tech avise de una versión nueva:

Lo más simple es volver a correr el instalador (actualiza el estudio, las dependencias y el plugin):

```powershell
powershell -ExecutionPolicy Bypass -File $HOME\bodega-estudio\scripts\instalar.ps1 -SinHumo
```

O a mano:

```powershell
cd $HOME\bodega-estudio; git pull; cd studio; npm ci
```
```powershell
claude plugin update bodega-estudio@bodega-estudio
```

`git pull` no toca `trabajo/` ni los renders de `studio/out/`.

## 7. Renderizar en el VPS de Bodega (opcional)

Si el computador es lento, lo pesado puede correr en el VPS de Bodega. IA Master Tech deja el VPS listo y te da la
llave SSH; en el computador:

1. En `~/.ssh/config`:
   ```
   Host bodega-vps
     HostName <IP del VPS>
     User deploy
     IdentityFile ~/.ssh/<llave del VPS>
     IdentitiesOnly yes
   ```
2. En `estudio.config.json`, cambia `"ejecucion": "local"` por `"ejecucion": "vps"`.
3. En Claude Code: `/bodega-doctor --vps`.

En el VPS el estudio está en `/opt/bodega/estudio` y corre en el contenedor `bodega-estudio`
(`ops/docker-compose.yml`).

## Licencia de Remotion

El render usa Remotion. Para empresas de más de 3 personas, Remotion pide una Company License (remotion.pro).
Cuando Bodega la compre, guarda el id de la licencia en un archivo `.remotion-licencia` en la raíz del estudio.
