# MongoDB Day 2: Advanced Querying and Performance
## Mastering MongoDB Course

---

## Session Overview

### Learning Objectives
By the end of Day 2, participants will:
- Master MongoDB's aggregation framework
- Understand and implement indexing strategies
- Design efficient query patterns
- Optimize MongoDB performance
- Apply schema design best practices

### Session Agenda
1. **Advanced Querying Techniques** (45 minutes)
2. **MongoDB Aggregation Framework** (60 minutes)
3. **Indexing Fundamentals** (45 minutes)
4. **Performance Optimization** (45 minutes)
5. **Schema Design Patterns** (45 minutes)

---

## Part 1: Advanced Querying Techniques
*Duration: 45 minutes*

### Query Operators Deep Dive

#### Comparison Operators
```javascript
// Greater than, less than
db.products.find({price: {$gt: 100, $lt: 500}})

// In/Not in arrays
db.products.find({category: {$in: ["Electronics", "Books"]}})
db.products.find({status: {$nin: ["discontinued", "out-of-stock"]}})

// Exists and type checking
db.products.find({description: {$exists: true}})
db.products.find({price: {$type: "number"}})
```

#### Array Query Operators
```javascript
// All elements match
db.products.find({tags: {$all: ["wireless", "bluetooth"]}})

// Array size
db.products.find({reviews: {$size: 5}})

// Element match in arrays of objects
db.products.find({
  reviews: {
    $elemMatch: {
      rating: {$gte: 4},
      verified: true
    }
  }
})
```

#### Text Search Capabilities
```javascript
// Create text index
db.products.createIndex({name: "text", description: "text"})

// Text search
db.products.find({$text: {$search: "laptop gaming"}})

// Text search with score
db.products.find(
  {$text: {$search: "wireless mouse"}},
  {score: {$meta: "textScore"}}
).sort({score: {$meta: "textScore"}})
```

### Regular Expressions
```javascript
// Case-insensitive pattern matching
db.products.find({name: {$regex: /^laptop/i}})

// Complex patterns
db.users.find({email: {$regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/}})
```

### Geospatial Queries
```javascript
// Create 2dsphere index
db.stores.createIndex({location: "2dsphere"})

// Find nearby locations
db.stores.find({
  location: {
    $near: {
      $geometry: {type: "Point", coordinates: [-73.9857, 40.7484]},
      $maxDistance: 1000
    }
  }
})

// Find within polygon
db.stores.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.0, 40.7], [-74.0, 40.8],
          [-73.9, 40.8], [-73.9, 40.7],
          [-74.0, 40.7]
        ]]
      }
    }
  }
})
```

---

## Part 2: MongoDB Aggregation Framework
*Duration: 60 minutes*

### Aggregation Pipeline Concept

The aggregation pipeline processes documents through multiple stages, transforming data step by step.

```
Input Documents → Stage 1 → Stage 2 → Stage 3 → Output
```

### Core Pipeline Stages

#### $match - Filtering Documents
```javascript
db.orders.aggregate([
  {$match: {status: "completed", orderDate: {$gte: ISODate("2024-01-01")}}}
])
```

#### $project - Selecting and Reshaping Fields
```javascript
db.orders.aggregate([
  {$project: {
    customerName: 1,
    totalAmount: 1,
    year: {$year: "$orderDate"},
    discountPercent: {
      $multiply: [
        {$divide: ["$discount", "$subtotal"]}, 
        100
      ]
    }
  }}
])
```

#### $group - Aggregating Data
```javascript
// Group by category and calculate statistics
db.products.aggregate([
  {$group: {
    _id: "$category",
    totalProducts: {$sum: 1},
    averagePrice: {$avg: "$price"},
    maxPrice: {$max: "$price"},
    minPrice: {$min: "$price"}
  }}
])

// Group by multiple fields
db.orders.aggregate([
  {$group: {
    _id: {
      year: {$year: "$orderDate"},
      month: {$month: "$orderDate"}
    },
    totalRevenue: {$sum: "$totalAmount"},
    orderCount: {$sum: 1}
  }}
])
```

#### $sort and $limit
```javascript
db.products.aggregate([
  {$group: {_id: "$category", avgPrice: {$avg: "$price"}}},
  {$sort: {avgPrice: -1}},
  {$limit: 5}
])
```

### Advanced Pipeline Stages

#### $unwind - Deconstructing Arrays
```javascript
// Before unwind: {name: "Product A", tags: ["electronics", "mobile"]}
// After unwind: Two documents with individual tags

db.products.aggregate([
  {$unwind: "$tags"},
  {$group: {_id: "$tags", count: {$sum: 1}}},
  {$sort: {count: -1}}
])
```

