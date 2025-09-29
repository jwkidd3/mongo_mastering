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

    try {
        if (scriptName.includes('day1')) {
            load('./day1_data_loader.js');
        } else if (scriptName.includes('day2')) {
            load('./day2_data_loader.js');
        } else if (scriptName.includes('day3')) {
            load('./day3_data_loader.js');
        }
        print(`✅ Successfully loaded ${scriptName}`);
    } catch (error) {
        print(`❌ Error loading ${scriptName}: ${error}`);
        print("⚠️  Attempting inline execution...");
        return false;
    }
    return true;
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

    // Insert sample data for Day 1
    print("Inserting Day 1 sample data...");

    // Sample branches
    db.branches.insertMany([
        {
            _id: "BR001",
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
            specialties: ["Auto", "Property", "Life"],
            isActive: true
        },
        {
            _id: "BR002",
            branchCode: "BR-IL-002",
            name: "Chicago Downtown",
            address: {
                street: "456 Michigan Avenue",
                city: "Chicago",
                state: "IL",
                zipCode: "60601"
            },
            location: {
                type: "Point",
                coordinates: [-87.6298, 41.8781]
            },
            manager: "Michael Chen",
            agentCount: 12,
            specialties: ["Auto", "Commercial", "Property"],
            isActive: true
        }
    ]);

    // Sample customers
    db.customers.insertMany([
        {
            customerId: "CUST-001",
            firstName: "John",
            lastName: "Smith",
            email: "john.smith@example.com",
            phone: "555-0101",
            dateOfBirth: new Date("1985-03-15"),
            address: {
                street: "123 Main St",
                city: "New York",
                state: "NY",
                zipCode: "10001"
            },
            isActive: true,
            registrationDate: new Date()
        },
        {
            customerId: "CUST-002",
            firstName: "Jane",
            lastName: "Johnson",
            email: "jane.johnson@example.com",
            phone: "555-0102",
            dateOfBirth: new Date("1990-07-22"),
            address: {
                street: "456 Oak Avenue",
                city: "Chicago",
                state: "IL",
                zipCode: "60601"
            },
            isActive: true,
            registrationDate: new Date()
        }
    ]);

    // Sample policies
    db.policies.insertMany([
        {
            policyNumber: "AUTO-2024-001",
            policyType: "Auto",
            customerId: "CUST-001",
            annualPremium: NumberDecimal("1200.00"),
            deductible: NumberInt(500),
            coverageLimit: 100000,
            isActive: true,
            effectiveDate: new Date("2024-01-01"),
            expirationDate: new Date("2024-12-31")
        },
        {
            policyNumber: "HOME-2024-001",
            policyType: "Property",
            customerId: "CUST-002",
            annualPremium: NumberDecimal("800.00"),
            deductible: NumberInt(1000),
            coverageLimit: 250000,
            isActive: true,
            effectiveDate: new Date("2024-01-01"),
            expirationDate: new Date("2024-12-31")
        }
    ]);

    print("✅ Day 1 data loaded successfully");
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

    // Insert analytics data for Day 2
    print("Inserting Day 2 analytics data...");

    // Comprehensive policy data for analytics
    const policies = [];
    for (let i = 1; i <= 100; i++) {
        policies.push({
            policyNumber: `POLICY-${i.toString().padStart(4, '0')}`,
            policyType: ["Auto", "Property", "Life", "Commercial"][i % 4],
            customerId: `CUST-${i.toString().padStart(3, '0')}`,
            annualPremium: NumberDecimal((Math.random() * 3000 + 500).toFixed(2)),
            deductible: NumberInt([250, 500, 1000, 2000][i % 4]),
            coverageLimit: [50000, 100000, 250000, 500000][i % 4],
            isActive: Math.random() > 0.1,
            effectiveDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            region: ["North", "South", "East", "West"][i % 4],
            riskScore: Math.floor(Math.random() * 100) + 1
        });
    }
    db.policies.insertMany(policies);

    // Customer data for analytics
    const customers = [];
    for (let i = 1; i <= 100; i++) {
        customers.push({
            customerId: `CUST-${i.toString().padStart(3, '0')}`,
            firstName: `FirstName${i}`,
            lastName: `LastName${i}`,
            email: `customer${i}@example.com`,
            phone: `555-${i.toString().padStart(4, '0')}`,
            dateOfBirth: new Date(1960 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            creditScore: Math.floor(Math.random() * 400) + 400,
            totalPremiums: NumberDecimal((Math.random() * 10000).toFixed(2)),
            policyCount: Math.floor(Math.random() * 5) + 1,
            isActive: true
        });
    }
    db.customers.insertMany(customers);

    // Claims data for analytics
    const claims = [];
    for (let i = 1; i <= 50; i++) {
        claims.push({
            claimNumber: `CLAIM-${i.toString().padStart(4, '0')}`,
            policyNumber: `POLICY-${(Math.floor(Math.random() * 100) + 1).toString().padStart(4, '0')}`,
            customerId: `CUST-${(Math.floor(Math.random() * 100) + 1).toString().padStart(3, '0')}`,
            claimAmount: NumberDecimal((Math.random() * 50000).toFixed(2)),
            claimDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            status: ["Open", "Investigating", "Approved", "Denied", "Closed"][Math.floor(Math.random() * 5)],
            description: `Claim description for claim ${i}`,
            adjusterId: `ADJ-${Math.floor(Math.random() * 10) + 1}`
        });
    }
    db.claims.insertMany(claims);

    print("✅ Day 2 data loaded successfully");
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

    // Switch back to insurance company database for production features
    db = db.getSiblingDB('insurance_company');

    // Add production-ready data on top of Day 1 foundation
    print("Adding production-scale data...");

    // Add more comprehensive policy data for transactions and sharding
    const productionPolicies = [];
    for (let i = 100; i <= 500; i++) {
        productionPolicies.push({
            policyNumber: `PROD-${i}`,
            policyType: ["Auto", "Property", "Life", "Commercial", "Cyber"][i % 5],
            customerId: `CUST-${(i % 100) + 1}`,
            annualPremium: NumberDecimal((Math.random() * 5000 + 1000).toFixed(2)),
            deductible: NumberInt([500, 1000, 2000, 5000][i % 4]),
            coverageLimit: [100000, 250000, 500000, 1000000][i % 4],
            isActive: true,
            effectiveDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            region: ["US-EAST", "US-WEST", "US-NORTH", "US-SOUTH"][i % 4],
            shardKey: `${["US-EAST", "US-WEST", "US-NORTH", "US-SOUTH"][i % 4]}_${(i % 100) + 1}`,
            version: NumberInt(1),
            lastModified: new Date()
        });
    }
    db.policies.insertMany(productionPolicies);

    // Add transaction and audit log data
    db.audit_logs.insertMany([
        {
            action: "POLICY_CREATED",
            userId: "system",
            timestamp: new Date(),
            documentId: "PROD-100",
            changes: { created: true }
        },
        {
            action: "POLICY_UPDATED",
            userId: "admin",
            timestamp: new Date(),
            documentId: "PROD-101",
            changes: { premium: { old: 1000, new: 1200 } }
        }
    ]);

    print("✅ Day 3 production data loaded successfully");
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