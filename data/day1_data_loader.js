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
db = db.getSiblingDB('insurance_company');

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
print("Creating branches collection (5 branches)...");

// Insert branches using individual variables to avoid multiline hanging issues
var branch1 = {_id: "BR001", branchCode: "BR-NY-001", name: "New York Financial District", address: {street: "123 Wall Street", city: "New York", state: "NY", zipCode: "10001"}, location: {type: "Point", coordinates: [-73.9857, 40.7484]}, manager: "Sarah Johnson", agentCount: 15, specialties: ["Auto", "Property", "Life"], isActive: true};
var branch2 = {_id: "BR002", branchCode: "BR-IL-002", name: "Chicago Downtown", address: {street: "456 Michigan Avenue", city: "Chicago", state: "IL", zipCode: "60601"}, location: {type: "Point", coordinates: [-87.6298, 41.8781]}, manager: "Michael Chen", agentCount: 12, specialties: ["Auto", "Commercial", "Property"], isActive: true};
var branch3 = {_id: "BR003", branchCode: "BR-CA-003", name: "Los Angeles Business District", address: {street: "789 Business Plaza", city: "Los Angeles", state: "CA", zipCode: "90210"}, location: {type: "Point", coordinates: [-118.2437, 34.0522]}, manager: "Emily Rodriguez", agentCount: 18, specialties: ["Property", "Life", "Cyber"], isActive: true};
var branch4 = {_id: "BR004", branchCode: "BR-TX-004", name: "Houston Metro Plaza", address: {street: "321 Energy Center", city: "Houston", state: "TX", zipCode: "77002"}, location: {type: "Point", coordinates: [-95.3698, 29.7604]}, manager: "David Thompson", agentCount: 14, specialties: ["Commercial", "Auto", "Property"], isActive: true};
var branch5 = {_id: "BR005", branchCode: "BR-AZ-005", name: "Phoenix City Center", address: {street: "555 Desert Ridge", city: "Phoenix", state: "AZ", zipCode: "85001"}, location: {type: "Point", coordinates: [-112.0740, 33.4484]}, manager: "Lisa Williams", agentCount: 11, specialties: ["Auto", "Life"], isActive: true};

db.branches.insertMany([branch1, branch2, branch3, branch4, branch5]);

print("✓ Created " + db.branches.countDocuments() + " insurance branches");

// Lab 3: CRUD Create and Insert Operations
print("\n🏢 Loading data for Lab 3: CRUD Create and Insert");
print("------------------------------------------------");

// Create policies collection with sample policies
print("Creating insurance policies (10 policies)...");

