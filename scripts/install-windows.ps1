$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Node = Join-Path $Root "runtime\node.exe"
if (-not (Test-Path $Node)) { $Node = (Get-Command node -ErrorAction SilentlyContinue).Source }
if (-not $Node) { throw "未找到 Node.js。请使用 GitHub Release 中对应架构的完整安装包。" }
Get-Process Figma -ErrorAction SilentlyContinue | Stop-Process -Force
& $Node (Join-Path $Root "scripts\figma-zh-cn.mjs") install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Start-Process "$env:LOCALAPPDATA\Figma\Figma.exe"
