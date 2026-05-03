# MongoDB Mastering Course - Windows validator
#
# Validates the Windows course-development flow:
#   1. teardown
#   2. setup.ps1                            (replica set + primary election)
#   3. data load                            (mongosh --file inside mongo1)
#   4. lab_validator.sh (130 lab assertions, run inside mongo1)
#   5. lab-1 verification                   (URI-embedded db + --eval count)
#   6. teardown.ps1
#
# Implementation note: every mongosh call routes through the mongo1 container
# (`docker exec mongo1 mongosh` for one-shots, or `docker cp` + `bash` inside
# mongo1 for the validator). This avoids bind-mount path quirks and the need
# for host-installed mongosh / bash on Windows.
#
# Requirements: Docker Desktop. No host mongosh, no host bash.
#
# Usage: .\utilities\validate_windows.ps1

param([switch]$Help)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Lean Windows validator

USAGE:
    .\utilities\validate_windows.ps1

WHAT IT DOES:
    1. Tears down any existing replica set (errors ignored).
    2. Runs scripts\setup.ps1 to spin up a fresh 3-node replica set.
    3. Stages data\ into the mongo1 container via docker cp, then loads
       comprehensive_data_loader.js via mongosh --file inside mongo1.
    4. Stages utilities\lab_validator.sh into mongo1 and runs the
       full 130-assertion lab validator there (mongo1 has bash + mongosh;
       MONGOSH_DIRECT=1 makes the validator skip the docker exec wrapper).
    5. Runs the lab-1 verification command (db.policies.countDocuments()).
    6. Tears down the environment.
    7. Reports PASS or FAIL with which step failed.

DURATION: ~2 minutes.
"@ -ForegroundColor Cyan
    exit 0
}

$ErrorActionPreference = "Continue"

function W-Info  { param([string]$m) Write-Host "[INFO] $m" -ForegroundColor Blue  }
function W-Pass  { param([string]$m) Write-Host "[PASS] $m" -ForegroundColor Green }
function W-Fail  { param([string]$m) Write-Host "[FAIL] $m" -ForegroundColor Red   }

$RepoRoot      = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ScriptsDir    = Join-Path $RepoRoot "scripts"
$DataDir       = Join-Path $RepoRoot "data"
$LabValidator  = Join-Path $PSScriptRoot "lab_validator.sh"

# URIs target mongo1 from INSIDE mongo1 (we always use docker exec mongo1).
$RsUri    = "mongodb://localhost:27017/?directConnection=true&replicaSet=rs0"
$RsUriDb  = "mongodb://localhost:27017/insurance_company?directConnection=true&replicaSet=rs0"
$ShUri    = "mongodb://mongo-mongos:27017/?directConnection=true"

$Failures = @()
function Add-Failure { param([string]$m) $script:Failures += $m; W-Fail $m }

# 1. Initial teardown (best-effort)
W-Info "1/5 Initial teardown..."
try { & (Join-Path $ScriptsDir "teardown_sharding.ps1") *> $null } catch { }
try { & (Join-Path $ScriptsDir "teardown.ps1")          *> $null } catch { }

# 2. Setup
W-Info "2/5 Running setup.ps1 (replica set + primary election)..."
& (Join-Path $ScriptsDir "setup.ps1")
if ($LASTEXITCODE -ne 0) {
    Add-Failure "setup.ps1 exited with code $LASTEXITCODE"
} else {
    W-Pass "setup.ps1 completed"
}

# 3. Data load: stage data/ into mongo1, then run mongosh --file via docker exec.
# This is identical in spirit to a student running
#   mongosh "mongodb://..." --file data\comprehensive_data_loader.js
# on their Windows host, but routed through the mongo1 container so we don't
# depend on host-installed mongosh or fragile Windows bind-mount path forms.
if ($Failures.Count -eq 0) {
    W-Info "3/5 Loading data via mongosh --file (staged into mongo1)..."
    & docker cp "$DataDir" "mongo1:/tmp/data"
    if ($LASTEXITCODE -ne 0) {
        Add-Failure "docker cp of data/ into mongo1 failed (exit $LASTEXITCODE)"
    } else {
        # -w /tmp so the loader's relative load('data/dayN_data_loader.js') resolves
        & docker exec -w /tmp mongo1 mongosh $RsUri --quiet --file /tmp/data/comprehensive_data_loader.js
        $rc = $LASTEXITCODE
        if ($rc -ne 0) {
            Add-Failure "Data load failed (mongosh exit $rc)"
        } else {
            W-Pass "Data loaded"
        }
    }
}

# 4. Lab validator: stage lab_validator.sh into mongo1 and run it there.
# mongo1 has bash + mongosh; MONGOSH_DIRECT=1 tells the validator to use plain
# mongosh instead of `docker exec mongo1 mongosh` (which wouldn't work from
# inside mongo1, where there's no docker CLI).
if ($Failures.Count -eq 0) {
    W-Info "4/5 Running lab_validator.sh (130 lab assertions inside mongo1)..."
    & docker cp "$LabValidator" "mongo1:/tmp/lab_validator.sh"
    if ($LASTEXITCODE -ne 0) {
        Add-Failure "docker cp of lab_validator.sh into mongo1 failed (exit $LASTEXITCODE)"
    } else {
        & docker exec `
            -e MONGOSH_DIRECT=1 `
            -e MONGO_URI=$RsUri `
            -e MONGOS_URI=$ShUri `
            mongo1 bash /tmp/lab_validator.sh --quick
        $rc = $LASTEXITCODE
        if ($rc -ne 0) {
            Add-Failure "lab_validator.sh reported failures (exit $rc)"
        } else {
            W-Pass "lab_validator.sh: 130/130 assertions passed"
        }
    }
}

# 5. Lab-1 verification command (URI-embedded db + --eval count)
if ($Failures.Count -eq 0) {
    W-Info "5/5 Running lab-1 verification: db.policies.countDocuments()..."
    $out = & docker exec mongo1 mongosh $RsUriDb --quiet --eval "print(db.policies.countDocuments())" 2>&1
    $rc  = $LASTEXITCODE
    $count = ($out | Select-String -Pattern '^\s*\d+\s*$' | Select-Object -First 1).ToString().Trim()
    if ($rc -ne 0 -or -not $count -or [int]$count -le 0) {
        Add-Failure "Lab-1 verify failed (rc=$rc, count='$count'). Output:"
        foreach ($line in $out) { W-Fail "  | $line" }
    } else {
        W-Pass "Lab-1 verify: $count policies"
    }
}

# Always teardown
W-Info "Teardown..."
try { & (Join-Path $ScriptsDir "teardown_sharding.ps1") *> $null } catch { }
try { & (Join-Path $ScriptsDir "teardown.ps1")          *> $null } catch { }

# Report
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
if ($Failures.Count -eq 0) {
    W-Pass "WINDOWS VALIDATION: PASS"
    Write-Host "==================================================" -ForegroundColor Blue
    exit 0
} else {
    W-Fail "WINDOWS VALIDATION: FAIL ($($Failures.Count) failure$(if ($Failures.Count -ne 1) { 's' }))"
    foreach ($m in $Failures) { Write-Host "  - $m" -ForegroundColor Red }
    Write-Host "==================================================" -ForegroundColor Blue
    exit 1
}
