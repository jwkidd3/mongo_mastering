// ===== DAY 1 DATA LOADER SCRIPT =====
// MongoDB Day 1 Labs - Insurance Data Loader
// Usage: mongosh < day1_data_loader.js
// Purpose: Load all data needed for Day 1 labs or reset after completion

print("=======================================================");
print("MongoDB Day 1 Labs - Insurance Data Loader");
print("=======================================================");
print("Loading insurance data for Day 1 labs...");
print("Labs covered: Shell Mastery, Database Management, CRUD Operations");
print("=======================================================\n");

// ===========================================
// Database Setup
// ===========================================

print("🔧 Setting up insurance_company database");
print("----------------------------------------");

// Switch to insurance database
use insurance_company;

// Drop existing collections to start fresh
print("Cleaning existing collections...");
db.policies.drop();
db.customers.drop();
db.claims.drop();
db.agents.drop();
db.branches.drop();
db.payments.drop();
db.audit_logs.drop();

print("✓ Cleaned existing collections");

// ===========================================
// Basic Collections for Day 1 Labs
// ===========================================

// Lab 1 & 2: Basic database and collection setup
print("\n📋 Creating basic insurance collections for Labs 1 & 2");
print("----------------------------------------------------");

// Create branches collection with geospatial data (used across all labs)
print("Creating branches collection...");
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

print("✓ Created " + db.branches.countDocuments() + " insurance branches");

// Lab 3: CRUD Create and Insert Operations
print("\n🏢 Loading data for Lab 3: CRUD Create and Insert");
print("------------------------------------------------");

// Create policies collection with sample policies
print("Creating insurance policies...");
db.policies.insertMany([
  {
    _id: ObjectId(),
    policyNumber: "POL-AUTO-001",
    name: "Premium Auto Coverage",
    policyType: "Auto",
    annualPremium: 1299.99,
    coverageDetails: {
      liability: "250000/500000",
      collision: { deductible: 500, coverage: "Full" },
      comprehensive: { deductible: 250, coverage: "Full" }
    },
    coverageTypes: ["liability", "collision", "comprehensive"],
    isActive: true,
    createdAt: new Date("2024-01-15"),
    expirationDate: new Date("2025-01-15")
  },
  {
    _id: ObjectId(),
    policyNumber: "POL-HOME-001",
    name: "Homeowners Protection",
    policyType: "Property",
    annualPremium: 1899.99,
    coverageDetails: {
      dwelling: { coverage: 400000, deductible: 1000 },
      personalProperty: { coverage: 200000, deductible: 500 },
      liability: 300000
    },
    coverageTypes: ["dwelling", "personal_property", "liability"],
    isActive: true,
    createdAt: new Date("2024-02-01"),
    expirationDate: new Date("2025-02-01")
  },
  {
    _id: ObjectId(),
    policyNumber: "POL-LIFE-001",
    name: "Term Life Insurance",
    policyType: "Life",
    annualPremium: 599.99,
    coverageDetails: {
      deathBenefit: 500000,
      term: "20 years",
      beneficiaries: "Spouse and Children"
    },
    coverageTypes: ["death_benefit", "accidental_death"],
    isActive: true,
    createdAt: new Date("2024-03-01"),
    expirationDate: new Date("2044-03-01")
  }
]);

print("✓ Created " + db.policies.countDocuments() + " insurance policies");

// Create customers collection
print("Creating insurance customers...");
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
    dateOfBirth: new Date("1985-06-15"),
    customerType: "individual",
    riskScore: 75,
    registrationDate: new Date("2024-01-10"),
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
    dateOfBirth: new Date("1978-03-22"),
    customerType: "family",
    riskScore: 60,
    registrationDate: new Date("2024-02-15"),
    isActive: true
  },
  {
    _id: ObjectId(),
    customerId: "CUST000003",
    firstName: "Michael",
    lastName: "Davis",
    email: "michael.davis@business.com",
    phone: "+1-555-0103",
    address: {
      street: "789 Business Plaza",
      city: "New York",
      state: "NY",
      zipCode: "10002"
    },
    dateOfBirth: new Date("1972-11-08"),
    customerType: "business",
    riskScore: 45,
    registrationDate: new Date("2024-03-01"),
    isActive: true
  }
]);

