# Manual Day 3 Data Setup

This guide provides step-by-step instructions for manually loading Day 3 production data if the automated `day3_data_loader.js` script cannot be used.

## Prerequisites

- MongoDB replica set running (see `../scripts/setup.sh`)
- MongoDB Shell (mongosh) installed and accessible
- Day 1 and Day 2 data loaded (required -- Day 3 builds on existing data)

## Overview

Day 3 does **not** replace Day 1 or Day 2 data. It upserts additional documents and adds new collections for production labs (transactions, replication, sharding, change streams, and application integration). All upserts use `updateOne` with `{upsert: true}` so the setup is safe to rerun.

## Manual Data Loading Steps

### 1. Connect to MongoDB

```bash
mongosh
```

### 2. Switch to the Insurance Database

```javascript
use insurance_company
```

### 3. Clean Day 3-Specific Collections

Only drop collections that are unique to Day 3. Do **not** drop `policies`, `customers`, `claims`, `agents`, or `branches` -- those contain Day 1/2 data.

```javascript
db.vehicles.drop();
db.properties.drop();
db.policy_notifications.drop();
db.claim_activity_log.drop();
db.resume_tokens.drop();
db.fraud_investigations.drop();
db.compliance_records.drop();

print("Cleaned Day 3-specific collections");
print("Note: Preserving Day 1/2 data in policies, customers, claims, agents, branches");
```

### 4. Upsert Policies for Transaction Testing (4 Policies)

These policies have `_id` values "pol1" through "pol4" and include an `activePolicies` field used in Lab 10 transaction exercises.

```javascript
db.policies.updateOne(
  { _id: "pol1" },
  { $set: {
    policyNumber: "POL-AUTO-001",
    name: "Premium Auto Coverage",
    policyType: "Auto",
    annualPremium: 1299.99,
    activePolicies: 10,
    coverageDetails: {
      liability: "250000/500000",
      collision: {
        deductible: 500,
        coverage: "Full"
      },
      comprehensive: {
        deductible: 250,
        coverage: "Full"
      }
    },
    coverageTypes: ["liability", "collision", "comprehensive"],
    isActive: true
  }},
  { upsert: true }
);

db.policies.updateOne(
  { _id: "pol2" },
  { $set: {
    policyNumber: "POL-HOME-001",
    name: "Homeowners Protection",
    policyType: "Property",
    annualPremium: 1899.99,
    activePolicies: 25,
    coverageDetails: {
      dwelling: {
        coverage: 400000,
        deductible: 1000
      },
      personalProperty: {
        coverage: 200000,
        deductible: 500
      },
      liability: 300000
    },
    coverageTypes: ["dwelling", "personal_property", "liability"],
    isActive: true
  }},
  { upsert: true }
);

db.policies.updateOne(
  { _id: "pol3" },
  { $set: {
    policyNumber: "POL-LIFE-001",
    name: "Term Life Insurance",
    policyType: "Life",
    annualPremium: 599.99,
    activePolicies: 15,
    coverageDetails: {
      deathBenefit: 500000,
      term: "20 years",
      beneficiaries: "Spouse and Children"
    },
    coverageTypes: ["death_benefit", "accidental_death"],
    isActive: true
  }},
  { upsert: true }
);

db.policies.updateOne(
  { _id: "pol4" },
  { $set: {
    policyNumber: "POL-COMM-001",
    name: "Business Liability",
    policyType: "Commercial",
    annualPremium: 2499.99,
    activePolicies: 8,
    coverageDetails: {
      generalLiability: 2000000,
      productLiability: 1000000,
      businessType: "Technology"
    },
    coverageTypes: ["general_liability", "product_liability"],
    isActive: true
  }},
  { upsert: true }
);

print("Upserted Day 3 policies - total: " + db.policies.countDocuments());
```

### 5. Upsert Customers for Transaction Testing (3 Customers)

