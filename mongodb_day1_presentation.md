# MongoDB Mastering Course - Day 1
## Fundamentals & Core Operations

---

## Table of Contents

1. [Introduction to NoSQL & MongoDB](#1-introduction-to-nosql--mongodb)
2. [Basic Operations & CRUD](#2-basic-operations--crud)
3. [Query Fundamentals](#3-query-fundamentals)
4. [Advanced Querying](#4-advanced-querying)
5. [Data Modeling Basics](#5-data-modeling-basics)
6. [Hands-on Lab](#6-hands-on-lab)

---

## 1. Introduction to NoSQL & MongoDB
### Session Duration: 45 minutes

### 1.1 NoSQL Database Landscape

#### What is NoSQL?
- **Not Only SQL** - Modern approach to database design
- Designed for distributed computing environments
- Handles unstructured and semi-structured data
- Horizontal scalability built-in

#### NoSQL vs SQL Comparison

| Aspect | SQL (Relational) | NoSQL |
|--------|------------------|-------|
| Schema | Fixed, predefined | Flexible, dynamic |
| Scaling | Vertical (scale-up) | Horizontal (scale-out) |
| ACID | Full ACID compliance | Eventual consistency |
| Relationships | Complex joins | Embedded documents |
| Query Language | SQL standard | Database-specific |

#### Types of NoSQL Databases

1. **Document Databases** (MongoDB, CouchDB)
   - Store data in document format (JSON-like)
   - Flexible schema
   - Natural data representation

2. **Key-Value Stores** (Redis, DynamoDB)
   - Simple key-value pairs
   - High performance
   - Caching and session storage

3. **Column-Family** (Cassandra, HBase)
   - Column-oriented storage
   - Big data analytics
   - Time-series data

4. **Graph Databases** (Neo4j, Amazon Neptune)
   - Nodes and relationships
   - Social networks
   - Recommendation engines

#### When to Choose NoSQL?

**Choose NoSQL when:**
- Rapid development with changing requirements
- Large scale and high traffic
- Unstructured or semi-structured data
- Horizontal scaling needs
- Real-time analytics

**Stick with SQL when:**
- Complex transactions required
- Mature ecosystem needed
- Strong consistency required
- Complex queries and reporting
- Small to medium scale

### 1.2 MongoDB Architecture & Terminology

#### What is MongoDB?
- **Document-oriented NoSQL database**
- Written in C++
- Cross-platform compatibility
- Open source with commercial support

#### Core Concepts

```
Database
├── Collection (like SQL table)
│   ├── Document (like SQL row)
│   │   ├── Field: Value (like SQL column)
│   │   ├── Field: Value
│   │   └── Nested Document
│   └── Document
└── Collection
```

#### Document Structure Example
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "hobbies": ["reading", "swimming", "coding"],
  "created_at": ISODate("2023-01-15T10:30:00Z")
}
```

#### BSON (Binary JSON)
- **Binary representation of JSON documents**
- Supports additional data types
- Efficient storage and traversal
- Native data types: ObjectId, Date, Binary, etc.

#### MongoDB Data Types
- **String** - UTF-8 text
- **Number** - Integer, Long, Double, Decimal128
- **Boolean** - true/false
- **Array** - List of values
- **Object** - Embedded document
- **ObjectId** - Unique identifier
- **Date** - UNIX timestamp
- **Null** - Null value
- **Regular Expression** - Pattern matching
- **Binary Data** - Binary content

### 1.3 Installation & Setup

#### Local Installation Options

**1. MongoDB Community Server**
```bash
# Windows (using MSI installer)
# Download from: https://www.mongodb.com/try/download/community

# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y mongodb-org
```

**2. Starting MongoDB**
```bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
net start MongoDB  # Windows

# Connect to MongoDB
mongosh  # MongoDB Shell 2.0+
mongo    # Legacy MongoDB Shell
```

#### MongoDB Atlas (Cloud)
- **Fully managed MongoDB service**
- Free tier available (M0)
- Automatic scaling and backup
- Built-in security features
- Global cluster deployment

**Atlas Setup Steps:**
1. Create account at mongodb.com/atlas
2. Create new project
3. Build cluster (choose M0 for free tier)
4. Configure security (IP whitelist, database user)
5. Connect using connection string

#### MongoDB Compass
- **Official GUI for MongoDB**
- Visual query builder
- Schema analysis
- Real-time performance monitoring
- Index management

**Installation:**
- Download from mongodb.com/compass
- Available for Windows, macOS, Linux
- Connect using connection string or manual configuration

---

## 2. Basic Operations & CRUD
### Session Duration: 90 minutes

### 2.1 MongoDB Shell Fundamentals

#### Connecting to MongoDB
```javascript
// Local connection
mongosh

// Remote connection
mongosh "mongodb://username:password@host:port/database"

// Atlas connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/database"
```

#### Shell Commands
```javascript
// Show databases
show dbs

// Switch/create database
use myDatabase

// Show collections
show collections

// Show current database
db

// Get database stats
db.stats()

// Help commands
help
db.help()
db.collection.help()
```

#### JavaScript Context
```javascript
// Variables
var user = {name: "John", age: 30}

// Functions
function createUser(name, age) {
    return {
        name: name,
        age: age,
        created: new Date()
    }
}

// Loops
for (let i = 0; i < 5; i++) {
    db.numbers.insertOne({value: i})
}
```

### 2.2 Database and Collection Operations

#### Database Operations
```javascript
// Create database (implicitly created when first document inserted)
use ecommerce

// Drop database
db.dropDatabase()

// Database information
db.getName()
db.stats()
```

#### Collection Operations
```javascript
// Create collection explicitly
db.createCollection("users")

// Create with options
db.createCollection("logs", {
    capped: true,
    size: 100000,
    max: 1000
})

// Drop collection
db.users.drop()

// Collection stats
db.users.stats()

// Rename collection
db.users.renameCollection("customers")
```

### 2.3 Insert Operations

#### Single Document Insertion
```javascript
// insertOne() - Insert single document
db.users.insertOne({
    name: "Alice Smith",
    email: "alice@example.com",
    age: 28,
    department: "Engineering"
})

// Result includes acknowledged status and insertedId
```

#### Multiple Document Insertion
```javascript
// insertMany() - Insert multiple documents
db.users.insertMany([
    {
        name: "Bob Johnson",
        email: "bob@example.com",
        age: 32,
        department: "Marketing"
    },
    {
        name: "Carol White",
        email: "carol@example.com",
        age: 25,
        department: "Sales"
    }
])

// Options for insertMany
db.users.insertMany(documents, {
    ordered: false,  // Continue on error
    writeConcern: { w: "majority" }
})
```

#### ObjectId Generation
```javascript
// Automatic ObjectId generation
// Format: 12-byte identifier
// - 4-byte timestamp
// - 5-byte random unique value
// - 3-byte incrementing counter

// Custom ObjectId
db.users.insertOne({
    _id: ObjectId("507f1f77bcf86cd799439011"),
    name: "Custom ID User"
})

// Custom primary key
db.users.insertOne({
    _id: "user123",
    name: "String ID User"
})
```

#### Error Handling
```javascript
// Duplicate key error
try {
    db.users.insertOne({
        _id: "user123",  // Already exists
        name: "Duplicate"
    })
} catch (e) {
    print("Error: " + e.message)
}

// Validation errors
db.createCollection("products", {
    validator: {
        $jsonSchema: {
            required: ["name", "price"],
            properties: {
                price: { minimum: 0 }
            }
        }
    }
})
```

### 2.4 Read Operations

#### Basic Find Operations
```javascript
// Find all documents
db.users.find()

// Find with pretty formatting
db.users.find().pretty()

// Find one document
db.users.findOne()

// Find with condition
db.users.find({department: "Engineering"})

// Find by ObjectId
db.users.findOne({_id: ObjectId("507f1f77bcf86cd799439011")})
```

#### Query Conditions
```javascript
// Exact match
db.users.find({age: 30})

// Multiple conditions (implicit $and)
db.users.find({
    department: "Engineering",
    age: 30
})

// Nested field query
db.users.find({"address.city": "New York"})

// Array element query
db.users.find({hobbies: "reading"})
```

#### Counting Documents
```javascript
// Count all documents
db.users.countDocuments()

// Count with condition
db.users.countDocuments({department: "Engineering"})

// Estimated count (faster for large collections)
db.users.estimatedDocumentCount()
```

### 2.5 Update Operations

#### Update Single Document
```javascript
// updateOne() - Update first matching document
db.users.updateOne(
    {name: "Alice Smith"},  // Filter
    {$set: {age: 29}}       // Update
)

// Update with multiple operations
db.users.updateOne(
    {_id: ObjectId("507f1f77bcf86cd799439011")},
    {
        $set: {age: 31},
        $unset: {department: ""},
        $push: {hobbies: "gaming"}
    }
)
```

#### Update Multiple Documents
```javascript
// updateMany() - Update all matching documents
db.users.updateMany(
    {department: "Engineering"},
    {$inc: {age: 1}}  // Increment age by 1
)

// Update with array filters
db.users.updateMany(
    {"scores.subject": "math"},
    {$set: {"scores.$.grade": "A"}},
    {arrayFilters: [{"elem.subject": "math"}]}
)
```

#### Replace Document
```javascript
// replaceOne() - Replace entire document
db.users.replaceOne(
    {name: "Bob Johnson"},
    {
        name: "Robert Johnson",
        email: "robert@example.com",
        age: 33,
        department: "Marketing",
        updated: new Date()
    }
)
```

#### Update Operators
```javascript
// $set - Set field value
{$set: {status: "active"}}

// $unset - Remove field
{$unset: {temporaryField: ""}}

// $inc - Increment/decrement number
{$inc: {views: 1, score: -5}}

// $push - Add to array
{$push: {tags: "mongodb"}}

// $pull - Remove from array
{$pull: {tags: "outdated"}}

// $addToSet - Add unique to array
{$addToSet: {categories: "database"}}

// $pop - Remove first/last array element
{$pop: {items: 1}}  // Remove last
{$pop: {items: -1}} // Remove first

// $rename - Rename field
{$rename: {oldName: "newName"}}

// $mul - Multiply field value
{$mul: {price: 1.1}}  // 10% increase
```

#### Upsert Operations
```javascript
// Upsert - Insert if not found, update if found
db.users.updateOne(
    {email: "new@example.com"},
    {
        $set: {name: "New User"},
        $setOnInsert: {created: new Date()}
    },
    {upsert: true}
)

// $setOnInsert only works on insert
// $set works on both insert and update
```

### 2.6 Delete Operations

#### Delete Single Document
```javascript
// deleteOne() - Delete first matching document
db.users.deleteOne({name: "Alice Smith"})

// Delete by ObjectId
db.users.deleteOne({_id: ObjectId("507f1f77bcf86cd799439011")})
```

#### Delete Multiple Documents
```javascript
// deleteMany() - Delete all matching documents
db.users.deleteMany({department: "Sales"})

// Delete all documents (keep collection)
db.users.deleteMany({})

// Delete with complex condition
db.users.deleteMany({
    age: {$lt: 18},
    status: "inactive"
})
```

#### Safety Considerations
```javascript
// Always test with find first
db.users.find({department: "Sales"})  // Check what will be deleted
db.users.deleteMany({department: "Sales"})

// Use limit with deleteOne for safety
db.users.deleteOne({status: "inactive"})  // Only deletes one

// Backup before bulk operations
mongodump --db ecommerce --collection users
```

---

## 3. Query Fundamentals
### Session Duration: 90 minutes

### 3.1 Comparison Operators

#### Equality and Inequality
```javascript
// $eq - Equal to (default behavior)
db.products.find({price: {$eq: 29.99}})
db.products.find({price: 29.99})  // Same as above

// $ne - Not equal to
db.products.find({status: {$ne: "discontinued"}})

// $gt - Greater than
db.products.find({price: {$gt: 50}})

// $gte - Greater than or equal to
db.products.find({rating: {$gte: 4.0}})

// $lt - Less than
db.products.find({stock: {$lt: 10}})

// $lte - Less than or equal to
db.products.find({discount: {$lte: 0.2}})
```

#### Range Queries
```javascript
// Combine operators for ranges
db.products.find({
    price: {
        $gte: 20,
        $lte: 100
    }
})

// Date ranges
db.orders.find({
    orderDate: {
        $gte: ISODate("2023-01-01"),
        $lt: ISODate("2024-01-01")
    }
})
```

#### In and Not In Arrays
```javascript
// $in - Match any value in array
db.products.find({
    category: {$in: ["electronics", "books", "clothing"]}
})

// $nin - Match none of the values in array
db.products.find({
    status: {$nin: ["discontinued", "out-of-stock"]}
})

// Mixed data types in $in
db.items.find({
    identifier: {$in: [123, "ABC", ObjectId("507f1f77bcf86cd799439011")]}
})
```

### 3.2 Logical Operators

#### AND Operations
```javascript
// Implicit $and (comma-separated conditions)
db.products.find({
    category: "electronics",
    price: {$lt: 100},
    inStock: true
})

// Explicit $and
db.products.find({
    $and: [
        {category: "electronics"},
        {price: {$lt: 100}},
        {inStock: true}
    ]
})

// $and with same field (different operators)
db.products.find({
    $and: [
        {price: {$gte: 50}},
        {price: {$lte: 100}}
    ]
})
```

#### OR Operations
```javascript
// $or - Match any condition
db.products.find({
    $or: [
        {category: "electronics"},
        {category: "books"},
        {price: {$lt: 20}}
    ]
})

// Combining $and and $or
db.products.find({
    category: "electronics",  // AND
    $or: [                    // AND (OR ...)
        {price: {$lt: 50}},
        {rating: {$gte: 4.5}}
    ]
})
```

#### NOT Operations
```javascript
// $not - Logical NOT
db.products.find({
    price: {$not: {$gte: 100}}
})

// $nor - None of the conditions
db.products.find({
    $nor: [
        {category: "discontinued"},
        {stock: 0},
        {price: {$lt: 0}}
    ]
})
```

#### Complex Logical Combinations
```javascript
// Complex query example
db.products.find({
    $and: [
        {
            $or: [
                {category: "electronics"},
                {category: "computers"}
            ]
        },
        {
            $or: [
                {price: {$lt: 100}},
                {rating: {$gte: 4.0}}
            ]
        },
        {stock: {$gte: 1}}
    ]
})
```

### 3.3 Element Operators

#### Field Existence
```javascript
// $exists - Check if field exists
db.users.find({email: {$exists: true}})   // Has email field
db.users.find({phone: {$exists: false}})  // No phone field

// Find documents with or without specific fields
db.products.find({
    $and: [
        {name: {$exists: true}},
        {description: {$exists: false}}
    ]
})
```

#### Type Checking
```javascript
// $type - Check field data type
db.users.find({age: {$type: "number"}})
db.users.find({age: {$type: "string"}})

// Multiple types
db.mixed.find({
    value: {$type: ["number", "string"]}
})

// BSON type numbers
db.users.find({age: {$type: 1}})  // 1 = double
db.users.find({name: {$type: 2}}) // 2 = string

// Common BSON types:
// 1: double, 2: string, 3: object, 4: array
// 7: objectId, 8: boolean, 9: date, 10: null
```

#### Null Value Handling
```javascript
// Find null values
db.users.find({middleName: null})

// Find null OR missing field
db.users.find({middleName: {$in: [null]}})

// Find only null (not missing)
db.users.find({
    $and: [
        {middleName: null},
        {middleName: {$exists: true}}
    ]
})

// Find missing field (not null)
db.users.find({
    $and: [
        {middleName: {$exists: false}}
    ]
})
```

### 3.4 Array Operators

#### Basic Array Queries
```javascript
// Match array element
db.users.find({hobbies: "reading"})

// Exact array match
db.users.find({hobbies: ["reading", "swimming"]})

// Array length
db.users.find({hobbies: {$size: 3}})
```

#### Advanced Array Queries
```javascript
// $all - Match all elements
db.users.find({
    hobbies: {$all: ["reading", "swimming"]}
})

// $elemMatch - Match array element with multiple conditions
db.products.find({
    reviews: {
        $elemMatch: {
            rating: {$gte: 4},
            helpful: {$gte: 10}
        }
    }
})

// Array element by position
db.users.find({"scores.0": {$gte: 90}})  // First element
db.users.find({"scores.2": {$exists: true}})  // Has third element
```

#### Array with Embedded Documents
```javascript
// Sample data structure
{
    name: "Product A",
    reviews: [
        {user: "john", rating: 5, comment: "Great!"},
        {user: "jane", rating: 4, comment: "Good"}
    ]
}

// Query embedded documents in array
db.products.find({"reviews.rating": 5})

// $elemMatch for embedded documents
db.products.find({
    reviews: {
        $elemMatch: {
            user: "john",
            rating: {$gte: 4}
        }
    }
})

// Dot notation for specific array element
db.products.find({"reviews.0.rating": 5})
```

---

## 4. Advanced Querying
### Session Duration: 90 minutes

### 4.1 Regular Expression Queries

#### Basic Regex Patterns
```javascript
// Case-sensitive pattern matching
db.users.find({name: /^John/})        // Starts with "John"
db.users.find({name: /son$/})         // Ends with "son"
db.users.find({name: /john/})         // Contains "john"

// Case-insensitive matching
db.users.find({name: /john/i})        // Case-insensitive
db.users.find({email: /GMAIL/i})      // Case-insensitive email

// Using $regex operator
db.users.find({
    name: {
        $regex: "john",
        $options: "i"
    }
})
```

#### Advanced Regex Patterns
```javascript
// Character classes
db.products.find({sku: /^[A-Z]{2}\d{4}$/})  // 2 letters + 4 digits

// Quantifiers
db.users.find({phone: /^\d{3}-\d{3}-\d{4}$/})  // Phone format

// Alternation
db.products.find({category: /(electronics|computers)/i})

// Word boundaries
db.articles.find({title: /\bmongodb\b/i})  // Whole word "mongodb"

// Escaping special characters
db.users.find({email: /user\.name@example\.com/})
```

#### Performance Considerations
```javascript
// Efficient: Anchored patterns (use indexes)
db.users.find({name: /^John/})        // Can use index

// Inefficient: Non-anchored patterns
db.users.find({name: /john/})         // Cannot use index effectively

// Create text index for better text search
db.articles.createIndex({content: "text"})
db.articles.find({$text: {$search: "mongodb"}})
```

### 4.2 Projection Techniques

#### Basic Projection
```javascript
// Include specific fields (1 = include)
db.users.find({}, {name: 1, email: 1})

// Exclude specific fields (0 = exclude)
db.users.find({}, {password: 0, ssn: 0})

// _id is included by default, exclude explicitly
db.users.find({}, {name: 1, email: 1, _id: 0})

// Cannot mix include/exclude (except _id)
// This is INVALID:
// db.users.find({}, {name: 1, password: 0})  // Error!
```

#### Nested Document Projection
```javascript
// Project nested fields
db.users.find({}, {"address.city": 1, "address.country": 1})

// Project entire nested document
db.users.find({}, {address: 1, name: 1})

// Exclude nested fields
db.users.find({}, {"address.coordinates": 0})
```

#### Array Projection
```javascript
// Sample document with arrays
{
    name: "John",
    scores: [85, 92, 78, 96, 88],
    courses: [
        {name: "Math", grade: "A"},
        {name: "Science", grade: "B"},
        {name: "History", grade: "A"}
    ]
}

// $slice - Limit array elements
db.students.find({}, {
    name: 1,
    scores: {$slice: 3}      // First 3 elements
})

db.students.find({}, {
    name: 1,
    scores: {$slice: -2}     // Last 2 elements
})

db.students.find({}, {
    name: 1,
    scores: {$slice: [1, 3]} // Skip 1, take 3
})

// $elemMatch projection
db.students.find({}, {
    name: 1,
    courses: {$elemMatch: {grade: "A"}}  // First matching element
})

// $ positional operator
db.students.find(
    {"courses.grade": "A"},              // Query
    {"courses.$": 1}                     // Project matched element
)
```

#### Computed Fields in Projection
```javascript
// $meta for text search scores
db.articles.find(
    {$text: {$search: "mongodb"}},
    {score: {$meta: "textScore"}}
).sort({score: {$meta: "textScore"}})
```

### 4.3 Result Manipulation

#### Sorting Results
```javascript
// Single field sort
db.products.find().sort({price: 1})    // Ascending
db.products.find().sort({price: -1})   // Descending

// Multiple field sort
db.products.find().sort({
    category: 1,    // First by category (asc)
    price: -1       // Then by price (desc)
})

// Sort by nested field
db.users.find().sort({"address.city": 1})

// Sort by array element
db.students.find().sort({"scores.0": -1})  // Sort by first score

// Text search relevance sorting
db.articles.find(
    {$text: {$search: "mongodb"}}
).sort({score: {$meta: "textScore"}})
```

#### Limiting and Skipping
```javascript
// Limit results
db.products.find().limit(10)

// Skip results (offset)
db.products.find().skip(20)

// Pagination pattern
db.products.find()
    .sort({_id: 1})
    .skip(20)
    .limit(10)

// Efficient pagination with range queries
db.products.find({_id: {$gt: lastSeenId}})
    .sort({_id: 1})
    .limit(10)
```

#### Method Chaining
```javascript
// Chain multiple operations
db.products.find({category: "electronics"})
    .sort({rating: -1, price: 1})
    .skip(10)
    .limit(5)
    .projection({name: 1, price: 1, rating: 1})

// Order matters for performance
// Optimal order: filter -> sort -> skip -> limit
```

#### Cursor Methods
```javascript
// Convert to array
var results = db.products.find({category: "books"}).toArray()

// Iterate with forEach
db.products.find({price: {$lt: 50}}).forEach(function(doc) {
    print(doc.name + ": $" + doc.price)
})

// Count results
db.products.find({category: "electronics"}).count()  // Deprecated
db.products.countDocuments({category: "electronics"})  // Preferred

// Check if results exist
var hasResults = db.products.find({category: "rare"}).hasNext()

// Get explain plan
db.products.find({category: "electronics"}).explain()
```

#### Advanced Cursor Operations
```javascript
// Map results
var productNames = db.products.find({}, {name: 1}).map(function(doc) {
    return doc.name.toUpperCase()
})

// Reduce results
var totalValue = db.products.find({inStock: true}).reduce(
    function(total, doc) {
        return total + (doc.price * doc.quantity)
    },
    0
)

// Sort with collation (locale-specific)
db.products.find().sort({name: 1}).collation({
    locale: "en",
    strength: 2  // Case-insensitive
})
```

---

## 5. Data Modeling Basics
### Session Duration: 90 minutes

### 5.1 Document Structure Design

#### Flexible Schema Benefits
```javascript
// Different document structures in same collection
// User profiles can vary based on user type

// Basic user
{
    _id: ObjectId("..."),
    username: "john_doe",
    email: "john@example.com",
    created_at: ISODate("2023-01-15")
}

// Premium user with additional fields
{
    _id: ObjectId("..."),
    username: "premium_user",
    email: "premium@example.com",
    subscription: {
        type: "premium",
        expires: ISODate("2024-01-15"),
        features: ["advanced_search", "priority_support"]
    },
    preferences: {
        theme: "dark",
        notifications: true
    },
    created_at: ISODate("2023-01-15")
}

// Business user
{
    _id: ObjectId("..."),
    username: "business_account",
    email: "contact@business.com",
    company: {
        name: "Tech Corp",
        industry: "Technology",
        size: "50-100 employees"
    },
    billing_contact: {
        name: "Jane Smith",
        email: "billing@business.com"
    },
    created_at: ISODate("2023-01-15")
}
```

#### Document Size Considerations
```javascript
// MongoDB document size limit: 16MB
// Best practices for document size:

// Good: Reasonable document size
{
    _id: ObjectId("..."),
    title: "Product Title",
    description: "Product description...",
    price: 29.99,
    reviews: [
        {user: "user1", rating: 5, comment: "Great!"},
        {user: "user2", rating: 4, comment: "Good"}
        // Keep reviews limited or reference external collection
    ]
}

// Consider separate collection for large arrays
// Products collection
{
    _id: ObjectId("..."),
    title: "Product Title",
    price: 29.99,
    review_count: 1500,
    avg_rating: 4.2
}

// Reviews collection (separate)
{
    _id: ObjectId("..."),
    product_id: ObjectId("..."),
    user_id: ObjectId("..."),
    rating: 5,
    comment: "Excellent product!",
    created_at: ISODate("2023-01-15")
}
```

#### Nesting vs Flat Structures
```javascript
// Nested structure (good for related data)
{
    _id: ObjectId("..."),
    customer_info: {
        name: "John Doe",
        email: "john@example.com",
        address: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            zip: "10001",
            country: "USA"
        },
        preferences: {
            currency: "USD",
            language: "en",
            newsletter: true
        }
    }
}

// Flat structure (easier to query/index)
{
    _id: ObjectId("..."),
    customer_name: "John Doe",
    customer_email: "john@example.com",
    address_street: "123 Main St",
    address_city: "New York",
    address_state: "NY",
    address_zip: "10001",
    address_country: "USA",
    pref_currency: "USD",
    pref_language: "en",
    pref_newsletter: true
}
```

### 5.2 Embedding vs Referencing

#### When to Embed Documents
```javascript
// Use embedding when:
// 1. Data is accessed together
// 2. Data doesn't grow unbounded
// 3. Data is not shared across documents

// Good example: User profile with address
{
    _id: ObjectId("..."),
    name: "John Doe",
    email: "john@example.com",
    address: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001"
    },
    preferences: {
        theme: "dark",
        notifications: {
            email: true,
            sms: false,
            push: true
        }
    }
}

// Good example: Blog post with comments (limited)
{
    _id: ObjectId("..."),
    title: "Introduction to MongoDB",
    content: "MongoDB is a document database...",
    author: "John Doe",
    tags: ["mongodb", "database", "nosql"],
    comments: [
        {
            author: "Jane",
            message: "Great article!",
            date: ISODate("2023-01-15T10:00:00Z")
        },
        {
            author: "Bob",
            message: "Very helpful",
            date: ISODate("2023-01-15T11:00:00Z")
        }
    ],
    created_at: ISODate("2023-01-15T09:00:00Z")
}
```

#### When to Use References
```javascript
// Use references when:
// 1. Data is large or grows unbounded
// 2. Data is shared across documents
// 3. Need to query referenced data independently

// Good example: E-commerce with separate collections

// Users collection
{
    _id: ObjectId("user1"),
    name: "John Doe",
    email: "john@example.com"
}

// Products collection
{
    _id: ObjectId("product1"),
    name: "Laptop",
    price: 999.99,
    category: "Electronics"
}

// Orders collection (references users and products)
{
    _id: ObjectId("order1"),
    user_id: ObjectId("user1"),      // Reference to user
    items: [
        {
            product_id: ObjectId("product1"),  // Reference to product
            quantity: 1,
            price: 999.99
        }
    ],
    total: 999.99,
    order_date: ISODate("2023-01-15")
}
```

#### Relationship Patterns

**One-to-One Relationships**
```javascript
// Embed when always accessed together
{
    _id: ObjectId("..."),
    username: "john_doe",
    profile: {
        first_name: "John",
        last_name: "Doe",
        bio: "Software developer",
        avatar_url: "https://example.com/avatar.jpg"
    }
}

// Reference when accessed separately
// Users collection
{
    _id: ObjectId("user1"),
    username: "john_doe",
    email: "john@example.com"
}

// User profiles collection
{
    _id: ObjectId("..."),
    user_id: ObjectId("user1"),
    first_name: "John",
    last_name: "Doe",
    bio: "Software developer...",
    detailed_preferences: { /* large object */ }
}
```

**One-to-Many Relationships**
```javascript
// Embed for "few" (< 100 items)
{
    _id: ObjectId("..."),
    name: "John Doe",
    addresses: [
        {
            type: "home",
            street: "123 Main St",
            city: "New York"
        },
        {
            type: "work",
            street: "456 Business Ave",
            city: "New York"
        }
    ]
}

// Reference for "many" (> 100 items)
// Blog posts collection
{
    _id: ObjectId("post1"),
    title: "MongoDB Tutorial",
    author_id: ObjectId("user1")
}

// Comments collection
{
    _id: ObjectId("..."),
    post_id: ObjectId("post1"),
    author: "Jane",
    message: "Great tutorial!",
    created_at: ISODate("2023-01-15")
}
```

**Many-to-Many Relationships**
```javascript
// Array of references approach
// Students collection
{
    _id: ObjectId("student1"),
    name: "John Doe",
    course_ids: [
        ObjectId("course1"),
        ObjectId("course2"),
        ObjectId("course3")
    ]
}

// Courses collection
{
    _id: ObjectId("course1"),
    name: "Introduction to MongoDB",
    student_ids: [
        ObjectId("student1"),
        ObjectId("student2")
    ]
}

// Separate junction collection (better for additional data)
// Enrollments collection
{
    _id: ObjectId("..."),
    student_id: ObjectId("student1"),
    course_id: ObjectId("course1"),
    enrollment_date: ISODate("2023-01-15"),
    grade: "A",
    completed: true
}
```

### 5.3 Schema Design Patterns

#### Attribute Pattern
```javascript
// Problem: Products with varying attributes
// Bad approach - sparse documents
{
    _id: ObjectId("..."),
    name: "Laptop",
    price: 999.99,
    screen_size: "15 inch",
    processor: "Intel i7",
    ram: "16GB",
    // ... many optional fields
}

{
    _id: ObjectId("..."),
    name: "T-Shirt",
    price: 19.99,
    size: "M",
    color: "Blue",
    material: "Cotton",
    // Different set of attributes
}

// Good approach - Attribute pattern
{
    _id: ObjectId("..."),
    name: "Laptop",
    price: 999.99,
    category: "Electronics",
    attributes: [
        {key: "screen_size", value: "15 inch"},
        {key: "processor", value: "Intel i7"},
        {key: "ram", value: "16GB"},
        {key: "storage", value: "512GB SSD"}
    ]
}

// Enables indexing on attributes
db.products.createIndex({"attributes.key": 1, "attributes.value": 1})

// Query by attribute
db.products.find({
    "attributes": {
        $elemMatch: {
            key: "processor",
            value: /Intel/i
        }
    }
})
```

#### Extended Reference Pattern
```javascript
// Problem: Frequently accessed subset of referenced data
// Instead of always joining, embed frequently used fields

// Orders collection with extended product reference
{
    _id: ObjectId("..."),
    customer_id: ObjectId("customer1"),
    items: [
        {
            product_id: ObjectId("product1"),
            // Extended reference - frequently accessed product data
            product_name: "Laptop",
            product_price: 999.99,
            product_image: "laptop.jpg",
            quantity: 1
        }
    ],
    total: 999.99,
    order_date: ISODate("2023-01-15")
}

// Full product data still in products collection
{
    _id: ObjectId("product1"),
    name: "Laptop",
    price: 999.99,
    image: "laptop.jpg",
    description: "High-performance laptop...",
    specifications: { /* detailed specs */ },
    inventory: 50
}
```

#### Subset Pattern
```javascript
// Problem: Large documents where only subset is frequently accessed
// Solution: Split into main document and details

// Movie collection (frequently accessed data)
{
    _id: ObjectId("movie1"),
    title: "The Matrix",
    year: 1999,
    rating: "R",
    genres: ["Action", "Sci-Fi"],
    cast: ["Keanu Reeves", "Laurence Fishburne"],  // Top 5 cast
    rating_summary: {
        average: 4.5,
        count: 15000
    }
}

// Movie details collection (less frequently accessed)
{
    _id: ObjectId("..."),
    movie_id: ObjectId("movie1"),
    full_cast: [/* complete cast list */],
    crew: [/* complete crew list */],
    production_details: {/* detailed production info */},
    reviews: [/* detailed reviews */]
}
```

#### Computed Pattern
```javascript
// Problem: Expensive calculations performed repeatedly
// Solution: Pre-compute and store results

// Original approach - compute on read
{
    _id: ObjectId("..."),
    title: "Product A",
    reviews: [
        {rating: 5, helpful_votes: 10},
        {rating: 4, helpful_votes: 5},
        {rating: 5, helpful_votes: 8}
        // ... thousands of reviews
    ]
}

// Computed pattern - store pre-calculated values
{
    _id: ObjectId("..."),
    title: "Product A",
    rating_summary: {
        average: 4.67,
        count: 3,
        distribution: {
            "5": 2,
            "4": 1,
            "3": 0,
            "2": 0,
            "1": 0
        }
    },
    reviews: [/* review data */]
}

// Update computed fields when new review added
db.products.updateOne(
    {_id: productId},
    {
        $push: {reviews: newReview},
        $inc: {
            "rating_summary.count": 1,
            [`rating_summary.distribution.${newReview.rating}`]: 1
        },
        $set: {
            "rating_summary.average": newAverage
        }
    }
)
```

#### Bucket Pattern
```javascript
// Problem: Time series data with many small documents
// Solution: Group related data into buckets

// Bad approach - one document per measurement
{
    _id: ObjectId("..."),
    sensor_id: "sensor_1",
    temperature: 23.5,
    humidity: 65,
    timestamp: ISODate("2023-01-15T10:00:00Z")
}

// Bucket pattern - group by time period
{
    _id: ObjectId("..."),
    sensor_id: "sensor_1",
    date: ISODate("2023-01-15T10:00:00Z"),
    measurements: [
        {
            timestamp: ISODate("2023-01-15T10:00:00Z"),
            temperature: 23.5,
            humidity: 65
        },
        {
            timestamp: ISODate("2023-01-15T10:01:00Z"),
            temperature: 23.7,
            humidity: 64
        }
        // ... up to 60 measurements per hour
    ],
    measurement_count: 2,
    summary: {
        avg_temperature: 23.6,
        max_temperature: 23.7,
        min_temperature: 23.5
    }
}
```

### 5.4 Data Validation

#### JSON Schema Validation
```javascript
// Create collection with validation
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email", "age"],
            properties: {
                name: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                    description: "must be a valid email address"
                },
                age: {
                    bsonType: "int",
                    minimum: 0,
                    maximum: 150,
                    description: "must be an integer between 0 and 150"
                },
                address: {
                    bsonType: "object",
                    properties: {
                        street: {bsonType: "string"},
                        city: {bsonType: "string"},
                        zip: {
                            bsonType: "string",
                            pattern: "^[0-9]{5}$"
                        }
                    },
                    additionalProperties: false
                },
                hobbies: {
                    bsonType: "array",
                    items: {
                        bsonType: "string"
                    },
                    uniqueItems: true
                }
            },
            additionalProperties: false
        }
    },
    validationLevel: "strict",      // strict, moderate
    validationAction: "error"       // error, warn
})
```

#### Query Expression Validation
```javascript
// Using query operators for validation
db.createCollection("products", {
    validator: {
        $and: [
            {name: {$type: "string"}},
            {price: {$gte: 0}},
            {category: {$in: ["electronics", "books", "clothing", "home"]}},
            {
                $or: [
                    {stock: {$exists: false}},  // Optional field
                    {stock: {$gte: 0}}          // If exists, must be >= 0
                ]
            }
        ]
    }
})
```

#### Updating Validation Rules
```javascript
// Modify existing collection validation
db.runCommand({
    collMod: "users",
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email"],  // Removed age requirement
            properties: {
                name: {bsonType: "string"},
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                },
                age: {
                    bsonType: "int",
                    minimum: 13,  // Changed minimum age
                    maximum: 120
                }
            }
        }
    },
    validationLevel: "moderate"  // Only validate new documents
})
```

#### Custom Validation Functions
```javascript
// Application-level validation example (pseudo-code)
function validateUser(userData) {
    const errors = [];
    
    // Required fields
    if (!userData.name || userData.name.trim().length === 0) {
        errors.push("Name is required");
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
        errors.push("Valid email is required");
    }
    
    // Custom business logic
    if (userData.age && userData.age < 13) {
        errors.push("Users must be at least 13 years old");
    }
    
    // Check for duplicate email
    const existingUser = db.users.findOne({
        email: userData.email,
        _id: {$ne: userData._id}  // Exclude current user for updates
    });
    
    if (existingUser) {
        errors.push("Email already exists");
    }
    
    return errors;
}
```

---

## Day 1 Labs Overview
**Total: 5 Labs × 45 minutes each = 225 minutes (3.75 hours)**

---

## Lab 1: MongoDB Setup & Basic Operations
### Duration: 45 minutes
### Placement: After "Basic Operations & CRUD" session

#### Objectives
- Set up MongoDB environment
- Practice basic CRUD operations
- Understand document structure

#### Lab Activities

**Part A: Environment Setup (15 minutes)**
```javascript
// 1. Connect to MongoDB
mongosh

