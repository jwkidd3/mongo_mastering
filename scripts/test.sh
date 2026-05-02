#!/bin/bash

# MongoDB Mastering Course - Connection Test Script
# Verifies MongoDB connection and runs basic write/read tests
# Compatible with macOS, Linux, and Windows WSL

set -e  # Exit on any error

# Help function
show_help() {
    cat << EOF
MongoDB Mastering Course - Connection Test

USAGE:
    ./test.sh

WHAT IT DOES:
    - Tests basic mongosh connection to localhost:27017 (directConnection=true)
    - Runs scripts/test_connection.js
    - Reports clear PASS/FAIL

REQUIREMENTS:
    - MongoDB replica set running (run setup.sh first)
    - MongoDB Shell (mongosh) installed

EOF
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Colors for output (consistent with setup.sh)
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

echo "=================================================="
echo "MongoDB Mastering Course - Connection Test"
echo "=================================================="
echo ""

# Resolve script directory so this works from any cwd
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TEST_JS="${SCRIPT_DIR}/test_connection.js"

# Verify mongosh is available
print_status "Checking for mongosh..."
if ! command -v mongosh > /dev/null 2>&1; then
    print_error "mongosh not found in PATH. Please install MongoDB Shell."
    exit 1
fi
print_success "mongosh found"

# Verify the test script exists
if [ ! -f "$TEST_JS" ]; then
    print_error "Cannot find test_connection.js at: $TEST_JS"
    exit 1
fi

# Quick basic connection check before running the JS
print_status "Testing basic connection to localhost:27017..."
if mongosh "mongodb://localhost:27017/?directConnection=true" --quiet --eval "db.hello().ok" > /dev/null 2>&1; then
    print_success "Basic connection succeeded"
else
    print_error "Cannot connect to MongoDB at localhost:27017"
    print_warning "Did you run scripts/setup.sh first?"
    exit 1
fi

# Run the comprehensive test_connection.js
print_status "Running test_connection.js..."
echo ""
if mongosh "mongodb://localhost:27017/?directConnection=true" --quiet < "$TEST_JS"; then
    echo ""
    echo "=================================================="
    print_success "ALL TESTS PASSED"
    echo "=================================================="
    exit 0
else
    echo ""
    echo "=================================================="
    print_error "TESTS FAILED"
    echo "=================================================="
    exit 1
fi
