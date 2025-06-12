# MongoDB Day 3 Labs: Advanced Features 
*5 hands-on labs covering Transactions, Replication, Sharding, Change Streams, and C# API*

---

## Prerequisites

### Environment Setup
- Docker Desktop installed and running
- MongoDB Compass (optional but recommended)
- .NET 8 SDK (for C# lab)
- Visual Studio Code

---

## Lab 1: MongoDB Transactions (45 minutes)

### Learning Objectives
- Understand ACID transactions in MongoDB
- Implement multi-document transactions
- Handle transaction errors and rollbacks
- Practice real-world transaction scenarios

### Part A: Setup Replica Set for Transactions (10 minutes)

#### 1. Start Replica Set Nodes
```bash
# Start three MongoDB nodes for replica set
docker run -d --name mongo1 -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo2 -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo3 -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all
```

#### 2. Initialize Replica Set
```bash
# Wait for containers to start
sleep 10

# Initialize replica set
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: '127.0.0.1:27017' },
    { _id: 1, host: '127.0.0.1:27018' },
    { _id: 2, host: '127.0.0.1:27019' }
  ]
})
"

# Verify replica set status
docker exec -it mongo1 mongosh --eval "rs.status()"
```

### Part B: Basic Transaction Operations (25 minutes)

#### 3. Create E-commerce Database Structure
```javascript
// Connect to primary
docker exec -it mongo1 mongosh

// Switch to ecommerce database
use ecommerce

// Create collections with sample data
db.products.insertMany([
  { _id: "prod1", name: "Laptop", price: 999.99, stock: 10 },
  { _id: "prod2", name: "Mouse", price: 29.99, stock: 50 },
  { _id: "prod3", name: "Keyboard", price: 79.99, stock: 25 }
])

db.customers.insertMany([
  { _id: "cust1", name: "John Doe", email: "john@example.com", balance: 1200.00 },
  { _id: "cust2", name: "Jane Smith", email: "jane@example.com", balance: 800.00 }
])

// Create orders collection with unique index
db.orders.createIndex({ orderId: 1 }, { unique: true })
```

#### 4. Implement Order Processing Transaction
```javascript
// Function to process an order with transaction
function processOrder(customerId, items) {
  const session = db.getMongo().startSession();
  
  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });
    
    const orderId = new ObjectId();
    let totalAmount = 0;
    
    // Validate customer exists and has sufficient balance
    const customer = db.customers.findOne(
      { _id: customerId },
      { session: session }
    );
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Process each item
    for (let item of items) {
      // Check product availability
      const product = db.products.findOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { session: session }
      );
      
      if (!product) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
      
      totalAmount += product.price * item.quantity;
      
      // Update product stock
      db.products.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } },
        { session: session }
      );
    }
    
    // Check customer balance
    if (customer.balance < totalAmount) {
      throw new Error("Insufficient customer balance");
    }
    
    // Update customer balance
    db.customers.updateOne(
      { _id: customerId },
      { $inc: { balance: -totalAmount } },
      { session: session }
    );
    
    // Create order
    db.orders.insertOne({
      _id: orderId,
      customerId: customerId,
      items: items,
      totalAmount: totalAmount,
      status: "completed",
      orderDate: new Date()
    }, { session: session });
    
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

// Test successful order
var result1 = processOrder("cust1", [
  { productId: "prod1", quantity: 1 },
  { productId: "prod2", quantity: 2 }
]);

// Test order with insufficient stock
var result2 = processOrder("cust2", [
  { productId: "prod1", quantity: 15 }  // Only 9 left in stock
]);

// Test order with insufficient balance
var result3 = processOrder("cust2", [
  { productId: "prod1", quantity: 1 }  // Costs $999.99 but customer has $800
]);
```

### Part C: Advanced Transaction Scenarios (10 minutes)

#### 5. Money Transfer Transaction
```javascript
// Bank transfer simulation
function transferMoney(fromAccount, toAccount, amount) {
  const session = db.getMongo().startSession();
  
  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });
    
    // Debit from source account
    const debitResult = db.customers.updateOne(
      { 
        _id: fromAccount, 
        balance: { $gte: amount } 
      },
      { $inc: { balance: -amount } },
      { session: session }
    );
    
    if (debitResult.matchedCount === 0) {
      throw new Error("Insufficient funds or account not found");
    }
    
    // Credit to destination account
    const creditResult = db.customers.updateOne(
      { _id: toAccount },
      { $inc: { balance: amount } },
      { session: session }
    );
    
    if (creditResult.matchedCount === 0) {
      throw new Error("Destination account not found");
    }
    
    // Log transaction
    db.transactions.insertOne({
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      timestamp: new Date(),
      type: "transfer"
    }, { session: session });
    
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
db.transactions.createIndex({ timestamp: -1 })

// Test transfer
transferMoney("cust2", "cust1", 100.00);

// Verify balances
db.customers.find({}, { name: 1, balance: 1 });
```

---

## Lab 2: Replica Sets and High Availability (45 minutes)

### Learning Objectives
- Configure and manage MongoDB replica sets
- Understand failover and recovery mechanisms
- Implement read preferences and write concerns
- Monitor replica set health and performance

### Part A: Advanced Replica Set Configuration (20 minutes)

#### 1. Add Arbiter and Hidden Member
```bash
# Add arbiter node (no data, voting only)
docker run -d --name mongo-arbiter -p 27020:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Add hidden member (data replication, no client reads)
docker run -d --name mongo-hidden -p 27021:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Wait for containers to start
sleep 5
```

#### 2. Reconfigure Replica Set with Special Members
```javascript
// Connect to primary
docker exec -it mongo1 mongosh

// Add arbiter
rs.add({
  _id: 3,
  host: "127.0.0.1:27020",
  arbiterOnly: true
})

// Add hidden member
rs.add({
  _id: 4,
  host: "127.0.0.1:27021",
  priority: 0,
  hidden: true,
  votes: 0
})

// Check configuration
rs.conf()
rs.status()
```

#### 3. Configure Member Priorities and Tags
```javascript
// Get current configuration
var config = rs.conf();

// Set priorities (higher number = preferred primary)
config.members[0].priority = 3;  // Primary preference
config.members[1].priority = 2;  // Secondary preference
config.members[2].priority = 1;  // Lower priority

// Add tags for geographic distribution simulation
config.members[0].tags = { datacenter: "dc1", region: "east" };
config.members[1].tags = { datacenter: "dc2", region: "west" };
config.members[2].tags = { datacenter: "dc3", region: "east" };
config.members[4].tags = { datacenter: "dc1", region: "east", usage: "analytics" };

// Apply configuration
rs.reconfig(config);

// Verify changes
rs.conf();
```

### Part B: Failover Testing and Read Preferences (15 minutes)

#### 4. Test Automatic Failover
```bash
# Check current primary
docker exec -it mongo1 mongosh --eval "
var primary = rs.status().members.filter(m => m.state === 1)[0];
print('Current primary: ' + primary.name);
"

# Simulate primary failure
docker stop mongo1

# Monitor election process (run this in a loop)
docker exec -it mongo2 mongosh --eval "
var status = rs.status();
var primary = status.members.filter(m => m.state === 1)[0];
if (primary) {
  print(new Date() + ' - New primary: ' + primary.name);
} else {
  print(new Date() + ' - Election in progress...');
}
"

# Wait 30 seconds for election, then restart failed node
sleep 30
docker start mongo1

# Observe original primary becomes secondary
sleep 10
docker exec -it mongo1 mongosh --eval "rs.status().members[0]"
```

#### 5. Implement Read Preferences
```javascript
// Connect to the replica set
// Use any available node, MongoDB driver will find primary

use ecommerce

// Test different read preferences
// Primary read preference (default)
db.products.find().readPref("primary");

// Secondary preferred - read from secondary if available
db.products.find().readPref("secondaryPreferred");

// Nearest - read from member with lowest network latency
db.products.find().readPref("nearest");

// Secondary with tags - read from specific tagged members
db.products.find().readPref("secondary", [
  { "datacenter": "dc1" },
  { "region": "east" }
]);

// Read from analytics member only
db.products.find().readPref("secondary", [
  { "usage": "analytics" }
]);
```

#### 6. Write Concerns and Read Concerns
```javascript
// Test various write concerns
use ecommerce

// Default write concern
db.test_writes.insertOne({ test: "default", timestamp: new Date() });

// Majority write concern (wait for majority of replica set)
db.test_writes.insertOne(
  { test: "majority", timestamp: new Date() },
  { writeConcern: { w: "majority" } }
);

// Write concern with timeout
db.test_writes.insertOne(
  { test: "majority_timeout", timestamp: new Date() },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
);

// Journal write concern (wait for write to journal)
db.test_writes.insertOne(
  { test: "journal", timestamp: new Date() },
  { writeConcern: { w: 1, j: true } }
);

// Test read concerns
db.test_writes.find().readConcern("local");      // Read from local replica
db.test_writes.find().readConcern("majority");   // Read majority-committed data
```

### Part C: Monitoring and Maintenance (10 minutes)

#### 7. Replica Set Monitoring
```javascript
// Comprehensive monitoring script
function monitorReplicaSet() {
  print("=== Replica Set Monitoring ===");
  
  // Basic status
  var status = rs.status();
  print("Replica Set: " + status.set);
  print("Date: " + status.date);
  
  // Member status
  print("\n--- Member Status ---");
  status.members.forEach(function(member) {
    print(`${member.name}: ${member.stateStr} (Health: ${member.health})`);
    if (member.optimeDate) {
      print(`  Last Optime: ${member.optimeDate}`);
    }
    if (member.lastHeartbeat) {
      print(`  Last Heartbeat: ${member.lastHeartbeat}`);
    }
  });
  
  // Replication lag
  print("\n--- Replication Lag ---");
  var primary = status.members.filter(m => m.state === 1)[0];
  if (primary) {
    status.members.filter(m => m.state === 2).forEach(function(secondary) {
      var lag = (primary.optimeDate - secondary.optimeDate) / 1000;
      print(`${secondary.name}: ${lag.toFixed(2)} seconds behind primary`);
    });
  }
  
  // Oplog information
  print("\n--- Oplog Information ---");
  var oplogStats = db.oplog.rs.stats();
  print(`Oplog Size: ${(oplogStats.size / 1024 / 1024).toFixed(2)} MB`);
  print(`Oplog Used: ${(oplogStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
  
  var firstOp = db.oplog.rs.find().sort({ ts: 1 }).limit(1).next();
  var lastOp = db.oplog.rs.find().sort({ ts: -1 }).limit(1).next();
  var oplogWindow = (lastOp.ts.getTime() - firstOp.ts.getTime()) / 1000 / 3600;
  print(`Oplog Window: ${oplogWindow.toFixed(2)} hours`);
}

// Run monitoring
monitorReplicaSet();
```

#### 8. Maintenance Operations
```javascript
// Step down primary for maintenance (forces new election)
rs.stepDown(60);  // Step down for 60 seconds

// Freeze a secondary to prevent it from becoming primary
rs.freeze(300);   // Freeze for 5 minutes

// Check if member is frozen
rs.status().members.filter(m => m.name.includes("27018"))[0]

// Reconfigure replica set settings
var config = rs.conf();
config.settings = config.settings || {};
config.settings.electionTimeoutMillis = 15000;  // 15 seconds
config.settings.heartbeatIntervalMillis = 3000;  // 3 seconds
rs.reconfig(config);
```

---

## Lab 3: Sharding and Horizontal Scaling (45 minutes)

### Learning Objectives
- Set up a sharded MongoDB cluster
- Choose appropriate shard keys
- Manage chunk distribution and balancing
- Monitor sharded cluster performance

### Part A: Sharded Cluster Setup (25 minutes)

#### 1. Start Config Server Replica Set
```bash
# Config servers (store cluster metadata)
docker run -d --name config1 -p 27100:27017 mongo:8.0 --configsvr --replSet configrs --bind_ip_all
docker run -d --name config2 -p 27101:27017 mongo:8.0 --configsvr --replSet configrs --bind_ip_all
docker run -d --name config3 -p 27102:27017 mongo:8.0 --configsvr --replSet configrs --bind_ip_all

# Wait for containers to start
sleep 10

# Initialize config server replica set
docker exec -it config1 mongosh --eval "
rs.initiate({
  _id: 'configrs',
  members: [
    { _id: 0, host: '127.0.0.1:27100' },
    { _id: 1, host: '127.0.0.1:27101' },
    { _id: 2, host: '127.0.0.1:27102' }
  ]
})
"
```

#### 2. Start Shard Replica Sets
```bash
# Shard 1 replica set
docker run -d --name shard1-1 -p 27201:27017 mongo:8.0 --shardsvr --replSet shard1rs --bind_ip_all
docker run -d --name shard1-2 -p 27202:27017 mongo:8.0 --shardsvr --replSet shard1rs --bind_ip_all
docker run -d --name shard1-3 -p 27203:27017 mongo:8.0 --shardsvr --replSet shard1rs --bind_ip_all

# Shard 2 replica set
docker run -d --name shard2-1 -p 27301:27017 mongo:8.0 --shardsvr --replSet shard2rs --bind_ip_all
docker run -d --name shard2-2 -p 27302:27017 mongo:8.0 --shardsvr --replSet shard2rs --bind_ip_all
docker run -d --name shard2-3 -p 27303:27017 mongo:8.0 --shardsvr --replSet shard2rs --bind_ip_all

# Wait for containers to start
sleep 10

# Initialize shard 1 replica set
docker exec -it shard1-1 mongosh --eval "
rs.initiate({
  _id: 'shard1rs',
  members: [
    { _id: 0, host: '127.0.0.1:27201' },
    { _id: 1, host: '127.0.0.1:27202' },
    { _id: 2, host: '127.0.0.1:27203' }
  ]
})
"

# Initialize shard 2 replica set
docker exec -it shard2-1 mongosh --eval "
rs.initiate({
  _id: 'shard2rs',
  members: [
    { _id: 0, host: '127.0.0.1:27301' },
    { _id: 1, host: '127.0.0.1:27302' },
    { _id: 2, host: '127.0.0.1:27303' }
  ]
})
"
```

#### 3. Start Query Routers (mongos)
```bash
# Query routers (mongos instances)
docker run -d --name mongos1 -p 27017:27017 mongo:8.0 mongos --configdb configrs/127.0.0.1:27100,127.0.0.1:27101,127.0.0.1:27102 --bind_ip_all
docker run -d --name mongos2 -p 27018:27017 mongo:8.0 mongos --configdb configrs/127.0.0.1:27100,127.0.0.1:27101,127.0.0.1:27102 --bind_ip_all

# Wait for mongos to start
sleep 10
```

#### 4. Add Shards to Cluster
```javascript
// Connect to mongos
docker exec -it mongos1 mongosh

// Add shards to the cluster
sh.addShard("shard1rs/127.0.0.1:27201,127.0.0.1:27202,127.0.0.1:27203")
sh.addShard("shard2rs/127.0.0.1:27301,127.0.0.1:27302,127.0.0.1:27303")

// Check cluster status
sh.status()
```

### Part B: Sharding Strategy and Implementation (15 minutes)

#### 5. Enable Sharding on Database and Collections
```javascript
// Enable sharding on the ecommerce database
sh.enableSharding("ecommerce")

// Create collections with different shard key strategies
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

#### 6. Load Test Data and Observe Distribution
```javascript
// Generate test data for users (hashed sharding)
use ecommerce
print("Generating user data...");
for (let i = 1; i <= 10000; i++) {
  db.users.insertOne({
    _id: `user${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
  });
  
  if (i % 2000 === 0) {
    print(`Inserted ${i} users`);
  }
}

