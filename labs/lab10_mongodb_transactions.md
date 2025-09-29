# Lab 1: MongoDB Transactions
**Duration:** 45 minutes
**Objective:** Master ACID transactions in MongoDB for insurance claim processing

## Part A: Replica Set Setup (10 minutes)

### Step 1: Start MongoDB Containers
```bash
# Create network for MongoDB containers
docker network create mongodb-net

# Start three MongoDB nodes for replica set
docker run -d --name mongo1 --network mongodb-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo2 --network mongodb-net -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo3 --network mongodb-net -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Verify containers are running
docker ps
```

### Step 2: Initialize Replica Set
```bash
# Wait for containers to fully start
sleep 20

# Initialize replica set
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017' },
    { _id: 1, host: 'mongo2:27017' },
    { _id: 2, host: 'mongo3:27017' }
  ]
})
"

# Verify replica set status
docker exec -it mongo1 mongosh --eval "rs.status()"
```

### Step 3: Connect with MongoDB Compass
1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
3. Click **"Connect"**
4. Verify you see the replica set topology

## Part B: Transaction Setup and Testing (25 minutes)

### Step 4: Create Sample Data
**In MongoDB Compass:**
1. Navigate to **Databases** → **Create Database**
2. Database Name: `insurance_company`
3. Collection Name: `policies`

**Using Compass MongoSH tab:**
```javascript
// Switch to insurance_company database
use insurance_company

// Create policies with coverage limits
db.policies.insertMany([
  {
    _id: "policy1",
    policyNumber: "AUTO-001",
    type: "Auto",
    coverageLimit: 100000.00,
    premium: 1200.00,
    status: "Active",
    customerId: "cust1"
  },
  {
    _id: "policy2",
    policyNumber: "HOME-001",
    type: "Property",
    coverageLimit: 500000.00,
    premium: 800.00,
    status: "Active",
    customerId: "cust2"
  },
  {
    _id: "policy3",
    policyNumber: "LIFE-001",
    type: "Life",
    coverageLimit: 250000.00,
    premium: 600.00,
    status: "Active",
    customerId: "cust3"
  },
  {
    _id: "policy4",
    policyNumber: "COMM-001",
    type: "Commercial",
    coverageLimit: 1000000.00,
    premium: 2400.00,
    status: "Active",
    customerId: "cust1"
  }
])

// Create customers with account balances and policy info
db.customers.insertMany([
  {
    _id: "cust1",
    name: "John Doe",
    email: "john@example.com",
    phone: "555-0101",
    type: "Individual",
    accountBalance: 5000.00,
    totalPremiumsPaid: 15000.00
  },
  {
    _id: "cust2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "555-0102",
    type: "Individual",
    accountBalance: 2500.00,
    totalPremiumsPaid: 8000.00
  },
  {
    _id: "cust3",
    name: "ABC Manufacturing Corp",
    email: "finance@abcmfg.com",
    phone: "555-0103",
    type: "Business",
    accountBalance: 25000.00,
    totalPremiumsPaid: 45000.00
  }
])

// Create claims collection with index
db.claims.createIndex({ customerId: 1, incidentDate: 1 })
db.claims.createIndex({ policyId: 1, status: 1 })
```

### Step 5: Implement Claim Settlement Transaction

