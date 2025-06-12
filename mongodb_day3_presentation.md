# MongoDB Mastering Course - Day 3: Advanced Features & Production

**Topics:** Transactions • Replication • Sharding • Change Streams • Production Deployment  
**Docker-based Environment**

---

## Day 3 Learning Objectives

- 🔄 Master ACID transactions in MongoDB
- 🔧 Implement replica sets for high availability
- ⚡ Design sharding strategies for horizontal scaling
- 📡 Build real-time applications with change streams
- 🚀 Deploy production-ready MongoDB clusters
- 🛡️ Implement monitoring and security best practices

---

## Session Agenda

### Morning Session
- **Transactions & ACID**
- **Replica Sets & HA**

### Afternoon Session
- **Sharding & Scaling**
- **Change Streams**
- **Production Deployment**

---

# Part 1: Transactions & ACID

## What are MongoDB Transactions?

**Definition:** Multi-document operations that execute atomically

### ACID Properties
- **Atomicity:** All-or-nothing execution
- **Consistency:** Data remains valid
- **Isolation:** Concurrent operations don't interfere
- **Durability:** Changes persist after commit

## When to Use Transactions

### ✅ Use When:
- Multi-document updates needed
- Financial operations
- Complex business logic
- Data integrity critical
- Rollback capability required

### ❌ Avoid When:
- Single document operations
- High-throughput scenarios
- Simple read operations
- Performance is critical
- Eventually consistent is OK

## Basic Transaction Pattern

```javascript
// Start a session
const session = client.startSession();

try {
  // Start transaction
  session.startTransaction();
  
  // Perform operations within transaction
  await db.accounts.updateOne(
    { _id: "account1" },
    { $inc: { balance: -100 } },
    { session }
  );
  
  await db.accounts.updateOne(
    { _id: "account2" },
    { $inc: { balance: 100 } },
    { session }
  );
  
  // Commit transaction
  await session.commitTransaction();
  
} catch (error) {
  // Rollback on error
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
}
```

## E-commerce Order Example

```javascript
async function processOrder(orderId, items) {
  const session = client.startSession();
  
  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });
    
    // 1. Check inventory
    for (const item of items) {
      const product = await db.products.findOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { session }
      );
      if (!product) throw new Error(`Insufficient stock`);
    }
    
    // 2. Update inventory
    for (const item of items) {
      await db.products.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }
    
    // 3. Create order
    await db.orders.insertOne({
      _id: orderId, items: items, status: "confirmed"
    }, { session });
    
    await session.commitTransaction();
    return { success: true, orderId };
    
  } catch (error) {
    await session.abortTransaction();
    return { success: false, error: error.message };
  } finally {
    await session.endSession();
  }
}
```

## Transaction Performance

### Performance Impact
- **Latency:** +10-30ms overhead per transaction
- **Throughput:** ~10-50% reduction depending on workload
- **Lock contention:** Can affect concurrent operations

### Optimization Tips
- Keep transactions short-lived (<60 seconds)
- Use appropriate read/write concerns
- Minimize cross-shard transactions
- Use retryable writes for resilience

## Docker Setup for Transactions

```yaml
# docker-compose.yml for transactions
version: '3.8'
services:
  mongo1:
    image: mongo:7.0
    container_name: mongo1
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports: ["27017:27017"]
    
  mongo2:
    image: mongo:7.0
    container_name: mongo2
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports: ["27018:27017"]
    
  mongo3:
    image: mongo:7.0
    container_name: mongo3
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports: ["27019:27017"]
```

**Note:** Transactions require replica sets or sharded clusters

---

# Part 2: Replica Sets & High Availability

## Replica Set Architecture

```
PRIMARY (Read/Write) ←→ SECONDARY (Read Only*) ←→ SECONDARY (Read Only*)
```
*When read preference is configured

- Automatic failover when primary becomes unavailable
- Data redundancy across multiple servers
- Zero downtime for planned maintenance

## Replica Set Members

### Primary Node
- Receives all write operations
- Records changes in oplog
- Only one per replica set
- Elected by majority vote

