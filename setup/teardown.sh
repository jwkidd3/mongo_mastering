#!/bin/bash

# MongoDB Mastering Course - Automated Teardown Script
# Removes all MongoDB containers and networks
# Compatible with macOS, Linux, and Windows WSL

set -e  # Exit on any error

# Help function
show_help() {
    cat << EOF
MongoDB Mastering Course - Automated Teardown

USAGE:
    ./teardown.sh

WHAT IT DOES:
    - Force removes all MongoDB containers
    - Removes networks
    - Verifies clean environment

DURATION: ~10 seconds

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
echo "MongoDB Mastering Course - Automated Teardown"
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

# Check if containers exist
print_status "Checking for MongoDB containers..."
containers=$(docker ps -a --filter "name=mongo" --format "{{.Names}}" | grep -E "^mongo[123]$" || true)

if [ -z "$containers" ]; then
    print_warning "No MongoDB containers found"
else
    echo "  Found containers: $containers"
fi

# Force remove containers (stops and removes in one step)
if [ ! -z "$containers" ]; then
    print_status "Force removing MongoDB containers..."
    for container in $containers; do
        print_status "  Force removing $container..."
        docker rm -f $container > /dev/null 2>&1 || true
    done
    print_success "Containers removed"
fi

# Remove network
print_status "Removing MongoDB network..."
if docker network ls | grep -q mongodb-net; then
    docker network rm mongodb-net > /dev/null 2>&1 || true
    print_success "Network 'mongodb-net' removed"
else
    print_warning "Network 'mongodb-net' not found"
fi

# Verify cleanup
print_status "Verifying cleanup..."
remaining_containers=$(docker ps -a --filter "name=mongo" --format "{{.Names}}" | grep -E "^mongo[123]$" || true)
remaining_networks=$(docker network ls --filter "name=mongodb-net" --format "{{.Name}}" || true)

if [ -z "$remaining_containers" ] && [ -z "$remaining_networks" ]; then
    print_success "All MongoDB resources cleaned up"
else
    if [ ! -z "$remaining_containers" ]; then
        print_warning "Some containers may still exist: $remaining_containers"
    fi
    if [ ! -z "$remaining_networks" ]; then
        print_warning "Some networks may still exist: $remaining_networks"
    fi
fi

echo ""
echo "=================================================="
print_success "MongoDB Teardown Complete!"
echo "=================================================="
echo ""
echo "All MongoDB containers and networks have been removed."
echo ""
echo "To set up again:"
echo "  ./setup.sh"
echo ""
echo "=================================================="