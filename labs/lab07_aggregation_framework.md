# Lab 2: MongoDB Aggregation Framework (45 minutes)

## Learning Objectives
- Build complex aggregation pipelines for data analysis
- Master aggregation operators and stages
- Implement business intelligence queries using aggregation

## Prerequisites
- Sample insurance database with collections: `policies`, `claims`, `customers`, `agents`, `vehicles`, `properties`, `payments`

## Tasks

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
         riskLevel: {
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
         localField: "_id",
         foreignField: "agentId",
         as: "policies"
       }
     },
     {
       $project: {
         agentName: 1,
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
   db.policies.aggregate([
     { $match: { policyType: "AUTO" } },
     { $count: "autoCount" }
   ])
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