### Secondary Nodes
- Replicate primary's oplog
- Can serve read operations
- Participate in elections
- Can become primary

### Special Members
- **Arbiter:** Voting only, no data
- **Hidden:** Data replication, no client reads
- **Delayed:** Historical data snapshots

## Setting Up Replica Set

```javascript
// Connect to primary node
mongosh --host localhost:27017

// Initialize replica set
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
})

// Check replica set status
rs.status()

// Add additional members
rs.add("mongo4:27017")

// Remove members
rs.remove("mongo4:27017")
```

## Advanced Configuration

```javascript
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { 
      _id: 0, host: "mongo1:27017", 
      priority: 2, votes: 1    // Preferred primary
    },
    { 
      _id: 1, host: "mongo2:27017", 
      priority: 1, votes: 1    // Regular secondary
    },
    { 
      _id: 2, host: "mongo3:27017", 
      priority: 0, hidden: true, // Hidden member
      slaveDelay: 3600          // 1 hour delay
    },
    {
      _id: 3, host: "arbiter:27017",
      arbiterOnly: true         // Arbiter only
    }
  ],
  settings: {
    electionTimeoutMillis: 10000,
    heartbeatIntervalMillis: 2000
  }
})
```

## Read Preferences

### Read Preference Modes
- **primary** - Default, read from primary only
- **primaryPreferred** - Primary if available, secondary otherwise
- **secondary** - Read from secondary only
- **secondaryPreferred** - Secondary if available, primary otherwise
- **nearest** - Lowest network latency

### Using Read Preferences
```javascript
// Read from secondary
db.products.find().readPref("secondary")

// Read with tag preferences
db.products.find().readPref("secondary", [
  { "datacenter": "west" },
  { "datacenter": "east" }
])

// Connection string with read preference
mongodb://host1,host2,host3/mydb?readPreference=secondaryPreferred
```

## Write & Read Concerns

### Write Concerns
```javascript
// Majority write concern
db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority" } }
)

// Custom write concern
db.users.updateOne(
  { _id: id },
  { $set: { status: "active" } },
  { 
    writeConcern: { 
      w: 2,           // 2 nodes
      j: true,        // Journal
      wtimeout: 5000  // Timeout
    } 
  }
)
```

### Read Concerns
```javascript
// Majority read concern
db.orders.find({ status: "pending" })
  .readConcern("majority")

// Snapshot read concern
session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" }
})

// Linearizable read concern
db.inventory.findOne({ _id: productId })
  .readConcern("linearizable")
```

## Monitoring Replica Sets

```javascript
// Replica set status
rs.status()

// Check replication lag
db.runCommand({ replSetGetStatus: 1 }).members.forEach(member => {
  if (member.state === 2) { // Secondary
    console.log(`${member.name}: ${member.optimeDate}`)
  }
})

// Oplog information
db.oplog.rs.find().sort({ ts: -1 }).limit(5)

// Step down primary (for maintenance)
rs.stepDown(60) // Step down for 60 seconds

// Force reconfiguration
rs.reconfig(config, { force: true })
```

---

# Part 3: Sharding & Horizontal Scaling

## Sharded Cluster Architecture

```
                    mongos (Query Router)
                           |
        ┌─────────────────┼─────────────────┐
    Shard 1          Shard 2          Shard 3
  Replica Set    Replica Set    Replica Set
                           |
                Config Servers (Metadata)
```

## When to Shard?

### Consider Sharding When:
- 🗄️ Data size exceeds single server capacity (>2TB working set)
- 🚀 Read/write throughput exceeds single server capability
- 💾 RAM requirements exceed what's economically feasible
- 🌍 Geographic distribution needed

### Alternatives to Consider First:
- Vertical scaling (more RAM, faster disks)
- Read replicas for read scaling
- Data archiving/purging
- Application-level partitioning

## Shard Key Selection

**Critical Decision:** Cannot be changed after sharding!

### Good Shard Key Characteristics:
- **High Cardinality:** Many possible values
- **Good Distribution:** Values spread evenly
- **Query Isolation:** Queries hit few shards
- **Write Scaling:** No hot spots

