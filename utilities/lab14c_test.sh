#!/bin/bash

# Lab 14C Test - Python / pymongo smoke
#
# What this verifies (passes for the SHIPPED starter):
#   1. labs/lab14/lab14c-python-starter/ requirements install in a venv
#   2. The starter's main.py byte-compiles without SyntaxError
#   3. A canonical CRUD + aggregation flow against the cluster succeeds
#      end-to-end (synthetic test driver -- catches regressions in
#      pymongo, the python runtime, and the cluster)
#
# What this does NOT verify: the student's COMPLETED lab. The starter's
# services/policy_service.py ships with TODO stubs by design.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONN="${MONGO_URI:-mongodb://localhost:27017/?directConnection=true}"
TEST_DB="insurance_company_py_test"
TEST_POLICY="POL-PY-TEST-001"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "========================================================================"
echo "Lab 14C Test: Python pymongo Integration"
echo "========================================================================"

TMPDIR_BASE="${TMPDIR:-/tmp}"
WORK_DIR="$(mktemp -d "${TMPDIR_BASE%/}/lab14c_test.XXXXXX")"

cleanup() {
    mongosh --quiet "$CONN" --eval "
        db.getSiblingDB('${TEST_DB}').policies.deleteMany({ policyNumber: /^POL-PY-TEST-/ });
        db.getSiblingDB('${TEST_DB}').dropDatabase();
    " >/dev/null 2>&1 || true

    if [ -n "${WORK_DIR:-}" ] && [ -d "$WORK_DIR" ]; then
        rm -rf "$WORK_DIR"
    fi
}
trap cleanup EXIT

cd "$WORK_DIR" || exit 2
echo "Working directory: $WORK_DIR"

# ============================================================================
# Phase 1: Install + byte-compile the SHIPPED lab14c-python-starter.
# ============================================================================
STARTER_SRC="$PROJECT_ROOT/labs/lab14/lab14c-python-starter"
STARTER_COPY="$WORK_DIR/starter"
echo ""
echo "[Phase 1] Validating shipped starter ($STARTER_SRC)..."
# Copy without committed __pycache__ noise
cp -r "$STARTER_SRC" "$STARTER_COPY"
find "$STARTER_COPY" -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
echo "Creating venv for starter validation..."
if ! python3 -m venv "$WORK_DIR/starter-venv" >/dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}: could not create starter venv"
    exit 1
fi
STARTER_PY="$WORK_DIR/starter-venv/bin/python"
STARTER_PIP="$WORK_DIR/starter-venv/bin/pip"
"$STARTER_PIP" install --quiet --upgrade pip >/dev/null 2>&1 || true
if ! "$STARTER_PIP" install --quiet -r "$STARTER_COPY/requirements.txt" > "$WORK_DIR/starter-install.log" 2>&1; then
    echo -e "${RED}FAIL${NC}: lab14c-python-starter requirements do not install"
    tail -40 "$WORK_DIR/starter-install.log"
    exit 1
fi
echo -e "${GREEN}PASS${NC}: shipped starter requirements install"

if ! "$STARTER_PY" -m compileall -q "$STARTER_COPY" > "$WORK_DIR/starter-compile.log" 2>&1; then
    echo -e "${RED}FAIL${NC}: shipped starter has Python syntax errors"
    cat "$WORK_DIR/starter-compile.log"
    exit 1
fi
echo -e "${GREEN}PASS${NC}: shipped starter byte-compiles"

# ============================================================================
# Phase 2: Synthetic CRUD smoke -- exercises pymongo end-to-end.
# ============================================================================
echo ""
echo "[Phase 2] Driver-stack CRUD smoke test..."
mkdir -p "$WORK_DIR/smoke" && cd "$WORK_DIR/smoke" || exit 2

# Create venv
echo "Creating Python venv..."
if ! python3 -m venv venv >/dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}: python3 -m venv failed"
    exit 1
fi

# Activate-equivalent: use venv's pip and python directly via path. The venv
# lives in the Phase 2 smoke working dir, not the top-level WORK_DIR.
VENV_PY="$WORK_DIR/smoke/venv/bin/python"
VENV_PIP="$WORK_DIR/smoke/venv/bin/pip"

# Install pymongo (quiet)
echo "Installing pymongo..."
if ! "$VENV_PIP" install --quiet --disable-pip-version-check pymongo >/dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}: pip install pymongo failed"
    exit 1