These customers have `_id` values "cust1" through "cust3" and include `premiumBalance`, `totalPolicies`, and `totalPremiumsPaid` fields used in Lab 10 transaction exercises.

```javascript
db.customers.updateOne(
  { _id: "cust1" },
  { $set: {
    customerId: "CUST000001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "+1-555-0101",
    premiumBalance: 1200.00,
    totalPolicies: 0,
    totalPremiumsPaid: 0,
    lastPaymentDate: null,
    riskScore: 75,
    address: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    },
    registrationDate: new Date("2024-01-15"),
    isActive: true
  }},
  { upsert: true }
);

db.customers.updateOne(
  { _id: "cust2" },
  { $set: {
    customerId: "CUST000002",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1-555-0102",
    premiumBalance: 800.00,
    totalPolicies: 0,
    totalPremiumsPaid: 0,
    lastPaymentDate: null,
    riskScore: 60,
    address: {
      street: "456 Oak Avenue",
      city: "Chicago",
      state: "IL",
      zipCode: "60601"
    },
    registrationDate: new Date("2024-02-20"),
    isActive: true
  }},
  { upsert: true }
);

db.customers.updateOne(
  { _id: "cust3" },
  { $set: {
    customerId: "CUST000003",
    firstName: "Michael",
    lastName: "Davis",
    email: "michael.davis@email.com",
    phone: "+1-555-0103",
    premiumBalance: 1500.00,
    totalPolicies: 0,
    totalPremiumsPaid: 0,
    lastPaymentDate: null,
    riskScore: 45,
    address: {
      street: "789 Business Plaza",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001"
    },
    registrationDate: new Date("2024-03-10"),
    isActive: true
  }},
  { upsert: true }
);

print("Upserted Day 3 customers - total: " + db.customers.countDocuments());
```

### 6. Create Transaction Indexes

```javascript
db.claims.createIndex({ claimNumber: 1 }, { unique: true });
db.claims.createIndex({ customerId: 1, claimDate: 1 });
db.payments.createIndex({ paymentId: 1 }, { unique: true });
db.payments.createIndex({ timestamp: -1 });

print("Created transaction indexes");
```

### 7. Create Replication Test Collections (Lab 11)

```javascript
db.test_claims.createIndex({ timestamp: -1 });
db.test_policies.createIndex({ timestamp: -1 });

print("Created replication test collections");
```

### 8. Upsert Customers for Sharding (3 Customers)

These customers have `_id` values "customer1" through "customer3" with `insuranceProfile` and `metadata` fields used in Lab 12 sharding exercises.

```javascript
db.customers.updateOne(
  { _id: "customer1" },
  { $set: {
    customerId: "CUST000004",
    firstName: "Emma",
    lastName: "Wilson",
    email: "customer4@example.com",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    },
    registrationDate: new Date(2024, 1, 15),
    insuranceProfile: {
      riskLevel: "medium",
      policyTypes: ["Auto"],
      paymentMethod: "monthly",
      totalPremiumValue: 1250.00
    },
    metadata: {
      lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      claimCount: 1,
      customerType: "standard"
    }
  }},
  { upsert: true }
);

db.customers.updateOne(
  { _id: "customer2" },
  { $set: {
    customerId: "CUST000005",
    firstName: "James",
    lastName: "Miller",
    email: "customer5@example.com",
    address: {
      street: "456 Oak St",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210"
    },
    registrationDate: new Date(2024, 2, 20),
    insuranceProfile: {
      riskLevel: "low",
      policyTypes: ["Auto", "Property"],
      paymentMethod: "annual",
      totalPremiumValue: 2750.00
    },
    metadata: {
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      claimCount: 0,
      customerType: "premium"
    }
  }},
  { upsert: true }
);

db.customers.updateOne(
  { _id: "customer3" },
  { $set: {
    customerId: "CUST000006",
    firstName: "Olivia",
    lastName: "Brown",
    email: "customer6@example.com",
    address: {
      street: "789 Pine St",
      city: "Chicago",
      state: "IL",
      zipCode: "60601"
    },
    registrationDate: new Date(2024, 3, 10),
    insuranceProfile: {
      riskLevel: "high",
      policyTypes: ["Auto"],
      paymentMethod: "monthly",
      totalPremiumValue: 1850.00
    },
    metadata: {
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      claimCount: 3,
      customerType: "standard"
    }
  }},
  { upsert: true }
);

print("Upserted sharding customers - total: " + db.customers.countDocuments());
```

