// MongoDB Day 3 Labs - Data Generator Script
// Run this script in mongosh to generate all test data needed for the labs
// Usage: mongosh < day3-data-generator.js

print("=======================================================");
print("MongoDB Day 3 Labs - Data Generator");
print("=======================================================");
print("This script will create all test data needed for Day 3 labs");
print("Labs covered: Transactions, Replication, Sharding, Change Streams");
print("=======================================================\n");

// ===========================================
// Lab 1: Transaction Data Setup
// ===========================================

print("🔄 Setting up data for Lab 1: Transactions");
print("-------------------------------------------");

// Switch to ecommerce database
use ecommerce;

// Drop existing collections to start fresh
db.products.drop();
db.customers.drop();
db.orders.drop();
db.transactions.drop();

print("✓ Cleaned existing collections");

// Create products collection with sample data
print("Creating products collection...");
db.products.insertMany([
  { 
    _id: "prod1", 
    name: "Laptop", 
    price: 999.99, 
    stock: 10,
    category: "Electronics",
    description: "High-performance laptop for professionals",
    tags: ["computer", "work", "portable"]
  },
  { 
    _id: "prod2", 
    name: "Mouse", 
    price: 29.99, 
    stock: 50,
    category: "Electronics", 
    description: "Wireless optical mouse",
    tags: ["computer", "wireless", "accessory"]
  },
  { 
    _id: "prod3", 
    name: "Keyboard", 
    price: 79.99, 
    stock: 25,
    category: "Electronics",
    description: "Mechanical keyboard with RGB lighting",
    tags: ["computer", "mechanical", "rgb"]
  },
  { 
    _id: "prod4", 
    name: "Monitor", 
    price: 299.99, 
    stock: 15,
    category: "Electronics",
    description: "24-inch 4K monitor",
    tags: ["display", "4k", "monitor"]
  },
  { 
    _id: "prod5", 
    name: "Desk Chair", 
    price: 199.99, 
    stock: 8,
    category: "Furniture",
    description: "Ergonomic office chair",
    tags: ["office", "ergonomic", "furniture"]
  }
]);

print("✓ Created " + db.products.countDocuments() + " products");

// Create customers collection with sample data
print("Creating customers collection...");
db.customers.insertMany([
  { 
    _id: "cust1", 
    name: "John Doe", 
    email: "john@example.com", 
    balance: 1200.00,
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: null,
    registrationDate: new Date("2024-01-15")
  },
  { 
    _id: "cust2", 
    name: "Jane Smith", 
    email: "jane@example.com", 
    balance: 800.00,
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: null,
    registrationDate: new Date("2024-02-20")
  },
  { 
    _id: "cust3", 
    name: "Bob Johnson", 
    email: "bob@example.com", 
    balance: 1500.00,
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: null,
    registrationDate: new Date("2024-03-10")
  },
  { 
    _id: "cust4", 
    name: "Alice Brown", 
    email: "alice@example.com", 
    balance: 2000.00,
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: null,
    registrationDate: new Date("2024-04-05")
  }
]);

print("✓ Created " + db.customers.countDocuments() + " customers");

// Create indexes for orders collection
print("Creating indexes...");
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ customerId: 1, orderDate: 1 });
db.transactions.createIndex({ timestamp: -1 });

print("✓ Created necessary indexes");
print("Lab 1 data setup complete!\n");

// ===========================================
// Lab 2: Replication Data Setup
// ===========================================

print("🔧 Setting up data for Lab 2: Replication");
print("------------------------------------------");

// Create test_writes collection for write concern testing
print("Creating test collections for replication testing...");
db.test_writes.createIndex({ timestamp: -1 });

print("✓ Created test collections");
print("Lab 2 data setup complete!\n");

// ===========================================
// Lab 3: Sharding Data Setup  
// ===========================================

print("⚡ Setting up data for Lab 3: Sharding");
print("--------------------------------------");

// Note: Sharding collections will be created during the lab
// This section prepares additional reference data

// Generate users data for hashed sharding
print("Generating users data for hashed sharding...");
var users = [];
for (let i = 1; i <= 1000; i++) {
  users.push({
    _id: "user" + i,
    name: "User " + i,
    email: "user" + i + "@example.com",
    registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
    preferences: {
      newsletter: Math.random() > 0.5,
      theme: Math.random() > 0.5 ? "dark" : "light",
      language: Math.random() > 0.7 ? "es" : "en"
    },
    metadata: {
      lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      loginCount: Math.floor(Math.random() * 100),
      accountType: Math.random() > 0.8 ? "premium" : "basic"
    }
  });
}

