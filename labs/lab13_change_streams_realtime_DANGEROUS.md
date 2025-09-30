# Lab 4: Change Streams for Real-time Insurance Operations
**Duration:** 30 minutes
**Objective:** Implement real-time insurance operations using MongoDB change streams for claims processing, policy updates, and fraud detection

## Part A: Change Stream Setup (15 minutes)

### Step 1: Prepare Collections

**Using existing replica set from Lab 1:**
- Connection: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`

**Create additional collections for insurance change streams:**
```javascript
use insurance_company

// Create notifications collection for insurance alerts
db.notifications.createIndex({ recipientId: 1, timestamp: -1 })
db.notifications.createIndex({ type: 1, read: 1 })
db.notifications.createIndex({ priority: 1, status: 1 })

// Create activity log collection for audit trail
db.activity_log.createIndex({ timestamp: -1 })
db.activity_log.createIndex({ operation: 1, timestamp: -1 })
db.activity_log.createIndex({ userId: 1, timestamp: -1 })

// Create fraud alerts collection
db.fraud_alerts.createIndex({ customerId: 1, timestamp: -1 })
db.fraud_alerts.createIndex({ severity: 1, status: 1 })

// Create resume tokens collection
db.resume_tokens.createIndex({ lastUpdated: -1 })
```

### Step 2: Basic Change Stream Simulation

**Understanding Change Streams:**
Change streams in production run as background processes. For lab purposes, we'll demonstrate the concepts with simplified examples.

**⚠️ IMPORTANT: The following is demonstration code to understand change stream concepts. Copy-pasting large functions will lock your terminal. Use the step-by-step examples below instead.**

**Demonstration: Insurance Change Stream Handler Concept**
```text
// This demonstrates how a change stream handler would work:
function simulateInsuranceChangeStreamHandler(change) {
  print("=== Insurance Change Detected ===");
  print("Operation: " + change.operationType);
  print("Collection: " + change.ns.coll);
  print("Timestamp: " + new Date());

  switch(change.operationType) {
    case 'insert':
      if (change.ns.coll === "claims") {
        print("New claim filed: " + change.fullDocument._id);
        print("Customer: " + change.fullDocument.customerId);
        print("Claim Amount: $" + change.fullDocument.claimAmount);
        print("Claim Type: " + change.fullDocument.claimType);

        // Create claim notification for customer
        db.notifications.insertOne({
          recipientId: change.fullDocument.customerId,
          type: "claim_filed",
          priority: "medium",
          message: `Your claim ${change.fullDocument.claimNumber} has been filed and is under review.`,
          claimId: change.fullDocument._id,
          claimNumber: change.fullDocument.claimNumber,
          timestamp: new Date(),
          read: false,
          status: "active"
        });

        // Create assignment notification for claims department
        db.notifications.insertOne({
          recipientId: "claims_department",
          type: "claim_assignment",
          priority: "high",
          message: `New ${change.fullDocument.claimType} claim filed: ${change.fullDocument.claimNumber} for $${change.fullDocument.claimAmount}`,
          claimId: change.fullDocument._id,
          timestamp: new Date(),
          read: false,
          status: "active"
        });

        // Check for potential fraud indicators
        checkForFraudIndicators(change.fullDocument);
      }
      else if (change.ns.coll === "policies") {
        print("New policy created: " + change.fullDocument.policyNumber);
        print("Customer: " + change.fullDocument.customerId);
        print("Coverage: $" + change.fullDocument.coverageLimit);

        // Welcome notification
        db.notifications.insertOne({
          recipientId: change.fullDocument.customerId,
          type: "policy_issued",
          priority: "medium",
          message: `Welcome! Your ${change.fullDocument.policyType} policy ${change.fullDocument.policyNumber} is now active.`,
          policyId: change.fullDocument._id,
          timestamp: new Date(),
          read: false,
          status: "active"
        });
      }
      break;

    case 'update':
      if (change.ns.coll === "claims") {
        print("Claim updated: " + change.documentKey._id);
        if (change.updateDescription && change.updateDescription.updatedFields.status) {
          print("Status changed to: " + change.updateDescription.updatedFields.status);

          // Create status update notification
          var claim = db.claims.findOne({ _id: change.documentKey._id });
          var statusMessage = getClaimStatusMessage(change.updateDescription.updatedFields.status, claim);

          db.notifications.insertOne({
            recipientId: claim.customerId,
            type: "claim_status_update",
            priority: change.updateDescription.updatedFields.status === "Approved" ? "high" : "medium",
            message: statusMessage,
            claimId: change.documentKey._id,
            claimNumber: claim.claimNumber,
            timestamp: new Date(),
            read: false,
            status: "active"
          });
        }

        if (change.updateDescription && change.updateDescription.updatedFields.settlementAmount) {
          print("Settlement amount set: $" + change.updateDescription.updatedFields.settlementAmount);

          var claim = db.claims.findOne({ _id: change.documentKey._id });
          db.notifications.insertOne({
            recipientId: claim.customerId,
            type: "settlement_approved",
            priority: "high",
            message: `Your claim ${claim.claimNumber} has been settled for $${change.updateDescription.updatedFields.settlementAmount}`,
            claimId: change.documentKey._id,
            timestamp: new Date(),
            read: false,
            status: "active"
          });
        }
      }
      else if (change.ns.coll === "policies") {
        if (change.updateDescription && change.updateDescription.updatedFields.status === "Cancelled") {
          print("Policy cancelled: " + change.documentKey._id);

          var policy = db.policies.findOne({ _id: change.documentKey._id });
          db.notifications.insertOne({
            recipientId: policy.customerId,
            type: "policy_cancelled",
            priority: "high",
            message: `Your policy ${policy.policyNumber} has been cancelled.`,
            policyId: change.documentKey._id,
            timestamp: new Date(),
            read: false,
            status: "active"
          });
        }
      }
      break;

    case 'delete':
      print("Document deleted: " + change.documentKey._id);
      // Log deletion for audit purposes
      db.activity_log.insertOne({
        operation: "delete",
        collection: change.ns.coll,
        documentId: change.documentKey._id,
        timestamp: new Date(),
        userId: "system"
      });
      break;
  }
  print("===============================\n");
}

