# Day 2: Mastering MongoDB - Lab Sessions
*5 hands-on labs, 45 minutes each*

---

## Lab 1: Advanced Querying and Aggregation Framework (45 minutes)

### Learning Objectives
- Master complex query operations using MongoDB operators
- Build aggregation pipelines for data analysis
- Understand performance implications of different query patterns

### Prerequisites
- Sample e-commerce database with collections: `products`, `orders`, `customers`, `reviews`

### Tasks

#### Part A: Complex Queries (20 minutes)
1. **Multi-field Text Search**
   ```javascript
   // Find products with text search across name and description
   db.products.find({
     $text: { $search: "wireless bluetooth" }
   }).sort({ score: { $meta: "textScore" } })
   ```

2. **Geo-spatial Queries**
   ```javascript
   // Find stores within 10km of a location
   db.stores.find({
     location: {
       $near: {
         $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] },
         $maxDistance: 10000
       }
     }
   })
   ```

3. **Array Operations**
   ```javascript
   // Find products with specific tags and price range
   db.products.find({
     tags: { $all: ["electronics", "mobile"] },
     price: { $gte: 100, $lte: 500 },
     "reviews.rating": { $elemMatch: { $gte: 4 } }
   })
   ```

#### Part B: Aggregation Pipeline (25 minutes)
1. **Sales Analysis Pipeline**
   ```javascript
   db.orders.aggregate([
     { $match: { status: "completed", orderDate: { $gte: new Date("2024-01-01") } } },
     { $unwind: "$items" },
     { $group: {
       _id: "$items.productId",
       totalQuantity: { $sum: "$items.quantity" },
       totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
     }},
     { $lookup: {
       from: "products",
       localField: "_id",
       foreignField: "_id",
       as: "product"
     }},
     { $sort: { totalRevenue: -1 } },
     { $limit: 10 }
   ])
   ```

2. **Customer Segmentation**
   ```javascript
   db.customers.aggregate([
     { $lookup: {
       from: "orders",
       localField: "_id",
       foreignField: "customerId",
       as: "orders"
     }},
     { $addFields: {
       totalSpent: { $sum: "$orders.total" },
       orderCount: { $size: "$orders" }
     }},
     { $bucket: {
       groupBy: "$totalSpent",
       boundaries: [0, 100, 500, 1000, 5000],
       default: "5000+",
       output: {
         count: { $sum: 1 },
         avgOrderValue: { $avg: "$totalSpent" }
       }
     }}
   ])
   ```

### Challenge Exercise
Create a pipeline that finds the top 5 customers by total spending in each city, including their average order value and most frequently purchased product category.

---

## Lab 2: Data Modeling and Schema Design (45 minutes)

### Learning Objectives
- Design efficient schemas for different use cases
- Understand embedding vs referencing trade-offs
- Implement schema validation

### Tasks

#### Part A: Schema Design Patterns (25 minutes)
1. **Blog Platform Schema**
   Design collections for a blog platform with posts, comments, authors, and tags:
   ```javascript
   // Posts collection with embedded comments
   {
     _id: ObjectId("..."),
     title: "MongoDB Best Practices",
     content: "...",
     author: {
       _id: ObjectId("..."),
       name: "John Doe",
       email: "john@example.com"
     },
     tags: ["mongodb", "database", "nosql"],
     comments: [
       {
         _id: ObjectId("..."),
         author: "Jane Smith",
         content: "Great post!",
         createdAt: ISODate("...")
       }
     ],
     publishedAt: ISODate("..."),
     views: 1250
   }
   ```

2. **E-commerce Inventory System**
   ```javascript
   // Product with variants pattern
   {
     _id: ObjectId("..."),
     name: "iPhone 15",
     brand: "Apple",
     category: "Electronics",
     variants: [
       {
         sku: "IP15-128-BLK",
         color: "Black",
         storage: "128GB",
         price: 799,
         inventory: {
           quantity: 50,
           reserved: 5,
           available: 45
         }
       }
     ],
     specifications: {
       display: "6.1 inch",
       processor: "A17 Bionic"
     }
   }
   ```

#### Part B: Schema Validation (20 minutes)
1. **Create Validation Rules**
   ```javascript
   db.createCollection("users", {
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["email", "username", "createdAt"],
         properties: {
           email: {
             bsonType: "string",
             pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
           },
           username: {
             bsonType: "string",
             minLength: 3,
             maxLength: 20
           },
           age: {
             bsonType: "int",
             minimum: 13,
             maximum: 120
           },
           preferences: {
             bsonType: "object",
             properties: {
               newsletter: { bsonType: "bool" },
               notifications: { bsonType: "bool" }
             }
           }
         }
       }
     }
   })
   ```

### Challenge Exercise
Design a social media platform schema that supports posts, friendships, groups, and real-time messaging. Consider cardinality, query patterns, and growth scalability.

