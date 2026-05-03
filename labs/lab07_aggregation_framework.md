# Lab 7: MongoDB Aggregation Framework (45 minutes)

## Learning Objectives
- Build complex aggregation pipelines for data analysis
- Master aggregation operators and stages
- Implement business intelligence queries using aggregation

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

**Expected data counts:** 13 policies, 20 customers, 15 claims, 10 agents, 5 branches, 3 reviews

**Collections available:** `policies`, `claims`, `customers`, `agents`, `branches`, `payments`, `reviews`

## Tasks

**First, switch to the correct database:**
```javascript
use insurance_company
```

### Part A: Basic Aggregation Pipelines ($match, $group, $sort) (15 minutes)

1. **Basic Grouping and Counting**
   ```javascript
   // Count policies by type
   db.policies.aggregate([
     { $group: { _id: "$policyType", count: { $sum: 1 } } },
     { $sort: { count: -1 } }
   ])
   ```

2. **Revenue Analysis by Agent**
   ```javascript
   // Calculate total premium revenue by agent
   db.policies.aggregate([
     { $match: { isActive: true } },
     { $group: {
       _id: "$agentId",
       totalRevenue: { $sum: "$annualPremium" },
       policyCount: { $sum: 1 }
     }},
     { $sort: { totalRevenue: -1 } }
   ])
   ```

3. **Claims Analysis by Month**
   ```javascript
   // Group claims by month and calculate average claim amount
   db.claims.aggregate([
     { $match: { status: "approved" } },
     { $group: {
       _id: {
         year: { $year: "$createdAt" },
         month: { $month: "$createdAt" }
       },
       averageClaimAmount: { $avg: "$claimAmount" },
       totalClaims: { $sum: 1 }
     }},
     { $sort: { "_id.year": 1, "_id.month": 1 } }
   ])
   ```

### Part B: Advanced Stages ($lookup, $unwind, $project) (20 minutes)

1. **Join Operations with $lookup**
   ```javascript
   // Join policies with customer information
   db.policies.aggregate([
     {
       $lookup: {
         from: "customers",
         localField: "customerId",
         foreignField: "customerId",
         as: "customerInfo"
       }
     },
     { $unwind: "$customerInfo" },
     {
       $project: {
         policyNumber: 1,
         policyType: 1,
         annualPremium: 1,
         "customerInfo.firstName": 1,
         "customerInfo.lastName": 1,
         "customerInfo.email": 1
       }
     }
   ])
   ```

2. **Complex Data Transformation**
   ```javascript
   // Calculate customer risk profile based on claims history
   db.customers.aggregate([
     {
       $lookup: {
         from: "claims",
         localField: "customerId",
         foreignField: "customerId",
         as: "claims"
       }
     },
     {
       $lookup: {
         from: "policies",
         localField: "customerId",
         foreignField: "customerId",
         as: "policies"
       }
     },
     {
       $project: {
         firstName: 1,
         lastName: 1,
         email: 1,
         totalClaims: { $size: "$claims" },
         totalPolicies: { $size: "$policies" },
         claimsRatio: {
           $cond: {
             if: { $gt: [{ $size: "$policies" }, 0] },
             then: { $divide: [{ $size: "$claims" }, { $size: "$policies" }] },
             else: 0
           }
         },
         // Guard against division by zero for customers with no policies
         riskLevel: {
           $cond: {
             if: { $eq: [{ $size: "$policies" }, 0] },
             then: "No Policies",
             else: {
               $switch: {
                 branches: [
                   { case: { $gte: [{ $divide: [{ $size: "$claims" }, { $size: "$policies" }] }, 0.5] }, then: "High" },
                   { case: { $gte: [{ $divide: [{ $size: "$claims" }, { $size: "$policies" }] }, 0.2] }, then: "Medium" }
                 ],
                 default: "Low"
               }
             }
           }
         }
       }
     }
   ])
   ```

3. **Array Processing with $unwind**
   ```javascript
   // Analyze coverage types across all policies
   db.policies.aggregate([
     { $unwind: "$coverageTypes" },
     { $group: {
       _id: "$coverageTypes",
       count: { $sum: 1 },
       averagePremium: { $avg: "$annualPremium" }
     }},
     { $sort: { count: -1 } }
   ])
   ```

### Part C: Insurance Analytics and Business Intelligence (10 minutes)