## Shard Key Examples

### ❌ Poor Shard Keys
```javascript
// Monotonically increasing
{ _id: ObjectId() }
{ timestamp: Date }
{ incrementalId: Number }

// Low cardinality
{ status: "active|inactive" }
{ category: "A|B|C" }

// Hotspots
{ userId: currentUser }
{ region: mostActiveRegion }
```

### ✅ Good Shard Keys
```javascript
// Hashed keys
{ _id: "hashed" }

// Compound keys
{ userId: 1, timestamp: 1 }
{ customerId: 1, orderId: 1 }

// Geographic
{ location: 1, timestamp: 1 }

// Application-specific
{ tenantId: 1, documentId: 1 }
```

## Sharded Cluster Setup

```javascript
// 1. Start config servers (replica set)
mongod --configsvr --replSet configRS --port 27019 --dbpath /data/config

// 2. Start shard servers (replica sets)
mongod --shardsvr --replSet shard1RS --port 27018 --dbpath /data/shard1

// 3. Start mongos (query router)
mongos --configdb configRS/config1:27019,config2:27019 --port 27017

// 4. Connect to mongos and add shards
mongosh --host localhost:27017
sh.addShard("shard1RS/shard1-1:27018,shard1-2:27018")
sh.addShard("shard2RS/shard2-1:27018,shard2-2:27018")

// 5. Enable sharding on database
sh.enableSharding("ecommerce")

// 6. Shard collections
sh.shardCollection("ecommerce.orders", { customerId: 1, orderDate: 1 })
sh.shardCollection("ecommerce.products", { _id: "hashed" })
```

## Docker Sharding Setup

```yaml
version: '3.8'
services:
  # Config Servers
  config1:
    image: mongo:7.0
    command: mongod --configsvr --replSet configRS --port 27017 --bind_ip_all
    
  # Shard 1
  shard1-1:
    image: mongo:7.0
    command: mongod --shardsvr --replSet shard1RS --port 27017 --bind_ip_all
    
  shard1-2:
    image: mongo:7.0
    command: mongod --shardsvr --replSet shard1RS --port 27017 --bind_ip_all
    
  # Shard 2
  shard2-1:
    image: mongo:7.0
    command: mongod --shardsvr --replSet shard2RS --port 27017 --bind_ip_all
    
  # Query Router
  mongos:
    image: mongo:7.0
    command: mongos --configdb configRS/config1:27017 --bind_ip_all --port 27017
    ports: ["27017:27017"]
    depends_on: [config1, shard1-1, shard2-1]
```

## Managing Sharded Clusters

```javascript
// Check sharding status
sh.status()

// View chunk distribution
db.chunks.find({ ns: "ecommerce.orders" })

// Manual chunk operations
sh.splitAt("ecommerce.orders", { customerId: "customer1000" })
sh.moveChunk("ecommerce.orders", 
  { customerId: "customer1000" }, 
  "shard2RS")

// Balancer management
sh.startBalancer()
sh.stopBalancer()
sh.getBalancerState()

// Zone sharding (geographic)
sh.addShardTag("shard1RS", "US-EAST")
sh.addShardTag("shard2RS", "US-WEST")
sh.addTagRange("ecommerce.users", 
  { region: "east" }, { region: "east\uffff" }, "US-EAST")
```

## Sharding Best Practices

### Performance
- Choose shard key carefully
- Pre-split chunks for even distribution
- Monitor balancer activity
- Use targeted queries when possible

### Operations
- Always use odd number of config servers
- Monitor chunk distribution
- Plan for shard maintenance
- Consider zone sharding for compliance

### ⚠️ Common Pitfalls
- Choosing wrong shard key (irreversible!)
- Creating hotspots with monotonic keys
- Not considering query patterns
- Underestimating operational complexity

---

# Part 4: Change Streams

## What are Change Streams?

**Definition:** Real-time streams of data changes in MongoDB

### Change Stream Flow
```
Database Operations → Oplog Entries → Change Stream → Application Handlers
```

