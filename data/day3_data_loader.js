// ===== DAY 3 DATA LOADER SCRIPT =====
// MongoDB Day 3 Labs - Production Insurance Data Loader
// Usage: mongosh < day3_data_loader.js
// Purpose: Load all data needed for Day 3 labs or reset after completion

print("=======================================================");
print("MongoDB Day 3 Labs - Production Insurance Data Loader");
print("=======================================================");
print("Loading production insurance data for Day 3 labs...");
print("Labs covered: Transactions, Replication, Sharding, Change Streams, C# Integration");
print("=======================================================\n");

// ===========================================
// Database Setup
// ===========================================

print("🔧 Setting up insurance_company database for production labs");
print("-----------------------------------------------------------");

// Switch to insurance database
use insurance_company;

// Drop existing collections to start fresh
print("Cleaning existing collections...");
db.policies.drop();
db.customers.drop();
db.claims.drop();
db.payments.drop();
db.agents.drop();
db.branches.drop();
db.vehicles.drop();
db.properties.drop();
db.policy_notifications.drop();
db.claim_activity_log.drop();
db.resume_tokens.drop();
db.fraud_investigations.drop();
db.compliance_records.drop();

print("✓ Cleaned existing collections");

// ===========================================
// Lab 1: MongoDB Transactions
// ===========================================

print("\n💳 Loading data for Lab 1: MongoDB Transactions");
print("----------------------------------------------");

// Create core policies for transaction testing
print("Creating core insurance policies...");
db.policies.insertMany([
  {
    _id: "pol1",
    policyNumber: "POL-AUTO-001",
    name: "Premium Auto Coverage",
    policyType: "Auto",
    annualPremium: 1299.99,
    activePolicies: 10,
    coverageDetails: {
      liability: "250000/500000",
      collision: { deductible: 500, coverage: "Full" },
      comprehensive: { deductible: 250, coverage: "Full" }
    },
    coverageTypes: ["liability", "collision", "comprehensive"],
    isActive: true
  },
  {
    _id: "pol2",
    policyNumber: "POL-HOME-001",
    name: "Homeowners Protection",
    policyType: "Property",
    annualPremium: 1899.99,
    activePolicies: 25,
    coverageDetails: {
      dwelling: { coverage: 400000, deductible: 1000 },
      personalProperty: { coverage: 200000, deductible: 500 },
      liability: 300000
    },
    coverageTypes: ["dwelling", "personal_property", "liability"],
    isActive: true
  },
  {
    _id: "pol3",
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
  },
  {
    _id: "pol4",
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
  }
]);

print("✓ Created " + db.policies.countDocuments() + " core policies");

// Create customers with premium balances for transaction testing
print("Creating customers with premium balances...");
db.customers.insertMany([
  {
    _id: "cust1",
    customerId: "CUST000001",
    name: "John Smith",
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
  },
  {
    _id: "cust2",
    customerId: "CUST000002",
    name: "Sarah Johnson",
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
  },
  {
    _id: "cust3",
    customerId: "CUST000003",
    name: "Michael Davis",
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
  }
]);

print("✓ Created " + db.customers.countDocuments() + " customers with balances");

// Create indexes for transaction collections
print("Creating transaction indexes...");
db.claims.createIndex({ claimNumber: 1 }, { unique: true });
db.claims.createIndex({ customerId: 1, claimDate: 1 });
db.payments.createIndex({ paymentId: 1 }, { unique: true });
db.payments.createIndex({ timestamp: -1 });

print("✓ Created transaction indexes");

// ===========================================
// Lab 2: Replica Sets & High Availability
// ===========================================

print("\n🔄 Loading data for Lab 2: Replica Sets & High Availability");
print("----------------------------------------------------------");

// Create test collections for replication testing
print("Creating test collections for replication monitoring...");
db.test_claims.createIndex({ timestamp: -1 });
db.test_policies.createIndex({ timestamp: -1 });

print("✓ Created replication test collections");

// ===========================================
// Lab 3: Sharding & Horizontal Scaling
// ===========================================

print("\n⚡ Loading data for Lab 3: Sharding & Horizontal Scaling");
print("------------------------------------------------------");

