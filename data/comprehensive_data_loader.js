// ===== COMPREHENSIVE 3-DAY COURSE DATA LOADER SCRIPT =====
// MongoDB Mastering Course - Complete Data Loader for All 3 Days
// Usage: mongosh < comprehensive_data_loader.js
// Purpose: Load ALL data needed for the entire 3-day MongoDB course

print("=======================================================");
print("MongoDB Mastering Course - Comprehensive Data Loader");
print("=======================================================");
print("Loading complete insurance dataset for 3-day course...");
print("Coverage: All Labs 1-14c (Fundamentals → Advanced → Production)");
print("=======================================================\n");

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function loadScript(scriptName) {
    print(`\n🔄 Loading ${scriptName}...`);
    print("━".repeat(60));

    // Try multiple path variations for cross-platform compatibility
    const pathVariations = [
        scriptName,                    // Direct filename (works from data directory)
        `data/${scriptName}`,          // From project root (Unix)
        `data\\${scriptName}`,         // From project root (Windows)
        `./data/${scriptName}`,        // Explicit relative from project root (Unix)
        `.\\data\\${scriptName}`,      // Explicit relative from project root (Windows)
        `../data/${scriptName}`,       // From scripts directory (Unix)
        `..\\data\\${scriptName}`,     // From scripts directory (Windows)
        `./${scriptName}`,             // Explicit current directory (Unix)
        `.\\${scriptName}`             // Explicit current directory (Windows)
    ];

    for (let pathVariation of pathVariations) {
        try {
            print(`  Trying: ${pathVariation}`);
            load(pathVariation);
            print(`✅ Successfully loaded ${scriptName} from: ${pathVariation}`);
            return true;
        } catch (error) {
            print(`  ❌ Failed: ${pathVariation} (${error.message})`);
        }
    }

    print(`⚠️  Could not load ${scriptName} from any path variation`);
    print(`ℹ️  Note: On Windows, this is common due to path resolution differences`);
    print("🔄 Falling back to inline data loading (same data, different loading method)...");
    return false; // This triggers the inline fallback which contains all the data
}

