# Manual Day 3 Data Setup

This guide provides step-by-step instructions for manually loading Day 3 production-scale data if the automated `day3_data_loader.js` script cannot be used.

## Prerequisites

- MongoDB replica set running (see `../scripts/setup.sh`)
- MongoDB Shell (mongosh) installed and accessible
- Day 1 and Day 2 data loaded (recommended for complete experience)

## Manual Data Loading Steps

### 1. Connect to MongoDB

```bash
mongosh
```

### 2. Switch to Production Database

```javascript
use insurance_company
```

### 3. Create Production Policies (Transaction-Ready)

```javascript
// Create policies for transaction testing
db.policies.insertMany([
  {
    _id: "production_policy_001",
    policyNumber: "AUTO-PROD-001",
    policyType: "Auto",
    customerId: "PROD-CUST-001",
    annualPremium: NumberDecimal("1599.99"),
    deductible: NumberInt(500),
    coverageLimit: 150000,
    isActive: true,
    effectiveDate: new Date("2023-01-01"),
    expirationDate: new Date("2024-01-01"),
    branchId: "PROD-BR-001",
    region: "US-CENTRAL",
    shardKey: "US-CENTRAL_PROD-CUST-001",
    transactions: {
      created: new Date(),
      lastModified: new Date(),
      version: NumberInt(1)
    }
  },
  {
    _id: "production_policy_002",
    policyNumber: "HOME-PROD-001",
    policyType: "Home",
    customerId: "PROD-CUST-002",
    annualPremium: NumberDecimal("2299.50"),
    deductible: NumberInt(1000),
    coverageLimit: 500000,
    isActive: true,
    effectiveDate: new Date("2023-02-01"),
    expirationDate: new Date("2024-02-01"),
    branchId: "PROD-BR-002",
    region: "US-SOUTH",
    shardKey: "US-SOUTH_PROD-CUST-002",
    transactions: {
      created: new Date(),
      lastModified: new Date(),
      version: NumberInt(1)
    }
  },
  {
    _id: "production_policy_003",
    policyNumber: "LIFE-PROD-001",
    policyType: "Life",
    customerId: "PROD-CUST-003",
    annualPremium: NumberDecimal("3600.00"),
    deductible: NumberInt(0),
    coverageLimit: 1000000,
    isActive: true,
    effectiveDate: new Date("2023-03-01"),
    expirationDate: new Date("2024-03-01"),
    branchId: "PROD-BR-001",
    region: "US-EAST",
    shardKey: "US-EAST_PROD-CUST-003",
    transactions: {
      created: new Date(),
      lastModified: new Date(),
      version: NumberInt(1)
    }
  },
  {
    _id: "production_policy_004",
    policyNumber: "BUSINESS-PROD-001",
    policyType: "Business",
    customerId: "PROD-CUST-004",
    annualPremium: NumberDecimal("8500.00"),
    deductible: NumberInt(2500),
    coverageLimit: 2000000,
    isActive: true,
    effectiveDate: new Date("2023-04-01"),
    expirationDate: new Date("2024-04-01"),
    branchId: "PROD-BR-003",
    region: "US-WEST",
    shardKey: "US-WEST_PROD-CUST-004",
    transactions: {
      created: new Date(),
      lastModified: new Date(),
      version: NumberInt(1)
    }
  }
])
```

### 4. Create Large-Scale Customers (1000+ for Sharding)