fi

# Write test.py
cat > test.py <<'PY_EOF'
import os
import sys
from datetime import datetime, timezone
from pymongo import MongoClient

URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/?directConnection=true")
DB_NAME = "insurance_company_py_test"
COLL_NAME = "policies"
TEST_POLICY = "POL-PY-TEST-001"

failures = 0

def passed(name):
    print(f"PASS: {name}")

def failed(name, detail):
    global failures
    print(f"FAIL: {name} - {detail}")
    failures += 1

try:
    client = MongoClient(URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    passed("Connect to MongoDB")
except Exception as ex:
    failed("Connect to MongoDB", str(ex))
    sys.exit(1)

db = client[DB_NAME]
coll = db[COLL_NAME]

# Clean leftover
try:
    coll.delete_many({"policyNumber": {"$regex": "^POL-PY-TEST-"}})
except Exception:
    pass

# 1) Insert
try:
    result = coll.insert_one({
        "policyNumber": TEST_POLICY,
        "policyType": "Auto",
        "premium": 1500,
        "customerId": "CUST-PY-001",
        "state": "TX",
        "createdAt": datetime.now(timezone.utc),
    })
    if result.inserted_id:
        passed("Insert policy")
    else:
        failed("Insert policy", "no inserted_id returned")
except Exception as ex:
    failed("Insert policy", str(ex))

# 2) find_one
try:
    doc = coll.find_one({"policyNumber": TEST_POLICY})
    if doc is None:
        failed("Find policy by policyNumber", "no document returned")
    elif doc.get("premium") != 1500:
        failed("Find policy by policyNumber", "premium mismatch")
    else:
        passed("Find policy by policyNumber")
except Exception as ex:
    failed("Find policy by policyNumber", str(ex))

# 3) Update with $set
try:
    result = coll.update_one(
        {"policyNumber": TEST_POLICY},
        {"$set": {"premium": 1750}}
    )
    if result.modified_count != 1:
        failed("Update premium with $set", f"modified_count={result.modified_count}")
    else:
        doc = coll.find_one({"policyNumber": TEST_POLICY})
        if not doc or doc.get("premium") != 1750:
            failed("Update premium with $set", "premium not updated")
        else:
            passed("Update premium with $set")
except Exception as ex:
    failed("Update premium with $set", str(ex))

# 4) Aggregation
try:
    pipeline = [
        {"$match": {"policyNumber": {"$regex": "^POL-PY-TEST-"}}},
        {"$group": {"_id": "$policyType", "count": {"$sum": 1}}},
    ]
    results = list(coll.aggregate(pipeline))
    if len(results) >= 1:
        passed("Aggregation group by policyType")
    else:
        failed("Aggregation group by policyType", "no groups returned")
except Exception as ex:
    failed("Aggregation group by policyType", str(ex))

# 5) Delete
try:
    result = coll.delete_one({"policyNumber": TEST_POLICY})
    if result.deleted_count != 1:
        failed("Delete test policy", f"deleted_count={result.deleted_count}")
    else:
        passed("Delete test policy")
except Exception as ex:
    failed("Delete test policy", str(ex))

# 6) Verify deletion
try:
    count = coll.count_documents({"policyNumber": TEST_POLICY})
    if count == 0:
        passed("Verify deletion (count == 0)")
    else:
        failed("Verify deletion (count == 0)", f"count={count}")
except Exception as ex:
    failed("Verify deletion (count == 0)", str(ex))

client.close()
sys.exit(0 if failures == 0 else 1)
PY_EOF

echo "Running Python test..."
RUN_LOG="$WORK_DIR/run.log"
"$VENV_PY" test.py > "$RUN_LOG" 2>&1
RUN_EXIT=$?

grep -E '^(PASS|FAIL):' "$RUN_LOG" | while IFS= read -r line; do
    if [[ "$line" == PASS:* ]]; then
        echo -e "${GREEN}${line}${NC}"
    else
        echo -e "${RED}${line}${NC}"
    fi
done

if [ "$RUN_EXIT" -ne 0 ]; then
    echo -e "${RED}Lab 14C test FAILED${NC}"
    echo "--- run.log tail ---"
    tail -40 "$RUN_LOG"
    exit 1
fi

echo -e "${GREEN}Lab 14C test PASSED${NC}"
exit 0
