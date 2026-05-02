#!/bin/bash

# Lab 14A Test - C# MongoDB Driver Integration
# Verifies that a minimal C# console app using MongoDB.Driver can perform
# the representative CRUD + aggregation operations covered in Lab 14A.

set -u

# Resolve repo paths so cleanup works regardless of cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONN="${MONGO_URI:-mongodb://localhost:27017/?directConnection=true}"
TEST_DB="insurance_company_csharp_test"
TEST_POLICY="POL-CSHARP-TEST-001"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================================================"
echo "Lab 14A Test: C# MongoDB.Driver Integration"
echo "========================================================================"

# Create temp dir
TMPDIR_BASE="${TMPDIR:-/tmp}"
WORK_DIR="$(mktemp -d "${TMPDIR_BASE%/}/lab14a_test.XXXXXX")"

cleanup() {
    # Remove any test data left in the database
    mongosh --quiet "$CONN" --eval "
        db.getSiblingDB('${TEST_DB}').policies.deleteMany({ policyNumber: /^POL-CSHARP-TEST-/ });
        db.getSiblingDB('${TEST_DB}').dropDatabase();
    " >/dev/null 2>&1 || true

    # Remove temp dir
    if [ -n "${WORK_DIR:-}" ] && [ -d "$WORK_DIR" ]; then
        rm -rf "$WORK_DIR"
    fi
}
trap cleanup EXIT

cd "$WORK_DIR" || exit 2

echo "Working directory: $WORK_DIR"
echo "Creating C# console project..."

# Create dotnet console project (suppress noisy output)
if ! dotnet new console -n InsuranceCSharpTest -o . --force >/dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}: dotnet new console failed"
    exit 1
fi

# Add MongoDB.Driver package
echo "Adding MongoDB.Driver package (this may take a moment on first run)..."
if ! dotnet add package MongoDB.Driver >/dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}: dotnet add package MongoDB.Driver failed"
    exit 1
fi

# Write Program.cs - exercises the lab 14a operations.
# Uses Console.WriteLine "PASS: ..." / "FAIL: ..." and exits non-zero on any failure.
cat > Program.cs <<'CSHARP_EOF'
using MongoDB.Bson;
using MongoDB.Driver;

class Program
{
    private static readonly string ConnectionString =
        System.Environment.GetEnvironmentVariable("MONGO_URI")
        ?? "mongodb://localhost:27017/?directConnection=true";
    private const string DatabaseName = "insurance_company_csharp_test";
    private const string CollectionName = "policies";
    private const string TestPolicyNumber = "POL-CSHARP-TEST-001";

    static int failures = 0;

    static void Pass(string name) { System.Console.WriteLine("PASS: " + name); }
    static void Fail(string name, string detail)
    {
        System.Console.WriteLine("FAIL: " + name + " - " + detail);
        failures++;
    }