```javascript
// Create 1000 customers for sharding demonstration
var customers = [];
var regions = ["US-CENTRAL", "US-SOUTH", "US-EAST", "US-WEST", "US-NORTH"];
var riskLevels = ["Low", "Medium", "High"];
var statuses = ["Active", "Inactive", "Suspended"];
var firstNames = ["John", "Mary", "Michael", "Jennifer", "William", "Linda", "David", "Barbara", "Richard", "Susan"];
var lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];

print("Creating 1000 customers for sharding...");

for (var i = 1; i <= 1000; i++) {
  var region = regions[Math.floor(Math.random() * regions.length)];
  var customerId = "PROD-CUST-" + String(i).padStart(4, '0');
  var firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  var lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  var age = Math.floor(Math.random() * 50) + 25;
  var riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

  customers.push({
    _id: "production_customer_" + String(i).padStart(4, '0'),
    customerId: customerId,
    firstName: firstName,
    lastName: lastName,
    email: firstName.toLowerCase() + "." + lastName.toLowerCase() + i + "@production.com",
    phone: "(555) " + String(1000 + i),
    age: NumberInt(age),
    dateOfBirth: new Date(2023 - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    address: {
      street: String(1000 + i) + " Production Avenue",
      city: "City" + String(i % 100),
      state: region.split('-')[1] === "CENTRAL" ? "TX" :
             region.split('-')[1] === "SOUTH" ? "FL" :
             region.split('-')[1] === "EAST" ? "NY" :
             region.split('-')[1] === "WEST" ? "CA" : "IL",
      zipCode: String(10000 + (i % 90000))
    },
    region: region,
    riskLevel: riskLevel,
    riskScore: NumberDecimal((Math.random() * 9 + 1).toFixed(1)),
    joinDate: new Date(2022, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    shardKey: region + "_" + customerId,
    metadata: {
      created: new Date(),
      lastLogin: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      version: NumberInt(1)
    }
  });

  // Insert in batches of 100 to avoid memory issues
  if (i % 100 === 0) {
    db.customers.insertMany(customers);
    customers = [];
    print("Inserted " + i + " customers...");
  }
}

// Insert remaining customers
if (customers.length > 0) {
  db.customers.insertMany(customers);
}

print("Completed customer creation.");
```

### 5. Create Large-Scale Claims (2000+ Range-Shardable)

```javascript
// Create 2000 claims for range sharding
var claims = [];
var claimTypes = ["Auto", "Home", "Life", "Business"];
var statuses = ["Approved", "Denied", "Under Review", "Pending", "Closed"];

print("Creating 2000 claims for range sharding...");

for (var i = 1; i <= 2000; i++) {
  var claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
  var status = statuses[Math.floor(Math.random() * statuses.length)];
  var customerId = "PROD-CUST-" + String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0');

  // Create range-shardable claim numbers
  var claimNumber = "CLM-" + String(i).padStart(6, '0');

  var baseAmount = claimType === "Life" ? 250000 :
                   claimType === "Business" ? 50000 :
                   claimType === "Home" ? 25000 : 12000;

  var amount = status === "Denied" ? 0 : baseAmount + (Math.random() * baseAmount * 0.8);

  claims.push({
    _id: "production_claim_" + String(i).padStart(4, '0'),
    claimNumber: claimNumber,
    policyNumber: claimType.toUpperCase() + "-PROD-" + String(Math.floor(Math.random() * 4) + 1).padStart(3, '0'),
    customerId: customerId,
    claimType: claimType,
    incidentDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    reportedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    claimAmount: NumberDecimal(amount.toFixed(2)),
    adjustedAmount: status === "Approved" ? NumberDecimal((amount * 0.95).toFixed(2)) : NumberDecimal("0.00"),
    status: status,
    description: claimType + " claim - " + status.toLowerCase(),
    processingTime: NumberInt(Math.floor(Math.random() * 45) + 1),
    shardKey: claimNumber, // Range shardable
    priority: NumberInt(Math.floor(Math.random() * 5) + 1), // 1-5
    assignedTo: "ADJ-" + String(Math.floor(Math.random() * 50) + 1).padStart(3, '0'),
    metadata: {
      created: new Date(),
      lastUpdated: new Date(),
      version: NumberInt(1)
    }
  });

  // Insert in batches of 200
  if (i % 200 === 0) {
    db.claims.insertMany(claims);
    claims = [];
    print("Inserted " + i + " claims...");
  }
}

// Insert remaining claims
if (claims.length > 0) {
  db.claims.insertMany(claims);
}

print("Completed claims creation.");
```

