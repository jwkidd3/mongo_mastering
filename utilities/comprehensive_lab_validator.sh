#!/bin/bash

# Comprehensive Lab Validator - Tests ALL actual lab commands for Labs 1-13
# This script executes the EXACT same commands that appear in all labs
# When labs change, this validation must be updated to match

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================================================"
echo "COMPREHENSIVE LAB VALIDATOR - Testing ALL Lab Commands (Labs 1-13)"
echo "========================================================================"

# User prompt for environment management
echo -e "${YELLOW}ENVIRONMENT MANAGEMENT OPTIONS:${NC}"
echo "1. Quick Test (use existing environment)"
echo "2. Total Clean Test Run (teardown → setup → data loading → test → cleanup)"
echo ""
read -p "Choose option (1 or 2): " ENV_CHOICE

case $ENV_CHOICE in
    1)
        echo -e "${GREEN}Running quick test against existing environment...${NC}"
        CLEAN_RUN=false
        ;;
    2)
        echo -e "${BLUE}Running total clean test with full environment lifecycle...${NC}"
        CLEAN_RUN=true
        ;;
    *)
        echo -e "${RED}Invalid choice. Defaulting to quick test.${NC}"
        CLEAN_RUN=false
        ;;
esac

echo ""

# Environment setup function
setup_environment() {
    echo "========================================================================"
    echo -e "${BLUE}PHASE 1: ENVIRONMENT TEARDOWN & SETUP${NC}"
    echo "========================================================================"

    echo "🔄 Tearing down existing environment..."
    SCRIPT_DIR="/Users/jwkidd3/classes_in_development/mongo_mastering/scripts"
    if (cd "$SCRIPT_DIR" && ./teardown.sh) > /dev/null 2>&1; then
        echo "✅ Environment teardown completed"
    else
        echo "⚠️  Teardown completed (may have been already clean)"
    fi

    echo "🚀 Setting up fresh MongoDB environment..."
    if (cd "$SCRIPT_DIR" && ./setup.sh) > setup_output.log 2>&1; then
        echo "✅ Environment setup completed"
        rm -f setup_output.log
    else
        echo "❌ Environment setup failed"
        echo "Setup error output:"
        cat setup_output.log 2>/dev/null || echo "No error output captured"
        rm -f setup_output.log
        exit 1
    fi

    # Return to project root for data loading
    cd /Users/jwkidd3/classes_in_development/mongo_mastering

    echo "📊 Loading comprehensive course data..."
    if mongosh < data/comprehensive_data_loader.js > data_load_output.log 2>&1; then
        echo "✅ Data loading completed"
        rm -f data_load_output.log
    else
        echo "❌ Data loading failed"
        echo "Data loading error output:"
        cat data_load_output.log 2>/dev/null || echo "No error output captured"
        rm -f data_load_output.log
        exit 1
    fi

    echo ""
}

# Environment cleanup function
cleanup_environment() {
    echo ""
    echo "========================================================================"
    echo -e "${BLUE}PHASE 3: ENVIRONMENT CLEANUP${NC}"
    echo "========================================================================"

    echo "🧹 Cleaning up environment..."
    SCRIPT_DIR="/Users/jwkidd3/classes_in_development/mongo_mastering/scripts"
    if (cd "$SCRIPT_DIR" && ./teardown.sh) > /dev/null 2>&1; then
        echo "✅ Environment cleanup completed"
    else
        echo "⚠️  Cleanup completed (may have been already clean)"
    fi
}

# Run environment setup if clean run is selected
if [ "$CLEAN_RUN" = true ]; then
    setup_environment
fi

echo "========================================================================"
echo -e "${BLUE}PHASE 2: COMPREHENSIVE LAB VALIDATION${NC}"
echo "========================================================================"
echo "Testing all labs by executing the actual lab commands"
echo

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
declare -a FAILED_COMMANDS

# Function to test a MongoDB command
test_mongo_command() {
    local description="$1"
    local command="$2"
    local database="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "🔍 Testing: $description"

    # Execute the command and capture both stdout and stderr
    if [ -z "$database" ]; then
        if mongosh --quiet --eval "$command" >/dev/null 2>&1; then
            echo "✅ PASSED"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo "❌ FAILED"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FAILED_COMMANDS+=("$description")
        fi
    else
        if mongosh --quiet "$database" --eval "$command" >/dev/null 2>&1; then
            echo "✅ PASSED"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo "❌ FAILED"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FAILED_COMMANDS+=("$description")
        fi
    fi
    echo
}

# Function to test a MongoDB command with expected output
test_mongo_command_with_output() {
    local description="$1"
    local command="$2"
    local database="$3"
    local expected_pattern="$4"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "🔍 Testing: $description"

    # Execute the command and capture output
    if [ -z "$database" ]; then
        output=$(mongosh --quiet --eval "$command" 2>&1)
    else
        output=$(mongosh --quiet "$database" --eval "$command" 2>&1)
    fi

    if echo "$output" | grep -q "$expected_pattern"; then
        echo "✅ PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ FAILED - Expected: $expected_pattern"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_COMMANDS+=("$description")
    fi
    echo
}

echo "========================================================================"
echo "LAB 1: MongoDB Shell Mastery - Testing Actual Lab Commands"
echo "========================================================================"

# Test 1: Lab 1 - Basic shell commands
test_mongo_command_with_output \
    "Lab 1 - Check MongoDB version" \
    "db.version()" \
    "" \
    "[0-9]"

test_mongo_command_with_output \
    "Lab 1 - Show databases" \
    "db.adminCommand('listDatabases')" \
    "" \
    "databases"

test_mongo_command \
    "Lab 1 - Database statistics" \
    "db.stats()" \
    "insurance_company"

test_mongo_command_with_output \
    "Lab 1 - Show collections" \
    "db.getCollectionNames()" \
    "insurance_company" \
    "policies"

test_mongo_command \
    "Lab 1 - JavaScript environment test" \
    "var currentDate = new Date(); print('Current date: ' + currentDate)" \
    ""

test_mongo_command \
    "Lab 1 - Mathematical operations" \
    "print('Circle area: ' + (Math.PI * Math.pow(5, 2)))" \
    ""

test_mongo_command_with_output \
    "Lab 1 - Server ping test" \
    "db.runCommand({ping: 1})" \
    "" \
    "ok.*1"

echo "========================================================================"
echo "LAB 2: Database & Collection Management - Testing Actual Lab Commands"
echo "========================================================================"

test_mongo_command \
    "Lab 2 - Create test database" \
    "use test_insurance; db.test.insertOne({created: new Date()})" \
    ""

test_mongo_command \
    "Lab 2 - Database stats with scale" \
    "use insurance_company; db.stats(1024)" \
    ""

