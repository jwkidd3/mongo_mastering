# MongoDB Mastering Course

Complete 3-day MongoDB training course with hands-on labs and enterprise-ready configuration.

## Quick Start

### 1. Automated Setup (Recommended)

All commands below assume your current working directory is the repository root (`mongo_mastering/`).

**macOS/Linux:**
```bash
scripts/setup.sh
```

**Windows PowerShell:**
```powershell
scripts\setup.ps1
```

**Windows users:** Docker Desktop must be running with the WSL 2 backend. The course uses `directConnection=true` in every URI, which sidesteps the need for hosts-file edits. (If you still see `ENOTFOUND mongo1` errors, see [TROUBLESHOOTING.md → "ENOTFOUND mongo1 / mongo2 / mongo3"](extras/TROUBLESHOOTING.md).)

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

**Option 1: Run from repo root**:
```powershell
Get-Content data\comprehensive_data_loader.js | mongosh "mongodb://localhost:27017/?directConnection=true"
```

**Option 2: Load individual scripts manually (from repo root)**:
```powershell
Get-Content data\day1_data_loader.js | mongosh "mongodb://localhost:27017/?directConnection=true"
Get-Content data\day2_data_loader.js | mongosh "mongodb://localhost:27017/?directConnection=true"
Get-Content data\day3_data_loader.js | mongosh "mongodb://localhost:27017/?directConnection=true"
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
scripts/test.sh
```

**Windows PowerShell:**
```powershell
scripts\test.ps1
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
   - Re-run setup: `scripts\setup.ps1`

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

### 6. Run Comprehensive Lab Tests (Course-Author Validation)

The single end-to-end test orchestrates teardown → setup → data load → all
lab assertions (Labs 1–13 host-side, Lab 14 driver tests inside the
`course-tools` image) → teardown. Run from macOS / Linux / WSL:

```bash
utilities/comprehensive_test.sh
```

To skip the Lab 14 driver tests (avoids building the `course-tools` image —
useful on the first run or when iterating on Labs 1-13 only):

```bash
utilities/comprehensive_test.sh --skip-lab14
```

**Windows authors** validate via a leaner script that exercises the student
day-1 flow (setup → mongosh `--file` data load → lab-1 verification →
teardown):

```powershell
.\utilities\validate_windows.ps1
```

### 7. Clean Up When Done

**macOS/Linux:**
```bash
scripts/teardown.sh
```

**Windows PowerShell:**
```powershell
scripts\teardown.ps1
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

#### Day 2: Advanced Features (insurance_company database)
- **3 branches** - Geospatial branch data with performance metrics
- **3 policies** - Complex policy structures for aggregation
- **3 customers** - Risk-segmented customer profiles
- **3 agents** - Complex agent performance data
- **3 claims** - Analytics-ready claims with location data
- **3 reviews** - Customer reviews for text search

