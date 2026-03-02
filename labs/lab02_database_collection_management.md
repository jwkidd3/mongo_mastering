# Lab 2: Database and Collection Management Fundamentals (45 minutes)

## Learning Objectives
- Master database creation, switching, and deletion
- Understand collection management and naming conventions
- Work with collection options and metadata
- Implement database administration best practices

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
   // Create database with specific locale (using 'en' locale for compatibility)
   use international_insurance
   db.international_policies.drop()
   db.createCollection("international_policies", { collation: { locale: "en", strength: 1 } })

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

   // Drop any existing lab collections for rerun safety
   db.lab2_customers.drop()
   db.audit_logs.drop()
   db.new_policies.drop()

   // Basic collection creation (using new name to avoid conflicts with existing data)
   db.createCollection("lab2_customers")

   // Capped collection (fixed size)
   db.createCollection("audit_logs", { capped: true, size: 1000000, max: 5000 })

   // Collection with validation (using new collection name to avoid conflicts)
   db.createCollection("new_policies", { validator: { $jsonSchema: { bsonType: "object", required: ["policyNumber", "annualPremium"], properties: { policyNumber: { bsonType: "string", description: "Policy number is required" }, annualPremium: { bsonType: "number", minimum: 0, description: "Premium amount must be a positive number" } } } }, validationAction: "error" })
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
   // Rename collection (using test collection to avoid breaking later labs)
   db.lab2_test_collection.drop()
   db.lab2_policyholders.drop()
   db.createCollection("lab2_test_collection")
   db.lab2_test_collection.insertOne({test: true})
   db.lab2_test_collection.renameCollection("lab2_policyholders")

   // Convert to capped collection
   db.runCommand({ convertToCapped: "lab2_policyholders", size: 100000 })

   // Modify collection validation
   db.runCommand({ collMod: "new_policies", validator: { $jsonSchema: { bsonType: "object", required: ["policyNumber", "annualPremium", "policyType"], properties: { policyNumber: {bsonType: "string"}, annualPremium: {bsonType: "number", minimum: 0}, policyType: {bsonType: "string"} } } } })
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

## Cleanup and Environment Teardown

### Clean Up Test Data (Optional)

```javascript
// Remove test collections and databases created during this lab
use insurance_company
db.lab2_customers.drop()
db.audit_logs.drop()
db.new_policies.drop()
db.lab2_policyholders.drop()

use international_insurance
db.international_policies.drop()
db.dropDatabase()

use insurance_company
print("✅ Test data cleaned up")
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

## Lab 2 Deliverables
✅ **Database Lifecycle**: Created, switched, and inspected databases
✅ **Collection Management**: Created collections with options (capped, validated)
✅ **Collection Operations**: Renamed, modified, and inspected collection metadata
✅ **Naming Conventions**: Applied best practices for database and collection naming

## Challenge Exercise
Create a database structure for a multi-branch insurance company with collections for policies, claims, customers, agents, and branch_locations. Implement appropriate validation rules for insurance data (policy numbers, coverage amounts, deductibles) and demonstrate the relationship between collections using sample queries.