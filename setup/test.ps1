# MongoDB Mastering Course - Quick Test Script (PowerShell)
# Tests MongoDB connection and basic operations
# Compatible with Windows PowerShell and PowerShell Core

param(
    [switch]$Help,
    [switch]$LoadData
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Connection Test

USAGE:
    .\test.ps1              # Test connection only
    .\test.ps1 -LoadData    # Test connection and load Day 1 data

WHAT IT DOES:
    - Tests MongoDB connection
    - Checks replica set status
    - Tests write/read operations
    - Optionally loads course data

DURATION: ~15 seconds
"@ -ForegroundColor Cyan
    exit 0
}

# Set error handling
$ErrorActionPreference = "Stop"

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

# Test 1: Basic connection
Write-Status "Testing MongoDB connection..."
try {
    $connectionResult = mongosh --quiet --eval "db.hello()" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Connected to MongoDB"
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Error "Cannot connect to MongoDB"
    Write-Host ""
    Write-Host "Make sure MongoDB is running:" -ForegroundColor Yellow
    Write-Host "  .\setup.ps1" -ForegroundColor White
    exit 1
}

# Test 2: Replica set status
Write-Status "Checking replica set status..."
Write-Host ""
try {
    $statusCommand = "rs.status().members.forEach(m => print('  ' + m.name + ': ' + m.stateStr));"
    $statusResult = mongosh --quiet --eval $statusCommand
    Write-Host $statusResult -ForegroundColor Cyan
} catch {
    Write-Warning "Could not get replica set status: $_"
}
Write-Host ""

# Test 3: Write operations
Write-Status "Testing write operations..."
try {
    $writeTestCommand = @"
use test_connection;
db.test.insertOne({test: 'connection', timestamp: new Date()});
var doc = db.test.findOne();
if (doc && doc.test === 'connection') {
    print('✅ Write/Read test: PASSED');
} else {
    print('❌ Write/Read test: FAILED');
}
db.test.drop();
"@

    $writeResult = mongosh --quiet --eval $writeTestCommand
    Write-Host $writeResult -ForegroundColor Green
} catch {
    Write-Error "Write operations test failed: $_"
    exit 1
}

# Test 4: Load course data if requested or available
Write-Status "Checking for course data..."
$dataFile = "..\data\day1_data_loader.js"

if (Test-Path $dataFile) {
    if ($LoadData) {
        $loadData = $true
    } else {
        $response = Read-Host "Load Day 1 course data? (y/N)"
        $loadData = ($response -eq "y" -or $response -eq "Y")
    }

    if ($loadData) {
        Write-Status "Loading Day 1 course data..."
        try {
            Push-Location "..\data"
            $loadResult = mongosh --quiet < day1_data_loader.js
            Pop-Location
            Write-Success "Course data loaded"

            # Verify data
            Write-Status "Verifying loaded data..."
            $verifyCommand = @"
use insurance_company;
print('  Branches: ' + db.branches.countDocuments());
print('  Policies: ' + db.policies.countDocuments());
print('  Customers: ' + db.customers.countDocuments());
"@

            $verifyResult = mongosh --quiet --eval $verifyCommand
            Write-Host $verifyResult -ForegroundColor Cyan
        } catch {
            Write-Error "Failed to load course data: $_"
            if (Get-Location | Select-Object -ExpandProperty Path | ForEach-Object { $_ -notmatch "setup" }) {
                Pop-Location
            }
        }
    }
} else {
    Write-Warning "Course data files not found in ..\data\"
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
Write-Success "Test Complete!"
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Your MongoDB setup is working correctly." -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  mongosh                    # Connect to MongoDB" -ForegroundColor White
Write-Host "  .\teardown.ps1             # Remove all containers" -ForegroundColor White
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue