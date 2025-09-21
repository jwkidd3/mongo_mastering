// ===== DAY 2 DATA LOADER SCRIPT =====
// MongoDB Day 2 Labs - Insurance Analytics Data Loader
// Usage: mongosh < day2_data_loader.js
// Purpose: Load all data needed for Day 2 labs or reset after completion

print("=======================================================");
print("MongoDB Day 2 Labs - Insurance Analytics Data Loader");
print("=======================================================");
print("Loading insurance analytics data for Day 2 labs...");
print("Labs covered: Advanced Querying, Data Modeling, Indexing");
print("=======================================================\n");

// ===========================================
// Database Setup
// ===========================================

print("🔧 Setting up insurance_analytics database");
print("------------------------------------------");

// Switch to analytics database
use insurance_analytics;

// Drop existing collections to start fresh
print("Cleaning existing collections...");
db.policy_types.drop();
db.branches.drop();
db.policies.drop();
db.customers.drop();
db.claims.drop();
db.agents.drop();
db.vehicles.drop();
db.properties.drop();
db.reviews.drop();

print("✓ Cleaned existing collections");

// ===========================================
// Lab 1: Advanced Querying and Aggregation
// ===========================================

print("\n🔍 Loading data for Lab 1: Advanced Querying and Aggregation");
print("------------------------------------------------------------");

// Load policy types for hierarchical queries
print("Creating policy types hierarchy...");
db.policy_types.insertMany([
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890001"),
    name: "Auto Insurance",
    code: "AUTO",
    description: "Vehicle insurance coverage",
    parentType: null,
    level: 1,
    isActive: true,
    baseRates: {
      liability: 50.00,
      collision: 35.00,
      comprehensive: 25.00
    }
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890002"),
    name: "Liability Coverage",
    code: "AUTO_LIABILITY",
    description: "Covers damages to other parties",
    parentType: ObjectId("65f1a1b1c2d3e4f567890001"),
    level: 2,
    isActive: true
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890003"),
    name: "Property Insurance",
    code: "PROPERTY",
    description: "Home and property coverage",
    parentType: null,
    level: 1,
    isActive: true,
    baseRates: {
      dwelling: 120.00,
      personal_property: 60.00,
      liability: 40.00
    }
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890004"),
    name: "Life Insurance",
    code: "LIFE",
    description: "Life insurance policies",
    parentType: null,
    level: 1,
    isActive: true,
    baseRates: {
      term: 25.00,
      whole: 150.00
    }
  }
]);

print("✓ Created " + db.policy_types.countDocuments() + " policy types");

// Load branches with geospatial data for territory queries
print("Creating branch locations...");
db.branches.insertMany([
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892001"),
    branchCode: "BR-NYC-001",
    name: "Manhattan Financial District",
    address: {
      street: "123 Wall Street",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    },
    location: {
      type: "Point",
      coordinates: [-73.9857, 40.7484]
    },
    manager: "Sarah Johnson",
    agentCount: 25,
    territory: "Manhattan",
    specialties: ["Auto", "Commercial", "Property"]
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892002"),
    branchCode: "BR-BRK-001",
    name: "Brooklyn Heights Branch",
    address: {
      street: "456 Brooklyn Heights Promenade",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11201"
    },
    location: {
      type: "Point",
      coordinates: [-73.9442, 40.6892]
    },
    manager: "Michael Chen",
    agentCount: 18,
    territory: "Brooklyn",
    specialties: ["Auto", "Home", "Life"]
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892003"),
    branchCode: "BR-CHI-001",
    name: "Chicago Loop Branch",
    address: {
      street: "789 Michigan Avenue",
      city: "Chicago",
      state: "IL",
      zipCode: "60601"
    },
    location: {
      type: "Point",
      coordinates: [-87.6298, 41.8781]
    },
    manager: "Jennifer Davis",
    agentCount: 22,
    territory: "Chicago Loop",
    specialties: ["Auto", "Commercial", "Property"]
  }
]);

// Create geospatial index
db.branches.createIndex({ location: "2dsphere" });
print("✓ Created " + db.branches.countDocuments() + " branch locations");

