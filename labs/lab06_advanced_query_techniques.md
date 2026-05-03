# Lab 6: Advanced Query Techniques Mastery (45 minutes)

## Learning Objectives
- Master advanced MongoDB query operators
- Practice complex conditional queries
- Implement geo-spatial and text search queries

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

## Prerequisites: Load Course Data

Before starting this lab, ensure the MongoDB environment is running and course data is loaded:

> **New to MongoDB tooling?** See [Lab 1 — Choose Your Tool](lab01_mongodb_shell_mastery.md#choose-your-tool-mongodb-compass-or-mongosh-cli) for the Compass UI alternative (no shell-redirection issues, works the same on every OS).

```bash
# From the project root
mongosh "mongodb://localhost:27017/?directConnection=true" < data/comprehensive_data_loader.js
```

> **Windows (PowerShell):** PowerShell does not forward `<` into `mongosh` — the command will error. Use `--file` instead:
> ```powershell
> mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
> ```

Verify the data loaded successfully:

```bash
mongosh "mongodb://localhost:27017/insurance_company?directConnection=true" --eval "db.policies.countDocuments()"
```

**Collections available:** `policies`, `claims`, `customers`, `agents`, `branches`, `payments`, `reviews`

## Tasks

**First, switch to the correct database:**
```javascript
use insurance_company
```

### Part A: Advanced Comparison and Logical Operators (15 minutes)

1. **Complex AND/OR Queries**
   ```javascript
   // Find policies where premium > 500 AND (policy type is Property OR Auto)
   db.policies.find({
     $and: [
       { annualPremium: { $gt: 500 } },
       {
         $or: [
           { policyType: "Property" },
           { policyType: "Auto" }
         ]
       }
     ]
   })
   ```

2. **Array Element Matching**
   ```javascript
   // Find claims with severity level "major", "moderate", or "critical"
   // Note: severityLevel only exists on 3 claims added by the Day 2 loader.
   // Claims without this field will not match (MongoDB skips documents
   // where the queried field is missing).
   db.claims.find({
     severityLevel: { $in: ["major", "moderate", "critical"] }
   })
   // Expected: 3 results (the 3 Day 2 claims that have severityLevel)
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
   // Drop any existing text index on policies (loader may create one with a
   // different name on different runs, so look it up dynamically).
   db.policies.getIndexes()
     .filter(i => Object.values(i.key || {}).includes("text"))
     .forEach(i => db.policies.dropIndex(i.name))

   // Create text index on policies collection
   db.policies.createIndex({
     policyType: "text",
     name: "text",
     coverageTypes: "text"
   })

   // Search for auto insurance policies
   // The text index covers policyType and name fields.
   // Search terms should match actual field content like "Auto", "Coverage", "Protection".
   db.policies.find({
     $text: { $search: "Auto Coverage Protection" }
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
     status: { $regex: "under_review|approved", $options: "i" }
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
   // The text index covers reviewText and categories fields.
   // Good search terms: "excellent service", "claims process", "poor experience", "coverage"
   db.reviews.find({
     $text: { $search: "excellent service claims process" }
   }).sort({ score: { $meta: "textScore" } })
   ```

## Cleanup and Environment Teardown

### Clean Up Test Data (Optional)

```javascript
// Remove indexes created during this lab (optional - only if you want to reset)
use insurance_company
// Note: Text and geospatial indexes were created for query exercises
// They can be left for subsequent labs or dropped:
// db.policies.dropIndex("policyType_text_name_text_coverageTypes_text")
// db.claims.dropIndex("location_2dsphere")
// db.reviews.dropIndex("reviewText_text_categories_text")
print("✅ Lab 6 complete - indexes remain for future use")
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

## Lab 6 Deliverables
✅ **Complex Queries**: Built multi-condition queries with $and, $or, and nested operators
✅ **Text Search**: Created text indexes and performed full-text search queries
✅ **Regex Patterns**: Used pattern matching for flexible string queries
✅ **Geospatial Queries**: Implemented $near and $geoWithin with 2dsphere indexes

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
   db.reviews.find({ $text: { $search: "excellent service claims process" } })
     .forEach(function(doc) { print("Rating: " + doc.rating + " - " + doc.reviewText.substring(0, 50) + "...") })
   ```

2. **Index Usage Verification**
   ```javascript
   // Check that geo-spatial queries use the 2dsphere index
   db.claims.find({
     location: { $near: { $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] }, $maxDistance: 50000 } }
   }).explain("executionStats")
   ```

3. **Performance Metrics**
   ```javascript
   // Compare execution times for different query patterns
   db.claims.find({ status: "approved" }).explain("executionStats").executionStats.totalDocsExamined
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