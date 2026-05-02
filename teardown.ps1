# Root-level convenience wrapper. Forwards to scripts\teardown.ps1.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
& (Join-Path $ScriptDir "scripts\teardown.ps1") @args
exit $LASTEXITCODE
