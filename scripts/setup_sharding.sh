#!/bin/bash

# MongoDB Mastering Course - Sharded Cluster Setup Script
# Brings up a minimal sharded cluster (1 config server + 2 shards + 1 mongos)
# alongside the existing 3-node replica set on the same Docker network.
# Compatible with macOS, Linux, and Windows WSL.
#
# Topology:
#   mongo-cfg     -> port 27121  (configsvr, replica set "cfgrs")
#   mongo-shard1  -> port 27131  (shardsvr,  replica set "shard1rs")
#   mongo-shard2  -> port 27141  (shardsvr,  replica set "shard2rs")
#   mongo-mongos  -> port 27120  (mongos router)
#
# Lab 12 connects via:  mongodb://localhost:27120/?directConnection=true

# Note: intentionally NOT using `set -e` — we handle errors explicitly so
# we can give friendly diagnostics and remain idempotent on re-runs.

# Help function
show_help() {
    cat << EOF
MongoDB Mastering Course - Sharded Cluster Setup

USAGE:
    ./setup_sharding.sh

REQUIREMENTS:
    - Docker Desktop installed and running
    - MongoDB Shell (mongosh) installed
    - The main replica set setup may already be running (optional)

WHAT IT DOES:
    - Creates Docker network 'mongodb-net' if missing
    - Starts 1 config server (mongo-cfg, port 27121)
    - Starts 2 shard replica sets (mongo-shard1:27131, mongo-shard2:27141)
    - Starts 1 mongos router (mongo-mongos, port 27120)
    - Initiates all replica sets and adds shards to the cluster
    - Verifies with sh.status()

DURATION: ~60 seconds

PLATFORM SUPPORT:
    - macOS
    - Linux
    - Windows WSL

EOF
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

echo "=================================================="
echo "MongoDB Mastering Course - Sharded Cluster Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

MONGO_IMAGE="mongo:8.0"
NETWORK="mongodb-net"

# Container/port plan
CFG_NAME="mongo-cfg";       CFG_PORT=27121
S1_NAME="mongo-shard1";     S1_PORT=27131
S2_NAME="mongo-shard2";     S2_PORT=27141
MONGOS_NAME="mongo-mongos"; MONGOS_PORT=27120

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi
print_success "Docker is running"

# Idempotent cleanup of any prior sharding containers (do NOT touch mongo1/2/3)
print_status "Cleaning up any prior sharded-cluster containers..."
docker rm -f "$CFG_NAME" "$S1_NAME" "$S2_NAME" "$MONGOS_NAME" > /dev/null 2>&1 || true
print_success "Pre-cleanup completed"

# Step 1: Ensure Docker network exists
print_status "Ensuring Docker network '$NETWORK' exists..."
if docker network inspect "$NETWORK" > /dev/null 2>&1; then
    print_success "Network '$NETWORK' already exists"
else
    docker network create "$NETWORK" > /dev/null
    print_success "Network '$NETWORK' created"
fi

# Helper: wait for a mongod/mongos container to respond to ping
wait_for_mongo() {
    local container="$1"
    local label="$2"
    local max_attempts=30
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker exec "$container" mongosh --quiet --port 27017 --eval "db.adminCommand({ping:1}).ok" 2>/dev/null | grep -q "1"; then
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    print_error "$label did not become ready in time"
    return 1
}

# Step 2: Start config server
print_status "Starting config server ($CFG_NAME) on port $CFG_PORT..."
docker run -d \
    --name "$CFG_NAME" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -p ${CFG_PORT}:27017 \
    "$MONGO_IMAGE" \
    --configsvr --replSet cfgrs --port 27017 --bind_ip_all > /dev/null

wait_for_mongo "$CFG_NAME" "Config server" || exit 1
print_success "Config server is up"

print_status "Initiating cfgrs replica set..."
docker exec "$CFG_NAME" mongosh --quiet --port 27017 --eval "
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
" > /dev/null
print_success "cfgrs replica set initiated"

# Step 3: Start shard1
print_status "Starting shard1 ($S1_NAME) on port $S1_PORT..."
docker run -d \
    --name "$S1_NAME" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -p ${S1_PORT}:27017 \
    "$MONGO_IMAGE" \
    --shardsvr --replSet shard1rs --port 27017 --bind_ip_all > /dev/null

wait_for_mongo "$S1_NAME" "Shard 1" || exit 1
print_success "Shard 1 is up"

print_status "Initiating shard1rs replica set..."
docker exec "$S1_NAME" mongosh --quiet --port 27017 --eval "
try {
  rs.status();
  print('shard1rs already initiated');
} catch (e) {
  rs.initiate({
    _id: 'shard1rs',
    members: [ { _id: 0, host: 'mongo-shard1:27017' } ]
  });
}
" > /dev/null
print_success "shard1rs replica set initiated"

# Step 4: Start shard2
print_status "Starting shard2 ($S2_NAME) on port $S2_PORT..."
docker run -d \
    --name "$S2_NAME" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -p ${S2_PORT}:27017 \
    "$MONGO_IMAGE" \
    --shardsvr --replSet shard2rs --port 27017 --bind_ip_all > /dev/null

wait_for_mongo "$S2_NAME" "Shard 2" || exit 1
print_success "Shard 2 is up"

print_status "Initiating shard2rs replica set..."
docker exec "$S2_NAME" mongosh --quiet --port 27017 --eval "
try {
  rs.status();
  print('shard2rs already initiated');
} catch (e) {
  rs.initiate({
    _id: 'shard2rs',
    members: [ { _id: 0, host: 'mongo-shard2:27017' } ]
  });
}
" > /dev/null
print_success "shard2rs replica set initiated"

# Allow replica sets to elect primaries
print_status "Waiting for replica sets to elect primaries (15 seconds)..."
sleep 15

# Step 5: Start mongos
print_status "Starting mongos router ($MONGOS_NAME) on port $MONGOS_PORT..."
docker run -d \
    --name "$MONGOS_NAME" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -p ${MONGOS_PORT}:27017 \
    --entrypoint mongos \
    "$MONGO_IMAGE" \
    --configdb cfgrs/mongo-cfg:27017 --port 27017 --bind_ip_all > /dev/null

wait_for_mongo "$MONGOS_NAME" "Mongos router" || exit 1
print_success "Mongos router is up"

# Step 6: Add shards via mongos
print_status "Adding shards to cluster via mongos..."
add_shards_output=$(docker exec "$MONGOS_NAME" mongosh --quiet --port 27017 --eval "
try { sh.addShard('shard1rs/mongo-shard1:27017'); } catch(e) { print('shard1: ' + e.message); }
try { sh.addShard('shard2rs/mongo-shard2:27017'); } catch(e) { print('shard2: ' + e.message); }
" 2>&1)
echo "$add_shards_output" | sed 's/^/  /'
print_success "Shards added"

# Step 7: Verify
print_status "Verifying sharded cluster status..."
echo ""
docker exec "$MONGOS_NAME" mongosh --quiet --port 27017 --eval "
const status = sh.status();
const shards = db.getSiblingDB('config').shards.find().toArray();
print('  Shards in cluster: ' + shards.length);
shards.forEach(function(s) { print('    - ' + s._id + ' -> ' + s.host); });
"
echo ""

shard_count=$(docker exec "$MONGOS_NAME" mongosh --quiet --port 27017 --eval "print(db.getSiblingDB('config').shards.countDocuments({}))" 2>/dev/null | tail -n 1 | tr -d '[:space:]')

if [ "$shard_count" = "2" ]; then
    print_success "Cluster verification passed (2 shards present)"
else
    print_warning "Expected 2 shards, found: $shard_count"
fi

echo ""
echo "=================================================="
print_success "MongoDB Sharded Cluster Setup Complete!"
echo "=================================================="
echo ""
echo "Sharded cluster topology:"
echo "  - Config server : localhost:${CFG_PORT}  (replica set cfgrs)"
echo "  - Shard 1       : localhost:${S1_PORT}  (replica set shard1rs)"
echo "  - Shard 2       : localhost:${S2_PORT}  (replica set shard2rs)"
echo "  - Mongos router : localhost:${MONGOS_PORT}  <-- connect here"
echo ""
echo "Connect from host:"
echo "  mongosh --port ${MONGOS_PORT}"
echo "  mongosh \"mongodb://localhost:${MONGOS_PORT}/?directConnection=true\""
echo ""
echo "Useful commands inside mongosh:"
echo "  sh.status()"
echo "  sh.enableSharding(\"<db>\")"
echo "  sh.shardCollection(\"<db>.<coll>\", { <key>: 1 })"
echo ""
echo "When done:"
echo "  ./teardown_sharding.sh        # remove sharded cluster only"
echo "  ./teardown.sh                 # remove EVERYTHING (replica set + sharding)"
echo ""
echo "=================================================="
