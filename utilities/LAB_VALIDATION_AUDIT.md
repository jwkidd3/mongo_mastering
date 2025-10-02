# MongoDB Lab Validation Audit

**Total Tests: 87**
**Coverage: 100%**

Quick reference mapping validator tests to lab steps.

---

## Lab 1: MongoDB Shell Mastery (7 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 1 | Step 1 | `db.version()` |
| 2 | Step 2 | `show dbs` |
| 3 | Step 2 | `db.stats()` |
| 4 | Step 2 | `show collections` |
| 5 | Step 3 | JavaScript environment test |
| 6 | Step 3 | Mathematical operations |
| 7 | Step 4 | `db.runCommand("ping")` |

## Lab 2: Database & Collection Management (6 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 8 | Step 1 | `use insurance_test` |
| 9 | Step 2 | `db.stats(1024)` |
| 10 | Step 3 | `db.createCollection("simple_collection")` |
| 11 | Step 4 | `db.createCollection("capped_collection", {capped: true, size: 1000})` |
| 12 | Step 5 | Collection with validation |
| 13 | Step 6 | `db.runCommand("listCollections")` |

## Lab 3: CRUD Create and Insert (5 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 14 | Step 1 | `db.policies.insertOne()` - single document |
| 15 | Step 2 | `db.customers.insertOne()` - with explicit ObjectId |
| 16 | Step 3 | `db.policies.insertMany()` - multiple documents |
| 17 | Step 4 | `db.claims.insertOne()` - nested document |
| 18 | Step 5 | `db.policies.insertMany(..., {ordered: true})` - bulk insert |

## Lab 4: CRUD Read and Query (10 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 19 | Step 1 | `db.policies.find()` |
| 20 | Step 2 | `db.policies.countDocuments()` |
| 21 | Step 3 | `db.policies.find({annualPremium: {$gt: 1000}})` |
| 22 | Step 4 | `db.policies.find({annualPremium: {$gte: 500, $lte: 1500}})` |
| 23 | Step 5 | `db.policies.find({policyType: {$in: ["Auto", "Home"]}})` |
| 24 | Step 6 | `db.policies.find({$and: [{isActive: true}, {annualPremium: {$gt: 800}}]})` |
| 25 | Step 7 | `db.policies.find({coverageLimit: {$exists: true}})` |
| 26 | Step 8 | `db.policies.find({}, {policyNumber: 1, policyType: 1})` |
| 27 | Step 9 | `db.policies.find().sort({annualPremium: -1}).limit(3)` |
| 28 | Step 10 | `db.customers.find({email: /gmail/})` |

## Lab 5: CRUD Update and Delete (9 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 29 | Step 1 | `db.policies.updateOne(..., {$set: {annualPremium: 1100}})` |
| 30 | Step 2 | `db.customers.updateOne(..., {$inc: {policyCount: 1}})` |
| 31 | Step 3 | `db.policies.updateMany({policyType: "Auto"}, {$set: {category: "Vehicle"}})` |
| 32 | Step 4 | `db.customers.updateOne(..., {$push: {tags: "VIP"}})` |
| 33 | Step 5 | `db.customers.updateOne(..., {$addToSet: {tags: "Premium"}})` |
| 34 | Step 6 | `db.policies.updateOne(..., {...}, {upsert: true})` |
| 35 | Step 7 | `db.policies.replaceOne()` |
| 36 | Step 8 | `db.policies.deleteOne()` |
| 37 | Step 9 | `db.policies.deleteMany()` |

## Lab 6: Advanced Query Techniques (6 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 38 | Step 1 | Complex AND/OR query |
| 39 | Step 2 | Date range query |
| 40 | Step 3 | `db.policies.createIndex({policyType: "text", description: "text"})` |
| 41 | Step 4 | `db.policies.find({$text: {$search: "Auto"}})` |
| 42 | Step 5 | Regex pattern matching |
| 43 | Step 6 | Case-insensitive search |

