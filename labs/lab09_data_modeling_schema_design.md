# Lab 9: Data Modeling and Schema Design (45 minutes)

## Learning Objectives
- Design efficient schemas for different use cases
- Understand embedding vs referencing trade-offs
- Implement schema validation

## Prerequisites: Environment Setup

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./scripts/setup.sh
```

**Windows PowerShell:**
```powershell
.\scripts\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

**Load Course Data:**
> **New to MongoDB tooling?** See [Lab 1 — Choose Your Tool](lab01_mongodb_shell_mastery.md#choose-your-tool-mongodb-compass-or-mongosh-cli) for the Compass UI alternative (no shell-redirection issues, works the same on every OS).

```bash
mongosh < data/comprehensive_data_loader.js
```

> **Windows (PowerShell):** PowerShell does not forward `<` into `mongosh` — the command will error. Use `--file` instead:
> ```powershell
> mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
> ```

## Tasks

### Part A: Embed vs. Reference — Hands-On Comparison (25 minutes)

The single most consequential schema decision is whether to **embed** related data inside a parent document or **reference** it from another collection. Instead of reading about the tradeoff, build the same customer-and-claims dataset both ways and measure the difference yourself.

```javascript
use insurance_company

// Reset the demo collections so this is rerun-safe
db.cm_embedded.drop()
db.cm_referenced_customers.drop()
db.cm_referenced_claims.drop()
```

#### Build the same data, embedded

```javascript
// One customer document carries the claims array inline.
db.cm_embedded.insertOne({
    customerId: "C-EMB-001",
    name: "Alice Embedded",
    email: "alice@example.com",
    claims: [
        { claimNumber: "CLM-E-1", claimType: "Auto",     amount: 4200, status: "approved",     filedAt: new Date("2024-01-10") },
        { claimNumber: "CLM-E-2", claimType: "Property", amount:  900, status: "submitted",    filedAt: new Date("2024-03-22") },
        { claimNumber: "CLM-E-3", claimType: "Auto",     amount: 1800, status: "under_review", filedAt: new Date("2024-05-08") }
    ]
})
```

#### Build the same data, referenced

```javascript
// Customers and claims in separate collections, linked by customerId.
db.cm_referenced_customers.insertOne({
    customerId: "C-REF-001",
    name: "Bob Referenced",
    email: "bob@example.com"
})
db.cm_referenced_claims.insertMany([
    { claimNumber: "CLM-R-1", customerId: "C-REF-001", claimType: "Auto",     amount: 4200, status: "approved",     filedAt: new Date("2024-01-10") },
    { claimNumber: "CLM-R-2", customerId: "C-REF-001", claimType: "Property", amount:  900, status: "submitted",    filedAt: new Date("2024-03-22") },
    { claimNumber: "CLM-R-3", customerId: "C-REF-001", claimType: "Auto",     amount: 1800, status: "under_review", filedAt: new Date("2024-05-08") }
])
db.cm_referenced_claims.createIndex({ customerId: 1 })   // critical for the lookup below
```

#### Compare: "give me Alice and all her claims" — one round-trip vs many

```javascript
// Embedded: ONE find. The whole result is in one document.
db.cm_embedded.findOne({ customerId: "C-EMB-001" })

// Referenced: TWO finds (or one $lookup aggregation).
db.cm_referenced_customers.aggregate([
    { $match: { customerId: "C-REF-001" } },
    { $lookup: {
        from: "cm_referenced_claims",
        localField: "customerId",
        foreignField: "customerId",
        as: "claims"
    }}
])
```

Both return the same logical shape. The embedded read is one cursor with one document; the referenced read joins two collections. **For "give me everything about one customer," embed wins on read cost.**

#### Compare: "approve claim CLM-X-2" — how do the writes look?

```javascript
// Embedded: positional update INTO the array. Have to find the array element.
db.cm_embedded.updateOne(
    { customerId: "C-EMB-001", "claims.claimNumber": "CLM-E-2" },
    { $set: { "claims.$.status": "approved" } }
)

// Referenced: targeted update on a single claim document.
db.cm_referenced_claims.updateOne(
    { claimNumber: "CLM-R-2" },
    { $set: { status: "approved" } }
)
```

Both work. Look at `explain("executionStats")` for each — the referenced update's `totalDocsExamined` is 1 (with the index); the embedded update's is also 1 but it pulls / rewrites the entire customer document including all *other* claims. **For "update one item in a many list," referenced wins on write cost.**

#### Compare: "list all approved claims across the whole system"

```javascript
// Embedded: must $unwind every customer's claims array first.
db.cm_embedded.aggregate([
    { $unwind: "$claims" },
    { $match: { "claims.status": "approved" } },
    { $project: { _id: 0, customer: "$name", claim: "$claims.claimNumber", amount: "$claims.amount" } }
])

// Referenced: direct find -- the claims collection is already the right shape.
db.cm_referenced_claims.find({ status: "approved" })
```

The referenced query is shorter, faster, and uses any index on `status` directly. **For cross-cutting queries on the "many" side, referenced wins decisively.**

#### When does embed lose hard?

```javascript
// Pretend Alice files 100,000 claims over a decade. The single embedded doc grows
// past MongoDB's 16 MB document limit and INSERTS START FAILING. There's no fix
// other than re-modeling. Referenced has no such ceiling.

// Pretend you also want to query "show me all claims filed in Q1 2024 across
// all customers ordered by amount." With embed, every query walks every
// customer document. With reference, you index claims.filedAt + claims.amount
// and answer in milliseconds.
```

#### The rule of thumb

| Pattern | Embed when | Reference when |
|---|---|---|
| **Read pattern** | You always fetch parent + children together | You sometimes need just the children, or just the parent |
| **Write pattern** | Children rarely change individually | Children change independently of the parent |
| **Cardinality** | Bounded — small known max (e.g. addresses per user, < 10) | Unbounded or large (claims per customer, posts per user) |
| **Query target** | Cross-cutting queries always start from the parent | You query the children directly (by status, date, amount) |

The course's `insurance_company` data uses **both**: customers are referenced from policies (large cardinality, queried independently), but `coverageTypes` are embedded inside each policy (small cardinality, always read with the policy). Look at `db.policies.findOne()` — note both shapes coexisting.

```javascript
// Cleanup
db.cm_embedded.drop()
db.cm_referenced_customers.drop()
db.cm_referenced_claims.drop()
```

### Part B: Schema Implementation and Validation (20 minutes)

1. **Create Claims Collection with Embedded Schema**
   ```javascript
   use insurance_company

   // Drop existing collection for rerun safety
   db.insurance_claims.drop()

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
       status: "investigating"
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
   // Drop existing collection for rerun safety
   db.policyholders.drop()

   // Create collection with schema validation
   db.createCollection("policyholders", {
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["email", "licenseNumber", "createdAt"],
         properties: {
           email: {
             bsonType: "string",
             pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
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
     age: NumberInt(35),
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
       age: NumberInt(15),       // Too young
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

## Cleanup and Environment Teardown

### Clean Up Test Data (Optional)

```javascript
// Remove test collections created during this lab
db.policyholders.drop()
db.insurance_claims.drop()
print("✅ Test data cleaned up")
```

### Environment Teardown
When finished with the lab, use the standardized teardown script:

**macOS/Linux:**
```bash
cd scripts
./teardown.sh
```

**Windows PowerShell:**
```powershell
cd scripts
.\teardown.ps1
```

## Lab 9 Deliverables
✅ **Schema Design Patterns**: Analyzed embedding vs referencing for insurance claims data
✅ **Schema Validation**: Implemented collection-level validation rules for policyholders
✅ **Validation Testing**: Verified both valid and invalid documents against validation rules
✅ **Embedded Data Queries**: Queried nested documents and array fields in insurance schemas

## Challenge Exercise
Design an insurance fraud detection system schema that supports suspicious claims, investigation workflows, agent alerts, and case management. Consider cardinality, query patterns, and compliance requirements.