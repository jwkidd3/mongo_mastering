# MongoDB Transactions - Reveal.js Presentation
## Markdown Format for Easy Editing

---

## Slide 1: Title Slide

```markdown
# MongoDB Transactions
## ACID Compliance in Document Databases

**MongoDB Mastering Course**  
Building Reliable, Consistent Applications
```

---

## Slide 2: Table of Contents

```markdown
# What We'll Cover

1. Introduction to MongoDB Transactions
2. ACID Properties in MongoDB
3. Transaction Fundamentals
4. Single vs Multi-Document Transactions
5. Working with Sessions
6. Read and Write Concerns
7. Performance and Best Practices
8. Real-World Use Cases
9. Error Handling
10. Hands-On Exercises
```

---

## Slide 3: Introduction

### Slide 3.1: What are Database Transactions?

```markdown
# What are Database Transactions?

> A **transaction** is a sequence of database operations that are treated as a single logical unit of work.

**Key Principle:** All operations must either succeed together (commit) or fail together (rollback).
```

### Slide 3.2: The Classic Example

```markdown
# The Classic Example: Bank Transfer

```javascript
// ❌ WITHOUT transactions - DANGEROUS!
db.accounts.updateOne({_id: "accountA"}, {$inc: {balance: -100}});
// ⚠️ What if system crashes here?
db.accounts.updateOne({_id: "accountB"}, {$inc: {balance: 100}});

// ✅ WITH transactions - SAFE!
const session = db.getMongo().startSession();
session.startTransaction();
try {
    db.accounts.updateOne({_id: "accountA"}, 
        {$inc: {balance: -100}}, {session});
    db.accounts.updateOne({_id: "accountB"}, 
        {$inc: {balance: 100}}, {session});
    session.commitTransaction();
} catch (error) {
    session.abortTransaction();
} finally {
    session.endSession();
}
```
```

### Slide 3.3: Transaction Evolution

```markdown
# Transaction Evolution in MongoDB

| Version | Transaction Support | Environment |
|---------|-------------------|-------------|
| MongoDB 4.0 | ✅ Multi-document transactions | Replica sets only |
| MongoDB 4.2 | ✅ Multi-document transactions | Sharded clusters |
| MongoDB 5.0+ | ✅ Enhanced performance | All deployments |
```

---

## Slide 4: ACID Properties

### Slide 4.1: ACID Overview

```markdown
# ACID Properties in MongoDB

**Atomicity** - All operations succeed or fail together  
**Consistency** - Database remains in valid state  
**Isolation** - Concurrent transactions don't interfere  
**Durability** - Committed changes persist
```

### Slide 4.2: Atomicity Example

```markdown
# Atomicity Example

```javascript
// E-commerce Order Processing
const session = db.getMongo().startSession();
session.startTransaction();

try {
    // ALL operations succeed or ALL fail
    db.orders.insertOne({
        _id: "order123",
        customerId: "customer456",
        items: [{productId: "prod789", quantity: 2}],
        total: 199.98,
        status: "pending"
    }, {session});
    
    db.inventory.updateOne(
        {productId: "prod789"},
        {$inc: {quantity: -2}},
        {session}
    );
    
    db.customers.updateOne(
        {_id: "customer456"},
        {$push: {orderHistory: "order123"}},
        {session}
    );
    
    session.commitTransaction();
    print("✅ Order processed successfully");
} catch (error) {
    session.abortTransaction();
    print("❌ Order failed - all changes rolled back");
}
```
```

### Slide 4.3: Consistency Example

```markdown
# Consistency Example

```javascript
// Ensuring business rules are maintained
session.startTransaction();

try {
    // Business rule: Account balance cannot go negative
    const account = db.accounts.findOne({_id: "acc123"}, {session});
    
    if (account.balance >= withdrawAmount) {
        db.accounts.updateOne(
            {_id: "acc123"},
            {$inc: {balance: -withdrawAmount}},
            {session}
        );
        
        db.transactions.insertOne({
            accountId: "acc123",
            type: "withdrawal",
            amount: withdrawAmount,
            timestamp: new Date()
        }, {session});
        
        session.commitTransaction();
    } else {
        throw new Error("Insufficient funds");
    }
} catch (error) {
    session.abortTransaction();
}
```
```

