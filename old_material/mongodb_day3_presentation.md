# Day 3: Mastering MongoDB
## Advanced Operations & Performance Optimization

---

## Session Overview

**Duration:** 3-4 hours  
**Prerequisites:** Basic MongoDB operations, document structure understanding  
**Learning Objectives:**
- Master advanced querying techniques
- Implement effective indexing strategies
- Understand aggregation framework
- Optimize performance and troubleshoot issues
- Explore data modeling best practices

---

## 1. Advanced Querying Techniques

### Complex Query Operators

**Array Operations**
```javascript
// Find documents with specific array elements
db.products.find({ tags: { $in: ["electronics", "mobile"] } })

// Array size queries
db.products.find({ tags: { $size: 3 } })

// All elements match condition
db.products.find({ ratings: { $all: [4, 5] } })

// Element match for array of objects
db.users.find({ 
  "addresses": { 
    $elemMatch: { 
      "city": "New York", 
      "type": "home" 
    } 
  } 
})
```

**Text Search**
```javascript
// Create text index
db.articles.createIndex({ title: "text", content: "text" })

// Basic text search
db.articles.find({ $text: { $search: "mongodb database" } })

// Text search with scores
db.articles.find(
  { $text: { $search: "mongodb" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

**Geospatial Queries**
```javascript
// Create 2dsphere index
db.locations.createIndex({ coordinates: "2dsphere" })

// Find nearby locations
db.locations.find({
  coordinates: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] },
      $maxDistance: 1000
    }
  }
})

// Find within polygon
db.locations.find({
  coordinates: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [[
          [-74, 40.5], [-74, 41], [-73, 41], [-73, 40.5], [-74, 40.5]
        ]]
      }
    }
  }
})
```

---

## 2. Indexing Strategies

### Index Types and Performance

**Single Field Indexes**
```javascript
// Basic index
db.users.createIndex({ email: 1 })

// Sparse index (only indexes non-null values)
db.users.createIndex({ phone: 1 }, { sparse: true })

// Unique index
db.users.createIndex({ username: 1 }, { unique: true })
```

**Compound Indexes**
```javascript
// Order matters for compound indexes
db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 })

// Index prefix rule - this index supports:
// { userId: 1 }
// { userId: 1, status: 1 }
// { userId: 1, status: 1, createdAt: -1 }
```

**Index Performance Analysis**
```javascript
// Explain query execution
db.users.find({ email: "john@example.com" }).explain("executionStats")

// Index usage statistics
db.users.aggregate([{ $indexStats: {} }])

// Find unused indexes
db.runCommand({ planCacheClear: "users" })
```

### Index Best Practices

**ESR Rule (Equality, Sort, Range)**
```javascript
// Query: Find active users, sort by creation date, filter by age range
db.users.find({ 
  status: "active",     // Equality
  age: { $gte: 25, $lte: 65 }  // Range
}).sort({ createdAt: -1 })     // Sort

// Optimal index follows ESR rule:
db.users.createIndex({ 
  status: 1,      // Equality first
  createdAt: -1,  // Sort second
  age: 1          // Range last
})
```

---

## 3. Aggregation Framework Deep Dive

### Pipeline Stages Mastery

**Advanced Matching and Grouping**
```javascript
// Complex aggregation pipeline
db.sales.aggregate([
  // Stage 1: Match documents
  { $match: { 
    date: { $gte: ISODate("2024-01-01") },
    status: "completed"
  }},
  
  // Stage 2: Add computed fields
  { $addFields: {
    month: { $month: "$date" },
    totalValue: { $multiply: ["$quantity", "$price"] }
  }},
  
  // Stage 3: Group and calculate
  { $group: {
    _id: { month: "$month", category: "$category" },
    totalSales: { $sum: "$totalValue" },
    avgOrderValue: { $avg: "$totalValue" },
    orderCount: { $sum: 1 },
    topProduct: { $first: "$product" }
  }},
  
  // Stage 4: Sort results
  { $sort: { totalSales: -1 } },
  
  // Stage 5: Limit results
  { $limit: 10 }
])
```

**Advanced Operators**
```javascript
// Lookup (Left Outer Join)
db.orders.aggregate([
  { $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customerInfo"
  }},
  { $unwind: "$customerInfo" },
  { $project: {
    orderTotal: 1,
    customerName: "$customerInfo.name",
    customerEmail: "$customerInfo.email"
  }}
])

