# Manual Day 2 Data Setup

This guide provides step-by-step instructions for manually loading Day 2 analytics data if the automated `day2_data_loader.js` script cannot be used.

## Prerequisites

- MongoDB replica set running (see `../scripts/setup.sh`)
- MongoDB Shell (mongosh) installed and accessible
- Day 1 data already loaded (optional but recommended)

## Manual Data Loading Steps

### 1. Connect to MongoDB

```bash
mongosh
```

### 2. Switch to Analytics Database

```javascript
use insurance_analytics
```

### 3. Create Policy Types Collection (Hierarchical Structure)

```javascript
db.policy_types.insertMany([
  {
    _id: "auto_policies",
    category: "Auto",
    description: "Vehicle insurance policies",
    subcategories: [
      {
        type: "Liability",
        coverageTypes: ["Bodily Injury", "Property Damage"],
        minimumCoverage: 25000,
        averagePremium: NumberDecimal("800.00")
      },
      {
        type: "Comprehensive",
        coverageTypes: ["Theft", "Vandalism", "Natural Disaster"],
        minimumCoverage: 0,
        averagePremium: NumberDecimal("400.00")
      },
      {
        type: "Collision",
        coverageTypes: ["Vehicle Damage"],
        minimumCoverage: 0,
        averagePremium: NumberDecimal("600.00")
      }
    ]
  },
  {
    _id: "home_policies",
    category: "Home",
    description: "Property insurance policies",
    subcategories: [
      {
        type: "Dwelling",
        coverageTypes: ["Structure", "Foundation"],
        minimumCoverage: 100000,
        averagePremium: NumberDecimal("1200.00")
      },
      {
        type: "Personal Property",
        coverageTypes: ["Contents", "Electronics"],
        minimumCoverage: 50000,
        averagePremium: NumberDecimal("300.00")
      }
    ]
  },
  {
    _id: "life_policies",
    category: "Life",
    description: "Life insurance policies",
    subcategories: [
      {
        type: "Term Life",
        coverageTypes: ["Death Benefit"],
        minimumCoverage: 100000,
        averagePremium: NumberDecimal("500.00")
      },
      {
        type: "Whole Life",
        coverageTypes: ["Death Benefit", "Cash Value"],
        minimumCoverage: 100000,
        averagePremium: NumberDecimal("2000.00")
      }
    ]
  },
  {
    _id: "business_policies",
    category: "Business",
    description: "Commercial insurance policies",
    subcategories: [
      {
        type: "General Liability",
        coverageTypes: ["Property Damage", "Bodily Injury", "Personal Injury"],
        minimumCoverage: 500000,
        averagePremium: NumberDecimal("3000.00")
      },
      {
        type: "Professional Liability",
        coverageTypes: ["Errors & Omissions"],
        minimumCoverage: 250000,
        averagePremium: NumberDecimal("1500.00")
      }
    ]
  }
])
```

### 4. Create Analytics Branches (Geospatial Data)