function showProgress(message, step, total) {
    const percentage = Math.round((step / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    print(`[${progressBar}] ${percentage}% - ${message}`);
}

// ===========================================
// MAIN EXECUTION
// ===========================================

print("🚀 Starting comprehensive data loading process...");
print("This will load data for all three days of the course.\n");

const startTime = new Date();

// ===========================================
// DAY 1: FUNDAMENTALS DATA (Labs 1-5)
// ===========================================

showProgress("Day 1: Fundamentals Data", 1, 3);
print("\n📚 DAY 1: MongoDB Fundamentals");
print("Labs: 1-5 (Shell Mastery, Database Management, CRUD Operations)");
print("Database: insurance_company");

// Execute Day 1 data loader
const day1Success = loadScript('day1_data_loader.js');

if (!day1Success) {
    print("⚠️  Day 1 inline execution...");
    print("Loading complete Day 1 content inline for Windows compatibility...");

    // Switch to insurance company database
    db = db.getSiblingDB('insurance_company');

    // Clean existing collections
    print("Cleaning existing collections...");
    db.policies.drop();
    db.customers.drop();
    db.claims.drop();
    db.agents.drop();
    db.branches.drop();
    db.payments.drop();
    db.audit_logs.drop();

    print("✓ Cleaned existing collections");

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

    // Create comprehensive customers collection (20 customers)
    print("Creating insurance customers (20 customers)...");

    var customer1 = {_id: ObjectId(), customerId: "CUST000001", firstName: "John", lastName: "Smith", email: "john.smith@email.com", phone: "+1-555-0101", address: {street: "123 Main Street", city: "New York", state: "NY", zipCode: "10001"}, dateOfBirth: new Date("1985-06-15"), customerType: "individual", riskScore: 75, registrationDate: new Date("2024-01-10"), isActive: true};
    var customer2 = {_id: ObjectId(), customerId: "CUST000002", firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@email.com", phone: "+1-555-0102", address: {street: "456 Oak Avenue", city: "Chicago", state: "IL", zipCode: "60601"}, dateOfBirth: new Date("1978-03-22"), customerType: "family", riskScore: 60, registrationDate: new Date("2024-02-15"), isActive: true};

    // Adding all 20 customers from day1 loader
    var customer3 = {_id: ObjectId(), customerId: "CUST000003", firstName: "Michael", lastName: "Davis", email: "michael.davis@business.com", phone: "+1-555-0103", address: {street: "789 Business Plaza", city: "New York", state: "NY", zipCode: "10002"}, dateOfBirth: new Date("1972-11-08"), customerType: "business", riskScore: 45, registrationDate: new Date("2024-03-01"), isActive: true};
    var customer4 = {_id: ObjectId(), customerId: "CUST000004", firstName: "Emily", lastName: "Rodriguez", email: "emily.rodriguez@email.com", phone: "+1-555-0104", address: {street: "321 Pine Street", city: "Los Angeles", state: "CA", zipCode: "90210"}, dateOfBirth: new Date("1990-07-12"), customerType: "individual", riskScore: 85, registrationDate: new Date("2024-01-20"), isActive: true};
    var customer5 = {_id: ObjectId(), customerId: "CUST000005", firstName: "David", lastName: "Thompson", email: "david.thompson@email.com", phone: "+1-555-0105", address: {street: "654 Cedar Lane", city: "Houston", state: "TX", zipCode: "77002"}, dateOfBirth: new Date("1983-04-28"), customerType: "family", riskScore: 70, registrationDate: new Date("2024-02-10"), isActive: true};
    var customer6 = {_id: ObjectId(), customerId: "CUST000006", firstName: "Lisa", lastName: "Williams", email: "lisa.williams@email.com", phone: "+1-555-0106", address: {street: "987 Elm Drive", city: "Phoenix", state: "AZ", zipCode: "85001"}, dateOfBirth: new Date("1976-09-15"), customerType: "individual", riskScore: 55, registrationDate: new Date("2024-01-25"), isActive: true};
    var customer7 = {_id: ObjectId(), customerId: "CUST000007", firstName: "Robert", lastName: "Brown", email: "robert.brown@company.com", phone: "+1-555-0107", address: {street: "147 Corporate Blvd", city: "Philadelphia", state: "PA", zipCode: "19101"}, dateOfBirth: new Date("1969-12-03"), customerType: "business", riskScore: 40, registrationDate: new Date("2024-03-05"), isActive: true};
    var customer8 = {_id: ObjectId(), customerId: "CUST000008", firstName: "Jennifer", lastName: "Davis", email: "jennifer.davis@email.com", phone: "+1-555-0108", address: {street: "258 Maple Street", city: "San Antonio", state: "TX", zipCode: "78201"}, dateOfBirth: new Date("1988-02-18"), customerType: "family", riskScore: 80, registrationDate: new Date("2024-02-20"), isActive: true};
    var customer9 = {_id: ObjectId(), customerId: "CUST000009", firstName: "William", lastName: "Miller", email: "william.miller@email.com", phone: "+1-555-0109", address: {street: "369 Harbor View", city: "San Diego", state: "CA", zipCode: "92101"}, dateOfBirth: new Date("1981-08-07"), customerType: "individual", riskScore: 65, registrationDate: new Date("2024-01-30"), isActive: true};
    var customer10 = {_id: ObjectId(), customerId: "CUST000010", firstName: "Mary", lastName: "Wilson", email: "mary.wilson@email.com", phone: "+1-555-0110", address: {street: "741 Tower Road", city: "Dallas", state: "TX", zipCode: "75201"}, dateOfBirth: new Date("1975-05-24"), customerType: "family", riskScore: 50, registrationDate: new Date("2024-02-25"), isActive: true};

    // Continue with remaining 10 customers
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

    // Add agents for relationship queries (10 agents)
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

    // Add claims for update/delete examples (15 claims)
    print("Creating insurance claims (15 claims)...");

    var claim1 = {_id: ObjectId(), claimNumber: "CLM-2024-001001", customerId: "CUST000001", policyNumber: "POL-AUTO-001", claimType: "Auto Accident", claimAmount: 8500.00, deductible: 500.00, status: "submitted", incidentDate: new Date("2024-03-15"), incidentDescription: "Rear-end collision at intersection", adjusterAssigned: "ADJ001", createdAt: new Date("2024-03-16")};
    var claim2 = {_id: ObjectId(), claimNumber: "CLM-2024-001002", customerId: "CUST000002", policyNumber: "POL-HOME-001", claimType: "Property Damage", claimAmount: 15000.00, deductible: 1000.00, status: "under_review", incidentDate: new Date("2024-03-10"), incidentDescription: "Water damage from burst pipe", adjusterAssigned: "ADJ002", createdAt: new Date("2024-03-11")};
    var claim3 = {_id: ObjectId(), claimNumber: "CLM-2024-001003", customerId: "CUST000001", policyNumber: "POL-AUTO-001", claimType: "Theft", claimAmount: 2500.00, deductible: 250.00, status: "approved", incidentDate: new Date("2024-02-28"), incidentDescription: "Vehicle break-in and theft of personal items", adjusterAssigned: "ADJ001", settledAmount: 2250.00, createdAt: new Date("2024-03-01"), settledAt: new Date("2024-03-10")};

    // Adding all remaining claims (continuing pattern from day1_data_loader.js)
    var claim4 = {_id: ObjectId(), claimNumber: "CLM-2024-001004", customerId: "CUST000003", policyNumber: "POL-COMM-001", claimType: "Liability Claim", claimAmount: 45000.00, deductible: 5000.00, status: "investigating", incidentDate: new Date("2024-03-05"), incidentDescription: "Customer slip and fall at business premises", adjusterAssigned: "ADJ003", createdAt: new Date("2024-03-06")};
    var claim5 = {_id: ObjectId(), claimNumber: "CLM-2024-001005", customerId: "CUST000004", policyNumber: "POL-AUTO-002", claimType: "Auto Accident", claimAmount: 12000.00, deductible: 1000.00, status: "approved", incidentDate: new Date("2024-02-20"), incidentDescription: "Multi-vehicle collision on highway", adjusterAssigned: "ADJ001", settledAmount: 11000.00, createdAt: new Date("2024-02-21"), settledAt: new Date("2024-03-05")};

    // Adding remaining claims to reach 15 total
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

    // Add comprehensive payments (20 payments)
    print("Creating payment records (20 payments)...");

    var payment1 = {_id: ObjectId(), paymentId: "PAY-2024-001001", customerId: "CUST000001", policyNumber: "POL-AUTO-001", amount: 108.33, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-01-15"), dueDate: new Date("2024-01-15")};
    var payment2 = {_id: ObjectId(), paymentId: "PAY-2024-001002", customerId: "CUST000002", policyNumber: "POL-HOME-001", amount: 158.33, paymentType: "premium", paymentMethod: "credit_card", status: "completed", paymentDate: new Date("2024-02-01"), dueDate: new Date("2024-02-01")};

    // Continue with all 20 payments from day1 data loader
    var payment3 = {_id: ObjectId(), paymentId: "PAY-2024-001003", customerId: "CUST000001", claimNumber: "CLM-2024-001003", amount: 2250.00, paymentType: "claim_settlement", paymentMethod: "check", status: "completed", paymentDate: new Date("2024-03-10")};
    var payment4 = {_id: ObjectId(), paymentId: "PAY-2024-001004", customerId: "CUST000003", policyNumber: "POL-COMM-001", amount: 208.33, paymentType: "premium", paymentMethod: "bank_transfer", status: "completed", paymentDate: new Date("2024-02-10"), dueDate: new Date("2024-02-10")};
    var payment5 = {_id: ObjectId(), paymentId: "PAY-2024-001005", customerId: "CUST000004", policyNumber: "POL-AUTO-002", amount: 75.00, paymentType: "premium", paymentMethod: "auto_debit", status: "completed", paymentDate: new Date("2024-01-20"), dueDate: new Date("2024-01-20")};
    var payment6 = {_id: ObjectId(), paymentId: "PAY-2024-001006", customerId: "CUST000005", claimNumber: "CLM-2024-001005", amount: 11000.00, paymentType: "claim_settlement", paymentMethod: "direct_deposit", status: "completed", paymentDate: new Date("2024-03-05")};

    // Adding remaining payments to reach 20 total
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

    // Create indexes for performance
    print("Creating indexes for optimal performance");

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

    print("✅ Day 1 complete data loaded successfully via inline fallback");
}

// ===========================================
// DAY 2: ADVANCED FEATURES DATA (Labs 6-10)
// ===========================================

showProgress("Day 2: Advanced Features Data", 2, 3);
print("\n📊 DAY 2: Advanced MongoDB Features");
print("Labs: 6-10 (Advanced Queries, Aggregation, Indexing, Performance)");
print("Database: insurance_analytics");

// Execute Day 2 data loader
const day2Success = loadScript('day2_data_loader.js');

if (!day2Success) {
    print("⚠️  Day 2 inline execution...");
    print("Loading complete Day 2 content inline for Windows compatibility...");

    // Switch to analytics database
    db = db.getSiblingDB('insurance_analytics');

    // Clean existing collections
    print("Cleaning existing collections...");
    db.policies.drop();
    db.customers.drop();
    db.claims.drop();
    db.payments.drop();
    db.agents.drop();
    db.branches.drop();
    db.vehicles.drop();
    db.properties.drop();
    db.reviews.drop();
    db.audit_logs.drop();

    print("✓ Cleaned existing collections");

    // Create 3 branches using individual variables (exact match from day2_data_loader.js)
    print("Creating comprehensive branch network (3 branches)...");

    var branch1 = {_id: "BR001", branchCode: "BR-NY-001", name: "New York Financial District", address: {street: "123 Wall Street", city: "New York", state: "NY", zipCode: "10001"}, location: {type: "Point", coordinates: [-73.9857, 40.7484]}, manager: "Sarah Johnson", agentCount: 15, performanceMetrics: {monthlyRevenue: 245000.50, customerSatisfaction: 4.8, claimsProcessed: 125}, specialties: ["Auto", "Property", "Life"], isActive: true, openDate: new Date("2020-01-15")};
    var branch2 = {_id: "BR002", branchCode: "BR-CA-002", name: "Los Angeles West Side", address: {street: "456 Sunset Blvd", city: "Los Angeles", state: "CA", zipCode: "90210"}, location: {type: "Point", coordinates: [-118.2437, 34.0522]}, manager: "Michael Chen", agentCount: 22, performanceMetrics: {monthlyRevenue: 325000.75, customerSatisfaction: 4.6, claimsProcessed: 180}, specialties: ["Auto", "Commercial", "Cyber"], isActive: true, openDate: new Date("2019-05-20")};
    var branch3 = {_id: "BR003", branchCode: "BR-TX-003", name: "Houston Energy Corridor", address: {street: "789 Energy Plaza", city: "Houston", state: "TX", zipCode: "77042"}, location: {type: "Point", coordinates: [-95.3698, 29.7604]}, manager: "Jennifer Rodriguez", agentCount: 18, performanceMetrics: {monthlyRevenue: 285000.25, customerSatisfaction: 4.7, claimsProcessed: 155}, specialties: ["Commercial", "Energy", "Marine"], isActive: true, openDate: new Date("2021-03-10")};

    db.branches.insertMany([branch1, branch2, branch3]);
    print("✓ Created " + db.branches.countDocuments() + " comprehensive branches");

    // Create policies using individual variables (exact match)
    print("Creating comprehensive insurance policies...");
    var policy1 = {policyNumber: "POL-AUTO-2024-001", name: "Premium Auto Coverage", policyType: "AUTO", customerId: "CUST000001", annualPremium: 1299.99, coverageDetails: {liability: "250000/500000", collision: {deductible: 500, coverage: "Full"}}, coverageTypes: ["liability", "collision"], isActive: true, createdAt: new Date("2024-01-01"), expirationDate: new Date("2025-01-01"), agentId: "AGT001", branchId: "BR001", riskScore: 50, claimsHistory: []};
    var policy2 = {policyNumber: "POL-HOME-2024-002", name: "Homeowners Protection Plus", policyType: "HOME", customerId: "CUST000002", annualPremium: 1899.99, coverageDetails: {dwelling: {coverage: 400000, deductible: 1000}, personalProperty: {coverage: 200000, deductible: 500}}, coverageTypes: ["dwelling", "personal_property"], isActive: true, createdAt: new Date("2024-02-01"), expirationDate: new Date("2025-02-01"), agentId: "AGT002", branchId: "BR002", riskScore: 60, claimsHistory: []};
    var policy3 = {policyNumber: "POL-LIFE-2024-003", name: "Term Life Insurance Deluxe", policyType: "LIFE", customerId: "CUST000003", annualPremium: 599.99, coverageDetails: {deathBenefit: 500000, term: "20 years"}, coverageTypes: ["death_benefit"], isActive: true, createdAt: new Date("2024-03-01"), expirationDate: new Date("2044-03-01"), agentId: "AGT003", branchId: "BR003", riskScore: 45, claimsHistory: []};

    db.policies.insertMany([policy1, policy2, policy3]);
    print("✓ Created " + db.policies.countDocuments() + " insurance policies");

    // Create customers using individual variables (exact match)
    print("Creating comprehensive customers...");
    var customer1 = {customerId: "CUST000001", firstName: "John", lastName: "Smith", email: "john.smith@email.com", phone: "+1-555-0101", address: {street: "123 Main Street", city: "New York", state: "NY", zipCode: "10001"}, dateOfBirth: new Date("1985-06-15"), customerType: "individual", riskProfile: {score: 75, category: "medium", factors: ["good_credit", "safe_driver"]}, premiumTotal: 2850.99, policies: ["POL-AUTO-2024-001", "POL-HOME-2024-002"], registrationDate: new Date("2024-01-10"), isActive: true, loyaltyProgram: {tier: "gold", points: 1250, memberSince: new Date("2022-01-10")}};
    var customer2 = {customerId: "CUST000002", firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@email.com", phone: "+1-555-0102", address: {street: "456 Oak Avenue", city: "Chicago", state: "IL", zipCode: "60601"}, dateOfBirth: new Date("1978-03-22"), customerType: "family", riskProfile: {score: 60, category: "low", factors: ["excellent_credit", "homeowner", "multiple_policies"]}, premiumTotal: 3250.75, policies: ["POL-HOME-2024-003", "POL-LIFE-2024-004"], registrationDate: new Date("2024-02-15"), isActive: true, loyaltyProgram: {tier: "platinum", points: 2850, memberSince: new Date("2020-02-15")}};
    var customer3 = {customerId: "CUST000003", firstName: "Michael", lastName: "Davis", email: "michael.davis@business.com", phone: "+1-555-0103", address: {street: "789 Business Plaza", city: "Los Angeles", state: "CA", zipCode: "90210"}, dateOfBirth: new Date("1972-11-08"), customerType: "business", riskProfile: {score: 45, category: "high", factors: ["business_owner", "high_value_assets"]}, premiumTotal: 5850.50, policies: ["POL-COMMERCIAL-2024-001", "POL-CYBER-2024-001"], registrationDate: new Date("2024-03-01"), isActive: true, loyaltyProgram: {tier: "diamond", points: 4200, memberSince: new Date("2019-03-01")}};

    db.customers.insertMany([customer1, customer2, customer3]);
    print("✓ Created " + db.customers.countDocuments() + " comprehensive customers");

    // Create claims using individual variables (exact match)
    print("Creating comprehensive claims...");
    var claim1 = {claimNumber: "CLM-2024-001001", customerId: "CUST000001", policyNumber: "POL-AUTO-2024-001", claimType: "Auto Accident", claimAmount: 8500.00, deductible: 500.00, status: "approved", incidentDate: new Date("2024-03-15"), incidentDescription: "Rear-end collision at intersection", adjusterAssigned: "ADJ001", settledAmount: 8000.00, processingTime: 15, fraudIndicators: [], severityLevel: "moderate", location: {type: "Point", coordinates: [-73.9857, 40.7484]}, witnesses: 2, policeReport: true, createdAt: new Date("2024-03-16"), settledAt: new Date("2024-03-31")};
    var claim2 = {claimNumber: "CLM-2024-001002", customerId: "CUST000002", policyNumber: "POL-HOME-2024-002", claimType: "Water Damage", claimAmount: 15000.00, deductible: 1000.00, status: "under_review", incidentDate: new Date("2024-03-10"), incidentDescription: "Pipe burst in basement causing extensive water damage", adjusterAssigned: "ADJ002", settledAmount: null, processingTime: null, fraudIndicators: [], severityLevel: "major", location: {type: "Point", coordinates: [-87.6298, 41.8781]}, witnesses: 0, policeReport: false, createdAt: new Date("2024-03-11"), settledAt: null};
    var claim3 = {claimNumber: "CLM-2024-001003", customerId: "CUST000003", policyNumber: "POL-COMMERCIAL-2024-001", claimType: "Cyber Attack", claimAmount: 75000.00, deductible: 5000.00, status: "investigating", incidentDate: new Date("2024-02-28"), incidentDescription: "Ransomware attack on company servers", adjusterAssigned: "ADJ003", settledAmount: null, processingTime: null, fraudIndicators: ["unusual_timing"], severityLevel: "critical", location: {type: "Point", coordinates: [-118.2437, 34.0522]}, witnesses: 0, policeReport: true, createdAt: new Date("2024-03-01"), settledAt: null};

    db.claims.insertMany([claim1, claim2, claim3]);
    print("✓ Created " + db.claims.countDocuments() + " comprehensive claims");

    // Create agents using individual variables (exact match)
    print("Creating comprehensive agents...");
    var agent1 = {agentId: "AGT001", firstName: "Emily", lastName: "Rodriguez", email: "emily.rodriguez@insuranceco.com", phone: "+1-555-0201", branchId: "BR001", territory: "Manhattan North", specialties: ["Auto", "Property"], licenseNumber: "LIC-NY-12345", isActive: true, performance: {salesTarget: 500000, salesActual: 485000, customerRating: 4.8, claimsHandled: 125, conversionRate: 0.78}, hireDate: new Date("2022-03-15"), lastPromotion: new Date("2023-03-15"), salary: 75000, commissionRate: 0.03};
    var agent2 = {agentId: "AGT002", firstName: "David", lastName: "Thompson", email: "david.thompson@insuranceco.com", phone: "+1-555-0202", branchId: "BR002", territory: "West LA", specialties: ["Commercial", "Cyber"], licenseNumber: "LIC-CA-67890", isActive: true, performance: {salesTarget: 750000, salesActual: 820000, customerRating: 4.9, claimsHandled: 95, conversionRate: 0.85}, hireDate: new Date("2021-08-22"), lastPromotion: new Date("2022-08-22"), salary: 85000, commissionRate: 0.035};
    var agent3 = {agentId: "AGT003", firstName: "Jessica", lastName: "Chen", email: "jessica.chen@insuranceco.com", phone: "+1-555-0203", branchId: "BR003", territory: "Houston Energy", specialties: ["Energy", "Marine"], licenseNumber: "LIC-TX-11111", isActive: true, performance: {salesTarget: 600000, salesActual: 645000, customerRating: 4.7, claimsHandled: 110, conversionRate: 0.72}, hireDate: new Date("2020-11-10"), lastPromotion: new Date("2021-11-10"), salary: 78000, commissionRate: 0.032};

    db.agents.insertMany([agent1, agent2, agent3]);
    print("✓ Created " + db.agents.countDocuments() + " comprehensive agents");

    // Create reviews for text search using individual variables (exact match)
    print("Creating customer reviews for text search...");
    var review1 = {reviewId: "REV001", customerId: "CUST000001", agentId: "AGT001", branchId: "BR001", rating: 5, reviewText: "Excellent service and outstanding customer support. Emily was incredibly helpful throughout the entire claims process. The response time was fantastic and the settlement was fair. Highly recommend this insurance company to anyone looking for reliable coverage.", reviewDate: new Date("2024-03-20"), sentiment: "positive", categories: ["service", "claims", "support"], verified: true, helpfulVotes: 15};
    var review2 = {reviewId: "REV002", customerId: "CUST000002", agentId: "AGT002", branchId: "BR002", rating: 4, reviewText: "Good coverage options and competitive pricing. The policy selection process was straightforward, though claim processing could be faster. Overall satisfied with the service and would consider renewing. David provided good guidance on policy options.", reviewDate: new Date("2024-03-18"), sentiment: "positive", categories: ["coverage", "pricing", "claims"], verified: true, helpfulVotes: 8};
    var review3 = {reviewId: "REV003", customerId: "CUST000003", agentId: "AGT003", branchId: "BR003", rating: 2, reviewText: "Poor experience with claim denial and lack of communication. The initial sales process was smooth but when I needed to file a claim, the service quality dropped significantly. Jessica was hard to reach and the explanations were unclear.", reviewDate: new Date("2024-03-15"), sentiment: "negative", categories: ["claims", "communication", "service"], verified: true, helpfulVotes: 22};

    db.reviews.insertMany([review1, review2, review3]);
    print("✓ Created " + db.reviews.countDocuments() + " customer reviews");

    // Create production indexes (exact match)
    print("Creating production indexes for optimal performance");

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

    print("✓ Created production indexes");

    print("✅ Day 2 complete analytics data loaded successfully via inline fallback");
}

// ===========================================
// DAY 3: PRODUCTION DATA (Labs 11-14c)
// ===========================================

showProgress("Day 3: Production Data", 3, 3);
print("\n🚀 DAY 3: Production MongoDB Features");
print("Labs: 11-14c (Transactions, Replication, Sharding, Application Integration)");
print("Database: insurance_company");

// Execute Day 3 data loader
const day3Success = loadScript('day3_data_loader.js');

if (!day3Success) {
    print("⚠️  Day 3 inline execution...");
    print("Loading complete Day 3 content inline for Windows compatibility...");

    // Switch to insurance database
    db = db.getSiblingDB('insurance_company');

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

    // Lab 1: MongoDB Transactions - Create core policies for transaction testing
    print("Creating core insurance policies...");
    var policy1 = {_id: "pol1", policyNumber: "POL-AUTO-001", name: "Premium Auto Coverage", policyType: "Auto", annualPremium: 1299.99, activePolicies: 10, coverageDetails: {liability: "250000/500000", collision: { deductible: 500, coverage: "Full" }, comprehensive: { deductible: 250, coverage: "Full" }}, coverageTypes: ["liability", "collision", "comprehensive"], isActive: true};
    var policy2 = {_id: "pol2", policyNumber: "POL-HOME-001", name: "Homeowners Protection", policyType: "Property", annualPremium: 1899.99, activePolicies: 25, coverageDetails: {dwelling: { coverage: 400000, deductible: 1000 }, personalProperty: { coverage: 200000, deductible: 500 }, liability: 300000}, coverageTypes: ["dwelling", "personal_property", "liability"], isActive: true};
    var policy3 = {_id: "pol3", policyNumber: "POL-LIFE-001", name: "Term Life Insurance", policyType: "Life", annualPremium: 599.99, activePolicies: 15, coverageDetails: {deathBenefit: 500000, term: "20 years", beneficiaries: "Spouse and Children"}, coverageTypes: ["death_benefit", "accidental_death"], isActive: true};
    var policy4 = {_id: "pol4", policyNumber: "POL-COMM-001", name: "Business Liability", policyType: "Commercial", annualPremium: 2499.99, activePolicies: 8, coverageDetails: {generalLiability: 2000000, productLiability: 1000000, businessType: "Technology"}, coverageTypes: ["general_liability", "product_liability"], isActive: true};
    db.policies.insertMany([policy1, policy2, policy3, policy4]);

    print("✓ Created " + db.policies.countDocuments() + " core policies");

    // Create customers with premium balances for transaction testing
    print("Creating customers with premium balances...");
    var customer1 = {_id: "cust1", customerId: "CUST000001", name: "John Smith", email: "john.smith@email.com", phone: "+1-555-0101", premiumBalance: 1200.00, totalPolicies: 0, totalPremiumsPaid: 0, lastPaymentDate: null, riskScore: 75, address: {street: "123 Main Street", city: "New York", state: "NY", zipCode: "10001"}, registrationDate: new Date("2024-01-15"), isActive: true};
    var customer2 = {_id: "cust2", customerId: "CUST000002", name: "Sarah Johnson", email: "sarah.johnson@email.com", phone: "+1-555-0102", premiumBalance: 800.00, totalPolicies: 0, totalPremiumsPaid: 0, lastPaymentDate: null, riskScore: 60, address: {street: "456 Oak Avenue", city: "Chicago", state: "IL", zipCode: "60601"}, registrationDate: new Date("2024-02-20"), isActive: true};
    var customer3 = {_id: "cust3", customerId: "CUST000003", name: "Michael Davis", email: "michael.davis@email.com", phone: "+1-555-0103", premiumBalance: 1500.00, totalPolicies: 0, totalPremiumsPaid: 0, lastPaymentDate: null, riskScore: 45, address: {street: "789 Business Plaza", city: "Los Angeles", state: "CA", zipCode: "90001"}, registrationDate: new Date("2024-03-10"), isActive: true};
    db.customers.insertMany([customer1, customer2, customer3]);

    print("✓ Created " + db.customers.countDocuments() + " customers with balances");

    // Lab 3: Sharding & Horizontal Scaling - Generate customer dataset for sharding
    print("Generating customers for sharding (3 sample customers)...");

    var customer4 = {_id: "customer1", customerId: "CUST000004", firstName: "Emma", lastName: "Wilson", email: "customer4@example.com", address: {street: "123 Main St", city: "New York", state: "NY", zipCode: "10001"}, registrationDate: new Date(2024, 1, 15), insuranceProfile: {riskLevel: "medium", policyTypes: ["auto"], paymentMethod: "monthly", totalPremiumValue: 1250.00}, metadata: {lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), claimCount: 1, customerType: "standard"}};
    var customer5 = {_id: "customer2", customerId: "CUST000005", firstName: "James", lastName: "Miller", email: "customer5@example.com", address: {street: "456 Oak St", city: "Los Angeles", state: "CA", zipCode: "90210"}, registrationDate: new Date(2024, 2, 20), insuranceProfile: {riskLevel: "low", policyTypes: ["auto", "home"], paymentMethod: "annual", totalPremiumValue: 2750.00}, metadata: {lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), claimCount: 0, customerType: "premium"}};
    var customer6 = {_id: "customer3", customerId: "CUST000006", firstName: "Olivia", lastName: "Brown", email: "customer6@example.com", address: {street: "789 Pine St", city: "Chicago", state: "IL", zipCode: "60601"}, registrationDate: new Date(2024, 3, 10), insuranceProfile: {riskLevel: "high", policyTypes: ["auto"], paymentMethod: "monthly", totalPremiumValue: 1850.00}, metadata: {lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), claimCount: 3, customerType: "standard"}};

    db.customers.insertMany([customer4, customer5, customer6]);

    print("✓ Generated " + db.customers.countDocuments() + " customers for sharding");

    // Generate claims dataset for range sharding
    print("Generating claims dataset for range sharding (3 sample claims)...");

    var claim1 = {_id: "claim1", claimNumber: "CLM-2024-000004", customerId: "customer1", claimDate: new Date(2024, 3, 15), claimType: "Auto Accident", claimAmount: 8500.00, deductible: 500, status: "settled", incidentLocation: {street: "123 Insurance Ave", city: "New York", state: "NY", zipCode: "10001"}, territory: "north", adjusterAssigned: "ADJ001", fraudFlag: false};
    var claim2 = {_id: "claim2", claimNumber: "CLM-2024-000005", customerId: "customer2", claimDate: new Date(2024, 2, 20), claimType: "Property Damage", claimAmount: 15000.00, deductible: 1000, status: "pending", incidentLocation: {street: "456 Insurance Ave", city: "Los Angeles", state: "CA", zipCode: "90210"}, territory: "west", adjusterAssigned: "ADJ002", fraudFlag: false};
    var claim3 = {_id: "claim3", claimNumber: "CLM-2024-000006", customerId: "customer3", claimDate: new Date(2024, 1, 10), claimType: "Theft", claimAmount: 3200.00, deductible: 250, status: "settled", incidentLocation: {street: "789 Insurance Ave", city: "Chicago", state: "IL", zipCode: "60601"}, territory: "central", adjusterAssigned: "ADJ003", fraudFlag: false};

    db.claims.insertMany([claim1, claim2, claim3]);

    print("✓ Generated " + db.claims.countDocuments() + " claims for sharding");

    // Generate comprehensive branches for geographic sharding
    print("Generating branches for geographic sharding (5 sample branches)...");

    var branch1 = {_id: "branch1", region: "north", branchCode: "BR-NO-001", name: "Insurance Branch 1", address: {street: "1 Insurance Blvd", city: "North City", state: "NY", zipCode: "12345"}, manager: "Manager 1", agentCount: 15, performanceData: {monthlyPremiums: 450000.50, quarterlyPremiums: 1350000.75, annualPremiums: 5400000.25}, policyMetrics: {activePolicies: 1500, policyTypes: 4, lastUpdated: new Date()}, coordinates: {lat: 40.7128, lng: -74.0060}, specialties: ["Auto", "Home", "Life"]};
    var branch2 = {_id: "branch2", region: "south", branchCode: "BR-SO-002", name: "Insurance Branch 2", address: {street: "2 Insurance Blvd", city: "South City", state: "CA", zipCode: "23456"}, manager: "Manager 2", agentCount: 12, performanceData: {monthlyPremiums: 380000.25, quarterlyPremiums: 1140000.50, annualPremiums: 4560000.75}, policyMetrics: {activePolicies: 1200, policyTypes: 5, lastUpdated: new Date()}, coordinates: {lat: 34.0522, lng: -118.2437}, specialties: ["Auto", "Commercial"]};
    var branch3 = {_id: "branch3", region: "east", branchCode: "BR-EA-003", name: "Insurance Branch 3", address: {street: "3 Insurance Blvd", city: "East City", state: "TX", zipCode: "34567"}, manager: "Manager 3", agentCount: 18, performanceData: {monthlyPremiums: 520000.75, quarterlyPremiums: 1560000.25, annualPremiums: 6240000.50}, policyMetrics: {activePolicies: 1800, policyTypes: 3, lastUpdated: new Date()}, coordinates: {lat: 29.7604, lng: -95.3698}, specialties: ["Home", "Life", "Commercial"]};
    var branch4 = {_id: "branch4", region: "west", branchCode: "BR-WE-004", name: "Insurance Branch 4", address: {street: "4 Insurance Blvd", city: "West City", state: "FL", zipCode: "45678"}, manager: "Manager 4", agentCount: 10, performanceData: {monthlyPremiums: 350000.00, quarterlyPremiums: 1050000.00, annualPremiums: 4200000.00}, policyMetrics: {activePolicies: 900, policyTypes: 4, lastUpdated: new Date()}, coordinates: {lat: 25.7617, lng: -80.1918}, specialties: ["Auto", "Home"]};
    var branch5 = {_id: "branch5", region: "central", branchCode: "BR-CE-005", name: "Insurance Branch 5", address: {street: "5 Insurance Blvd", city: "Central City", state: "IL", zipCode: "56789"}, manager: "Manager 5", agentCount: 14, performanceData: {monthlyPremiums: 425000.00, quarterlyPremiums: 1275000.00, annualPremiums: 5100000.00}, policyMetrics: {activePolicies: 1300, policyTypes: 5, lastUpdated: new Date()}, coordinates: {lat: 41.8781, lng: -87.6298}, specialties: ["Commercial", "Life"]};

    db.branches.insertMany([branch1, branch2, branch3, branch4, branch5]);
    print("✓ Generated " + db.branches.countDocuments() + " branches for geographic sharding");

    // Lab 4: Change Streams - Create collections for change stream testing
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
    var notification1 = {_id: new ObjectId(), customerId: "cust1", type: "policy_renewal", message: "Your auto insurance policy is due for renewal in 30 days", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), read: true, priority: "medium"};
    var notification2 = {_id: new ObjectId(), customerId: "cust2", type: "claim_update", message: "Your claim CLM-2024-001234 has been approved", timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), read: false, priority: "high"};
    var notification3 = {_id: new ObjectId(), customerId: "admin", type: "system", message: "System maintenance scheduled - claims processing may be delayed", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), read: false, priority: "low"};
    db.policy_notifications.insertMany([notification1, notification2, notification3]);

    print("✓ Created " + db.policy_notifications.countDocuments() + " sample notifications");

    // Lab 5: C# MongoDB Integration - Create comprehensive dataset
    print("Creating comprehensive insurance dataset for C# integration...");

    // Add agents for the C# service examples
    var agent1 = {_id: new ObjectId(), agentId: "AGT001", firstName: "Emily", lastName: "Rodriguez", email: "emily.rodriguez@insuranceco.com", phone: "+1-555-0201", branchId: "BR001", territory: "Manhattan", specialties: ["Auto", "Property"], licenseNumber: "LIC-NY-12345", isActive: true, performance: {monthlyQuota: 50000.00, quarterlyRevenue: 145000.00, customerSatisfaction: 4.7}, hireDate: new Date("2022-03-15")};
    var agent2 = {_id: new ObjectId(), agentId: "AGT002", firstName: "David", lastName: "Thompson", email: "david.thompson@insuranceco.com", phone: "+1-555-0202", branchId: "BR002", territory: "Chicago", specialties: ["Commercial", "Life"], licenseNumber: "LIC-IL-67890", isActive: true, performance: {monthlyQuota: 75000.00, quarterlyRevenue: 220000.00, customerSatisfaction: 4.9}, hireDate: new Date("2021-08-22")};
    db.agents.insertMany([agent1, agent2]);

    print("✓ Created " + db.agents.countDocuments() + " agents for C# integration");

    // Add vehicles and properties for comprehensive asset management
    print("Creating insured assets for C# modeling...");
    var vehicle1 = {_id: new ObjectId(), vin: "1HGBH41JXMN109186", customerId: "cust1", make: "Honda", model: "Civic", year: 2020, currentValue: 18500.00, insuranceInfo: {policyNumber: "POL-AUTO-001", deductible: 500.00, annualPremium: 1299.99}, riskFactors: {age: 4, mileage: 45000, accidentHistory: []}};
    var vehicle2 = {_id: new ObjectId(), vin: "2T1BURHE0JC123456", customerId: "cust2", make: "Toyota", model: "Corolla", year: 2018, currentValue: 16200.00, insuranceInfo: {policyNumber: "POL-AUTO-002", deductible: 1000.00, annualPremium: 899.99}, riskFactors: {age: 6, mileage: 67000, accidentHistory: ["Minor Fender Bender - 2022"]}};
    db.vehicles.insertMany([vehicle1, vehicle2]);

    var property1 = {_id: new ObjectId(), propertyId: "PROP-001", customerId: "cust1", propertyType: "Single Family Home", address: {street: "123 Elm Street", city: "New York", state: "NY", zipCode: "10001"}, propertyValue: 450000.00, insuranceInfo: {policyNumber: "POL-HOME-001", dwellingCoverage: 400000.00, deductible: 1000.00, annualPremium: 1899.99}, riskAssessment: {floodZone: "X", crimeRate: "Low", fireProtectionClass: 3}};
    db.properties.insertMany([property1]);

    print("✓ Created vehicles and properties for asset management");

    // Create production-ready indexes
    print("Creating production-ready indexes");

    // Core business indexes
    db.policies.createIndex({ policyNumber: 1 }, { unique: true });
    db.policies.createIndex({ policyType: 1, isActive: 1 });
    db.customers.createIndex({ customerId: 1 }, { unique: true });
    db.customers.createIndex({ email: 1 }, { unique: true });
    db.claims.createIndex({ claimNumber: 1 }, { unique: true });
    db.claims.createIndex({ customerId: 1, status: 1 });

    // Create indexes for transaction collections
    db.claims.createIndex({ claimNumber: 1 }, { unique: true });
    db.claims.createIndex({ customerId: 1, claimDate: 1 });
    db.payments.createIndex({ paymentId: 1 }, { unique: true });
    db.payments.createIndex({ timestamp: -1 });

    // Performance indexes for aggregation
    db.customers.createIndex({ "insuranceProfile.riskLevel": 1, "insuranceProfile.totalPremiumValue": -1 });
    db.claims.createIndex({ territory: 1, claimDate: -1 });
    db.branches.createIndex({ region: 1, "performanceData.monthlyPremiums": -1 });

    // Text search indexes
    db.policies.createIndex({ name: "text", policyType: "text" });

    // Create test collections for replication testing
    db.test_claims.createIndex({ timestamp: -1 });
    db.test_policies.createIndex({ timestamp: -1 });

    print("✓ Created production indexes");

    print("✅ Day 3 complete production data loaded successfully via inline fallback");
}

