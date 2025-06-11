# MongoDB Profiling: Complete Discussion and Guide

A comprehensive discussion of MongoDB profiling, its implementation, use cases, and best practices for performance optimization.

## What is MongoDB Profiling?

MongoDB profiling is a database performance monitoring feature that captures detailed information about database operations. It records execution statistics for operations that meet specified criteria, helping developers and administrators identify performance bottlenecks and optimize database operations.

### Core Concepts

**The Database Profiler** is MongoDB's built-in performance monitoring tool that:
- Captures detailed operation statistics
- Stores profiling data in a special capped collection (`system.profile`)
- Provides insights into query performance, resource usage, and execution patterns
- Helps identify slow operations and optimization opportunities

## Profiling Modes

MongoDB offers three profiling modes:

### 1. Off Mode (mode: 0)
```javascript
// Disable profiling
db.setProfilingLevel(0)

// Configuration
operationProfiling:
  mode: off
```
- **Default state** - No profiling data collected
- **Lowest overhead** - No performance impact
- **Use when:** Production systems where profiling overhead is a concern

### 2. Slow Operations Mode (mode: 1)
```javascript
// Profile only slow operations (default: >100ms)
db.setProfilingLevel(1)

// Profile operations slower than 50ms
db.setProfilingLevel(1, { slowms: 50 })

// Configuration
operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100
```
- **Most common mode** for production monitoring
- **Captures operations** exceeding the slow operation threshold
- **Minimal overhead** while providing valuable insights
- **Customizable threshold** based on application requirements

### 3. All Operations Mode (mode: 2)
```javascript
// Profile all operations
db.setProfilingLevel(2)

// With sampling (profile 10% of operations)
db.setProfilingLevel(2, { sampleRate: 0.1 })

// Configuration
operationProfiling:
  mode: all
  slowOpSampleRate: 0.1
```
- **Captures every operation** - provides complete picture
- **Highest overhead** - can significantly impact performance
- **Use sparingly** - typically for debugging specific issues
- **Sampling recommended** to reduce overhead

## Setting Up Profiling

### Command Line Configuration

```javascript
// Check current profiling level
db.getProfilingLevel()
db.getProfilingStatus()

// Set profiling level with options
db.setProfilingLevel(1, {
  slowms: 50,           // Threshold in milliseconds
  sampleRate: 0.5       // Sample 50% of operations
})

// Enable profiling for specific operations
db.setProfilingLevel(1, {
  slowms: 0,            // Capture all operations
  filter: {
    op: { $in: ["insert", "update", "delete"] }
  }
})
```

### Configuration File Setup

```yaml
# mongod.conf
operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100
  slowOpSampleRate: 1.0
```

### Container Example

```bash
# Run MongoDB container with profiling enabled
docker run -d \
  --name mongodb-profiled \
  -p 27017:27017 \
  -v $(pwd)/config/mongod.conf:/etc/mongod.conf:ro \
  -v $(pwd)/data:/data/db \
  mongo:7.0 mongod --config /etc/mongod.conf
```

## Understanding Profiling Data

### Profile Collection Structure

The `system.profile` collection stores profiling data with the following key fields:

```javascript
// Example profile document
{
  "op": "query",                          // Operation type
  "ns": "myapp.users",                    // Namespace (database.collection)
  "command": {                            // Command details
    "find": "users",
    "filter": { "age": { "$gt": 25 } },
    "sort": { "name": 1 },
    "limit": 10
  },
  "keysExamined": 1000,                   // Index keys examined
  "docsExamined": 500,                    // Documents examined
  "nreturned": 10,                        // Documents returned
  "responseLength": 1024,                 // Response size in bytes
  "millis": 150,                          // Execution time in milliseconds
  "execStats": {                          // Detailed execution statistics
    "stage": "IXSCAN",
    "nReturned": 10,
    "executionTimeMillisEstimate": 145
  },
  "ts": ISODate("2024-01-15T10:30:00Z"), // Timestamp
  "client": "192.168.1.100",              // Client IP
  "user": "appuser@myapp",                // User information
  "allUsers": [{"user": "appuser", "db": "myapp"}]
}
```

### Key Performance Metrics

1. **Execution Time (`millis`)**
   - Total time spent executing the operation
   - Primary indicator of operation performance

