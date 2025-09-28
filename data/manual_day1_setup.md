# Manual Day 1 Data Setup

This guide provides step-by-step instructions for manually loading Day 1 data if the automated `day1_data_loader.js` script cannot be used.

## Prerequisites

- MongoDB replica set running (see `../scripts/setup.sh`)
- MongoDB Shell (mongosh) installed and accessible
- Connection to `insurance_company` database

## Manual Data Loading Steps

### 1. Connect to MongoDB

```bash
mongosh
```

### 2. Switch to Database

```javascript
use insurance_company
```

### 3. Create Branches Collection

```javascript
db.branches.insertMany([
  {
    _id: "branch_001",
    branchId: "BR-001",
    name: "Downtown Insurance Center",
    address: {
      street: "123 Main Street",
      city: "Dallas",
      state: "TX",
      zipCode: "75201"
    },
    phone: "(214) 555-0100",
    manager: "Sarah Johnson",
    established: new Date("2010-01-15"),
    active: true
  },
  {
    _id: "branch_002",
    branchId: "BR-002",
    name: "Suburban Family Insurance",
    address: {
      street: "456 Oak Avenue",
      city: "Plano",
      state: "TX",
      zipCode: "75023"
    },
    phone: "(972) 555-0200",
    manager: "Michael Chen",
    established: new Date("2015-03-22"),
    active: true
  },
  {
    _id: "branch_003",
    branchId: "BR-003",
    name: "Business District Insurance",
    address: {
      street: "789 Commerce St",
      city: "Fort Worth",
      state: "TX",
      zipCode: "76102"
    },
    phone: "(817) 555-0300",
    manager: "Lisa Rodriguez",
    established: new Date("2018-07-10"),
    active: true
  },
  {
    _id: "branch_004",
    branchId: "BR-004",
    name: "North Texas Insurance Hub",
    address: {
      street: "321 Industrial Blvd",
      city: "Irving",
      state: "TX",
      zipCode: "75061"
    },
    phone: "(214) 555-0400",
    manager: "David Kim",
    established: new Date("2020-01-05"),
    active: true
  },
  {
    _id: "branch_005",
    branchId: "BR-005",
    name: "East Dallas Insurance Center",
    address: {
      street: "654 Elm Street",
      city: "Mesquite",
      state: "TX",
      zipCode: "75149"
    },
    phone: "(214) 555-0500",
    manager: "Jennifer Wang",
    established: new Date("2019-11-18"),
    active: true
  }
])
```

### 4. Create Policies Collection

```javascript
db.policies.insertMany([
  {
    _id: "policy_001",
    policyNumber: "AUTO-2023-001",
    policyType: "Auto",
    customerId: "CUST-001",
    annualPremium: NumberDecimal("1299.99"),
    deductible: NumberInt(500),
    coverageLimit: 100000,
    isActive: true,
    effectiveDate: new Date("2023-01-15"),
    expirationDate: new Date("2024-01-15"),
    branchId: "BR-001"
  },
  {
    _id: "policy_002",
    policyNumber: "HOME-2023-001",
    policyType: "Home",
    customerId: "CUST-002",
    annualPremium: NumberDecimal("899.50"),
    deductible: NumberInt(1000),
    coverageLimit: 250000,
    isActive: true,
    effectiveDate: new Date("2023-02-01"),
    expirationDate: new Date("2024-02-01"),
    branchId: "BR-002"
  },
  {
    _id: "policy_003",
    policyNumber: "LIFE-2023-001",
    policyType: "Life",
    customerId: "CUST-003",
    annualPremium: NumberDecimal("2400.00"),
    deductible: NumberInt(0),
    coverageLimit: 500000,
    isActive: true,
    effectiveDate: new Date("2023-03-10"),
    expirationDate: new Date("2024-03-10"),
    branchId: "BR-001"
  },
  {
    _id: "policy_004",
    policyNumber: "AUTO-2023-002",
    policyType: "Auto",
    customerId: "CUST-001",
    annualPremium: NumberDecimal("1450.75"),
    deductible: NumberInt(250),
    coverageLimit: 150000,
    isActive: false,
    effectiveDate: new Date("2022-06-01"),
    expirationDate: new Date("2023-06-01"),
    branchId: "BR-003"
  }
])
```

