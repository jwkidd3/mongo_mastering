# Lab 12: Sharding & Horizontal Scaling
**Duration:** 75 minutes
**Objective:** Understand MongoDB sharding concepts and strategies for insurance company geographic distribution by running real sharding commands against a live sharded cluster.

> **NOTE — Two Environments**
> Lab 12 uses **two MongoDB environments side-by-side**:
> 1. **Replica set** on `localhost:27017` — holds the `insurance_company` data set you have used in earlier labs (loaded by `comprehensive_data_loader.js`). This is your *source* of analysis data.
> 2. **Sharded cluster** on `localhost:27120` (mongos router) — provisioned by `scripts/setup_sharding.sh`. This is where you will perform actual sharding operations.
>
> Topology of the sharded cluster:
> - Mongos router : `localhost:27120` ← students connect here for Part B/C
> - Config server : `mongo-cfg` (replica set `cfgrs`, port 27121)
> - Shard 1       : `mongo-shard1` (replica set `shard1rs`, port 27131)
> - Shard 2       : `mongo-shard2` (replica set `shard2rs`, port 27141)

## Prerequisites: Environment Setup

### Prerequisites: Verify MongoDB Replica Set

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./scripts/setup.sh
```

**Windows PowerShell:**
```powershell
.\scripts\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

