# MongoDB Mastering Course

Complete 3-day MongoDB training course with hands-on labs and enterprise-ready configuration.

## Quick Start

### 1. Automated Setup (Recommended)

**macOS/Linux:**
```bash
./setup.sh
```

**Windows PowerShell:**
```powershell
.\setup.ps1
```

**Windows Docker Desktop Requirements**:
- Ensure Docker Desktop is running and fully started
- Use "Use the WSL 2 based engine" setting if available
- If networking issues persist, try restarting Docker Desktop

### Windows-Specific Setup: Hosts File Configuration

**Windows users may need to update the hosts file** to resolve Docker container hostnames. If you encounter "ENOTFOUND mongo1", "mongo2", or "mongo3" errors, follow these steps:

#### Option 1: Automatic Hosts File Update (Run as Administrator)
```powershell
# Open PowerShell as Administrator and run:
Add-Content -Path "$env:windir\System32\drivers\etc\hosts" -Value "`n127.0.0.1 mongo1"
Add-Content -Path "$env:windir\System32\drivers\etc\hosts" -Value "127.0.0.1 mongo2"
Add-Content -Path "$env:windir\System32\drivers\etc\hosts" -Value "127.0.0.1 mongo3"
```

#### Option 2: Manual Hosts File Update
1. **Open Notepad as Administrator**:
   - Press `Win + S`, type "notepad"
   - Right-click "Notepad" → "Run as administrator"

2. **Open the hosts file**:
   - In Notepad: File → Open
   - Navigate to: `C:\Windows\System32\drivers\etc\`
   - Change file type filter to "All Files"
   - Select and open the `hosts` file

3. **Add the following lines at the end**:
   ```
   127.0.0.1 mongo1
   127.0.0.1 mongo2
   127.0.0.1 mongo3
   ```

4. **Save the file** (Ctrl+S)

#### Option 3: Use Direct Connection (Alternative)
If you prefer not to modify the hosts file, use the `directConnection=true` parameter in all MongoDB connections:
```bash
mongosh "mongodb://localhost:27017/?directConnection=true"
```

**Note**: After updating the hosts file, Windows will resolve mongo1, mongo2, and mongo3 to localhost, allowing normal MongoDB operations without the directConnection parameter.

### 2. Load Course Data

**Option A: Load All 3 Days at Once (Recommended)**

**macOS/Linux:**
```bash
mongosh "mongodb://localhost:27017/?directConnection=true" < data/comprehensive_data_loader.js
```

**Windows PowerShell:**
```powershell
Get-Content data\comprehensive_data_loader.js | mongosh "mongodb://localhost:27017/?directConnection=true"
```

**Windows Data Loader Issues**:
If you see "falling back to inline data loading" on Windows, this is a known issue with `mongosh` path resolution on Windows. The inline loading provides the exact same data - this is not an error.

**Alternative Windows Approaches** (if you prefer individual script loading):

**Option 1: Run from data directory**:
```powershell
cd data
Get-Content comprehensive_data_loader.js | mongosh
```

**Option 2: Load individual scripts manually**:
```powershell
cd data
Get-Content day1_data_loader.js | mongosh
Get-Content day2_data_loader.js | mongosh
Get-Content day3_data_loader.js | mongosh
```

**Option 3: Use inline loading (recommended for Windows)**:
The comprehensive loader automatically detects Windows path issues and loads all data inline. This provides identical results and is actually more reliable than file loading on Windows.

**✅ Important**: Inline loading is not an error - it provides the exact same data as individual file loading. The course will work perfectly with inline loading.

**Option B: Load Individual Days**

**macOS/Linux:**
```bash
mongosh "mongodb://localhost:27017/?directConnection=true" < data/day1_data_loader.js  # Day 1: Fundamentals
mongosh "mongodb://localhost:27017/?directConnection=true" < data/day2_data_loader.js  # Day 2: Advanced Features
mongosh "mongodb://localhost:27017/?directConnection=true" < data/day3_data_loader.js  # Day 3: Production
```

**Windows PowerShell:**
```powershell
Get-Content data\day1_data_loader.js | mongosh "mongodb://localhost:27017/?directConnection=true"  # Day 1: Fundamentals
Get-Content data\day2_data_loader.js | mongosh "mongodb://localhost:27017/?directConnection=true"  # Day 2: Advanced Features
Get-Content data\day3_data_loader.js | mongosh "mongodb://localhost:27017/?directConnection=true"  # Day 3: Production
```

### 3. Test Everything Works

**macOS/Linux:**
```bash
./test.sh
```

**Windows PowerShell:**
```powershell
.\test.ps1
```

### 4. Verify Connection

Test basic MongoDB connection:

**Use Direct Connection (Recommended):**
```bash
mongosh "mongodb://localhost:27017/?directConnection=true"
```

**If you get "ENOTFOUND mongo1" or "mongo2" errors**, use the direct connection string above, or:

**Alternative Connection Methods:**
```bash
# Option A: Direct connection with mongosh
mongosh "mongodb://localhost:27017/?directConnection=true" --eval "db.hello()"

