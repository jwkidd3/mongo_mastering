# MongoDB Mastering Course - Sharded Cluster Setup Script (PowerShell)
# Brings up a minimal sharded cluster (1 config server + 2 shards + 1 mongos)
# alongside the existing 3-node replica set on the same Docker network.
# Compatible with Windows PowerShell 5.1+ and PowerShell Core 6+.
#
# Topology:
#   mongo-cfg     -> port 27121  (configsvr, replica set "cfgrs")
#   mongo-shard1  -> port 27131  (shardsvr,  replica set "shard1rs")
#   mongo-shard2  -> port 27141  (shardsvr,  replica set "shard2rs")
#   mongo-mongos  -> port 27120  (mongos router)
#
# Lab 12 connects via:  mongodb://localhost:27120/?directConnection=true

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
MongoDB Mastering Course - Sharded Cluster Setup

USAGE:
    .\setup_sharding.ps1

REQUIREMENTS:
    - Docker Desktop installed and running
    - MongoDB Shell (mongosh) installed
    - PowerShell execution policy allows script execution

WHAT IT DOES:
    - Creates Docker network 'mongodb-net' if missing
    - Starts 1 config server (mongo-cfg, port 27121)
    - Starts 2 shard replica sets (mongo-shard1:27131, mongo-shard2:27141)
    - Starts 1 mongos router (mongo-mongos, port 27120)
    - Initiates all replica sets and adds shards to the cluster
    - Verifies with sh.status()

DURATION: ~60 seconds
"@ -ForegroundColor Cyan
    exit 0
}

# Continue on errors so we can give friendly diagnostics
$ErrorActionPreference = "Continue"

Write-Host "==================================================" -ForegroundColor Blue
Write-Host "MongoDB Mastering Course - Sharded Cluster Setup" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""

function Write-Status  { param([string]$m) Write-Host "[INFO] $m" -ForegroundColor Blue }
function Write-Success { param([string]$m) Write-Host "[SUCCESS] $m" -ForegroundColor Green }
function Write-Warn    { param([string]$m) Write-Host "[WARNING] $m" -ForegroundColor Yellow }
function Write-Err     { param([string]$m) Write-Host "[ERROR] $m" -ForegroundColor Red }

$MongoImage = "mongo:8.0"
$Network    = "mongodb-net"

$CfgName    = "mongo-cfg";       $CfgPort    = 27121
$S1Name     = "mongo-shard1";    $S1Port     = 27131
$S2Name     = "mongo-shard2";    $S2Port     = 27141
$MongosName = "mongo-mongos";    $MongosPort = 27120

# Check Docker
Write-Status "Checking Docker status..."
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Err "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}
Write-Success "Docker is running"

# Idempotent cleanup of prior sharding containers (do NOT touch mongo1/2/3)
Write-Status "Cleaning up any prior sharded-cluster containers..."
foreach ($c in @($CfgName, $S1Name, $S2Name, $MongosName)) {
    docker rm -f $c *> $null
}
Write-Success "Pre-cleanup completed"

# Ensure network exists
Write-Status "Ensuring Docker network '$Network' exists..."
docker network inspect $Network *> $null
if ($LASTEXITCODE -ne 0) {
    docker network create $Network *> $null
    Write-Success "Network '$Network' created"
} else {
    Write-Success "Network '$Network' already exists"
}

# Helper: wait for mongo to be ready
function Wait-ForMongo {
    param([string]$Container, [string]$Label, [int]$MaxAttempts = 30)
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        $out = docker exec $Container mongosh --quiet --port 27017 --eval "db.adminCommand({ping:1}).ok" 2>$null
        if ($out -match "1") { return $true }
        Start-Sleep -Seconds 2
    }
    Write-Err "$Label did not become ready in time"
    return $false
}

# Start config server
Write-Status "Starting config server ($CfgName) on port $CfgPort..."
docker run -d `
    --name $CfgName `
    --network $Network `
    --restart unless-stopped `
    -p "${CfgPort}:27017" `
    $MongoImage `
    --configsvr --replSet cfgrs --port 27017 --bind_ip_all *> $null

if (-not (Wait-ForMongo -Container $CfgName -Label "Config server")) { exit 1 }
Write-Success "Config server is up"

Write-Status "Initiating cfgrs replica set..."
$cfgInit = @"
try {
  rs.status();
  print('cfgrs already initiated');
} catch (e) {
  rs.initiate({
    _id: 'cfgrs',
    configsvr: true,
    members: [ { _id: 0, host: 'mongo-cfg:27017' } ]
  });
}
"@
docker exec $CfgName mongosh --quiet --port 27017 --eval $cfgInit *> $null
Write-Success "cfgrs replica set initiated"

# Start shard1
Write-Status "Starting shard1 ($S1Name) on port $S1Port..."
docker run -d `
    --name $S1Name `
    --network $Network `
    --restart unless-stopped `
    -p "${S1Port}:27017" `
    $MongoImage `
    --shardsvr --replSet shard1rs --port 27017 --bind_ip_all *> $null

