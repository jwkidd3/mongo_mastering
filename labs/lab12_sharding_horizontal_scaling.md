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

MongoDB sharding distributes data across multiple machines for horizontal scaling. A sharded cluster consists of four main components:

#### **1. SHARDS (Data Storage)**
- **Purpose**: Store subset of collection data
- **Implementation**: Replica sets for high availability
- **Example**: Shard1 (Eastern US), Shard2 (Western US), Shard3 (International)

#### **2. CONFIG SERVERS (Metadata Storage)**
- **Purpose**: Store cluster configuration and chunk metadata
- **Implementation**: Replica set of config servers
- **Contains**: Shard mappings, chunk ranges, balancer settings

#### **3. QUERY ROUTERS (mongos)**
- **Purpose**: Route queries to appropriate shards
- **Implementation**: Stateless routing processes
- **Function**: Query optimization and result aggregation

#### **4. CHUNKS**
- **Purpose**: Logical units of data distribution
- **Size**: Default 128MB, configurable
- **Migration**: Automatic balancing between shards

#### **Current Environment Analysis**
Our current environment uses a 3-member replica set, which provides high availability but not horizontal scaling. Let's explore how our insurance data would benefit from sharding.

```javascript
// Connect to our replica set
use insurance_company
```

### Step 2: Analyze Insurance Data for Sharding

Understanding your current data distribution is crucial for designing an effective sharding strategy.

**Analyze Customer Geographic Distribution:**
```javascript
// Analyze customer distribution by state for geographic sharding
var customersByState = db.customers.aggregate([
  { $group: { _id: "$address.state", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray()

customersByState
```

**Analyze Policy Type Distribution:**
```javascript
// Analyze policy types for business-logic sharding
var policiesByType = db.policies.aggregate([
  { $group: { _id: "$policyType", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray()

policiesByType
```

**Simulate Shard Distribution:**
```javascript
// Calculate how data would be distributed across shards
var totalDocs = db.customers.countDocuments()
var docsPerShard = Math.ceil(totalDocs / 3)

print("Total customers: " + totalDocs)
print("Documents per shard (3 shards): " + docsPerShard)
```

#### **Sharding Strategy Recommendations**

Based on this data analysis, insurance companies typically benefit from:

1. **Geographic Sharding**: Distribute customers by state/region for data locality
2. **Product Sharding**: Separate policy types (Auto, Home, Life) for specialized processing
3. **Hash-based Sharding**: Use `_id` field for guaranteed even distribution
4. **Range-based Sharding**: Optimize time-series queries using date fields

### Step 3: Sharding Commands Simulation

In a real sharded environment, you would use these commands:
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

### Step 5: Sharding Command Simulation (Current Environment: Replica Set)

```javascript
// NOTE: Our current environment is a replica set, not a sharded cluster
// The following commands would be used in a sharded environment

print("=== Sharding Commands Simulation ===")
print("Current environment: Replica Set")
print("In a sharded cluster, you would run:")
print("")

print("1. Enable sharding on database:")
print("   sh.enableSharding('insurance_company')")
print("")

print("2. Shard collections with different strategies:")
print("   // Hashed sharding for customers")
print("   sh.shardCollection('insurance_company.customers', { _id: 'hashed' })")
print("")

print("   // Range sharding for policies")
print("   sh.shardCollection('insurance_company.policies', { region: 1, policyType: 1 })")
print("")

print("   // Geographic sharding for claims")
print("   sh.shardCollection('insurance_company.claims', { state: 1, incidentDate: 1 })")
print("")

print("3. Check sharding status:")
print("   sh.status()")
print("")

// Demonstrate what we can do in current environment
print("=== What we can do in our replica set environment ===")
print("1. Analyze data distribution patterns")
print("2. Plan shard key strategies")
print("3. Simulate query routing")
print("4. Test index strategies for sharded queries")
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

### Step 7: Analyze Distribution (Simulation for Replica Set)

**In a Sharded Environment, You Would:**
1. Navigate to `config` database in Compass
2. View `chunks` collection with filters
3. Monitor chunk distribution across shards

**Replica Set Analysis (What We Can Do Now):**
```javascript
// Analyze actual data distribution patterns
use insurance_company

print("=== Current Data Distribution Analysis ===")
print("(In a sharded environment, this would be spread across multiple shards)")
print("")

