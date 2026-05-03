#!/bin/bash

# MongoDB Mastering Course - Comprehensive end-to-end test
#
# Single entry point for course-author validation. Runs from the host CLI;
# does not require host-installed mongosh / dotnet / node / python.
#
# Flow:
#   1. Teardown of any existing replica-set + sharded environment
#   2. scripts/setup.sh           (3-node replica set)
#   3. scripts/setup_sharding.sh  (config + shards + mongos)
#   4. Load data/comprehensive_data_loader.js into the replica set
#   5. utilities/lab_validator.sh --quick  (host-side, uses
#      `docker exec mongo1 mongosh` so no host mongosh is required)
#   6. Lab 14 driver integration tests (C# / Node / Python) -- the ONLY part
#      that uses a container, because dotnet/node/python need an environment
#      and the course-tools image already has all three baked in
#   7. Teardown
#   8. Per-suite PASS/FAIL summary
#
# Requirements: Docker only.

set -e

show_help() {
    cat <<EOF
MongoDB Mastering Course - Comprehensive End-to-End Test

USAGE:
    utilities/comprehensive_test.sh [--skip-lab14]

OPTIONS:
    --skip-lab14   Skip the Lab 14 driver integration tests (avoids building
                   the course-tools image; useful on first runs or when
                   iterating on Labs 1-13 only).

DURATION: ~3-4 minutes without --skip-lab14, ~2 minutes with it.
EOF
}

SKIP_LAB14=false
for arg in "$@"; do
    case "$arg" in
        -h|--help)    show_help; exit 0 ;;
        --skip-lab14) SKIP_LAB14=true ;;
        *) echo "Unknown argument: $arg" >&2; show_help; exit 2 ;;
    esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

UTILITIES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "${UTILITIES_DIR}/.." && pwd )"
SCRIPTS_DIR="${REPO_ROOT}/scripts"
DATA_LOADER="${REPO_ROOT}/data/comprehensive_data_loader.js"
DOCKERFILE="${UTILITIES_DIR}/Dockerfile.course-tools"

NETWORK="mongodb-net"
RS_URI="mongodb://mongo1:27017/?directConnection=true&replicaSet=rs0"
SH_URI="mongodb://mongo-mongos:27017/?directConnection=true"
COURSE_TOOLS_IMAGE="course-tools:latest"

OVERALL_PASS=true
SUITE_RESULTS=()
record_suite() { SUITE_RESULTS+=("$1"); }

# Verify docker is available.
if ! command -v docker >/dev/null 2>&1; then
    print_error "docker not found on PATH. Install Docker Desktop and try again."
    exit 127
fi

# Build the course-tools image only when Lab 14 is in scope.
ensure_course_tools_image() {
    if docker image inspect "$COURSE_TOOLS_IMAGE" >/dev/null 2>&1; then
        return 0
    fi
    print_status "Building $COURSE_TOOLS_IMAGE for Lab 14 driver tests (first run only)..."
    docker build -t "$COURSE_TOOLS_IMAGE" -f "$DOCKERFILE" "$UTILITIES_DIR" || return 1
}

# Run a Lab 14 test script inside course-tools, attached to mongodb-net so it
# can reach mongo1 by name. The repo is bind-mounted at /work.
run_lab14_test() {
    local label="$1" script_relpath="$2"
    print_status "Running ${label} (${script_relpath}) inside ${COURSE_TOOLS_IMAGE}..."
    if docker run --rm \
        --network "$NETWORK" \
        --mount "type=bind,src=${REPO_ROOT},dst=/work" \
        -e MONGO_URI="$RS_URI" \
        -w /work \
        "$COURSE_TOOLS_IMAGE" "/work/${script_relpath}"; then
        print_success "${label} passed"
        record_suite "${label}: PASS"
    else
        print_error "${label} reported failures"
        record_suite "${label}: FAIL"
        OVERALL_PASS=false
    fi
    echo ""
}

echo "=========================================="
echo "MongoDB Mastering Course - Comprehensive Test"
echo "=========================================="
echo ""

# Step 1: Initial teardown (best-effort)
print_status "Step 1/7: Initial teardown..."
"${SCRIPTS_DIR}/teardown_sharding.sh" >/dev/null 2>&1 || true
"${SCRIPTS_DIR}/teardown.sh"          >/dev/null 2>&1 || true
print_success "Teardown completed"
echo ""

