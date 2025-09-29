# MongoDB Mastering Course - Automated Setup Script (PowerShell)
# Creates a 3-node replica set for all course days
# Compatible with Windows PowerShell 5.1+ and PowerShell Core 6+

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Automated Setup

USAGE:
    .\setup.ps1

REQUIREMENTS:
    - Docker Desktop installed and running
    - MongoDB Shell (mongosh) installed
    - PowerShell execution policy allows script execution

EXECUTION POLICY:
    If you get execution policy errors, run:
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

WHAT IT DOES:
    - Creates 3-node MongoDB replica set
    - Configures proper write concerns
    - Tests basic operations
    - Ready for course data loading

DURATION: ~30 seconds
"@ -ForegroundColor Cyan
    exit 0
}

# Check PowerShell version compatibility
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "[ERROR] This script requires PowerShell 5.0 or later" -ForegroundColor Red
    Write-Host "Current version: $($PSVersionTable.PSVersion)" -ForegroundColor Yellow
    Write-Host "Please upgrade PowerShell or use setup.cmd instead" -ForegroundColor Yellow
    exit 1
}

# Set error handling
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Blue
Write-Host "MongoDB Mastering Course - Automated Setup" -ForegroundColor Blue
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

# Check if Docker is running
Write-Status "Checking Docker status..."
try {
    # Method 1: Try direct docker command first
    $dockerInfo = $null
    $dockerWorking = $false

    try {
        # Try direct docker version command (simpler than info)
        $dockerVersion = docker version --format "{{.Server.Version}}" 2>$null
        if ($dockerVersion -and $LASTEXITCODE -eq 0) {
            $dockerWorking = $true
        }
    } catch {}

    # Method 2: If direct method fails, try cmd /c approach
    if (-not $dockerWorking) {
        try {
            $dockerInfo = cmd /c "docker version --format `"{{.Server.Version}}`" 2>nul"
            if ($dockerInfo -and $LASTEXITCODE -eq 0) {
                $dockerWorking = $true
            }
        } catch {}
    }

    # Method 3: Final fallback - check for Docker process
    if (-not $dockerWorking) {
        $dockerProcess = Get-Process -Name "*Docker*" -ErrorAction SilentlyContinue
        if ($dockerProcess) {
            # Docker process exists, try simple version check
            try {
                docker --version 2>$null | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    $dockerWorking = $true
                }
            } catch {}
        }
    }

    if (-not $dockerWorking) {
        throw "Docker not accessible"
    }

    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running or not accessible. Please start Docker Desktop and try again."
    Write-Host ""
    Write-Host "To start Docker Desktop:" -ForegroundColor Yellow
    Write-Host "  1. Find Docker Desktop in Start Menu" -ForegroundColor Yellow
    Write-Host "  2. Click to start it" -ForegroundColor Yellow
    Write-Host "  3. Wait for it to finish starting" -ForegroundColor Yellow
    Write-Host "  4. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If Docker Desktop is installed but not starting:" -ForegroundColor Yellow
    Write-Host "  - Check if Windows virtualization is enabled" -ForegroundColor Yellow
    Write-Host "  - Try restarting Docker Desktop as Administrator" -ForegroundColor Yellow
    Write-Host "  - Try running this script as Administrator" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Debug information:" -ForegroundColor Cyan
    Write-Host "  Run 'docker --version' manually to test Docker access" -ForegroundColor White
    exit 1
}

# Clean up any existing MongoDB containers
Write-Status "Cleaning up existing MongoDB containers..."
try {
    # Use cmd for better error handling on Windows
    cmd /c "docker rm -f mongo1 mongo2 mongo3 2>nul" | Out-Null
} catch {
    # Ignore errors during cleanup
}
try {
    cmd /c "docker network rm mongodb-net 2>nul" | Out-Null
} catch {
    # Ignore errors during cleanup
}
Write-Success "Cleanup completed"

# Step 1: Create Docker network
Write-Status "Creating Docker network..."
try {
    $networkId = docker network create mongodb-net
    Write-Success "Network 'mongodb-net' created"
} catch {
    Write-Error "Failed to create Docker network: $_"
    exit 1
}

# Step 2: Start MongoDB containers
Write-Status "Starting MongoDB containers..."

Write-Status "  Starting mongo1 (Primary)..."
try {
    $mongo1 = docker run -d --name mongo1 --network mongodb-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
    Write-Success "  mongo1 started"
} catch {
    Write-Error "Failed to start mongo1: $_"
    exit 1
}

Write-Status "  Starting mongo2 (Secondary)..."
try {
    $mongo2 = docker run -d --name mongo2 --network mongodb-net -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
    Write-Success "  mongo2 started"
} catch {
    Write-Error "Failed to start mongo2: $_"
    exit 1
}

Write-Status "  Starting mongo3 (Secondary)..."
try {
    $mongo3 = docker run -d --name mongo3 --network mongodb-net -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all
    Write-Success "  mongo3 started"
} catch {
    Write-Error "Failed to start mongo3: $_"
    exit 1
}

Write-Success "All MongoDB containers started"

# Step 3: Wait for containers to be ready
Write-Status "Waiting for containers to start (15 seconds)..."
Start-Sleep -Seconds 15

# Step 4: Initialize replica set
Write-Status "Initializing replica set..."
try {
    # Use a safer approach for Windows PowerShell string handling
    $initCommand = "rs.initiate({_id:'rs0',members:[{_id:0,host:'mongo1:27017',priority:2},{_id:1,host:'mongo2:27017',priority:1},{_id:2,host:'mongo3:27017',priority:1}]});"

    $result = docker exec mongo1 mongosh --quiet --eval $initCommand
    if ($LASTEXITCODE -ne 0) {
        throw "Docker exec failed with exit code $LASTEXITCODE"
    }
    Write-Success "Replica set initialized"
} catch {
    Write-Error "Failed to initialize replica set: $_"
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "  1. Verify all containers are running: docker ps" -ForegroundColor Yellow
    Write-Host "  2. Check container logs: docker logs mongo1" -ForegroundColor Yellow
    Write-Host "  3. Try manual connection: docker exec -it mongo1 mongosh" -ForegroundColor Yellow
    exit 1
}

# Step 5: Wait for replica set to stabilize
Write-Status "Waiting for replica set to stabilize (30 seconds)..."
Start-Sleep -Seconds 30

# Step 6: Set write concern from host
Write-Status "Setting write concern..."

# Wait for primary to be elected and host connection to be available
$maxAttempts = 15
$attempt = 1
$connected = $false

while ($attempt -le $maxAttempts -and -not $connected) {
    try {
        # Use simpler command for better Windows compatibility
        $testCommand = "var status=rs.isMaster();if(status.ismaster){print('Connected');quit(0);}else{quit(1);}"
        $testResult = cmd /c "mongosh --quiet --eval `"$testCommand`" 2>nul"
        if ($LASTEXITCODE -eq 0) {
            $connected = $true
            break
        }
    } catch {}

    Write-Status "  Attempt $attempt/$maxAttempts - waiting for primary election..."
    Start-Sleep -Seconds 3
    $attempt++
}

if (-not $connected) {
    Write-Error "Could not connect to primary after $maxAttempts attempts"
    Write-Status "Checking container status..."
    docker ps --filter name=mongo
    Write-Status "Checking replica set status from container..."
    try { docker exec mongo1 mongosh --quiet --eval "rs.status().ok" } catch {}
    exit 1
}

try {
    # Use simplified write concern command for Windows compatibility
    $writeConcernCommand = "db.adminCommand({setDefaultRWConcern:1,defaultWriteConcern:{w:'majority',wtimeout:5000}});"

    $result = mongosh --quiet --eval $writeConcernCommand
    if ($LASTEXITCODE -ne 0) {
        throw "mongosh command failed with exit code $LASTEXITCODE"
    }
    Write-Success "Write concern configured"
} catch {
    Write-Error "Failed to set write concern: $_"
    Write-Host ""
    Write-Host "This is usually not critical for learning labs." -ForegroundColor Yellow
    Write-Host "You can continue with the setup." -ForegroundColor Yellow
}

# Step 7: Verify setup
Write-Status "Verifying replica set status..."
Write-Host ""
try {
    # Simplified status check for Windows
    $statusResult = mongosh --quiet --eval "rs.status().members.forEach(function(m){print('  '+m.name+': '+m.stateStr);});"
    if ($statusResult) {
        Write-Host $statusResult -ForegroundColor Cyan
    }
} catch {
    Write-Warning "Could not verify replica set status, but setup likely succeeded"
}
Write-Host ""

# Step 8: Test basic operations
Write-Status "Testing basic operations..."
try {
    # Use docker exec for more reliable connection
    $testCommand = "use test_setup; db.test.insertOne({message:'Setup test',timestamp:new Date()}); var doc=db.test.findOne(); if(doc){print('Test passed');} db.test.drop();"

    $testResult = docker exec mongo1 mongosh --quiet --eval $testCommand
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Basic operations working"
    } else {
        Write-Warning "Basic operations test had issues, but setup likely succeeded"
    }
} catch {
    Write-Warning "Basic operations test failed, but setup likely succeeded"
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
Write-Success "MongoDB Replica Set Setup Complete!"
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Your MongoDB replica set is ready:" -ForegroundColor Green
Write-Host "  • Primary:   localhost:27017" -ForegroundColor Cyan
Write-Host "  • Secondary: localhost:27018" -ForegroundColor Cyan
Write-Host "  • Secondary: localhost:27019" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Load course data: cd ..\data && mongosh < day1_data_loader.js" -ForegroundColor White
Write-Host "  2. Test connection: mongosh" -ForegroundColor White
Write-Host "  3. See LOAD_DATA.md for detailed data loading instructions" -ForegroundColor White
Write-Host "  4. When done: .\teardown.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  If you encounter issues:" -ForegroundColor White
Write-Host "  - Run .\teardown.ps1 first, then .\setup.ps1 again" -ForegroundColor White
Write-Host "  - Check Docker Desktop is running and updated" -ForegroundColor White
Write-Host "  - Ensure mongosh is installed and in PATH" -ForegroundColor White
Write-Host "  - Try running PowerShell as Administrator" -ForegroundColor White
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue