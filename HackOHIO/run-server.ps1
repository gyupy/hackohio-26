<#
    run-server.ps1
    ----------------------------------------------------------------------
    Convenience launcher for the Buckeye Guild matching server.

    Compiles the Java sources and starts com.hackohio.matching.web.MatchingServer,
    which serves the static UI (src/index.html, script.js, style.css) and exposes
    POST /api/rank backed by the MatchingAgent.

    This script does NOT require Maven. It uses:
      * your JDK (JAVA_HOME, or javac on PATH)
      * the Jackson jars already cached in ~/.m2/repository

    Usage (from the HackOHIO folder):
        # 1. set your LLM credentials for this shell
        $env:LLM_API_KEY = "your-gemini-api-key"
        $env:LLM_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

        # 2. run
        ./run-server.ps1            # starts on http://localhost:8080
        ./run-server.ps1 -Port 9090 # custom port
#>

param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

# Always operate relative to this script's folder (the HackOHIO project root).
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# ----------------------------------------------------------------------
# 1. Locate the JDK (need javac, not just java).
# ----------------------------------------------------------------------
function Find-Javac {
    if ($env:JAVA_HOME) {
        $candidate = Join-Path $env:JAVA_HOME "bin\javac.exe"
        if (Test-Path $candidate) { return $candidate }
    }
    $onPath = Get-Command javac -ErrorAction SilentlyContinue
    if ($onPath) { return $onPath.Source }
    return $null
}

$javac = Find-Javac
if (-not $javac) {
    Write-Error "Could not find 'javac'. Install a JDK (not just a JRE) and set JAVA_HOME, e.g. 'C:\Program Files\Eclipse Adoptium\jdk-17...'."
    exit 1
}
$javaExe = Join-Path (Split-Path $javac -Parent) "java.exe"
Write-Host "Using JDK: $(Split-Path (Split-Path $javac -Parent) -Parent)" -ForegroundColor Cyan

# ----------------------------------------------------------------------
# 2. Build the classpath from the cached Jackson jars.
# ----------------------------------------------------------------------
$m2 = Join-Path $env:USERPROFILE ".m2\repository\com\fasterxml\jackson"
if (-not (Test-Path $m2)) {
    Write-Error "Jackson jars not found under $m2. Run a build once (or 'mvn compile') to populate ~/.m2, then retry."
    exit 1
}

# Pick the newest jar for each Jackson artifact we need.
function Latest-Jar($artifactDir) {
    Get-ChildItem $artifactDir -Recurse -Filter "*.jar" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch 'sources|javadoc' } |
        Sort-Object FullName -Descending |
        Select-Object -First 1 -ExpandProperty FullName
}

$databind    = Latest-Jar (Join-Path $m2 "core\jackson-databind")
$core        = Latest-Jar (Join-Path $m2 "core\jackson-core")
$annotations = Latest-Jar (Join-Path $m2 "core\jackson-annotations")

if (-not ($databind -and $core -and $annotations)) {
    Write-Error "Missing one or more Jackson jars (databind/core/annotations) in $m2."
    exit 1
}

$classpath = @($databind, $core, $annotations) -join ";"

# ----------------------------------------------------------------------
# 3. Compile all sources into target/classes.
# ----------------------------------------------------------------------
$outDir = Join-Path $projectRoot "target\classes"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$sources = Get-ChildItem -Path (Join-Path $projectRoot "src\main\java") -Recurse -Filter *.java |
    ForEach-Object { $_.FullName }

$sourceListFile = Join-Path $projectRoot "target\sources.txt"
$sources | Set-Content -Path $sourceListFile -Encoding ASCII

Write-Host "Compiling $($sources.Count) source files..." -ForegroundColor Cyan
& $javac -cp $classpath -d $outDir "@$sourceListFile"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Compilation failed (javac exit $LASTEXITCODE)."
    exit $LASTEXITCODE
}
Write-Host "Compilation succeeded." -ForegroundColor Green

# ----------------------------------------------------------------------
# 4. Warn (but don't block) if LLM credentials are missing.
# ----------------------------------------------------------------------
if (-not $env:LLM_API_KEY -or -not $env:LLM_API_URL) {
    Write-Warning "LLM_API_KEY and/or LLM_API_URL are not set. The server will refuse to start until both are set."
    Write-Host 'Set them with:' -ForegroundColor Yellow
    Write-Host '  $env:LLM_API_KEY = "your-gemini-api-key"' -ForegroundColor Yellow
    Write-Host '  $env:LLM_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"' -ForegroundColor Yellow
}

# ----------------------------------------------------------------------
# 5. Run the server. Static files are served relative to the working
#    directory, so launch from the project root (where src/ lives).
# ----------------------------------------------------------------------
$runCp = "$outDir;$classpath"
Write-Host "Starting server on http://localhost:$Port  (Ctrl+C to stop)" -ForegroundColor Green
& $javaExe -cp $runCp com.hackohio.matching.web.MatchingServer $Port