var policy1 = {_id: ObjectId(), policyNumber: "POL-AUTO-001", name: "Premium Auto Coverage", policyType: "Auto", annualPremium: 1299.99, coverageDetails: {liability: "250000/500000", collision: {deductible: 500, coverage: "Full"}, comprehensive: {deductible: 250, coverage: "Full"}}, coverageTypes: ["liability", "collision", "comprehensive"], isActive: true, createdAt: new Date("2024-01-15"), expirationDate: new Date("2025-01-15")};
var policy2 = {_id: ObjectId(), policyNumber: "POL-HOME-001", name: "Homeowners Protection", policyType: "Property", annualPremium: 1899.99, coverageDetails: {dwelling: {coverage: 400000, deductible: 1000}, personalProperty: {coverage: 200000, deductible: 500}, liability: 300000}, coverageTypes: ["dwelling", "personal_property", "liability"], isActive: true, createdAt: new Date("2024-02-01"), expirationDate: new Date("2025-02-01")};
var policy3 = {_id: ObjectId(), policyNumber: "POL-LIFE-001", name: "Term Life Insurance", policyType: "Life", annualPremium: 599.99, coverageDetails: {deathBenefit: 500000, term: "20 years", beneficiaries: "Spouse and Children"}, coverageTypes: ["death_benefit", "accidental_death"], isActive: true, createdAt: new Date("2024-03-01"), expirationDate: new Date("2044-03-01")};
var policy4 = {_id: ObjectId(), policyNumber: "POL-AUTO-002", name: "Standard Auto Coverage", policyType: "Auto", annualPremium: 899.99, coverageDetails: {liability: "100000/300000", collision: {deductible: 1000, coverage: "Limited"}}, coverageTypes: ["liability", "collision"], isActive: true, createdAt: new Date("2024-01-20"), expirationDate: new Date("2025-01-20")};
var policy5 = {_id: ObjectId(), policyNumber: "POL-COMM-001", name: "Business Liability", policyType: "Commercial", annualPremium: 2499.99, coverageDetails: {generalLiability: 2000000, productLiability: 1000000, businessType: "Technology"}, coverageTypes: ["general_liability", "product_liability"], isActive: true, createdAt: new Date("2024-02-10"), expirationDate: new Date("2025-02-10")};
var policy6 = {_id: ObjectId(), policyNumber: "POL-AUTO-003", name: "Economy Auto Coverage", policyType: "Auto", annualPremium: 649.99, coverageDetails: {liability: "50000/100000"}, coverageTypes: ["liability"], isActive: false, createdAt: new Date("2023-12-01"), expirationDate: new Date("2024-12-01")};
var policy7 = {_id: ObjectId(), policyNumber: "POL-CYBER-001", name: "Cyber Security Protection", policyType: "Cyber", annualPremium: 3299.99, coverageDetails: {dataBreachCoverage: 5000000, businessInterruption: 2000000, cyberExtortion: 1000000}, coverageTypes: ["data_breach", "business_interruption", "cyber_extortion"], isActive: true, createdAt: new Date("2024-03-15"), expirationDate: new Date("2025-03-15")};
var policy8 = {_id: ObjectId(), policyNumber: "POL-HEALTH-001", name: "Group Health Plan", policyType: "Health", annualPremium: 8999.99, coverageDetails: {medicalCoverage: "Comprehensive", dentalCoverage: "Basic", visionCoverage: "Standard"}, coverageTypes: ["medical", "dental", "vision"], isActive: true, createdAt: new Date("2024-01-01"), expirationDate: new Date("2025-01-01")};
var policy9 = {_id: ObjectId(), policyNumber: "POL-PROP-002", name: "Commercial Property", policyType: "Property", annualPremium: 4599.99, coverageDetails: {buildingCoverage: 2000000, equipmentCoverage: 500000, businessPersonalProperty: 300000}, coverageTypes: ["building", "equipment", "business_property"], isActive: true, createdAt: new Date("2024-02-20"), expirationDate: new Date("2025-02-20")};
var policy10 = {_id: ObjectId(), policyNumber: "POL-LIFE-002", name: "Whole Life Insurance", policyType: "Life", annualPremium: 1299.99, coverageDetails: {deathBenefit: 250000, cashValue: "Accumulating", term: "Lifetime"}, coverageTypes: ["death_benefit", "cash_value"], isActive: true, createdAt: new Date("2024-03-10"), expirationDate: new Date("2074-03-10")};

db.policies.insertMany([policy1, policy2, policy3, policy4, policy5, policy6, policy7, policy8, policy9, policy10]);
print("✓ Created " + db.policies.countDocuments() + " insurance policies");

// Create customers collection
print("Creating insurance customers (20 customers)...");