// Generate test data for orders (range sharding)
print("Generating order data...");
var customers = ["user1", "user100", "user500", "user1000", "user2000"];
for (let i = 1; i <= 5000; i++) {
  var customerId = customers[Math.floor(Math.random() * customers.length)];
  var orderDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
  
  db.orders.insertOne({
    _id: `order${i}`,
    customerId: customerId,
    orderDate: orderDate,
    items: [
      { productId: `prod${Math.floor(Math.random() * 100)}`, quantity: Math.floor(Math.random() * 5) + 1 }
    ],
    total: Math.random() * 1000
  });
  
  if (i % 1000 === 0) {
    print(`Inserted ${i} orders`);
  }
}

// Generate geographic store data
print("Generating store data...");
var regions = ["north", "south", "east", "west"];
for (let i = 1; i <= 1000; i++) {
  var region = regions[Math.floor(Math.random() * regions.length)];
  
  db.stores.insertOne({
    region: region,
    storeId: `store${i}`,
    name: `Store ${i}`,
    address: `${i} Main St, ${region} region`,
    salesData: {
      monthly: Math.random() * 100000,
      quarterly: Math.random() * 300000
    }
  });
  
  if (i % 200 === 0) {
    print(`Inserted ${i} stores`);
  }
}
```

#### 7. Analyze Chunk Distribution
```javascript
// Check chunk distribution across shards
db.adminCommand("flushRouterConfig")
sh.status()