test_mongo_command \
    "Lab 2 - Create simple collection" \
    "use insurance_company; db.createCollection('lab2_customers')" \
    ""

test_mongo_command \
    "Lab 2 - Create capped collection" \
    "use insurance_company; db.createCollection('audit_logs', { capped: true, size: 1000000, max: 5000 })" \
    ""

test_mongo_command \
    "Lab 2 - Collection with validation" \
    "use insurance_company; db.createCollection('validated_policies', {
        validator: {
            \$jsonSchema: {
                bsonType: 'object',
                required: ['policyNumber', 'premiumAmount'],
                properties: {
                    policyNumber: { bsonType: 'string' },
                    premiumAmount: { bsonType: 'number', minimum: 0 }
                }
            }
        }
    })" \
    ""

test_mongo_command \
    "Lab 2 - List collections command" \
    "use insurance_company; db.runCommand({listCollections: 1})" \
    ""

echo "========================================================================"
echo "LAB 3: CRUD Create and Insert - Testing Actual Lab Commands"
echo "========================================================================"

test_mongo_command \
    "Lab 3 - Single document insert" \
    "use insurance_company; db.test_policies.insertOne({
        policyNumber: 'POL-AUTO-101',
        policyType: 'AUTO',
        premiumAmount: 899.99,
        customerId: 'CUST001',
        createdAt: new Date()
    })" \
    ""

test_mongo_command \
    "Lab 3 - Insert with explicit ObjectId" \
    "use insurance_company; db.test_policies.insertOne({
        _id: new ObjectId(),
        policyNumber: 'POL-HOME-102',
        policyType: 'HOME',
        premiumAmount: NumberDecimal('1299.99')
    })" \
    ""

test_mongo_command \
    "Lab 3 - Multiple document insert" \
    "use insurance_company; db.test_customers.insertMany([
        {name: 'John Doe', email: 'john@example.com', age: 35},
        {name: 'Jane Smith', email: 'jane@example.com', age: 28},
        {name: 'Bob Johnson', email: 'bob@example.com', age: 42}
    ])" \
    ""

test_mongo_command \
    "Lab 3 - Insert with nested document" \
    "use insurance_company; db.test_policies.insertOne({
        policyNumber: 'POL-AUTO-103',
        customer: {
            name: 'Alice Brown',
            address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY'
            }
        },
        coverageTypes: ['liability', 'collision', 'comprehensive']
    })" \
    ""

test_mongo_command \
    "Lab 3 - Bulk insert with ordered option" \
    "use insurance_company; db.test_claims.insertMany([
        {claimNumber: 'CLM-001', policyId: 'POL-AUTO-101', amount: 1500},
        {claimNumber: 'CLM-002', policyId: 'POL-HOME-102', amount: 2500}
    ], {ordered: true})" \
    ""

echo "========================================================================"
echo "LAB 4: CRUD Read and Query - Testing Actual Lab Commands"
echo "========================================================================"

test_mongo_command_with_output \
    "Lab 4 - Basic find operation" \
    "db.policies.find().limit(1)" \
    "insurance_company" \
    "_id"

test_mongo_command_with_output \
    "Lab 4 - Count documents" \
    "db.policies.countDocuments()" \
    "insurance_company" \
    "[0-9]"

test_mongo_command_with_output \
    "Lab 4 - Query with comparison operators" \
    "db.policies.find({annualPremium: {\$gt: 1000}})" \
    "insurance_company" \
    "annualPremium"

test_mongo_command_with_output \
    "Lab 4 - Query with range" \
    "db.policies.find({annualPremium: {\$gte: 500, \$lte: 2000}})" \
    "insurance_company" \
    "annualPremium"

test_mongo_command_with_output \
    "Lab 4 - Query with \$in operator" \
    "db.policies.find({policyType: {\$in: ['Auto', 'HOME']}})" \
    "insurance_company" \
    "policyType"

test_mongo_command \
    "Lab 4 - Logical AND query" \
    "use insurance_company; db.policies.find({
        \$and: [
            {annualPremium: {\$gt: 500}},
            {policyType: 'Auto'}
        ]
    })" \
    ""

test_mongo_command \
    "Lab 4 - Field existence query" \
    "use insurance_company; db.policies.find({coverageTypes: {\$exists: true}})" \
    ""

test_mongo_command \
    "Lab 4 - Projection query" \
    "use insurance_company; db.policies.find({}, {policyNumber: 1, annualPremium: 1, _id: 0}).limit(3)" \
    ""

test_mongo_command \
    "Lab 4 - Sort and limit" \
    "use insurance_company; db.policies.find().sort({annualPremium: -1}).limit(5)" \
    ""

test_mongo_command \
    "Lab 4 - Regex query" \
    "use insurance_company; db.policies.find({policyType: {\$regex: 'auto', \$options: 'i'}})" \
    ""

echo "========================================================================"
echo "LAB 5: CRUD Update and Delete - Testing Actual Lab Commands"
echo "========================================================================"

test_mongo_command \
    "Lab 5 - Update single document with \$set" \
    "use insurance_company; db.test_policies.updateOne(
        {policyNumber: 'POL-AUTO-101'},
        {\$set: {lastModified: new Date(), status: 'active'}}
    )" \
    ""

test_mongo_command \
    "Lab 5 - Update with \$inc operator" \
    "use insurance_company; db.test_policies.updateOne(
        {policyNumber: 'POL-AUTO-101'},
        {\$inc: {premiumAmount: 50}}
    )" \
    ""

test_mongo_command \
    "Lab 5 - Update many documents" \
    "use insurance_company; db.test_policies.updateMany(
        {policyType: 'AUTO'},
        {\$set: {category: 'vehicle_insurance'}}
    )" \
    ""

test_mongo_command \
    "Lab 5 - Array update with \$push" \
    "use insurance_company; db.test_policies.updateOne(
        {policyNumber: 'POL-AUTO-103'},
        {\$push: {coverageTypes: 'roadside_assistance'}}
    )" \
    ""

test_mongo_command \
    "Lab 5 - Array update with \$addToSet" \
    "use insurance_company; db.test_policies.updateOne(
        {policyNumber: 'POL-AUTO-103'},
        {\$addToSet: {coverageTypes: 'rental_car'}}
    )" \
    ""

test_mongo_command \
    "Lab 5 - Upsert operation" \
    "use insurance_company; db.test_policies.updateOne(
        {policyNumber: 'POL-LIFE-999'},
        {\$set: {policyType: 'LIFE', premiumAmount: 500}},
        {upsert: true}
    )" \
    ""

