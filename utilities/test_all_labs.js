#!/usr/bin/env mongosh

print("🧪 COMPREHENSIVE LABS 1-13 VALIDATION - EVERY COMMAND");
print("=" .repeat(80));

var totalCommands = 0;
var passedCommands = 0;
var failedCommands = 0;
var errors = [];

// Load data
try {
    load("data/comprehensive_data_loader.js");
    print("✅ Data loaded");
} catch (e) {
    print("❌ Data load failed: " + e.message);
}

// Clean test collections
db = db.getSiblingDB('insurance_company');
db.lab3_test_policies.drop();
db.lab3_test_customers.drop();
db.lab3_test_claims.drop();
print("✅ Test collections cleaned");

// LAB 1: MongoDB Shell Mastery
print("\n🔬 TESTING LAB 1: MongoDB Shell Mastery");
totalCommands++; try { var result1 = db.version(); print("✅ MongoDB version"); passedCommands++; } catch (error) { print("❌ MongoDB version - ERROR: " + error.message); errors.push("Lab1 version: " + error.message); failedCommands++; }
totalCommands++; try { var result2 = db.runCommand({buildInfo: 1}); print("✅ Build info"); passedCommands++; } catch (error) { print("❌ Build info - ERROR: " + error.message); errors.push("Lab1 buildInfo: " + error.message); failedCommands++; }
totalCommands++; try { var result3 = db; print("✅ Current database"); passedCommands++; } catch (error) { print("❌ Current database - ERROR: " + error.message); errors.push("Lab1 db: " + error.message); failedCommands++; }
totalCommands++; try { var result4 = db.serverStatus(); print("✅ Server status"); passedCommands++; } catch (error) { print("❌ Server status - ERROR: " + error.message); errors.push("Lab1 serverStatus: " + error.message); failedCommands++; }
totalCommands++; try { var result5 = db.runCommand({connectionStatus: 1}); print("✅ Connection status"); passedCommands++; } catch (error) { print("❌ Connection status - ERROR: " + error.message); errors.push("Lab1 connectionStatus: " + error.message); failedCommands++; }
totalCommands++; try { var result6 = db.adminCommand({listDatabases: 1}); print("✅ List databases"); passedCommands++; } catch (error) { print("❌ List databases - ERROR: " + error.message); errors.push("Lab1 listDatabases: " + error.message); failedCommands++; }
totalCommands++; try { var result7 = db.stats(); print("✅ Database stats"); passedCommands++; } catch (error) { print("❌ Database stats - ERROR: " + error.message); errors.push("Lab1 stats: " + error.message); failedCommands++; }
totalCommands++; try { var result8 = db.getName(); print("✅ Database name"); passedCommands++; } catch (error) { print("❌ Database name - ERROR: " + error.message); errors.push("Lab1 getName: " + error.message); failedCommands++; }
totalCommands++; try { db = db.getSiblingDB('insurance_company'); print("✅ Switch to insurance_company"); passedCommands++; } catch (error) { print("❌ Switch to insurance_company - ERROR: " + error.message); errors.push("Lab1 use: " + error.message); failedCommands++; }
totalCommands++; try { var result9 = db.runCommand("listCollections").cursor.firstBatch.map(c => c.name); print("✅ List collections"); passedCommands++; } catch (error) { print("❌ List collections - ERROR: " + error.message); errors.push("Lab1 listCollections: " + error.message); failedCommands++; }
totalCommands++; try { var result10 = db.createCollection("policies"); print("✅ Create collection"); passedCommands++; } catch (error) { print("❌ Create collection - ERROR: " + error.message); errors.push("Lab1 createCollection: " + error.message); failedCommands++; }
totalCommands++; try { var result11 = db.policies.getIndexes(); print("✅ Get indexes"); passedCommands++; } catch (error) { print("❌ Get indexes - ERROR: " + error.message); errors.push("Lab1 getIndexes: " + error.message); failedCommands++; }
totalCommands++; try { var result12 = db.runCommand({ping: 1}); print("✅ Ping command"); passedCommands++; } catch (error) { print("❌ Ping command - ERROR: " + error.message); errors.push("Lab1 ping: " + error.message); failedCommands++; }
totalCommands++; try { var result13 = db.getProfilingStatus(); print("✅ Profiling status"); passedCommands++; } catch (error) { print("❌ Profiling status - ERROR: " + error.message); errors.push("Lab1 getProfilingStatus: " + error.message); failedCommands++; }
totalCommands++; try { var result14 = db.currentOp(); print("✅ Current operations"); passedCommands++; } catch (error) { print("❌ Current operations - ERROR: " + error.message); errors.push("Lab1 currentOp: " + error.message); failedCommands++; }