# Option B: Connection testing script
mongosh "mongodb://localhost:27017/?directConnection=true" < scripts/test_connection.js

# Option C: Windows PowerShell
Get-Content scripts\test_connection.js | mongosh "mongodb://localhost:27017/?directConnection=true"
```

**Why directConnection=true?** The replica set uses Docker container hostnames (mongo1, mongo2, mongo3) internally. When connecting from outside Docker, use `directConnection=true` to bypass replica set discovery and connect directly to the primary.

### 5. Connect with MongoDB Compass (Optional)

MongoDB Compass provides a visual interface for working with your data:

1. **Install MongoDB Compass** (if not already installed)
   - Download from: https://www.mongodb.com/try/download/compass

2. **Connection Options** (try in this order):

   **Option A: Direct Connection (Recommended)**
   ```
   mongodb://localhost:27017/?directConnection=true
   ```

   **Option B: Single Node (Windows Fallback)**
   ```
   mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
   ```

   **Option C: Manual Configuration (Windows Docker Issues)**
   - Host: `localhost` (or `127.0.0.1`)
   - Port: `27017`
   - Authentication: None
   - In Advanced Options → Connection → check "Direct Connection"

3. **Connect Steps**:
   - Open MongoDB Compass
   - Try Option A connection string first
   - If connection fails with "cannot find mongo2" error, try Option B
   - If both fail, use Option C with manual configuration
   - You should see the `insurance_company` and other databases after loading course data

**Windows Troubleshooting**:
- If you see "address not found mongo2", the `directConnection=true` parameter should prevent this
- If connection still fails, try `127.0.0.1` instead of `localhost`
- Docker Desktop on Windows may require restart if networking is not working
- Alternative: Use `mongosh` command line instead of Compass

**Windows Docker Networking Issues**:
If you cannot connect to `localhost:27018` or `localhost:27019` on Windows:

1. **Check Docker Desktop Status**:
   ```powershell
   docker ps
   ```
   Verify all 3 containers (mongo1, mongo2, mongo3) are running

2. **Test Port Connectivity**:
   ```powershell
   # Test each port individually
   mongosh --host localhost --port 27017 --eval "db.hello().isWritablePrimary"
   mongosh --host localhost --port 27018 --eval "db.hello().secondary"
   mongosh --host localhost --port 27019 --eval "db.hello().secondary"
   ```

3. **Use 127.0.0.1 Instead of localhost**:
   ```powershell
   mongosh --host 127.0.0.1 --port 27018
   ```

4. **Docker Desktop Restart** (often fixes Windows networking):
   - Right-click Docker Desktop in system tray
   - Select "Restart Docker Desktop"
   - Wait for complete restart
   - Re-run setup: `.\setup.ps1`

5. **Windows-Specific Connection String**:
   ```
   mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/?replicaSet=rs0
   ```

6. **Alternative: Primary-Only Mode for Windows**:
   If secondary members remain unreachable, you can work with just the primary:
   ```powershell
   mongosh --host localhost --port 27017
   # or
   mongosh "mongodb://localhost:27017/?directConnection=true"
   ```

   **Note**: This limits some replica set features but allows all basic MongoDB operations and most course labs to work.

### 6. Run Comprehensive Lab Tests

**Option A: Complete End-to-End Test (Recommended)**
Tests entire environment setup, data loading, and lab validation:

**macOS/Linux:**
```bash
# From scripts directory:
./comprehensive_test.sh