```javascript
db.branches.insertMany([
  {
    _id: "analytics_branch_001",
    branchId: "ABR-001",
    name: "North Texas Analytics Center",
    location: {
      type: "Point",
      coordinates: [-96.7970, 32.7767] // Dallas coordinates
    },
    address: {
      street: "1000 Analytics Drive",
      city: "Dallas",
      state: "TX",
      zipCode: "75201",
      coordinates: {
        lat: 32.7767,
        lng: -96.7970
      }
    },
    region: "North",
    territory: ["Dallas", "Plano", "Richardson", "Addison"],
    established: new Date("2018-01-01"),
    metrics: {
      totalPolicies: NumberInt(1547),
      monthlyRevenue: NumberDecimal("1850000.00"),
      customerSatisfaction: NumberDecimal("4.2")
    }
  },
  {
    _id: "analytics_branch_002",
    branchId: "ABR-002",
    name: "West Texas Analytics Hub",
    location: {
      type: "Point",
      coordinates: [-97.3208, 32.7555] // Fort Worth coordinates
    },
    address: {
      street: "2000 Data Boulevard",
      city: "Fort Worth",
      state: "TX",
      zipCode: "76102",
      coordinates: {
        lat: 32.7555,
        lng: -97.3208
      }
    },
    region: "West",
    territory: ["Fort Worth", "Arlington", "Grand Prairie", "Irving"],
    established: new Date("2019-06-15"),
    metrics: {
      totalPolicies: NumberInt(1203),
      monthlyRevenue: NumberDecimal("1420000.00"),
      customerSatisfaction: NumberDecimal("4.1")
    }
  },
  {
    _id: "analytics_branch_003",
    branchId: "ABR-003",
    name: "East Texas Analytics Center",
    location: {
      type: "Point",
      coordinates: [-96.6989, 32.8998] // Garland coordinates
    },
    address: {
      street: "3000 Insight Lane",
      city: "Garland",
      state: "TX",
      zipCode: "75040",
      coordinates: {
        lat: 32.8998,
        lng: -96.6989
      }
    },
    region: "East",
    territory: ["Garland", "Mesquite", "Rockwall", "Rowlett"],
    established: new Date("2020-03-10"),
    metrics: {
      totalPolicies: NumberInt(892),
      monthlyRevenue: NumberDecimal("1050000.00"),
      customerSatisfaction: NumberDecimal("4.3")
    }
  }
])
```

### 5. Create Analytics Policies (Large Dataset)

```javascript
// Create 50 policies for aggregation testing
var policies = [];
var policyTypes = ["Auto", "Home", "Life", "Business"];
var statuses = [true, false];
var regions = ["North", "West", "East"];

for (var i = 1; i <= 50; i++) {
  var policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)];
  var isActive = statuses[Math.floor(Math.random() * statuses.length)];
  var region = regions[Math.floor(Math.random() * regions.length)];

  // Calculate premium based on type
  var basePremium = 0;
  switch(policyType) {
    case "Auto": basePremium = 1200; break;
    case "Home": basePremium = 1500; break;
    case "Life": basePremium = 2400; break;
    case "Business": basePremium = 4500; break;
  }

  var variation = Math.random() * 1000 - 500; // ±500 variation
  var premium = Math.max(300, basePremium + variation);

  policies.push({
    _id: "analytics_policy_" + String(i).padStart(3, '0'),
    policyNumber: policyType.toUpperCase() + "-ANALYTICS-" + String(i).padStart(3, '0'),
    policyType: policyType,
    customerId: "ANALYTICS-CUST-" + String(Math.floor(i/2) + 1).padStart(3, '0'),
    annualPremium: NumberDecimal(premium.toFixed(2)),
    deductible: NumberInt([250, 500, 1000, 1500][Math.floor(Math.random() * 4)]),
    coverageLimit: [50000, 100000, 250000, 500000][Math.floor(Math.random() * 4)],
    isActive: isActive,
    effectiveDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    region: region,
    riskScore: NumberDecimal((Math.random() * 9 + 1).toFixed(1)), // 1.0 - 10.0
    branchId: "ABR-" + String(regions.indexOf(region) + 1).padStart(3, '0')
  });
}

db.policies.insertMany(policies);
```

### 6. Create Analytics Customers (Risk-Segmented)

