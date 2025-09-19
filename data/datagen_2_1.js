// ===== LAB 1 DATA GENERATION SCRIPT =====
// Advanced Querying and Aggregation Framework
// File: lab1_insurance_data.js

// Use this database
use("insurance_analytics");

print("=== Generating Lab 1 Insurance Data ===");

// ===== 1. POLICY TYPES COLLECTION =====
print("Creating policy types...");
db.policy_types.insertMany([
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890001"),
    name: "Auto Insurance",
    code: "AUTO",
    description: "Vehicle insurance coverage including liability, collision, and comprehensive",
    parentType: null,
    level: 1,
    isActive: true,
    baseRates: {
      liability: 50.00,
      collision: 35.00,
      comprehensive: 25.00
    },
    createdAt: new Date("2023-01-15")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890002"),
    name: "Liability Coverage",
    code: "AUTO_LIABILITY",
    description: "Covers damages to other parties in accidents",
    parentType: ObjectId("65f1a1b1c2d3e4f567890001"),
    level: 2,
    isActive: true,
    createdAt: new Date("2023-01-15")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890003"),
    name: "Collision Coverage",
    code: "AUTO_COLLISION",
    description: "Covers damage to your vehicle from collisions",
    parentType: ObjectId("65f1a1b1c2d3e4f567890001"),
    level: 2,
    isActive: true,
    createdAt: new Date("2023-01-15")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890004"),
    name: "Home Insurance",
    code: "HOME",
    description: "Homeowners and renters insurance coverage",
    parentType: null,
    level: 1,
    isActive: true,
    baseRates: {
      dwelling: 120.00,
      personal_property: 60.00,
      liability: 40.00
    },
    createdAt: new Date("2023-01-16")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890005"),
    name: "Life Insurance",
    code: "LIFE",
    description: "Term and whole life insurance policies",
    parentType: null,
    level: 1,
    isActive: true,
    baseRates: {
      term: 25.00,
      whole: 150.00
    },
    createdAt: new Date("2023-01-16")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890006"),
    name: "Commercial Insurance",
    code: "COMMERCIAL",
    description: "Business and commercial property insurance",
    parentType: null,
    level: 1,
    isActive: true,
    baseRates: {
      general_liability: 200.00,
      property: 300.00,
      workers_comp: 150.00
    },
    createdAt: new Date("2023-01-17")
  }
]);

// ===== 2. BRANCHES COLLECTION (with geospatial data) =====
print("Creating insurance branch locations...");
db.branches.insertMany([
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892001"),
    branchCode: "BR-NYC-001",
    name: "Manhattan Financial District Branch",
    address: {
      street: "123 Wall Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-73.9857, 40.7484] // [longitude, latitude]
    },
    phone: "+1-212-555-0101",
    email: "manhattan@insuranceco.com",
    specialties: ["Auto", "Commercial", "Property"],
    isActive: true,
    businessHours: {
      monday: "8:00-17:00",
      tuesday: "8:00-17:00",
      wednesday: "8:00-17:00",
      thursday: "8:00-17:00",
      friday: "8:00-17:00",
      saturday: "9:00-13:00",
      sunday: "Closed"
    },
    manager: "Sarah Johnson",
    agentCount: 25,
    territory: "Manhattan",
    createdAt: new Date("2023-02-01")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892002"),
    branchCode: "BR-BRK-001",
    name: "Brooklyn Heights Branch",
    address: {
      street: "456 Brooklyn Heights Promenade",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11201",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-73.9442, 40.6892]
    },
    phone: "+1-718-555-0202",
    email: "brooklyn@insuranceco.com",
    specialties: ["Auto", "Home", "Life"],
    isActive: true,
    businessHours: {
      monday: "8:00-18:00",
      tuesday: "8:00-18:00",
      wednesday: "8:00-18:00",
      thursday: "8:00-18:00",
      friday: "8:00-18:00",
      saturday: "9:00-14:00",
      sunday: "Closed"
    },
    manager: "Michael Chen",
    agentCount: 18,
    territory: "Brooklyn",
    createdAt: new Date("2023-02-15")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892003"),
    branchCode: "BR-QNS-001",
    name: "Queens Central Branch",
    address: {
      street: "789 Queens Boulevard",
      city: "Queens",
      state: "NY",
      zipCode: "11375",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-73.8370, 40.7282]
    },
    phone: "+1-718-555-0303",
    email: "queens@insuranceco.com",
    specialties: ["Auto", "Home"],
    isActive: true,
    businessHours: {
      monday: "8:00-17:00",
      tuesday: "8:00-17:00",
      wednesday: "8:00-17:00",
      thursday: "8:00-17:00",
      friday: "8:00-17:00",
      saturday: "9:00-13:00",
      sunday: "Closed"
    },
    manager: "Jennifer Davis",
    agentCount: 12,
    territory: "Queens",
    createdAt: new Date("2023-03-01")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892004"),
    branchCode: "BR-NYC-002",
    name: "Midtown Commercial Branch",
    address: {
      street: "321 Madison Avenue",
      city: "New York",
      state: "NY",
      zipCode: "10018",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-73.9876, 40.7505]
    },
    phone: "+1-212-555-0404",
    email: "midtown@insuranceco.com",
    specialties: ["Commercial", "Professional Liability", "Cyber"],
    isActive: true,
    businessHours: {
      monday: "7:00-19:00",
      tuesday: "7:00-19:00",
      wednesday: "7:00-19:00",
      thursday: "7:00-19:00",
      friday: "7:00-19:00",
      saturday: "9:00-15:00",
      sunday: "Closed"
    },
    manager: "Robert Martinez",
    agentCount: 30,
    territory: "Midtown Manhattan",
    createdAt: new Date("2023-03-15")
  }
]);