// Get detailed chunk information
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

#### 8. Zone Sharding for Geographic Distribution
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

#### 9. Manual Chunk Operations
```javascript
// Split chunks manually for better distribution
sh.splitAt("ecommerce.orders", { customerId: "user500", orderDate: new Date("2024-06-01") })

// Move chunks between shards (if needed)
sh.moveChunk(
  "ecommerce.orders",
  { customerId: "user1", orderDate: MinKey },
  "shard2rs"
)

// Check balancer operations
db.settings.find({ _id: "balancer" })

// Temporarily disable balancer
sh.stopBalancer()

// Re-enable balancer
sh.startBalancer()
```

---

## Lab 4: Change Streams for Real-time Applications (30 minutes)

### Learning Objectives
- Implement MongoDB change streams
- Build real-time notification systems
- Handle change stream resumption and fault tolerance
- Create event-driven application patterns

### Part A: Basic Change Streams (15 minutes)

#### 1. Setup Change Stream Environment
```javascript
// Connect to replica set from Lab 1
// Connection: mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0

use ecommerce

// Create collections for change stream testing
db.notifications.createIndex({ userId: 1, timestamp: -1 })
db.activity_log.createIndex({ timestamp: -1 })
```

#### 2. Basic Change Stream Implementation
```javascript
// Watch all changes on orders collection
print("Setting up change stream for orders collection...");

var orderChangeStream = db.orders.watch();

// Note: In a real application, this would be in a separate process
// For lab purposes, we'll demonstrate the concept

// Simulate change stream handling
function handleOrderChanges() {
  print("=== Order Change Stream Active ===");
  print("Watching for changes... (This is a simulation)");
  print("In production, this would run continuously in the background");
  print("=====================================\n");
}

handleOrderChanges();

// In another session, test the change stream by making changes
// For lab purposes, we'll create a function that processes changes
function simulateChangeStreamHandler(change) {
  print("=== Order Change Detected ===");
  print("Operation: " + change.operationType);
  print("Timestamp: " + new Date());
  
  switch(change.operationType) {
    case 'insert':
      print("New order created: " + change.fullDocument._id);
      print("Customer: " + change.fullDocument.customerId);
      print("Total: $" + change.fullDocument.total);
      
      // Create notification
      db.notifications.insertOne({
        userId: change.fullDocument.customerId,
        type: "order_created",
        message: `Your order ${change.fullDocument._id} has been created.`,
        orderId: change.fullDocument._id,
        timestamp: new Date(),
        read: false
      });
      break;
      
    case 'update':
      print("Order updated: " + change.documentKey._id);
      if (change.updateDescription && change.updateDescription.updatedFields.status) {
        print("Status changed to: " + change.updateDescription.updatedFields.status);
      }
      break;
      
    case 'delete':
      print("Order deleted: " + change.documentKey._id);
      break;
  }
  print("=================================\n");
}
```