// 2. Create and switch to database
use lab1_library

// 3. Check current database
db.getName()

// 4. Show available databases
show dbs
```

**Part B: Basic CRUD Operations (30 minutes)**
```javascript
// Create a library management system

// 1. Insert books (CREATE)
db.books.insertMany([
    {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "978-0-7432-7356-5",
        year: 1925,
        genre: "Fiction",
        available: true,
        copies: 3
    },
    {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "978-0-06-112008-4",
        year: 1960,
        genre: "Fiction",
        available: true,
        copies: 2
    },
    {
        title: "1984",
        author: "George Orwell",
        isbn: "978-0-452-28423-4",
        year: 1949,
        genre: "Dystopian Fiction",
        available: false,
        copies: 1
    }
]);

// 2. Read operations (READ)
// Find all books
db.books.find().pretty();

// Find available books
db.books.find({available: true});

// Find books by author
db.books.find({author: "George Orwell"});

// Find books published after 1950
db.books.find({year: {$gt: 1950}});

// 3. Update operations (UPDATE)
// Update book availability
db.books.updateOne(
    {title: "1984"},
    {$set: {available: true}}
);

// Add new field to all books
db.books.updateMany(
    {},
    {$set: {last_updated: new Date()}}
);

// Increment copies for a book
db.books.updateOne(
    {title: "The Great Gatsby"},
    {$inc: {copies: 2}}
);