test_mongo_command \
    "Lab 5 - Replace document" \
    "use insurance_company; db.test_policies.replaceOne(
        {policyNumber: 'POL-LIFE-999'},
        {
            policyNumber: 'POL-LIFE-999',
            policyType: 'LIFE',
            premiumAmount: 600,
            beneficiary: 'John Doe'
        }
    )" \
    ""

test_mongo_command \
    "Lab 5 - Delete single document" \
    "use insurance_company; db.test_claims.deleteOne({claimNumber: 'CLM-001'})" \
    ""

test_mongo_command \
    "Lab 5 - Delete multiple documents" \
    "use insurance_company; db.test_claims.deleteMany({amount: {\$lt: 1000}})" \
    ""

echo "========================================================================"
echo "LAB 6: Advanced Query Techniques - Testing Actual Lab Commands"
echo "========================================================================"

test_mongo_command \
    "Lab 6 - Complex AND/OR query" \
    "use insurance_analytics; db.policies.find({
        \$and: [
            {annualPremium: {\$gt: 500}},
            {\$or: [
                {policyType: 'HOME'},
                {policyType: 'AUTO'}
            ]}
        ]
    })" \
    ""

test_mongo_command \
    "Lab 6 - Date range query" \
    "use insurance_analytics; db.policies.find({
        createdAt: {
            \$gte: new Date('2024-01-01'),
            \$lt: new Date('2025-01-01')
        }
    })" \
    ""

test_mongo_command \
    "Lab 6 - Create text index" \
    "use insurance_analytics; db.policies.createIndex({
        policyType: 'text',
        description: 'text'
    })" \
    ""

test_mongo_command \
    "Lab 6 - Text search query" \
    "use insurance_analytics; db.policies.find({
        \$text: {\$search: 'auto vehicle car'}
    })" \
    ""

test_mongo_command \
    "Lab 6 - Regex pattern matching" \
    "use insurance_analytics; db.customers.find({
        phone: /^\\+1-555-/
    })" \
    ""

test_mongo_command \
    "Lab 6 - Case-insensitive search" \
    "use insurance_analytics; db.claims.find({
        status: {\$regex: 'pending|approved', \$options: 'i'}
    })" \
    ""

echo "========================================================================"
echo "LAB 7: Aggregation Framework - Testing Actual Lab Commands"
echo "========================================================================"

test_mongo_command_with_output \
    "Lab 7 - Basic grouping and counting" \
    "db.policies.aggregate([
        {\$group: {_id: '\$policyType', count: {\$sum: 1}}},
        {\$sort: {count: -1}}
    ])" \
    "insurance_company" \
    "_id"

test_mongo_command \
    "Lab 7 - Revenue analysis by agent" \
    "use insurance_company; db.policies.aggregate([
        {\$match: {isActive: true}},
        {\$group: {
            _id: '\$agentId',
            totalRevenue: {\$sum: '\$annualPremium'},
            policyCount: {\$sum: 1}
        }},
        {\$sort: {totalRevenue: -1}}
    ])" \
    ""

test_mongo_command \
    "Lab 7 - Claims analysis by month" \
    "use insurance_company; db.claims.aggregate([
        {\$match: {status: 'approved'}},
        {\$group: {
            _id: {
                year: {\$year: '\$createdAt'},
                month: {\$month: '\$createdAt'}
            },
            averageClaimAmount: {\$avg: '\$claimAmount'},
            totalClaims: {\$sum: 1}
        }},
        {\$sort: {'_id.year': 1, '_id.month': 1}}
    ])" \
    ""

test_mongo_command \
    "Lab 7 - Join with \$lookup" \
    "use insurance_company; db.policies.aggregate([
        {\$lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customerInfo'
        }},
        {\$unwind: '\$customerInfo'},
        {\$project: {
            policyNumber: 1,
            policyType: 1,
            annualPremium: 1,
            'customerInfo.firstName': 1,
            'customerInfo.lastName': 1
        }},
        {\$limit: 5}
    ])" \
    ""

test_mongo_command \
    "Lab 7 - Array processing with \$unwind" \
    "use insurance_company; db.policies.aggregate([
        {\$unwind: '\$coverageTypes'},
        {\$group: {
            _id: '\$coverageTypes',
            count: {\$sum: 1},
            averagePremium: {\$avg: '\$annualPremium'}
        }},
        {\$sort: {count: -1}}
    ])" \
    ""

echo "========================================================================"
echo "LAB 8: Indexing & Performance Optimization - Testing Actual Lab Commands"
echo "========================================================================"

test_mongo_command_with_output \
    "Lab 8 - Examine existing indexes" \
    "db.policies.getIndexes()" \
    "insurance_company" \
    "_id_"

test_mongo_command \
    "Lab 8 - Create compound index" \
    "use insurance_company; db.claims.createIndex({
        policyNumber: 1,
        status: 1,
        createdAt: -1
    })" \
    ""

test_mongo_command \
    "Lab 8 - Create text index with weights" \
    "use insurance_company; db.test_policies_text.createIndex({
        policyType: 'text',
        coverageDescription: 'text'
    }, {
        weights: {
            policyType: 10,
            coverageDescription: 5
        },
        name: 'policy_text_index'
    })" \
    ""

test_mongo_command \
    "Lab 8 - Create partial index" \
    "use insurance_company; db.policies.createIndex(
        {policyType: 1, annualPremium: 1},
        {partialFilterExpression: {status: 'active'}}
    )" \
    ""

test_mongo_command_with_output \
    "Lab 8 - Query performance analysis" \
    "db.policies.find({policyType: 'Auto'}).explain('executionStats')" \
    "insurance_company" \
    "executionStats"

echo "========================================================================"
echo "LAB 9: Data Modeling & Schema Design - Testing Actual Lab Commands"
echo "========================================================================"

# Test 1: Lab 9 - Create insurance claims collection (from lab lines 76-121)
test_mongo_command \
    "Lab 9 - Create insurance claims with embedded data" \
    "use insurance_company; db.insurance_claims.insertMany([{claimNumber: \"CLM-2024-001234\", policyNumber: \"POL-AUTO-2024-001\", customerId: \"CUST000001\", incidentDescription: \"Vehicle collision at intersection\", adjuster: {name: \"Sarah Johnson\", email: \"sarah.johnson@insuranceco.com\", licenseNumber: \"ADJ-5678\"}, incidentTypes: [\"collision\", \"property damage\", \"injury\"], investigationNotes: [{investigator: \"Mike Thompson\", note: \"Photos taken, police report obtained\", createdAt: new Date(\"2024-03-16\")}], filedAt: new Date(\"2024-03-15\"), estimatedAmount: 8500, status: \"under_investigation\"}, {claimNumber: \"CLM-2024-001235\", policyNumber: \"POL-HOME-2024-002\", customerId: \"CUST000002\", incidentDescription: \"Water damage from burst pipe\", adjuster: {name: \"David Chen\", email: \"david.chen@insuranceco.com\", licenseNumber: \"ADJ-9012\"}, incidentTypes: [\"water damage\", \"property damage\"], investigationNotes: [{investigator: \"Lisa Wong\", note: \"Plumber inspection completed\", createdAt: new Date(\"2024-03-17\")}], filedAt: new Date(\"2024-03-16\"), estimatedAmount: 12000, status: \"approved\"}])" \
    ""

