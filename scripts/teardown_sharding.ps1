# MongoDB Mastering Course - Sharded Cluster Teardown Script (PowerShell)
# Best-effort teardown of the sharded cluster containers.
# Does NOT remove the 'mongodb-net' network (the main replica set may
# still be using it).
# Compatible with Windows PowerShell 5.1+ and PowerShell Core 6+.

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Sharded Cluster Teardown

USAGE:
    .\teardown_sharding.ps1

WHAT IT DOES:
    - Force removes mongo-cfg, mongo-shard1, mongo-shard2, mongo-mongos
    - Leaves mongo1/mongo2/mongo3 (replica set) untouched
    - Leaves the 'mongodb-net' network in place

DURATION: ~5 seconds
"@ -ForegroundColor Cyan
    exit 0
}

$ErrorActionPreference = "Continue"

Write-Host "==================================================" -ForegroundColor Blue
Write-Host "MongoDB Mastering Course - Sharded Cluster Teardown" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""

function Write-Status  { param([string]$m) Write-Host "[INFO] $m" -ForegroundColor Blue }
function Write-Success { param([string]$m) Write-Host "[SUCCESS] $m" -ForegroundColor Green }
function Write-Warn    { param([string]$m) Write-Host "[WARNING] $m" -ForegroundColor Yellow }
function Write-Err     { param([string]$m) Write-Host "[ERROR] $m" -ForegroundColor Red }

$ShardingContainers = @("mongo-mongos", "mongo-shard1", "mongo-shard2", "mongo-cfg")

Write-Status "Checking for sharded-cluster containers..."
$existing = docker ps -a --format "{{.Names}}" 2>$null
$found = @()
foreach ($c in $ShardingContainers) {
    if ($existing -contains $c) {
        $found += $c
        Write-Host "  Found: $c" -ForegroundColor Cyan
    }
}

if ($found.Count -eq 0) {
    Write-Warn "No sharded-cluster containers found"
} else {
    Write-Status "Force removing sharded-cluster containers..."
    foreach ($c in $found) {
        Write-Status "  Force removing $c..."
        docker rm -f $c *> $null
    }
    Write-Success "Sharded-cluster containers removed"
}

# Verify
Write-Status "Verifying cleanup..."
$existingAfter = docker ps -a --format "{{.Names}}" 2>$null
$remaining = @()
foreach ($c in $ShardingContainers) {
    if ($existingAfter -contains $c) { $remaining += $c }
}

if ($remaining.Count -eq 0) {
    Write-Success "All sharded-cluster containers cleaned up"
} else {
    Write-Warn "Some containers may still exist: $($remaining -join ', ')"
}

Write-Host ""
Write-Status "Network 'mongodb-net' was preserved (main replica set may still need it)"
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
Write-Success "Sharded Cluster Teardown Complete!"
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "To set the sharded cluster up again:" -ForegroundColor Yellow
Write-Host "  .\setup_sharding.ps1"
Write-Host ""
Write-Host "To remove EVERYTHING (replica set + sharding + network):" -ForegroundColor Yellow
Write-Host "  .\teardown.ps1"
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
