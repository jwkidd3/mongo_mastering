// MongoDB Day 3 Labs - Data Generator Script
// Run this script in mongosh to generate all test data needed for the labs
// Usage: mongosh < day3-data-generator.js

print("=======================================================");
print("MongoDB Day 3 Labs - Insurance Data Generator");
print("=======================================================");
print("This script will create all insurance test data needed for Day 3 labs");
print("Labs covered: Transactions, Replication, Sharding, Change Streams");
print("=======================================================\n");

// ===========================================
// Lab 1: Transaction Data Setup
// ===========================================

print("🔄 Setting up data for Lab 1: Insurance Transactions");
print("-----------------------------------------------------");

// Switch to insurance database
use insurance_company;

// Drop existing collections to start fresh
db.policies.drop();
db.customers.drop();
db.claims.drop();
db.payments.drop();

print("✓ Cleaned existing collections");

// Create policies collection with sample data
print("Creating policies collection...");
db.policies.insertMany([
  {
    _id: "pol1",
    policyNumber: "POL-AUTO-001",
    name: "Premium Auto Coverage",
    annualPremium: 1299.99,
    activePolicies: 10,
    category: "Auto Insurance",
    description: "Comprehensive auto insurance with full coverage",
    coverageTypes: ["liability", "collision", "comprehensive"]
  },
  {
    _id: "pol2",
    policyNumber: "POL-HOME-001",
    name: "Homeowners Protection",
    annualPremium: 899.99,
    activePolicies: 50,
    category: "Home Insurance",
    description: "Complete homeowners insurance coverage",
    coverageTypes: ["dwelling", "personal_property", "liability"]
  },
  {
    _id: "pol3",
    policyNumber: "POL-LIFE-001",
    name: "Term Life Insurance",
    annualPremium: 599.99,
    activePolicies: 25,
    category: "Life Insurance",
    description: "Affordable term life insurance protection",
    coverageTypes: ["death_benefit", "accidental_death"]
  },
  {
    _id: "pol4",
    policyNumber: "POL-COMM-001",
    name: "Business Liability",
    annualPremium: 2499.99,
    activePolicies: 15,
    category: "Commercial Insurance",
    description: "General liability insurance for businesses",
    coverageTypes: ["general_liability", "product_liability"]
  },
  {
    _id: "pol5",
    policyNumber: "POL-HEALTH-001",
    name: "Health Insurance Plan",
    annualPremium: 4999.99,
    activePolicies: 8,
    category: "Health Insurance",
    description: "Comprehensive health insurance coverage",
    coverageTypes: ["medical", "prescription", "dental"]
  }
]);

print("✓ Created " + db.policies.countDocuments() + " policies");

// Create customers collection with sample data
print("Creating customers collection...");
db.customers.insertMany([
  {
    _id: "cust1",
    customerId: "CUST000001",
    name: "John Doe",
    email: "john@example.com",
    premiumBalance: 1200.00,
    totalPolicies: 0,
    totalPremiumsPaid: 0,
    lastPaymentDate: null,
    riskScore: 75,
    registrationDate: new Date("2024-01-15")
  },
  {
    _id: "cust2",
    customerId: "CUST000002",
    name: "Jane Smith",
    email: "jane@example.com",
    premiumBalance: 800.00,
    totalPolicies: 0,
    totalPremiumsPaid: 0,
    lastPaymentDate: null,
    riskScore: 60,
    registrationDate: new Date("2024-02-20")
  },
  {
    _id: "cust3",
    customerId: "CUST000003",
    name: "Bob Johnson",
    email: "bob@example.com",
    premiumBalance: 1500.00,
    totalPolicies: 0,
    totalPremiumsPaid: 0,
    lastPaymentDate: null,
    riskScore: 45,
    registrationDate: new Date("2024-03-10")
  },
  {
    _id: "cust4",
    customerId: "CUST000004",
    name: "Alice Brown",
    email: "alice@example.com",
    premiumBalance: 2000.00,
    totalPolicies: 0,
    totalPremiumsPaid: 0,
    lastPaymentDate: null,
    riskScore: 30,
    registrationDate: new Date("2024-04-05")
  }
]);