// Insert users in batches to avoid memory issues
var batchSize = 100;
for (let i = 0; i < users.length; i += batchSize) {
  var batch = users.slice(i, i + batchSize);
  db.users.insertMany(batch);
  if ((i + batchSize) % 200 === 0) {
    print("  Inserted " + (i + batchSize) + " users...");
  }
}

print("✓ Generated " + db.users.countDocuments() + " users for sharding");

// Generate orders data for range sharding
print("Generating orders data for range sharding...");
var customers = ["user1", "user100", "user200", "user300", "user400", "user500"];
var orders = [];

for (let i = 1; i <= 2000; i++) {
  var customerId = customers[Math.floor(Math.random() * customers.length)];
  var orderDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
  var itemCount = Math.floor(Math.random() * 3) + 1;
  var items = [];
  var total = 0;
  
  for (let j = 0; j < itemCount; j++) {
    var productId = "prod" + (Math.floor(Math.random() * 5) + 1);
    var quantity = Math.floor(Math.random() * 3) + 1;
    var price = Math.random() * 500 + 50; // $50-$550
    items.push({ productId: productId, quantity: quantity, price: price });
    total += price * quantity;
  }
  
  orders.push({
    _id: "order" + i,
    customerId: customerId,
    orderDate: orderDate,
    items: items,
    total: Math.round(total * 100) / 100,
    status: Math.random() > 0.8 ? "pending" : "completed",
    shippingAddress: {
      street: Math.floor(Math.random() * 9999) + " Main St",
      city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
      state: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    }
  });
}

// Insert orders in batches
for (let i = 0; i < orders.length; i += batchSize) {
  var batch = orders.slice(i, i + batchSize);
  db.orders.insertMany(batch);
  if ((i + batchSize) % 200 === 0) {
    print("  Inserted " + (i + batchSize) + " orders...");
  }
}

print("✓ Generated " + db.orders.countDocuments() + " orders for sharding");

// Generate stores data for geographic sharding
print("Generating stores data for geographic sharding...");
var regions = ["north", "south", "east", "west"];
var stores = [];

for (let i = 1; i <= 400; i++) {
  var region = regions[Math.floor(Math.random() * regions.length)];
  stores.push({
    region: region,
    storeId: "store" + i,
    name: "Store " + i,
    address: i + " Commerce St, " + region.charAt(0).toUpperCase() + region.slice(1) + " District",
    manager: "Manager " + i,
    employees: Math.floor(Math.random() * 20) + 5,
    salesData: {
      monthly: Math.round((Math.random() * 100000 + 50000) * 100) / 100,
      quarterly: Math.round((Math.random() * 300000 + 150000) * 100) / 100,
      annual: Math.round((Math.random() * 1200000 + 600000) * 100) / 100
    },
    inventory: {
      totalItems: Math.floor(Math.random() * 1000) + 500,
      categories: Math.floor(Math.random() * 10) + 5,
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    },
    coordinates: {
      lat: Math.random() * 180 - 90,
      lng: Math.random() * 360 - 180
    }
  });
}

db.stores.insertMany(stores);
print("✓ Generated " + db.stores.countDocuments() + " stores for geographic sharding");
print("Lab 3 data setup complete!\n");

// ===========================================
// Lab 4: Change Streams Data Setup
// ===========================================

print("📡 Setting up data for Lab 4: Change Streams");
print("---------------------------------------------");

// Create collections for change stream testing
print("Creating collections for change streams...");

// Drop existing collections
db.notifications.drop();
db.activity_log.drop();
db.resume_tokens.drop();

// Create notifications collection
db.notifications.createIndex({ userId: 1, timestamp: -1 });
db.notifications.createIndex({ type: 1, read: 1 });

// Create activity log collection  
db.activity_log.createIndex({ timestamp: -1 });
db.activity_log.createIndex({ event: 1, timestamp: -1 });

// Create resume tokens collection
db.resume_tokens.createIndex({ lastUpdated: -1 });

print("✓ Created change stream collections with indexes");

// Insert sample notifications to demonstrate the structure
print("Creating sample notifications...");
db.notifications.insertMany([
  {
    userId: "cust1",
    type: "welcome",
    message: "Welcome to our platform!",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true
  },
  {
    userId: "cust2", 
    type: "welcome",
    message: "Welcome to our platform!",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    read: false
  },
  {
    userId: "admin",
    type: "system",
    message: "System maintenance scheduled for tonight",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: false
  }
]);

print("✓ Created " + db.notifications.countDocuments() + " sample notifications");
print("Lab 4 data setup complete!\n");

