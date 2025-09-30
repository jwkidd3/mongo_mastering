# Lab 12: Sharding & Horizontal Scaling
**Duration:** 45 minutes
**Objective:** Understand MongoDB sharding concepts and strategies for insurance company geographic distribution

## Prerequisites: Environment Setup

### Step 1: Verify MongoDB Environment

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./setup/setup.sh
```

**Windows PowerShell:**
```powershell
.\setup\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

**Load Course Data:**
```bash
mongosh < data/comprehensive_data_loader.js
```

## Part A: Understanding Sharding Architecture (25 minutes)

### Step 1: Sharded Cluster Components Overview

**Understanding Sharding Components:**
```javascript
// Connect to our replica set to understand sharding concepts
use insurance_company

print("=== MongoDB Sharding Architecture Overview ===")
print("")

print("1. SHARDS (Data Storage)")
print("   Purpose: Store subset of collection data")
print("   Implementation: Replica sets for high availability")
print("   Example: Shard1 (Eastern US), Shard2 (Western US), Shard3 (International)")
print("")

print("2. CONFIG SERVERS (Metadata Storage)")
print("   Purpose: Store cluster configuration and chunk metadata")
print("   Implementation: Replica set of config servers")
print("   Contains: Shard mappings, chunk ranges, balancer settings")
print("")

print("3. QUERY ROUTERS (mongos)")
print("   Purpose: Route queries to appropriate shards")
print("   Implementation: Stateless routing processes")
print("   Function: Query optimization and result aggregation")
print("")

print("4. CHUNKS")
print("   Purpose: Logical units of data distribution")
print("   Size: Default 128MB, configurable")
print("   Migration: Automatic balancing between shards")
print("")

print("=== Current Setup Analysis ===")
print("Our current environment uses a 3-member replica set.")
print("This provides high availability but not horizontal scaling.")
print("Let's explore how our insurance data would benefit from sharding.")
```

### Step 2: Analyze Insurance Data for Sharding

**Examine Current Data Distribution:**
```javascript
// Analyze our insurance data for sharding opportunities
print("=== Insurance Data Analysis for Sharding ===")
print("")

// Analyze customer distribution
print("Customer Distribution Analysis:")
var customersByState = db.customers.aggregate([
  { $group: { _id: "$address.state", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray()

// Display customer distribution by state (step-by-step approach)
for (var i = 0; i < customersByState.length; i++) {
  var state = customersByState[i];
  print("  " + (state._id || "Unknown") + ": " + state.count + " customers");
}
print("")

// Analyze policy distribution
print("Policy Distribution Analysis:")
var policiesByType = db.policies.aggregate([
  { $group: { _id: "$policyType", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray()

// Display policy distribution by type (step-by-step approach)
for (var j = 0; j < policiesByType.length; j++) {
  var type = policiesByType[j];
  print("  " + (type._id || "Unknown") + ": " + type.count + " policies");
}
print("")

// Analyze claims by geography
print("Claims Geographic Distribution:")
if (db.claims.countDocuments() > 0) {
  var claimsByLocation = db.claims.aggregate([
    { $group: { _id: "$state", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray()

  // Display claims distribution by location (step-by-step approach)
  for (var k = 0; k < claimsByLocation.length; k++) {
    var location = claimsByLocation[k];
    print("  " + (location._id || "Unknown") + ": " + location.count + " claims");
  }
} else {
  print("  No claims data available for analysis")
}
print("")

print("=== Sharding Strategy Recommendations ===")
print("Based on the data analysis above:")
print("")
print("1. GEOGRAPHIC SHARDING")
print("   Shard Key: { state: 1, customerId: 1 }")
print("   Benefits: Locality for regional operations")
print("   Use Case: Branch-specific queries and compliance")
print("")
print("2. HASH SHARDING")
print("   Shard Key: { _id: 'hashed' }")
print("   Benefits: Even distribution of write load")
print("   Use Case: High-volume, evenly distributed writes")
print("")
print("3. RANGE SHARDING")
print("   Shard Key: { policyType: 1, effectiveDate: 1 }")
print("   Benefits: Efficient queries by policy type")
print("   Use Case: Policy type-specific analytics")
```

### Step 3: Sharding Strategy Simulation

**Simulate Different Sharding Approaches:**

```javascript
// Step 1: Initialize sharding distribution simulation
print("=== Sharding Distribution Simulation ===");
print("");
```

```javascript
// Step 2: Set up geographic sharding simulation
print("1. GEOGRAPHIC SHARDING SIMULATION");
print("   Imaginary shard allocation by state:");
```