// Faceted search
db.products.aggregate([
  { $facet: {
    "categoryCounts": [
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ],
    "priceRanges": [
      { $bucket: {
        groupBy: "$price",
        boundaries: [0, 100, 500, 1000],
        default: "Other",
        output: { count: { $sum: 1 } }
      }}
    ]
  }}
])
```

### Aggregation Performance Optimization

```javascript
// Use indexes in early stages
db.orders.aggregate([
  { $match: { status: "active" } },  // This can use index
  { $sort: { createdAt: -1 } },      // This can use index
  { $limit: 100 },                   // Limit early
  { $lookup: { /* ... */ } }         // Expensive operations later
])

// Pipeline optimization hints
db.orders.aggregate([
  // ... pipeline stages
], { hint: { status: 1, createdAt: -1 } })
```

---

## 4. Performance Optimization

### Query Performance Tuning

**Profiling and Monitoring**
```javascript
// Enable profiler for slow operations
db.setProfilingLevel(2, { slowms: 100 })

// View profiler data
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty()

// Database statistics
db.stats()
db.collection.stats()
```

**Connection and Read Preferences**
```javascript
// Read preferences for replica sets
db.users.find().readPref("secondary")
db.users.find().readPref("secondaryPreferred")

// Read concern levels
db.users.find().readConcern("majority")
```

### Memory and Storage Optimization

**Working Set Management**
- Keep frequently accessed data in memory
- Monitor memory usage with `db.serverStatus().mem`
- Use projections to reduce data transfer

```javascript
// Efficient projection
db.users.find(
  { status: "active" },
  { name: 1, email: 1, _id: 0 }  // Only return needed fields
)

// Avoid large documents in memory
db.posts.find({ category: "tech" }).limit(50)
```

**Connection Pooling**
```javascript
// MongoDB driver connection pool settings
const client = new MongoClient(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
```

---

## 5. Data Modeling Best Practices

### Schema Design Patterns

**Embedding vs Referencing**

**Embedding (One-to-Few)**
```javascript
// User with addresses
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  addresses: [
    {
      type: "home",
      street: "123 Main St",
      city: "New York",
      zipCode: "10001"
    },
    {
      type: "work",
      street: "456 Business Ave",
      city: "New York",
      zipCode: "10002"
    }
  ]
}
```

**Referencing (One-to-Many)**
```javascript
// Blog post with comments (referenced)
// Posts collection
{
  _id: ObjectId("..."),
  title: "MongoDB Best Practices",
  content: "...",
  authorId: ObjectId("...")
}

// Comments collection
{
  _id: ObjectId("..."),
  postId: ObjectId("..."),  // Reference to post
  author: "Jane Smith",
  content: "Great article!",
  createdAt: ISODate("...")
}
```

**Hybrid Approach**
```javascript
// Product with recent reviews embedded, older ones referenced
{
  _id: ObjectId("..."),
  name: "Laptop",
  price: 999,
  recentReviews: [
    { author: "User1", rating: 5, text: "Excellent!" },
    { author: "User2", rating: 4, text: "Good value" }
  ],
  reviewSummary: {
    average: 4.2,
    count: 157,
    lastUpdated: ISODate("...")
  }
}
```

### Advanced Schema Patterns

**Bucket Pattern**
```javascript
// Time-series data bucketing
{
  _id: ObjectId("..."),
  sensor_id: "sensor_001",
  timestamp: ISODate("2024-01-01T00:00:00Z"),
  measurements: [
    { time: ISODate("2024-01-01T00:00:00Z"), temp: 20.1, humidity: 45 },
    { time: ISODate("2024-01-01T00:01:00Z"), temp: 20.3, humidity: 46 },
    // ... more measurements in this hour bucket
  ]
}
```

**Polymorphic Pattern**
```javascript
// Different product types in same collection
{
  _id: ObjectId("..."),
  name: "Product Name",
  type: "book",
  author: "John Author",  // Book-specific field
  isbn: "978-...",       // Book-specific field
  pages: 300             // Book-specific field
}

