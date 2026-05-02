#!/bin/bash

# MongoDB Mastering Course - Sharded Cluster Teardown Script
# Best-effort teardown of the sharded cluster containers.
# Does NOT remove the 'mongodb-net' network (the main replica set may
# still be using it).
# Compatible with macOS, Linux, and Windows WSL.

# Note: intentionally NOT using `set -e` — teardown is best-effort.

show_help() {
    cat << EOF
MongoDB Mastering Course - Sharded Cluster Teardown

USAGE:
    ./teardown_sharding.sh

WHAT IT DOES:
    - Force removes mongo-cfg, mongo-shard1, mongo-shard2, mongo-mongos
    - Leaves mongo1/mongo2/mongo3 (replica set) untouched
    - Leaves the 'mongodb-net' network in place

DURATION: ~5 seconds

EOF
}

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

echo "=================================================="
echo "MongoDB Mastering Course - Sharded Cluster Teardown"
echo "=================================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

SHARDING_CONTAINERS=(mongo-mongos mongo-shard1 mongo-shard2 mongo-cfg)

print_status "Checking for sharded-cluster containers..."
found_any=false
for c in "${SHARDING_CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
        found_any=true
        echo "  Found: $c"
    fi
done

if [ "$found_any" = false ]; then
    print_warning "No sharded-cluster containers found"
else
    print_status "Force removing sharded-cluster containers..."
    for c in "${SHARDING_CONTAINERS[@]}"; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
            print_status "  Force removing $c..."
            docker rm -f "$c" > /dev/null 2>&1 || true
        fi
    done
    print_success "Sharded-cluster containers removed"
fi

# Verify
print_status "Verifying cleanup..."
remaining=""
for c in "${SHARDING_CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
        remaining="$remaining $c"
    fi
done

if [ -z "$remaining" ]; then
    print_success "All sharded-cluster containers cleaned up"
else
    print_warning "Some containers may still exist:$remaining"
fi

echo ""
print_status "Network 'mongodb-net' was preserved (main replica set may still need it)"
echo ""
echo "=================================================="
print_success "Sharded Cluster Teardown Complete!"
echo "=================================================="
echo ""
echo "To set the sharded cluster up again:"
echo "  ./setup_sharding.sh"
echo ""
echo "To remove EVERYTHING (replica set + sharding + network):"
echo "  ./teardown.sh"
echo ""
echo "=================================================="
