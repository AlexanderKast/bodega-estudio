# Instalador de Bodega Estudio para Windows (PowerShell 5.1 o 7). Se puede correr varias veces: lo que ya está, se salta.
#
#   powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1 [-Destino <carpeta>] [-Escritorio <carpeta>]
#              [-InstalarProgramas] [-SinPlugin] [-SinHumo] [-SinModelo]
#
# Sin -InstalarProgramas solo revisa node, ffmpeg, python y git y dice cuáles faltan (sale con código 2).
# Con -InstalarProgramas los instala con winget (y tesseract, opcional). Después clona o actualiza el estudio, instala
# las dependencias de studio/, crea el .venv con faster-whisper y baja el modelo de Whisper, define
# BODEGA_ESTUDIO_HOME, crea la carpeta de trabajo en el Escritorio (Bodega Estudio\01 Crudos … 05 Entregas), conecta
# el plugin a Claude Code y corre /bodega-doctor y la prueba de humo. El -ExecutionPolicy Bypass vale solo para esta
# ejecución. El programa vive en -Destino (fuera del Escritorio, para que OneDrive no sincronice node_modules).
param(
  [string]$Destino = (Join-Path $HOME 'bodega-estudio'),
  [string]$Escritorio = [Environment]::GetFolderPath('Desktop'),
  [switch]$InstalarProgramas,
  [switch]$SinPlugin,
  [switch]$SinHumo,
  [switch]$SinModelo
)

$ErrorActionPreference = 'Stop'
$Repo = 'https://github.com/AlexanderKast/bodega-estudio.git'
$Marketplace = 'AlexanderKast/bodega-estudio'

function Paso([string]$t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Magenta }
function Ok([string]$t) { Write-Host "  ok  $t" -ForegroundColor Green }
function Falla([string]$t) { Write-Host "  !!  $t" -ForegroundColor Red }

function Refrescar-Path {
  $m = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $u = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$m;$u"
}