# From project root:
scripts/comprehensive_test.sh
```

**Windows PowerShell:**
```powershell
# From scripts directory:
.\comprehensive_test.ps1

# From project root:
scripts\comprehensive_test.ps1
```

**Option B: Lab Validation Only**
Validates every operation from all 12 labs:

**macOS/Linux:**
```bash
mongosh < scripts/lab_validation_comprehensive.js
```

**Windows PowerShell:**
```powershell
Get-Content scripts\lab_validation_comprehensive.js | mongosh
```

### 7. Clean Up When Done

**macOS/Linux:**
```bash
./teardown.sh
```

**Windows PowerShell:**
```powershell
.\teardown.ps1
```

## Data Loaders

### Individual Day Data Structure

#### Day 1: Fundamentals (insurance_company database)
- **5 branches** - Basic insurance branch locations
- **10 policies** - Auto, Home, Life policies with variations
- **20 customers** - Individual, family, business customers
- **10 agents** - Licensed insurance agents
- **15 claims** - Sample claims for CRUD operations
- **20 payments** - Premium and settlement payments

#### Day 2: Analytics (insurance_analytics database)
- **3 branches** - Geospatial branch data with performance metrics
- **3 policies** - Complex policy structures for aggregation
- **3 customers** - Risk-segmented customer profiles
- **3 agents** - Complex agent performance data
- **3 claims** - Analytics-ready claims with location data
- **3 reviews** - Customer reviews for text search

#### Day 3: Production (insurance_company database)
- **4 policies** - Transaction-ready policies
- **6 customers** - Large-scale customer data for sharding
- **3 claims** - Production claims data
- **5 branches** - Geographic distribution for sharding
- **2 agents** - C# integration models
- **2 vehicles** - Asset management data
- **1 property** - Property assets
- **3 notifications** - Change stream monitoring data

### Data Consistency Features
- Customer IDs consistent across all labs
- Policy numbers follow standard format (POL-XXX-XXX)
- Geographic data uses real coordinates
- Insurance amounts within realistic ranges
- Appropriate indexes for each lab's queries

## Course Structure

### 📂 Directory Overview
```
mongo_mastering/
├── scripts/                  # Automated setup & teardown scripts
│   ├── setup.sh           # One-command environment setup (macOS/Linux)
│   ├── setup.ps1          # One-command environment setup (Windows)
│   ├── teardown.sh        # Complete cleanup (macOS/Linux)
│   ├── teardown.ps1       # Complete cleanup (Windows)
│   ├── test.sh            # Connection testing (macOS/Linux)
│   ├── test.ps1           # Connection testing (Windows)
│   ├── comprehensive_test.sh  # Complete end-to-end test (macOS/Linux)
│   ├── comprehensive_test.ps1 # Complete end-to-end test (Windows)
│   ├── test_connection.js # Basic MongoDB connection test
│   └── lab_validation_comprehensive.js # Complete lab validation test
├── data/                   # Course data & loading scripts
│   ├── comprehensive_data_loader.js # Complete 3-day course data (recommended)
│   ├── day1_data_loader.js # Day 1 fundamentals data
│   ├── day2_data_loader.js # Day 2 analytics data
│   ├── day3_data_loader.js # Day 3 production data
│   └── test_connection.js  # Connection verification
├── presentations/          # Course presentations (Day 1-3)
│   ├── mongodb_day1_presentation.html
│   ├── mongodb_day2_presentation.html
│   └── mongodb_day3_presentation.html
└── labs/                   # Hands-on lab exercises
    ├── day1_lab*.md       # Day 1: MongoDB fundamentals
    ├── day2_lab*.md       # Day 2: Advanced features
    └── day3_lab*.md       # Day 3: Production & scaling