#### $lookup - Joining Collections
```javascript
db.orders.aggregate([
  {$lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customerDetails"
  }},
  {$unwind: "$customerDetails"},
  {$project: {
    orderDate: 1,
    totalAmount: 1,
    customerName: "$customerDetails.name",
    customerEmail: "$customerDetails.email"
  }}
])
```

#### $addFields - Adding Computed Fields
```javascript
db.orders.aggregate([
  {$addFields: {
    tax: {$multiply: ["$subtotal", 0.08]},
    finalTotal: {$add: ["$subtotal", {$multiply: ["$subtotal", 0.08]}]},
    isLargeOrder: {$gte: ["$totalAmount", 1000]}
  }}
])
```

### Complex Aggregation Examples

#### Sales Analytics Pipeline
```javascript
db.orders.aggregate([
  // Match orders from last 6 months
  {$match: {
    orderDate: {$gte: new Date(Date.now() - 6*30*24*60*60*1000)}
  }},
  
  // Unwind line items
  {$unwind: "$lineItems"},
  
  // Lookup product details
  {$lookup: {
    from: "products",
    localField: "lineItems.productId",
    foreignField: "_id",
    as: "product"
  }},
  {$unwind: "$product"},
  
  // Group by product category
  {$group: {
    _id: "$product.category",
    totalRevenue: {$sum: {$multiply: ["$lineItems.quantity", "$lineItems.price"]}},
    totalQuantity: {$sum: "$lineItems.quantity"},
    averageOrderValue: {$avg: "$totalAmount"}
  }},
  
  // Sort by revenue
  {$sort: {totalRevenue: -1}},
  
  // Add percentage of total
  {$group: {
    _id: null,
    categories: {$push: "$$ROOT"},
    grandTotal: {$sum: "$totalRevenue"}
  }},
  {$unwind: "$categories"},
  {$project: {
    _id: "$categories._id",
    totalRevenue: "$categories.totalRevenue",
    totalQuantity: "$categories.totalQuantity",
    averageOrderValue: "$categories.averageOrderValue",
    percentageOfTotal: {
      $multiply: [
        {$divide: ["$categories.totalRevenue", "$grandTotal"]},
        100
      ]
    }
  }}
])
```

---

## Part 3: Indexing Fundamentals
*Duration: 45 minutes*

### Why Indexes Matter

**Without Index**: MongoDB scans every document (Collection Scan)
**With Index**: MongoDB uses index to jump directly to matching documents

### Performance Impact Example
```javascript
// 1 million documents without index
db.users.find({email: "john@example.com"}).explain("executionStats")
// executionTimeMillis: ~2000ms

// Same query with index
db.users.createIndex({email: 1})
db.users.find({email: "john@example.com"}).explain("executionStats")
// executionTimeMillis: ~5ms
```

### Index Types

#### Single Field Indexes
```javascript
// Ascending index
db.products.createIndex({price: 1})

// Descending index
db.products.createIndex({createdAt: -1})

// Unique index
db.users.createIndex({email: 1}, {unique: true})

// Sparse index (only indexes documents with the field)
db.users.createIndex({phoneNumber: 1}, {sparse: true})
```

#### Compound Indexes
```javascript
// Order matters! This index supports:
// 1. {category: "Electronics"}
// 2. {category: "Electronics", price: {$gt: 100}}
// 3. {category: "Electronics", price: {$gt: 100}, brand: "Apple"}
db.products.createIndex({category: 1, price: 1, brand: 1})

// This does NOT efficiently support: {price: {$gt: 100}}
```

#### Multikey Indexes (Arrays)
```javascript
// Automatically created when indexing array fields
db.products.createIndex({tags: 1})

// Supports queries like:
db.products.find({tags: "wireless"})
db.products.find({tags: {$in: ["wireless", "bluetooth"]}})
```

#### Text Indexes
```javascript
// Single field text index
db.products.createIndex({description: "text"})

// Compound text index
db.products.createIndex({
  title: "text",
  description: "text",
  tags: "text"
}, {
  weights: {
    title: 10,
    description: 5,
    tags: 1
  }
})
```

#### Geospatial Indexes
```javascript
// 2dsphere for modern GeoJSON
db.stores.createIndex({location: "2dsphere"})

// 2d for legacy coordinate pairs
db.places.createIndex({coordinates: "2d"})
```

### Index Management

#### Viewing Indexes
```javascript
// List all indexes on collection
db.products.getIndexes()

// Index usage statistics
db.products.aggregate([{$indexStats: {}}])
```

#### Dropping Indexes
```javascript
// Drop specific index
db.products.dropIndex({price: 1})

// Drop by name
db.products.dropIndex("price_1")

// Drop all indexes except _id
db.products.dropIndexes()
```

### Index Strategy Guidelines

