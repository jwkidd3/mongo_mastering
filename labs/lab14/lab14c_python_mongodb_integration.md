# Lab 14C: Python MongoDB Integration for Insurance Management
**Duration:** 45 minutes
**Objective:** Integrate MongoDB with Python using Jupyter Notebook for insurance management system

## Overview
This lab demonstrates how to build a complete insurance management application using Python and PyMongo in Jupyter Notebook. You'll create an interactive insurance system that handles policies, customers, and claims using modern Python patterns with live code execution and data visualization.

## Prerequisites: MongoDB Environment Setup

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./scripts/setup.sh
```

**Windows PowerShell:**
```powershell
.\scripts\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

## Prerequisites: Load Course Data

Before starting this lab, ensure the MongoDB environment is running and course data is loaded:

> **New to MongoDB tooling?** See [Lab 1 — Choose Your Tool](../lab01_mongodb_shell_mastery.md#choose-your-tool-mongodb-compass-or-mongosh-cli) for the Compass UI alternative (no shell-redirection issues, works the same on every OS).

```bash
# From the project root
mongosh "mongodb://localhost:27017/?directConnection=true" < data/comprehensive_data_loader.js
```

> **Windows (PowerShell):** PowerShell does not forward `<` into `mongosh` — the command will error. Use `--file` instead:
> ```powershell
> mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
> ```

Verify the data loaded successfully:

```bash
mongosh "mongodb://localhost:27017/insurance_company?directConnection=true" --eval "db.policies.countDocuments()"
```

## Part A: Get the Starter Code (3 minutes)

### Step 1: Get the Starter Code

The starter code is in `labs/lab14/lab14c-python-starter/`. Copy it to your working directory and install dependencies:

```bash
cp -r labs/lab14/lab14c-python-starter ~/lab14c-mywork
cd ~/lab14c-mywork
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

`python main.py` should print "Connected to MongoDB" and exit cleanly. The starter already has:

- `requirements.txt` with `pymongo`, `python-dotenv`, `pandas`, `matplotlib`
- `.env.example` with `MONGODB_URI` defaulting to the local connection string
- `config/database.py` — `DatabaseConnection` wrapping `MongoClient` (don't modify)
- `main.py` — entry point with connect/cleanup wired up; `TODO`s mark where you'll add CRUD calls
- Skeleton `models/policy.py`, `models/customer.py`, and `services/policy_service.py` files with `TODO` comments where you fill in fields and method bodies

### Step 2: Open in Jupyter (optional)

This lab is presented in cells. You can either:

- **Run as a script:** edit `main.py` and re-run `python main.py` after each change.
- **Use Jupyter:** launch `jupyter notebook` in `~/lab14c-mywork` and create a new notebook. Paste the code blocks below into cells. The starter modules are already importable from the notebook directory.

```python
# Cell 1 - import everything you need (no install required, deps already in venv)
import pymongo
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from bson import ObjectId
import pandas as pd

print("All libraries imported successfully")
print(f"PyMongo version: {pymongo.version}")
```

## Part B: Database Connection (already provided)

`config/database.py` is already in the starter. For reference, here's what it contains — you don't need to recreate it:
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
    valid_types = ['Auto', 'Property', 'Life', 'Commercial', 'Cyber', 'Health']
    return policy_type in valid_types

print("✅ Validation utilities created")
```

**Cell 5 - Policy Model:** (replace the skeleton in `models/policy.py`)
```python
@dataclass
class Policy:
    """Insurance Policy model for Jupyter analysis"""
    policy_number: str
    customer_id: str
    policy_type: str  # Auto, Property, Life, Commercial, Cyber, Health
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
        """Convert to dictionary for MongoDB (camelCase field names)"""
        return {
            '_id': self._id,
            'policyNumber': self.policy_number,
            'customerId': self.customer_id,
            'policyType': self.policy_type,
            'region': self.region,
            'state': self.state,
            'coverageLimit': self.coverage_limit,
            'annualPremium': self.annual_premium,
            'deductible': self.deductible,
            'isActive': self.is_active,
            'effectiveDate': self.effective_date,
            'expirationDate': self.expiration_date,
            'createdAt': self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Policy':
        """Create Policy from MongoDB document (reads camelCase fields)"""
        return cls(
            _id=data.get('_id', ObjectId()),
            policy_number=data.get('policyNumber', ''),
            customer_id=data.get('customerId', ''),
            policy_type=data.get('policyType', ''),
            region=data.get('region', ''),
            state=data.get('state', ''),
            coverage_limit=data.get('coverageLimit', 0),
            annual_premium=data.get('annualPremium', 0),
            deductible=data.get('deductible', 0),
            is_active=data.get('isActive', True),
            effective_date=data.get('effectiveDate', datetime.now()),
            expiration_date=data.get('expirationDate'),
            created_at=data.get('createdAt', datetime.now())
        )

print("✅ Policy model created successfully")
```

**Cell 6 - Customer Model:** (replace the skeleton in `models/customer.py`)
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
        """Convert to dictionary for MongoDB (camelCase field names)"""
        return {
            '_id': self._id,
            'customerId': self.customer_id,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'address': {'state': self.state},
            'customerType': self.customer_type,
            'riskScore': self.risk_score,
            'isActive': self.is_active,
            'registrationDate': self.registration_date
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Customer':
        """Create Customer from MongoDB document (reads camelCase fields)"""
        # Handle address.state - existing data stores state inside address subdocument
        state = ''
        if 'address' in data and isinstance(data['address'], dict):
            state = data['address'].get('state', '')
        elif 'state' in data:
            state = data['state']

        return cls(
            _id=data.get('_id', ObjectId()),
            customer_id=data.get('customerId', ''),
            first_name=data.get('firstName', ''),
            last_name=data.get('lastName', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            state=state,
            customer_type=data.get('customerType', 'individual'),
            risk_score=data.get('riskScore', 0),
            is_active=data.get('isActive', True),
            registration_date=data.get('registrationDate', datetime.now())
        )

print("✅ Customer model created successfully")
```

## Part D: Insurance Management Service (15 minutes)

**Cell 7 - Policy Service:** (replace the stub bodies in `services/policy_service.py`)
```python
class PolicyService:
    """Insurance policy management service"""

    def __init__(self, database):
        self.db = database
        self.collection = database.policies
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create necessary indexes (camelCase field names match MongoDB schema)"""
        try:
            self.collection.create_index("policyNumber", unique=True)
            self.collection.create_index([("customerId", 1), ("isActive", 1)])
            self.collection.create_index([("policyType", 1), ("state", 1)])
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
        doc = self.collection.find_one({'policyNumber': policy_number})
        if not doc:
            raise ValueError(f"Policy {policy_number} not found")
        return Policy.from_dict(doc)

    def update_premium(self, policy_number: str, new_premium: float) -> bool:
        """Update policy premium"""
        if new_premium <= 0:
            raise ValueError("Premium must be positive")

        result = self.collection.update_one(
            {'policyNumber': policy_number},
            {'$set': {'annualPremium': new_premium}}
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
            query['policyType'] = filters['policy_type']
        if 'state' in filters:
            query['state'] = filters['state']
        if 'active_only' in filters and filters['active_only']:
            query['isActive'] = True
        if 'customer_id' in filters:
            query['customerId'] = filters['customer_id']

        cursor = self.collection.find(query)

        if 'limit' in filters:
            cursor = cursor.limit(filters['limit'])

        return [Policy.from_dict(doc) for doc in cursor]

    def get_statistics(self) -> List[Dict[str, Any]]:
        """Get policy statistics by type"""
        pipeline = [
            {
                '$group': {
                    '_id': '$policyType',
                    'count': {'$sum': 1},
                    'total_premium': {'$sum': '$annualPremium'},
                    'average_premium': {'$avg': '$annualPremium'},
                    'average_coverage': {'$avg': '$coverageLimit'}
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

> ✅ **Checkpoint — basic Lab 14C complete.** You have a working Python insurance app with Policy + Customer CRUD plus visualization. If class is short on time you can stop here. Parts G-H add the Claim domain, transactions, and change streams.

## Part G: Claims Domain — Model, Service, and Transactions (20 minutes)

The starter ships `services/claim_service.py` and `models/claim.py` as skeletons. This part walks through the Claim domain in the same depth Part C/D used for Policy.

### Step 1: Fill in the Claim dataclass

Open `models/claim.py` and complete the dataclass fields and helpers. Mirror `models/policy.py`.

```python
# models/claim.py
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from bson import ObjectId


@dataclass
class Claim:
    claim_number:      str               = ""
    customer_id:       str               = ""
    policy_number:     str               = ""
    claim_type:        str               = ""               # Auto, Property, Life, Health
    claim_amount:      Decimal           = Decimal("0")
    status:            str               = "submitted"      # submitted/under_review/approved/denied/settled
    incident_date:     Optional[datetime] = None
    filed_date:        datetime          = field(default_factory=datetime.utcnow)
    description:       str               = ""
    settlement_amount: Optional[Decimal] = None
    approved_by:       Optional[str]     = None
    approval_date:     Optional[datetime] = None
    denial_reason:     Optional[str]     = None
    adjuster_id:       Optional[str]     = None
    created_at:        datetime          = field(default_factory=datetime.utcnow)
    updated_at:        datetime          = field(default_factory=datetime.utcnow)
    _id:               ObjectId          = field(default_factory=ObjectId)

    VALID_STATUSES = {"submitted", "under_review", "investigating", "approved", "denied", "settled"}

    def validate(self) -> None:
        """Raise ValueError if the claim is not valid."""
        errors = []
        if not self.claim_number:                          errors.append("claim_number is required")
        if not self.customer_id:                           errors.append("customer_id is required")
        if not self.policy_number:                         errors.append("policy_number is required")
        if Decimal(self.claim_amount) <= 0:                errors.append("claim_amount must be > 0")
        if self.status not in self.VALID_STATUSES:
            errors.append(f"status must be one of {sorted(self.VALID_STATUSES)}")
        if errors:
            raise ValueError("; ".join(errors))

    def days_open(self) -> int:
        return max(0, (datetime.utcnow() - self.filed_date).days)

    def get_summary(self) -> dict[str, Any]:
        return {
            "claim_number": self.claim_number,
            "status":       self.status,
            "amount":       str(self.claim_amount),
            "days_open":    self.days_open(),
        }

    def to_dict(self) -> dict[str, Any]:
        """Convert to camelCase dict for MongoDB."""
        return {
            "_id":              self._id,
            "claimNumber":      self.claim_number,
            "customerId":       self.customer_id,
            "policyNumber":     self.policy_number,
            "claimType":        self.claim_type,
            "claimAmount":      str(self.claim_amount),       # store as string to preserve precision
            "status":           self.status,
            "incidentDate":     self.incident_date,
            "filedDate":        self.filed_date,
            "description":      self.description,
            "settlementAmount": str(self.settlement_amount) if self.settlement_amount is not None else None,
            "approvedBy":       self.approved_by,
            "approvalDate":     self.approval_date,
            "denialReason":     self.denial_reason,
            "adjusterId":       self.adjuster_id,
            "createdAt":        self.created_at,
            "updatedAt":        self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Claim":
        """Build a Claim from a Mongo document (camelCase fields)."""
        return cls(
            _id              = data.get("_id", ObjectId()),
            claim_number     = data.get("claimNumber", ""),
            customer_id      = data.get("customerId", ""),
            policy_number    = data.get("policyNumber", ""),
            claim_type       = data.get("claimType", ""),
            claim_amount     = Decimal(str(data.get("claimAmount", "0"))),
            status           = data.get("status", "submitted"),
            incident_date    = data.get("incidentDate"),
            filed_date       = data.get("filedDate", datetime.utcnow()),
            description      = data.get("description", ""),
            settlement_amount= Decimal(str(data["settlementAmount"])) if data.get("settlementAmount") is not None else None,
            approved_by      = data.get("approvedBy"),
            approval_date    = data.get("approvalDate"),
            denial_reason    = data.get("denialReason"),
            adjuster_id      = data.get("adjusterId"),
            created_at       = data.get("createdAt", datetime.utcnow()),
            updated_at       = data.get("updatedAt", datetime.utcnow()),
        )
```

### Step 2: Implement claim CRUD in `ClaimService`

Open `services/claim_service.py` and complete the methods. Mirror the structure of `policy_service.py`.

```python
# services/claim_service.py
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Any

from models.claim import Claim


class ClaimService:
    def __init__(self, database, client):
        self.db         = database
        self.client     = client                         # for sessions / transactions
        self.collection = database.claims
        self._ensure_indexes()

    def _ensure_indexes(self):
        try:
            self.collection.create_index("claimNumber", unique=True)
            self.collection.create_index([("customerId", 1), ("status", 1)])
            self.collection.create_index([("policyNumber", 1)])
        except Exception as exc:                          # noqa: BLE001
            print(f"Index warning: {exc}")

    # ------------- Create -------------
    def create_claim(self, claim_data: dict[str, Any]) -> str:
        """Build, validate, dedupe, insert. claim_data is snake_case kwargs."""
        claim = Claim(**claim_data)
        claim.validate()
        existing = self.collection.find_one({"claimNumber": claim.claim_number})
        if existing:
            raise ValueError(f"Claim {claim.claim_number} already exists")
        result = self.collection.insert_one(claim.to_dict())
        return str(result.inserted_id)

    # ------------- Read -------------
    def get_claim_by_number(self, claim_number: str) -> Claim | None:
        doc = self.collection.find_one({"claimNumber": claim_number})
        return Claim.from_dict(doc) if doc else None

    def get_claims_by_customer(self, customer_id: str) -> list[Claim]:
        return [Claim.from_dict(d) for d in self.collection.find({"customerId": customer_id})]

    def get_claims_by_policy(self, policy_number: str) -> list[Claim]:
        return [Claim.from_dict(d) for d in self.collection.find({"policyNumber": policy_number})]

    def get_claims_by_status(self, status: str) -> list[Claim]:
        return [Claim.from_dict(d) for d in self.collection.find({"status": status})]

    def get_open_claims(self) -> list[Claim]:
        cursor = self.collection.find({
            "status": {"$in": ["submitted", "under_review", "investigating"]}
        })
        return [Claim.from_dict(d) for d in cursor]

    # ------------- Update -------------
    def update_claim_status(self, claim_number: str, new_status: str) -> int:
        result = self.collection.update_one(
            {"claimNumber": claim_number},
            {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}},
        )
        return result.modified_count

    def approve_claim(self, claim_number: str, settlement_amount: Decimal, approved_by: str) -> int:
        result = self.collection.update_one(
            {"claimNumber": claim_number},
            {"$set": {
                "status":           "approved",
                "settlementAmount": str(settlement_amount),
                "approvedBy":       approved_by,
                "approvalDate":     datetime.utcnow(),
                "updatedAt":        datetime.utcnow(),
            }},
        )
        return result.modified_count

    def deny_claim(self, claim_number: str, denial_reason: str) -> int:
        result = self.collection.update_one(
            {"claimNumber": claim_number},
            {"$set": {"status": "denied", "denialReason": denial_reason, "updatedAt": datetime.utcnow()}},
        )
        return result.modified_count

    def assign_adjuster(self, claim_number: str, adjuster_id: str) -> int:
        result = self.collection.update_one(
            {"claimNumber": claim_number},
            {"$set": {"adjusterId": adjuster_id, "status": "under_review", "updatedAt": datetime.utcnow()}},
        )
        return result.modified_count

    # ------------- Delete -------------
    def delete_claim(self, claim_number: str) -> int:
        return self.collection.delete_one({"claimNumber": claim_number}).deleted_count

    # ------------- Aggregation -------------
    def get_claim_stats_by_status(self) -> list[dict]:
        pipeline = [
            {"$group": {
                "_id":         "$status",
                "count":       {"$sum": 1},
                "totalAmount": {"$sum": {"$toDecimal": "$claimAmount"}},
                "avgAmount":   {"$avg": {"$toDecimal": "$claimAmount"}},
            }},
            {"$sort": {"count": -1}},
        ]
        return list(self.collection.aggregate(pipeline))

    def get_claim_stats_by_type(self) -> list[dict]:
        pipeline = [
            {"$group": {
                "_id":       "$claimType",
                "count":     {"$sum": 1},
                "avgAmount": {"$avg": {"$toDecimal": "$claimAmount"}},
            }},
            {"$sort": {"count": -1}},
        ]
        return list(self.collection.aggregate(pipeline))

    # file_claim_atomically and watch_claims are added in the next two steps.
```

### Step 3: Drive claim CRUD from `main.py`

```python
from decimal import Decimal
from services.claim_service import ClaimService

claim_service = ClaimService(db, client)

# Create
claim_service.create_claim({
    "claim_number":  "CLM-PY-001",
    "customer_id":   "CUST000001",
    "policy_number": "POL-AUTO-001",
    "claim_type":    "Auto Accident",
    "claim_amount":  Decimal("4250"),
    "description":   "Rear-end collision at Main and 5th",
})

# Approve
claim_service.approve_claim("CLM-PY-001", Decimal("4100"), "adjuster_005")

# Read back
claim = claim_service.get_claim_by_number("CLM-PY-001")
print("Summary:", claim.get_summary())

# Stats
print("Status stats:", claim_service.get_claim_stats_by_status())
```

### Step 4: Add `file_claim_atomically` — multi-collection transaction

A claim filing should atomically (a) insert the claim, (b) increment the policy's `claimsCount` + `lastClaimDate`, and (c) write an `audit_log` row. PyMongo gives you `client.start_session()` and `session.with_transaction()` to batch them. `with_transaction()` automatically retries the whole callback on `TransientTransactionError`.

```python
# services/claim_service.py
from datetime import datetime
from pymongo.read_concern import ReadConcern
from pymongo.write_concern import WriteConcern

def file_claim_atomically(self, claim_data: dict) -> dict:
    claim = Claim.from_dict({**claim_data, "claimNumber": claim_data["claim_number"]})
    try:
        claim.validate()
    except ValueError as exc:
        return {"success": False, "errors": [str(exc)]}

    def _txn(session):
        # 1. Insert claim
        self.collection.insert_one(claim.to_dict(), session=session)

        # 2. Increment the policy's claimsCount + lastClaimDate
        self.db.policies.update_one(
            {"policyNumber": claim_data["policy_number"]},
            {
                "$inc": {"claimsCount": 1},
                "$set": {"lastClaimDate": datetime.utcnow(), "updatedAt": datetime.utcnow()},
            },
            session=session,
        )

        # 3. Audit log
        self.db.audit_log.insert_one(
            {
                "operation": "claim_filed",
                "claimNumber": claim_data["claim_number"],
                "timestamp": datetime.utcnow(),
            },
            session=session,
        )
        return {"success": True, "claim_number": claim_data["claim_number"]}

    with self.client.start_session() as session:
        return session.with_transaction(
            _txn,
            read_concern=ReadConcern("majority"),
            write_concern=WriteConcern(w="majority"),
        )
```

> `session.with_transaction()` does the retry-on-`TransientTransactionError` for you — raise inside the callback to abort.

### Step 5: Drive `file_claim_atomically` from `main.py`

```python
result = claim_service.file_claim_atomically({
    "claim_number":  "CLM-PY-DEMO",
    "customer_id":   "CUST000001",
    "policy_number": "POL-AUTO-001",
    "claim_type":    "Auto Accident",
    "claim_amount":  Decimal("12500"),
    "description":   "Driver-side transaction demo",
})
print("Atomic file:", result)
```

Expected: `{'success': True, 'claim_number': 'CLM-PY-DEMO'}`. Check `audit_log` and the policy's `claimsCount` in Compass.

> ✅ **Checkpoint — Lab 14C + Claim CRUD + transactions complete.** You can stop here. Part H adds change-stream listeners.

## Part H: Watching Changes (10 minutes)

The same change-stream concept lab 13 demonstrated in mongosh is available from PyMongo via `collection.watch()`. The driver returns a `ChangeStream` you iterate as a normal Python iterable.

### Step 1: Add `watch_claims` to `ClaimService`

```python
# services/claim_service.py
import threading
from pymongo.errors import PyMongoError

def watch_claims(self, handler, pipeline=None, stop_event=None):
    """Open a change stream and call handler(event) for each event."""
    if pipeline is None:
        pipeline = [{
            "$match": {
                "operationType": "insert",
                "fullDocument.claimAmount": {"$gte": 50000}
            }
        }]

    try:
        with self.collection.watch(pipeline, full_document="updateLookup") as cursor:
            for event in cursor:
                if stop_event is not None and stop_event.is_set():
                    return
                try:
                    handler(event)
                except Exception as exc:                  # noqa: BLE001
                    print(f"[watcher] handler error: {exc}")
    except PyMongoError as exc:
        if stop_event is None or not stop_event.is_set():
            raise
```

### Step 2: Drive it from `main.py`

```python
import threading

stop = threading.Event()

def on_event(evt):
    c = evt["fullDocument"]
    print(f"[watcher] {evt['operationType']} {c['claimNumber']} amount={c['claimAmount']}")

watcher = threading.Thread(
    target=claim_service.watch_claims,
    kwargs={"handler": on_event, "stop_event": stop},
    daemon=True,
)
watcher.start()

# Give the cursor time to attach, then trigger an event
import time
time.sleep(0.5)
claim_service.file_claim_atomically({
    "claim_number":  "CLM-PY-WATCH-DEMO",
    "customer_id":   "CUST000001",
    "policy_number": "POL-AUTO-001",
    "claim_type":    "Auto Accident",
    "claim_amount":  Decimal("75000"),                # above the 50000 filter
    "description":   "change-stream demo",
})
time.sleep(1.5)
stop.set()
watcher.join(timeout=2)
```

Expected stdout: one line `[watcher] insert CLM-PY-WATCH-DEMO amount=75000`.

> Production listeners run as long-lived workers. After processing each event, persist `event["_id"]` (the resume token) so a restart can pick up where the previous run left off (`{"resumeAfter": token}`).

## Part I: Error Handling and Best Practices (5 minutes)

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
print("   • Created interactive data models and services for Policy, Customer, AND Claim")
print("   • Implemented CRUD operations with validation")
print("   • Performed advanced queries and aggregation")
print("   • Created data visualizations")
print("   • Multi-document transactions via session.with_transaction()")
print("   • Change streams via collection.watch() with server-side $match filtering")
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

## Lab 14C Deliverables
✅ **Environment Setup**: Configured Jupyter Notebook with PyMongo
✅ **Connection Management**: Implemented MongoDB connection with error handling
✅ **Data Models**: Created Python dataclass models for insurance documents
✅ **CRUD Operations**: Built complete insurance data management workflows
✅ **Aggregation Pipelines**: Implemented analytics with pandas integration
✅ **Data Visualization**: Created matplotlib charts for insurance metrics