# Lab 2: Database and Collection Management Fundamentals (45 minutes)

## Learning Objectives
- Master database creation, switching, and deletion
- Understand collection management and naming conventions
- Work with collection options and metadata
- Implement database administration best practices

## Tasks

### Part A: Database Lifecycle Management (20 minutes)
1. **Database Creation and Switching**
   ```javascript
   // Switch to new database (creates implicitly)
   use insurance_company

   // Verify current database
   db

   // Insert document to persist database
   db.test.insertOne({created: new Date()})

   // Verify database now appears in list
   show dbs

   // Switch between databases
   use claims_processing
   use agent_management
   use insurance_company
   ```

2. **Database Information and Statistics**
   ```javascript
   // Get detailed database statistics
   db.stats()
   db.stats(1024)  // Stats in KB
   db.stats(1024*1024)  // Stats in MB

   // Get storage size information
   db.runCommand({dbStats: 1, scale: 1024})

   // List collections with details
   db.runCommand({listCollections: 1})
   ```

3. **Database Administration**
   ```javascript
   // Create database with specific locale
   use international_insurance
   db.createCollection("policies", {
     collation: {
       locale: "en_US",
       strength: 1
     }
   })

   // Database profiling setup
   use insurance_company
   db.setProfilingLevel(1, {slowms: 100})

   // Check database locks
   use admin
   db.runCommand({currentOp: 1})
   ```

### Part B: Collection Management (20 minutes)
1. **Collection Creation with Options**
   ```javascript
   use insurance_company

   // Basic collection creation
   db.createCollection("customers")

   // Capped collection (fixed size)
   db.createCollection("audit_logs", {
     capped: true,
     size: 1000000,  // 1MB
     max: 5000       // Max 5000 documents
   })

   // Collection with validation
   db.createCollection("policies", {
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["policyNumber", "premiumAmount"],
         properties: {
           policyNumber: {
             bsonType: "string",
             description: "Policy number is required"
           },
           premiumAmount: {
             bsonType: "number",
             minimum: 0,
             description: "Premium amount must be a positive number"
           }
         }
       }
     },
     validationAction: "error"
   })
   ```

2. **Collection Information and Metadata**
   ```javascript
   // List all collections
   show collections

   // Get collection statistics
   db.customers.stats()
   db.audit_logs.stats()

   // Check if collection is capped
   db.audit_logs.isCapped()

   // Get collection options
   db.runCommand({listCollections: 1, filter: {name: "policies"}})

   // Index information
   db.customers.getIndexes()
   db.customers.totalIndexSize()
   ```

3. **Collection Modification and Maintenance**
   ```javascript
   // Rename collection
   db.customers.renameCollection("policyholders")

   // Convert to capped collection
   db.runCommand({
     convertToCapped: "policyholders",
     size: 100000
   })

   // Modify collection validation
   db.runCommand({
     collMod: "policies",
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["policyNumber", "premiumAmount", "policyType"],
         properties: {
           policyNumber: {bsonType: "string"},
           premiumAmount: {bsonType: "number", minimum: 0},
           policyType: {bsonType: "string"}
         }
       }
     }
   })
   ```

### Part C: Naming Conventions and Best Practices (5 minutes)
1. **Collection Naming Standards**
   ```javascript

   use test

   // Good naming examples
   db.createCollection("customer_profiles")
   db.createCollection("claim_details")
   db.createCollection("policy_reviews")

   // Avoid problematic names
   // db.createCollection("123invalid")  // Don't start with numbers
   // db.createCollection("with spaces")  // Avoid spaces
   // db.createCollection("$system")     // Avoid system prefixes

   // Test naming conventions
   var collections = ["claims", "customers", "policies", "agents", "vehicles"]
   collections.forEach(function(name) {
     db.createCollection(name)
     print("Created collection: " + name)
   })

   db.dropDatabase()
   ```

## Challenge Exercise
Create a database structure for a multi-branch insurance company with collections for policies, claims, customers, agents, and branch_locations. Implement appropriate validation rules for insurance data (policy numbers, coverage amounts, deductibles) and demonstrate the relationship between collections using sample queries.