- Built on MongoDB's oplog
- Resumable and fault-tolerant
- Available for replica sets and sharded clusters

## Change Stream Use Cases

### Real-time Applications
- Live dashboards
- Chat applications
- Collaborative editing
- Activity feeds
- Live notifications

### Data Integration
- ETL pipelines
- Cache invalidation
- Search index updates
- Data synchronization
- Audit logging

### Business Logic
- Order processing workflows
- Inventory management
- User behavior analytics
- Fraud detection

## Basic Change Stream Usage

```javascript
// Watch all changes on a collection
const changeStream = db.orders.watch();

changeStream.on('change', (change) => {
  console.log('Change detected:', change);
  
  switch(change.operationType) {
    case 'insert':
      handleNewOrder(change.fullDocument);
      break;
    case 'update':
      handleOrderUpdate(change.documentKey._id, change.updateDescription);
      break;
    case 'delete':
      handleOrderDeletion(change.documentKey._id);
      break;
  }
});

// Watch specific operations
const insertStream = db.orders.watch([
  { $match: { operationType: 'insert' } }
]);

// Watch with filters
const highValueStream = db.orders.watch([
  { $match: { 
    operationType: 'insert',
    'fullDocument.total': { $gte: 1000 }
  }}
]);
```

## Advanced Change Stream Features

```javascript
// Resume from specific point
const resumeToken = getLastProcessedToken();
const changeStream = db.orders.watch([], {
  resumeAfter: resumeToken,
  fullDocument: 'updateLookup'
});

changeStream.on('change', (change) => {
  // Process change
  processChange(change);
  
  // Store resume token for fault tolerance
  saveResumeToken(change._id);
});

// Start after specific timestamp
const changeStream = db.orders.watch([], {
  startAtOperationTime: Timestamp(1640995200, 1)
});

// Pre and post images (MongoDB 6.0+)
const changeStream = db.orders.watch([], {
  fullDocumentBeforeChange: 'whenAvailable',
  fullDocument: 'updateLookup'
});
```

## Order Processing Example

```javascript
// Order processing pipeline
class OrderProcessor {
  constructor() {
    this.setupChangeStreams();
  }
  
  setupChangeStreams() {
    // Watch for new orders
    const newOrderStream = db.orders.watch([
      { $match: { operationType: 'insert' } }
    ]);
    
    newOrderStream.on('change', async (change) => {
      const order = change.fullDocument;
      
      try {
        await this.validateInventory(order);
        await this.processPayment(order);
        
        await db.orders.updateOne(
          { _id: order._id },
          { $set: { status: 'processing', processedAt: new Date() } }
        );
        
        await this.triggerFulfillment(order);
        
      } catch (error) {
        await db.orders.updateOne(
          { _id: order._id },
          { $set: { status: 'failed', error: error.message } }
        );
      }
    });
    
    // Watch for status updates
    const statusStream = db.orders.watch([
      { $match: { 
        operationType: 'update',
        'updateDescription.updatedFields.status': { $exists: true }
      }}
    ]);
    
    statusStream.on('change', (change) => {
      const orderId = change.documentKey._id;
      const newStatus = change.updateDescription.updatedFields.status;
      
      this.sendStatusNotification(orderId, newStatus);
      this.updateOrderAnalytics(orderId, newStatus);
    });
  }
}
```

## Change Stream Best Practices

### Performance Considerations
- **Oplog Size:** Ensure adequate oplog retention
- **Network:** Changes streamed over network
- **Processing:** Handle changes efficiently
- **Filtering:** Use server-side filtering

### Best Practices
- Store resume tokens for fault tolerance
- Use appropriate batch sizes
- Filter changes server-side when possible
- Handle errors gracefully with retries
- Monitor oplog window and size

---

# Part 5: Production Deployment

## Production Architecture

### Recommended Production Setup
```
                    Load Balancer
                         |
        ┌───────────────┼───────────────┐
      mongos         mongos         mongos
        |               |               |
    ┌───┼───────────────┼───────────────┼───┐
Shard 1 (P-S-S)   Shard 2 (P-S-S)   Shard 3 (P-S-S)
                         |
              Config Servers (3-node Replica Set)
```

