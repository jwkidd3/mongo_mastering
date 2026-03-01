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

print("🚀 Starting comprehensive data loading process...");
print("This will load data for all three days of the course.\n");

var startTime = new Date();

// ===========================================
// DAY 1: FUNDAMENTALS DATA (Labs 1-5)
// ===========================================

print("[██████░░░░░░░░░░░░░░] 33% - Day 1: Fundamentals Data");
print("\n📚 DAY 1: MongoDB Fundamentals");
print("Labs: 1-5 (Shell Mastery, Database Management, CRUD Operations)");
print("Database: insurance_company\n");

print("🔄 Loading day1_data_loader.js...");
print("━".repeat(60));

load('data/day1_data_loader.js');

print("✅ Day 1 complete data loaded successfully");

// ===========================================
// DAY 2: ADVANCED FEATURES DATA (Labs 6-10)
// ===========================================

print("\n[█████████████░░░░░░░] 67% - Day 2: Advanced Features Data");
print("\n📊 DAY 2: Advanced MongoDB Features");
print("Labs: 6-10 (Advanced Queries, Aggregation, Indexing, Performance)");
print("Database: insurance_company (Day 2 additions)\n");

print("🔄 Loading day2_data_loader.js...");
print("━".repeat(60));

load('data/day2_data_loader.js');

print("✅ Day 2 complete analytics data loaded successfully");

// ===========================================
// DAY 3: PRODUCTION DATA (Labs 11-13)
// ===========================================

print("\n[████████████████████] 100% - Day 3: Production Data");
print("\n🚀 DAY 3: Production MongoDB Features");
print("Labs: 11-14c (Transactions, Replication, Sharding, Application Integration)");
print("Database: insurance_company\n");

print("🔄 Loading day3_data_loader.js...");
print("━".repeat(60));

load('data/day3_data_loader.js');

print("✅ Day 3 complete production data loaded successfully");

// ===========================================
// FINAL SETUP AND VERIFICATION
// ===========================================

print("\n🔧 Final setup and verification...");

var endTime = new Date();
var loadingTime = (endTime - startTime) / 1000;

print("\n============================================================");
print("🎉 COMPREHENSIVE DATA LOADING COMPLETE!");
print("============================================================");
print("⏱️  Total loading time: " + loadingTime.toFixed(2) + " seconds");
print("");

// Database summaries
print("📊 DATA SUMMARY:");
print("━".repeat(30));

db = db.getSiblingDB('insurance_company');
print("📋 insurance_company database:");
print("   • Policies: " + db.policies.countDocuments());
print("   • Customers: " + db.customers.countDocuments());
print("   • Branches: " + db.branches.countDocuments());
print("");

print("   • Claims: " + db.claims.countDocuments());
print("   • Agents: " + db.agents.countDocuments());
print("   • Reviews: " + db.reviews.countDocuments());
print("");

print("🎯 READY FOR ALL LABS:");
print("━".repeat(20));
print("✅ Day 1 (Labs 1-5): MongoDB Fundamentals");
print("✅ Day 2 (Labs 6-10): Advanced Features & Analytics");
print("✅ Day 3 (Labs 11-14c): Production & Application Integration");
print("");

print("🚀 Your 3-day MongoDB Mastering Course environment is ready!");
print("============================================================");