# Manual Day 2 Data Setup

This guide provides step-by-step instructions for manually loading Day 2 data if the automated `day2_data_loader.js` script cannot be used.

## Prerequisites

- MongoDB replica set running (see `../scripts/setup.sh`)
- MongoDB Shell (mongosh) installed and accessible
- Day 1 data already loaded (required -- Day 2 adds to existing Day 1 data)

## Overview

Day 2 does **not** replace Day 1 data. It upserts additional fields onto existing documents and adds a new `reviews` collection. All upserts use `updateOne` with `{upsert: true}` so the setup is safe to rerun.

## Manual Data Loading Steps

### 1. Connect to MongoDB

```bash
mongosh
```

### 2. Switch to the Insurance Database

```javascript
use insurance_company
```

### 3. Clean Day 2-Specific Collections

Only drop collections that are unique to Day 2. Do **not** drop `policies`, `customers`, `claims`, `agents`, or `branches` -- those contain Day 1 data.

```javascript
db.reviews.drop();
db.audit_logs.drop();

print("Cleaned Day 2-specific collections");
print("Note: Preserving Day 1 data in policies, customers, claims, agents, branches");
```

### 4. Upsert Branches (3 Branches)

These branches include `performanceMetrics` and GeoJSON `location` fields needed for Day 2 labs.

```javascript
db.branches.updateOne(
  { _id: "BR001" },
  { $set: {
    branchCode: "BR-NY-001",
    name: "New York Financial District",
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
    agentCount: 15,
    performanceMetrics: {
      monthlyRevenue: 245000.50,
      customerSatisfaction: 4.8,
      claimsProcessed: 125
    },
    specialties: ["Auto", "Property", "Life"],
    isActive: true,
    openDate: new Date("2020-01-15")
  }},
  { upsert: true }
);

db.branches.updateOne(
  { _id: "BR002" },
  { $set: {
    branchCode: "BR-CA-002",
    name: "Los Angeles West Side",
    address: {
      street: "456 Sunset Blvd",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210"
    },
    location: {
      type: "Point",
      coordinates: [-118.2437, 34.0522]
    },
    manager: "Michael Chen",
    agentCount: 22,
    performanceMetrics: {
      monthlyRevenue: 325000.75,
      customerSatisfaction: 4.6,
      claimsProcessed: 180
    },
    specialties: ["Auto", "Commercial", "Cyber"],
    isActive: true,
    openDate: new Date("2019-05-20")
  }},
  { upsert: true }
);

db.branches.updateOne(
  { _id: "BR003" },
  { $set: {
    branchCode: "BR-TX-003",
    name: "Houston Energy Corridor",
    address: {
      street: "789 Energy Plaza",
      city: "Houston",
      state: "TX",
      zipCode: "77042"
    },
    location: {
      type: "Point",
      coordinates: [-95.3698, 29.7604]
    },
    manager: "Jennifer Rodriguez",
    agentCount: 18,
    performanceMetrics: {
      monthlyRevenue: 285000.25,
      customerSatisfaction: 4.7,
      claimsProcessed: 155
    },
    specialties: ["Commercial", "Cyber", "Health"],
    isActive: true,
    openDate: new Date("2021-03-10")
  }},
  { upsert: true }
);

print("Upserted branches - total: " + db.branches.countDocuments());
```

### 5. Upsert Policies (3 Policies)

These policies add `riskScore` and `claimsHistory` fields used in Day 2 advanced querying and aggregation labs.

