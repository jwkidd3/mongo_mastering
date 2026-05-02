# Root-level convenience wrapper. Forwards to scripts\setup.ps1.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
& (Join-Path $ScriptDir "scripts\setup.ps1") @args
exit $LASTEXITCODE