### 9. Upsert Claims for Sharding (3 Claims)

These claims have `_id` values "claim1" through "claim3" with `territory` and `fraudFlag` fields used in Lab 12 sharding exercises.

```javascript
db.claims.updateOne(
  { _id: "claim1" },
  { $set: {
    claimNumber: "CLM-2024-000004",
    customerId: "customer1",
    claimDate: new Date(2024, 3, 15),
    claimType: "Auto Accident",
    claimAmount: 8500.00,
    deductible: 500,
    status: "approved",
    incidentLocation: {
      street: "123 Insurance Ave",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    },
    territory: "north",
    adjusterAssigned: "ADJ001",
    fraudFlag: false
  }},
  { upsert: true }
);

db.claims.updateOne(
  { _id: "claim2" },
  { $set: {
    claimNumber: "CLM-2024-000005",
    customerId: "customer2",
    claimDate: new Date(2024, 2, 20),
    claimType: "Property Damage",
    claimAmount: 15000.00,
    deductible: 1000,
    status: "pending",
    incidentLocation: {
      street: "456 Insurance Ave",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210"
    },
    territory: "west",
    adjusterAssigned: "ADJ002",
    fraudFlag: false
  }},
  { upsert: true }
);

db.claims.updateOne(
  { _id: "claim3" },
  { $set: {
    claimNumber: "CLM-2024-000006",
    customerId: "customer3",
    claimDate: new Date(2024, 1, 10),
    claimType: "Theft",
    claimAmount: 3200.00,
    deductible: 250,
    status: "approved",
    incidentLocation: {
      street: "789 Insurance Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60601"
    },
    territory: "central",
    adjusterAssigned: "ADJ003",
    fraudFlag: false
  }},
  { upsert: true }
);

print("Upserted sharding claims - total: " + db.claims.countDocuments());
```

### 10. Upsert Branches for Sharding (5 Branches)

These branches have `_id` values "branch1" through "branch5" with `region`, `performanceData`, and `policyMetrics` fields used in Lab 12 sharding exercises.