```javascript
// Step 3: Define state to shard mapping
var stateToShard = {
  "CA": "shard-west",
  "NY": "shard-east",
  "TX": "shard-central",
  "FL": "shard-east",
  "IL": "shard-central"
};
```

```javascript
// Step 4: Count customers by geographic shard using aggregation (safer approach)
var customersByGeographicShard = db.customers.aggregate([
  { $addFields: {
      assignedShard: {
        $switch: {
          branches: [
            { case: { $eq: ["$address.state", "CA"] }, then: "shard-west" },
            { case: { $eq: ["$address.state", "NY"] }, then: "shard-east" },
            { case: { $eq: ["$address.state", "TX"] }, then: "shard-central" },
            { case: { $eq: ["$address.state", "FL"] }, then: "shard-east" },
            { case: { $eq: ["$address.state", "IL"] }, then: "shard-central" }
          ],
          default: "shard-other"
        }
      }
    }
  },
  { $group: { _id: "$assignedShard", count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]).toArray();
```

```javascript
// Step 5: Display geographic shard distribution
for (var i = 0; i < customersByGeographicShard.length; i++) {
  var shard = customersByGeographicShard[i];
  print("   " + shard._id + ": " + shard.count + " customers");
}
print("");
```

```javascript
// Step 6: Simulate hash sharding
print("2. HASH SHARDING SIMULATION");
print("   Even distribution across 3 hypothetical shards:");
```

```javascript
// Step 7: Calculate hash shard distribution
var customerCount = db.customers.countDocuments();
var shardSize = Math.ceil(customerCount / 3);
print("   shard-0: ~" + shardSize + " customers");
print("   shard-1: ~" + shardSize + " customers");
print("   shard-2: ~" + shardSize + " customers");
print("");
```

```javascript
// Step 8: Set up range sharding by policy type
print("3. RANGE SHARDING BY POLICY TYPE");
print("   Shard allocation by policy type:");
```

```javascript
// Step 9: Count policies by type shard using aggregation (safer approach)
var policiesByTypeShard = db.policies.aggregate([
  { $addFields: {
      assignedShard: {
        $switch: {
          branches: [
            { case: { $eq: ["$policyType", "Auto"] }, then: "shard-auto" },
            { case: { $eq: ["$policyType", "Property"] }, then: "shard-property" },
            { case: { $eq: ["$policyType", "Life"] }, then: "shard-life" },
            { case: { $eq: ["$policyType", "Commercial"] }, then: "shard-commercial" }
          ],
          default: "shard-other"
        }
      }
    }
  },
  { $group: { _id: "$assignedShard", count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]).toArray();
```

```javascript
// Step 10: Display policy type shard distribution
for (var j = 0; j < policiesByTypeShard.length; j++) {
  var policyShard = policiesByTypeShard[j];
  print("   " + policyShard._id + ": " + policyShard.count + " policies");
}
```

### Step 4: Query Routing Simulation

**Understand How Queries Would Route:**
```javascript
// Simulate query routing in a sharded environment
function simulateQueryRouting() {
  print("=== Query Routing Simulation ===")
  print("")

  print("Query 1: Find customers in California")
  print("  Query: db.customers.find({ 'address.state': 'CA' })")
  print("  Sharding: Geographic by state")
  print("  Route: Would target shard-west only")
  print("  Efficiency: High (single shard)")
  print("")

  print("Query 2: Find all auto policies")
  print("  Query: db.policies.find({ policyType: 'Auto' })")
  print("  Sharding: Range by policy type")
  print("  Route: Would target shard-auto only")
  print("  Efficiency: High (single shard)")
  print("")

  print("Query 3: Count all customers")
  print("  Query: db.customers.countDocuments({})")
  print("  Sharding: Any strategy")
  print("  Route: Must query all shards and aggregate")
  print("  Efficiency: Lower (requires scatter-gather)")
  print("")

  print("Query 4: Find customer by ID")
  print("  Query: db.customers.findOne({ _id: 'specific_id' })")
  print("  Sharding: Hash on _id")
  print("  Route: Deterministic single shard")
  print("  Efficiency: High (direct routing)")
  print("")

  // Demonstrate query analysis
  print("=== Query Performance Analysis ===")
  var start = new Date()
  var customerCount = db.customers.countDocuments({ "address.state": "CA" })
  var end = new Date()
  print("Current (non-sharded): " + customerCount + " CA customers found in " + (end - start) + "ms")
  print("Sharded scenario: Would be faster with geographic sharding")
}

simulateQueryRouting()
```