// 4. Delete operations (DELETE)
// Remove books with 0 copies
db.books.deleteMany({copies: 0});

// Remove specific book
db.books.deleteOne({title: "Test Book"});
```

**Lab Exercises:**
1. Add 5 more books with different genres
2. Create a members collection with borrower information
3. Practice finding books using different query operators
4. Update multiple books to add a "location" field

---

## Lab 2: Query Mastery Workshop
### Duration: 45 minutes
### Placement: After "Query Fundamentals" session

#### Objectives
- Master MongoDB query operators
- Practice complex query combinations
- Work with arrays and nested documents

#### Lab Activities

**Part A: Setup Sample Data (10 minutes)**
```javascript
// Switch to new database
use lab2_social

// Insert user profiles
db.users.insertMany([
    {
        username: "alice_wonder",
        profile: {
            name: "Alice Wonderland",
            age: 28,
            email: "alice@example.com",
            location: {
                city: "New York",
                state: "NY",
                country: "USA"
            }
        },
        interests: ["photography", "travel", "reading"],
        followers: 1250,
        following: 180,
        posts: 45,
        verified: true,
        join_date: ISODate("2020-03-15")
    },
    {
        username: "bob_builder",
        profile: {
            name: "Bob Builder",
            age: 35,
            email: "bob@example.com",
            location: {
                city: "Los Angeles",
                state: "CA",
                country: "USA"
            }
        },
        interests: ["construction", "tools", "diy"],
        followers: 890,
        following: 95,
        posts: 23,
        verified: false,
        join_date: ISODate("2021-07-22")
    },
    {
        username: "carol_codes",
        profile: {
            name: "Carol Coder",
            age: 24,
            email: "carol@example.com",
            location: {
                city: "Austin",
                state: "TX",
                country: "USA"
            }
        },
        interests: ["programming", "ai", "machine learning", "photography"],
        followers: 2100,
        following: 320,
        posts: 78,
        verified: true,
        join_date: ISODate("2019-11-08")
    }
]);
```

**Part B: Query Practice (35 minutes)**
```javascript
// 1. Comparison Operators
// Users older than 25
db.users.find({"profile.age": {$gt: 25}});