// Create 2dsphere index for geospatial queries
db.branches.createIndex({ location: "2dsphere" });

// ===== 3. POLICIES COLLECTION (150 policies with rich data) =====
print("Creating insurance policies...");

// Policy templates with realistic insurance data
const policyTemplates = [
  // Auto Insurance - Full Coverage
  {
    name: "Premium Auto Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890001"),
    annualPremium: 1299.99,
    basePremium: 999.99,
    description: "Comprehensive auto insurance with full coverage including liability, collision, comprehensive, and uninsured motorist protection.",
    coverageTypes: ["liability", "collision", "comprehensive", "uninsured_motorist", "medical_payments"],
    provider: "SafeDrive Insurance",
    productCode: "AUTO-PREM-001",
    policyNumber: "POL-AUTO-001",
    coverageDetails: {
      liability: {
        bodilyInjury: "250000/500000",
        propertyDamage: "100000"
      },
      collision: {
        deductible: "500",
        coverage: "Actual Cash Value"
      },
      comprehensive: {
        deductible: "250",
        coverage: "Actual Cash Value"
      },
      uninsuredMotorist: "250000/500000",
      medicalPayments: "5000",
      termLength: "12 months",
      discounts: ["Multi-Car", "Safe Driver", "Anti-Theft"]
    }
  },
  {
    name: "Standard Auto Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890001"),
    annualPremium: 899.99,
    basePremium: 799.99,
    description: "Essential auto insurance coverage with liability and basic comprehensive protection for budget-conscious drivers.",
    coverageTypes: ["liability", "comprehensive", "uninsured_motorist"],
    provider: "ValueShield Insurance",
    productCode: "AUTO-STD-001",
    policyNumber: "POL-AUTO-002",
    coverageDetails: {
      liability: {
        bodilyInjury: "100000/300000",
        propertyDamage: "50000"
      },
      comprehensive: {
        deductible: "1000",
        coverage: "Actual Cash Value"
      },
      uninsuredMotorist: "100000/300000",
      termLength: "12 months",
      discounts: ["Good Student", "Defensive Driving"]
    }
  },
  // Home Insurance
  {
    name: "Homeowners Comprehensive Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890004"),
    annualPremium: 1899.99,
    basePremium: 1699.99,
    description: "Complete homeowners insurance with dwelling, personal property, liability, and additional living expenses coverage.",
    coverageTypes: ["dwelling", "personal_property", "liability", "medical_payments", "additional_living_expenses"],
    provider: "HomeGuard Insurance",
    productCode: "HOME-COMP-001",
    policyNumber: "POL-HOME-001",
    coverageDetails: {
      dwelling: {
        coverage: "400000",
        deductible: "1000"
      },
      personalProperty: {
        coverage: "200000",
        deductible: "500"
      },
      liability: "300000",
      medicalPayments: "5000",
      additionalLivingExpenses: "80000",
      termLength: "12 months",
      protections: ["Fire", "Theft", "Vandalism", "Weather", "Water Damage"]
    }
  },
  {
    name: "Renters Protection Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890004"),
    annualPremium: 399.99,
    basePremium: 349.99,
    description: "Affordable renters insurance protecting personal belongings and providing liability coverage for apartment and condo renters.",
    coverageTypes: ["personal_property", "liability", "medical_payments", "additional_living_expenses"],
    provider: "RentSafe Insurance",
    productCode: "RENT-PROT-001",
    policyNumber: "POL-RENT-001",
    coverageDetails: {
      personalProperty: {
        coverage: "50000",
        deductible: "250"
      },
      liability: "100000",
      medicalPayments: "1000",
      additionalLivingExpenses: "10000",
      termLength: "12 months",
      protections: ["Theft", "Fire", "Vandalism", "Water Damage"]
    }
  },
  // Life Insurance
  {
    name: "Term Life Insurance Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890005"),
    annualPremium: 599.99,
    basePremium: 549.99,
    description: "Affordable term life insurance providing financial protection for your family with flexible coverage amounts and terms.",
    coverageTypes: ["death_benefit", "accidental_death", "waiver_of_premium"],
    provider: "LifeSecure Insurance",
    productCode: "LIFE-TERM-001",
    policyNumber: "POL-LIFE-001",
    coverageDetails: {
      deathBenefit: "500000",
      term: "20 years",
      accidentalDeath: "1000000",
      waiverOfPremium: true,
      beneficiaries: "Spouse and Children",
      medicalExam: "Required",
      termType: "Level Premium",
      renewability: "Guaranteed Renewable",
      convertibility: "Convertible to Whole Life"
    }
  },
  {
    name: "Whole Life Insurance Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890005"),
    annualPremium: 2899.99,
    basePremium: 2699.99,
    description: "Permanent life insurance with guaranteed death benefit and cash value accumulation for lifetime financial security.",
    coverageTypes: ["death_benefit", "cash_value", "dividend_participation", "loan_provision"],
    provider: "PermanentSecure Insurance",
    productCode: "LIFE-WHOLE-001",
    policyNumber: "POL-LIFE-002",
    coverageDetails: {
      deathBenefit: "250000",
      cashValue: "Growing",
      dividendParticipation: true,
      loanProvision: "Available after 2 years",
      premiumType: "Level Premium",
      paidUpOption: "Available",
      surrenderValue: "After 3 years",
      guaranteedCashValue: "Yes"
    }
  },
  // Commercial Insurance
  {
    name: "Business General Liability Policy",
    policyType: ObjectId("65f1a1b1c2d3e4f567890006"),
    annualPremium: 2499.99,
    basePremium: 2299.99,
    description: "Comprehensive general liability insurance protecting businesses from third-party claims and lawsuits.",
    coverageTypes: ["general_liability", "product_liability", "professional_liability", "cyber_liability"],
    provider: "BusinessShield Insurance",
    productCode: "BIZ-GL-001",
    policyNumber: "POL-BIZ-001",
    coverageDetails: {
      generalLiability: "2000000",
      productLiability: "1000000",
      aggregateLimit: "4000000",
      medicalExpenses: "10000",
      personalInjury: "1000000",
      advertisingInjury: "1000000",
      businessType: ["Retail", "Service", "Manufacturing", "Technology"],
      territory: "United States",
      deductible: "1000"
    }
  }
];

