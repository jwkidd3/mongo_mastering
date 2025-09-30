# Lab 4: CRUD Operations - Read and Query Mastery (45 minutes)

## Learning Objectives
- Master find() and findOne() methods with various options
- Understand query operators and logical combinations
- Implement projection, sorting, and result limiting
- Work with cursors and iteration methods

## Tasks

### Part A: Basic Query Operations (15 minutes)
1. **Fundamental Read Operations**
   ```javascript
   use insurance_company

   // Basic find operations
   db.policies.find()
   db.policies.findOne()

   // Find with conditions
   db.policies.find({policyType: "Auto"})
   db.policies.find({premiumAmount: 899.99})
   db.policies.find({active: true})

   // Count documents
   db.policies.countDocuments()
   db.policies.countDocuments({policyType: "Auto"})

   // Check if documents exist
   db.policies.findOne({policyType: "Auto"}) !== null
   ```

2. **Comparison Operators**
   ```javascript
   // Equality and inequality
   db.policies.find({premiumAmount: {$eq: 899.99}})
   db.policies.find({premiumAmount: {$ne: 899.99}})

   // Range queries
   db.policies.find({premiumAmount: {$gt: 1000}})
   db.policies.find({premiumAmount: {$gte: 1000}})
   db.policies.find({premiumAmount: {$lt: 2000}})
   db.policies.find({premiumAmount: {$lte: 2000}})

   // Range combinations
   db.policies.find({
     premiumAmount: {$gte: 500, $lte: 2000}
   })

   // Array membership
   db.policies.find({
     policyType: {$in: ["Auto", "Home"]}
   })
   db.policies.find({
     policyType: {$nin: ["Auto", "Home"]}
   })
   ```

3. **Logical Operators**
   ```javascript
   // AND operations (implicit and explicit)
   db.policies.find({
     policyType: "Auto",
     premiumAmount: {$lt: 1500}
   })

   db.policies.find({
     $and: [
       {policyType: "Auto"},
       {premiumAmount: {$lt: 1500}},
       {active: true}
     ]
   })

   // OR operations
   db.policies.find({
     $or: [
       {policyType: "Auto"},
       {premiumAmount: {$lt: 1000}}
     ]
   })

   // NOT operations
   db.policies.find({
     premiumAmount: {$not: {$gt: 3000}}
   })

   // NOR operations
   db.policies.find({
     $nor: [
       {policyType: "Auto"},
       {premiumAmount: {$gt: 3000}}
     ]
   })
   ```

### Part B: Advanced Querying Techniques (20 minutes)
1. **Field Existence and Type Queries**
   ```javascript
   // Field existence
   db.policies.find({coverage: {$exists: true}})
   db.policies.find({discount: {$exists: false}})

   // Type checking
   db.policies.find({premiumAmount: {$type: "double"}})
   db.policies.find({_id: {$type: "string"}})
   db.policies.find({beneficiaries: {$type: "array"}})

   // Null value handling
   db.policies.find({description: null})
   db.policies.find({description: {$ne: null}})
   ```

2. **Array Queries**
   ```javascript
   // Insert test data with arrays
   db.policies.insertMany([
     {
       policyNumber: "POL-VEH-001",
       coverageTypes: ["collision", "comprehensive", "liability"],
       policyType: "Auto",
       premiumAmount: 1250,
       claims: [4, 2, 1, 0, 0],
       vehicles: [
         {make: "Toyota", model: "Camry", year: 2020},
         {make: "Honda", model: "Civic", year: 2019}
       ]
     },
     {
       policyNumber: "POL-HOME-002",
       coverageTypes: ["dwelling", "personal_property"],
       policyType: "Home",
       premiumAmount: 1850,
       claims: [1, 0, 2],
       properties: [
         {type: "primary_residence", sqft: 2400},
         {type: "detached_garage", sqft: 600}
       ]
     }
   ])

   // Array element queries
   db.policies.find({coverageTypes: "collision"})
   db.policies.find({claims: 0})

   // Array size
   db.policies.find({coverageTypes: {$size: 3}})

   // All elements match
   db.policies.find({coverageTypes: {$all: ["collision", "comprehensive"]}})

   // Element match for objects
   db.policies.find({
     vehicles: {$elemMatch: {make: "Toyota", year: {$gte: 2018}}}
   })
   ```

3. **Regular Expression Queries**
   ```javascript
   // Case-insensitive search
   db.policies.find({policyNumber: /auto/i})

   // Pattern matching
   db.policies.find({policyNumber: /^POL/})  // Starts with "POL"
   db.policies.find({policyNumber: /\d+$/})  // Ends with digits

   // Using $regex operator
   db.policies.find({
     policyType: {$regex: "auto", $options: "i"}
   })

   // Complex patterns
   db.policies.find({
     policyNumber: {$regex: "^(POL-AUTO|POL-HOME)", $options: "i"}
   })
   ```

### Part C: Result Formatting and Cursor Operations (10 minutes)
1. **Projection and Field Selection**
   ```javascript
   // Include specific fields
   db.policies.find({}, {policyNumber: 1, premiumAmount: 1})

   // Exclude _id
   db.policies.find({}, {policyNumber: 1, premiumAmount: 1, _id: 0})

   // Exclude specific fields
   db.policies.find({}, {coverage: 0, beneficiaries: 0})

   // Nested field projection
   db.policies.find({}, {"coverage.deathBenefit": 1, policyNumber: 1})

   // Array element projection
   db.policies.find({}, {policyNumber: 1, "coverageTypes.1": 1})
   ```

2. **Sorting, Limiting, and Skipping**
   ```javascript
   // Sort by single field
   db.policies.find().sort({premiumAmount: 1})     // Ascending
   db.policies.find().sort({premiumAmount: -1})    // Descending

   // Sort by multiple fields
   db.policies.find().sort({policyType: 1, premiumAmount: -1})

   // Limit results
   db.policies.find().limit(5)

   // Skip documents (pagination)
   db.policies.find().skip(10).limit(5)

   // Combine operations
   db.policies.find({policyType: "Auto"})
     .sort({premiumAmount: -1})
     .limit(3)
     .pretty()
   ```

3. **Cursor Methods and Iteration**
   ```javascript
   // Cursor iteration
   var cursor = db.policies.find({policyType: "Auto"})
   while (cursor.hasNext()) {
     var doc = cursor.next()
     print("Policy: " + doc.policyNumber + ", Premium: $" + doc.premiumAmount)
   }

   // forEach iteration
   db.policies.find({policyType: "Auto"}).forEach(
     function(doc) {
       print(doc.policyNumber + " premium: $" + doc.premiumAmount)
     }
   )

   // Convert to array
   var policiesArray = db.policies.find({premiumAmount: {$lt: 1500}}).toArray()
   print("Found " + policiesArray.length + " policies under $1500")

   // Cursor information
   var cursor = db.policies.find()
   print("Cursor has next: " + cursor.hasNext())
   print("Cursor size: " + cursor.size())
   print("Document count: " + db.policies.countDocuments())
   ```

## Challenge Exercise
Build a comprehensive policy search system that supports:
- Text-based policy number searches (case-insensitive)
- Premium amount range filtering
- Policy type and coverage type filtering
- Sorting by multiple criteria (premium, effective date, policy type)
- Pagination with configurable page sizes
- Result statistics (total matches, average premium, claims ratio, etc.)