```javascript
db.branches.updateOne(
  { _id: "branch1" },
  { $set: {
    region: "north",
    branchCode: "BR-NO-001",
    name: "Insurance Branch 1",
    address: {
      street: "1 Insurance Blvd",
      city: "North City",
      state: "NY",
      zipCode: "12345"
    },
    manager: "Manager 1",
    agentCount: 15,
    performanceData: {
      monthlyPremiums: 450000.50,
      quarterlyPremiums: 1350000.75,
      annualPremiums: 5400000.25
    },
    policyMetrics: {
      activePolicies: 1500,
      policyTypes: 4,
      lastUpdated: new Date()
    },
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    },
    specialties: ["Auto", "Property", "Life"]
  }},
  { upsert: true }
);

db.branches.updateOne(
  { _id: "branch2" },
  { $set: {
    region: "south",
    branchCode: "BR-SO-002",
    name: "Insurance Branch 2",
    address: {
      street: "2 Insurance Blvd",
      city: "South City",
      state: "CA",
      zipCode: "23456"
    },
    manager: "Manager 2",
    agentCount: 12,
    performanceData: {
      monthlyPremiums: 380000.25,
      quarterlyPremiums: 1140000.50,
      annualPremiums: 4560000.75
    },
    policyMetrics: {
      activePolicies: 1200,
      policyTypes: 5,
      lastUpdated: new Date()
    },
    coordinates: {
      lat: 34.0522,
      lng: -118.2437
    },
    specialties: ["Auto", "Commercial"]
  }},
  { upsert: true }
);

db.branches.updateOne(
  { _id: "branch3" },
  { $set: {
    region: "east",
    branchCode: "BR-EA-003",
    name: "Insurance Branch 3",
    address: {
      street: "3 Insurance Blvd",
      city: "East City",
      state: "TX",
      zipCode: "34567"
    },
    manager: "Manager 3",
    agentCount: 18,
    performanceData: {
      monthlyPremiums: 520000.75,
      quarterlyPremiums: 1560000.25,
      annualPremiums: 6240000.50
    },
    policyMetrics: {
      activePolicies: 1800,
      policyTypes: 3,
      lastUpdated: new Date()
    },
    coordinates: {
      lat: 29.7604,
      lng: -95.3698
    },
    specialties: ["Property", "Life", "Commercial"]
  }},
  { upsert: true }
);

db.branches.updateOne(
  { _id: "branch4" },
  { $set: {
    region: "west",
    branchCode: "BR-WE-004",
    name: "Insurance Branch 4",
    address: {
      street: "4 Insurance Blvd",
      city: "West City",
      state: "FL",
      zipCode: "45678"
    },
    manager: "Manager 4",
    agentCount: 10,
    performanceData: {
      monthlyPremiums: 350000.00,
      quarterlyPremiums: 1050000.00,
      annualPremiums: 4200000.00
    },
    policyMetrics: {
      activePolicies: 900,
      policyTypes: 4,
      lastUpdated: new Date()
    },
    coordinates: {
      lat: 25.7617,
      lng: -80.1918
    },
    specialties: ["Auto", "Property"]
  }},
  { upsert: true }
);

db.branches.updateOne(
  { _id: "branch5" },
  { $set: {
    region: "central",
    branchCode: "BR-CE-005",
    name: "Insurance Branch 5",
    address: {
      street: "5 Insurance Blvd",
      city: "Central City",
      state: "IL",
      zipCode: "56789"
    },
    manager: "Manager 5",
    agentCount: 14,
    performanceData: {
      monthlyPremiums: 425000.00,
      quarterlyPremiums: 1275000.00,
      annualPremiums: 5100000.00
    },
    policyMetrics: {
      activePolicies: 1300,
      policyTypes: 5,
      lastUpdated: new Date()
    },
    coordinates: {
      lat: 41.8781,
      lng: -87.6298
    },
    specialties: ["Commercial", "Life"]
  }},
  { upsert: true }
);

print("Upserted sharding branches - total: " + db.branches.countDocuments());
```

### 11. Create Change Stream Collections (Lab 13)

Create indexes and sample data for the change stream monitoring collections.

```javascript
// Policy notifications indexes
db.policy_notifications.createIndex({ customerId: 1, timestamp: -1 });
db.policy_notifications.createIndex({ type: 1, read: 1 });

// Claim activity log indexes
db.claim_activity_log.createIndex({ timestamp: -1 });
db.claim_activity_log.createIndex({ event: 1, timestamp: -1 });

// Resume tokens indexes
db.resume_tokens.createIndex({ lastUpdated: -1 });

print("Created change stream collection indexes");
```

Insert sample policy notifications:

```javascript
db.policy_notifications.insertMany([
  {
    customerId: "cust1",
    type: "policy_renewal",
    message: "Your auto insurance policy is due for renewal in 30 days",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    priority: "medium"
  },
  {
    customerId: "cust2",
    type: "claim_update",
    message: "Your claim CLM-2024-001234 has been approved",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: false,
    priority: "high"
  },
  {
    customerId: "admin",
    type: "system",
    message: "System maintenance scheduled - claims processing may be delayed",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: false,
    priority: "low"
  }
]);

print("Created " + db.policy_notifications.countDocuments() + " sample notifications");
```