```javascript
db.policies.updateOne(
  { policyNumber: "POL-AUTO-2024-001" },
  { $set: {
    policyNumber: "POL-AUTO-2024-001",
    name: "Premium Auto Coverage",
    policyType: "Auto",
    customerId: "CUST000001",
    annualPremium: 1299.99,
    coverageDetails: {
      liability: "250000/500000",
      collision: {
        deductible: 500,
        coverage: "Full"
      }
    },
    coverageTypes: ["liability", "collision"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    expirationDate: new Date("2025-01-01"),
    agentId: "AGT001",
    branchId: "BR001",
    riskScore: 50,
    claimsHistory: []
  }},
  { upsert: true }
);

db.policies.updateOne(
  { policyNumber: "POL-HOME-2024-002" },
  { $set: {
    policyNumber: "POL-HOME-2024-002",
    name: "Homeowners Protection Plus",
    policyType: "Property",
    customerId: "CUST000002",
    annualPremium: 1899.99,
    coverageDetails: {
      dwelling: {
        coverage: 400000,
        deductible: 1000
      },
      personalProperty: {
        coverage: 200000,
        deductible: 500
      }
    },
    coverageTypes: ["dwelling", "personal_property"],
    isActive: true,
    createdAt: new Date("2024-02-01"),
    expirationDate: new Date("2025-02-01"),
    agentId: "AGT002",
    branchId: "BR002",
    riskScore: 60,
    claimsHistory: []
  }},
  { upsert: true }
);

db.policies.updateOne(
  { policyNumber: "POL-LIFE-2024-003" },
  { $set: {
    policyNumber: "POL-LIFE-2024-003",
    name: "Term Life Insurance Deluxe",
    policyType: "Life",
    customerId: "CUST000003",
    annualPremium: 599.99,
    coverageDetails: {
      deathBenefit: 500000,
      term: "20 years"
    },
    coverageTypes: ["death_benefit"],
    isActive: true,
    createdAt: new Date("2024-03-01"),
    expirationDate: new Date("2044-03-01"),
    agentId: "AGT003",
    branchId: "BR003",
    riskScore: 45,
    claimsHistory: []
  }},
  { upsert: true }
);

print("Upserted Day 2 policies - total policies: " + db.policies.countDocuments());
```

### 6. Upsert Customers (3 Customers)

These customers add `riskProfile` and `loyaltyProgram` fields used in Day 2 analytics and aggregation labs.

```javascript
db.customers.updateOne(
  { customerId: "CUST000001" },
  { $set: {
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
    riskProfile: {
      score: 75,
      category: "medium",
      factors: ["good_credit", "safe_driver"]
    },
    premiumTotal: 2850.99,
    policies: ["POL-AUTO-2024-001", "POL-HOME-2024-002"],
    registrationDate: new Date("2024-01-10"),
    isActive: true,
    loyaltyProgram: {
      tier: "gold",
      points: 1250,
      memberSince: new Date("2022-01-10")
    }
  }},
  { upsert: true }
);

db.customers.updateOne(
  { customerId: "CUST000002" },
  { $set: {
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
    riskProfile: {
      score: 60,
      category: "low",
      factors: ["excellent_credit", "homeowner", "multiple_policies"]
    },
    premiumTotal: 3250.75,
    policies: ["POL-HOME-2024-003", "POL-LIFE-2024-004"],
    registrationDate: new Date("2024-02-15"),
    isActive: true,
    loyaltyProgram: {
      tier: "platinum",
      points: 2850,
      memberSince: new Date("2020-02-15")
    }
  }},
  { upsert: true }
);

db.customers.updateOne(
  { customerId: "CUST000003" },
  { $set: {
    customerId: "CUST000003",
    firstName: "Michael",
    lastName: "Davis",
    email: "michael.davis@business.com",
    phone: "+1-555-0103",
    address: {
      street: "789 Business Plaza",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210"
    },
    dateOfBirth: new Date("1972-11-08"),
    customerType: "business",
    riskProfile: {
      score: 45,
      category: "high",
      factors: ["business_owner", "high_value_assets"]
    },
    premiumTotal: 5850.50,
    policies: ["POL-COMMERCIAL-2024-001", "POL-CYBER-2024-001"],
    registrationDate: new Date("2024-03-01"),
    isActive: true,
    loyaltyProgram: {
      tier: "diamond",
      points: 4200,
      memberSince: new Date("2019-03-01")
    }
  }},
  { upsert: true }
);

print("Upserted Day 2 customers - total customers: " + db.customers.countDocuments());
```