### Slide 4.4: Isolation & Durability

```markdown
# Isolation & Durability

```javascript
// Isolation: Snapshot reads ensure consistent view
db.accounts.find({_id: "acc123"})
    .readConcern("snapshot");

// Durability: Write concern ensures persistence
db.collection.insertOne(document, {
    writeConcern: {
        w: "majority",  // Write to majority of nodes
        j: true         // Journal acknowledgment
    }
});
```
```

---

## Slide 5: Transaction Fundamentals

### Slide 5.1: Transaction Lifecycle

```markdown
# Transaction Fundamentals

**Transaction Lifecycle:**
Session Created → Transaction Started → Operations Executed → Commit/Abort Completed
```

### Slide 5.2: Basic Structure

```markdown
# Basic Transaction Structure

```javascript
// Standard transaction pattern
const session = db.getMongo().startSession();

try {
    session.startTransaction({
        readConcern: {level: "snapshot"},
        writeConcern: {w: "majority", j: true}
    });
    
    // Perform operations with session
    db.collection1.operation1({session});
    db.collection2.operation2({session});
    
    // Commit if all operations succeed
    session.commitTransaction();
    
} catch (error) {
    // Rollback on any error
    session.abortTransaction();
    throw error;
    
} finally {
    // Always clean up session
    session.endSession();
}
```
```

### Slide 5.3: Transaction State Management

```markdown
# Transaction State Management

```javascript
// Check transaction state
function getTransactionState(session) {
    return {
        inTransaction: session.inTransaction(),
        transactionNumber: session.getTxnNumber(),
        operationTime: session.getOperationTime()
    };
}

// Transaction states
const states = {
    INACTIVE: "No active transaction",
    STARTING: "Transaction starting",
    IN_PROGRESS: "Transaction in progress", 
    COMMITTING: "Transaction committing",
    COMMITTED: "Transaction committed",
    ABORTED: "Transaction aborted"
};
```
```

---

## Slide 6: Single vs Multi-Document Transactions

### Slide 6.1: Overview

```markdown
# Single vs Multi-Document Transactions
```

### Slide 6.2: Single-Document Transactions

```markdown
# Single-Document Transactions

✅ **Always ACID - No explicit transaction needed**

```javascript
// Single document operations are automatically atomic
db.accounts.updateOne(
    {_id: "acc123"},
    {
        $inc: {balance: -100},
        $push: {
            transactions: {
                type: "withdrawal",
                amount: 100,
                timestamp: new Date()
            }
        }
    }
);
// This entire operation is atomic!
```
```

### Slide 6.3: When to Use Multi-Document

```markdown
# When to Use Multi-Document Transactions

- Operations span **multiple collections**
- Operations span **multiple documents**
- Complex **business logic** requires atomicity
- **Data consistency** across related entities
```

### Slide 6.4: Multi-Document Example

```markdown
# Multi-Document Example: User Registration

```javascript
const session = db.getMongo().startSession();
session.startTransaction();

try {
    // Create user account
    const userId = new ObjectId();
    db.users.insertOne({
        _id: userId,
        username: "newuser",
        email: "user@example.com",
        createdAt: new Date(),
        status: "active"
    }, {session});
    
    // Create user profile  
    db.profiles.insertOne({
        userId: userId,
        firstName: "John",
        lastName: "Doe",
        preferences: {theme: "dark", notifications: true}
    }, {session});
    
    // Initialize user settings
    db.settings.insertOne({
        userId: userId,
        privacy: "public",
        twoFactorEnabled: false
    }, {session});
    
    // Update statistics
    db.stats.updateOne(
        {type: "userCount"},
        {$inc: {count: 1}},
        {session}
    );
    
    session.commitTransaction();
} catch (error) {
    session.abortTransaction();
}
```
```

---

## Slide 7: Working with Sessions

### Slide 7.1: Session Overview

```markdown
# Working with Sessions

Sessions provide the foundation for transactions and causal consistency.
```

### Slide 7.2: Session Configuration

```markdown
# Session Configuration

```javascript
// Basic session creation
const session = db.getMongo().startSession();