### 6. Create Geographic Branches (400+ for Distribution)

```javascript
// Create 400+ branches for geographic distribution
var branches = [];
var states = [
  {code: "TX", name: "Texas", region: "US-CENTRAL"},
  {code: "FL", name: "Florida", region: "US-SOUTH"},
  {code: "NY", name: "New York", region: "US-EAST"},
  {code: "CA", name: "California", region: "US-WEST"},
  {code: "IL", name: "Illinois", region: "US-NORTH"}
];

print("Creating 400 branches for geographic distribution...");

for (var i = 1; i <= 400; i++) {
  var state = states[Math.floor(Math.random() * states.length)];
  var branchId = "PROD-BR-" + String(i).padStart(3, '0');

  branches.push({
    _id: "production_branch_" + String(i).padStart(3, '0'),
    branchId: branchId,
    name: "Production Branch " + i,
    address: {
      street: String(1000 + i) + " Branch Street",
      city: "City" + String(i % 50),
      state: state.code,
      zipCode: String(10000 + (i % 90000))
    },
    region: state.region,
    territory: state.name,
    manager: "Manager" + String(i),
    phone: "(555) " + String(2000 + i),
    established: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    metrics: {
      totalPolicies: NumberInt(Math.floor(Math.random() * 500) + 100),
      monthlyRevenue: NumberDecimal((Math.random() * 500000 + 100000).toFixed(2)),
      customerSatisfaction: NumberDecimal((Math.random() * 2 + 3).toFixed(1))
    },
    shardKey: state.region + "_" + branchId,
    active: Math.random() > 0.05, // 95% active
    metadata: {
      created: new Date(),
      lastAudit: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      version: NumberInt(1)
    }
  });

  // Insert in batches of 50
  if (i % 50 === 0) {
    db.branches.insertMany(branches);
    branches = [];
    print("Inserted " + i + " branches...");
  }
}

// Insert remaining branches
if (branches.length > 0) {
  db.branches.insertMany(branches);
}

print("Completed branches creation.");
```

### 7. Create C# Integration Models