### 7. Upsert Claims (3 Claims)

These claims add `severityLevel`, `location` (GeoJSON), `processingTime`, and `fraudIndicators` fields used in Day 2 analytics.

```javascript
db.claims.updateOne(
  { claimNumber: "CLM-2024-001001" },
  { $set: {
    claimNumber: "CLM-2024-001001",
    customerId: "CUST000001",
    policyNumber: "POL-AUTO-2024-001",
    claimType: "Auto Accident",
    claimAmount: 8500.00,
    deductible: 500.00,
    status: "approved",
    incidentDate: new Date("2024-03-15"),
    incidentDescription: "Rear-end collision at intersection",
    adjusterAssigned: "ADJ001",
    settledAmount: 8000.00,
    processingTime: 15,
    fraudIndicators: [],
    severityLevel: "moderate",
    location: {
      type: "Point",
      coordinates: [-73.9857, 40.7484]
    },
    witnesses: 2,
    policeReport: true,
    createdAt: new Date("2024-03-16"),
    settledAt: new Date("2024-03-31")
  }},
  { upsert: true }
);

db.claims.updateOne(
  { claimNumber: "CLM-2024-001002" },
  { $set: {
    claimNumber: "CLM-2024-001002",
    customerId: "CUST000002",
    policyNumber: "POL-HOME-2024-002",
    claimType: "Water Damage",
    claimAmount: 15000.00,
    deductible: 1000.00,
    status: "under_review",
    incidentDate: new Date("2024-03-10"),
    incidentDescription: "Pipe burst in basement causing extensive water damage",
    adjusterAssigned: "ADJ002",
    settledAmount: null,
    processingTime: null,
    fraudIndicators: [],
    severityLevel: "major",
    location: {
      type: "Point",
      coordinates: [-87.6298, 41.8781]
    },
    witnesses: 0,
    policeReport: false,
    createdAt: new Date("2024-03-11"),
    settledAt: null
  }},
  { upsert: true }
);

db.claims.updateOne(
  { claimNumber: "CLM-2024-001003" },
  { $set: {
    claimNumber: "CLM-2024-001003",
    customerId: "CUST000003",
    policyNumber: "POL-COMMERCIAL-2024-001",
    claimType: "Cyber Attack",
    claimAmount: 75000.00,
    deductible: 5000.00,
    status: "investigating",
    incidentDate: new Date("2024-02-28"),
    incidentDescription: "Ransomware attack on company servers",
    adjusterAssigned: "ADJ003",
    settledAmount: null,
    processingTime: null,
    fraudIndicators: ["unusual_timing"],
    severityLevel: "critical",
    location: {
      type: "Point",
      coordinates: [-118.2437, 34.0522]
    },
    witnesses: 0,
    policeReport: true,
    createdAt: new Date("2024-03-01"),
    settledAt: null
  }},
  { upsert: true }
);

print("Upserted Day 2 claims - total claims: " + db.claims.countDocuments());
```

### 8. Upsert Agents (3 Agents)

These agents add `performance` metrics, `salary`, and `commissionRate` fields for Day 2 workforce analytics.

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
    territory: "Manhattan North",
    specialties: ["Auto", "Property"],
    licenseNumber: "LIC-NY-12345",
    isActive: true,
    performance: {
      salesTarget: 500000,
      salesActual: 485000,
      customerRating: 4.8,
      claimsHandled: 125,
      conversionRate: 0.78
    },
    hireDate: new Date("2022-03-15"),
    lastPromotion: new Date("2023-03-15"),
    salary: 75000,
    commissionRate: 0.03
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
    territory: "West LA",
    specialties: ["Commercial", "Cyber"],
    licenseNumber: "LIC-CA-67890",
    isActive: true,
    performance: {
      salesTarget: 750000,
      salesActual: 820000,
      customerRating: 4.9,
      claimsHandled: 95,
      conversionRate: 0.85
    },
    hireDate: new Date("2021-08-22"),
    lastPromotion: new Date("2022-08-22"),
    salary: 85000,
    commissionRate: 0.035
  }},
  { upsert: true }
);

