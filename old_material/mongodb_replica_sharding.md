# MongoDB: Replica Sets and Sharding
*High Availability and Horizontal Scaling*

## Table of Contents

1. [Part I: Replica Sets](#part-i-replica-sets)
   - [Introduction and Architecture](#what-is-a-replica-set)
   - [Setup and Configuration](#setting-up-a-replica-set)
   - [Read Preferences and Write Concerns](#read-preferences)
2. [Part II: Sharding](#part-ii-sharding)
   - [Sharding Architecture](#what-is-sharding)
   - [Shard Keys and Distribution](#shard-keys)
   - [Configuration and Management](#setting-up-sharding)
3. [Part III: Best Practices](#part-iii-best-practices)

---

## Part I: Replica Sets

### What is a Replica Set?

> **Definition:** A replica set is a group of MongoDB instances that maintain the same data set, providing redundancy and high availability.

A replica set consists of:
- **Primary Node:** Receives all write operations
- **Secondary Nodes:** Replicate data from primary
- **Arbiter (optional):** Participates in elections but holds no data

### Replica Set Architecture

```
┌─────────────────────────────────────────────────┐
│                Client Application                │
└─────────────┬───────────────────────────────────┘
              │ Writes to Primary
              │ Reads from Primary/Secondary
              ▼
┌─────────────────────────────────────────────────┐
│              MongoDB Driver                     │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│  │ PRIMARY │◄──►│SECONDARY│◄──►│SECONDARY│     │
│  │ Node A  │    │ Node B  │    │ Node C  │     │
│  │  :27017 │    │  :27018 │    │  :27019 │     │
│  └─────────┘    └─────────┘    └─────────┘     │
│       ▲              ▲              ▲          │
│       └──────────────┼──────────────┘          │
│                   Heartbeats                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Benefits of Replica Sets

#### ✅ Advantages
- **High Availability:** Automatic failover
- **Data Redundancy:** Multiple copies
- **Read Scaling:** Distribute read load
- **Backup Support:** No downtime backups
- **Disaster Recovery:** Geographic distribution

#### Use Cases
- Production applications requiring 99.9%+ uptime
- Applications with read-heavy workloads
- Multi-region deployments
- Applications requiring zero-downtime maintenance

### Setting Up a Replica Set

#### Step 1: Start MongoDB Instances

```bash
# Start three MongoDB instances
mongod --replSet myReplicaSet --port 27017 --dbpath /data/rs1
mongod --replSet myReplicaSet --port 27018 --dbpath /data/rs2
mongod --replSet myReplicaSet --port 27019 --dbpath /data/rs3
```

#### Step 2: Initiate Replica Set

```javascript
// Connect to one instance and initiate
mongosh --port 27017

rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})
```

### Replica Set Configuration

```javascript
// View current configuration
rs.conf()

// Add a new member
rs.add("localhost:27020")

// Remove a member
rs.remove("localhost:27020")

// Set member priority (0-1000, higher = more likely to be primary)
cfg = rs.conf()
cfg.members[1].priority = 0.5
rs.reconfig(cfg)

// Set member as hidden (won't receive client reads)
cfg.members[2].hidden = true
cfg.members[2].priority = 0
rs.reconfig(cfg)
```

### Member Types and Roles

#### Standard Members
- **Primary:** Handles writes, can handle reads
- **Secondary:** Replicates data, can handle reads
- **Priority 0:** Cannot become primary

#### Special Members
- **Arbiter:** Votes only, no data
- **Hidden:** Not visible to clients
- **Delayed:** Maintains delayed copy

```javascript
// Add an arbiter
rs.addArb("localhost:27021")

// Configure delayed member (1 hour delay)
cfg = rs.conf()
cfg.members[2].slaveDelay = 3600
cfg.members[2].priority = 0
cfg.members[2].hidden = true
rs.reconfig(cfg)
```

### Read Preferences

> **Read Preference:** Determines which replica set members receive read operations.

- **primary:** All reads from primary (default)
- **primaryPreferred:** Primary if available, secondary otherwise
- **secondary:** Only from secondary members
- **secondaryPreferred:** Secondary if available, primary otherwise
- **nearest:** Lowest network latency

```javascript
// Set read preference
db.collection.find().readPref("secondary")

// With tag sets
db.collection.find().readPref("secondary", [{"region": "us-east"}])
```

### Write Concerns

> **Write Concern:** Describes the acknowledgment of write operations to MongoDB.

#### Write Concern Levels
- `w: 1` - Acknowledged by primary
- `w: 2` - Acknowledged by primary + 1 secondary
- `w: "majority"` - Majority of members
- `j: true` - Written to journal

```javascript
// Examples
db.users.insertOne(
  { name: "Alice" },
  { writeConcern: { w: "majority", j: true } }
)

// With timeout
db.users.insertOne(
  { name: "Bob" },
  { 
    writeConcern: { 
      w: "majority", 
      wtimeout: 5000 
    } 
  }
)
```

### Monitoring Replica Sets

```javascript
// Check replica set status
rs.status()

// Check replication lag
rs.printSlaveReplicationInfo()

// Check oplog size and utilization
db.oplog.rs.stats()

// Monitor replication
while(true) {
  print("=== Replica Set Status ===")
  printjson(rs.status().members.map(m => ({
    name: m.name,
    state: m.stateStr,
    health: m.health,
    lag: m.optimeDate ? 
      (new Date() - m.optimeDate)/1000 + "s" : "unknown"
  })))
  sleep(5000)
}
```

---

## Part II: Sharding

### What is Sharding?

> **Definition:** Sharding is a method for distributing data across multiple machines to support deployments with very large data sets and high throughput operations.

Key concepts:
- **Horizontal Scaling:** Add more machines to handle growth
- **Data Distribution:** Split collections across multiple shards
- **Transparent to Applications:** Appears as single database

### Sharded Cluster Architecture

```
┌─────────────────────────────────────────────────┐
│                Client Application                │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│                   mongos                        │
│              (Query Router)                     │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│    │ mongos1 │  │ mongos2 │  │ mongos3 │       │
│    └─────────┘  └─────────┘  └─────────┘       │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│              Config Servers                     │
│               (Metadata)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Config RS│ │Config RS│ │Config RS│           │
│  │ Svr 1   │ │ Svr 2   │ │ Svr 3   │           │
│  └─────────┘ └─────────┘ └─────────┘           │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│                  Shards                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │   Shard A   │ │   Shard B   │ │   Shard C   │ │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │
│ │ │ Primary │ │ │ │ Primary │ │ │ │ Primary │ │ │
│ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │
│ │ │Secondary│ │ │ │Secondary│ │ │ │Secondary│ │ │
│ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────┘
```

### Sharding Components

#### mongos (Query Router)
- Routes client requests
- Merges results from shards
- Handles query optimization

#### Config Servers
- Store cluster metadata
- Track chunk locations
- Maintain shard topology

#### Shards
- Store subset of data
- Can be replica sets
- Handle shard-specific operations

#### Chunks
- Contiguous ranges of data
- Default size: 128MB
- Unit of migration

### Shard Keys

> **Shard Key:** The field(s) used to distribute documents across shards.

#### Good Shard Key Characteristics
- **High Cardinality:** Many distinct values
- **Low Frequency:** No single value appears too often
- **Non-Monotonic:** Avoids hotspots
- **Query-Friendly:** Aligns with query patterns

#### Examples

**✅ Good Examples:**
- `{ userId: 1 }`
- `{ category: 1, productId: 1 }`
- `{ region: 1, timestamp: 1 }`

**❌ Poor Examples:**
- `{ _id: 1 }` (ObjectId)
- `{ timestamp: 1 }`
- `{ status: 1 }` (low cardinality)

### Setting Up Sharding

#### Step 1: Start Config Servers

```bash
# Start config server replica set
mongod --configsvr --replSet configReplSet --port 27019 --dbpath /data/configdb1
mongod --configsvr --replSet configReplSet --port 27020 --dbpath /data/configdb2
mongod --configsvr --replSet configReplSet --port 27021 --dbpath /data/configdb3

# Initialize config replica set
mongosh --port 27019
rs.initiate({
  _id: "configReplSet",
  configsvr: true,
  members: [
    { _id: 0, host: "localhost:27019" },
    { _id: 1, host: "localhost:27020" },
    { _id: 2, host: "localhost:27021" }
  ]
})
```

#### Step 2: Start Shard Replica Sets

```bash
# Shard 1
mongod --shardsvr --replSet shard1 --port 27001 --dbpath /data/shard1a
mongod --shardsvr --replSet shard1 --port 27002 --dbpath /data/shard1b

# Shard 2  
mongod --shardsvr --replSet shard2 --port 27003 --dbpath /data/shard2a
mongod --shardsvr --replSet shard2 --port 27004 --dbpath /data/shard2b
```

#### Step 3: Start mongos

```bash
# Start query router
mongos --configdb configReplSet/localhost:27019,localhost:27020,localhost:27021 --port 27017
```

### Configuring Shards

```javascript
// Connect to mongos
mongosh --port 27017

// Add shards to cluster
sh.addShard("shard1/localhost:27001,localhost:27002")
sh.addShard("shard2/localhost:27003,localhost:27004")

// Check cluster status
sh.status()

// Enable sharding on database
sh.enableSharding("ecommerce")

// Shard a collection
sh.shardCollection("ecommerce.products", { "category": 1, "productId": 1 })

// Check sharding status
db.products.getShardDistribution()
```

### Chunk Management

#### Automatic Balancing
- MongoDB automatically moves chunks
- Maintains even distribution
- Runs in background

```javascript
// Check balancer status
sh.getBalancerState()

// Enable/disable balancer
sh.startBalancer()
sh.stopBalancer()
```

#### Manual Chunk Operations

```javascript
// Split chunk manually
sh.splitAt("ecommerce.products", 
  { "category": "electronics", "productId": 1000 })

// Move chunk
sh.moveChunk("ecommerce.products",
  { "category": "electronics" },
  "shard2")

// View chunks
db.chunks.find({"ns": "ecommerce.products"})
```

### Query Routing

#### Targeted Queries
Include shard key in query

```javascript
// Targeted to specific shard
db.products.find({
  "category": "electronics",
  "productId": 12345
})

// Range query on shard key
db.products.find({
  "category": "electronics",
  "productId": { $gte: 1000, $lt: 2000 }
})
```

#### Broadcast Queries
Query all shards

```javascript
// Broadcast to all shards
db.products.find({
  "name": /laptop/i
})

// Aggregation across shards
db.products.aggregate([
  { $match: { "price": { $gte: 100 } } },
  { $group: { _id: "$category", total: { $sum: "$price" } } }
])
```

### Monitoring Sharded Clusters

```javascript
// Comprehensive cluster status
sh.status()

// Database sharding info
db.stats()

// Collection sharding statistics
db.products.getShardDistribution()

// Find unsharded collections
db.runCommand("listCollections").cursor.firstBatch.filter(
  c => !c.options.hasOwnProperty("sharded")
)

// Monitor chunk distribution
use config
db.chunks.aggregate([
  { $group: { _id: "$shard", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Sharding Strategies

#### Range-based Sharding
- Default strategy
- Documents grouped by shard key ranges
- Good for range queries
- Risk of hotspots

#### Hashed Sharding
- Uses hash of shard key
- Even distribution
- No range query benefits
- Prevents hotspots

```javascript
// Enable hashed sharding
sh.shardCollection("mydb.users", 
  { "userId": "hashed" })
```

---

## Part III: Best Practices

### Replica Set Best Practices

#### Architecture
- Use odd number of voting members (3, 5, 7)
- Deploy across availability zones
- Use dedicated hardware for production
- Configure appropriate write concerns

#### Performance
- Size oplog appropriately
- Use read preferences for scaling
- Consider hidden members for analytics
- Implement proper indexing strategy

#### Monitoring
- Monitor replication lag
- Set up alerts for failover events
- Track oplog utilization

#### Security
- Enable authentication
- Use TLS for inter-node communication
- Implement proper access controls

### Sharding Best Practices

#### Shard Key Selection
- Choose based on query patterns
- Ensure high cardinality
- Avoid monotonically increasing values
- Consider compound shard keys

#### Cluster Sizing
- Start with fewer, larger shards
- Plan for growth
- Use replica sets for each shard

#### Operations
- Monitor chunk distribution
- Schedule maintenance windows for balancing
- Use targeted queries when possible
- Implement proper connection pooling

#### Performance
- Pre-split chunks for bulk loading
- Use appropriate chunk size
- Monitor query performance

### Common Pitfalls and Solutions

#### Replica Sets

| Issue | Solution |
|-------|----------|
| Split-brain scenarios | Use odd number of voting members |
| High replication lag | Optimize write patterns, increase oplog size |
| Read preference confusion | Document and test read preferences |

#### Sharding

| Issue | Solution |
|-------|----------|
| Hotspotting on monotonic shard keys | Use hashed sharding or compound keys |
| Uneven chunk distribution | Monitor and manually rebalance if needed |
| Orphaned documents | Run cleanupOrphaned command |

### Production Checklist

#### Before Going Live
- ✅ Test failover scenarios
- ✅ Validate backup/restore procedures
- ✅ Performance test with realistic data
- ✅ Configure monitoring and alerting
- ✅ Document operational procedures
- ✅ Set up log aggregation

#### Ongoing Maintenance
- ✅ Regular cluster health checks
- ✅ Monitor disk space and growth
- ✅ Review and optimize slow queries
- ✅ Update MongoDB versions regularly
- ✅ Capacity planning and scaling
- ✅ Security audits and updates

### Performance Tuning Tips

#### Replica Sets
```javascript
// Optimize oplog size (example: 50GB)
db.runCommand({
  "replSetResizeOplog": 1,
  "size": 51200  // Size in MB
})

// Monitor replication lag
rs.status().members.forEach(function(member) {
  if (member.state === 2) {  // Secondary
    print(member.name + " lag: " + 
      (rs.status().date - member.optimeDate)/1000 + " seconds")
  }
})
```

#### Sharding
```javascript
// Pre-split chunks for even distribution
for (var i = 0; i < 100; i++) {
  sh.splitAt("mydb.collection", { shardKey: i * 1000 })
}

// Monitor balancer efficiency
use config
db.actionlog.find({what: "balancer.round"}).sort({time: -1}).limit(5)
```

### Security Configuration

#### Replica Set Security
```javascript
// Enable authentication
// In mongod.conf:
security:
  authorization: enabled
  keyFile: /opt/mongodb/mongodb-keyfile

// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "securePassword",
  roles: ["root"]
})
```

#### Sharded Cluster Security
```javascript
// Enable authentication on all components
// Config servers, shards, and mongos need the same keyfile

// mongos configuration
security:
  keyFile: /opt/mongodb/mongodb-keyfile
  clusterAuthMode: keyFile
```

### Backup Strategies

#### Replica Set Backups
```bash
# Backup from secondary to avoid impacting primary
mongodump --host secondary.example.com:27017 --out /backup/mongodb/

# Point-in-time backup with oplog
mongodump --host rs0/primary.example.com:27017,secondary.example.com:27017 \
  --oplog --out /backup/mongodb/
```

#### Sharded Cluster Backups
```bash
# Backup entire sharded cluster
# Method 1: Use MongoDB Cloud Manager or Ops Manager

# Method 2: Coordinate backups across all shards
# Stop balancer first
mongo --host mongos.example.com:27017
sh.stopBalancer()

# Backup each shard individually
# Then restart balancer
sh.startBalancer()
```

---

## Summary

### Replica Sets
- Provide high availability and data redundancy
- Enable read scaling and zero-downtime maintenance
- Essential for production deployments
- Require proper configuration and monitoring

### Sharding
- Enables horizontal scaling for large datasets
- Distributes data across multiple machines
- Requires careful shard key selection
- More complex but handles massive scale

> **Remember:** Start with replica sets for high availability, add sharding when you need to scale beyond a single machine's capacity.

### Key Decision Matrix

| Requirement | Replica Set | Sharding | Both |
|-------------|-------------|----------|------|
| High Availability | ✅ | ❌ | ✅ |
| Read Scaling | ✅ | ✅ | ✅ |
| Write Scaling | ❌ | ✅ | ✅ |
| Large Datasets | ❌ | ✅ | ✅ |
| Operational Complexity | Low | High | High |
| Setup Time | Minutes | Hours/Days | Days |

### Next Steps

1. **Start Simple:** Begin with a 3-member replica set
2. **Monitor Growth:** Track data size and performance metrics
3. **Plan Ahead:** Design schema with potential sharding in mind
4. **Test Thoroughly:** Practice failover and recovery procedures
5. **Scale When Needed:** Add sharding when approaching hardware limits

This guide provides the foundation for implementing MongoDB's distributed features in production environments. Remember to always test configurations in staging environments before deploying to production.