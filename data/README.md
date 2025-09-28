# MongoDB Mastering Course - Data Loading Scripts

This directory contains comprehensive data loading scripts for the MongoDB Mastering Course. These scripts ensure that students always have access to the correct datasets for each lab, even if they need to reload data mid-course.

## Prerequisites

**IMPORTANT**: These data loading scripts require a properly configured MongoDB replica set.

**Before using any data loaders**, ensure you have completed the replica set setup from `SETUP.md`:

```bash
# 1. Create network and start 3 MongoDB nodes
docker network create mongodb-net
docker run -d --name mongo1 --network mongodb-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo2 --network mongodb-net -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo3 --network mongodb-net -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# 2. Initialize replica set (from inside container)
docker exec mongo1 mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'mongo1:27017', priority: 2}, {_id: 1, host: 'mongo2:27017', priority: 1}, {_id: 2, host: 'mongo3:27017', priority: 1}]})"

# 3. Set write concern (prevents hanging operations)
mongosh --eval "db.adminCommand({setDefaultRWConcern: 1, defaultWriteConcern: { w: 'majority', wtimeout: 5000 }})"
```

**Why Replica Set?** Day 3 labs require transactions (which need replica sets), and this prevents data loading hangs.

## Data Loading Scripts Overview

### Individual Day Scripts

#### 🔰 `day1_data_loader.js` - Day 1 Fundamentals Data
**Usage:** `mongosh < day1_data_loader.js`

**Purpose:** Loads basic insurance data for Day 1 labs focusing on MongoDB fundamentals and CRUD operations.

**Data Loaded:**
- **Database:** `insurance_company`
- **Collections:** branches (2), policies (6), customers (3), agents (2), claims (3), payments (3)
- **Features:** Basic insurance entities with realistic data for shell mastery and CRUD operations

**Lab Coverage:**
- Lab 1: MongoDB Shell Mastery and Server Navigation
- Lab 2: Database and Collection Management Fundamentals
- Lab 3: CRUD Operations - Create and Insert Mastery
- Lab 4: CRUD Operations - Read and Query Mastery
- Lab 5: CRUD Operations - Update and Delete Operations

---

#### 📊 `day2_data_loader.js` - Day 2 Analytics Data
**Usage:** `mongosh < day2_data_loader.js`

**Purpose:** Loads comprehensive analytics datasets for advanced querying, aggregation, and performance optimization.

**Data Loaded:**
- **Database:** `insurance_analytics`
- **Collections:** policy_types (4), branches (3), policies (50), customers (100), claims (200), agents (2), vehicles (2), properties (1), reviews (100)
- **Features:** Complex hierarchical data, geospatial indexes, text search capability, risk analytics

**Lab Coverage:**
- Lab 1: Advanced Querying and Aggregation Framework
- Lab 2: Data Modeling and Schema Design
- Lab 3: Indexing Strategies and Performance Optimization

---

#### 🚀 `day3_data_loader.js` - Day 3 Production Data
**Usage:** `mongosh < day3_data_loader.js`

**Purpose:** Loads production-scale datasets for transactions, replication, sharding, and enterprise features.

**Data Loaded:**
- **Database:** `insurance_company`
- **Collections:** Large-scale datasets with 1000+ customers, 2000+ claims, 400+ branches
- **Features:** Transaction-ready data, sharding datasets, change stream collections, C# integration models

**Lab Coverage:**
- Lab 1: MongoDB Transactions
- Lab 2: Replica Sets & High Availability
- Lab 3: Sharding & Horizontal Scaling
- Lab 4: Change Streams for Real-time Applications
- Lab 5: C# MongoDB API Integration

---

## Usage Instructions

### For Students

#### Quick Start (Recommended)
```bash
# Load data for the day you're working on (requires replica set setup)
mongosh < day1_data_loader.js  # For Day 1 labs
mongosh < day2_data_loader.js  # For Day 2 labs
mongosh < day3_data_loader.js  # For Day 3 labs
```

#### Complete Reset
```bash
# If you need to start completely fresh
mongosh < master_data_reset.js
```

#### Troubleshooting Data Issues
```bash
# Check data status
mongosh --eval "quickDataCheck()"

# Reset specific day if issues occur
mongosh < day1_data_loader.js  # Replace with appropriate day
```

### For Instructors

