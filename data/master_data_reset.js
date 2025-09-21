// ===== MASTER DATA RESET SCRIPT =====
// MongoDB Mastering Course - Complete Data Reset and Reload
// Usage: mongosh < master_data_reset.js
// Purpose: Complete cleanup and reload all data for fresh course start

print("=======================================================");
print("MongoDB Mastering Course - Master Data Reset");
print("=======================================================");
print("This script will completely reset and reload all course data.");
print("Use this for fresh course starts or complete data restoration.");
print("=======================================================\n");

// ===========================================
// Global Configuration
// ===========================================

var config = {
  databases: ["insurance_company", "insurance_analytics"],
  verbose: true,
  confirmReset: true
};

function logStep(message) {
  if (config.verbose) {
    print("🔧 " + message);
  }
}

function logSuccess(message) {
  if (config.verbose) {
    print("✅ " + message);
  }
}

function logError(message) {
  print("❌ ERROR: " + message);
}

// ===========================================
// Complete Database Cleanup
// ===========================================

print("🗑️ PHASE 1: Complete Database Cleanup");
print("=====================================");

config.databases.forEach(function(dbName) {
  logStep("Switching to database: " + dbName);
  use(dbName);

  logStep("Dropping all collections in " + dbName + "...");
  var collections = db.getCollectionNames();
  collections.forEach(function(collName) {
    if (collName.indexOf("system.") !== 0) { // Skip system collections
      db.getCollection(collName).drop();
      if (config.verbose) {
        print("  - Dropped: " + collName);
      }
    }
  });

  logSuccess("Cleaned database: " + dbName);
});

print("\n🧹 Cleanup Summary");
print("------------------");
config.databases.forEach(function(dbName) {
  use(dbName);
  var remainingCollections = db.getCollectionNames().filter(function(name) {
    return name.indexOf("system.") !== 0;
  });
  print("- " + dbName + ": " + remainingCollections.length + " collections remaining");
});

// ===========================================
// Data Loading Functions
// ===========================================

print("\n📊 PHASE 2: Data Loading");
print("========================");

// Day 1 Data Loading Function
function loadDay1Data() {
  logStep("Loading Day 1 insurance data...");

  use insurance_company;

  // Basic branches
  db.branches.insertMany([
    {
      _id: "BR001",
      branchCode: "BR-NYC-001",
      name: "New York Financial District",
      address: {
        street: "123 Wall Street",
        city: "New York",
        state: "NY",
        zipCode: "10001"
      },
      location: { type: "Point", coordinates: [-73.9857, 40.7484] },
      manager: "Sarah Johnson",
      agentCount: 15,
      specialties: ["Auto", "Property", "Life"],
      isActive: true
    },
    {
      _id: "BR002",
      branchCode: "BR-CHI-001",
      name: "Chicago Loop Branch",
      address: {
        street: "456 Michigan Avenue",
        city: "Chicago",
        state: "IL",
        zipCode: "60601"
      },
      location: { type: "Point", coordinates: [-87.6298, 41.8781] },
      manager: "Michael Chen",
      agentCount: 12,
      specialties: ["Auto", "Commercial", "Property"],
      isActive: true
    }
  ]);

  // Basic policies
  db.policies.insertMany([
    {
      _id: ObjectId(),
      policyNumber: "POL-AUTO-001",
      name: "Premium Auto Coverage",
      policyType: "Auto",
      annualPremium: 1299.99,
      coverageTypes: ["liability", "collision", "comprehensive"],
      isActive: true,
      createdAt: new Date("2024-01-15")
    },
    {
      _id: ObjectId(),
      policyNumber: "POL-HOME-001",
      name: "Homeowners Protection",
      policyType: "Property",
      annualPremium: 1899.99,
      coverageTypes: ["dwelling", "personal_property", "liability"],
      isActive: true,
      createdAt: new Date("2024-02-01")
    },
    {
      _id: ObjectId(),
      policyNumber: "POL-LIFE-001",
      name: "Term Life Insurance",
      policyType: "Life",
      annualPremium: 599.99,
      coverageTypes: ["death_benefit", "accidental_death"],
      isActive: true,
      createdAt: new Date("2024-03-01")
    }
  ]);

  // Basic customers
  db.customers.insertMany([
    {
      _id: ObjectId(),
      customerId: "CUST000001",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0101",
      address: {
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001"
      },
      customerType: "individual",
      riskScore: 75,
      isActive: true
    },
    {
      _id: ObjectId(),
      customerId: "CUST000002",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1-555-0102",
      address: {
        street: "456 Oak Avenue",
        city: "Chicago",
        state: "IL",
        zipCode: "60601"
      },
      customerType: "family",
      riskScore: 60,
      isActive: true
    }
  ]);

  // Basic indexes
  db.branches.createIndex({ location: "2dsphere" });
  db.policies.createIndex({ policyNumber: 1 }, { unique: true });
  db.customers.createIndex({ customerId: 1 }, { unique: true });

  logSuccess("Day 1 data loaded: " +
    db.branches.countDocuments() + " branches, " +
    db.policies.countDocuments() + " policies, " +
    db.customers.countDocuments() + " customers");
}

