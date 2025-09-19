# Lab 4: CRUD Operations - Read and Query Mastery (45 minutes)

## Learning Objectives
- Master find() and findOne() methods with various options
- Understand query operators and logical combinations
- Implement projection, sorting, and result limiting
- Work with cursors and iteration methods

## Tasks

### Part A: Basic Query Operations (15 minutes)
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

### Part B: Advanced Querying Techniques (20 minutes)
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
       category: "Electronics",
       price: 55,
       ratings: [4, 5, 3, 4, 5],
       features: [
         {name: "camera", megapixels: 12},
         {name: "storage", gb: 128}
       ]
     },
     {
       name: "Tablet",
       tags: ["mobile", "entertainment"],
       category: "Clothing",
       price: 124,
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

### Part C: Result Formatting and Cursor Operations (10 minutes)
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
   db.products.find({}, {name: 1, "tags.1": 1})
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

## Challenge Exercise
Build a comprehensive product search system that supports:
- Text-based product name searches (case-insensitive)
- Price range filtering
- Category and tag-based filtering
- Sorting by multiple criteria
- Pagination with configurable page sizes
- Result statistics (total matches, average price, etc.)