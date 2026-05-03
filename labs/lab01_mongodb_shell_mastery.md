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

## Tooling Check (do this first, 2 minutes)

The whole course needs Docker. Day 3's Lab 14 *also* needs one of `dotnet` (Lab 14A), `node` (Lab 14B), or `python3` (Lab 14C). Verify what you have now so a missing tool doesn't surprise you on Day 3.

**macOS / Linux / WSL:**
```bash
docker --version            # required for every lab
mongosh --version           # required for CLI path; not needed if you'll use Compass
dotnet --version            # only needed if you'll do Lab 14A (C#)
node --version              # only needed if you'll do Lab 14B (Node.js)
python3 --version           # only needed if you'll do Lab 14C (Python)
```

**Windows PowerShell:**
```powershell
docker --version
mongosh --version
dotnet --version
node --version
python --version
```

If `docker --version` fails, install Docker Desktop and re-run. If `mongosh --version` fails *and* you don't want to install it, use MongoDB Compass instead — its embedded `MONGOSH` tab is a full mongosh, so you only need Docker. The Lab 14 language tools can be installed before Day 3.

## Choose Your Tool: MongoDB Compass or `mongosh` CLI

You can drive every command in this course with either tool. Both connect to the same MongoDB instance and run the same commands — pick whichever you're more comfortable with. Other labs will reference back to this section when they show data-load steps.

### Option A: MongoDB Compass (recommended for first-time users)

[MongoDB Compass](https://www.mongodb.com/products/tools/compass) is the official GUI. It includes a built-in `MongoSH` shell tab, so you get the full mongosh experience without installing anything else and without running into platform-specific shell quirks (like PowerShell's `<` redirection — see Option B).

1. **Install Compass** if you don't already have it.
2. **Connect**: paste this into the connection string field and click **Connect**:
   ```
   mongodb://localhost:27017/?directConnection=true
   ```
3. **Open the embedded shell**: at the bottom of the Compass window, click the **`>_ MONGOSH`** tab. You're now in a full `mongosh` prompt — every command shown in this course works here.

### Option B: `mongosh` command line

If you prefer the CLI, [install mongosh](https://www.mongodb.com/try/download/shell) and connect from any terminal:

```bash
mongosh "mongodb://localhost:27017/?directConnection=true"
```

Works identically on macOS, Linux, WSL, and Windows PowerShell.

## Prerequisites: Load Course Data

Pick the tool you connected with above, then load the comprehensive course data.

### From Compass's `MONGOSH` tab

Either run `load()` with the absolute path to the loader file (forward slashes work on Windows too):

```javascript
load('/absolute/path/to/mongo_mastering/data/comprehensive_data_loader.js')
```

Or open `data/comprehensive_data_loader.js` in any editor, copy the full contents, and paste them into the `MONGOSH` tab.

### From the `mongosh` CLI

**macOS / Linux / WSL:**
```bash
mongosh "mongodb://localhost:27017/?directConnection=true" < data/comprehensive_data_loader.js
```

**Windows PowerShell:** PowerShell does not forward `<` into `mongosh`. Use `--file`:
```powershell
mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
```

### Verify the data loaded

**From a terminal (mongosh CLI):**
```bash
mongosh "mongodb://localhost:27017/insurance_company?directConnection=true" --eval "db.policies.countDocuments()"
```

**From the Compass MONGOSH tab** (already connected to the cluster):
```javascript
db.getSiblingDB('insurance_company').policies.countDocuments()
```

Either should print a number greater than zero.

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