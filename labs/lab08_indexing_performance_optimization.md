# Lab 8: Indexing Strategies and Performance Optimization (45 minutes)

## Learning Objectives
- Create and optimize indexes for different query patterns
- Analyze query performance using explain plans
- Understand index types and their use cases

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
```bash
mongosh < data/comprehensive_data_loader.js
```

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

## Cleanup and Environment Teardown

### Clean Up Test Data (Optional)

```javascript
// Remove test collections created during this lab
db.test_policies.drop()
db.test_claims.drop()
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
✅ **Performance Analysis**: Compared query execution with and without indexes using explain plans
✅ **Index Intersection**: Analyzed multi-index query optimization strategies

## Challenge Exercise
Optimize a slow-running claims processing aggregation pipeline by creating appropriate indexes. Use the profiler to identify bottlenecks and measure performance improvement for fraud detection queries.