// Helper function for claim status messages
function getClaimStatusMessage(status, claim) {
  switch(status) {
    case "Under Review":
      return `Your claim ${claim.claimNumber} is now under review by our adjusters.`;
    case "Investigating":
      return `Your claim ${claim.claimNumber} is being investigated. We may contact you for additional information.`;
    case "Approved":
      return `Great news! Your claim ${claim.claimNumber} has been approved.`;
    case "Denied":
      return `We regret to inform you that your claim ${claim.claimNumber} has been denied. Please contact us for details.`;
    case "Settled":
      return `Your claim ${claim.claimNumber} has been settled and payment is being processed.`;
    default:
      return `Your claim ${claim.claimNumber} status has been updated to: ${status}`;
  }
}

// Fraud detection function
function checkForFraudIndicators(claim) {
  var indicators = [];
  var severity = "low";

  // Check for high claim amount
  if (claim.claimAmount > 50000) {
    indicators.push("High claim amount");
    severity = "medium";
  }

  // Check if claim was filed soon after policy effective date
  var policy = db.policies.findOne({ _id: claim.policyId });
  if (policy) {
    var daysBetween = (claim.incidentDate - policy.effectiveDate) / (1000 * 60 * 60 * 24);
    if (daysBetween < 30) {
      indicators.push("Claim filed within 30 days of policy effective date");
      severity = "high";
    }
  }

  // Check for multiple recent claims by same customer
  var recentClaims = db.claims.countDocuments({
    customerId: claim.customerId,
    filedDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
  });

  if (recentClaims > 2) {
    indicators.push("Multiple claims in 90 days");
    severity = "high";
  }

  // Create fraud alert if indicators found
  if (indicators.length > 0) {
    db.fraud_alerts.insertOne({
      customerId: claim.customerId,
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      severity: severity,
      indicators: indicators,
      status: "active",
      timestamp: new Date(),
      reviewedBy: null,
      notes: "Automatically generated fraud alert"
    });

    // High priority notification for fraud team
    db.notifications.insertOne({
      recipientId: "fraud_investigation_team",
      type: "fraud_alert",
      priority: "critical",
      message: `Potential fraud detected for claim ${claim.claimNumber}. Severity: ${severity}`,
      claimId: claim._id,
      timestamp: new Date(),
      read: false,
      status: "active"
    });

    print(`⚠️ FRAUD ALERT: ${indicators.length} indicators detected for claim ${claim.claimNumber}`);
  }
}
```

### Step 3: Test Change Stream Processing

**Monitor in Compass:**
1. Open `claims` and `notifications` collections in separate tabs
2. Enable auto-refresh for real-time monitoring

**Test Claim Creation and Processing:**
```javascript
// Create a test claim and simulate change stream processing
var testClaim = {
  _id: "claim_cs_test1",
  claimNumber: "CLM-2024-CS001",
  customerId: "cust1",
  policyId: "policy1",
  claimType: "Auto Accident",
  incidentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  filedDate: new Date(),
  claimAmount: 8500.00,
  status: "Filed",
  description: "Rear-end collision on Interstate 95",
  state: "FL"
};