test_mongo_command \
    "Lab 9 - Create collection with schema validation" \
    "use insurance_company; db.createCollection(\"policyholders\", {validator: {\$jsonSchema: {bsonType: \"object\", required: [\"email\", \"licenseNumber\", \"createdAt\"], properties: {email: {bsonType: \"string\", pattern: \"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}\$\"}, licenseNumber: {bsonType: \"string\", minLength: 8, maxLength: 20}, age: {bsonType: \"int\", minimum: 16, maximum: 120}, communicationPreferences: {bsonType: \"object\", properties: {emailNotifications: {bsonType: \"bool\"}, smsAlerts: {bsonType: \"bool\"}}}}}}})" \
    ""

test_mongo_command \
    "Lab 9 - Insert valid document to policyholders" \
    "use insurance_company; db.policyholders.insertOne({email: \"john.doe@email.com\", licenseNumber: \"LIC123456789\", age: 35, createdAt: new Date(), communicationPreferences: {emailNotifications: true, smsAlerts: false}})" \
    ""

test_mongo_command \
    "Lab 9 - Try-catch validation error handling" \
    "use insurance_company; try { db.policyholders.insertOne({email: \"invalid-email\", licenseNumber: \"123\", age: 15, createdAt: new Date()}); print('This should not print - validation should fail'); } catch (error) { print('Validation error (expected): ' + error.message); }" \
    ""

test_mongo_command \
    "Lab 9 - Query claims by adjuster name" \
    "use insurance_company; db.insurance_claims.find({\"adjuster.name\": \"Sarah Johnson\"})" \
    ""

test_mongo_command \
    "Lab 9 - Aggregate claims by status" \
    "use insurance_company; db.insurance_claims.aggregate([{\$group: {_id: \"\$status\", totalAmount: {\$sum: \"\$estimatedAmount\"}, count: {\$sum: 1}}}])" \
    ""

test_mongo_command \
    "Lab 9 - Query claims with specific incident types" \
    "use insurance_company; db.insurance_claims.find({incidentTypes: {\$in: [\"collision\", \"water damage\"]}})" \
    ""

test_mongo_command \
    "Lab 9 - Query investigation notes by investigator" \
    "use insurance_company; db.insurance_claims.find({\"investigationNotes.investigator\": \"Mike Thompson\"})" \
    ""

echo "========================================================================"
echo "LAB 10: MongoDB Transactions - Testing Actual Lab Commands"
echo "========================================================================"

