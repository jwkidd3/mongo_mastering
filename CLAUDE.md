# CLAUDE.md - MongoDB Mastering Course Parameters

## Project Overview
**Course Name**: MongoDB Mastering Course
**Duration**: 3 Days (24 hours total)
**Format**: Instructor-led with hands-on labs
**Platform**: Docker-based MongoDB environment with C#, Node.js, and Python integration
**Prerequisites**: Basic database concepts, command-line familiarity

---

## Course Structure

### Day 1: MongoDB Fundamentals & Core Operations (7 hours)
- **Format**: 5 labs (45 minutes each) + presentations
- **Focus**: Command-line mastery, CRUD operations, basic querying
- **Technology Stack**: MongoDB shell (mongosh), Docker containers
- **Lab Ratio**: 70% hands-on / 30% presentations

### Day 2: Advanced Features & Performance (8 hours)
- **Format**: 5 labs (45 minutes each) + presentations
- **Focus**: Advanced querying, aggregation framework, indexing, data modeling, transactions
- **Technology Stack**: MongoDB shell (mongosh), Docker containers
- **Lab Ratio**: 70% hands-on / 30% presentations

### Day 3: Production & Advanced Topics (8 hours)
- **Format**: 4 labs/lab sets (45 minutes each) + final project
- **Focus**: Replica sets, sharding, change streams, application integration
- **Technology Stack**: Production configurations, monitoring tools, C#/Node.js/Python drivers
- **Lab Ratio**: 70% hands-on / 30% presentations

---

## File Structure

### Core Course Materials
- `mongodb_course_outline.md` - Complete 641-line course outline and schedule

### Presentations
- `/presentations/` directory containing:
  - `mongodb_day1_presentation.html` - Day 1 reveal.js HTML presentation
  - `mongodb_day2_presentation.html` - Day 2 reveal.js HTML presentation
  - `mongodb_day3_presentation.html` - Day 3 reveal.js HTML presentation

### Lab Materials
- `/labs/` directory containing individual lab files:

**Day 1 Labs (Command-line focused - Labs 1-5):**
  - `lab01_mongodb_shell_mastery.md` - MongoDB Shell Mastery and Server Navigation
  - `lab02_database_collection_management.md` - Database and Collection Management Fundamentals
  - `lab03_crud_create_insert.md` - CRUD Operations - Create and Insert Mastery
  - `lab04_crud_read_query.md` - CRUD Operations - Read and Query Mastery
  - `lab05_crud_update_delete.md` - CRUD Operations - Update and Delete Operations

**Day 2 Labs (Advanced features focused - Labs 6-10):**
  - `lab06_advanced_query_techniques.md` - Advanced Query Techniques
  - `lab07_aggregation_framework.md` - Aggregation Framework
  - `lab08_indexing_performance_optimization.md` - Indexing & Performance Optimization
  - `lab09_data_modeling_schema_design.md` - Data Modeling & Schema Design
  - `lab10_mongodb_transactions.md` - MongoDB Transactions

**Day 3 Labs (Production and application integration - Labs 11-14):**
  - `lab11_replica_sets_high_availability.md` - Replica Sets & High Availability
  - `lab12_sharding_horizontal_scaling.md` - Sharding & Horizontal Scaling
  - `lab13_change_streams_realtime.md` - Change Streams & Real-time Applications
  - `lab14a_csharp_mongodb_integration.md` - C# MongoDB API Integration
  - `lab14b_javascript_mongodb_integration.md` - JavaScript (Node.js) MongoDB Integration
  - `lab14c_python_mongodb_integration.md` - Python MongoDB Integration

### Supporting Materials
- `/data/` directory containing:
  - `day1_data_loader.js` - Day 1 data loader
  - `day2_data_loader.js` - Day 2 data loader
  - `day3_data_loader.js` - Day 3 data loader
  - `comprehensive_data_loader.js` - Comprehensive data loader (all days)
  - `manual_day1_setup.md` - Manual Day 1 data setup instructions
  - `manual_day2_setup.md` - Manual Day 2 data setup instructions
  - `manual_day3_setup.md` - Manual Day 3 data setup instructions

### Scripts
- `/scripts/` directory containing:
  - `setup.sh` - Environment setup script (macOS/Linux)
  - `setup.ps1` - Environment setup script (Windows PowerShell)
  - `teardown.sh` - Environment teardown script (macOS/Linux)
  - `teardown.ps1` - Environment teardown script (Windows PowerShell)
  - `test_connection.js` - MongoDB connection test script
  - `update_course.bat` - Course update batch script (Windows)