// Insert claim
db.claims.insertOne(testClaim);

// Simulate change stream processing for claim filing
simulateInsuranceChangeStreamHandler({
  operationType: "insert",
  ns: { db: "insurance_company", coll: "claims" },
  fullDocument: testClaim,
  documentKey: { _id: "claim_cs_test1" }
});

// Update claim status to Under Review
db.claims.updateOne(
  { _id: "claim_cs_test1" },
  { $set: { status: "Under Review", adjusterId: "adjuster_jane_smith" } }
);

// Simulate update processing
simulateInsuranceChangeStreamHandler({
  operationType: "update",
  ns: { db: "insurance_company", coll: "claims" },
  documentKey: { _id: "claim_cs_test1" },
  updateDescription: { updatedFields: { status: "Under Review" } }
});

// Approve and settle the claim
db.claims.updateOne(
  { _id: "claim_cs_test1" },
  {
    $set: {
      status: "Approved",
      settlementAmount: 7500.00,
      approvedBy: "adjuster_jane_smith",
      approvalDate: new Date()
    }
  }
);

// Simulate settlement processing
simulateInsuranceChangeStreamHandler({
  operationType: "update",
  ns: { db: "insurance_company", coll: "claims" },
  documentKey: { _id: "claim_cs_test1" },
  updateDescription: {
    updatedFields: {
      status: "Approved",
      settlementAmount: 7500.00
    }
  }
});

// Test policy creation
var testPolicy = {
  _id: "policy_cs_test1",
  policyNumber: "AUTO-CS-001",
  customerId: "cust2",
  policyType: "Auto",
  region: "Southeast",
  state: "GA",
  coverageLimit: 100000.00,
  premium: 1200.00,
  effectiveDate: new Date(),
  expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  status: "Active"
};

db.policies.insertOne(testPolicy);