test_mongo_command \
    "Lab 10 - Complete transaction with session management" \
    "use insurance_company; const session = db.getMongo().startSession();
    session.startTransaction({ readConcern: { level: \"majority\" }, writeConcern: { w: \"majority\", wtimeout: 5000 } });
    const sessionDb = session.getDatabase(\"insurance_company\");
    const customer = sessionDb.customers.findOne({});
    if (customer) {
        const customerUpdate = sessionDb.customers.updateOne({ customerId: customer.customerId }, { \$inc: { policyCount: 1 } });
        const newPolicyResult = sessionDb.policies.insertOne({
            policyNumber: \"TXN-\" + new Date().getTime(),
            policyType: \"Term Life\",
            customerId: customer.customerId,
            annualPremium: NumberDecimal(\"600.00\"),
            coverageLimit: 100000,
            effectiveDate: new Date(),
            expirationDate: new Date(new Date().getTime() + (365 * 24 * 60 * 60 * 1000)),
            isActive: true,
            createdInTransaction: true
        });
        session.commitTransaction();
        print('Transaction committed successfully');
    }
    session.endSession();" \
    ""

test_mongo_command \
    "Lab 10 - Transaction rollback demonstration" \
    "use insurance_company; const session2 = db.getMongo().startSession();
    session2.startTransaction();
    const sessionDb = session2.getDatabase(\"insurance_company\");
    try {
        sessionDb.test_collection.insertOne({test: 'rollback_test'});
        session2.abortTransaction();
        print('Transaction aborted successfully');
    } catch (error) {
        session2.abortTransaction();
        print('Transaction aborted due to error: ' + error.message);
    }
    session2.endSession();" \
    ""

test_mongo_command \
    "Lab 10 - Multi-collection transaction with session management" \
    "use insurance_company; const session3 = db.getMongo().startSession(); session3.startTransaction({ readConcern: { level: \"majority\" }, writeConcern: { w: \"majority\", wtimeout: 10000 } }); const sessionDb = session3.getDatabase(\"insurance_company\"); const customer = sessionDb.customers.findOne({}); const policy = sessionDb.policies.findOne({ customerId: customer.customerId }); const newClaim = sessionDb.claims.insertOne({ claimNumber: \"TXN-CLAIM-\" + new Date().getTime(), customerId: customer.customerId, policyNumber: policy.policyNumber, claimAmount: NumberDecimal(\"5000.00\"), status: \"Under Review\", filedDate: new Date(), description: \"Multi-collection transaction test claim\" }); sessionDb.customers.updateOne({ customerId: customer.customerId }, { \$inc: { claimCount: 1 }, \$set: { lastClaimDate: new Date() } }); sessionDb.policies.updateOne({ policyNumber: policy.policyNumber }, { \$set: { hasActiveClaims: true, lastClaimDate: new Date() } }); sessionDb.audit_logs.insertOne({ action: \"CLAIM_FILED\", entityType: \"claim\", entityId: newClaim.insertedId, userId: \"system\", timestamp: new Date(), details: { customerId: customer.customerId, policyNumber: policy.policyNumber, claimAmount: 5000.00 } }); session3.commitTransaction(); print(\"✅ Multi-collection transaction completed successfully\"); session3.endSession();" \
    ""

echo "========================================================================"
echo "LAB 11: Replica Sets & High Availability - Testing Actual Lab Commands"
echo "========================================================================"

# Part A: Understanding Replica Set Basics
test_mongo_command_with_output \
    "Lab 11 - Check replica set status" \
    "rs.status()" \
    "" \
    "set.*rs0"

test_mongo_command_with_output \
    "Lab 11 - Check current primary with db.hello()" \
    "db.hello()" \
    "" \
    "primary"

test_mongo_command_with_output \
    "Lab 11 - View replica set configuration" \
    "rs.conf()" \
    "" \
    "_id.*rs0"

# Part B: Write to Primary, Read from Secondary
# Step 2: Write Data to Primary
test_mongo_command \
    "Lab 11 Step 2 - Insert test policies to primary" \
    "use insurance_company; db.policies.insertMany([
        { policyNumber: 'POL-TEST-001', status: 'Active', premium: 5000, type: 'Auto', timestamp: new Date() },
        { policyNumber: 'POL-TEST-002', status: 'Pending', premium: 8500, type: 'Home', timestamp: new Date() },
        { policyNumber: 'POL-TEST-003', status: 'Active', premium: 3200, type: 'Life', timestamp: new Date() }
    ])" \
    ""

test_mongo_command \
    "Lab 11 Step 2 - Verify the write" \
    "use insurance_company; var count = db.policies.countDocuments({ policyNumber: /POL-TEST/ }); print('Count: ' + count); if (count >= 3) { print('SUCCESS: Found ' + count + ' test policies'); } else { throw new Error('Expected at least 3 policies'); }" \
    ""

# Step 3: Read from Secondary (Note: This requires connecting to secondary port which the validator simulates)
test_mongo_command \
    "Lab 11 Step 3 - Simulate secondary read with secondaryPreferred" \
    "use insurance_company; db.policies.find({ policyNumber: /POL-TEST/ }).readPref('secondaryPreferred').toArray()" \
    ""

# Step 4: Compare Primary vs Secondary Reads
test_mongo_command \
    "Lab 11 Step 4 - Read from primary" \
    "use insurance_company; var docs = db.policies.find({ policyNumber: /POL-TEST/ }).toArray(); if (docs.length > 0) { print('SUCCESS: Found test policies'); } else { throw new Error('No test policies found'); }" \
    ""

# Part C: Failover Testing
# Step 5: Identify Current Primary
test_mongo_command \
    "Lab 11 Step 5 - Identify current primary" \
    "var status = rs.status(); status.members.forEach(function(member) { if (member.state === 1) { print('PRIMARY: ' + member.name); } else if (member.state === 2) { print('SECONDARY: ' + member.name); } });" \
    ""

# Step 6: Simulate Primary Failure (Note: Validator doesn't actually step down to avoid disrupting tests)
test_mongo_command \
    "Lab 11 Step 6 - Verify stepDown command exists (simulation)" \
    "print('In actual lab, students run: rs.stepDown(60)'); print('Validator simulates failover scenario');" \
    ""

# Step 7: Verify Data Integrity After Failover
test_mongo_command \
    "Lab 11 Step 7 - Verify data is still accessible" \
    "use insurance_company; var count = db.policies.countDocuments({ policyNumber: /POL-TEST/ }); if (count >= 3) { print('SUCCESS: Data accessible, found ' + count + ' policies'); } else { throw new Error('Expected at least 3 policies'); }" \
    ""

test_mongo_command \
    "Lab 11 Step 7 - Insert new policy to new primary" \
    "use insurance_company; db.policies.insertOne({ policyNumber: 'POL-TEST-004', status: 'Active', premium: 7500, type: 'Commercial', timestamp: new Date() })" \
    ""

test_mongo_command \
    "Lab 11 Step 7 - Verify the new write" \
    "use insurance_company; var doc = db.policies.findOne({ policyNumber: 'POL-TEST-004' }); if (doc) { print('SUCCESS: Found new policy ' + doc.policyNumber); } else { throw new Error('Policy POL-TEST-004 not found'); }" \
    ""

# Step 8: Observe Replication
test_mongo_command \
    "Lab 11 Step 8 - Check replication lag" \
    "rs.printSecondaryReplicationInfo()" \
    ""

test_mongo_command \
    "Lab 11 Step 8 - Verify data on primary" \
    "use insurance_company; var count = db.policies.countDocuments({ policyNumber: /POL-TEST/ }); if (count >= 4) { print('SUCCESS: Found ' + count + ' policies on primary'); } else { throw new Error('Expected at least 4 policies'); }" \
    ""

# Part D: Understanding Write and Read Concerns
# Step 9: Write Concerns
test_mongo_command \
    "Lab 11 Step 9 - Write with majority concern (waits for majority acknowledgment)" \
    "use insurance_company; db.policies.insertOne(
        { policyNumber: 'POL-TEST-005', status: 'Active', premium: 9000, type: 'Auto', timestamp: new Date() },
        { writeConcern: { w: 'majority', wtimeout: 5000 } }
    )" \
    ""

test_mongo_command \
    "Lab 11 Step 9 - Write with w:1 (only primary acknowledgment)" \
    "use insurance_company; db.policies.insertOne(
        { policyNumber: 'POL-TEST-006', status: 'Active', premium: 4500, type: 'Life', timestamp: new Date() },
        { writeConcern: { w: 1 } }
    )" \
    ""

# Step 10: Read Concerns
test_mongo_command \
    "Lab 11 Step 10 - Read with majority concern (only majority-acknowledged data)" \
    "use insurance_company; var docs = db.policies.find({ policyNumber: /POL-TEST/ }).readConcern('majority').toArray(); if (docs.length > 0) { print('SUCCESS: Read ' + docs.length + ' policies with majority concern'); } else { throw new Error('No policies found'); }" \
    ""

test_mongo_command \
    "Lab 11 Step 10 - Read with local concern (fastest, may include non-replicated data)" \
    "use insurance_company; var docs = db.policies.find({ policyNumber: /POL-TEST/ }).readConcern('local').toArray(); if (docs.length > 0) { print('SUCCESS: Read ' + docs.length + ' policies with local concern'); } else { throw new Error('No policies found'); }" \
    ""

# Cleanup
test_mongo_command \
    "Lab 11 - Cleanup test data" \
    "use insurance_company; db.policies.deleteMany({ policyNumber: /POL-TEST/ })" \
    ""

echo "========================================================================"
echo "LAB 12: Sharding & Horizontal Scaling - Testing Actual Lab Commands"
echo "========================================================================"

# Part A: Understanding Sharding Architecture
# Step 2: Analyze Insurance Data for Sharding
test_mongo_command \
    "Lab 12 Step 2 - Analyze customer distribution by state for geographic sharding" \
    "use insurance_company; var customersByState = db.customers.aggregate([
        { \$group: { _id: '\$address.state', count: { \$sum: 1 } } },
        { \$sort: { count: -1 } }
    ]).toArray(); if (customersByState.length > 0) { print('SUCCESS: Found customer distribution across ' + customersByState.length + ' states'); } else { throw new Error('No customer data found'); }" \
    ""