## Part B: Sharding Strategy Deep Dive (15 minutes)

### Step 5: Enable Sharding and Create Collections

```javascript
// Enable sharding on insurance database
sh.enableSharding("insurance_company")

use insurance_company

// 1. Hashed sharding for even distribution of customers
sh.shardCollection("insurance_company.customers", { _id: "hashed" })

// 2. Range-based sharding for policy data by region and type
sh.shardCollection("insurance_company.policies", { region: 1, policyType: 1 })

// 3. Geographic sharding for claims by state/region
sh.shardCollection("insurance_company.claims", { state: 1, incidentDate: 1 })

// 4. Agent performance data by territory
sh.shardCollection("insurance_company.agents", { territory: 1, agentId: 1 })

// 5. Branch operations by geographic location
sh.shardCollection("insurance_company.branches", { region: 1, branchCode: 1 })

// Check sharding status
sh.status()
```

### Step 6: Load Test Data

**Generate Customer Data (Hashed Sharding):**
```javascript
// Generate customers for hashed distribution
print("Generating customer data...");
var customerTypes = ["Individual", "Business"];
var states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"];

for (let i = 1; i <= 1000; i++) {
  var customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)];
  var state = states[Math.floor(Math.random() * states.length)];

  db.customers.insertOne({
    _id: "cust" + i,
    name: customerType === "Individual" ? `Customer ${i}` : `Business Corp ${i}`,
    email: `customer${i}@example.com`,
    phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    type: customerType,
    state: state,
    registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    accountBalance: Math.round((Math.random() * 50000 + 1000) * 100) / 100,
    creditScore: customerType === "Individual" ? Math.floor(Math.random() * 400 + 400) : null,
    businessSize: customerType === "Business" ? Math.floor(Math.random() * 1000 + 10) : null
  });

  if (i % 200 === 0) {
    print(`Inserted ${i} customers`);
  }
}
```

**Generate Policy Data (Range Sharding):**
```javascript
// Generate policies for range-based distribution
print("Generating policy data...");
var regions = ["Northeast", "Southeast", "Midwest", "Southwest", "West"];
var policyTypes = ["Auto", "Property", "Life", "Commercial", "Health"];
var states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"];

for (let i = 1; i <= 1500; i++) {
  var region = regions[Math.floor(Math.random() * regions.length)];
  var policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)];
  var state = states[Math.floor(Math.random() * states.length)];
  var customerId = "cust" + Math.floor(Math.random() * 1000 + 1);

  var coverageLimits = {
    "Auto": [25000, 50000, 100000, 250000],
    "Property": [200000, 350000, 500000, 750000, 1000000],
    "Life": [100000, 250000, 500000, 1000000],
    "Commercial": [500000, 1000000, 2000000, 5000000],
    "Health": [50000, 100000, 250000, 500000]
  };

  var coverageLimit = coverageLimits[policyType][Math.floor(Math.random() * coverageLimits[policyType].length)];
  var premium = coverageLimit * (0.001 + Math.random() * 0.004); // 0.1% to 0.5% of coverage

  db.policies.insertOne({
    _id: "policy" + i,
    policyNumber: policyType.toUpperCase() + "-" + String(i).padStart(6, '0'),
    customerId: customerId,
    region: region,
    state: state,
    policyType: policyType,
    coverageLimit: coverageLimit,
    premium: Math.round(premium * 100) / 100,
    effectiveDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    expirationDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    status: Math.random() > 0.9 ? "Pending" : "Active",
    deductible: policyType === "Auto" ? [500, 1000, 2500][Math.floor(Math.random() * 3)] :
                policyType === "Property" ? [1000, 2500, 5000][Math.floor(Math.random() * 3)] : 0
  });

  if (i % 300 === 0) {
    print(`Inserted ${i} policies`);
  }
}
```