#### Course Preparation
```bash
# Before course starts (ensure replica set is running)
mongosh < master_data_reset.js
```

#### Daily Setup
```bash
# Before each day's labs
mongosh < day1_data_loader.js  # Day 1 morning
mongosh < day2_data_loader.js  # Day 2 morning
mongosh < day3_data_loader.js  # Day 3 morning
```

#### Student Support
```bash
# If student needs data reset during labs
mongosh < dayX_data_loader.js  # X = 1, 2, or 3
```

---

## Data Structure by Day

### Day 1: Insurance Fundamentals
```
insurance_company/
├── branches (2)      # Basic branch locations
├── policies (6)      # Auto, Home, Life policies with variations
├── customers (3)     # Individual, family, business customers
├── agents (2)        # Licensed insurance agents
├── claims (3)        # Sample claims for CRUD operations
└── payments (3)      # Premium and settlement payments
```

### Day 2: Analytics & Performance
```
insurance_analytics/
├── policy_types (4)  # Hierarchical policy structure
├── branches (3)      # Geospatial branch data
├── policies (50)     # Large dataset for aggregation
├── customers (100)   # Risk-segmented customer data
├── claims (200)      # Analytics-ready claims data
├── agents (2)        # Complex agent profiles
├── vehicles (2)      # Insured vehicle assets
├── properties (1)    # Insured property assets
└── reviews (100)     # Agent reviews for text search
```

### Day 3: Production Scale
```
insurance_company/
├── policies (4+)     # Transaction-ready policies
├── customers (1000+) # Large-scale for sharding
├── claims (2000+)    # Range-shardable claims data
├── branches (400+)   # Geographic distribution
├── agents (2+)       # C# integration models
├── vehicles (2+)     # Asset management
├── properties (1+)   # Property assets
├── policy_notifications # Change stream monitoring
├── claim_activity_log   # Real-time event tracking
└── resume_tokens       # Change stream resume capability
```

---

## Data Consistency Features

### Cross-Lab Compatibility
- Customer IDs consistent across all labs
- Policy numbers follow standard format (POL-XXX-XXX)
- Geographic data uses real coordinates
- Insurance amounts within realistic ranges

### Business Logic Integrity
- Risk scores align with customer profiles
- Premium amounts match coverage levels
- Claim amounts respect policy limits
- Agent territories align with branch locations

### Technical Optimization
- Appropriate indexes for each lab's queries
- Text search indexes for advanced labs
- Geospatial indexes for territory queries
- Compound indexes for aggregation performance

---

## Utility Functions

After running any data loader, these utility functions become available:

### Data Management
```javascript
// Check current data status
quickDataCheck()

// Reset all data (requires reload)
masterReset()

// Generate test claims (Day 3)
generateTestClaims(10)

// Reset Day 3 data to initial state
resetDay3Data()
```

### Development Support
```javascript
// Simulate system load (Day 3)
simulateLoad(60)  // seconds

// Store resume tokens (Day 3)
storeResumeToken("streamId", token)
```

---

## Troubleshooting

### Common Issues

#### "Collection not found" errors
**Solution:** Run the appropriate day data loader
```bash
mongosh < day1_data_loader.js  # or day2/day3
```

#### Duplicate key errors
**Solution:** Clean and reload
```bash
mongosh < master_data_reset.js
```

#### Index errors
**Solution:** Scripts automatically create required indexes, but if issues persist:
```bash
mongosh --eval "db.collection.dropIndexes(); exit"
mongosh < dayX_data_loader.js
```

#### Performance issues
**Solution:** Check data scale and use appropriate day loader
```bash
# Day 1: Small datasets (~20 documents total)
# Day 2: Medium datasets (~500 documents total)
# Day 3: Large datasets (3000+ documents total)
```

### Getting Help

1. **Check data status first:** `mongosh --eval "quickDataCheck()"`
2. **Try appropriate day loader:** `mongosh < dayX_data_loader.js`
3. **If all else fails:** `mongosh < master_data_reset.js`

---

## Course Integration

These data loaders are integrated with the lab instructions. Each lab file includes references to the appropriate data loader and prerequisites for running the exercises successfully.

**Note:** Always ensure the MongoDB replica set is running before executing any data loading scripts. See prerequisites section above.

---

*MongoDB Mastering Course - Insurance Industry Data Model*
*Comprehensive training materials for enterprise MongoDB development*