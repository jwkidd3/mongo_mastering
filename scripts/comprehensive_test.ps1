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

# Always tee everything to a log file in the repo root. This lets a Windows VM
# user run the test, then `git add comprehensive_test.log && git commit && push`
# (or just paste the file contents) so the failure can be diagnosed off-machine.
$LogFile = Join-Path (Split-Path -Parent $PSScriptRoot) "comprehensive_test.log"
try { Stop-Transcript *> $null } catch { }   # in case a prior run left one open
Start-Transcript -Path $LogFile -Force | Out-Null
Write-Status "Logging full output to: $LogFile"

# Wrap exit so the transcript always flushes and the user is told where the
# log file is, even on early-exit failures (image build, setup, etc.).
function Exit-WithLog {
    param([int]$Code)
    if ($Code -ne 0) {
        Write-Err "Full log (commit and push to share): $LogFile"
    } else {
        Write-Status "Full log: $LogFile"
    }
    try { Stop-Transcript | Out-Null } catch { }
    exit $Code
}

# $PSScriptRoot is the directory of THIS script; it is the most reliable way
# to locate the repo regardless of how the script was invoked (relative path,
# absolute path, dot-sourced, pwsh -File, etc.). Resolve-Path canonicalizes
# the parent so we always end up with an absolute, normalized host path.
$ScriptDir  = $PSScriptRoot
$RepoRoot   = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

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

# Build candidate host-path forms for the docker bind-mount source. Docker
# Desktop on Windows is finicky: depending on backend (WSL2 vs Hyper-V) and
# CLI version it accepts different forms. We try them in order until one
# actually exposes the repo inside the container, then memoize the winner.
#
# On Linux/macOS the path is already POSIX so the first form works and the
# rest are duplicates that get deduped.
$HostRepoRootSlash    = $HostRepoRoot -replace '\\', '/'                  # C:/Users/foo/repo
$HostRepoRootBackslash = $HostRepoRoot                                    # C:\Users\foo\repo
$HostRepoRootMnt      = $HostRepoRootSlash -replace '^([A-Za-z]):/', '/$1/' # /c/Users/foo/repo

# Deduped, ordered list of candidates to probe.
$HostPathCandidates = @($HostRepoRootSlash, $HostRepoRootBackslash, $HostRepoRootMnt) |
    Select-Object -Unique

# Filled in by Test-CourseToolsMount once a working form is found.
$script:HostRepoRootDocker = $null
$script:MountStyle         = $null   # "--mount" or "-v"

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
    Exit-WithLog 127
}

# Build the course-tools image up-front if missing.
function Ensure-CourseToolsImage {
    & docker image inspect $Image *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Building $Image (first run only) ..."
        & docker build -t $Image -f $Dockerfile (Join-Path $RepoRoot "utilities")
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Failed to build $Image"
            Exit-WithLog 1
        }
    }
}

# Build the mount-related portion of a `docker run` arg list using whichever
# style was proven to work by Test-CourseToolsMount.
function Get-MountArgs {
    param([string]$HostPath, [string]$Style)
    if ($Style -eq "-v") {
        return @(
            "-v", "${HostPath}:/work:rw",
            "-v", "/var/run/docker.sock:/var/run/docker.sock"
        )
    }
    return @(
        "--mount", "type=bind,src=${HostPath},dst=/work",
        "--mount", "type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock"
    )
}

# Strip CRLF from script files that are exec'd or sourced inside Linux
# containers. On Windows checkouts with core.autocrlf=true (the default) git
# rewrites these files with CRLF; the kernel then can't exec a shebang line
# ending in "\r" and Docker surfaces this as "exec /work/...: no such file or
# directory" -- an error that LOOKS like the bind mount is broken but isn't.
# Mongo data loader .js files with CRLF cause separate but similarly opaque
# parse failures inside mongosh.
#
# This is a no-op on macOS/Linux (sed exits 0, nothing changes). On Windows
# it edits the files in-place via the bind mount, fixing existing checkouts
# without requiring a re-clone. Future fresh checkouts are protected by the
# .gitattributes file at the repo root.
function Repair-ShellLineEndings {
    Write-Status "Normalizing line endings on .sh and data .js files (defensive against Windows CRLF)..."
    $mountArgs = Get-MountArgs -HostPath $script:HostRepoRootDocker -Style $script:MountStyle
    $fixArgs = @("run", "--rm") + $mountArgs + @(
        "--entrypoint", "/bin/sh",
        $Image,
        "-c", @"
find /work/utilities /work/scripts -maxdepth 2 -type f -name '*.sh' -exec sed -i 's/\r$//' {} + ;
find /work/data /work/utilities -maxdepth 2 -type f -name '*.js' -exec sed -i 's/\r$//' {} +
"@
    )
    & docker @fixArgs *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Line-ending normalization exited $LASTEXITCODE (continuing anyway)"
    }
}