# Step 2: Replica set setup
print_status "Step 2/7: Running setup.sh (3-node replica set)..."
if ! "${SCRIPTS_DIR}/setup.sh"; then
    print_error "Replica set setup failed; aborting"
    exit 1
fi
print_success "Replica set setup completed"
echo ""

# Step 3: Sharded cluster setup
print_status "Step 3/7: Running setup_sharding.sh (config + shards + mongos)..."
if ! "${SCRIPTS_DIR}/setup_sharding.sh"; then
    print_error "Sharded cluster setup failed; aborting"
    "${SCRIPTS_DIR}/teardown.sh" >/dev/null 2>&1 || true
    exit 1
fi
print_success "Sharded cluster setup completed"
echo ""

# Step 4: Load comprehensive data via a one-shot mongo:8.0 container with the
# repo bind-mounted at /work. -w /work matters because the data loader does
# load('data/dayN_data_loader.js') with relative paths.
print_status "Step 4/7: Loading comprehensive data loader..."
if [ ! -f "$DATA_LOADER" ]; then
    print_error "Cannot find data loader at: $DATA_LOADER"
    OVERALL_PASS=false
    record_suite "Data load: SKIPPED (missing)"
elif docker run --rm \
        --network "$NETWORK" \
        --mount "type=bind,src=${REPO_ROOT},dst=/work" \
        -w /work \
        mongo:8.0 mongosh "$RS_URI" --quiet --file /work/data/comprehensive_data_loader.js >/dev/null; then
    print_success "Data loaded"
    record_suite "Data load: PASS"
else
    print_error "Data load failed"
    record_suite "Data load: FAIL"
    OVERALL_PASS=false
fi
echo ""

# Step 5: Lab validator (host-side, no container).
print_status "Step 5/7: Running lab_validator.sh (Labs 1-13)..."
if MONGO_URI="$RS_URI" MONGOS_URI="$SH_URI" \
        "${UTILITIES_DIR}/lab_validator.sh" --quick; then
    print_success "Lab validator passed"
    record_suite "Lab validator (1-13): PASS"
else
    print_error "Lab validator reported failures"
    record_suite "Lab validator (1-13): FAIL"
    OVERALL_PASS=false
fi
echo ""

# Step 6: Lab 14 driver integration tests (uses course-tools image).
if [ "$SKIP_LAB14" = "true" ]; then
    print_status "Step 6/7: Lab 14 - SKIPPED (--skip-lab14)"
    record_suite "Lab 14A: SKIPPED"
    record_suite "Lab 14B: SKIPPED"
    record_suite "Lab 14C: SKIPPED"
    echo ""
else
    print_status "Step 6/7: Lab 14 driver integration tests..."
    if ensure_course_tools_image; then
        run_lab14_test "Lab 14A (C#)"     "utilities/lab14a_test.sh"
        run_lab14_test "Lab 14B (Node.js)" "utilities/lab14b_test.sh"
        run_lab14_test "Lab 14C (Python)" "utilities/lab14c_test.sh"
    else
        print_error "Could not build $COURSE_TOOLS_IMAGE; skipping Lab 14"
        record_suite "Lab 14A: FAIL (image build)"
        record_suite "Lab 14B: FAIL (image build)"
        record_suite "Lab 14C: FAIL (image build)"
        OVERALL_PASS=false
    fi
fi

# Step 7: Final teardown
print_status "Step 7/7: Final teardown..."
"${SCRIPTS_DIR}/teardown_sharding.sh" >/dev/null 2>&1 || true
"${SCRIPTS_DIR}/teardown.sh"          >/dev/null 2>&1 || true
print_success "Teardown completed"
echo ""

# Final report
echo "=========================================="
echo "SUITE RESULTS"
echo "=========================================="
for r in "${SUITE_RESULTS[@]}"; do
    echo "  $r"
done
echo ""
echo "=========================================="
if [ "$OVERALL_PASS" = "true" ]; then
    print_success "COMPREHENSIVE TEST: PASS"
    echo "=========================================="
    exit 0
else
    print_error "COMPREHENSIVE TEST: FAIL"
    echo "=========================================="
    exit 1
fi