// Analyze customers by region/state
print("Customer Distribution by State:")
var customersByState = db.customers.aggregate([
  { $group: { _id: "$address.state", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray()

customersByState.forEach(function(result) {
  print("  " + (result._id || "Unknown") + ": " + result.count + " customers")
})

// Analyze policies by type
print("\nPolicy Distribution by Type:")
var policiesByType = db.policies.aggregate([
  { $group: { _id: "$policyType", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray()

policiesByType.forEach(function(result) {
  print("  " + (result._id || "Unknown") + ": " + result.count + " policies")
})

// Simulate shard distribution
print("\n=== Simulated Shard Distribution ===")
print("If this were sharded with 3 shards:")
var totalDocs = db.customers.countDocuments()
var docsPerShard = Math.ceil(totalDocs / 3)
print("  Estimated docs per shard: " + docsPerShard)
print("  Shard 0: ~" + Math.min(docsPerShard, totalDocs) + " documents")
print("  Shard 1: ~" + Math.min(docsPerShard, Math.max(0, totalDocs - docsPerShard)) + " documents")
print("  Shard 2: ~" + Math.max(0, totalDocs - (2 * docsPerShard)) + " documents")
```

## Part C: Zone Sharding and Management (5 minutes)

### Step 8: Zone Sharding Concepts (Simulation)

```javascript
// Zone sharding commands that would be used in a sharded environment
print("=== Zone Sharding Simulation ===")
print("In a sharded cluster, you would configure zones like this:")
print("")

print("1. Add shard tags for geographic regions:")
print("   sh.addShardTag('shard1rs', 'EASTERN-REGION')")
print("   sh.addShardTag('shard2rs', 'WESTERN-REGION')")
print("")

print("2. Create zone ranges for policies by region:")
print("   sh.addTagRange('insurance_company.policies',")
print("     { region: 'Northeast', policyType: MinKey },")
print("     { region: 'Northeast', policyType: MaxKey },")
print("     'EASTERN-REGION')")
print("")

print("3. Create zone ranges for claims by state:")
print("   sh.addTagRange('insurance_company.claims',")
print("     { state: 'NY', incidentDate: MinKey },")
print("     { state: 'NY', incidentDate: MaxKey },")
print("     'EASTERN-REGION')")
print("")

// Analyze what zone distribution would look like
print("=== Analyzing Geographic Distribution for Zone Planning ===")
print("Current data distribution by state (for zone planning):")

var stateDistribution = db.customers.aggregate([
  { $group: {
      _id: "$address.state",
      customers: { $sum: 1 }
    }
  },
  { $addFields: {
      suggestedZone: {
        $cond: {
          if: { $in: ["$_id", ["NY", "FL", "GA", "NC", "PA"]] },
          then: "EASTERN-REGION",
          else: "WESTERN-REGION"
        }
      }
    }
  },
  { $sort: { customers: -1 } }
]).toArray()

print("\nState distribution with suggested zones:")
stateDistribution.forEach(function(result) {
  print("  " + (result._id || "Unknown") + ": " + result.customers + " customers → " + result.suggestedZone)
})
```

**Monitor in Compass:**
1. Navigate to `config` database
2. View `shards` collection to see shard tags
3. View `tags` collection to see zone ranges

### Step 9: Chunk Management Concepts (Simulation)

```javascript
// Manual chunk operations that would be used in a sharded environment
print("=== Chunk Management Simulation ===")
print("In a sharded cluster, you would manage chunks like this:")
print("")

print("1. Split chunks manually:")
print("   sh.splitAt('insurance_company.policies', { region: 'Midwest', policyType: 'Auto' })")
print("   sh.splitAt('insurance_company.claims', { state: 'CA', incidentDate: new Date('2024-06-01') })")
print("")

print("2. Move chunks between shards:")
print("   sh.moveChunk('insurance_company.policies',")
print("     { region: 'Northeast', policyType: MinKey },")
print("     'shard1rs')")
print("")

print("3. Balancer management:")
print("   sh.stopBalancer()   // Stop during maintenance")
print("   sh.startBalancer()  // Resume after maintenance")
print("")

// Analyze current data distribution that would benefit from chunk management
use insurance_company
print("=== Current Data Distribution Analysis ===")
print("(This shows how data would be distributed across chunks)")
print("")

// Check actual data distribution by fields that would be shard keys
if (db.policies.countDocuments() > 0) {
  print("Policy distribution by type:")
  var policyTypes = db.policies.aggregate([
    { $group: { _id: "$policyType", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray()

  policyTypes.forEach(function(result) {
    print("  " + (result._id || "Unknown") + ": " + result.count + " policies")
  })
}

if (db.claims.countDocuments() > 0) {
  print("\nClaims that would need chunk management:")
  var totalClaims = db.claims.countDocuments()
  print("  Total claims: " + totalClaims)
  print("  Estimated chunks (64MB each): " + Math.ceil(totalClaims / 1000))
}

print("\n=== Maintenance Window Simulation ===")
print("During maintenance, you would:")
print("1. Stop the balancer to prevent chunk migrations")
print("2. Perform maintenance operations")
print("3. Restart the balancer")
print("4. Monitor for proper chunk distribution")
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