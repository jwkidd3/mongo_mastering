# Lab 13: Change Streams & Real-time Processing
**Duration:** 45 minutes
**Objective:** Understand change streams concepts and implement safe real-time processing examples

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
```bash
mongosh < data/comprehensive_data_loader.js
```

## Part A: Change Stream Infrastructure Setup (15 minutes)

### Step 1: Create Supporting Collections for Change Stream Processing

```javascript
use insurance_company
```

```javascript
// Create notifications collection for insurance alerts
db.notifications.createIndex({ recipientId: 1, timestamp: -1 })
```

```javascript
db.notifications.createIndex({ type: 1, read: 1 })
```

```javascript
db.notifications.createIndex({ priority: 1, status: 1 })
```

```javascript
// Create activity log collection for audit trail
db.activity_log.createIndex({ timestamp: -1 })
```

```javascript
db.activity_log.createIndex({ operation: 1, timestamp: -1 })
```

```javascript
db.activity_log.createIndex({ userId: 1, timestamp: -1 })
```

```javascript
// Create fraud alerts collection
db.fraud_alerts.createIndex({ customerId: 1, timestamp: -1 })
```

```javascript
db.fraud_alerts.createIndex({ severity: 1, status: 1 })
```

```javascript
// Create resume tokens collection
db.resume_tokens.createIndex({ lastUpdated: -1 })
```

### Step 2: Understanding Change Stream API

**Change streams use `db.collection.watch()` to listen for real-time data changes. Here is the core API:**

```javascript
// Basic change stream syntax (returns a cursor)
// var cursor = db.claims.watch()

// Watch with a pipeline filter (only insert events)
// var cursor = db.claims.watch([{ $match: { operationType: "insert" } }])

// Watch with options (resume after disconnection)
// var cursor = db.claims.watch([], { fullDocument: "updateLookup" })
```

**Quick demonstration** - open a change stream, trigger a change, then read it:

```javascript
// Open a change stream on the claims collection
var changeStream = db.claims.watch([], { maxAwaitTimeMS: 1000 });
```

```javascript
// In production, you would loop with changeStream.hasNext() / changeStream.next()
// For this lab, we simulate what change streams trigger by manually
// creating the notifications that a change stream handler would produce
print("Change stream opened - in production this would run as a background listener");
print("We will now simulate the processing that change stream handlers perform");
changeStream.close();
```

**Change Stream Event Types:**
- **insert**: New claims trigger notifications and fraud checks
- **update**: Status changes notify customers and staff
- **delete**: Log activities for audit compliance
- **replace**: Full document replacements tracked for audit

**Processing Functions Handle:**
1. Claims processing notifications
2. Policy welcome messages
3. Fraud detection algorithms
4. Status update messaging
5. Audit logging

## Part B: Simulated Change Stream Processing (20 minutes)

### Step 3: Test Claims Processing Simulation

**Monitor in Compass:**
1. Open `claims` and `notifications` collections in separate tabs
2. Enable auto-refresh for real-time monitoring

**Create Test Claims and Simulate Processing:**

```javascript
// Step 1: Create a test claim
var testClaim = { _id: "claim_cs_test1", claimNumber: "CLM-2024-CS001", customerId: "CUST000001", policyNumber: "POL-AUTO-001", claimType: "Auto Accident", claimAmount: NumberDecimal("15000.00"), status: "submitted", incidentDate: new Date("2024-03-15"), filedDate: new Date(), description: "Vehicle collision on highway" };
```

```javascript
// Step 2: Insert the claim (this would trigger change stream in production)
db.claims.insertOne(testClaim);
```

```javascript
// Step 3: Simulate notification creation (what change stream would do)
db.notifications.insertOne({ recipientId: testClaim.customerId, type: "claim_filed", priority: "medium", message: "Your claim " + testClaim.claimNumber + " has been filed and is under review.", claimId: testClaim._id, claimNumber: testClaim.claimNumber, timestamp: new Date(), read: false, status: "active" });
```

```javascript
// Step 4: Simulate claims department notification
db.notifications.insertOne({ recipientId: "claims_department", type: "claim_assignment", priority: "high", message: "New " + testClaim.claimType + " claim filed: " + testClaim.claimNumber + " for $" + testClaim.claimAmount, claimId: testClaim._id, timestamp: new Date(), read: false, status: "active" });
```

```javascript
// Step 5: Verify notifications were created
db.notifications.find({ claimId: "claim_cs_test1" });
```

### Step 4: Policy Creation Simulation

```javascript
// Step 1: Create test policy
var newPolicy = { _id: "policy_cs_test1", policyNumber: "POL-CS-2024-001", customerId: "CUST000002", policyType: "Property", coverageLimit: 250000, effectiveDate: new Date(), annualPremium: NumberDecimal("1200.00"), isActive: true };
```

```javascript
// Step 2: Insert policy (triggers change stream simulation)
db.policies.insertOne(newPolicy);
```

```javascript
// Step 3: Simulate welcome notification
db.notifications.insertOne({ recipientId: newPolicy.customerId, type: "policy_issued", priority: "medium", message: "Welcome! Your " + newPolicy.policyType + " policy " + newPolicy.policyNumber + " is now active.", policyId: newPolicy._id, timestamp: new Date(), read: false, status: "active" });
```

```javascript
// Step 4: Verify policy notification
db.notifications.find({ policyId: "policy_cs_test1" });
```

### Step 5: Claims Status Update Simulation

```javascript
// Step 1: Update claim status (simulates change stream trigger)
db.claims.updateOne({ _id: "claim_cs_test1" }, { $set: { status: "under_review", reviewDate: new Date() } });
```