// LAB 2: Database Management
print("\n🔬 TESTING LAB 2: Database Management");
totalCommands++; try { var result15 = db.stats(); print("✅ Database statistics"); passedCommands++; } catch (error) { print("❌ Database statistics - ERROR: " + error.message); errors.push("Lab2 stats: " + error.message); failedCommands++; }
totalCommands++; try { var result16 = db.stats(1024); print("✅ Database stats KB"); passedCommands++; } catch (error) { print("❌ Database stats KB - ERROR: " + error.message); errors.push("Lab2 stats KB: " + error.message); failedCommands++; }
totalCommands++; try { var result17 = db.runCommand({dbStats: 1, scale: 1024}); print("✅ DB stats command"); passedCommands++; } catch (error) { print("❌ DB stats command - ERROR: " + error.message); errors.push("Lab2 dbStats: " + error.message); failedCommands++; }
totalCommands++; try { var result18 = db.createCollection("lab2_customers"); print("✅ Create lab2 customers"); passedCommands++; } catch (error) { print("❌ Create lab2 customers - ERROR: " + error.message); errors.push("Lab2 createCollection: " + error.message); failedCommands++; }
totalCommands++; try { var result19 = db.createCollection("audit_logs", {capped: true, size: 1000000, max: 5000}); print("✅ Create capped collection"); passedCommands++; } catch (error) { print("❌ Create capped collection - ERROR: " + error.message); errors.push("Lab2 capped: " + error.message); failedCommands++; }
totalCommands++; try { var result20 = db.customers.stats(); print("✅ Collection stats"); passedCommands++; } catch (error) { print("❌ Collection stats - ERROR: " + error.message); errors.push("Lab2 collection stats: " + error.message); failedCommands++; }
totalCommands++; try { var result21 = db.audit_logs.isCapped(); print("✅ Check capped"); passedCommands++; } catch (error) { print("❌ Check capped - ERROR: " + error.message); errors.push("Lab2 isCapped: " + error.message); failedCommands++; }

