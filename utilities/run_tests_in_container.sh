#!/bin/bash
# run_tests_in_container.sh
# Run a course test script inside the `course-tools` Docker image so the
# host only needs Docker installed (no WSL, Git Bash, mongosh, dotnet,
# node, or python required on the host).
#
# Usage:
#   utilities/run_tests_in_container.sh                                # default: lab_fence_runner.sh
#   utilities/run_tests_in_container.sh /work/utilities/comprehensive_lab_validator.sh --quick
#   utilities/run_tests_in_container.sh /work/utilities/ps_fence_check.sh
#
# The repo is mounted at /work inside the container; pass /work/... paths.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="course-tools:latest"
NETWORK="${COURSE_NETWORK:-mongodb-net}"

# Build image if not present (idempotent).
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "[course-tools] Building $IMAGE (first run only) ..."
    docker build -t "$IMAGE" \
        -f "$PROJECT_ROOT/utilities/Dockerfile.course-tools" \
        "$PROJECT_ROOT/utilities"
fi

# Make sure the docker network exists; if it doesn't, the host hasn't
# run setup yet and the test will fail anyway. Don't create it here --
# setup.sh is responsible for that.
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
    echo "[course-tools] WARNING: docker network '$NETWORK' not found." >&2
    echo "[course-tools]          Run scripts/setup.sh (or setup.ps1) first." >&2
fi

SCRIPT="${1:-/work/utilities/lab_fence_runner.sh}"
shift || true

# Default URIs target containers by name on the shared network.
: "${MONGO_URI:=mongodb://mongo1:27017/?directConnection=true&replicaSet=rs0}"
: "${MONGOS_URI:=mongodb://mongo-mongos:27017/?directConnection=true}"

exec docker run --rm \
    --network "$NETWORK" \
    -v "$PROJECT_ROOT:/work:rw" \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e MONGO_URI="$MONGO_URI" \
    -e MONGOS_URI="$MONGOS_URI" \
    -e CLEAN_RUN=false \
    -e COURSE_TOOLS_IN_CONTAINER=1 \
    -e COURSE_TOOLS_HOST_ROOT="$PROJECT_ROOT" \
    -w /work \
    "$IMAGE" \
    "$SCRIPT" "$@"