// Generate large customer dataset for sharding
print("Generating large customer dataset for sharding (1000 customers)...");
var customers = [];
var firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Lisa", "Robert", "Jennifer", "William", "Mary", "James", "Patricia", "Christopher", "Linda", "Matthew", "Barbara"];
var lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas"];
var states = ["NY", "CA", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"];

for (let i = 1; i <= 1000; i++) {
  customers.push({
    _id: "customer" + i,
    customerId: "CUST" + String(i).padStart(6, '0'),
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    email: `customer${i}@example.com`,
    address: {
      street: `${Math.floor(Math.random() * 999) + 1} ${["Main", "Oak", "Pine", "Cedar"][Math.floor(Math.random() * 4)]} St`,
      city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
      state: states[Math.floor(Math.random() * states.length)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    },
    registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    insuranceProfile: {
      riskLevel: Math.random() > 0.7 ? "high" : (Math.random() > 0.4 ? "medium" : "low"),
      policyTypes: Math.random() > 0.6 ? ["auto", "home"] : ["auto"],
      paymentMethod: Math.random() > 0.5 ? "monthly" : "annual",
      totalPremiumValue: Math.round((Math.random() * 5000 + 500) * 100) / 100
    },
    metadata: {
      lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      claimCount: Math.floor(Math.random() * 5),
      customerType: Math.random() > 0.8 ? "premium" : "standard"
    }
  });
}

// Insert in batches
var batchSize = 100;
for (let i = 0; i < customers.length; i += batchSize) {
  var batch = customers.slice(i, i + batchSize);
  db.customers.insertMany(batch);
  if ((i + batchSize) % 200 === 0) {
    print("  Inserted " + (i + batchSize) + " customers...");
  }
}

print("✓ Generated " + db.customers.countDocuments() + " customers for sharding");

// Generate claims for range sharding
print("Generating claims dataset for range sharding (2000 claims)...");
var sampleCustomers = ["customer1", "customer100", "customer200", "customer300", "customer400", "customer500"];
var claims = [];
var claimTypes = ["Auto Accident", "Property Damage", "Theft", "Fire", "Water Damage", "Medical", "Liability"];

for (let i = 1; i <= 2000; i++) {
  var customerId = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
  var claimAmount = Math.round((Math.random() * 50000 + 500) * 100) / 100;
  var claimDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));

  claims.push({
    _id: "claim" + i,
    claimNumber: "CLM-2024-" + String(i).padStart(6, '0'),
    customerId: customerId,
    claimDate: claimDate,
    claimType: claimTypes[Math.floor(Math.random() * claimTypes.length)],
    claimAmount: claimAmount,
    deductible: [250, 500, 1000, 2500][Math.floor(Math.random() * 4)],
    status: Math.random() > 0.8 ? "pending" : "settled",
    incidentLocation: {
      street: `${Math.floor(Math.random() * 999) + 1} Insurance Ave`,
      city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
      state: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    },
    territory: ["north", "south", "east", "west"][Math.floor(Math.random() * 4)],
    adjusterAssigned: "ADJ" + String(Math.floor(Math.random() * 100) + 1).padStart(3, '0'),
    fraudFlag: Math.random() > 0.95
  });
}

// Insert claims in batches
for (let i = 0; i < claims.length; i += batchSize) {
  var batch = claims.slice(i, i + batchSize);
  db.claims.insertMany(batch);
  if ((i + batchSize) % 200 === 0) {
    print("  Inserted " + (i + batchSize) + " claims...");
  }
}

print("✓ Generated " + db.claims.countDocuments() + " claims for sharding");

// Generate branches for geographic sharding
print("Generating branches for geographic sharding (400 branches)...");
var regions = ["north", "south", "east", "west"];
var branches = [];