### 12. Upsert Agents for Application Integration (Lab 14)

These agents (AGT001 and AGT002) are used in the C#, Node.js, and Python integration labs.

```javascript
db.agents.updateOne(
  { agentId: "AGT001" },
  { $set: {
    agentId: "AGT001",
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "emily.rodriguez@insuranceco.com",
    phone: "+1-555-0201",
    branchId: "BR001",
    territory: "Manhattan",
    specialties: ["Auto", "Property"],
    licenseNumber: "LIC-NY-12345",
    isActive: true,
    performance: {
      monthlyQuota: 50000.00,
      quarterlyRevenue: 145000.00,
      customerSatisfaction: 4.7
    },
    hireDate: new Date("2022-03-15")
  }},
  { upsert: true }
);

db.agents.updateOne(
  { agentId: "AGT002" },
  { $set: {
    agentId: "AGT002",
    firstName: "David",
    lastName: "Thompson",
    email: "david.thompson@insuranceco.com",
    phone: "+1-555-0202",
    branchId: "BR002",
    territory: "Chicago",
    specialties: ["Commercial", "Life"],
    licenseNumber: "LIC-IL-67890",
    isActive: true,
    performance: {
      monthlyQuota: 75000.00,
      quarterlyRevenue: 220000.00,
      customerSatisfaction: 4.9
    },
    hireDate: new Date("2021-08-22")
  }},
  { upsert: true }
);

print("Upserted agents for application integration - total: " + db.agents.countDocuments());
```

### 13. Insert Vehicles and Properties for Asset Management (Lab 14)

These assets are used in the C#, Node.js, and Python integration labs. The `vehicles` and `properties` collections were dropped in Step 3, so we use `insertMany` here.

```javascript
db.vehicles.insertMany([
  {
    vin: "1HGBH41JXMN109186",
    customerId: "cust1",
    make: "Honda",
    model: "Civic",
    year: 2020,
    currentValue: 18500.00,
    insuranceInfo: {
      policyNumber: "POL-AUTO-001",
      deductible: 500.00,
      annualPremium: 1299.99
    },
    riskFactors: {
      age: 4,
      mileage: 45000,
      accidentHistory: []
    }
  },
  {
    vin: "2T1BURHE0JC123456",
    customerId: "cust2",
    make: "Toyota",
    model: "Corolla",
    year: 2018,
    currentValue: 16200.00,
    insuranceInfo: {
      policyNumber: "POL-AUTO-002",
      deductible: 1000.00,
      annualPremium: 899.99
    },
    riskFactors: {
      age: 6,
      mileage: 67000,
      accidentHistory: ["Minor Fender Bender - 2022"]
    }
  }
]);

print("Created " + db.vehicles.countDocuments() + " vehicles");

db.properties.insertMany([
  {
    propertyId: "PROP-001",
    customerId: "cust1",
    propertyType: "Single Family Home",
    address: {
      street: "123 Elm Street",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    },
    propertyValue: 450000.00,
    insuranceInfo: {
      policyNumber: "POL-HOME-001",
      dwellingCoverage: 400000.00,
      deductible: 1000.00,
      annualPremium: 1899.99
    },
    riskAssessment: {
      floodZone: "X",
      crimeRate: "Low",
      fireProtectionClass: 3
    }
  }
]);

print("Created " + db.properties.countDocuments() + " properties");
```

### 14. Create Production Indexes

These are the same indexes created by the automated loader.