// Session with configuration
const configuredSession = db.getMongo().startSession({
    readPreference: {mode: "primary"},
    readConcern: {level: "majority"},
    writeConcern: {w: "majority", j: true}
});

// Session with causal consistency
const causalSession = db.getMongo().startSession({
    causalConsistency: true
});
```
```

### Slide 7.3: Complete Transfer Function

```markdown
# Complete Transfer Function

```javascript
function transferFunds(fromAccount, toAccount, amount) {
    const session = db.getMongo().startSession();
    
    try {
        session.startTransaction({
            readConcern: {level: "snapshot"},
            writeConcern: {w: "majority"}
        });
        
        // Check source account balance
        const fromAccountDoc = db.accounts.findOne(
            {_id: fromAccount}, 
            {session}
        );
        
        if (fromAccountDoc.balance < amount) {
            throw new Error("Insufficient funds");
        }
        
        // Perform transfer
        db.accounts.updateOne(
            {_id: fromAccount},
            {$inc: {balance: -amount}},
            {session}
        );
        
        db.accounts.updateOne(
            {_id: toAccount},
            {$inc: {balance: amount}},
            {session}
        );
        
        // Log transaction
        db.transferLog.insertOne({
            from: fromAccount,
            to: toAccount,
            amount: amount,
            timestamp: new Date(),
            status: "completed"
        }, {session});
        
        session.commitTransaction();
        return {success: true, message: "Transfer completed"};
        
    } catch (error) {
        session.abortTransaction();
        return {success: false, error: error.message};
        
    } finally {
        session.endSession();
    }
}
```
```

---

## Slide 8: Read and Write Concerns

### Slide 8.1: Overview

```markdown
# Read and Write Concerns

Control consistency and durability guarantees
```

### Slide 8.2: Read Concerns

```markdown
# Read Concerns in Transactions

```javascript
const readConcerns = {
    // Snapshot isolation (default for transactions)
    snapshot: {level: "snapshot"},
    
    // Read majority committed data
    majority: {level: "majority"},
    
    // Local read (fastest, least consistent)
    local: {level: "local"}
};

// Setting read concern for transaction
session.startTransaction({
    readConcern: {level: "snapshot"}
});
```
```

### Slide 8.3: Write Concerns

```markdown
# Write Concerns in Transactions

```javascript
const writeConcerns = {
    // Majority acknowledgment (recommended)
    majority: {w: "majority", j: true},
    
    // Single node acknowledgment (faster, less durable)
    single: {w: 1, j: false},
    
    // All nodes acknowledgment (slowest, most durable)
    all: {w: "all", j: true}
};

// Setting write concern for transaction
session.startTransaction({
    writeConcern: {
        w: "majority", 
        j: true, 
        wtimeout: 5000
    }
});
```
```

### Slide 8.4: Causal Consistency

```markdown
# Causal Consistency

```javascript
// Session with causal consistency ensures 
// read-after-write consistency
const session = db.getMongo().startSession({
    causalConsistency: true
});

session.startTransaction();

// Write operation
db.posts.insertOne({
    title: "New Post",
    authorId: "user123",
    createdAt: new Date()
}, {session});

session.commitTransaction();

// This read will see the write above due to causal consistency
const posts = db.posts.find({authorId: "user123"}, {session});
session.endSession();
```
```

---

## Slide 9: Transaction Operations

### Slide 9.1: Overview

```markdown
# Transaction Operations
```

### Slide 9.2: Supported Operations

```markdown
# Supported Operations

| Operation Type | Supported | Example |
|---------------|-----------|---------|
| CRUD Operations | ✅ All | insertOne, updateMany, deleteOne |
| Aggregation | ✅ Yes | aggregate(), $merge, $out |
| Index Operations | ❌ No | createIndex, dropIndex |
| Collection Operations | ❌ No | createCollection, drop |
| Text Search | ❌ No | $text queries |
```

### Slide 9.3: Core Methods

```markdown
# Core Transaction Methods

```javascript
// Transaction control methods
session.startTransaction(options)
session.commitTransaction()
session.abortTransaction()
session.endSession()

// Transaction state queries
session.inTransaction()           // Returns boolean
session.getTxnNumber()           // Returns transaction number
session.getOperationTime()       // Returns operation timestamp

