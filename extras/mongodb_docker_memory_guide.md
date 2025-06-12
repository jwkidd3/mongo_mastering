# MongoDB Docker Memory Management Guide
## For MongoDB Mastering Course - Production-Ready Configuration

---

## Overview

This guide addresses the critical memory management challenges when running MongoDB in Docker containers, ensuring optimal performance for your MongoDB mastering course. The key issue is that MongoDB doesn't automatically respect Docker memory limits and can consume all available host memory if not properly configured.

---

## The Problem: MongoDB Memory Behavior in Docker

### Why MongoDB Consumes Excessive Memory

MongoDB processes running in containers believe they have access to all host memory because Docker doesn't virtualize memory. This leads to several issues:

1. **WiredTiger Cache Misconfiguration**: By default, WiredTiger uses 50% of total system memory minus 1GB, or 256MB minimum
2. **Container Memory Limits Ignored**: MongoDB reports seeing all host memory even when Docker limits are set
3. **System Instability**: Containers can crash when MongoDB consumes all available memory

### Modern MongoDB Improvements

MongoDB versions 3.6.13+ and 4.0.9+ now respect container memory limits for WiredTiger cache calculations, but manual configuration is still recommended for optimal performance.

---

## Solution 1: Docker Compose Configuration

### Basic Memory-Limited Setup

```yaml
# docker-compose.yml for MongoDB course
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb-course
    restart: unless-stopped
    
    # Memory Management
    mem_limit: 2g
    mem_reservation: 1g
    
    # Security
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: coursePassword123
      MONGO_INITDB_DATABASE: admin
    
    # Network
    ports:
      - "27017:27017"
    
    # Persistence
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./custom-mongod.conf:/etc/mongod.conf:ro
    
    # Custom configuration
    command: ["mongod", "--config", "/etc/mongod.conf"]
    
    # Health check
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 10s
      retries: 5
      start_period: 40s

volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
```

### Docker Compose for Maximum In-Memory Performance

```yaml
# docker-compose.yml - OPTIMIZED FOR KEEPING DATA IN MEMORY
version: '3.8'
services:
  mongodb-memory-optimized:
    image: mongo:7.0
    container_name: mongodb-course-memory
    restart: unless-stopped
    
    # MEMORY CONFIGURATION - Allocate maximum available memory
    mem_limit: 4g          # Total container memory
    mem_reservation: 3g    # Reserved memory
    memswap_limit: 4g      # Prevent swap usage
    
    # DISABLE SWAP completely for pure in-memory performance
    sysctls:
      - vm.swappiness=1
    
    # Security
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: coursePassword123
      MONGO_INITDB_DATABASE: coursedb
    
    # Network
    ports:
      - "27017:27017"
    
    # MEMORY-OPTIMIZED VOLUMES
    volumes:
      # Use tmpfs for maximum speed (data in RAM)
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 1G
      
      # Persistent data (but optimized for memory caching)
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./memory-optimized-mongod.conf:/etc/mongod.conf:ro
    
    # Custom configuration for memory optimization
    command: [
      "mongod", 
      "--config", "/etc/mongod.conf",
      "--wiredTigerCacheSizeGB", "2.8",      # 70% of 4GB container
      "--wiredTigerCollectionBlockCompressor", "snappy",
      "--wiredTigerJournalCompressor", "none"
    ]
    
    # Health check
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s

  # MongoDB Express for course monitoring
  mongo-express:
    image: mongo-express:latest
    container_name: mongo-express-course
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: coursePassword123
      ME_CONFIG_MONGODB_URL: mongodb://admin:coursePassword123@mongodb-memory-optimized:27017/
      ME_CONFIG_BASICAUTH_USERNAME: course
      ME_CONFIG_BASICAUTH_PASSWORD: student123
    depends_on:
      - mongodb-memory-optimized
    mem_limit: 512m

volumes:
  mongodb_data:
    driver: local
    driver_opts:
      # Optimize volume for performance
      type: none
      o: bind
      device: /opt/mongodb-course/data
  mongodb_config:
    driver: local

networks:
  default:
    driver: bridge
```

---

## Solution 3: Advanced Memory Configuration Techniques

### Method 1: Dynamic Cache Sizing Based on Available Memory

Create a startup script that calculates optimal cache size:

