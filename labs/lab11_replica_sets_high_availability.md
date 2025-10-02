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

**Using MongoSH to explore the replica set:**
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
// Step 1: Check current replica set status
print("=== Current Replica Set Members ===");
var status = rs.status();
```

```javascript
// Step 2: Display member information
if (status && status.members && status.members.length >= 3) {
    print("Member 1: " + status.members[0].name + " - " + status.members[0].stateStr);
    print("Member 2: " + status.members[1].name + " - " + status.members[1].stateStr);
    print("Member 3: " + status.members[2].name + " - " + status.members[2].stateStr);
} else {
    print("Warning: Expected 3 replica set members but found " + (status && status.members ? status.members.length : "none"));
    if (status && status.members) {
        status.members.forEach((member, index) => {
            print("Member " + (index + 1) + ": " + member.name + " - " + member.stateStr);
        });
    }
}
```

```javascript
// Step 3: Show member types explanation
print("=== Member Types Explanation ===");
print("PRIMARY: Receives all writes, can serve reads");
print("SECONDARY: Replicates data from primary, can serve reads with read preference");
print("ARBITER: Votes in elections but stores no data (not in our current setup)");
print("HIDDEN: Replicates data but doesn't serve client reads (not in our current setup)");
print("DELAYED: Maintains historical snapshot of data (not in our current setup)");
```

**Replica Set Member Types Demo:**

```javascript
// Step 1: Show member types demonstration header
print("=== Replica Set Member Types Demo ===");
```

```javascript
// Step 2: Arbiter member explanation
print("1. ARBITER MEMBER (Voting Only)");
print("   Configuration: { _id: 3, host: 'arbiter:27017', arbiterOnly: true }");
print("   Purpose: Provides voting in elections without storing data");
print("   Use case: Odd number of votes in geographically distributed deployments");
```

```javascript
// Step 3: Hidden member explanation
print("2. HIDDEN MEMBER (Data but No Client Reads)");
print("   Configuration: { _id: 4, host: 'hidden:27017', priority: 0, hidden: true, votes: 0 }");
print("   Purpose: Analytics, backups, or reporting without affecting client traffic");
print("   Use case: Dedicated analytics replica that doesn't impact production reads");
```

```javascript
// Step 4: Delayed member explanation
print("3. DELAYED MEMBER (Historical Data)");
print("   Configuration: { _id: 5, host: 'delayed:27017', priority: 0, hidden: true, secondaryDelaySecs: 3600 }");
print("   Purpose: Maintains historical view for disaster recovery");
print("   Use case: Protection against accidental data deletion or corruption");
```

```javascript
// Step 5: High priority member explanation
print("4. HIGH PRIORITY MEMBER (Preferred Primary)");
print("   Configuration: { _id: 0, host: 'primary:27017', priority: 2 }");
print("   Purpose: Prefers to be primary when available");
print("   Use case: Ensuring primary runs in preferred data center");
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
// Step 1: Get replica set status and configuration
print("=== Replica Set Health Analysis ===");
```

```javascript
// Step 2: Gather status information
var status = rs.status();
var config = rs.conf();
```

```javascript
// Step 3: Display basic set information
if (status && status.set) {
    print("Set name: " + status.set);
    if (status.members) {
        print("Total members: " + status.members.length);
        print("Majority needed for elections: " + (Math.floor(status.members.length / 2) + 1));
    } else {
        print("No members found in replica set status");
    }
} else {
    print("No replica set status available");
}
print("");
```

```javascript
// Step 4: Check member 1 status and configuration
if (status && status.members && status.members.length > 0 && config && config.members && config.members.length > 0) {
    var member1 = status.members[0];
    var member1Config = config.members[0];
    print("Member: " + member1.name);
    print("  State: " + member1.stateStr);
    print("  Health: " + member1.health);
    print("  Can become primary: " + (member1Config.priority > 0 ? "Yes" : "No"));
    print("  Can vote: " + (member1Config.votes > 0 ? "Yes" : "No"));
    if (member1.state === 1) print("  *** CURRENT PRIMARY ***");
} else {
    print("Member 1: Not available");
}
print("");
```

```javascript
// Step 5: Check member 2 status and configuration
if (status && status.members && status.members.length > 1 && config && config.members && config.members.length > 1) {
    var member2 = status.members[1];
    var member2Config = config.members[1];
    print("Member: " + member2.name);
    print("  State: " + member2.stateStr);
    print("  Health: " + member2.health);
    print("  Can become primary: " + (member2Config.priority > 0 ? "Yes" : "No"));
    print("  Can vote: " + (member2Config.votes > 0 ? "Yes" : "No"));
    if (member2.state === 1) print("  *** CURRENT PRIMARY ***");
} else {
    print("Member 2: Not available");
}
print("");
```

```javascript
// Step 6: Check member 3 status and configuration
if (status && status.members && status.members.length > 2 && config && config.members && config.members.length > 2) {
    var member3 = status.members[2];
    var member3Config = config.members[2];
    print("Member: " + member3.name);
    print("  State: " + member3.stateStr);
    print("  Health: " + member3.health);
    print("  Can become primary: " + (member3Config.priority > 0 ? "Yes" : "No"));
    print("  Can vote: " + (member3Config.votes > 0 ? "Yes" : "No"));
    if (member3.state === 1) print("  *** CURRENT PRIMARY ***");
} else {
    print("Member 3: Not available");
}
print("");
```

```javascript
// Step 7: Explain failover scenarios
print("=== Failover Scenarios ===");
print("If primary fails:");
print("- Remaining 2 members form majority");
print("- Election triggered automatically");
print("- New primary elected within seconds");
print("- Applications reconnect to new primary");
print("");
print("If 2 members fail:");
print("- Remaining 1 member cannot form majority");
print("- Replica set becomes read-only");
print("- No new primary can be elected");
print("- Service degraded until members recover");
```

**Note:** This demonstrates automatic failover concepts. In production environments, monitoring tools would track these member state changes and trigger alerts for operational teams.

### Step 4: Read Preferences Configuration

**Connection String Examples for Different Read Preferences:**

1. **Primary Only:** `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=primary`
2. **Secondary Preferred:** `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=secondaryPreferred`
3. **Nearest:** `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&readPreference=nearest`

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

**Monitoring Write Concerns:**
Use `db.runCommand({getLastError: 1})` to check write acknowledgment status and timing in production environments.

## Part C: Monitoring and Maintenance (10 minutes)

### Step 6: Comprehensive Monitoring

**Production Monitoring Considerations:**
1. **Performance Metrics:** Operations/sec, read/write distribution, replication lag
2. **System Metrics:** Memory usage, connections, network I/O
3. **Health Monitoring:** Member state tracking and alerting

**MongoSH Monitoring Script for Insurance Operations:**

```javascript
// Step 1: Initialize monitoring display
print("=== Insurance Company Replica Set Monitoring ===");
```

```javascript
// Step 2: Get replica set status and display basic info
var status = rs.status();
print("Replica Set: " + status.set);
print("Date: " + status.date);
```

```javascript
// Step 3: Display branch data center status header
print("\n--- Branch Data Center Status ---");
```

```javascript
// Step 4: Check member 1 status with business context
if (status && status.members && status.members.length > 0) {
    var member1 = status.members[0];
    var role1 = "";
    if (member1.state === 1) role1 = "[PRIMARY - Main Operations]";
    else if (member1.state === 2) role1 = "[SECONDARY - Branch/Analytics]";
    else if (member1.state === 7) role1 = "[ARBITER - Voting Only]";
    print(member1.name + ": " + member1.stateStr + " " + role1 + " (Health: " + member1.health + ")");
    if (member1.optimeDate) print("  Last Optime: " + member1.optimeDate);
    if (member1.lastHeartbeat) print("  Last Heartbeat: " + member1.lastHeartbeat);
} else {
    print("Member 1: Not available");
}
```

```javascript
// Step 5: Check member 2 status with business context
if (status && status.members && status.members.length > 1) {
    var member2 = status.members[1];
    var role2 = "";
    if (member2.state === 1) role2 = "[PRIMARY - Main Operations]";
    else if (member2.state === 2) role2 = "[SECONDARY - Branch/Analytics]";
    else if (member2.state === 7) role2 = "[ARBITER - Voting Only]";
    print(member2.name + ": " + member2.stateStr + " " + role2 + " (Health: " + member2.health + ")");
    if (member2.optimeDate) print("  Last Optime: " + member2.optimeDate);
    if (member2.lastHeartbeat) print("  Last Heartbeat: " + member2.lastHeartbeat);
} else {
    print("Member 2: Not available");
}
```

```javascript
// Step 6: Check member 3 status with business context
if (status && status.members && status.members.length > 2) {
    var member3 = status.members[2];
    var role3 = "";
    if (member3.state === 1) role3 = "[PRIMARY - Main Operations]";
    else if (member3.state === 2) role3 = "[SECONDARY - Branch/Analytics]";
    else if (member3.state === 7) role3 = "[ARBITER - Voting Only]";
    print(member3.name + ": " + member3.stateStr + " " + role3 + " (Health: " + member3.health + ")");
    if (member3.optimeDate) print("  Last Optime: " + member3.optimeDate);
    if (member3.lastHeartbeat) print("  Last Heartbeat: " + member3.lastHeartbeat);
} else {
    print("Member 3: Not available");
}
```

```javascript
// Step 7: Analyze replication lag for insurance data consistency
print("\n--- Branch Data Replication Lag ---");
var primary = status.members.find(function(m) { return m.state === 1; });
```

```javascript
// Step 8: Check lag for secondary members (if primary exists)
if (primary) {
    var secondaries = status.members.filter(function(m) { return m.state === 2; });
    if (secondaries.length > 0) {
        var secondary1 = secondaries[0];
        var lag1 = (primary.optimeDate - secondary1.optimeDate) / 1000;
        var lagStatus1 = lag1 < 5 ? "[OK]" : lag1 < 15 ? "[WARNING]" : "[CRITICAL]";
        print(secondary1.name + ": " + lag1.toFixed(2) + " seconds behind primary " + lagStatus1);
    }
    if (secondaries.length > 1) {
        var secondary2 = secondaries[1];
        var lag2 = (primary.optimeDate - secondary2.optimeDate) / 1000;
        var lagStatus2 = lag2 < 5 ? "[OK]" : lag2 < 15 ? "[WARNING]" : "[CRITICAL]";
        print(secondary2.name + ": " + lag2.toFixed(2) + " seconds behind primary " + lagStatus2);
    }
}
```

```javascript
// Step 9: Display oplog information
print("\n--- Oplog Information ---");
var oplogStats = db.getSiblingDB("local").oplog.rs.stats();
print("Oplog Size: " + (oplogStats.size / 1024 / 1024).toFixed(2) + " MB");
print("Oplog Used: " + (oplogStats.storageSize / 1024 / 1024).toFixed(2) + " MB");
```

```javascript
// Step 10: Calculate oplog window
var firstOp = db.getSiblingDB("local").oplog.rs.find().sort({ ts: 1 }).limit(1).next();
var lastOp = db.getSiblingDB("local").oplog.rs.find().sort({ ts: -1 }).limit(1).next();
var oplogWindow = (lastOp.ts.t - firstOp.ts.t) / 3600;
print("Oplog Window: " + oplogWindow.toFixed(2) + " hours");
```

```javascript
// Step 11: Monitor insurance-specific data volumes
print("\n--- Insurance Data Volume ---");
use insurance_company;
print("Active Policies: " + db.policies.countDocuments({ status: "Active" }));
print("Open Claims: " + db.claims.countDocuments({ status: { $in: ["Filed", "Under Review"] } }));
print("Today's Payments: " + db.payments.countDocuments({ paymentDate: { $gte: new Date(new Date().setHours(0,0,0,0)) } }));
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