#### 3. Test Change Stream with Order Operations
```javascript
// Test the change stream by creating, updating, and deleting orders
use ecommerce

// Insert a new order (would trigger change stream)
print("Creating test order...");
var testOrder = {
  _id: "order_test1",
  customerId: "cust1",
  orderDate: new Date(),
  items: [{ productId: "prod1", quantity: 1 }],
  total: 999.99,
  status: "pending"
};
db.orders.insertOne(testOrder);

// Simulate change stream processing
simulateChangeStreamHandler({
  operationType: "insert",
  fullDocument: testOrder,
  documentKey: { _id: "order_test1" }
});

// Update order status (would trigger change stream)
print("Updating order status...");
db.orders.updateOne(
  { _id: "order_test1" },
  { $set: { status: "processing" } }
);

// Simulate change stream processing
simulateChangeStreamHandler({
  operationType: "update",
  documentKey: { _id: "order_test1" },
  updateDescription: { updatedFields: { status: "processing" } }
});

// Check notifications created
print("Notifications created:");
db.notifications.find().forEach(printjson);
```

#### 4. Filtered Change Streams
```javascript
// Simulate filtered change streams for specific scenarios

// High-value orders filter
function isHighValueOrder(order) {
  return order.total >= 500;
}

// Process high-value order
function processHighValueOrder(order) {
  print("High-value order detected: $" + order.total);
  
  // Create admin notification
  db.notifications.insertOne({
    userId: "admin",
    type: "high_value_order",
    message: `High-value order received: ${order._id} ($${order.total})`,
    orderId: order._id,
    timestamp: new Date(),
    read: false
  });
  
  // Log for analytics
  db.activity_log.insertOne({
    event: "high_value_order",
    orderId: order._id,
    amount: order.total,
    timestamp: new Date()
  });
}

// Test with high-value order
var highValueOrder = {
  _id: "order_high1",
  customerId: "cust2",
  orderDate: new Date(),
  items: [{ productId: "prod1", quantity: 2 }],
  total: 1999.98,
  status: "pending"
};

db.orders.insertOne(highValueOrder);

if (isHighValueOrder(highValueOrder)) {
  processHighValueOrder(highValueOrder);
}
```

