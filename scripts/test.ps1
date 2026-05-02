# MongoDB Mastering Course - Connection Test Script (PowerShell)
# Verifies MongoDB connection and runs basic write/read tests
# Compatible with Windows PowerShell 5.1+ and PowerShell Core 6+

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Connection Test

USAGE:
    .\test.ps1

WHAT IT DOES:
    - Tests basic mongosh connection to localhost:27017 (directConnection=true)
    - Runs scripts/test_connection.js
    - Reports clear PASS/FAIL

REQUIREMENTS:
    - MongoDB replica set running (run setup.ps1 first)
    - MongoDB Shell (mongosh) installed
"@ -ForegroundColor Cyan
    exit 0
}

# Set error handling
$ErrorActionPreference = "Continue"

Write-Host "==================================================" -ForegroundColor Blue
Write-Host "MongoDB Mastering Course - Connection Test" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""

# Function to print colored output
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

# Resolve script directory so this works from any cwd
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$TestJs = Join-Path $ScriptDir "test_connection.js"

# Verify mongosh is available
Write-Status "Checking for mongosh..."
$mongoshCmd = Get-Command mongosh -ErrorAction SilentlyContinue
if (-not $mongoshCmd) {
    Write-Error "mongosh not found in PATH. Please install MongoDB Shell."
    exit 1
}
Write-Success "mongosh found"

# Verify the test script exists
if (-not (Test-Path $TestJs)) {
    Write-Error "Cannot find test_connection.js at: $TestJs"
    exit 1
}

# Quick basic connection check before running the JS
Write-Status "Testing basic connection to localhost:27017..."
$basicCheck = mongosh "mongodb://localhost:27017/?directConnection=true" --quiet --eval "db.hello().ok" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Cannot connect to MongoDB at localhost:27017"
    Write-Warning "Did you run scripts\setup.ps1 first?"
    exit 1
}
Write-Success "Basic connection succeeded"

# Run the comprehensive test_connection.js
Write-Status "Running test_connection.js..."
Write-Host ""
Get-Content $TestJs | mongosh "mongodb://localhost:27017/?directConnection=true" --quiet
$testExit = $LASTEXITCODE

Write-Host ""
if ($testExit -eq 0) {
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Success "ALL TESTS PASSED"
    Write-Host "==================================================" -ForegroundColor Blue
    exit 0
} else {
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Error "TESTS FAILED"
    Write-Host "==================================================" -ForegroundColor Blue
    exit 1
}