simulateInsuranceChangeStreamHandler({
  operationType: "insert",
  ns: { db: "insurance_company", coll: "policies" },
  fullDocument: testPolicy,
  documentKey: { _id: "policy_cs_test1" }
});
```

**Verify in Compass:**
- Check `notifications` collection for auto-generated insurance notifications
- Apply filter: `{"claimId": "claim_cs_test1"}` to see claim-related notifications
- Check `fraud_alerts` collection for any fraud indicators
- Apply filter: `{"type": "claim_filed"}` to see all claim filing notifications

## Part B: Advanced Change Stream Features (15 minutes)

### Step 4: Event-Driven Claim Processing System

```javascript
// Complete insurance processing system with change streams
var InsuranceProcessor = {

  // Process new claims
  processNewClaim: function(claim) {
    print(`Processing new claim: ${claim.claimNumber}`);

    // Validate policy is active
    var policy = db.policies.findOne({
      _id: claim.policyId,
      status: "Active",
      effectiveDate: { $lte: claim.incidentDate },
      expirationDate: { $gte: claim.incidentDate }
    });

    if (policy) {
      // Check if claim amount is within policy limits
      if (claim.claimAmount <= policy.coverageLimit) {
        // Update claim status to under review
        db.claims.updateOne(
          { _id: claim._id },
          {
            $set: {
              status: "Under Review",
              assignedAt: new Date(),
              adjusterId: this.assignAdjuster(claim.state, claim.claimType)
            }
          }
        );

        // Create success notification
        db.notifications.insertOne({
          recipientId: claim.customerId,
          type: "claim_accepted",
          priority: "medium",
          message: `Your claim ${claim.claimNumber} has been accepted and assigned to an adjuster.`,
          claimId: claim._id,
          timestamp: new Date(),
          read: false,
          status: "active"
        });

        print(`✅ Claim ${claim.claimNumber} accepted and under review`);
      } else {
        // Claim exceeds policy limit
        db.claims.updateOne(
          { _id: claim._id },
          {
            $set: {
              status: "Denied",
              reason: "Claim amount exceeds policy coverage limit",
              deniedAt: new Date()
            }
          }
        );

        db.notifications.insertOne({
          recipientId: claim.customerId,
          type: "claim_denied",
          priority: "high",
          message: `Your claim ${claim.claimNumber} has been denied: claim amount exceeds policy coverage.`,
          claimId: claim._id,
          timestamp: new Date(),
          read: false,
          status: "active"
        });

        print(`❌ Claim ${claim.claimNumber} denied - exceeds coverage limit`);
      }
    } else {
      // Policy not found or not active
      db.claims.updateOne(
        { _id: claim._id },
        {
          $set: {
            status: "Denied",
            reason: "Policy not active or not found for incident date",
            deniedAt: new Date()
          }
        }
      );

      db.notifications.insertOne({
        recipientId: claim.customerId,
        type: "claim_denied",
        priority: "high",
        message: `Your claim ${claim.claimNumber} has been denied: policy not active for incident date.`,
        claimId: claim._id,
        timestamp: new Date(),
        read: false,
        status: "active"
      });

      print(`❌ Claim ${claim.claimNumber} denied - policy not active`);
    }
  },

  // Assign adjuster based on location and claim type
  assignAdjuster: function(state, claimType) {
    var adjusters = {
      "CA": ["adj_west_1", "adj_west_2", "adj_west_3"],
      "TX": ["adj_south_1", "adj_south_2"],
      "NY": ["adj_east_1", "adj_east_2", "adj_east_3"],
      "FL": ["adj_south_3", "adj_south_4"]
    };

    var stateAdjusters = adjusters[state] || ["adj_general_1"];
    return stateAdjusters[Math.floor(Math.random() * stateAdjusters.length)];
  },

  // Handle claim status changes
  handleClaimStatusChange: function(claimId, newStatus) {
    print(`Claim ${claimId} status changed to: ${newStatus}`);

    var claim = db.claims.findOne({ _id: claimId });
    if (claim) {
      if (newStatus === "Settled") {
        // Update customer claim history
        db.customers.updateOne(
          { _id: claim.customerId },
          {
            $inc: { totalClaimsSettled: 1, totalClaimPayouts: claim.settlementAmount || 0 },
            $set: { lastClaimDate: new Date() }
          }
        );

        // Update policy claim history
        db.policies.updateOne(
          { _id: claim.policyId },
          {
            $inc: { claimsCount: 1, totalClaimsPaid: claim.settlementAmount || 0 },
            $set: { lastClaimDate: new Date() }
          }
        );

        print(`✅ Customer and policy records updated for settled claim`);
      }

      // Check if this triggers any risk assessment updates
      this.assessCustomerRisk(claim.customerId);
    }
  },

  // Assess customer risk based on claim history
  assessCustomerRisk: function(customerId) {
    var customer = db.customers.findOne({ _id: customerId });
    if (!customer) return;

    var claimCount = db.claims.countDocuments({
      customerId: customerId,
      status: { $in: ["Settled", "Approved"] },
      filedDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
    });

    var riskLevel = "Low";
    if (claimCount >= 3) {
      riskLevel = "High";
    } else if (claimCount >= 2) {
      riskLevel = "Medium";
    }

    // Update customer risk assessment
    db.customers.updateOne(
      { _id: customerId },
      { $set: { riskLevel: riskLevel, lastRiskAssessment: new Date() } }
    );

    if (riskLevel === "High") {
      // Notify underwriting team
      db.notifications.insertOne({
        recipientId: "underwriting_team",
        type: "high_risk_customer",
        priority: "high",
        message: `Customer ${customer.name} (${customerId}) has been flagged as high risk - ${claimCount} claims in 12 months.`,
        customerId: customerId,
        timestamp: new Date(),
        read: false,
        status: "active"
      });

      print(`⚠️ High risk customer alert for ${customerId}`);
    }
  },

  // Handle policy changes
  handlePolicyChange: function(policyId, changeType) {
    print(`Policy ${policyId} change: ${changeType}`);

    var policy = db.policies.findOne({ _id: policyId });
    if (policy) {
      if (changeType === "renewal") {
        // Check for renewal notifications
        var daysUntilExpiration = (policy.expirationDate - new Date()) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
          db.notifications.insertOne({
            recipientId: policy.customerId,
            type: "policy_renewal_reminder",
            priority: "medium",
            message: `Your policy ${policy.policyNumber} expires in ${Math.floor(daysUntilExpiration)} days. Please contact us to renew.`,
            policyId: policyId,
            timestamp: new Date(),
            read: false,
            status: "active"
          });

          print(`📅 Renewal reminder sent for policy ${policy.policyNumber}`);
        }
      }
    }
  }
};
```

### Step 5: Test Complete Workflow

```javascript
print("=== Testing Complete Insurance Processing Workflow ===");