**Generate Claims Data (Geographic Sharding):**
```javascript
// Generate claims for geographic distribution
print("Generating claims data...");
var states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"];
var claimTypes = ["Auto Accident", "Property Damage", "Theft", "Fire", "Medical", "Liability"];
var statuses = ["Filed", "Under Review", "Investigating", "Approved", "Denied", "Settled"];

for (let i = 1; i <= 800; i++) {
  var state = states[Math.floor(Math.random() * states.length)];
  var claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
  var status = statuses[Math.floor(Math.random() * statuses.length)];
  var customerId = "cust" + Math.floor(Math.random() * 1000 + 1);
  var policyId = "policy" + Math.floor(Math.random() * 1500 + 1);

  var claimAmount = Math.round((Math.random() * 50000 + 500) * 100) / 100;
  var settlementAmount = status === "Settled" ? Math.round(claimAmount * (0.7 + Math.random() * 0.3) * 100) / 100 : null;

  db.claims.insertOne({
    _id: "claim" + i,
    claimNumber: "CLM-" + new Date().getFullYear() + "-" + String(i).padStart(6, '0'),
    customerId: customerId,
    policyId: policyId,
    state: state,
    claimType: claimType,
    incidentDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    filedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    claimAmount: claimAmount,
    settlementAmount: settlementAmount,
    status: status,
    description: `${claimType} incident in ${state}`,
    adjusterId: status !== "Filed" ? `adjuster${Math.floor(Math.random() * 20 + 1)}` : null,
    investigationNotes: status === "Investigating" ? "Under investigation" : null
  });

  if (i % 200 === 0) {
    print(`Inserted ${i} claims`);
  }
}

// Generate agent data for territory-based sharding
print("Generating agent data...");
var territories = ["North-CA", "South-CA", "NYC", "Upstate-NY", "Dallas-TX", "Houston-TX", "Miami-FL", "Tampa-FL"];
for (let i = 1; i <= 150; i++) {
  var territory = territories[Math.floor(Math.random() * territories.length)];

  db.agents.insertOne({
    territory: territory,
    agentId: "agent" + i,
    name: `Agent ${i}`,
    email: `agent${i}@insurance.com`,
    phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    hireDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    performanceMetrics: {
      policiesSold: Math.floor(Math.random() * 200 + 50),
      commission: Math.round((Math.random() * 80000 + 30000) * 100) / 100,
      customerSatisfaction: Math.round((Math.random() * 2 + 3) * 100) / 100, // 3.0 to 5.0
      renewalRate: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100 // 70% to 100%
    }
  });

  if (i % 50 === 0) {
    print(`Inserted ${i} agents`);
  }
}
```

### Step 7: Analyze Distribution

**Monitor Data Distribution in Compass:**
1. Navigate to `config` database
2. View `chunks` collection with filters:
   - `{"ns": "insurance_company.customers"}` - see customer chunks
   - `{"ns": "insurance_company.policies"}` - see policy chunks
   - `{"ns": "insurance_company.claims"}` - see claim chunks

**Analyze via MongoSH:**
```javascript
// Check chunk distribution for insurance collections
use config
print("Chunk counts by insurance collection:");
print("Customers: " + db.chunks.find({ ns: "insurance_company.customers" }).count());
print("Policies: " + db.chunks.find({ ns: "insurance_company.policies" }).count());
print("Claims: " + db.chunks.find({ ns: "insurance_company.claims" }).count());
print("Agents: " + db.chunks.find({ ns: "insurance_company.agents" }).count());

// Check chunks per shard for insurance data
print("\nChunks per shard:");
db.chunks.aggregate([
  { $group: { _id: "$shard", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).forEach(printjson);

// Insurance-specific chunk analysis
print("\nPolicy chunks by region:");
db.chunks.aggregate([
  { $match: { ns: "insurance_company.policies" } },
  { $group: { _id: "$shard", policies: { $sum: 1 } } },
  { $sort: { policies: -1 } }
]).forEach(printjson);

print("\nClaims chunks by geography:");
db.chunks.aggregate([
  { $match: { ns: "insurance_company.claims" } },
  { $group: { _id: "$shard", claims: { $sum: 1 } } },
  { $sort: { claims: -1 } }
]).forEach(printjson);

// Check balancer status
print("\nBalancer status:");
print("Enabled: " + sh.getBalancerState());
print("Running: " + sh.isBalancerRunning());
```

## Part C: Zone Sharding and Management (5 minutes)

### Step 8: Zone Sharding for Geographic Distribution

