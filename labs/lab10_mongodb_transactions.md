# Lab 10: MongoDB Transactions
**Duration:** 45 minutes
**Objective:** Master ACID transactions in MongoDB for insurance claim processing

## Prerequisites: Environment Setup

### Step 1: Set Up MongoDB Environment

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./setup/setup.sh
```

**Windows PowerShell:**
```powershell
.\setup\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

**Load Course Data:**
```bash
mongosh < data/comprehensive_data_loader.js
```

### Step 2: Verify Replica Set Ready for Transactions
```bash
# Connect to MongoDB and verify replica set status
mongosh
```

```javascript
// Verify replica set is properly configured for transactions
rs.status()

// Confirm we have a primary node for transactions
db.hello()

// Verify transaction support is available
db.runCommand({serverStatus: 1}).transactions
```

### Step 3: Connect with MongoDB Compass
1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017`
3. Click **"Connect"**
4. Navigate to `insurance_company` database
5. Verify you can see the existing data collections

## Part A: Understanding Existing Data for Transactions (10 minutes)

### Step 4: Explore Insurance Data
**In MongoDB Compass or MongoSH:**
```javascript
// Switch to insurance_company database (already loaded)
use insurance_company

// Examine existing collections and their structure
show collections

// Look at sample policy data structure
db.policies.findOne()

// Look at sample customer data structure
db.customers.findOne()

// Count existing documents to understand the dataset
print("Policies: " + db.policies.countDocuments())
print("Customers: " + db.customers.countDocuments())
print("Claims: " + db.claims.countDocuments())