```bash
#!/bin/bash
# dynamic-mongo-start.sh

# Get container memory limit in bytes
CONTAINER_MEMORY=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "0")

# Convert to GB and calculate 70% for cache
if [ "$CONTAINER_MEMORY" != "0" ] && [ "$CONTAINER_MEMORY" -lt "9223372036854775807" ]; then
    MEMORY_GB=$((CONTAINER_MEMORY / 1024 / 1024 / 1024))
    CACHE_SIZE_GB=$((MEMORY_GB * 70 / 100))
    
    echo "Container Memory: ${MEMORY_GB}GB"
    echo "WiredTiger Cache: ${CACHE_SIZE_GB}GB"
    
    # Start MongoDB with calculated cache size
    exec mongod --config /etc/mongod.conf --wiredTigerCacheSizeGB $CACHE_SIZE_GB
else
    echo "Using default cache configuration"
    exec mongod --config /etc/mongod.conf
fi
```

### Method 2: Memory-Mapped Files Optimization

```yaml
# In docker-compose.yml, add volume optimizations
volumes:
  # Use memory-backed storage for ultimate performance
  - type: tmpfs
    target: /data/db/journal
    tmpfs:
      size: 512M
  
  # Bind mount with optimized options
  - type: bind
    source: /dev/shm/mongodb
    target: /data/db
    bind:
      create_host_path: true
```

---

## Solution 4: Memory Monitoring and Tuning

### Real-Time Memory Monitoring Script

```bash
#!/bin/bash
# mongo-memory-monitor.sh - Monitor MongoDB memory usage in real-time

echo "MongoDB Memory Usage Monitor"
echo "============================="

while true; do
    # Container memory usage
    CONTAINER_MEMORY=$(docker stats mongodb-course-memory --no-stream --format "table {{.MemUsage}}")
    
    # MongoDB cache statistics
    MONGO_STATS=$(docker exec mongodb-course-memory mongosh --quiet --eval "
        const stats = db.serverStatus().wiredTiger.cache;
        print('WiredTiger Cache Stats:');
        print('- Current: ' + Math.round(stats['bytes currently in the cache'] / 1024 / 1024) + 'MB');
        print('- Maximum: ' + Math.round(stats['maximum bytes configured'] / 1024 / 1024) + 'MB');
        print('- Dirty: ' + Math.round(stats['tracked dirty bytes in the cache'] / 1024 / 1024) + 'MB');
        print('- Read Efficiency: ' + (100 - (stats['pages read into cache'] / (stats['pages read into cache'] + stats['pages requested from the cache']) * 100)).toFixed(2) + '%');
    ")
    
    clear
    echo "Container Memory: $CONTAINER_MEMORY"
    echo "$MONGO_STATS"
    echo "Updated: $(date)"
    echo "Press Ctrl+C to stop monitoring"
    
    sleep 5
done
```

### MongoDB Shell Commands for Memory Analysis

```javascript
// Check current memory configuration and usage
db.serverStatus().host
db.serverStatus().mem
db.serverStatus().wiredTiger.cache

// Analyze working set efficiency
db.runCommand({serverStatus: 1}).wiredTiger.cache

// Check if data fits in memory
function analyzeMemoryEfficiency() {
    const serverStatus = db.serverStatus();
    const cache = serverStatus.wiredTiger.cache;
    
    const currentCacheMB = Math.round(cache['bytes currently in the cache'] / 1024 / 1024);
    const maxCacheMB = Math.round(cache['maximum bytes configured'] / 1024 / 1024);
    const dirtyMB = Math.round(cache['tracked dirty bytes in the cache'] / 1024 / 1024);
    
    const cacheUtilization = (currentCacheMB / maxCacheMB * 100).toFixed(2);
    const pagesRead = cache['pages read into cache'];
    const pagesRequested = cache['pages requested from the cache'];
    const hitRatio = ((pagesRequested - pagesRead) / pagesRequested * 100).toFixed(2);
    
    print('=== Memory Efficiency Analysis ===');
    print(`Cache Utilization: ${cacheUtilization}% (${currentCacheMB}MB / ${maxCacheMB}MB)`);
    print(`Dirty Data: ${dirtyMB}MB`);
    print(`Cache Hit Ratio: ${hitRatio}%`);
    print(`Pages Read from Disk: ${pagesRead.toLocaleString()}`);
    
    if (hitRatio < 95) {
        print('⚠️  WARNING: Low cache hit ratio - consider increasing cache size');
    }
    if (cacheUtilization > 95) {
        print('⚠️  WARNING: Cache nearly full - monitor for evictions');
    }
    if (hitRatio > 98 && cacheUtilization < 80) {
        print('✅ OPTIMAL: Working set fits comfortably in memory');
    }
}

// Run the analysis
analyzeMemoryEfficiency();
```

---

## Solution 5: Course-Specific Memory Optimization

### Pre-load Course Data into Memory

