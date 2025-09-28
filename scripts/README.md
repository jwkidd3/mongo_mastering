# MongoDB Mastering Course - Setup Scripts

This directory contains automated setup and teardown scripts for the MongoDB Mastering Course environment.

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


### 2. Load Course Data
```bash
cd ../data
mongosh < day1_data_loader.js
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

### 4. Verify Connection (Optional)

Test basic MongoDB connection:
```bash
mongosh < test_connection.js
```

### 5. Run Comprehensive Lab Tests

**Option A: Complete Lab Validation (Recommended)**
Validates every operation from all 12 labs:
```bash
mongosh < lab_validation_comprehensive.js
```

**Option B: General Operations Test**
Tests general MongoDB operations:
```bash
mongosh < test_all_labs.js
```

### 6. Clean Up When Done

**macOS/Linux:**
```bash
./teardown.sh
```

**Windows PowerShell:**
```powershell
.\teardown.ps1
```


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

#### **Manual Setup Instructions**
- **`SETUP.md`** - Complete step-by-step manual setup
- Troubleshooting guide
- Alternative installation methods
- Use if automated scripts don't work

## Usage Examples

### Daily Course Setup
```bash
# Morning setup
./setup.sh

# Load data for the day you're working on
cd ../data
mongosh < day1_data_loader.js  # Day 1
mongosh < day2_data_loader.js  # Day 2
mongosh < day3_data_loader.js  # Day 3

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
cd ../data && mongosh < day1_data_loader.js
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

## Manual Setup Alternative

If the automated scripts don't work, follow the manual instructions in `SETUP.md`.

## Directory Structure

```
scripts/
├── README.md                       # This file
├── SETUP.md                       # Manual setup instructions
├── setup.sh                      # Automated setup (macOS/Linux)
├── setup.ps1                     # Automated setup (Windows PowerShell)
├── teardown.sh                   # Cleanup (macOS/Linux)
├── teardown.ps1                  # Cleanup (Windows PowerShell)
├── test.sh                       # Connection test (macOS/Linux)
├── test.ps1                      # Connection test (Windows PowerShell)
├── test_connection.js            # Basic MongoDB connection test
├── lab_validation_comprehensive.js # Complete lab validation test
├── test_all_labs.js              # General operations test
└── WINDOWS_TROUBLESHOOTING.md    # Windows-specific troubleshooting
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

### Windows-Specific Files

For comprehensive Windows troubleshooting, see:
- **`WINDOWS_TROUBLESHOOTING.md`** - Complete Windows troubleshooting guide
- **`.\test.ps1 -Validate`** - Validate PowerShell script improvements

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

**Ready to start?** Run `./setup.sh` and you'll be ready for the MongoDB course in 30 seconds! 🚀