// All CRUD operations support session parameter
db.collection.insertOne(doc, {session})
db.collection.updateMany(filter, update, {session})
db.collection.find(filter, {session})
db.collection.deleteOne(filter, {session})
```
```

---

## Slide 10: Performance & Limitations

### Slide 10.1: Overview

```markdown
# Performance & Limitations
```

### Slide 10.2: Transaction Limits

```markdown
# Transaction Limits

| Limit Type | Default Value | Configurable |
|-----------|---------------|--------------|
| Max Time | 60 seconds | ✅ Yes |
| Max Size | 16MB | ❌ No |
| Max Documents | 1000 (practical) | ⚠️ Performance |
| Max Collections | 100 (practical) | ⚠️ Performance |
```

### Slide 10.3: Performance Monitoring

```markdown
# Performance Monitoring

```javascript
function analyzeTransactionPerformance() {
    const serverStatus = db.serverStatus();
    const txnStats = serverStatus.transactions;
    
    print("=== Transaction Performance Metrics ===");
    print(`Current Open: ${txnStats.currentOpen}`);
    print(`Current Active: ${txnStats.currentActive}`);
    print(`Total Started: ${txnStats.totalStarted}`);
    print(`Total Committed: ${txnStats.totalCommitted}`);
    print(`Total Aborted: ${txnStats.totalAborted}`);
    
    // Calculate abort rate
    const abortRate = txnStats.totalAborted / 
        (txnStats.totalStarted || 1);
    print(`Abort Rate: ${(abortRate * 100).toFixed(2)}%`);
    
    // Alert on high abort rate
    if (abortRate > 0.1) {
        print("⚠️ HIGH ABORT RATE - Check for conflicts");
    }
}

analyzeTransactionPerformance();
```
```

### Slide 10.4: Optimization Best Practices

```markdown
# Optimization Best Practices

- **Keep transactions short** - Reduce lock time
- **Batch operations** - Use bulkWrite when possible
- **Consistent ordering** - Prevent deadlocks
- **Appropriate timeouts** - Don't let transactions hang
- **Monitor metrics** - Track abort rates
```

---

## Slide 11: Error Handling

### Slide 11.1: Overview

```markdown
# Error Handling & Retry Logic
```

### Slide 11.2: Error Types

```markdown
# Transaction Error Types

```javascript
// Transient errors (can be retried)
const TRANSIENT_ERRORS = [
    "TransientTransactionError",
    "UnknownTransactionCommitResult"
];

// Permanent errors (should not be retried)
const PERMANENT_ERRORS = [
    "InvalidTransaction", 
    "TransactionTooOld",
    "TransactionSizeLimitExceeded"
];

function isRetryableError(error) {
    return error.hasErrorLabel("TransientTransactionError") ||
           error.hasErrorLabel("UnknownTransactionCommitResult");
}
```
```

### Slide 11.3: Robust Retry Pattern

```markdown
# Robust Retry Pattern

```javascript
function robustTransactionWithRetry(operation, maxRetries = 3) {
    let attempt = 0;
    
    while (attempt < maxRetries) {
        const session = db.getMongo().startSession();
        attempt++;
        
        try {
            session.startTransaction({
                readConcern: {level: "majority"},
                writeConcern: {w: "majority", j: true},
                maxTimeMS: 30000
            });
            
            const result = operation(session);
            
            // Commit with retry logic
            while (true) {
                try {
                    session.commitTransaction();
                    session.endSession();
                    return result;
                } catch (commitError) {
                    if (commitError.hasErrorLabel("UnknownTransactionCommitResult")) {
                        continue; // Retry commit
                    } else {
                        throw commitError;
                    }
                }
            }
            
        } catch (error) {
            session.abortTransaction();
            session.endSession();
            
            if (isRetryableError(error) && attempt < maxRetries) {
                const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                sleep(backoffMs);
                continue;
            } else {
                throw new Error(`Transaction failed after ${attempt} attempts`);
            }
        }
    }
}
```
```

---

## Slide 12: Real-World Use Cases

### Slide 12.1: Overview

```markdown
# Real-World Use Cases
```

### Slide 12.2: E-commerce Order Processing

