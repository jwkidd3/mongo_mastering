# Lab 3: Sharding & Horizontal Scaling
**Duration:** 45 minutes
**Objective:** Build and manage a sharded MongoDB cluster

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

### Step 6: Load Test Data

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

### Step 7: Analyze Distribution

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

## Part C: Zone Sharding and Management (5 minutes)

### Step 8: Zone Sharding for Geographic Distribution

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

### Step 9: Manual Chunk Operations

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

## Lab 3 Deliverables
✅ **Complete sharded cluster** with config servers and multiple shards
✅ **Different sharding strategies** implemented and tested
✅ **Zone sharding** configured for geographic distribution
✅ **Chunk distribution analysis** and balancer management