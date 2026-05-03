# Lab 8: Indexing Strategies and Performance Optimization (45 minutes core + 25 minutes stretch)

## Learning Objectives
- Create and optimize indexes for different query patterns
- Analyze query performance using explain plans
- Understand index types and their use cases (compound, text, partial — plus wildcard, TTL, hidden as stretch)
- Apply the **ESR rule** (Equality → Sort → Range) when designing compound indexes (stretch)

## Prerequisites: Environment Setup

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./scripts/setup.sh
```

**Windows PowerShell:**
```powershell
.\scripts\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

**Load Course Data:**
> **New to MongoDB tooling?** See [Lab 1 — Choose Your Tool](lab01_mongodb_shell_mastery.md#choose-your-tool-mongodb-compass-or-mongosh-cli) for the Compass UI alternative (no shell-redirection issues, works the same on every OS).

```bash
mongosh < data/comprehensive_data_loader.js
```

> **Windows (PowerShell):** PowerShell does not forward `<` into `mongosh` — the command will error. Use `--file` instead:
> ```powershell
> mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
> ```

## Tasks

### Part A: Index Creation and Analysis (25 minutes)
1. **Examine Existing Indexes**
   ```javascript
   // First, examine what indexes already exist
   use insurance_company

   print("=== Existing Indexes ===")
   print("Policies collection indexes:")
   db.policies.getIndexes().forEach(function(index) {
     print("  - " + index.name + ": " + JSON.stringify(index.key))
   })

   print("\nCustomers collection indexes:")
   db.customers.getIndexes().forEach(function(index) {
     print("  - " + index.name + ": " + JSON.stringify(index.key))
   })

   print("\nClaims collection indexes:")
   db.claims.getIndexes().forEach(function(index) {
     print("  - " + index.name + ": " + JSON.stringify(index.key))
   })
   ```

2. **Compound Indexes**
   ```javascript
   // Create compound index for common query pattern
   db.claims.createIndex({
     "policyNumber": 1,
     "status": 1,
     "createdAt": -1
   })

   // Analyze index usage
   db.claims.find({
     policyNumber: "POL-AUTO-2024-001",
     status: "approved"
   }).sort({ createdAt: -1 }).explain("executionStats")
   ```

3. **Text Indexes**
   ```javascript
   // First, create test data for text search
   db.test_policies.drop()
   db.test_policies.insertMany([
     {
       policyType: "Auto",
       coverageDescription: "Comprehensive auto insurance with collision coverage",
       coverageTypes: ["collision", "comprehensive", "liability"]
     },
     {
       policyType: "Property",
       coverageDescription: "Complete homeowners insurance protection",
       coverageTypes: ["dwelling", "personal_property", "liability"]
     },
     {
       policyType: "Life",
       coverageDescription: "Term life insurance with death benefits",
       coverageTypes: ["death_benefit", "accidental_death"]
     }
   ])

   // Create text index with weights on different fields to avoid conflicts
   db.test_policies.createIndex({
     "policyType": "text",
     "coverageDescription": "text",
     "coverageTypes": "text"
   }, {
     weights: {
       policyType: 10,
       coverageDescription: 5,
       coverageTypes: 1
     },
     name: "policy_text_index"
   })

   // Test the text search
   db.test_policies.find({ $text: { $search: "auto collision" } })

   // Or examine existing text index
   db.policies.getIndexes().forEach(function(idx) { if (idx.textIndexVersion) printjson(idx) })
   ```

4. **Partial Indexes**
   ```javascript
   // Index only active policies
   db.policies.createIndex(
     { "policyType": 1, "annualPremium": 1 },
     { partialFilterExpression: { "isActive": true } }
   )
   ```

### Part B: Performance Analysis (20 minutes)
1. **Query Performance Comparison**
   ```javascript
   // Use test collection to avoid conflicts
   db.test_claims.drop()

   // Insert some test data
   db.test_claims.insertMany([
     {claimNumber: "CLM-TEST-001", policyId: "pol1", claimAmount: 1500},
     {claimNumber: "CLM-TEST-002", policyId: "pol2", claimAmount: 2500},
     {claimNumber: "CLM-TEST-003", policyId: "pol1", claimAmount: 3500}
   ])

   // Before index
   db.test_claims.find({ policyId: "pol1" }).explain("executionStats")

   // Create index
   db.test_claims.createIndex({ policyId: 1 })

   // After index
   db.test_claims.find({ policyId: "pol1" }).explain("executionStats")
   ```

2. **Index Intersection**
   ```javascript
   // Use existing indexes or create on test collections
   print("Examining existing indexes on policies:")
   db.policies.getIndexes().forEach(function(idx) {
     print("  " + idx.name + ": " + JSON.stringify(idx.key))
   })

   // Query using existing indexed fields
   db.policies.find({
     policyType: "Auto",
     annualPremium: { $gte: 1000, $lte: 3000 }
   }).explain("executionStats")

   // Alternative: Use test collection for new indexes
   db.test_policies.drop()
   db.test_policies.insertMany([
     {policyType: "Auto", annualPremium: 1200, policyNumber: "POL-001"},
     {policyType: "Property", annualPremium: 1800, policyNumber: "POL-002"},
     {policyType: "Auto", annualPremium: 2500, policyNumber: "POL-003"}
   ])

   db.test_policies.createIndex({ policyType: 1 })
   db.test_policies.createIndex({ annualPremium: 1 })
   ```

### Part C (Stretch): Specialized Index Types (15 minutes)

> ⏱ **Stretch — covers production index types beyond the core 45 minutes of Parts A-B.** If class is on schedule, the instructor may include this; otherwise it's self-study material.

The three index types below cover production cases the basic compound/text/partial set doesn't.

1. **Wildcard indexes** — index every field at any depth, useful when documents have unpredictable shapes (user-defined attributes, attribute bags, etc.).

   ```javascript
   // Insert a few policies with attribute bags whose keys vary per document
   db.policies_wildcard.drop()
   db.policies_wildcard.insertMany([
     { policyNumber: "POL-WC-001", attributes: { color: "red",   yearBuilt: 1998, hasGarage: true  } },
     { policyNumber: "POL-WC-002", attributes: { make:  "Tesla", model: "Y",     mileage: 12000   } },
     { policyNumber: "POL-WC-003", attributes: { breed: "Labrador", age: 4,      vaccinated: true } }
   ])
   ```

   ```javascript
   // ONE index covers ANY field path under attributes.* -- no need to predict keys.
   db.policies_wildcard.createIndex({ "attributes.$**": 1 })

   // Each query uses the wildcard index:
   db.policies_wildcard.find({ "attributes.color": "red"   }).explain("executionStats").queryPlanner.winningPlan.inputStage.stage
   db.policies_wildcard.find({ "attributes.make":  "Tesla" }).explain("executionStats").queryPlanner.winningPlan.inputStage.stage
   db.policies_wildcard.find({ "attributes.breed": "Labrador" }).explain("executionStats").queryPlanner.winningPlan.inputStage.stage
   ```

   **Expected output:** all three lines print `IXSCAN`. If any prints `COLLSCAN`, the wildcard index didn't get created — check `db.policies_wildcard.getIndexes()`.

2. **TTL indexes** — auto-delete documents after a deadline. Perfect for sessions, audit logs, expired quotes.

   ```javascript
   // Quotes that expire 30 minutes after creation
   db.quotes_ttl.drop()
   db.quotes_ttl.insertMany([
     { quoteId: "Q-001", customerId: "CUST000001", premium: 1200, createdAt: new Date(Date.now() - 31 * 60 * 1000) },
     { quoteId: "Q-002", customerId: "CUST000002", premium: 1800, createdAt: new Date()                            }
   ])

   // The expireAfterSeconds option turns this into a TTL index. The MongoDB
   // background worker will delete docs whose `createdAt + expireAfterSeconds`
   // is in the past. Sweep runs ~every 60 seconds.
   db.quotes_ttl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 60 })

   // Confirm the index reports a TTL
   db.quotes_ttl.getIndexes().filter(i => i.expireAfterSeconds !== undefined)
   ```

   > TTL indexes only fire on a single date-typed field, and they remove the *whole document*. To expire embedded fields you need an application-level scheduled job.

3. **Hidden indexes** — keep an index in the database but make the planner ignore it. Use this to test "what would happen if I dropped this index?" without actually dropping it, with instant revert.

   The demo uses an isolated collection so the only index is the one we're hiding -- if other indexes existed, the planner would just pick a fallback and the lesson would be muddied.

   ```javascript
   // Build an isolated collection -- no other indexes will compete.
   db.hidden_demo.drop()
   for (var i = 0; i < 2000; i++) {
       db.hidden_demo.insertOne({ region: ["NW","NE","SW","SE"][i%4], score: i });
   }
   db.hidden_demo.createIndex({ score: 1 }, { name: "score_test" })
   ```

   ```javascript
   // Index visible -> the planner uses it (IXSCAN)
   var v1 = db.hidden_demo.find({ score: { $gte: 1500 } }).explain("queryPlanner").queryPlanner.winningPlan
   print("Visible -> stage: " + (v1.inputStage ? v1.inputStage.stage : v1.stage))

   // Hide -> planner acts as if the index doesn't exist (falls back to COLLSCAN)
   db.hidden_demo.hideIndex("score_test")
   var h = db.hidden_demo.find({ score: { $gte: 1500 } }).explain("queryPlanner").queryPlanner.winningPlan
   print("Hidden -> stage: " + (h.inputStage ? h.inputStage.stage : h.stage))

   // Unhide -> instant restore, no rebuild required
   db.hidden_demo.unhideIndex("score_test")
   var v2 = db.hidden_demo.find({ score: { $gte: 1500 } }).explain("queryPlanner").queryPlanner.winningPlan
   print("Unhidden -> stage: " + (v2.inputStage ? v2.inputStage.stage : v2.stage))
   ```

   Output should read **IXSCAN → COLLSCAN → IXSCAN**, proving you can test index removal at zero cost.

### Part D (Stretch): The ESR Rule for Compound Indexes (10 minutes)

> ⏱ **Stretch — pairs with Part C.** Covers the canonical compound-index design rule. Self-study if class is on schedule.

When designing a compound index for a query that mixes equality, sort, and range predicates, order the keys **Equality → Sort → Range**. The optimizer can fully use the index left-to-right, the sort comes for free, and the range scan is bounded.

```javascript
// Build a focused test collection so explain stats are unambiguous
db.esr_demo.drop()
var bulk = []
for (var i = 0; i < 5000; i++) {
    bulk.push({
        policyType: ["Auto","Property","Life","Health"][i % 4],
        state:      ["CA","TX","NY","FL"][i % 4],
        annualPremium: 500 + (i * 7) % 4000,
        createdAt: new Date(Date.now() - (i * 60 * 1000))
    })
}
db.esr_demo.insertMany(bulk)
```

Target query: equality on `policyType`, range on `annualPremium`, sort by `createdAt`.

```javascript
// Wrong order -- range BEFORE sort. The sort cannot use the index, so a
// SORT_KEY_GENERATOR + in-memory sort appears in the plan.
db.esr_demo.createIndex({ policyType: 1, annualPremium: 1, createdAt: -1 }, { name: "ESR_wrong" })

var wrong = db.esr_demo.find({
    policyType: "Auto",
    annualPremium: { $gte: 1000, $lte: 3000 }
}).sort({ createdAt: -1 }).explain("executionStats")
print("WRONG order -- has SORT in plan? " +
      JSON.stringify(wrong.queryPlanner.winningPlan).includes("SORT"));
```

```javascript
// ESR-correct order: equality, then sort, then range.
db.esr_demo.dropIndex("ESR_wrong")
db.esr_demo.createIndex({ policyType: 1, createdAt: -1, annualPremium: 1 }, { name: "ESR_right" })

var right = db.esr_demo.find({
    policyType: "Auto",
    annualPremium: { $gte: 1000, $lte: 3000 }
}).sort({ createdAt: -1 }).explain("executionStats")
print("RIGHT order -- has SORT in plan? " +
      JSON.stringify(right.queryPlanner.winningPlan).includes("SORT"));
print("RIGHT order -- docs examined: " + right.executionStats.totalDocsExamined +
      ", returned: " + right.executionStats.nReturned);
```

**Expected output:**
```
WRONG order -- has SORT in plan? true
RIGHT order -- has SORT in plan? false
RIGHT order -- docs examined: ~1250, returned: ~625
```

The wrong-order plan contains a `SORT` stage (in-memory sort). The right-order plan does not -- the sort comes for free from the index direction. **Equality first, then the field you sort by, then the range.**

```javascript
db.esr_demo.dropIndex("ESR_right")
```

## Cleanup and Environment Teardown

### Clean Up Test Data (Optional)

```javascript
// Remove test collections created during this lab
db.test_policies.drop()
db.test_claims.drop()
db.policies_wildcard.drop()
db.quotes_ttl.drop()
db.hidden_demo.drop()
db.esr_demo.drop()
print("✅ Test data cleaned up")
```

### Environment Teardown
When finished with the lab, use the standardized teardown script:

**macOS/Linux:**
```bash
cd scripts
./teardown.sh
```

**Windows PowerShell:**
```powershell
cd scripts
.\teardown.ps1
```

## Lab 8 Deliverables
✅ **Index Inspection**: Examined existing indexes across collections
✅ **Compound Indexes**: Created multi-field indexes for common query patterns
✅ **Text Indexes**: Built weighted text search indexes on test data
✅ **Partial Indexes**: Created filtered indexes for active-only records
✅ **Wildcard Indexes**: One index covers any field path under an attribute bag
✅ **TTL Indexes**: Auto-expire documents based on a date field
✅ **Hidden Indexes**: Test "what if I dropped this index" without actually dropping it
✅ **ESR Rule**: Demonstrated equality → sort → range key ordering eliminates the in-memory SORT stage
✅ **Performance Analysis**: Compared query execution with and without indexes using explain plans
✅ **Index Intersection**: Analyzed multi-index query optimization strategies

## Challenge Exercise
Optimize a slow-running claims processing aggregation pipeline by creating appropriate indexes. Use the profiler to identify bottlenecks and measure performance improvement for fraud detection queries.