// ===========================================
// Additional Utility Data
// ===========================================

print("🛠️ Creating additional utility data");
print("-----------------------------------");

// Create product categories for analytics
print("Creating product categories reference...");
db.product_categories.drop();
db.product_categories.insertMany([
  {
    _id: "Electronics",
    description: "Electronic devices and accessories",
    parentCategory: null,
    subcategories: ["Computers", "Mobile", "Audio", "Gaming"]
  },
  {
    _id: "Furniture", 
    description: "Home and office furniture",
    parentCategory: null,
    subcategories: ["Office", "Living Room", "Bedroom", "Outdoor"]
  },
  {
    _id: "Books",
    description: "Books and educational materials", 
    parentCategory: null,
    subcategories: ["Fiction", "Non-Fiction", "Technical", "Children"]
  },
  {
    _id: "Clothing",
    description: "Apparel and accessories",
    parentCategory: null, 
    subcategories: ["Men", "Women", "Children", "Accessories"]
  }
]);

print("✓ Created product categories reference");

// Create system configuration collection
print("Creating system configuration...");
db.system_config.drop();
db.system_config.insertMany([
  {
    _id: "app_settings",
    version: "1.0.0",
    features: {
      transactions_enabled: true,
      change_streams_enabled: true,
      sharding_enabled: false,
      notifications_enabled: true
    },
    limits: {
      max_order_items: 10,
      max_transaction_amount: 10000,
      session_timeout_minutes: 30
    },
    lastUpdated: new Date()
  },
  {
    _id: "business_rules",
    inventory: {
      low_stock_threshold: 5,
      auto_reorder_enabled: true,
      reserved_stock_duration_hours: 2
    },
    orders: {
      max_processing_time_hours: 24,
      auto_cancel_pending_hours: 72,
      refund_window_days: 30
    },
    customers: {
      max_balance: 5000,
      credit_limit_default: 1000,
      loyalty_program_enabled: true
    },
    lastUpdated: new Date()
  }
]);

print("✓ Created system configuration");

// Create sample analytics data
print("Creating analytics data...");
db.daily_stats.drop();
var statsData = [];
for (let i = 30; i >= 0; i--) {
  var date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
  statsData.push({
    date: date,
    orders: {
      total: Math.floor(Math.random() * 100) + 50,
      completed: Math.floor(Math.random() * 80) + 40,
      cancelled: Math.floor(Math.random() * 10) + 2,
      revenue: Math.round((Math.random() * 50000 + 20000) * 100) / 100
    },
    users: {
      active: Math.floor(Math.random() * 500) + 200,
      new_registrations: Math.floor(Math.random() * 20) + 5,
      returning: Math.floor(Math.random() * 300) + 150
    },
    products: {
      views: Math.floor(Math.random() * 5000) + 2000,
      searches: Math.floor(Math.random() * 1000) + 500,
      top_category: ["Electronics", "Furniture", "Books", "Clothing"][Math.floor(Math.random() * 4)]
    }
  });
}
db.daily_stats.insertMany(statsData);

print("✓ Created " + db.daily_stats.countDocuments() + " days of analytics data");

// ===========================================
// Create Useful Functions
// ===========================================

print("🔧 Creating utility functions");
print("-----------------------------");

// Function to reset all data to initial state
print("Creating data reset function...");
db.system.js.save({
  _id: "resetLabData",
  value: function() {
    print("Resetting all lab data to initial state...");
    
    // Reset product stock
    db.products.updateMany({}, {
      $set: {
        "stock": {
          "prod1": 10,
          "prod2": 50, 
          "prod3": 25,
          "prod4": 15,
          "prod5": 8
        }
      }
    });
    
    // Reset customer balances
    db.customers.updateMany({}, {
      $set: { totalOrders: 0, totalSpent: 0, lastOrderDate: null }
    });
    db.customers.updateOne({_id: "cust1"}, {$set: {balance: 1200.00}});
    db.customers.updateOne({_id: "cust2"}, {$set: {balance: 800.00}});
    db.customers.updateOne({_id: "cust3"}, {$set: {balance: 1500.00}});
    db.customers.updateOne({_id: "cust4"}, {$set: {balance: 2000.00}});
    
    // Clear test collections
    db.orders.deleteMany({_id: /^order_test/});
    db.transactions.deleteMany({type: "transfer"});
    db.notifications.deleteMany({type: {$in: ["order_created", "status_update", "high_value_order"]}});
    db.activity_log.deleteMany({});
    db.resume_tokens.deleteMany({});
    
    print("✓ Lab data reset complete!");
  }
});

