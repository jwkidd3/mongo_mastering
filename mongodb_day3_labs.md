#### 5. Order Processing System with Event Simulation

**Using MongoDB Compass:**

1. **Complete Event-Driven System:**
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
   ```

2. **Test the Complete System:**
   ```javascript
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

3. **Monitor Complete Workflow in Compass:**
   - Open multiple tabs for: `orders`, `notifications`, `customers`, `products`
   - Watch real-time updates across all collections
   - Use Compass's aggregation pipeline builder to create workflow analytics:
     ```javascript
     // Example aggregation to track order processing workflow
     db.notifications.aggregate([
       { $match: { type: { $in: ["order_confirmed", "order_failed", "status_update"] } } },
       { $group: { _id: "$type", count: { $sum: 1 } } },
       { $sort: { count: -1 } }
     ])
     ```# MongoDB Day 3 Labs: Advanced Features (Updated)
*5 hands-on labs covering Transactions, Replication, Sharding, Change Streams, and C# API*

---

## Prerequisites

### Environment Setup
- Docker Desktop installed and running
- **MongoDB Compass** (primary tool for labs)
- .NET 8 SDK (for C# lab)
- Visual Studio Code
- Download the **day3-data-generator.js** script for initial data setup

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

**Using MongoDB Compass:**

1. **Connect to Replica Set:**
   - Open MongoDB Compass
   - Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
   - Click "Connect"

2. **Load Initial Data:**
   ```bash
   # Run the data generator script via mongosh (one-time setup)
   mongosh "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0" < day3-data-generator.js
   ```

3. **Verify Data in Compass:**
   - Navigate to `ecommerce` database
   - Explore the collections: `products`, `customers`, `orders`
   - View the sample data structure and indexes

4. **Key Collections Created:**
   - **Products:** 5 products with stock levels
   - **Customers:** 4 customers with account balances  
   - **Orders:** Collection ready for transaction testing

#### 4. Implement Order Processing Transaction

**Using MongoDB Compass:**

1. **Open MongoSH in Compass:**
   - In Compass, navigate to the `ecommerce` database
   - Click on the **"_MongoSH"** tab at the bottom
   - This opens an integrated mongosh session

2. **Create Transaction Function:**
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
   ```

3. **Test Transactions:**
   ```javascript
   // Test successful order
   var result1 = processOrder("cust1", [
     { productId: "prod1", quantity: 1 },
     { productId: "prod2", quantity: 2 }
   ]);

   // Test order with insufficient stock  
   var result2 = processOrder("cust2", [
     { productId: "prod1", quantity: 15 }  // More than available
   ]);
   ```

4. **Monitor Results in Compass:**
   - Refresh the collections view in Compass
   - Check `products` collection - notice stock changes
   - Check `customers` collection - notice balance changes
   - Check `orders` collection - see new orders created
   - Failed transactions should not change any data

### Part C: Advanced Transaction Scenarios (10 minutes)

#### 5. Money Transfer Transaction

**Using MongoDB Compass MongoSH:**

1. **Create Transfer Function:**
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
       
       print(`Transfer completed: ${amount} from ${fromAccount} to ${toAccount}`);
       return { success: true };
       
     } catch (error) {
       print("Transfer failed: " + error.message);
       session.abortTransaction();
       return { success: false, error: error.message };
       
     } finally {
       session.endSession();
     }
   }
   ```

2. **Test Transfer:**
   ```javascript
   // Test transfer
   transferMoney("cust2", "cust1", 100.00);
   ```

3. **Verify in Compass:**
   - Go to `customers` collection
   - Apply filter: `{}` to see all customers
   - Notice the balance changes
   - Check `transactions` collection for the transfer record
   - Use Compass's real-time view to see changes as they happen

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

**Using MongoDB Compass:**

1. **Connect to Replica Set:**
   - Open MongoDB Compass
   - Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`

2. **Use MongoSH in Compass:**
   ```javascript
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

3. **Monitor in Compass:**
   - Navigate to the `admin` database
   - View the `system.replset` collection to see configuration
   - Use Compass's real-time monitoring to observe replica set status

#### 3. Configure Member Priorities and Tags

**Using MongoDB Compass MongoSH:**

1. **Update Replica Set Configuration:**
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
   ```

2. **Verify Changes in Compass:**
   - Go to `admin` database → `system.replset` collection
   - View the configuration document
   - Notice the priorities and tags added
   - Use Compass's JSON view to see the complete configuration structure

### Part B: Failover Testing and Read Preferences (15 minutes)

#### 4. Test Automatic Failover

**Using MongoDB Compass + Command Line:**

1. **Monitor Current Primary:**
   ```bash
   # Check current primary
   docker exec -it mongo1 mongosh --eval "
   var primary = rs.status().members.filter(m => m.state === 1)[0];
   print('Current primary: ' + primary.name);
   "
   ```

2. **Monitor in Compass:**
   - Keep Compass open to the replica set
   - Watch the server status indicators
   - Note which server shows as "Primary"

3. **Simulate Failover:**
   ```bash
   # Simulate primary failure
   docker stop mongo1
   
   # Wait 30 seconds and observe in Compass
   # You'll see the primary indicator change to another server
   
   # Restart the failed node
   docker start mongo1
   ```

4. **Observe in Compass:**
   - Watch the real-time status changes
   - Notice how the original primary becomes a secondary
   - Use Compass's performance metrics to see the election process
   - Check the replica set topology view

#### 5. Implement Read Preferences

**Using MongoDB Compass:**

1. **Test Read Preferences via MongoSH:**
   ```javascript
   use ecommerce

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

2. **Compass Connection Strings:**
   Create separate connections in Compass to test read preferences:
   
   - **Primary Only:**
     `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=primary`
   
   - **Secondary Preferred:**
     `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=secondaryPreferred`
   
   - **Nearest:**
     `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=nearest`

3. **Monitor Read Distribution:**
   - Use Compass performance tabs to see which servers handle queries
   - Compare query distribution across different read preferences
   - Note the server indicators showing read activity

#### 6. Write Concerns and Read Concerns

**Using MongoDB Compass MongoSH:**

1. **Test Write Concerns:**
   ```javascript
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
   ```

2. **Test Read Concerns:**
   ```javascript
   // Read from local replica
   db.test_writes.find().readConcern("local");
   
   // Read majority-committed data
   db.test_writes.find().readConcern("majority");
   ```

3. **Monitor in Compass:**
   - Watch the `test_writes` collection refresh
   - Use Compass's real-time view to see write propagation
   - Check individual replica set members to see data consistency
   - Observe write acknowledgment timing differences

### Part C: Monitoring and Maintenance (10 minutes)

#### 7. Replica Set Monitoring

**Using MongoDB Compass:**

1. **Compass Monitoring Features:**
   - Navigate to the replica set connection
   - Use the **Performance** tab to monitor:
     - Operations per second
     - Read/write distribution
     - Replication lag
     - Network I/O

2. **MongoSH Monitoring Script:**
   ```javascript
   // Comprehensive monitoring function
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
   }

   // Run monitoring
   monitorReplicaSet();
   ```

3. **Visual Monitoring in Compass:**
   - **Real-time Metrics:** Operations, connections, memory usage
   - **Replica Set Topology:** Visual representation of cluster health
   - **Performance Charts:** Historical performance data
   - **Profiler:** Query performance analysis

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

**Using MongoDB Compass:**

1. **Connect to mongos:**
   - Open MongoDB Compass
   - Connection String: `mongodb://localhost:27017`
   - This connects to the query router (mongos)

2. **Add Shards via MongoSH in Compass:**
   ```javascript
   // Add shards to the cluster
   sh.addShard("shard1rs/127.0.0.1:27201,127.0.0.1:27202,127.0.0.1:27203")
   sh.addShard("shard2rs/127.0.0.1:27301,127.0.0.1:27302,127.0.0.1:27303")

   // Check cluster status
   sh.status()
   ```

3. **Monitor in Compass:**
   - Navigate to `config` database
   - Explore collections: `shards`, `chunks`, `databases`
   - View the sharding configuration in real-time

### Part B: Sharding Strategy and Implementation (15 minutes)

#### 5. Enable Sharding on Database and Collections

**Using MongoDB Compass:**

1. **Enable Sharding via MongoSH:**
   ```javascript
   // Enable sharding on the ecommerce database
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

2. **Monitor Sharding in Compass:**
   - Navigate to `config` database
   - View `collections` collection to see shard key configuration
   - Check `chunks` collection to see data distribution
   - Use Compass's visual query profiler to see query routing

#### 6. Load Test Data and Observe Distribution

**Using Data Generator + Compass:**

1. **Load Pre-generated Data:**
   ```bash
   # The data generator script already created the data, now enable sharding
   mongosh "mongodb://localhost:27017" < day3-data-generator.js
   ```

2. **Monitor Data Distribution in Compass:**
   - Connect to the sharded cluster: `mongodb://localhost:27017`
   - Navigate to `ecommerce` database
   - View collections: `users`, `orders`, `stores`
   - Notice how data is distributed across shards

3. **Analyze Distribution via MongoSH:**
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
   ```

4. **Visual Analysis in Compass:**
   - Use Compass's **Performance** tab to see shard activity
   - Navigate to `config.chunks` collection
   - Apply filters to see chunk distribution: `{"ns": "ecommerce.users"}`
   - Use Compass's aggregation builder to create distribution charts

#### 7. Analyze Chunk Distribution

**Using MongoDB Compass:**

1. **Visual Chunk Analysis:**
   - Navigate to `config` database in Compass
   - Open `chunks` collection
   - Apply filter: `{"ns": "ecommerce.users"}` to see user chunks
   - Apply filter: `{"ns": "ecommerce.orders"}` to see order chunks
   - Use Compass's document view to examine chunk boundaries

2. **Balancer Monitoring:**
   ```javascript
   // Check balancer status via MongoSH
   print("Balancer status:");
   print("Enabled: " + sh.getBalancerState());
   print("Running: " + sh.isBalancerRunning());
   
   // View balancer statistics
   use config
   db.actionlog.find({what: "balancer.round"}).sort({time: -1}).limit(5).forEach(printjson);
   ```

3. **Performance Analysis in Compass:**
   - Use the **Performance** tab to monitor:
     - Query distribution across shards
     - Shard utilization
     - Chunk migration activity
   - Compare query patterns between different shard key strategies

### Part C: Zone Sharding and Management (5 minutes)

#### 8. Zone Sharding for Geographic Distribution

**Using MongoDB Compass:**

1. **Configure Zone Sharding via MongoSH:**
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

2. **Monitor Zone Configuration in Compass:**
   - Navigate to `config` database
   - View `shards` collection to see shard tags
   - View `tags` collection to see zone ranges
   - Use filtering to verify geographic distribution

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

**Using MongoDB Compass:**

1. **Connect to Replica Set:**
   - Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
   - Navigate to `ecommerce` database

2. **Verify Collections:**
   - Check that `notifications`, `activity_log`, and `resume_tokens` collections exist
   - These were created by the data generator script
   - View their indexes in Compass's index tab

3. **Understanding Change Streams:**
   - Change streams in Compass can be monitored via the Performance tab
   - Real-time operations will show in the activity feed

#### 2. Basic Change Stream Implementation

**Using MongoDB Compass:**

1. **Monitor Collections in Real-time:**
   - Open the `orders` collection in Compass
   - Keep the collection view open to see real-time changes
   - Use Compass's real-time refresh feature

2. **Simulate Change Stream Handler via MongoSH:**
   ```javascript
   // Note: This simulates change stream processing
   // In production, change streams run as background processes
   
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

3. **Test Change Stream Processing:**
   ```javascript
   // Create a test order and simulate change stream processing
   use ecommerce

   var testOrder = {
     _id: "order_test1",
     customerId: "cust1",
     orderDate: new Date(),
     items: [{ productId: "prod1", quantity: 1 }],
     total: 999.99,
     status: "pending"
   };

   // Insert order
   db.orders.insertOne(testOrder);

   // Simulate change stream processing
   simulateChangeStreamHandler({
     operationType: "insert",
     fullDocument: testOrder,
     documentKey: { _id: "order_test1" }
   });
   ```

4. **Monitor in Compass:**
   - Watch the `orders` collection refresh with new document
   - Check `notifications` collection for auto-generated notifications
   - Use Compass's real-time view to see the workflow

#### 3. Test Change Stream with Order Operations

**Using MongoDB Compass:**

1. **Interactive Testing:**
   ```javascript
   use ecommerce

   // Create test order
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

   // Simulate change processing
   simulateChangeStreamHandler({
     operationType: "insert",
     fullDocument: testOrder,
     documentKey: { _id: "order_test1" }
   });

   // Update order status
   print("Updating order status...");
   db.orders.updateOne(
     { _id: "order_test1" },
     { $set: { status: "processing" } }
   );

   // Simulate update processing
   simulateChangeStreamHandler({
     operationType: "update",
     documentKey: { _id: "order_test1" },
     updateDescription: { updatedFields: { status: "processing" } }
   });
   ```

2. **Visual Monitoring in Compass:**
   - Keep both `orders` and `notifications` collections open in separate tabs
   - Watch real-time updates as you run the operations
   - Use Compass's document view to see detailed changes
   - Apply filters to see specific notification types: `{"type": "order_created"}`

3. **View Generated Notifications:**
   ```javascript
   // Check notifications created
   print("Notifications created:");
   db.notifications.find().sort({timestamp: -1}).limit(5).forEach(printjson);
   ```

#### 4. Filtered Change Streams

**Using MongoDB Compass:**

1. **High-Value Order Processing:**
   ```javascript
   // High-value order filter simulation
   function isHighValueOrder(order) {
     return order.total >= 500;
   }

   function processHighValueOrder(order) {
     print("High-value order detected: $" + order.total);
     
     // Create admin notification
     db.notifications.insertOne({
       userId: "admin",
       type: "high_value_order",
       message: `High-value order received: ${order._id} (${order.total})`,
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

2. **Monitor High-Value Processing in Compass:**
   - Watch the `orders` collection for the new high-value order
   - Check `notifications` collection with filter: `{"type": "high_value_order"}`
   - View `activity_log` collection for analytics events
   - Use Compass's aggregation builder to analyze high-value order patterns

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

**Using MongoDB Compass:**

1. **Resume Token Management:**
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
   ```

2. **Monitor Resume Tokens in Compass:**
   ```javascript
   // Check stored resume tokens
   print("\nStored resume tokens:");
   db.resume_tokens.find().forEach(printjson);

   // Check activity log
   print("\nActivity log:");
   db.activity_log.find({ streamId: "order_stream" }).forEach(printjson);
   ```

3. **Visual Verification in Compass:**
   - Navigate to `resume_tokens` collection
   - View the stored tokens and timestamps
   - Check `activity_log` collection for processing history
   - Use Compass's filters to track specific stream activities

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
- Used **MongoDB Compass** to visualize transaction effects in real-time
- Implemented ACID-compliant order processing with visual verification
- Built money transfer system with rollback capabilities
- Monitored transaction success/failure across multiple collections

#### 🔧 **Replication (Lab 2)**
- Extended replica set with arbiter and hidden members via Compass interface
- Used **Compass Performance Tab** to monitor failover events
- Tested automatic failover with visual cluster topology changes
- Configured read preferences with **multiple Compass connections**
- Implemented comprehensive monitoring through Compass dashboards

#### ⚡ **Sharding (Lab 3)**
- Built complete sharded cluster architecture
- Used **Compass Visual Query Analysis** to understand shard targeting
- Implemented different sharding strategies with **config database exploration**
- Configured zone sharding using **Compass collection filtering**
- Monitored chunk distribution through **Compass aggregation builder**

#### 📡 **Change Streams (Lab 4)**
- Created real-time notification systems with **Compass real-time view**
- Built event-driven order processing with **multi-collection monitoring**
- Implemented resumable change streams with **visual token verification**
- Developed fault-tolerant stream processing using **Compass activity logs**

#### 💻 **C# Integration (Lab 5)**
- Set up MongoDB C# driver without authentication complexity
- Connected to replica set from C# applications
- Implemented strongly-typed models and services
- Built resilient operations with retry logic
- Created complete CRUD and aggregation examples

### MongoDB Compass Features Utilized

1. **Real-time Monitoring:**
   - Collection auto-refresh for live data changes
   - Performance metrics and cluster health
   - Query execution visualization

2. **Visual Data Exploration:**
   - Document view for complex data structures
   - Filtering and querying interface
   - Index performance analysis

3. **Cluster Management:**
   - Replica set topology visualization
   - Shard distribution monitoring
   - Connection management with different preferences

4. **Development Tools:**
   - Integrated MongoSH for advanced operations
   - Aggregation pipeline builder
   - Schema analysis and validation

### Production Readiness Checklist

- [ ] **High Availability**: Replica sets with proper failover ✓
- [ ] **Scalability**: Sharding strategy implemented ✓  
- [ ] **Real-time Processing**: Change streams for event-driven architecture ✓
- [ ] **Visual Monitoring**: Compass dashboards for operations ✓
- [ ] **Application Integration**: C# driver implementation ✓
- [ ] **Error Handling**: Resilient error handling and retry logic ✓

### Compass vs Command Line Benefits

**MongoDB Compass Advantages:**
- **Visual Learning**: See data changes in real-time
- **Intuitive Interface**: Easier for beginners to understand concepts
- **Integrated Tools**: MongoSH + GUI in one interface
- **Performance Insights**: Built-in monitoring and profiling
- **Error Prevention**: Visual validation of queries and operations

**When to Use Command Line:**
- **Automation**: Scripts and automated deployments
- **Production Operations**: Server management and maintenance
- **Advanced Debugging**: Low-level troubleshooting
- **CI/CD Integration**: Automated testing and deployment

### Next Steps

1. **Add Authentication**: Implement authentication for production use
2. **Performance Testing**: Load test using Compass performance monitoring
3. **Production Deployment**: Deploy with Compass monitoring setup
4. **Advanced Monitoring**: Configure Compass alerts and dashboards
5. **Team Collaboration**: Share Compass connections and queries

### MongoDB Compass Best Practices Learned

1. **Use Multiple Connections** for different read preferences
2. **Leverage Real-time Views** for change stream monitoring  
3. **Utilize Performance Tabs** for cluster health monitoring
4. **Apply Strategic Filtering** for large dataset analysis
5. **Combine GUI + MongoSH** for comprehensive database management

**Congratulations!** You've successfully completed all MongoDB Day 3 advanced labs using MongoDB Compass as the primary interface, gaining both theoretical knowledge and practical GUI-based database management skills essential for modern MongoDB development and operations.