```javascript
// Create agents for C# integration
db.agents.insertMany([
  {
    _id: "csharp_agent_001",
    agentId: "CS-AGT-001",
    firstName: "CSharp",
    lastName: "Integration",
    email: "csharp.integration@insurance.com",
    phone: "(555) 888-0001",
    licenseNumber: "TX-CSHARP-001",
    hireDate: new Date("2023-01-01"),
    branchId: "PROD-BR-001",
    specialties: ["Integration", "API", "Automation"],
    commissionRate: NumberDecimal("0.08"),
    performance: {
      policiesSold: NumberInt(500),
      totalRevenue: NumberDecimal("2500000.00"),
      customerRating: NumberDecimal("4.9"),
      renewalRate: NumberDecimal("0.95")
    },
    apiCredentials: {
      clientId: "csharp-client-001",
      permissions: ["read", "write", "admin"],
      lastAccess: new Date()
    },
    territory: ["All Regions"],
    status: "Active",
    csharpCompatible: true
  },
  {
    _id: "csharp_agent_002",
    agentId: "CS-AGT-002",
    firstName: "API",
    lastName: "Developer",
    email: "api.developer@insurance.com",
    phone: "(555) 888-0002",
    licenseNumber: "TX-CSHARP-002",
    hireDate: new Date("2023-02-01"),
    branchId: "PROD-BR-002",
    specialties: ["Development", "Testing", "Integration"],
    commissionRate: NumberDecimal("0.075"),
    performance: {
      policiesSold: NumberInt(300),
      totalRevenue: NumberDecimal("1800000.00"),
      customerRating: NumberDecimal("4.8"),
      renewalRate: NumberDecimal("0.92")
    },
    apiCredentials: {
      clientId: "csharp-client-002",
      permissions: ["read", "write"],
      lastAccess: new Date()
    },
    territory: ["Development Environment"],
    status: "Active",
    csharpCompatible: true
  }
])

// Create vehicles for C# integration
db.vehicles.insertMany([
  {
    _id: "csharp_vehicle_001",
    vin: "CSHARP1234567890123",
    customerId: "PROD-CUST-001",
    policyNumber: "AUTO-PROD-001",
    make: "Tesla",
    model: "Model 3",
    year: NumberInt(2023),
    color: "White",
    engineType: "Electric",
    transmission: "Automatic",
    mileage: NumberInt(5000),
    value: NumberDecimal("55000.00"),
    features: {
      autonomous: true,
      connected: true,
      electricVehicle: true
    },
    telematics: {
      deviceId: "TEL-001",
      dataProvider: "Tesla API",
      realTimeTracking: true
    },
    csharpCompatible: true
  },
  {
    _id: "csharp_vehicle_002",
    vin: "CSHARP9876543210987",
    customerId: "PROD-CUST-002",
    policyNumber: "AUTO-PROD-002",
    make: "BMW",
    model: "X5",
    year: NumberInt(2023),
    color: "Black",
    engineType: "Hybrid",
    transmission: "Automatic",
    mileage: NumberInt(8000),
    value: NumberDecimal("75000.00"),
    features: {
      autonomous: false,
      connected: true,
      hybrid: true
    },
    telematics: {
      deviceId: "TEL-002",
      dataProvider: "BMW ConnectedDrive",
      realTimeTracking: true
    },
    csharpCompatible: true
  }
])

// Create properties for C# integration
db.properties.insertOne({
  _id: "csharp_property_001",
  customerId: "PROD-CUST-002",
  policyNumber: "HOME-PROD-001",
  address: {
    street: "1000 CSharp Drive",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    coordinates: {
      lat: 30.2672,
      lng: -97.7431
    }
  },
  propertyType: "Smart Home",
  yearBuilt: NumberInt(2023),
  squareFootage: NumberInt(3500),
  bedrooms: NumberInt(5),
  bathrooms: NumberDecimal("3.5"),
  garageSpaces: NumberInt(3),
  value: NumberDecimal("850000.00"),
  smartFeatures: {
    homeAutomation: true,
    securitySystem: {
      provider: "Ring",
      monitoring: true,
      cameras: NumberInt(8)
    },
    energyManagement: {
      solarPanels: true,
      batteryStorage: true,
      smartThermostat: true
    },
    connectivity: {
      fiberInternet: true,
      mesh5G: true,
      iotDevices: NumberInt(25)
    }
  },
  apiIntegration: {
    supportsCSharp: true,
    webhookUrl: "https://api.insurance.com/webhooks/property/001",
    realTimeMonitoring: true
  },
  csharpCompatible: true
})
```

### 8. Create Change Stream Collections

```javascript
// Policy notifications for change streams
db.policy_notifications.insertMany([
  {
    _id: "notification_001",
    notificationId: "NOTIF-001",
    policyNumber: "AUTO-PROD-001",
    customerId: "PROD-CUST-001",
    eventType: "policy_created",
    timestamp: new Date(),
    message: "New auto policy created",
    priority: "normal",
    processed: false,
    metadata: {
      source: "policy_service",
      version: "1.0"
    }
  },
  {
    _id: "notification_002",
    notificationId: "NOTIF-002",
    policyNumber: "HOME-PROD-001",
    customerId: "PROD-CUST-002",
    eventType: "policy_updated",
    timestamp: new Date(),
    message: "Home policy premium updated",
    priority: "high",
    processed: false,
    metadata: {
      source: "policy_service",
      version: "1.0"
    }
  }
])

// Claim activity log for change streams
db.claim_activity_log.insertMany([
  {
    _id: "activity_001",
    activityId: "ACT-001",
    claimNumber: "CLM-000001",
    customerId: "PROD-CUST-001",
    eventType: "claim_submitted",
    timestamp: new Date(),
    description: "New claim submitted for review",
    adjuster: "ADJ-001",
    status: "pending",
    metadata: {
      source: "claims_service",
      automation: false
    }
  },
  {
    _id: "activity_002",
    activityId: "ACT-002",
    claimNumber: "CLM-000002",
    customerId: "PROD-CUST-002",
    eventType: "claim_approved",
    timestamp: new Date(),
    description: "Claim approved for payment",
    adjuster: "ADJ-002",
    status: "approved",
    paymentAmount: NumberDecimal("15000.00"),
    metadata: {
      source: "claims_service",
      automation: true
    }
  }
])
```

