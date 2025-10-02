# Lab 11: Replica Sets & High Availability
**Duration:** 45 minutes
**Objective:** Understand replica sets through hands-on testing: write to primary, read from secondary, and observe automatic failover

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

## Part A: Understanding Replica Set Basics (10 minutes)

### Step 1: Check Replica Set Status

Connect to MongoDB and examine the replica set:

```javascript
// Check replica set members
rs.status()

// Check which member is primary
db.hello()

// View configuration
rs.conf()
```

**What to look for:**
- 3 members total
- 1 PRIMARY, 2 SECONDARY
- All members healthy (health: 1)

## Part B: Write to Primary, Read from Secondary (15 minutes)

### Step 2: Write Data to Primary

Use the insurance_company database and insert some test policies:

```javascript
use insurance_company

// Insert new policies to primary
db.policies.insertMany([
  { policyNumber: "POL-TEST-001", status: "Active", premium: 5000, type: "Auto", timestamp: new Date() },
  { policyNumber: "POL-TEST-002", status: "Pending", premium: 8500, type: "Home", timestamp: new Date() },
  { policyNumber: "POL-TEST-003", status: "Active", premium: 3200, type: "Life", timestamp: new Date() }
])

// Verify the write
db.policies.countDocuments({ policyNumber: /POL-TEST/ })
```

### Step 3: Read from Secondary

Connect directly to a secondary member:

```bash
mongosh --port 27018
```

Enable secondary reads (required on secondaries):
```javascript
// Allow reads on secondary
rs.secondaryOk()

// Switch to the database
use insurance_company

// Now read test policies from this secondary
db.policies.find({ policyNumber: /POL-TEST/ }).toArray()

// Count documents on secondary
db.policies.countDocuments({ policyNumber: /POL-TEST/ })
```

### Step 4: Compare Primary vs Secondary Reads

Exit and reconnect to primary (port 27017):
```bash
exit
mongosh --port 27017
```

```javascript
// Switch to insurance_company database
use insurance_company

// Read from primary (default)
db.policies.find({ policyNumber: /POL-TEST/ }).toArray()
```

**Key Concept:**
- Secondaries replicate data from the primary
- By default, secondaries reject reads (you must run `rs.secondaryOk()`)
- Reading from secondaries distributes load but may return slightly stale data

## Part C: Failover Testing (15 minutes)

### Step 5: Identify Current Primary

```javascript
// Check which member is primary
var status = rs.status()
status.members.forEach(function(member) {
  if (member.state === 1) {
    print("PRIMARY: " + member.name)
  } else if (member.state === 2) {
    print("SECONDARY: " + member.name)
  }
})
```

### Step 6: Simulate Primary Failure

**In a new terminal window**, connect directly to the current primary and shut it down:

```bash
# Connect to the primary (adjust port based on your primary from Step 5)
docker exec -it mongo1 mongosh --port 27017

# Step down the primary to trigger election
rs.stepDown(60)
```

**Immediately switch back to your original terminal** and observe the election:

```javascript
// Watch the election happen (run multiple times)
rs.status()

// Check if new primary was elected
db.hello()
```

**What to observe:**
- Election completes within seconds
- One of the former secondaries becomes PRIMARY
- The stepped-down member becomes SECONDARY
- No data loss occurred

### Step 7: Verify Data Integrity After Failover

```javascript
// Verify data is still accessible
db.policies.countDocuments({ policyNumber: /POL-TEST/ })

// Insert new policy to new primary
db.policies.insertOne({ policyNumber: "POL-TEST-004", status: "Active", premium: 7500, type: "Commercial", timestamp: new Date() })

// Verify the new write
db.policies.find({ policyNumber: "POL-TEST-004" })
```

### Step 8: Observe Replication

```javascript
// Check replication lag
rs.printSecondaryReplicationInfo()

// Verify data on primary (you're already in insurance_company database)
db.policies.countDocuments({ policyNumber: /POL-TEST/ })
```

Exit and connect to secondary to verify replication:
```bash
exit
mongosh --port 27018
```

```javascript
// Enable secondary reads
rs.secondaryOk()

// Switch to insurance_company database
use insurance_company

// Verify same data count on secondary (including new policy written after failover)
db.policies.countDocuments({ policyNumber: /POL-TEST/ })
```

## Part D: Understanding Write and Read Concerns (5 minutes)

### Step 9: Write Concerns

Reconnect to primary if needed:
```bash
mongosh --port 27017
```

```javascript
// Switch to insurance_company database
use insurance_company

// Write with majority concern (waits for majority acknowledgment)
db.policies.insertOne(
  { policyNumber: "POL-TEST-005", status: "Active", premium: 9000, type: "Auto", timestamp: new Date() },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
)

// Write with w:1 (only primary acknowledgment)
db.policies.insertOne(
  { policyNumber: "POL-TEST-006", status: "Active", premium: 4500, type: "Life", timestamp: new Date() },
  { writeConcern: { w: 1 } }
)
```

**Key Difference:**
- `w: "majority"` - Safer, waits for majority of members
- `w: 1` - Faster, only waits for primary

### Step 10: Read Concerns

```javascript
// Read with majority concern (only majority-acknowledged data)
db.policies.find({ policyNumber: /POL-TEST/ }).readConcern("majority")

// Read with local concern (fastest, may include non-replicated data)
db.policies.find({ policyNumber: /POL-TEST/ }).readConcern("local")
```

## Lab 11 Deliverables

✅ **Understand replica set architecture:** 1 primary, multiple secondaries
✅ **Write to primary:** All writes go to primary node
✅ **Read from secondary:** Distribute read load using read preferences
✅ **Automatic failover:** Primary failure triggers automatic election
✅ **Data integrity:** No data loss during failover
✅ **Write/read concerns:** Control durability and consistency trade-offs