// Function to generate additional test orders
print("Creating test order generator function...");
db.system.js.save({
  _id: "generateTestOrders",
  value: function(count) {
    count = count || 10;
    print("Generating " + count + " test orders...");
    
    var customers = ["cust1", "cust2", "cust3", "cust4"];
    var products = ["prod1", "prod2", "prod3", "prod4", "prod5"];
    var orders = [];
    
    for (let i = 1; i <= count; i++) {
      var customerId = customers[Math.floor(Math.random() * customers.length)];
      var productId = products[Math.floor(Math.random() * products.length)];
      var quantity = Math.floor(Math.random() * 3) + 1;
      var product = db.products.findOne({_id: productId});
      var total = product.price * quantity;
      
      orders.push({
        _id: "test_order_" + Date.now() + "_" + i,
        customerId: customerId,
        orderDate: new Date(),
        items: [{productId: productId, quantity: quantity}],
        total: total,
        status: "pending"
      });
    }
    
    db.orders.insertMany(orders);
    print("✓ Generated " + count + " test orders");
    return orders.map(o => o._id);
  }
});

// Function to simulate high load
print("Creating load simulation function...");
db.system.js.save({
  _id: "simulateLoad", 
  value: function(duration) {
    duration = duration || 60; // seconds
    print("Simulating load for " + duration + " seconds...");
    
    var startTime = Date.now();
    var operations = 0;
    
    while ((Date.now() - startTime) < duration * 1000) {
      // Random operations
      var operation = Math.floor(Math.random() * 4);
      
      switch(operation) {
        case 0: // Insert notification
          db.notifications.insertOne({
            userId: "load_test_user",
            type: "load_test",
            message: "Load test notification " + operations,
            timestamp: new Date(),
            read: false
          });
          break;
          
        case 1: // Update product stock
          var productId = "prod" + (Math.floor(Math.random() * 5) + 1);
          db.products.updateOne(
            {_id: productId},
            {$inc: {stock: Math.floor(Math.random() * 10) - 5}}
          );
          break;
          
        case 2: // Query orders
          db.orders.find({status: "pending"}).limit(10).toArray();
          break;
          
        case 3: // Update customer
          var custId = "cust" + (Math.floor(Math.random() * 4) + 1);
          db.customers.updateOne(
            {_id: custId},
            {$set: {lastActivity: new Date()}}
          );
          break;
      }
      
      operations++;
      if (operations % 100 === 0) {
        print("  Performed " + operations + " operations...");
      }
    }
    
    print("✓ Load simulation complete. Total operations: " + operations);
    
    // Cleanup load test data
    db.notifications.deleteMany({type: "load_test"});
    db.customers.updateMany({}, {$unset: {lastActivity: 1}});
    
    return operations;
  }
});

print("✓ Created utility functions");

// ===========================================
// Final Setup and Validation
// ===========================================

print("\n🎯 Final validation and summary");
print("===============================");

// Validate data counts
var validation = {
  products: db.products.countDocuments(),
  customers: db.customers.countDocuments(), 
  users: db.users.countDocuments(),
  orders: db.orders.countDocuments(),
  stores: db.stores.countDocuments(),
  notifications: db.notifications.countDocuments(),
  daily_stats: db.daily_stats.countDocuments(),
  product_categories: db.product_categories.countDocuments()
};

print("Data validation:");
print("- Products: " + validation.products);
print("- Customers: " + validation.customers);
print("- Users: " + validation.users);
print("- Orders: " + validation.orders);
print("- Stores: " + validation.stores);
print("- Notifications: " + validation.notifications);
print("- Daily Stats: " + validation.daily_stats);
print("- Product Categories: " + validation.product_categories);

// Check indexes
print("\nIndex validation:");
var collections = ["products", "customers", "orders", "users", "stores", "notifications", "activity_log"];
collections.forEach(function(coll) {
  var indexes = db.getCollection(coll).getIndexes();
  print("- " + coll + ": " + indexes.length + " indexes");
});

print("\n=======================================================");
print("✅ DATA GENERATION COMPLETE!");
print("=======================================================");
print("All test data for MongoDB Day 3 labs has been created.");
print("");
print("Available utility functions:");
print("- resetLabData(): Reset all data to initial state");
print("- generateTestOrders(count): Generate additional test orders");
print("- simulateLoad(seconds): Simulate database load");
print("");
print("Usage: db.eval(resetLabData) or db.loadServerScripts(); resetLabData()");
print("=======================================================");

// Final memory cleanup
gc();