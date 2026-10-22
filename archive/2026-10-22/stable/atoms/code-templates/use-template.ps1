<#
.SYNOPSIS
    Installs a Code Template into the current project.
    (将代码模板安装到当前项目中)

.DESCRIPTION
    Copies the requested template (e.g., ddd, java, vue) to the specified target directory.
    Handles conflict detection and directory creation.

.PARAMETER Name
    The name of the template to install.
    Options: 'ddd' (Design), 'java' (Backend), 'vue' (Frontend).

.PARAMETER Target
    The destination directory relative to project root.
    Defaults vary by template type.

.EXAMPLE
    .\code-templates\use-template.ps1 -Name ddd
    # Installs DDD Design kit to docs/domain/

.EXAMPLE
    .\code-templates\use-template.ps1 -Name java -Target src/main/java
    # Installs Spring Boot Scaffold to src/main/java
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("ddd", "java", "vue")]
    [string]$Name,

    [Parameter(Mandatory=$false)]
    [string]$Target
)

# 1. Configuration Map
$TemplateMap = @{
    "ddd"  = @{ Source = "design/ddd-structure"; DefaultTarget = "docs/domain" }
    "java" = @{ Source = "backend/java-spring-boot"; DefaultTarget = "src/backend" }
    "vue"  = @{ Source = "frontend/vue-admin"; DefaultTarget = "src/frontend" }
}

# 2. Resolve Paths
$Config = $TemplateMap[$Name]
if (-not $Target) { $Target = $Config.DefaultTarget }

$ScriptRoot = $PSScriptRoot
$SourcePath = Join-Path $ScriptRoot $Config.Source
$DestPath = Join-Path (Get-Location) $Target

# 3. Execution
Write-Host "🏗️  Installing Template: [$Name]" -ForegroundColor Cyan
Write-Host "   Source: $SourcePath" -ForegroundColor Gray
Write-Host "   Target: $DestPath" -ForegroundColor Gray

if (-not (Test-Path $SourcePath)) {
    Write-Error "Template source not found! Is the 'code-templates' folder intact?"
    exit 1
}

if (-not (Test-Path $DestPath)) {
    New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
    Write-Host "   Created directory: $DestPath" -ForegroundColor Green
} else {
    Write-Warning "   Target directory exists. Files may be merged/overwritten."
}

# 4. Copy
Copy-Item -Path "$SourcePath\*" -Destination $DestPath -Recurse -Force

Write-Host "✅ Template installed successfully!" -ForegroundColor Green
Write-Host "   Next Step: Check $Target/README.md" -ForegroundColor Yellow