print("✓ Created " + db.customers.countDocuments() + " insurance customers");

// Lab 4: CRUD Read and Query Operations
print("\n🔍 Loading data for Lab 4: CRUD Read and Query");
print("----------------------------------------------");

// Add more policies for querying examples
print("Adding additional policies for query examples...");
db.policies.insertMany([
  {
    _id: ObjectId(),
    policyNumber: "POL-AUTO-002",
    name: "Standard Auto Coverage",
    policyType: "Auto",
    annualPremium: 899.99,
    coverageDetails: {
      liability: "100000/300000",
      collision: { deductible: 1000, coverage: "Limited" }
    },
    coverageTypes: ["liability", "collision"],
    isActive: true,
    createdAt: new Date("2024-01-20")
  },
  {
    _id: ObjectId(),
    policyNumber: "POL-COMM-001",
    name: "Business Liability",
    policyType: "Commercial",
    annualPremium: 2499.99,
    coverageDetails: {
      generalLiability: 2000000,
      productLiability: 1000000,
      businessType: "Technology"
    },
    coverageTypes: ["general_liability", "product_liability"],
    isActive: true,
    createdAt: new Date("2024-02-10")
  },
  {
    _id: ObjectId(),
    policyNumber: "POL-AUTO-003",
    name: "Economy Auto Coverage",
    policyType: "Auto",
    annualPremium: 649.99,
    coverageDetails: {
      liability: "50000/100000"
    },
    coverageTypes: ["liability"],
    isActive: false,
    createdAt: new Date("2023-12-01")
  }
]);

// Add agents for relationship queries
print("Creating insurance agents...");
db.agents.insertMany([
  {
    _id: ObjectId(),
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
    hireDate: new Date("2022-03-15")
  },
  {
    _id: ObjectId(),
    agentId: "AGT002",
    firstName: "David",
    lastName: "Thompson",
    email: "david.thompson@insuranceco.com",
    phone: "+1-555-0202",
    branchId: "BR002",
    territory: "Chicago Loop",
    specialties: ["Commercial", "Life"],
    licenseNumber: "LIC-IL-67890",
    isActive: true,
    hireDate: new Date("2021-08-22")
  }
]);

print("✓ Created " + db.agents.countDocuments() + " insurance agents");

// Lab 5: CRUD Update and Delete Operations
print("\n✏️ Loading data for Lab 5: CRUD Update and Delete");
print("------------------------------------------------");

// Add claims for update/delete examples
print("Creating insurance claims...");
db.claims.insertMany([
  {
    _id: ObjectId(),
    claimNumber: "CLM-2024-001001",
    customerId: "CUST000001",
    policyNumber: "POL-AUTO-001",
    claimType: "Auto Accident",
    claimAmount: 8500.00,
    deductible: 500.00,
    status: "submitted",
    incidentDate: new Date("2024-03-15"),
    incidentDescription: "Rear-end collision at intersection",
    adjusterAssigned: "ADJ001",
    createdAt: new Date("2024-03-16")
  },
  {
    _id: ObjectId(),
    claimNumber: "CLM-2024-001002",
    customerId: "CUST000002",
    policyNumber: "POL-HOME-001",
    claimType: "Property Damage",
    claimAmount: 15000.00,
    deductible: 1000.00,
    status: "under_review",
    incidentDate: new Date("2024-03-10"),
    incidentDescription: "Water damage from burst pipe",
    adjusterAssigned: "ADJ002",
    createdAt: new Date("2024-03-11")
  },
  {
    _id: ObjectId(),
    claimNumber: "CLM-2024-001003",
    customerId: "CUST000001",
    policyNumber: "POL-AUTO-001",
    claimType: "Theft",
    claimAmount: 2500.00,
    deductible: 250.00,
    status: "approved",
    incidentDate: new Date("2024-02-28"),
    incidentDescription: "Vehicle break-in and theft of personal items",
    adjusterAssigned: "ADJ001",
    settledAmount: 2250.00,
    createdAt: new Date("2024-03-01"),
    settledAt: new Date("2024-03-10")
  }
]);

