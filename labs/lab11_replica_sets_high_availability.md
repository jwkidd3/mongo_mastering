# Lab 11: Replica Sets & High Availability
**Duration:** 45 minutes
**Objective:** Explore replica set concepts and test high availability features using the existing 3-member replica set

## Prerequisites: Environment Setup

### Step 1: Verify MongoDB Environment

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./setup/setup.sh
```

**Windows PowerShell:**
```powershell
.\setup\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

**Load Course Data:**
```bash
mongosh < data/comprehensive_data_loader.js
```

## Part A: Understanding Replica Set Architecture (20 minutes)

### Step 1: Examine Current Replica Set Configuration

**Using MongoDB Compass:**
1. Connection String: `mongodb://localhost:27017/?replicaSet=rs0`
2. Click **"Connect"**
3. Navigate to `admin` database → `system.replset` collection
4. View the current replica set configuration document

**Using MongoSH to explore the existing setup:**
```javascript
// Connect to the replica set and examine configuration
rs.status()

// View detailed configuration
rs.conf()

// Check current primary
db.hello()

// See replication lag information
rs.printReplicationInfo()
rs.printSecondaryReplicationInfo()
```

### Step 2: Understanding Member Types (Demonstration)

**Current Setup Analysis:**
Our replica set has 3 data-bearing members. Let's understand different member types:

```javascript
// Examine our current 3-member setup
print("=== Current Replica Set Members ===")
var status = rs.status()
status.members.forEach(function(member) {
  print("Member: " + member.name)
  print("  State: " + member.stateStr + " (" + member.state + ")")
  print("  Health: " + member.health)
  print("  Priority: " + (rs.conf().members.find(m => m.host === member.name) || {}).priority)
  print("  Votes: " + (rs.conf().members.find(m => m.host === member.name) || {}).votes)
  print("  Hidden: " + ((rs.conf().members.find(m => m.host === member.name) || {}).hidden || false))
  print("")
})

print("=== Member Types Explanation ===")
print("PRIMARY: Receives all writes, can serve reads")
print("SECONDARY: Replicates data from primary, can serve reads with read preference")
print("ARBITER: Votes in elections but stores no data (not in our current setup)")
print("HIDDEN: Replicates data but doesn't serve client reads (not in our current setup)")
print("DELAYED: Maintains historical snapshot of data (not in our current setup)")
```

**Replica Set Member Types Demo:**
```javascript
// Demonstrate different member configurations (conceptual)
function demonstrateMemberTypes() {
  print("=== Replica Set Member Types Demo ===")
  print("")

  print("1. ARBITER MEMBER (Voting Only)")
  print("   Configuration: { _id: 3, host: 'arbiter:27017', arbiterOnly: true }")
  print("   Purpose: Provides voting in elections without storing data")
  print("   Use case: Odd number of votes in geographically distributed deployments")
  print("")

  print("2. HIDDEN MEMBER (Data but No Client Reads)")
  print("   Configuration: { _id: 4, host: 'hidden:27017', priority: 0, hidden: true, votes: 0 }")
  print("   Purpose: Analytics, backups, or reporting without affecting client traffic")
  print("   Use case: Dedicated analytics replica that doesn't impact production reads")
  print("")

  print("3. DELAYED MEMBER (Historical Data)")
  print("   Configuration: { _id: 5, host: 'delayed:27017', priority: 0, hidden: true, secondaryDelaySecs: 3600 }")
  print("   Purpose: Maintains historical view for disaster recovery")
  print("   Use case: Protection against accidental data deletion or corruption")
  print("")

  print("4. HIGH PRIORITY MEMBER (Preferred Primary)")
  print("   Configuration: { _id: 0, host: 'primary:27017', priority: 2 }")
  print("   Purpose: Prefers to be primary when available")
  print("   Use case: Ensuring primary runs in preferred data center")
  print("")
}

demonstreateMemberTypes()
```

## Part B: Failover Testing and Read Preferences (15 minutes)

### Step 3: Understanding Automatic Failover (Controlled Demo)