// ===========================================
// FINAL SETUP AND VERIFICATION
// ===========================================

print("\n🔧 Final setup and verification...");

// Create indexes across all databases for performance
print("Creating performance indexes...");

// insurance_company indexes
db = db.getSiblingDB('insurance_company');
db.policies.createIndex({ "policyNumber": 1 }, { unique: true });
db.policies.createIndex({ "customerId": 1 });
db.policies.createIndex({ "policyType": 1 });
db.policies.createIndex({ "region": 1 });
db.customers.createIndex({ "customerId": 1 }, { unique: true });
db.customers.createIndex({ "email": 1 }, { unique: true });
db.branches.createIndex({ "location": "2dsphere" });

// insurance_analytics indexes
db = db.getSiblingDB('insurance_analytics');
db.policies.createIndex({ "policyNumber": 1 }, { unique: true });
db.policies.createIndex({ "annualPremium": 1 });
db.policies.createIndex({ "region": 1, "policyType": 1 });
db.customers.createIndex({ "creditScore": 1 });
db.claims.createIndex({ "claimDate": 1 });

print("✅ Performance indexes created");

// ===========================================
// COMPLETION SUMMARY
// ===========================================

const endTime = new Date();
const duration = (endTime - startTime) / 1000;

print("\n" + "=".repeat(60));
print("🎉 COMPREHENSIVE DATA LOADING COMPLETE!");
print("=".repeat(60));
print(`⏱️  Total loading time: ${duration.toFixed(2)} seconds`);
print();