#### Day 3: Production (insurance_company database)
- **4 policies** - Transaction-ready policies
- **6 customers** - Customer data for transactions and sharding demos
- **3 claims** - Claims data for sharding demonstrations
- **5 branches** - Branch data for geographic distribution demos
- **2 agents** - Agent data for C# integration
- **2 vehicles** - Vehicle asset data
- **1 property** - Property asset data
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
├── scripts/                      # Student-facing: setup / teardown / smoke test
│   ├── setup.sh / setup.ps1                     # Replica set setup
│   ├── teardown.sh / teardown.ps1               # Replica set cleanup
│   ├── setup_sharding.sh / setup_sharding.ps1   # Sharded cluster (Lab 12)
│   ├── teardown_sharding.sh / teardown_sharding.ps1
│   ├── test.sh / test.ps1                       # Quick connection test
│   ├── test_connection.js                       # Basic MongoDB connection test
│   └── update_course.bat                        # `git pull` helper for Windows students
├── data/                         # Course data & loading scripts
│   ├── comprehensive_data_loader.js  # Complete 3-day course data (recommended)
│   ├── day1_data_loader.js           # Day 1 fundamentals data
│   ├── day2_data_loader.js           # Day 2 analytics data
│   ├── day3_data_loader.js           # Day 3 production data
│   └── manual_day{1,2,3}_setup.md    # Manual data load instructions
├── presentations/                # Course presentations (Day 1-3)
│   ├── mongodb_day1_presentation.html
│   ├── mongodb_day2_presentation.html
│   └── mongodb_day3_presentation.html
├── labs/                         # Hands-on lab exercises (16 labs)
│   ├── lab01_*.md ... lab13_*.md # Labs 1-13: fundamentals -> production
│   └── lab14/                    # Lab 14 (only lab with its own subdirectory)
│       ├── lab14a_csharp_mongodb_integration.md
│       ├── lab14b_javascript_mongodb_integration.md
│       ├── lab14c_python_mongodb_integration.md
│       ├── lab14a-csharp-starter/
│       ├── lab14b-javascript-starter/
│       └── lab14c-python-starter/
├── utilities/                    # Course-author tooling
│   ├── comprehensive_test.sh           # ONE end-to-end test (host CLI; setup → load → validate → teardown)
│   ├── lab_validator.sh                # Host-side lab assertions (called by comprehensive_test.sh)
│   ├── validate_windows.ps1            # Lean Windows student-flow validator
│   ├── Dockerfile.course-tools         # Image used ONLY for Lab 14 driver tests (dotnet + node + python)
│   ├── lab14a_test.sh                  # Lab 14A C# driver integration test (runs in course-tools)
│   ├── lab14b_test.sh                  # Lab 14B Node.js driver integration test (runs in course-tools)
│   ├── lab14c_test.sh                  # Lab 14C Python driver integration test (runs in course-tools)
│   └── fix_data_relationships.js       # Data relationship repair helper
└── extras/                       # Supplemental reference guides
    ├── TROUBLESHOOTING.md        # Common student errors and fixes
    ├── comparison.md             # MongoDB vs other NoSQL stores
    ├── mongodb_config_guide.md
    ├── mongodb_docker_memory_guide.md
    ├── mongodb_encryption_guide.md
    └── mongodb_profiling.md
```

### 📅 Course Schedule

#### **Day 1: MongoDB Fundamentals** (🔰 Introductory)
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
- **One-command setup**: `scripts/setup.sh`
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
- **`utilities/comprehensive_test.sh`** (macOS / Linux / WSL — single host-side script)
- **`utilities/validate_windows.ps1`** (lean Windows day-1 flow validator)

**What they do:**
- Set up the 3-node replica set + sharded cluster
- Load all course data (`comprehensive_data_loader.js`)
- Run lab assertions (Labs 1-13 host-side via `docker exec mongo1 mongosh`)
- Run Lab 14 driver tests (C# / Node / Python) inside `course-tools` — the
  ONLY container piece, kept because dotnet/node/python need a runtime
- Tear the environment down
- **Duration:** ~3-4 minutes (`--skip-lab14` cuts to ~2 minutes)

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
# Clone or download course materials, then from the repo root:
cd mongo_mastering
scripts/setup.sh                                                            # Creates MongoDB environment
mongosh "mongodb://localhost:27017/?directConnection=true" < data/day1_data_loader.js  # Load Day 1 data
mongosh "mongodb://localhost:27017/?directConnection=true"                  # Start working!
```

### Option 2: Manual Setup
```bash
cd mongo_mastering
# Follow manual setup instructions in this README
```

## Course Flow