```javascript
// course-data-preload.js - Ensure all course data stays in memory

// Connect to course database
use coursedb;

// Function to touch all collections to load into cache
function preloadCourseData() {
    print('Preloading course data into memory...');
    
    const collections = db.runCommand("listCollections").cursor.firstBatch;
    
    collections.forEach(col => {
        const collName = col.name;
        print(`Loading ${collName}...`);
        
        // Touch every document to ensure it's in cache
        db[collName].find().forEach(() => {});
        
        // Load all indexes
        db[collName].getIndexes().forEach(index => {
            print(`  - Index: ${index.name}`);
        });
        
        const stats = db[collName].stats();
        print(`  - Documents: ${stats.count}, Size: ${Math.round(stats.size / 1024)}KB`);
    });
    
    print('Preload complete!');
}

// Execute preload
preloadCourseData();

// Verify data is in cache
function verifyCacheStatus() {
    const cache = db.serverStatus().wiredTiger.cache;
    const currentMB = Math.round(cache['bytes currently in the cache'] / 1024 / 1024);
    const maxMB = Math.round(cache['maximum bytes configured'] / 1024 / 1024);
    
    print(`\nCache Status: ${currentMB}MB / ${maxMB}MB used`);
    
    if (currentMB / maxMB > 0.8) {
        print('✅ Good: Course data loaded in cache');
    } else {
        print('⚠️  Cache utilization low - data may not be fully loaded');
    }
}

verifyCacheStatus();
```

### Memory-Optimized Course Collections

```javascript
// Create collections optimized for in-memory operations
use coursedb;

// Products collection with memory-optimized settings
db.createCollection("products", {
    storageEngine: {
        wiredTiger: {
            configString: "memory_page_max=32KB,leaf_page_max=32KB"
        }
    }
});

// Create indexes immediately to load them into memory
db.products.createIndex({category: 1, price: 1});
db.products.createIndex({name: "text"});
db.products.createIndex({tags: 1});

// Orders collection with optimized storage
db.createCollection("orders", {
    storageEngine: {
        wiredTiger: {
            configString: "memory_page_max=32KB,internal_page_max=16KB"
        }
    }
});

db.orders.createIndex({customerId: 1, orderDate: -1});
db.orders.createIndex({status: 1});

// Users collection
db.createCollection("users", {
    storageEngine: {
        wiredTiger: {
            configString: "memory_page_max=16KB"
        }
    }
});

db.users.createIndex({email: 1}, {unique: true});
```

---

## Solution 6: Performance Verification

### Course Lab: Memory Performance Testing

```javascript
// Lab exercise: Test query performance with data in memory

// 1. Generate test data
function generateCourseData() {
    print('Generating course test data...');
    
    const products = [];
    const categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports'];
    
    for (let i = 0; i < 10000; i++) {
        products.push({
            _id: ObjectId(),
            name: `Product ${i}`,
            category: categories[i % 5],
            price: Math.random() * 1000,
            inStock: Math.random() > 0.3,
            tags: [`tag${i % 10}`, `tag${i % 20}`],
            description: `Description for product ${i}`.repeat(10), // Make docs larger
            specs: {
                weight: Math.random() * 10,
                dimensions: [Math.random() * 100, Math.random() * 100, Math.random() * 100]
            },
            createdAt: new Date()
        });
    }
    
    db.products.insertMany(products);
    print(`Inserted ${products.length} products`);
}

// 2. Performance test function
function testQueryPerformance() {
    print('\n=== Query Performance Test ===');
    
    // Test 1: Category queries (should be fast with index)
    const start1 = Date.now();
    const electronics = db.products.find({category: "Electronics"}).toArray();
    const time1 = Date.now() - start1;
    print(`Category query: ${electronics.length} docs in ${time1}ms`);
    
    // Test 2: Complex aggregation
    const start2 = Date.now();
    const categoryStats = db.products.aggregate([
        {$group: {_id: "$category", avgPrice: {$avg: "$price"}, count: {$sum: 1}}},
        {$sort: {avgPrice: -1}}
    ]).toArray();
    const time2 = Date.now() - start2;
    print(`Aggregation: ${categoryStats.length} groups in ${time2}ms`);
    
    // Test 3: Text search
    const start3 = Date.now();
    const searchResults = db.products.find({$text: {$search: "product"}}).limit(100).toArray();
    const time3 = Date.now() - start3;
    print(`Text search: ${searchResults.length} docs in ${time3}ms`);
    
    // Performance analysis
    if (time1 < 50 && time2 < 100 && time3 < 100) {
        print('✅ EXCELLENT: All queries performing optimally in memory');
    } else {
        print('⚠️  Some queries may be hitting disk - check cache configuration');
    }
}

// 3. Execute tests
generateCourseData();
testQueryPerformance();
```