```javascript
// Create 100 customers with risk analytics
var customers = [];
var firstNames = ["John", "Mary", "Michael", "Jennifer", "William", "Linda", "David", "Barbara", "Richard", "Susan"];
var lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
var riskLevels = ["Low", "Medium", "High"];
var cities = ["Dallas", "Fort Worth", "Plano", "Arlington", "Garland"];

for (var i = 1; i <= 100; i++) {
  var firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  var lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  var age = Math.floor(Math.random() * 50) + 25; // 25-74 years
  var riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  var city = cities[Math.floor(Math.random() * cities.length)];

  // Risk-based metrics
  var creditScore = riskLevel === "Low" ? 750 + Math.floor(Math.random() * 100) :
                    riskLevel === "Medium" ? 650 + Math.floor(Math.random() * 100) :
                    500 + Math.floor(Math.random() * 150);

  customers.push({
    _id: "analytics_customer_" + String(i).padStart(3, '0'),
    customerId: "ANALYTICS-CUST-" + String(i).padStart(3, '0'),
    firstName: firstName,
    lastName: lastName,
    fullName: firstName + " " + lastName,
    email: firstName.toLowerCase() + "." + lastName.toLowerCase() + i + "@email.com",
    phone: "(214) 555-" + String(1000 + i),
    age: NumberInt(age),
    dateOfBirth: new Date(2023 - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    address: {
      street: String(100 + i) + " Analytics Street",
      city: city,
      state: "TX",
      zipCode: String(75000 + Math.floor(Math.random() * 999))
    },
    riskLevel: riskLevel,
    riskScore: NumberDecimal((riskLevel === "Low" ? 1 + Math.random() * 3 :
                              riskLevel === "Medium" ? 4 + Math.random() * 3 :
                              7 + Math.random() * 3).toFixed(1)),
    creditScore: NumberInt(creditScore),
    joinDate: new Date(2022, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    status: "Active",
    lifetime_value: NumberDecimal((Math.random() * 50000 + 10000).toFixed(2)),
    claims_history: NumberInt(Math.floor(Math.random() * 5))
  });
}

db.customers.insertMany(customers);
```

### 7. Create Analytics Claims (200 Claims)

```javascript
// Create 200 claims for analytics
var claims = [];
var claimTypes = ["Auto", "Home", "Life", "Business"];
var statuses = ["Approved", "Denied", "Under Review", "Pending"];
var descriptions = {
  "Auto": ["Collision damage", "Theft", "Vandalism", "Hail damage"],
  "Home": ["Storm damage", "Fire damage", "Theft", "Water damage"],
  "Life": ["Death benefit claim", "Disability claim"],
  "Business": ["Liability claim", "Property damage", "Cyber attack"]
};

for (var i = 1; i <= 200; i++) {
  var claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
  var status = statuses[Math.floor(Math.random() * statuses.length)];
  var description = descriptions[claimType][Math.floor(Math.random() * descriptions[claimType].length)];

  // Amount based on type and status
  var baseAmount = claimType === "Life" ? 100000 :
                   claimType === "Business" ? 25000 :
                   claimType === "Home" ? 15000 : 8000;

  var amount = status === "Denied" ? 0 :
               baseAmount + (Math.random() * baseAmount * 0.5);

  claims.push({
    _id: "analytics_claim_" + String(i).padStart(3, '0'),
    claimNumber: "ANALYTICS-CLM-" + String(i).padStart(3, '0'),
    policyNumber: claimType.toUpperCase() + "-ANALYTICS-" + String(Math.floor(Math.random() * 50) + 1).padStart(3, '0'),
    customerId: "ANALYTICS-CUST-" + String(Math.floor(Math.random() * 100) + 1).padStart(3, '0'),
    claimType: claimType,
    incidentDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    reportedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    claimAmount: NumberDecimal(amount.toFixed(2)),
    adjustedAmount: status === "Approved" ? NumberDecimal((amount * 0.95).toFixed(2)) : NumberDecimal("0.00"),
    status: status,
    description: description,
    processingTime: NumberInt(Math.floor(Math.random() * 30) + 1), // Days
    adjuster: {
      name: ["John Adjuster", "Mary Examiner", "Mike Investigator"][Math.floor(Math.random() * 3)],
      id: "ADJ-" + String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')
    }
  });
}

db.claims.insertMany(claims);
```

### 8. Create Analytics Agents