```

### 📅 Course Schedule

#### **Day 1: MongoDB Fundamentals** (🔰 Beginner)
- **Presentation**: NoSQL concepts, MongoDB basics, CRUD operations
- **Labs**: Shell mastery, database management, CRUD operations
- **Data**: Basic insurance dataset (branches, policies, customers)

#### **Day 2: Advanced Features** (📊 Intermediate)
- **Presentation**: Querying, aggregation, indexing, schema design
- **Labs**: Advanced queries, aggregation framework, performance optimization
- **Data**: Analytics-ready datasets for complex queries

#### **Day 3: Production & Enterprise** (🚀 Advanced)
- **Presentation**: Transactions, replication, sharding, monitoring
- **Labs**: Replica sets, sharding, change streams, application integration
- **Data**: Production-scale datasets with enterprise features

## Features

### 🏭 **Production-Ready Environment**
- **3-node replica set** from Day 1
- **Enterprise MongoDB configuration**
- **Transaction support** built-in
- **High availability** demonstration

### 📚 **Comprehensive Learning**
- **70% hands-on labs** / 30% presentations
- **Real-world insurance data model**
- **Progressive complexity** across 3 days
- **Multiple programming languages** (C#, JavaScript, Python)

### 🛠 **Easy Setup**
- **One-command setup**: `./setup.sh`
- **Automated data loading**: Pre-built scripts for each day
- **Cross-platform**: Works on macOS, Linux, Windows (WSL)
- **No manual configuration**: Everything automated

### 🔧 **Robust Infrastructure**
- **Docker containerization**: Consistent environments
- **Proper write concerns**: No hanging operations
- **Error handling**: Graceful failure recovery
- **Testing scripts**: Verify everything works

## Scripts Overview

### Cross-Platform Setup Scripts

#### **Setup Scripts** - Automated Environment Setup
- **`setup.sh`** (macOS/Linux)
- **`setup.ps1`** (Windows PowerShell)

**What they do:**
- Creates 3-node MongoDB replica set
- Configures proper write concerns
- Verifies everything works
- **Duration:** ~30 seconds

**What they create:**
- `mongo1` (Primary) on `localhost:27017`
- `mongo2` (Secondary) on `localhost:27018`
- `mongo3` (Secondary) on `localhost:27019`
- Docker network: `mongodb-net`

#### **Teardown Scripts** - Complete Cleanup
- **`teardown.sh`** (macOS/Linux)
- **`teardown.ps1`** (Windows PowerShell)

**What they do:**
- Stops all MongoDB containers
- Removes containers and networks
- Verifies clean environment
- **Duration:** ~10 seconds

#### **Test Scripts** - Connection and Data Test
- **`test.sh`** (macOS/Linux)
- **`test.ps1`** (Windows PowerShell)

**What they do:**
- Tests MongoDB connection
- Checks replica set status
- Tests write/read operations
- Optionally loads course data
- **Duration:** ~15 seconds

#### **Comprehensive Test Script** - Complete End-to-End Validation
- **`comprehensive_test.sh`** (macOS/Linux)
- **`comprehensive_test.ps1`** (Windows PowerShell)

**What they do:**
- Sets up complete 3-node MongoDB replica set
- Loads all course data (Days 1, 2, 3)
- Runs comprehensive lab validation (60+ tests)
- Tears down environment completely
- Provides detailed success/failure reporting
- **Duration:** ~3-5 minutes

## Requirements

### Universal Requirements
- **Docker Desktop** installed and running
- **MongoDB Shell (mongosh)** installed

### Platform-Specific Requirements

#### **macOS**
- Bash shell (built-in)
- Terminal app

#### **Linux**
- Bash shell (built-in)
- Terminal emulator

#### **Windows**
Choose ONE of the following:

**Option 1: PowerShell (Recommended)**
- Windows PowerShell (built-in) OR
- PowerShell Core 7+ (download from GitHub)
- Command Prompt or PowerShell terminal

**Option 2: Windows Subsystem for Linux (WSL)**
- WSL installed and configured
- Ubuntu or another Linux distribution in WSL
- Use the bash scripts (setup.sh/teardown.sh) from within WSL

## Getting Started

### Option 1: Automated Setup (Recommended)
```bash
# Clone or download course materials
cd mongo_mastering/scripts
./setup.sh              # Creates MongoDB environment
cd ../data
mongosh < day1_data_loader.js  # Load Day 1 data
mongosh                  # Start working!
```

### Option 2: Manual Setup
```bash
cd scripts
# Follow manual setup instructions in this README
```

## Course Flow

### Daily Workflow
```bash
# Morning setup
cd scripts && ./setup.sh