```javascript
// Core business indexes
db.policies.createIndex({ policyNumber: 1 }, { unique: true });
db.policies.createIndex({ policyType: 1, isActive: 1 });
db.customers.createIndex({ customerId: 1 }, { unique: true });
db.customers.createIndex({ email: 1 }, { unique: true });
db.claims.createIndex({ claimNumber: 1 }, { unique: true });
db.claims.createIndex({ customerId: 1, status: 1 });

// Performance indexes for aggregation
db.customers.createIndex({ "insuranceProfile.riskLevel": 1, "insuranceProfile.totalPremiumValue": -1 });
db.claims.createIndex({ territory: 1, claimDate: -1 });
db.branches.createIndex({ region: 1, "performanceData.monthlyPremiums": -1 });

// Text search indexes
db.policies.createIndex({ name: "text", policyType: "text" });

print("Created production indexes");
```

### 15. Verify Data Loading

```javascript
print("=== Day 3 Production Data Verification ===");

var policyCount = db.policies.countDocuments();
var customerCount = db.customers.countDocuments();
var claimCount = db.claims.countDocuments();
var branchCount = db.branches.countDocuments();
var agentCount = db.agents.countDocuments();
var vehicleCount = db.vehicles.countDocuments();
var propertyCount = db.properties.countDocuments();
var notificationCount = db.policy_notifications.countDocuments();

print("Production collections:");
print("- policies: " + policyCount);
print("- customers: " + customerCount);
print("- claims: " + claimCount);
print("- branches: " + branchCount);
print("- agents: " + agentCount);
print("- vehicles: " + vehicleCount);
print("- properties: " + propertyCount);
print("- policy_notifications: " + notificationCount);

// Check indexes
print("\nIndex validation:");
var policyIndexes = db.policies.getIndexes();
var customerIndexes = db.customers.getIndexes();
var claimIndexes = db.claims.getIndexes();
var branchIndexes = db.branches.getIndexes();
var agentIndexes = db.agents.getIndexes();
print("- policies: " + policyIndexes.length + " indexes");
print("- customers: " + customerIndexes.length + " indexes");
print("- claims: " + claimIndexes.length + " indexes");
print("- branches: " + branchIndexes.length + " indexes");
print("- agents: " + agentIndexes.length + " indexes");

// Test change stream capability
print("\nChange Stream Test:");
try {
  var changeStream = db.policies.watch();
  print("Change streams are supported");
  changeStream.close();
} catch (e) {
  print("Change streams not supported: " + e.message);
}

// Test transaction capability
print("\nTransaction Test:");
var session = db.getMongo().startSession();
try {
  session.startTransaction();
  session.getDatabase("insurance_company").test_txn.insertOne({ test: true });
  session.commitTransaction();
  print("Transactions are supported");
  db.test_txn.drop();
} catch (e) {
  print("Transactions not supported: " + e.message);
} finally {
  session.endSession();
}
```

## Expected Results

After running this manual setup on top of Day 1 and Day 2 data, you should have approximately:

- **13+ policies** (Day 1/2 policies + 4 upserted Day 3 transaction policies)
- **26+ customers** (Day 1/2 customers + 3 transaction customers + 3 sharding customers)
- **18+ claims** (Day 1/2 claims + 3 sharding claims)
- **13+ branches** (Day 1/2 branches + 5 sharding branches)
- **10+ agents** (Day 1/2 agents + 2 upserted for application integration)
- **2 vehicles** (new Day 3 collection)
- **1 property** (new Day 3 collection)
- **3 policy notifications** (new Day 3 collection)
- **Change stream indexes** ready for real-time monitoring

Note: Exact counts depend on overlap between Day 1/2 and Day 3 IDs. The upsert pattern ensures no duplicate key errors.

## Utility Functions

The following utility functions can be copied and pasted into your `mongosh` session for use during labs:

### Reset Day 3 Data