{
  _id: ObjectId("..."),
  name: "Product Name",
  type: "electronics",
  brand: "TechCorp",     // Electronics-specific field
  warranty: "2 years",   // Electronics-specific field
  specs: { /* ... */ }   // Electronics-specific field
}
```

---

## 6. Security and Administration

### Authentication and Authorization

**User Management**
```javascript
// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "securePassword",
  roles: ["root"]
})

// Create application user with limited permissions
use myapp
db.createUser({
  user: "appUser",
  pwd: "appPassword",
  roles: [
    { role: "readWrite", db: "myapp" },
    { role: "read", db: "analytics" }
  ]
})
```

**Field-Level Security**
```javascript
// Views for data access control
db.createView("publicUserData", "users", [
  { $project: { 
    name: 1, 
    email: 1, 
    createdAt: 1,
    // Exclude sensitive fields like SSN, password hash
    _id: 0 
  }}
])
```

### Backup and Recovery

**Backup Strategies**
```bash
# Full backup with mongodump
mongodump --host localhost:27017 --db myapp --out /backup/

# Point-in-time backup with replica sets
mongodump --host replica-set/host1:27017,host2:27017 --oplog

# Restore from backup
mongorestore --host localhost:27017 --db myapp /backup/myapp/
```

---

## 7. Practical Exercises

### Exercise 1: Query Optimization
```javascript
// Given collection: orders
// Task: Find top 10 customers by order value in 2024
// Optimize the query and create appropriate indexes

// Solution approach:
// 1. Create compound index
db.orders.createIndex({ 
  customerId: 1, 
  orderDate: 1, 
  totalAmount: -1 
})

// 2. Optimized aggregation
db.orders.aggregate([
  { $match: { 
    orderDate: { 
      $gte: ISODate("2024-01-01"), 
      $lt: ISODate("2025-01-01") 
    } 
  }},
  { $group: {
    _id: "$customerId",
    totalSpent: { $sum: "$totalAmount" },
    orderCount: { $sum: 1 }
  }},
  { $sort: { totalSpent: -1 } },
  { $limit: 10 }
])
```

### Exercise 2: Schema Design Challenge
Design a schema for a social media platform with:
- Users with profiles and settings
- Posts with comments and likes
- Following/follower relationships
- Real-time notifications

Consider:
- Read vs write patterns
- Data growth expectations
- Query requirements
- Performance constraints

---

## 8. Troubleshooting Common Issues

### Performance Problems

**Slow Queries**
1. Check for missing indexes: `db.collection.find().explain()`
2. Analyze query patterns in profiler
3. Consider compound indexes for multi-field queries
4. Use projections to limit data transfer

**Memory Issues**
1. Monitor working set size
2. Implement appropriate indexes
3. Use aggregation pipelines efficiently
4. Consider data archiving strategies

**Connection Problems**
1. Check connection pool settings
2. Monitor connection count
3. Implement proper error handling
4. Use connection timeouts appropriately

---

## Key Takeaways

**Performance Optimization**
- Index strategy is crucial for query performance
- Use the aggregation framework for complex data processing
- Monitor and profile regularly
- Design schemas based on query patterns

**Best Practices**
- Follow ESR rule for compound indexes
- Embed for one-to-few, reference for one-to-many
- Use appropriate read/write concerns
- Implement proper error handling

**Production Readiness**
- Set up monitoring and alerting
- Implement backup and recovery procedures
- Use replica sets for high availability
- Plan for scaling (sharding if needed)

---

## Next Steps

**Day 4 Preview: Advanced Topics**
- Replica Sets and Sharding
- Change Streams and Real-time Applications
- MongoDB Atlas and Cloud Deployment
- Integration Patterns and Microservices

**Recommended Practice**
1. Implement the exercises in your development environment
2. Profile and optimize existing queries
3. Review and refactor current schema designs
4. Set up monitoring for your MongoDB instances

---

## Additional Resources

- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Aggregation Pipeline Optimization](https://docs.mongodb.com/manual/core/aggregation-pipeline-optimization/)
- [Index Strategies](https://docs.mongodb.com/manual/applications/indexes/)
- [Schema Design Patterns](https://www.mongodb.com/blog/post/building-with-patterns-a-summary)