// Users with followers between 1000 and 2000
db.users.find({followers: {$gte: 1000, $lte: 2000}});

// Users not from California
db.users.find({"profile.location.state": {$ne: "CA"}});

// 2. Logical Operators
// Verified users OR users with >1000 followers
db.users.find({
    $or: [
        {verified: true},
        {followers: {$gt: 1000}}
    ]
});

// Users interested in photography AND verified
db.users.find({
    $and: [
        {interests: "photography"},
        {verified: true}
    ]
});

// 3. Element Operators
// Users with email field
db.users.find({"profile.email": {$exists: true}});

// Users where age is a number
db.users.find({"profile.age": {$type: "number"}});

// 4. Array Operators
// Users interested in exactly these hobbies
db.users.find({interests: {$all: ["photography", "travel"]}});

// Users with exactly 3 interests
db.users.find({interests: {$size: 3}});

// Users interested in programming or ai
db.users.find({interests: {$in: ["programming", "ai"]}});
```

**Challenge Exercises:**
1. Find users who joined in 2020 or 2021
2. Find users with more followers than following
3. Find users from Texas who are verified
4. Find users interested in technology-related topics (programming, ai, machine learning)

---

## Lab 3: Advanced Querying & Projections
### Duration: 45 minutes
### Placement: After "Advanced Querying" session

#### Objectives
- Master projection techniques
- Practice regex queries
- Implement sorting and pagination

#### Lab Activities

**Part A: E-commerce Product Database (15 minutes)**
```javascript
// Switch to new database
use lab3_shop

