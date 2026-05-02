#!/bin/bash

# MongoDB Mastering Course - Comprehensive End-to-End Test
# Runs the complete validation flow:
#   teardown -> setup (rs + sharded) -> load data -> all test suites -> teardown
#
# Test suites executed (all run inside the `course-tools` Docker image so
# macOS/Linux users get the SAME test environment as Windows users):
#   1. comprehensive_lab_validator.sh  (133 curated tests + 3 driver integrations)
#   2. lab_fence_runner.sh             (176 per-fence tests across all 16 labs)
#   3. ps_fence_check.sh               (38 PowerShell fence parse-checks via Docker)
#
# Requirements: Docker only. (Host doesn't need mongosh / dotnet / node / python.)

show_help() {
    cat << EOF
MongoDB Mastering Course - Comprehensive End-to-End Test

USAGE:
    ./comprehensive_test.sh [--skip-pwsh]

OPTIONS:
    --skip-pwsh   Skip the PowerShell fence check (avoids pulling pwsh Docker image)

WHAT IT DOES:
    1. Tears down any existing environment (errors ignored)
    2. Runs setup.sh         (3-node replica set)
    3. Runs setup_sharding.sh (config server, 2 shards, mongos)
    4. Loads data/comprehensive_data_loader.js
    5. Runs three validation suites in sequence:
       a. utilities/comprehensive_lab_validator.sh --quick
       b. utilities/lab_fence_runner.sh
       c. utilities/ps_fence_check.sh
    6. Tears down both environments
    7. Reports overall PASS/FAIL with per-suite breakdown

DURATION: ~5-8 minutes (first run pulls pwsh image; subsequent runs faster)
EOF
}

SKIP_PWSH=false
for arg in "$@"; do
    case "$arg" in
        -h|--help) show_help; exit 0 ;;
        --skip-pwsh) SKIP_PWSH=true ;;
    esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "${SCRIPT_DIR}/.." && pwd )"
DOCKERFILE="${REPO_ROOT}/utilities/Dockerfile.course-tools"
DATA_LOADER="${REPO_ROOT}/data/comprehensive_data_loader.js"
SETUP_SH="${SCRIPT_DIR}/setup.sh"
TEARDOWN_SH="${SCRIPT_DIR}/teardown.sh"
SETUP_SHARDING_SH="${SCRIPT_DIR}/setup_sharding.sh"
TEARDOWN_SHARDING_SH="${SCRIPT_DIR}/teardown_sharding.sh"

IMAGE="course-tools:latest"
NETWORK="mongodb-net"
RS_URI="mongodb://mongo1:27017/?directConnection=true&replicaSet=rs0"
SH_URI="mongodb://mongo-mongos:27017/?directConnection=true"

OVERALL_PASS=true
SUITE_RESULTS=()

# Build the course-tools image up-front if missing.
ensure_course_tools_image() {
    if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
        print_status "Building $IMAGE (first run only)..."
        docker build -t "$IMAGE" -f "$DOCKERFILE" "${REPO_ROOT}/utilities" || return 1
    fi
}

# Run a script inside the course-tools image with all standard mounts.
run_in_course_tools() {
    local script="$1"; shift
    docker run --rm \
        --network "$NETWORK" \
        -v "$REPO_ROOT:/work:rw" \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -e MONGO_URI="$RS_URI" \
        -e MONGOS_URI="$SH_URI" \
        -e CLEAN_RUN=false \
        -e COURSE_TOOLS_IN_CONTAINER=1 \
        -e COURSE_TOOLS_HOST_ROOT="$REPO_ROOT" \
        -w /work \
        "$IMAGE" \
        "$script" "$@"
}

record_suite() {
    SUITE_RESULTS+=("$1")
}

echo "=================================================="
echo "MongoDB Mastering Course - Comprehensive Test"
echo "=================================================="
echo ""

