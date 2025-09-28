#!/bin/bash

# MongoDB Mastering Course - Automated Setup Script
# Creates a 3-node replica set for all course days
# Compatible with macOS, Linux, and Windows WSL

set -e  # Exit on any error

# Help function
show_help() {
    cat << EOF
MongoDB Mastering Course - Automated Setup

USAGE:
    ./setup.sh

REQUIREMENTS:
    - Docker Desktop installed and running
    - MongoDB Shell (mongosh) installed

WHAT IT DOES:
    - Creates 3-node MongoDB replica set
    - Configures proper write concerns
    - Tests basic operations
    - Ready for course data loading

DURATION: ~30 seconds

PLATFORM SUPPORT:
    - macOS
    - Linux
    - Windows WSL (Windows Subsystem for Linux)

EOF
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

echo "=================================================="
echo "MongoDB Mastering Course - Automated Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi
print_success "Docker is running"

# Clean up any existing MongoDB containers
print_status "Cleaning up existing MongoDB containers..."
docker rm -f mongo1 mongo2 mongo3 2>/dev/null || true
docker network rm mongodb-net 2>/dev/null || true
print_success "Cleanup completed"

# Step 1: Create Docker network
print_status "Creating Docker network..."
docker network create mongodb-net
print_success "Network 'mongodb-net' created"

# Step 2: Start MongoDB containers
print_status "Starting MongoDB containers..."

print_status "  Starting mongo1 (Primary)..."
docker run -d --name mongo1 --network mongodb-net -p 27017:27017 \
    mongo:8.0 --replSet rs0 --bind_ip_all

print_status "  Starting mongo2 (Secondary)..."
docker run -d --name mongo2 --network mongodb-net -p 27018:27017 \
    mongo:8.0 --replSet rs0 --bind_ip_all

print_status "  Starting mongo3 (Secondary)..."
docker run -d --name mongo3 --network mongodb-net -p 27019:27017 \
    mongo:8.0 --replSet rs0 --bind_ip_all

print_success "All MongoDB containers started"

# Step 3: Wait for containers to be ready
print_status "Waiting for containers to start (15 seconds)..."
sleep 15

# Step 4: Initialize replica set
print_status "Initializing replica set..."
docker exec mongo1 mongosh --quiet --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 2 },
    { _id: 1, host: 'mongo2:27017', priority: 1 },
    { _id: 2, host: 'mongo3:27017', priority: 1 }
  ]
});
"
print_success "Replica set initialized"

# Step 5: Wait for replica set to stabilize
print_status "Waiting for replica set to stabilize (30 seconds)..."
sleep 30

# Step 6: Set write concern from host
print_status "Setting write concern..."
# Wait for primary to be elected and host connection to be available
max_attempts=10
attempt=1
while [ $attempt -le $max_attempts ]; do
    # Check if we can connect and the primary is ready
    if mongosh --quiet --eval "db.hello().isWritablePrimary" > /dev/null 2>&1; then
        break
    fi
    print_status "  Attempt $attempt/$max_attempts - waiting for primary election..."
    sleep 5
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Could not connect to primary after $max_attempts attempts"
    print_status "Checking container status..."
    docker ps --filter name=mongo
    print_status "Checking replica set status from container..."
    docker exec mongo1 mongosh --quiet --eval "rs.status().ok" || true
    exit 1
fi

mongosh --quiet --eval "
// Ensure we're connected to primary and set write concern
db = db.getMongo().getDB('admin');
db.adminCommand({
  setDefaultRWConcern: 1,
  defaultWriteConcern: { w: 'majority', wtimeout: 5000 }
});
"
print_success "Write concern configured"

# Step 7: Verify setup
print_status "Verifying replica set status..."
echo ""
mongosh --quiet --eval "
rs.status().members.forEach(m => print('  ' + m.name + ': ' + m.stateStr));
"
echo ""

# Step 8: Test basic operations
print_status "Testing basic operations..."
mongosh --quiet --eval "
use test_setup;
db.test.insertOne({message: 'Setup test', timestamp: new Date()});
var doc = db.test.findOne();
print('  Test document: ' + doc.message);
db.test.drop();
" > /dev/null

print_success "Basic operations working"

echo ""
echo "=================================================="
print_success "MongoDB Replica Set Setup Complete!"
echo "=================================================="
echo ""
echo "Your MongoDB replica set is ready:"
echo "  • Primary:   localhost:27017"
echo "  • Secondary: localhost:27018"
echo "  • Secondary: localhost:27019"
echo ""
echo "Next steps:"
echo "  1. Load course data: cd ../data && mongosh < day1_data_loader.js"
echo "  2. Test connection: mongosh"
echo "  3. See LOAD_DATA.md for detailed data loading instructions"
echo "  4. When done: ./teardown.sh"
echo ""
echo "=================================================="