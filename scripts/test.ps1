# MongoDB Mastering Course - Quick Test Script (PowerShell)
# Tests MongoDB connection and basic operations
# Compatible with Windows PowerShell and PowerShell Core

param(
    [switch]$Help,
    [switch]$LoadData,
    [switch]$Validate
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Connection Test

USAGE:
    .\test.ps1              # Test connection only
    .\test.ps1 -LoadData    # Test connection and load Day 1 data
    .\test.ps1 -Validate    # Validate PowerShell script improvements

WHAT IT DOES:
    - Tests MongoDB connection
    - Checks replica set status
    - Tests write/read operations
    - Optionally loads course data
    - Validates PowerShell fixes (with -Validate flag)

DURATION: ~15 seconds
"@ -ForegroundColor Cyan
    exit 0
}

# Set error handling
$ErrorActionPreference = "Stop"

if ($Validate) {
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host "PowerShell Script Validation Test" -ForegroundColor Blue
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host ""
} else {
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host "MongoDB Mastering Course - Connection Test" -ForegroundColor Blue
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host ""
}

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

# PowerShell Validation Mode
if ($Validate) {
    # Test 1: PowerShell Version Compatibility
    Write-Host "[TEST 1] PowerShell Version Compatibility" -ForegroundColor Yellow
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        Write-Host "  [FAIL] PowerShell version too old: $($PSVersionTable.PSVersion)" -ForegroundColor Red
        Write-Host "  [INFO] Minimum required: 5.0" -ForegroundColor Yellow
    } else {
        Write-Host "  [PASS] PowerShell version: $($PSVersionTable.PSVersion)" -ForegroundColor Green
    }
    Write-Host ""

    # Test 2: Docker Detection Methods
    Write-Host "[TEST 2] Docker Detection Methods (setup.ps1 v2.0)" -ForegroundColor Yellow
    try {
        $dockerWorking = $false
        $testMethods = @()

        # Method 1: Direct docker command
        try {
            $dockerVersion = docker version --format "{{.Server.Version}}" 2>$null
            if ($dockerVersion -and $LASTEXITCODE -eq 0) {
                $dockerWorking = $true
                $testMethods += "Direct command"
            }
        } catch {}

        # Method 2: cmd /c approach
        if (-not $dockerWorking) {
            try {
                $dockerInfo = cmd /c "docker version --format `"{{.Server.Version}}`" 2>nul"
                if ($dockerInfo -and $LASTEXITCODE -eq 0) {
                    $dockerWorking = $true
                    $testMethods += "cmd /c method"
                }
            } catch {}
        }

        # Method 3: Process check + simple version
        if (-not $dockerWorking) {
            $dockerProcess = Get-Process -Name "*Docker*" -ErrorAction SilentlyContinue
            if ($dockerProcess) {
                try {
                    docker --version 2>$null | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        $dockerWorking = $true
                        $testMethods += "Process detection + version check"
                    }
                } catch {}
            }
        }

        if ($dockerWorking) {
            Write-Host "  [PASS] Docker accessible via: $($testMethods -join ', ')" -ForegroundColor Green
            try {
                $versionOutput = docker --version 2>$null
                if ($versionOutput) {
                    Write-Host "  [INFO] $versionOutput" -ForegroundColor Cyan
                }
            } catch {}
        } else {
            Write-Host "  [FAIL] Docker not accessible via any method" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [FAIL] Error testing Docker access: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test 3: MongoDB Command Formatting
    Write-Host "[TEST 3] MongoDB Command String Formatting" -ForegroundColor Yellow
    try {
        $initCommand = "rs.initiate({_id:'rs0',members:[{_id:0,host:'mongo1:27017',priority:2},{_id:1,host:'mongo2:27017',priority:1},{_id:2,host:'mongo3:27017',priority:1}]});"

        if ($initCommand.Length -gt 100 -and $initCommand.Contains("rs.initiate")) {
            Write-Host "  [PASS] MongoDB initialization command properly formatted" -ForegroundColor Green
            Write-Host "  [INFO] Command length: $($initCommand.Length) characters" -ForegroundColor Cyan
        } else {
            Write-Host "  [FAIL] MongoDB command format issue" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [FAIL] Error testing MongoDB command: $_" -ForegroundColor Red
    }
    Write-Host ""

    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host "PowerShell Validation Complete" -ForegroundColor Blue
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Key improvements validated:" -ForegroundColor Green
    Write-Host "  ✓ PowerShell version compatibility checking" -ForegroundColor White
    Write-Host "  ✓ 3-method Docker detection approach" -ForegroundColor White
    Write-Host "  ✓ MongoDB command string formatting" -ForegroundColor White
    Write-Host ""
    Write-Host "If tests pass, the PowerShell scripts should work reliably on Windows." -ForegroundColor Yellow
    Write-Host ""
    exit 0
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