#### ESR Rule (Equality, Sort, Range)
```javascript
// Query: Find Electronics, sort by price, price > 100
// Optimal index order:
db.products.createIndex({
  category: 1,    // Equality
  price: 1        // Sort + Range
})
```

#### Index Intersection
```javascript
// MongoDB can combine multiple single-field indexes
db.products.createIndex({category: 1})
db.products.createIndex({price: 1})

// Query can use both indexes
db.products.find({category: "Electronics", price: {$gt: 100}})
```

---

## Part 4: Performance Optimization
*Duration: 45 minutes*

### Query Performance Analysis

#### Using explain()
```javascript
// Basic execution stats
db.products.find({category: "Electronics"}).explain("executionStats")

// Key metrics to watch:
// - totalDocsExamined vs totalDocsReturned
// - executionTimeMillis
// - indexesUsed
```

#### Execution Plan Analysis
```javascript
// Winning plan details
db.products.find({category: "Electronics", price: {$gt: 100}})
           .explain("allPlansExecution")

// Look for:
// - IXSCAN (good) vs COLLSCAN (bad)
// - SORT_MERGE vs in-memory sort
// - Index hit ratio
```

### Performance Optimization Techniques

#### Query Optimization
```javascript
// BAD: Leading with range query
db.orders.find({
  amount: {$gt: 100},     // Range query first
  status: "completed"     // Equality query second
})

// GOOD: Leading with equality
db.orders.find({
  status: "completed",    // Equality query first
  amount: {$gt: 100}     // Range query second
})
```

#### Projection to Reduce Data Transfer
```javascript
// BAD: Returning entire documents
db.users.find({status: "active"})

// GOOD: Only return needed fields
db.users.find(
  {status: "active"},
  {name: 1, email: 1, lastLogin: 1, _id: 0}
)
```

#### Limit Result Sets
```javascript
// Use limit() to prevent large result sets
db.products.find({category: "Electronics"})
           .sort({price: -1})
           .limit(20)

// Use skip() carefully (can be slow for large offsets)
db.products.find().skip(10000).limit(20)  // Slower
// Consider cursor-based pagination instead
```

### Aggregation Performance

#### Pipeline Optimization
```javascript
// BAD: $match after expensive operations
db.orders.aggregate([
  {$lookup: {from: "customers", localField: "customerId", foreignField: "_id", as: "customer"}},
  {$unwind: "$customer"},
  {$match: {status: "completed"}}  // Should be first!
])

// GOOD: $match early in pipeline
db.orders.aggregate([
  {$match: {status: "completed"}},  // Filter early
  {$lookup: {from: "customers", localField: "customerId", foreignField: "_id", as: "customer"}},
  {$unwind: "$customer"}
])
```

#### Index Usage in Aggregation
```javascript
// Ensure first $match can use indexes
db.orders.createIndex({status: 1, orderDate: 1})

db.orders.aggregate([
  {$match: {status: "completed", orderDate: {$gte: ISODate("2024-01-01")}}},
  {$group: {_id: "$customerId", totalSpent: {$sum: "$amount"}}}
])
```

### Memory Management

#### Working Set Size
- Keep frequently accessed data in memory
- Monitor memory usage with `db.serverStatus().mem`
- Consider sharding for large datasets

#### Document Size Considerations
```javascript
// Avoid large documents (>16MB limit)
// Instead of embedding large arrays:
{
  _id: ObjectId("..."),
  user: "john",
  messages: [/* thousands of messages */]
}

// Use separate collections:
// users collection + messages collection with userId reference
```

### Connection Pool Optimization

#### Connection Management
```javascript
// Connection string optimizations
mongodb://localhost:27017/mydb?maxPoolSize=50&minPoolSize=10&maxIdleTimeMS=30000

// Monitor connection usage
db.serverStatus().connections
```

---

## Part 5: Schema Design Patterns
*Duration: 45 minutes*

### Document Design Principles

#### Embed vs Reference Decision Tree

**Embed When:**
- Data accessed together
- Data doesn't change often
- Limited growth (bounded arrays)
- 1:1 or 1:few relationships

**Reference When:**
- Data accessed independently
- Frequently changing data
- Unbounded growth
- Many:many relationships

### Common Design Patterns

#### 1. Embedded Documents Pattern
```javascript
// User profile with embedded address
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  address: {
    street: "123 Main St",
    city: "New York",
    zipCode: "10001",
    country: "USA"
  },
  preferences: {
    newsletter: true,
    theme: "dark",
    language: "en"
  }
}
```

#### 2. Reference Pattern
```javascript
// Separate collections with references
// users collection
{
  _id: ObjectId("user123"),
  name: "John Doe",
  email: "john@example.com"
}

// orders collection
{
  _id: ObjectId("order456"),
  userId: ObjectId("user123"),  // Reference
  items: [...],
  total: 99.99
}
```

