# Instalador de Bodega Estudio para Windows (PowerShell 5.1 o 7). Se puede correr varias veces: lo que ya está, se salta.
#
#   powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1 [-Destino <carpeta>] [-InstalarProgramas] [-SinPlugin] [-SinHumo]
#
# Sin -InstalarProgramas solo revisa node, ffmpeg, python y git y dice cuáles faltan (sale con código 2).
# Con -InstalarProgramas los instala con winget. Después clona o actualiza el estudio, instala las dependencias de
# studio/, crea el .venv con faster-whisper, define BODEGA_ESTUDIO_HOME, conecta el plugin a Claude Code y corre
# /bodega-doctor y la prueba de humo. El -ExecutionPolicy Bypass vale solo para esta ejecución.
param(
  [string]$Destino = (Join-Path $HOME 'bodega-estudio'),
  [switch]$InstalarProgramas,
  [switch]$SinPlugin,
  [switch]$SinHumo
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
if (Tiene 'tesseract') { Ok 'tesseract' } else { Write-Host '  (opcional) sin tesseract: winget install UB-Mannheim.TesseractOCR' }
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

# 5. Dónde vive el estudio ---------------------------------------------------------------------------------------
Paso 'BODEGA_ESTUDIO_HOME'
[Environment]::SetEnvironmentVariable('BODEGA_ESTUDIO_HOME', $Destino, 'User')
$env:BODEGA_ESTUDIO_HOME = $Destino
Ok $Destino

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
  Write-Host 'Cierra y vuelve a abrir Claude Code y prueba /bodega-doctor o /mm-catalogo.'
  exit 0
}
Falla 'El doctor encontró algo obligatorio pendiente (ver arriba).'
exit 1
