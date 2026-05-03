# MongoDB Mastering Course - Comprehensive End-to-End Test (PowerShell)
# Runs the complete validation flow:
#   teardown -> setup (rs + sharded) -> load data -> all test suites -> teardown
#
# Test suites executed (all run inside the `course-tools` Docker image so the
# host needs ONLY Docker -- no WSL, Git Bash, mongosh, dotnet, node, or python):
#   1. comprehensive_lab_validator.sh  (133 curated tests + 3 driver integrations)
#   2. lab_fence_runner.sh             (176 per-fence tests across all 16 labs)
#   3. ps_fence_check.sh               (38 PowerShell fence parse-checks via Docker)

param(
    [switch]$Help,
    [switch]$SkipPwsh
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Comprehensive End-to-End Test

USAGE:
    .\comprehensive_test.ps1 [-SkipPwsh]

OPTIONS:
    -SkipPwsh   Skip the PowerShell fence check (avoids pulling pwsh Docker image)

REQUIREMENTS:
    - Docker Desktop (Linux containers). No WSL, Git Bash, mongosh, dotnet,
      node, or python required on the host.

WHAT IT DOES:
    1. Tears down any existing environment (errors ignored)
    2. Runs setup.ps1          (3-node replica set)
    3. Runs setup_sharding.ps1 (config server, 2 shards, mongos)
    4. Builds the course-tools image if missing, then loads data via that image
    5. Runs three validation suites in sequence inside the course-tools image
    6. Tears down both environments
    7. Reports overall PASS/FAIL with per-suite breakdown

DURATION: ~6-10 minutes (first run builds the course-tools image; subsequent runs faster)
"@ -ForegroundColor Cyan
    exit 0
}

$ErrorActionPreference = "Continue"

function Write-Status  { param([string]$m) Write-Host "[INFO] $m"    -ForegroundColor Blue   }
function Write-Success { param([string]$m) Write-Host "[SUCCESS] $m" -ForegroundColor Green  }
function Write-Warn    { param([string]$m) Write-Host "[WARNING] $m" -ForegroundColor Yellow }
function Write-Err     { param([string]$m) Write-Host "[ERROR] $m"   -ForegroundColor Red    }

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoRoot   = Split-Path -Parent $ScriptDir

# When this script runs inside a container (e.g. pwsh-runner) we still issue
# `docker run` calls against the HOST daemon via the mounted socket. The host
# daemon only knows host paths, so bind-mounts must use the host's repo path,
# not the in-container path. Resolution order:
#   1. $env:COURSE_TOOLS_HOST_ROOT (explicit override)
#   2. If we're inside a container, ask the docker daemon for our own mounts
#      and find the host Source whose Destination matches $RepoRoot.
#   3. Fall back to $RepoRoot (correct when running on the host directly).
function Resolve-HostRepoRoot {
    param([string]$InContainerPath)
    if ($env:COURSE_TOOLS_HOST_ROOT) { return $env:COURSE_TOOLS_HOST_ROOT }
    if (-not (Test-Path "/.dockerenv")) { return $InContainerPath }
    try {
        $hn = (Get-Content -Raw /etc/hostname).Trim()
        $raw = & docker inspect $hn 2>$null | Out-String
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($raw)) { return $InContainerPath }
        $obj = $raw | ConvertFrom-Json
        foreach ($m in $obj[0].Mounts) {
            if ($m.Destination -eq $InContainerPath) { return $m.Source }
        }
    } catch { }
    return $InContainerPath
}
$HostRepoRoot = Resolve-HostRepoRoot $RepoRoot
if ($HostRepoRoot -ne $RepoRoot) {
    Write-Status "Detected host repo path: $HostRepoRoot (in-container: $RepoRoot)"
}

# Docker Desktop on Windows accepts both `C:\path` and `C:/path`, but the
# forward-slash form is more reliable -- the backslash form trips Docker's
# argument parser and trips `ps_fence_check.sh` when it concatenates
# COURSE_TOOLS_HOST_ROOT with /work-suffix paths. On macOS/Linux this is a no-op.
$HostRepoRootDocker = $HostRepoRoot -replace '\\', '/'

$Dockerfile = Join-Path $RepoRoot "utilities\Dockerfile.course-tools"
$DataLoader = Join-Path $RepoRoot "data\comprehensive_data_loader.js"
$SetupPs1            = Join-Path $ScriptDir "setup.ps1"
$TeardownPs1         = Join-Path $ScriptDir "teardown.ps1"
$SetupShardingPs1    = Join-Path $ScriptDir "setup_sharding.ps1"
$TeardownShardingPs1 = Join-Path $ScriptDir "teardown_sharding.ps1"

$Image    = "course-tools:latest"
$Network  = "mongodb-net"
$RsUri    = "mongodb://mongo1:27017/?directConnection=true&replicaSet=rs0"
$ShUri    = "mongodb://mongo-mongos:27017/?directConnection=true"

$OverallPass = $true
$SuiteResults = @()

function Add-SuiteResult { param([string]$r) $script:SuiteResults += $r }

# Verify docker is available.
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Err "docker not found on PATH. Install Docker Desktop and try again."
    exit 127
}

# Build the course-tools image up-front if missing.
function Ensure-CourseToolsImage {
    & docker image inspect $Image *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Building $Image (first run only) ..."
        & docker build -t $Image -f $Dockerfile (Join-Path $RepoRoot "utilities")
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Failed to build $Image"
            exit 1
        }
    }
}

