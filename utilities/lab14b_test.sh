#!/bin/bash

# Lab 14B Test - Node.js / mongodb driver smoke
#
# What this verifies (passes for the SHIPPED starter):
#   1. labs/lab14/lab14b-javascript-starter/ installs (`npm install`)
#   2. The starter's app.js parses without syntax errors (`node -c`)
#   3. A canonical CRUD + aggregation flow against the cluster succeeds
#      end-to-end (synthetic test driver -- catches regressions in the
#      mongodb npm package, the node runtime, and the cluster)
#
# What this does NOT verify: the student's COMPLETED lab. The starter's
# services/policyService.js ships with TODO stubs by design.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONN="${MONGO_URI:-mongodb://localhost:27017/?directConnection=true}"
TEST_DB="insurance_company_js_test"
TEST_POLICY="POL-JS-TEST-001"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "========================================================================"
echo "Lab 14B Test: Node.js mongodb driver Integration"
echo "========================================================================"

TMPDIR_BASE="${TMPDIR:-/tmp}"
WORK_DIR="$(mktemp -d "${TMPDIR_BASE%/}/lab14b_test.XXXXXX")"

cleanup() {
    mongosh --quiet "$CONN" --eval "
        db.getSiblingDB('${TEST_DB}').policies.deleteMany({ policyNumber: /^POL-JS-TEST-/ });
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
# Phase 1: Install + syntax-check the SHIPPED lab14b-javascript-starter.
# ============================================================================
STARTER_SRC="$PROJECT_ROOT/labs/lab14/lab14b-javascript-starter"
STARTER_COPY="$WORK_DIR/starter"
echo ""
echo "[Phase 1] Validating shipped starter ($STARTER_SRC)..."
cp -r "$STARTER_SRC" "$STARTER_COPY"
(
    cd "$STARTER_COPY" || exit 2
    if ! npm install --no-audit --no-fund --silent > "$WORK_DIR/starter-install.log" 2>&1; then
        echo -e "${RED}FAIL${NC}: lab14b-javascript-starter dependencies do not install"
        tail -40 "$WORK_DIR/starter-install.log"
        exit 1
    fi
    echo -e "${GREEN}PASS${NC}: shipped starter dependencies install"

    if ! node -c app.js > "$WORK_DIR/starter-syntax.log" 2>&1; then
        echo -e "${RED}FAIL${NC}: shipped starter app.js has syntax errors"
        cat "$WORK_DIR/starter-syntax.log"
        exit 1
    fi
    echo -e "${GREEN}PASS${NC}: shipped starter app.js parses"
) || exit 1

# ============================================================================
# Phase 2: Synthetic CRUD smoke -- exercises the mongodb driver end-to-end.
# ============================================================================
echo ""
echo "[Phase 2] Driver-stack CRUD smoke test..."
mkdir -p "$WORK_DIR/smoke" && cd "$WORK_DIR/smoke" || exit 2

# npm init -y (silent)
if ! npm init -y >/dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}: npm init failed"
    exit 1
fi

# Install mongodb (silent)
echo "Installing mongodb npm package..."
if ! npm install mongodb --no-audit --no-fund --silent >/dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}: npm install mongodb failed"
    exit 1
fi

# Write test.js
cat > test.js <<'JS_EOF'
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/?directConnection=true';
const dbName = 'insurance_company_js_test';
const collName = 'policies';
const TEST_POLICY = 'POL-JS-TEST-001';

let failures = 0;
function pass(name) { console.log('PASS: ' + name); }
function fail(name, detail) { console.log('FAIL: ' + name + ' - ' + detail); failures++; }

(async () => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        pass('Connect to MongoDB');
    } catch (err) {
        fail('Connect to MongoDB', err.message);
        process.exit(1);
    }

    const db = client.db(dbName);
    const coll = db.collection(collName);

    // Clean any leftover test data
    try {
        await coll.deleteMany({ policyNumber: /^POL-JS-TEST-/ });
    } catch (_) { /* ignore */ }

    // 1) Insert
    try {
        const result = await coll.insertOne({
            policyNumber: TEST_POLICY,
            policyType: 'Auto',
            premium: 1500,
            customerId: 'CUST-JS-001',
            state: 'NY',
            createdAt: new Date()
        });
        if (result.insertedId) pass('Insert policy');
        else fail('Insert policy', 'no insertedId returned');
    } catch (err) {
        fail('Insert policy', err.message);
    }

    // 2) Read it back
    try {
        const doc = await coll.findOne({ policyNumber: TEST_POLICY });
        if (!doc) fail('Find policy by policyNumber', 'no document returned');
        else if (doc.premium !== 1500) fail('Find policy by policyNumber', 'premium mismatch');
        else pass('Find policy by policyNumber');
    } catch (err) {
        fail('Find policy by policyNumber', err.message);
    }

    // 3) Update premium with $set
    try {
        const result = await coll.updateOne(
            { policyNumber: TEST_POLICY },
            { $set: { premium: 1750 } }
        );
        if (result.modifiedCount !== 1) fail('Update premium with $set', 'modifiedCount=' + result.modifiedCount);
        else {
            const doc = await coll.findOne({ policyNumber: TEST_POLICY });
            if (!doc || doc.premium !== 1750) fail('Update premium with $set', 'premium not updated');
            else pass('Update premium with $set');
        }
    } catch (err) {
        fail('Update premium with $set', err.message);
    }

    // 4) Aggregation: group by policyType
    try {
        const results = await coll.aggregate([
            { $match: { policyNumber: /^POL-JS-TEST-/ } },
            { $group: { _id: '$policyType', count: { $sum: 1 } } }
        ]).toArray();
        if (results.length >= 1) pass('Aggregation group by policyType');
        else fail('Aggregation group by policyType', 'no groups returned');
    } catch (err) {
        fail('Aggregation group by policyType', err.message);
    }

    // 5) Delete
    try {
        const result = await coll.deleteOne({ policyNumber: TEST_POLICY });
        if (result.deletedCount !== 1) fail('Delete test policy', 'deletedCount=' + result.deletedCount);
        else pass('Delete test policy');
    } catch (err) {
        fail('Delete test policy', err.message);
    }

    // 6) Verify deletion
    try {
        const count = await coll.countDocuments({ policyNumber: TEST_POLICY });
        if (count === 0) pass('Verify deletion (count == 0)');
        else fail('Verify deletion (count == 0)', 'count=' + count);
    } catch (err) {
        fail('Verify deletion (count == 0)', err.message);
    }

    await client.close();
    process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
    console.log('FAIL: unhandled error - ' + err.message);
    process.exit(1);
});
JS_EOF

echo "Running Node.js test..."
RUN_LOG="$WORK_DIR/run.log"
node test.js > "$RUN_LOG" 2>&1
RUN_EXIT=$?

grep -E '^(PASS|FAIL):' "$RUN_LOG" | while IFS= read -r line; do
    if [[ "$line" == PASS:* ]]; then
        echo -e "${GREEN}${line}${NC}"
    else
        echo -e "${RED}${line}${NC}"
    fi
done

if [ "$RUN_EXIT" -ne 0 ]; then
    echo -e "${RED}Lab 14B test FAILED${NC}"
    echo "--- run.log tail ---"
    tail -40 "$RUN_LOG"
    exit 1
fi

echo -e "${GREEN}Lab 14B test PASSED${NC}"
exit 0