---

## Best Practices for Course Environment

### 1. Container Sizing Guidelines

| Course Phase | Container Memory | Cache Size | Use Case |
|--------------|------------------|------------|----------|
| Day 1-2 (Basics) | 2GB | 1.4GB | Small datasets, basic operations |
| Day 3 (Advanced) | 4GB | 2.8GB | Aggregations, complex queries |
| Production Labs | 8GB | 5.6GB | Real-world scenarios |

### 2. Memory Monitoring Commands

```bash
# Check container memory usage
docker stats mongodb-course-memory --no-stream

# Monitor MongoDB memory specifically
docker exec mongodb-course-memory mongosh --eval "db.serverStatus().mem"

# Watch cache hit ratio
docker exec mongodb-course-memory mongosh --eval "
setInterval(() => {
    const cache = db.serverStatus().wiredTiger.cache;
    const hitRatio = ((cache['pages requested from the cache'] - cache['pages read into cache']) / cache['pages requested from the cache'] * 100).toFixed(2);
    print(\`\${new Date().toLocaleTimeString()} - Cache Hit Ratio: \${hitRatio}%\`);
}, 5000);
"
```

### 3. Troubleshooting Memory Issues

**Symptom: Container OOM (Out of Memory)**
```bash
# Check if swap is disabled
docker exec mongodb-course-memory cat /proc/meminfo | grep Swap

# Verify cache configuration
docker exec mongodb-course-memory mongosh --eval "db.serverStatus().wiredTiger.cache['maximum bytes configured']"
```

**Symptom: Poor Query Performance**
```javascript
// Check if data is being read from disk
db.serverStatus().wiredTiger.cache['pages read into cache']

// Compare with total requests
db.serverStatus().wiredTiger.cache['pages requested from the cache']
```

**Symptom: Cache Evictions**
```javascript
// Monitor evictions
db.serverStatus().wiredTiger.cache['pages written from cache']
db.serverStatus().wiredTiger.cache['eviction worker thread evicting pages']
```

---

## Conclusion

This memory-optimized configuration ensures that:

1. **Course data remains in memory** for fast access during labs
2. **Container memory limits are respected** preventing system crashes
3. **WiredTiger cache is maximized** for optimal performance
4. **Students can focus on learning** without performance issues

The configuration scales from basic course needs (2GB) to production scenarios (8GB+), providing a realistic learning environment while maintaining system stability.

### Optimized mongod.conf

Create `custom-mongod.conf` for your course environment:

```yaml
# MongoDB Configuration for Course Environment
# OPTIMIZED FOR KEEPING DATA IN MEMORY

# Network interfaces
net:
  port: 27017
  bindIp: 0.0.0.0
  maxIncomingConnections: 100

# Security
security:
  authorization: enabled

# Storage Engine Configuration - MEMORY OPTIMIZED
storage:
  dbPath: /data/db
  journal:
    enabled: true
    # Reduce journal commit interval for better memory efficiency
    commitIntervalMs: 100
  
  # WiredTiger Storage Engine - MAXIMUM MEMORY UTILIZATION
  wiredTiger:
    engineConfig:
      # CRITICAL: Set cache to 70% of container memory for maximum in-memory performance
      # For 4GB container = 2.8GB cache, 2GB container = 1.4GB cache
      cacheSizeGB: 2.8
      
      # Memory-optimized settings
      journalCompressor: none  # Faster, uses more memory but better performance
      directoryForIndexes: false
      
      # Cache configuration for keeping data in memory
      configString: "cache_size=2G,eviction_trigger=95,eviction_target=80,eviction_dirty_trigger=20"
      
    collectionConfig:
      # Use less compression to favor speed over storage
      blockCompressor: snappy
      
    indexConfig:
      # Keep index structures optimized for memory
      prefixCompression: true

# Operation Profiling
operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 50  # Lower threshold to catch any disk operations

# MEMORY OPTIMIZATION PARAMETERS
setParameter:
  # Index builds - keep in memory as much as possible
  maxIndexBuildMemoryUsageMegabytes: 500
  
  # Connection pooling for memory efficiency
  connPoolMaxShardedConnsPerHost: 200
  connPoolMaxConnsPerHost: 200
  
  # Query execution in memory
  internalQueryExecMaxBlockingSortBytes: 104857600  # 100MB for in-memory sorts
  
  # Cursor timeout - keep frequently accessed cursors in memory longer
  cursorTimeoutMillis: 600000  # 10 minutes
  
  # WiredTiger specific memory settings
  wiredTigerConcurrentReadTransactions: 128
  wiredTigerConcurrentWriteTransactions: 128