db.agents.updateOne(
  { agentId: "AGT003" },
  { $set: {
    agentId: "AGT003",
    firstName: "Jessica",
    lastName: "Chen",
    email: "jessica.chen@insuranceco.com",
    phone: "+1-555-0203",
    branchId: "BR003",
    territory: "Houston Energy",
    specialties: ["Cyber", "Health"],
    licenseNumber: "LIC-TX-11111",
    isActive: true,
    performance: {
      salesTarget: 600000,
      salesActual: 645000,
      customerRating: 4.7,
      claimsHandled: 110,
      conversionRate: 0.72
    },
    hireDate: new Date("2020-11-10"),
    lastPromotion: new Date("2021-11-10"),
    salary: 78000,
    commissionRate: 0.032
  }},
  { upsert: true }
);

print("Upserted Day 2 agents - total agents: " + db.agents.countDocuments());
```

### 9. Insert Reviews (3 Reviews)

The `reviews` collection is new in Day 2 (it was dropped in Step 3). These reviews include `sentiment`, `categories`, and `helpfulVotes` fields for text search labs.

```javascript
db.reviews.insertMany([
  {
    reviewId: "REV001",
    customerId: "CUST000001",
    agentId: "AGT001",
    branchId: "BR001",
    rating: 5,
    reviewText: "Excellent service and outstanding customer support. Emily was incredibly helpful throughout the entire claims process. The response time was fantastic and the settlement was fair. Highly recommend this insurance company to anyone looking for reliable coverage.",
    reviewDate: new Date("2024-03-20"),
    sentiment: "positive",
    categories: ["service", "claims", "support"],
    verified: true,
    helpfulVotes: 15
  },
  {
    reviewId: "REV002",
    customerId: "CUST000002",
    agentId: "AGT002",
    branchId: "BR002",
    rating: 4,
    reviewText: "Good coverage options and competitive pricing. The policy selection process was straightforward, though claim processing could be faster. Overall satisfied with the service and would consider renewing. David provided good guidance on policy options.",
    reviewDate: new Date("2024-03-18"),
    sentiment: "positive",
    categories: ["coverage", "pricing", "claims"],
    verified: true,
    helpfulVotes: 8
  },
  {
    reviewId: "REV003",
    customerId: "CUST000003",
    agentId: "AGT003",
    branchId: "BR003",
    rating: 2,
    reviewText: "Poor experience with claim denial and lack of communication. The initial sales process was smooth but when I needed to file a claim, the service quality dropped significantly. Jessica was hard to reach and the explanations were unclear.",
    reviewDate: new Date("2024-03-15"),
    sentiment: "negative",
    categories: ["claims", "communication", "service"],
    verified: true,
    helpfulVotes: 22
  }
]);

print("Created " + db.reviews.countDocuments() + " customer reviews");
```

### 10. Create Indexes for Performance

These are the same indexes created by the automated loader.

```javascript
// Core business indexes
db.policies.createIndex({ policyNumber: 1 }, { unique: true });
db.policies.createIndex({ policyType: 1, isActive: 1 });
db.customers.createIndex({ customerId: 1 }, { unique: true });
db.customers.createIndex({ email: 1 }, { unique: true });
db.claims.createIndex({ claimNumber: 1 }, { unique: true });
db.claims.createIndex({ customerId: 1, status: 1 });
db.agents.createIndex({ agentId: 1 }, { unique: true });
db.branches.createIndex({ branchCode: 1 }, { unique: true });

// Analytics and aggregation indexes
db.customers.createIndex({ "riskProfile.score": 1, premiumTotal: -1 });
db.claims.createIndex({ claimType: 1, claimAmount: -1 });
db.claims.createIndex({ status: 1, incidentDate: -1 });
db.agents.createIndex({ branchId: 1, "performance.salesActual": -1 });
db.branches.createIndex({ "performanceMetrics.monthlyRevenue": -1 });