**Load Course Data into the Replica Set:**
> **New to MongoDB tooling?** See [Lab 1 — Choose Your Tool](lab01_mongodb_shell_mastery.md#choose-your-tool-mongodb-compass-or-mongosh-cli) for the Compass UI alternative (no shell-redirection issues, works the same on every OS).

```bash
mongosh < data/comprehensive_data_loader.js
```

> **Windows (PowerShell):** PowerShell does not forward `<` into `mongosh` — the command will error. Use `--file` instead:
> ```powershell
> mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
> ```

### Prerequisites: Provision the Sharded Cluster

Lab 12 requires a real sharded cluster. Provision it with the course script:

**macOS/Linux:**
```bash
./scripts/setup_sharding.sh
```

**Windows PowerShell:**
```powershell
.\scripts\setup_sharding.ps1
```

This brings up a config server, two shard replica sets, and a mongos router on port `27120`. The script is idempotent — re-running it cleans up and recreates the sharded cluster. It does **not** affect the replica set on `27017`.

**Connect to the sharded cluster (you will use this connection for Part B and Part C):**
```bash
mongosh "mongodb://localhost:27120/?directConnection=true"
```

You should see a prompt like `[direct: mongos] test>`. Verify the cluster:
```javascript
sh.status()
```

You should see two shards (`shard1rs`, `shard2rs`) and the config database.

## Part A: Understanding Sharding Architecture (15 minutes)

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

#### **Inspect the Live Sharded Cluster**

Connect to mongos (`mongodb://localhost:27120/?directConnection=true`) and inspect the cluster components.

```javascript
// View overall cluster status
sh.status()
```

```javascript
// List shards in the config metadata
db.getSiblingDB("config").shards.find().toArray()
```

### Step 2: Analyze Insurance Data for Sharding (Replica Set)

Connect to the **replica set** (port 27017) in a separate terminal to analyze the source data:

```bash
mongosh
```

```javascript
use insurance_company
```

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

**Estimate Shard Distribution:**
```javascript
// Calculate how data would be distributed across 2 shards
var totalDocs = db.customers.countDocuments()
var docsPerShard = Math.ceil(totalDocs / 2)
print("Total customers: " + totalDocs)
print("Documents per shard (2 shards): " + docsPerShard)
```

#### **Sharding Strategy Recommendations**

Based on this data analysis, insurance companies typically benefit from:

1. **Geographic Sharding**: Distribute customers by state/region for data locality
2. **Product Sharding**: Separate policy types (Auto, Property, Life) for specialized processing
3. **Hash-based Sharding**: Use `_id` field for guaranteed even distribution
4. **Range-based Sharding**: Optimize time-series queries using date fields

In the rest of this lab you will apply these strategies against the actual sharded cluster. Stretch Goals at the end of the lab let you extend the work to additional collections and zone-based residency.

## Part B: Real Sharding Operations on the Mongos Cluster (35 minutes)

> Switch to the **mongos** connection now: `mongosh "mongodb://localhost:27120/?directConnection=true"`. All commands in Part B are executed against mongos unless noted otherwise.

### Step 3: Migrate Sample Data into the Sharded Cluster

The sharded cluster starts empty. We need to copy the `insurance_company` data from the replica set into the sharded cluster so we have something real to shard.

**At the mongos prompt**, run the following script. It opens a second connection to the replica set, reads each collection, and inserts the documents through mongos:

```javascript
// Run this AT THE MONGOS PROMPT (mongodb://localhost:27120)
// It opens a second connection to the replica set on 27017 and copies data in.
const sourceConn = new Mongo("mongodb://localhost:27017/?directConnection=true");
const sourceDb = sourceConn.getDB("insurance_company");
const targetDb = db.getSiblingDB("insurance_company");

["customers", "policies", "claims", "agents"].forEach(function (c) {
  const docs = sourceDb.getCollection(c).find().toArray();
  if (docs.length === 0) {
    print("(skip) no documents in source." + c);
    return;
  }
  targetDb.getCollection(c).deleteMany({});
  targetDb.getCollection(c).insertMany(docs);
  print("Migrated " + docs.length + " documents -> insurance_company." + c);
});
```

**Verify the migration:**
```javascript
use insurance_company
db.customers.countDocuments()
db.policies.countDocuments()
db.claims.countDocuments()
```

You should see non-zero counts. The data is now in the sharded cluster, but the collections are NOT sharded yet — they all live on the primary shard. We will shard them next.

### Step 4: Enable Sharding and Shard Collections

Sharding is enabled per database, then per collection.

**Enable sharding on the database:**
```javascript
sh.enableSharding("insurance_company")
```

**Shard `customers` with a compound range key (geographic + ID):**
```javascript
// Index on the shard key MUST exist before shardCollection
db.customers.createIndex({ "address.state": 1, customerId: 1 })
sh.shardCollection("insurance_company.customers", { "address.state": 1, customerId: 1 })
```

**Shard `policies` with a hashed key for even write distribution:**
```javascript
db.policies.createIndex({ _id: "hashed" })
sh.shardCollection("insurance_company.policies", { _id: "hashed" })
```

> Want to also shard `claims` with a compound `(policyType, incidentDate)` key? See **Stretch Goal 1** at the end of the lab.

**Verify sharding configuration:**
```javascript
sh.status()
```

Look for the `insurance_company.customers` and `insurance_company.policies` entries with their shard keys and chunk metadata.

### Step 5: Inspect Chunk Distribution

```javascript
// See how docs are distributed across shards
db.customers.getShardDistribution()
```

```javascript
db.policies.getShardDistribution()
```

> With small sample data, you'll initially see only one chunk per collection on the primary shard. The next step manually splits and migrates chunks so you can observe true cross-shard distribution. For deeper config-database introspection see **Stretch Goal 3**.

### Step 6: Manually Split and Move Chunks

By default a freshly sharded small collection has one chunk on the primary shard. To demonstrate distribution, we will split a chunk and move it to the other shard.

**Split the `customers` chunk at state = "NY":**
```javascript
// Idempotent: re-running after the chunk is already split is a no-op.
try {
  sh.splitAt(
    "insurance_company.customers",
    { "address.state": "NY", customerId: MinKey }
  )
} catch (e) {
  if (/boundary key|already exists/i.test(e.message)) {
    print("Chunk already split at this boundary — skipping.");
  } else { throw e; }
}
```

```javascript
// View the new chunk boundaries
sh.status()
```

You should now see two chunks for `insurance_company.customers`.

**Move the upper chunk to the second shard:**
```javascript
sh.moveChunk(
  "insurance_company.customers",
  { "address.state": "NY", customerId: MinKey },
  "shard2rs"
)
```

**Re-check distribution:**
```javascript
db.customers.getShardDistribution()
```

You should now see documents on **both** `shard1rs` and `shard2rs`.

### Step 7: Balancer Management

The balancer automatically migrates chunks across shards to keep them even.

```javascript
// Current balancer mode
sh.getBalancerState()
```

```javascript
// Is the balancer actively running a round right now?
sh.isBalancerRunning()
```

```javascript
// Stop the balancer (e.g., during maintenance windows)
sh.stopBalancer()
sh.getBalancerState()
```

```javascript
// Restart the balancer
sh.startBalancer()
sh.getBalancerState()
```

## Part C: Query Routing and Verification (10 minutes)

### Step 8: Query Routing Observation

Mongos routes queries based on the shard key. Inspect explain plans to see which shards are touched.

**Targeted query (uses the `customers` shard key):**
```javascript
db.customers.find({ "address.state": "CA" }).explain("executionStats")
```

Look at `winningPlan.shards` — only the shards holding CA data should appear.

**Scatter-gather query (no shard key in filter):**
```javascript
db.customers.find({ accountStatus: "Active" }).explain("executionStats")
```

This will fan out to **all** shards. Compare the two plans — that contrast (targeted vs. scatter-gather) is the core lesson on shard-key-aware query design. For a hashed-key direct lookup example see **Stretch Goal 4**.

### Step 9: Final Verification

Run the following to confirm the end-state:

```javascript
sh.status()
```

```javascript
// Count documents per sharded collection
print("customers: " + db.customers.countDocuments())
print("policies:  " + db.policies.countDocuments())
print("claims:    " + db.claims.countDocuments())
```

```javascript
// Storage and per-shard breakdown
db.customers.stats()
```

## Lab 12 Deliverables
- **Sharded cluster verified**: connected to mongos at `localhost:27120`, observed two shards (`shard1rs`, `shard2rs`) and a config server.
- **Sample data migrated**: copied `customers`, `policies`, `claims` from the replica set into the sharded cluster.
- **Two sharding strategies applied to real collections** (a third is available in Stretch Goal 1):
  - Compound range sharding on `customers` (`address.state, customerId`)
  - Hashed sharding on `policies` (`_id`)
- **Chunk operations performed**: split `customers` at `state=NY`, moved a chunk to `shard2rs`, observed cross-shard distribution.
- **Balancer management**: stopped and restarted the balancer, inspected balancer state.
- **Query routing**: used `explain()` to see targeted vs. scatter-gather routing on the live cluster.

## Stretch Goals (Optional)

If you finish Steps 1–9 with time to spare, these extensions deepen the sharding exercise. Each goal is independent — pick whichever interests you. They run against the same mongos connection (`mongodb://localhost:27120`) you used in Part B.

### Stretch Goal 1: Range Sharding by Compound Key (Claims)

Apply a third sharding strategy to the `claims` collection using a compound range key on `(policyType, incidentDate)`. This keeps claims for a single policy type clustered together and supports time-range queries.

**Analyze claim type distribution first** (run on the **replica set** at port 27017):
```javascript
var claimsByType = db.claims.aggregate([
  { $group: { _id: "$claimType", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray()

claimsByType
```

**Shard `claims` with a compound range key (run on mongos):**
```javascript
db.claims.createIndex({ policyType: 1, incidentDate: 1 })
sh.shardCollection("insurance_company.claims", { policyType: 1, incidentDate: 1 })
```

**Inspect the new distribution:**
```javascript
db.claims.getShardDistribution()
```

### Stretch Goal 2: Zone Sharding (Tag-Aware Sharding)

Zone sharding lets you constrain ranges of a shard key to specific shards. This is useful for geographic data residency, tiered storage, or compliance.

**Tag the shards with regional zone names:**
```javascript
sh.addShardToZone("shard1rs", "EASTERN-REGION")
sh.addShardToZone("shard2rs", "WESTERN-REGION")
```

**Pin NY customers to the Eastern shard:**
```javascript
sh.updateZoneKeyRange(
  "insurance_company.customers",
  { "address.state": "NY", customerId: MinKey },
  { "address.state": "NY", customerId: MaxKey },
  "EASTERN-REGION"
)
```

**Pin CA customers to the Western shard:**
```javascript
sh.updateZoneKeyRange(
  "insurance_company.customers",
  { "address.state": "CA", customerId: MinKey },
  { "address.state": "CA", customerId: MaxKey },
  "WESTERN-REGION"
)
```

**Inspect tags and zone ranges:**
```javascript
// Tags assigned to each shard
db.getSiblingDB("config").shards.find({}, { _id: 1, tags: 1 }).toArray()
```

```javascript
// Zone-key ranges for sharded collections
db.getSiblingDB("config").tags.find().toArray()
```

The balancer will move data into compliance with these zones over time. You can also manually trigger:
```javascript
sh.status()
```

**Cleanup zones (optional, leaves a clean state for replays):**
```javascript
sh.removeRangeFromZone(
  "insurance_company.customers",
  { "address.state": "NY", customerId: MinKey },
  { "address.state": "NY", customerId: MaxKey }
)
sh.removeRangeFromZone(
  "insurance_company.customers",
  { "address.state": "CA", customerId: MinKey },
  { "address.state": "CA", customerId: MaxKey }
)
sh.removeShardFromZone("shard1rs", "EASTERN-REGION")
sh.removeShardFromZone("shard2rs", "WESTERN-REGION")
```

### Stretch Goal 3: Advanced Chunk and Metadata Inspection

Look directly at the config database to see how MongoDB tracks shard metadata under the hood.

**List config-server hosts:**
```javascript
// List config-server hosts (getCmdLineOpts must run against admin)
db.getSiblingDB("admin").runCommand({ getCmdLineOpts: 1 })
```

**Per-collection shard metadata from the config DB:**
```javascript
// View per-collection shard metadata directly from the config DB
db.getSiblingDB("config").collections.find(
  { _id: /^insurance_company\./ },
  { _id: 1, key: 1, unique: 1 }
).toArray()
```

**Detailed sharding status:**
```javascript
// Detailed per-collection sharding status
db.printShardingStatus()
```

**Inspect chunks via the config database:**
```javascript
// Inspect chunks via the config database
db.getSiblingDB("config").chunks.aggregate([
  { $lookup: {
      from: "collections",
      localField: "uuid",
      foreignField: "uuid",
      as: "coll"
  }},
  { $project: {
      ns: { $arrayElemAt: ["$coll._id", 0] },
      shard: 1,
      min: 1,
      max: 1
  }}
]).toArray()
```

### Stretch Goal 4: Balancer Internals and Hashed-Key Routing

**Detailed balancer status for a specific collection:**
```javascript
// Detailed balancer status (chunk migrations, settings, etc.)
sh.balancerCollectionStatus("insurance_company.customers")
```

**Hashed-key direct lookup explain plan:**
```javascript
db.policies.find({ _id: db.policies.findOne()._id }).explain("executionStats")
```

A hashed shard key gives you direct, deterministic routing for `_id` lookups but cannot serve range queries on `_id`.

**Per-shard storage breakdown for a hashed-sharded collection:**
```javascript
db.policies.stats()
```

## Tear Down (Optional)

When you are done with the sharded cluster:
```bash
./scripts/teardown_sharding.sh   # remove sharded cluster only (keeps replica set)
./scripts/teardown.sh            # remove EVERYTHING (replica set + sharded cluster)
```