function Tiene([string]$cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

function Version-Node {
  if (-not (Tiene 'node')) { return 0 }
  $v = (& node -v) -replace '^v', ''
  return [int]($v.Split('.')[0])
}

function Python-312 {
  if (Tiene 'py') {
    & py -3.12 -c "import sys" 2>$null
    if ($LASTEXITCODE -eq 0) { return ,@('py', '-3.12') }
  }
  foreach ($c in @('python', 'python3')) {
    if (Tiene $c) {
      & $c -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>$null
      if ($LASTEXITCODE -eq 0) { return ,@($c) }
    }
  }
  return $null
}

function Bash-Git {
  $candidatos = @(
    (Join-Path $env:ProgramFiles 'Git\bin\bash.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Git\bin\bash.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Git\bin\bash.exe')
  )
  foreach ($c in $candidatos) { if ($c -and (Test-Path $c)) { return $c } }
  return $null
}

# 1. Programas -------------------------------------------------------------------------------------------------
Paso 'Programas del computador'
Refrescar-Path
$faltan = @()
if ((Version-Node) -lt 22) { $faltan += @{ nombre = 'Node.js 22 o más'; id = 'OpenJS.NodeJS.LTS' } }
if (-not (Tiene 'ffmpeg')) { $faltan += @{ nombre = 'FFmpeg'; id = 'Gyan.FFmpeg' } }
if (-not (Python-312)) { $faltan += @{ nombre = 'Python 3.12'; id = 'Python.Python.3.12' } }
if (-not (Tiene 'git') -or -not (Bash-Git)) { $faltan += @{ nombre = 'Git (con Git Bash)'; id = 'Git.Git' } }

if ($faltan.Count -gt 0) {
  if (-not $InstalarProgramas) {
    Falla 'Faltan programas:'
    foreach ($f in $faltan) { Write-Host "      $($f.nombre)  ->  winget install $($f.id)" }
    Write-Host ''
    Write-Host '  Vuelve a correr con -InstalarProgramas para instalarlos con winget.'
    exit 2
  }
  if (-not (Tiene 'winget')) { Falla 'No está winget (App Installer de Microsoft Store). Instala los programas a mano: ver INSTALAR.md.'; exit 1 }
  foreach ($f in $faltan) {
    Write-Host "  instalando $($f.nombre)..."
    & winget install --id $f.id --exact --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { Falla "winget no pudo instalar $($f.nombre) (código $LASTEXITCODE)"; exit 1 }
  }
  Refrescar-Path
}
# Tesseract (opcional: el crítico lee los textos en pantalla). Se instala solo con -InstalarProgramas.
$tesseractDir = Join-Path $env:ProgramFiles 'Tesseract-OCR'
if (-not (Tiene 'tesseract') -and $InstalarProgramas -and (Tiene 'winget')) {
  Write-Host '  instalando Tesseract (opcional)...'
  & winget install --id UB-Mannheim.TesseractOCR --exact --silent --accept-package-agreements --accept-source-agreements
}
if (-not (Tiene 'tesseract') -and (Test-Path (Join-Path $tesseractDir 'tesseract.exe'))) {
  # El instalador de UB-Mannheim no siempre lo agrega al PATH.
  $u = [Environment]::GetEnvironmentVariable('Path', 'User')
  if ($u -notlike "*$tesseractDir*") { [Environment]::SetEnvironmentVariable('Path', ($u.TrimEnd(';') + ";$tesseractDir"), 'User') }
  Refrescar-Path
}
if (Tiene 'tesseract') { Ok 'tesseract' } else { Write-Host '  (opcional) sin tesseract: vuelve a correr con -InstalarProgramas o winget install UB-Mannheim.TesseractOCR' }
Ok "node $(& node -v) · $((& ffmpeg -version | Select-Object -First 1) -replace 'ffmpeg version ', '' -replace ' Copyright.*', '') · git"

# 2. Estudio ---------------------------------------------------------------------------------------------------
Paso "Estudio en $Destino"
if (Test-Path (Join-Path $Destino '.git')) {
  & git -C $Destino pull --ff-only
  if ($LASTEXITCODE -ne 0) { Falla 'git pull falló: revisa cambios locales en el estudio'; exit 1 }
  Ok 'actualizado'
} elseif (Test-Path $Destino) {
  Falla "$Destino ya existe y no es el estudio. Usa -Destino con otra carpeta."; exit 1
} else {
  & git clone $Repo $Destino
  if ($LASTEXITCODE -ne 0) { Falla 'git clone falló'; exit 1 }
  Ok 'clonado'
}

# 3. Dependencias del render ------------------------------------------------------------------------------------
Paso 'Dependencias del render (npm ci, unos minutos la primera vez)'
Push-Location (Join-Path $Destino 'studio')
& npm ci --no-audit --no-fund
$codigo = $LASTEXITCODE
Pop-Location
if ($codigo -ne 0) { Falla 'npm ci falló'; exit 1 }
Ok 'studio/node_modules'

# 4. Python del estudio -----------------------------------------------------------------------------------------
Paso 'Python del estudio (.venv con faster-whisper)'
$venvPy = Join-Path $Destino '.venv\Scripts\python.exe'
if (-not (Test-Path $venvPy)) {
  $py = Python-312
  $extra = @()
  if ($py.Count -gt 1) { $extra = $py[1..($py.Count - 1)] }
  & $py[0] @extra -m venv (Join-Path $Destino '.venv')
  if ($LASTEXITCODE -ne 0) { Falla 'no se pudo crear el .venv'; exit 1 }
}
& $venvPy -m pip install --quiet --disable-pip-version-check faster-whisper numpy scipy yt-dlp
if ($LASTEXITCODE -ne 0) { Falla 'pip install falló'; exit 1 }
Ok '.venv listo'

if (-not $SinModelo) {
  $modelo = (Get-Content (Join-Path $Destino 'estudio.config.json') -Raw | ConvertFrom-Json).whisper.modelo
  if (-not $modelo) { $modelo = 'medium' }
  Paso "Modelo de Whisper ($modelo; la primera vez baja ~1,5 GB)"
  & $venvPy -c "from faster_whisper import WhisperModel; WhisperModel('$modelo', device='cpu', compute_type='int8')"
  if ($LASTEXITCODE -ne 0) { Falla 'no se pudo bajar el modelo; se bajará la primera vez que transcribas' } else { Ok "modelo $modelo listo" }
}

# 5. Dónde vive el estudio ---------------------------------------------------------------------------------------
Paso 'BODEGA_ESTUDIO_HOME'
[Environment]::SetEnvironmentVariable('BODEGA_ESTUDIO_HOME', $Destino, 'User')
$env:BODEGA_ESTUDIO_HOME = $Destino
Ok $Destino

# 5b. Carpeta de trabajo en el Escritorio --------------------------------------------------------------------------
$Carpeta = Join-Path $Escritorio 'Bodega Estudio'
Paso "Carpeta de trabajo: $Carpeta"
$subcarpetas = [ordered]@{
  crudos     = '01 Crudos'
  podcast    = '02 Podcast'
  productos  = '03 Productos'
  referentes = '04 Referentes'
  entregas   = '05 Entregas'
}
New-Item -ItemType Directory -Force -Path $Carpeta | Out-Null
$rutas = [ordered]@{ raiz = $Carpeta }
foreach ($k in $subcarpetas.Keys) {
  $r = Join-Path $Carpeta $subcarpetas[$k]
  New-Item -ItemType Directory -Force -Path $r | Out-Null
  $rutas[$k] = $r
}

# estudio.local.json: ajustes de este computador (fuera de git). Se conserva lo que ya tenga (ejecucion, whisper…).
$localJson = Join-Path $Destino 'estudio.local.json'
$cfg = [pscustomobject]@{}
if (Test-Path $localJson) {
  try { $cfg = Get-Content $localJson -Raw | ConvertFrom-Json } catch { $cfg = [pscustomobject]@{} }
}
$cfg | Add-Member -NotePropertyName carpetas -NotePropertyValue ([pscustomobject]$rutas) -Force
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($localJson, ($cfg | ConvertTo-Json -Depth 5), $utf8)

$leeme = @"
BODEGA ESTUDIO - carpeta de trabajo del equipo de Bodega de Belleza
=================================================================

Aquí va el material para el estudio de video. El programa está instalado aparte, en:
  $Destino
(no hace falta abrir esa carpeta).

  01 Crudos      Grabaciones sin editar (de José y el equipo) para convertir en reels.
  02 Podcast     Episodios completos del podcast.
  03 Productos   Una carpeta por producto: fotos, descripción y, si hay, el video de referencia.
  04 Referentes  Videos o links (en un .txt) de reels que les gustan, para copiar su edición.
  05 Entregas    Aquí deja Claude los videos terminados, en una carpeta por fecha.

Cómo se usa
-----------
Abre Claude Code y pídele lo que necesitas en palabras normales, por ejemplo:
  - "Muéstrame el catálogo de plantillas"                      (/mm-catalogo)
  - "Haz un antes y después con las fotos de 03 Productos\Serum" (/mm-plantilla)
  - "Revisa que el estudio esté bien"                          (/bodega-doctor)
La edición automática de crudos (/editar-crudo), del podcast (/podcast) y el video de producto (/video-producto)
llegan en las próximas entregas; usarán estas mismas carpetas.

Para actualizar el estudio: doble clic en "Actualizar Bodega Estudio.cmd".

Cuidados
--------
- El material de Bodega no se sube a ningún lado desde el estudio; se queda en este computador
  (o en el VPS de Bodega si así se configura).
- Si este Escritorio se sincroniza con OneDrive, los videos de estas carpetas también se suben a esa nube.
- Soporte: IA Master Tech.
"@
[IO.File]::WriteAllText((Join-Path $Carpeta 'LEEME.txt'), $leeme, (New-Object System.Text.UTF8Encoding($true)))

$actualizar = "@echo off`r`nchcp 65001 >nul`r`necho Actualizando Bodega Estudio...`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"$Destino\scripts\instalar.ps1`" -Destino `"$Destino`" -Escritorio `"$Escritorio`" -SinHumo`r`necho.`r`npause`r`n"
[IO.File]::WriteAllText((Join-Path $Carpeta 'Actualizar Bodega Estudio.cmd'), $actualizar, (New-Object System.Text.UTF8Encoding($false)))

foreach ($k in $subcarpetas.Keys) { Ok $subcarpetas[$k] }
Ok 'LEEME.txt y Actualizar Bodega Estudio.cmd'
if ($Escritorio -like '*OneDrive*') { Write-Host '  (aviso) este Escritorio se sincroniza con OneDrive: los videos de estas carpetas también se suben a esa nube.' }

# 6. Plugin de Claude Code ---------------------------------------------------------------------------------------
if (-not $SinPlugin) {
  Paso 'Plugin bodega-estudio en Claude Code'
  if (-not (Tiene 'claude')) {
    Falla 'No encuentro el comando claude. Instala Claude Code y corre: claude plugin marketplace add AlexanderKast/bodega-estudio'
  } else {
    & claude plugin marketplace add $Marketplace
    & claude plugin install 'bodega-estudio@bodega-estudio'
    if ($LASTEXITCODE -ne 0) { & claude plugin update 'bodega-estudio@bodega-estudio' }
    Ok 'plugin conectado (reinicia Claude Code para verlo)'
  }
}

# 7. Revisión y prueba de humo ---------------------------------------------------------------------------------
$bash = Bash-Git
# Ruta en formato de Git Bash: C:\Users\x\bodega-estudio -> /c/Users/x/bodega-estudio
$unix = '/' + $Destino.Substring(0, 1).ToLower() + ($Destino.Substring(2) -replace '\\', '/')
Paso 'Revisión (/bodega-doctor)'
& $bash -lc "cd '$unix' && bash scripts/doctor.sh"
$doctor = $LASTEXITCODE
if (-not $SinHumo -and $doctor -eq 0) {
  Paso 'Prueba de render (5 s con la marca de Bodega)'
  & $bash -lc "cd '$unix' && bash scripts/humo.sh"
  if ($LASTEXITCODE -ne 0) { Falla 'la prueba de render falló'; exit 1 }
}

Write-Host ''
if ($doctor -eq 0) {
  Write-Host 'Bodega Estudio quedó instalado.' -ForegroundColor Green
  Write-Host "Carpeta de trabajo: $Carpeta (lee el LEEME.txt)."
  Write-Host 'Cierra y vuelve a abrir Claude Code y prueba /bodega-doctor o /mm-catalogo.'
  exit 0
}
Falla 'El doctor encontró algo obligatorio pendiente (ver arriba).'
exit 1