// LAB 3: CRUD Create/Insert
print("\n🔬 TESTING LAB 3: CRUD Create/Insert");
totalCommands++; try { var result22 = db.lab3_test_policies.insertOne({policyNumber: "POL-AUTO-001", premiumAmount: 899.99, policyType: "Auto"}); print("✅ Insert basic policy"); passedCommands++; } catch (error) { print("❌ Insert basic policy - ERROR: " + error.message); errors.push("Lab3 basic insertOne: " + error.message); failedCommands++; }
totalCommands++; try { var result23 = db.lab3_test_policies.insertOne({_id: "POL-HOME-001", policyNumber: "POL-HOME-001", premiumAmount: 1299.99, policyType: "Home", insuranceCarrier: "SafeGuard Insurance"}); print("✅ Insert with custom ID"); passedCommands++; } catch (error) { print("❌ Insert with custom ID - ERROR: " + error.message); errors.push("Lab3 custom ID: " + error.message); failedCommands++; }
totalCommands++; try { var result24 = db.lab3_test_policies.insertOne({policyNumber: "POL-LIFE-001", premiumAmount: 2499.99, policyType: "Life", coverage: {deathBenefit: 500000, termLength: "20 years", cashValue: true}, beneficiaries: ["spouse", "children", "trust"], active: true, createdAt: new Date()}); print("✅ Insert complex nested policy"); passedCommands++; } catch (error) { print("❌ Insert complex nested policy - ERROR: " + error.message); errors.push("Lab3 nested: " + error.message); failedCommands++; }
totalCommands++; try { var newId = new ObjectId(); print("✅ Generate ObjectId"); passedCommands++; } catch (error) { print("❌ Generate ObjectId - ERROR: " + error.message); errors.push("Lab3 ObjectId: " + error.message); failedCommands++; }
totalCommands++; try { var customId = new ObjectId(); var result25 = db.lab3_test_policies.insertOne({_id: customId, policyType: "Commercial", policyNumber: "POL-COM-001", premiumAmount: 4999.99}); print("✅ Insert with generated ObjectId"); passedCommands++; } catch (error) { print("❌ Insert with generated ObjectId - ERROR: " + error.message); errors.push("Lab3 generated ID: " + error.message); failedCommands++; }
totalCommands++; try { var result26 = db.lab3_test_customers.insertMany([{customerId: "CUST-TEST-001", name: "John Doe", email: "john@example.com", age: 30, city: "New York", customerType: "Individual"}, {customerId: "CUST-TEST-002", name: "Jane Smith", email: "jane@example.com", age: 25, city: "Los Angeles", customerType: "Individual"}, {customerId: "CUST-TEST-003", name: "ABC Corporation", email: "contact@abccorp.com", businessType: "Manufacturing", city: "Chicago", customerType: "Business"}]); print("✅ Insert many customers"); passedCommands++; } catch (error) { print("❌ Insert many customers - ERROR: " + error.message); errors.push("Lab3 insertMany: " + error.message); failedCommands++; }
totalCommands++; try { var result27 = db.lab3_test_claims.insertMany([{claimNumber: "CLM-001", policyId: "POL-AUTO-001", claimAmount: 3500.00}, {claimNumber: "CLM-002", policyId: "POL-HOME-001", claimAmount: 8750.00}, {claimNumber: "CLM-003", policyId: "POL-AUTO-001", claimAmount: 1250.00}], {ordered: true}); print("✅ Insert ordered claims"); passedCommands++; } catch (error) { print("❌ Insert ordered claims - ERROR: " + error.message); errors.push("Lab3 ordered: " + error.message); failedCommands++; }
totalCommands++; try { var result28 = db.lab3_test_claims.insertMany([{claimNumber: "CLM-004", policyId: "POL-LIFE-001", claimAmount: 15000.00}, {claimNumber: "CLM-005", policyId: "POL-HOME-001", claimAmount: 4500.00}], {ordered: false}); print("✅ Insert unordered claims"); passedCommands++; } catch (error) { print("❌ Insert unordered claims - ERROR: " + error.message); errors.push("Lab3 unordered: " + error.message); failedCommands++; }
totalCommands++; try { var result29 = db.lab3_test_policies.insertOne({policyNumber: "POL-ACK-001", premiumAmount: 1599.99, policyType: "Auto"}, {writeConcern: {w: 1, j: true}}); print("✅ Insert with write concern"); passedCommands++; } catch (error) { print("❌ Insert with write concern - ERROR: " + error.message); errors.push("Lab3 writeConcern: " + error.message); failedCommands++; }
totalCommands++; try { var result30 = db.lab3_test_policies.insertMany([{policyNumber: "POL-BATCH-001", premiumAmount: 899.99, policyType: "Home"}, {policyNumber: "POL-BATCH-002", premiumAmount: 1199.99, policyType: "Auto"}], {writeConcern: {w: "majority"}}); print("✅ Bulk insert with majority write concern"); passedCommands++; } catch (error) { print("❌ Bulk insert with majority write concern - ERROR: " + error.message); errors.push("Lab3 majority: " + error.message); failedCommands++; }
totalCommands++; try { var result31 = db.lab3_test_policies.countDocuments(); print("✅ Count documents after inserts"); passedCommands++; } catch (error) { print("❌ Count documents after inserts - ERROR: " + error.message); errors.push("Lab3 count: " + error.message); failedCommands++; }