```javascript
// Add tags to shards for insurance geographic zones
sh.addShardTag("shard1rs", "EASTERN-REGION")
sh.addShardTag("shard2rs", "WESTERN-REGION")

// Create zone ranges for insurance policy data
// Eastern regions (Northeast, Southeast)
sh.addTagRange(
  "insurance_company.policies",
  { region: "Northeast", policyType: MinKey },
  { region: "Northeast", policyType: MaxKey },
  "EASTERN-REGION"
)

sh.addTagRange(
  "insurance_company.policies",
  { region: "Southeast", policyType: MinKey },
  { region: "Southeast", policyType: MaxKey },
  "EASTERN-REGION"
)

// Western regions (West, Southwest, Midwest)
sh.addTagRange(
  "insurance_company.policies",
  { region: "West", policyType: MinKey },
  { region: "West", policyType: MaxKey },
  "WESTERN-REGION"
)

sh.addTagRange(
  "insurance_company.policies",
  { region: "Southwest", policyType: MinKey },
  { region: "Southwest", policyType: MaxKey },
  "WESTERN-REGION"
)

sh.addTagRange(
  "insurance_company.policies",
  { region: "Midwest", policyType: MinKey },
  { region: "Midwest", policyType: MaxKey },
  "WESTERN-REGION"
)

// Create zone ranges for claims by state groups
// Eastern states
sh.addTagRange(
  "insurance_company.claims",
  { state: "FL", incidentDate: MinKey },
  { state: "FL", incidentDate: MaxKey },
  "EASTERN-REGION"
)

sh.addTagRange(
  "insurance_company.claims",
  { state: "GA", incidentDate: MinKey },
  { state: "GA", incidentDate: MaxKey },
  "EASTERN-REGION"
)

sh.addTagRange(
  "insurance_company.claims",
  { state: "NC", incidentDate: MinKey },
  { state: "NC", incidentDate: MaxKey },
  "EASTERN-REGION"
)

sh.addTagRange(
  "insurance_company.claims",
  { state: "NY", incidentDate: MinKey },
  { state: "NY", incidentDate: MaxKey },
  "EASTERN-REGION"
)

sh.addTagRange(
  "insurance_company.claims",
  { state: "PA", incidentDate: MinKey },
  { state: "PA", incidentDate: MaxKey },
  "EASTERN-REGION"
)

// Western states
sh.addTagRange(
  "insurance_company.claims",
  { state: "CA", incidentDate: MinKey },
  { state: "CA", incidentDate: MaxKey },
  "WESTERN-REGION"
)

sh.addTagRange(
  "insurance_company.claims",
  { state: "TX", incidentDate: MinKey },
  { state: "TX", incidentDate: MaxKey },
  "WESTERN-REGION"
)

sh.addTagRange(
  "insurance_company.claims",
  { state: "IL", incidentDate: MinKey },
  { state: "IL", incidentDate: MaxKey },
  "WESTERN-REGION"
)

sh.addTagRange(
  "insurance_company.claims",
  { state: "MI", incidentDate: MinKey },
  { state: "MI", incidentDate: MaxKey },
  "WESTERN-REGION"
)

sh.addTagRange(
  "insurance_company.claims",
  { state: "OH", incidentDate: MinKey },
  { state: "OH", incidentDate: MaxKey },
  "WESTERN-REGION"
)

// Check zone configuration
sh.status()
```

**Monitor in Compass:**
1. Navigate to `config` database
2. View `shards` collection to see shard tags
3. View `tags` collection to see zone ranges

### Step 9: Manual Chunk Operations

```javascript
// Split chunks manually for better insurance data distribution
sh.splitAt("insurance_company.policies", { region: "Midwest", policyType: "Auto" })
sh.splitAt("insurance_company.claims", { state: "CA", incidentDate: new Date("2024-06-01") })

// Move chunks between shards for better geographic distribution
sh.moveChunk(
  "insurance_company.policies",
  { region: "Northeast", policyType: MinKey },
  "shard1rs"  // Move to Eastern region shard
)

sh.moveChunk(
  "insurance_company.claims",
  { state: "CA", incidentDate: MinKey },
  "shard2rs"  // Move California claims to Western region shard
)

// Balancer management for insurance operations
sh.stopBalancer()   // Temporarily disable during maintenance windows
print("Balancer stopped for maintenance window");

// Check chunk distribution during maintenance
use insurance_company
print("\nData distribution check:");
print("CA Policies: " + db.policies.countDocuments({ state: "CA" }));
print("NY Policies: " + db.policies.countDocuments({ state: "NY" }));
print("TX Claims: " + db.claims.countDocuments({ state: "TX" }));
print("FL Claims: " + db.claims.countDocuments({ state: "FL" }));

sh.startBalancer()  // Re-enable after maintenance
print("Balancer restarted");
```

## Lab 3 Deliverables
✅ **Complete sharded cluster** with config servers and multiple shards for insurance company
✅ **Insurance-specific sharding strategies** implemented:
   - Hashed sharding for customer distribution
   - Range sharding for policies by region and type
   - Geographic sharding for claims by state
   - Territory-based sharding for agent data
✅ **Zone sharding** configured for insurance geographic regions (Eastern/Western)
✅ **Chunk distribution analysis** optimized for insurance operations and compliance requirements
✅ **Balancer management** for insurance data maintenance windows