// Load comprehensive policies for advanced querying
print("Creating comprehensive policy dataset...");
var policies = [];
var policyTemplates = [
  {
    name: "Premium Auto Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890001"),
    category: "Auto",
    annualPremium: 1299.99,
    coverageTypes: ["liability", "collision", "comprehensive"],
    provider: "SafeDrive Insurance"
  },
  {
    name: "Standard Auto Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890001"),
    category: "Auto",
    annualPremium: 899.99,
    coverageTypes: ["liability", "collision"],
    provider: "ValueShield Insurance"
  },
  {
    name: "Homeowners Comprehensive",
    policyType: ObjectId("65f1a1b1c2d3e4f567890003"),
    category: "Property",
    annualPremium: 1899.99,
    coverageTypes: ["dwelling", "personal_property", "liability"],
    provider: "HomeGuard Insurance"
  },
  {
    name: "Term Life Insurance",
    policyType: ObjectId("65f1a1b1c2d3e4f567890004"),
    category: "Life",
    annualPremium: 599.99,
    coverageTypes: ["death_benefit", "accidental_death"],
    provider: "LifeSecure Insurance"
  }
];

// Generate 50 policies with variations for aggregation examples
for (let i = 0; i < 50; i++) {
  var template = policyTemplates[i % policyTemplates.length];
  var variation = Math.floor(i / policyTemplates.length);

  policies.push({
    _id: new ObjectId(),
    policyNumber: "POL-" + template.category.toUpperCase() + "-" + String(i + 1).padStart(3, '0'),
    name: template.name + (variation > 0 ? ` (Plan ${variation + 1})` : ""),
    policyType: template.policyType,
    category: template.category,
    provider: template.provider,
    annualPremium: Math.round((template.annualPremium + (Math.random() * 400 - 200)) * 100) / 100,
    coverageTypes: [...template.coverageTypes],
    riskAssessment: {
      score: Math.floor(Math.random() * 100) + 1,
      factors: ["age", "location", "history"].filter(() => Math.random() > 0.5),
      lastUpdated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    },
    isActive: Math.random() > 0.1,
    customerRating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
  });
}

db.policies.insertMany(policies);
print("✓ Created " + db.policies.countDocuments() + " policies for aggregation");

// Load customers with risk segmentation data
print("Creating customer dataset with risk profiles...");
var customers = [];
var firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Lisa", "Robert", "Jennifer", "William", "Mary"];
var lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
var cities = ["New York", "Brooklyn", "Chicago", "Los Angeles", "Houston"];
var states = ["NY", "IL", "CA", "TX"];

for (let i = 0; i < 100; i++) {
  var premiumValue = Math.round((Math.random() * 4000 + 500) * 100) / 100;
  var riskLevel = premiumValue > 2500 ? "high" : (premiumValue > 1500 ? "medium" : "low");

  customers.push({
    _id: new ObjectId(),
    customerId: "CUST" + String(i + 1).padStart(6, '0'),
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    email: `customer${i + 1}@example.com`,
    address: {
      street: `${Math.floor(Math.random() * 999) + 1} ${["Main", "Oak", "Pine", "Cedar"][Math.floor(Math.random() * 4)]} St`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    },
    customerType: ["individual", "family", "business"][Math.floor(Math.random() * 3)],
    totalPremiumValue: premiumValue,
    riskLevel: riskLevel,
    claimHistory: {
      totalClaims: Math.floor(Math.random() * 5),
      totalClaimAmount: Math.round(Math.random() * 25000 * 100) / 100,
      riskFactors: ["age", "location", "driving_record", "credit_score"].filter(() => Math.random() > 0.6)
    },
    isActive: Math.random() > 0.05,
    registrationDate: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000)
  });
}

db.customers.insertMany(customers);
print("✓ Created " + db.customers.countDocuments() + " customers with risk profiles");