if (-not (Wait-ForMongo -Container $S1Name -Label "Shard 1")) { exit 1 }
Write-Success "Shard 1 is up"

Write-Status "Initiating shard1rs replica set..."
$s1Init = @"
try {
  rs.status();
  print('shard1rs already initiated');
} catch (e) {
  rs.initiate({
    _id: 'shard1rs',
    members: [ { _id: 0, host: 'mongo-shard1:27017' } ]
  });
}
"@
docker exec $S1Name mongosh --quiet --port 27017 --eval $s1Init *> $null
Write-Success "shard1rs replica set initiated"

# Start shard2
Write-Status "Starting shard2 ($S2Name) on port $S2Port..."
docker run -d `
    --name $S2Name `
    --network $Network `
    --restart unless-stopped `
    -p "${S2Port}:27017" `
    $MongoImage `
    --shardsvr --replSet shard2rs --port 27017 --bind_ip_all *> $null

if (-not (Wait-ForMongo -Container $S2Name -Label "Shard 2")) { exit 1 }
Write-Success "Shard 2 is up"

Write-Status "Initiating shard2rs replica set..."
$s2Init = @"
try {
  rs.status();
  print('shard2rs already initiated');
} catch (e) {
  rs.initiate({
    _id: 'shard2rs',
    members: [ { _id: 0, host: 'mongo-shard2:27017' } ]
  });
}
"@
docker exec $S2Name mongosh --quiet --port 27017 --eval $s2Init *> $null
Write-Success "shard2rs replica set initiated"

Write-Status "Waiting for replica sets to elect primaries (15 seconds)..."
Start-Sleep -Seconds 15

# Start mongos
Write-Status "Starting mongos router ($MongosName) on port $MongosPort..."
docker run -d `
    --name $MongosName `
    --network $Network `
    --restart unless-stopped `
    -p "${MongosPort}:27017" `
    --entrypoint mongos `
    $MongoImage `
    --configdb cfgrs/mongo-cfg:27017 --port 27017 --bind_ip_all *> $null

if (-not (Wait-ForMongo -Container $MongosName -Label "Mongos router")) { exit 1 }
Write-Success "Mongos router is up"

# Add shards
Write-Status "Adding shards to cluster via mongos..."
$addShards = @"
try { sh.addShard('shard1rs/mongo-shard1:27017'); } catch(e) { print('shard1: ' + e.message); }
try { sh.addShard('shard2rs/mongo-shard2:27017'); } catch(e) { print('shard2: ' + e.message); }
"@
docker exec $MongosName mongosh --quiet --port 27017 --eval $addShards
Write-Success "Shards added"

# Verify
Write-Status "Verifying sharded cluster status..."
Write-Host ""
$verify = @"
const shards = db.getSiblingDB('config').shards.find().toArray();
print('  Shards in cluster: ' + shards.length);
shards.forEach(function(s) { print('    - ' + s._id + ' -> ' + s.host); });
"@
docker exec $MongosName mongosh --quiet --port 27017 --eval $verify
Write-Host ""

$shardCount = docker exec $MongosName mongosh --quiet --port 27017 --eval "print(db.getSiblingDB('config').shards.countDocuments({}))" 2>$null
$shardCount = ($shardCount | Select-Object -Last 1).ToString().Trim()

if ($shardCount -eq "2") {
    Write-Success "Cluster verification passed (2 shards present)"
} else {
    Write-Warn "Expected 2 shards, found: $shardCount"
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
Write-Success "MongoDB Sharded Cluster Setup Complete!"
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Sharded cluster topology:" -ForegroundColor Cyan
Write-Host "  - Config server : localhost:$CfgPort  (replica set cfgrs)"
Write-Host "  - Shard 1       : localhost:$S1Port  (replica set shard1rs)"
Write-Host "  - Shard 2       : localhost:$S2Port  (replica set shard2rs)"
Write-Host "  - Mongos router : localhost:$MongosPort  <-- connect here" -ForegroundColor Green
Write-Host ""
Write-Host "Connect from host:" -ForegroundColor Yellow
Write-Host "  mongosh --port $MongosPort"
Write-Host "  mongosh `"mongodb://localhost:$MongosPort/?directConnection=true`""
Write-Host ""
Write-Host "Useful commands inside mongosh:" -ForegroundColor Yellow
Write-Host "  sh.status()"
Write-Host "  sh.enableSharding(`"<db>`")"
Write-Host "  sh.shardCollection(`"<db>.<coll>`", { <key>: 1 })"
Write-Host ""
Write-Host "When done:" -ForegroundColor Yellow
Write-Host "  .\teardown_sharding.ps1   # remove sharded cluster only"
Write-Host "  .\teardown.ps1            # remove EVERYTHING (replica set + sharding)"
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