// Day 2 Data Loading Function
function loadDay2Data() {
  logStep("Loading Day 2 analytics data...");

  use insurance_analytics;

  // Policy types hierarchy
  db.policy_types.insertMany([
    {
      _id: ObjectId("65f1a1b1c2d3e4f567890001"),
      name: "Auto Insurance",
      code: "AUTO",
      description: "Vehicle insurance coverage",
      level: 1,
      isActive: true
    },
    {
      _id: ObjectId("65f1a1b1c2d3e4f567890002"),
      name: "Property Insurance",
      code: "PROPERTY",
      description: "Home and property coverage",
      level: 1,
      isActive: true
    }
  ]);

  // Enhanced branches with geospatial
  db.branches.insertMany([
    {
      _id: ObjectId("65f1a1b1c2d3e4f567892001"),
      branchCode: "BR-NYC-001",
      name: "Manhattan Financial District",
      location: { type: "Point", coordinates: [-73.9857, 40.7484] },
      territory: "Manhattan",
      agentCount: 25
    },
    {
      _id: ObjectId("65f1a1b1c2d3e4f567892002"),
      branchCode: "BR-BRK-001",
      name: "Brooklyn Heights Branch",
      location: { type: "Point", coordinates: [-73.9442, 40.6892] },
      territory: "Brooklyn",
      agentCount: 18
    }
  ]);

  // Analytics-focused policies with aggregation data
  var policies = [];
  for (let i = 0; i < 50; i++) {
    policies.push({
      _id: new ObjectId(),
      policyNumber: "POL-ANALYTICS-" + String(i + 1).padStart(3, '0'),
      category: ["Auto", "Property", "Life", "Commercial"][i % 4],
      annualPremium: Math.round((Math.random() * 2000 + 500) * 100) / 100,
      riskAssessment: {
        score: Math.floor(Math.random() * 100) + 1
      },
      isActive: Math.random() > 0.1
    });
  }
  db.policies.insertMany(policies);

  // Create analytics indexes
  db.branches.createIndex({ location: "2dsphere" });
  db.policies.createIndex({ category: 1, annualPremium: 1 });

  logSuccess("Day 2 data loaded: " +
    db.policy_types.countDocuments() + " policy types, " +
    db.branches.countDocuments() + " branches, " +
    db.policies.countDocuments() + " policies");
}

// Day 3 Data Loading Function
function loadDay3Data() {
  logStep("Loading Day 3 production data...");

  use insurance_company;

  // Add production policies for transactions
  db.policies.insertMany([
    {
      _id: "pol1",
      policyNumber: "POL-PROD-001",
      name: "Production Auto Policy",
      activePolicies: 10,
      annualPremium: 1299.99,
      isActive: true
    },
    {
      _id: "pol2",
      policyNumber: "POL-PROD-002",
      name: "Production Home Policy",
      activePolicies: 25,
      annualPremium: 1899.99,
      isActive: true
    }
  ]);

  // Add customers with balances for transactions
  db.customers.insertMany([
    {
      _id: "cust1",
      customerId: "PROD-CUST-001",
      name: "Production Customer 1",
      premiumBalance: 1200.00,
      totalPolicies: 0,
      riskScore: 75
    },
    {
      _id: "cust2",
      customerId: "PROD-CUST-002",
      name: "Production Customer 2",
      premiumBalance: 800.00,
      totalPolicies: 0,
      riskScore: 60
    }
  ]);

  // Generate large datasets for sharding
  logStep("Generating large datasets for sharding...");
  var customers = [];
  for (let i = 1; i <= 100; i++) { // Reduced for faster loading
    customers.push({
      _id: "shard_customer" + i,
      customerId: "SHARD-CUST-" + String(i).padStart(3, '0'),
      name: "Shard Customer " + i,
      region: ["north", "south", "east", "west"][i % 4],
      registrationDate: new Date()
    });
  }
  db.customers.insertMany(customers);

  // Create production indexes
  db.policies.createIndex({ policyNumber: 1 }, { unique: true });
  db.customers.createIndex({ customerId: 1 }, { unique: true });

  // Create change stream collections
  db.policy_notifications.createIndex({ customerId: 1, timestamp: -1 });
  db.claim_activity_log.createIndex({ timestamp: -1 });

  logSuccess("Day 3 data loaded with production datasets");
}