// Insert product data
db.products.insertMany([
    {
        name: "MacBook Pro 16-inch",
        description: "Powerful laptop for professionals",
        price: 2499.99,
        category: "Laptops",
        brand: "Apple",
        specs: {
            cpu: "M2 Pro",
            ram: "16GB",
            storage: "512GB SSD",
            screen: "16-inch Retina"
        },
        tags: ["laptop", "apple", "professional", "m2"],
        rating: 4.8,
        reviews: 156,
        stock: 25,
        created: ISODate("2023-01-15")
    },
    {
        name: "Dell XPS 13",
        description: "Ultrabook for business and personal use",
        price: 1299.99,
        category: "Laptops",
        brand: "Dell",
        specs: {
            cpu: "Intel i7",
            ram: "16GB",
            storage: "256GB SSD",
            screen: "13-inch FHD"
        },
        tags: ["laptop", "dell", "ultrabook", "business"],
        rating: 4.5,
        reviews: 89,
        stock: 18,
        created: ISODate("2023-02-10")
    },
    {
        name: "iPhone 15 Pro",
        description: "Latest smartphone with advanced camera",
        price: 999.99,
        category: "Smartphones",
        brand: "Apple",
        specs: {
            storage: "128GB",
            camera: "48MP Triple",
            display: "6.1-inch Super Retina",
            chip: "A17 Pro"
        },
        tags: ["smartphone", "apple", "camera", "5g"],
        rating: 4.7,
        reviews: 234,
        stock: 42,
        created: ISODate("2023-03-01")
    }
]);
```

**Part B: Projection Practice (15 minutes)**
```javascript
// 1. Basic projections
// Show only name and price
db.products.find({}, {name: 1, price: 1, _id: 0});

