<#
open-sandbox.ps1 — 在交接包目录里开受限场（Claude Code）。

  .\open-sandbox.ps1 -Dir <交接包目录>                                  # 首开
  .\open-sandbox.ps1 -Dir <交接包目录> -Resume <会话ID> -AddDir ..\stage2  # 接续开下一阶段，加挂目录
  .\open-sandbox.ps1 -Dir <交接包目录> -DryRun                           # 只打印命令

开起来以后再粘开场白：--add-dir 后面不能跟提示词，会被当成目录吞掉。
接续用 -Resume 带会话 ID，不用 --continue（它接「这个目录里最近一场」，10-17 误接过）。
#>
param(
    [Parameter(Mandatory = $true)][string]$Dir,
    [string]$Model = 'claude-fable-5-1',
    [string]$Effort = 'xhigh',
    [string[]]$AddDir = @(),
    [string]$Resume = '',
    [string]$Tools = 'Read,Write,Edit,Grep,Glob',
    [int]$MaxOutput = 32000,
    [switch]$DryRun
)

$target = Resolve-Path -LiteralPath $Dir -ErrorAction Stop

# 受限模式不读用户设置，输出上限会退回默认 12000；xhigh 一次写大段报告会撞线（10-17 踩到）
$env:CLAUDE_CODE_MAX_OUTPUT_TOKENS = "$MaxOutput"
# 只走 CLI 订阅登录态（全局红线）
Remove-Item Env:ANTHROPIC_API_KEY, Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue

$cliArgs = @()
if ($Resume) { $cliArgs += @('--resume', $Resume) }
$cliArgs += @('--restricted', '--strict-mcp-config', '--tools', $Tools, '--model', $Model, '--effort', $Effort)
foreach ($d in $AddDir) { $cliArgs += @('--add-dir', $d) }

Write-Host "cd $target"
Write-Host "`$env:CLAUDE_CODE_MAX_OUTPUT_TOKENS = `"$MaxOutput`""
Write-Host ("claude " + (($cliArgs | ForEach-Object { if ($_ -match '[\s,]') { "`"$_`"" } else { $_ } }) -join ' '))
if ($DryRun) { return }

Push-Location -LiteralPath $target
try { & claude @cliArgs } finally { Pop-Location }