## Hardware Considerations

### CPU & Memory
- **RAM:** More is better, 64GB+ recommended
- **CPU:** Modern multi-core (8+ cores)
- **Working Set:** Should fit in RAM
- **NUMA:** Disable for consistent performance

### Storage
- **SSDs:** Preferred for performance
- **RAID:** RAID 10 for performance + redundancy
- **Separate volumes:** Data, logs, journal
- **XFS filesystem:** Recommended on Linux

### Network
- Low latency between replica set members (<15ms)
- High bandwidth for initial sync and balancing
- Dedicated network for inter-cluster communication

## Security Configuration

```bash
# Enable authentication and TLS
mongod --auth \
       --tlsMode requireTLS \
       --tlsCertificateKeyFile /etc/ssl/mongodb.pem \
       --tlsCAFile /etc/ssl/ca.pem \
       --bind_ip_all \
       --port 27017

# Create admin user
mongosh --tls --tlsCertificateKeyFile client.pem
use admin
db.createUser({
  user: "admin",
  pwd: passwordPrompt(),
  roles: ["root"]
})

# Create application users
use myapp
db.createUser({
  user: "appUser",
  pwd: passwordPrompt(),
  roles: [
    { role: "readWrite", db: "myapp" },
    { role: "read", db: "analytics" }
  ]
})
```

## Monitoring & Alerting

### Key Metrics to Monitor

#### Performance
- Operations per second
- Query execution time
- Index hit ratio
- Connection count

#### Resources
- Memory usage
- Disk space and I/O
- CPU utilization
- Network throughput

### Monitoring Tools
- **MongoDB Compass:** GUI monitoring and management
- **MongoDB Atlas:** Cloud monitoring and alerting
- **Ops Manager:** On-premises monitoring solution
- **Third-party:** Datadog, New Relic, Prometheus

## Backup & Recovery

```bash
# mongodump - Logical backup
mongodump --host mongodb://user:pass@host:27017/mydb \
          --gzip \
          --out /backup/$(date +%Y%m%d)

# File system snapshots (preferred for large databases)
# 1. Lock database briefly
mongosh --eval "db.fsyncLock()"

# 2. Create filesystem snapshot
lvm snapshot /dev/vg0/mongodb-data

# 3. Unlock database
mongosh --eval "db.fsyncUnlock()"

# Point-in-time recovery with oplog
mongodump --oplog --host rs0/host1,host2,host3

# Restore from backup
mongorestore --host mongodb://host:27017 \
             --gzip \
             /backup/20241215
```

## Capacity Planning

### Growth Planning
- **Data Growth:** Track data size growth rate
- **Index Growth:** Monitor index size (typically 10-15% of data)
- **Query Patterns:** Analyze changing access patterns
- **User Growth:** Plan for increased concurrent connections

### Scaling Decisions
- **Vertical Scaling:** Add RAM, faster storage first
- **Read Replicas:** Add secondaries for read scaling
- **Sharding:** When single machine limits reached
- **Archiving:** Move old data to cheaper storage

## Docker Production Setup

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb-prod
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_root_password
    secrets:
      - mongo_root_password
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./mongod.conf:/etc/mongod.conf:ro
      - /etc/ssl/mongodb:/etc/ssl/mongodb:ro
    command: mongod --config /etc/mongod.conf
    ports:
      - "27017:27017"
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '4'

volumes:
  mongodb_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/mongodb
      
secrets:
  mongo_root_password:
    file: ./secrets/mongo_root_password.txt