#### 3. Hybrid Pattern
```javascript
// Store minimal reference data + full reference
{
  _id: ObjectId("..."),
  title: "Great Product",
  author: {
    _id: ObjectId("author123"),
    name: "Jane Smith"  // Denormalized for quick access
  },
  // Full author details available via lookup when needed
}
```

### Advanced Patterns

#### 4. Bucket Pattern (Time Series Data)
```javascript
// Instead of one document per measurement:
{timestamp: ISODate("2024-01-01T10:00:00Z"), sensor: "temp001", value: 23.5}
{timestamp: ISODate("2024-01-01T10:01:00Z"), sensor: "temp001", value: 23.7}

// Group into buckets:
{
  _id: ObjectId("..."),
  sensor: "temp001",
  date: ISODate("2024-01-01"),
  measurements: [
    {time: "10:00", value: 23.5},
    {time: "10:01", value: 23.7},
    // ... up to 60 measurements per hour
  ]
}
```

#### 5. Outlier Pattern
```javascript
// Handle documents that exceed normal size
// Normal product document
{
  _id: ObjectId("product123"),
  name: "Popular Item",
  reviews: [/* up to 100 reviews */],
  hasOverflowReviews: false
}

// Product with too many reviews
{
  _id: ObjectId("product456"),
  name: "Viral Product",
  reviews: [/* first 100 reviews */],
  hasOverflowReviews: true
}

// Overflow collection for additional reviews
{
  _id: ObjectId("..."),
  productId: ObjectId("product456"),
  reviews: [/* additional reviews */]
}
```

#### 6. Computed Pattern
```javascript
// Pre-calculate expensive computations
{
  _id: ObjectId("..."),
  userId: ObjectId("user123"),
  year: 2024,
  month: 1,
  // Computed fields updated via scheduled job
  totalOrders: 15,
  totalSpent: 1299.99,
  averageOrderValue: 86.67,
  lastUpdated: ISODate("2024-01-31T23:59:59Z")
}
```

#### 7. Polymorphic Pattern
```javascript
// Different document types in same collection
// Product
{
  _id: ObjectId("..."),
  type: "product",
  name: "Laptop",
  price: 999.99,
  specs: {cpu: "Intel i7", ram: "16GB"}
}

// Service
{
  _id: ObjectId("..."),
  type: "service",
  name: "Setup Service",
  price: 99.99,
  duration: "2 hours"
}

// Digital
{
  _id: ObjectId("..."),
  type: "digital",
  name: "Software License",
  price: 199.99,
  downloadUrl: "https://...",
  licenseKey: "ABC-123-XYZ"
}
```

### Schema Evolution Strategies

#### Versioning Documents
```javascript
{
  _id: ObjectId("..."),
  schemaVersion: 2,
  // v2 fields
  name: "Product Name",
  price: 99.99,
  // Handle migration from v1
  migrated: true
}
```

#### Gradual Migration
```javascript
// Application code handles multiple versions
function getProductPrice(product) {
  if (product.schemaVersion >= 2) {
    return product.price;
  } else {
    // Handle v1 format
    return product.cost;
  }
}
```

---

## Performance Monitoring and Best Practices

### Monitoring Tools

#### Database Profiler
```javascript
// Enable profiler for slow operations
db.setProfilingLevel(2, {slowms: 100})

// View profile data
db.system.profile.find().sort({ts: -1}).limit(5)
```

#### MongoDB Compass
- Visual query performance analysis
- Index usage statistics
- Real-time performance metrics

#### MongoDB Atlas (Cloud)
- Built-in monitoring and alerting
- Performance advisor
- Index suggestions

### Production Best Practices

#### Capacity Planning
- Monitor disk space growth
- Plan for memory requirements
- Consider read/write patterns for sharding

#### Backup and Recovery
- Regular automated backups
- Test restore procedures
- Point-in-time recovery planning

#### Security Considerations
- Enable authentication
- Use role-based access control
- Network security (firewalls, VPN)
- Encrypt data at rest and in transit

---

## Day 2 Summary

### Key Takeaways
1. **Advanced querying** enables complex data retrieval patterns
2. **Aggregation framework** provides powerful data processing capabilities
3. **Proper indexing** is crucial for query performance
4. **Schema design** should match access patterns
5. **Performance monitoring** is essential for production systems

### Next Steps
- Practice aggregation pipelines with real data
- Analyze your application's query patterns
- Design indexes based on your queries
- Monitor performance in production
- Consider MongoDB Atlas for managed hosting

### Additional Resources
- MongoDB University (free online courses)
- MongoDB documentation and best practices
- Community forums and Stack Overflow
- MongoDB certification programs