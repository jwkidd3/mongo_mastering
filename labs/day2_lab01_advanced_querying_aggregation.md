# Lab 1: Advanced Querying and Aggregation Framework (45 minutes)

## Learning Objectives
- Master complex query operations using MongoDB operators
- Build aggregation pipelines for data analysis
- Understand performance implications of different query patterns

## Prerequisites
- Sample insurance database with collections: `policies`, `claims`, `customers`, `agents`, `vehicles`, `properties`, `payments`

## Tasks

### Part A: Complex Queries (20 minutes)
1. **Multi-field Text Search**
   ```javascript
   // Find policies with text search across policy type and coverage details
   db.policies.find({
     $text: { $search: "auto collision comprehensive" }
   }).sort({ score: { $meta: "textScore" } })
   ```

2. **Geo-spatial Queries**
   ```javascript
   // Find agents within 10km of a claim location
   db.agents.find({
     territory: {
       $near: {
         $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] },
         $maxDistance: 10000
       }
     }
   })
   ```

3. **Array Operations**
   ```javascript
   // Find policies with specific coverage types and premium range
   db.policies.find({
     coverageTypes: { $in: ['collision', 'comprehensive'] },
     "riskAssessment.score": { $gte: 1 },  // Dot notation instead of $elemMatch
     annualPremium: { $gte: 500, $lte: 5000 }
   })
   ```


### Part B: Aggregation Pipeline (25 minutes)
1. **Premium Collection Analysis Pipeline**
   ```javascript
   db.payments.aggregate([
     { $match: { status: "collected", paymentDate: { $gte: new Date("2024-01-01") } } },
     { $unwind: "$premiums" },
     { $group: {
       _id: "$premiums.policyId",
       totalPayments: { $sum: 1 },
       totalPremiums: { $sum: "$premiums.amount" }
     }},
     { $lookup: {
       from: "policies",
       localField: "_id",
       foreignField: "_id",
       as: "policy"
     }},
     { $sort: { totalPremiums: -1 } },
     { $limit: 10 }
   ])
   ```

2. **Customer Risk Segmentation**
   ```javascript
   db.customers.aggregate([
     { $lookup: {
       from: "policies",
       localField: "_id",
       foreignField: "customerId",
       as: "policies"
     }},
     { $addFields: {
       totalPremiums: { $sum: "$policies.annualPremium" },
       policyCount: { $size: "$policies" }
     }},
     { $bucket: {
       groupBy: "$totalPremiums",
       boundaries: [0, 1000, 2500, 5000, 10000],
       default: "10000+",
       output: {
         count: { $sum: 1 },
         avgPremiumValue: { $avg: "$totalPremiums" }
       }
     }}
   ])
   ```

## Challenge Exercise
Create a pipeline that finds the top 5 customers by total premium payments in each territory, including their average policy value and most frequently claimed policy type.