```javascript
db.agents.insertMany([
  {
    _id: "analytics_agent_001",
    agentId: "ANALYTICS-AGT-001",
    firstName: "Sarah",
    lastName: "Analytics",
    email: "sarah.analytics@insurance.com",
    phone: "(214) 555-9001",
    licenseNumber: "TX-ANALYTICS-001",
    hireDate: new Date("2020-01-15"),
    branchId: "ABR-001",
    specialties: ["Auto", "Home", "Analytics"],
    commissionRate: NumberDecimal("0.055"),
    performance: {
      policiesSold: NumberInt(247),
      totalRevenue: NumberDecimal("985000.00"),
      customerRating: NumberDecimal("4.7"),
      renewalRate: NumberDecimal("0.87")
    },
    territory: ["Dallas", "Plano", "Richardson"],
    status: "Active"
  },
  {
    _id: "analytics_agent_002",
    agentId: "ANALYTICS-AGT-002",
    firstName: "Michael",
    lastName: "DataPro",
    email: "michael.datapro@insurance.com",
    phone: "(817) 555-9002",
    licenseNumber: "TX-ANALYTICS-002",
    hireDate: new Date("2019-06-01"),
    branchId: "ABR-002",
    specialties: ["Life", "Business", "Risk Assessment"],
    commissionRate: NumberDecimal("0.065"),
    performance: {
      policiesSold: NumberInt(189),
      totalRevenue: NumberDecimal("1250000.00"),
      customerRating: NumberDecimal("4.5"),
      renewalRate: NumberDecimal("0.91")
    },
    territory: ["Fort Worth", "Arlington", "Grand Prairie"],
    status: "Active"
  }
])
```

### 9. Create Vehicles Collection

```javascript
db.vehicles.insertMany([
  {
    _id: "analytics_vehicle_001",
    vin: "1HGCV1F3XNA123456",
    customerId: "ANALYTICS-CUST-001",
    policyNumber: "AUTO-ANALYTICS-001",
    make: "Honda",
    model: "Accord",
    year: NumberInt(2022),
    color: "Silver",
    engineType: "4-Cylinder",
    transmission: "Automatic",
    mileage: NumberInt(25000),
    value: NumberDecimal("28500.00"),
    riskFactors: {
      safetyRating: NumberDecimal("4.5"),
      theftRisk: "Low",
      repairCost: "Medium"
    },
    usage: {
      primaryUse: "Commuting",
      annualMileage: NumberInt(15000),
      parkingLocation: "Garage"
    }
  },
  {
    _id: "analytics_vehicle_002",
    vin: "1FTFW1ET5DKF12345",
    customerId: "ANALYTICS-CUST-025",
    policyNumber: "AUTO-ANALYTICS-025",
    make: "Ford",
    model: "F-150",
    year: NumberInt(2021),
    color: "Blue",
    engineType: "V6",
    transmission: "Automatic",
    mileage: NumberInt(35000),
    value: NumberDecimal("42000.00"),
    riskFactors: {
      safetyRating: NumberDecimal("4.2"),
      theftRisk: "Medium",
      repairCost: "High"
    },
    usage: {
      primaryUse: "Work",
      annualMileage: NumberInt(25000),
      parkingLocation: "Driveway"
    }
  }
])
```

### 10. Create Properties Collection

```javascript
db.properties.insertOne({
  _id: "analytics_property_001",
  customerId: "ANALYTICS-CUST-050",
  policyNumber: "HOME-ANALYTICS-015",
  address: {
    street: "1500 Analytics Avenue",
    city: "Dallas",
    state: "TX",
    zipCode: "75201",
    coordinates: {
      lat: 32.7767,
      lng: -96.7970
    }
  },
  propertyType: "Single Family Home",
  yearBuilt: NumberInt(2018),
  squareFootage: NumberInt(2400),
  bedrooms: NumberInt(4),
  bathrooms: NumberDecimal("2.5"),
  garageSpaces: NumberInt(2),
  value: NumberDecimal("485000.00"),
  features: {
    swimmingPool: true,
    fireplace: true,
    securitySystem: true,
    smartHome: true
  },
  riskFactors: {
    floodZone: false,
    crimeRate: "Low",
    fireRisk: "Low",
    naturalDisasterRisk: "Medium"
  },
  construction: {
    foundationType: "Slab",
    roofType: "Asphalt Shingle",
    exteriorWalls: "Brick",
    heatingType: "Central Gas"
  }
})
```

### 11. Create Reviews Collection (Text Search)

