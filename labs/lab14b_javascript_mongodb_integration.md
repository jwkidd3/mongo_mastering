# Lab 5B: JavaScript/Node.js MongoDB Integration for Insurance Management
**Duration:** 45 minutes
**Objective:** Integrate MongoDB with JavaScript/Node.js applications for insurance management system

## Overview
This lab demonstrates how to build a complete insurance management application using Node.js and the MongoDB driver. You'll create a professional insurance system that handles policies, customers, and claims using modern JavaScript patterns.

## Prerequisites: MongoDB Environment Setup

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./setup/setup.sh
```

**Windows PowerShell:**
```powershell
.\setup\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

**Load Course Data:**
```bash
mongosh < data/day3_data_loader.js
```

## Part A: Project Setup (10 minutes)

### Step 1: Create Node.js Project in VS Code
```bash
# Create insurance management project directory
mkdir InsuranceManagementJS
cd InsuranceManagementJS

# Open in VS Code
code .

# Initialize Node.js project
npm init -y

# Install MongoDB driver
npm install mongodb

# Install additional dependencies for better development
npm install dotenv
```

**In VS Code:**
1. Open integrated terminal (Ctrl+` or Cmd+`)
2. Ensure Node.js and JavaScript extensions are active
3. VS Code will provide IntelliSense for Node.js and MongoDB

### Step 2: Create Project Structure in VS Code

**Using VS Code Explorer:**
1. Right-click in Explorer → New Folder → "models"
2. Right-click in Explorer → New Folder → "services"
3. Right-click in Explorer → New Folder → "config"
4. Right-click in Explorer → New File → "app.js"
5. Right-click config folder → New File → "database.js"
6. Right-click models folder → New File → "Policy.js"
7. Right-click models folder → New File → "Customer.js"
8. Right-click services folder → New File → "PolicyService.js"

**Or use terminal in VS Code:**
```bash
# Create directory structure
mkdir models services config

# Create main files
touch app.js config/database.js models/Policy.js models/Customer.js services/PolicyService.js
```

### Step 3: Environment Configuration

**Create .env file:**
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=insurance_company
```

**Create config/database.js:**
```javascript
const { MongoClient } = require('mongodb');
require('dotenv').config();

class DatabaseConnection {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
            this.client = new MongoClient(uri);

            await this.client.connect();
            this.db = this.client.db(process.env.DATABASE_NAME || 'insurance_company');

            console.log('✅ Connected to MongoDB successfully');
            return this.db;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 Disconnected from MongoDB');
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }
}

module.exports = DatabaseConnection;
```

## Part B: Data Models (10 minutes)

### Step 1: Create Policy Model

**Create models/Policy.js:**
```javascript
const { ObjectId } = require('mongodb');