```

## Production Checklist

### Before Go-Live
- ✓ Authentication enabled
- ✓ TLS/SSL configured
- ✓ Firewall rules in place
- ✓ Backup strategy tested
- ✓ Monitoring set up
- ✓ Alerting configured
- ✓ Capacity planning done

### Ongoing Operations
- ✓ Regular backup verification
- ✓ Security updates applied
- ✓ Performance monitoring
- ✓ Capacity tracking
- ✓ Index optimization
- ✓ Disaster recovery testing
- ✓ Documentation updated

---

# Day 3 Labs Overview

## Lab Structure

### Lab 1: Transactions (45 minutes)
- **Replica Set Setup**: Complete Docker Compose configuration with authentication
- **ACID Operations**: E-commerce order processing with inventory management
- **Error Handling**: Transaction rollbacks and failure scenarios
- **Real-world Examples**: Money transfer system demonstrating transaction integrity

### Lab 2: Replication & High Availability (45 minutes)
- **Advanced Configuration**: Arbiters, hidden members, and priority settings
- **Failover Testing**: Automatic primary election and recovery
- **Read Preferences**: Geographic distribution and load balancing
- **Monitoring**: Comprehensive replica set health monitoring scripts

### Lab 3: Sharding & Horizontal Scaling (45 minutes)
- **Complete Sharded Cluster**: Config servers, multiple shards, and query routers
- **Sharding Strategies**: Hashed, range-based, and geographic sharding
- **Zone Sharding**: Geographic data distribution
- **Chunk Management**: Manual chunk operations and balancer control

### Lab 4: Change Streams (30 minutes)
- **Real-time Processing**: Order processing with event-driven architecture
- **Resumable Streams**: Fault-tolerant change stream implementation
- **Notification Systems**: Live notifications and activity logging
- **Event Patterns**: Complete order workflow automation

### Lab 5: C# API Introduction (30 minutes)
- **Project Setup**: .NET 8 console application with MongoDB driver
- **Strongly-typed Models**: Product and Customer entities
- **CRUD Operations**: Complete service layer implementation
- **Error Handling**: Resilient operations with retry logic

## Lab Features

### Production-Ready Code
- **Docker-based**: All labs use Docker containers for consistency
- **Authentication**: Security configuration included
- **Error Handling**: Comprehensive exception management
- **Real-world Scenarios**: Practical business use cases

### Hands-on Learning
- **Step-by-step Instructions**: Detailed setup and implementation guides
- **Working Examples**: Complete, runnable code samples
- **Testing Scenarios**: Failure simulation and recovery procedures
- **Performance Analysis**: Monitoring and optimization techniques

---

# Day 3 Summary

## What We've Accomplished

### 🔄 Transactions
- ACID properties implementation
- Multi-document transaction patterns
- Error handling and retry logic

### 🔧 High Availability
- Replica set configuration and management
- Automatic failover mechanisms
- Read preferences and write concerns

### ⚡ Horizontal Scaling
- Sharding architecture and setup
- Shard key selection strategies
- Cluster management and monitoring

### 📡 Real-time Applications
- Change streams implementation
- Event-driven architecture patterns
- Fault-tolerant stream processing

### 🚀 Production Readiness
- Security configuration
- Monitoring and alerting
- Backup and recovery strategies

## Production Best Practices

### MongoDB Production Stack
```
Application Layer
        ↓
Connection Pooling & Load Balancing
        ↓
MongoDB Cluster (Replica Sets + Sharding)
        ↓
Monitoring & Alerting
        ↓
Backup & Recovery
```

## Next Steps & Recommendations

### Immediate Actions
- Practice with the provided Docker environments
- Implement transactions in your applications
- Set up replica sets for your projects
- Experiment with change streams

### Long-term Learning
- MongoDB Certification Program
- Advanced administration courses
- Cloud deployment with Atlas
- Performance tuning specialization

## Resources & Support

### Documentation
- [Official MongoDB Docs](https://docs.mongodb.com)
- [MongoDB University](https://university.mongodb.com)
- [MongoDB GitHub](https://github.com/mongodb)

### Community
- [MongoDB Community](https://community.mongodb.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/mongodb)
- [MongoDB Events](https://www.mongodb.com/events)

### Certification Path
**MongoDB Certified Developer** → **MongoDB Certified DBA**

---

## Thank You!

🎉 **Congratulations!**  
You've mastered advanced MongoDB features

### Questions & Discussion
Let's discuss your specific use cases and challenges