    static async Task<int> Main(string[] args)
    {
        IMongoCollection<BsonDocument> coll;
        try
        {
            var client = new MongoClient(ConnectionString);
            var db = client.GetDatabase(DatabaseName);
            coll = db.GetCollection<BsonDocument>(CollectionName);

            // Make sure no leftover from a previous run
            await coll.DeleteManyAsync(Builders<BsonDocument>.Filter.Regex(
                "policyNumber", new BsonRegularExpression("^POL-CSHARP-TEST-")));
            Pass("Connect to MongoDB");
        }
        catch (System.Exception ex)
        {
            Fail("Connect to MongoDB", ex.Message);
            return 1;
        }

        // 1) Insert a Policy document
        try
        {
            var policy = new BsonDocument
            {
                { "policyNumber", TestPolicyNumber },
                { "policyType", "Auto" },
                { "premium", 1500 },
                { "customerId", "CUST-CSHARP-001" },
                { "state", "CA" },
                { "createdAt", System.DateTime.UtcNow }
            };
            await coll.InsertOneAsync(policy);
            Pass("Insert policy");
        }
        catch (System.Exception ex)
        {
            Fail("Insert policy", ex.Message);
        }

        // 2) Find by policyNumber
        try
        {
            var filter = Builders<BsonDocument>.Filter.Eq("policyNumber", TestPolicyNumber);
            var doc = await coll.Find(filter).FirstOrDefaultAsync();
            if (doc == null) Fail("Find policy by policyNumber", "no document returned");
            else if (doc["premium"].ToInt32() != 1500) Fail("Find policy by policyNumber", "premium mismatch");
            else Pass("Find policy by policyNumber");
        }
        catch (System.Exception ex)
        {
            Fail("Find policy by policyNumber", ex.Message);
        }

        // 3) Update premium with $set
        try
        {
            var filter = Builders<BsonDocument>.Filter.Eq("policyNumber", TestPolicyNumber);
            var update = Builders<BsonDocument>.Update.Set("premium", 1750);
            var result = await coll.UpdateOneAsync(filter, update);
            if (result.ModifiedCount != 1) Fail("Update premium with $set", "ModifiedCount=" + result.ModifiedCount);
            else
            {
                var doc = await coll.Find(filter).FirstOrDefaultAsync();
                if (doc == null || doc["premium"].ToInt32() != 1750)
                    Fail("Update premium with $set", "premium not updated");
                else
                    Pass("Update premium with $set");
            }
        }
        catch (System.Exception ex)
        {
            Fail("Update premium with $set", ex.Message);
        }

        // 4) Aggregation: group by policyType, count
        try
        {
            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$match", new BsonDocument("policyNumber",
                    new BsonDocument("$regex", "^POL-CSHARP-TEST-"))),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", "$policyType" },
                    { "count", new BsonDocument("$sum", 1) }
                })
            };
            var results = await coll.Aggregate<BsonDocument>(pipeline).ToListAsync();
            if (results.Count >= 1) Pass("Aggregation group by policyType");
            else Fail("Aggregation group by policyType", "no groups returned");
        }
        catch (System.Exception ex)
        {
            Fail("Aggregation group by policyType", ex.Message);
        }

        // 5) Delete the test policy
        try
        {
            var filter = Builders<BsonDocument>.Filter.Eq("policyNumber", TestPolicyNumber);
            var result = await coll.DeleteOneAsync(filter);
            if (result.DeletedCount != 1) Fail("Delete test policy", "DeletedCount=" + result.DeletedCount);
            else Pass("Delete test policy");
        }
        catch (System.Exception ex)
        {
            Fail("Delete test policy", ex.Message);
        }

        // 6) Verify deletion (count == 0)
        try
        {
            var filter = Builders<BsonDocument>.Filter.Eq("policyNumber", TestPolicyNumber);
            var count = await coll.CountDocumentsAsync(filter);
            if (count == 0) Pass("Verify deletion (count == 0)");
            else Fail("Verify deletion (count == 0)", "count=" + count);
        }
        catch (System.Exception ex)
        {
            Fail("Verify deletion (count == 0)", ex.Message);
        }

        return failures == 0 ? 0 : 1;
    }
}
CSHARP_EOF

echo "Building and running C# test program..."
BUILD_LOG="$WORK_DIR/build.log"
if ! dotnet build -c Release -nologo --verbosity quiet > "$BUILD_LOG" 2>&1; then
    echo -e "${RED}FAIL${NC}: dotnet build failed"
    cat "$BUILD_LOG"
    exit 1
fi

RUN_LOG="$WORK_DIR/run.log"
dotnet run -c Release --no-build --verbosity quiet > "$RUN_LOG" 2>&1
RUN_EXIT=$?

# Echo the program output (PASS/FAIL lines) to the user
grep -E '^(PASS|FAIL):' "$RUN_LOG" | while IFS= read -r line; do
    if [[ "$line" == PASS:* ]]; then
        echo -e "${GREEN}${line}${NC}"
    else
        echo -e "${RED}${line}${NC}"
    fi
done

if [ "$RUN_EXIT" -ne 0 ]; then
    echo -e "${RED}Lab 14A test FAILED${NC}"
    echo "--- run.log tail ---"
    tail -40 "$RUN_LOG"
    exit 1
fi

echo -e "${GREEN}Lab 14A test PASSED${NC}"
exit 0