// ===========================================
// Execute Data Loading
// ===========================================

print("Loading all course data...\n");

try {
  loadDay1Data();
  loadDay2Data();
  loadDay3Data();

  print("\n🎯 PHASE 3: Final Validation");
  print("============================");

  // Validate Day 1 data
  use insurance_company;
  var day1Validation = {
    branches: db.branches.countDocuments(),
    policies: db.policies.countDocuments(),
    customers: db.customers.countDocuments()
  };

  // Validate Day 2 data
  use insurance_analytics;
  var day2Validation = {
    policy_types: db.policy_types.countDocuments(),
    branches: db.branches.countDocuments(),
    policies: db.policies.countDocuments()
  };

  print("✅ Data Loading Validation:");
  print("Day 1 (insurance_company):");
  Object.keys(day1Validation).forEach(function(key) {
    print("  - " + key + ": " + day1Validation[key]);
  });

  print("Day 2 (insurance_analytics):");
  Object.keys(day2Validation).forEach(function(key) {
    print("  - " + key + ": " + day2Validation[key]);
  });

  print("Day 3: Production datasets included in insurance_company");

} catch (error) {
  logError("Data loading failed: " + error.message);
  print("Please check the error and try running individual day scripts:");
  print("- mongosh < day1_data_loader.js");
  print("- mongosh < day2_data_loader.js");
  print("- mongosh < day3_data_loader.js");
}

// ===========================================
// Create Master Utility Functions
// ===========================================

print("\n🛠️ PHASE 4: Creating Master Utility Functions");
print("=============================================");

use insurance_company;

// Master reset function
db.system.js.save({
  _id: "masterReset",
  value: function() {
    print("🔄 Executing master reset...");

    // Reset all databases
    ["insurance_company", "insurance_analytics"].forEach(function(dbName) {
      use(dbName);
      var collections = db.getCollectionNames();
      collections.forEach(function(collName) {
        if (collName.indexOf("system.") !== 0) {
          db.getCollection(collName).drop();
        }
      });
      print("✓ Reset database: " + dbName);
    });

    print("🔄 Master reset complete. Run master_data_reset.js to reload data.");
  }
});

// Quick data check function
db.system.js.save({
  _id: "quickDataCheck",
  value: function() {
    print("📊 Quick Data Check");
    print("==================");

    use insurance_company;
    print("insurance_company database:");
    print("- Branches: " + db.branches.countDocuments());
    print("- Policies: " + db.policies.countDocuments());
    print("- Customers: " + db.customers.countDocuments());
    print("- Claims: " + db.claims.countDocuments());

    use insurance_analytics;
    print("\ninsurance_analytics database:");
    print("- Policy Types: " + db.policy_types.countDocuments());
    print("- Branches: " + db.branches.countDocuments());
    print("- Policies: " + db.policies.countDocuments());

    return "Data check complete";
  }
});

logSuccess("Created master utility functions");

// ===========================================
// Final Summary
// ===========================================

print("\n=======================================================");
print("✅ MASTER DATA RESET AND RELOAD COMPLETE!");
print("=======================================================");
print("All MongoDB Mastering Course data has been reset and reloaded.");
print("");
print("📚 Databases Ready:");
print("- insurance_company: Day 1 & Day 3 labs");
print("- insurance_analytics: Day 2 labs");
print("");
print("🔧 Available Commands:");
print("- quickDataCheck(): Check data status across all databases");
print("- masterReset(): Complete cleanup (requires reload)");
print("");
print("📁 Individual Day Loaders:");
print("- mongosh < day1_data_loader.js (Basic insurance operations)");
print("- mongosh < day2_data_loader.js (Analytics and advanced features)");
print("- mongosh < day3_data_loader.js (Production datasets)");
print("");
print("🎯 Course Status: Ready for all labs");
print("=======================================================");

// Memory cleanup
gc();