// Geospatial indexes
db.branches.createIndex({ location: "2dsphere" });
db.claims.createIndex({ location: "2dsphere" });

// Text search indexes
db.reviews.createIndex({ reviewText: "text", categories: "text" });
db.policies.createIndex({ name: "text", policyType: "text" });

print("Created production indexes");
```

### 11. Verify Data Loading

```javascript
print("=== Day 2 Analytics Data Verification ===");

var branchCount = db.branches.countDocuments();
var policyCount = db.policies.countDocuments();
var customerCount = db.customers.countDocuments();
var claimCount = db.claims.countDocuments();
var agentCount = db.agents.countDocuments();
var reviewCount = db.reviews.countDocuments();

print("Analytics collections:");
print("- branches: " + branchCount);
print("- policies: " + policyCount);
print("- customers: " + customerCount);
print("- claims: " + claimCount);
print("- agents: " + agentCount);
print("- reviews: " + reviewCount);

// Test aggregation pipeline
print("\n=== Sample Aggregation Test ===");
var aggResult = db.policies.aggregate([
  { $match: { isActive: true } },
  { $group: {
    _id: "$policyType",
    count: { $sum: 1 },
    avgPremium: { $avg: "$annualPremium" }
  }},
  { $sort: { count: -1 } }
]).toArray();

print(JSON.stringify(aggResult, null, 2));

// Test text search
print("\n=== Text Search Test ===");
var searchResult = db.reviews.countDocuments({ $text: { $search: "excellent professional" } });
print("Text search results: " + searchResult);
```

## Expected Results

After running this manual setup on top of Day 1 data, you should have approximately:

- **5+ branches** (Day 1 branches + 3 upserted Day 2 branches)
- **13 policies** (10 from Day 1 + 3 upserted Day 2 policies)
- **20 customers** (17 from Day 1 + 3 upserted Day 2 customers)
- **15 claims** (12 from Day 1 + 3 upserted Day 2 claims)
- **10 agents** (7 from Day 1 + 3 upserted Day 2 agents)
- **3 reviews** (new Day 2 collection)

Note: Exact counts depend on overlap between Day 1 and Day 2 IDs. The upsert pattern ensures no duplicate key errors.

## Troubleshooting

### Duplicate Key Errors

If you see duplicate key errors, the data already exists. The upsert pattern used above should prevent this, but if you copied data from a different source:

```javascript
// Check existing document before upserting
db.policies.findOne({ policyNumber: "POL-AUTO-2024-001" });
```

### Index Creation Errors

If an index already exists with a different definition, drop it first:

```javascript
// Drop a specific index by name
db.policies.dropIndex("policyNumber_1");

// Or drop all non-default indexes on a collection
db.reviews.dropIndexes();

// Then rerun the index creation commands from Step 10
```

### Missing Day 1 Data

Day 2 builds on top of Day 1 data. If Day 1 data is missing, load it first using `manual_day1_setup.md` or `day1_data_loader.js`.

### Verifying Upserts Worked

```javascript
// Check that Day 2 fields were added to existing documents
db.customers.findOne(
  { customerId: "CUST000001" },
  { riskProfile: 1, loyaltyProgram: 1 }
);

// Should show both riskProfile and loyaltyProgram fields
```

## Next Steps

After loading Day 2 data:
1. Complete Lab 6: Advanced Query Techniques
2. Complete Lab 7: Aggregation Framework
3. Complete Lab 8: Indexing & Performance Optimization
4. Complete Lab 9: Data Modeling & Schema Design
5. Complete Lab 10: MongoDB Transactions
6. For Day 3, use `manual_day3_setup.md` or `day3_data_loader.js`

---

*Manual setup for MongoDB Mastering Course - Day 2 Analytics*