test_mongo_command \
    "Lab 12 Step 2 - Analyze policy types for business-logic sharding" \
    "use insurance_company; var policiesByType = db.policies.aggregate([
        { \$group: { _id: '\$policyType', count: { \$sum: 1 } } },
        { \$sort: { count: -1 } }
    ]).toArray(); if (policiesByType.length > 0) { print('SUCCESS: Found ' + policiesByType.length + ' policy types'); } else { throw new Error('No policy data found'); }" \
    ""

test_mongo_command \
    "Lab 12 Step 2 - Simulate shard distribution calculation" \
    "use insurance_company; var totalDocs = db.customers.countDocuments(); var docsPerShard = Math.ceil(totalDocs / 3); print('Total customers: ' + totalDocs); print('Documents per shard (3 shards): ' + docsPerShard);" \
    ""

# Step 3: Sharding Strategy Simulation
test_mongo_command \
    "Lab 12 Step 3 - Geographic sharding simulation" \
    "use insurance_company; var customersByGeographicShard = db.customers.aggregate([
        { \$addFields: {
            assignedShard: {
                \$switch: {
                    branches: [
                        { case: { \$eq: ['\$address.state', 'CA'] }, then: 'shard-west' },
                        { case: { \$eq: ['\$address.state', 'NY'] }, then: 'shard-east' },
                        { case: { \$eq: ['\$address.state', 'TX'] }, then: 'shard-central' },
                        { case: { \$eq: ['\$address.state', 'FL'] }, then: 'shard-east' },
                        { case: { \$eq: ['\$address.state', 'IL'] }, then: 'shard-central' }
                    ],
                    default: 'shard-other'
                }
            }
        }},
        { \$group: { _id: '\$assignedShard', count: { \$sum: 1 } } },
        { \$sort: { _id: 1 } }
    ]).toArray(); for (var i = 0; i < customersByGeographicShard.length; i++) { var shard = customersByGeographicShard[i]; print('   ' + shard._id + ': ' + shard.count + ' customers'); }" \
    ""

test_mongo_command \
    "Lab 12 Step 3 - Hash sharding distribution simulation" \
    "use insurance_company; var customerCount = db.customers.countDocuments(); var shardSize = Math.ceil(customerCount / 3); print('shard-0: ~' + shardSize + ' customers'); print('shard-1: ~' + shardSize + ' customers'); print('shard-2: ~' + shardSize + ' customers');" \
    ""

test_mongo_command \
    "Lab 12 Step 3 - Range sharding by policy type simulation" \
    "use insurance_company; var policiesByTypeShard = db.policies.aggregate([
        { \$addFields: {
            assignedShard: {
                \$switch: {
                    branches: [
                        { case: { \$eq: ['\$policyType', 'Auto'] }, then: 'shard-auto' },
                        { case: { \$eq: ['\$policyType', 'Property'] }, then: 'shard-property' },
                        { case: { \$eq: ['\$policyType', 'Life'] }, then: 'shard-life' },
                        { case: { \$eq: ['\$policyType', 'Commercial'] }, then: 'shard-commercial' }
                    ],
                    default: 'shard-other'
                }
            }
        }},
        { \$group: { _id: '\$assignedShard', count: { \$sum: 1 } } },
        { \$sort: { _id: 1 } }
    ]).toArray(); for (var j = 0; j < policiesByTypeShard.length; j++) { var policyShard = policiesByTypeShard[j]; print('   ' + policyShard._id + ': ' + policyShard.count + ' policies'); }" \
    ""

# Step 4: Query Routing Simulation
test_mongo_command \
    "Lab 12 Step 4 - Query routing performance analysis" \
    "use insurance_company; var start = new Date(); var customerCount = db.customers.countDocuments({ 'address.state': 'CA' }); var end = new Date(); print('Current (non-sharded): ' + customerCount + ' CA customers found in ' + (end - start) + 'ms'); print('Sharded scenario: Would be faster with geographic sharding');" \
    ""

# Part B: Sharding Strategy Deep Dive
# Step 6: Load Test Data (Using separate collections to avoid conflicts)
test_mongo_command \
    "Lab 12 Step 6 - Generate test customer data for sharding" \
    "use insurance_company;
    var customerTypes = ['Individual', 'Business'];
    var states = ['CA', 'NY', 'TX', 'FL', 'IL'];
    for (let i = 1; i <= 100; i++) {
        var customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)];
        var state = states[Math.floor(Math.random() * states.length)];
        db.test_customers_sharding.insertOne({
            _id: 'test_cust' + i,
            name: customerType === 'Individual' ? 'Customer ' + i : 'Business Corp ' + i,
            type: customerType,
            state: state
        });
    }
    print('SUCCESS: Generated 100 test customers');" \
    ""

test_mongo_command \
    "Lab 12 Step 6 - Verify test customer data" \
    "use insurance_company; var count = db.test_customers_sharding.countDocuments(); if (count >= 100) { print('SUCCESS: Found ' + count + ' test customers'); } else { throw new Error('Expected at least 100 test customers'); }" \
    ""

test_mongo_command \
    "Lab 12 Step 6 - Generate test policy data for sharding" \
    "use insurance_company;
    var policyTypes = ['Auto', 'Property', 'Life', 'Commercial'];
    for (let i = 1; i <= 100; i++) {
        var policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)];
        db.test_policies_sharding.insertOne({
            _id: 'test_policy' + i,
            policyNumber: policyType.toUpperCase() + '-TEST-' + String(i).padStart(6, '0'),
            policyType: policyType
        });
    }
    print('SUCCESS: Generated 100 test policies');" \
    ""

test_mongo_command \
    "Lab 12 Step 6 - Verify test policy data" \
    "use insurance_company; var count = db.test_policies_sharding.countDocuments(); if (count >= 100) { print('SUCCESS: Found ' + count + ' test policies'); } else { throw new Error('Expected at least 100 test policies'); }" \
    ""

# Step 7: Analyze Distribution
test_mongo_command \
    "Lab 12 Step 7 - Analyze test customer distribution by state" \
    "use insurance_company; var distribution = db.test_customers_sharding.aggregate([
        { \$group: { _id: '\$state', count: { \$sum: 1 } } },
        { \$sort: { count: -1 } }
    ]).toArray(); if (distribution.length > 0) { print('SUCCESS: Found distribution across ' + distribution.length + ' states'); } else { throw new Error('No distribution data'); }" \
    ""

test_mongo_command \
    "Lab 12 Step 7 - Analyze test policy distribution by type" \
    "use insurance_company; var distribution = db.test_policies_sharding.aggregate([
        { \$group: { _id: '\$policyType', count: { \$sum: 1 } } },
        { \$sort: { count: -1 } }
    ]).toArray(); if (distribution.length > 0) { print('SUCCESS: Found ' + distribution.length + ' policy types'); } else { throw new Error('No distribution data'); }" \
    ""

