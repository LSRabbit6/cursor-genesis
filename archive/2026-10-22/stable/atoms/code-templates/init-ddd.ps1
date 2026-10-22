<#
.SYNOPSIS
    Initializes the DDD Design Workspace.
    (初始化 DDD 设计工作区)

.DESCRIPTION
    Creates the standard DDD directory structure in `docs/domain/`.
    Copies guidelines, workflow, and model templates.

.EXAMPLE
    .\code-templates\init-ddd.ps1
#>
$ScriptRoot = $PSScriptRoot
$SourcePath = Join-Path $ScriptRoot "design/ddd-structure"
$Target = "docs/domain"
$DestPath = Join-Path (Get-Location) $Target

Write-Host "🧠 Initializing DDD Workspace..." -ForegroundColor Cyan

if (-not (Test-Path $SourcePath)) {
    Write-Error "DDD Template source not found at: $SourcePath"
    exit 1
}

if (-not (Test-Path $DestPath)) {
    New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
    Write-Host "   Created: $DestPath" -ForegroundColor Green
}

Copy-Item -Path "$SourcePath\*" -Destination $DestPath -Recurse -Force

Write-Host "✅ DDD Workspace Ready at: $DestPath" -ForegroundColor Green
Write-Host "   Action: Open docs/domain/README.md to start modeling." -ForegroundColor Yellow