---

## Lab 3: Indexing Strategies and Performance Optimization (45 minutes)

### Learning Objectives
- Create and optimize indexes for different query patterns
- Analyze query performance using explain plans
- Understand index types and their use cases

### Tasks

#### Part A: Index Creation and Analysis (25 minutes)
1. **Compound Indexes**
   ```javascript
   // Create compound index for common query pattern
   db.orders.createIndex({ 
     "customerId": 1, 
     "status": 1, 
     "orderDate": -1 
   })
   
   // Analyze index usage
   db.orders.find({ 
     customerId: ObjectId("..."), 
     status: "pending" 
   }).sort({ orderDate: -1 }).explain("executionStats")
   ```

2. **Text Indexes**
   ```javascript
   // Create text index with weights
   db.products.createIndex({
     "name": "text",
     "description": "text",
     "tags": "text"
   }, {
     weights: {
       name: 10,
       description: 5,
       tags: 1
     },
     name: "product_text_index"
   })
   ```

3. **Partial Indexes**
   ```javascript
   // Index only active products
   db.products.createIndex(
     { "category": 1, "price": 1 },
     { partialFilterExpression: { "status": "active" } }
   )
   ```

#### Part B: Performance Analysis (20 minutes)
1. **Query Performance Comparison**
   ```javascript
   // Before index
   db.orders.find({ customerId: ObjectId("...") }).explain("executionStats")
   
   // Create index
   db.orders.createIndex({ customerId: 1 })
   
   // After index
   db.orders.find({ customerId: ObjectId("...") }).explain("executionStats")
   ```

2. **Index Intersection**
   ```javascript
   // Create separate single-field indexes
   db.products.createIndex({ category: 1 })
   db.products.createIndex({ price: 1 })
   
   // Query using both fields
   db.products.find({ 
     category: "Electronics", 
     price: { $gte: 100, $lte: 500 } 
   }).explain("executionStats")
   ```

### Challenge Exercise
Optimize a slow-running aggregation pipeline by creating appropriate indexes. Use the profiler to identify bottlenecks and measure improvement.

---

## Lab 4: Transactions and Data Consistency (45 minutes)

### Learning Objectives
- Implement multi-document ACID transactions
- Handle transaction errors and retries
- Understand consistency models in distributed systems

### Tasks

#### Part A: Basic Transactions (20 minutes)
1. **Bank Transfer Transaction**
   ```javascript
   const session = db.getMongo().startSession()
   
   try {
     session.startTransaction()
     
     // Debit from source account
     db.accounts.updateOne(
       { accountNumber: "12345" },
       { $inc: { balance: -100 } },
       { session }
     )
     
     // Credit to destination account
     db.accounts.updateOne(
       { accountNumber: "67890" },
       { $inc: { balance: 100 } },
       { session }
     )
     
     // Record transaction
     db.transactions.insertOne({
       from: "12345",
       to: "67890",
       amount: 100,
       timestamp: new Date(),
       type: "transfer"
     }, { session })
     
     session.commitTransaction()
     print("Transfer completed successfully")
     
   } catch (error) {
     session.abortTransaction()
     print("Transfer failed: " + error)
   } finally {
     session.endSession()
   }
   ```

2. **E-commerce Order Processing**
   ```javascript
   function processOrder(customerId, items) {
     const session = db.getMongo().startSession()
     
     try {
       session.startTransaction()
       
       // Create order
       const orderResult = db.orders.insertOne({
         customerId: customerId,
         items: items,
         status: "processing",
         createdAt: new Date(),
         total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
       }, { session })
       
       // Update inventory
       for (let item of items) {
         const updateResult = db.products.updateOne(
           { 
             _id: item.productId,
             "inventory.available": { $gte: item.quantity }
           },
           { 
             $inc: { 
               "inventory.available": -item.quantity,
               "inventory.reserved": item.quantity
             }
           },
           { session }
         )
         
         if (updateResult.matchedCount === 0) {
           throw new Error(`Insufficient inventory for product ${item.productId}`)
         }
       }
       
       session.commitTransaction()
       return orderResult.insertedId
       
     } catch (error) {
       session.abortTransaction()
       throw error
     } finally {
       session.endSession()
     }
   }
   ```

#### Part B: Advanced Transaction Patterns (25 minutes)
1. **Retry Logic for Transient Errors**
   ```javascript
   function executeWithRetry(operation, maxRetries = 3) {
     let attempts = 0
     
     while (attempts < maxRetries) {
       try {
         return operation()
       } catch (error) {
         attempts++
         
         if (error.hasErrorLabel('TransientTransactionError') && attempts < maxRetries) {
           print(`Transient error, retrying... (${attempts}/${maxRetries})`)
           sleep(Math.pow(2, attempts) * 100) // Exponential backoff
           continue
         }
         
         throw error
       }
     }
   }
   ```