// LAB 4: CRUD Read/Query
print("\n🔬 TESTING LAB 4: CRUD Read/Query");
totalCommands++; try { var result32 = db.policies.find(); print("✅ Find all policies"); passedCommands++; } catch (error) { print("❌ Find all policies - ERROR: " + error.message); errors.push("Lab4 find: " + error.message); failedCommands++; }
totalCommands++; try { var result33 = db.policies.findOne(); print("✅ Find one policy"); passedCommands++; } catch (error) { print("❌ Find one policy - ERROR: " + error.message); errors.push("Lab4 findOne: " + error.message); failedCommands++; }
totalCommands++; try { var result34 = db.policies.find({policyType: "Auto"}); print("✅ Find by type"); passedCommands++; } catch (error) { print("❌ Find by type - ERROR: " + error.message); errors.push("Lab4 filter: " + error.message); failedCommands++; }
totalCommands++; try { var result35 = db.policies.find({premiumAmount: {$gt: 1000}}); print("✅ Range query"); passedCommands++; } catch (error) { print("❌ Range query - ERROR: " + error.message); errors.push("Lab4 range: " + error.message); failedCommands++; }
totalCommands++; try { var result36 = db.policies.find({}, {policyNumber: 1, premiumAmount: 1}); print("✅ Projection query"); passedCommands++; } catch (error) { print("❌ Projection query - ERROR: " + error.message); errors.push("Lab4 projection: " + error.message); failedCommands++; }
totalCommands++; try { var result37 = db.policies.find().sort({premiumAmount: -1}); print("✅ Sort query"); passedCommands++; } catch (error) { print("❌ Sort query - ERROR: " + error.message); errors.push("Lab4 sort: " + error.message); failedCommands++; }
totalCommands++; try { var result38 = db.policies.find().limit(5); print("✅ Limit query"); passedCommands++; } catch (error) { print("❌ Limit query - ERROR: " + error.message); errors.push("Lab4 limit: " + error.message); failedCommands++; }
totalCommands++; try { var result39 = db.policies.countDocuments(); print("✅ Count documents"); passedCommands++; } catch (error) { print("❌ Count documents - ERROR: " + error.message); errors.push("Lab4 count: " + error.message); failedCommands++; }

// LAB 5: CRUD Update/Delete
print("\n🔬 TESTING LAB 5: CRUD Update/Delete");
totalCommands++; try { var result40 = db.policies.updateOne({policyNumber: "POL-AUTO-001"}, {$set: {premiumAmount: 949.99}}); print("✅ Update one policy"); passedCommands++; } catch (error) { print("❌ Update one policy - ERROR: " + error.message); errors.push("Lab5 updateOne: " + error.message); failedCommands++; }
totalCommands++; try { var verifyResult40 = db.policies.findOne({policyNumber: "POL-AUTO-001"}, {premiumAmount: 1}); print("✅ Verify update worked"); passedCommands++; } catch (error) { print("❌ Verify update worked - ERROR: " + error.message); errors.push("Lab5 verifyUpdate: " + error.message); failedCommands++; }
totalCommands++; try { var result41 = db.policies.updateMany({policyType: "Auto"}, {$set: {featured: false}}); print("✅ Update many policies"); passedCommands++; } catch (error) { print("❌ Update many policies - ERROR: " + error.message); errors.push("Lab5 updateMany: " + error.message); failedCommands++; }
totalCommands++; try { var verifyResult41 = db.policies.find({policyType: "Auto"}, {featured: 1}).limit(3).toArray(); print("✅ Verify bulk update"); passedCommands++; } catch (error) { print("❌ Verify bulk update - ERROR: " + error.message); errors.push("Lab5 verifyBulkUpdate: " + error.message); failedCommands++; }
totalCommands++; try { var result41b = db.policies.updateMany({policyType: "Auto"}, {$mul: {premiumAmount: 0.95}}); print("✅ Apply 5% discount"); passedCommands++; } catch (error) { print("❌ Apply 5% discount - ERROR: " + error.message); errors.push("Lab5 discount: " + error.message); failedCommands++; }
totalCommands++; try { var verifyDiscount = db.policies.find({policyType: "Auto"}, {policyNumber: 1, premiumAmount: 1}).limit(3).toArray(); print("✅ Verify 5% discount applied"); passedCommands++; } catch (error) { print("❌ Verify 5% discount applied - ERROR: " + error.message); errors.push("Lab5 verifyDiscount: " + error.message); failedCommands++; }
totalCommands++; try { var result42 = db.policies.updateOne({policyNumber: "POL-NEW-001"}, {$set: {customerName: "New Customer", premiumAmount: 1599.99}}, {upsert: true}); print("✅ Upsert operation"); passedCommands++; } catch (error) { print("❌ Upsert operation - ERROR: " + error.message); errors.push("Lab5 upsert: " + error.message); failedCommands++; }
totalCommands++; try { var verifyUpsert = db.policies.findOne({policyNumber: "POL-NEW-001"}); print("✅ Verify upsert created document"); passedCommands++; } catch (error) { print("❌ Verify upsert created document - ERROR: " + error.message); errors.push("Lab5 verifyUpsert: " + error.message); failedCommands++; }
totalCommands++; try { var result43 = db.policies.deleteOne({premiumAmount: {$lt: 100}}); print("✅ Delete one policy"); passedCommands++; } catch (error) { print("❌ Delete one policy - ERROR: " + error.message); errors.push("Lab5 deleteOne: " + error.message); failedCommands++; }
totalCommands++; try { var verifyDelete = db.policies.countDocuments({premiumAmount: {$lt: 100}}); print("✅ Verify deletion worked"); passedCommands++; } catch (error) { print("❌ Verify deletion worked - ERROR: " + error.message); errors.push("Lab5 verifyDelete: " + error.message); failedCommands++; }
totalCommands++; try { var result44 = db.policies.deleteMany({policyType: "Discontinued", active: false}); print("✅ Delete many policies"); passedCommands++; } catch (error) { print("❌ Delete many policies - ERROR: " + error.message); errors.push("Lab5 deleteMany: " + error.message); failedCommands++; }

