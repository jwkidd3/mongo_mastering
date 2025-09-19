# Lab 1: MongoDB Transactions
**Duration:** 45 minutes
**Objective:** Master ACID transactions in MongoDB

## Part A: Replica Set Setup (10 minutes)

### Step 1: Start MongoDB Containers
```bash
# Create network for MongoDB containers
docker network create mongodb-net

# Start three MongoDB nodes for replica set
docker run -d --name mongo1 --network mongodb-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo2 --network mongodb-net -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo3 --network mongodb-net -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Verify containers are running
docker ps
```

### Step 2: Initialize Replica Set
```bash
# Wait for containers to fully start
sleep 20

# Initialize replica set
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017' },
    { _id: 1, host: 'mongo2:27017' },
    { _id: 2, host: 'mongo3:27017' }
  ]
})
"

# Verify replica set status
docker exec -it mongo1 mongosh --eval "rs.status()"
```

### Step 3: Connect with MongoDB Compass
1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
3. Click **"Connect"**
4. Verify you see the replica set topology

## Part B: Transaction Setup and Testing (25 minutes)

### Step 4: Create Sample Data
**In MongoDB Compass:**
1. Navigate to **Databases** → **Create Database**
2. Database Name: `ecommerce`
3. Collection Name: `products`

**Using Compass MongoSH tab:**
```javascript
// Switch to ecommerce database
use ecommerce

// Create products with initial stock
db.products.insertMany([
  {
    _id: "prod1",
    name: "Laptop",
    price: 999.99,
    stock: 10,
    category: "Electronics"
  },
  {
    _id: "prod2",
    name: "Mouse",
    price: 29.99,
    stock: 50,
    category: "Electronics"
  },
  {
    _id: "prod3",
    name: "Keyboard",
    price: 79.99,
    stock: 25,
    category: "Electronics"
  },
  {
    _id: "prod4",
    name: "Monitor",
    price: 299.99,
    stock: 15,
    category: "Electronics"
  }
])

// Create customers with account balances
db.customers.insertMany([
  {
    _id: "cust1",
    name: "John Doe",
    email: "john@example.com",
    balance: 1200.00
  },
  {
    _id: "cust2",
    name: "Jane Smith",
    email: "jane@example.com",
    balance: 800.00
  },
  {
    _id: "cust3",
    name: "Bob Johnson",
    email: "bob@example.com",
    balance: 1500.00
  }
])

// Create orders collection with index
db.orders.createIndex({ customerId: 1, orderDate: 1 })
```

### Step 5: Implement Order Processing Transaction

```javascript
// Complete order processing transaction
function processOrder(customerId, items) {
  const session = db.getMongo().startSession();

  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });

    const orderId = new ObjectId();
    let totalAmount = 0;

    // Use session database reference
    const sessionDb = session.getDatabase("ecommerce");

    // Validate customer exists and has sufficient balance
    const customer = sessionDb.customers.findOne({ _id: customerId });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Process each item
    for (let item of items) {
      // Check product availability
      const product = sessionDb.products.findOne({
        _id: item.productId,
        stock: { $gte: item.quantity }
      });

      if (!product) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      totalAmount += product.price * item.quantity;

      // Update product stock
      sessionDb.products.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }

    // Check customer balance
    if (customer.balance < totalAmount) {
      throw new Error("Insufficient customer balance");
    }

    // Update customer balance
    sessionDb.customers.updateOne(
      { _id: customerId },
      { $inc: { balance: -totalAmount } }
    );

    // Create order
    sessionDb.orders.insertOne({
      _id: orderId,
      customerId: customerId,
      items: items,
      totalAmount: totalAmount,
      status: "completed",
      orderDate: new Date()
    });

    // Commit transaction
    session.commitTransaction();

    print("Order processed successfully");
    print("Order ID: " + orderId);
    print("Total Amount: $" + totalAmount.toFixed(2));

    return { success: true, orderId: orderId, totalAmount: totalAmount };

  } catch (error) {
    print("Transaction failed: " + error.message);
    session.abortTransaction();
    return { success: false, error: error.message };

  } finally {
    session.endSession();
  }
}
```

### Step 6: Test Transactions

**Test Successful Transaction:**
```javascript
// Test successful order
var result1 = processOrder("cust1", [
  { productId: "prod1", quantity: 1 },
  { productId: "prod2", quantity: 2 }
]);
```

**Monitor in Compass:**
1. Keep `products`, `customers`, and `orders` collections open in separate tabs
2. Execute the transaction
3. Refresh collections to see changes:
   - Product stock decreased
   - Customer balance decreased
   - New order created

**Test Failed Transaction:**
```javascript
// Test order with insufficient stock
var result2 = processOrder("cust2", [
  { productId: "prod1", quantity: 15 }  // More than available
]);

// Test order with insufficient balance
var result3 = processOrder("cust2", [
  { productId: "prod4", quantity: 10 }  // Costs $2999.90 but customer has $800
]);
```

**Verify Rollback:**
- Check that no data changed when transactions failed
- This demonstrates ACID atomicity

## Part C: Money Transfer System (10 minutes)

### Step 7: Implement Money Transfer

```javascript
// Money Transfer System
function transferMoney(fromAccount, toAccount, amount) {
  // Create fresh session
  const session = db.getMongo().startSession();

  try {
    // Start transaction
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });

    // Use session database
    const sessionDb = session.getDatabase("ecommerce");

    // Debit from source account
    const debitResult = sessionDb.customers.updateOne(
      {
        _id: fromAccount,
        balance: { $gte: amount }
      },
      { $inc: { balance: -amount } }
    );

    if (debitResult.matchedCount === 0) {
      throw new Error("Insufficient funds or account not found");
    }

    // Credit to destination account
    const creditResult = sessionDb.customers.updateOne(
      { _id: toAccount },
      { $inc: { balance: amount } }
    );

    if (creditResult.matchedCount === 0) {
      throw new Error("Destination account not found");
    }

    // Log transaction
    sessionDb.transactions.insertOne({
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      timestamp: new Date(),
      type: "transfer"
    });

    session.commitTransaction();

    print(`Transfer completed: $${amount} from ${fromAccount} to ${toAccount}`);
    return { success: true };

  } catch (error) {
    print("Transfer failed: " + error.message);
    session.abortTransaction();
    return { success: false, error: error.message };

  } finally {
    session.endSession();
  }
}

// Create transactions collection
db.transactions.createIndex({ timestamp: -1 });

// Test transfer
transferMoney("cust2", "cust1", 100.00);

// Verify balances
db.customers.find({}, { name: 1, balance: 1 });

// Test transfers
transferMoney("cust3", "cust1", 100.00);
transferMoney("cust2", "cust1", 50.00);

// Test invalid transfer
transferMoney("cust2", "cust1", 1000.00);  // Should fail - insufficient funds
```

### Step 8: Verify Results in Compass
1. Check `customers` collection - verify balance changes
2. Check `transactions` collection - see transfer records
3. Observe how invalid transfers don't affect data

## Lab 1 Deliverables
✅ **Replica set** configured and verified
✅ **ACID transactions** implemented with error handling
✅ **Visual verification** using Compass real-time monitoring
✅ **Understanding** of transaction isolation and consistency