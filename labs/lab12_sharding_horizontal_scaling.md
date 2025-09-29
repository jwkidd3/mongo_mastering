# Lab 3: Sharding & Horizontal Scaling
**Duration:** 45 minutes
**Objective:** Build and manage a sharded MongoDB cluster for insurance company geographic distribution

## Part A: Sharded Cluster Setup (25 minutes)

### Step 1: Start Config Server Replica Set
```bash
# Config servers (store cluster metadata)
docker run -d --name config1 --network mongodb-net -p 27100:27017 mongo:8.0 --configsvr --replSet configrs --bind_ip_all
docker run -d --name config2 --network mongodb-net -p 27101:27017 mongo:8.0 --configsvr --replSet configrs --bind_ip_all
docker run -d --name config3 --network mongodb-net -p 27102:27017 mongo:8.0 --configsvr --replSet configrs --bind_ip_all

# Wait for startup
sleep 15

# Initialize config server replica set
docker exec -it config1 mongosh --eval "
rs.initiate({
  _id: 'configrs',
  members: [
    { _id: 0, host: 'config1:27017' },
    { _id: 1, host: 'config2:27017' },
    { _id: 2, host: 'config3:27017' }
  ]
})
"
```

### Step 2: Start Shard Replica Sets
```bash
# Shard 1 replica set
docker run -d --name shard1-1 --network mongodb-net -p 27201:27017 mongo:8.0 --shardsvr --replSet shard1rs --bind_ip_all
docker run -d --name shard1-2 --network mongodb-net -p 27202:27017 mongo:8.0 --shardsvr --replSet shard1rs --bind_ip_all
docker run -d --name shard1-3 --network mongodb-net -p 27203:27017 mongo:8.0 --shardsvr --replSet shard1rs --bind_ip_all

# Shard 2 replica set
docker run -d --name shard2-1 --network mongodb-net -p 27301:27017 mongo:8.0 --shardsvr --replSet shard2rs --bind_ip_all
docker run -d --name shard2-2 --network mongodb-net -p 27302:27017 mongo:8.0 --shardsvr --replSet shard2rs --bind_ip_all
docker run -d --name shard2-3 --network mongodb-net -p 27303:27017 mongo:8.0 --shardsvr --replSet shard2rs --bind_ip_all

# Wait for startup
sleep 15

# Initialize shard 1 replica set
docker exec -it shard1-1 mongosh --eval "
rs.initiate({
  _id: 'shard1rs',
  members: [
    { _id: 0, host: 'shard1-1:27017' },
    { _id: 1, host: 'shard1-2:27017' },
    { _id: 2, host: 'shard1-3:27017' }
  ]
})
"

# Initialize shard 2 replica set
docker exec -it shard2-1 mongosh --eval "
rs.initiate({
  _id: 'shard2rs',
  members: [
    { _id: 0, host: 'shard2-1:27017' },
    { _id: 1, host: 'shard2-2:27017' },
    { _id: 2, host: 'shard2-3:27017' }
  ]
})
"
```

### Step 3: Start Query Routers (mongos)
```bash
# Query routers
docker run -d --name mongos1 --network mongodb-net -p 27017:27017 mongo:8.0 mongos --configdb configrs/config1:27017,config2:27017,config3:27017 --bind_ip_all
docker run -d --name mongos2 --network mongodb-net -p 27018:27017 mongo:8.0 mongos --configdb configrs/config1:27017,config2:27017,config3:27017 --bind_ip_all

# Wait for mongos startup
sleep 15
```

### Step 4: Configure Sharded Cluster

**Connect to Sharded Cluster with Compass:**
1. Connection String: `mongodb://localhost:27017`
2. This connects to mongos (query router)

**Add Shards via Compass MongoSH:**
```javascript
// Add shards to the cluster
sh.addShard("shard1rs/shard1-1:27017,shard1-2:27017,shard1-3:27017")
sh.addShard("shard2rs/shard2-1:27017,shard2-2:27017,shard2-3:27017")

// Check cluster status
sh.status()
```

**Monitor in Compass:**
1. Navigate to `config` database
2. Explore collections: `shards`, `chunks`, `databases`
3. View the sharding configuration

## Part B: Sharding Strategy Implementation (15 minutes)

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