// Generate 150 policies with variations
const policies = [];
for (let i = 0; i < 150; i++) {
  const template = policyTemplates[i % policyTemplates.length];
  const variation = Math.floor(i / policyTemplates.length);
  
  const policy = {
    _id: new ObjectId(),
    name: template.name + (variation > 0 ? ` (Plan ${variation + 1})` : ""),
    policyNumber: template.policyNumber + (variation > 0 ? `-V${variation + 1}` : ""),
    policyType: template.policyType,
    provider: template.provider,
    productCode: template.productCode,
    
    // Premium pricing with variations
    annualPremium: Math.round((template.annualPremium + (Math.random() * 400 - 200)) * 100) / 100,
    basePremium: Math.round((template.basePremium + (Math.random() * 300 - 150)) * 100) / 100,
    
    description: template.description,
    coverageTypes: [...template.coverageTypes],
    coverageDetails: {...template.coverageDetails},
    
    // Policy status and availability
    availability: {
      isActive: Math.random() > 0.1, // 90% active
      states: ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"][Math.floor(Math.random() * 10)],
      ageRange: {
        min: 18,
        max: 75
      },
      underwriter: ["PrimaryUnderwriter", "SecondaryUnderwriter", "SpecialtyUnderwriter"][Math.floor(Math.random() * 3)]
    },
    
    status: "active",
    isFeatured: Math.random() > 0.8, // 20% featured
    hasDiscount: Math.random() > 0.7,   // 30% have discount
    
    // Customer satisfaction ratings
    customerRating: {
      average: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      count: Math.floor(Math.random() * 500) + 1,
      distribution: {
        5: Math.floor(Math.random() * 200),
        4: Math.floor(Math.random() * 150),
        3: Math.floor(Math.random() * 100),
        2: Math.floor(Math.random() * 50),
        1: Math.floor(Math.random() * 25)
      }
    },
    
    // SEO and metadata
    slug: (template.name + (variation > 0 ? ` plan ${variation + 1}` : ""))
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    metaTitle: template.name,
    metaDescription: template.description.substring(0, 160),
    metaKeywords: template.coverageTypes.join(', '),
    
    // Policy documents and brochures
    documents: [
      `https://example.com/policies/${template.productCode.toLowerCase()}-brochure.pdf`,
      `https://example.com/policies/${template.productCode.toLowerCase()}-terms.pdf`,
      `https://example.com/policies/${template.productCode.toLowerCase()}-summary.pdf`
    ],
    
    // Timestamps
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  };

  policies.push(policy);
}

