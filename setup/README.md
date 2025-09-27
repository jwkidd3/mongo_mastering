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

**Windows Command Prompt:**
```cmd
setup.cmd
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

### 4. Clean Up When Done

**macOS/Linux:**
```bash
./teardown.sh
```

**Windows PowerShell:**
```powershell
.\teardown.ps1
```

**Windows Command Prompt:**
```cmd
teardown.cmd
```

## Scripts Overview

### Cross-Platform Setup Scripts

#### **Setup Scripts** - Automated Environment Setup
- **`setup.sh`** (macOS/Linux)
- **`setup.ps1`** (Windows PowerShell)
- **`setup.cmd`** (Windows Command Prompt - auto-detects PowerShell/WSL)

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
- **`teardown.cmd`** (Windows Command Prompt - auto-detects PowerShell/WSL)

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
cd ../setup
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

**Option 3: Command Prompt with Auto-Detection**
- Use `setup.cmd` which automatically detects and uses PowerShell or WSL

## Manual Setup Alternative

If the automated scripts don't work, follow the manual instructions in `SETUP.md`.

## Directory Structure

```
setup/
├── README.md           # This file
├── SETUP.md           # Manual setup instructions
├── setup.sh           # Automated setup script
├── teardown.sh        # Cleanup script
└── test.sh            # Connection test script
```

## Troubleshooting

### Script won't run
```bash
chmod +x *.sh  # Make scripts executable
```

### Docker not found
- Install Docker Desktop
- Start Docker Desktop
- Verify: `docker --version`

### Permission denied
```bash
sudo ./setup.sh  # Try with sudo (Linux)
```

### MongoDB connection fails
```bash
./teardown.sh && ./setup.sh  # Fresh setup
```

### Port conflicts
Edit `setup.sh` and change ports:
```bash
# Change -p 27017:27017 to -p 27020:27017
# Change -p 27018:27017 to -p 27021:27017
# Change -p 27019:27017 to -p 27022:27017
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

**Ready to start?** Run `./setup.sh` and you'll be ready for the MongoDB course in 30 seconds! 🚀