// Find some specific policies and customers we'll use for transactions
db.policies.find({}).limit(3).pretty()
db.customers.find({}).limit(2).pretty()
```

## Part B: Basic Transaction Implementation (15 minutes)

### Step 5: Simple Transaction Example

**Execute these commands step by step:**

```javascript
// Step 1: Start a transaction session
const session = db.getMongo().startSession();
```

```javascript
// Step 2: Begin transaction with write concerns
session.startTransaction({ readConcern: { level: "majority" }, writeConcern: { w: "majority", wtimeout: 5000 } });
```

```javascript
// Step 3: Get database handle with session
const sessionDb = session.getDatabase("insurance_company");
```

```javascript
// Step 4: Find an existing customer to work with
const customer = sessionDb.customers.findOne({});
print("Working with customer: " + customer.customerId);
```

```javascript
// Step 5: Update customer's policy count (part of transaction)
const customerUpdate = sessionDb.customers.updateOne({ customerId: customer.customerId }, { $inc: { policyCount: 1 } });
```

```javascript
// Step 6: Insert a new policy for this customer (part of transaction)
const newPolicyResult = sessionDb.policies.insertOne({
  policyNumber: "TXN-" + new Date().getTime(),
  policyType: "Term Life",
  customerId: customer.customerId,
  annualPremium: NumberDecimal("600.00"),
  coverageLimit: 100000,
  effectiveDate: new Date(),
  expirationDate: new Date(new Date().getTime() + (365 * 24 * 60 * 60 * 1000)),
  isActive: true,
  createdInTransaction: true
});
```

```javascript
// Step 7: Commit the transaction
session.commitTransaction();
print("✅ Transaction committed successfully");
print("Customer updated: " + customerUpdate.modifiedCount);
print("New policy created: " + newPolicyResult.insertedId);
```

```javascript
// Step 8: End the session
session.endSession();
```

### Step 6: Error Handling and Rollback Example

**Execute these commands to demonstrate transaction rollback:**

```javascript
// Step 1: Start new session for rollback demonstration
const session2 = db.getMongo().startSession();
```

```javascript
// Step 2: Start transaction (simplified settings)
session2.startTransaction();
const sessionDb = session2.getDatabase("insurance_company");
```

```javascript
// Step 3: Find test data to work with
const customer = sessionDb.customers.findOne({});
const policy = sessionDb.policies.findOne({ customerId: customer.customerId });
print("Testing rollback scenario...");
```

```javascript
// Step 4: Create a test claim (part of transaction)
const claimResult = sessionDb.claims.insertOne({ claimNumber: "ROLLBACK-TEST-" + new Date().getTime(), customerId: customer.customerId, policyNumber: policy.policyNumber, claimAmount: NumberDecimal("50000.00"), status: "Filed", filedDate: new Date(), description: "Test claim for rollback demonstration" });
print("Claim created: " + claimResult.insertedId);
```

```javascript
// Step 5: Simulate an error and rollback transaction
print("❌ Simulating business logic error - claim exceeds policy limit");
print("🔄 Rolling back transaction...");
session2.abortTransaction();
print("✅ Transaction rolled back successfully");
```

```javascript
// Step 6: End session and verify rollback worked
session2.endSession();
```

```javascript
// Step 7: Verify the claim was NOT created due to rollback
print("Verifying rollback - searching for test claim:");
const testClaim = db.claims.findOne({ claimNumber: /ROLLBACK-TEST/ });
if (testClaim) { print("❌ ERROR: Claim was found - rollback failed!"); } else { print("✅ SUCCESS: No test claim found - rollback worked correctly"); }
```

## Part C: Advanced Transaction Scenarios (20 minutes)

### Step 7: Multi-Collection Transaction

**Execute these commands for a complex multi-collection transaction:**

```javascript
// Step 1: Start session for complex transaction
const session3 = db.getMongo().startSession();
```

```javascript
// Step 2: Begin transaction with extended timeout
session3.startTransaction({ readConcern: { level: "majority" }, writeConcern: { w: "majority", wtimeout: 10000 } });
const sessionDb = session3.getDatabase("insurance_company");
```

```javascript
// Step 3: Find existing data to work with
const customer = sessionDb.customers.findOne({});
const policy = sessionDb.policies.findOne({ customerId: customer.customerId });
print("Processing comprehensive insurance transaction...");
```

```javascript
// Step 4: Create a new claim (operation 1)
const newClaim = sessionDb.claims.insertOne({ claimNumber: "TXN-CLAIM-" + new Date().getTime(), customerId: customer.customerId, policyNumber: policy.policyNumber, claimAmount: NumberDecimal("5000.00"), status: "Under Review", filedDate: new Date(), description: "Comprehensive transaction test claim" });
```

```javascript
// Step 5: Update customer's claim count (operation 2)
sessionDb.customers.updateOne({ customerId: customer.customerId }, { $inc: { claimCount: 1 }, $set: { lastClaimDate: new Date() } });
```

```javascript
// Step 6: Update policy status to reflect active claim (operation 3)
sessionDb.policies.updateOne({ policyNumber: policy.policyNumber }, { $set: { hasActiveClaims: true, lastClaimDate: new Date() } });
```

```javascript
// Step 7: Create audit log entry (operation 4)
sessionDb.audit_logs.insertOne({ action: "CLAIM_FILED", entityType: "claim", entityId: newClaim.insertedId, userId: "system", timestamp: new Date(), details: { customerId: customer.customerId, policyNumber: policy.policyNumber, claimAmount: 5000.00 } });
```

```javascript
// Step 8: Commit all operations and end session
session3.commitTransaction();
print("✅ Multi-collection transaction completed successfully");
print("Claim ID: " + newClaim.insertedId);
session3.endSession();
```

## Cleanup and Environment Teardown

### Step 8: Clean Up Test Data (Optional)

```javascript
// Remove any test data created during this lab
db.claims.deleteMany({ claimNumber: /TXN-/ });
```

```javascript
db.policies.deleteMany({ policyNumber: /TXN-/ });
```

```javascript
db.audit_logs.deleteMany({ action: "CLAIM_FILED", userId: "system" });
print("✅ Test data cleaned up");
```

### Step 9: Environment Teardown
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

## Lab 10 Deliverables
✅ **Transaction Infrastructure**: Verified replica set supports transactions
✅ **Basic Transactions**: Implemented multi-document ACID transactions
✅ **Error Handling**: Demonstrated transaction rollback and error recovery
✅ **Complex Scenarios**: Executed multi-collection transaction workflows
✅ **Audit Trail**: Created proper transaction logging and monitoring