```markdown
# E-commerce Order Processing

1. **Validate customer** and cart items
2. **Check inventory** for all products
3. **Reserve inventory** atomically
4. **Process payment** (external service)
5. **Create order** document
6. **Update customer** order history
7. **Clear shopping cart**
8. **Create audit trail**

**Critical:** If any step fails, entire order must be rolled back to maintain data integrity.
```

### Slide 12.3: Banking System

```markdown
# Banking System

1. **Validate accounts** (active, exists)
2. **Check daily limits** and transaction history
3. **Verify sufficient balance** (including overdraft)
4. **Calculate fees** (wire, international, overdraft)
5. **Debit source account**
6. **Credit destination account**
7. **Record transaction** details
8. **Update transaction history**
9. **Create compliance audit log**

**Zero tolerance:** Money must never be lost or created due to system errors.
```

### Slide 12.4: Social Media Platform

```markdown
# Social Media Platform

1. **Validate user** and posting limits
2. **Process media files** and metadata
3. **Create post** document
4. **Update user stats** (post count, activity)
5. **Add to followers' feeds**
6. **Update trending hashtags**
7. **Send notifications** (async)

**Consistency goal:** User's posts, stats, and feeds must stay synchronized.
```

---

## Slide 13: Best Practices

### Slide 13.1: Overview

```markdown
# Transaction Best Practices
```

### Slide 13.2: Design Principles

```markdown
# Design Principles

**Keep It Short** - Minimize transaction duration to reduce lock contention

**Single Purpose** - One transaction should accomplish one business goal

**Consistent Ordering** - Always access documents in the same order to prevent deadlocks

**Proper Cleanup** - Always end sessions in finally blocks
```

### Slide 13.3: Schema Design

```markdown
# Schema Design for Transactions

```javascript
// ✅ GOOD: Embed related data updated together
const orderSchema = {
    _id: ObjectId(),
    customerId: ObjectId(),
    status: "pending",          // Updated atomically
    items: [                    // Embedded - updated together
        {
            productId: ObjectId(),
            quantity: 2,
            price: 29.99,
            status: "available"
        }
    ],
    totals: {                   // Calculated together
        subtotal: 59.98,
        tax: 4.80,
        total: 64.78
    },
    audit: {                    // Tracking fields together
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
    }
};
```
```

### Slide 13.4: Performance Optimization

```markdown
# Performance Optimization

```javascript
// Use appropriate read/write concerns based on priority
const getOptimalConcerns = (priority) => {
    switch (priority) {
        case "performance":
            return {
                readConcern: {level: "local"},
                writeConcern: {w: 1, j: false}
            };
        case "consistency":
            return {
                readConcern: {level: "majority"},
                writeConcern: {w: "majority", j: true}
            };
        case "durability":
            return {
                readConcern: {level: "snapshot"},
                writeConcern: {w: "all", j: true}
            };
    }
};

// Batch operations when possible
const bulkOps = updates.map(update => ({
    updateOne: {
        filter: update.filter,
        update: update.update
    }
}));

db.collection.bulkWrite(bulkOps, {session});
```
```

---

## Slide 14: Hands-On Exercise

### Slide 14.1: Exercise Introduction

```markdown
# Hands-On Exercise
## Build a Bank Transfer System
```

### Slide 14.2: Complete the Transfer Function

```markdown
# Exercise: Complete the Transfer Function

```javascript
function bankTransfer(fromAccountId, toAccountId, amount) {
    // TODO: Create session
    const session = /* YOUR CODE HERE */;
    
    try {
        // TODO: Start transaction with appropriate concerns
        session.startTransaction(/* YOUR CODE HERE */);
        
        // TODO: Find and validate source account
        const sourceAccount = /* YOUR CODE HERE */;
        
        // TODO: Find and validate destination account  
        const destAccount = /* YOUR CODE HERE */;
        
        // TODO: Check if source has sufficient balance
        if (/* YOUR CODE HERE */) {
            throw new Error("Insufficient funds");
        }
        
        // TODO: Update source account (subtract amount)
        /* YOUR CODE HERE */
        
        // TODO: Update destination account (add amount)
        /* YOUR CODE HERE */
        
        // TODO: Log the transaction
        /* YOUR CODE HERE */
        
        // TODO: Commit transaction
        /* YOUR CODE HERE */
        
        return {success: true, message: "Transfer completed"};
        
    } catch (error) {
        // TODO: Abort transaction and handle error
        /* YOUR CODE HERE */
        
    } finally {
        // TODO: Clean up session
        /* YOUR CODE HERE */
    }
}
```
```