# Load data for the day (from project root)
mongosh < data/comprehensive_data_loader.js  # All 3 days (recommended)
# OR load individual days: data/day1_data_loader.js, data/day2_data_loader.js, data/day3_data_loader.js

# Work through presentations and labs
open ../presentations/mongodb_day1_presentation.html
# Follow lab instructions in ../labs/

# Evening cleanup (optional)
cd ../scripts && ./teardown.sh
```

### Lab Instructions
1. **Open presentation** for the day
2. **Follow along** with concepts
3. **Complete labs** when prompted
4. **Load data** as needed for each lab
5. **Ask for help** when stuck!

## Usage Examples

### Daily Course Setup
```bash
# Morning setup
./setup.sh

# Load data for the course (from project root)
mongosh < data/comprehensive_data_loader.js  # All 3 days (recommended)
# OR load individual days:
# mongosh < data/day1_data_loader.js  # Day 1: Fundamentals
# mongosh < data/day2_data_loader.js  # Day 2: Advanced Features
# mongosh < data/day3_data_loader.js  # Day 3: Production

# Work on labs...
mongosh  # Connect and work

# Evening cleanup
cd ../scripts
./teardown.sh
```

### Quick Reset During Labs
```bash
# If you need to reset data during labs
./teardown.sh
./setup.sh
cd .. && mongosh < data/day1_data_loader.js
```

### Troubleshooting
```bash
# Test if everything is working
./test.sh

