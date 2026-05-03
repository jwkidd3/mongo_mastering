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
> **New to MongoDB tooling?** See [Lab 1 — Choose Your Tool](lab01_mongodb_shell_mastery.md#choose-your-tool-mongodb-compass-or-mongosh-cli) for the Compass UI alternative (no shell-redirection issues, works the same on every OS).

```bash
mongosh < data/comprehensive_data_loader.js
```

> **Windows (PowerShell):** PowerShell does not forward `<` into `mongosh` — the command will error. Use `--file` instead:
> ```powershell
> mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
> ```

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

### Step 2: Understanding the Change Stream API

Change streams use `db.collection.watch()` to subscribe to real-time data changes. Each event has an `operationType` (`insert`, `update`, `delete`, `replace`, `invalidate`) and -- depending on options -- the full document.

```javascript
// Three common forms:
// 1. Watch every change on a collection
//    var cursor = db.claims.watch()
// 2. Watch only inserts (server-side filter via aggregation pipeline)
//    var cursor = db.claims.watch([{ $match: { operationType: "insert" } }])
// 3. Include the full updated document on update events
//    var cursor = db.claims.watch([], { fullDocument: "updateLookup" })
```

A handful of helpers make iterating from inside mongosh practical. Paste this into your shell -- you'll use it for the rest of Part A and Part B:

```javascript
// Read up to N events from a change-stream cursor, retrying briefly if the
// event hasn't propagated yet. Returns an array of event docs.
function drainEvents(cursor, expected, timeoutMs) {
    var deadline = Date.now() + (timeoutMs || 3000);
    var events = [];
    while (events.length < expected && Date.now() < deadline) {
        var ev = cursor.tryNext();
        if (ev) { events.push(ev); }
        else { sleep(150); }
    }
    return events;
}
```

## Part B: Real Change Streams in mongosh (20 minutes)

### Step 3: Open a Change Stream and See a Real Event

You'll open a cursor on `claims`, insert a claim, then read the event that mongosh receives from the server.

```javascript
// Open the change stream FIRST (it only sees events that happen after it opens).
var claimsStream = db.claims.watch([], { maxAwaitTimeMS: 200 });
```

```javascript
// Trigger an event by inserting a claim.
var testClaim = { _id: "claim_cs_test1", claimNumber: "CLM-2024-CS001", customerId: "CUST000001", policyNumber: "POL-AUTO-001", claimType: "Auto Accident", claimAmount: NumberDecimal("15000.00"), status: "submitted", incidentDate: new Date("2024-03-15"), filedDate: new Date(), description: "Vehicle collision on highway" };
db.claims.insertOne(testClaim);
```

```javascript
// Drain the change-stream cursor and inspect what came back.
var events = drainEvents(claimsStream, 1);
print("Events received: " + events.length);
printjson(events[0]);
```

You should see an event with `operationType: "insert"`, `documentKey: { _id: "claim_cs_test1" }`, and `fullDocument` containing the inserted claim. **This is the actual event a production change-stream listener would receive** -- the rest of Part B builds on this.

### Step 4: Filtered Pipeline -- Only Inserts

Change streams accept an aggregation pipeline. Use it to filter server-side so the cursor only emits events you care about.

```javascript
// Open a stream that only emits insert events, with the full document attached.
var insertsOnly = db.claims.watch(
    [{ $match: { operationType: "insert" } }],
    { fullDocument: "updateLookup", maxAwaitTimeMS: 200 }
);
```

```javascript
// Mix of operations -- only the insert should come through the filter.
db.claims.updateOne({ _id: "claim_cs_test1" }, { $set: { status: "under_review" } });
db.claims.insertOne({ _id: "claim_cs_test2", claimNumber: "CLM-2024-CS002", customerId: "CUST000001", policyNumber: "POL-AUTO-001", claimType: "Auto Accident", claimAmount: NumberDecimal("8500.00"), status: "submitted", incidentDate: new Date(), filedDate: new Date(), description: "Filtered demo" });
```

```javascript
// Drain and verify: 1 event back, operationType == "insert".
var filtered = drainEvents(insertsOnly, 2, 2000);
print("Filtered events: " + filtered.length);
filtered.forEach(function(e) { print("  " + e.operationType + " " + e.documentKey._id); });
insertsOnly.close();
```

### Step 5: Resume Tokens

Every event carries a `_id` resume token. Save it; if your listener disconnects, you can resume from that point and not miss events.

```javascript
// Capture the resume token from the most recent event.
var lastToken = events[0]._id;
print("Resume token captured (truncated): " + JSON.stringify(lastToken).substring(0, 80) + "...");
```

```javascript
// Demonstrate resume: close the original stream, reopen with resumeAfter.
claimsStream.close();
var resumed = db.claims.watch([], { resumeAfter: lastToken, maxAwaitTimeMS: 200 });
db.claims.updateOne({ _id: "claim_cs_test1" }, { $set: { status: "approved", settlementAmount: NumberDecimal("14500.00") } });
var resumedEvents = drainEvents(resumed, 1, 2000);
print("Events seen after resume: " + resumedEvents.length);
resumedEvents.forEach(function(e) { print("  " + e.operationType + " " + e.documentKey._id); });
resumed.close();
```

```javascript
// Persist the token so a real listener can resume across restarts.
db.resume_tokens.insertOne({ stream: "claims", token: lastToken, lastUpdated: new Date() });
```

> In production, a long-lived process (Node.js / .NET / Python service) calls `cursor.next()` in a loop, processes each event, and persists the resume token after each successful handler. The mongosh helper `drainEvents` above plays the same role for one-off lab inspection.

### Step 6: What a Real Consumer Does With Each Event

The events above are exactly what triggers downstream work in production. Below are the handler bodies a real listener would run -- inserting notifications, audit logs, and fraud alerts. You can paste them now to see the resulting state in `notifications`, `fraud_alerts`, and `activity_log`.

```javascript
// On insert(claim) -> notify customer + claims department
db.notifications.insertOne({ recipientId: testClaim.customerId, type: "claim_filed", priority: "medium", message: "Your claim " + testClaim.claimNumber + " has been filed and is under review.", claimId: testClaim._id, claimNumber: testClaim.claimNumber, timestamp: new Date(), read: false, status: "active" });
db.notifications.insertOne({ recipientId: "claims_department", type: "claim_assignment", priority: "high", message: "New " + testClaim.claimType + " claim filed: " + testClaim.claimNumber + " for $" + testClaim.claimAmount, claimId: testClaim._id, timestamp: new Date(), read: false, status: "active" });
```

```javascript
// On update(claim status) -> notify customer
db.notifications.insertOne({ recipientId: "CUST000001", type: "claim_status_update", priority: "medium", message: "Your claim CLM-2024-CS001 is now under review by our adjusters.", claimId: "claim_cs_test1", claimNumber: "CLM-2024-CS001", timestamp: new Date(), read: false, status: "active" });
db.notifications.insertOne({ recipientId: "CUST000001", type: "settlement_approved", priority: "high", message: "Your claim CLM-2024-CS001 has been settled for $14500.00", claimId: "claim_cs_test1", claimNumber: "CLM-2024-CS001", timestamp: new Date(), read: false, status: "active" });
```

```javascript
// Confirm the side effects a real listener would have produced
db.notifications.find({ claimId: "claim_cs_test1" });
```

## Part C: Watching Multiple Collections — Fraud Detection (10 minutes)

This part shows that change-stream listeners can watch any collection (and even at the cluster level via `db.watch()` / `client.watch()`) -- here we watch `claims` for high-value inserts and react with a fraud alert.

### Step 7: Fraud Alert Processing

A real fraud detector watches the stream, filters for high-amount inserts, and reacts. Here we use a server-side `$match` to filter at the change-stream pipeline so the cursor only emits suspicious events.

```javascript
// Open a change stream that emits ONLY high-value claim inserts.
// Note the `fullDocument.claimAmount` path -- the filter runs server-side.
var fraudStream = db.claims.watch(
    [{ $match: {
        operationType: "insert",
        "fullDocument.claimAmount": { $gte: NumberDecimal("50000") }
    }}],
    { maxAwaitTimeMS: 200 }
);
```

```javascript
// Insert two claims: one normal, one high-value. Only the high-value one
// should make it through the fraudStream filter.
db.claims.insertOne({ _id: "claim_normal_test", claimNumber: "CLM-NORMAL-001", customerId: "CUST000004", policyNumber: "POL-AUTO-002", claimType: "Auto Accident", claimAmount: NumberDecimal("3500.00"), status: "submitted", incidentDate: new Date(), filedDate: new Date(), description: "Minor fender-bender" });
db.claims.insertOne({ _id: "claim_fraud_test", claimNumber: "CLM-FRAUD-001", customerId: "CUST000003", policyNumber: "POL-HOME-001", claimType: "Auto Accident", claimAmount: NumberDecimal("75000.00"), status: "submitted", incidentDate: new Date(), filedDate: new Date(), description: "High-value vehicle total loss" });
```

```javascript
// Drain the cursor and react to each suspicious event. This is the body of
// what a real fraud-detection consumer would run on each `next()`.
var fraudEvents = drainEvents(fraudStream, 1, 2000);
print("Suspicious events received: " + fraudEvents.length);
fraudEvents.forEach(function(evt) {
    var claim = evt.fullDocument;
    db.fraud_alerts.insertOne({
        customerId: claim.customerId,
        claimId: claim._id,
        claimNumber: claim.claimNumber,
        severity: "medium",
        indicators: ["High claim amount"],
        status: "active",
        timestamp: new Date(),
        reviewedBy: null,
        notes: "Auto-generated by fraud change-stream consumer"
    });
    db.notifications.insertOne({
        recipientId: "fraud_investigation_team",
        type: "fraud_alert",
        priority: "critical",
        message: "Potential fraud detected for claim " + claim.claimNumber,
        claimId: claim._id,
        timestamp: new Date(),
        read: false,
        status: "active"
    });
    print("  -> alert raised for " + claim.claimNumber);
});
fraudStream.close();
```

```javascript
// Verify both side effects of the fraud handler
db.fraud_alerts.find({ claimId: "claim_fraud_test" });
db.notifications.find({ type: "fraud_alert" });
```

### Step 8: Activity Logging via Change Stream

A common production pattern: log every change against a collection to an audit table. Same shape as Step 7 -- a watch + a handler.

```javascript
// Watch all operations against `claims` for audit logging.
var auditStream = db.claims.watch([], { maxAwaitTimeMS: 200 });
```

```javascript
// Generate one of each operation type so the audit handler has something to log.
db.claims.updateOne({ _id: "claim_cs_test1" }, { $set: { adjusterNotes: "Reviewed" } });
db.claims.deleteOne({ _id: "claim_normal_test" });
```

```javascript
// Drain and log -- this is what a real audit consumer does on each event.
drainEvents(auditStream, 2, 2000).forEach(function(evt) {
    db.activity_log.insertOne({
        operation: evt.operationType,
        collection: "claims",
        documentId: evt.documentKey._id,
        details: evt.updateDescription || null,
        timestamp: new Date(),
        userId: "system"
    });
});
auditStream.close();
db.activity_log.find().sort({ timestamp: -1 }).limit(5);
```

## Part D: Real-time Monitoring Dashboard (5 minutes)

### Step 9: Dashboard Queries

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

### Step 10: Clean Up Test Data (Optional)

```javascript
// Remove test data created during this lab
db.claims.deleteMany({ _id: { $in: ["claim_cs_test1", "claim_cs_test2", "claim_normal_test", "claim_fraud_test"] } });
```

```javascript
db.notifications.deleteMany({ $or: [{ claimId: { $in: ["claim_cs_test1", "claim_cs_test2", "claim_normal_test", "claim_fraud_test"] } }] });
```

```javascript
db.fraud_alerts.deleteMany({ claimId: "claim_fraud_test" });
```

```javascript
db.activity_log.deleteMany({ userId: "system" });
print("✅ Test data cleaned up");
```

### Step 11: Environment Teardown
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
✅ **Real change-stream cursor**: Opened `db.claims.watch()`, received actual events with `tryNext()`, inspected `operationType` and `fullDocument`
✅ **Server-side filtering**: Used aggregation pipeline `$match` to receive only matching events
✅ **Resume tokens**: Captured the event `_id` and demonstrated `resumeAfter` to recover after disconnection
✅ **Consumer handlers**: Wrote the handler bodies a production listener would run on `next()` (notifications, audit logs, fraud alerts)
✅ **Multi-event-type detection**: Watched for high-value inserts (fraud) and audit-logged all operations
✅ **Real-time dashboard**: Counted active state derived from change-stream side effects

**Note**: This lab uses safe, step-by-step simulation commands. In production, change streams run as background processes using `db.collection.watch()` to receive real-time event notifications.