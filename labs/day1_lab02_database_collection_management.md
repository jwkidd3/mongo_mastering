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
   use ecommerce

   // Verify current database
   db

   // Insert document to persist database
   db.test.insertOne({created: new Date()})

   // Verify database now appears in list
   show dbs

   // Switch between databases
   use inventory
   use analytics
   use ecommerce
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
   use international
   db.createCollection("products", {
     collation: {
       locale: "en_US",
       strength: 1
     }
   })

   // Database profiling setup
   use ecommerce
   db.setProfilingLevel(1, {slowms: 100})

   // Check database locks
   use admin
   db.runCommand({currentOp: 1})
   ```

### Part B: Collection Management (20 minutes)
1. **Collection Creation with Options**
   ```javascript
   use ecommerce

   // Basic collection creation
   db.createCollection("customers")

   // Capped collection (fixed size)
   db.createCollection("logs", {
     capped: true,
     size: 1000000,  // 1MB
     max: 5000       // Max 5000 documents
   })

   // Collection with validation
   db.createCollection("products", {
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["name", "price"],
         properties: {
           name: {
             bsonType: "string",
             description: "Product name is required"
           },
           price: {
             bsonType: "number",
             minimum: 0,
             description: "Price must be a positive number"
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
   db.logs.stats()

   // Check if collection is capped
   db.logs.isCapped()

   // Get collection options
   db.runCommand({listCollections: 1, filter: {name: "products"}})

   // Index information
   db.customers.getIndexes()
   db.customers.totalIndexSize()
   ```

3. **Collection Modification and Maintenance**
   ```javascript
   // Rename collection
   db.customers.renameCollection("clients")

   // Convert to capped collection
   db.runCommand({
     convertToCapped: "clients",
     size: 100000
   })

   // Modify collection validation
   db.runCommand({
     collMod: "products",
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["name", "price", "category"],
         properties: {
           name: {bsonType: "string"},
           price: {bsonType: "number", minimum: 0},
           category: {bsonType: "string"}
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
   db.createCollection("user_profiles")
   db.createCollection("order_items")
   db.createCollection("product_reviews")

   // Avoid problematic names
   // db.createCollection("123invalid")  // Don't start with numbers
   // db.createCollection("with spaces")  // Avoid spaces
   // db.createCollection("$system")     // Avoid system prefixes

   // Test naming conventions
   var collections = ["orders", "customers", "products", "reviews", "categories"]
   collections.forEach(function(name) {
     db.createCollection(name)
     print("Created collection: " + name)
   })

   db.dropDatabase()
   ```

## Challenge Exercise
Create a database structure for a university system with collections for students, courses, enrollments, and grades. Implement appropriate validation rules and demonstrate the relationship between collections using sample queries.