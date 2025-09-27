// ===== CONNECTION TEST SCRIPT =====
// MongoDB Connection and Write Test
// Usage: mongosh < test_connection.js
// Purpose: Verify replica set works before loading full data

print("=======================================================");
print("MongoDB Connection and Write Test");
print("=======================================================");

// Check connection
print("🔗 Testing connection...");
try {
  var result = db.hello();
  print("✅ Connected to MongoDB: " + result.isWritablePrimary);
} catch (e) {
  print("❌ Connection failed: " + e);
  quit(1);
}

// Check replica set status
print("\n🔧 Checking replica set status...");
try {
  var rsStatus = rs.status();
  print("✅ Replica set: " + rsStatus.set);
  print("   Members: " + rsStatus.members.length);
  rsStatus.members.forEach(function(member) {
    print("   - " + member.name + ": " + member.stateStr);
  });
} catch (e) {
  print("⚠️  Replica set check: " + e);
}

// Set conservative write concern
print("\n⚙️  Setting conservative write concern...");
try {
  db.adminCommand({
    setDefaultRWConcern: 1,
    defaultWriteConcern: { w: 1, wtimeout: 5000 }
  });
  print("✅ Write concern set successfully");
} catch (e) {
  print("⚠️  Write concern warning: " + e);
}

// Test database operations
print("\n📝 Testing write operations...");
use test_connection;

// Test simple insert
try {
  var insertResult = db.test.insertOne({
    test: "connection",
    timestamp: new Date(),
    message: "If you see this, writes are working!"
  });
  print("✅ Insert test: " + insertResult.acknowledged);
} catch (e) {
  print("❌ Insert failed: " + e);
  quit(1);
}

// Test read
try {
  var doc = db.test.findOne();
  print("✅ Read test: " + doc.message);
} catch (e) {
  print("❌ Read failed: " + e);
  quit(1);
}

// Cleanup
db.test.drop();

print("\n=======================================================");
print("✅ ALL TESTS PASSED - MongoDB setup is working!");
print("=======================================================");
print("You can now run the data loading scripts:");
print("mongosh < day1_data_loader.js");
print("=======================================================");