// Show summary statistics
print("📊 DATA SUMMARY:");
print("━".repeat(30));

db = db.getSiblingDB('insurance_company');
const companyPolicies = db.policies.countDocuments();
const companyCustomers = db.customers.countDocuments();
const companyBranches = db.branches.countDocuments();

db = db.getSiblingDB('insurance_analytics');
const analyticsPolicies = db.policies.countDocuments();
const analyticsCustomers = db.customers.countDocuments();
const analyticsClaims = db.claims.countDocuments();

print(`📋 insurance_company database:`);
print(`   • Policies: ${companyPolicies}`);
print(`   • Customers: ${companyCustomers}`);
print(`   • Branches: ${companyBranches}`);
print();
print(`📊 insurance_analytics database:`);
print(`   • Policies: ${analyticsPolicies}`);
print(`   • Customers: ${analyticsCustomers}`);
print(`   • Claims: ${analyticsClaims}`);
print();

print("🎯 READY FOR ALL LABS:");
print("━".repeat(20));
print("✅ Day 1 (Labs 1-5): MongoDB Fundamentals");
print("✅ Day 2 (Labs 6-10): Advanced Features & Analytics");
print("✅ Day 3 (Labs 11-14c): Production & Application Integration");
print();
print("🚀 Your 3-day MongoDB Mastering Course environment is ready!");
print("=".repeat(60));