### Part B: Advanced Change Streams and Event-Driven Architecture (15 minutes)

#### 5. Order Processing System with Event Simulation
```javascript
// Complete order processing system simulation
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
      
      print(`✓ Order ${order._id} confirmed and processing`);
    } else {
      // Update order status to failed
      db.orders.updateOne(
        { _id: order._id },
        { $set: { status: "failed", reason: "Insufficient inventory", failedItems: unavailableItems } }
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
      
      print(`✗ Order ${order._id} failed - insufficient inventory`);
    }
  },
  
  // Handle status changes
  handleStatusChange: function(orderId, newStatus) {
    print(`Order ${orderId} status changed to: ${newStatus}`);
    
    var order = db.orders.findOne({ _id: orderId });
    if (order) {
      // Send notification to customer
      db.notifications.insertOne({
        userId: order.customerId,
        type: "status_update",
        message: `Your order ${orderId} status has been updated to: ${newStatus}`,
        orderId: orderId,
        timestamp: new Date(),
        read: false
      });
      
      // If completed, update customer stats
      if (newStatus === "completed") {
        db.customers.updateOne(
          { _id: order.customerId },
          { 
            $inc: { totalOrders: 1, totalSpent: order.total },
            $set: { lastOrderDate: new Date() }
          }
        );
        print(`✓ Customer ${order.customerId} stats updated`);
      }
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
      
      print(`⚠ Low inventory alert for ${productId}`);
    }
  }
};

// Test the order processing system
print("=== Testing Order Processing System ===");

// Create a new order
var newOrder = {
  _id: "order_system_test1",
  customerId: "cust1",
  orderDate: new Date(),
  items: [{ productId: "prod2", quantity: 2 }],  // Should have stock
  total: 59.98,
  status: "pending"
};

db.orders.insertOne(newOrder);
OrderProcessor.processNewOrder(newOrder);

// Test status change
OrderProcessor.handleStatusChange("order_system_test1", "shipped");
OrderProcessor.handleStatusChange("order_system_test1", "completed");

// Test inventory change
OrderProcessor.handleInventoryChange("prod2", 3);  // Should trigger low stock alert

// Test order with insufficient stock
var failedOrder = {
  _id: "order_system_test2",
  customerId: "cust2",
  orderDate: new Date(),
  items: [{ productId: "prod1", quantity: 20 }],  // More than available stock
  total: 19999.80,
  status: "pending"
};

db.orders.insertOne(failedOrder);
OrderProcessor.processNewOrder(failedOrder);
```

