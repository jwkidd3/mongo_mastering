#!/bin/bash

# MongoDB Mastering Course - Comprehensive End-to-End Test
# Runs the complete flow: teardown -> setup -> data load -> validate -> teardown
# Compatible with macOS, Linux, and Windows WSL

# Help function
show_help() {
    cat << EOF
MongoDB Mastering Course - Comprehensive End-to-End Test

USAGE:
    ./comprehensive_test.sh

WHAT IT DOES:
    1. Tears down any existing environment (errors ignored)
    2. Runs setup.sh to provision a fresh 3-node replica set
    3. Loads data/comprehensive_data_loader.js
    4. Runs utilities/comprehensive_lab_validator.sh non-interactively (--quick)
    5. Tears down the environment
    6. Reports overall PASS/FAIL

DURATION: ~3-5 minutes
EOF
}

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

# Resolve directories so this works from any cwd
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "${SCRIPT_DIR}/.." && pwd )"
VALIDATOR="${REPO_ROOT}/utilities/comprehensive_lab_validator.sh"
DATA_LOADER="${REPO_ROOT}/data/comprehensive_data_loader.js"

OVERALL_PASS=true

echo "=================================================="
echo "MongoDB Mastering Course - Comprehensive Test"
echo "=================================================="
echo ""

# Step 1: Initial teardown (ignore errors)
print_status "Step 1/5: Initial teardown (errors ignored)..."
if "${SCRIPT_DIR}/teardown.sh" > /dev/null 2>&1; then
    print_success "Initial teardown completed"
else
    print_warning "Initial teardown reported issues (continuing anyway)"
fi
echo ""

# Step 2: Setup
print_status "Step 2/5: Running setup.sh..."
if "${SCRIPT_DIR}/setup.sh"; then
    print_success "Setup completed"
else
    print_error "Setup failed; aborting comprehensive test"
    exit 1
fi
echo ""

# Step 3: Load comprehensive data
print_status "Step 3/5: Loading comprehensive data loader..."
if [ ! -f "$DATA_LOADER" ]; then
    print_error "Cannot find data loader at: $DATA_LOADER"
    OVERALL_PASS=false
else
    # Must run from repo root because the loader uses relative paths
    if ( cd "$REPO_ROOT" && mongosh "mongodb://localhost:27017/?directConnection=true" --quiet < "$DATA_LOADER" ); then
        print_success "Data loaded"
    else
        print_error "Data load failed"
        OVERALL_PASS=false
    fi
fi
echo ""

# Step 4: Run lab validator non-interactively
print_status "Step 4/5: Running comprehensive lab validator (--quick)..."
if [ ! -x "$VALIDATOR" ]; then
    print_error "Validator not found or not executable at: $VALIDATOR"
    OVERALL_PASS=false
else
    if "$VALIDATOR" --quick; then
        print_success "Lab validation completed"
    else
        print_error "Lab validation reported failures"
        OVERALL_PASS=false
    fi
fi
echo ""

# Step 5: Final teardown
print_status "Step 5/5: Final teardown..."
if "${SCRIPT_DIR}/teardown.sh" > /dev/null 2>&1; then
    print_success "Teardown completed"
else
    print_warning "Teardown reported issues"
fi
echo ""

# Final report
echo "=================================================="
if [ "$OVERALL_PASS" = true ]; then
    print_success "COMPREHENSIVE TEST: PASS"
    echo "=================================================="
    exit 0
else
    print_error "COMPREHENSIVE TEST: FAIL"
    echo "=================================================="
    exit 1
fi