### Utilities
- `/utilities/` directory containing:
  - `comprehensive_lab_validator.sh` - Lab validation script
  - `fix_data_relationships.js` - Data relationship repair script
  - `LAB_VALIDATION_AUDIT.md` - Lab validation audit report
  - `README.md` - Utilities documentation

### Extra Resources
- `/extras/` directory containing:
  - `comparison.md` - NoSQL vs SQL comparison guide
  - `dockersetup.md` - Docker environment setup instructions
  - `mongodb_config_guide.md` - Configuration best practices (15,426 bytes)
  - `mongodb_docker_memory_guide.md` - Memory optimization guide (18,680 bytes)
  - `mongodb_encryption_guide.md` - Security and encryption guide (15,727 bytes)
  - `mongodb_profiling.md` - Performance profiling guide (17,032 bytes)

---

## Technology Stack

### Primary Platforms
- **MongoDB**: Document database with Docker containerization
- **Docker Desktop**: Container platform for consistent environments
- **MongoDB Compass**: GUI tool for visual database management
- **C# .NET 8**: Primary programming language for driver integration

### Development Tools
- **MongoDB Shell (mongosh)**: Command-line interface
- **Visual Studio Code**: Recommended IDE for C# development
- **MongoDB C# Driver**: Official .NET driver for MongoDB integration

### Course Delivery Environment
- **Docker-based MongoDB**: Consistent cross-platform setup
- **Local development**: No cloud dependencies for core labs
- **Multi-language support**: JavaScript (shell), C#, Node.js, and Python examples

---

## Lab Standards

### Lab Structure
- **Duration**: Exactly 45 minutes per lab (14 labs total: 5 Day 1 + 5 Day 2 + 4 Day 3, where Lab 14 has 3 language variants a/b/c)
- **Format**: Markdown files with step-by-step instructions
- **Verification**: Success criteria and troubleshooting included
- **Progressive Learning**: Each lab builds on previous concepts

### Lab Categories by Day
**Day 1 Labs** (Command-line focused - 5 labs):
1. Lab 1: MongoDB Shell Mastery and Server Navigation (45 minutes)
2. Lab 2: Database and Collection Management Fundamentals (45 minutes)
3. Lab 3: CRUD Operations - Create and Insert Mastery (45 minutes)
4. Lab 4: CRUD Operations - Read and Query Mastery (45 minutes)
5. Lab 5: CRUD Operations - Update and Delete Operations (45 minutes)

**Day 2 Labs** (Advanced features focused - 5 labs):
6. Lab 6: Advanced Query Techniques (45 minutes)
7. Lab 7: Aggregation Framework (45 minutes)
8. Lab 8: Indexing & Performance Optimization (45 minutes)
9. Lab 9: Data Modeling & Schema Design (45 minutes)
10. Lab 10: MongoDB Transactions (45 minutes)

**Day 3 Labs** (Production and application integration - 4 labs/lab sets):
11. Lab 11: Replica Sets & High Availability (45 minutes)
12. Lab 12: Sharding & Horizontal Scaling (45 minutes)
13. Lab 13: Change Streams & Real-time Applications (45 minutes)
14. Lab 14a/14b/14c: Application Integration - C#, Node.js, Python (45 minutes)

---

## Assessment Structure

### Evaluation Components
- **Daily hands-on labs**: 30% of evaluation (14 labs total)
- **Final capstone project**: 50% of evaluation (Day 3 final project)
- **Participation and engagement**: 20% of evaluation

### Learning Outcomes
Upon completion, participants will be able to:
1. Design and implement efficient MongoDB database schemas
2. Write complex queries using MongoDB's query language and aggregation framework
3. Optimize performance through proper indexing strategies
4. Implement high availability solutions using replica sets and sharding
5. Deploy production-ready MongoDB applications with proper security measures
6. Monitor and maintain MongoDB deployments in production environments
7. Integrate MongoDB effectively with C#, Node.js, and Python application development
8. Troubleshoot common issues and implement best practices

---

## Course Delivery Model

### Target Audience
- **Corporate Training**: Enterprise-ready skills focus
- **Bootcamp Format**: Intensive hands-on approach
- **Self-Study Support**: Complete documentation for independent learning

### Instructor Support Materials
- **Modular Design**: Flexible delivery timing (30-45 minute labs)
- **Complete Documentation**: Step-by-step instructions with verification
- **Extension Exercises**: Advanced learner options
- **Troubleshooting Guides**: Comprehensive error resolution