### 5. Create Customers Collection

```javascript
db.customers.insertMany([
  {
    _id: "customer_001",
    customerId: "CUST-001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "(214) 555-1001",
    dateOfBirth: new Date("1985-07-15"),
    age: NumberInt(38),
    address: {
      street: "123 Elm Street",
      city: "Dallas",
      state: "TX",
      zipCode: "75202"
    },
    riskLevel: "Medium",
    joinDate: new Date("2022-01-15"),
    status: "Active"
  },
  {
    _id: "customer_002",
    customerId: "CUST-002",
    firstName: "Emily",
    lastName: "Johnson",
    email: "emily.johnson@email.com",
    phone: "(972) 555-1002",
    dateOfBirth: new Date("1990-03-22"),
    age: NumberInt(33),
    address: {
      street: "456 Pine Avenue",
      city: "Plano",
      state: "TX",
      zipCode: "75024"
    },
    riskLevel: "Low",
    joinDate: new Date("2022-02-01"),
    status: "Active"
  },
  {
    _id: "customer_003",
    customerId: "CUST-003",
    firstName: "Michael",
    lastName: "Davis",
    email: "michael.davis@email.com",
    phone: "(817) 555-1003",
    dateOfBirth: new Date("1978-11-08"),
    age: NumberInt(45),
    address: {
      street: "789 Oak Drive",
      city: "Fort Worth",
      state: "TX",
      zipCode: "76103"
    },
    riskLevel: "High",
    joinDate: new Date("2022-03-10"),
    status: "Active"
  },
  {
    _id: "customer_004",
    customerId: "CUST-004",
    firstName: "Sarah",
    lastName: "Wilson",
    email: "sarah.wilson@email.com",
    phone: "(214) 555-1004",
    dateOfBirth: new Date("1992-05-14"),
    age: NumberInt(31),
    address: {
      street: "321 Maple Lane",
      city: "Irving",
      state: "TX",
      zipCode: "75062"
    },
    riskLevel: "Low",
    joinDate: new Date("2022-04-05"),
    status: "Active"
  },
  {
    _id: "customer_005",
    customerId: "CUST-005",
    firstName: "Robert",
    lastName: "Brown",
    email: "robert.brown@email.com",
    phone: "(214) 555-1005",
    dateOfBirth: new Date("1980-09-30"),
    age: NumberInt(43),
    address: {
      street: "654 Cedar Street",
      city: "Mesquite",
      state: "TX",
      zipCode: "75150"
    },
    riskLevel: "Medium",
    joinDate: new Date("2022-05-20"),
    status: "Active"
  },
  {
    _id: "customer_006",
    customerId: "CUST-006",
    firstName: "Jessica",
    lastName: "Garcia",
    email: "jessica.garcia@email.com",
    phone: "(972) 555-1006",
    dateOfBirth: new Date("1988-12-03"),
    age: NumberInt(35),
    address: {
      street: "987 Birch Road",
      city: "Richardson",
      state: "TX",
      zipCode: "75081"
    },
    riskLevel: "Medium",
    joinDate: new Date("2022-06-12"),
    status: "Active"
  }
])
```

### 6. Create Agents Collection

```javascript
db.agents.insertMany([
  {
    _id: "agent_001",
    agentId: "AGT-001",
    firstName: "Lisa",
    lastName: "Anderson",
    email: "lisa.anderson@insurance.com",
    phone: "(214) 555-2001",
    licenseNumber: "TX-INS-12345",
    hireDate: new Date("2020-01-15"),
    branchId: "BR-001",
    specialties: ["Auto", "Home"],
    commissionRate: NumberDecimal("0.05"),
    status: "Active"
  },
  {
    _id: "agent_002",
    agentId: "AGT-002",
    firstName: "David",
    lastName: "Martinez",
    email: "david.martinez@insurance.com",
    phone: "(972) 555-2002",
    licenseNumber: "TX-INS-67890",
    hireDate: new Date("2019-06-01"),
    branchId: "BR-002",
    specialties: ["Life", "Business"],
    commissionRate: NumberDecimal("0.06"),
    status: "Active"
  }
])
```

