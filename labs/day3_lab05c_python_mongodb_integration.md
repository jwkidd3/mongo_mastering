# Lab 5C: Python MongoDB Integration for Insurance Management
**Duration:** 45 minutes
**Objective:** Integrate MongoDB with Python using Jupyter Notebook for insurance management system

## Overview
This lab demonstrates how to build a complete insurance management application using Python and PyMongo in Jupyter Notebook. You'll create an interactive insurance system that handles policies, customers, and claims using modern Python patterns with live code execution and data visualization.

## Part A: Jupyter Notebook Setup (5 minutes)

### Step 1: Launch Jupyter Notebook
```bash
# Navigate to your preferred directory
cd ~/Documents

# Launch Jupyter Notebook
jupyter notebook
```

**In Jupyter:**
1. Click "New" → "Python 3" to create new notebook
2. Rename notebook: "MongoDB_Insurance_Management"
3. You'll work in notebook cells throughout this lab

### Step 2: Install and Import Packages
**Cell 1 - Install packages:**
```python
# Install required packages (run once)
!pip install pymongo

print("✅ Packages installed successfully")
```

**Cell 2 - Import libraries:**
```python
# Import necessary libraries
import pymongo
from pymongo import MongoClient
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
import json
from bson import ObjectId
import pandas as pd

print("✅ All libraries imported successfully")
print(f"PyMongo version: {pymongo.version}")
```

## Part B: Database Connection (5 minutes)

**Cell 3 - Database Connection:**
```python
class DatabaseConnection:
    def __init__(self, uri='mongodb://localhost:27017', db_name='insurance_company'):
        self.uri = uri
        self.db_name = db_name
        self.client = None
        self.db = None

    def connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(
                self.uri,
                serverSelectionTimeoutMS=5000
            )

            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]

            print(f"✅ Connected to MongoDB successfully")
            print(f"📊 Database: {self.db_name}")
            return self.db

        except Exception as e:
            print(f"❌ MongoDB connection error: {e}")
            raise

    def get_db(self):
        if not self.db:
            return self.connect()
        return self.db

# Initialize connection
db_connection = DatabaseConnection()
db = db_connection.connect()
```

## Part C: Data Models (10 minutes)

**Cell 4 - Validation Utilities:**
```python
import re

class ValidationError(Exception):
    """Custom validation error"""
    pass

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_policy_type(policy_type: str) -> bool:
    """Validate policy type"""
    valid_types = ['Auto', 'Property', 'Life', 'Commercial']
    return policy_type in valid_types

print("✅ Validation utilities created")
```

**Cell 5 - Policy Model:**
```python
@dataclass
class Policy:
    """Insurance Policy model for Jupyter analysis"""
    policy_number: str
    customer_id: str
    policy_type: str  # Auto, Property, Life, Commercial
    region: str
    state: str
    coverage_limit: float
    annual_premium: float
    deductible: float
    is_active: bool = True
    effective_date: datetime = field(default_factory=datetime.now)
    expiration_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    _id: Optional[ObjectId] = field(default_factory=ObjectId)

    def __post_init__(self):
        """Set expiration date if not provided"""
        if not self.expiration_date:
            self.expiration_date = self.effective_date + timedelta(days=365)

    def validate(self) -> None:
        """Validate policy data"""
        errors = []

        if not self.policy_number:
            errors.append("Policy number is required")
        if not self.customer_id:
            errors.append("Customer ID is required")
        if not validate_policy_type(self.policy_type):
            errors.append("Invalid policy type")
        if self.coverage_limit <= 0:
            errors.append("Coverage limit must be positive")
        if self.annual_premium <= 0:
            errors.append("Annual premium must be positive")

        if errors:
            raise ValidationError(f"Validation failed: {', '.join(errors)}")

    def get_monthly_premium(self) -> float:
        """Calculate monthly premium"""
        return round(self.annual_premium / 12, 2)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for MongoDB"""
        return {
            '_id': self._id,
            'policy_number': self.policy_number,
            'customer_id': self.customer_id,
            'policy_type': self.policy_type,
            'region': self.region,
            'state': self.state,
            'coverage_limit': self.coverage_limit,
            'annual_premium': self.annual_premium,
            'deductible': self.deductible,
            'is_active': self.is_active,
            'effective_date': self.effective_date,
            'expiration_date': self.expiration_date,
            'created_at': self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Policy':
        """Create Policy from MongoDB document"""
        return cls(
            _id=data.get('_id', ObjectId()),
            policy_number=data['policy_number'],
            customer_id=data['customer_id'],
            policy_type=data['policy_type'],
            region=data['region'],
            state=data['state'],
            coverage_limit=data['coverage_limit'],
            annual_premium=data['annual_premium'],
            deductible=data['deductible'],
            is_active=data.get('is_active', True),
            effective_date=data.get('effective_date', datetime.now()),
            expiration_date=data.get('expiration_date'),
            created_at=data.get('created_at', datetime.now())
        )

print("✅ Policy model created successfully")
```