### 9. Create Resume Token Storage

```javascript
// Resume tokens collection for change stream resumption
db.resume_tokens.insertOne({
  _id: "main_change_stream",
  streamId: "policy_changes",
  resumeToken: {
    "_data": "placeholder_token_data_for_testing"
  },
  lastProcessed: new Date(),
  active: true,
  description: "Main policy change stream token",
  metadata: {
    created: new Date(),
    version: NumberInt(1)
  }
})
```

### 10. Create Production Indexes

```javascript
// Create indexes for production performance
print("Creating production indexes...");

// Sharding preparation indexes
db.customers.createIndex({"region": 1, "customerId": 1})
db.claims.createIndex({"claimNumber": 1}) // Range shard key
db.branches.createIndex({"region": 1, "branchId": 1})

// Performance indexes
db.policies.createIndex({"shardKey": 1})
db.policies.createIndex({"region": 1, "isActive": 1})
db.policies.createIndex({"customerId": 1, "policyType": 1})

db.customers.createIndex({"shardKey": 1})
db.customers.createIndex({"status": 1, "region": 1})

db.claims.createIndex({"status": 1, "claimType": 1})
db.claims.createIndex({"priority": 1, "assignedTo": 1})

// Change stream indexes
db.policy_notifications.createIndex({"processed": 1, "timestamp": 1})
db.claim_activity_log.createIndex({"eventType": 1, "timestamp": 1})

// C# integration indexes
db.agents.createIndex({"csharpCompatible": 1})
db.vehicles.createIndex({"csharpCompatible": 1})
db.properties.createIndex({"csharpCompatible": 1})

print("Completed index creation.");
```

### 11. Create Utility Functions

```javascript
// Utility functions for Day 3
function generateTestClaims(count) {
  var claims = [];
  for (var i = 1; i <= count; i++) {
    claims.push({
      claimNumber: "TEST-CLM-" + String(i).padStart(4, '0'),
      customerId: "PROD-CUST-" + String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0'),
      claimType: "Test",
      claimAmount: NumberDecimal((Math.random() * 10000).toFixed(2)),
      status: "Generated",
      created: new Date()
    });
  }
  return db.claims.insertMany(claims);
}

function resetDay3Data() {
  print("Resetting Day 3 data to initial state...");
  db.policy_notifications.deleteMany({processed: true});
  db.claim_activity_log.deleteMany({eventType: "test_event"});
  db.claims.deleteMany({status: "Generated"});
  print("Day 3 data reset complete.");
}

function simulateLoad(seconds) {
  print("Simulating system load for " + seconds + " seconds...");
  var endTime = new Date(Date.now() + (seconds * 1000));
  var count = 0;

  while (new Date() < endTime) {
    db.policy_notifications.insertOne({
      notificationId: "LOAD-" + Date.now(),
      eventType: "load_test",
      timestamp: new Date(),
      message: "Load test notification " + (++count),
      processed: false
    });

    if (count % 100 === 0) {
      print("Generated " + count + " test notifications...");
    }
  }

  print("Load simulation complete. Generated " + count + " notifications.");
  return count;
}

function storeResumeToken(streamId, token) {
  return db.resume_tokens.updateOne(
    {streamId: streamId},
    {
      $set: {
        resumeToken: token,
        lastProcessed: new Date()
      }
    },
    {upsert: true}
  );
}

// Global utility function for data check
function quickDataCheck() {
  print("=== Day 3 Production Data Check ===");
  print("Policies: " + db.policies.countDocuments());
  print("Customers: " + db.customers.countDocuments());
  print("Claims: " + db.claims.countDocuments());
  print("Branches: " + db.branches.countDocuments());
  print("Agents: " + db.agents.countDocuments());
  print("Vehicles: " + db.vehicles.countDocuments());
  print("Properties: " + db.properties.countDocuments());
  print("Policy Notifications: " + db.policy_notifications.countDocuments());
  print("Claim Activity Log: " + db.claim_activity_log.countDocuments());
  print("Resume Tokens: " + db.resume_tokens.countDocuments());

  // Test change stream capability
  print("\nChange Stream Test:");
  try {
    var changeStream = db.policies.watch();
    print("✓ Change streams are supported");
    changeStream.close();
  } catch (e) {
    print("✗ Change streams not supported: " + e.message);
  }

  // Test transaction capability
  print("\nTransaction Test:");
  var session = db.getMongo().startSession();
  try {
    session.startTransaction();
    session.getDatabase("insurance_company").test_txn.insertOne({test: true});
    session.commitTransaction();
    print("✓ Transactions are supported");
    db.test_txn.drop();
  } catch (e) {
    print("✗ Transactions not supported: " + e.message);
  } finally {
    session.endSession();
  }
}

print("Day 3 utility functions loaded successfully.");
```

