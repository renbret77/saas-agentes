# Seguros RB: VPS Setup Script 🚀
Write-Host "Iniciando Sincronización Real Cloud-First..." -ForegroundColor Emerald

$basePath = "C:\Users\Administrator\.gemini\antigravity\scratch"
$projectPath = "$basePath\portal-saas"
$repoUrl = "https://github.com/renbret77/portal.git"

if (!(Test-Path $basePath)) {
    New-Item -ItemType Directory -Force -Path $basePath
}

Set-Location $basePath

if (Test-Path $projectPath) {
    Write-Host "Actualizando repositorio existente..." -ForegroundColor Cyan
    Set-Location $projectPath
    git fetch origin
    git reset --hard origin/main
} else {
    Write-Host "Clonando repositorio REAL de GitHub..." -ForegroundColor Cyan
    git clone $repoUrl portal-saas
    Set-Location $projectPath
}

Write-Host "Instalando dependencias (esto puede tardar)..." -ForegroundColor Yellow
npm install

Write-Host "---"
Write-Host "Sincronización Completada con ÉXITO." -ForegroundColor Emerald
Write-Host "Ya tienes el 'Centro de Comando' listo en app/dashboard/admin/page.tsx"
Write-Host "---"