**Cell 6 - Customer Model:**
```python
@dataclass
class Customer:
    """Insurance Customer model"""
    customer_id: str
    first_name: str
    last_name: str
    email: str
    phone: str = ""
    state: str = ""
    customer_type: str = "individual"  # individual, family, business
    risk_score: int = 0
    is_active: bool = True
    registration_date: datetime = field(default_factory=datetime.now)
    _id: Optional[ObjectId] = field(default_factory=ObjectId)

    def get_full_name(self) -> str:
        """Get full name"""
        return f"{self.first_name} {self.last_name}"

    def get_risk_category(self) -> str:
        """Get risk category based on score"""
        if self.risk_score <= 30:
            return "Low Risk"
        elif self.risk_score <= 70:
            return "Medium Risk"
        else:
            return "High Risk"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for MongoDB"""
        return {
            '_id': self._id,
            'customer_id': self.customer_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'state': self.state,
            'customer_type': self.customer_type,
            'risk_score': self.risk_score,
            'is_active': self.is_active,
            'registration_date': self.registration_date
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Customer':
        """Create Customer from MongoDB document"""
        return cls(
            _id=data.get('_id', ObjectId()),
            customer_id=data['customer_id'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone=data.get('phone', ''),
            state=data.get('state', ''),
            customer_type=data.get('customer_type', 'individual'),
            risk_score=data.get('risk_score', 0),
            is_active=data.get('is_active', True),
            registration_date=data.get('registration_date', datetime.now())
        )

print("✅ Customer model created successfully")
```

## Part D: Insurance Management Service (15 minutes)

**Cell 7 - Policy Service:**
```python
class PolicyService:
    """Insurance policy management service"""

    def __init__(self, database):
        self.db = database
        self.collection = database.policies
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create necessary indexes"""
        try:
            self.collection.create_index("policy_number", unique=True)
            self.collection.create_index([("customer_id", 1), ("is_active", 1)])
            self.collection.create_index([("policy_type", 1), ("state", 1)])
            print("📊 Indexes created successfully")
        except Exception as e:
            print(f"⚠️ Index warning: {e}")

    def create_policy(self, policy_data: Dict[str, Any]) -> str:
        """Create new policy"""
        try:
            policy = Policy(**policy_data)
            policy.validate()

            result = self.collection.insert_one(policy.to_dict())
            print(f"✅ Policy created: {policy.policy_number}")
            return str(result.inserted_id)

        except Exception as e:
            print(f"❌ Error creating policy: {e}")
            raise

    def get_policy(self, policy_number: str) -> Policy:
        """Get policy by policy number"""
        doc = self.collection.find_one({'policy_number': policy_number})
        if not doc:
            raise ValueError(f"Policy {policy_number} not found")
        return Policy.from_dict(doc)

    def update_premium(self, policy_number: str, new_premium: float) -> bool:
        """Update policy premium"""
        if new_premium <= 0:
            raise ValueError("Premium must be positive")

        result = self.collection.update_one(
            {'policy_number': policy_number},
            {'$set': {'annual_premium': new_premium}}
        )

        if result.matched_count == 0:
            raise ValueError(f"Policy {policy_number} not found")

        print(f"✅ Updated premium for {policy_number}: ${new_premium}")
        return True

    def search_policies(self, filters: Dict[str, Any] = None) -> List[Policy]:
        """Search policies with filters"""
        if filters is None:
            filters = {}

        query = {}
        if 'policy_type' in filters:
            query['policy_type'] = filters['policy_type']
        if 'state' in filters:
            query['state'] = filters['state']
        if 'active_only' in filters and filters['active_only']:
            query['is_active'] = True

        cursor = self.collection.find(query)

        if 'limit' in filters:
            cursor = cursor.limit(filters['limit'])

        return [Policy.from_dict(doc) for doc in cursor]

    def get_statistics(self) -> List[Dict[str, Any]]:
        """Get policy statistics by type"""
        pipeline = [
            {
                '$group': {
                    '_id': '$policy_type',
                    'count': {'$sum': 1},
                    'total_premium': {'$sum': '$annual_premium'},
                    'average_premium': {'$avg': '$annual_premium'},
                    'average_coverage': {'$avg': '$coverage_limit'}
                }
            },
            {'$sort': {'count': -1}}
        ]

        return list(self.collection.aggregate(pipeline))

# Initialize service
policy_service = PolicyService(db)
print("✅ Policy service initialized")
```