# Step 1: Initial teardown (ignore errors)
print_status "Step 1/8: Initial teardown of replica set + sharded cluster..."
"$TEARDOWN_SHARDING_SH" > /dev/null 2>&1 || true
"$TEARDOWN_SH" > /dev/null 2>&1 || true
print_success "Teardown completed"
echo ""

# Step 2: Replica set setup
print_status "Step 2/8: Running setup.sh (3-node replica set)..."
if "$SETUP_SH"; then
    print_success "Replica set setup completed"
else
    print_error "Replica set setup failed; aborting"
    exit 1
fi
echo ""

# Step 3: Sharded cluster setup
print_status "Step 3/8: Running setup_sharding.sh (config + shards + mongos)..."
if "$SETUP_SHARDING_SH"; then
    print_success "Sharded cluster setup completed"
else
    print_error "Sharded cluster setup failed; aborting"
    "$TEARDOWN_SH" > /dev/null 2>&1 || true
    exit 1
fi
echo ""

# Build / refresh the course-tools image now that docker is confirmed working.
ensure_course_tools_image || { print_error "Failed to build course-tools image"; exit 1; }

# Step 4: Load comprehensive data via course-tools image.
print_status "Step 4/8: Loading comprehensive data loader (via course-tools)..."
if [ ! -f "$DATA_LOADER" ]; then
    print_error "Cannot find data loader at: $DATA_LOADER"
    OVERALL_PASS=false
    record_suite "Data load: SKIPPED (missing)"
else
    if run_in_course_tools /bin/bash -c "mongosh \"$RS_URI\" --quiet < /work/data/comprehensive_data_loader.js > /dev/null"; then
        print_success "Data loaded"
        record_suite "Data load: PASS"
    else
        print_error "Data load failed"
        OVERALL_PASS=false
        record_suite "Data load: FAIL"
    fi
fi
echo ""

# Step 5: Comprehensive lab validator (curated) -- inside course-tools.
print_status "Step 5/8: Suite 1/3 — comprehensive_lab_validator.sh (curated tests)..."
if run_in_course_tools /work/utilities/comprehensive_lab_validator.sh --quick; then
    print_success "Curated validator passed"
    record_suite "Curated validator: PASS"
else
    print_error "Curated validator reported failures"
    OVERALL_PASS=false
    record_suite "Curated validator: FAIL"
fi
echo ""

# Step 6: Per-fence runner -- inside course-tools.
print_status "Step 6/8: Suite 2/3 — lab_fence_runner.sh (per-fence)..."
if run_in_course_tools /work/utilities/lab_fence_runner.sh; then
    print_success "Per-fence runner passed"
    record_suite "Per-fence runner: PASS"
else
    print_error "Per-fence runner reported failures"
    OVERALL_PASS=false
    record_suite "Per-fence runner: FAIL"
fi
echo ""

# Step 7: PowerShell fence check -- inside course-tools.
if [ "$SKIP_PWSH" = true ]; then
    print_status "Step 7/8: Suite 3/3 — ps_fence_check.sh — SKIPPED (--skip-pwsh)"
    record_suite "PowerShell fence check: SKIPPED (--skip-pwsh)"
else
    print_status "Step 7/8: Suite 3/3 — ps_fence_check.sh (PowerShell parse-check via Docker)..."
    if run_in_course_tools /work/utilities/ps_fence_check.sh; then
        print_success "PowerShell fence check passed"
        record_suite "PowerShell fence check: PASS"
    else
        print_error "PowerShell fence check reported failures"
        OVERALL_PASS=false
        record_suite "PowerShell fence check: FAIL"
    fi
fi
echo ""

# Step 8: Final teardown of both environments
print_status "Step 8/8: Final teardown of both environments..."
"$TEARDOWN_SHARDING_SH" > /dev/null 2>&1 || true
"$TEARDOWN_SH" > /dev/null 2>&1 || true
print_success "Teardown completed"
echo ""

# Final report
echo "=================================================="
echo "SUITE RESULTS"
echo "=================================================="
for r in "${SUITE_RESULTS[@]}"; do
    echo "  $r"
done
echo ""
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