2. **Documents Examined (`docsExamined`)**
   - Number of documents MongoDB had to examine
   - High values may indicate missing indexes

3. **Keys Examined (`keysExamined`)**
   - Number of index keys examined
   - Helps evaluate index effectiveness

4. **Documents Returned (`nreturned`)**
   - Number of documents returned to client
   - Compare with `docsExamined` for efficiency ratio

5. **Response Length (`responseLength`)**
   - Size of the response in bytes
   - Important for network performance analysis

## Analyzing Profiling Data

### Basic Queries

```javascript
// View recent slow operations
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty()

// Find operations slower than 500ms
db.system.profile.find({ millis: { $gt: 500 } })

// Find operations on specific collection
db.system.profile.find({ ns: "myapp.users" })

// Find operations by type
db.system.profile.find({ op: "query" })
db.system.profile.find({ op: "insert" })
db.system.profile.find({ op: "update" })
```

### Advanced Analysis Queries

```javascript
// Slowest operations in the last hour
db.system.profile.find({
  ts: { $gte: new Date(Date.now() - 3600000) }
}).sort({ millis: -1 }).limit(10)

// Operations with poor index efficiency
db.system.profile.find({
  $expr: {
    $gt: [
      { $divide: ["$docsExamined", "$nreturned"] },
      10  // More than 10 docs examined per result
    ]
  }
})

// High network traffic operations
db.system.profile.find({
  responseLength: { $gt: 1000000 }  // >1MB responses
}).sort({ responseLength: -1 })

// Aggregation for operation statistics
db.system.profile.aggregate([
  {
    $group: {
      _id: "$op",
      count: { $sum: 1 },
      avgTime: { $avg: "$millis" },
      maxTime: { $max: "$millis" },
      totalTime: { $sum: "$millis" }
    }
  },
  { $sort: { avgTime: -1 } }
])
```

### Collection-Specific Analysis

```javascript
// Analyze specific collection performance
db.system.profile.aggregate([
  { $match: { ns: "myapp.orders" } },
  {
    $group: {
      _id: {
        operation: "$op",
        collection: "$ns"
      },
      count: { $sum: 1 },
      avgExecutionTime: { $avg: "$millis" },
      avgDocsExamined: { $avg: "$docsExamined" },
      avgDocsReturned: { $avg: "$nreturned" }
    }
  },
  {
    $addFields: {
      efficiency: {
        $cond: {
          if: { $eq: ["$avgDocsReturned", 0] },
          then: 0,
          else: { $divide: ["$avgDocsExamined", "$avgDocsReturned"] }
        }
      }
    }
  },
  { $sort: { efficiency: -1 } }
])
```

## Profiling in Different Environments

### Development Environment

```javascript
// Aggressive profiling for development
db.setProfilingLevel(2, {
  sampleRate: 1.0,  // Profile all operations
  slowms: 0         // Capture everything
})

// Focus on specific operations during development
db.setProfilingLevel(1, {
  slowms: 10,  // Very low threshold
  filter: {
    "command.find": { $exists: true }  // Only profile find operations
  }
})
```

**Development Configuration:**
```yaml
operationProfiling:
  mode: all
  slowOpThresholdMs: 0
  slowOpSampleRate: 1.0
```

### Production Environment

```javascript
// Conservative profiling for production
db.setProfilingLevel(1, {
  slowms: 100,      // Only operations >100ms
  sampleRate: 0.1   // Sample 10% to reduce overhead
})

// Focus on performance-critical operations
db.setProfilingLevel(1, {
  slowms: 200,
  filter: {
    $or: [
      { op: "insert" },
      { op: "update" },
      { op: "delete" },
      { "command.aggregate": { $exists: true } }
    ]
  }
})
```

**Production Configuration:**
```yaml
operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100
  slowOpSampleRate: 0.1
```

### Staging Environment

```javascript
// Balanced profiling for staging
db.setProfilingLevel(1, {
  slowms: 50,       // Moderate threshold
  sampleRate: 0.5   // Sample 50% of operations
})
```

## Performance Impact and Considerations

### Overhead Analysis

| Profiling Mode | CPU Overhead | Disk I/O | Memory Usage | Recommended Use |
|----------------|--------------|----------|--------------|-----------------|
| Off (0) | None | None | None | Production (monitoring disabled) |
| Slow Ops (1) | ~1-5% | Low | Low | Production (recommended) |
| All Ops (2) | ~10-30% | High | High | Development/Debugging only |