print("✓ Created " + db.customers.countDocuments() + " customers");

// Create indexes for claims collection
print("Creating indexes...");
db.claims.createIndex({ claimNumber: 1 }, { unique: true });
db.claims.createIndex({ customerId: 1, claimDate: 1 });
db.payments.createIndex({ timestamp: -1 });

print("✓ Created necessary indexes");
print("Lab 1 insurance data setup complete!\n");

// ===========================================
// Lab 2: Replication Data Setup
// ===========================================

print("🔧 Setting up data for Lab 2: Insurance Replication");
print("------------------------------------------------------");

// Create test_claims collection for write concern testing
print("Creating test collections for replication testing...");
db.test_claims.createIndex({ timestamp: -1 });
db.test_policies.createIndex({ timestamp: -1 });

print("✓ Created test collections");
print("Lab 2 insurance replication data setup complete!\n");

// ===========================================
// Lab 3: Sharding Data Setup  
// ===========================================

print("⚡ Setting up data for Lab 3: Insurance Sharding");
print("--------------------------------------------------");

// Note: Sharding collections will be created during the lab
// This section prepares additional reference data

// Generate customers data for hashed sharding
print("Generating customers data for hashed sharding...");
var customers = [];
for (let i = 1; i <= 1000; i++) {
  customers.push({
    _id: "customer" + i,
    customerId: "CUST" + String(i).padStart(6, '0'),
    name: "Customer " + i,
    email: "customer" + i + "@example.com",
    registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    insuranceProfile: {
      riskLevel: Math.random() > 0.7 ? "high" : (Math.random() > 0.4 ? "medium" : "low"),
      policyTypes: Math.random() > 0.6 ? ["auto", "home"] : ["auto"],
      paymentMethod: Math.random() > 0.5 ? "monthly" : "annual"
    },
    metadata: {
      lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      claimCount: Math.floor(Math.random() * 5),
      customerType: Math.random() > 0.8 ? "premium" : "standard"
    }
  });
}

// Insert customers in batches to avoid memory issues
var batchSize = 100;
for (let i = 0; i < customers.length; i += batchSize) {
  var batch = customers.slice(i, i + batchSize);
  db.customers.insertMany(batch);
  if ((i + batchSize) % 200 === 0) {
    print("  Inserted " + (i + batchSize) + " customers...");
  }
}

print("✓ Generated " + db.customers.countDocuments() + " customers for sharding");

// Generate claims data for range sharding
print("Generating claims data for range sharding...");
var sampleCustomers = ["customer1", "customer100", "customer200", "customer300", "customer400", "customer500"];
var claims = [];