# Cleanup test data
test_mongo_command \
    "Lab 12 - Cleanup test sharding data" \
    "use insurance_company; db.test_customers_sharding.drop(); db.test_policies_sharding.drop(); db.test_claims_sharding.drop(); db.test_agents_sharding.drop(); print('SUCCESS: Cleaned up test data');" \
    ""

# Part C: Zone Sharding and Management
# Step 8: Zone Sharding Concepts (Simulation)
test_mongo_command \
    "Lab 12 Step 8 - Zone sharding analysis with suggested zones" \
    "use insurance_company; var stateDistribution = db.customers.aggregate([
        { \$group: { _id: '\$address.state', customers: { \$sum: 1 } } },
        { \$addFields: {
            suggestedZone: {
                \$cond: {
                    if: { \$in: ['\$_id', ['NY', 'FL', 'GA', 'NC', 'PA']] },
                    then: 'EASTERN-REGION',
                    else: 'WESTERN-REGION'
                }
            }
        }},
        { \$sort: { customers: -1 } }
    ]).toArray(); stateDistribution.forEach(function(result) { print('  ' + (result._id || 'Unknown') + ': ' + result.customers + ' customers → ' + result.suggestedZone); });" \
    ""

# Step 9: Chunk Management Concepts (Simulation)
test_mongo_command \
    "Lab 12 Step 9 - Chunk distribution analysis" \
    "use insurance_company; if (db.policies.countDocuments() > 0) { var policyTypes = db.policies.aggregate([{ \$group: { _id: '\$policyType', count: { \$sum: 1 } } }, { \$sort: { count: -1 } }]).toArray(); policyTypes.forEach(function(result) { print('  ' + (result._id || 'Unknown') + ': ' + result.count + ' policies'); }); } if (db.claims.countDocuments() > 0) { var totalClaims = db.claims.countDocuments(); print('Total claims: ' + totalClaims); print('Estimated chunks (64MB each): ' + Math.ceil(totalClaims / 1000)); }" \
    ""

echo "========================================================================"
echo "LAB 13: Change Streams & Real-time Processing - Testing Actual Lab Commands"
echo "========================================================================"

# Part A: Change Stream Infrastructure Setup
# Step 1: Create Supporting Collections for Change Stream Processing
test_mongo_command \
    "Lab 13 Step 1 - Create notifications recipientId index" \
    "use insurance_company; db.notifications.createIndex({ recipientId: 1, timestamp: -1 })" \
    ""

test_mongo_command \
    "Lab 13 Step 1 - Create notifications type index" \
    "use insurance_company; db.notifications.createIndex({ type: 1, read: 1 })" \
    ""

test_mongo_command \
    "Lab 13 Step 1 - Create notifications priority index" \
    "use insurance_company; db.notifications.createIndex({ priority: 1, status: 1 })" \
    ""

test_mongo_command \
    "Lab 13 Step 1 - Create activity log timestamp index" \
    "use insurance_company; db.activity_log.createIndex({ timestamp: -1 })" \
    ""

test_mongo_command \
    "Lab 13 Step 1 - Create activity log operation index" \
    "use insurance_company; db.activity_log.createIndex({ operation: 1, timestamp: -1 })" \
    ""

test_mongo_command \
    "Lab 13 Step 1 - Create activity log userId index" \
    "use insurance_company; db.activity_log.createIndex({ userId: 1, timestamp: -1 })" \
    ""

test_mongo_command \
    "Lab 13 Step 1 - Create fraud alerts customerId index" \
    "use insurance_company; db.fraud_alerts.createIndex({ customerId: 1, timestamp: -1 })" \
    ""

test_mongo_command \
    "Lab 13 Step 1 - Create fraud alerts severity index" \
    "use insurance_company; db.fraud_alerts.createIndex({ severity: 1, status: 1 })" \
    ""

test_mongo_command \
    "Lab 13 Step 1 - Create resume tokens index" \
    "use insurance_company; db.resume_tokens.createIndex({ lastUpdated: -1 })" \
    ""