// Load claims for aggregation analysis
print("Creating claims dataset for analytics...");
var customerIds = db.customers.find({}, {_id: 1}).toArray().map(c => c._id);
var claims = [];
var claimTypes = ["Auto Accident", "Property Damage", "Theft", "Fire", "Water Damage", "Medical"];

for (let i = 0; i < 200; i++) {
  var customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
  var claimAmount = Math.round((Math.random() * 20000 + 500) * 100) / 100;
  var status = ["submitted", "under_review", "approved", "denied", "settled"][Math.floor(Math.random() * 5)];

  claims.push({
    _id: new ObjectId(),
    claimNumber: "CLM-2024-" + String(i + 1).padStart(6, '0'),
    customerId: customerId,
    claimType: claimTypes[Math.floor(Math.random() * claimTypes.length)],
    claimAmount: claimAmount,
    status: status,
    priority: claimAmount > 10000 ? "high" : (claimAmount > 5000 ? "medium" : "low"),
    incidentDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    adjusterAssigned: "ADJ" + String(Math.floor(Math.random() * 10) + 1).padStart(3, '0'),
    territory: ["Manhattan", "Brooklyn", "Chicago Loop"][Math.floor(Math.random() * 3)],
    settlementAmount: status === "settled" ? Math.round(claimAmount * 0.9 * 100) / 100 : null,
    fraudFlag: Math.random() > 0.95 ? "flagged" : "clear"
  });
}

db.claims.insertMany(claims);
print("✓ Created " + db.claims.countDocuments() + " claims for analysis");

// ===========================================
// Lab 2: Data Modeling and Schema Design
// ===========================================

print("\n📋 Loading data for Lab 2: Data Modeling and Schema Design");
print("---------------------------------------------------------");

// Create agents with detailed profiles for schema design examples
print("Creating agent profiles with complex schemas...");
db.agents.insertMany([
  {
    _id: new ObjectId(),
    agentId: "AGT001",
    personalInfo: {
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "emily.rodriguez@insuranceco.com",
      phone: "+1-555-0201",
      licenseNumber: "LIC-NY-12345",
      licenseExpiration: new Date("2025-06-15")
    },
    employment: {
      branchId: ObjectId("65f1a1b1c2d3e4f567892001"),
      territory: "Manhattan",
      hireDate: new Date("2022-03-15"),
      position: "Senior Agent",
      specialties: ["Auto", "Property", "Commercial"]
    },
    performance: {
      monthlyQuota: 50000.00,
      quarterlyRevenue: 145000.00,
      customerSatisfaction: 4.7,
      certifications: ["Auto Specialist", "Property Expert"]
    },
    contactPreferences: {
      primaryContact: "email",
      workingHours: {
        monday: "8:00-17:00",
        tuesday: "8:00-17:00",
        wednesday: "8:00-17:00",
        thursday: "8:00-17:00",
        friday: "8:00-17:00"
      },
      languages: ["English", "Spanish"]
    }
  },
  {
    _id: new ObjectId(),
    agentId: "AGT002",
    personalInfo: {
      firstName: "David",
      lastName: "Thompson",
      email: "david.thompson@insuranceco.com",
      phone: "+1-555-0202",
      licenseNumber: "LIC-IL-67890",
      licenseExpiration: new Date("2024-12-20")
    },
    employment: {
      branchId: ObjectId("65f1a1b1c2d3e4f567892003"),
      territory: "Chicago Loop",
      hireDate: new Date("2021-08-22"),
      position: "Commercial Specialist",
      specialties: ["Commercial", "Life", "Cyber"]
    },
    performance: {
      monthlyQuota: 75000.00,
      quarterlyRevenue: 220000.00,
      customerSatisfaction: 4.9,
      certifications: ["Commercial Expert", "Cyber Security Specialist"]
    },
    contactPreferences: {
      primaryContact: "phone",
      workingHours: {
        monday: "7:00-18:00",
        tuesday: "7:00-18:00",
        wednesday: "7:00-18:00",
        thursday: "7:00-18:00",
        friday: "7:00-16:00"
      },
      languages: ["English"]
    }
  }
]);

print("✓ Created " + db.agents.countDocuments() + " agent profiles");