## Part E: Hands-on Operations (15 minutes)

**Cell 8 - Create Sample Policies:**
```python
# Create sample insurance policies
sample_policies = [
    {
        'policy_number': 'POL-JUPYTER-001',
        'customer_id': 'CUST000001',
        'policy_type': 'Auto',
        'region': 'West Coast',
        'state': 'CA',
        'coverage_limit': 250000.0,
        'annual_premium': 1800.0,
        'deductible': 750.0
    },
    {
        'policy_number': 'POL-JUPYTER-002',
        'customer_id': 'CUST000002',
        'policy_type': 'Property',
        'region': 'East Coast',
        'state': 'NY',
        'coverage_limit': 500000.0,
        'annual_premium': 2400.0,
        'deductible': 1000.0
    },
    {
        'policy_number': 'POL-JUPYTER-003',
        'customer_id': 'CUST000001',
        'policy_type': 'Life',
        'region': 'West Coast',
        'state': 'CA',
        'coverage_limit': 1000000.0,
        'annual_premium': 3600.0,
        'deductible': 0.0
    }
]

# Create policies
created_policies = []
for policy_data in sample_policies:
    try:
        policy_id = policy_service.create_policy(policy_data)
        created_policies.append(policy_data['policy_number'])
    except Exception as e:
        print(f"Error creating policy {policy_data['policy_number']}: {e}")

print(f"\n📋 Created {len(created_policies)} policies")
print("Policy numbers:", created_policies)
```

**Cell 9 - Query and Display Policies:**
```python
# Retrieve and display policy information
print("🔍 Policy Information:")
print("=" * 50)

for policy_number in created_policies:
    try:
        policy = policy_service.get_policy(policy_number)
        print(f"\n📄 Policy: {policy.policy_number}")
        print(f"   Type: {policy.policy_type}")
        print(f"   Customer: {policy.customer_id}")
        print(f"   Annual Premium: ${policy.annual_premium:,.2f}")
        print(f"   Monthly Premium: ${policy.get_monthly_premium()}")
        print(f"   Coverage: ${policy.coverage_limit:,.2f}")
        print(f"   State: {policy.state}")
        print(f"   Status: {'Active' if policy.is_active else 'Inactive'}")
    except Exception as e:
        print(f"Error retrieving {policy_number}: {e}")
```

**Cell 10 - Policy Updates:**
```python
# Update policy premiums
print("💰 Updating Policy Premiums:")
print("=" * 30)

premium_updates = [
    ('POL-JUPYTER-001', 1950.0),
    ('POL-JUPYTER-002', 2600.0)
]

for policy_number, new_premium in premium_updates:
    try:
        policy_service.update_premium(policy_number, new_premium)
    except Exception as e:
        print(f"Error updating {policy_number}: {e}")

print("\n✅ Premium updates completed")
```

