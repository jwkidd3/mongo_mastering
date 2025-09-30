# Lab 2: Replica Sets & High Availability
**Duration:** 45 minutes
**Objective:** Configure replica sets for insurance branch data replication and test failover scenarios

## Part A: Advanced Replica Set Configuration (20 minutes)

### Step 1: Add Special Members
```bash
# Add arbiter node (voting only, no data)
docker run -d --name mongo-arbiter --network mongodb-net -p 27020:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Add hidden member (data replication, no client reads)
docker run -d --name mongo-hidden --network mongodb-net -p 27021:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Wait for containers to start
sleep 10
```

### Step 2: Configure Replica Set in Compass

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

## Part B: Failover Testing and Read Preferences (15 minutes)

### Step 4: Test Automatic Failover

**Monitor Current Primary:**
```bash
# Check current primary
docker exec -it mongo1 mongosh --eval "var primary = rs.status().members.filter(m => m.state === 1)[0]; print('Current primary: ' + primary.name);"
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

### Step 5: Read Preferences Configuration

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
use insurance_company

// Primary read preference (default) - critical operations
db.policies.find().readPref("primary");

// Secondary preferred - for reporting and analytics
db.claims.find().readPref("secondaryPreferred");

// Nearest member - for branch operations
db.customers.find().readPref("nearest");

// Tagged reads - east coast branches only
db.policies.find().readPref("secondary", [
  { "region": "east" }
]);

// Analytics member only - for compliance and reporting
db.claims.find().readPref("secondary", [
  { "usage": "analytics" }
]);
```

### Step 6: Write and Read Concerns for Insurance Operations

```javascript
use insurance_company

// Critical policy updates require majority write concern
db.policies.updateOne(
  { _id: "policy1" },
  { $set: { status: "Active", lastModified: new Date() } },
  { writeConcern: { w: "majority", j: true } }
);

// Claim settlements require strict durability
db.claims.insertOne(
  {
    claimNumber: "CLM-2024-TEST",
    customerId: "cust1",
    policyId: "policy1",
    amount: 5000.00,
    status: "Filed",
    incidentDate: new Date(),
    filedDate: new Date()
  },
  { writeConcern: { w: "majority", wtimeout: 10000, j: true } }
);

// Audit trail entries with journal guarantee
db.audit_log.insertOne(
  {
    operation: "claim_filed",
    userId: "agent1",
    timestamp: new Date(),
    details: "New claim filed for auto accident"
  },
  { writeConcern: { w: 1, j: true } }
);

// Read concerns for different use cases
// Local read for real-time dashboard (faster, may see uncommitted data)
db.claims.find({ status: "Under Review" }).readConcern("local");

// Majority read for financial reports (consistent across majority)
db.payments.find({ type: "Claim Settlement" }).readConcern("majority");
```

**Monitor in Compass:**
- Watch insurance data write propagation across replica set members
- Use Performance tab to see write acknowledgment timing for critical insurance operations
- Observe consistency behavior with different concerns for policy and claim data

## Part C: Monitoring and Maintenance (10 minutes)

### Step 7: Comprehensive Monitoring

**Compass Monitoring Features:**
1. **Performance Tab:** Operations/sec, read/write distribution, replication lag
2. **Real-time Metrics:** Memory usage, connections, network I/O
3. **Topology View:** Visual cluster health representation

**MongoSH Monitoring Script for Insurance Operations:**
```javascript
// Comprehensive replica set monitoring for insurance company
function monitorInsuranceReplicaSet() {
  print("=== Insurance Company Replica Set Monitoring ===");

  var status = rs.status();
  print("Replica Set: " + status.set);
  print("Date: " + status.date);

  // Member status with branch context
  print("\n--- Branch Data Center Status ---");
  status.members.forEach(function(member) {
    var role = "";
    if (member.state === 1) role = "[PRIMARY - Main Operations]";
    else if (member.state === 2) role = "[SECONDARY - Branch/Analytics]";
    else if (member.state === 7) role = "[ARBITER - Voting Only]";

    print(member.name + ": " + member.stateStr + " " + role + " (Health: " + member.health + ")");
    if (member.optimeDate) {
      print("  Last Optime: " + member.optimeDate);
    }
    if (member.lastHeartbeat) {
      print("  Last Heartbeat: " + member.lastHeartbeat);
    }
  });

  // Replication lag - critical for insurance data consistency
  print("\n--- Branch Data Replication Lag ---");
  var primary = status.members.filter(function(m) { return m.state === 1; })[0];
  if (primary) {
    status.members.filter(function(m) { return m.state === 2; }).forEach(function(secondary) {
      var lag = (primary.optimeDate - secondary.optimeDate) / 1000;
      var lagStatus = lag < 5 ? "[OK]" : lag < 15 ? "[WARNING]" : "[CRITICAL]";
      print(secondary.name + ": " + lag.toFixed(2) + " seconds behind primary " + lagStatus);
    });
  }

  // Oplog information
  print("\n--- Oplog Information ---");
  var oplogStats = db.getSiblingDB("local").oplog.rs.stats();
  print("Oplog Size: " + (oplogStats.size / 1024 / 1024).toFixed(2) + " MB");
  print("Oplog Used: " + (oplogStats.storageSize / 1024 / 1024).toFixed(2) + " MB");

  var firstOp = db.getSiblingDB("local").oplog.rs.find().sort({ ts: 1 }).limit(1).next();
  var lastOp = db.getSiblingDB("local").oplog.rs.find().sort({ ts: -1 }).limit(1).next();

  var oplogWindow = (lastOp.ts.t - firstOp.ts.t) / 3600;
  print("Oplog Window: " + oplogWindow.toFixed(2) + " hours");

  // Insurance-specific data monitoring
  print("\n--- Insurance Data Volume ---");
  use insurance_company;
  print("Active Policies: " + db.policies.countDocuments({ status: "Active" }));
  print("Open Claims: " + db.claims.countDocuments({ status: { $in: ["Filed", "Under Review"] } }));
  print("Today's Payments: " + db.payments.countDocuments({
    paymentDate: { $gte: new Date(new Date().setHours(0,0,0,0)) }
  }));
}

// Run insurance-focused monitoring
monitorInsuranceReplicaSet();
```

### Step 8: Maintenance Operations

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

## Lab 2 Deliverables
✅ **Advanced replica set** with arbiter and hidden members for insurance branch operations
✅ **Failover testing** with visual monitoring to ensure insurance data availability
✅ **Read preferences** configured for different insurance operations (real-time vs. analytics)
✅ **Comprehensive monitoring** setup for insurance data replication and branch connectivity
✅ **Write/read concerns** optimized for insurance compliance and data consistency requirements