**Monitor Current Primary:**
```javascript
// Check which member is currently primary
function getCurrentPrimary() {
  var status = rs.status()
  var primary = status.members.filter(function(m) { return m.state === 1 })[0]
  if (primary) {
    print("Current primary: " + primary.name)
    print("Primary since: " + primary.electionDate)
    return primary
  } else {
    print("No primary found!")
    return null
  }
}

getCurrentPrimary()
```

**Election Process Demo:**
```javascript
// Demonstrate election mechanics (informational)
function explainElectionProcess() {
  print("=== MongoDB Election Process ===")
  print("")
  print("1. Heartbeat Failure: Secondaries detect primary unavailability")
  print("2. Candidacy: Eligible secondary calls for election")
  print("3. Voting: Members vote for new primary based on:")
  print("   - Data recency (higher optime wins)")
  print("   - Priority settings")
  print("   - Member availability")
  print("4. Majority Required: Candidate needs majority of votes")
  print("5. New Primary: Winner becomes primary and starts accepting writes")
  print("")
  print("Election timeout: " + rs.conf().settings.electionTimeoutMillis + "ms")
  print("Heartbeat interval: " + rs.conf().settings.heartbeatIntervalMillis + "ms")
}

explainElectionProcess()
```

**Simulated Failover Analysis:**
```javascript
// Analyze current replica set health
function analyzeReplicaSetHealth() {
  print("=== Replica Set Health Analysis ===")
  var status = rs.status()
  var config = rs.conf()

  print("Set name: " + status.set)
  print("Total members: " + status.members.length)
  print("Majority needed for elections: " + Math.floor(status.members.length / 2) + 1)
  print("")

  // Check each member's role and health
  status.members.forEach(function(member) {
    var memberConfig = config.members.find(function(m) { return m.host === member.name })
    print("Member: " + member.name)
    print("  State: " + member.stateStr)
    print("  Health: " + member.health)
    print("  Can become primary: " + (memberConfig.priority > 0 ? "Yes" : "No"))
    print("  Can vote: " + (memberConfig.votes > 0 ? "Yes" : "No"))
    if (member.state === 1) {
      print("  *** CURRENT PRIMARY ***")
    }
    print("")
  })

  // Simulate failover scenarios
  print("=== Failover Scenarios ===")
  print("If primary fails:")
  print("- Remaining 2 members form majority")
  print("- Election triggered automatically")
  print("- New primary elected within seconds")
  print("- Applications reconnect to new primary")
  print("")
  print("If 2 members fail:")
  print("- Remaining 1 member cannot form majority")
  print("- Replica set becomes read-only")
  print("- No new primary can be elected")
  print("- Service degraded until members recover")
}

analyzeReplicaSetHealth()
```

**In MongoDB Compass:**
1. Keep Compass connected to the replica set
2. Watch the topology view for member status
3. Use Performance tab to monitor replication metrics
4. Note how connection status shows current primary

### Step 4: Read Preferences Configuration

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

### Step 5: Write and Read Concerns for Insurance Operations

