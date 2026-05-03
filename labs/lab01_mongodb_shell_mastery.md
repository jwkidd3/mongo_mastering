# Lab 1: MongoDB Shell Mastery and Server Navigation (45 minutes)

## Learning Objectives
- Master `mongosh` command-line interface
- Navigate MongoDB server hierarchy (databases, collections, documents)
- Understand MongoDB shell context and JavaScript environment
- Execute administrative commands and inspect server status

## Prerequisites
- MongoDB Docker container running and accessible
- Terminal/command prompt access
- **Course data loaded** (see instructions below)

## Prerequisites: Load Course Data

Before starting this lab, ensure the MongoDB environment is running and course data is loaded:

```bash
# From the project root
mongosh "mongodb://localhost:27017/?directConnection=true" < data/comprehensive_data_loader.js
```

> **Windows (PowerShell):** PowerShell does not forward `<` into `mongosh` — the command will error. Use `--file` instead:
> ```powershell
> mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
> ```

Verify the data loaded successfully:

```bash
mongosh "mongodb://localhost:27017/?directConnection=true" --eval "use insurance_company; db.policies.countDocuments()"
```

## Tasks

### Part A: Shell Connection and Basic Navigation (15 minutes)
1. **Connect to MongoDB Shell**
   ```bash
   # Connect to MongoDB (assuming Docker container on localhost:27017)
   mongosh mongodb://localhost:27017

   ```

2. **Server Information Commands**
   ```javascript
   // Check MongoDB version and build info
   db.version()
   db.runCommand({buildInfo: 1})

   // Display current database
   db

   // Show server status
   db.serverStatus()

   // Display connection info
   db.runCommand({connectionStatus: 1})
   ```

3. **Database Discovery**
   ```javascript
   // List all databases
   show dbs

   // Get database stats
   db.stats()

   // Show current database name
   db.getName()

   // Check if database exists
   use admin
   db.runCommand({listDatabases: 1})
   ```

### Part B: JavaScript Environment and Helper Methods (20 minutes)
1. **JavaScript Context Exploration**
   ```javascript
   // Demonstrate JavaScript in shell
   var currentDate = new Date()
   print("Current date: " + currentDate)

   // Mathematical operations
   var calculation = Math.PI * Math.pow(5, 2)
   print("Circle area with radius 5: " + calculation)

   // Variable assignment and manipulation
   var dbName = "insurance_company"
   var collectionName = "policies"
   print("Working with: " + dbName + "." + collectionName)
   ```

2. **Shell Helper Methods**
   ```javascript
   // Database helpers
   use insurance_company  // Switch to 'insurance_company' database

   // Collection helpers
   show collections  // List collections in current database
   db.createCollection("lab1_test")  // Use test name to avoid conflict with pre-loaded data

   // Index helpers
   db.policies.getIndexes()
   db.policies.totalIndexSize()

   // Status helpers
   db.stats()
   db.policies.stats()
   ```

3. **Advanced Shell Commands**
   ```javascript
   // Command execution methods
   db.runCommand({ping: 1})
   db.runCommand({listCollections: 1})

   // Profiling commands
   db.setProfilingLevel(2)
   db.getProfilingStatus()  // Modern replacement for getProfilingLevel()
   db.setProfilingLevel(0)  // Turn off profiling after demo

   // Current operations
   db.currentOp()
   ```

### Part C: Command History and Shell Configuration (10 minutes)
1. **History Management**
   ```javascript
   // View command history (up/down arrows)
   // Use Ctrl+R for reverse search

   // Clear screen
   cls  // or use Ctrl+L

   // Exit shell
   exit  // or use Ctrl+C twice
   ```

2. **Shell Customization**
   ```javascript
   // Set custom prompt
   prompt = function() { return db.getName() + "> ";}

   // Disable line wrapping for long output
   config.set("displayBatchSize", 10)
   ```

## Cleanup and Environment Teardown

### Clean Up Test Data (Optional)

```javascript
// Remove test collection created during this lab
use insurance_company
db.lab1_test.drop()
print("✅ Test data cleaned up")
```

### Environment Teardown
When finished with the lab, use the standardized teardown script:

**macOS/Linux:**
```bash
cd scripts
./teardown.sh
```

**Windows PowerShell:**
```powershell
cd scripts
.\teardown.ps1
```

## Lab 1 Deliverables
✅ **Shell Connection**: Connected to MongoDB and inspected server status
✅ **Database Navigation**: Listed databases, switched contexts, and explored database hierarchy
✅ **JavaScript Environment**: Executed JavaScript commands and used shell helper methods
✅ **Administrative Commands**: Ran profiling, status, and operational commands

## Challenge Exercise
Write a JavaScript function in the shell that connects to three different insurance-related databases (insurance_company, claims_processing, agent_management), creates a collection in each, and reports the total number of collections across all databases.