```javascript
// Complete claim settlement processing transaction
function processClaimSettlement(claimId, settlementAmount, adjusterId) {
  const session = db.getMongo().startSession();

  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });

    // Use session database reference
    const sessionDb = session.getDatabase("insurance_company");

    // Find the claim
    const claim = sessionDb.claims.findOne({ _id: claimId });

    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "Under Review") {
      throw new Error("Claim is not in reviewable status");
    }

    // Find the associated policy
    const policy = sessionDb.policies.findOne({ _id: claim.policyId });

    if (!policy) {
      throw new Error("Associated policy not found");
    }

    // Validate settlement amount doesn't exceed coverage
    if (settlementAmount > policy.coverageLimit) {
      throw new Error("Settlement amount exceeds policy coverage limit");
    }

    // Find customer
    const customer = sessionDb.customers.findOne({ _id: claim.customerId });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Update claim status and settlement info
    sessionDb.claims.updateOne(
      { _id: claimId },
      {
        $set: {
          status: "Settled",
          settlementAmount: settlementAmount,
          adjusterId: adjusterId,
          settlementDate: new Date(),
          approvedBy: adjusterId
        }
      }
    );

    // Update customer account balance
    sessionDb.customers.updateOne(
      { _id: claim.customerId },
      { $inc: { accountBalance: settlementAmount } }
    );

    // Create payment record
    sessionDb.payments.insertOne({
      _id: new ObjectId(),
      type: "Claim Settlement",
      customerId: claim.customerId,
      claimId: claimId,
      policyId: claim.policyId,
      amount: settlementAmount,
      paymentDate: new Date(),
      status: "Completed",
      adjusterId: adjusterId
    });

    // Update policy claims history
    sessionDb.policies.updateOne(
      { _id: claim.policyId },
      {
        $inc: { totalClaimsPaid: settlementAmount, claimsCount: 1 },
        $set: { lastClaimDate: new Date() }
      }
    );

    // Commit transaction
    session.commitTransaction();

    print("Claim settlement processed successfully");
    print("Claim ID: " + claimId);
    print("Settlement Amount: $" + settlementAmount.toFixed(2));
    print("Customer: " + customer.name);

    return { success: true, claimId: claimId, settlementAmount: settlementAmount };

  } catch (error) {
    print("Claim settlement failed: " + error.message);
    session.abortTransaction();
    return { success: false, error: error.message };

  } finally {
    session.endSession();
  }
}
```

### Step 6: Test Transactions

**Create test claims first:**
```javascript
// Create test claims for transaction testing
db.claims.insertMany([
  {
    _id: "claim1",
    claimNumber: "CLM-2024-001",
    customerId: "cust1",
    policyId: "policy1",
    incidentDate: new Date("2024-01-15"),
    claimAmount: 15000.00,
    status: "Under Review",
    description: "Vehicle collision on Highway 101",
    adjusterAssigned: null
  },
  {
    _id: "claim2",
    claimNumber: "CLM-2024-002",
    customerId: "cust2",
    policyId: "policy2",
    incidentDate: new Date("2024-02-01"),
    claimAmount: 45000.00,
    status: "Under Review",
    description: "House fire damage to kitchen",
    adjusterAssigned: null
  }
])
```

**Test Successful Transaction:**
```javascript
// Test successful claim settlement
var result1 = processClaimSettlement("claim1", 12000.00, "adjuster1");
```

**Monitor in Compass:**
1. Keep `claims`, `customers`, `payments`, and `policies` collections open in separate tabs
2. Execute the transaction
3. Refresh collections to see changes:
   - Claim status updated to "Settled"
   - Customer balance increased
   - New payment record created
   - Policy claims history updated

**Test Failed Transactions:**
```javascript
// Test settlement exceeding coverage limit
var result2 = processClaimSettlement("claim2", 600000.00, "adjuster2");  // Exceeds $500K coverage

// Test settlement for non-existent claim
var result3 = processClaimSettlement("claim999", 5000.00, "adjuster1");

// Test settlement for already settled claim
var result4 = processClaimSettlement("claim1", 5000.00, "adjuster2");  // Already settled
```

**Verify Rollback:**
- Check that no data changed when transactions failed
- This demonstrates ACID atomicity in insurance claim processing

## Part C: Premium Payment Processing System (10 minutes)

### Step 7: Implement Premium Payment Processing