for (let i = 1; i <= 2000; i++) {
  var customerId = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
  var claimDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
  var claimAmount = Math.random() * 50000 + 500; // $500-$50,500
  var deductible = [250, 500, 1000, 2500][Math.floor(Math.random() * 4)];

  var claimTypes = ["Auto Accident", "Property Damage", "Theft", "Fire", "Water Damage", "Medical", "Liability"];
  var claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];

  claims.push({
    _id: "claim" + i,
    claimNumber: "CLM-2024-" + String(i).padStart(6, '0'),
    customerId: customerId,
    claimDate: claimDate,
    claimType: claimType,
    claimAmount: Math.round(claimAmount * 100) / 100,
    deductible: deductible,
    status: Math.random() > 0.8 ? "pending" : "settled",
    incidentLocation: {
      street: Math.floor(Math.random() * 9999) + " Insurance Ave",
      city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
      state: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    },
    adjusterAssigned: "ADJ" + String(Math.floor(Math.random() * 100) + 1).padStart(3, '0'),
    fraudFlag: Math.random() > 0.95 // 5% flagged for fraud
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

// Generate branches data for geographic sharding
print("Generating insurance branches data for geographic sharding...");
var regions = ["north", "south", "east", "west"];
var branches = [];

for (let i = 1; i <= 400; i++) {
  var region = regions[Math.floor(Math.random() * regions.length)];
  branches.push({
    region: region,
    branchId: "branch" + i,
    branchCode: "BR-" + region.toUpperCase().substring(0, 2) + "-" + String(i).padStart(3, '0'),
    name: "Insurance Branch " + i,
    address: i + " Insurance Blvd, " + region.charAt(0).toUpperCase() + region.slice(1) + " District",
    manager: "Manager " + i,
    agents: Math.floor(Math.random() * 15) + 5,
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
print("✓ Generated " + db.branches.countDocuments() + " insurance branches for geographic sharding");
print("Lab 3 insurance sharding data setup complete!\n");

// ===========================================
// Lab 4: Change Streams Data Setup
// ===========================================

print("📡 Setting up data for Lab 4: Insurance Change Streams");
print("-----------------------------------------------------------");

// Create collections for change stream testing
print("Creating collections for change streams...");

// Drop existing collections
db.policy_notifications.drop();
db.claim_activity_log.drop();
db.resume_tokens.drop();

// Create policy notifications collection
db.policy_notifications.createIndex({ customerId: 1, timestamp: -1 });
db.policy_notifications.createIndex({ type: 1, read: 1 });

// Create claim activity log collection
db.claim_activity_log.createIndex({ timestamp: -1 });
db.claim_activity_log.createIndex({ event: 1, timestamp: -1 });

// Create resume tokens collection
db.resume_tokens.createIndex({ lastUpdated: -1 });

print("✓ Created change stream collections with indexes");

// Insert sample policy notifications to demonstrate the structure
print("Creating sample policy notifications...");
db.policy_notifications.insertMany([
  {
    customerId: "cust1",
    type: "policy_renewal",
    message: "Your auto insurance policy is due for renewal in 30 days",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true
  },
  {
    customerId: "cust2",
    type: "claim_update",
    message: "Your claim CLM-2024-001234 has been approved",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    read: false
  },
  {
    customerId: "admin",
    type: "system",
    message: "System maintenance scheduled for tonight - claims processing may be delayed",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: false
  }
]);

print("✓ Created " + db.policy_notifications.countDocuments() + " sample policy notifications");
print("Lab 4 insurance change streams data setup complete!\n");

// ===========================================
// Additional Utility Data
// ===========================================

print("🛠️ Creating additional insurance utility data");
print("-----------------------------------------------");

// Create policy categories for analytics
print("Creating policy categories reference...");
db.policy_categories.drop();
db.policy_categories.insertMany([
  {
    _id: "Auto",
    description: "Vehicle insurance coverage",
    parentCategory: null,
    subcategories: ["Liability", "Collision", "Comprehensive", "Uninsured Motorist"]
  },
  {
    _id: "Property",
    description: "Home and property insurance",
    parentCategory: null,
    subcategories: ["Homeowners", "Renters", "Condo", "Flood"]
  },
  {
    _id: "Life",
    description: "Life and health insurance products",
    parentCategory: null,
    subcategories: ["Term Life", "Whole Life", "Health", "Disability"]
  },
  {
    _id: "Commercial",
    description: "Business and commercial insurance",
    parentCategory: null,
    subcategories: ["General Liability", "Professional Liability", "Workers Comp", "Cyber"]
  }
]);

print("✓ Created policy categories reference");

// Create system configuration collection
print("Creating system configuration...");
db.system_config.drop();
db.system_config.insertMany([
  {
    _id: "app_settings",
    version: "1.0.0",
    features: {
      transactions_enabled: true,
      change_streams_enabled: true,
      sharding_enabled: false,
      notifications_enabled: true,
      fraud_detection_enabled: true
    },
    limits: {
      max_claim_amount: 100000,
      max_policy_coverage: 1000000,
      session_timeout_minutes: 30
    },
    lastUpdated: new Date()
  },
  {
    _id: "business_rules",
    policies: {
      renewal_notice_days: 30,
      auto_renewal_enabled: true,
      grace_period_days: 15
    },
    claims: {
      max_processing_time_days: 30,
      auto_approve_threshold: 1000,
      fraud_review_threshold: 10000
    },
    customers: {
      max_premium_balance: 10000,
      risk_score_threshold: 80,
      loyalty_program_enabled: true
    },
    lastUpdated: new Date()
  }
]);

print("✓ Created system configuration");

// Create sample analytics data
print("Creating analytics data...");
db.daily_stats.drop();
var statsData = [];
for (let i = 30; i >= 0; i--) {
  var date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
  statsData.push({
    date: date,
    claims: {
      total: Math.floor(Math.random() * 50) + 20,
      approved: Math.floor(Math.random() * 40) + 15,
      denied: Math.floor(Math.random() * 5) + 1,
      payouts: Math.round((Math.random() * 500000 + 100000) * 100) / 100
    },
    customers: {
      active: Math.floor(Math.random() * 1000) + 500,
      new_registrations: Math.floor(Math.random() * 30) + 10,
      renewals: Math.floor(Math.random() * 200) + 100
    },
    policies: {
      new_policies: Math.floor(Math.random() * 100) + 50,
      renewals: Math.floor(Math.random() * 150) + 75,
      quotes: Math.floor(Math.random() * 300) + 100,
      top_category: ["Auto", "Property", "Life", "Commercial"][Math.floor(Math.random() * 4)]
    }
  });
}
db.daily_stats.insertMany(statsData);

print("✓ Created " + db.daily_stats.countDocuments() + " days of analytics data");

// ===========================================
// Create Useful Functions
// ===========================================

print("🔧 Creating utility functions");
print("-----------------------------");

// Function to reset all data to initial state
print("Creating data reset function...");
db.system.js.save({
  _id: "resetLabData",
  value: function() {
    print("Resetting all insurance lab data to initial state...");

    // Reset policy counts
    db.policies.updateOne({_id: "pol1"}, {$set: {activePolicies: 10}});
    db.policies.updateOne({_id: "pol2"}, {$set: {activePolicies: 50}});
    db.policies.updateOne({_id: "pol3"}, {$set: {activePolicies: 25}});
    db.policies.updateOne({_id: "pol4"}, {$set: {activePolicies: 15}});
    db.policies.updateOne({_id: "pol5"}, {$set: {activePolicies: 8}});

    // Reset customer balances
    db.customers.updateMany({}, {
      $set: { totalPolicies: 0, totalPremiumsPaid: 0, lastPaymentDate: null }
    });
    db.customers.updateOne({_id: "cust1"}, {$set: {premiumBalance: 1200.00}});
    db.customers.updateOne({_id: "cust2"}, {$set: {premiumBalance: 800.00}});
    db.customers.updateOne({_id: "cust3"}, {$set: {premiumBalance: 1500.00}});
    db.customers.updateOne({_id: "cust4"}, {$set: {premiumBalance: 2000.00}});

    // Clear test collections
    db.claims.deleteMany({_id: /^claim_test/});
    db.payments.deleteMany({type: "transfer"});
    db.policy_notifications.deleteMany({type: {$in: ["claim_created", "status_update", "high_value_claim"]}});
    db.claim_activity_log.deleteMany({});
    db.resume_tokens.deleteMany({});

    print("✓ Insurance lab data reset complete!");
  }
});

// Function to generate additional test claims
print("Creating test claim generator function...");
db.system.js.save({
  _id: "generateTestClaims",
  value: function(count) {
    count = count || 10;
    print("Generating " + count + " test claims...");

    var customers = ["cust1", "cust2", "cust3", "cust4"];
    var policies = ["pol1", "pol2", "pol3", "pol4", "pol5"];
    var claimTypes = ["Auto Accident", "Property Damage", "Theft", "Fire", "Medical"];
    var claims = [];

    for (let i = 1; i <= count; i++) {
      var customerId = customers[Math.floor(Math.random() * customers.length)];
      var policyId = policies[Math.floor(Math.random() * policies.length)];
      var claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
      var claimAmount = Math.round((Math.random() * 10000 + 500) * 100) / 100;

      claims.push({
        _id: "test_claim_" + Date.now() + "_" + i,
        claimNumber: "CLM-TEST-" + String(i).padStart(6, '0'),
        customerId: customerId,
        policyId: policyId,
        claimDate: new Date(),
        claimType: claimType,
        claimAmount: claimAmount,
        status: "submitted"
      });
    }

    db.claims.insertMany(claims);
    print("✓ Generated " + count + " test claims");
    return claims.map(c => c._id);
  }
});

// Function to simulate high load
print("Creating load simulation function...");
db.system.js.save({
  _id: "simulateLoad",
  value: function(duration) {
    duration = duration || 60; // seconds
    print("Simulating insurance system load for " + duration + " seconds...");

    var startTime = Date.now();
    var operations = 0;

    while ((Date.now() - startTime) < duration * 1000) {
      // Random operations
      var operation = Math.floor(Math.random() * 4);

      switch(operation) {
        case 0: // Insert policy notification
          db.policy_notifications.insertOne({
            customerId: "load_test_customer",
            type: "load_test",
            message: "Load test notification " + operations,
            timestamp: new Date(),
            read: false
          });
          break;

        case 1: // Update policy count
          var policyId = "pol" + (Math.floor(Math.random() * 5) + 1);
          db.policies.updateOne(
            {_id: policyId},
            {$inc: {activePolicies: Math.floor(Math.random() * 5) - 2}}
          );
          break;

        case 2: // Query claims
          db.claims.find({status: "submitted"}).limit(10).toArray();
          break;

        case 3: // Update customer
          var custId = "cust" + (Math.floor(Math.random() * 4) + 1);
          db.customers.updateOne(
            {_id: custId},
            {$set: {lastActivity: new Date()}}
          );
          break;
      }

      operations++;
      if (operations % 100 === 0) {
        print("  Performed " + operations + " operations...");
      }
    }

    print("✓ Load simulation complete. Total operations: " + operations);

    // Cleanup load test data
    db.policy_notifications.deleteMany({type: "load_test"});
    db.customers.updateMany({}, {$unset: {lastActivity: 1}});

    return operations;
  }
});

print("✓ Created utility functions");

// ===========================================
// Final Setup and Validation
// ===========================================

print("\n🎯 Final validation and summary");
print("===============================");

// Validate data counts
var validation = {
  policies: db.policies.countDocuments(),
  customers: db.customers.countDocuments(),
  claims: db.claims.countDocuments(),
  branches: db.branches.countDocuments(),
  policy_notifications: db.policy_notifications.countDocuments(),
  daily_stats: db.daily_stats.countDocuments(),
  policy_categories: db.policy_categories.countDocuments()
};

print("Insurance data validation:");
print("- Policies: " + validation.policies);
print("- Customers: " + validation.customers);
print("- Claims: " + validation.claims);
print("- Branches: " + validation.branches);
print("- Policy Notifications: " + validation.policy_notifications);
print("- Daily Stats: " + validation.daily_stats);
print("- Policy Categories: " + validation.policy_categories);

// Check indexes
print("\nIndex validation:");
var collections = ["policies", "customers", "claims", "branches", "policy_notifications", "claim_activity_log"];
collections.forEach(function(coll) {
  var indexes = db.getCollection(coll).getIndexes();
  print("- " + coll + ": " + indexes.length + " indexes");
});

print("\n=======================================================");
print("✅ INSURANCE DATA GENERATION COMPLETE!");
print("=======================================================");
print("All insurance test data for MongoDB Day 3 labs has been created.");
print("");
print("Available utility functions:");
print("- resetLabData(): Reset all insurance data to initial state");
print("- generateTestClaims(count): Generate additional test claims");
print("- simulateLoad(seconds): Simulate insurance system load");
print("");
print("Usage: db.eval(resetLabData) or db.loadServerScripts(); resetLabData()");
print("=======================================================");

// Final memory cleanup
gc();