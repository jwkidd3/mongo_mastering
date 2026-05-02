# Root-level convenience wrapper. Forwards to scripts\test.ps1.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
& (Join-Path $ScriptDir "scripts\test.ps1") @args
exit $LASTEXITCODE
