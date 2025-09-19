// ===== LAB 2 DATA GENERATION SCRIPT =====
// Data Modeling and Schema Design
// File: lab2_insurance_operational_data.js

// Use this database
use("insurance_operations");

print("=== Generating Lab 2 Insurance Operational Data ===");

// ===== 1. AGENTS COLLECTION =====
print("Creating insurance agents...");

const agentNames = [
  "Alex Rivera", "Maya Chen", "Jordan Smith", "Casey Johnson", "Taylor Brown",
  "Morgan Davis", "Riley Wilson", "Sage Anderson", "Quinn Martinez", "Rowan Garcia"
];

const agents = [];
for (let i = 0; i < 50; i++) {
  const name = agentNames[i % agentNames.length] + (i >= agentNames.length ? ` ${Math.floor(i / agentNames.length) + 1}` : "");
  const agentId = `AGT${String(i + 1).padStart(3, '0')}`;
  
  const agent = {
    _id: new ObjectId(),
    agentId: agentId,
    email: `${agentId.toLowerCase()}@insuranceco.com`,
    name: name,

    profile: {
      bio: `Licensed insurance professional with ${Math.floor(Math.random() * 15) + 3} years of experience in ${["auto insurance", "home insurance", "life insurance", "commercial insurance", "health insurance"][Math.floor(Math.random() * 5)]}.`,
      photo: `https://example.com/agents/${agentId.toLowerCase()}.jpg`,
      certifications: [
        "Property & Casualty License",
        "Life & Health License",
        "CPCU Certification"
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      languages: ["English", "Spanish", "French", "Chinese"][Math.floor(Math.random() * 4)]
    },
    
    performance: {
      totalPolicies: Math.floor(Math.random() * 200) + 50,
      totalPremiumVolume: Math.floor(Math.random() * 500000) + 100000,
      customerSatisfaction: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      retentionRate: Math.round((Math.random() * 30 + 70) * 100) / 100 // 70-100%
    },
    
    workDetails: {
      branchId: `BR${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
      territory: ["North", "South", "East", "West", "Central"][Math.floor(Math.random() * 5)],
      specialties: ["Auto", "Home", "Life", "Commercial", "Health"].filter(() => Math.random() > 0.6),
      isActive: Math.random() > 0.1 // 90% active
    },
    
    licenseInfo: {
      licenseNumber: `LIC${Math.floor(Math.random() * 9000000) + 1000000}`,
      issueDate: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000),
      expirationDate: new Date(Date.now() + Math.random() * 2 * 365 * 24 * 60 * 60 * 1000),
      status: "active"
    },

    hireDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000),
    lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  };
  
  agents.push(agent);
}

db.agents.insertMany(agents);

// ===== 2. COVERAGE TYPES COLLECTION =====
print("Creating coverage types...");

const coverageNames = [
  "liability", "collision", "comprehensive", "uninsured-motorist", "medical-payments", "personal-injury-protection", "gap-coverage",
  "dwelling", "personal-property", "loss-of-use", "personal-liability", "medical-payments-home", "flood", "earthquake",
  "term-life", "whole-life", "universal-life", "variable-life", "accidental-death", "disability", "long-term-care",
  "general-liability", "product-liability", "professional-liability", "cyber-liability", "directors-officers", "employment-practices", "workers-compensation",
  "health", "dental", "vision", "prescription", "mental-health", "maternity", "preventive-care"
];

const coverageTypes = coverageNames.map((coverageName, index) => ({
  _id: new ObjectId(),
  name: coverageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  code: coverageName.toUpperCase().replace(/-/g, '_'),
  category: (() => {
    if (coverageName.includes('auto') || ['liability', 'collision', 'comprehensive', 'uninsured-motorist'].includes(coverageName)) return 'Auto';
    if (['dwelling', 'personal-property', 'flood', 'earthquake'].includes(coverageName)) return 'Property';
    if (coverageName.includes('life') || ['accidental-death', 'disability'].includes(coverageName)) return 'Life';
    if (['general-liability', 'cyber-liability', 'workers-compensation'].includes(coverageName)) return 'Commercial';
    return 'Health';
  })(),
  description: `Insurance coverage for ${coverageName.replace(/-/g, ' ')}`,
  basePremium: Math.round((Math.random() * 500 + 50) * 100) / 100,
  policyCount: Math.floor(Math.random() * 1000) + 100,
  isActive: true,
  regulatoryInfo: {
    requiredInStates: ["CA", "NY", "TX", "FL"].filter(() => Math.random() > 0.5),
    minimumCoverage: Math.floor(Math.random() * 50000) + 10000
  },
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
}));

db.coverage_types.insertMany(coverageTypes);

// ===== 3. POLICIES COLLECTION (with embedded claims) =====
print("Creating insurance policies with embedded claims...");

const agentIds = db.agents.find({}, {_id: 1}).toArray().map(a => a._id);
const coverageData = db.coverage_types.find({}, {_id: 1, name: 1, category: 1}).toArray();

const policyTypes = [
  "Premium Auto Coverage Package",
  "Comprehensive Homeowners Protection",
  "Term Life Insurance Policy",
  "Commercial General Liability",
  "Health Insurance Plan",
  "Professional Liability Coverage",
  "Cyber Security Insurance",
  "Umbrella Insurance Policy",
  "Renters Insurance Protection",
  "Whole Life Insurance Policy",
  "Workers Compensation Coverage",
  "Marine Insurance Policy",
  "Travel Insurance Protection",
  "Disability Income Insurance",
  "Directors and Officers Liability",
  "Employment Practices Liability",
  "Product Liability Insurance",
  "Environmental Liability Coverage",
  "Key Person Life Insurance",
  "Business Interruption Insurance"
];

const policies = [];
for (let i = 0; i < 200; i++) {
  const agentId = agentIds[Math.floor(Math.random() * agentIds.length)];
  const issueDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  const policyName = policyTypes[i % policyTypes.length] + (i >= policyTypes.length ? ` - Plan ${Math.floor(i / policyTypes.length) + 1}` : "");
  
  // Generate policy coverage types (2-5 coverage types per policy)
  const policyCoverages = [];
  const coverageCount = Math.floor(Math.random() * 4) + 2;
  while (policyCoverages.length < coverageCount) {
    const coverage = coverageData[Math.floor(Math.random() * coverageData.length)];
    if (!policyCoverages.find(c => c._id.equals(coverage._id))) {
      policyCoverages.push({
        _id: coverage._id,
        name: coverage.name,
        category: coverage.category
      });
    }
  }
  
  // Generate embedded claims (0-5 claims per policy)
  const claimCount = Math.floor(Math.random() * 6);
  const claims = [];

  for (let j = 0; j < claimCount; j++) {
    const claimDate = new Date(issueDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);
    
    const claimAmount = Math.round((Math.random() * 50000 + 100) * 100) / 100;
    const deductible = [250, 500, 1000, 2500][Math.floor(Math.random() * 4)];

    claims.push({
      _id: new ObjectId(),
      claimNumber: `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`,
      claimType: [
        "Auto Accident", "Property Damage", "Theft", "Fire", "Water Damage",
        "Medical Expense", "Liability Claim", "Vandalism", "Natural Disaster", "Personal Injury"
      ][Math.floor(Math.random() * 10)],
      description: [
        "Vehicle collision at intersection with minor injuries",
        "Water damage from burst pipe in basement",
        "Theft of personal belongings from vehicle",
        "Fire damage to kitchen from cooking accident",
        "Storm damage to roof and windows",
        "Medical expenses from slip and fall incident",
        "Liability claim from visitor injury on property",
        "Vandalism to vehicle parked on street"
      ][Math.floor(Math.random() * 8)],
      claimAmount: claimAmount,
      deductible: deductible,
      settledAmount: Math.max(0, Math.round((claimAmount - deductible) * (0.7 + Math.random() * 0.3) * 100) / 100),
      status: ["submitted", "under_review", "approved", "settled", "denied"][Math.floor(Math.random() * 5)],
      claimDate: claimDate,
      updatedAt: new Date(claimDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      adjusterAssigned: `ADJ${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      fraudFlag: Math.random() > 0.95 // 5% flagged for potential fraud
    });
  }
  
  const policy = {
    _id: new ObjectId(),
    policyNumber: `POL-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
    policyName: policyName,
    slug: policyName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100),

    // Agent info (extended reference pattern)
    agent: {
      _id: agentId,
      name: "Agent Name", // Simplified for demo
      email: "agent@insuranceco.com", // Frequently accessed info
      licenseNumber: `LIC${Math.floor(Math.random() * 9000000) + 1000000}`
    },
    
    // Policy details
    description: `Comprehensive ${policyName.toLowerCase()} providing extensive coverage and protection. This policy includes multiple coverage types and benefits designed to meet diverse insurance needs.`,

    policyTerms: {
      effectiveDate: issueDate,
      expirationDate: new Date(issueDate.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year term
      renewalDate: new Date(issueDate.getTime() + 365 * 24 * 60 * 60 * 1000),
      paymentSchedule: ["monthly", "quarterly", "semi-annual", "annual"][Math.floor(Math.random() * 4)],
      autoRenewal: Math.random() > 0.3 // 70% auto-renewal
    },

    premiumInfo: {
      basePremium: Math.round((Math.random() * 2000 + 500) * 100) / 100,
      discounts: Math.round((Math.random() * 200 + 50) * 100) / 100,
      taxes: Math.round((Math.random() * 100 + 25) * 100) / 100,
      fees: Math.round((Math.random() * 50 + 10) * 100) / 100
    },
    
    // Coverage Types
    coverageTypes: policyCoverages,
    
    // Policy metadata
    policyCategory: policyCoverages[0]?.category || "General",
    riskLevel: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
    underwriter: ["Primary Underwriter", "Secondary Underwriter", "Specialty Underwriter"][Math.floor(Math.random() * 3)],
    
    // Policy status
    status: ["active", "pending", "cancelled", "expired"][Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 3) + 1],
    isActive: true,
    featured: Math.random() > 0.9, // 10% featured policies
    
    // Policy metrics
    viewCount: Math.floor(Math.random() * 1000),
    inquiries: Math.floor(Math.random() * 50),
    quotesGenerated: Math.floor(Math.random() * 100),
    conversionRate: Math.round((Math.random() * 30 + 5) * 100) / 100, // 5-35%
    
    // Claims (embedded)
    claims: claims,
    claimCount: claims.length,
    totalClaimAmount: claims.reduce((sum, claim) => sum + claim.claimAmount, 0),
    
    // Policy documents
    documents: [
      `https://example.com/policies/policy-${i + 1}-terms.pdf`,
      `https://example.com/policies/policy-${i + 1}-summary.pdf`
    ],
    brochures: Math.random() > 0.7 ? [
      `https://example.com/policies/policy-${i + 1}-brochure-1.pdf`,
      `https://example.com/policies/policy-${i + 1}-brochure-2.pdf`
    ] : [],
    
    // Policy dates
    issuedAt: issueDate,
    createdAt: new Date(issueDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(issueDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    
    // Customer information (if applicable)
    customerInfo: Math.random() > 0.3 ? {
      customerId: `CUST${String(Math.floor(Math.random() * 10000) + 1).padStart(4, '0')}`,
      name: "Customer Name",
      email: "customer@example.com",
      phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
    } : null
  };
  
  policies.push(policy);
}

db.policies.insertMany(policies);

// ===== 4. VEHICLES COLLECTION (Insurance Asset Schema) =====
print("Creating insured vehicles for schema design...");

const vehicles = [
  {
    _id: new ObjectId(),
    vin: "1HGCM82633A123456",
    make: "Honda",
    model: "Accord",
    year: 2023,

    // Vehicle identification
    vehicleType: "Sedan",
    fuelType: "Gasoline",
    description: "2023 Honda Accord with advanced safety features and fuel efficiency",
    marketValue: 28500.00,

    // Vehicle details
    specifications: {
      engine: "1.5L Turbocharged 4-Cylinder",
      transmission: "CVT Automatic",
      drivetrain: "Front-Wheel Drive",
      fuelEconomy: "32 city / 42 highway MPG",
      seating: 5,
      doors: 4,
      color: "Platinum White Pearl",
      mileage: 15000
    },

    // Insurance information
    insuranceInfo: {
      policyNumber: "POL-AUTO-2024-001234",
      coverageTypes: ["Liability", "Collision", "Comprehensive"],
      deductibles: {
        collision: 500,
        comprehensive: 250
      },
      premiumFactors: {
        safetyRating: 5,
        theftRating: "Low",
        repairCosts: "Moderate"
      }
    },

    // Owner information
    ownerInfo: {
      customerId: "CUST2024001",
      primaryDriver: true,
      driverAge: 35,
      drivingRecord: "Clean",
      yearsExperience: 18
    },

    // Vehicle history
    history: {
      accidents: [],
      claims: [],
      maintenance: [
        {
          date: new Date("2024-01-15"),
          type: "Oil Change",
          mileage: 10000,
          cost: 65.00
        }
      ]
    },

    // Metadata
    status: "active",
    registrationState: "CA",
    licensePlate: "8ABC123",
    createdAt: new Date("2023-09-15"),
    updatedAt: new Date("2024-01-20")
  },
  {
    _id: new ObjectId(),
    vin: "WBA3B1C50EF123789",
    make: "BMW",
    model: "3 Series",
    year: 2022,

    vehicleType: "Sedan",
    fuelType: "Gasoline",
    description: "2022 BMW 3 Series luxury sedan with premium features",
    marketValue: 42500.00,

    specifications: {
      engine: "2.0L Turbocharged 4-Cylinder",
      transmission: "8-Speed Automatic",
      drivetrain: "Rear-Wheel Drive",
      fuelEconomy: "26 city / 36 highway MPG",
      seating: 5,
      doors: 4,
      color: "Jet Black",
      mileage: 22000
    },

    insuranceInfo: {
      policyNumber: "POL-AUTO-2024-001235",
      coverageTypes: ["Liability", "Collision", "Comprehensive", "Gap Coverage"],
      deductibles: {
        collision: 1000,
        comprehensive: 500
      },
      premiumFactors: {
        safetyRating: 5,
        theftRating: "Moderate",
        repairCosts: "High"
      }
    },

    ownerInfo: {
      customerId: "CUST2024002",
      primaryDriver: true,
      driverAge: 42,
      drivingRecord: "One Speeding Ticket",
      yearsExperience: 24
    },

    history: {
      accidents: [
        {
          date: new Date("2023-08-15"),
          type: "Minor Rear-End",
          claimAmount: 3500.00,
          settled: true
        }
      ],
      claims: [
        {
          claimNumber: "CLM-2023-089456",
          type: "Collision",
          amount: 3500.00,
          status: "Settled"
        }
      ],
      maintenance: [
        {
          date: new Date("2024-01-10"),
          type: "Service Package",
          mileage: 20000,
          cost: 450.00
        }
      ]
    },

    status: "active",
    registrationState: "NY",
    licensePlate: "BMW3456",
    createdAt: new Date("2022-03-15"),
    updatedAt: new Date("2024-01-15")
  }
];

db.vehicles.insertMany(vehicles);

// ===== 5. CUSTOMERS COLLECTION (with validation schema) =====
print("Creating customers collection with validation...");

// Create customers collection with schema validation
db.createCollection("customers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "customerId", "createdAt"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Must be a valid email address"
        },
        customerId: {
          bsonType: "string",
          minLength: 8,
          maxLength: 15,
          pattern: "^CUST[0-9]+$",
          description: "Customer ID must start with CUST followed by numbers"
        },
        dateOfBirth: {
          bsonType: "date",
          description: "Customer's date of birth"
        },
        fullName: {
          bsonType: "string",
          minLength: 2,
          maxLength: 100,
          description: "Full name must be 2-100 characters"
        },
        riskScore: {
          bsonType: "int",
          minimum: 1,
          maximum: 100,
          description: "Risk score must be between 1 and 100"
        },
        insurancePreferences: {
          bsonType: "object",
          properties: {
            paperlessBilling: {
              bsonType: "bool",
              description: "Paperless billing preference"
            },
            autoRenewal: {
              bsonType: "bool",
              description: "Auto-renewal preference"
            },
            contactMethod: {
              bsonType: "string",
              enum: ["email", "phone", "mail"],
              description: "Preferred contact method"
            }
          },
          additionalProperties: false
        },
        status: {
          bsonType: "string",
          enum: ["active", "inactive", "suspended", "pending"],
          description: "Customer account status"
        },
        createdAt: {
          bsonType: "date",
          description: "Account creation timestamp"
        }
      },
      additionalProperties: true
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// Insert sample customers
const validCustomers = [];
for (let i = 0; i < 100; i++) {
  const customer = {
    email: `customer${i + 1}@example.com`,
    customerId: `CUST${String(i + 1).padStart(6, '0')}`,
    fullName: `Customer ${i + 1} Name`,
    dateOfBirth: new Date(1960 + Math.random() * 45, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    riskScore: Math.floor(Math.random() * 100) + 1,
    insurancePreferences: {
      paperlessBilling: Math.random() > 0.5,
      autoRenewal: Math.random() > 0.3,
      contactMethod: ["email", "phone", "mail"][Math.floor(Math.random() * 3)]
    },
    status: ["active", "inactive"][Math.floor(Math.random() * 10) < 9 ? 0 : 1], // 90% active
    address: {
      street: `${Math.floor(Math.random() * 9999) + 1} Insurance Lane`,
      city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
      state: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    },
    phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    customerSince: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000)
  };

  validCustomers.push(customer);
}

db.customers.insertMany(validCustomers);

print("=== Lab 2 Insurance Operational Data Generation Complete ===");
print("Collections created:");
print("- agents: " + db.agents.countDocuments());
print("- coverage_types: " + db.coverage_types.countDocuments());
print("- policies: " + db.policies.countDocuments());
print("- vehicles: " + db.vehicles.countDocuments());
print("- customers (with validation): " + db.customers.countDocuments());

print("\n=== Schema Validation Test Examples ===");
print("// This should work:");
print('db.customers.insertOne({email: "test@example.com", customerId: "CUST999999", riskScore: 50, createdAt: new Date()})');
print("\n// This should fail (invalid email):");
print('db.customers.insertOne({email: "invalid-email", customerId: "CUST999998", createdAt: new Date()})');
print("\n// This should fail (invalid customer ID):");
print('db.customers.insertOne({email: "test2@example.com", customerId: "INVALID123", createdAt: new Date()})');

print("\n=== Sample Insurance Schema Design Queries ===");
print("// Find policies with embedded claims by specific customer:");
print('db.policies.find({"customerInfo.customerId": "CUST0001"}).limit(3)');
print("\n// Vehicle insurance aggregation:");
print('db.vehicles.aggregate([{$group: {_id: "$make", avgValue: {$avg: "$marketValue"}, totalVehicles: {$sum: 1}}}])');
print("\n// Claims by policy type:");
print('db.policies.aggregate([{$unwind: "$claims"}, {$group: {_id: "$policyCategory", totalClaims: {$sum: 1}, avgClaimAmount: {$avg: "$claims.claimAmount"}}}])');