```javascript
// Step 2: Simulate status update notification
db.notifications.insertOne({ recipientId: "CUST000001", type: "claim_status_update", priority: "medium", message: "Your claim CLM-2024-CS001 is now under review by our adjusters.", claimId: "claim_cs_test1", claimNumber: "CLM-2024-CS001", timestamp: new Date(), read: false, status: "active" });
```

```javascript
// Step 3: Update to approved status
db.claims.updateOne({ _id: "claim_cs_test1" }, { $set: { status: "approved", settlementAmount: NumberDecimal("14500.00") } });
```

```javascript
// Step 4: Simulate approval notification
db.notifications.insertOne({ recipientId: "CUST000001", type: "settlement_approved", priority: "high", message: "Your claim CLM-2024-CS001 has been settled for $14500.00", claimId: "claim_cs_test1", claimNumber: "CLM-2024-CS001", timestamp: new Date(), read: false, status: "active" });
```

## Part C: Fraud Detection Simulation (10 minutes)

### Step 6: Fraud Alert Processing

```javascript
// Step 1: Create high-value claim for fraud detection
var suspiciousClaim = { _id: "claim_fraud_test", claimNumber: "CLM-FRAUD-001", customerId: "CUST000003", policyNumber: "POL-HOME-001", claimType: "Auto Accident", claimAmount: NumberDecimal("75000.00"), status: "submitted", incidentDate: new Date(), filedDate: new Date(), description: "High-value vehicle total loss" };
```

```javascript
// Step 2: Insert suspicious claim
db.claims.insertOne(suspiciousClaim);
```

```javascript
// Step 3: Simulate fraud detection logic (high amount trigger)
var indicators = ["High claim amount"];
var severity = "medium";
```

```javascript
// Step 4: Create fraud alert
db.fraud_alerts.insertOne({ customerId: suspiciousClaim.customerId, claimId: suspiciousClaim._id, claimNumber: suspiciousClaim.claimNumber, severity: severity, indicators: indicators, status: "active", timestamp: new Date(), reviewedBy: null, notes: "Automatically generated fraud alert" });
```

```javascript
// Step 5: Create fraud team notification
db.notifications.insertOne({ recipientId: "fraud_investigation_team", type: "fraud_alert", priority: "critical", message: "Potential fraud detected for claim " + suspiciousClaim.claimNumber + ". Severity: " + severity, claimId: suspiciousClaim._id, timestamp: new Date(), read: false, status: "active" });
```

```javascript
// Step 6: Verify fraud detection results
db.fraud_alerts.find({ claimId: "claim_fraud_test" });
```

```javascript
db.notifications.find({ type: "fraud_alert" });
```

### Step 7: Activity Logging Simulation

```javascript
// Step 1: Simulate document deletion logging
db.activity_log.insertOne({ operation: "delete", collection: "test_collection", documentId: "test_doc_123", timestamp: new Date(), userId: "system" });
```

```javascript
// Step 2: Log claim processing activity
db.activity_log.insertOne({ operation: "claim_processed", collection: "claims", documentId: "claim_cs_test1", details: { previousStatus: "submitted", newStatus: "approved", processedBy: "adjuster1" }, timestamp: new Date(), userId: "system" });
```

```javascript
// Step 3: Review activity logs
db.activity_log.find().sort({ timestamp: -1 }).limit(5);
```

## Part D: Real-time Monitoring Dashboard Simulation (5 minutes)

### Step 8: Dashboard Queries

```javascript
// Real-time claims dashboard
print("=== Real-time Claims Dashboard ===");
print("Active Claims: " + db.claims.countDocuments({ status: { $in: ["submitted", "under_review"] } }));
print("Approved Claims Today: " + db.claims.countDocuments({ status: "approved", reviewDate: { $gte: new Date(new Date().setHours(0,0,0,0)) } }));
print("Pending Notifications: " + db.notifications.countDocuments({ read: false }));
print("Active Fraud Alerts: " + db.fraud_alerts.countDocuments({ status: "active" }));
```

```javascript
// Customer notification summary
print("=== Customer Notifications ===");
db.notifications.aggregate([ { $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } } ]).forEach(function(doc) { print(doc._id + ": " + doc.count); });
```

```javascript
// Recent high-priority notifications
print("=== High Priority Notifications ===");
db.notifications.find({ priority: "high", read: false }).sort({ timestamp: -1 }).limit(3).forEach(function(notification) { print(notification.message); });
```

## Cleanup and Environment Teardown

### Step 9: Clean Up Test Data (Optional)

```javascript
// Remove test data created during this lab
db.claims.deleteMany({ _id: { $in: ["claim_cs_test1", "claim_fraud_test"] } });
```

```javascript
db.policies.deleteMany({ _id: "policy_cs_test1" });
```

```javascript
db.notifications.deleteMany({ $or: [{ claimId: { $in: ["claim_cs_test1", "claim_fraud_test"] } }, { policyId: "policy_cs_test1" }] });
```

```javascript
db.fraud_alerts.deleteMany({ claimId: "claim_fraud_test" });
```

```javascript
db.activity_log.deleteMany({ userId: "system" });
print("✅ Test data cleaned up");
```

### Step 10: Environment Teardown
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

## Lab 13 Deliverables
✅ **Change Stream Infrastructure**: Set up collections and indexes for real-time processing
✅ **Claims Processing Simulation**: Demonstrated automated claim notifications and tracking
✅ **Policy Management**: Simulated policy creation and customer welcome workflows
✅ **Fraud Detection**: Implemented automated fraud alert generation and notification
✅ **Real-time Monitoring**: Created dashboard queries for live operational insights
✅ **Activity Logging**: Established audit trail for compliance and monitoring

**Note**: This lab uses safe, step-by-step simulation commands. In production, change streams run as background processes using `db.collection.watch()` to receive real-time event notifications.