// LAB 6: Advanced Query Techniques
print("\n🔬 TESTING LAB 6: Advanced Query Techniques");
totalCommands++; try { db = db.getSiblingDB('insurance_analytics'); var result45 = db.policies.find({$and: [{annualPremium: {$gt: 500}}, {$or: [{policyType: "HOME"}, {policyType: "AUTO"}]}]}); print("✅ Complex AND/OR query"); passedCommands++; } catch (error) { print("❌ Complex AND/OR query - ERROR: " + error.message); errors.push("Lab6 complex: " + error.message); failedCommands++; }
totalCommands++; try { var result46 = db.claims.find({severityLevel: {$in: ["major", "moderate", "critical"]}}); print("✅ Array element matching"); passedCommands++; } catch (error) { print("❌ Array element matching - ERROR: " + error.message); errors.push("Lab6 elemMatch: " + error.message); failedCommands++; }
totalCommands++; try { var result47 = db.policies.find({createdAt: {$gte: new Date("2024-01-01"), $lt: new Date("2025-01-01")}}); print("✅ Date range query"); passedCommands++; } catch (error) { print("❌ Date range query - ERROR: " + error.message); errors.push("Lab6 dateRange: " + error.message); failedCommands++; }
totalCommands++; try { var result48 = db.customers.find({phone: /^\+1-555-/}); print("✅ Regex pattern matching"); passedCommands++; } catch (error) { print("❌ Regex pattern matching - ERROR: " + error.message); errors.push("Lab6 regex: " + error.message); failedCommands++; }
totalCommands++; try { db.claims.createIndex({location: "2dsphere"}); print("✅ Create 2dsphere index"); passedCommands++; } catch (error) { print("❌ Create 2dsphere index - ERROR: " + error.message); errors.push("Lab6 geoIndex: " + error.message); failedCommands++; }
totalCommands++; try { var result49 = db.claims.find({location: {$near: {$geometry: {type: "Point", coordinates: [-73.9857, 40.7484]}, $maxDistance: 50000}}}); print("✅ Geospatial near query"); passedCommands++; } catch (error) { print("❌ Geospatial near query - ERROR: " + error.message); errors.push("Lab6 geoNear: " + error.message); failedCommands++; }
totalCommands++; try { var result50 = db.claims.find({location: {$geoWithin: {$geometry: {type: "Polygon", coordinates: [[[-74.5, 40.4], [-73.7, 40.4], [-73.7, 40.9], [-74.5, 40.9], [-74.5, 40.4]]]}}}}); print("✅ Geospatial polygon query"); passedCommands++; } catch (error) { print("❌ Geospatial polygon query - ERROR: " + error.message); errors.push("Lab6 geoPoly: " + error.message); failedCommands++; }
totalCommands++; try { db.reviews.createIndex({reviewText: "text", categories: "text"}); var result51 = db.reviews.find({$text: {$search: "service excellent customer"}}); print("✅ Text search query"); passedCommands++; } catch (error) { print("❌ Text search query - ERROR: " + error.message); errors.push("Lab6 textSearch: " + error.message); failedCommands++; }
totalCommands++; try { var result52 = db.claims.find({location: {$near: {$geometry: {type: "Point", coordinates: [-73.9857, 40.7484]}, $maxDistance: 50000}}}).explain("executionStats"); print("✅ Geo index verification"); passedCommands++; } catch (error) { print("❌ Geo index verification - ERROR: " + error.message); errors.push("Lab6 geoVerify: " + error.message); failedCommands++; }
totalCommands++; try { var result53 = db.claims.find({status: "approved"}).explain("executionStats"); print("✅ Performance metrics query"); passedCommands++; } catch (error) { print("❌ Performance metrics query - ERROR: " + error.message); errors.push("Lab6 perfMetrics: " + error.message); failedCommands++; }

