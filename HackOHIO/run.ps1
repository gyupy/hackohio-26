# =====================================================================
#  Buckeye Guild - launcher
#
#  Starts the matching server without depending on your PATH.
#  - Finds Maven and the JDK by explicit path.
#  - Reads your Gemini API key from key.local.txt (gitignored).
#  - Sets the Gemini endpoint + timeout.
#  - Starts the web server at http://localhost:8080
#
#  Usage:   .\run.ps1
#  First time: paste your Gemini key into key.local.txt (one line).
# =====================================================================

$ErrorActionPreference = "Stop"

# --- Resolve the project folder (this script's own directory) ---
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

# --- Locate the JDK ---
$jdk = [Environment]::GetEnvironmentVariable("JAVA_HOME", "User")
if (-not $jdk -or -not (Test-Path $jdk)) {
    $adopt = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory -ErrorAction SilentlyContinue |
             Where-Object { $_.Name -like "jdk-11*" } | Select-Object -First 1
    if ($adopt) { $jdk = $adopt.FullName }
}
if (-not $jdk -or -not (Test-Path $jdk)) {
    Write-Host "Could not find a JDK 11. Install it, then try again." -ForegroundColor Red
    exit 1
}
$env:JAVA_HOME = $jdk

# --- Locate Maven ---
$mvnDir = Get-ChildItem "$env:USERPROFILE\tools" -Directory -ErrorAction SilentlyContinue |
          Where-Object { $_.Name -like "apache-maven*" } | Select-Object -First 1
if (-not $mvnDir) {
    Write-Host "Could not find Maven under $env:USERPROFILE\tools" -ForegroundColor Red
    exit 1
}
$mvn = Join-Path $mvnDir.FullName "bin\mvn.cmd"

# --- Read the Gemini API key ---
$keyFile = Join-Path $projectDir "key.local.txt"
if (-not (Test-Path $keyFile)) {
    Write-Host "No key.local.txt found." -ForegroundColor Yellow
    Write-Host "Create it and paste your Gemini API key on one line, then re-run." -ForegroundColor Yellow
    Write-Host "Get a free key at https://aistudio.google.com/apikey" -ForegroundColor Yellow
    exit 1
}
$key = (Get-Content $keyFile -Raw).Trim()
if (-not $key -or $key -eq "PASTE_YOUR_GEMINI_API_KEY_HERE") {
    Write-Host "key.local.txt still has the placeholder (or is empty)." -ForegroundColor Yellow
    Write-Host "Open HackOHIO\key.local.txt and paste your Gemini API key on one line." -ForegroundColor Yellow
    Write-Host "Get a free key at https://aistudio.google.com/apikey" -ForegroundColor Yellow
    exit 1
}

# --- Configure environment for the matching agent ---
$env:LLM_API_KEY = $key
$env:LLM_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent"
$env:LLM_REQUEST_TIMEOUT_SECONDS = "120"

Write-Host "JDK:   $jdk"
Write-Host "Maven: $($mvnDir.FullName)"
Write-Host "Key:   loaded from key.local.txt (hidden)"
Write-Host "Starting Buckeye Guild server at http://localhost:8080 ..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray

& $mvn clean compile exec:java