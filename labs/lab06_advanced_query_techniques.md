# Lab 1: Advanced Query Techniques Mastery (45 minutes)

## Learning Objectives
- Master advanced MongoDB query operators
- Practice complex conditional queries
- Implement geo-spatial and text search queries

## Prerequisites
- MongoDB replica set running and accessible
- **Course data loaded** (see instructions below)

## 📊 Load Course Data First!

**Before starting this lab, load the Day 2 course data:**

```bash
mongosh < data/day2_data_loader.js
```

**Wait for this success message:**
```
✅ DAY 2 ANALYTICS DATA LOADING COMPLETE!
```

**Test data loaded correctly:**
```bash
mongosh --eval "db.getSiblingDB('insurance_analytics').policies.countDocuments()"
mongosh --eval "db.getSiblingDB('insurance_analytics').customers.countDocuments()"
```

**Expected output:** Policies: 3, Customers: 3

💡 **See [LOAD_DATA.md](../LOAD_DATA.md) for detailed instructions and troubleshooting**

**Collections available:** `policies`, `claims`, `customers`, `agents`, `vehicles`, `properties`, `payments`

## Tasks

### Part A: Advanced Comparison and Logical Operators (15 minutes)

1. **Complex AND/OR Queries**
   ```javascript
   // Find policies where premium > 500 AND (policy type is HOME OR AUTO)
   db.policies.find({
     $and: [
       { annualPremium: { $gt: 500 } },
       {
         $or: [
           { policyType: "HOME" },
           { policyType: "AUTO" }
         ]
       }
     ]
   })
   ```

2. **Array Element Matching**
   ```javascript
   // Find claims with severity level "major" or "moderate"
   db.claims.find({
     severityLevel: { $in: ["major", "moderate", "critical"] }
   })
   ```

3. **Date Range Queries**
   ```javascript
   // Find policies created in 2024
   db.policies.find({
     createdAt: {
       $gte: new Date("2024-01-01"),
       $lt: new Date("2025-01-01")
     }
   })
   ```

### Part B: Text Search and Regex Patterns (15 minutes)

1. **Text Index Creation and Search**
   ```javascript
   // Create text index on policies collection
   db.policies.createIndex({
     policyType: "text",
     description: "text",
     coverageTypes: "text"
   })

   // Search for auto insurance policies
   db.policies.find({
     $text: { $search: "auto vehicle car" }
   }).sort({ score: { $meta: "textScore" } })
   ```

2. **Regex Pattern Matching**
   ```javascript
   // Find customers with phone numbers in 555 area code
   db.customers.find({
     phone: /^\+1-555-/
   })

   // Find agents with email addresses ending in company domain
   db.agents.find({
     email: /.*@insuranceco\.com$/i
   })
   ```

3. **Case-Insensitive Search**
   ```javascript
   // Find claims with case-insensitive status search
   db.claims.find({
     status: { $regex: "pending|approved", $options: "i" }
   })
   ```

### Part C: Geo-spatial Queries and Advanced Pattern Matching (15 minutes)

1. **2dsphere Index and Near Queries**
   ```javascript
   // Create 2dsphere index for claim locations
   db.claims.createIndex({ location: "2dsphere" })

   // Find claims within 50km of Manhattan (NYC)
   db.claims.find({
     location: {
       $near: {
         $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] },
         $maxDistance: 50000
       }
     }
   })
   ```

2. **Polygon Area Queries**
   ```javascript
   // Find claims within a specific geographic area (NYC metropolitan area)
   db.claims.find({
     location: {
       $geoWithin: {
         $geometry: {
           type: "Polygon",
           coordinates: [[
             [-74.5, 40.4], [-73.7, 40.4],
             [-73.7, 40.9], [-74.5, 40.9],
             [-74.5, 40.4]
           ]]
         }
       }
     }
   })
   ```

3. **Distance Calculation and Text Search**
   ```javascript
   // Create text index on reviews collection
   db.reviews.createIndex({
     reviewText: "text",
     categories: "text"
   })

   // Search for reviews mentioning service quality
   db.reviews.find({
     $text: { $search: "service excellent customer" }
   }).sort({ score: { $meta: "textScore" } })
   ```

## Challenge Exercises

### Challenge 1: Complex Business Query
Find all auto insurance policies where:
- Premium is above average for the policy type
- Customer has no previous claims
- Policy expires within 60 days
- Agent territory overlaps with customer zip code

### Challenge 2: Performance Analysis
Compare the performance of these equivalent queries using `.explain("executionStats")`:
- Text search vs regex pattern matching
- $elemMatch vs array index queries
- Geo-spatial $near vs $geoWithin queries

## Verification Steps

1. **Query Result Validation**
   ```javascript
   // Verify text search results contain search terms
   db.policies.find({ $text: { $search: "auto" } })
     .forEach(doc => print(doc.policyType + ": " + doc.description))
   ```

2. **Index Usage Verification**
   ```javascript
   // Check that geo-spatial queries use the 2dsphere index
   db.agents.find({
     location: { $near: { $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] } } }
   }).explain("executionStats")
   ```

3. **Performance Metrics**
   ```javascript
   // Compare execution times for different query patterns
   db.claims.find({ status: "pending" }).explain("executionStats").executionStats.totalDocsExamined
   ```

## Expected Outcomes

By the end of this lab, you should be able to:
- Construct complex queries using multiple logical operators
- Implement efficient text search with proper indexing
- Perform location-based queries using geo-spatial operators
- Analyze query performance and optimize search patterns

## Troubleshooting

**Common Issues:**
- **Text index errors**: Ensure only one text index per collection
- **Geo-spatial query failures**: Verify coordinate format [longitude, latitude]
- **Regex performance**: Use anchored patterns (^, $) when possible
- **Array query confusion**: Understand difference between array element vs array field matching

**Performance Tips:**
- Create appropriate indexes before running complex queries
- Use projection to limit returned fields
- Consider using aggregation for complex data transformations