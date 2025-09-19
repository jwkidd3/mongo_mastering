# Lab 5: CRUD Operations - Update and Delete Operations (45 minutes)

## Learning Objectives
- Master updateOne(), updateMany(), and replaceOne() methods
- Understand update operators and their use cases
- Handle upsert operations and update options
- Master deleteOne() and deleteMany() operations safely

## Tasks

### Part A: Basic Update Operations (20 minutes)
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

### Part B: Advanced Update Techniques (15 minutes)
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

   db.products.insertOne ({
     name: "Multi-Variant Product",
     price: 29.99,
     category: "Clothes",
     variants: [
       { size: "S",  inStock: true},
       { size: "M", inStock: false},
       { size: "L", inStock: true}
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

### Part C: Delete Operations and Safety (10 minutes)
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

## Challenge Exercise
Implement a complete product lifecycle management system that includes:
- Product creation with validation
- Inventory updates with transaction-like safety
- Bulk price adjustments with rollback capability
- Archive and cleanup procedures
- Audit trail for all modifications
- Error handling and reporting for all operations