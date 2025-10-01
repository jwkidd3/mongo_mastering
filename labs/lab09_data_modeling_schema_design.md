# Lab 2: Data Modeling and Schema Design (45 minutes)

## Learning Objectives
- Design efficient schemas for different use cases
- Understand embedding vs referencing trade-offs
- Implement schema validation

## Tasks

### Part A: Schema Design Patterns (25 minutes)
1. **Insurance Claims Schema**
   Design collections for insurance claims with embedded incident details and investigation notes:
   ```javascript
   // Claims collection with embedded investigation
   {
     _id: ObjectId("..."),
     claimNumber: "CLM-2024-001234",
     policyId: ObjectId("..."),
     incidentDescription: "Vehicle collision at intersection",
     adjuster: {
       _id: ObjectId("..."),
       name: "Sarah Johnson",
       email: "sarah.johnson@insuranceco.com",
       licenseNumber: "ADJ-5678"
     },
     incidentTypes: ["collision", "property damage", "injury"],
     investigationNotes: [
       {
         _id: ObjectId("..."),
         investigator: "Mike Thompson",
         note: "Photos taken, police report obtained",
         createdAt: ISODate("...")
       }
     ],
     filedAt: ISODate("..."),
     estimatedAmount: 8500
   }
   ```

2. **Insurance Policy System**
   ```javascript
   // Policy with coverage options pattern
   {
     _id: ObjectId("..."),
     policyNumber: "POL-AUTO-2024-5678",
     policyType: "Auto Insurance",
     carrier: "SafeGuard Insurance",
     coverageOptions: [
       {
         coverageCode: "COLL-500",
         coverageType: "Collision",
         deductible: 500,
         limit: 25000,
         premium: {
           monthly: 85,
           annual: 1020,
           discountApplied: 120
         }
       }
     ],
     policyDetails: {
       effectiveDate: ISODate("2024-01-01"),
       expirationDate: ISODate("2024-12-31"),
       renewalType: "Auto-Renewal"
     }
   }
   ```

### Part B: Schema Implementation and Validation (20 minutes)

1. **Create Claims Collection with Embedded Schema**
   ```javascript
   use insurance_company;

   // Create claims collection with embedded investigation data
   db.insurance_claims.insertMany([
     {
       claimNumber: "CLM-2024-001234",
       policyNumber: "POL-AUTO-2024-001",
       customerId: "CUST000001",
       incidentDescription: "Vehicle collision at intersection",
       adjuster: {
         name: "Sarah Johnson",
         email: "sarah.johnson@insuranceco.com",
         licenseNumber: "ADJ-5678"
       },
       incidentTypes: ["collision", "property damage", "injury"],
       investigationNotes: [
         {
           investigator: "Mike Thompson",
           note: "Photos taken, police report obtained",
           createdAt: new Date("2024-03-16")
         }
       ],
       filedAt: new Date("2024-03-15"),
       estimatedAmount: 8500,
       status: "under_investigation"
     },
     {
       claimNumber: "CLM-2024-001235",
       policyNumber: "POL-HOME-2024-002",
       customerId: "CUST000002",
       incidentDescription: "Water damage from burst pipe",
       adjuster: {
         name: "David Chen",
         email: "david.chen@insuranceco.com",
         licenseNumber: "ADJ-9012"
       },
       incidentTypes: ["water damage", "property damage"],
       investigationNotes: [
         {
           investigator: "Lisa Wong",
           note: "Plumber inspection completed",
           createdAt: new Date("2024-03-17")
         }
       ],
       filedAt: new Date("2024-03-16"),
       estimatedAmount: 12000,
       status: "approved"
     }
   ]);
   ```

2. **Create Validation Rules**
   ```javascript
   // Create collection with schema validation
   db.createCollection("policyholders", {
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["email", "licenseNumber", "createdAt"],
         properties: {
           email: {
             bsonType: "string",
             pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
           },
           licenseNumber: {
             bsonType: "string",
             minLength: 8,
             maxLength: 20
           },
           age: {
             bsonType: "int",
             minimum: 16,
             maximum: 120
           },
           communicationPreferences: {
             bsonType: "object",
             properties: {
               emailNotifications: { bsonType: "bool" },
               smsAlerts: { bsonType: "bool" }
             }
           }
         }
       }
     }
   });
   ```

3. **Test Schema Validation**
   ```javascript
   // Test valid document insertion
   db.policyholders.insertOne({
     email: "john.doe@email.com",
     licenseNumber: "LIC123456789",
     age: 35,
     createdAt: new Date(),
     communicationPreferences: {
       emailNotifications: true,
       smsAlerts: false
     }
   })

   // Test invalid document (should fail)
   try {
     db.policyholders.insertOne({
       email: "invalid-email",  // Invalid email format
       licenseNumber: "123",    // Too short
       age: 15,                 // Too young
       createdAt: new Date()
     })
   } catch (error) {
     print("Validation error (expected): " + error.message);
   }
   ```

4. **Query Embedded Data**
   ```javascript
   // Query claims by adjuster
   db.insurance_claims.find({
     "adjuster.name": "Sarah Johnson"
   });

   // Query claims with specific incident types
   db.insurance_claims.find({
     incidentTypes: { $in: ["collision", "water damage"] }
   });

   // Query investigation notes
   db.insurance_claims.find({
     "investigationNotes.investigator": "Mike Thompson"
   });

   // Aggregate claims by status
   db.insurance_claims.aggregate([
     { $group: {
       _id: "$status",
       totalAmount: { $sum: "$estimatedAmount" },
       count: { $sum: 1 }
     }}
   ]);
   ```

## Challenge Exercise
Design an insurance fraud detection system schema that supports suspicious claims, investigation workflows, agent alerts, and case management. Consider cardinality, query patterns, and compliance requirements.