// Exclude description and specs
db.products.find({}, {description: 0, specs: 0});

// 2. Nested projections
// Show only CPU and RAM from specs
db.products.find({}, {
    name: 1,
    "specs.cpu": 1,
    "specs.ram": 1,
    _id: 0
});

// 3. Array projections with $slice
// Show only first 2 tags
db.products.find({}, {
    name: 1,
    tags: {$slice: 2},
    _id: 0
});
```

**Part C: Regex and Advanced Queries (15 minutes)**
```javascript
// 1. Regular expressions
// Products with "Pro" in the name
db.products.find({name: /Pro/});

// Case-insensitive search for "apple"
db.products.find({brand: /apple/i});

// Products starting with "Mac"
db.products.find({name: /^Mac/});

// 2. Sorting and limiting
// Most expensive products first
db.products.find({}).sort({price: -1});

// Highest rated products with pagination
db.products.find({})
    .sort({rating: -1})
    .skip(0)
    .limit(2);

// 3. Complex combinations
// Apple products under $2000, sorted by price
db.products.find({
    brand: "Apple",
    price: {$lt: 2000}
}).sort({price: 1});
```

**Challenge Exercises:**
1. Find products with "book" in the name (case-insensitive)
2. Get the cheapest product in each category
3. Find products with rating above 4.5 and more than 100 reviews
4. Implement pagination showing products 3-4 from sorted results

---

## Lab 4: Data Modeling & Schema Design
### Duration: 45 minutes
### Placement: After "Data Modeling Basics" session

#### Objectives
- Design effective document schemas
- Practice embedding vs referencing decisions
- Implement data validation

#### Lab Activities

**Part A: University System Design (20 minutes)**
```javascript
// Switch to new database
use lab4_university