2. **Read Concerns and Write Concerns**
   ```javascript
   // Strong consistency read
   db.accounts.find({ accountNumber: "12345" })
     .readConcern("majority")
     .readPreference("primary")
   
   // Acknowledged write with journal
   db.accounts.updateOne(
     { accountNumber: "12345" },
     { $inc: { balance: -50 } },
     { writeConcern: { w: "majority", j: true } }
   )
   ```

### Challenge Exercise
Implement a reservation system for event tickets that handles concurrent bookings, prevents overbooking, and includes automatic timeout for unpaid reservations.

---

## Lab 5: Replica Sets and Sharding (45 minutes)

### Learning Objectives
- Configure replica sets for high availability
- Implement horizontal scaling with sharding
- Monitor and troubleshoot distributed MongoDB clusters

### Tasks

#### Part A: Replica Set Configuration (20 minutes)
1. **Initialize Replica Set**
   ```javascript
   // Initialize replica set
   rs.initiate({
     _id: "myReplicaSet",
     members: [
       { _id: 0, host: "mongodb-primary:27017", priority: 2 },
       { _id: 1, host: "mongodb-secondary1:27017", priority: 1 },
       { _id: 2, host: "mongodb-secondary2:27017", priority: 1 },
       { _id: 3, host: "mongodb-arbiter:27017", arbiterOnly: true }
     ]
   })
   ```

2. **Read Preference Configuration**
   ```javascript
   // Configure read preferences for different scenarios
   
   // Critical reads - primary only
   db.accounts.find({ accountNumber: "12345" })
     .readPref("primary")
   
   // Analytics reads - secondary preferred
   db.analytics.aggregate([...])
     .readPref("secondaryPreferred")
   
   // Reporting - secondary with tags
   db.reports.find({})
     .readPref("secondary", [{ "datacenter": "west" }])
   ```

#### Part B: Sharding Setup (25 minutes)
1. **Shard Key Selection and Collection Sharding**
   ```javascript
   // Enable sharding on database
   sh.enableSharding("ecommerce")
   
   // Shard orders collection by customerId
   sh.shardCollection("ecommerce.orders", { "customerId": 1 })
   
   // Shard products collection with compound key
   sh.shardCollection("ecommerce.products", { 
     "category": 1, 
     "_id": 1 
   })
   
   // Hash-based sharding for user sessions
   sh.shardCollection("ecommerce.sessions", { 
     "userId": "hashed" 
   })
   ```

2. **Zone Sharding (Geographic Distribution)**
   ```javascript
   // Add shards to zones
   sh.addShardToZone("shard-us", "US")
   sh.addShardToZone("shard-eu", "EU")
   sh.addShardToZone("shard-asia", "ASIA")
   
   // Define zone ranges for orders collection
   sh.updateZoneKeyRange(
     "ecommerce.orders",
     { region: "US", customerId: MinKey },
     { region: "US", customerId: MaxKey },
     "US"
   )
   
   sh.updateZoneKeyRange(
     "ecommerce.orders",
     { region: "EU", customerId: MinKey },
     { region: "EU", customerId: MaxKey },
     "EU"
   )
   ```

3. **Monitoring and Balancing**
   ```javascript
   // Check sharding status
   sh.status()
   
   // Monitor chunk distribution
   db.adminCommand("shardDistribution")
   
   // Check balancer status
   sh.getBalancerState()
   sh.isBalancerRunning()
   
   // Manual chunk operations if needed
   sh.splitFind("ecommerce.orders", { customerId: ObjectId("...") })
   ```

### Challenge Exercise
Design a sharding strategy for a multi-tenant SaaS application with the following requirements:
- Tenant isolation (data from different tenants should not mix)
- Balanced load distribution
- Efficient cross-tenant analytics queries
- Geographic data locality for compliance

---

## Additional Resources and Next Steps

### Performance Monitoring Commands
```javascript
// Enable profiler for slow operations
db.setProfilingLevel(1, { slowms: 100 })

// Check current operations
db.currentOp()

// Database statistics
db.stats()

// Collection statistics
db.orders.stats()
```

### Best Practices Summary
1. **Indexing**: Create indexes that match your query patterns
2. **Schema Design**: Embed for 1:1 and 1:few, reference for 1:many
3. **Transactions**: Use sparingly, only when ACID properties are required
4. **Sharding**: Choose shard keys that provide even distribution
5. **Replica Sets**: Use appropriate read preferences for your use case

### Homework Assignment
Design and implement a complete MongoDB solution for a real-time chat application with the following features:
- User authentication and profiles
- Chat rooms and direct messages
- Message history and search
- Online presence tracking
- File attachments support

Include schema design, indexing strategy, and scalability considerations for 1M+ concurrent users.