// Create vehicles and properties for asset modeling
print("Creating insured assets (vehicles and properties)...");
db.vehicles.insertMany([
  {
    _id: new ObjectId(),
    vin: "1HGBH41JXMN109186",
    customerId: customerIds[0],
    make: "Honda",
    model: "Civic",
    year: 2020,
    color: "Blue",
    engineSize: "1.5L",
    fuelType: "Gasoline",
    currentValue: 18500.00,
    insuranceInfo: {
      policyNumber: "POL-AUTO-001",
      coverageTypes: ["liability", "collision", "comprehensive"],
      deductible: 500.00,
      annualPremium: 1299.99
    },
    safetyFeatures: ["ABS", "Airbags", "Backup Camera", "Lane Assist"],
    riskFactors: {
      age: 4,
      mileage: 45000,
      accidentHistory: [],
      securityFeatures: ["Alarm", "Remote Start"]
    }
  },
  {
    _id: new ObjectId(),
    vin: "2T1BURHE0JC123456",
    customerId: customerIds[1],
    make: "Toyota",
    model: "Corolla",
    year: 2018,
    color: "White",
    engineSize: "1.8L",
    fuelType: "Gasoline",
    currentValue: 16200.00,
    insuranceInfo: {
      policyNumber: "POL-AUTO-002",
      coverageTypes: ["liability", "collision"],
      deductible: 1000.00,
      annualPremium: 899.99
    },
    safetyFeatures: ["ABS", "Airbags", "Electronic Stability Control"],
    riskFactors: {
      age: 6,
      mileage: 67000,
      accidentHistory: ["Minor Fender Bender - 2022"],
      securityFeatures: ["Factory Alarm"]
    }
  }
]);

db.properties.insertMany([
  {
    _id: new ObjectId(),
    propertyId: "PROP-001",
    customerId: customerIds[0],
    propertyType: "Single Family Home",
    address: {
      street: "123 Elm Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      coordinates: { lat: 40.7505, lng: -73.9876 }
    },
    propertyDetails: {
      yearBuilt: 1995,
      squareFootage: 2400,
      bedrooms: 4,
      bathrooms: 3,
      garageSpaces: 2,
      lotSize: 0.25,
      constructionType: "Frame",
      roofType: "Asphalt Shingle"
    },
    insuranceInfo: {
      policyNumber: "POL-HOME-001",
      dwellingCoverage: 400000.00,
      personalPropertyCoverage: 200000.00,
      liabilityCoverage: 300000.00,
      deductible: 1000.00,
      annualPremium: 1899.99
    },
    riskAssessment: {
      floodZone: "X",
      earthquakeRisk: "Low",
      hurricaneRisk: "Medium",
      crimeRate: "Low",
      fireProtectionClass: 3,
      nearestFireStation: 0.8
    },
    safetyFeatures: ["Smoke Detectors", "Security System", "Fire Extinguisher", "Carbon Monoxide Detector"]
  }
]);

print("✓ Created vehicles and properties datasets");

// ===========================================
// Lab 3: Indexing and Performance Optimization
// ===========================================

print("\n🚀 Loading data for Lab 3: Indexing and Performance");
print("--------------------------------------------------");

// Create agent reviews for text indexing examples
print("Creating agent reviews for text search optimization...");
var reviews = [];
var reviewTexts = [
  "Excellent service and very knowledgeable about auto insurance options. Helped me save money.",
  "Professional and responsive. Handled my claim quickly and efficiently.",
  "Great experience with home insurance. Agent was thorough and patient.",
  "Outstanding customer service. Highly recommend for commercial insurance needs.",
  "Good communication throughout the policy setup process. Very satisfied.",
  "Agent was helpful but could be more proactive in follow-up communications.",
  "Smooth claims process and fair settlement. Will continue with this agent.",
  "Knowledgeable about life insurance products and provided excellent guidance."
];

var agentIds = db.agents.find({}, {_id: 1}).toArray().map(a => a._id);