#### 6. Resume Token Simulation and Fault Tolerance
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
  
  // Simulate processing with resume token
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
    
    print(`✓ Change processed and resume token saved`);
  }
};

// Test resume token functionality
print("=== Testing Resume Token Functionality ===");

// Simulate change stream events
var simulatedChanges = [
  {
    _id: { _data: "token1" },
    operationType: "insert",
    ns: { db: "ecommerce", coll: "orders" },
    documentKey: { _id: "order_resume1" }
  },
  {
    _id: { _data: "token2" },
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

---

## Lab 5: C# MongoDB API Introduction (30 minutes)

### Learning Objectives
- Set up MongoDB C# driver
- Implement basic CRUD operations in C#
- Work with strongly-typed models
- Handle async operations and error handling

### Part A: C# Project Setup (10 minutes)

#### 1. Create New C# Console Application
```bash
# Create new console application
mkdir MongoDBCSharpLab
cd MongoDBCSharpLab
dotnet new console
dotnet add package MongoDB.Driver
```

#### 2. Create MongoDB Models
```csharp
// Models/Product.cs
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

// Models/Customer.cs
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

#### 3. Create Database Service
```csharp
// Services/MongoDBService.cs
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

### Part B: CRUD Operations in C# (15 minutes)

#### 4. Implement Product Service
```csharp
// Services/ProductService.cs
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

#### 5. Main Program Implementation
```csharp
// Program.cs
using MongoDBCSharpLab.Models;
using MongoDBCSharpLab.Services;

class Program
{
    // Updated connection string for simplified setup (no authentication)
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
            Console.WriteLine($"Error: {ex.Message}");
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
            }
        };
        
        // INSERT
        Console.WriteLine("Creating products...");
        await productService.CreateProductsAsync(products);
        Console.WriteLine($"Created {products.Count} products\n");
        
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
        
        // UPDATE
        if (allProducts.Any())
        {
            var firstProduct = allProducts.First();
            Console.WriteLine($"Updating price of {firstProduct.Name}...");
            await productService.UpdateProductPriceAsync(firstProduct.Id!, 99.99m);
            
            var updatedProduct = await productService.GetProductByIdAsync(firstProduct.Id!);
            Console.WriteLine($"New price: ${updatedProduct?.Price}\n");
        }
        
        // PRICE RANGE QUERY
        Console.WriteLine("Products between $40 and $100:");
        var priceRangeProducts = await productService.GetProductsByPriceRangeAsync(40m, 100m);
        foreach (var product in priceRangeProducts)
        {
            Console.WriteLine($"- {product.Name}: ${product.Price}");
        }
        Console.WriteLine();
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

### Part C: Error Handling and Best Practices (5 minutes)

#### 6. Enhanced Error Handling
```csharp
// Services/ResilientProductService.cs
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
                    Console.WriteLine($"Attempt {attempt} failed. Retrying in {delay.TotalSeconds} seconds...");
                    await Task.Delay(delay);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Non-transient error: {ex.Message}");
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
            
            // This would demonstrate retry logic in case of network issues
            try
            {
                var product = await GetProductByIdWithRetryAsync("nonexistent_id");
                Console.WriteLine($"Product found: {product?.Name ?? "None"}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Operation failed after retries: {ex.Message}");
            }
        }
    }
}
```

#### 7. Run the Application
```bash
# Build and run the application
dotnet build
dotnet run
```

---

## Lab Cleanup

### Stop All Containers
```bash
# Stop replica set containers (Lab 1 & 2)
docker stop mongo1 mongo2 mongo3 mongo-arbiter mongo-hidden
docker rm mongo1 mongo2 mongo3 mongo-arbiter mongo-hidden

# Stop sharding containers (Lab 3)
docker stop config1 config2 config3
docker stop shard1-1 shard1-2 shard1-3 shard2-1 shard2-2 shard2-3
docker stop mongos1 mongos2
docker rm config1 config2 config3
docker rm shard1-1 shard1-2 shard1-3 shard2-1 shard2-2 shard2-3
docker rm mongos1 mongos2

# Clean up system
docker system prune -f
```

---

## Lab Summary and Integration

### What You've Accomplished

#### 🔄 **Transactions (Lab 1)**
- Set up replica set using simplified Docker commands
- Implemented ACID-compliant order processing
- Built money transfer system with rollback capabilities
- Handled transaction errors and edge cases

#### 🔧 **Replication (Lab 2)**
- Extended replica set with arbiter and hidden members
- Tested automatic failover mechanisms
- Configured read preferences and write concerns
- Implemented comprehensive monitoring

#### ⚡ **Sharding (Lab 3)**
- Built complete sharded cluster architecture
- Implemented different sharding strategies
- Configured zone sharding for geographic distribution
- Managed chunk distribution and balancing

#### 📡 **Change Streams (Lab 4)**
- Created real-time notification systems
- Built event-driven order processing
- Implemented resumable change streams
- Developed fault-tolerant stream processing

#### 💻 **C# Integration (Lab 5)**
- Set up MongoDB C# driver without authentication complexity
- Implemented strongly-typed models and services
- Built resilient operations with retry logic
- Created complete CRUD and aggregation examples

### Production Readiness Checklist

- [ ] **High Availability**: Replica sets with proper failover ✓
- [ ] **Scalability**: Sharding strategy implemented ✓
- [ ] **Real-time Processing**: Change streams for event-driven architecture ✓
- [ ] **Application Integration**: C# driver implementation ✓
- [ ] **Error Handling**: Resilient error handling and retry logic ✓
- [ ] **Monitoring**: Health checks and performance monitoring ✓

### Next Steps

1. **Add Authentication**: Implement authentication for production use
2. **Performance Testing**: Load test your implementations
3. **Production Deployment**: Deploy to staging/production environments
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **Backup Strategy**: Implement automated backup procedures

**Congratulations!** You've successfully completed all MongoDB Day 3 advanced labs and are now ready to build production-scale MongoDB applications.