# Run a test script inside the course-tools container with all standard mounts.
# Returns the container's exit code.
function Invoke-CourseToolsScript {
    param(
        [string]$ContainerScript,        # /work/... path inside container
        [string[]]$Arguments = @()
    )
    # Use --mount (key=value, comma-separated) instead of -v (colon-separated).
    # On Windows the host path contains a drive-letter colon, and Docker's -v
    # parser sometimes silently mounts an empty dir when colons collide, which
    # is why /work/utilities/*.sh appears "missing" inside the container.
    $dockerArgs = @(
        "run", "--rm",
        "--network", $Network,
        "--mount", "type=bind,src=${HostRepoRootDocker},dst=/work",
        "--mount", "type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock",
        "-e", "MONGO_URI=$RsUri",
        "-e", "MONGOS_URI=$ShUri",
        "-e", "CLEAN_RUN=false",
        "-e", "COURSE_TOOLS_IN_CONTAINER=1",
        "-e", "COURSE_TOOLS_HOST_ROOT=$HostRepoRootDocker",
        "-w", "/work",
        $Image,
        $ContainerScript
    ) + $Arguments
    & docker @dockerArgs
    return $LASTEXITCODE
}

Write-Host "==================================================" -ForegroundColor Blue
Write-Host "MongoDB Mastering Course - Comprehensive Test"     -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""

# Step 1: Initial teardown
Write-Status "Step 1/8: Initial teardown of replica set + sharded cluster..."
try { & $TeardownShardingPs1 *> $null } catch { }
try { & $TeardownPs1         *> $null } catch { }
Write-Success "Teardown completed"
Write-Host ""

# Step 2: Replica set setup
Write-Status "Step 2/8: Running setup.ps1 (3-node replica set)..."
& $SetupPs1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Replica set setup failed; aborting"
    exit 1
}
Write-Success "Replica set setup completed"
Write-Host ""

# Step 3: Sharded cluster setup
Write-Status "Step 3/8: Running setup_sharding.ps1 (config + shards + mongos)..."
& $SetupShardingPs1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Sharded cluster setup failed; aborting"
    try { & $TeardownPs1 *> $null } catch { }
    exit 1
}
Write-Success "Sharded cluster setup completed"
Write-Host ""

# Build the course-tools image now that we know docker is functional.
Ensure-CourseToolsImage

# Step 4: Load comprehensive data via the course-tools image.
Write-Status "Step 4/8: Loading comprehensive data loader (via course-tools)..."
if (-not (Test-Path $DataLoader)) {
    Write-Err "Cannot find data loader at: $DataLoader"
    $OverallPass = $false
    Add-SuiteResult "Data load: SKIPPED (missing)"
} else {
    $rc = Invoke-CourseToolsScript -ContainerScript "/bin/bash" `
        -Arguments @("-c", "mongosh `"$RsUri`" --quiet < /work/data/comprehensive_data_loader.js > /dev/null")
    if ($rc -eq 0) {
        Write-Success "Data loaded"
        Add-SuiteResult "Data load: PASS"
    } else {
        Write-Err "Data load failed"
        $OverallPass = $false
        Add-SuiteResult "Data load: FAIL"
    }
}
Write-Host ""

# Step 5: Curated validator
Write-Status "Step 5/8: Suite 1/3 - comprehensive_lab_validator.sh (curated tests)..."
$rc = Invoke-CourseToolsScript -ContainerScript "/work/utilities/comprehensive_lab_validator.sh" `
    -Arguments @("--quick")
if ($rc -eq 0) {
    Write-Success "Curated validator passed"
    Add-SuiteResult "Curated validator: PASS"
} else {
    Write-Err "Curated validator reported failures"
    $OverallPass = $false
    Add-SuiteResult "Curated validator: FAIL"
}
Write-Host ""

# Step 6: Per-fence runner
Write-Status "Step 6/8: Suite 2/3 - lab_fence_runner.sh (per-fence)..."
$rc = Invoke-CourseToolsScript -ContainerScript "/work/utilities/lab_fence_runner.sh"
if ($rc -eq 0) {
    Write-Success "Per-fence runner passed"
    Add-SuiteResult "Per-fence runner: PASS"
} else {
    Write-Err "Per-fence runner reported failures"
    $OverallPass = $false
    Add-SuiteResult "Per-fence runner: FAIL"
}
Write-Host ""

# Step 7: PowerShell fence check
if ($SkipPwsh) {
    Write-Status "Step 7/8: Suite 3/3 - ps_fence_check.sh - SKIPPED (-SkipPwsh)"
    Add-SuiteResult "PowerShell fence check: SKIPPED (-SkipPwsh)"
} else {
    Write-Status "Step 7/8: Suite 3/3 - ps_fence_check.sh (PowerShell parse-check via Docker)..."
    $rc = Invoke-CourseToolsScript -ContainerScript "/work/utilities/ps_fence_check.sh"
    if ($rc -eq 0) {
        Write-Success "PowerShell fence check passed"
        Add-SuiteResult "PowerShell fence check: PASS"
    } else {
        Write-Err "PowerShell fence check reported failures"
        $OverallPass = $false
        Add-SuiteResult "PowerShell fence check: FAIL"
    }
}
Write-Host ""

# Step 8: Final teardown
Write-Status "Step 8/8: Final teardown of both environments..."
try { & $TeardownShardingPs1 *> $null } catch { }
try { & $TeardownPs1         *> $null } catch { }
Write-Success "Teardown completed"
Write-Host ""

# Final report
Write-Host "==================================================" -ForegroundColor Blue
Write-Host "SUITE RESULTS"                                       -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue
foreach ($r in $SuiteResults) {
    Write-Host "  $r"
}
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
if ($OverallPass) {
    Write-Success "COMPREHENSIVE TEST: PASS"
    Write-Host "==================================================" -ForegroundColor Blue
    exit 0
} else {
    Write-Err "COMPREHENSIVE TEST: FAIL"
    Write-Host "==================================================" -ForegroundColor Blue
    exit 1
}