# Probe each (path-form, mount-style) combination by running a tiny container
# that lists a known file. The first combination whose exit code is 0 wins
# and gets stored in $script:HostRepoRootDocker / $script:MountStyle.
function Test-CourseToolsMount {
    Write-Status "Verifying repo bind-mount works against Docker daemon..."
    Write-Host  "  RepoRoot:     $RepoRoot"
    Write-Host  "  HostRepoRoot: $HostRepoRoot"
    Write-Host  "  Candidates:   $($HostPathCandidates -join ' | ')"

    $sentinel = "/work/utilities/lab_fence_runner.sh"
    $attempts = @()
    foreach ($style in @("--mount", "-v")) {
        foreach ($cand in $HostPathCandidates) {
            $mountArgs = Get-MountArgs -HostPath $cand -Style $style
            $probeArgs = @("run", "--rm") + $mountArgs + @(
                "--entrypoint", "/bin/sh",
                $Image,
                "-c", "test -f $sentinel && echo OK || (echo MISSING; ls -la /work 2>&1; exit 1)"
            )
            # Capture stdout+stderr so we can dump it to the log on total failure.
            $out = & docker @probeArgs 2>&1 | Out-String
            $rc  = $LASTEXITCODE
            $attempts += [pscustomobject]@{ Style = $style; Cand = $cand; RC = $rc; Out = $out }
            if ($rc -eq 0) {
                $script:HostRepoRootDocker = $cand
                $script:MountStyle         = $style
                Write-Success "Bind mount works: style=$style src=$cand"
                Repair-ShellLineEndings
                return
            }
        }
    }

    Write-Err "No bind-mount form exposes $sentinel inside the container."
    Write-Err "Attempts:"
    foreach ($a in $attempts) {
        Write-Err "  style=$($a.Style)  src=$($a.Cand)  rc=$($a.RC)"
        foreach ($line in ($a.Out -split "`n")) { if ($line) { Write-Err "    | $line" } }
    }
    Write-Err ""
    Write-Err "On Windows: open Docker Desktop > Settings > Resources > File Sharing"
    Write-Err "and confirm the drive containing the repo is shared. Then re-run."
    Exit-WithLog 1
}

# Run a test script inside the course-tools container with all standard mounts.
# Returns the container's exit code. Test-CourseToolsMount must have run first.
function Invoke-CourseToolsScript {
    param(
        [string]$ContainerScript,        # /work/... path inside container
        [string[]]$Arguments = @()
    )
    if (-not $script:HostRepoRootDocker) {
        Write-Err "Internal error: Invoke-CourseToolsScript called before Test-CourseToolsMount"
        return 1
    }
    $mountArgs = Get-MountArgs -HostPath $script:HostRepoRootDocker -Style $script:MountStyle
    $dockerArgs = @(
        "run", "--rm",
        "--network", $Network
    ) + $mountArgs + @(
        "-e", "MONGO_URI=$RsUri",
        "-e", "MONGOS_URI=$ShUri",
        "-e", "CLEAN_RUN=false",
        "-e", "COURSE_TOOLS_IN_CONTAINER=1",
        "-e", "COURSE_TOOLS_HOST_ROOT=$($script:HostRepoRootDocker)",
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
    Exit-WithLog 1
}
Write-Success "Replica set setup completed"
Write-Host ""

# Step 3: Sharded cluster setup
Write-Status "Step 3/8: Running setup_sharding.ps1 (config + shards + mongos)..."
& $SetupShardingPs1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Sharded cluster setup failed; aborting"
    try { & $TeardownPs1 *> $null } catch { }
    Exit-WithLog 1
}
Write-Success "Sharded cluster setup completed"
Write-Host ""

# Build the course-tools image now that we know docker is functional.
Ensure-CourseToolsImage

# Probe bind-mount styles/paths and pick the one that actually works on this
# host. Runs before steps 4-7, all of which depend on /work being populated.
Test-CourseToolsMount

# Step 4: Load comprehensive data via the course-tools image.
Write-Status "Step 4/8: Loading comprehensive data loader (via course-tools)..."
Write-Status "  Resolved paths:"
Write-Status "    `$PSScriptRoot       = $PSScriptRoot"
Write-Status "    `$RepoRoot           = $RepoRoot"
Write-Status "    `$DataLoader (host)  = $DataLoader"
Write-Status "    bind src for /work  = $($script:HostRepoRootDocker)"
Write-Status "    path passed to mongosh = /work/data/comprehensive_data_loader.js"
if (-not (Test-Path $DataLoader)) {
    Write-Err "Cannot find data loader at: $DataLoader"
    $OverallPass = $false
    Add-SuiteResult "Data load: SKIPPED (missing)"
} else {
    # Invoke mongosh directly with --file instead of `bash -c "mongosh ... < file"`.
    # Shell redirection through PowerShell -> docker -> bash -> mongosh is fragile
    # on Windows: PS 5.1 mangles the `<`, the embedded quotes around the URI, and
    # the `&` inside the URI. --file takes a path directly with no shell layer.
    $rc = Invoke-CourseToolsScript -ContainerScript "mongosh" `
        -Arguments @($RsUri, "--quiet", "--file", "/work/data/comprehensive_data_loader.js")
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
    Exit-WithLog 0
} else {
    Write-Err "COMPREHENSIVE TEST: FAIL"
    Write-Host "==================================================" -ForegroundColor Blue
    Exit-WithLog 1
}
