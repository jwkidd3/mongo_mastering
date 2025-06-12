# MongoDB Day 3 Labs: Advanced Features
*5 hands-on labs covering Transactions, Replication, Sharding, Change Streams, and C# API*

---

## Prerequisites

### Environment Setup
- Docker Desktop installed and running
- Docker Compose available
- MongoDB Compass (optional but recommended)
- .NET 8 SDK (for C# lab)
- Visual Studio Code

### Base Docker Network
```bash
# Create dedicated network for MongoDB labs
docker network create mongodb-lab-network
```

---

## Lab 1: MongoDB Transactions (45 minutes)

### Learning Objectives
- Understand ACID transactions in MongoDB
- Implement multi-document transactions
- Handle transaction errors and rollbacks
- Practice real-world transaction scenarios

### Part A: Setup Replica Set for Transactions (15 minutes)

#### 1. Create Docker Compose for Replica Set
```yaml
# docker-compose-replica.yml
version: '3.8'

services:
  mongo-primary:
    image: mongo:7.0
    container_name: mongo-primary
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    command: |
      mongod --replSet rs0 --bind_ip_all --keyFile /opt/keyfile/mongodb-keyfile
    volumes:
      - ./keyfile:/opt/keyfile
      - mongo-primary-data:/data/db
    networks:
      - mongodb-lab-network

  mongo-secondary1:
    image: mongo:7.0
    container_name: mongo-secondary1
    restart: always
    ports:
      - "27018:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    command: |
      mongod --replSet rs0 --bind_ip_all --keyFile /opt/keyfile/mongodb-keyfile
    volumes:
      - ./keyfile:/opt/keyfile
      - mongo-secondary1-data:/data/db
    networks:
      - mongodb-lab-network

  mongo-secondary2:
    image: mongo:7.0
    container_name: mongo-secondary2
    restart: always
    ports:
      - "27019:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    command: |
      mongod --replSet rs0 --bind_ip_all --keyFile /opt/keyfile/mongodb-keyfile
    volumes:
      - ./keyfile:/opt/keyfile
      - mongo-secondary2-data:/data/db
    networks:
      - mongodb-lab-network

volumes:
  mongo-primary-data:
  mongo-secondary1-data:
  mongo-secondary2-data:

networks:
  mongodb-lab-network:
    external: true
```

#### 2. Create Keyfile for Authentication
```bash
# Create keyfile directory
mkdir keyfile

# Generate keyfile (Linux/Mac)
openssl rand -base64 756 > keyfile/mongodb-keyfile

# For Windows (PowerShell)
# $bytes = New-Object byte[] 1024
# $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
# $rng.GetBytes($bytes)
# [System.Convert]::ToBase64String($bytes) | Out-File -Encoding ASCII keyfile/mongodb-keyfile

# Set proper permissions
chmod 400 keyfile/mongodb-keyfile
```

#### 3. Start Replica Set
```bash
# Start the replica set
docker-compose -f docker-compose-replica.yml up -d

# Wait for containers to be ready
sleep 10

# Initialize replica set
docker exec -it mongo-primary mongosh --username admin --password password123 --authenticationDatabase admin --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo-primary:27017' },
    { _id: 1, host: 'mongo-secondary1:27017' },
    { _id: 2, host: 'mongo-secondary2:27017' }
  ]
})
"

# Check replica set status
docker exec -it mongo-primary mongosh --username admin --password password123 --authenticationDatabase admin --eval "rs.status()"
```

### Part B: Basic Transaction Operations (20 minutes)

#### 4. Create E-commerce Database Structure
```javascript
// Connect to primary
docker exec -it mongo-primary mongosh --username admin --password password123 --authenticationDatabase admin

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

// Create orders collection (empty initially)
db.orders.createIndex({ orderId: 1 }, { unique: true })
```

#### 5. Implement Order Processing Transaction
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

#### 6. Money Transfer Transaction
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

### Deliverables
- Functioning replica set with authentication
- Order processing system with transaction integrity
- Money transfer system demonstrating ACID properties
- Error handling for various failure scenarios

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
# Add arbiter container
cat >> docker-compose-replica.yml << 'EOF'

  mongo-arbiter:
    image: mongo:7.0
    container_name: mongo-arbiter
    restart: always
    ports:
      - "27020:27017"
    command: |
      mongod --replSet rs0 --bind_ip_all --keyFile /opt/keyfile/mongodb-keyfile
    volumes:
      - ./keyfile:/opt/keyfile
    networks:
      - mongodb-lab-network

  mongo-hidden:
    image: mongo:7.0
    container_name: mongo-hidden
    restart: always
    ports:
      - "27021:27017"
    command: |
      mongod --replSet rs0 --bind_ip_all --keyFile /opt/keyfile/mongodb-keyfile
    volumes:
      - ./keyfile:/opt/keyfile
      - mongo-hidden-data:/data/db
    networks:
      - mongodb-lab-network
EOF

# Update volumes section
cat >> docker-compose-replica.yml << 'EOF'
  mongo-hidden-data:
EOF

# Restart to add new members
docker-compose -f docker-compose-replica.yml up -d
```

#### 2. Reconfigure Replica Set with Special Members
```javascript
// Connect to primary
docker exec -it mongo-primary mongosh --username admin --password password123 --authenticationDatabase admin

// Add arbiter
rs.add({
  _id: 3,
  host: "mongo-arbiter:27017",
  arbiterOnly: true
})

// Add hidden member
rs.add({
  _id: 4,
  host: "mongo-hidden:27017",
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

// Set priorities
config.members[0].priority = 3;  // Primary preference
config.members[1].priority = 2;  // Secondary preference
config.members[2].priority = 1;  // Lower priority

// Add tags for geographic distribution
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
```javascript
// Check current primary
rs.status().members.filter(m => m.state === 1)[0].name

// In another terminal, simulate primary failure
docker stop mongo-primary

// Monitor election process
docker exec -it mongo-secondary1 mongosh --username admin --password password123 --authenticationDatabase admin --eval "
while(true) {
  try {
    var status = rs.status();
    var primary = status.members.filter(m => m.state === 1)[0];
    if (primary) {
      print(new Date() + ' - Primary: ' + primary.name);
      break;
    } else {
      print(new Date() + ' - No primary found, election in progress...');
    }
  } catch(e) {
    print(new Date() + ' - Error: ' + e);
  }
  sleep(2000);
}
"

// Restart the failed primary
docker start mongo-primary

// Observe it becomes secondary
sleep 5
docker exec -it mongo-primary mongosh --username admin --password password123 --authenticationDatabase admin --eval "rs.status().members.filter(m => m.name.includes('mongo-primary'))[0]"
```

#### 5. Implement Read Preferences
```javascript
// Connect to the replica set
// Use connection string: mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/ecommerce?authSource=admin&replicaSet=rs0

// Test different read preferences
use ecommerce

// Primary read preference (default)
db.products.find().readPref("primary");

// Secondary preferred
db.products.find().readPref("secondaryPreferred");

// Nearest with tags
db.products.find().readPref("nearest", [
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

// Majority write concern
db.test_writes.insertOne(
  { test: "majority", timestamp: new Date() },
  { writeConcern: { w: "majority" } }
);

// Write concern with timeout
db.test_writes.insertOne(
  { test: "majority_timeout", timestamp: new Date() },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
);

// Journal write concern
db.test_writes.insertOne(
  { test: "journal", timestamp: new Date() },
  { writeConcern: { w: 1, j: true } }
);

// Test read concerns
db.test_writes.find().readConcern("local");
db.test_writes.find().readConcern("majority");
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
// Step down primary for maintenance
rs.stepDown(60);  // Step down for 60 seconds

// Freeze a secondary to prevent it from becoming primary
rs.freeze(300);   // Freeze for 5 minutes

// Check if member is frozen
rs.status().members.filter(m => m.name.includes("secondary1"))[0].health

// Force a member to sync (resync)
// Note: This is destructive and removes all data
// rs.remove("mongo-secondary2:27017");
// rs.add("mongo-secondary2:27017");

// Reconfigure replica set settings
var config = rs.conf();
config.settings = config.settings || {};
config.settings.electionTimeoutMillis = 15000;  // 15 seconds
config.settings.heartbeatIntervalMillis = 3000;  // 3 seconds
rs.reconfig(config);
```

### Deliverables
- Replica set with arbiter and hidden member
- Failover testing documentation
- Read preference configuration examples
- Monitoring scripts for replica set health

---

## Lab 3: Sharding and Horizontal Scaling (45 minutes)

### Learning Objectives
- Set up a sharded MongoDB cluster
- Choose appropriate shard keys
- Manage chunk distribution and balancing
- Monitor sharded cluster performance

### Part A: Sharded Cluster Setup (25 minutes)

#### 1. Create Sharded Cluster Docker Compose
```yaml
# docker-compose-sharded.yml
version: '3.8'

services:
  # Config Server Replica Set
  config1:
    image: mongo:7.0
    container_name: config1
    command: mongod --configsvr --replSet configrs --port 27017 --bind_ip_all
    volumes:
      - config1-data:/data/db
    networks:
      - mongodb-lab-network

  config2:
    image: mongo:7.0
    container_name: config2
    command: mongod --configsvr --replSet configrs --port 27017 --bind_ip_all
    volumes:
      - config2-data:/data/db
    networks:
      - mongodb-lab-network

  config3:
    image: mongo:7.0
    container_name: config3
    command: mongod --configsvr --replSet configrs --port 27017 --bind_ip_all
    volumes:
      - config3-data:/data/db
    networks:
      - mongodb-lab-network

  # Shard 1 Replica Set
  shard1-1:
    image: mongo:7.0
    container_name: shard1-1
    command: mongod --shardsvr --replSet shard1rs --port 27017 --bind_ip_all
    volumes:
      - shard1-1-data:/data/db
    networks:
      - mongodb-lab-network

  shard1-2:
    image: mongo:7.0
    container_name: shard1-2
    command: mongod --shardsvr --replSet shard1rs --port 27017 --bind_ip_all
    volumes:
      - shard1-2-data:/data/db
    networks:
      - mongodb-lab-network

  shard1-3:
    image: mongo:7.0
    container_name: shard1-3
    command: mongod --shardsvr --replSet shard1rs --port 27017 --bind_ip_all
    volumes:
      - shard1-3-data:/data/db
    networks:
      - mongodb-lab-network

  # Shard 2 Replica Set
  shard2-1:
    image: mongo:7.0
    container_name: shard2-1
    command: mongod --shardsvr --replSet shard2rs --port 27017 --bind_ip_all
    volumes:
      - shard2-1-data:/data/db
    networks:
      - mongodb-lab-network

  shard2-2:
    image: mongo:7.0
    container_name: shard2-2
    command: mongod --shardsvr --replSet shard2rs --port 27017 --bind_ip_all
    volumes:
      - shard2-2-data:/data/db
    networks:
      - mongodb-lab-network

  shard2-3:
    image: mongo:7.0
    container_name: shard2-3
    command: mongod --shardsvr --replSet shard2rs --port 27017 --bind_ip_all
    volumes:
      - shard2-3-data:/data/db
    networks:
      - mongodb-lab-network

  # Query Routers
  mongos1:
    image: mongo:7.0
    container_name: mongos1
    command: mongos --configdb configrs/config1:27017,config2:27017,config3:27017 --bind_ip_all --port 27017
    ports:
      - "27017:27017"
    depends_on:
      - config1
      - config2
      - config3
    networks:
      - mongodb-lab-network

  mongos2:
    image: mongo:7.0
    container_name: mongos2
    command: mongos --configdb configrs/config1:27017,config2:27017,config3:27017 --bind_ip_all --port 27017
    ports:
      - "27018:27017"
    depends_on:
      - config1
      - config2
      - config3
    networks:
      - mongodb-lab-network

volumes:
  config1-data:
  config2-data:
  config3-data:
  shard1-1-data:
  shard1-2-data:
  shard1-3-data:
  shard2-1-data:
  shard2-2-data:
  shard2-3-data:

networks:
  mongodb-lab-network:
    external: true
```

#### 2. Initialize Sharded Cluster
```bash
# Start all containers
docker-compose -f docker-compose-sharded.yml up -d

# Wait for containers to start
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

# Wait for replica sets to be ready
sleep 10
```

#### 3. Add Shards to Cluster
```javascript
// Connect to mongos
docker exec -it mongos1 mongosh

// Add shards to the cluster
sh.addShard("shard1rs/shard1-1:27017,shard1-2:27017,shard1-3:27017")
sh.addShard("shard2rs/shard2-1:27017,shard2-2:27017,shard2-3:27017")

// Check cluster status
sh.status()
```

### Part B: Sharding Strategy and Implementation (15 minutes)

#### 4. Enable Sharding on Database and Collections
```javascript
// Enable sharding on the ecommerce database
sh.enableSharding("ecommerce")

// Create collections with different shard key strategies
use ecommerce

// 1. Hashed sharding for even distribution
db.users.createIndex({ _id: "hashed" })
sh.shardCollection("ecommerce.users", { _id: "hashed" })

// 2. Range-based sharding for queries
db.orders.createIndex({ customerId: 1, orderDate: 1 })
sh.shardCollection("ecommerce.orders", { customerId: 1, orderDate: 1 })

// 3. Geographic sharding
db.stores.createIndex({ region: 1, storeId: 1 })
sh.shardCollection("ecommerce.stores", { region: 1, storeId: 1 })

// Check sharding status
sh.status()
```

#### 5. Load Test Data and Observe Distribution
```javascript
// Generate test data for users (hashed sharding)
use ecommerce
for (let i = 1; i <= 10000; i++) {
  db.users.insertOne({
    _id: `user${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
  });
  
  if (i % 1000 === 0) {
    print(`Inserted ${i} users`);
  }
}

// Generate test data for orders (range sharding)
var customers = ["user1", "user2", "user3", "user4", "user5"];
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

#### 6. Analyze Chunk Distribution
```javascript
// Check chunk distribution across shards
db.adminCommand("flushRouterConfig")
sh.status()

// Get detailed chunk information
use config
db.chunks.find({ ns: "ecommerce.users" }).count()
db.chunks.find({ ns: "ecommerce.orders" }).count()
db.chunks.find({ ns: "ecommerce.stores" }).count()

// Check chunks per shard
db.chunks.aggregate([
  { $group: { _id: "$shard", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Check balancer status
sh.getBalancerState()
sh.isBalancerRunning()
```

### Part C: Shard Management and Zone Sharding (5 minutes)

#### 7. Zone Sharding for Geographic Distribution
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

#### 8. Manual Chunk Operations
```javascript
// Split chunks manually
sh.splitAt("ecommerce.orders", { customerId: "user3", orderDate: new Date("2024-06-01") })

// Move chunks between shards
sh.moveChunk(
  "ecommerce.orders",
  { customerId: "user1", orderDate: MinKey },
  "shard2rs"
)

// Check balancer operations
db.settings.find({ _id: "balancer" })

// Disable balancer temporarily
sh.stopBalancer()

// Re-enable balancer
sh.startBalancer()
```

### Deliverables
- Functioning sharded cluster with multiple shards
- Different sharding strategies implemented
- Zone sharding configuration for geographic distribution
- Chunk distribution analysis and management scripts

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
// Connect to replica set (reuse from Lab 1)
// Connection string: mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/ecommerce?authSource=admin&replicaSet=rs0

use ecommerce

// Create collections for change stream testing
db.notifications.createIndex({ userId: 1, timestamp: -1 })
db.activity_log.createIndex({ timestamp: -1 })
```

#### 2. Basic Change Stream Implementation
```javascript
// Watch all changes on orders collection
var orderChangeStream = db.orders.watch();

// Set up change handler
orderChangeStream.on('change', function(change) {
  print("=== Order Change Detected ===");
  print("Operation: " + change.operationType);
  print("Timestamp: " + change.clusterTime);
  
  switch(change.operationType) {
    case 'insert':
      print("New order created: " + change.fullDocument._id);
      print("Customer: " + change.fullDocument.customerId);
      print("Total: $" + change.fullDocument.total);
      break;
      
    case 'update':
      print("Order updated: " + change.documentKey._id);
      if (change.updateDescription.updatedFields.status) {
        print("Status changed to: " + change.updateDescription.updatedFields.status);
      }
      break;
      
    case 'delete':
      print("Order deleted: " + change.documentKey._id);
      break;
  }
  print("=================================\n");
});

// In another session, test the change stream
use ecommerce

// Insert a new order (should trigger change stream)
db.orders.insertOne({
  _id: "order_test1",
  customerId: "cust1",
  orderDate: new Date(),
  items: [{ productId: "prod1", quantity: 1 }],
  total: 999.99,
  status: "pending"
})

// Update order status (should trigger change stream)
db.orders.updateOne(
  { _id: "order_test1" },
  { $set: { status: "processing" } }
)

// Delete order (should trigger change stream)
db.orders.deleteOne({ _id: "order_test1" })
```

#### 3. Filtered Change Streams
```javascript
// Watch only specific operations
var insertOnlyStream = db.orders.watch([
  { $match: { operationType: "insert" } }
]);

insertOnlyStream.on('change', function(change) {
  print("New order inserted: " + change.fullDocument._id);
});

// Watch high-value orders only
var highValueStream = db.orders.watch([
  { 
    $match: { 
      $and: [
        { operationType: "insert" },
        { "fullDocument.total": { $gte: 500 } }
      ]
    } 
  }
]);

highValueStream.on('change', function(change) {
  print("High-value order detected: $" + change.fullDocument.total);
  
  // Create notification
  db.notifications.insertOne({
    userId: "admin",
    type: "high_value_order",
    message: `High-value order received: ${change.fullDocument._id} ($${change.fullDocument.total})`,
    orderId: change.fullDocument._id,
    timestamp: new Date(),
    read: false
  });
});
```

### Part B: Advanced Change Streams and Resumption (15 minutes)

#### 4. Resumable Change Streams
```javascript
// Function to create resumable change stream
function createResumableChangeStream(resumeToken) {
  var options = {
    fullDocument: 'updateLookup'
  };
  
  if (resumeToken) {
    options.resumeAfter = resumeToken;
  }
  
  var changeStream = db.orders.watch([], options);
  
  changeStream.on('change', function(change) {
    // Process the change
    processOrderChange(change);
    
    // Store resume token for fault tolerance
    storeResumeToken(change._id);
  });
  
  return changeStream;
}

function processOrderChange(change) {
  // Log all changes
  db.activity_log.insertOne({
    operation: change.operationType,
    collection: "orders",
    documentId: change.documentKey._id,
    timestamp: new Date(),
    changeId: change._id
  });
  
  print(`Processed change: ${change.operationType} on ${change.documentKey._id}`);
}

function storeResumeToken(token) {
  // Store resume token in a collection for fault tolerance
  db.resume_tokens.replaceOne(
    { _id: "order_stream" },
    { _id: "order_stream", token: token, lastUpdated: new Date() },
    { upsert: true }
  );
}

function getLastResumeToken() {
  var doc = db.resume_tokens.findOne({ _id: "order_stream" });
  return doc ? doc.token : null;
}

// Start resumable change stream
var lastToken = getLastResumeToken();
var resumableStream = createResumableChangeStream(lastToken);
```

#### 5. Real-time Order Processing System
```javascript
// Complete order processing system with change streams
var OrderProcessor = {
  
  // Initialize all change streams
  init: function() {
    this.setupNewOrderStream();
    this.setupStatusUpdateStream();
    this.setupInventoryUpdateStream();
  },
  
  // Watch for new orders
  setupNewOrderStream: function() {
    var newOrderStream = db.orders.watch([
      { $match: { operationType: "insert" } }
    ]);
    
    newOrderStream.on('change', function(change) {
      OrderProcessor.processNewOrder(change.fullDocument);
    });
  },
  
  // Watch for order status updates
  setupStatusUpdateStream: function() {
    var statusStream = db.orders.watch([
      { 
        $match: { 
          operationType: "update",
          "updateDescription.updatedFields.status": { $exists: true }
        } 
      }
    ]);
    
    statusStream.on('change', function(change) {
      var orderId = change.documentKey._id;
      var newStatus = change.updateDescription.updatedFields.status;
      OrderProcessor.handleStatusChange(orderId, newStatus);
    });
  },
  
  // Watch for inventory updates
  setupInventoryUpdateStream: function() {
    var inventoryStream = db.products.watch([
      { 
        $match: { 
          operationType: "update",
          "updateDescription.updatedFields.stock": { $exists: true }
        } 
      }
    ]);
    
    inventoryStream.on('change', function(change) {
      var productId = change.documentKey._id;
      var newStock = change.updateDescription.updatedFields.stock;
      OrderProcessor.handleInventoryChange(productId, newStock);
    });
  },
  
  // Process new order
  processNewOrder: function(order) {
    print(`Processing new order: ${order._id}`);
    
    // Validate inventory
    var allItemsAvailable = true;
    order.items.forEach(function(item) {
      var product = db.products.findOne({ _id: item.productId });
      if (!product || product.stock < item.quantity) {
        allItemsAvailable = false;
      }
    });
    
    if (allItemsAvailable) {
      // Update order status
      db.orders.updateOne(
        { _id: order._id },
        { $set: { status: "processing", processedAt: new Date() } }
      );
      
      // Create notifications
      db.notifications.insertOne({
        userId: order.customerId,
        type: "order_confirmed",
        message: `Your order ${order._id} has been confirmed and is being processed.`,
        orderId: order._id,
        timestamp: new Date(),
        read: false
      });
    } else {
      // Update order status to failed
      db.orders.updateOne(
        { _id: order._id },
        { $set: { status: "failed", reason: "Insufficient inventory" } }
      );
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
    }
  }
};

// Initialize the order processor
OrderProcessor.init();

// Test the system
db.orders.insertOne({
  _id: "order_realtime1",
  customerId: "cust1",
  orderDate: new Date(),
  items: [{ productId: "prod1", quantity: 1 }],
  total: 999.99,
  status: "pending"
});
```

### Deliverables
- Working change stream implementations for different use cases
- Real-time notification system
- Order processing system with event-driven architecture
- Resumable change streams with fault tolerance

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
    private static readonly string ConnectionString = 
        "mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/?authSource=admin&replicaSet=rs0";
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
    public class ResilientProductService : ProductService
    {
        public ResilientProductService(MongoDBService mongoDBService) : base(mongoDBService)
        {
        }
        
        public async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, int maxRetries = 3)
        {
            Exception lastException = null!;
            
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
            
            throw lastException;
        }
        
        private bool IsTransientError(MongoException ex)
        {
            return ex is MongoConnectionException ||
                   ex is MongoTimeoutException ||
                   (ex is MongoWriteException writeEx && IsTransientWriteError(writeEx));
        }
        
        private bool IsTransientWriteError(MongoWriteException ex)
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
                return await GetProductByIdAsync(id);
            });
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

### Deliverables
- Working C# console application with MongoDB integration
- Strongly-typed models and services
- Complete CRUD operations implementation
- Error handling and retry logic
- Basic aggregation operations

---

## Lab Summary and Integration

### What You've Accomplished

#### 🔄 **Transactions (Lab 1)**
- Configured replica set for transaction support
- Implemented ACID-compliant order processing
- Built money transfer system with rollback capabilities
- Handled transaction errors and edge cases

#### 🔧 **Replication (Lab 2)**
- Set up advanced replica set with special members
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
- Set up MongoDB C# driver
- Implemented strongly-typed models and services
- Built resilient operations with retry logic
- Created complete CRUD and aggregation examples

### Production Readiness Checklist

- [ ] **Security**: Authentication and authorization configured
- [ ] **High Availability**: Replica sets with proper failover
- [ ] **Scalability**: Sharding strategy implemented
- [ ] **Monitoring**: Health checks and performance monitoring
- [ ] **Backup**: Backup and recovery procedures tested
- [ ] **Error Handling**: Resilient error handling and retry logic
- [ ] **Documentation**: Operation procedures documented

### Next Steps

1. **Integrate Labs**: Combine concepts from different labs into a complete application
2. **Performance Testing**: Load test your implementations
3. **Production Deployment**: Deploy to staging/production environments
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **Backup Strategy**: Implement automated backup procedures

### Cleanup

```bash
# Stop and remove all containers
docker-compose -f docker-compose-replica.yml down -v
docker-compose -f docker-compose-sharded.yml down -v

# Remove network
docker network rm mongodb-lab-network

# Remove all MongoDB-related containers and volumes
docker system prune -f
```

**Congratulations!** You've successfully completed all MongoDB Day 3 advanced labs and are now ready to build production-scale MongoDB applications.