```javascript
// Create 100 agent reviews for text search testing
var reviews = [];
var ratings = [1, 2, 3, 4, 5];
var reviewTexts = [
  "Excellent service and very professional. Highly recommend!",
  "Good experience overall. Agent was helpful and knowledgeable.",
  "Average service. Could be more responsive to inquiries.",
  "Outstanding customer service. Made the process very easy.",
  "Professional and efficient. Great communication throughout.",
  "Satisfactory service. Agent was courteous and informative.",
  "Exceptional service quality. Very pleased with the experience.",
  "Quick response time and thorough explanation of policies.",
  "Friendly agent with extensive knowledge of insurance products.",
  "Smooth process from start to finish. Very satisfied."
];

for (var i = 1; i <= 100; i++) {
  reviews.push({
    _id: "analytics_review_" + String(i).padStart(3, '0'),
    reviewId: "REV-" + String(i).padStart(3, '0'),
    customerId: "ANALYTICS-CUST-" + String(Math.floor(Math.random() * 100) + 1).padStart(3, '0'),
    agentId: "ANALYTICS-AGT-" + String(Math.floor(Math.random() * 2) + 1).padStart(3, '0'),
    rating: NumberInt(ratings[Math.floor(Math.random() * ratings.length)]),
    reviewText: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
    reviewDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    verified: Math.random() > 0.1, // 90% verified
    helpfulVotes: NumberInt(Math.floor(Math.random() * 20)),
    tags: ["service", "professional", "responsive", "knowledgeable"].slice(0, Math.floor(Math.random() * 3) + 1)
  });
}

db.reviews.insertMany(reviews);
```

### 12. Create Indexes for Performance

```javascript
// Create indexes for Day 2 labs
db.policies.createIndex({"policyType": 1, "annualPremium": -1})
db.policies.createIndex({"isActive": 1})
db.policies.createIndex({"region": 1, "riskScore": 1})

db.customers.createIndex({"riskLevel": 1})
db.customers.createIndex({"age": 1})
db.customers.createIndex({"address.city": 1})

db.claims.createIndex({"claimType": 1, "status": 1})
db.claims.createIndex({"claimAmount": 1})
db.claims.createIndex({"incidentDate": 1})

db.branches.createIndex({"location": "2dsphere"})
db.branches.createIndex({"region": 1})

db.reviews.createIndex({"reviewText": "text", "tags": "text"})
```

### 13. Verify Data Loading

```javascript
// Check document counts
print("=== Day 2 Analytics Data Verification ===")
print("Policy Types: " + db.policy_types.countDocuments())
print("Branches: " + db.branches.countDocuments())
print("Policies: " + db.policies.countDocuments())
print("Customers: " + db.customers.countDocuments())
print("Claims: " + db.claims.countDocuments())
print("Agents: " + db.agents.countDocuments())
print("Vehicles: " + db.vehicles.countDocuments())
print("Properties: " + db.properties.countDocuments())
print("Reviews: " + db.reviews.countDocuments())

// Test aggregation pipeline
print("\n=== Sample Aggregation Test ===")
var aggResult = db.policies.aggregate([
  {$match: {isActive: true}},
  {$group: {
    _id: "$policyType",
    count: {$sum: 1},
    avgPremium: {$avg: "$annualPremium"}
  }},
  {$sort: {count: -1}}
]).toArray()

printjson(aggResult)

// Test text search
print("\n=== Text Search Test ===")
var searchResult = db.reviews.find({$text: {$search: "excellent professional"}}).count()
print("Text search results: " + searchResult)
```

## Expected Results

After manual loading, you should have:
- **4 policy types** with hierarchical structures
- **3 branches** with geospatial data
- **50 policies** for aggregation testing
- **100 customers** with risk segmentation
- **200 claims** with analytics data
- **2 agents** with performance metrics
- **2 vehicles** with risk factors
- **1 property** with detailed features
- **100 reviews** with text search capability

## Next Steps

After loading Day 2 data:
1. Complete Day 2 labs (Labs 6-8)
2. For Day 3, use `manual_day3_setup.md`

---

*Manual setup for MongoDB Mastering Course - Day 2 Analytics*