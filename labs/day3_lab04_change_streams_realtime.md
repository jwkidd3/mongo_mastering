# Lab 4: Change Streams for Real-time Applications
**Duration:** 30 minutes
**Objective:** Implement real-time applications using MongoDB change streams

## Part A: Change Stream Setup (15 minutes)

### Step 1: Prepare Collections

**Using existing replica set from Lab 1:**
- Connection: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`

**Create additional collections for change streams:**
```javascript
use ecommerce

// Create notifications collection
db.notifications.createIndex({ userId: 1, timestamp: -1 })
db.notifications.createIndex({ type: 1, read: 1 })

// Create activity log collection
db.activity_log.createIndex({ timestamp: -1 })
db.activity_log.createIndex({ event: 1, timestamp: -1 })

// Create resume tokens collection
db.resume_tokens.createIndex({ lastUpdated: -1 })
```

### Step 2: Basic Change Stream Simulation

**Understanding Change Streams:**
Change streams in production run as background processes. For lab purposes, we'll simulate the processing.

```javascript
// Simulate change stream handler
function simulateChangeStreamHandler(change) {
  print("=== Change Detected ===");
  print("Operation: " + change.operationType);
  print("Collection: " + change.ns.coll);
  print("Timestamp: " + new Date());

  switch(change.operationType) {
    case 'insert':
      if (change.ns.coll === "orders") {
        print("New order created: " + change.fullDocument._id);
        print("Customer: " + change.fullDocument.customerId);
        print("Total: $" + change.fullDocument.totalAmount);

        // Create notification
        db.notifications.insertOne({
          userId: change.fullDocument.customerId,
          type: "order_created",
          message: `Your order ${change.fullDocument._id} has been created.`,
          orderId: change.fullDocument._id,
          timestamp: new Date(),
          read: false
        });
      }
      break;

    case 'update':
      if (change.ns.coll === "orders") {
        print("Order updated: " + change.documentKey._id);
        if (change.updateDescription && change.updateDescription.updatedFields.status) {
          print("Status changed to: " + change.updateDescription.updatedFields.status);

          // Create status update notification
          var order = db.orders.findOne({ _id: change.documentKey._id });
          db.notifications.insertOne({
            userId: order.customerId,
            type: "status_update",
            message: `Your order ${change.documentKey._id} status: ${change.updateDescription.updatedFields.status}`,
            orderId: change.documentKey._id,
            timestamp: new Date(),
            read: false
          });
        }
      }
      break;

    case 'delete':
      print("Document deleted: " + change.documentKey._id);
      break;
  }
  print("========================\n");
}
```

### Step 3: Test Change Stream Processing

**Monitor in Compass:**
1. Open `orders` and `notifications` collections in separate tabs
2. Enable auto-refresh for real-time monitoring

**Test Order Creation:**
```javascript
// Create a test order and simulate change stream processing
var testOrder = {
  _id: "order_cs_test1",
  customerId: "cust1",
  orderDate: new Date(),
  items: [{ productId: "prod2", quantity: 1 }],
  totalAmount: 29.99,
  status: "pending"
};

// Insert order
db.orders.insertOne(testOrder);

// Simulate change stream processing
simulateChangeStreamHandler({
  operationType: "insert",
  ns: { db: "ecommerce", coll: "orders" },
  fullDocument: testOrder,
  documentKey: { _id: "order_cs_test1" }
});

// Update order status
db.orders.updateOne(
  { _id: "order_cs_test1" },
  { $set: { status: "processing" } }
);

// Simulate update processing
simulateChangeStreamHandler({
  operationType: "update",
  ns: { db: "ecommerce", coll: "orders" },
  documentKey: { _id: "order_cs_test1" },
  updateDescription: { updatedFields: { status: "processing" } }
});
```

**Verify in Compass:**
- Check `notifications` collection for auto-generated notifications
- Apply filter: `{"orderId": "order_cs_test1"}` to see related notifications

## Part B: Advanced Change Stream Features (15 minutes)

### Step 4: Event-Driven Order Processing System

```javascript
// Complete order processing system with change streams
var OrderProcessor = {

  // Process new orders
  processNewOrder: function(order) {
    print(`Processing new order: ${order._id}`);

    // Validate inventory
    var allItemsAvailable = true;
    var unavailableItems = [];

    order.items.forEach(function(item) {
      var product = db.products.findOne({ _id: item.productId });
      if (!product || product.stock < item.quantity) {
        allItemsAvailable = false;
        unavailableItems.push(item.productId);
      }
    });

    if (allItemsAvailable) {
      // Update order status
      db.orders.updateOne(
        { _id: order._id },
        { $set: { status: "processing", processedAt: new Date() } }
      );

      // Create success notification
      db.notifications.insertOne({
        userId: order.customerId,
        type: "order_confirmed",
        message: `Your order ${order._id} has been confirmed and is being processed.`,
        orderId: order._id,
        timestamp: new Date(),
        read: false
      });

      print(`✅ Order ${order._id} confirmed and processing`);
    } else {
      // Update order status to failed
      db.orders.updateOne(
        { _id: order._id },
        { $set: { status: "failed", reason: "Insufficient inventory" } }
      );

      // Create failure notification
      db.notifications.insertOne({
        userId: order.customerId,
        type: "order_failed",
        message: `Your order ${order._id} could not be processed due to insufficient inventory.`,
        orderId: order._id,
        timestamp: new Date(),
        read: false
      });

      print(`❌ Order ${order._id} failed - insufficient inventory`);
    }
  },

  // Handle status changes
  handleStatusChange: function(orderId, newStatus) {
    print(`Order ${orderId} status changed to: ${newStatus}`);

    var order = db.orders.findOne({ _id: orderId });
    if (order && newStatus === "completed") {
      // Update customer stats
      db.customers.updateOne(
        { _id: order.customerId },
        {
          $inc: { totalOrders: 1, totalSpent: order.totalAmount },
          $set: { lastOrderDate: new Date() }
        }
      );
      print(`✅ Customer ${order.customerId} stats updated`);
    }
  },

  // Handle inventory changes
  handleInventoryChange: function(productId, newStock) {
    print(`Product ${productId} stock updated to: ${newStock}`);

    // Check for low inventory
    if (newStock <= 5) {
      db.notifications.insertOne({
        userId: "inventory_manager",
        type: "low_inventory",
        message: `Low inventory alert: Product ${productId} has only ${newStock} units left.`,
        productId: productId,
        timestamp: new Date(),
        read: false
      });

      print(`⚠️ Low inventory alert for ${productId}`);
    }
  }
};
```

### Step 5: Test Complete Workflow

```javascript
print("=== Testing Complete Order Processing Workflow ===");

