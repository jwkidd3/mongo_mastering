# Lab 3: Indexing Strategies and Performance Optimization (45 minutes)

## Learning Objectives
- Create and optimize indexes for different query patterns
- Analyze query performance using explain plans
- Understand index types and their use cases

## Tasks

### Part A: Index Creation and Analysis (25 minutes)
1. **Compound Indexes**
   ```javascript
   // Create compound index for common query pattern
   db.claims.createIndex({
     "policyId": 1,
     "status": 1,
     "filedDate": -1
   })

   // Analyze index usage
   db.claims.find({
     policyId: ObjectId("..."),
     status: "under_investigation"
   }).sort({ filedDate: -1 }).explain("executionStats")
   ```

2. **Text Indexes**
   ```javascript
   // Create text index with weights
   db.policies.createIndex({
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
   ```

3. **Partial Indexes**
   ```javascript
   // Index only active policies
   db.policies.createIndex(
     { "policyType": 1, "annualPremium": 1 },
     { partialFilterExpression: { "status": "active" } }
   )
   ```

### Part B: Performance Analysis (20 minutes)
1. **Query Performance Comparison**
   ```javascript
   // Before index
   db.claims.find({ policyId: ObjectId("...") }).explain("executionStats")

   // Create index
   db.claims.createIndex({ policyId: 1 })

   // After index
   db.claims.find({ policyId: ObjectId("...") }).explain("executionStats")
   ```

2. **Index Intersection**
   ```javascript
   // Create separate single-field indexes
   db.policies.createIndex({ policyType: 1 })
   db.policies.createIndex({ annualPremium: 1 })

   // Query using both fields
   db.policies.find({
     policyType: "Auto Insurance",
     annualPremium: { $gte: 1000, $lte: 3000 }
   }).explain("executionStats")
   ```

## Challenge Exercise
Optimize a slow-running claims processing aggregation pipeline by creating appropriate indexes. Use the profiler to identify bottlenecks and measure performance improvement for fraud detection queries.