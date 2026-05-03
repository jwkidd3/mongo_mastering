#!/bin/bash

# MongoDB Mastering Course — reset course data to a clean state
#
# Drops every database the labs create and re-loads
# data/comprehensive_data_loader.js from scratch. Use this when:
#   - your data state has drifted from the lab's assumptions
#   - you fell behind in class and want a clean entry point for a later lab
#   - you re-ran a lab's mutation steps and want the original baseline back
#
# Requires: Docker running, scripts/setup.sh already executed (mongo1 alive).
# Usage:    bash scripts/reset_data.sh

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "${SCRIPT_DIR}/.." && pwd )"
DATA_LOADER="${REPO_ROOT}/data/comprehensive_data_loader.js"

if ! docker ps --format '{{.Names}}' | grep -qx 'mongo1'; then
    print_error "mongo1 container not running. Run scripts/setup.sh first."
    exit 1
fi

if [ ! -f "$DATA_LOADER" ]; then
    print_error "Data loader not found at $DATA_LOADER"
    exit 1
fi

print_status "Dropping insurance_company + lab-test databases..."
docker exec mongo1 mongosh --quiet --eval '
const dbs = db.adminCommand({ listDatabases: 1 }).databases.map(d => d.name);
const targets = dbs.filter(name =>
    name === "insurance_company" ||
    name === "test_setup"        ||
    name.startsWith("insurance_company_") ||
    name.startsWith("lab")        ||
    name === "test"
);
targets.forEach(name => {
    print("  dropping " + name);
    db.getSiblingDB(name).dropDatabase();
});
print("  dropped " + targets.length + " database(s)");
' || { print_error "Database drop failed"; exit 1; }

print_status "Staging data/ into mongo1 and re-loading..."
docker cp "$REPO_ROOT/data" mongo1:/tmp/data
docker exec -w /tmp mongo1 mongosh \
    "mongodb://localhost:27017/?directConnection=true&replicaSet=rs0" \
    --quiet --file /tmp/data/comprehensive_data_loader.js

print_success "Course data reset complete. You can resume from any lab now."