### 12. Verify Complete Data Loading

```javascript
// Final verification
print("=== Day 3 Production Data Verification ===");
quickDataCheck();

print("\n=== Sample Production Queries ===");

// Test sharding queries
print("Regional policy distribution:");
var regionalPolicies = db.policies.aggregate([
  {$group: {_id: "$region", count: {$sum: 1}}},
  {$sort: {count: -1}}
]).toArray();
printjson(regionalPolicies);

// Test transaction-ready data
print("\nTransaction-ready policies: " + db.policies.find({"transactions.version": {$exists: true}}).count());

// Test change stream collections
print("Unprocessed notifications: " + db.policy_notifications.find({processed: false}).count());

print("\n=== Day 3 Setup Complete ===");
print("Ready for:")
print("- Lab 9: MongoDB Transactions")
print("- Lab 10: Replica Sets & High Availability")
print("- Lab 11: Sharding & Horizontal Scaling")
print("- Lab 12: Change Streams for Real-time Applications")
print("- Lab 13: C# MongoDB API Integration (if applicable)")
```

## Expected Results

After manual loading, you should have:
- **4+ policies** with transaction support
- **1000+ customers** for sharding demonstration
- **2000+ claims** with range-shardable keys
- **400+ branches** geographically distributed
- **2 agents** with C# integration support
- **2 vehicles** with telematics data
- **1 smart property** with IoT integration
- **Change stream collections** ready for real-time monitoring
- **Resume token storage** for stream management
- **Production indexes** for performance
- **Utility functions** for lab operations

## Troubleshooting

### Performance Issues
- Data loading may take 5-10 minutes due to large dataset size
- Use batch insertion (already implemented in script)
- Ensure sufficient memory allocation for MongoDB

### Memory Issues
```javascript
// If experiencing memory issues, reduce batch sizes:
// Change batch size from 100 to 50 in customer creation loop
```

### Index Creation Errors
```javascript
// Drop and recreate indexes if needed:
db.customers.dropIndexes()
db.claims.dropIndexes()
// Then rerun index creation commands
```

## Next Steps

After loading Day 3 data:
1. Complete Lab 9: MongoDB Transactions
2. Complete Lab 10: Replica Sets & High Availability
3. Complete Lab 11: Sharding & Horizontal Scaling
4. Complete Lab 12: Change Streams for Real-time Applications
5. Complete Lab 13: C# MongoDB API Integration (if applicable)

---

*Manual setup for MongoDB Mastering Course - Day 3 Production & Enterprise*