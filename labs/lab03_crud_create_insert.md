# Lab 3: CRUD Operations - Create and Insert Mastery (45 minutes)

## Learning Objectives
- Master all document insertion methods and options
- Understand ObjectId generation and document structure
- Handle insertion errors and bulk operations
- Work with different data types in document creation

## Tasks

### Part A: Single Document Insertion (15 minutes)
1. **Basic insertOne() Operations**
   ```javascript
   use insurance_company

   // Simple document insertion
   db.policies.insertOne({
     policyNumber: "POL-AUTO-101",
     premiumAmount: 899.99,
     policyType: "Auto"
   })

   // Document with explicit _id
   db.policies.insertOne({
     _id: "POL-HOME-101",
     policyNumber: "POL-HOME-101",
     premiumAmount: 1299.99,
     policyType: "Home",
     insuranceCarrier: "SafeGuard Insurance"
   })

   // Document with nested structure
   db.policies.insertOne({
     policyNumber: "POL-LIFE-101",
     premiumAmount: 2499.99,
     policyType: "Life",
     coverage: {
       deathBenefit: 500000,
       termLength: "20 years",
       cashValue: true
     },
     beneficiaries: ["spouse", "children", "trust"],
     active: true,
     createdAt: new Date()
   })
   ```

2. **Understanding ObjectId and Document Structure**
   ```javascript
   // Examine ObjectId generation
   var newId = new ObjectId()
   print("Generated ObjectId: " + newId)
   print("Timestamp: " + newId.getTimestamp())

   // Insert with pre-generated ObjectId
   var customId = new ObjectId()
   db.policies.insertOne({
     _id: customId,
     policyType: "Commercial",
     policyNumber: "POL-COM-101",
     premiumAmount: 4999.99
   })

   // Verify insertion with different data types
   db.policies.insertOne({
     policyNumber: "POL-MULTI-101",
     policyType: "Auto",
     premiumAmount: NumberDecimal("1299.99"),
     deductible: NumberInt(500),
     coverageLimit: 250000,
     active: true,
     coverageTypes: ["collision", "comprehensive"],
     metadata: {
       created: new Date(),
       version: NumberInt(1)
     },
     encrypted_data: BinData(0, "SGVsbG8gV29ybGQ=")
   })
   ```

### Part B: Multiple Document Insertion (20 minutes)
1. **Basic insertMany() Operations**
   ```javascript
   // Insert array of documents
   db.customers.insertMany([
     {
       name: "John Doe",
       email: "john@example.com",
       age: 30,
       city: "New York",
       customerType: "Individual"
     },
     {
       name: "Jane Smith",
       email: "jane@example.com",
       age: 25,
       city: "Los Angeles",
       customerType: "Individual"
     },
     {
       name: "ABC Corporation",
       email: "contact@abccorp.com",
       businessType: "Manufacturing",
       city: "Chicago",
       customerType: "Business"
     }
   ])

   // Check insertion results
   print("Inserted documents count: " + db.customers.countDocuments())
   ```

2. **Bulk Operations with Options**
   ```javascript
   // Ordered insertion (stops on first error)
   db.claims.insertMany([
     {claimNumber: "CLM-101", policyId: "POL-AUTO-101", claimAmount: 3500.00},
     {claimNumber: "CLM-102", policyId: "POL-HOME-101", claimAmount: 8750.00},
     {claimNumber: "CLM-103", policyId: "POL-AUTO-101", claimAmount: 1250.00}
   ], {ordered: true})

   // Unordered insertion (continues despite errors)
   try {
     db.claims.insertMany([
       {claimNumber: "CLM-104", policyId: "POL-LIFE-101", claimAmount: 15000.00},
       {claimNumber: "CLM-102", policyId: "POL-COM-101", claimAmount: 25000.00}, // Duplicate key
       {claimNumber: "CLM-105", policyId: "POL-HOME-101", claimAmount: 4500.00}
     ], {ordered: false})
   } catch (e) {
     print("Bulk insert completed with errors: " + e)
   }
   ```

3. **Large Dataset Generation**
   ```javascript
   // Generate large dataset for testing
   var bulkPolicies = []
   for (var i = 1; i <= 1000; i++) {
     bulkPolicies.push({
       policyNumber: "POL-" + String(i).padStart(6, "0"),
       premiumAmount: Math.round(Math.random() * 5000 * 100) / 100,
       policyType: ["Auto", "Home", "Life", "Commercial"][Math.floor(Math.random() * 4)],
       customerId: "CUST-" + String(Math.floor(Math.random() * 500) + 1).padStart(4, "0"),
       active: Math.random() > 0.1,
       deductible: [250, 500, 1000, 2500][Math.floor(Math.random() * 4)],
       effectiveDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
     })
   }

   // Insert in batches
   var batchSize = 100
   for (var j = 0; j < bulkPolicies.length; j += batchSize) {
     var batch = bulkPolicies.slice(j, j + batchSize)
     db.policies.insertMany(batch)
     print("Inserted batch: " + (j / batchSize + 1))
   }
   ```

### Part C: Error Handling and Validation (10 minutes)
1. **Insertion Error Scenarios**
   ```javascript
   // Duplicate key error
   try {
     db.policies.insertOne({_id: "POL-HOME-101", policyNumber: "Duplicate Policy"})
   } catch (e) {
     print("Duplicate key error: " + e.message)
   }

   // Document too large error simulation
   var largeDoc = {
     policyNumber: "POL-LARGE-101",
     attachments: "x".repeat(16777216)  // 16MB+ string
   }
   try {
     db.policies.insertOne(largeDoc)
   } catch (e) {
     print("Document size error: " + e.message)
   }

   // Validation error (if validation rules exist)
   try {
     db.policies.insertOne({
       premiumAmount: -100,  // Invalid negative premium
       policyNumber: ""      // Empty policy number
     })
   } catch (e) {
     print("Validation error: " + e.message)
   }
   ```

2. **Write Concerns and Acknowledgment**
   ```javascript
   // Insert with write concern
   db.policies.insertOne(
     {policyNumber: "POL-ACK-101", premiumAmount: 1599.99, policyType: "Auto"},
     {writeConcern: {w: 1, j: true}}
   )

   // Batch insert with write concern
   db.policies.insertMany([
     {policyNumber: "POL-BATCH-101", premiumAmount: 899.99, policyType: "Home"},
     {policyNumber: "POL-BATCH-102", premiumAmount: 1199.99, policyType: "Auto"}
   ], {writeConcern: {w: "majority"}})
   ```

## Challenge Exercise
Create a realistic insurance policy database with 5000 policies across multiple insurance types (Auto, Home, Life, Commercial). Include proper data types, nested documents for coverage details, arrays for beneficiaries, and implement error handling for edge cases. Measure and report insertion performance.