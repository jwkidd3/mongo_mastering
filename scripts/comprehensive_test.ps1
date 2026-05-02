# MongoDB Mastering Course - Comprehensive End-to-End Test (PowerShell)
# Runs the complete flow: teardown -> setup -> data load -> validate -> teardown
# Compatible with Windows PowerShell 5.1+ and PowerShell Core 6+

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Comprehensive End-to-End Test

USAGE:
    .\comprehensive_test.ps1

WHAT IT DOES:
    1. Tears down any existing environment (errors ignored)
    2. Runs setup.ps1 to provision a fresh 3-node replica set
    3. Loads data\comprehensive_data_loader.js
    4. Runs utilities\comprehensive_lab_validator.sh non-interactively (--quick)
       Note: this is a bash script. On Windows, run from WSL or Git Bash.
    5. Tears down the environment
    6. Reports overall PASS/FAIL

DURATION: ~3-5 minutes
"@ -ForegroundColor Cyan
    exit 0
}

$ErrorActionPreference = "Continue"

# Colors / helpers
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}
function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}
function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}
function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Resolve directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoRoot = Split-Path -Parent $ScriptDir
$Validator = Join-Path $RepoRoot "utilities\comprehensive_lab_validator.sh"
$DataLoader = Join-Path $RepoRoot "data\comprehensive_data_loader.js"
$SetupPs1 = Join-Path $ScriptDir "setup.ps1"
$TeardownPs1 = Join-Path $ScriptDir "teardown.ps1"

$OverallPass = $true

Write-Host "==================================================" -ForegroundColor Blue
Write-Host "MongoDB Mastering Course - Comprehensive Test" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""

# Step 1: Initial teardown (ignore errors)
Write-Status "Step 1/5: Initial teardown (errors ignored)..."
try {
    & $TeardownPs1 *> $null
    Write-Success "Initial teardown completed"
} catch {
    Write-Warning "Initial teardown reported issues (continuing anyway)"
}
Write-Host ""

# Step 2: Setup
Write-Status "Step 2/5: Running setup.ps1..."
& $SetupPs1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Setup failed; aborting comprehensive test"
    exit 1
}
Write-Success "Setup completed"
Write-Host ""

# Step 3: Load comprehensive data
Write-Status "Step 3/5: Loading comprehensive data loader..."
if (-not (Test-Path $DataLoader)) {
    Write-Error "Cannot find data loader at: $DataLoader"
    $OverallPass = $false
} else {
    Push-Location $RepoRoot
    try {
        Get-Content $DataLoader | mongosh "mongodb://localhost:27017/?directConnection=true" --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Data loaded"
        } else {
            Write-Error "Data load failed"
            $OverallPass = $false
        }
    } finally {
        Pop-Location
    }
}
Write-Host ""

# Step 4: Run lab validator non-interactively
Write-Status "Step 4/5: Running comprehensive lab validator (--quick)..."
if (-not (Test-Path $Validator)) {
    Write-Error "Validator not found at: $Validator"
    $OverallPass = $false
} else {
    # comprehensive_lab_validator.sh is a bash script.
    # Try to invoke through bash (WSL or Git Bash must be on PATH).
    $bashCmd = Get-Command bash -ErrorAction SilentlyContinue
    if (-not $bashCmd) {
        Write-Error "bash not found on PATH. Install WSL or Git Bash to run the validator."
        $OverallPass = $false
    } else {
        & bash $Validator --quick
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Lab validation completed"
        } else {
            Write-Error "Lab validation reported failures"
            $OverallPass = $false
        }
    }
}
Write-Host ""

# Step 5: Final teardown
Write-Status "Step 5/5: Final teardown..."
try {
    & $TeardownPs1 *> $null
    Write-Success "Teardown completed"
} catch {
    Write-Warning "Teardown reported issues"
}
Write-Host ""

# Final report
Write-Host "==================================================" -ForegroundColor Blue
if ($OverallPass) {
    Write-Success "COMPREHENSIVE TEST: PASS"
    Write-Host "==================================================" -ForegroundColor Blue
    exit 0
} else {
    Write-Error "COMPREHENSIVE TEST: FAIL"
    Write-Host "==================================================" -ForegroundColor Blue
    exit 1
}