### Daily Workflow
```bash
# All commands run from the repo root (mongo_mastering/).

# Morning setup
scripts/setup.sh

# Load data for the day
mongosh "mongodb://localhost:27017/?directConnection=true" < data/comprehensive_data_loader.js  # All 3 days (recommended)
# OR load individual days:
# mongosh "mongodb://localhost:27017/?directConnection=true" < data/day1_data_loader.js
# mongosh "mongodb://localhost:27017/?directConnection=true" < data/day2_data_loader.js
# mongosh "mongodb://localhost:27017/?directConnection=true" < data/day3_data_loader.js

# Work through presentations and labs
open presentations/mongodb_day1_presentation.html
# Follow lab instructions in labs/

# Evening cleanup (optional)
scripts/teardown.sh
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
# All commands run from the repo root (mongo_mastering/).

# Morning setup
scripts/setup.sh

# Load data for the course
mongosh "mongodb://localhost:27017/?directConnection=true" < data/comprehensive_data_loader.js  # All 3 days (recommended)
# OR load individual days:
# mongosh "mongodb://localhost:27017/?directConnection=true" < data/day1_data_loader.js  # Day 1: Fundamentals
# mongosh "mongodb://localhost:27017/?directConnection=true" < data/day2_data_loader.js  # Day 2: Advanced Features
# mongosh "mongodb://localhost:27017/?directConnection=true" < data/day3_data_loader.js  # Day 3: Production

# Work on labs...
mongosh "mongodb://localhost:27017/?directConnection=true"  # Connect and work

# Evening cleanup
scripts/teardown.sh
```

### Quick Reset During Labs
```bash
# All commands run from the repo root.
# If you need to reset data during labs:
scripts/teardown.sh
scripts/setup.sh
mongosh "mongodb://localhost:27017/?directConnection=true" < data/day1_data_loader.js
```

### Troubleshooting
```bash
# Test if everything is working
scripts/test.sh

# If tests fail, try fresh setup
scripts/teardown.sh
scripts/setup.sh
scripts/test.sh
```

## Troubleshooting

### General Issues

#### Script won't run
```bash
chmod +x scripts/*.sh utilities/*.sh  # Make scripts executable
```

See [extras/TROUBLESHOOTING.md](extras/TROUBLESHOOTING.md) for common student errors and fixes.

#### Docker not found
- Install Docker Desktop
- Start Docker Desktop
- Verify: `docker --version`

#### Permission denied
```bash
sudo scripts/setup.sh  # Try with sudo (Linux)
```

#### MongoDB connection fails
```bash
scripts/teardown.sh && scripts/setup.sh  # Fresh setup
```

#### Port conflicts
Edit `scripts/setup.sh` and change ports:
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
PowerShell -ExecutionPolicy Bypass -File scripts\setup.ps1
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
2. Run `scripts\teardown.ps1`
3. Restart Docker Desktop
4. Wait 30 seconds
5. Run `scripts\setup.ps1`

#### Complete Reset (If Quick Fix Fails)
1. **Clean environment:**
   ```powershell
   scripts\teardown.ps1
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
   scripts\setup.ps1 -Verbose
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
   - Use Windows Subsystem for Linux (WSL) with `scripts/setup.sh`
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
mongo_mastering/
├── setup.sh / setup.ps1            # Root convenience wrappers
├── teardown.sh / teardown.ps1      # Root convenience wrappers
├── test.sh / test.ps1              # Root convenience wrappers
├── scripts/                        # Student-facing setup / teardown / smoke test
│   ├── setup.sh / setup.ps1
│   ├── teardown.sh / teardown.ps1
│   ├── setup_sharding.sh / setup_sharding.ps1
│   ├── teardown_sharding.sh / teardown_sharding.ps1
│   ├── test.sh / test.ps1
│   ├── test_connection.js
│   └── update_course.bat
├── data/                           # Course data loaders & manual setup guides
├── labs/                           # 16 lab markdown files (lab01_*.md ... lab14c_*.md)
├── presentations/                  # Reveal.js HTML presentations (Day 1-3)
├── utilities/                      # Course-author tooling (comprehensive_test.sh + lab14 image)
└── extras/                         # Supplemental reference guides
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

**Start with:** `scripts/setup.sh` (from the repo root)

**Learn with:** Comprehensive presentations and hands-on labs

**Practice with:** Real-world insurance industry data model

**Master:** Production MongoDB deployment and operations

---

**Ready to start?** Run `scripts/setup.sh` from the repo root and you'll be ready for the MongoDB course in 30 seconds! 🚀

*MongoDB Mastering Course - From introductory to enterprise expert in 3 days*