class Policy {
    constructor(data) {
        this._id = data._id || new ObjectId();
        this.policyNumber = data.policyNumber || '';
        this.customerId = data.customerId || '';
        this.policyType = data.policyType || ''; // Auto, Property, Life, Commercial
        this.region = data.region || '';
        this.state = data.state || '';
        this.coverageLimit = data.coverageLimit || 0;
        this.annualPremium = data.annualPremium || 0;
        this.deductible = data.deductible || 0;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.effectiveDate = data.effectiveDate || new Date();
        this.expirationDate = data.expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    // Validation methods
    validate() {
        const errors = [];

        if (!this.policyNumber) errors.push('Policy number is required');
        if (!this.customerId) errors.push('Customer ID is required');
        if (!this.policyType) errors.push('Policy type is required');
        if (!['Auto', 'Property', 'Life', 'Commercial'].includes(this.policyType)) {
            errors.push('Policy type must be Auto, Property, Life, or Commercial');
        }
        if (this.coverageLimit <= 0) errors.push('Coverage limit must be positive');
        if (this.annualPremium <= 0) errors.push('Annual premium must be positive');

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Calculate monthly premium
    getMonthlyPremium() {
        return Number((this.annualPremium / 12).toFixed(2));
    }

    // Get policy summary
    getSummary() {
        return {
            policyNumber: this.policyNumber,
            type: this.policyType,
            customer: this.customerId,
            premium: this.annualPremium,
            coverage: this.coverageLimit,
            status: this.isActive ? 'Active' : 'Inactive'
        };
    }

    // Convert to plain object for MongoDB
    toMongo() {
        return {
            _id: this._id,
            policyNumber: this.policyNumber,
            customerId: this.customerId,
            policyType: this.policyType,
            region: this.region,
            state: this.state,
            coverageLimit: this.coverageLimit,
            annualPremium: this.annualPremium,
            deductible: this.deductible,
            isActive: this.isActive,
            effectiveDate: this.effectiveDate,
            expirationDate: this.expirationDate,
            createdAt: this.createdAt,
            updatedAt: new Date()
        };
    }
}

module.exports = Policy;
```

### Step 2: Create Customer Model

**Create models/Customer.js:**
```javascript
const { ObjectId } = require('mongodb');

class Customer {
    constructor(data) {
        this._id = data._id || new ObjectId();
        this.customerId = data.customerId || '';
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.address = {
            street: data.address?.street || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            zipCode: data.address?.zipCode || ''
        };
        this.dateOfBirth = data.dateOfBirth || null;
        this.customerType = data.customerType || 'individual'; // individual, family, business
        this.riskScore = data.riskScore || 0;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.registrationDate = data.registrationDate || new Date();
        this.lastUpdateDate = data.lastUpdateDate || new Date();
    }

    // Get full name
    getFullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    // Get formatted address
    getFormattedAddress() {
        const addr = this.address;
        return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
    }

    // Calculate age if date of birth is provided
    getAge() {
        if (!this.dateOfBirth) return null;
        const today = new Date();
        const birth = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    // Validation
    validate() {
        const errors = [];

        if (!this.customerId) errors.push('Customer ID is required');
        if (!this.firstName) errors.push('First name is required');
        if (!this.lastName) errors.push('Last name is required');
        if (!this.email) errors.push('Email is required');
        if (this.email && !/\S+@\S+\.\S+/.test(this.email)) {
            errors.push('Invalid email format');
        }
        if (!['individual', 'family', 'business'].includes(this.customerType)) {
            errors.push('Customer type must be individual, family, or business');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Convert to MongoDB document
    toMongo() {
        return {
            _id: this._id,
            customerId: this.customerId,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
            address: this.address,
            dateOfBirth: this.dateOfBirth,
            customerType: this.customerType,
            riskScore: this.riskScore,
            isActive: this.isActive,
            registrationDate: this.registrationDate,
            lastUpdateDate: new Date()
        };
    }
}

module.exports = Customer;
```

## Part C: Business Logic Service (15 minutes)

### Step 1: Create Policy Service

**Create services/PolicyService.js:**
```javascript
const { ObjectId } = require('mongodb');
const Policy = require('../models/Policy');

class PolicyService {
    constructor(db) {
        this.db = db;
        this.collection = db.collection('policies');
    }

    // Create new policy
    async createPolicy(policyData) {
        try {
            const policy = new Policy(policyData);
            const validation = policy.validate();

            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Check for duplicate policy number
            const existingPolicy = await this.collection.findOne({
                policyNumber: policy.policyNumber
            });

            if (existingPolicy) {
                throw new Error(`Policy number ${policy.policyNumber} already exists`);
            }

            const result = await this.collection.insertOne(policy.toMongo());

            console.log(`✅ Policy created: ${policy.policyNumber}`);
            return {
                success: true,
                policyId: result.insertedId,
                policyNumber: policy.policyNumber
            };
        } catch (error) {
            console.error('❌ Error creating policy:', error.message);
            throw error;
        }
    }

    // Get policy by policy number
    async getPolicyByNumber(policyNumber) {
        try {
            const policyDoc = await this.collection.findOne({
                policyNumber: policyNumber
            });

            if (!policyDoc) {
                throw new Error(`Policy ${policyNumber} not found`);
            }

            return new Policy(policyDoc);
        } catch (error) {
            console.error('❌ Error retrieving policy:', error.message);
            throw error;
        }
    }

    // Get policies by customer
    async getPoliciesByCustomer(customerId) {
        try {
            const cursor = this.collection.find({
                customerId: customerId,
                isActive: true
            });

            const policies = await cursor.toArray();
            return policies.map(doc => new Policy(doc));
        } catch (error) {
            console.error('❌ Error retrieving customer policies:', error.message);
            throw error;
        }
    }

    // Update policy premium
    async updatePremium(policyNumber, newPremium) {
        try {
            if (newPremium <= 0) {
                throw new Error('Premium must be positive');
            }

            const result = await this.collection.updateOne(
                { policyNumber: policyNumber },
                {
                    $set: {
                        annualPremium: newPremium,
                        updatedAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error(`Policy ${policyNumber} not found`);
            }

            console.log(`✅ Updated premium for policy ${policyNumber}: $${newPremium}`);
            return result;
        } catch (error) {
            console.error('❌ Error updating premium:', error.message);
            throw error;
        }
    }

    // Deactivate policy
    async deactivatePolicy(policyNumber, reason = '') {
        try {
            const result = await this.collection.updateOne(
                { policyNumber: policyNumber },
                {
                    $set: {
                        isActive: false,
                        deactivationReason: reason,
                        deactivationDate: new Date(),
                        updatedAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error(`Policy ${policyNumber} not found`);
            }

            console.log(`✅ Deactivated policy ${policyNumber}`);
            return result;
        } catch (error) {
            console.error('❌ Error deactivating policy:', error.message);
            throw error;
        }
    }

    // Get policy statistics
    async getPolicyStatistics() {
        try {
            const pipeline = [
                {
                    $group: {
                        _id: '$policyType',
                        count: { $sum: 1 },
                        totalPremium: { $sum: '$annualPremium' },
                        averagePremium: { $avg: '$annualPremium' },
                        averageCoverage: { $avg: '$coverageLimit' }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ];

            const stats = await this.collection.aggregate(pipeline).toArray();

            console.log('📊 Policy Statistics:');
            stats.forEach(stat => {
                console.log(`  ${stat._id}: ${stat.count} policies, Avg Premium: $${stat.averagePremium.toFixed(2)}`);
            });

            return stats;
        } catch (error) {
            console.error('❌ Error getting statistics:', error.message);
            throw error;
        }
    }

    // Search policies with filters
    async searchPolicies(filters = {}) {
        try {
            const query = {};

            if (filters.policyType) {
                query.policyType = filters.policyType;
            }

            if (filters.state) {
                query.state = filters.state;
            }

            if (filters.minPremium || filters.maxPremium) {
                query.annualPremium = {};
                if (filters.minPremium) query.annualPremium.$gte = filters.minPremium;
                if (filters.maxPremium) query.annualPremium.$lte = filters.maxPremium;
            }

            if (filters.activeOnly !== false) {
                query.isActive = true;
            }

            const cursor = this.collection.find(query);

            if (filters.sortBy) {
                const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
                cursor.sort({ [filters.sortBy]: sortOrder });
            }

            if (filters.limit) {
                cursor.limit(filters.limit);
            }

            const policies = await cursor.toArray();
            return policies.map(doc => new Policy(doc));
        } catch (error) {
            console.error('❌ Error searching policies:', error.message);
            throw error;
        }
    }
}

module.exports = PolicyService;
```

## Part D: Main Application (10 minutes)

### Step 1: Create Main Application

**Create app.js:**
```javascript
const DatabaseConnection = require('./config/database');
const PolicyService = require('./services/PolicyService');
const Policy = require('./models/Policy');
const Customer = require('./models/Customer');

class InsuranceManagementApp {
    constructor() {
        this.dbConnection = new DatabaseConnection();
        this.policyService = null;
    }

    async initialize() {
        try {
            const db = await this.dbConnection.connect();
            this.policyService = new PolicyService(db);
            console.log('🏢 Insurance Management System initialized');
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            throw error;
        }
    }

    async demonstratePolicyOperations() {
        console.log('\n🔷 === Policy Management Demo ===');

        try {
            // Create a new policy
            const newPolicyData = {
                policyNumber: 'POL-JS-2024-001',
                customerId: 'CUST000001',
                policyType: 'Auto',
                region: 'Northeast',
                state: 'NY',
                coverageLimit: 100000,
                annualPremium: 1200.00,
                deductible: 500
            };

            await this.policyService.createPolicy(newPolicyData);

            // Retrieve the policy
            const retrievedPolicy = await this.policyService.getPolicyByNumber('POL-JS-2024-001');
            console.log('📄 Retrieved Policy:', retrievedPolicy.getSummary());

            // Update premium
            await this.policyService.updatePremium('POL-JS-2024-001', 1350.00);

            // Search policies
            const autoPolicies = await this.policyService.searchPolicies({
                policyType: 'Auto',
                limit: 5
            });
            console.log(`🔍 Found ${autoPolicies.length} Auto policies`);

            // Get statistics
            await this.policyService.getPolicyStatistics();

        } catch (error) {
            console.error('❌ Demo error:', error.message);
        }
    }

    async demonstrateAdvancedQueries() {
        console.log('\n🔷 === Advanced Query Demo ===');

        try {
            const db = this.dbConnection.getDb();
            const policiesCollection = db.collection('policies');

            // Complex aggregation: Premium analysis by state
            const premiumByState = await policiesCollection.aggregate([
                {
                    $match: { isActive: true }
                },
                {
                    $group: {
                        _id: '$state',
                        totalPolicies: { $sum: 1 },
                        totalPremium: { $sum: '$annualPremium' },
                        averagePremium: { $avg: '$annualPremium' },
                        maxCoverage: { $max: '$coverageLimit' }
                    }
                },
                {
                    $sort: { totalPremium: -1 }
                }
            ]).toArray();

            console.log('📊 Premium Analysis by State:');
            premiumByState.forEach(state => {
                console.log(`  ${state._id}: ${state.totalPolicies} policies, Total: $${state.totalPremium.toFixed(2)}`);
            });

            // Find high-value policies
            const highValuePolicies = await policiesCollection.find({
                annualPremium: { $gte: 2000 },
                isActive: true
            }).sort({ annualPremium: -1 }).limit(3).toArray();

            console.log('\n💰 High-Value Policies:');
            highValuePolicies.forEach(policy => {
                console.log(`  ${policy.policyNumber}: $${policy.annualPremium} (${policy.policyType})`);
            });

        } catch (error) {
            console.error('❌ Advanced query error:', error.message);
        }
    }

    async demonstrateErrorHandling() {
        console.log('\n🔷 === Error Handling Demo ===');

        try {
            // Attempt to create policy with missing data
            await this.policyService.createPolicy({
                policyNumber: '', // Missing required field
                customerId: 'CUST000001'
            });
        } catch (error) {
            console.log('✅ Validation error caught:', error.message);
        }

        try {
            // Attempt to find non-existent policy
            await this.policyService.getPolicyByNumber('NONEXISTENT');
        } catch (error) {
            console.log('✅ Not found error caught:', error.message);
        }

        try {
            // Attempt invalid premium update
            await this.policyService.updatePremium('POL-AUTO-001', -100);
        } catch (error) {
            console.log('✅ Business logic error caught:', error.message);
        }
    }

    async cleanup() {
        await this.dbConnection.disconnect();
        console.log('🧹 Application cleanup completed');
    }

    async run() {
        try {
            await this.initialize();
            await this.demonstratePolicyOperations();
            await this.demonstrateAdvancedQueries();
            await this.demonstrateErrorHandling();
        } catch (error) {
            console.error('❌ Application error:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run the application
if (require.main === module) {
    const app = new InsuranceManagementApp();
    app.run().catch(console.error);
}

module.exports = InsuranceManagementApp;
```

### Step 2: Update package.json Scripts

**Add to package.json:**
```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "node --watch app.js",
    "test": "node app.js"
  }
}
```

## Part E: Testing and Verification (5 minutes)

### Step 1: Run the Application
```bash
# Install dependencies (if not done already)
npm install

# Run the application
npm start
```

### Step 2: Expected Output
You should see output similar to:
```
✅ Connected to MongoDB successfully
🏢 Insurance Management System initialized

🔷 === Policy Management Demo ===
✅ Policy created: POL-JS-2024-001
📄 Retrieved Policy: {
  policyNumber: 'POL-JS-2024-001',
  type: 'Auto',
  customer: 'CUST000001',
  premium: 1200,
  coverage: 100000,
  status: 'Active'
}
✅ Updated premium for policy POL-JS-2024-001: $1350
🔍 Found 5 Auto policies
📊 Policy Statistics:
  Auto: 7 policies, Avg Premium: $1157.14
  Property: 2 policies, Avg Premium: $1899.99
  ...

🔷 === Advanced Query Demo ===
📊 Premium Analysis by State:
  NY: 5 policies, Total: $6500.00
  IL: 3 policies, Total: $4200.00
  ...

🔷 === Error Handling Demo ===
✅ Validation error caught: Validation failed: Policy number is required
✅ Not found error caught: Policy NONEXISTENT not found
✅ Business logic error caught: Premium must be positive

🔌 Disconnected from MongoDB
🧹 Application cleanup completed
```

### Step 3: Verify Data in MongoDB
```bash
# Connect to MongoDB shell
docker exec -it mongodb mongosh

# Check the new data
use insurance_company
db.policies.find({"policyNumber": "POL-JS-2024-001"}).pretty()
```

## Part F: Extensions and Best Practices (5 minutes)

### Step 1: Add Additional Features

**Optional enhancements you can explore:**

1. **Add Connection Pooling:**
```javascript
// In database.js - add connection options
const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});
```

2. **Add Logging:**
```bash
npm install winston
```

3. **Add Input Validation:**
```bash
npm install joi
```

4. **Add Testing:**
```bash
npm install --save-dev jest
```

### Step 2: Production Considerations

**Security Best Practices:**
- Use environment variables for sensitive data
- Implement proper authentication
- Validate all inputs
- Use connection pooling
- Implement proper error logging

**Performance Optimization:**
- Create appropriate indexes
- Use aggregation pipelines efficiently
- Implement caching strategies
- Monitor query performance

## Summary

### What You've Accomplished:
✅ **Created a complete Node.js insurance management application**
✅ **Integrated MongoDB driver with modern JavaScript patterns**
✅ **Implemented CRUD operations with proper error handling**
✅ **Built reusable models and services**
✅ **Demonstrated advanced MongoDB features (aggregation, indexing)**
✅ **Applied insurance industry best practices**

### Key Concepts Covered:
- **MongoDB Node.js Driver**: Connection management and operations
- **Modern JavaScript**: ES6+ features, async/await, classes
- **Data Modeling**: MongoDB document design patterns
- **Error Handling**: Comprehensive error management
- **Business Logic**: Insurance domain modeling
- **Performance**: Efficient queries and aggregation

### Next Steps:
- **Add web interface** using Express.js
- **Implement authentication** and authorization
- **Add comprehensive testing** with Jest
- **Deploy to cloud** platforms (MongoDB Atlas, Heroku)
- **Add real-time features** using change streams

**🎉 Congratulations!** You've successfully integrated MongoDB with JavaScript/Node.js for a complete insurance management system.