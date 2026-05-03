# MongoDB Mastering Course - Lean Windows validator
#
# Tests the student-visible day-1 flow on Windows:
#   1. setup.ps1                                 (replica set comes up)
#   2. mongosh URI --file <data loader>          (Windows-recommended load pattern)
#   3. mongosh URI/db --eval "db.X.countDocuments()"  (lab 1 verification command)
#   4. teardown.ps1                              (cleanup leaves no stragglers)
#
# Designed to be small (~80 lines), independent, and easy to debug. Does NOT use
# the course-tools image, the lab-fence runners, or any of the curated validator
# suites -- those are author tooling. This script proves the flow a Windows
# student actually performs in lab 1, nothing more.
#
# Requires: Docker Desktop. Does NOT require host-installed mongosh -- mongosh
# calls go through a one-shot mongo:8.0 container on the mongodb-net network,
# which is the same mongosh binary students would install + use.
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
    3. Loads data\comprehensive_data_loader.js via `mongosh --file`
       (the pattern lab 1 instructs Windows students to use).
    4. Runs the lab-1 verification command and asserts the policy
       count is greater than zero.
    5. Tears down both the replica set and the sharded cluster.
    6. Reports PASS or FAIL with which step failed.

DURATION: ~90 seconds.
"@ -ForegroundColor Cyan
    exit 0
}

$ErrorActionPreference = "Continue"

function W-Info  { param([string]$m) Write-Host "[INFO] $m" -ForegroundColor Blue  }
function W-Pass  { param([string]$m) Write-Host "[PASS] $m" -ForegroundColor Green }
function W-Fail  { param([string]$m) Write-Host "[FAIL] $m" -ForegroundColor Red   }

$RepoRoot   = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ScriptsDir = Join-Path $RepoRoot "scripts"
$DataLoader = Join-Path $RepoRoot "data\comprehensive_data_loader.js"

$RsUri    = "mongodb://mongo1:27017/?directConnection=true&replicaSet=rs0"
$RsUriDb  = "mongodb://mongo1:27017/insurance_company?directConnection=true&replicaSet=rs0"
$Network  = "mongodb-net"

# Run a one-shot mongo:8.0 container on the same network as the cluster, with
# the repo bind-mounted at /work, so we can hit the cluster by name (mongo1)
# and reference data files via /work/data/... -- no host mongosh needed.
function Invoke-Mongosh {
    param([string[]]$MongoshArgs)
    # -w /work is required because comprehensive_data_loader.js does
    # load('data/day1_data_loader.js') with a relative path; without it,
    # mongosh's cwd defaults to / and the load() call fails.
    $repoSlash = ($RepoRoot -replace '\\', '/')
    $dockerArgs = @(
        "run", "--rm",
        "--network", $Network,
        "--mount", "type=bind,src=${repoSlash},dst=/work",
        "-w", "/work",
        "mongo:8.0",
        "mongosh"
    ) + $MongoshArgs
    & docker @dockerArgs
    return $LASTEXITCODE
}

$Failures = @()
function Add-Failure { param([string]$m) $script:Failures += $m; W-Fail $m }

# 1. Initial teardown (best-effort)
W-Info "1/4 Initial teardown..."
try { & (Join-Path $ScriptsDir "teardown_sharding.ps1") *> $null } catch { }
try { & (Join-Path $ScriptsDir "teardown.ps1")          *> $null } catch { }

# 2. Setup
W-Info "2/4 Running setup.ps1 (replica set + primary election)..."
& (Join-Path $ScriptsDir "setup.ps1")
if ($LASTEXITCODE -ne 0) {
    Add-Failure "setup.ps1 exited with code $LASTEXITCODE"
} else {
    W-Pass "setup.ps1 completed"
}

# 3. Data load via mongosh --file (the Windows-recommended pattern)
if ($Failures.Count -eq 0) {
    W-Info "3/4 Loading data via 'mongosh --file' (Windows-recommended pattern)..."
    $rc = Invoke-Mongosh @($RsUri, "--quiet", "--file", "/work/data/comprehensive_data_loader.js")
    if ($rc -ne 0) {
        Add-Failure "Data load failed (mongosh exit $rc)"
    } else {
        W-Pass "Data loaded"
    }
}

# 4. Lab-1 verification command (URI-embedded db + --eval count)
if ($Failures.Count -eq 0) {
    W-Info "4/4 Running lab-1 verification: db.policies.countDocuments()..."
    # Capture stdout so we can parse the count
    $repoSlash = ($RepoRoot -replace '\\', '/')
    $out = & docker run --rm `
        --network $Network `
        --mount "type=bind,src=${repoSlash},dst=/work" `
        -w /work `
        mongo:8.0 mongosh $RsUriDb --quiet --eval "print(db.policies.countDocuments())" 2>&1
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
