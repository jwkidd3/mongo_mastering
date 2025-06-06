# MongoDB Mastering Course - Day 1 Labs (Command Line Focused)
*5 comprehensive labs focused on command-line mastery and foundational skills*

---

## Lab 1: MongoDB Shell Mastery and Server Navigation (45 minutes)

### Learning Objectives
- Master `mongosh` command-line interface
- Navigate MongoDB server hierarchy (databases, collections, documents)
- Understand MongoDB shell context and JavaScript environment
- Execute administrative commands and inspect server status

### Prerequisites
- MongoDB Docker container running and accessible
- Terminal/command prompt access

### Tasks

#### Part A: Shell Connection and Basic Navigation (15 minutes)
1. **Connect to MongoDB Shell**
   ```bash
   # Connect to MongoDB (assuming Docker container on localhost:27017)
   mongosh mongodb://localhost:27017
   
   # Connect with authentication if enabled
   mongosh mongodb://admin:password123@localhost:27017
   
   # Connect and specify database
   mongosh mongodb://localhost:27017/testdb
   ```

2. **Server Information Commands**
   ```javascript
   // Check MongoDB version and build info
   db.version()
   db.runCommand({buildInfo: 1})
   
   // Display current database
   db
   
   // Show server status
   db.serverStatus()
   
   // Display connection info
   db.runCommand({connectionStatus: 1})
   ```

3. **Database Discovery**
   ```javascript
   // List all databases
   show dbs
   
   // Get database stats
   db.stats()
   
   // Show current database name
   db.getName()
   
   // Check if database exists
   db.runCommand({listDatabases: 1})
   ```

#### Part B: JavaScript Environment and Helper Methods (20 minutes)
1. **JavaScript Context Exploration**
   ```javascript
   // Demonstrate JavaScript in shell
   var currentDate = new Date()
   print("Current date: " + currentDate)
   
   // Mathematical operations
   var calculation = Math.PI * Math.pow(5, 2)
   print("Circle area with radius 5: " + calculation)
   
   // Variable assignment and manipulation
   var dbName = "company"
   var collectionName = "employees"
   print("Working with: " + dbName + "." + collectionName)
   ```

2. **Shell Helper Methods**
   ```javascript
   // Database helpers
   use company  // Switch to 'company' database
   db.dropDatabase()  // Drop current database
   
   // Collection helpers
   show collections  // List collections in current database
   db.createCollection("employees")
   db.employees.drop()
   
   // Index helpers
   db.employees.getIndexes()
   db.employees.totalIndexSize()
   
   // Status helpers
   db.stats()
   db.employees.stats()
   ```

3. **Advanced Shell Commands**
   ```javascript
   // Command execution methods
   db.runCommand({ping: 1})
   db.adminCommand({listCollections: 1})
   
   // Profiling commands
   db.setProfilingLevel(2)
   db.getProfilingLevel()
   db.getProfilingStatus()
   
   // Current operations
   db.currentOp()
   ```

#### Part C: Command History and Shell Configuration (10 minutes)
1. **History Management**
   ```javascript
   // View command history (up/down arrows)
   // Use Ctrl+R for reverse search
   
   // Clear screen
   cls  // or use Ctrl+L
   
   // Exit shell
   exit  // or use Ctrl+C twice
   ```

2. **Shell Customization**
   ```javascript
   // Set custom prompt
   prompt = function() {
     return db + "> ";
   }
   
   // Disable line wrapping for long output
   DBQuery.shellBatchSize = 10
   ```

### Challenge Exercise
Write a JavaScript function in the shell that connects to three different databases, creates a collection in each, and reports the total number of collections across all databases.

---

## Lab 2: Database and Collection Management Fundamentals (45 minutes)

### Learning Objectives
- Master database creation, switching, and deletion
- Understand collection management and naming conventions
- Work with collection options and metadata
- Implement database administration best practices

### Tasks