// Create a new claim for testing
var newClaim = {
  _id: "claim_workflow_test1",
  claimNumber: "CLM-2024-WF001",
  customerId: "cust2",
  policyId: "policy2",
  claimType: "Property Damage",
  incidentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  filedDate: new Date(),
  claimAmount: 15000.00,
  status: "Filed",
  description: "Kitchen fire damage",
  state: "NY"
};

// Insert and process claim
db.claims.insertOne(newClaim);
InsuranceProcessor.processNewClaim(newClaim);

// Simulate claim status changes
InsuranceProcessor.handleClaimStatusChange("claim_workflow_test1", "Investigating");
InsuranceProcessor.handleClaimStatusChange("claim_workflow_test1", "Approved");
InsuranceProcessor.handleClaimStatusChange("claim_workflow_test1", "Settled");

// Test policy renewal reminder
InsuranceProcessor.handlePolicyChange("policy2", "renewal");

// Test claim that exceeds coverage
var excessiveClaim = {
  _id: "claim_workflow_test2",
  claimNumber: "CLM-2024-WF002",
  customerId: "cust1",
  policyId: "policy1", // Auto policy with $100K limit
  claimType: "Auto Accident",
  incidentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  filedDate: new Date(),
  claimAmount: 150000.00, // Exceeds $100K coverage
  status: "Filed",
  description: "Multi-vehicle accident",
  state: "CA"
};

db.claims.insertOne(excessiveClaim);
InsuranceProcessor.processNewClaim(excessiveClaim);