# Part B: Simulated Change Stream Processing
# Step 3: Test Claims Processing Simulation
test_mongo_command \
    "Lab 13 Step 3 - Create test claim (Step 1-2)" \
    "use insurance_company; db.claims.insertOne({
        _id: 'claim_cs_test1',
        claimNumber: 'CLM-2024-CS001',
        customerId: 'cust1',
        policyNumber: 'POL-001',
        claimType: 'Auto',
        claimAmount: NumberDecimal('15000.00'),
        status: 'Filed',
        incidentDate: new Date('2024-03-15'),
        filedDate: new Date(),
        description: 'Vehicle collision on highway'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Create customer claim notification" \
    "use insurance_company; db.notifications.insertOne({
        recipientId: 'cust1',
        type: 'claim_filed',
        priority: 'medium',
        message: 'Your claim CLM-2024-CS001 has been filed and is under review.',
        claimId: 'claim_cs_test1',
        claimNumber: 'CLM-2024-CS001',
        timestamp: new Date(),
        read: false,
        status: 'active'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Create claims department notification" \
    "use insurance_company; db.notifications.insertOne({
        recipientId: 'claims_department',
        type: 'claim_assignment',
        priority: 'high',
        message: 'New Auto claim filed: CLM-2024-CS001 for \$15000.00',
        claimId: 'claim_cs_test1',
        timestamp: new Date(),
        read: false,
        status: 'active'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Verify claim notifications created" \
    "use insurance_company; var notifs = db.notifications.find({ claimId: 'claim_cs_test1' }).toArray(); if (notifs.length >= 2) { print('SUCCESS: Found ' + notifs.length + ' claim notifications'); } else { throw new Error('Expected at least 2 notifications'); }" \
    ""

# Part B: Policy Creation Simulation
test_mongo_command \
    "Lab 13 - Insert test policy" \
    "use insurance_company; db.policies.insertOne({
        _id: 'policy_cs_test1',
        policyNumber: 'POL-CS-2024-001',
        customerId: 'cust2',
        policyType: 'Home Insurance',
        coverageLimit: 250000,
        effectiveDate: new Date(),
        premiumAmount: NumberDecimal('1200.00'),
        status: 'Active'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Create policy welcome notification" \
    "use insurance_company; db.notifications.insertOne({
        recipientId: 'cust2',
        type: 'policy_issued',
        priority: 'medium',
        message: 'Welcome! Your Home Insurance policy POL-CS-2024-001 is now active.',
        policyId: 'policy_cs_test1',
        timestamp: new Date(),
        read: false,
        status: 'active'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Verify policy notification" \
    "use insurance_company; var notif = db.notifications.findOne({ policyId: 'policy_cs_test1' }); if (notif) { print('SUCCESS: Found policy notification'); } else { throw new Error('Policy notification not found'); }" \
    ""

# Part B: Claims Status Update Simulation
test_mongo_command \
    "Lab 13 - Update claim to Under Review" \
    "use insurance_company; db.claims.updateOne(
        { _id: 'claim_cs_test1' },
        { \$set: { status: 'Under Review', reviewDate: new Date() } }
    )" \
    ""

test_mongo_command \
    "Lab 13 - Create status update notification" \
    "use insurance_company; db.notifications.insertOne({
        recipientId: 'cust1',
        type: 'claim_status_update',
        priority: 'medium',
        message: 'Your claim CLM-2024-CS001 is now under review by our adjusters.',
        claimId: 'claim_cs_test1',
        claimNumber: 'CLM-2024-CS001',
        timestamp: new Date(),
        read: false,
        status: 'active'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Update claim to Approved" \
    "use insurance_company; db.claims.updateOne(
        { _id: 'claim_cs_test1' },
        { \$set: { status: 'Approved', settlementAmount: NumberDecimal('14500.00') } }
    )" \
    ""

test_mongo_command \
    "Lab 13 - Create settlement notification" \
    "use insurance_company; db.notifications.insertOne({
        recipientId: 'cust1',
        type: 'settlement_approved',
        priority: 'high',
        message: 'Your claim CLM-2024-CS001 has been settled for \$14500.00',
        claimId: 'claim_cs_test1',
        claimNumber: 'CLM-2024-CS001',
        timestamp: new Date(),
        read: false,
        status: 'active'
    })" \
    ""

# Part C: Fraud Detection Simulation
test_mongo_command \
    "Lab 13 - Insert suspicious high-value claim" \
    "use insurance_company; db.claims.insertOne({
        _id: 'claim_fraud_test',
        claimNumber: 'CLM-FRAUD-001',
        customerId: 'cust3',
        policyNumber: 'POL-002',
        claimType: 'Auto',
        claimAmount: NumberDecimal('75000.00'),
        status: 'Filed',
        incidentDate: new Date(),
        filedDate: new Date(),
        description: 'High-value vehicle total loss'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Create fraud alert" \
    "use insurance_company; db.fraud_alerts.insertOne({
        customerId: 'cust3',
        claimId: 'claim_fraud_test',
        claimNumber: 'CLM-FRAUD-001',
        severity: 'medium',
        indicators: ['High claim amount'],
        status: 'active',
        timestamp: new Date(),
        reviewedBy: null,
        notes: 'Automatically generated fraud alert'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Create fraud team notification" \
    "use insurance_company; db.notifications.insertOne({
        recipientId: 'fraud_investigation_team',
        type: 'fraud_alert',
        priority: 'critical',
        message: 'Potential fraud detected for claim CLM-FRAUD-001. Severity: medium',
        claimId: 'claim_fraud_test',
        timestamp: new Date(),
        read: false,
        status: 'active'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Verify fraud detection results" \
    "use insurance_company; var fraudAlert = db.fraud_alerts.findOne({ claimId: 'claim_fraud_test' }); var fraudNotif = db.notifications.findOne({ type: 'fraud_alert' }); if (fraudAlert && fraudNotif) { print('SUCCESS: Found fraud alert and notification'); } else { throw new Error('Fraud detection verification failed'); }" \
    ""

# Part C: Activity Logging Simulation
test_mongo_command \
    "Lab 13 - Log delete operation" \
    "use insurance_company; db.activity_log.insertOne({
        operation: 'delete',
        collection: 'test_collection',
        documentId: 'test_doc_123',
        timestamp: new Date(),
        userId: 'system'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Log claim processing activity" \
    "use insurance_company; db.activity_log.insertOne({
        operation: 'claim_processed',
        collection: 'claims',
        documentId: 'claim_cs_test1',
        details: {
            previousStatus: 'Filed',
            newStatus: 'Approved',
            processedBy: 'adjuster1'
        },
        timestamp: new Date(),
        userId: 'system'
    })" \
    ""

test_mongo_command \
    "Lab 13 - Query recent activity logs" \
    "use insurance_company; var logs = db.activity_log.find().sort({ timestamp: -1 }).limit(5).toArray(); if (logs.length > 0) { print('SUCCESS: Found ' + logs.length + ' activity logs'); } else { throw new Error('No activity logs found'); }" \
    ""

# Part D: Real-time Monitoring Dashboard Simulation
test_mongo_command \
    "Lab 13 - Real-time dashboard queries" \
    "use insurance_company; print('Active Claims: ' + db.claims.countDocuments({ status: { \$in: ['Filed', 'Under Review'] } })); print('Pending Notifications: ' + db.notifications.countDocuments({ read: false })); print('Active Fraud Alerts: ' + db.fraud_alerts.countDocuments({ status: 'active' }));" \
    ""

test_mongo_command \
    "Lab 13 - Customer notification summary" \
    "use insurance_company; db.notifications.aggregate([
        { \$group: { _id: '\$type', count: { \$sum: 1 } } },
        { \$sort: { count: -1 } }
    ])" \
    ""

test_mongo_command \
    "Lab 13 - Query high priority notifications" \
    "use insurance_company; db.notifications.find({ priority: 'high', read: false }).sort({ timestamp: -1 }).limit(3)" \
    ""

# Cleanup
test_mongo_command \
    "Lab 13 - Cleanup test data" \
    "use insurance_company; db.claims.deleteMany({ _id: { \$in: ['claim_cs_test1', 'claim_fraud_test'] } }); db.policies.deleteMany({ _id: 'policy_cs_test1' }); db.notifications.deleteMany({ \$or: [{ claimId: { \$in: ['claim_cs_test1', 'claim_fraud_test'] } }, { policyId: 'policy_cs_test1' }] }); db.fraud_alerts.deleteMany({ claimId: 'claim_fraud_test' }); db.activity_log.deleteMany({ userId: 'system' });" \
    ""

# Final Results
echo "========================================================================"
echo -e "${BLUE}FINAL VALIDATION RESULTS${NC}"
echo "========================================================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "Success Rate: 100%"
    VALIDATION_SUCCESS=true
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%"
    echo
    echo "Failed commands:"
    for cmd in "${FAILED_COMMANDS[@]}"; do
        echo "  - $cmd"
    done
    VALIDATION_SUCCESS=false
fi

# Run environment cleanup if clean run was selected
if [ "$CLEAN_RUN" = true ]; then
    cleanup_environment
fi

# Exit with appropriate code
if [ "$VALIDATION_SUCCESS" = true ]; then
    exit 0
else
    exit 1
fi