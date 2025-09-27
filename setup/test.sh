#!/bin/bash

# MongoDB Mastering Course - Quick Test Script
# Tests MongoDB connection and basic operations

set -e  # Exit on any error

echo "=================================================="
echo "MongoDB Mastering Course - Connection Test"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test 1: Basic connection
print_status "Testing MongoDB connection..."
if mongosh --quiet --eval "db.hello()" > /dev/null 2>&1; then
    print_success "Connected to MongoDB"
else
    print_error "Cannot connect to MongoDB"
    echo ""
    echo "Make sure MongoDB is running:"
    echo "  ./setup.sh"
    exit 1
fi

# Test 2: Replica set status
print_status "Checking replica set status..."
echo ""
mongosh --quiet --eval "
rs.status().members.forEach(m => print('  ' + m.name + ': ' + m.stateStr));
"
echo ""

# Test 3: Write operations
print_status "Testing write operations..."
mongosh --quiet --eval "
use test_connection;
db.test.insertOne({test: 'connection', timestamp: new Date()});
var doc = db.test.findOne();
if (doc && doc.test === 'connection') {
    print('✅ Write/Read test: PASSED');
} else {
    print('❌ Write/Read test: FAILED');
}
db.test.drop();
"

# Test 4: Load course data if available
print_status "Checking for course data..."
if [ -f "../data/day1_data_loader.js" ]; then
    read -p "Load Day 1 course data? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Loading Day 1 course data..."
        cd ../data
        mongosh --quiet < day1_data_loader.js
        cd ../setup
        print_success "Course data loaded"

        # Verify data
        print_status "Verifying loaded data..."
        mongosh --quiet --eval "
        use insurance_company;
        print('  Branches: ' + db.branches.countDocuments());
        print('  Policies: ' + db.policies.countDocuments());
        print('  Customers: ' + db.customers.countDocuments());
        "
    fi
else
    print_warning "Course data files not found in ../data/"
fi

echo ""
echo "=================================================="
print_success "Test Complete!"
echo "=================================================="
echo ""
echo "Your MongoDB setup is working correctly."
echo ""
echo "Available commands:"
echo "  mongosh                    # Connect to MongoDB"
echo "  ./teardown.sh             # Remove all containers"
echo ""
echo "=================================================="