### Managing Profiling Overhead

```javascript
// Use sampling to reduce overhead
db.setProfilingLevel(2, { sampleRate: 0.01 })  // 1% sampling

// Profile specific operations only
db.setProfilingLevel(1, {
  slowms: 0,
  filter: {
    "command.find": { $exists: true },
    "command.find": { $ne: "system.profile" }  // Exclude profile queries
  }
})

// Temporary profiling for specific time windows
// Enable profiling
db.setProfilingLevel(2, { sampleRate: 0.1 })

// Run your operations or tests

// Disable profiling
db.setProfilingLevel(0)
```

### Profile Collection Management

```javascript
// Check profile collection size
db.system.profile.stats()

// Profile collection is capped - check current size
db.runCommand({ collStats: "system.profile" })

// Create custom-sized profile collection
db.setProfilingLevel(0)
db.system.profile.drop()
db.createCollection("system.profile", {
  capped: true,
  size: 64000000,  // 64MB
  max: 100000      // Maximum 100,000 documents
})
db.setProfilingLevel(1)
```

## Practical Use Cases

### 1. Query Optimization

```javascript
// Identify queries scanning too many documents
db.system.profile.find({
  op: "query",
  $expr: {
    $and: [
      { $gt: ["$docsExamined", 1000] },
      { $gt: [{ $divide: ["$docsExamined", "$nreturned"] }, 10] }
    ]
  }
}).sort({ docsExamined: -1 })

// Find queries that would benefit from indexes
db.system.profile.find({
  "execStats.stage": "COLLSCAN",  // Collection scan
  millis: { $gt: 100 }
})
```

### 2. Index Effectiveness Analysis

```javascript
// Analyze index usage patterns
db.system.profile.aggregate([
  { $match: { op: "query" } },
  {
    $group: {
      _id: {
        collection: "$ns",
        indexUsed: "$execStats.indexName"
      },
      count: { $sum: 1 },
      avgTime: { $avg: "$millis" },
      avgKeysExamined: { $avg: "$keysExamined" }
    }
  },
  { $sort: { count: -1 } }
])
```

### 3. Resource Usage Monitoring

```javascript
// Monitor memory-intensive operations
db.system.profile.find({
  "execStats.memUsage": { $exists: true },
  "execStats.memUsage": { $gt: 100000 }  // >100KB memory usage
})

// Track network-heavy operations
db.system.profile.find({
  responseLength: { $gt: 1000000 }  // >1MB responses
}).sort({ responseLength: -1 })
```

### 4. Application Performance Monitoring

```javascript
// Monitor specific application patterns
db.system.profile.find({
  "command.comment": /user-dashboard/,  // Operations with specific comments
  millis: { $gt: 200 }
})

// Track operations by client/user
db.system.profile.aggregate([
  {
    $group: {
      _id: "$client",
      operationCount: { $sum: 1 },
      avgResponseTime: { $avg: "$millis" },
      slowOperations: {
        $sum: { $cond: [{ $gt: ["$millis", 500] }, 1, 0] }
      }
    }
  },
  { $sort: { operationCount: -1 } }
])
```

## Integration with Monitoring Tools

### MongoDB Compass Integration

```javascript
// Compass automatically shows profiling data in:
// - Performance tab
// - Real-time performance metrics
// - Query performance insights

// Enable profiling for Compass monitoring
db.setProfilingLevel(1, { slowms: 100 })
```

### Custom Monitoring Scripts

```javascript
// Script to monitor and alert on slow operations
function checkSlowOperations() {
  const recentSlowOps = db.system.profile.find({
    ts: { $gte: new Date(Date.now() - 300000) }, // Last 5 minutes
    millis: { $gt: 1000 }  // >1 second
  }).count();
  
  if (recentSlowOps > 10) {
    print(`ALERT: ${recentSlowOps} slow operations in the last 5 minutes`);
  }
  
  return recentSlowOps;
}

// Run monitoring check
checkSlowOperations();
```

### Automated Profiling Management

