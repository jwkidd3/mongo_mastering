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
   // Find policies where premium > 1000 AND (deductible < 500 OR coverage includes "comprehensive")
   db.policies.find({
     $and: [
       { premiumAmount: { $gt: 1000 } },
       {
         $or: [
           { deductible: { $lt: 500 } },
           { coverageTypes: "comprehensive" }
         ]
       }
     ]
   })
   ```

2. **Array Element Matching**
   ```javascript
   // Find claims with multiple damage types including "collision"
   db.claims.find({
     damageTypes: {
       $elemMatch: {
         $eq: "collision"
       }
     },
     "damageTypes.1": { $exists: true } // Ensure array has at least 2 elements
   })
   ```

3. **Date Range Queries**
   ```javascript
   // Find policies expiring in the next 30 days
   var thirtyDaysFromNow = new Date();
   thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

   db.policies.find({
     expirationDate: {
       $gte: new Date(),
       $lte: thirtyDaysFromNow
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
     phoneNumber: /^555-/
   })

   // Find agents with email addresses ending in company domain
   db.agents.find({
     email: /.*@insurecorp\.com$/i
   })
   ```

3. **Case-Insensitive Search**
   ```javascript
   // Find claims with case-insensitive status search
   db.claims.find({
     status: { $regex: "pending|approved", $options: "i" }
   })
   ```

### Part C: Geo-spatial Queries and Location-based Searches (15 minutes)

1. **2dsphere Index and Near Queries**
   ```javascript
   // Create 2dsphere index for agent locations
   db.agents.createIndex({ location: "2dsphere" })

   // Find agents within 10km of a claim location
   db.agents.find({
     location: {
       $near: {
         $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] },
         $maxDistance: 10000
       }
     }
   })
   ```

2. **Polygon Area Queries**
   ```javascript
   // Find properties within a specific geographic area (polygon)
   db.properties.find({
     location: {
       $geoWithin: {
         $geometry: {
           type: "Polygon",
           coordinates: [[
             [-74.0, 40.7], [-73.9, 40.7],
             [-73.9, 40.8], [-74.0, 40.8],
             [-74.0, 40.7]
           ]]
         }
       }
     }
   })
   ```

3. **Distance Calculation**
   ```javascript
   // Find the distance between claim location and nearest repair shop
   db.claims.aggregate([
     {
       $geoNear: {
         near: { type: "Point", coordinates: [-73.9857, 40.7484] },
         distanceField: "distanceToRepairShop",
         spherical: true,
         maxDistance: 50000
       }
     }
   ])
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