### Slide 14.3: Exercise Setup

```markdown
# Exercise Setup

```javascript
// Setup test data
db.accounts.insertMany([
    {_id: "acc1", owner: "Alice", balance: 1000},
    {_id: "acc2", owner: "Bob", balance: 500}
]);

// Test the function
const result = bankTransfer("acc1", "acc2", 100);
printjson(result);

// Verify the results
db.accounts.find();
db.transferLog.find();
```
```

### Slide 14.4: Challenge Extensions

```markdown
# Challenge Extensions

- **Add daily limits** - Check transaction history
- **Implement fees** - Different rates for transfer types
- **Add retry logic** - Handle transient errors
- **Create audit trail** - Compliance logging
- **Add overdraft protection** - Business rules
```

---

## Slide 15: Summary

### Slide 15.1: Key Takeaways

```markdown
# Key Takeaways
```

### Slide 15.2: When to Use Transactions

```markdown
# When to Use Transactions

## ✅ Use Transactions For:
- Multi-document operations
- Financial operations
- Inventory management
- User registration workflows
- Complex business logic

## ❌ Avoid Transactions For:
- Single document operations
- Read-only operations
- Long-running processes
- Eventually consistent scenarios
- High-frequency simple updates
```

### Slide 15.3: Production Checklist

```markdown
# Production Checklist

- ✅ **Monitor transaction abort rates** (< 10%)
- ✅ **Set appropriate timeouts** (10-30 seconds)
- ✅ **Implement retry logic** for transient errors
- ✅ **Use connection pooling** efficiently
- ✅ **Design schemas** to minimize transaction scope
- ✅ **Test failure scenarios** thoroughly
- ✅ **Plan disaster recovery** procedures
- ✅ **Monitor performance metrics** continuously
```

### Slide 15.4: Next Steps

```markdown
# Next Steps

1. **Practice** with the provided exercises
2. **Implement transactions** in your applications
3. **Monitor performance** in production
4. **Study advanced patterns** like saga transactions
5. **Explore distributed** transaction patterns

**Remember:** Transactions are powerful tools - use them wisely!
```

---

## Slide 16: Questions

```markdown
# Questions & Discussion

What transaction challenges have you encountered?

How would you implement transactions in your use case?

---

**Thank you!**

*MongoDB Transactions - Building Reliable Applications*
```

---

## Reveal.js Configuration Instructions

To convert this markdown to a Reveal.js presentation:

### 1. Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/theme/black.min.css">
</head>
<body>
    <div class="reveal">
        <div class="slides">
            <!-- Convert each slide section here -->
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.js"></script>
</body>
</html>
```

### 2. Markdown Conversion Rules

- Each `## Slide X:` becomes a `<section>`
- Each `### Slide X.Y:` becomes a nested `<section>`
- Code blocks remain in ``` fenced blocks
- Use `class="fragment"` for step-by-step reveals
- Tables convert to standard HTML tables

### 3. Enhanced Styling

```css
.reveal .slides section {
    text-align: left;
}
.reveal h1, .reveal h2, .reveal h3 {
    text-align: center;
    color: #42affa;
}
.highlight-green { color: #68d391 !important; }
.highlight-red { color: #fc8181 !important; }
.highlight-yellow { color: #fbd38d !important; }
```

### 4. Fragment Usage

```html
<li class="fragment">Point appears on click</li>
<div class="fragment fade-in">Fades in</div>
<div class="fragment highlight-red">Highlights in red</div>
```

### 5. Speaker Notes

```html
<aside class="notes">
    These are speaker notes visible in presenter mode
</aside>
```

This markdown format allows you to:
- **Easy editing** in any text editor
- **Version control** friendly
- **Quick conversion** to HTML
- **Presentation flexibility** with reveal.js features
- **Content reusability** across different formats