// Test potential fraud case (claim filed very soon after policy effective date)
var potentialFraudClaim = {
  _id: "claim_workflow_test3",
  claimNumber: "CLM-2024-WF003",
  customerId: "cust3",
  policyId: "policy3",
  claimType: "Theft",
  incidentDate: new Date(), // Same day as filing
  filedDate: new Date(),
  claimAmount: 75000.00, // High amount
  status: "Filed",
  description: "Vehicle theft",
  state: "TX"
};

// First create a policy with recent effective date to trigger fraud indicators
db.policies.insertOne({
  _id: "policy_fraud_test",
  policyNumber: "AUTO-FRAUD-001",
  customerId: "cust3",
  policyType: "Auto",
  region: "Southwest",
  state: "TX",
  coverageLimit: 100000.00,
  premium: 1200.00,
  effectiveDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  expirationDate: new Date(Date.now() + 355 * 24 * 60 * 60 * 1000),
  status: "Active"
});

potentialFraudClaim.policyId = "policy_fraud_test";
db.claims.insertOne(potentialFraudClaim);

// This should trigger fraud indicators
simulateInsuranceChangeStreamHandler({
  operationType: "insert",
  ns: { db: "insurance_company", coll: "claims" },
  fullDocument: potentialFraudClaim,
  documentKey: { _id: "claim_workflow_test3" }
});
```

### Step 6: Resume Token Management

```javascript
// Insurance-specific change stream manager with resume tokens
var InsuranceChangeStreamManager = {

  // Store resume token for fault tolerance
  storeResumeToken: function(streamId, token) {
    db.resume_tokens.replaceOne(
      { _id: streamId },
      { _id: streamId, token: token, lastUpdated: new Date() },
      { upsert: true }
    );
    print(`Resume token stored for ${streamId}`);
  },

  // Get last resume token
  getLastResumeToken: function(streamId) {
    var doc = db.resume_tokens.findOne({ _id: streamId });
    if (doc) {
      print(`Resume token found for ${streamId}: ${doc.lastUpdated}`);
      return doc.token;
    }
    print(`No resume token found for ${streamId}`);
    return null;
  },

  // Process insurance change with resume token and audit trail
  processInsuranceChangeWithResume: function(streamId, change) {
    // Process the change
    print(`Processing insurance change for ${streamId}: ${change.operationType}`);

    // Store resume token for fault tolerance
    this.storeResumeToken(streamId, change._id);

    // Enhanced logging for insurance compliance
    var logEntry = {
      operation: change.operationType,
      collection: change.ns.coll,
      documentId: change.documentKey._id,
      timestamp: new Date(),
      changeId: change._id,
      streamId: streamId,
      userId: "system", // In real implementation, would be actual user
      complianceLevel: this.getComplianceLevel(change.ns.coll),
      auditRequired: this.isAuditRequired(change.ns.coll, change.operationType)
    };

    // Add specific details based on collection
    if (change.ns.coll === "claims" && change.operationType === "update") {
      if (change.updateDescription && change.updateDescription.updatedFields.status) {
        logEntry.statusChange = {
          field: "status",
          newValue: change.updateDescription.updatedFields.status
        };
      }
      if (change.updateDescription && change.updateDescription.updatedFields.settlementAmount) {
        logEntry.financialChange = {
          field: "settlementAmount",
          amount: change.updateDescription.updatedFields.settlementAmount
        };
      }
    }

    db.activity_log.insertOne(logEntry);

    // Create compliance notification if required
    if (logEntry.auditRequired) {
      db.notifications.insertOne({
        recipientId: "compliance_team",
        type: "audit_required",
        priority: "medium",
        message: `Audit required for ${change.operationType} operation on ${change.ns.coll}`,
        documentId: change.documentKey._id,
        timestamp: new Date(),
        read: false,
        status: "active"
      });
    }

    print(`✅ Insurance change processed and resume token saved`);
  },

  // Determine compliance level based on collection
  getComplianceLevel: function(collection) {
    var complianceLevels = {
      "claims": "HIGH",
      "policies": "HIGH",
      "payments": "CRITICAL",
      "customers": "MEDIUM",
      "fraud_alerts": "CRITICAL",
      "agents": "MEDIUM"
    };
    return complianceLevels[collection] || "LOW";
  },

  // Determine if operation requires audit
  isAuditRequired: function(collection, operation) {
    var auditRequiredOperations = {
      "claims": ["update", "delete"],
      "policies": ["update", "delete"],
      "payments": ["insert", "update", "delete"],
      "fraud_alerts": ["insert", "update"]
    };

    var operations = auditRequiredOperations[collection] || [];
    return operations.includes(operation);
  }
};

