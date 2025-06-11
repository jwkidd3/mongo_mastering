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
  tags: { $in: ['programming', 'javascript'] },
  "reviews.average": { $gte: 1 },  // Dot notation instead of $elemMatch
  price: { $gte: 4, $lte: 5000 }
  })
   ```


#### Part B: Aggregation Pipeline (25 minutes)
1. **Sales Analysis Pipeline**
   ```javascript
   db.orders.aggregate([
     { $match: { status: "shipped", orderDate: { $gte: new Date("2024-01-01") } } },
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
   };
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