#### Part A: Database Lifecycle Management (20 minutes)
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
   db.runCommand({currentOp: 1})
   ```

#### Part B: Collection Management (20 minutes)
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
     convertToCapped: "regular_collection",
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

#### Part C: Naming Conventions and Best Practices (5 minutes)
1. **Collection Naming Standards**
   ```javascript
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
   ```

### Challenge Exercise
Create a database structure for a university system with collections for students, courses, enrollments, and grades. Implement appropriate validation rules and demonstrate the relationship between collections using sample queries.

---

## Lab 3: CRUD Operations - Create and Insert Mastery (45 minutes)

### Learning Objectives
- Master all document insertion methods and options
- Understand ObjectId generation and document structure
- Handle insertion errors and bulk operations
- Work with different data types in document creation

### Tasks

#### Part A: Single Document Insertion (15 minutes)
1. **Basic insertOne() Operations**
   ```javascript
   use ecommerce
   
   // Simple document insertion
   db.products.insertOne({
     name: "Wireless Mouse",
     price: 29.99,
     category: "Electronics"
   })
   
   // Document with explicit _id
   db.products.insertOne({
     _id: "MOUSE-001",
     name: "Gaming Mouse",
     price: 79.99,
     category: "Electronics",
     brand: "TechGear"
   })
   
   // Document with nested structure
   db.products.insertOne({
     name: "Laptop",
     price: 999.99,
     category: "Computers",
     specifications: {
       processor: "Intel i7",
       ram: "16GB",
       storage: "512GB SSD"
     },
     tags: ["portable", "business", "gaming"],
     inStock: true,
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
   db.products.insertOne({
     _id: customId,
     name: "Custom ID Product",
     price: 199.99
   })
   
   // Verify insertion with different data types
   db.products.insertOne({
     name: "Multi-Type Product",
     price: NumberDecimal("99.99"),
     quantity: NumberInt(100),
     weight: 2.5,
     available: true,
     tags: ["sample", "test"],
     metadata: {
       created: new Date(),
       version: NumberInt(1)
     },
     binary_data: BinData(0, "SGVsbG8gV29ybGQ=")
   })
   ```

#### Part B: Multiple Document Insertion (20 minutes)
1. **Basic insertMany() Operations**
   ```javascript
   // Insert array of documents
   db.customers.insertMany([
     {
       name: "John Doe",
       email: "john@example.com",
       age: 30,
       city: "New York"
     },
     {
       name: "Jane Smith", 
       email: "jane@example.com",
       age: 25,
       city: "Los Angeles"
     },
     {
       name: "Bob Johnson",
       email: "bob@example.com", 
       age: 35,
       city: "Chicago"
     }
   ])
   
   // Check insertion results
   print("Inserted documents count: " + db.customers.countDocuments())
   ```

2. **Bulk Operations with Options**
   ```javascript
   // Ordered insertion (stops on first error)
   db.orders.insertMany([
     {orderId: "ORD-001", customerId: "CUST-001", total: 99.99},
     {orderId: "ORD-002", customerId: "CUST-002", total: 149.99},
     {orderId: "ORD-003", customerId: "CUST-001", total: 79.99}
   ], {ordered: true})
   
   // Unordered insertion (continues despite errors)
   try {
     db.orders.insertMany([
       {orderId: "ORD-004", customerId: "CUST-003", total: 199.99},
       {orderId: "ORD-002", customerId: "CUST-004", total: 299.99}, // Duplicate key
       {orderId: "ORD-005", customerId: "CUST-005", total: 89.99}
     ], {ordered: false})
   } catch (e) {
     print("Bulk insert completed with errors: " + e)
   }
   ```

3. **Large Dataset Generation**
   ```javascript
   // Generate large dataset for testing
   var bulkProducts = []
   for (var i = 1; i <= 1000; i++) {
     bulkProducts.push({
       name: "Product " + i,
       price: Math.round(Math.random() * 1000 * 100) / 100,
       category: ["Electronics", "Clothing", "Books", "Home"][Math.floor(Math.random() * 4)],
       sku: "SKU-" + String(i).padStart(4, "0"),
       inStock: Math.random() > 0.3,
       quantity: Math.floor(Math.random() * 100),
       createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
     })
   }
   
   // Insert in batches
   var batchSize = 100
   for (var j = 0; j < bulkProducts.length; j += batchSize) {
     var batch = bulkProducts.slice(j, j + batchSize)
     db.products.insertMany(batch)
     print("Inserted batch: " + (j / batchSize + 1))
   }
   ```

#### Part C: Error Handling and Validation (10 minutes)
1. **Insertion Error Scenarios**
   ```javascript
   // Duplicate key error
   try {
     db.products.insertOne({_id: "MOUSE-001", name: "Duplicate Mouse"})
   } catch (e) {
     print("Duplicate key error: " + e.message)
   }
   
   // Document too large error simulation
   var largeDoc = {
     name: "Large Document",
     data: "x".repeat(16777216)  // 16MB+ string
   }
   try {
     db.products.insertOne(largeDoc)
   } catch (e) {
     print("Document size error: " + e.message)
   }
   
   // Validation error (if validation rules exist)
   try {
     db.products.insertOne({
       price: -10,  // Invalid negative price
       name: ""     // Empty name
     })
   } catch (e) {
     print("Validation error: " + e.message)
   }
   ```

2. **Write Concerns and Acknowledgment**
   ```javascript
   // Insert with write concern
   db.products.insertOne(
     {name: "Acknowledged Product", price: 99.99},
     {writeConcern: {w: 1, j: true}}
   )
   
   // Batch insert with write concern
   db.products.insertMany([
     {name: "Batch Product 1", price: 19.99},
     {name: "Batch Product 2", price: 29.99}
   ], {writeConcern: {w: "majority"}})
   ```

### Challenge Exercise
Create a realistic e-commerce product catalog with 5000 products across multiple categories. Include proper data types, nested documents for specifications, arrays for tags, and implement error handling for edge cases. Measure and report insertion performance.

---

## Lab 4: CRUD Operations - Read and Query Mastery (45 minutes)

### Learning Objectives
- Master find() and findOne() methods with various options
- Understand query operators and logical combinations
- Implement projection, sorting, and result limiting
- Work with cursors and iteration methods

### Tasks

#### Part A: Basic Query Operations (15 minutes)
1. **Fundamental Read Operations**
   ```javascript
   use ecommerce
   
   // Basic find operations
   db.products.find()
   db.products.findOne()
   
   // Find with conditions
   db.products.find({category: "Electronics"})
   db.products.find({price: 29.99})
   db.products.find({inStock: true})
   
   // Count documents
   db.products.countDocuments()
   db.products.countDocuments({category: "Electronics"})
   
   // Check if documents exist
   db.products.findOne({category: "Electronics"}) !== null
   ```

2. **Comparison Operators**
   ```javascript
   // Equality and inequality
   db.products.find({price: {$eq: 29.99}})
   db.products.find({price: {$ne: 29.99}})
   
   // Range queries
   db.products.find({price: {$gt: 50}})
   db.products.find({price: {$gte: 50}})
   db.products.find({price: {$lt: 100}})
   db.products.find({price: {$lte: 100}})
   
   // Range combinations
   db.products.find({
     price: {$gte: 20, $lte: 100}
   })
   
   // Array membership
   db.products.find({
     category: {$in: ["Electronics", "Computers"]}
   })
   db.products.find({
     category: {$nin: ["Electronics", "Computers"]}
   })
   ```

3. **Logical Operators**
   ```javascript
   // AND operations (implicit and explicit)
   db.products.find({
     category: "Electronics",
     price: {$lt: 100}
   })
   
   db.products.find({
     $and: [
       {category: "Electronics"},
       {price: {$lt: 100}},
       {inStock: true}
     ]
   })
   
   // OR operations
   db.products.find({
     $or: [
       {category: "Electronics"},
       {price: {$lt: 50}}
     ]
   })
   
   // NOT operations
   db.products.find({
     price: {$not: {$gt: 100}}
   })
   
   // NOR operations
   db.products.find({
     $nor: [
       {category: "Electronics"},
       {price: {$gt: 100}}
     ]
   })
   ```

#### Part B: Advanced Querying Techniques (20 minutes)
1. **Field Existence and Type Queries**
   ```javascript
   // Field existence
   db.products.find({specifications: {$exists: true}})
   db.products.find({discount: {$exists: false}})
   
   // Type checking
   db.products.find({price: {$type: "double"}})
   db.products.find({_id: {$type: "string"}})
   db.products.find({tags: {$type: "array"}})
   
   // Null value handling
   db.products.find({description: null})
   db.products.find({description: {$ne: null}})
   ```

2. **Array Queries**
   ```javascript
   // Insert test data with arrays
   db.products.insertMany([
     {
       name: "Smartphone",
       tags: ["mobile", "communication", "camera"],
       ratings: [4, 5, 3, 4, 5],
       features: [
         {name: "camera", megapixels: 12},
         {name: "storage", gb: 128}
       ]
     },
     {
       name: "Tablet", 
       tags: ["mobile", "entertainment"],
       ratings: [4, 4, 5],
       features: [
         {name: "screen", inches: 10.1},
         {name: "storage", gb: 64}
       ]
     }
   ])
   
   // Array element queries
   db.products.find({tags: "mobile"})
   db.products.find({ratings: 5})
   
   // Array size
   db.products.find({tags: {$size: 3}})
   
   // All elements match
   db.products.find({tags: {$all: ["mobile", "camera"]}})
   
   // Element match for objects
   db.products.find({
     features: {$elemMatch: {name: "storage", gb: {$gte: 100}}}
   })
   ```

3. **Regular Expression Queries**
   ```javascript
   // Case-insensitive search
   db.products.find({name: /mouse/i})
   
   // Pattern matching
   db.products.find({name: /^Product/})  // Starts with "Product"
   db.products.find({name: /\d+$/})      // Ends with digits
   
   // Using $regex operator
   db.products.find({
     name: {$regex: "wireless", $options: "i"}
   })
   
   // Complex patterns
   db.products.find({
     name: {$regex: "^(Gaming|Wireless)", $options: "i"}
   })
   ```

#### Part C: Result Formatting and Cursor Operations (10 minutes)
1. **Projection and Field Selection**
   ```javascript
   // Include specific fields
   db.products.find({}, {name: 1, price: 1})
   
   // Exclude _id
   db.products.find({}, {name: 1, price: 1, _id: 0})
   
   // Exclude specific fields
   db.products.find({}, {specifications: 0, tags: 0})
   
   // Nested field projection
   db.products.find({}, {"specifications.processor": 1, name: 1})
   
   // Array element projection
   db.products.find({}, {name: 1, "tags.$": 1})
   ```

2. **Sorting, Limiting, and Skipping**
   ```javascript
   // Sort by single field
   db.products.find().sort({price: 1})     // Ascending
   db.products.find().sort({price: -1})    // Descending
   
   // Sort by multiple fields
   db.products.find().sort({category: 1, price: -1})
   
   // Limit results
   db.products.find().limit(5)
   
   // Skip documents (pagination)
   db.products.find().skip(10).limit(5)
   
   // Combine operations
   db.products.find({category: "Electronics"})
     .sort({price: -1})
     .limit(3)
     .pretty()
   ```

3. **Cursor Methods and Iteration**
   ```javascript
   // Cursor iteration
   var cursor = db.products.find({category: "Electronics"})
   while (cursor.hasNext()) {
     var doc = cursor.next()
     print("Product: " + doc.name + ", Price: $" + doc.price)
   }
   
   // forEach iteration
   db.products.find({category: "Electronics"}).forEach(
     function(doc) {
       print(doc.name + " costs $" + doc.price)
     }
   )
   
   // Convert to array
   var productsArray = db.products.find({price: {$lt: 100}}).toArray()
   print("Found " + productsArray.length + " products under $100")
   
   // Cursor information
   var cursor = db.products.find()
   print("Cursor has next: " + cursor.hasNext())
   print("Cursor size: " + cursor.size())
   print("Cursor count: " + cursor.count())
   ```

### Challenge Exercise
Build a comprehensive product search system that supports:
- Text-based product name searches (case-insensitive)
- Price range filtering
- Category and tag-based filtering
- Sorting by multiple criteria
- Pagination with configurable page sizes
- Result statistics (total matches, average price, etc.)

---

## Lab 5: CRUD Operations - Update and Delete Operations (45 minutes)

### Learning Objectives
- Master updateOne(), updateMany(), and replaceOne() methods
- Understand update operators and their use cases
- Handle upsert operations and update options
- Master deleteOne() and deleteMany() operations safely

### Tasks

#### Part A: Basic Update Operations (20 minutes)
1. **Single Document Updates**
   ```javascript
   use ecommerce
   
   // Update using $set operator
   db.products.updateOne(
     {name: "Wireless Mouse"},
     {$set: {price: 24.99, lastUpdated: new Date()}}
   )
   
   // Update nested fields
   db.products.updateOne(
     {name: "Laptop"},
     {
       $set: {
         "specifications.ram": "32GB",
         "specifications.graphics": "RTX 4060"
       }
     }
   )
   
   // Unset (remove) fields
   db.products.updateOne(
     {name: "Gaming Mouse"},
     {$unset: {discontinued: "", oldPrice: ""}}
   )
   
   // Increment/decrement values
   db.products.updateOne(
     {name: "Wireless Mouse"},
     {$inc: {quantity: -5, viewCount: 1}}
   )
   ```

2. **Multiple Document Updates**
   ```javascript
   // Update all documents in category
   db.products.updateMany(
     {category: "Electronics"},
     {
       $set: {
         lastCategoryUpdate: new Date(),
         featured: false
       }
     }
   )
   
   // Conditional updates with complex criteria
   db.products.updateMany(
     {
       price: {$lt: 50},
       inStock: true
     },
     {
       $set: {priceCategory: "budget"},
       $inc: {popularity: 1}
     }
   )
   
   // Bulk price adjustments
   db.products.updateMany(
     {category: "Electronics"},
     {$mul: {price: 0.9}}  // 10% discount
   )
   ```

3. **Array Update Operations**
   ```javascript
   // Add elements to arrays
   db.products.updateOne(
     {name: "Smartphone"},
     {$push: {tags: "5G"}}
   )
   
   // Add multiple elements
   db.products.updateOne(
     {name: "Smartphone"},
     {$push: {tags: {$each: ["waterproof", "wireless-charging"]}}}
   )
   
   // Remove elements from arrays
   db.products.updateOne(
     {name: "Smartphone"},
     {$pull: {tags: "old-tag"}}
   )
   
   // Remove multiple elements
   db.products.updateOne(
     {name: "Smartphone"},
     {$pullAll: {ratings: [1, 2]}}  // Remove poor ratings
   )
   
   // Add to set (avoid duplicates)
   db.products.updateOne(
     {name: "Smartphone"},
     {$addToSet: {tags: "premium"}}
   )
   
   // Pop elements (remove first/last)
   db.products.updateOne(
     {name: "Smartphone"},
     {$pop: {ratings: 1}}  // Remove last rating
   )
   ```

#### Part B: Advanced Update Techniques (15 minutes)
1. **Upsert Operations**
   ```javascript
   // Upsert: update if exists, insert if not
   db.products.updateOne(
     {sku: "NEW-SKU-001"},
     {
       $set: {
         name: "New Product",
         price: 199.99,
         category: "New Category"
       },
       $setOnInsert: {
         createdAt: new Date(),
         version: 1
       }
     },
     {upsert: true}
   )
   
   // Conditional upsert with complex logic
   db.inventory.updateOne(
     {productId: "PROD-123", location: "warehouse-A"},
     {
       $inc: {quantity: 50},
       $setOnInsert: {
         productId: "PROD-123",
         location: "warehouse-A",
         createdAt: new Date()
       }
     },
     {upsert: true}
   )
   ```

2. **Replace Operations**
   ```javascript
   // Replace entire document (except _id)
   db.products.replaceOne(
     {_id: "MOUSE-001"},
     {
       name: "Completely New Mouse",
       price: 39.99,
       category: "Gaming",
       specifications: {
         dpi: "16000",
         buttons: 8
       },
       updatedAt: new Date()
     }
   )
   
   // Conditional replacement
   var existingDoc = db.products.findOne({name: "Laptop"})
   if (existingDoc) {
     existingDoc.name = "Updated Laptop"
     existingDoc.price = 1199.99
     existingDoc.lastModified = new Date()
     db.products.replaceOne({_id: existingDoc._id}, existingDoc)
   }
   ```

3. **Update with Array Filters**
   ```javascript
   // Update specific array elements
   db.products.insertOne({
     name: "Multi-Variant Product",
     variants: [
       {size: "S", price: 29.99, inStock: true},
       {size: "M", price: 32.99, inStock: false},
       {size: "L", price: 34.99, inStock: true}
     ]
   })
   
   // Update specific variant
   db.products.updateOne(
     {name: "Multi-Variant Product"},
     {$set: {"variants.$[elem].inStock": true}},
     {arrayFilters: [{"elem.size": "M"}]}
   )
   
   // Update multiple array elements
   db.products.updateOne(
     {name: "Multi-Variant Product"},
     {$inc: {"variants.$[elem].price": 5}},
     {arrayFilters: [{"elem.price": {$lt: 35}}]}
   )
   ```

#### Part C: Delete Operations and Safety (10 minutes)
1. **Safe Deletion Practices**
   ```javascript
   // Always test with find first
   db.products.find({price: {$lt: 10}})
   
   // Count before deletion
   var countToDelete = db.products.countDocuments({price: {$lt: 10}})
   print("Will delete " + countToDelete + " documents")
   
   // Delete single document
   db.products.deleteOne({price: {$lt: 10}})
   
   // Delete with specific _id for safety
   db.products.deleteOne({_id: "MOUSE-001"})
   ```

2. **Bulk Deletion Operations**
   ```javascript
   // Delete multiple documents
   var deleteResult = db.products.deleteMany({
     category: "Discontinued",
     inStock: false
   })
   print("Deleted " + deleteResult.deletedCount + " documents")
   
   // Delete with complex criteria
   db.products.deleteMany({
     $and: [
       {createdAt: {$lt: new Date("2023-01-01")}},
       {quantity: 0},
       {category: {$in: ["Obsolete", "Deprecated"]}}
     ]
   })
   
   // Conditional deletion with verification
   var oldProducts = db.products.find({
     createdAt: {$lt: new Date("2020-01-01")}
   }).count()
   
   if (oldProducts > 0) {
     print("Found " + oldProducts + " old products to delete")
     // Uncomment to actually delete:
     // db.products.deleteMany({createdAt: {$lt: new Date("2020-01-01")}})
   }
   ```

3. **Cleanup and Maintenance Operations**
   ```javascript
   // Remove all documents from collection (keeping collection)
   db.temp_data.deleteMany({})
   
   // Drop entire collection
   db.obsolete_collection.drop()
   
   // Bulk cleanup with reporting
   var categories = ["Obsolete", "Discontinued", "Expired"]
   categories.forEach(function(category) {
     var count = db.products.countDocuments({category: category})
     if (count > 0) {
       var result = db.products.deleteMany({category: category})
       print("Removed " + result.deletedCount + " products from " + category)
     }
   })
   
   // Archive before delete pattern
   var archiveCount = db.products.find({
     status: "archived",
     archivedDate: {$lt: new Date(Date.now() - 365*24*60*60*1000)}
   }).count()
   
   if (archiveCount > 0) {
     // First copy to archive collection
     db.products.find({
       status: "archived",
       archivedDate: {$lt: new Date(Date.now() - 365*24*60*60*1000)}
     }).forEach(function(doc) {
       db.archived_products.insertOne(doc)
     })
     
     // Then delete from main collection
     db.products.deleteMany({
       status: "archived",
       archivedDate: {$lt: new Date(Date.now() - 365*24*60*60*1000)}
     })
   }
   ```

### Challenge Exercise
Implement a complete product lifecycle management system that includes:
- Product creation with validation
- Inventory updates with transaction-like safety
- Bulk price adjustments with rollback capability
- Archive and cleanup procedures
- Audit trail for all modifications
- Error handling and reporting for all operations

---

## Additional Resources and Best Practices

### Command Reference Card
```javascript
// Essential Commands Summary
show dbs                    // List databases
use <database>             // Switch database
show collections           // List collections
db.stats()                 // Database statistics
db.<collection>.find()     // Query documents
db.<collection>.insertOne()  // Insert single document
db.<collection>.updateOne()  // Update single document
db.<collection>.deleteOne()  // Delete single document
db.<collection>.countDocuments()  // Count documents
```

### Safety Guidelines
1. **Always test queries with `find()` before `update()` or `delete()`**
2. **Use `countDocuments()` to verify affected document count**
3. **Start with `updateOne()` and `deleteOne()` for testing**
4. **Create backups before bulk operations**
5. **Use transactions for related multi-document operations**

### Performance Tips
1. **Create indexes on frequently queried fields**
2. **Use projection to limit returned fields**
3. **Limit result sets with `limit()` for large queries**
4. **Use appropriate data types for optimal storage**
5. **Monitor query performance with `explain()`**

### Common Patterns
```javascript
// Pagination pattern
db.products.find().skip(page * pageSize).limit(pageSize)

// Search pattern
db.products.find({name: {$regex: searchTerm, $options: "i"}})

// Range query pattern
db.products.find({price: {$gte: minPrice, $lte: maxPrice}})

// Update with timestamp pattern
db.products.updateOne(filter, {
  $set: updateFields,
  $currentDate: {lastModified: true}
})
```

### Homework Assignment
Design and implement a complete command-line based inventory management system using only MongoDB shell commands. The system should support:
- Product catalog management
- Stock level tracking
- Order processing simulation
- Reporting and analytics queries
- Data maintenance and cleanup procedures

Document all commands used and create a user manual for your system.