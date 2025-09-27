# MongoDB Mastering Course

Complete 3-day MongoDB training course with hands-on labs and enterprise-ready configuration.

## Quick Start

### 1. Automated Setup (30 seconds)

**macOS/Linux:**
```bash
cd setup
./setup.sh
```

**Windows PowerShell:**
```powershell
cd setup
.\setup.ps1
```

**Windows Command Prompt:**
```cmd
cd setup
setup.cmd
```

### 2. Load Course Data
```bash
cd data
mongosh < day1_data_loader.js    # For Day 1 labs
mongosh < day2_data_loader.js    # For Day 2 labs
mongosh < day3_data_loader.js    # For Day 3 labs
```

💡 **See [LOAD_DATA.md](LOAD_DATA.md) for detailed instructions**

### 3. Start Learning!
```bash
mongosh  # Connect and start labs
```

### 4. Cleanup When Done

**macOS/Linux:**
```bash
cd setup
./teardown.sh
```

**Windows PowerShell:**
```powershell
cd setup
.\teardown.ps1
```

**Windows Command Prompt:**
```cmd
cd setup
teardown.cmd
```

## Course Structure

### 📂 Directory Overview
```
mongo_mastering/
├── setup/                  # Automated setup & teardown scripts
│   ├── setup.sh           # One-command environment setup
│   ├── teardown.sh        # Complete cleanup
│   ├── test.sh            # Connection testing
│   ├── SETUP.md           # Manual setup instructions
│   └── README.md          # Setup documentation
├── data/                   # Course data & loading scripts
│   ├── day1_data_loader.js # Day 1 fundamentals data
│   ├── day2_data_loader.js # Day 2 analytics data
│   ├── day3_data_loader.js # Day 3 production data
│   ├── test_connection.js  # Connection verification
│   └── README.md          # Data loading documentation
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

## Requirements

- **Docker Desktop** installed and running
- **MongoDB Shell (mongosh)** installed
- **Web browser** for presentations
- **Text editor** for labs

## Getting Started

### Option 1: Automated Setup (Recommended)
```bash
# Clone or download course materials
cd mongo_mastering/setup
./setup.sh              # Creates MongoDB environment
cd ../data
mongosh < day1_data_loader.js  # Load Day 1 data
mongosh                  # Start working!
```

### Option 2: Manual Setup
```bash
cd setup
# Follow instructions in SETUP.md
```

## Course Flow

### Daily Workflow
```bash
# Morning setup
cd setup && ./setup.sh

# Load data for the day
cd ../data
mongosh < day1_data_loader.js  # or day2/day3

# Work through presentations and labs
open ../presentations/mongodb_day1_presentation.html
# Follow lab instructions in ../labs/

# Evening cleanup (optional)
cd ../setup && ./teardown.sh
```

### Lab Instructions
1. **Open presentation** for the day
2. **Follow along** with concepts
3. **Complete labs** when prompted
4. **Load data** as needed for each lab
5. **Ask for help** when stuck!

## Troubleshooting

### Common Issues

#### Setup Problems
```bash
cd setup
./teardown.sh && ./setup.sh  # Fresh setup
./test.sh                     # Verify everything works
```

#### Data Loading Hangs
- Updated scripts prevent hanging
- Use `test_connection.js` to verify setup
- Check `data/README.md` for troubleshooting

#### Connection Issues
```bash
docker ps                     # Verify containers running
mongosh --eval "db.hello()"  # Test connection
```

### Getting Help
1. **Check setup/README.md** for setup issues
2. **Check data/README.md** for data loading issues
3. **Run test.sh** to diagnose problems
4. **Try fresh setup** with teardown.sh + setup.sh

## Advanced Usage

### Custom Configuration
- Edit `setup/setup.sh` for custom ports
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

## 🎯 Ready to Master MongoDB?

**Start with:** `cd setup && ./setup.sh`

**Learn with:** Comprehensive presentations and hands-on labs

**Practice with:** Real-world insurance industry data model

**Master:** Production MongoDB deployment and operations

---

*MongoDB Mastering Course - From beginner to enterprise expert in 3 days* 🚀