db.policies.insertMany(policies);

// Create text index for advanced search
db.policies.createIndex({
  "name": "text",
  "description": "text",
  "coverageTypes": "text"
}, {
  weights: {
    name: 10,
    description: 5,
    coverageTypes: 1
  },
  name: "policy_text_search"
});

// ===== 4. CUSTOMERS COLLECTION (250 insurance customers) =====
print("Creating insurance customers...");

const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const cities = ["New York", "Brooklyn", "Queens", "Bronx", "Manhattan", "Staten Island", "Jersey City", "Newark", "Yonkers", "New Rochelle"];
const states = ["NY", "NJ", "CT"];

const customers = [];
for (let i = 0; i < 250; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@example.com`;
  const joinDate = new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000);
  
  const customer = {
    _id: new ObjectId(),
    firstName: firstName,
    lastName: lastName,
    email: email,
    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i + 1}`,
    
    // Contact information
    phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    
    // Address
    address: {
      street: `${Math.floor(Math.random() * 9999) + 1} ${["Main St", "Oak Ave", "Pine Rd", "Cedar Ln", "Elm Dr", "Park Ave", "Broadway", "First Ave"][Math.floor(Math.random() * 8)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000),
      country: "USA"
    },
    
    // Demographics
    dateOfBirth: new Date(1960 + Math.random() * 45, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    gender: ["Male", "Female", "Other"][Math.floor(Math.random() * 3)],
    maritalStatus: ["Single", "Married", "Divorced", "Widowed"][Math.floor(Math.random() * 4)],
    occupation: ["Professional", "Teacher", "Engineer", "Manager", "Sales", "Healthcare", "Retired", "Student"][Math.floor(Math.random() * 8)],
    
    // Insurance account details
    customerType: ["individual", "family", "business"][Math.floor(Math.random() * 10) < 6 ? 0 : Math.floor(Math.random() * 2) + 1],
    riskScore: Math.floor(Math.random() * 100) + 1, // 1-100 risk rating
    preferredCoverage: (() => {
      const coverageTypes = ["Auto", "Home", "Life", "Commercial"];
      const selected = [];
      coverageTypes.forEach(coverage => {
        if (Math.random() > 0.4) selected.push(coverage);
      });
      return selected.length > 0 ? selected : [coverageTypes[Math.floor(Math.random() * coverageTypes.length)]];
    })(),
    
    // Insurance history summary
    totalPolicies: Math.floor(Math.random() * 8) + 1,
    totalPremiums: Math.round(Math.random() * 15000 * 100) / 100,
    averagePremium: Math.round(Math.random() * 2000 * 100) / 100,
    lastPolicyDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    claimsHistory: {
      totalClaims: Math.floor(Math.random() * 5),
      totalClaimAmount: Math.round(Math.random() * 25000 * 100) / 100,
      lastClaimDate: Math.random() > 0.6 ? new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000) : null
    },
    
    // Insurance preferences
    preferences: {
      newsletter: Math.random() > 0.3,
      smsNotifications: Math.random() > 0.6,
      emailNotifications: Math.random() > 0.2,
      paperlessBilling: Math.random() > 0.4,
      autoRenewal: Math.random() > 0.7,
      preferredContact: ["phone", "email", "mail"][Math.floor(Math.random() * 3)],
      language: "en",
      paymentMethod: ["credit_card", "bank_transfer", "check"][Math.floor(Math.random() * 3)]
    },
    
    // Account status
    isActive: Math.random() > 0.05, // 95% active
    isVerified: Math.random() > 0.1, // 90% verified
    
    // Timestamps
    joinDate: joinDate,
    createdAt: joinDate,
    lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  };
  
  customers.push(customer);
}

db.customers.insertMany(customers);

// ===== 5. CLAIMS COLLECTION (400 claims) =====
print("Creating insurance claims...");

const customerIds = db.customers.find({}, {_id: 1}).toArray().map(c => c._id);
const policyData = db.policies.find({}, {_id: 1, name: 1, annualPremium: 1, policyType: 1}).toArray();
const claimStatuses = ["submitted", "under_review", "approved", "denied", "settled", "closed"];

const claims = [];
for (let i = 0; i < 400; i++) {
  const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
  const claimDate = new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000); // Claims within 2 years
  const policy = policyData[Math.floor(Math.random() * policyData.length)];
  const status = claimStatuses[Math.floor(Math.random() * claimStatuses.length)];

  // Generate claim details based on policy type
  const claimTypes = ["Auto Accident", "Property Damage", "Theft", "Fire", "Water Damage", "Medical", "Liability"];
  const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
  const claimAmount = Math.round((Math.random() * 50000 + 500) * 100) / 100;
  
  // Generate claim incident details
  const incidentDescription = [
    "Vehicle collision at intersection",
    "Rear-end accident on highway",
    "Tree fell on vehicle during storm",
    "House fire caused by electrical fault",
    "Burglary with stolen personal items",
    "Water damage from burst pipe",
    "Slip and fall accident on property",
    "Vandalism to vehicle",
    "Hail damage to roof and siding",
    "Kitchen fire from cooking accident"
  ][Math.floor(Math.random() * 10)];
  
  // Calculate claim settlement details
  const deductible = [250, 500, 1000, 2500][Math.floor(Math.random() * 4)];
  const settledAmount = status === "settled" || status === "closed" ?
    Math.max(0, Math.round((claimAmount - deductible) * (0.8 + Math.random() * 0.2) * 100) / 100) : 0;
  
  const claim = {
    _id: new ObjectId(),
    claimNumber: `CLM-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
    customerId: customerId,
    policyId: policy._id,

    // Claim details
    claimType: claimType,
    incidentDescription: incidentDescription,
    claimAmount: claimAmount,
    deductible: deductible,
    settledAmount: settledAmount,

    // Claim status
    status: status,
    priority: ["low", "medium", "high", "urgent"][Math.floor(Math.random() * 4)],
    fraudIndicator: Math.random() > 0.95 ? "flagged" : "clear", // 5% flagged for fraud

    // Assignment details
    adjuster: {
      id: `ADJ${Math.floor(Math.random() * 100) + 1}`,
      name: ["John Smith", "Sarah Johnson", "Mike Davis", "Lisa Wilson", "Tom Brown"][Math.floor(Math.random() * 5)],
      phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: "adjuster@insuranceco.com"
    },

    // Incident details
    incidentDate: new Date(claimDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    incidentLocation: {
      address: `${Math.floor(Math.random() * 9999) + 1} ${["Main St", "Oak Ave", "Pine Rd", "Cedar Ln"][Math.floor(Math.random() * 4)]}`,
      city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
      state: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    },

    // Documentation
    documents: [
      "police_report.pdf",
      "photos_damage.zip",
      "medical_records.pdf",
      "estimate_repair.pdf"
    ].slice(0, Math.floor(Math.random() * 4) + 1),

    // Processing notes
    notes: Math.random() > 0.7 ? [
      "Customer provided all required documentation",
      "Waiting for additional evidence",
      "Referred to special investigation unit",
      "Fast-track processing approved"
    ][Math.floor(Math.random() * 4)] : null,

    // Timestamps
    createdAt: claimDate,
    updatedAt: new Date(claimDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    closedAt: status === "closed" ? new Date(claimDate.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000) : null
  };
  
  claims.push(claim);
}

db.claims.insertMany(claims);

// ===== 6. AGENT REVIEWS COLLECTION (800 agent reviews) =====
print("Creating agent reviews...");

const reviewTitles = [
  "Excellent service!", "Great agent support", "Not what I expected", "Amazing customer care",
  "Fast claim processing", "Could be more responsive", "Highly recommended agent", "Average experience",
  "Best insurance experience", "Disappointed with service", "Outstanding customer service", "Will recommend to others",
  "Perfect for my needs", "Exceeded expectations", "Good but not great", "Fantastic support"
];

const reviewComments = [
  "My agent completely exceeded my expectations. Their knowledge of insurance products was outstanding and they explained everything clearly. Claim processing was fast and hassle-free.",
  "Good service but the premiums are a bit high. Response time was reasonable and the agent was helpful when I had questions about my policy.",
  "Perfect for what I needed. Easy to understand policies and well-explained coverage options. Would definitely recommend to others looking for insurance.",
  "Not quite what I was hoping for. The service is adequate but doesn't feel as personalized as I expected. Still gets the job done though.",
  "Outstanding value for the coverage. I've been with them for several years now and they've handled claims perfectly. Great customer support too.",
  "Had some initial confusion about my policy but the agent was quick to clarify everything. Service is excellent now and I'm satisfied with my coverage.",
  "Exactly as promised and very responsive. Service quality is excellent and they handle everything I need. Very happy with my insurance experience.",
  "Decent service but I've seen better rates elsewhere. They get the job done but nothing particularly special about the experience."
];

const reviews = [];
const reviewedAgentIds = new Set();

// Create agent data for reviews
const agents = [];
for (let i = 1; i <= 50; i++) {
  agents.push({
    _id: new ObjectId(),
    agentId: `AGT${String(i).padStart(3, '0')}`,
    name: `Agent ${i}`,
    branch: `Branch ${Math.floor((i-1)/5) + 1}`
  });
}

for (let i = 0; i < 800; i++) {
  // Ensure we have enough variety in reviewed agents
  let agent;
  if (reviewedAgentIds.size < agents.length * 0.8) {
    agent = agents[Math.floor(Math.random() * agents.length)];
    reviewedAgentIds.add(agent._id.toString());
  } else {
    agent = agents[Math.floor(Math.random() * agents.length)];
  }
  
  const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
  const rating = Math.floor(Math.random() * 5) + 1;
  const reviewDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  
  const review = {
    _id: new ObjectId(),
    agentId: agent._id,
    customerId: customerId,
    claimId: Math.random() > 0.5 ? claims[Math.floor(Math.random() * claims.length)]._id : null, // Link to claim if applicable
    
    // Review content
    rating: rating,
    title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
    comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
    
    // Review metadata
    verified: Math.random() > 0.1, // 90% verified customers
    serviceType: ["new_policy", "claim_processing", "policy_renewal", "customer_service"][Math.floor(Math.random() * 4)],
    helpful: {
      yes: Math.floor(Math.random() * 30),
      no: Math.floor(Math.random() * 5),
      total: 0 // Will be calculated
    },
    
    // Moderation
    status: ["approved", "pending", "rejected"][Math.floor(Math.random() * 20) < 18 ? 0 : Math.floor(Math.random() * 2) + 1],
    moderatedBy: Math.random() > 0.8 ? "moderator_" + Math.floor(Math.random() * 5) : null,
    flags: Math.random() > 0.95 ? ["spam", "inappropriate", "fake"][Math.floor(Math.random() * 3)] : [],
    
    // Timestamps
    createdAt: reviewDate,
    updatedAt: reviewDate
  };
  
  // Calculate total helpful votes
  review.helpful.total = review.helpful.yes + review.helpful.no;
  
  reviews.push(review);
}

db.reviews.insertMany(reviews);

print("=== Lab 1 Insurance Data Generation Complete ===");
print("Collections created:");
print("- policy_types: " + db.policy_types.countDocuments());
print("- branches: " + db.branches.countDocuments());
print("- policies: " + db.policies.countDocuments());
print("- customers: " + db.customers.countDocuments());
print("- claims: " + db.claims.countDocuments());
print("- reviews: " + db.reviews.countDocuments());

print("\n=== Sample Queries to Test Lab 1 Insurance Data ===");
print("// Text search example:");
print('db.policies.find({$text: {$search: "auto liability"}}).limit(5)');
print("\n// Geospatial query example:");
print('db.branches.find({location: {$near: {$geometry: {type: "Point", coordinates: [-73.9857, 40.7484]}, $maxDistance: 5000}}})');
print("\n// Coverage type operations example:");
print('db.policies.find({coverageTypes: {$all: ["liability", "collision"]}, annualPremium: {$gte: 500, $lte: 2000}}).limit(5)');