// Create a new order
var newOrder = {
  _id: "order_workflow_test1",
  customerId: "cust2",
  orderDate: new Date(),
  items: [{ productId: "prod3", quantity: 2 }],  // Should have stock
  totalAmount: 159.98,
  status: "pending"
};

// Insert and process order
db.orders.insertOne(newOrder);
OrderProcessor.processNewOrder(newOrder);

// Simulate status changes
OrderProcessor.handleStatusChange("order_workflow_test1", "shipped");
OrderProcessor.handleStatusChange("order_workflow_test1", "completed");

// Test inventory change
OrderProcessor.handleInventoryChange("prod3", 3);  // Should trigger low stock alert

// Test order with insufficient stock
var failedOrder = {
  _id: "order_workflow_test2",
  customerId: "cust3",
  orderDate: new Date(),
  items: [{ productId: "prod1", quantity: 20 }],  // More than available stock
  totalAmount: 19999.80,
  status: "pending"
};

db.orders.insertOne(failedOrder);
OrderProcessor.processNewOrder(failedOrder);
```

### Step 6: Resume Token Management

```javascript
// Simulate resumable change streams with token storage
var ChangeStreamManager = {

  // Store resume token for fault tolerance
  storeResumeToken: function(streamId, token) {
    db.resume_tokens.replaceOne(
      { _id: streamId },
      { _id: streamId, token: token, lastUpdated: new Date() },
      { upsert: true }
    );
    print(`Resume token stored for ${streamId}`);
  },

  // Get last resume token
  getLastResumeToken: function(streamId) {
    var doc = db.resume_tokens.findOne({ _id: streamId });
    if (doc) {
      print(`Resume token found for ${streamId}: ${doc.lastUpdated}`);
      return doc.token;
    }
    print(`No resume token found for ${streamId}`);
    return null;
  },

  // Process change with resume token
  processChangeWithResume: function(streamId, change) {
    // Process the change
    print(`Processing change for ${streamId}: ${change.operationType}`);

    // Store resume token for fault tolerance
    this.storeResumeToken(streamId, change._id);

    // Log processing
    db.activity_log.insertOne({
      operation: change.operationType,
      collection: change.ns.coll,
      documentId: change.documentKey._id,
      timestamp: new Date(),
      changeId: change._id,
      streamId: streamId
    });

    print(`✅ Change processed and resume token saved`);
  }
};

// Test resume token functionality
print("=== Testing Resume Token Functionality ===");

// Simulate change stream events
var simulatedChanges = [
  {
    _id: { _data: "resumeToken1" },
    operationType: "insert",
    ns: { db: "ecommerce", coll: "orders" },
    documentKey: { _id: "order_resume1" }
  },
  {
    _id: { _data: "resumeToken2" },
    operationType: "update",
    ns: { db: "ecommerce", coll: "orders" },
    documentKey: { _id: "order_resume1" }
  }
];

// Process changes with resume tokens
simulatedChanges.forEach(function(change, index) {
  ChangeStreamManager.processChangeWithResume("order_stream", change);
});

// Check stored resume tokens
print("\nStored resume tokens:");
db.resume_tokens.find().forEach(printjson);

// Check activity log
print("\nActivity log:");
db.activity_log.find({ streamId: "order_stream" }).forEach(printjson);
```

### Step 7: Monitor Results in Compass

**Real-time Monitoring:**
1. Keep multiple collection tabs open:
   - `orders` - see order changes
   - `notifications` - see generated notifications
   - `activity_log` - see change stream processing
   - `resume_tokens` - see fault tolerance tokens

**Analysis Queries:**
```javascript
// Count notifications by type
db.notifications.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Find unread notifications for a customer
db.notifications.find({ userId: "cust2", read: false }).sort({ timestamp: -1 })

// Check recent activity
db.activity_log.find().sort({ timestamp: -1 }).limit(10)
```

## Lab 4 Deliverables
✅ **Change stream simulation** with event processing
✅ **Real-time notifications** system implemented
✅ **Event-driven order processing** workflow
✅ **Resume token management** for fault tolerance