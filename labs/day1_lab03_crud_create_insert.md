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
     category: "Computers",
     name: "Custom ID Product",
     price: 199.99
   })

   // Verify insertion with different data types
   db.products.insertOne({
     name: "Multi-Type Product",
     category: "Electronics",
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

### Part B: Multiple Document Insertion (20 minutes)
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

### Part C: Error Handling and Validation (10 minutes)
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
     {name: "Acknowledged Product", price: 99.99,category: "Electronics"},
     {writeConcern: {w: 1, j: true}}
   )

   // Batch insert with write concern
   db.products.insertMany([
     {name: "Batch Product 1", price: 19.99,category: "Electronics"},
     {name: "Batch Product 2", price: 29.99,category: "Electronics"}
   ], {writeConcern: {w: "majority"}})
   ```

## Challenge Exercise
Create a realistic e-commerce product catalog with 5000 products across multiple categories. Include proper data types, nested documents for specifications, arrays for tags, and implement error handling for edge cases. Measure and report insertion performance.