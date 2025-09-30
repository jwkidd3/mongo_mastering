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
   use insurance_company

   // Update using $set operator
   db.policies.updateOne(
     {policyNumber: "POL-AUTO-001"},
     {$set: {premiumAmount: 949.99, lastUpdated: new Date()}}
   )

   // Verify the update worked
   db.policies.findOne({policyNumber: "POL-AUTO-001"}, {premiumAmount: 1, lastUpdated: 1})

   // Update nested fields
   db.policies.updateOne(
     {policyNumber: "POL-LIFE-001"},
     {
       $set: {
         "coverage.deathBenefit": 750000,
         "coverage.cashValue": "enhanced"
       }
     }
   )

   // Verify the nested field update
   db.policies.findOne({policyNumber: "POL-LIFE-001"}, {coverage: 1})

   // Unset (remove) fields
   db.policies.updateOne(
     {policyNumber: "POL-HOME-001"},
     {$unset: {deprecated: "", oldPremium: ""}}
   )

   // Increment/decrement values
   db.policies.updateOne(
     {policyNumber: "POL-AUTO-001"},
     {$inc: {claimCount: 1, renewalCount: 1}}
   )

   // Verify the increment worked
   db.policies.findOne({policyNumber: "POL-AUTO-001"}, {claimCount: 1, renewalCount: 1})
   ```

2. **Multiple Document Updates**
   ```javascript
   // Update all documents in category
   db.policies.updateMany(
     {policyType: "Auto"},
     {
       $set: {
         lastTypeUpdate: new Date(),
         featured: false
       }
     }
   )

   // Verify the bulk update worked
   db.policies.find({policyType: "Auto"}, {lastTypeUpdate: 1, featured: 1}).limit(3)

   // Conditional updates with complex criteria
   db.policies.updateMany(
     {
       premiumAmount: {$lt: 1000},
       active: true
     },
     {
       $set: {premiumCategory: "low-cost"},
       $inc: {popularityScore: 1}
     }
   )

   // Bulk premium adjustments
   db.policies.updateMany(
     {policyType: "Auto"},
     {$mul: {premiumAmount: 0.95}}  // 5% discount
   )

   // Verify the 5% discount was applied
   db.policies.find({policyType: "Auto"}, {policyNumber: 1, premiumAmount: 1}).limit(3)
   ```

3. **Array Update Operations**
   ```javascript
   // Add elements to arrays
   db.policies.updateOne(
     {policyNumber: "POL-VEH-001"},
     {$push: {coverageTypes: "roadside_assistance"}}
   )

   // Add multiple elements
   db.policies.updateOne(
     {policyNumber: "POL-VEH-001"},
     {$push: {coverageTypes: {$each: ["rental_car", "gap_coverage"]}}}
   )

   // Remove elements from arrays
   db.policies.updateOne(
     {policyNumber: "POL-VEH-001"},
     {$pull: {coverageTypes: "deprecated-coverage"}}
   )

   // Remove multiple elements
   db.policies.updateOne(
     {policyNumber: "POL-VEH-001"},
     {$pullAll: {claimHistory: ["DENIED", "FRAUDULENT"]}}  // Remove denied claims
   )

   // Add to set (avoid duplicates)
   db.policies.updateOne(
     {policyNumber: "POL-VEH-001"},
     {$addToSet: {coverageTypes: "comprehensive"}}
   )

   // Pop elements (remove first/last)
   db.policies.updateOne(
     {policyNumber: "POL-VEH-001"},
     {$pop: {claimHistory: 1}}  // Remove most recent claim
   )
   ```

### Part B: Advanced Update Techniques (15 minutes)
1. **Upsert Operations**
   ```javascript
   // Upsert: update if exists, insert if not
   db.policies.updateOne(
     {policyNumber: "POL-NEW-001"},
     {
       $set: {
         customerName: "New Customer",
         premiumAmount: 1599.99,
         policyType: "Auto"
       },
       $setOnInsert: {
         effectiveDate: new Date(),
         version: 1
       }
     },
     {upsert: true}
   )

   // Verify the upsert created the new document
   db.policies.findOne({policyNumber: "POL-NEW-001"})

   // Conditional upsert with complex logic
   db.claims.updateOne(
     {policyId: "POL-AUTO-001", claimType: "collision"},
     {
       $inc: {claimAmount: 500},
       $setOnInsert: {
         policyId: "POL-AUTO-001",
         claimType: "collision",
         filedDate: new Date()
       }
     },
     {upsert: true}
   )
   ```

2. **Replace Operations**
   ```javascript
   // Replace entire document (except _id)
   db.policies.replaceOne(
     {_id: "POL-HOME-001"},
     {
       policyNumber: "POL-HOME-001-RENEWED",
       premiumAmount: 1899.99,
       policyType: "Home",
       coverage: {
         dwellingLimit: 350000,
         personalPropertyLimit: 175000
       },
       renewedAt: new Date()
     }
   )

   // Conditional replacement
   var existingDoc = db.policies.findOne({policyNumber: "POL-LIFE-001"})
   if (existingDoc) {
     existingDoc.customerName = "Updated Customer Name"
     existingDoc.premiumAmount = 2799.99
     existingDoc.lastModified = new Date()
     db.policies.replaceOne({_id: existingDoc._id}, existingDoc)
   }
   ```

3. **Update with Array Filters**
   ```javascript
   // Update specific array elements

   db.policies.insertOne ({
     policyNumber: "POL-MULTI-001",
     premiumAmount: 1499.99,
     policyType: "Auto",
     vehicles: [
       { vin: "1HGBH41JXMN109186", covered: true},
       { vin: "2HGBH41JXMN109187", covered: false},
       { vin: "3HGBH41JXMN109188", covered: true}
     ]
  })

   // Update specific vehicle
   db.policies.updateOne(
     {policyNumber: "POL-MULTI-001"},
     {$set: {"vehicles.$[elem].covered": true}},
     {arrayFilters: [{"elem.vin": "2HGBH41JXMN109187"}]}
   )

   // Update multiple array elements
   db.policies.updateOne(
     {policyNumber: "POL-MULTI-001"},
     {$inc: {"vehicles.$[elem].deductible": 100}},
     {arrayFilters: [{"elem.deductible": {$lt: 1000}}]}
   )
   ```

### Part C: Delete Operations and Safety (10 minutes)
1. **Safe Deletion Practices**
   ```javascript
   // Always test with find first
   db.policies.find({premiumAmount: {$lt: 100}})

   // Count before deletion
   var countToDelete = db.policies.countDocuments({premiumAmount: {$lt: 100}})
   print("Will delete " + countToDelete + " documents")

   // Delete single document
   db.policies.deleteOne({premiumAmount: {$lt: 100}})

   // Verify the deletion worked
   db.policies.countDocuments({premiumAmount: {$lt: 100}})

   // Delete with specific _id for safety
   db.policies.deleteOne({_id: "POL-HOME-001"})

   // Verify specific document was deleted
   db.policies.findOne({_id: "POL-HOME-001"})
   ```

2. **Bulk Deletion Operations**
   ```javascript
   // Delete multiple documents
   var deleteResult = db.policies.deleteMany({
     policyType: "Discontinued",
     active: false
   })
   print("Deleted " + deleteResult.deletedCount + " documents")

   // Delete with complex criteria
   db.policies.deleteMany({
     $and: [
       {effectiveDate: {$lt: new Date("2023-01-01")}},
       {claimCount: 0},
       {policyType: {$in: ["Obsolete", "Deprecated"]}}
     ]
   })

   // Conditional deletion with verification
   var oldPolicies = db.policies.countDocuments({
     effectiveDate: {$lt: new Date("2020-01-01")}
   })

   if (oldPolicies > 0) {
     print("Found " + oldPolicies + " old policies to delete")
     // Uncomment to actually delete:
     // db.policies.deleteMany({effectiveDate: {$lt: new Date("2020-01-01")}})
   }
   ```

3. **Cleanup and Maintenance Operations**
   ```javascript
   // Remove all documents from collection (keeping collection)
   db.temp_claims.deleteMany({})

   // Drop entire collection
   db.obsolete_policies.drop()

   // Bulk cleanup with reporting
   var policyTypes = ["Obsolete", "Discontinued", "Expired"]
   policyTypes.forEach(function(policyType) {
     var count = db.policies.countDocuments({policyType: policyType})
     if (count > 0) {
       var result = db.policies.deleteMany({policyType: policyType})
       print("Removed " + result.deletedCount + " policies from " + policyType)
     }
   })

   // Archive before delete pattern
   var archiveCount = db.policies.countDocuments({
     status: "archived",
     archivedDate: {$lt: new Date(Date.now() - 365*24*60*60*1000)}
   })

   if (archiveCount > 0) {
     // First copy to archive collection
     db.policies.find({
       status: "archived",
       archivedDate: {$lt: new Date(Date.now() - 365*24*60*60*1000)}
     }).forEach(function(doc) {
       db.archived_policies.insertOne(doc)
     })

     // Then delete from main collection
     db.policies.deleteMany({
       status: "archived",
       archivedDate: {$lt: new Date(Date.now() - 365*24*60*60*1000)}
     })
   }
   ```

## Challenge Exercise
Implement a complete policy lifecycle management system that includes:
- Policy creation with validation
- Premium updates with transaction-like safety
- Bulk premium adjustments with rollback capability
- Archive and cleanup procedures for expired policies
- Audit trail for all policy modifications
- Error handling and reporting for all operations