# MongoDB Mastering Course - Automated Teardown Script (PowerShell)
# Removes all MongoDB containers and networks
# Compatible with Windows PowerShell and PowerShell Core

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Automated Teardown

USAGE:
    .\teardown.ps1

WHAT IT DOES:
    - Force removes all MongoDB containers
    - Removes networks
    - Verifies clean environment

DURATION: ~10 seconds
"@ -ForegroundColor Cyan
    exit 0
}

# Set error handling
$ErrorActionPreference = "Continue"  # Continue on errors for cleanup

Write-Host "==================================================" -ForegroundColor Blue
Write-Host "MongoDB Mastering Course - Automated Teardown" -ForegroundColor Blue
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

# Check if containers exist
Write-Status "Checking for MongoDB containers..."
try {
    # Use cmd for better Windows compatibility
    $containerList = cmd /c "docker ps -a --filter `"name=mongo`" --format `"{{.Names}}`" 2>nul"
    $containers = $containerList | Where-Object { $_ -match "^mongo[123]$" }

    if (-not $containers) {
        Write-Warning "No MongoDB containers found"
    } else {
        Write-Host "  Found containers: $($containers -join ', ')" -ForegroundColor Cyan
    }
} catch {
    Write-Warning "Could not check for containers: $_"
}

# Force remove containers (stops and removes in one step)
if ($containers) {
    Write-Status "Force removing MongoDB containers..."
    foreach ($container in $containers) {
        Write-Status "  Force removing $container..."
        try {
            cmd /c "docker rm -f $container 2>nul" | Out-Null
        } catch {
            Write-Warning "  Could not force remove $container"
        }
    }
    Write-Success "Containers removed"
}

# Remove network
Write-Status "Removing MongoDB network..."
try {
    $networks = docker network ls --filter "name=mongodb-net" --format "{{.Name}}" 2>$null
    if ($networks -contains "mongodb-net") {
        docker network rm mongodb-net 2>$null | Out-Null
        Write-Success "Network 'mongodb-net' removed"
    } else {
        Write-Warning "Network 'mongodb-net' not found"
    }
} catch {
    Write-Warning "Could not remove network: $_"
}

# Verify cleanup
Write-Status "Verifying cleanup..."
try {
    $remainingContainers = docker ps -a --filter "name=mongo" --format "{{.Names}}" 2>$null | Where-Object { $_ -match "^mongo[123]$" }
    $remainingNetworks = docker network ls --filter "name=mongodb-net" --format "{{.Name}}" 2>$null

    $cleanupSuccess = $true

    if ($remainingContainers) {
        Write-Warning "Some containers may still exist: $($remainingContainers -join ', ')"
        $cleanupSuccess = $false
    }

    if ($remainingNetworks -contains "mongodb-net") {
        Write-Warning "Network 'mongodb-net' may still exist"
        $cleanupSuccess = $false
    }

    if ($cleanupSuccess) {
        Write-Success "All MongoDB resources cleaned up"
    }
} catch {
    Write-Warning "Could not verify cleanup: $_"
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
Write-Success "MongoDB Teardown Complete!"
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "All MongoDB containers and networks have been removed." -ForegroundColor Green
Write-Host ""
Write-Host "To set up again:" -ForegroundColor Yellow
Write-Host "  .\setup.ps1" -ForegroundColor White
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue