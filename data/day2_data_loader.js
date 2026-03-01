// ===== DAY 2 DATA LOADER SCRIPT - COMPLETELY FIXED =====
// MongoDB Day 2 Labs - Insurance Analytics Data Loader
// Usage: mongosh < day2_data_loader.js
// Purpose: Load all data needed for Day 2 labs or reset after completion

print("=======================================================");
print("MongoDB Day 2 Labs - Insurance Analytics Data Loader");
print("=======================================================");
print("Loading insurance analytics data for Day 2 labs...");
print("Labs covered: Advanced Querying, Aggregation Framework, Text Search, Indexing");
print("=======================================================\n");

// Database Setup
print("🔧 Setting up insurance_company database (Day 2 additions)");
print("----------------------------------------------------------");

// Switch to insurance_company database (same as Day 1 labs)
db = db.getSiblingDB('insurance_company');

// Only drop Day 2-specific collections to avoid destroying Day 1 data
print("Cleaning Day 2-specific collections...");
db.reviews.drop();
db.audit_logs.drop();

print("✓ Cleaned Day 2-specific collections");
print("Note: Preserving Day 1 data in policies, customers, claims, agents, branches");

// Create 3 branches using individual variables (avoiding loops)
print("\n🔍 Loading data for Lab 1: Advanced Querying & Filtering");
print("--------------------------------------------------------");
print("Creating comprehensive branch network (3 branches)...");

var branch1 = {_id: "BR001", branchCode: "BR-NY-001", name: "New York Financial District", address: {street: "123 Wall Street", city: "New York", state: "NY", zipCode: "10001"}, location: {type: "Point", coordinates: [-73.9857, 40.7484]}, manager: "Sarah Johnson", agentCount: 15, performanceMetrics: {monthlyRevenue: 245000.50, customerSatisfaction: 4.8, claimsProcessed: 125}, specialties: ["Auto", "Property", "Life"], isActive: true, openDate: new Date("2020-01-15")};
var branch2 = {_id: "BR002", branchCode: "BR-CA-002", name: "Los Angeles West Side", address: {street: "456 Sunset Blvd", city: "Los Angeles", state: "CA", zipCode: "90210"}, location: {type: "Point", coordinates: [-118.2437, 34.0522]}, manager: "Michael Chen", agentCount: 22, performanceMetrics: {monthlyRevenue: 325000.75, customerSatisfaction: 4.6, claimsProcessed: 180}, specialties: ["Auto", "Commercial", "Cyber"], isActive: true, openDate: new Date("2019-05-20")};
var branch3 = {_id: "BR003", branchCode: "BR-TX-003", name: "Houston Energy Corridor", address: {street: "789 Energy Plaza", city: "Houston", state: "TX", zipCode: "77042"}, location: {type: "Point", coordinates: [-95.3698, 29.7604]}, manager: "Jennifer Rodriguez", agentCount: 18, performanceMetrics: {monthlyRevenue: 285000.25, customerSatisfaction: 4.7, claimsProcessed: 155}, specialties: ["Commercial", "Cyber", "Health"], isActive: true, openDate: new Date("2021-03-10")};

// Upsert branches to avoid conflicts with Day 1 data
[branch1, branch2, branch3].forEach(function(b) {
  db.branches.updateOne({_id: b._id}, {$set: b}, {upsert: true});
});
print("✓ Upserted branches - total: " + db.branches.countDocuments());

// Create policies using individual variables
print("Creating comprehensive insurance policies...");
var policy1 = {policyNumber: "POL-AUTO-2024-001", name: "Premium Auto Coverage", policyType: "Auto", customerId: "CUST000001", annualPremium: 1299.99, coverageDetails: {liability: "250000/500000", collision: {deductible: 500, coverage: "Full"}}, coverageTypes: ["liability", "collision"], isActive: true, createdAt: new Date("2024-01-01"), expirationDate: new Date("2025-01-01"), agentId: "AGT001", branchId: "BR001", riskScore: 50, claimsHistory: []};
var policy2 = {policyNumber: "POL-HOME-2024-002", name: "Homeowners Protection Plus", policyType: "Property", customerId: "CUST000002", annualPremium: 1899.99, coverageDetails: {dwelling: {coverage: 400000, deductible: 1000}, personalProperty: {coverage: 200000, deductible: 500}}, coverageTypes: ["dwelling", "personal_property"], isActive: true, createdAt: new Date("2024-02-01"), expirationDate: new Date("2025-02-01"), agentId: "AGT002", branchId: "BR002", riskScore: 60, claimsHistory: []};
var policy3 = {policyNumber: "POL-LIFE-2024-003", name: "Term Life Insurance Deluxe", policyType: "Life", customerId: "CUST000003", annualPremium: 599.99, coverageDetails: {deathBenefit: 500000, term: "20 years"}, coverageTypes: ["death_benefit"], isActive: true, createdAt: new Date("2024-03-01"), expirationDate: new Date("2044-03-01"), agentId: "AGT003", branchId: "BR003", riskScore: 45, claimsHistory: []};

// Upsert policies to avoid conflicts with Day 1 data
[policy1, policy2, policy3].forEach(function(p) {
  db.policies.updateOne({policyNumber: p.policyNumber}, {$set: p}, {upsert: true});
});
print("✓ Upserted Day 2 policies - total policies: " + db.policies.countDocuments());

