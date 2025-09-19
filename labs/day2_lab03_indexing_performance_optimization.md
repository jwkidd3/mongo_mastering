# Lab 3: Indexing Strategies and Performance Optimization (45 minutes)

## Learning Objectives
- Create and optimize indexes for different query patterns
- Analyze query performance using explain plans
- Understand index types and their use cases

## Tasks

### Part A: Index Creation and Analysis (25 minutes)
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

### Part B: Performance Analysis (20 minutes)
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

## Challenge Exercise
Optimize a slow-running aggregation pipeline by creating appropriate indexes. Use the profiler to identify bottlenecks and measure improvement.