```javascript
// Function to enable temporary profiling
function temporaryProfiling(durationMinutes, threshold = 100) {
  // Enable profiling
  db.setProfilingLevel(1, { slowms: threshold });
  print(`Profiling enabled for ${durationMinutes} minutes`);
  
  // Set timeout to disable profiling
  setTimeout(() => {
    db.setProfilingLevel(0);
    print("Profiling disabled");
  }, durationMinutes * 60 * 1000);
}

// Enable profiling for 30 minutes
temporaryProfiling(30, 50);
```

## Best Practices

### 1. Profiling Strategy

- **Start with slow operation profiling** in production
- **Use sampling** for high-traffic databases
- **Profile specific time windows** during peak usage
- **Combine with application-level monitoring**
- **Regular analysis** of profiling data

### 2. Threshold Configuration

```javascript
// Conservative production settings
db.setProfilingLevel(1, {
  slowms: 100,      // Adjust based on SLA requirements
  sampleRate: 0.1   // 10% sampling for high-volume systems
})

// Development settings for thorough analysis
db.setProfilingLevel(1, {
  slowms: 10,       // Catch more operations
  sampleRate: 1.0   // Full sampling acceptable in dev
})
```

### 3. Profile Collection Sizing

```javascript
// Size profile collection based on retention needs
db.setProfilingLevel(0)
db.system.profile.drop()

// Create appropriately sized collection
db.createCollection("system.profile", {
  capped: true,
  size: 128000000,  // 128MB for busy systems
  max: 500000       // Retain last 500,000 operations
})

db.setProfilingLevel(1)
```

### 4. Regular Maintenance

```javascript
// Periodic profiling data analysis script
function weeklyProfilingReport() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Slowest operations
  print("=== SLOWEST OPERATIONS ===");
  db.system.profile.find({
    ts: { $gte: oneWeekAgo }
  }).sort({ millis: -1 }).limit(10).forEach(printjson);
  
  // Most frequent slow operations
  print("\n=== MOST FREQUENT SLOW OPERATIONS ===");
  db.system.profile.aggregate([
    { $match: { ts: { $gte: oneWeekAgo } } },
    {
      $group: {
        _id: {
          operation: "$op",
          collection: "$ns"
        },
        count: { $sum: 1 },
        avgTime: { $avg: "$millis" }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).forEach(printjson);
}

// Run weekly report
weeklyProfilingReport();
```

## Troubleshooting Common Issues

### 1. High Profiling Overhead

```javascript
// Reduce overhead by adjusting settings
db.setProfilingLevel(1, {
  slowms: 200,      // Increase threshold
  sampleRate: 0.05  // Reduce sampling to 5%
})

// Or profile specific operations only
db.setProfilingLevel(1, {
  slowms: 100,
  filter: {
    op: { $in: ["update", "delete"] }  // Only write operations
  }
})
```

### 2. Profile Collection Full

```javascript
// Check if profile collection is full
db.system.profile.isCapped()
db.system.profile.stats()

// Increase profile collection size
db.setProfilingLevel(0)
db.system.profile.drop()
db.createCollection("system.profile", {
  capped: true,
  size: 256000000  // Increase to 256MB
})
db.setProfilingLevel(1)
```

### 3. Missing Expected Data

```javascript
// Verify profiling is active
db.getProfilingStatus()

// Check if operations meet threshold
db.setProfilingLevel(1, { slowms: 0 })  // Temporarily capture all

// Verify filters aren't too restrictive
db.setProfilingLevel(1, {
  slowms: 100
  // Remove filter temporarily
})
```

## Summary and Recommendations

### Key Takeaways

1. **Profiling is essential** for MongoDB performance optimization
2. **Start with slow operation profiling** (mode 1) in production
3. **Use sampling** to minimize overhead in high-traffic systems
4. **Regular analysis** of profiling data reveals optimization opportunities
5. **Combine with application monitoring** for complete performance picture

### Recommended Profiling Strategy

```javascript
// Production: Conservative approach
db.setProfilingLevel(1, {
  slowms: 100,
  sampleRate: 0.1
})

// Development: Comprehensive monitoring
db.setProfilingLevel(1, {
  slowms: 20,
  sampleRate: 1.0
})

// Debugging: Temporary intensive profiling
db.setProfilingLevel(2, {
  sampleRate: 0.1
})
// Remember to disable after debugging!
```

MongoDB profiling is a powerful tool that, when used correctly, provides invaluable insights into database performance and helps maintain optimal application performance.