for (let i = 1; i <= 400; i++) {
  var region = regions[Math.floor(Math.random() * regions.length)];
  branches.push({
    _id: "branch" + i,
    region: region,
    branchCode: "BR-" + region.toUpperCase().substring(0, 2) + "-" + String(i).padStart(3, '0'),
    name: "Insurance Branch " + i,
    address: {
      street: `${i} Insurance Blvd`,
      city: region.charAt(0).toUpperCase() + region.slice(1) + " City",
      state: ["NY", "CA", "TX", "FL"][Math.floor(Math.random() * 4)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    },
    manager: "Manager " + i,
    agentCount: Math.floor(Math.random() * 15) + 5,
    performanceData: {
      monthlyPremiums: Math.round((Math.random() * 500000 + 100000) * 100) / 100,
      quarterlyPremiums: Math.round((Math.random() * 1500000 + 300000) * 100) / 100,
      annualPremiums: Math.round((Math.random() * 6000000 + 1200000) * 100) / 100
    },
    policyMetrics: {
      activePolicies: Math.floor(Math.random() * 2000) + 500,
      policyTypes: Math.floor(Math.random() * 5) + 3,
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    },
    coordinates: {
      lat: Math.random() * 180 - 90,
      lng: Math.random() * 360 - 180
    },
    specialties: ["Auto", "Home", "Life", "Commercial"].filter(() => Math.random() > 0.4)
  });
}

db.branches.insertMany(branches);
print("✓ Generated " + db.branches.countDocuments() + " branches for geographic sharding");

// ===========================================
// Lab 4: Change Streams for Real-time Applications
// ===========================================

print("\n📡 Loading data for Lab 4: Change Streams");
print("----------------------------------------");

// Create collections for change stream testing
print("Creating change stream monitoring collections...");

// Policy notifications collection
db.policy_notifications.createIndex({ customerId: 1, timestamp: -1 });
db.policy_notifications.createIndex({ type: 1, read: 1 });

// Claim activity log collection
db.claim_activity_log.createIndex({ timestamp: -1 });
db.claim_activity_log.createIndex({ event: 1, timestamp: -1 });

// Resume tokens collection
db.resume_tokens.createIndex({ lastUpdated: -1 });

print("✓ Created change stream collections");

// Insert sample notifications
print("Creating sample policy notifications...");
db.policy_notifications.insertMany([
  {
    _id: new ObjectId(),
    customerId: "cust1",
    type: "policy_renewal",
    message: "Your auto insurance policy is due for renewal in 30 days",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    priority: "medium"
  },
  {
    _id: new ObjectId(),
    customerId: "cust2",
    type: "claim_update",
    message: "Your claim CLM-2024-001234 has been approved",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: false,
    priority: "high"
  },
  {
    _id: new ObjectId(),
    customerId: "admin",
    type: "system",
    message: "System maintenance scheduled - claims processing may be delayed",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: false,
    priority: "low"
  }
]);

print("✓ Created " + db.policy_notifications.countDocuments() + " sample notifications");

// ===========================================
// Lab 5: C# MongoDB Integration
// ===========================================

print("\n💻 Loading data for Lab 5: C# MongoDB Integration");
print("------------------------------------------------");

// Create comprehensive dataset for C# integration
print("Creating comprehensive insurance dataset for C# integration...");

// Add agents for the C# service examples
db.agents.insertMany([
  {
    _id: new ObjectId(),
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
  },
  {
    _id: new ObjectId(),
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
  }
]);

print("✓ Created " + db.agents.countDocuments() + " agents for C# integration");

// Add vehicles and properties for comprehensive asset management
print("Creating insured assets for C# modeling...");
db.vehicles.insertMany([
  {
    _id: new ObjectId(),
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
    _id: new ObjectId(),
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

db.properties.insertMany([
  {
    _id: new ObjectId(),
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

print("✓ Created vehicles and properties for asset management");

// ===========================================
// Create Production Indexes
// ===========================================

print("\n🔧 Creating production-ready indexes");
print("-----------------------------------");

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

print("✓ Created production indexes");

// ===========================================
// Create Utility Functions
// ===========================================

print("\n🛠️ Creating utility functions");
print("-----------------------------");

// Function to reset lab data
db.system.js.save({
  _id: "resetDay3Data",
  value: function() {
    print("Resetting Day 3 insurance data to initial state...");

    // Reset policy counts
    db.policies.updateOne({_id: "pol1"}, {$set: {activePolicies: 10}});
    db.policies.updateOne({_id: "pol2"}, {$set: {activePolicies: 25}});
    db.policies.updateOne({_id: "pol3"}, {$set: {activePolicies: 15}});
    db.policies.updateOne({_id: "pol4"}, {$set: {activePolicies: 8}});

    // Reset customer balances
    db.customers.updateOne({_id: "cust1"}, {$set: {premiumBalance: 1200.00, totalPolicies: 0}});
    db.customers.updateOne({_id: "cust2"}, {$set: {premiumBalance: 800.00, totalPolicies: 0}});
    db.customers.updateOne({_id: "cust3"}, {$set: {premiumBalance: 1500.00, totalPolicies: 0}});

    // Clear test data
    db.claims.deleteMany({_id: /^test_/});
    db.payments.deleteMany({paymentType: "test"});
    db.policy_notifications.deleteMany({type: {$in: ["test", "claim_created", "status_update"]}});
    db.claim_activity_log.deleteMany({});
    db.resume_tokens.deleteMany({});

    print("✓ Day 3 data reset complete!");
  }
});

// Function to generate test claims
db.system.js.save({
  _id: "generateTestClaims",
  value: function(count) {
    count = count || 10;
    print("Generating " + count + " test claims...");

    var customers = ["cust1", "cust2", "cust3"];
    var claimTypes = ["Auto Accident", "Property Damage", "Theft", "Fire"];
    var claims = [];

    for (let i = 1; i <= count; i++) {
      claims.push({
        _id: "test_claim_" + Date.now() + "_" + i,
        claimNumber: "CLM-TEST-" + String(i).padStart(6, '0'),
        customerId: customers[Math.floor(Math.random() * customers.length)],
        claimType: claimTypes[Math.floor(Math.random() * claimTypes.length)],
        claimAmount: Math.round((Math.random() * 10000 + 500) * 100) / 100,
        status: "submitted",
        claimDate: new Date()
      });
    }

    db.claims.insertMany(claims);
    print("✓ Generated " + count + " test claims");
    return claims.map(c => c._id);
  }
});

print("✓ Created utility functions");

// ===========================================
// Final Validation
// ===========================================

print("\n📊 Day 3 production data validation");
print("-----------------------------------");

var validation = {
  policies: db.policies.countDocuments(),
  customers: db.customers.countDocuments(),
  claims: db.claims.countDocuments(),
  branches: db.branches.countDocuments(),
  agents: db.agents.countDocuments(),
  vehicles: db.vehicles.countDocuments(),
  properties: db.properties.countDocuments(),
  policy_notifications: db.policy_notifications.countDocuments()
};

print("Production collections:");
Object.keys(validation).forEach(function(key) {
  print("- " + key + ": " + validation[key]);
});

// Check indexes
print("\nIndex validation:");
var collections = ["policies", "customers", "claims", "branches", "agents"];
collections.forEach(function(coll) {
  var indexes = db.getCollection(coll).getIndexes();
  print("- " + coll + ": " + indexes.length + " indexes");
});

print("\n=======================================================");
print("✅ DAY 3 PRODUCTION INSURANCE DATA LOADING COMPLETE!");
print("=======================================================");
print("All production data for MongoDB Day 3 labs has been loaded.");
print("");
print("Production features ready:");
print("- Transaction-ready datasets with proper constraints");
print("- Large-scale datasets for sharding (1000+ customers, 2000+ claims)");
print("- Change stream monitoring collections with indexes");
print("- Comprehensive asset management data for C# integration");
print("- Utility functions for data management and testing");
print("");
print("You can now proceed with any Day 3 lab:");
print("- Lab 1: MongoDB Transactions");
print("- Lab 2: Replica Sets & High Availability");
print("- Lab 3: Sharding & Horizontal Scaling");
print("- Lab 4: Change Streams for Real-time Applications");
print("- Lab 5: C# MongoDB API Integration");
print("");
print("Available utility functions:");
print("- resetDay3Data(): Reset all data to initial state");
print("- generateTestClaims(count): Generate test claims");
print("");
print("To reload this data at any time, run:");
print("mongosh < day3_data_loader.js");
print("=======================================================");