# If tests fail, try fresh setup
./teardown.sh
./setup.sh
./test.sh
```

## Troubleshooting

### General Issues

#### Script won't run
```bash
chmod +x *.sh  # Make scripts executable
```

#### Docker not found
- Install Docker Desktop
- Start Docker Desktop
- Verify: `docker --version`

#### Permission denied
```bash
sudo ./setup.sh  # Try with sudo (Linux)
```

#### MongoDB connection fails
```bash
./teardown.sh && ./setup.sh  # Fresh setup
```

#### Port conflicts
Edit `setup.sh` and change ports:
```bash
# Change -p 27017:27017 to -p 27020:27017
# Change -p 27018:27017 to -p 27021:27017
# Change -p 27019:27017 to -p 27022:27017
```

### Windows PowerShell Issues

#### PowerShell execution policy error
```powershell
# Set execution policy for current user (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or bypass for single execution
PowerShell -ExecutionPolicy Bypass -File .\setup.ps1
```

#### PowerShell version compatibility
The scripts require PowerShell 5.0 or later. Check your version:
```powershell
$PSVersionTable.PSVersion
```

If you have an older version:
- **Windows 10/11**: Update via Windows Update
- **Older Windows**: Download PowerShell 7 from GitHub
- **Alternative**: Use WSL with bash scripts

#### Docker command issues on Windows
If Docker commands fail in PowerShell:
1. **Restart Docker Desktop** completely
2. **Try running as Administrator**
3. **Check firewall settings** - allow Docker Desktop
4. **Alternative**: Use WSL with bash scripts

#### String/character encoding issues
If you see character encoding problems:
1. **Use Windows PowerShell** instead of PowerShell Core
2. **Try running as Administrator**
3. **Alternative**: Use WSL with bash scripts

### Step-by-Step Troubleshooting Process

#### Quick Fix (Try First)
1. Close PowerShell
2. Run `.\teardown.ps1`
3. Restart Docker Desktop
4. Wait 30 seconds
5. Run `.\setup.ps1`

#### Complete Reset (If Quick Fix Fails)
1. **Clean environment:**
   ```powershell
   .\teardown.ps1
   docker system prune -f
   ```

2. **Restart Docker Desktop completely:**
   - Right-click Docker Desktop system tray icon
   - Select "Quit Docker Desktop"
   - Wait 10 seconds
   - Start Docker Desktop again
   - Wait for "Docker Desktop is running" message

3. **Verify prerequisites:**
   ```powershell
   docker --version
   mongosh --version
   ```

4. **Run setup with verbose output:**
   ```powershell
   .\setup.ps1 -Verbose
   ```

### Getting Help

If none of these solutions work:

1. **Check the specific error message** in PowerShell
2. **Look at Docker Desktop logs** (Troubleshoot → Show container logs)
3. **Verify system requirements:**
   - Windows 10/11 with latest updates
   - At least 4GB RAM available
   - At least 10GB free disk space
   - Virtualization enabled in BIOS

4. **Alternative options:**
   - Use Windows Subsystem for Linux (WSL) with `setup.sh`
   - Run scripts as Administrator

## Advanced Usage

### Custom Configuration
- Edit `scripts/setup.sh` for custom ports
- Modify data loaders for custom datasets
- Add new labs following existing patterns

### Multiple Environments
```bash
# Different port ranges for multiple setups
# Edit setup.sh ports: 27020-27022, 27030-27032, etc.
```

### Development
- All scripts are well-documented
- Modular design for easy customization
- Error handling and logging built-in

---

## Directory Structure

```
scripts/
├── setup.sh                      # Automated setup (macOS/Linux)
├── setup.ps1                     # Automated setup (Windows PowerShell)
├── teardown.sh                   # Cleanup (macOS/Linux)
├── teardown.ps1                  # Cleanup (Windows PowerShell)
├── comprehensive_test.sh          # Complete end-to-end test (macOS/Linux)
├── comprehensive_test.ps1         # Complete end-to-end test (Windows PowerShell)
├── test_connection.js            # Basic MongoDB connection test
└── lab_validation_comprehensive.js # Complete lab validation test
```

## Script Features

### Error Handling
- All scripts use `set -e` for fail-fast behavior
- Colored output for status/success/warning/error
- Graceful handling of missing containers/networks

### Safety
- Always cleans up existing containers before setup
- Verifies operations completed successfully
- No destructive operations without confirmation

### Convenience
- Shows progress with colored status messages
- Provides next steps after completion
- Tests basic operations automatically

---

## 🎯 Ready to Master MongoDB?

**Start with:** `cd scripts && ./setup.sh`

**Learn with:** Comprehensive presentations and hands-on labs

**Practice with:** Real-world insurance industry data model

**Master:** Production MongoDB deployment and operations

---

**Ready to start?** Run `./setup.sh` and you'll be ready for the MongoDB course in 30 seconds! 🚀

*MongoDB Mastering Course - From beginner to enterprise expert in 3 days*