## Lab 7: Aggregation Framework (5 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 44 | Step 1 | `db.policies.aggregate([{$group: {_id: "$policyType", count: {$sum: 1}}}])` |
| 45 | Step 2 | Revenue analysis by agent |
| 46 | Step 3 | Claims analysis by month |
| 47 | Step 4 | Join with `$lookup` |
| 48 | Step 5 | Array processing with `$unwind` |

## Lab 8: Indexing & Performance (5 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 49 | Step 1 | `db.policies.getIndexes()` |
| 50 | Step 2 | `db.policies.createIndex({customerId: 1, policyType: 1})` |
| 51 | Step 3 | `db.policies.createIndex({description: "text"}, {weights: {description: 10}})` |
| 52 | Step 4 | Partial index |
| 53 | Step 5 | `db.policies.find({policyType: "Auto"}).explain("executionStats")` |

## Lab 9: Data Modeling & Schema Design (8 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 54 | Step 1 | `db.insurance_claims.insertMany()` - embedded data |
| 55 | Step 2 | `db.createCollection("policyholders", {validator: {...}})` |
| 56 | Step 3 | Valid document insert |
| 57 | Step 3 | Try-catch validation error |
| 58 | Step 4 | `db.insurance_claims.find({"adjuster.name": "Sarah Johnson"})` |
| 59 | Step 4 | `db.insurance_claims.aggregate([{$group: {...}}])` |
| 60 | Step 4 | `db.insurance_claims.find({incidentTypes: {$in: [...]}})` |
| 61 | Step 4 | `db.insurance_claims.find({"investigationNotes.investigator": "Mike Thompson"})` |

## Lab 10: MongoDB Transactions (3 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 62 | Step 5 | Complete transaction with session management |
| 63 | Step 6 | Transaction rollback demonstration |
| 64 | Step 7 | Multi-collection transaction |

## Lab 11: Replica Sets & High Availability (12 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 65 | Step 1 | `rs.status()` |
| 66 | Step 1 | `rs.conf()` |
| 67 | Step 1 | `db.hello()` |
| 68 | Step 1 | `rs.printReplicationInfo()` |
| 69 | Step 1 | `rs.printSecondaryReplicationInfo()` |
| 70 | Step 2 | `getCurrentPrimary()` function |
| 71 | Step 3 | `explainElectionProcess()` function |
| 72 | Step 3 | Replica set health analysis |
| 73 | Step 2 | Display member status information |
| 74 | Step 2 | Member types explanation demonstration |
| 75 | Step 4 | Test read preferences (primary, secondaryPreferred, nearest) |
| 76 | Step 4 | Explain tagged read preferences concepts |

## Lab 12: Sharding & Horizontal Scaling (2 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 77 | Step 1 | `use insurance_distributed; db.runCommand("ping")` |
| 78 | Step 2 | `db.policies_geographic.insertMany()` |

## Lab 13: Change Streams & Real-time Processing (9 tests)

| Test | Lab Step | Command |
|------|----------|---------|
| 79 | Step 1 | `db.notifications.createIndex({userId: 1, createdAt: -1})` |
| 80 | Step 1 | `db.notifications.createIndex({type: 1, priority: 1})` |
| 81 | Step 1 | `db.notifications.createIndex({priority: 1, status: 1, createdAt: -1})` |
| 82 | Step 2 | `db.activity_log.createIndex({userId: 1, timestamp: -1})` |
| 83 | Step 2 | `db.activity_log.createIndex({operation: 1, entityType: 1, timestamp: -1})` |
| 84 | Step 2 | `db.activity_log.createIndex({userId: 1, operation: 1, timestamp: -1})` |
| 85 | Step 3 | `db.fraud_alerts.createIndex({alertType: 1, severity: 1, createdAt: -1})` |
| 86 | Step 3 | `db.fraud_alerts.createIndex({severity: 1, status: 1, investigatedAt: -1})` |
| 87 | Step 4 | `db.change_stream_resume_tokens.createIndex({streamId: 1, timestamp: -1}, {unique: true})` |

---

**✅ Perfect 1:1 Correlation Achieved**

Every validator test maps directly to a specific lab step, ensuring students experience exactly what's been validated.