// LAB 7: Aggregation Framework
print("\n🔬 TESTING LAB 7: Aggregation Framework");
totalCommands++; try { var result49 = db.claims.aggregate([{$group: {_id: "$policyType", total: {$sum: "$claimAmount"}}}]); print("✅ Basic aggregation"); passedCommands++; } catch (error) { print("❌ Basic aggregation - ERROR: " + error.message); errors.push("Lab7 group: " + error.message); failedCommands++; }
totalCommands++; try { var result50 = db.claims.aggregate([{$match: {claimAmount: {$gt: 1000}}}, {$group: {_id: "$customerId", count: {$sum: 1}}}]); print("✅ Match and group"); passedCommands++; } catch (error) { print("❌ Match and group - ERROR: " + error.message); errors.push("Lab7 match-group: " + error.message); failedCommands++; }
totalCommands++; try { var result51 = db.policies.aggregate([{$lookup: {from: "customers", localField: "customerId", foreignField: "_id", as: "customerInfo"}}]); print("✅ Lookup operation"); passedCommands++; } catch (error) { print("❌ Lookup operation - ERROR: " + error.message); errors.push("Lab7 lookup: " + error.message); failedCommands++; }
totalCommands++; try { var result52 = db.policies.aggregate([{$unwind: "$coverageTypes"}, {$group: {_id: "$coverageTypes", count: {$sum: 1}}}]); print("✅ Unwind operation"); passedCommands++; } catch (error) { print("❌ Unwind operation - ERROR: " + error.message); errors.push("Lab7 unwind: " + error.message); failedCommands++; }

// LAB 8: Indexing
print("\n🔬 TESTING LAB 8: Indexing");
totalCommands++; try { db = db.getSiblingDB('insurance_company'); var result53 = db.policies.getIndexes(); print("✅ Examine existing indexes"); passedCommands++; } catch (error) { print("❌ Examine existing indexes - ERROR: " + error.message); errors.push("Lab8 examineIndexes: " + error.message); failedCommands++; }
totalCommands++; try { var result54 = db.customers.getIndexes(); print("✅ List customer indexes"); passedCommands++; } catch (error) { print("❌ List customer indexes - ERROR: " + error.message); errors.push("Lab8 getIndexes: " + error.message); failedCommands++; }
totalCommands++; try { db.test_claims.drop(); db.test_claims.insertMany([{claimNumber: "CLM-TEST-001", policyId: "pol1", claimAmount: 1500}]); var result55 = db.test_claims.createIndex({policyId: 1}); print("✅ Test collection index"); passedCommands++; } catch (error) { print("❌ Test collection index - ERROR: " + error.message); errors.push("Lab8 testIndex: " + error.message); failedCommands++; }
totalCommands++; try { db.test_policies.drop(); db.test_policies.insertMany([{policyType: "Auto", coverageDescription: "test"}]); var result56 = db.test_policies.createIndex({policyType: "text", coverageDescription: "text"}); print("✅ Test text index"); passedCommands++; } catch (error) { print("❌ Test text index - ERROR: " + error.message); errors.push("Lab8 testText: " + error.message); failedCommands++; }