### 7. Create Claims Collection

```javascript
db.claims.insertMany([
  {
    _id: "claim_001",
    claimNumber: "CLM-2023-001",
    policyNumber: "AUTO-2023-001",
    customerId: "CUST-001",
    claimType: "Auto",
    incidentDate: new Date("2023-06-15"),
    reportedDate: new Date("2023-06-16"),
    claimAmount: NumberDecimal("3500.00"),
    status: "Approved",
    description: "Rear-end collision damage"
  },
  {
    _id: "claim_002",
    claimNumber: "CLM-2023-002",
    policyNumber: "HOME-2023-001",
    customerId: "CUST-002",
    claimType: "Home",
    incidentDate: new Date("2023-07-20"),
    reportedDate: new Date("2023-07-21"),
    claimAmount: NumberDecimal("8500.00"),
    status: "Under Review",
    description: "Storm damage to roof"
  },
  {
    _id: "claim_003",
    claimNumber: "CLM-2023-003",
    policyNumber: "AUTO-2023-002",
    customerId: "CUST-001",
    claimType: "Auto",
    incidentDate: new Date("2023-08-10"),
    reportedDate: new Date("2023-08-11"),
    claimAmount: NumberDecimal("1200.00"),
    status: "Denied",
    description: "Parking lot minor damage"
  }
])
```

### 8. Create Payments Collection

```javascript
db.payments.insertMany([
  {
    _id: "payment_001",
    paymentId: "PAY-2023-001",
    policyNumber: "AUTO-2023-001",
    customerId: "CUST-001",
    amount: NumberDecimal("1299.99"),
    paymentDate: new Date("2023-01-15"),
    paymentMethod: "Credit Card",
    status: "Completed"
  },
  {
    _id: "payment_002",
    paymentId: "PAY-2023-002",
    policyNumber: "HOME-2023-001",
    customerId: "CUST-002",
    amount: NumberDecimal("899.50"),
    paymentDate: new Date("2023-02-01"),
    paymentMethod: "Bank Transfer",
    status: "Completed"
  },
  {
    _id: "payment_003",
    paymentId: "PAY-2023-003",
    policyNumber: "LIFE-2023-001",
    customerId: "CUST-003",
    amount: NumberDecimal("2400.00"),
    paymentDate: new Date("2023-03-10"),
    paymentMethod: "Check",
    status: "Completed"
  }
])
```

### 9. Verify Data Loading

```javascript
// Check document counts
print("Branches: " + db.branches.countDocuments())
print("Policies: " + db.policies.countDocuments())
print("Customers: " + db.customers.countDocuments())
print("Agents: " + db.agents.countDocuments())
print("Claims: " + db.claims.countDocuments())
print("Payments: " + db.payments.countDocuments())

// Sample queries to verify relationships
print("\nSample Policy:")
printjson(db.policies.findOne())

print("\nActive Customers:")
print(db.customers.find({status: "Active"}).count())
```

## Expected Results

After manual loading, you should have:
- **5 branches** in Dallas/Fort Worth area
- **4 policies** (Auto, Home, Life types)
- **6 customers** with varied risk levels
- **2 agents** with different specialties
- **3 claims** in various statuses
- **3 payments** with different methods

## Troubleshooting

### Common Issues

1. **Duplicate Key Errors**: If you run this script multiple times, clear collections first:
   ```javascript
   db.branches.drop()
   db.policies.drop()
   db.customers.drop()
   db.agents.drop()
   db.claims.drop()
   db.payments.drop()
   ```

2. **Connection Issues**: Ensure MongoDB replica set is running:
   ```bash
   cd ../scripts && ./setup.sh
   ```

3. **Write Concern Timeouts**: The replica set must be properly configured with write concerns.

## Next Steps

After loading Day 1 data:
1. Complete Day 1 labs (Labs 1-5)
2. For Day 2, use `manual_day2_setup.md`
3. For Day 3, use `manual_day3_setup.md`

---

*Manual setup for MongoDB Mastering Course - Day 1 Fundamentals*