```javascript
function resetDay3Data() {
  print("Resetting Day 3 insurance data to initial state...");
  db.policies.updateOne({ _id: "pol1" }, { $set: { activePolicies: 10 } });
  db.policies.updateOne({ _id: "pol2" }, { $set: { activePolicies: 25 } });
  db.policies.updateOne({ _id: "pol3" }, { $set: { activePolicies: 15 } });
  db.policies.updateOne({ _id: "pol4" }, { $set: { activePolicies: 8 } });
  db.customers.updateOne({ _id: "cust1" }, { $set: { premiumBalance: 1200.00, totalPolicies: 0 } });
  db.customers.updateOne({ _id: "cust2" }, { $set: { premiumBalance: 800.00, totalPolicies: 0 } });
  db.customers.updateOne({ _id: "cust3" }, { $set: { premiumBalance: 1500.00, totalPolicies: 0 } });
  db.claims.deleteMany({ _id: /^test_/ });
  db.payments.deleteMany({ paymentType: "test" });
  db.policy_notifications.deleteMany({ type: { $in: ["test", "claim_created", "status_update"] } });
  db.claim_activity_log.deleteMany({});
  db.resume_tokens.deleteMany({});
  print("Day 3 data reset complete!");
}
```

### Generate Test Claims

```javascript
function generateTestClaims(count) {
  count = count || 10;
  print("Generating " + count + " test claims...");
  var baseTime = Date.now();
  var claims = [
    {
      _id: "test_claim_" + baseTime + "_1",
      claimNumber: "CLM-TEST-000001",
      customerId: "cust1",
      claimType: "Auto Accident",
      claimAmount: 2500.00,
      status: "submitted",
      claimDate: new Date()
    },
    {
      _id: "test_claim_" + baseTime + "_2",
      claimNumber: "CLM-TEST-000002",
      customerId: "cust2",
      claimType: "Property Damage",
      claimAmount: 1500.00,
      status: "submitted",
      claimDate: new Date()
    },
    {
      _id: "test_claim_" + baseTime + "_3",
      claimNumber: "CLM-TEST-000003",
      customerId: "cust3",
      claimType: "Theft",
      claimAmount: 3200.00,
      status: "submitted",
      claimDate: new Date()
    }
  ];
  db.claims.insertMany(claims);
  print("Generated " + claims.length + " test claims");
}
```

## Troubleshooting

### Duplicate Key Errors

If you see duplicate key errors, the data already exists. The upsert pattern used above should prevent this, but if you copied data from a different source:

```javascript
// Check existing document before upserting
db.policies.findOne({ _id: "pol1" });
```

### Index Creation Errors

If an index already exists with a different definition, drop it first:

```javascript
// Drop a specific index by name
db.policies.dropIndex("policyNumber_1");

// Or drop all non-default indexes on a collection
db.claims.dropIndexes();

// Then rerun the index creation commands from Step 14
```

### Missing Day 1/2 Data

Day 3 builds on top of Day 1 and Day 2 data. If earlier data is missing, load it first:

```javascript
// Option 1: Use automated loaders
// mongosh < data/day1_data_loader.js
// mongosh < data/day2_data_loader.js

// Option 2: Use manual setup guides
// Follow manual_day1_setup.md then manual_day2_setup.md
```

### Change Streams Not Working

Change streams require a replica set. Verify your deployment:

```javascript
rs.status()
// If this returns an error, your MongoDB is not running as a replica set
// See ../scripts/setup.sh for replica set configuration
```

### Transaction Errors

Transactions also require a replica set. If you get transaction errors:

```javascript
// Verify replica set is initialized
rs.status().ok  // Should return 1

// Check that you can start a session
var session = db.getMongo().startSession();
session.endSession();
```

## Next Steps

After loading Day 3 data:
1. Complete Lab 11: Replica Sets & High Availability
2. Complete Lab 12: Sharding & Horizontal Scaling
3. Complete Lab 13: Change Streams & Real-time Applications
4. Complete Lab 14a/14b/14c: Application Integration (C#, Node.js, Python)

---

*Manual setup for MongoDB Mastering Course - Day 3 Production & Enterprise*