var customer1 = {_id: ObjectId(), customerId: "CUST000001", firstName: "John", lastName: "Smith", email: "john.smith@email.com", phone: "+1-555-0101", address: {street: "123 Main Street", city: "New York", state: "NY", zipCode: "10001"}, dateOfBirth: new Date("1985-06-15"), customerType: "individual", riskScore: 75, registrationDate: new Date("2024-01-10"), isActive: true};
var customer2 = {_id: ObjectId(), customerId: "CUST000002", firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@email.com", phone: "+1-555-0102", address: {street: "456 Oak Avenue", city: "Chicago", state: "IL", zipCode: "60601"}, dateOfBirth: new Date("1978-03-22"), customerType: "family", riskScore: 60, registrationDate: new Date("2024-02-15"), isActive: true};
var customer3 = {_id: ObjectId(), customerId: "CUST000003", firstName: "Michael", lastName: "Davis", email: "michael.davis@business.com", phone: "+1-555-0103", address: {street: "789 Business Plaza", city: "New York", state: "NY", zipCode: "10002"}, dateOfBirth: new Date("1972-11-08"), customerType: "business", riskScore: 45, registrationDate: new Date("2024-03-01"), isActive: true};
var customer4 = {_id: ObjectId(), customerId: "CUST000004", firstName: "Emily", lastName: "Rodriguez", email: "emily.rodriguez@email.com", phone: "+1-555-0104", address: {street: "321 Pine Street", city: "Los Angeles", state: "CA", zipCode: "90210"}, dateOfBirth: new Date("1990-07-12"), customerType: "individual", riskScore: 85, registrationDate: new Date("2024-01-20"), isActive: true};
var customer5 = {_id: ObjectId(), customerId: "CUST000005", firstName: "David", lastName: "Thompson", email: "david.thompson@email.com", phone: "+1-555-0105", address: {street: "654 Cedar Lane", city: "Houston", state: "TX", zipCode: "77002"}, dateOfBirth: new Date("1983-04-28"), customerType: "family", riskScore: 70, registrationDate: new Date("2024-02-10"), isActive: true};
var customer6 = {_id: ObjectId(), customerId: "CUST000006", firstName: "Lisa", lastName: "Williams", email: "lisa.williams@email.com", phone: "+1-555-0106", address: {street: "987 Elm Drive", city: "Phoenix", state: "AZ", zipCode: "85001"}, dateOfBirth: new Date("1976-09-15"), customerType: "individual", riskScore: 55, registrationDate: new Date("2024-01-25"), isActive: true};
var customer7 = {_id: ObjectId(), customerId: "CUST000007", firstName: "Robert", lastName: "Brown", email: "robert.brown@company.com", phone: "+1-555-0107", address: {street: "147 Corporate Blvd", city: "Philadelphia", state: "PA", zipCode: "19101"}, dateOfBirth: new Date("1969-12-03"), customerType: "business", riskScore: 40, registrationDate: new Date("2024-03-05"), isActive: true};
var customer8 = {_id: ObjectId(), customerId: "CUST000008", firstName: "Jennifer", lastName: "Davis", email: "jennifer.davis@email.com", phone: "+1-555-0108", address: {street: "258 Maple Street", city: "San Antonio", state: "TX", zipCode: "78201"}, dateOfBirth: new Date("1988-02-18"), customerType: "family", riskScore: 80, registrationDate: new Date("2024-02-20"), isActive: true};
var customer9 = {_id: ObjectId(), customerId: "CUST000009", firstName: "William", lastName: "Miller", email: "william.miller@email.com", phone: "+1-555-0109", address: {street: "369 Harbor View", city: "San Diego", state: "CA", zipCode: "92101"}, dateOfBirth: new Date("1981-08-07"), customerType: "individual", riskScore: 65, registrationDate: new Date("2024-01-30"), isActive: true};
var customer10 = {_id: ObjectId(), customerId: "CUST000010", firstName: "Mary", lastName: "Wilson", email: "mary.wilson@email.com", phone: "+1-555-0110", address: {street: "741 Tower Road", city: "Dallas", state: "TX", zipCode: "75201"}, dateOfBirth: new Date("1975-05-24"), customerType: "family", riskScore: 50, registrationDate: new Date("2024-02-25"), isActive: true};
var customer11 = {_id: ObjectId(), customerId: "CUST000011", firstName: "James", lastName: "Moore", email: "james.moore@email.com", phone: "+1-555-0111", address: {street: "852 Congress Ave", city: "Austin", state: "TX", zipCode: "73301"}, dateOfBirth: new Date("1987-10-11"), customerType: "individual", riskScore: 75, registrationDate: new Date("2024-03-10"), isActive: true};
var customer12 = {_id: ObjectId(), customerId: "CUST000012", firstName: "Patricia", lastName: "Taylor", email: "patricia.taylor@email.com", phone: "+1-555-0112", address: {street: "963 River Plaza", city: "Jacksonville", state: "FL", zipCode: "32202"}, dateOfBirth: new Date("1973-01-16"), customerType: "family", riskScore: 60, registrationDate: new Date("2024-01-15"), isActive: true};
var customer13 = {_id: ObjectId(), customerId: "CUST000013", firstName: "Christopher", lastName: "Anderson", email: "christopher.anderson@business.com", phone: "+1-555-0113", address: {street: "159 Stockyards Way", city: "Fort Worth", state: "TX", zipCode: "76102"}, dateOfBirth: new Date("1979-06-29"), customerType: "business", riskScore: 35, registrationDate: new Date("2024-02-05"), isActive: true};
var customer14 = {_id: ObjectId(), customerId: "CUST000014", firstName: "Linda", lastName: "Thomas", email: "linda.thomas@email.com", phone: "+1-555-0114", address: {street: "357 High Street", city: "Columbus", state: "OH", zipCode: "43215"}, dateOfBirth: new Date("1984-11-20"), customerType: "individual", riskScore: 70, registrationDate: new Date("2024-03-15"), isActive: true};
var customer15 = {_id: ObjectId(), customerId: "CUST000015", firstName: "Matthew", lastName: "Jackson", email: "matthew.jackson@email.com", phone: "+1-555-0115", address: {street: "468 Banking Center", city: "Charlotte", state: "NC", zipCode: "28202"}, dateOfBirth: new Date("1991-03-08"), customerType: "family", riskScore: 85, registrationDate: new Date("2024-01-05"), isActive: true};
var customer16 = {_id: ObjectId(), customerId: "CUST000016", firstName: "Barbara", lastName: "White", email: "barbara.white@email.com", phone: "+1-555-0116", address: {street: "579 Pike Place", city: "Seattle", state: "WA", zipCode: "98101"}, dateOfBirth: new Date("1977-08-14"), customerType: "individual", riskScore: 55, registrationDate: new Date("2024-02-12"), isActive: true};
var customer17 = {_id: ObjectId(), customerId: "CUST000017", firstName: "Robert", lastName: "Johnson", email: "robert.johnson@email.com", phone: "+1-555-0117", address: {street: "680 Mile High Plaza", city: "Denver", state: "CO", zipCode: "80202"}, dateOfBirth: new Date("1982-12-05"), customerType: "family", riskScore: 65, registrationDate: new Date("2024-03-20"), isActive: true};
var customer18 = {_id: ObjectId(), customerId: "CUST000018", firstName: "Susan", lastName: "Davis", email: "susan.davis@company.com", phone: "+1-555-0118", address: {street: "791 Freedom Trail", city: "Boston", state: "MA", zipCode: "02101"}, dateOfBirth: new Date("1970-04-22"), customerType: "business", riskScore: 45, registrationDate: new Date("2024-01-18"), isActive: true};
var customer19 = {_id: ObjectId(), customerId: "CUST000019", firstName: "Kevin", lastName: "Wilson", email: "kevin.wilson@email.com", phone: "+1-555-0119", address: {street: "802 Music Row", city: "Nashville", state: "TN", zipCode: "37203"}, dateOfBirth: new Date("1986-07-31"), customerType: "individual", riskScore: 80, registrationDate: new Date("2024-02-28"), isActive: true};
var customer20 = {_id: ObjectId(), customerId: "CUST000020", firstName: "Michelle", lastName: "Brown", email: "michelle.brown@email.com", phone: "+1-555-0120", address: {street: "913 Inner Harbor", city: "Baltimore", state: "MD", zipCode: "21202"}, dateOfBirth: new Date("1974-09-25"), customerType: "family", riskScore: 60, registrationDate: new Date("2024-03-25"), isActive: true};

db.customers.insertMany([customer1, customer2, customer3, customer4, customer5, customer6, customer7, customer8, customer9, customer10, customer11, customer12, customer13, customer14, customer15, customer16, customer17, customer18, customer19, customer20]);
print("✓ Created " + db.customers.countDocuments() + " insurance customers");

// Lab 4: CRUD Read and Query Operations
print("\n🔍 Loading data for Lab 4: CRUD Read and Query");
print("----------------------------------------------");

// Add agents for relationship queries
print("Creating insurance agents (10 agents)...");

var agent1 = {_id: ObjectId(), agentId: "AGT001", firstName: "Emily", lastName: "Rodriguez", email: "emily.rodriguez@insuranceco.com", phone: "+1-555-0201", branchId: "BR001", territory: "Manhattan", specialties: ["Auto", "Property"], licenseNumber: "LIC-NY-12345", isActive: true, hireDate: new Date("2022-03-15")};
var agent2 = {_id: ObjectId(), agentId: "AGT002", firstName: "David", lastName: "Thompson", email: "david.thompson@insuranceco.com", phone: "+1-555-0202", branchId: "BR002", territory: "Chicago Loop", specialties: ["Commercial", "Life"], licenseNumber: "LIC-IL-67890", isActive: true, hireDate: new Date("2021-08-22")};
var agent3 = {_id: ObjectId(), agentId: "AGT003", firstName: "Amanda", lastName: "Garcia", email: "amanda.garcia@insuranceco.com", phone: "+1-555-0203", branchId: "BR003", territory: "West LA", specialties: ["Property", "Cyber"], licenseNumber: "LIC-CA-11111", isActive: true, hireDate: new Date("2023-01-10")};
var agent4 = {_id: ObjectId(), agentId: "AGT004", firstName: "Brian", lastName: "Taylor", email: "brian.taylor@insuranceco.com", phone: "+1-555-0204", branchId: "BR004", territory: "Houston Central", specialties: ["Commercial", "Auto"], licenseNumber: "LIC-TX-22222", isActive: true, hireDate: new Date("2022-06-12")};
var agent5 = {_id: ObjectId(), agentId: "AGT005", firstName: "Rachel", lastName: "Anderson", email: "rachel.anderson@insuranceco.com", phone: "+1-555-0205", branchId: "BR005", territory: "Phoenix Metro", specialties: ["Life", "Health"], licenseNumber: "LIC-AZ-33333", isActive: true, hireDate: new Date("2023-03-20")};
var agent6 = {_id: ObjectId(), agentId: "AGT006", firstName: "Jason", lastName: "White", email: "jason.white@insuranceco.com", phone: "+1-555-0206", branchId: "BR001", territory: "Brooklyn", specialties: ["Auto", "Property"], licenseNumber: "LIC-NY-44444", isActive: true, hireDate: new Date("2022-09-15")};
var agent7 = {_id: ObjectId(), agentId: "AGT007", firstName: "Nicole", lastName: "Thompson", email: "nicole.thompson@insuranceco.com", phone: "+1-555-0207", branchId: "BR002", territory: "Chicago South", specialties: ["Life", "Cyber"], licenseNumber: "LIC-IL-55555", isActive: true, hireDate: new Date("2021-11-08")};
var agent8 = {_id: ObjectId(), agentId: "AGT008", firstName: "Mark", lastName: "Davis", email: "mark.davis@insuranceco.com", phone: "+1-555-0208", branchId: "BR003", territory: "Beverly Hills", specialties: ["Commercial", "Property"], licenseNumber: "LIC-CA-66666", isActive: true, hireDate: new Date("2023-05-14")};
var agent9 = {_id: ObjectId(), agentId: "AGT009", firstName: "Lisa", lastName: "Miller", email: "lisa.miller@insuranceco.com", phone: "+1-555-0209", branchId: "BR004", territory: "Houston North", specialties: ["Auto", "Health"], licenseNumber: "LIC-TX-77777", isActive: true, hireDate: new Date("2022-12-03")};
var agent10 = {_id: ObjectId(), agentId: "AGT010", firstName: "Kevin", lastName: "Wilson", email: "kevin.wilson@insuranceco.com", phone: "+1-555-0210", branchId: "BR005", territory: "Scottsdale", specialties: ["Life", "Property"], licenseNumber: "LIC-AZ-88888", isActive: true, hireDate: new Date("2023-07-18")};

db.agents.insertMany([agent1, agent2, agent3, agent4, agent5, agent6, agent7, agent8, agent9, agent10]);
print("✓ Created " + db.agents.countDocuments() + " insurance agents");

// Lab 5: CRUD Update and Delete Operations
print("\n✏️ Loading data for Lab 5: CRUD Update and Delete");
print("------------------------------------------------");

// Add claims for update/delete examples
print("Creating insurance claims (15 claims)...");

var claim1 = {_id: ObjectId(), claimNumber: "CLM-2024-001001", customerId: "CUST000001", policyNumber: "POL-AUTO-001", claimType: "Auto Accident", claimAmount: 8500.00, deductible: 500.00, status: "submitted", incidentDate: new Date("2024-03-15"), incidentDescription: "Rear-end collision at intersection", adjusterAssigned: "ADJ001", createdAt: new Date("2024-03-16")};
var claim2 = {_id: ObjectId(), claimNumber: "CLM-2024-001002", customerId: "CUST000002", policyNumber: "POL-HOME-001", claimType: "Property Damage", claimAmount: 15000.00, deductible: 1000.00, status: "under_review", incidentDate: new Date("2024-03-10"), incidentDescription: "Water damage from burst pipe", adjusterAssigned: "ADJ002", createdAt: new Date("2024-03-11")};
var claim3 = {_id: ObjectId(), claimNumber: "CLM-2024-001003", customerId: "CUST000001", policyNumber: "POL-AUTO-001", claimType: "Theft", claimAmount: 2500.00, deductible: 250.00, status: "approved", incidentDate: new Date("2024-02-28"), incidentDescription: "Vehicle break-in and theft of personal items", adjusterAssigned: "ADJ001", settledAmount: 2250.00, createdAt: new Date("2024-03-01"), settledAt: new Date("2024-03-10")};
var claim4 = {_id: ObjectId(), claimNumber: "CLM-2024-001004", customerId: "CUST000003", policyNumber: "POL-COMM-001", claimType: "Liability Claim", claimAmount: 45000.00, deductible: 5000.00, status: "investigating", incidentDate: new Date("2024-03-05"), incidentDescription: "Customer slip and fall at business premises", adjusterAssigned: "ADJ003", createdAt: new Date("2024-03-06")};
var claim5 = {_id: ObjectId(), claimNumber: "CLM-2024-001005", customerId: "CUST000004", policyNumber: "POL-AUTO-002", claimType: "Auto Accident", claimAmount: 12000.00, deductible: 1000.00, status: "approved", incidentDate: new Date("2024-02-20"), incidentDescription: "Multi-vehicle collision on highway", adjusterAssigned: "ADJ001", settledAmount: 11000.00, createdAt: new Date("2024-02-21"), settledAt: new Date("2024-03-05")};
var claim6 = {_id: ObjectId(), claimNumber: "CLM-2024-001006", customerId: "CUST000005", policyNumber: "POL-LIFE-001", claimType: "Life Insurance Claim", claimAmount: 500000.00, deductible: 0.00, status: "pending", incidentDate: new Date("2024-03-12"), incidentDescription: "Death benefit claim", adjusterAssigned: "ADJ004", createdAt: new Date("2024-03-13")};
var claim7 = {_id: ObjectId(), claimNumber: "CLM-2024-001007", customerId: "CUST000006", policyNumber: "POL-AUTO-003", claimType: "Vandalism", claimAmount: 3500.00, deductible: 500.00, status: "denied", incidentDate: new Date("2024-02-15"), incidentDescription: "Vehicle vandalism in parking lot", adjusterAssigned: "ADJ002", denialReason: "Policy lapsed", createdAt: new Date("2024-02-16")};
var claim8 = {_id: ObjectId(), claimNumber: "CLM-2024-001008", customerId: "CUST000007", policyNumber: "POL-CYBER-001", claimType: "Data Breach", claimAmount: 85000.00, deductible: 10000.00, status: "under_review", incidentDate: new Date("2024-03-08"), incidentDescription: "Ransomware attack on company systems", adjusterAssigned: "ADJ005", createdAt: new Date("2024-03-09")};
var claim9 = {_id: ObjectId(), claimNumber: "CLM-2024-001009", customerId: "CUST000008", policyNumber: "POL-HEALTH-001", claimType: "Medical Claim", claimAmount: 25000.00, deductible: 2000.00, status: "approved", incidentDate: new Date("2024-03-01"), incidentDescription: "Emergency surgery and hospitalization", adjusterAssigned: "ADJ006", settledAmount: 23000.00, createdAt: new Date("2024-03-02"), settledAt: new Date("2024-03-12")};
var claim10 = {_id: ObjectId(), claimNumber: "CLM-2024-001010", customerId: "CUST000009", policyNumber: "POL-PROP-002", claimType: "Fire Damage", claimAmount: 125000.00, deductible: 5000.00, status: "investigating", incidentDate: new Date("2024-03-18"), incidentDescription: "Kitchen fire spread to adjacent rooms", adjusterAssigned: "ADJ007", createdAt: new Date("2024-03-19")};
var claim11 = {_id: ObjectId(), claimNumber: "CLM-2024-001011", customerId: "CUST000010", policyNumber: "POL-AUTO-001", claimType: "Hail Damage", claimAmount: 6500.00, deductible: 500.00, status: "submitted", incidentDate: new Date("2024-03-20"), incidentDescription: "Severe hailstorm damaged vehicle exterior", adjusterAssigned: "ADJ001", createdAt: new Date("2024-03-21")};
var claim12 = {_id: ObjectId(), claimNumber: "CLM-2024-001012", customerId: "CUST000011", policyNumber: "POL-LIFE-002", claimType: "Disability Claim", claimAmount: 15000.00, deductible: 0.00, status: "approved", incidentDate: new Date("2024-02-10"), incidentDescription: "Work-related injury causing temporary disability", adjusterAssigned: "ADJ004", settledAmount: 15000.00, createdAt: new Date("2024-02-11"), settledAt: new Date("2024-03-15")};
var claim13 = {_id: ObjectId(), claimNumber: "CLM-2024-001013", customerId: "CUST000012", policyNumber: "POL-HOME-001", claimType: "Storm Damage", claimAmount: 18000.00, deductible: 1000.00, status: "under_review", incidentDate: new Date("2024-03-14"), incidentDescription: "Tree fell on roof during storm", adjusterAssigned: "ADJ002", createdAt: new Date("2024-03-15")};
var claim14 = {_id: ObjectId(), claimNumber: "CLM-2024-001014", customerId: "CUST000013", policyNumber: "POL-COMM-001", claimType: "Equipment Theft", claimAmount: 35000.00, deductible: 2500.00, status: "investigating", incidentDate: new Date("2024-03-22"), incidentDescription: "Theft of computer equipment from office", adjusterAssigned: "ADJ003", createdAt: new Date("2024-03-23")};
var claim15 = {_id: ObjectId(), claimNumber: "CLM-2024-001015", customerId: "CUST000014", policyNumber: "POL-AUTO-002", claimType: "Glass Damage", claimAmount: 800.00, deductible: 100.00, status: "approved", incidentDate: new Date("2024-03-17"), incidentDescription: "Rock chip caused windshield crack", adjusterAssigned: "ADJ001", settledAmount: 700.00, createdAt: new Date("2024-03-18"), settledAt: new Date("2024-03-20")};

db.claims.insertMany([claim1, claim2, claim3, claim4, claim5, claim6, claim7, claim8, claim9, claim10, claim11, claim12, claim13, claim14, claim15]);
print("✓ Created " + db.claims.countDocuments() + " insurance claims");

// Add payments for transaction examples
print("Creating payment records (20 payments)...");

var payment1 = {_id: ObjectId(), paymentId: "PAY-2024-001001", customerId: "CUST000001", policyNumber: "POL-AUTO-001", amount: 108.33, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-01-15"), dueDate: new Date("2024-01-15")};
var payment2 = {_id: ObjectId(), paymentId: "PAY-2024-001002", customerId: "CUST000002", policyNumber: "POL-HOME-001", amount: 158.33, paymentType: "premium", paymentMethod: "credit_card", status: "completed", paymentDate: new Date("2024-02-01"), dueDate: new Date("2024-02-01")};
var payment3 = {_id: ObjectId(), paymentId: "PAY-2024-001003", customerId: "CUST000001", claimNumber: "CLM-2024-001003", amount: 2250.00, paymentType: "claim_settlement", paymentMethod: "check", status: "completed", paymentDate: new Date("2024-03-10")};
var payment4 = {_id: ObjectId(), paymentId: "PAY-2024-001004", customerId: "CUST000003", policyNumber: "POL-COMM-001", amount: 208.33, paymentType: "premium", paymentMethod: "bank_transfer", status: "completed", paymentDate: new Date("2024-02-10"), dueDate: new Date("2024-02-10")};
var payment5 = {_id: ObjectId(), paymentId: "PAY-2024-001005", customerId: "CUST000004", policyNumber: "POL-AUTO-002", amount: 75.00, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-01-20"), dueDate: new Date("2024-01-20")};
var payment6 = {_id: ObjectId(), paymentId: "PAY-2024-001006", customerId: "CUST000005", claimNumber: "CLM-2024-001005", amount: 11000.00, paymentType: "claim_settlement", paymentMethod: "direct_deposit", status: "completed", paymentDate: new Date("2024-03-05")};
var payment7 = {_id: ObjectId(), paymentId: "PAY-2024-001007", customerId: "CUST000006", policyNumber: "POL-AUTO-003", amount: 54.17, paymentType: "premium", paymentMethod: "credit_card", status: "failed", paymentDate: new Date("2024-02-15"), dueDate: new Date("2024-02-15"), failureReason: "Card declined"};
var payment8 = {_id: ObjectId(), paymentId: "PAY-2024-001008", customerId: "CUST000007", policyNumber: "POL-CYBER-001", amount: 274.99, paymentType: "premium", paymentMethod: "bank_transfer", status: "completed", paymentDate: new Date("2024-03-15"), dueDate: new Date("2024-03-15")};
var payment9 = {_id: ObjectId(), paymentId: "PAY-2024-001009", customerId: "CUST000008", claimNumber: "CLM-2024-001009", amount: 23000.00, paymentType: "claim_settlement", paymentMethod: "check", status: "completed", paymentDate: new Date("2024-03-12")};
var payment10 = {_id: ObjectId(), paymentId: "PAY-2024-001010", customerId: "CUST000009", policyNumber: "POL-PROP-002", amount: 383.33, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-02-20"), dueDate: new Date("2024-02-20")};
var payment11 = {_id: ObjectId(), paymentId: "PAY-2024-001011", customerId: "CUST000010", policyNumber: "POL-LIFE-002", amount: 108.33, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-03-10"), dueDate: new Date("2024-03-10")};
var payment12 = {_id: ObjectId(), paymentId: "PAY-2024-001012", customerId: "CUST000011", claimNumber: "CLM-2024-001012", amount: 15000.00, paymentType: "claim_settlement", paymentMethod: "direct_deposit", status: "completed", paymentDate: new Date("2024-03-15")};
var payment13 = {_id: ObjectId(), paymentId: "PAY-2024-001013", customerId: "CUST000012", policyNumber: "POL-HOME-001", amount: 158.33, paymentType: "premium", paymentMethod: "credit_card", status: "pending", paymentDate: new Date("2024-03-15"), dueDate: new Date("2024-03-15")};
var payment14 = {_id: ObjectId(), paymentId: "PAY-2024-001014", customerId: "CUST000013", policyNumber: "POL-COMM-001", amount: 208.33, paymentType: "premium", paymentMethod: "bank_transfer", status: "completed", paymentDate: new Date("2024-02-10"), dueDate: new Date("2024-02-10")};
var payment15 = {_id: ObjectId(), paymentId: "PAY-2024-001015", customerId: "CUST000014", claimNumber: "CLM-2024-001015", amount: 700.00, paymentType: "claim_settlement", paymentMethod: "check", status: "completed", paymentDate: new Date("2024-03-20")};
var payment16 = {_id: ObjectId(), paymentId: "PAY-2024-001016", customerId: "CUST000015", policyNumber: "POL-AUTO-001", amount: 108.33, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-01-15"), dueDate: new Date("2024-01-15")};
var payment17 = {_id: ObjectId(), paymentId: "PAY-2024-001017", customerId: "CUST000016", policyNumber: "POL-LIFE-001", amount: 49.99, paymentType: "premium", paymentMethod: "credit_card", status: "completed", paymentDate: new Date("2024-03-01"), dueDate: new Date("2024-03-01")};
var payment18 = {_id: ObjectId(), paymentId: "PAY-2024-001018", customerId: "CUST000017", policyNumber: "POL-AUTO-002", amount: 75.00, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-01-20"), dueDate: new Date("2024-01-20")};
var payment19 = {_id: ObjectId(), paymentId: "PAY-2024-001019", customerId: "CUST000018", policyNumber: "POL-COMM-001", amount: 208.33, paymentType: "premium", paymentMethod: "bank_transfer", status: "completed", paymentDate: new Date("2024-02-10"), dueDate: new Date("2024-02-10")};
var payment20 = {_id: ObjectId(), paymentId: "PAY-2024-001020", customerId: "CUST000019", policyNumber: "POL-HEALTH-001", amount: 749.99, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-01-01"), dueDate: new Date("2024-01-01")};

db.payments.insertMany([payment1, payment2, payment3, payment4, payment5, payment6, payment7, payment8, payment9, payment10, payment11, payment12, payment13, payment14, payment15, payment16, payment17, payment18, payment19, payment20]);
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

// Get collection counts using individual variables to avoid hanging
var branchCount = db.branches.countDocuments();
var policyCount = db.policies.countDocuments();
var customerCount = db.customers.countDocuments();
var agentCount = db.agents.countDocuments();
var claimCount = db.claims.countDocuments();
var paymentCount = db.payments.countDocuments();

print("Collections created:");
print("- Branches: " + branchCount);
print("- Policies: " + policyCount);
print("- Customers: " + customerCount);
print("- Agents: " + agentCount);
print("- Claims: " + claimCount);
print("- Payments: " + paymentCount);

// Verify indexes using individual calls to avoid hanging
print("\nIndexes created:");
var branchIndexes = db.branches.getIndexes();
var policyIndexes = db.policies.getIndexes();
var customerIndexes = db.customers.getIndexes();
var agentIndexes = db.agents.getIndexes();
var claimIndexes = db.claims.getIndexes();
var paymentIndexes = db.payments.getIndexes();
print("- branches: " + branchIndexes.length + " indexes");
print("- policies: " + policyIndexes.length + " indexes");
print("- customers: " + customerIndexes.length + " indexes");
print("- agents: " + agentIndexes.length + " indexes");
print("- claims: " + claimIndexes.length + " indexes");
print("- payments: " + paymentIndexes.length + " indexes");

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