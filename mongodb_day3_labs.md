# MongoDB Day 3 Labs: Advanced Features
*Complete hands-on labs covering Transactions, Replication, Sharding, Change Streams, and C# API*

---

## Overview

Welcome to MongoDB Day 3 Labs! These labs will take you through MongoDB's most advanced features using **MongoDB Compass** as the primary interface, combined with practical Docker-based setups.

### What You'll Learn
- **ACID Transactions** for data consistency
- **Replica Sets** for high availability  
- **Sharding** for horizontal scaling
- **Change Streams** for real-time applications
- **C# Integration** for application development

### Tools Required
- **Docker Desktop** (primary platform)
- **MongoDB Compass** (main interface)
- **.NET 8 SDK** (for C# lab)
- **Visual Studio Code** (recommended)

---

## Lab 1: MongoDB Transactions
**Duration:** 45 minutes  
**Objective:** Master ACID transactions in MongoDB

### Part A: Replica Set Setup (10 minutes)

#### Step 1: Start MongoDB Containers
```bash
# Create network for MongoDB containers
docker network create mongodb-net

# Start three MongoDB nodes for replica set
docker run -d --name mongo1 --network mongodb-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo2 --network mongodb-net -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo3 --network mongodb-net -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Verify containers are running
docker ps
```

#### Step 2: Initialize Replica Set
```bash
# Wait for containers to fully start
sleep 20

# Initialize replica set
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017' },
    { _id: 1, host: 'mongo2:27017' },
    { _id: 2, host: 'mongo3:27017' }
  ]
})
"

# Verify replica set status
docker exec -it mongo1 mongosh --eval "rs.status()"
```

#### Step 3: Connect with MongoDB Compass
1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
3. Click **"Connect"**
4. Verify you see the replica set topology

### Part B: Transaction Setup and Testing (25 minutes)

#### Step 4: Create Sample Data
**In MongoDB Compass:**
1. Navigate to **Databases** → **Create Database**
2. Database Name: `ecommerce`
3. Collection Name: `products`

**Using Compass MongoSH tab:**
```javascript
// Switch to ecommerce database
use ecommerce

// Create products with initial stock
db.products.insertMany([
  { 
    _id: "prod1", 
    name: "Laptop", 
    price: 999.99, 
    stock: 10,
    category: "Electronics"
  },
  { 
    _id: "prod2", 
    name: "Mouse", 
    price: 29.99, 
    stock: 50,
    category: "Electronics"
  },
  { 
    _id: "prod3", 
    name: "Keyboard", 
    price: 79.99, 
    stock: 25,
    category: "Electronics"
  },
  { 
    _id: "prod4", 
    name: "Monitor", 
    price: 299.99, 
    stock: 15,
    category: "Electronics"
  }
])

// Create customers with account balances
db.customers.insertMany([
  { 
    _id: "cust1", 
    name: "John Doe", 
    email: "john@example.com", 
    balance: 1200.00
  },
  { 
    _id: "cust2", 
    name: "Jane Smith", 
    email: "jane@example.com", 
    balance: 800.00
  },
  { 
    _id: "cust3", 
    name: "Bob Johnson", 
    email: "bob@example.com", 
    balance: 1500.00
  }
])

// Create orders collection with index
db.orders.createIndex({ customerId: 1, orderDate: 1 })
```

#### Step 5: Implement Order Processing Transaction

```javascript
// Complete order processing transaction
// Complete order processing transaction
function processOrder(customerId, items) {
  const session = db.getMongo().startSession();
  
  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });
    
    const orderId = new ObjectId();
    let totalAmount = 0;
    
    // Use session database reference
    const sessionDb = session.getDatabase("ecommerce");
    
    // Validate customer exists and has sufficient balance
    const customer = sessionDb.customers.findOne({ _id: customerId });
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Process each item
    for (let item of items) {
      // Check product availability
      const product = sessionDb.products.findOne({
        _id: item.productId,
        stock: { $gte: item.quantity }
      });
      
      if (!product) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
      
      totalAmount += product.price * item.quantity;
      
      // Update product stock
      sessionDb.products.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Check customer balance
    if (customer.balance < totalAmount) {
      throw new Error("Insufficient customer balance");
    }
    
    // Update customer balance
    sessionDb.customers.updateOne(
      { _id: customerId },
      { $inc: { balance: -totalAmount } }
    );
    
    // Create order
    sessionDb.orders.insertOne({
      _id: orderId,
      customerId: customerId,
      items: items,
      totalAmount: totalAmount,
      status: "completed",
      orderDate: new Date()
    });
    
    // Commit transaction
    session.commitTransaction();
    
    print("Order processed successfully");
    print("Order ID: " + orderId);
    print("Total Amount: $" + totalAmount.toFixed(2));
    
    return { success: true, orderId: orderId, totalAmount: totalAmount };
    
  } catch (error) {
    print("Transaction failed: " + error.message);
    session.abortTransaction();
    return { success: false, error: error.message };
    
  } finally {
    session.endSession();
  }
}
```

#### Step 6: Test Transactions

**Test Successful Transaction:**
```javascript
// Test successful order
var result1 = processOrder("cust1", [
  { productId: "prod1", quantity: 1 },
  { productId: "prod2", quantity: 2 }
]);
```

**Monitor in Compass:**
1. Keep `products`, `customers`, and `orders` collections open in separate tabs
2. Execute the transaction
3. Refresh collections to see changes:
   - Product stock decreased
   - Customer balance decreased
   - New order created

**Test Failed Transaction:**
```javascript
// Test order with insufficient stock
var result2 = processOrder("cust2", [
  { productId: "prod1", quantity: 15 }  // More than available
]);

// Test order with insufficient balance
var result3 = processOrder("cust2", [
  { productId: "prod4", quantity: 10 }  // Costs $2999.90 but customer has $800
]);
```

**Verify Rollback:**
- Check that no data changed when transactions failed
- This demonstrates ACID atomicity

### Part C: Money Transfer System (10 minutes)

#### Step 7: Implement Money Transfer

```javascript
// Bank transfer simulation
// Money Transfer System - Step 7 Corrected
// Money Transfer System - Step 7 Corrected
function transferMoney(fromAccount, toAccount, amount) {
  // Create fresh session
  const session = db.getMongo().startSession();
  
  try {
    // Start transaction
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });
    
    // Use session database
    const sessionDb = session.getDatabase("ecommerce");
    
    // Debit from source account
    const debitResult = sessionDb.customers.updateOne(
      { 
        _id: fromAccount, 
        balance: { $gte: amount } 
      },
      { $inc: { balance: -amount } }
    );
    
    if (debitResult.matchedCount === 0) {
      throw new Error("Insufficient funds or account not found");
    }
    
    // Credit to destination account
    const creditResult = sessionDb.customers.updateOne(
      { _id: toAccount },
      { $inc: { balance: amount } }
    );
    
    if (creditResult.matchedCount === 0) {
      throw new Error("Destination account not found");
    }
    
    // Log transaction
    sessionDb.transactions.insertOne({
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      timestamp: new Date(),
      type: "transfer"
    });
    
    session.commitTransaction();
    
    print(`Transfer completed: $${amount} from ${fromAccount} to ${toAccount}`);
    return { success: true };
    
  } catch (error) {
    print("Transfer failed: " + error.message);
    session.abortTransaction();
    return { success: false, error: error.message };
    
  } finally {
    session.endSession();
  }
}

// Create transactions collection
db.transactions.createIndex({ timestamp: -1 });

// Test transfer
transferMoney("cust2", "cust1", 100.00);

// Verify balances
db.customers.find({}, { name: 1, balance: 1 });

// Test transfers
transferMoney("cust3", "cust1", 100.00);
transferMoney("cust2", "cust1", 50.00);

// Test invalid transfer
transferMoney("cust2", "cust1", 1000.00);  // Should fail - insufficient funds
```

#### Step 8: Verify Results in Compass
1. Check `customers` collection - verify balance changes
2. Check `transactions` collection - see transfer records
3. Observe how invalid transfers don't affect data

### Lab 1 Deliverables
✅ **Replica set** configured and verified  
✅ **ACID transactions** implemented with error handling  
✅ **Visual verification** using Compass real-time monitoring  
✅ **Understanding** of transaction isolation and consistency

---

## Lab 2: Replica Sets & High Availability
**Duration:** 45 minutes  
**Objective:** Configure replica sets and test failover scenarios

### Part A: Advanced Replica Set Configuration (20 minutes)

#### Step 1: Add Special Members
```bash
# Add arbiter node (voting only, no data)
docker run -d --name mongo-arbiter --network mongodb-net -p 27020:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Add hidden member (data replication, no client reads)  
docker run -d --name mongo-hidden --network mongodb-net -p 27021:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Wait for containers to start
sleep 10
```

#### Step 2: Configure Replica Set in Compass

**Using Compass MongoSH:**
```javascript
// Lab 2 Step 2 - Fix for replica set reconfiguration

// First, set the default write concern to avoid the error
// Remove all extra members first
rs.remove("mongo-arbiter:27017");
rs.remove("mongo-hidden:27017");

// Set write concern
db.adminCommand({
  "setDefaultRWConcern": 1,
  "defaultWriteConcern": { "w": "majority" }
});

// Add arbiter
rs.add({
  _id: 3,
  host: "mongo-arbiter:27017",
  arbiterOnly: true
});

// Add hidden member
rs.add({
  _id: 4,
  host: "mongo-hidden:27017",
  priority: 0,
  hidden: true,
  votes: 0
});

rs.status();
```

**Monitor in Compass:**
1. Navigate to `admin` database → `system.replset` collection
2. View the configuration document
3. Use Compass's JSON view to see member configuration

### Part B: Failover Testing and Read Preferences (15 minutes)

#### Step 4: Test Automatic Failover

**Monitor Current Primary:**
```bash
# Check current primary
docker exec -it mongo1 mongosh --eval "
var primary = rs.status().members.filter(m => m.state === 1)[0];
print('Current primary: ' + primary.name);
"
```

**In MongoDB Compass:**
1. Keep Compass connected to the replica set
2. Note which server shows as "Primary" in the connection status

**Simulate Failover:**
```bash
# Stop the primary node
docker stop mongo1

# Wait 30 seconds and observe in Compass
# Watch the primary indicator change to another server
```

**Monitor in Compass:**
- Watch real-time status changes in connection indicator
- Use Performance tab to see election metrics
- Note automatic promotion of secondary to primary

**Restart Failed Node:**
```bash
# Restart the original primary
docker start mongo1
# It will rejoin as a secondary
sleep 10
```

#### Step 5: Read Preferences Configuration

**Create Multiple Connections in Compass:**

1. **Primary Only Connection:**
   - Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=primary`
   - Favorite Name: "Primary Only"

2. **Secondary Preferred Connection:**
   - Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=secondaryPreferred`
   - Favorite Name: "Secondary Preferred"

3. **Nearest Connection:**
   - Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=nearest`
   - Favorite Name: "Nearest"

**Test Read Preferences via MongoSH:**
```javascript
use ecommerce

// Primary read preference (default)
db.products.find().readPref("primary");

// Secondary preferred
db.products.find().readPref("secondaryPreferred");

// Nearest member
db.products.find().readPref("nearest");

// Tagged reads - east region only
db.products.find().readPref("secondary", [
  { "region": "east" }
]);

// Analytics member only
db.products.find().readPref("secondary", [
  { "usage": "analytics" }
]);
```

#### Step 6: Write and Read Concerns

```javascript
use ecommerce

// Test various write concerns
db.test_writes.insertOne(
  { test: "majority", timestamp: new Date() },
  { writeConcern: { w: "majority" } }
);

db.test_writes.insertOne(
  { test: "majority_timeout", timestamp: new Date() },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
);

db.test_writes.insertOne(
  { test: "journal", timestamp: new Date() },
  { writeConcern: { w: 1, j: true } }
);

// Test read concerns
db.test_writes.find().readConcern("local");
db.test_writes.find().readConcern("majority");
```

**Monitor in Compass:**
- Watch write propagation across replica set members
- Use Performance tab to see write acknowledgment timing
- Observe consistency behavior with different concerns

### Part C: Monitoring and Maintenance (10 minutes)

#### Step 7: Comprehensive Monitoring

**Compass Monitoring Features:**
1. **Performance Tab:** Operations/sec, read/write distribution, replication lag
2. **Real-time Metrics:** Memory usage, connections, network I/O  
3. **Topology View:** Visual cluster health representation

**MongoSH Monitoring Script:**
```javascript
// Comprehensive replica set monitoring
function monitorReplicaSet() {
  print("=== Replica Set Monitoring ===");
  
  var status = rs.status();
  print("Replica Set: " + status.set);
  print("Date: " + status.date);
  
  // Member status
  print("\n--- Member Status ---");
  status.members.forEach(function(member) {
    print(member.name + ": " + member.stateStr + " (Health: " + member.health + ")");
    if (member.optimeDate) {
      print("  Last Optime: " + member.optimeDate);
    }
    if (member.lastHeartbeat) {
      print("  Last Heartbeat: " + member.lastHeartbeat);
    }
  });
  
  // Replication lag
  print("\n--- Replication Lag ---");
  var primary = status.members.filter(function(m) { return m.state === 1; })[0];
  if (primary) {
    status.members.filter(function(m) { return m.state === 2; }).forEach(function(secondary) {
      var lag = (primary.optimeDate - secondary.optimeDate) / 1000;
      print(secondary.name + ": " + lag.toFixed(2) + " seconds behind primary");
    });
  }
  
  // Oplog information
  print("\n--- Oplog Information ---");
  var oplogStats = db.getSiblingDB("local").oplog.rs.stats();
  print("Oplog Size: " + (oplogStats.size / 1024 / 1024).toFixed(2) + " MB");
  print("Oplog Used: " + (oplogStats.storageSize / 1024 / 1024).toFixed(2) + " MB");
  
  var firstOp = db.getSiblingDB("local").oplog.rs.find().sort({ ts: 1 }).limit(1).next();
  var lastOp = db.getSiblingDB("local").oplog.rs.find().sort({ ts: -1 }).limit(1).next();
  
  // Fix: Access timestamp seconds directly
  var oplogWindow = (lastOp.ts.t - firstOp.ts.t) / 3600;
  print("Oplog Window: " + oplogWindow.toFixed(2) + " hours");
}

// Run monitoring
monitorReplicaSet();
```

#### Step 8: Maintenance Operations

```javascript
// Step down primary for maintenance
rs.stepDown(60);  // Step down for 60 seconds

// Freeze a secondary (prevent it from becoming primary)
rs.freeze(300);   // Freeze for 5 minutes

// Reconfigure replica set settings
var config = rs.conf();
config.settings = config.settings || {};
config.settings.electionTimeoutMillis = 15000;  // 15 seconds
config.settings.heartbeatIntervalMillis = 3000;  // 3 seconds
rs.reconfig(config);
```

### Lab 2 Deliverables
✅ **Advanced replica set** with arbiter and hidden members  
✅ **Failover testing** with visual monitoring  
✅ **Read preferences** configured and tested  
✅ **Comprehensive monitoring** setup and maintenance procedures

---

## Lab 3: Sharding & Horizontal Scaling
**Duration:** 45 minutes  
**Objective:** Build and manage a sharded MongoDB cluster

### Part A: Sharded Cluster Setup (25 minutes)

#### Step 1: Start Config Server Replica Set
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

#### Step 2: Start Shard Replica Sets
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

#### Step 3: Start Query Routers (mongos)
```bash
# Query routers
docker run -d --name mongos1 --network mongodb-net -p 27017:27017 mongo:8.0 mongos --configdb configrs/config1:27017,config2:27017,config3:27017 --bind_ip_all
docker run -d --name mongos2 --network mongodb-net -p 27018:27017 mongo:8.0 mongos --configdb configrs/config1:27017,config2:27017,config3:27017 --bind_ip_all

# Wait for mongos startup
sleep 15
```

#### Step 4: Configure Sharded Cluster

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

### Part B: Sharding Strategy Implementation (15 minutes)

#### Step 5: Enable Sharding and Create Collections

```javascript
// Enable sharding on database
sh.enableSharding("ecommerce")

use ecommerce

// 1. Hashed sharding for even distribution
sh.shardCollection("ecommerce.users", { _id: "hashed" })

// 2. Range-based sharding for query targeting
sh.shardCollection("ecommerce.orders", { customerId: 1, orderDate: 1 })

// 3. Geographic sharding
sh.shardCollection("ecommerce.stores", { region: 1, storeId: 1 })

// Check sharding status
sh.status()
```

#### Step 6: Load Test Data

**Generate Users Data (Hashed Sharding):**
```javascript
// Generate users for hashed distribution
print("Generating users data...");
for (let i = 1; i <= 1000; i++) {
  db.users.insertOne({
    _id: "user" + i,
    name: "User " + i,
    email: "user" + i + "@example.com",
    registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    preferences: {
      newsletter: Math.random() > 0.5,
      theme: Math.random() > 0.5 ? "dark" : "light"
    }
  });
  
  if (i % 200 === 0) {
    print(`Inserted ${i} users`);
  }
}
```

**Generate Orders Data (Range Sharding):**
```javascript
// Generate orders for range-based distribution
print("Generating orders data...");
var customers = ["user1", "user100", "user200", "user300", "user400", "user500"];
for (let i = 1; i <= 500; i++) {
  var customerId = customers[Math.floor(Math.random() * customers.length)];
  var orderDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
  
  db.orders.insertOne({
    _id: "order" + i,
    customerId: customerId,
    orderDate: orderDate,
    items: [
      { productId: "prod" + (Math.floor(Math.random() * 4) + 1), quantity: Math.floor(Math.random() * 3) + 1 }
    ],
    total: Math.random() * 1000 + 50,
    status: Math.random() > 0.8 ? "pending" : "completed"
  });
  
  if (i % 100 === 0) {
    print(`Inserted ${i} orders`);
  }
}
```

**Generate Stores Data (Geographic Sharding):**
```javascript
// Generate stores for geographic distribution
print("Generating stores data...");
var regions = ["north", "south", "east", "west"];
for (let i = 1; i <= 200; i++) {
  var region = regions[Math.floor(Math.random() * regions.length)];
  
  db.stores.insertOne({
    region: region,
    storeId: "store" + i,
    name: "Store " + i,
    address: i + " Commerce St, " + region.charAt(0).toUpperCase() + region.slice(1) + " District",
    salesData: {
      monthly: Math.round((Math.random() * 100000 + 50000) * 100) / 100,
      quarterly: Math.round((Math.random() * 300000 + 150000) * 100) / 100
    }
  });
  
  if (i % 50 === 0) {
    print(`Inserted ${i} stores`);
  }
}
```

#### Step 7: Analyze Distribution

**Monitor Data Distribution in Compass:**
1. Navigate to `config` database
2. View `chunks` collection with filters:
   - `{"ns": "ecommerce.users"}` - see user chunks
   - `{"ns": "ecommerce.orders"}` - see order chunks
   - `{"ns": "ecommerce.stores"}` - see store chunks

**Analyze via MongoSH:**
```javascript
// Check chunk distribution
use config
print("Chunk counts by collection:");
print("Users: " + db.chunks.find({ ns: "ecommerce.users" }).count());
print("Orders: " + db.chunks.find({ ns: "ecommerce.orders" }).count());
print("Stores: " + db.chunks.find({ ns: "ecommerce.stores" }).count());

// Check chunks per shard
print("\nChunks per shard:");
db.chunks.aggregate([
  { $group: { _id: "$shard", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).forEach(printjson);

// Check balancer status
print("\nBalancer status:");
print("Enabled: " + sh.getBalancerState());
print("Running: " + sh.isBalancerRunning());
```

### Part C: Zone Sharding and Management (5 minutes)

#### Step 8: Zone Sharding for Geographic Distribution

```javascript
// Add tags to shards for geographic zones
sh.addShardTag("shard1rs", "US-EAST")
sh.addShardTag("shard2rs", "US-WEST")

// Create zone ranges for geographic data
sh.addTagRange(
  "ecommerce.stores",
  { region: "north", storeId: MinKey },
  { region: "north", storeId: MaxKey },
  "US-EAST"
)

sh.addTagRange(
  "ecommerce.stores",
  { region: "east", storeId: MinKey },
  { region: "east", storeId: MaxKey },
  "US-EAST"
)

sh.addTagRange(
  "ecommerce.stores",
  { region: "south", storeId: MinKey },
  { region: "south", storeId: MaxKey },
  "US-WEST"
)

sh.addTagRange(
  "ecommerce.stores",
  { region: "west", storeId: MinKey },
  { region: "west", storeId: MaxKey },
  "US-WEST"
)

// Check zone configuration
sh.status()
```

**Monitor in Compass:**
1. Navigate to `config` database
2. View `shards` collection to see shard tags
3. View `tags` collection to see zone ranges

#### Step 9: Manual Chunk Operations

```javascript
// Split chunks manually for better distribution
sh.splitAt("ecommerce.orders", { customerId: "user300", orderDate: new Date("2024-06-01") })

// Move chunks between shards (if needed)
sh.moveChunk(
  "ecommerce.orders",
  { customerId: "user100", orderDate: MinKey },
  "shard2rs"
)

// Balancer management
sh.stopBalancer()   // Temporarily disable
sh.startBalancer()  // Re-enable
```

### Lab 3 Deliverables
✅ **Complete sharded cluster** with config servers and multiple shards  
✅ **Different sharding strategies** implemented and tested  
✅ **Zone sharding** configured for geographic distribution  
✅ **Chunk distribution analysis** and balancer management

---

## Lab 4: Change Streams for Real-time Applications
**Duration:** 30 minutes  
**Objective:** Implement real-time applications using MongoDB change streams

### Part A: Change Stream Setup (15 minutes)

#### Step 1: Prepare Collections

**Using existing replica set from Lab 1:**
- Connection: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`

**Create additional collections for change streams:**
```javascript
use ecommerce

// Create notifications collection
db.notifications.createIndex({ userId: 1, timestamp: -1 })
db.notifications.createIndex({ type: 1, read: 1 })

// Create activity log collection  
db.activity_log.createIndex({ timestamp: -1 })
db.activity_log.createIndex({ event: 1, timestamp: -1 })

// Create resume tokens collection
db.resume_tokens.createIndex({ lastUpdated: -1 })
```

#### Step 2: Basic Change Stream Simulation

**Understanding Change Streams:**
Change streams in production run as background processes. For lab purposes, we'll simulate the processing.

```javascript
// Simulate change stream handler
function simulateChangeStreamHandler(change) {
  print("=== Change Detected ===");
  print("Operation: " + change.operationType);
  print("Collection: " + change.ns.coll);
  print("Timestamp: " + new Date());
  
  switch(change.operationType) {
    case 'insert':
      if (change.ns.coll === "orders") {
        print("New order created: " + change.fullDocument._id);
        print("Customer: " + change.fullDocument.customerId);
        print("Total: $" + change.fullDocument.totalAmount);
        
        // Create notification
        db.notifications.insertOne({
          userId: change.fullDocument.customerId,
          type: "order_created",
          message: `Your order ${change.fullDocument._id} has been created.`,
          orderId: change.fullDocument._id,
          timestamp: new Date(),
          read: false
        });
      }
      break;
      
    case 'update':
      if (change.ns.coll === "orders") {
        print("Order updated: " + change.documentKey._id);
        if (change.updateDescription && change.updateDescription.updatedFields.status) {
          print("Status changed to: " + change.updateDescription.updatedFields.status);
          
          // Create status update notification
          var order = db.orders.findOne({ _id: change.documentKey._id });
          db.notifications.insertOne({
            userId: order.customerId,
            type: "status_update",
            message: `Your order ${change.documentKey._id} status: ${change.updateDescription.updatedFields.status}`,
            orderId: change.documentKey._id,
            timestamp: new Date(),
            read: false
          });
        }
      }
      break;
      
    case 'delete':
      print("Document deleted: " + change.documentKey._id);
      break;
  }
  print("========================\n");
}
```

#### Step 3: Test Change Stream Processing

**Monitor in Compass:**
1. Open `orders` and `notifications` collections in separate tabs
2. Enable auto-refresh for real-time monitoring

**Test Order Creation:**
```javascript
// Create a test order and simulate change stream processing
var testOrder = {
  _id: "order_cs_test1",
  customerId: "cust1",
  orderDate: new Date(),
  items: [{ productId: "prod2", quantity: 1 }],
  totalAmount: 29.99,
  status: "pending"
};

// Insert order
db.orders.insertOne(testOrder);

// Simulate change stream processing
simulateChangeStreamHandler({
  operationType: "insert",
  ns: { db: "ecommerce", coll: "orders" },
  fullDocument: testOrder,
  documentKey: { _id: "order_cs_test1" }
});

// Update order status
db.orders.updateOne(
  { _id: "order_cs_test1" },
  { $set: { status: "processing" } }
);

// Simulate update processing
simulateChangeStreamHandler({
  operationType: "update",
  ns: { db: "ecommerce", coll: "orders" },
  documentKey: { _id: "order_cs_test1" },
  updateDescription: { updatedFields: { status: "processing" } }
});
```

**Verify in Compass:**
- Check `notifications` collection for auto-generated notifications
- Apply filter: `{"orderId": "order_cs_test1"}` to see related notifications

### Part B: Advanced Change Stream Features (15 minutes)

#### Step 4: Event-Driven Order Processing System

```javascript
// Complete order processing system with change streams
var OrderProcessor = {
  
  // Process new orders
  processNewOrder: function(order) {
    print(`Processing new order: ${order._id}`);
    
    // Validate inventory
    var allItemsAvailable = true;
    var unavailableItems = [];
    
    order.items.forEach(function(item) {
      var product = db.products.findOne({ _id: item.productId });
      if (!product || product.stock < item.quantity) {
        allItemsAvailable = false;
        unavailableItems.push(item.productId);
      }
    });
    
    if (allItemsAvailable) {
      // Update order status
      db.orders.updateOne(
        { _id: order._id },
        { $set: { status: "processing", processedAt: new Date() } }
      );
      
      // Create success notification
      db.notifications.insertOne({
        userId: order.customerId,
        type: "order_confirmed",
        message: `Your order ${order._id} has been confirmed and is being processed.`,
        orderId: order._id,
        timestamp: new Date(),
        read: false
      });
      
      print(`✅ Order ${order._id} confirmed and processing`);
    } else {
      // Update order status to failed
      db.orders.updateOne(
        { _id: order._id },
        { $set: { status: "failed", reason: "Insufficient inventory" } }
      );
      
      // Create failure notification
      db.notifications.insertOne({
        userId: order.customerId,
        type: "order_failed",
        message: `Your order ${order._id} could not be processed due to insufficient inventory.`,
        orderId: order._id,
        timestamp: new Date(),
        read: false
      });
      
      print(`❌ Order ${order._id} failed - insufficient inventory`);
    }
  },
  
  // Handle status changes
  handleStatusChange: function(orderId, newStatus) {
    print(`Order ${orderId} status changed to: ${newStatus}`);
    
    var order = db.orders.findOne({ _id: orderId });
    if (order && newStatus === "completed") {
      // Update customer stats
      db.customers.updateOne(
        { _id: order.customerId },
        { 
          $inc: { totalOrders: 1, totalSpent: order.totalAmount },
          $set: { lastOrderDate: new Date() }
        }
      );
      print(`✅ Customer ${order.customerId} stats updated`);
    }
  },
  
  // Handle inventory changes  
  handleInventoryChange: function(productId, newStock) {
    print(`Product ${productId} stock updated to: ${newStock}`);
    
    // Check for low inventory
    if (newStock <= 5) {
      db.notifications.insertOne({
        userId: "inventory_manager",
        type: "low_inventory",
        message: `Low inventory alert: Product ${productId} has only ${newStock} units left.`,
        productId: productId,
        timestamp: new Date(),
        read: false
      });
      
      print(`⚠️ Low inventory alert for ${productId}`);
    }
  }
};
```

#### Step 5: Test Complete Workflow

```javascript
print("=== Testing Complete Order Processing Workflow ===");

// Create a new order
var newOrder = {
  _id: "order_workflow_test1",
  customerId: "cust2",
  orderDate: new Date(),
  items: [{ productId: "prod3", quantity: 2 }],  // Should have stock
  totalAmount: 159.98,
  status: "pending"
};

// Insert and process order
db.orders.insertOne(newOrder);
OrderProcessor.processNewOrder(newOrder);

// Simulate status changes
OrderProcessor.handleStatusChange("order_workflow_test1", "shipped");
OrderProcessor.handleStatusChange("order_workflow_test1", "completed");

// Test inventory change
OrderProcessor.handleInventoryChange("prod3", 3);  // Should trigger low stock alert

// Test order with insufficient stock
var failedOrder = {
  _id: "order_workflow_test2",
  customerId: "cust3",
  orderDate: new Date(),
  items: [{ productId: "prod1", quantity: 20 }],  // More than available stock
  totalAmount: 19999.80,
  status: "pending"
};

db.orders.insertOne(failedOrder);
OrderProcessor.processNewOrder(failedOrder);
```

#### Step 6: Resume Token Management

```javascript
// Simulate resumable change streams with token storage
var ChangeStreamManager = {
  
  // Store resume token for fault tolerance
  storeResumeToken: function(streamId, token) {
    db.resume_tokens.replaceOne(
      { _id: streamId },
      { _id: streamId, token: token, lastUpdated: new Date() },
      { upsert: true }
    );
    print(`Resume token stored for ${streamId}`);
  },
  
  // Get last resume token
  getLastResumeToken: function(streamId) {
    var doc = db.resume_tokens.findOne({ _id: streamId });
    if (doc) {
      print(`Resume token found for ${streamId}: ${doc.lastUpdated}`);
      return doc.token;
    }
    print(`No resume token found for ${streamId}`);
    return null;
  },
  
  // Process change with resume token
  processChangeWithResume: function(streamId, change) {
    // Process the change
    print(`Processing change for ${streamId}: ${change.operationType}`);
    
    // Store resume token for fault tolerance
    this.storeResumeToken(streamId, change._id);
    
    // Log processing
    db.activity_log.insertOne({
      operation: change.operationType,
      collection: change.ns.coll,
      documentId: change.documentKey._id,
      timestamp: new Date(),
      changeId: change._id,
      streamId: streamId
    });
    
    print(`✅ Change processed and resume token saved`);
  }
};

// Test resume token functionality
print("=== Testing Resume Token Functionality ===");

// Simulate change stream events
var simulatedChanges = [
  {
    _id: { _data: "resumeToken1" },
    operationType: "insert",
    ns: { db: "ecommerce", coll: "orders" },
    documentKey: { _id: "order_resume1" }
  },
  {
    _id: { _data: "resumeToken2" },
    operationType: "update", 
    ns: { db: "ecommerce", coll: "orders" },
    documentKey: { _id: "order_resume1" }
  }
];

// Process changes with resume tokens
simulatedChanges.forEach(function(change, index) {
  ChangeStreamManager.processChangeWithResume("order_stream", change);
});

// Check stored resume tokens
print("\nStored resume tokens:");
db.resume_tokens.find().forEach(printjson);

// Check activity log
print("\nActivity log:");
db.activity_log.find({ streamId: "order_stream" }).forEach(printjson);
```

#### Step 7: Monitor Results in Compass

**Real-time Monitoring:**
1. Keep multiple collection tabs open:
   - `orders` - see order changes
   - `notifications` - see generated notifications  
   - `activity_log` - see change stream processing
   - `resume_tokens` - see fault tolerance tokens

**Analysis Queries:**
```javascript
// Count notifications by type
db.notifications.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Find unread notifications for a customer
db.notifications.find({ userId: "cust2", read: false }).sort({ timestamp: -1 })

// Check recent activity
db.activity_log.find().sort({ timestamp: -1 }).limit(10)
```

### Lab 4 Deliverables
✅ **Change stream simulation** with event processing  
✅ **Real-time notifications** system implemented  
✅ **Event-driven order processing** workflow  
✅ **Resume token management** for fault tolerance

---

## Lab 5: C# MongoDB API Integration
**Duration:** 30 minutes  
**Objective:** Integrate MongoDB with C# applications

### Part A: Project Setup (10 minutes)

#### Step 1: Create C# Console Application
```bash
# Create project directory
mkdir MongoDBCSharpLab
cd MongoDBCSharpLab

# Create new console application
dotnet new console

# Add MongoDB driver
dotnet add package MongoDB.Driver
```

#### Step 2: Create Models

**Create Models/Product.cs:**
```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MongoDBCSharpLab.Models
{
    public class Product
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        
        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;
        
        [BsonElement("price")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Price { get; set; }
        
        [BsonElement("category")]
        public string Category { get; set; } = string.Empty;
        
        [BsonElement("stock")]
        public int Stock { get; set; }
        
        [BsonElement("description")]
        public string Description { get; set; } = string.Empty;
        
        [BsonElement("tags")]
        public List<string> Tags { get; set; } = new();
        
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }
}
```

**Create Models/Customer.cs:**
```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MongoDBCSharpLab.Models
{
    public class Customer
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        
        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;
        
        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;
        
        [BsonElement("phone")]
        public string Phone { get; set; } = string.Empty;
        
        [BsonElement("address")]
        public Address Address { get; set; } = new();
        
        [BsonElement("registrationDate")]
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
        
        [BsonElement("balance")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Balance { get; set; }
        
        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }
    
    public class Address
    {
        [BsonElement("street")]
        public string Street { get; set; } = string.Empty;
        
        [BsonElement("city")]
        public string City { get; set; } = string.Empty;
        
        [BsonElement("state")]
        public string State { get; set; } = string.Empty;
        
        [BsonElement("zipCode")]
        public string ZipCode { get; set; } = string.Empty;
        
        [BsonElement("country")]
        public string Country { get; set; } = string.Empty;
    }
}
```

#### Step 3: Create Database Service

**Create Services/MongoDBService.cs:**
```csharp
using MongoDB.Driver;
using MongoDBCSharpLab.Models;

namespace MongoDBCSharpLab.Services
{
    public class MongoDBService
    {
        private readonly IMongoDatabase _database;
        
        public MongoDBService(string connectionString, string databaseName)
        {
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }
        
        public IMongoCollection<Product> Products => 
            _database.GetCollection<Product>("products");
            
        public IMongoCollection<Customer> Customers => 
            _database.GetCollection<Customer>("customers");
    }
}
```

### Part B: CRUD Operations (15 minutes)

#### Step 4: Implement Product Service

**Create Services/ProductService.cs:**
```csharp
using MongoDB.Driver;
using MongoDBCSharpLab.Models;

namespace MongoDBCSharpLab.Services
{
    public class ProductService
    {
        private readonly IMongoCollection<Product> _products;
        
        public ProductService(MongoDBService mongoDBService)
        {
            _products = mongoDBService.Products;
        }
        
        // Create operations
        public async Task<Product> CreateProductAsync(Product product)
        {
            await _products.InsertOneAsync(product);
            return product;
        }
        
        public async Task CreateProductsAsync(IEnumerable<Product> products)
        {
            await _products.InsertManyAsync(products);
        }
        
        // Read operations
        public async Task<List<Product>> GetAllProductsAsync()
        {
            return await _products.Find(_ => true).ToListAsync();
        }
        
        public async Task<Product?> GetProductByIdAsync(string id)
        {
            return await _products.Find(p => p.Id == id).FirstOrDefaultAsync();
        }
        
        public async Task<List<Product>> GetProductsByCategoryAsync(string category)
        {
            return await _products.Find(p => p.Category == category).ToListAsync();
        }
        
        public async Task<List<Product>> GetProductsByPriceRangeAsync(decimal minPrice, decimal maxPrice)
        {
            var filter = Builders<Product>.Filter.And(
                Builders<Product>.Filter.Gte(p => p.Price, minPrice),
                Builders<Product>.Filter.Lte(p => p.Price, maxPrice)
            );
            return await _products.Find(filter).ToListAsync();
        }
        
        public async Task<List<Product>> SearchProductsAsync(string searchTerm)
        {
            var filter = Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Regex(p => p.Name, 
                    new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
                Builders<Product>.Filter.Regex(p => p.Description, 
                    new MongoDB.Bson.BsonRegularExpression(searchTerm, "i"))
            );
            return await _products.Find(filter).ToListAsync();
        }
        
        // Update operations
        public async Task<bool> UpdateProductAsync(string id, Product product)
        {
            var result = await _products.ReplaceOneAsync(p => p.Id == id, product);
            return result.ModifiedCount > 0;
        }
        
        public async Task<bool> UpdateProductPriceAsync(string id, decimal newPrice)
        {
            var filter = Builders<Product>.Filter.Eq(p => p.Id, id);
            var update = Builders<Product>.Update.Set(p => p.Price, newPrice);
            var result = await _products.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
        
        public async Task<bool> UpdateStockAsync(string id, int newStock)
        {
            var filter = Builders<Product>.Filter.Eq(p => p.Id, id);
            var update = Builders<Product>.Update.Set(p => p.Stock, newStock);
            var result = await _products.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
        
        // Delete operations
        public async Task<bool> DeleteProductAsync(string id)
        {
            var result = await _products.DeleteOneAsync(p => p.Id == id);
            return result.DeletedCount > 0;
        }
        
        public async Task<long> DeleteProductsByCategoryAsync(string category)
        {
            var result = await _products.DeleteManyAsync(p => p.Category == category);
            return result.DeletedCount;
        }
        
        // Aggregation operations
        public async Task<List<object>> GetProductStatsByCategoryAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$group", new BsonDocument
                {
                    ["_id"] = "$category",
                    ["count"] = new BsonDocument("$sum", 1),
                    ["avgPrice"] = new BsonDocument("$avg", "$price"),
                    ["totalStock"] = new BsonDocument("$sum", "$stock")
                }),
                new BsonDocument("$sort", new BsonDocument("count", -1))
            };
            
            return await _products.Aggregate<object>(pipeline).ToListAsync();
        }
    }
}
```

#### Step 5: Main Program Implementation

**Update Program.cs:**
```csharp
using MongoDBCSharpLab.Models;
using MongoDBCSharpLab.Services;

class Program
{
    // Connection to replica set from Lab 1
    private static readonly string ConnectionString = 
        "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0";
    private static readonly string DatabaseName = "ecommerce_csharp";
    
    static async Task Main(string[] args)
    {
        Console.WriteLine("MongoDB C# Driver Lab");
        Console.WriteLine("====================\n");
        
        try
        {
            // Initialize services
            var mongoService = new MongoDBService(ConnectionString, DatabaseName);
            var productService = new ProductService(mongoService);
            
            // Run CRUD operations
            await TestCRUDOperations(productService);
            
            // Run aggregation operations
            await TestAggregationOperations(productService);
            
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }
        
        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }
    
    static async Task TestCRUDOperations(ProductService productService)
    {
        Console.WriteLine("=== CRUD Operations Test ===\n");
        
        // Create sample products
        var products = new List<Product>
        {
            new Product
            {
                Name = "Wireless Headphones",
                Price = 89.99m,
                Category = "Electronics",
                Stock = 50,
                Description = "High-quality wireless headphones with noise cancellation",
                Tags = new List<string> { "wireless", "audio", "bluetooth" }
            },
            new Product
            {
                Name = "Gaming Mouse",
                Price = 45.99m,
                Category = "Electronics",
                Stock = 25,
                Description = "Precision gaming mouse with RGB lighting",
                Tags = new List<string> { "gaming", "mouse", "rgb" }
            },
            new Product
            {
                Name = "Coffee Mug",
                Price = 12.99m,
                Category = "Home",
                Stock = 100,
                Description = "Ceramic coffee mug with heat retention",
                Tags = new List<string> { "coffee", "ceramic", "kitchen" }
            },
            new Product
            {
                Name = "Smartphone",
                Price = 699.99m,
                Category = "Electronics",
                Stock = 30,
                Description = "Latest smartphone with advanced camera",
                Tags = new List<string> { "mobile", "camera", "5g" }
            }
        };
        
        // INSERT
        Console.WriteLine("Creating products...");
        await productService.CreateProductsAsync(products);
        Console.WriteLine($"✅ Created {products.Count} products\n");
        
        // READ
        Console.WriteLine("Reading all products:");
        var allProducts = await productService.GetAllProductsAsync();
        foreach (var product in allProducts)
        {
            Console.WriteLine($"- {product.Name}: ${product.Price} (Stock: {product.Stock})");
        }
        Console.WriteLine();
        
        // SEARCH
        Console.WriteLine("Searching for 'gaming' products:");
        var gamingProducts = await productService.SearchProductsAsync("gaming");
        foreach (var product in gamingProducts)
        {
            Console.WriteLine($"- {product.Name}: {product.Description}");
        }
        Console.WriteLine();
        
        // CATEGORY FILTER
        Console.WriteLine("Electronics products:");
        var electronicsProducts = await productService.GetProductsByCategoryAsync("Electronics");
        foreach (var product in electronicsProducts)
        {
            Console.WriteLine($"- {product.Name}: ${product.Price}");
        }
        Console.WriteLine();
        
        // UPDATE
        if (allProducts.Any())
        {
            var firstProduct = allProducts.First();
            Console.WriteLine($"Updating price of {firstProduct.Name}...");
            await productService.UpdateProductPriceAsync(firstProduct.Id!, 99.99m);
            
            var updatedProduct = await productService.GetProductByIdAsync(firstProduct.Id!);
            Console.WriteLine($"✅ New price: ${updatedProduct?.Price}\n");
        }
        
        // PRICE RANGE QUERY
        Console.WriteLine("Products between $40 and $100:");
        var priceRangeProducts = await productService.GetProductsByPriceRangeAsync(40m, 100m);
        foreach (var product in priceRangeProducts)
        {
            Console.WriteLine($"- {product.Name}: ${product.Price}");
        }
        Console.WriteLine();
        
        // STOCK UPDATE
        if (allProducts.Any())
        {
            var product = allProducts.Last();
            Console.WriteLine($"Updating stock for {product.Name}...");
            await productService.UpdateStockAsync(product.Id!, 5);
            Console.WriteLine("✅ Stock updated to 5\n");
        }
    }
    
    static async Task TestAggregationOperations(ProductService productService)
    {
        Console.WriteLine("=== Aggregation Operations Test ===\n");
        
        // Category statistics
        Console.WriteLine("Product statistics by category:");
        var categoryStats = await productService.GetProductStatsByCategoryAsync();
        foreach (var stat in categoryStats)
        {
            Console.WriteLine($"- {stat}");
        }
        Console.WriteLine();
    }
}
```

### Part C: Error Handling and Resilience (5 minutes)

#### Step 6: Enhanced Error Handling

**Create Services/ResilientProductService.cs:**
```csharp
using MongoDB.Driver;
using MongoDBCSharpLab.Models;

namespace MongoDBCSharpLab.Services
{
    public class ResilientProductService
    {
        private readonly ProductService _productService;
        
        public ResilientProductService(ProductService productService)
        {
            _productService = productService;
        }
        
        public async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, int maxRetries = 3)
        {
            Exception? lastException = null;
            
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    return await operation();
                }
                catch (MongoException ex) when (IsTransientError(ex) && attempt < maxRetries)
                {
                    lastException = ex;
                    var delay = TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 1000); // Exponential backoff
                    Console.WriteLine($"⚠️ Attempt {attempt} failed. Retrying in {delay.TotalSeconds} seconds...");
                    await Task.Delay(delay);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Non-transient error: {ex.Message}");
                    throw;
                }
            }
            
            throw lastException!;
        }
        
        private static bool IsTransientError(MongoException ex)
        {
            return ex is MongoConnectionException ||
                   ex is MongoTimeoutException ||
                   (ex is MongoWriteException writeEx && IsTransientWriteError(writeEx));
        }
        
        private static bool IsTransientWriteError(MongoWriteException ex)
        {
            // Check for specific transient write error codes
            return ex.WriteError?.Code == 11000 || // Duplicate key (might be transient)
                   ex.WriteError?.Code == 16500;    // Shard config stale
        }
        
        // Example of resilient operation
        public async Task<Product?> GetProductByIdWithRetryAsync(string id)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                Console.WriteLine($"Attempting to fetch product {id}...");
                return await _productService.GetProductByIdAsync(id);
            });
        }
        
        // Test resilience
        public async Task TestResilienceAsync()
        {
            Console.WriteLine("=== Testing Resilient Operations ===\n");
            
            try
            {
                // This demonstrates retry logic
                var products = await ExecuteWithRetryAsync(async () =>
                {
                    Console.WriteLine("Fetching all products with retry logic...");
                    return await _productService.GetAllProductsAsync();
                });
                
                Console.WriteLine($"✅ Successfully fetched {products.Count} products");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Operation failed after retries: {ex.Message}");
            }
        }
    }
}
```

#### Step 7: Run the Application

```bash
# Build and run the application
dotnet build
dotnet run
```

#### Step 8: Verify in Compass

1. Connect Compass to the C# database: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
2. Navigate to `ecommerce_csharp` database
3. Verify the `products` collection contains data created by C# application
4. View the documents and their structure

### Lab 5 Deliverables
✅ **C# MongoDB integration** with strongly-typed models  
✅ **Complete CRUD operations** implementation  
✅ **Error handling and resilience** patterns  
✅ **Connection to replica set** from C# application

---

## Lab Cleanup

### Stop All Containers
```bash
# Stop replica set containers (Labs 1, 2, 4)
docker stop mongo1 mongo2 mongo3 mongo-arbiter mongo-hidden

# Stop sharding containers (Lab 3)
docker stop config1 config2 config3
docker stop shard1-1 shard1-2 shard1-3 shard2-1 shard2-2 shard2-3
docker stop mongos1 mongos2

# Remove all containers
docker container prune -f

# Remove network
docker network rm mongodb-net

# Clean up system
docker system prune -f
```

---

## Course Summary

### What You've Accomplished

#### 🔄 **Transactions (Lab 1)**
- **ACID Properties**: Implemented atomicity, consistency, isolation, durability
- **Real-world Scenarios**: Order processing and money transfers
- **Error Handling**: Transaction rollbacks and failure scenarios
- **Visual Verification**: Used Compass to monitor transaction effects

#### 🔧 **Replication (Lab 2)**
- **Advanced Replica Sets**: Configured primary, secondary, arbiter, and hidden members
- **High Availability**: Tested automatic failover and recovery mechanisms
- **Read Preferences**: Implemented geographic and workload-based read routing
- **Monitoring**: Comprehensive cluster health monitoring and maintenance

#### ⚡ **Sharding (Lab 3)**
- **Horizontal Scaling**: Built complete sharded cluster with config servers
- **Sharding Strategies**: Implemented hashed, range-based, and geographic sharding
- **Zone Sharding**: Configured geographic data distribution
- **Cluster Management**: Chunk distribution analysis and balancer operations

#### 📡 **Change Streams (Lab 4)**
- **Real-time Applications**: Built event-driven notification systems
- **Order Processing**: Implemented complete workflow automation
- **Fault Tolerance**: Resume token management for reliable stream processing
- **Visual Monitoring**: Real-time change observation in Compass

#### 💻 **C# Integration (Lab 5)**
- **Application Development**: Connected C# applications to MongoDB replica sets
- **Strongly-typed Models**: Implemented proper data modeling with attributes
- **Resilient Operations**: Built retry logic and error handling patterns
- **Production Patterns**: CRUD operations with proper async/await usage

### MongoDB Compass Mastery

Throughout these labs, you've mastered MongoDB Compass as a professional tool:

#### **Visual Database Management**
- **Real-time Monitoring**: Collection auto-refresh and live data observation
- **Performance Analysis**: Query execution plans and index usage
- **Cluster Topology**: Visual replica set and sharding status
- **Schema Exploration**: Document structure analysis and validation

#### **Development Workflow**
- **Integrated MongoSH**: Combined GUI convenience with command-line power
- **Multiple Connections**: Different read preferences and cluster connections
- **Query Building**: Visual query construction and testing
- **Aggregation Pipelines**: Interactive pipeline development

#### **Operations and Monitoring**
- **Health Dashboards**: Real-time cluster metrics and alerts
- **Index Management**: Performance optimization and index analysis
- **Data Exploration**: Filtering, sorting, and document inspection
- **Connection Management**: Secure and organized database connections

### Production Readiness Assessment

You're now equipped with production-level MongoDB skills:

#### **✅ Database Architecture**
- Design and implement ACID-compliant transaction systems
- Configure high-availability replica sets with automatic failover
- Plan and deploy horizontally-scaled sharded clusters
- Implement real-time applications with change streams

#### **✅ Operations Excellence**
- Monitor cluster health and performance metrics
- Handle failover scenarios and disaster recovery
- Manage data distribution and balancing
- Troubleshoot connectivity and performance issues

#### **✅ Application Integration**
- Connect applications to MongoDB clusters securely
- Implement resilient database operations with retry logic
- Handle errors gracefully in production environments
- Design efficient data access patterns

#### **✅ Development Best Practices**
- Use MongoDB Compass for database development and debugging
- Implement proper schema design for scalability
- Create maintainable and testable database code
- Follow MongoDB coding conventions and patterns

### Next Steps and Career Development

#### **Immediate Actions**
1. **Practice**: Recreate these labs in different scenarios
2. **Explore**: Try different sharding keys and replica set configurations
3. **Experiment**: Build your own applications using these patterns
4. **Document**: Create your own reference guides and cheat sheets

#### **Advanced Learning Paths**

**MongoDB Certification**
- **MongoDB Certified Developer Associate**: Validates application development skills
- **MongoDB Certified DBA Associate**: Focuses on database administration
- **MongoDB Certified Developer**: Advanced development certification

**Specialized Topics**
- **Atlas Administration**: Cloud MongoDB deployment and management
- **Security**: Authentication, authorization, and encryption
- **Performance Tuning**: Advanced optimization techniques
- **Data Modeling**: Complex schema design patterns

**Integration Technologies**
- **Kubernetes**: Container orchestration for MongoDB deployments
- **Microservices**: MongoDB in distributed architectures
- **Analytics**: MongoDB with BI tools and data pipelines
- **Search**: MongoDB Atlas Search and full-text search capabilities

#### **Professional Development**

**Industry Applications**
- **E-commerce**: Product catalogs, order processing, inventory management
- **IoT and Time-Series**: Sensor data, metrics, and analytics
- **Content Management**: Document storage, versioning, and search
- **Financial Services**: Transaction processing, audit trails, compliance
- **Gaming**: Player data, leaderboards, real-time multiplayer
- **Healthcare**: Patient records, medical imaging, clinical trials

**Career Opportunities**
- **Database Developer**: Application development with MongoDB
- **Database Administrator**: MongoDB cluster management and operations
- **DevOps Engineer**: Infrastructure automation and deployment
- **Solutions Architect**: Enterprise MongoDB architecture design
- **Data Engineer**: Data pipelines and analytics platforms

### Advanced MongoDB Features to Explore

#### **MongoDB Atlas (Cloud)**
- Fully managed MongoDB service
- Global cluster deployment
- Built-in monitoring and alerting
- Automated backups and point-in-time recovery
- Atlas Search for full-text search capabilities
- Atlas Data Lake for analytics

#### **Security Features**
- Field-level encryption
- LDAP and Kerberos authentication
- Auditing and compliance
- Network security and VPC peering
- Role-based access control (RBAC)

#### **Performance Optimization**
- Query optimization and profiling
- Index strategy refinement
- Memory and storage tuning
- Connection pooling optimization
- Aggregation pipeline optimization

#### **Advanced Data Types**
- GridFS for large file storage
- Geospatial data and queries
- Time-series collections
- JSON Schema validation
- Text search and indexing

### Community and Resources

#### **Official Resources**
- **MongoDB Documentation**: https://docs.mongodb.com
- **MongoDB University**: https://university.mongodb.com
- **MongoDB Blog**: https://www.mongodb.com/blog
- **MongoDB GitHub**: https://github.com/mongodb

#### **Community Support**
- **MongoDB Community Forums**: https://community.mongodb.com
- **Stack Overflow**: mongodb tag for technical questions
- **Reddit**: r/mongodb for discussions and news
- **Local User Groups**: MongoDB meetups and conferences

#### **Development Tools**
- **MongoDB Compass**: GUI for database management
- **MongoDB for VS Code**: IDE extension for development
- **Studio 3T**: Third-party MongoDB GUI
- **NoSQLBooster**: Advanced MongoDB client

### Lab Environment Persistence

If you want to keep your lab environment for future practice:

#### **Save Container State**
```bash
# Create images from current containers
docker commit mongo1 my-mongodb-lab:mongo1
docker commit mongo2 my-mongodb-lab:mongo2
docker commit mongo3 my-mongodb-lab:mongo3

# Save to tar files
docker save my-mongodb-lab:mongo1 > mongo1-lab.tar
docker save my-mongodb-lab:mongo2 > mongo2-lab.tar
docker save my-mongodb-lab:mongo3 > mongo3-lab.tar
```

#### **Export Data**
```bash
# Export all databases
mongodump --host "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0" --out ./mongodb-labs-backup

# Restore later
mongorestore --host "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0" ./mongodb-labs-backup
```

#### **Document Configurations**
Save your:
- Docker network configurations
- Replica set configurations
- Sharding setup scripts
- Compass connection strings
- C# project templates

### Final Assessment

Congratulations! You have successfully completed the MongoDB Day 3 Advanced Features labs. You now possess:

#### **Technical Skills**
- ✅ ACID transaction implementation and error handling
- ✅ High-availability replica set configuration and management
- ✅ Horizontal scaling with sharded cluster deployment
- ✅ Real-time application development with change streams
- ✅ Professional application integration with C# and MongoDB

#### **Operational Skills**
- ✅ MongoDB Compass proficiency for database management
- ✅ Performance monitoring and troubleshooting
- ✅ Cluster health assessment and maintenance
- ✅ Data distribution analysis and optimization
- ✅ Production deployment best practices

#### **Strategic Understanding**
- ✅ When and how to implement each MongoDB feature
- ✅ Trade-offs between consistency, availability, and performance
- ✅ Scaling strategies for different application requirements
- ✅ Integration patterns for enterprise applications
- ✅ Monitoring and alerting for production systems

### Certificate of Completion

**MongoDB Advanced Features Mastery**

*This certifies that you have successfully completed comprehensive hands-on training in:*

- **MongoDB Transactions**: ACID compliance and data consistency
- **Replica Sets**: High availability and disaster recovery
- **Sharding**: Horizontal scaling and data distribution
- **Change Streams**: Real-time application development
- **Professional Integration**: Production-ready application development

*You are now qualified to design, implement, and maintain advanced MongoDB solutions in production environments.*

---

## Thank You!

🎉 **Congratulations on completing MongoDB Day 3 Advanced Features!**

You've transformed from a MongoDB user to a MongoDB professional, capable of architecting and implementing enterprise-scale database solutions. The skills you've learned today will serve you well in building the next generation of data-driven applications.

### Keep Learning, Keep Building!

The MongoDB ecosystem is constantly evolving with new features, optimizations, and capabilities. Continue exploring, experimenting, and building amazing applications with MongoDB.

**Happy Coding!** 🚀
