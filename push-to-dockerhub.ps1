# ─────────────────────────────────────────────────────────────────────────────
# HearConnect – Push images to Docker Hub
# PowerShell script for Windows
#
# USAGE:
#   .\push-to-dockerhub.ps1 -DockerHubUser YOUR_DOCKERHUB_USERNAME
#   .\push-to-dockerhub.ps1 -DockerHubUser YOUR_DOCKERHUB_USERNAME -Tag v1.0.0
#
# The script will:
#   1. docker login  (prompts for credentials)
#   2. Build backend  image and tag it as <user>/hearconnect-backend:<tag>
#   3. Build frontend image and tag it as <user>/hearconnect-frontend:<tag>
#   4. Push both images to Docker Hub
# ─────────────────────────────────────────────────────────────────────────────

param(
    [Parameter(Mandatory = $true)]
    [string]$DockerHubUser,

    [string]$Tag = "latest",

    # Pass extra --build-arg for frontend API URLs (optional)
    [string]$ApiUrl = "http://localhost:8000",
    [string]$WsUrl = "ws://localhost:8000/ws/sign"
)

$ErrorActionPreference = "Stop"

$ROOT = $PSScriptRoot   # directory where this script lives
$backendImage = "${DockerHubUser}/hearconnect-backend:${Tag}"
$frontendImage = "${DockerHubUser}/hearconnect-frontend:${Tag}"

Write-Host "`n=== HearConnect – Docker Hub Push ===" -ForegroundColor Cyan
Write-Host "Hub user : $DockerHubUser"
Write-Host "Tag      : $Tag"
Write-Host "Repo root: $ROOT`n"

# ── 1. Login ──────────────────────────────────────────────────────────────────
Write-Host ">>> docker login" -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) { throw "docker login failed." }

# ── 2. Build backend ──────────────────────────────────────────────────────────
Write-Host "`n>>> Building backend image: $backendImage" -ForegroundColor Yellow

docker build `
    --file "$ROOT\backend\Dockerfile" `
    --tag  "$backendImage" `
    --tag  "${DockerHubUser}/hearconnect-backend:latest" `
    "$ROOT\backend"

if ($LASTEXITCODE -ne 0) { throw "Backend build failed." }

# ── 3. Build frontend ─────────────────────────────────────────────────────────
Write-Host "`n>>> Building frontend image: $frontendImage" -ForegroundColor Yellow

docker build `
    --file "$ROOT\hearconnet-app\Dockerfile" `
    --tag  "$frontendImage" `
    --tag  "${DockerHubUser}/hearconnect-frontend:latest" `
    --build-arg "VITE_API_URL=$ApiUrl" `
    --build-arg "VITE_WS_URL=$WsUrl" `
    --build-arg "VITE_HEALTH_URL=${ApiUrl}/health" `
    "$ROOT\hearconnet-app"

if ($LASTEXITCODE -ne 0) { throw "Frontend build failed." }

# ── 4. Push both images ───────────────────────────────────────────────────────
Write-Host "`n>>> Pushing $backendImage" -ForegroundColor Yellow
docker push "$backendImage"
if ($Tag -ne "latest") { docker push "${DockerHubUser}/hearconnect-backend:latest" }

Write-Host "`n>>> Pushing $frontendImage" -ForegroundColor Yellow
docker push "$frontendImage"
if ($Tag -ne "latest") { docker push "${DockerHubUser}/hearconnect-frontend:latest" }

Write-Host "`n=== Done! Images available on Docker Hub ===" -ForegroundColor Green
Write-Host "  $backendImage"
Write-Host "  $frontendImage"
Write-Host "`nRun the project from Docker Hub:"
Write-Host "  set DOCKERHUB_USER=$DockerHubUser"
Write-Host "  docker compose -f docker-compose.prod.yml up -d`n" -ForegroundColor Cyan