```javascript
use insurance_company

print("=== Write Concerns for Insurance Operations ===")
print("")

// Demonstrate different write concerns
print("1. MAJORITY WRITE CONCERN (Recommended for critical data)")
print("   Purpose: Ensures writes are acknowledged by majority of replica set")
print("   Example: Policy updates, claim settlements")
print("   Configuration: { w: 'majority', j: true, wtimeout: 10000 }")
print("")

// Test majority write concern with actual data
print("Testing majority write concern...")
var result = db.policies.updateOne(
  { _id: { $exists: true } },
  { $set: { lastReviewDate: new Date(), reviewedBy: "system" } },
  { writeConcern: { w: "majority", j: true, wtimeout: 5000 } }
)
print("Write result: " + (result.acknowledged ? "SUCCESS" : "FAILED"))
print("Documents modified: " + result.modifiedCount)
print("")

print("2. SINGLE NODE WRITE CONCERN (Faster but less durable)")
print("   Purpose: Immediate acknowledgment from primary only")
print("   Example: Logging, temporary data")
print("   Configuration: { w: 1, j: true }")
print("")

// Test single node write concern
print("Testing single node write concern...")
var logResult = db.activity_log.insertOne(
  {
    operation: "demo_write_concern",
    timestamp: new Date(),
    description: "Testing write concern behavior"
  },
  { writeConcern: { w: 1, j: true } }
)
print("Log write result: " + (logResult.acknowledged ? "SUCCESS" : "FAILED"))
print("")

print("=== Read Concerns for Insurance Operations ===")
print("")
print("1. LOCAL READ CONCERN (Default - fastest)")
print("   Purpose: Reads most recent data from the member")
print("   Use case: Real-time dashboards, non-critical queries")
print("")

print("2. MAJORITY READ CONCERN (Consistent across majority)")
print("   Purpose: Only returns data acknowledged by majority")
print("   Use case: Financial reports, compliance queries")
print("")

// Demonstrate read concerns
print("Testing local read concern...")
var localCount = db.claims.countDocuments(
  { status: { $exists: true } },
  { readConcern: { level: "local" } }
)
print("Claims found with local read: " + localCount)

print("Testing majority read concern...")
var majorityCount = db.claims.countDocuments(
  { status: { $exists: true } },
  { readConcern: { level: "majority" } }
)
print("Claims found with majority read: " + majorityCount)
print("")

print("=== Insurance Data Durability Best Practices ===")
print("- Policy changes: Use majority + journal for regulatory compliance")
print("- Claim settlements: Use majority + timeout for financial accuracy")
print("- Customer updates: Use majority to ensure data consistency")
print("- Audit logs: Use single node + journal for performance")
print("- Financial reports: Use majority read concern for accuracy")
print("- Real-time dashboards: Use local read concern for speed")
```

**Monitor in Compass:**
- Watch the Performance tab during write operations
- Observe connection status showing replica set health
- Use the Real Time tab to see operation timing
- Note how write acknowledgment timing varies with different concerns

## Part C: Monitoring and Maintenance (10 minutes)

### Step 6: Comprehensive Monitoring

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

### Step 7: Maintenance Operations (Demonstration)

```javascript
// Demonstrate maintenance operations (informational - don't run in production)
print("=== Replica Set Maintenance Operations ===")
print("")

print("1. PRIMARY STEP DOWN")
print("   Command: rs.stepDown(60)")
print("   Purpose: Gracefully step down primary for maintenance")
print("   Effect: Primary becomes secondary, triggers election")
print("   Use case: Rolling maintenance, planned failover")
print("")

print("2. FREEZE SECONDARY")
print("   Command: rs.freeze(300)")
print("   Purpose: Prevent secondary from becoming primary")
print("   Effect: Member won't participate in elections")
print("   Use case: Maintenance on specific member")
print("")

print("3. RECONFIGURE REPLICA SET")
print("   Command: rs.reconfig(newConfig)")
print("   Purpose: Update replica set configuration")
print("   Examples: Change priorities, add/remove members")
print("   Use case: Topology changes, performance tuning")
print("")

print("4. COMMON CONFIGURATION CHANGES")
print("   Election timeout: controls how quickly elections happen")
print("   Heartbeat interval: how often members check each other")
print("   Priority values: influence primary selection")
print("   Tag sets: enable zone-aware operations")
print("")

// Show current configuration safely
print("Current replica set configuration:")
var config = rs.conf()
print("Members: " + config.members.length)
print("Election timeout: " + (config.settings ? config.settings.electionTimeoutMillis : "default (10000ms)"))
print("Heartbeat interval: " + (config.settings ? config.settings.heartbeatIntervalMillis : "default (2000ms)"))
print("")

print("=== Best Practices for Insurance Operations ===")
print("- Schedule maintenance during low-traffic hours")
print("- Use rolling maintenance to maintain availability")
print("- Monitor replication lag during operations")
print("- Test failover procedures regularly")
print("- Document emergency procedures")
print("- Use connection string with multiple hosts")
```

## Lab 11 Deliverables
✅ **Replica set architecture understanding** with comprehensive member type knowledge
✅ **Failover concepts** with election process and health analysis
✅ **Read preferences** configured for different insurance operations (real-time vs. analytics)
✅ **Comprehensive monitoring** setup for insurance data replication and branch connectivity
✅ **Write/read concerns** optimized for insurance compliance and data consistency requirements
✅ **Maintenance procedures** understanding for production replica set operations