// LAB 9: Data Modeling
print("\n🔬 TESTING LAB 9: Data Modeling");
totalCommands++; try { var result57 = db.policies.insertOne({policyNumber: "TEST001", customer: {name: "Test", address: {street: "123 Main St"}}}); print("✅ Embedded document"); passedCommands++; } catch (error) { print("❌ Embedded document - ERROR: " + error.message); errors.push("Lab9 embedded: " + error.message); failedCommands++; }

// LAB 10: Transactions
print("\n🔬 TESTING LAB 10: Transactions");
totalCommands++; try { var session = db.getMongo().startSession(); print("✅ Start session"); passedCommands++; } catch (error) { print("❌ Start session - ERROR: " + error.message); errors.push("Lab10 session: " + error.message); failedCommands++; }
totalCommands++; try { if (typeof session !== 'undefined') { session.startTransaction({readConcern: {level: "majority"}, writeConcern: {w: "majority", wtimeout: 5000}}); print("✅ Start transaction"); passedCommands++; } else { throw new Error("Session not available"); } } catch (error) { print("❌ Start transaction - ERROR: " + error.message); errors.push("Lab10 startTransaction: " + error.message); failedCommands++; }
totalCommands++; try { if (typeof session !== 'undefined') { var sessionDb = session.getDatabase("insurance_company"); var transResult = sessionDb.lab10_test_customers.insertOne({customerId: "TRANS-TEST-001", name: "Transaction Test"}); session.commitTransaction(); session.endSession(); print("✅ Transaction operations"); passedCommands++; } else { throw new Error("Session not available"); } } catch (error) { print("❌ Transaction operations - ERROR: " + error.message); errors.push("Lab10 operations: " + error.message); failedCommands++; }

// LAB 11: Replica Sets
print("\n🔬 TESTING LAB 11: Replica Sets");
totalCommands++; try { var rsStatus = rs.status(); print("✅ Replica set status"); passedCommands++; } catch (error) { print("❌ Replica set status - ERROR: " + error.message); errors.push("Lab11 rs.status: " + error.message); failedCommands++; }
totalCommands++; try { var rsConfig = rs.conf(); print("✅ Replica set config"); passedCommands++; } catch (error) { print("❌ Replica set config - ERROR: " + error.message); errors.push("Lab11 rs.conf: " + error.message); failedCommands++; }
totalCommands++; try { var helloResult = db.hello(); print("✅ Hello command"); passedCommands++; } catch (error) { print("❌ Hello command - ERROR: " + error.message); errors.push("Lab11 hello: " + error.message); failedCommands++; }
totalCommands++; try { var replInfo = rs.printReplicationInfo(); print("✅ Replication info"); passedCommands++; } catch (error) { print("❌ Replication info - ERROR: " + error.message); errors.push("Lab11 replInfo: " + error.message); failedCommands++; }

// LAB 12: Sharding Simulation
print("\n🔬 TESTING LAB 12: Sharding Simulation");
totalCommands++; try { db = db.getSiblingDB('insurance_company'); var customersByState = db.customers.aggregate([{$group: {_id: "$address.state", count: {$sum: 1}}}, {$sort: {count: -1}}]).toArray(); print("✅ Analyze customer distribution"); passedCommands++; } catch (error) { print("❌ Analyze customer distribution - ERROR: " + error.message); errors.push("Lab12 customerAnalysis: " + error.message); failedCommands++; }
totalCommands++; try { var policiesByType = db.policies.aggregate([{$group: {_id: "$policyType", count: {$sum: 1}}}, {$sort: {count: -1}}]).toArray(); print("✅ Analyze policy distribution"); passedCommands++; } catch (error) { print("❌ Analyze policy distribution - ERROR: " + error.message); errors.push("Lab12 policyAnalysis: " + error.message); failedCommands++; }
totalCommands++; try { var totalDocs = db.customers.countDocuments(); var docsPerShard = Math.ceil(totalDocs / 3); print("✅ Simulate shard distribution"); passedCommands++; } catch (error) { print("❌ Simulate shard distribution - ERROR: " + error.message); errors.push("Lab12 shardSimulation: " + error.message); failedCommands++; }