### Post-Course Resources
- **30-day email support** for course-related questions
- **MongoDB University** integration for continued learning
- **Certification preparation** materials and guidance
- **Community forum** access for ongoing peer support

---

## Development Standards

### Content Creation Guidelines
- **Exhaustive Detail**: Thorough and complete content preferred
- **Production Focus**: Real-world, enterprise-ready examples
- **Progressive Learning**: Build from basics to advanced concepts
- **Multi-Platform**: Docker ensures consistent environments

### File Organization Principles
- **Presentations**: Organized in `/presentations/` directory with reveal.js HTML format only
- **Labs**: Organized in `/labs/` directory with individual markdown files (16 lab files: 14 labs with Lab 14 having 3 language variants) and complete supporting materials
- **Data**: Separate `/data/` directory with realistic sample datasets and generators
- **Extras**: Comprehensive guides in `/extras/` directory for advanced topics

### Quality Standards
- **Step-by-Step Instructions**: Exact commands and procedures
- **Verification Checkpoints**: Testable success criteria throughout
- **Comprehensive Troubleshooting**: Error resolution guidance
- **Complete Documentation**: No assumptions about prior setup

---

## Usage Instructions for Claude AI

When working with this MongoDB course:

1. **Maintain Course Standards**: Preserve 70/30 lab-to-presentation ratio and 45-minute lab duration
2. **Follow Established Patterns**: Use existing directory structure and naming conventions
3. **Technology Stack Consistency**: Ensure Docker + MongoDB + C# integration remains intact
4. **Progressive Learning**: Maintain logical skill building from Day 1 through Day 3
5. **Production Readiness**: Focus on enterprise-grade practices and real-world application
6. **Complete Documentation**: Include all necessary supporting files and clear instructions
7. **Verification Standards**: Ensure all commands and procedures work as documented

---

## Course Differentiators

### Unique Approach
- **Command-line First**: Strong foundation in MongoDB shell before GUI tools
- **Multi-language Integration**: Comprehensive driver coverage for C#, Node.js, and Python beyond basic tutorials
- **Docker-based Environment**: Consistent setup across all platforms
- **Production Focus**: Enterprise deployment patterns and monitoring

### Comprehensive Coverage
- **Full Stack**: From basic CRUD to advanced sharding and replication
- **Performance Oriented**: Indexing, optimization, and monitoring throughout
- **Security Integrated**: Authentication, authorization, and encryption coverage
- **Real-world Datasets**: Practical examples with substantial data generators

This MongoDB Mastering course provides enterprise-level MongoDB expertise through intensive hands-on practice in a structured 3-day format.

### Data Entities
Customer & Personal Entities

  - Customer:Individual - Personal insurance customers
  - Customer:Business - Commercial insurance clients
  - Dependent:Person - Family members covered under policies

  Insurance Products & Policies

  - Product:Insurance - Insurance product catalog
  - Policy:Auto - Vehicle insurance policies
  - Policy:Property - Home/property insurance policies
  - Policy:Life - Life insurance policies
  - Policy:Commercial - Business insurance policies

  Claims & Incidents

  - Claim - Insurance claims
  - Incident - Detailed incident data

  Assets

  - Vehicle:Asset - Insured vehicles
  - Property:Asset - Insured properties

  Employees & Professionals

  - Agent:Employee - Sales agents
  - Adjuster:Employee - Claims adjusters
  - Underwriter:Employee - Risk assessment professionals
  - Manager:Employee - Department managers

  Organizational Entities

  - Company - Insurance carrier
  - Branch:Location - Physical branch locations
  - Department - Organizational departments

  Financial Entities

  - Payment - Premium payments and claim settlements
  - Invoice - Billing documents
  - Commission - Agent compensation

  Vendors & Service Providers

  - RepairShop:Vendor - Auto body shops
  - MedicalProvider:Vendor - Healthcare providers
  - LegalFirm:Vendor - Law firms

  Compliance & Analytics

  - ComplianceRecord - Regulatory compliance tracking
  - AuditRecord - Audit documentation
  - RegulatoryFiling - Regulatory submissions
  - RiskAssessment - Risk scoring data
  - FraudInvestigation - Fraud detection records

  Technology & Integration

  - SystemIntegration - Enterprise system connections
  - APIEndpoint - API management
  - MarketingCampaign - Marketing campaigns