**Cell 11 - Advanced Queries and Analytics:**
```python
# Search and filter policies
print("🔍 Advanced Policy Searches:")
print("=" * 35)

# Find Auto policies
auto_policies = policy_service.search_policies({
    'policy_type': 'Auto',
    'active_only': True,
    'limit': 10
})

print(f"\n🚗 Auto Policies ({len(auto_policies)}):")
for policy in auto_policies:
    print(f"   {policy.policy_number}: ${policy.annual_premium} ({policy.state})")

# Find high-value policies
all_policies = policy_service.search_policies({'active_only': True})
high_value_policies = [p for p in all_policies if p.annual_premium > 2000]

print(f"\n💎 High-Value Policies (>${2000}+): {len(high_value_policies)}")
for policy in high_value_policies:
    print(f"   {policy.policy_number}: ${policy.annual_premium} ({policy.policy_type})")

# Find policies by state
ca_policies = policy_service.search_policies({'state': 'CA'})
print(f"\n🌴 California Policies: {len(ca_policies)}")
for policy in ca_policies:
    print(f"   {policy.policy_number}: {policy.policy_type} - ${policy.annual_premium}")
```

**Cell 12 - Statistics and Aggregation:**
```python
# Get comprehensive policy statistics
print("📊 Policy Statistics and Analytics:")
print("=" * 40)

stats = policy_service.get_statistics()

print("\n📈 Policies by Type:")
for stat in stats:
    print(f"   {stat['_id']}: {stat['count']} policies")
    print(f"      Total Premium: ${stat['total_premium']:,.2f}")
    print(f"      Average Premium: ${stat['average_premium']:,.2f}")
    print(f"      Average Coverage: ${stat['average_coverage']:,.2f}")
    print()

# Calculate total portfolio value
total_premium = sum(stat['total_premium'] for stat in stats)
total_policies = sum(stat['count'] for stat in stats)

print(f"💰 Portfolio Summary:")
print(f"   Total Policies: {total_policies}")
print(f"   Total Annual Premium: ${total_premium:,.2f}")
print(f"   Average Premium: ${total_premium/total_policies:,.2f}")
```

## Part F: Data Visualization (5 minutes)

**Cell 13 - Data Visualization:**
```python
# Create DataFrames for visualization
import matplotlib.pyplot as plt

# Convert policies to DataFrame
policies_data = []
for policy in policy_service.search_policies():
    policies_data.append({
        'Policy Number': policy.policy_number,
        'Type': policy.policy_type,
        'State': policy.state,
        'Premium': policy.annual_premium,
        'Coverage': policy.coverage_limit,
        'Monthly Premium': policy.get_monthly_premium()
    })

df_policies = pd.DataFrame(policies_data)

print("📊 Policy Data Summary:")
print(df_policies.describe())

# Create visualizations
if len(df_policies) > 0:
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))

    # Premium by policy type
    df_policies.groupby('Type')['Premium'].sum().plot(kind='bar', ax=axes[0,0])
    axes[0,0].set_title('Total Premium by Policy Type')
    axes[0,0].set_ylabel('Premium ($)')

    # Premium by state
    df_policies.groupby('State')['Premium'].sum().plot(kind='bar', ax=axes[0,1])
    axes[0,1].set_title('Total Premium by State')
    axes[0,1].set_ylabel('Premium ($)')

    # Premium distribution
    df_policies['Premium'].hist(bins=10, ax=axes[1,0])
    axes[1,0].set_title('Premium Distribution')
    axes[1,0].set_xlabel('Premium ($)')
    axes[1,0].set_ylabel('Frequency')

    # Coverage vs Premium scatter
    axes[1,1].scatter(df_policies['Coverage'], df_policies['Premium'])
    axes[1,1].set_title('Coverage vs Premium')
    axes[1,1].set_xlabel('Coverage ($)')
    axes[1,1].set_ylabel('Premium ($)')

    plt.tight_layout()
    plt.show()

print("\n✅ Data visualization completed")
```