1. **Comprehensive Business Dashboard Query**
   ```javascript
   // Create comprehensive insurance business metrics
   db.policies.aggregate([
     {
       $lookup: {
         from: "claims",
         localField: "policyNumber",
         foreignField: "policyNumber",
         as: "claims"
       }
     },
     {
       $lookup: {
         from: "customers",
         localField: "customerId",
         foreignField: "customerId",
         as: "customer"
       }
     },
     { $unwind: "$customer" },
     {
       $group: {
         _id: "$policyType",
         totalPolicies: { $sum: 1 },
         totalPremiumRevenue: { $sum: "$annualPremium" },
         totalClaimsAmount: { $sum: { $sum: "$claims.claimAmount" } },
         averagePremium: { $avg: "$annualPremium" },
         claimsCount: { $sum: { $size: "$claims" } }
       }
     },
     {
       $project: {
         _id: 1,
         totalPolicies: 1,
         totalPremiumRevenue: { $round: ["$totalPremiumRevenue", 2] },
         totalClaimsAmount: { $round: ["$totalClaimsAmount", 2] },
         averagePremium: { $round: ["$averagePremium", 2] },
         claimsCount: 1,
         lossRatio: {
           $cond: {
             if: { $gt: ["$totalPremiumRevenue", 0] },
             then: { $round: [{ $divide: ["$totalClaimsAmount", "$totalPremiumRevenue"] }, 4] },
             else: 0
           }
         },
         profitability: {
           $cond: {
             if: { $and: [
               { $gt: ["$totalPremiumRevenue", 0] },
               { $lt: [{ $divide: ["$totalClaimsAmount", "$totalPremiumRevenue"] }, 0.8] }
             ]},
             then: "Profitable",
             else: "Review Required"
           }
         }
       }
     },
     { $sort: { lossRatio: 1 } }
   ])
   ```

2. **Agent Performance Analysis**
   ```javascript
   // Analyze agent performance metrics
   db.agents.aggregate([
     {
       $lookup: {
         from: "policies",
         localField: "agentId",
         foreignField: "agentId",
         as: "policies"
       }
     },
     {
       $project: {
         firstName: 1,
         lastName: 1,
         territory: 1,
         totalPolicies: { $size: "$policies" },
         totalRevenue: { $sum: "$policies.annualPremium" },
         averagePolicyValue: { $avg: "$policies.annualPremium" },
         performance: {
           $switch: {
             branches: [
               { case: { $gte: [{ $sum: "$policies.annualPremium" }, 100000] }, then: "Excellent" },
               { case: { $gte: [{ $sum: "$policies.annualPremium" }, 50000] }, then: "Good" },
               { case: { $gte: [{ $sum: "$policies.annualPremium" }, 25000] }, then: "Average" }
             ],
             default: "Needs Improvement"
           }
         }
       }
     },
     { $sort: { totalRevenue: -1 } }
   ])
   ```

### Part D (Stretch): Multi-Pipeline Analytics — `$facet`, `$bucket`, `$unionWith` (15 minutes)

> ⏱ **Stretch — covers production aggregation operators beyond the core 45 minutes of Parts A-C.** If class is on schedule, the instructor may include this; otherwise it's self-study material.

These four operators are how production MongoDB applications build dashboards, tiered reports, and combined data views in a single round-trip.

1. **`$facet`** — run multiple sub-pipelines against the same input documents in parallel. One query, many independent results.

   ```javascript
   // One round-trip dashboard: counts by type, top earners, premium distribution
   db.policies.aggregate([
     { $match: { isActive: true } },
     { $facet: {
         "byType":         [{ $group: { _id: "$policyType", count: { $sum: 1 }, avgPremium: { $avg: "$annualPremium" } } },
                            { $sort: { count: -1 } }],
         "topEarners":     [{ $sort: { annualPremium: -1 } }, { $limit: 5 },
                            { $project: { _id: 0, policyNumber: 1, policyType: 1, annualPremium: 1 } }],
         "premiumStats":   [{ $group: { _id: null, total: { $sum: "$annualPremium" }, min: { $min: "$annualPremium" }, max: { $max: "$annualPremium" }, avg: { $avg: "$annualPremium" } } }]
     }}
   ])
   ```

   The output is a single document with three keys (`byType`, `topEarners`, `premiumStats`), each holding the result of its sub-pipeline. Notice this is one query — much cheaper than three round-trips.

   **Expected output (shape, exact numbers will match the loaded data):**
   ```javascript
   [{
       byType: [
           { _id: 'Property', count: 4, avgPremium: ... },   // 6 policy types
           { _id: 'Auto',     count: 3, avgPremium: ... },
           // ...
       ],
       topEarners: [
           { policyNumber: 'POL-HEALTH-001', policyType: 'Health', annualPremium: 8999.99 },
           // 5 entries total
       ],
       premiumStats: [
           { _id: null, total: 36249.86, min: ..., max: ..., avg: ... }
       ]
   }]
   ```