// Test insurance resume token functionality
print("=== Testing Insurance Resume Token Functionality ===");

// Simulate insurance change stream events
var simulatedInsuranceChanges = [
  {
    _id: { _data: "insuranceResumeToken1" },
    operationType: "insert",
    ns: { db: "insurance_company", coll: "claims" },
    documentKey: { _id: "claim_resume_test1" }
  },
  {
    _id: { _data: "insuranceResumeToken2" },
    operationType: "update",
    ns: { db: "insurance_company", coll: "claims" },
    documentKey: { _id: "claim_resume_test1" },
    updateDescription: { updatedFields: { status: "Approved" } }
  },
  {
    _id: { _data: "insuranceResumeToken3" },
    operationType: "insert",
    ns: { db: "insurance_company", coll: "payments" },
    documentKey: { _id: "payment_resume_test1" }
  }
];

// Process changes with resume tokens
simulatedInsuranceChanges.forEach(function(change, index) {
  InsuranceChangeStreamManager.processInsuranceChangeWithResume("insurance_claims_stream", change);
});

// Check stored resume tokens
print("\nStored insurance resume tokens:");
db.resume_tokens.find().forEach(printjson);

// Check activity log with compliance info
print("\nInsurance activity log:");
db.activity_log.find({ streamId: "insurance_claims_stream" }).forEach(printjson);

// Check compliance notifications
print("\nCompliance notifications:");
db.notifications.find({ recipientId: "compliance_team" }).forEach(printjson);
```

### Step 7: Monitor Results in Compass

**Real-time Insurance Monitoring:**
1. Keep multiple collection tabs open:
   - `claims` - see claim status changes
   - `policies` - see policy updates
   - `notifications` - see generated insurance notifications
   - `fraud_alerts` - see fraud detection alerts
   - `activity_log` - see change stream processing with compliance info
   - `resume_tokens` - see fault tolerance tokens

**Insurance Analytics Queries:**
```javascript
// Count notifications by type and priority
db.notifications.aggregate([
  { $group: { _id: { type: "$type", priority: "$priority" }, count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Find unread high-priority notifications
db.notifications.find({
  priority: "high",
  read: false,
  status: "active"
}).sort({ timestamp: -1 })

// Check recent claims activity
db.activity_log.find({
  collection: "claims",
  complianceLevel: { $in: ["HIGH", "CRITICAL"] }
}).sort({ timestamp: -1 }).limit(10)

// Fraud alerts summary
db.fraud_alerts.aggregate([
  { $group: { _id: "$severity", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Claims processing metrics
db.claims.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
      avgAmount: { $avg: "$claimAmount" },
      totalAmount: { $sum: "$claimAmount" }
    }
  },
  { $sort: { count: -1 } }
])

// Customer risk distribution
db.customers.aggregate([
  { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Lab 4 Deliverables
✅ **Insurance change stream simulation** with comprehensive event processing
✅ **Real-time insurance notifications** system for claims, policies, and fraud alerts
✅ **Event-driven insurance processing** workflow including:
   - Automated claim validation and assignment
   - Fraud detection and alerting
   - Customer risk assessment
   - Policy renewal reminders
   - Compliance audit trail
✅ **Resume token management** for fault tolerance in insurance operations
✅ **Insurance-specific analytics** and monitoring dashboards
✅ **Compliance and audit trail** functionality for regulatory requirements