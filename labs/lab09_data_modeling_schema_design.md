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
   };
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

### Part B: Schema Validation (20 minutes)
1. **Create Validation Rules**
   ```javascript
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
   })
   ```

## Challenge Exercise
Design an insurance fraud detection system schema that supports suspicious claims, investigation workflows, agent alerts, and case management. Consider cardinality, query patterns, and compliance requirements.