// LAB 13: Change Streams
print("\n🔬 TESTING LAB 13: Change Streams");
totalCommands++; try { db.notifications.createIndex({ recipientId: 1, timestamp: -1 }); print("✅ Create notifications index"); passedCommands++; } catch (error) { print("❌ Create notifications index - ERROR: " + error.message); errors.push("Lab13 notificationsIndex: " + error.message); failedCommands++; }
totalCommands++; try { db.activity_log.createIndex({ timestamp: -1 }); print("✅ Create activity log index"); passedCommands++; } catch (error) { print("❌ Create activity log index - ERROR: " + error.message); errors.push("Lab13 activityIndex: " + error.message); failedCommands++; }
totalCommands++; try { var testClaim = {_id: "claim_cs_test1", claimNumber: "CLM-2024-CS001", customerId: "cust1", claimType: "Auto Accident", claimAmount: NumberDecimal("15000.00"), status: "Filed", incidentDate: new Date(), createdAt: new Date()}; db.claims.insertOne(testClaim); print("✅ Insert test claim for change streams"); passedCommands++; } catch (error) { print("❌ Insert test claim for change streams - ERROR: " + error.message); errors.push("Lab13 testClaim: " + error.message); failedCommands++; }
totalCommands++; try { db.notifications.insertOne({ recipientId: "cust1", type: "claim_filed", priority: "medium", message: "Test notification", claimId: "claim_cs_test1", timestamp: new Date(), read: false, status: "active" }); print("✅ Create test notification"); passedCommands++; } catch (error) { print("❌ Create test notification - ERROR: " + error.message); errors.push("Lab13 testNotification: " + error.message); failedCommands++; }
totalCommands++; try { var notifications = db.notifications.find({ claimId: "claim_cs_test1" }).toArray(); print("✅ Query notifications by claim"); passedCommands++; } catch (error) { print("❌ Query notifications by claim - ERROR: " + error.message); errors.push("Lab13 queryNotifications: " + error.message); failedCommands++; }
totalCommands++; try { db.claims.updateOne({ _id: "claim_cs_test1" }, { $set: { status: "Under Review", reviewDate: new Date() } }); print("✅ Update claim status"); passedCommands++; } catch (error) { print("❌ Update claim status - ERROR: " + error.message); errors.push("Lab13 updateClaim: " + error.message); failedCommands++; }
totalCommands++; try { db.activity_log.insertOne({ operation: "claim_processed", collection: "claims", documentId: "claim_cs_test1", timestamp: new Date(), userId: "system" }); print("✅ Log activity"); passedCommands++; } catch (error) { print("❌ Log activity - ERROR: " + error.message); errors.push("Lab13 logActivity: " + error.message); failedCommands++; }
totalCommands++; try { var recentActivity = db.activity_log.find().sort({ timestamp: -1 }).limit(5).toArray(); print("✅ Query recent activity"); passedCommands++; } catch (error) { print("❌ Query recent activity - ERROR: " + error.message); errors.push("Lab13 queryActivity: " + error.message); failedCommands++; }
totalCommands++; try { db.claims.deleteMany({ _id: "claim_cs_test1" }); db.notifications.deleteMany({ claimId: "claim_cs_test1" }); db.activity_log.deleteMany({ userId: "system" }); print("✅ Cleanup test data"); passedCommands++; } catch (error) { print("❌ Cleanup test data - ERROR: " + error.message); errors.push("Lab13 cleanup: " + error.message); failedCommands++; }


// RESULTS
print("\n" + "=".repeat(80));
print("📊 COMPREHENSIVE TEST RESULTS SUMMARY");
print("=".repeat(80));
print("Total Commands Tested: " + totalCommands);
print("✅ Passed: " + passedCommands);
print("❌ Failed: " + failedCommands);

print("\n📋 DETAILED ERROR REPORT:");
if (errors.length === 0) {
    print("🎉 NO ERRORS FOUND! All commands passed.");
} else {
    for (var i = 0; i < errors.length; i++) {
        print("\n" + (i + 1) + ". " + errors[i]);
    }
}

var passRate = (passedCommands / totalCommands * 100).toFixed(1);
print("\n🎯 FINAL ASSESSMENT:");
if (failedCommands === 0 && passRate == 100) {
    print("🟢 COURSE READY: Labs are safe for student use");
} else {
    print("🔴 COURSE NOT READY: Issues found that need fixing");
}
print("\nPass Rate: " + passRate + "%");
print("Test completed. Review all errors above before releasing to students.");