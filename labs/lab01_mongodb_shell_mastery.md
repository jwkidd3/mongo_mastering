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

## 📊 Load Course Data First!

**Before starting this lab, load the Day 1 course data:**

```bash
mongosh < data/day1_data_loader.js
```

**Wait for this success message:**
```
✅ DAY 1 INSURANCE DATA LOADING COMPLETE!
```

**Test data loaded correctly:**
```bash
mongosh --eval "db.getSiblingDB('insurance_company').branches.countDocuments()"
mongosh --eval "db.getSiblingDB('insurance_company').policies.countDocuments()"
```

**Expected output:** Branches: 5, Policies: 10

💡 **See [LOAD_DATA.md](../LOAD_DATA.md) for detailed instructions and troubleshooting**

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
   db.createCollection("policies")

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
   db.adminCommand({listCollections: 1})

   // Profiling commands
   db.setProfilingLevel(2)
   db.getProfilingLevel()
   db.getProfilingStatus()

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
   DBQuery.shellBatchSize = 10
   ```

## Challenge Exercise
Write a JavaScript function in the shell that connects to three different insurance-related databases (insurance_company, claims_processing, agent_management), creates a collection in each, and reports the total number of collections across all databases.