print("✓ Created " + db.claims.countDocuments() + " insurance claims");

// Add payments for transaction examples
print("Creating payment records...");
db.payments.insertMany([
  {
    _id: ObjectId(),
    paymentId: "PAY-2024-001001",
    customerId: "CUST000001",
    policyNumber: "POL-AUTO-001",
    amount: 108.33,
    paymentType: "premium",
    paymentMethod: "auto_debit",
    status: "completed",
    paymentDate: new Date("2024-01-15"),
    dueDate: new Date("2024-01-15")
  },
  {
    _id: ObjectId(),
    paymentId: "PAY-2024-001002",
    customerId: "CUST000002",
    policyNumber: "POL-HOME-001",
    amount: 158.33,
    paymentType: "premium",
    paymentMethod: "credit_card",
    status: "completed",
    paymentDate: new Date("2024-02-01"),
    dueDate: new Date("2024-02-01")
  },
  {
    _id: ObjectId(),
    paymentId: "PAY-2024-001003",
    customerId: "CUST000001",
    claimNumber: "CLM-2024-001003",
    amount: 2250.00,
    paymentType: "claim_settlement",
    paymentMethod: "check",
    status: "completed",
    paymentDate: new Date("2024-03-10")
  }
]);

print("✓ Created " + db.payments.countDocuments() + " payment records");

// ===========================================
// Create Indexes for Performance
// ===========================================

print("\n🔧 Creating indexes for optimal performance");
print("------------------------------------------");

// Geospatial index for branches
db.branches.createIndex({ location: "2dsphere" });

// Policy indexes
db.policies.createIndex({ policyNumber: 1 }, { unique: true });
db.policies.createIndex({ policyType: 1, isActive: 1 });
db.policies.createIndex({ annualPremium: 1 });

// Customer indexes
db.customers.createIndex({ customerId: 1 }, { unique: true });
db.customers.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ "address.state": 1, customerType: 1 });

// Claims indexes
db.claims.createIndex({ claimNumber: 1 }, { unique: true });
db.claims.createIndex({ customerId: 1, status: 1 });
db.claims.createIndex({ incidentDate: 1 });

// Agent indexes
db.agents.createIndex({ agentId: 1 }, { unique: true });
db.agents.createIndex({ branchId: 1, territory: 1 });

// Payment indexes
db.payments.createIndex({ paymentId: 1 }, { unique: true });
db.payments.createIndex({ customerId: 1, paymentDate: -1 });

print("✓ Created performance indexes");

// ===========================================
// Validation and Summary
// ===========================================

print("\n📊 Data loading validation");
print("-------------------------");

var validation = {
  branches: db.branches.countDocuments(),
  policies: db.policies.countDocuments(),
  customers: db.customers.countDocuments(),
  agents: db.agents.countDocuments(),
  claims: db.claims.countDocuments(),
  payments: db.payments.countDocuments()
};

print("Collections created:");
print("- Branches: " + validation.branches);
print("- Policies: " + validation.policies);
print("- Customers: " + validation.customers);
print("- Agents: " + validation.agents);
print("- Claims: " + validation.claims);
print("- Payments: " + validation.payments);

// Verify indexes
print("\nIndexes created:");
["branches", "policies", "customers", "agents", "claims", "payments"].forEach(function(coll) {
  var indexes = db.getCollection(coll).getIndexes();
  print("- " + coll + ": " + indexes.length + " indexes");
});

print("\n=======================================================");
print("✅ DAY 1 INSURANCE DATA LOADING COMPLETE!");
print("=======================================================");
print("All data for MongoDB Day 1 labs has been loaded successfully.");
print("");
print("You can now proceed with any Day 1 lab:");
print("- Lab 1: MongoDB Shell Mastery");
print("- Lab 2: Database and Collection Management");
print("- Lab 3: CRUD Operations - Create and Insert");
print("- Lab 4: CRUD Operations - Read and Query");
print("- Lab 5: CRUD Operations - Update and Delete");
print("");
print("To reload this data at any time, run:");
print("mongosh < day1_data_loader.js");
print("=======================================================");