// Design 1: Embedded approach for courses with small student lists
db.courses.insertMany([
    {
        course_code: "CS101",
        title: "Introduction to Computer Science",
        credits: 3,
        instructor: {
            name: "Dr. Sarah Johnson",
            email: "sarah.johnson@university.edu",
            office: "CS Building 201"
        },
        schedule: {
            days: ["Monday", "Wednesday", "Friday"],
            time: "10:00-11:00",
            room: "CS-101"
        },
        enrolled_students: [
            {
                student_id: "S001",
                name: "Alice Smith",
                email: "alice@student.edu",
                enrollment_date: ISODate("2023-08-15")
            },
            {
                student_id: "S002",
                name: "Bob Jones",
                email: "bob@student.edu",
                enrollment_date: ISODate("2023-08-16")
            }
        ],
        max_capacity: 30,
        semester: "Fall 2023"
    }
]);

// Design 2: Referenced approach for large-scale system
// Students collection
db.students.insertMany([
    {
        _id: "S001",
        name: "Alice Smith",
        email: "alice@student.edu",
        major: "Computer Science",
        year: 2,
        gpa: 3.8,
        address: {
            street: "123 Campus Dr",
            city: "University City",
            state: "CA",
            zip: "90210"
        },
        emergency_contact: {
            name: "Mary Smith",
            relationship: "Mother",
            phone: "555-1234"
        }
    },
    {
        _id: "S002",
        name: "Bob Jones",
        email: "bob@student.edu",
        major: "Mathematics",
        year: 1,
        gpa: 3.6,
        address: {
            street: "456 Student Ave",
            city: "University City",
            state: "CA",
            zip: "90210"
        },
        emergency_contact: {
            name: "John Jones",
            relationship: "Father",
            phone: "555-5678"
        }
    }
]);

// Enrollments collection (junction table)
db.enrollments.insertMany([
    {
        student_id: "S001",
        course_code: "CS101",
        semester: "Fall 2023",
        grade: null,  // Not yet assigned
        enrollment_date: ISODate("2023-08-15"),
        status: "enrolled"
    },
    {
        student_id: "S002",
        course_code: "CS101",
        semester: "Fall 2023",
        grade: null,
        enrollment_date: ISODate("2023-08-16"),
        status: "enrolled"
    }
]);
```

**Part B: Schema Validation (15 minutes)**
```javascript
// Create students collection with validation
db.createCollection("validated_students", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["student_id", "name", "email", "major"],
            properties: {
                student_id: {
                    bsonType: "string",
                    pattern: "^S[0-9]{3}$",
                    description: "Student ID must be in format S###"
                },
                name: {
                    bsonType: "string",
                    minLength: 2,
                    maxLength: 100
                },
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@student\\.edu$",
                    description: "Must be a valid student email"
                },
                major: {
                    bsonType: "string",
                    enum: ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology"]
                },
                year: {
                    bsonType: "int",
                    minimum: 1,
                    maximum: 4
                },
                gpa: {
                    bsonType: "double",
                    minimum: 0.0,
                    maximum: 4.0
                }
            }
        }
    }
});

// Test validation
// This should work
db.validated_students.insertOne({
    student_id: "S003",
    name: "Carol Williams",
    email: "carol@student.edu",
    major: "Physics",
    year: 3,
    gpa: 3.9
});

// This should fail (invalid email)
try {
    db.validated_students.insertOne({
        student_id: "S004",
        name: "Dave Brown",
        email: "dave@gmail.com",  // Wrong domain
        major: "Chemistry"
    });
} catch (e) {
    print("Validation error: " + e.message);
}
```

**Part C: Design Patterns Practice (10 minutes)**
```javascript
// Attribute pattern for varying course requirements
db.course_requirements.insertOne({
    course_code: "CS101",
    title: "Introduction to Computer Science",
    requirements: [
        {type: "prerequisite", value: "None"},
        {type: "textbook", value: "Introduction to Algorithms"},
        {type: "software", value: "Python 3.8+"},
        {type: "hardware", value: "Laptop required"}
    ],
    // Computed pattern - store calculated values
    statistics: {
        total_enrolled: 25,
        avg_grade: 3.2,
        completion_rate: 0.94
    }
});

// Extended reference pattern
db.student_transcripts.insertOne({
    student_id: "S001",
    courses: [
        {
            course_code: "CS101",
            course_title: "Introduction to Computer Science",  // Extended reference
            credits: 3,
            grade: "A",
            semester: "Fall 2023",
            instructor_name: "Dr. Sarah Johnson"  // Frequently accessed instructor info
        }
    ],
    gpa: 3.8,
    total_credits: 15
});
```

**Design Challenge:**
Design a hospital management system considering:
1. Patients with medical history
2. Doctors with specializations
3. Appointments and scheduling
4. Medical records and prescriptions
5. Billing and insurance information

---

## Lab 5: E-commerce Analytics Project
### Duration: 45 minutes
### Placement: End of Day 1

#### Objectives
- Integrate all Day 1 concepts
- Build a complete application database
- Practice real-world scenarios

#### Lab Activities

**Part A: Complete E-commerce Setup (15 minutes)**
```javascript
// Switch to main project database
use lab5_ecommerce

// Create collections with validation
db.createCollection("customers", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email"],
            properties: {
                name: {bsonType: "string"},
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                phone: {bsonType: "string"},
                address: {
                    bsonType: "object",
                    properties: {
                        street: {bsonType: "string"},
                        city: {bsonType: "string"},
                        state: {bsonType: "string"},
                        zip: {bsonType: "string"}
                    }
                }
            }
        }
    }
});

// Insert comprehensive sample data
db.categories.insertMany([
    {name: "Electronics", description: "Electronic devices and gadgets"},
    {name: "Books", description: "Books and educational materials"},
    {name: "Clothing", description: "Apparel and accessories"},
    {name: "Home", description: "Home and kitchen items"}
]);

// Get category IDs
const electronicsId = db.categories.findOne({name: "Electronics"})._id;
const booksId = db.categories.findOne({name: "Books"})._id;
const clothingId = db.categories.findOne({name: "Clothing"})._id;

// Insert products with rich data
db.products.insertMany([
    {
        name: "Wireless Bluetooth Headphones",
        description: "High-quality wireless headphones with noise cancellation",
        price: 199.99,
        category_id: electronicsId,
        brand: "TechSound",
        specifications: {
            battery_life: "30 hours",
            weight: "250g",
            connectivity: "Bluetooth 5.0",
            features: ["Noise Cancellation", "Fast Charging", "Voice Assistant"]
        },
        images: ["headphones1.jpg", "headphones2.jpg"],
        tags: ["wireless", "bluetooth", "audio", "music"],
        stock: 45,
        rating_summary: {average: 4.5, count: 128},
        created_at: ISODate("2023-01-10")
    },
    {
        name: "JavaScript: The Good Parts",
        description: "Essential JavaScript programming guide",
        price: 29.99,
        category_id: booksId,
        brand: "O'Reilly",
        specifications: {
            author: "Douglas Crockford",
            pages: 176,
            isbn: "978-0596517748",
            publisher: "O'Reilly Media"
        },
        images: ["jsbook.jpg"],
        tags: ["programming", "javascript", "web development"],
        stock: 12,
        rating_summary: {average: 4.2, count: 89},
        created_at: ISODate("2023-01-05")
    }
    // Add more products...
]);
```

**Part B: Customer and Order Simulation (15 minutes)**
```javascript
// Insert customers
db.customers.insertMany([
    {
        name: "Emma Thompson",
        email: "emma@example.com",
        phone: "555-0123",
        address: {
            street: "123 Main St",
            city: "Seattle",
            state: "WA",
            zip: "98101"
        },
        preferences: {
            categories: ["Electronics", "Books"],
            marketing_emails: true
        },
        created_at: ISODate("2022-06-15")
    },
    {
        name: "James Wilson",
        email: "james@example.com",
        phone: "555-0456",
        address: {
            street: "456 Oak Ave",
            city: "Portland",
            state: "OR",
            zip: "97201"
        },
        preferences: {
            categories: ["Clothing", "Home"],
            marketing_emails: false
        },
        created_at: ISODate("2022-08-20")
    }
]);