2. **`$bucket`** — group documents into explicit ranges (premium tiers, age brackets, score buckets). Useful for histograms.

   ```javascript
   db.policies.aggregate([
     { $match: { isActive: true } },
     { $bucket: {
         groupBy: "$annualPremium",
         boundaries: [0, 1000, 2500, 5000, 10000, Infinity],
         default: "Other",
         output: {
             policyCount: { $sum: 1 },
             totalRevenue: { $sum: "$annualPremium" },
             samplePolicies: { $push: { policyNumber: "$policyNumber", premium: "$annualPremium" } }
         }
     }},
     { $project: { _id: 0, premiumTier: "$_id", policyCount: 1, totalRevenue: 1, sampleSize: { $size: "$samplePolicies" } } }
   ])
   ```

   Each output `_id` is a left-edge boundary (`0`, `1000`, `2500`, ...). Documents whose `annualPremium` falls into `[boundary[i], boundary[i+1])` go into that bucket.

   **Expected output (shape):**
   ```javascript
   [
       { premiumTier: 0,    policyCount: 3, totalRevenue: ..., sampleSize: 3 },   // < $1000
       { premiumTier: 1000, policyCount: 8, totalRevenue: ..., sampleSize: 8 },   // $1k-$2.5k
       { premiumTier: 2500, policyCount: 3, totalRevenue: ..., sampleSize: 3 },   // $2.5k-$5k
       { premiumTier: 5000, policyCount: 1, totalRevenue: ..., sampleSize: 1 }    // $5k-$10k
   ]
   ```
   Counts add up to the total `isActive: true` policies in the loaded data.

3. **`$bucketAuto`** — same idea as `$bucket` but you specify how many buckets and MongoDB picks the boundaries automatically (equal-frequency). Useful when you don't know the data distribution.

   ```javascript
   db.policies.aggregate([
     { $match: { isActive: true } },
     { $bucketAuto: {
         groupBy: "$annualPremium",
         buckets: 4,
         output: { count: { $sum: 1 }, avgPremium: { $avg: "$annualPremium" } }
     }}
   ])
   ```

4. **`$unionWith`** — combine documents from multiple collections (or sub-pipelines) into one stream. Like SQL's `UNION ALL`. Useful for "all activity" or "combined catalog" views.

   ```javascript
   // Show all customer-facing financial events: premium payments AND claim filings,
   // tagged so we know which is which. Single sorted timeline.
   db.payments.aggregate([
     { $project: { _id: 0, customerId: 1, amount: 1, date: "$paymentDate", source: { $literal: "payment" } } },
     { $unionWith: {
         coll: "claims",
         pipeline: [
             { $project: { _id: 0, customerId: 1, amount: "$claimAmount", date: "$filedDate", source: { $literal: "claim" } } }
         ]
     }},
     { $sort: { date: -1 } },
     { $limit: 10 }
   ])
   ```

### Part E (Stretch): Window Functions — `$setWindowFields` (10 minutes)

> ⏱ **Stretch — pairs with Part D.** Covers SQL-window-function intuition in MongoDB. Self-study if class is on schedule.

Window functions compute values across a "window" of related documents without collapsing the rows. Think of it as `$group`'s richer cousin: you can rank, accumulate, and look at neighbors while keeping each input row in the output.