// Create customers using individual variables
print("Creating comprehensive customers...");
var customer1 = {customerId: "CUST000001", firstName: "John", lastName: "Smith", email: "john.smith@email.com", phone: "+1-555-0101", address: {street: "123 Main Street", city: "New York", state: "NY", zipCode: "10001"}, dateOfBirth: new Date("1985-06-15"), customerType: "individual", riskProfile: {score: 75, category: "medium", factors: ["good_credit", "safe_driver"]}, premiumTotal: 2850.99, policies: ["POL-AUTO-2024-001", "POL-HOME-2024-002"], registrationDate: new Date("2024-01-10"), isActive: true, loyaltyProgram: {tier: "gold", points: 1250, memberSince: new Date("2022-01-10")}};
var customer2 = {customerId: "CUST000002", firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@email.com", phone: "+1-555-0102", address: {street: "456 Oak Avenue", city: "Chicago", state: "IL", zipCode: "60601"}, dateOfBirth: new Date("1978-03-22"), customerType: "family", riskProfile: {score: 60, category: "low", factors: ["excellent_credit", "homeowner", "multiple_policies"]}, premiumTotal: 3250.75, policies: ["POL-HOME-2024-003", "POL-LIFE-2024-004"], registrationDate: new Date("2024-02-15"), isActive: true, loyaltyProgram: {tier: "platinum", points: 2850, memberSince: new Date("2020-02-15")}};
var customer3 = {customerId: "CUST000003", firstName: "Michael", lastName: "Davis", email: "michael.davis@business.com", phone: "+1-555-0103", address: {street: "789 Business Plaza", city: "Los Angeles", state: "CA", zipCode: "90210"}, dateOfBirth: new Date("1972-11-08"), customerType: "business", riskProfile: {score: 45, category: "high", factors: ["business_owner", "high_value_assets"]}, premiumTotal: 5850.50, policies: ["POL-COMMERCIAL-2024-001", "POL-CYBER-2024-001"], registrationDate: new Date("2024-03-01"), isActive: true, loyaltyProgram: {tier: "diamond", points: 4200, memberSince: new Date("2019-03-01")}};

// Upsert customers to avoid conflicts with Day 1 data
[customer1, customer2, customer3].forEach(function(c) {
  db.customers.updateOne({customerId: c.customerId}, {$set: c}, {upsert: true});
});
print("✓ Upserted Day 2 customers - total customers: " + db.customers.countDocuments());

// Create claims using individual variables
print("Creating comprehensive claims...");
var claim1 = {claimNumber: "CLM-2024-001001", customerId: "CUST000001", policyNumber: "POL-AUTO-2024-001", claimType: "Auto Accident", claimAmount: 8500.00, deductible: 500.00, status: "approved", incidentDate: new Date("2024-03-15"), incidentDescription: "Rear-end collision at intersection", adjusterAssigned: "ADJ001", settledAmount: 8000.00, processingTime: 15, fraudIndicators: [], severityLevel: "moderate", location: {type: "Point", coordinates: [-73.9857, 40.7484]}, witnesses: 2, policeReport: true, createdAt: new Date("2024-03-16"), settledAt: new Date("2024-03-31")};
var claim2 = {claimNumber: "CLM-2024-001002", customerId: "CUST000002", policyNumber: "POL-HOME-2024-002", claimType: "Water Damage", claimAmount: 15000.00, deductible: 1000.00, status: "under_review", incidentDate: new Date("2024-03-10"), incidentDescription: "Pipe burst in basement causing extensive water damage", adjusterAssigned: "ADJ002", settledAmount: null, processingTime: null, fraudIndicators: [], severityLevel: "major", location: {type: "Point", coordinates: [-87.6298, 41.8781]}, witnesses: 0, policeReport: false, createdAt: new Date("2024-03-11"), settledAt: null};
var claim3 = {claimNumber: "CLM-2024-001003", customerId: "CUST000003", policyNumber: "POL-COMMERCIAL-2024-001", claimType: "Cyber Attack", claimAmount: 75000.00, deductible: 5000.00, status: "investigating", incidentDate: new Date("2024-02-28"), incidentDescription: "Ransomware attack on company servers", adjusterAssigned: "ADJ003", settledAmount: null, processingTime: null, fraudIndicators: ["unusual_timing"], severityLevel: "critical", location: {type: "Point", coordinates: [-118.2437, 34.0522]}, witnesses: 0, policeReport: true, createdAt: new Date("2024-03-01"), settledAt: null};

// Upsert claims to avoid conflicts with Day 1 data
[claim1, claim2, claim3].forEach(function(c) {
  db.claims.updateOne({claimNumber: c.claimNumber}, {$set: c}, {upsert: true});
});
print("✓ Upserted Day 2 claims - total claims: " + db.claims.countDocuments());

// Create agents using individual variables
print("Creating comprehensive agents...");
var agent1 = {agentId: "AGT001", firstName: "Emily", lastName: "Rodriguez", email: "emily.rodriguez@insuranceco.com", phone: "+1-555-0201", branchId: "BR001", territory: "Manhattan North", specialties: ["Auto", "Property"], licenseNumber: "LIC-NY-12345", isActive: true, performance: {salesTarget: 500000, salesActual: 485000, customerRating: 4.8, claimsHandled: 125, conversionRate: 0.78}, hireDate: new Date("2022-03-15"), lastPromotion: new Date("2023-03-15"), salary: 75000, commissionRate: 0.03};
var agent2 = {agentId: "AGT002", firstName: "David", lastName: "Thompson", email: "david.thompson@insuranceco.com", phone: "+1-555-0202", branchId: "BR002", territory: "West LA", specialties: ["Commercial", "Cyber"], licenseNumber: "LIC-CA-67890", isActive: true, performance: {salesTarget: 750000, salesActual: 820000, customerRating: 4.9, claimsHandled: 95, conversionRate: 0.85}, hireDate: new Date("2021-08-22"), lastPromotion: new Date("2022-08-22"), salary: 85000, commissionRate: 0.035};
var agent3 = {agentId: "AGT003", firstName: "Jessica", lastName: "Chen", email: "jessica.chen@insuranceco.com", phone: "+1-555-0203", branchId: "BR003", territory: "Houston Energy", specialties: ["Cyber", "Health"], licenseNumber: "LIC-TX-11111", isActive: true, performance: {salesTarget: 600000, salesActual: 645000, customerRating: 4.7, claimsHandled: 110, conversionRate: 0.72}, hireDate: new Date("2020-11-10"), lastPromotion: new Date("2021-11-10"), salary: 78000, commissionRate: 0.032};

// Upsert agents to avoid conflicts with Day 1 data
[agent1, agent2, agent3].forEach(function(a) {
  db.agents.updateOne({agentId: a.agentId}, {$set: a}, {upsert: true});
});
print("✓ Upserted Day 2 agents - total agents: " + db.agents.countDocuments());

// Create reviews for text search using individual variables
print("Creating customer reviews for text search...");
var review1 = {reviewId: "REV001", customerId: "CUST000001", agentId: "AGT001", branchId: "BR001", rating: 5, reviewText: "Excellent service and outstanding customer support. Emily was incredibly helpful throughout the entire claims process. The response time was fantastic and the settlement was fair. Highly recommend this insurance company to anyone looking for reliable coverage.", reviewDate: new Date("2024-03-20"), sentiment: "positive", categories: ["service", "claims", "support"], verified: true, helpfulVotes: 15};
var review2 = {reviewId: "REV002", customerId: "CUST000002", agentId: "AGT002", branchId: "BR002", rating: 4, reviewText: "Good coverage options and competitive pricing. The policy selection process was straightforward, though claim processing could be faster. Overall satisfied with the service and would consider renewing. David provided good guidance on policy options.", reviewDate: new Date("2024-03-18"), sentiment: "positive", categories: ["coverage", "pricing", "claims"], verified: true, helpfulVotes: 8};
var review3 = {reviewId: "REV003", customerId: "CUST000003", agentId: "AGT003", branchId: "BR003", rating: 2, reviewText: "Poor experience with claim denial and lack of communication. The initial sales process was smooth but when I needed to file a claim, the service quality dropped significantly. Jessica was hard to reach and the explanations were unclear.", reviewDate: new Date("2024-03-15"), sentiment: "negative", categories: ["claims", "communication", "service"], verified: true, helpfulVotes: 22};

db.reviews.insertMany([review1, review2, review3]);
print("✓ Created " + db.reviews.countDocuments() + " customer reviews");

// Create production indexes
print("\n🔧 Creating production indexes for optimal performance");
print("----------------------------------------------------");

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

// Final validation using individual variables (avoiding multiline objects)
print("\n📊 Day 2 analytics data validation");
print("----------------------------------");

var branchCount = db.branches.countDocuments();
var policyCount = db.policies.countDocuments();
var customerCount = db.customers.countDocuments();
var claimCount = db.claims.countDocuments();
var agentCount = db.agents.countDocuments();
var reviewCount = db.reviews.countDocuments();

print("Analytics collections created:");
print("- branches: " + branchCount);
print("- policies: " + policyCount);
print("- customers: " + customerCount);
print("- claims: " + claimCount);
print("- agents: " + agentCount);
print("- reviews: " + reviewCount);

print("\n=======================================================");
print("✅ DAY 2 INSURANCE ANALYTICS DATA LOADING COMPLETE!");
print("=======================================================");
print("All Day 2 data has been loaded into the insurance_company database.");
print("");
print("Day 2 additions:");
print("- Additional policies, customers, claims with analytics fields");
print("- Customer reviews for text search and sentiment analysis");
print("- Analytics indexes for aggregation and geospatial queries");
print("- Agent performance data for workforce analytics");
print("");
print("You can now proceed with any Day 2 lab:");
print("- Lab 6: Advanced Querying & Filtering");
print("- Lab 7: Aggregation Framework Mastery");
print("- Lab 8: Indexing Strategies and Performance");
print("- Lab 9: Data Modeling and Schema Design");
print("");
print("To reload this data at any time, run:");
print("mongosh < data/day2_data_loader.js");
print("=======================================================");