// Create realistic orders
const emmaId = db.customers.findOne({email: "emma@example.com"})._id;
const headphonesId = db.products.findOne({name: /Headphones/})._id;

db.orders.insertMany([
    {
        customer_id: emmaId,
        order_number: "ORD-2023-001",
        items: [
            {
                product_id: headphonesId,
                product_name: "Wireless Bluetooth Headphones",
                quantity: 1,
                unit_price: 199.99,
                total_price: 199.99
            }
        ],
        subtotal: 199.99,
        tax: 16.99,
        shipping: 9.99,
        total: 226.97,
        shipping_address: {
            street: "123 Main St",
            city: "Seattle",
            state: "WA",
            zip: "98101"
        },
        status: "delivered",
        order_date: ISODate("2023-02-15"),
        delivery_date: ISODate("2023-02-18")
    }
]);
```

**Part C: Analytics and Reporting (15 minutes)**
```javascript
// 1. Customer analysis
// Top customers by total spending
db.orders.aggregate([
    {
        $group: {
            _id: "$customer_id",
            total_spent: {$sum: "$total"},
            order_count: {$sum: 1},
            avg_order_value: {$avg: "$total"}
        }
    },
    {
        $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customer"
        }
    },
    {$unwind: "$customer"},
    {
        $project: {
            customer_name: "$customer.name",
            customer_email: "$customer.email",
            total_spent: {$round: ["$total_spent", 2]},
            order_count: 1,
            avg_order_value: {$round: ["$avg_order_value", 2]}
        }
    },
    {$sort: {total_spent: -1}}
]);

// 2. Product performance
// Best selling products with revenue
db.orders.aggregate([
    {$unwind: "$items"},
    {
        $group: {
            _id: "$items.product_id",
            product_name: {$first: "$items.product_name"},
            units_sold: {$sum: "$items.quantity"},
            total_revenue: {$sum: "$items.total_price"}
        }
    },
    {$sort: {total_revenue: -1}},
    {$limit: 5}
]);

// 3. Category analysis
db.orders.aggregate([
    {$unwind: "$items"},
    {
        $lookup: {
            from: "products",
            localField: "items.product_id",
            foreignField: "_id",
            as: "product"
        }
    },
    {$unwind: "$product"},
    {
        $lookup: {
            from: "categories",
            localField: "product.category_id",
            foreignField: "_id",
            as: "category"
        }
    },
    {$unwind: "$category"},
    {
        $group: {
            _id: "$category.name",
            revenue: {$sum: "$items.total_price"},
            units_sold: {$sum: "$items.quantity"},
            avg_price: {$avg: "$items.unit_price"}
        }
    },
    {$sort: {revenue: -1}}
]);

// 4. Monthly sales trends
db.orders.aggregate([
    {
        $group: {
            _id: {
                year: {$year: "$order_date"},
                month: {$month: "$order_date"}
            },
            total_sales: {$sum: "$total"},
            order_count: {$sum: 1},
            avg_order_value: {$avg: "$total"}
        }
    },
    {$sort: {"_id.year": 1, "_id.month": 1}}
]);
```

**Final Challenge - Business Intelligence Dashboard:**
Create queries for:
1. Customer retention rate (repeat customers)
2. Inventory status (low stock alerts)
3. Geographic sales distribution
4. Product recommendation engine (customers who bought X also bought Y)
5. Seasonal trends analysis

---

## Lab Summary & Assessment

### Lab Completion Checklist
- [ ] Lab 1: Basic operations mastery
- [ ] Lab 2: Query operators proficiency  
- [ ] Lab 3: Advanced querying skills
- [ ] Lab 4: Schema design understanding
- [ ] Lab 5: Real-world application building

### Key Skills Developed
1. **Database Operations**: Create, connect, manage MongoDB databases
2. **CRUD Mastery**: Insert, find, update, delete documents efficiently
3. **Query Expertise**: Complex queries with multiple operators
4. **Schema Design**: Effective document structure and relationships
5. **Performance Awareness**: Indexing and optimization basics
6. **Real-world Application**: End-to-end e-commerce system

### Next Steps Preparation
- Review aggregation pipeline concepts
- Understand indexing strategy importance
- Prepare for Day 2 advanced topics

**Total Lab Time: 225 minutes (3 hours 45 minutes)**

---

## Day 1 Summary and Wrap-up

### Key Concepts Covered
1. **NoSQL vs SQL** - Understanding when to choose document databases
2. **MongoDB Architecture** - Documents, collections, BSON format
3. **CRUD Operations** - Complete create, read, update, delete operations
4. **Query Language** - Comparison, logical, element, and array operators
5. **Advanced Querying** - Regex, projection, sorting, and pagination
6. **Data Modeling** - Embedding vs referencing, relationship patterns
7. **Schema Design** - Attribute, subset, computed, and bucket patterns
8. **Data Validation** - JSON Schema and query expression validation

### Best Practices Learned
- **Document Design**: Keep related data together when accessed together
- **Query Optimization**: Use indexes for frequently queried fields
- **Data Validation**: Implement validation at the database level for data integrity
- **Naming Conventions**: Use consistent, descriptive field names
- **Error Handling**: Always check for errors in insert/update operations

### Common Pitfalls to Avoid
- **Over-normalization**: Don't split data unnecessarily like in relational databases
- **Under-indexing**: Missing indexes on frequently queried fields
- **Large Documents**: Avoid documents approaching the 16MB limit
- **Unbounded Arrays**: Arrays that grow indefinitely can cause performance issues
- **Inconsistent Schema**: While flexible, maintain some consistency for application logic

### Homework/Practice Assignments

#### Assignment 1: Personal Project Database
Design and implement a database for a personal project management system:
- Projects with tasks and deadlines
- Team members and their roles
- Time tracking and progress reports
- File attachments and comments

Requirements:
- Use appropriate data modeling patterns
- Implement data validation
- Create necessary indexes
- Write 10 different query examples

#### Assignment 2: Query Optimization Challenge
Given this slow query, optimize it using proper indexing and query restructuring:
```javascript
// Slow query - find popular products in electronics category with good reviews
db.products.find({
    category_id: ObjectId("electronics_id"),
    price: {$gte: 100, $lte: 1000}
}).forEach(function(product) {
    const reviews = db.reviews.find({
        product_id: product._id,
        rating: {$gte: 4}
    }).toArray();
    
    if (reviews.length >= 10) {
        print(product.name + " - " + reviews.length + " good reviews");
    }
});
```

Optimize using:
- Proper indexes
- Aggregation pipeline
- Embedded review summaries

### Day 2 Preview
Tomorrow we'll dive into:
- **Aggregation Framework** - Complex data processing and analytics
- **Advanced Indexing** - Performance optimization strategies
- **Transactions** - ACID properties and multi-document operations
- **Replication** - High availability and data redundancy
- **Production Considerations** - Monitoring and best practices

### Additional Resources
- **MongoDB Documentation**: [docs.mongodb.com](https://docs.mongodb.com)
- **MongoDB University**: Free online courses
- **Community Forums**: [community.mongodb.com](https://community.mongodb.com)
- **Sample Datasets**: [github.com/mongodb/docs-assets](https://github.com/mongodb/docs-assets)

### Q&A Session
- Open floor for questions about today's content
- Clarification on complex topics
- Discussion of real-world scenarios
- Troubleshooting common issues

---

*End of Day 1 Presentation Material*

**Total Duration**: 7.5 hours (including breaks)
**Next Session**: Day 2 - Advanced Features & Performance