**Cell 14 - Customer Integration:**
```python
# Work with existing customer data
customers_collection = db.customers

# Find customers and their policies
print("👥 Customer-Policy Integration:")
print("=" * 35)

customer_docs = list(customers_collection.find().limit(3))

for customer_doc in customer_docs:
    customer = Customer.from_dict(customer_doc)
    print(f"\n👤 Customer: {customer.get_full_name()}")
    print(f"   ID: {customer.customer_id}")
    print(f"   Email: {customer.email}")
    print(f"   Risk Level: {customer.get_risk_category()}")

    # Find customer's policies
    customer_policies = policy_service.search_policies({
        'customer_id': customer.customer_id  # This will search existing + new policies
    })

    print(f"   Policies ({len(customer_policies)}):")
    total_premium = 0
    for policy in customer_policies:
        print(f"      {policy.policy_number}: {policy.policy_type} - ${policy.annual_premium}")
        total_premium += policy.annual_premium

    if total_premium > 0:
        print(f"   Total Annual Premium: ${total_premium:,.2f}")
```

## Part G: Error Handling and Best Practices (5 minutes)

**Cell 15 - Error Handling Demo:**
```python
print("🛡️ Error Handling Demonstrations:")
print("=" * 40)

# Test validation errors
print("\n1. Testing Validation Errors:")
try:
    invalid_policy = {
        'policy_number': '',  # Empty required field
        'customer_id': 'CUST999',
        'policy_type': 'InvalidType',  # Invalid type
        'region': 'Test',
        'state': 'TX',
        'coverage_limit': -100,  # Invalid amount
        'annual_premium': -50,   # Invalid amount
        'deductible': 500
    }
    policy_service.create_policy(invalid_policy)
except Exception as e:
    print(f"✅ Validation error caught: {e}")

# Test not found error
print("\n2. Testing Not Found Error:")
try:
    policy_service.get_policy('NONEXISTENT-POLICY')
except Exception as e:
    print(f"✅ Not found error caught: {e}")

# Test business logic error
print("\n3. Testing Business Logic Error:")
try:
    policy_service.update_premium('POL-JUPYTER-001', -500)
except Exception as e:
    print(f"✅ Business logic error caught: {e}")

print("\n✅ Error handling demonstration completed")
```

## Summary

**Cell 16 - Course Summary:**
```python
print("🎉 PYTHON MONGODB INTEGRATION SUMMARY")
print("=" * 50)

print("\n✅ What You've Accomplished:")
print("   • Built insurance management system in Jupyter")
print("   • Integrated PyMongo with modern Python patterns")
print("   • Created interactive data models and services")
print("   • Implemented CRUD operations with validation")
print("   • Performed advanced queries and aggregation")
print("   • Created data visualizations")
print("   • Applied professional error handling")

print("\n📚 Key Concepts Covered:")
print("   • PyMongo driver and connection management")
print("   • Python dataclasses for MongoDB documents")
print("   • Service layer patterns for business logic")
print("   • Interactive data analysis with pandas")
print("   • Data visualization with matplotlib")
print("   • MongoDB aggregation pipelines")

print("\n🔧 Technologies Used:")
print("   • Python 3.8+ with type hints")
print("   • PyMongo for MongoDB integration")
print("   • Jupyter Notebook for interactive development")
print("   • pandas for data analysis")
print("   • matplotlib for visualization")
print("   • dataclasses for modern Python modeling")

print("\n🚀 Next Steps:")
print("   • Add Flask/FastAPI for web APIs")
print("   • Implement async operations with motor")
print("   • Add comprehensive testing with pytest")
print("   • Deploy with Docker containers")
print("   • Add machine learning for risk analysis")

print("\n🎯 Congratulations!")
print("You've successfully integrated MongoDB with Python")
print("using Jupyter Notebook for insurance management!")

# Final connection cleanup
db_connection.client.close()
print("\n🔌 Database connection closed")
```

---

## Additional Jupyter Features

### Optional Extensions:
1. **Rich Output**: Add HTML/CSS styling to output cells
2. **Interactive Widgets**: Use ipywidgets for dynamic forms
3. **Export Options**: Save as PDF, HTML, or Python script
4. **Sharing**: Upload to GitHub or nbviewer for sharing

### Jupyter Tips:
- **Shift+Enter**: Run cell and move to next
- **Ctrl+Enter**: Run cell and stay
- **Alt+Enter**: Run cell and insert new cell below
- **Tab**: Auto-complete code
- **Shift+Tab**: Show function documentation

**🎉 Congratulations!** You've successfully built a complete insurance management system using Python, PyMongo, and Jupyter Notebook with interactive data analysis and visualization capabilities.