for (let i = 0; i < 100; i++) {
  reviews.push({
    _id: new ObjectId(),
    agentId: agentIds[Math.floor(Math.random() * agentIds.length)],
    customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
    rating: Math.floor(Math.random() * 5) + 1,
    reviewText: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
    serviceType: ["new_policy", "claim_processing", "policy_renewal", "consultation"][Math.floor(Math.random() * 4)],
    reviewDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    verified: Math.random() > 0.1,
    helpful: Math.floor(Math.random() * 20)
  });
}

db.reviews.insertMany(reviews);
print("✓ Created " + db.reviews.countDocuments() + " agent reviews");

// ===========================================
// Create Optimized Indexes
// ===========================================

print("\n🔧 Creating optimized indexes for Day 2 labs");
print("--------------------------------------------");

// Text search indexes
db.policies.createIndex({
  "name": "text",
  "category": "text",
  "coverageTypes": "text"
}, {
  weights: { name: 10, category: 5, coverageTypes: 1 },
  name: "policy_text_search"
});

db.reviews.createIndex({
  "reviewText": "text"
}, {
  name: "review_text_search"
});

// Geospatial indexes
db.branches.createIndex({ location: "2dsphere" });
db.properties.createIndex({ "address.coordinates": "2dsphere" });

// Compound indexes for aggregation performance
db.claims.createIndex({ customerId: 1, status: 1, incidentDate: -1 });
db.policies.createIndex({ category: 1, annualPremium: 1, isActive: 1 });
db.customers.createIndex({ riskLevel: 1, totalPremiumValue: -1 });

// Performance indexes
db.policies.createIndex({ policyType: 1, isActive: 1 });
db.claims.createIndex({ territory: 1, priority: 1 });
db.agents.createIndex({ "employment.branchId": 1, "employment.specialties": 1 });

print("✓ Created performance indexes");

// ===========================================
// Data Validation and Summary
// ===========================================

print("\n📊 Day 2 data loading validation");
print("--------------------------------");

var validation = {
  policy_types: db.policy_types.countDocuments(),
  branches: db.branches.countDocuments(),
  policies: db.policies.countDocuments(),
  customers: db.customers.countDocuments(),
  claims: db.claims.countDocuments(),
  agents: db.agents.countDocuments(),
  vehicles: db.vehicles.countDocuments(),
  properties: db.properties.countDocuments(),
  reviews: db.reviews.countDocuments()
};

print("Collections created:");
Object.keys(validation).forEach(function(key) {
  print("- " + key + ": " + validation[key]);
});

// Verify text search capability
print("\nText search validation:");
var textSearchTest = db.policies.find({$text: {$search: "auto"}}).limit(1).toArray();
print("- Policy text search: " + (textSearchTest.length > 0 ? "✓ Working" : "✗ Failed"));

var reviewSearchTest = db.reviews.find({$text: {$search: "excellent"}}).limit(1).toArray();
print("- Review text search: " + (reviewSearchTest.length > 0 ? "✓ Working" : "✗ Failed"));

// Verify geospatial capability
var geoTest = db.branches.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] },
      $maxDistance: 1000
    }
  }
}).limit(1).toArray();
print("- Geospatial search: " + (geoTest.length > 0 ? "✓ Working" : "✗ Failed"));

print("\n=======================================================");
print("✅ DAY 2 INSURANCE ANALYTICS DATA LOADING COMPLETE!");
print("=======================================================");
print("All data for MongoDB Day 2 labs has been loaded successfully.");
print("");
print("Advanced features ready:");
print("- Text search indexes for policy and review content");
print("- Geospatial indexes for territory-based queries");
print("- Complex aggregation datasets with risk analytics");
print("- Comprehensive schema examples for data modeling");
print("- Performance-optimized indexes for lab exercises");
print("");
print("You can now proceed with any Day 2 lab:");
print("- Lab 1: Advanced Querying and Aggregation Framework");
print("- Lab 2: Data Modeling and Schema Design");
print("- Lab 3: Indexing Strategies and Performance Optimization");
print("");
print("To reload this data at any time, run:");
print("mongosh < day2_data_loader.js");
print("=======================================================");