```javascript
// Premium Payment Processing System
function processPremiumPayment(customerId, policyId, paymentAmount, paymentMethod) {
  // Create fresh session
  const session = db.getMongo().startSession();

  try {
    // Start transaction
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });

    // Use session database
    const sessionDb = session.getDatabase("insurance_company");

    // Validate customer exists
    const customer = sessionDb.customers.findOne({ _id: customerId });
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Validate policy exists and belongs to customer
    const policy = sessionDb.policies.findOne({
      _id: policyId,
      customerId: customerId,
      status: "Active"
    });

    if (!policy) {
      throw new Error("Policy not found or not active for this customer");
    }

    // Validate payment amount matches premium (for simplicity)
    if (paymentAmount !== policy.premium) {
      throw new Error(`Payment amount $${paymentAmount} does not match premium $${policy.premium}`);
    }

    // Check if customer has sufficient balance for auto-debit
    if (paymentMethod === "auto-debit" && customer.accountBalance < paymentAmount) {
      throw new Error("Insufficient account balance for auto-debit");
    }

    // Process payment based on method
    if (paymentMethod === "auto-debit") {
      // Debit from customer account
      sessionDb.customers.updateOne(
        { _id: customerId },
        { $inc: { accountBalance: -paymentAmount } }
      );
    }

    // Update customer premium payment history
    sessionDb.customers.updateOne(
      { _id: customerId },
      {
        $inc: { totalPremiumsPaid: paymentAmount },
        $set: { lastPaymentDate: new Date() }
      }
    );

    // Update policy payment info
    sessionDb.policies.updateOne(
      { _id: policyId },
      {
        $set: {
          lastPremiumPayment: new Date(),
          nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      }
    );

    // Create payment transaction record
    sessionDb.payments.insertOne({
      _id: new ObjectId(),
      type: "Premium Payment",
      customerId: customerId,
      policyId: policyId,
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      paymentDate: new Date(),
      status: "Completed",
      transactionId: "TXN-" + new ObjectId().toString().substr(-8)
    });

    session.commitTransaction();

    print(`Premium payment processed successfully`);
    print(`Customer: ${customer.name}`);
    print(`Policy: ${policy.policyNumber}`);
    print(`Amount: $${paymentAmount}`);
    print(`Method: ${paymentMethod}`);

    return { success: true, customerId, policyId, amount: paymentAmount };

  } catch (error) {
    print("Premium payment failed: " + error.message);
    session.abortTransaction();
    return { success: false, error: error.message };

  } finally {
    session.endSession();
  }
}

// Create payments collection with indexes
db.payments.createIndex({ customerId: 1, paymentDate: -1 });
db.payments.createIndex({ policyId: 1, status: 1 });

// Test successful premium payment
processPremiumPayment("cust1", "policy1", 1200.00, "auto-debit");

// Verify customer and policy updates
db.customers.find({ _id: "cust1" }, { name: 1, accountBalance: 1, totalPremiumsPaid: 1, lastPaymentDate: 1 });
db.policies.find({ _id: "policy1" }, { policyNumber: 1, lastPremiumPayment: 1, nextDueDate: 1 });

// Test more premium payments
processPremiumPayment("cust2", "policy2", 800.00, "credit-card");
processPremiumPayment("cust3", "policy3", 600.00, "bank-transfer");

// Test invalid premium payment
processPremiumPayment("cust2", "policy2", 1000.00, "auto-debit");  // Should fail - wrong amount
processPremiumPayment("cust1", "policy1", 1200.00, "auto-debit");  // Should fail - insufficient balance after first payment
```

### Step 8: Verify Results in Compass
1. Check `customers` collection - verify account balance and premium payment history changes
2. Check `payments` collection - see premium payment records
3. Check `policies` collection - see updated payment dates and due dates
4. Check `claims` collection - see settled claims
5. Observe how invalid transactions don't affect data

## Lab 1 Deliverables
✅ **Replica set** configured and verified
✅ **ACID transactions** implemented for insurance claim settlement and premium payment processing
✅ **Visual verification** using Compass real-time monitoring
✅ **Understanding** of transaction isolation and consistency in insurance operations