```javascript
// For each policy, show its rank within its policyType by annualPremium,
// the running total of premium for that type (ordered by date),
// and a moving 3-policy average premium.
db.policies.aggregate([
    { $match: { isActive: true } },
    { $setWindowFields: {
        partitionBy: "$policyType",
        sortBy: { effectiveDate: 1 },
        output: {
            premiumRank: {
                $rank: {}
            },
            runningTotal: {
                $sum: "$annualPremium",
                window: { documents: ["unbounded", "current"] }
            },
            movingAvg3: {
                $avg: "$annualPremium",
                window: { documents: [-1, 1] }
            }
        }
    }},
    { $project: { _id: 0, policyNumber: 1, policyType: 1, effectiveDate: 1, annualPremium: 1, premiumRank: 1, runningTotal: 1, movingAvg3: 1 } },
    { $sort: { policyType: 1, effectiveDate: 1 } },
    { $limit: 8 }
])
```

Key knobs:
- `partitionBy` — split documents into independent groups (here: per `policyType`); the window resets at partition boundaries.
- `sortBy` — order *within* each partition. Required when window operators care about position (`$rank`, running totals, lag/lead).
- `window: { documents: ["unbounded", "current"] }` — running total from the start of the partition through the current row.
- `window: { documents: [-1, 1] }` — moving window of 3 rows centered on current.

**Expected output (first row per partition):**
```javascript
[
    { policyType: 'Auto',       premiumRank: 1, runningTotal: 1299.99, movingAvg3: ... },
    { policyType: 'Auto',       premiumRank: 2, runningTotal: 2199.98, movingAvg3: ... },
    { policyType: 'Auto',       premiumRank: 3, runningTotal: 3499.97, movingAvg3: ... },
    { policyType: 'Commercial', premiumRank: 1, runningTotal: 2499.99, movingAvg3: ... },
    // ...
]
```
Notice `runningTotal` resets at the partition boundary (Auto → Commercial); rank starts back at 1 inside each partition; the running total accumulates within each `policyType` group ordered by `effectiveDate`.

Try changing `$rank` to `$denseRank` or `$documentNumber` and re-running to see the differences. Add `$shift` (window functions' equivalent of SQL `LAG`/`LEAD`) to see prior-row deltas.

## Cleanup and Environment Teardown

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

## Lab 7 Deliverables
✅ **Basic Pipelines**: Built aggregation pipelines with $match, $group, and $sort stages
✅ **Join Operations**: Used $lookup to combine data from multiple collections
✅ **Data Transformation**: Implemented $project, $unwind, and computed fields
✅ **Business Analytics**: Created insurance metrics dashboards using complex pipelines
✅ **Multi-pipeline analytics**: $facet (parallel sub-pipelines), $bucket / $bucketAuto (histograms), $unionWith (cross-collection)
✅ **Window functions**: $setWindowFields with $rank, running totals, and moving averages

## Challenge Exercises

### Challenge 1: Advanced Financial Analysis
Create an aggregation pipeline that calculates:
- Monthly premium income vs claims payout
- Seasonal trends in policy sales
- Customer lifetime value analysis

### Challenge 2: Risk Assessment Pipeline
Build a pipeline that:
- Identifies high-risk customers based on claims frequency
- Calculates territory-based risk profiles
- Suggests premium adjustments based on risk factors

## Verification Steps

1. **Pipeline Performance**
   ```javascript
   // Check pipeline execution stats
   db.policies.explain("executionStats").aggregate([
     { $group: { _id: "$policyType", count: { $sum: 1 } } }
   ])
   ```

2. **Data Validation**
   ```javascript
   // Verify aggregation results match expected business logic
   // policyType values are mixed-case: "Auto", "Property", "Life", "Commercial", etc.
   db.policies.aggregate([
     { $match: { policyType: "Auto" } },
     { $count: "autoCount" }
   ])
   // Expected: autoCount = 4 (POL-AUTO-001, POL-AUTO-002, POL-AUTO-003, POL-AUTO-2024-001)
   ```

## Expected Outcomes

By the end of this lab, you should be able to:
- Construct multi-stage aggregation pipelines
- Join data from multiple collections using $lookup
- Perform complex data transformations and calculations
- Create business intelligence reports using aggregation

## Troubleshooting

**Common Issues:**
- **Memory limitations**: Use $limit and $skip for large datasets
- **$lookup performance**: Ensure proper indexing on join fields
- **$unwind array explosion**: Use preserveNullAndEmptyArrays when needed
- **Complex $project stages**: Break into multiple stages for debugging

**Performance Tips:**
- Place $match stages early in the pipeline
- Use $project to reduce document size before expensive operations
- Create indexes on fields used in $match and $lookup stages