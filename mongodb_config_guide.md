# MongoDB Configuration Guide for Containers

Complete guide to configuring MongoDB using `mongod.conf` in Docker containers.

## Overview

MongoDB configuration in containers involves:
1. Creating a `mongod.conf` file on the host
2. Mounting it into the container
3. Starting MongoDB with the config file
4. Verifying configuration is applied

## Basic Configuration Structure

### Standard mongod.conf Layout

```yaml
# mongod.conf - Complete configuration file

# Storage configuration
storage:
  dbPath: /data/db
  journal:
    enabled: true
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      directoryForIndexes: false
      cacheSizeGB: 1
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

# Network configuration
net:
  port: 27017
  bindIp: 0.0.0.0
  maxIncomingConnections: 65536
  wireObjectCheck: true
  ipv6: false

# Security configuration
security:
  authorization: enabled
  javascriptEnabled: true

# Logging configuration
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  logRotate: reopen
  verbosity: 0
  quiet: false
  component:
    accessControl:
      verbosity: 0
    command:
      verbosity: 0

# Process management
processManagement:
  fork: false  # Always false for containers
  pidFilePath: /var/run/mongodb/mongod.pid

# Replication (if using replica sets)
# replication:
#   replSetName: rs0

# Sharding (if using sharding)
# sharding:
#   clusterRole: configsvr

# Operation profiling
operationProfiling:
  mode: off
  slowOpThresholdMs: 100
```

## Configuration Categories

### 1. Storage Configuration

```yaml
storage:
  # Database path (must match container volume)
  dbPath: /data/db
  
  # Journal settings
  journal:
    enabled: true
    commitIntervalMs: 100
  
  # Storage engine
  engine: wiredTiger
  
  # WiredTiger specific settings
  wiredTiger:
    engineConfig:
      # Cache size (adjust based on container memory)
      cacheSizeGB: 1
      directoryForIndexes: false
      maxCacheOverflowFileSizeGB: 0
    collectionConfig:
      # Compression for collections
      blockCompressor: snappy  # Options: none, snappy, zlib, zstd
    indexConfig:
      # Index compression
      prefixCompression: true
  
  # Directory per database
  directoryPerDB: false
  
  # Sync delay for journal
  syncPeriodSecs: 60
```

### 2. Network Configuration

```yaml
net:
  # Port to bind to
  port: 27017
  
  # IP addresses to bind to (0.0.0.0 for container access)
  bindIp: 0.0.0.0
  
  # Maximum connections
  maxIncomingConnections: 65536
  
  # Wire protocol validation
  wireObjectCheck: true
  
  # IPv6 support
  ipv6: false
  
  # Unix domain socket
  unixDomainSocket:
    enabled: false
    pathPrefix: /tmp
    filePermissions: 0700
  
  # HTTP interface (deprecated, use MongoDB Compass)
  http:
    enabled: false
    JSONPEnabled: false
    RESTInterfaceEnabled: false
  
  # SSL/TLS configuration
  ssl:
    mode: requireSSL  # disabled, allowSSL, preferSSL, requireSSL
    PEMKeyFile: /etc/mongodb/ssl/mongodb.pem
    PEMKeyPassword: "password"  # If key is encrypted
    clusterFile: /etc/mongodb/ssl/cluster.pem
    CAFile: /etc/mongodb/ssl/ca.pem
    CRLFile: /etc/mongodb/ssl/crl.pem
    allowConnectionsWithoutCertificates: true
    allowInvalidCertificates: true
    allowInvalidHostnames: true
    disabledProtocols: TLS1_0,TLS1_1
```

### 3. Security Configuration

```yaml
security:
  # Enable authorization
  authorization: enabled
  
  # Enable JavaScript execution
  javascriptEnabled: true
  
  # Key file for replica set authentication
  keyFile: /etc/mongodb/keyfile
  
  # Cluster authentication mode
  clusterAuthMode: keyFile  # keyFile, sendKeyFile, sendX509, x509
  
  # LDAP configuration
  ldap:
    servers: "ldap.example.com"
    bind:
      method: simple
      saslMechanisms: PLAIN
      queryUser: "cn=mongoldap,ou=users,dc=example,dc=com"
      queryPassword: "password"
    transportSecurity: tls
    userToDNMapping: '[
      {
        match: "(.+)",
        ldapQuery: "ou=users,dc=example,dc=com??sub?(uid={0})"
      }
    ]'
  
  # SASL configuration
  sasl:
    hostName: "server.example.com"
    serviceName: "mongodb"
    saslauthdSocketPath: "/var/run/saslauthd"
  
  # Encryption at rest
  enableEncryption: true
  encryptionKeyFile: /etc/mongodb/keys/mongodb.key
  encryptionCipherMode: AES256-CBC
  
  # KMIP key management
  kmip:
    serverName: "kmip.example.com"
    port: 5696
    clientCertificateFile: /etc/mongodb/kmip-client.pem
    clientCertificatePassword: "password"
    serverCAFile: /etc/mongodb/kmip-ca.pem
    keyIdentifier: "kmip-key-id"
```

### 4. Logging Configuration

```yaml
systemLog:
  # Log destination
  destination: file  # file, syslog
  path: /var/log/mongodb/mongod.log
  
  # Log rotation
  logAppend: true
  logRotate: reopen  # rename, reopen
  
  # Verbosity levels (0-5, higher = more verbose)
  verbosity: 0
  quiet: false
  traceAllExceptions: false
  
  # Syslog configuration (if destination: syslog)
  syslogFacility: user
  
  # Component-specific logging
  component:
    accessControl:
      verbosity: 0
    command:
      verbosity: 0
    control:
      verbosity: 0
    ftdc:
      verbosity: 0
    geo:
      verbosity: 0
    index:
      verbosity: 0
    network:
      verbosity: 0
    query:
      verbosity: 0
    replication:
      verbosity: 0
    sharding:
      verbosity: 0
    storage:
      verbosity: 0
    recovery:
      verbosity: 0
    journal:
      verbosity: 0
    write:
      verbosity: 0
```

### 5. Replication Configuration

```yaml
replication:
  # Replica set name
  replSetName: rs0
  
  # Secondary read preference
  secondaryIndexPrefetch: all  # none, all, _id_only
  
  # Enable majority read concern
  enableMajorityReadConcern: true
  
  # Local database size limit
  localPingThresholdMs: 15
```

### 6. Sharding Configuration

```yaml
sharding:
  # Cluster role
  clusterRole: shardsvr  # configsvr, shardsvr
  
  # Config server settings (for config servers)
  archiveMovedChunks: true
```

### 7. Operation Profiling

```yaml
operationProfiling:
  # Profiling mode
  mode: off  # off, slowOp, all
  
  # Slow operation threshold
  slowOpThresholdMs: 100
  
  # Sample rate for profiling
  slowOpSampleRate: 1.0
```

### 8. Free Monitoring

```yaml
cloud:
  monitoring:
    free:
      state: on  # on, off
      tags: "environment:production,region:us-east"
```

## Container-Specific Configurations

### Development Configuration

Create `config/mongod-dev.conf`:

```yaml
# Development configuration
storage:
  dbPath: /data/db
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5  # Low memory for development
    collectionConfig:
      blockCompressor: snappy

net:
  port: 27017
  bindIp: 0.0.0.0

security:
  authorization: disabled  # Disabled for easy development

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  verbosity: 1  # More verbose for debugging

processManagement:
  fork: false

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100
```

### Production Configuration

Create `config/mongod-prod.conf`:

```yaml
# Production configuration
storage:
  dbPath: /data/db
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4  # Adjust based on available memory
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

net:
  port: 27017
  bindIp: 0.0.0.0
  maxIncomingConnections: 20000

security:
  authorization: enabled
  enableEncryption: true
  encryptionKeyFile: /etc/mongodb/keys/mongodb.key
  ssl:
    mode: requireSSL
    PEMKeyFile: /etc/mongodb/ssl/mongodb.pem
    allowInvalidCertificates: false

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  logRotate: reopen
  verbosity: 0  # Minimal logging for performance
  component:
    command:
      verbosity: 1  # Log slow commands

processManagement:
  fork: false

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100

replication:
  replSetName: rs-prod
```

## Container Setup Examples

### Basic Container with Config

```bash
# Create directories
mkdir -p {config,data,logs}

# Create basic configuration
cat > config/mongod.conf << EOF
storage:
  dbPath: /data/db
  engine: wiredTiger

net:
  port: 27017
  bindIp: 0.0.0.0

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

processManagement:
  fork: false
EOF

# Run container with configuration
docker run -d \
  --name mongodb-configured \
  -p 27017:27017 \
  -v $(pwd)/config/mongod.conf:/etc/mongod.conf:ro \
  -v $(pwd)/data:/data/db \
  -v $(pwd)/logs:/var/log/mongodb \
  mongo:7.0 mongod --config /etc/mongod.conf
```

### Advanced Container with Full Security

```bash
# Create comprehensive configuration
cat > config/mongod-secure.conf << EOF
storage:
  dbPath: /data/db
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2
    collectionConfig:
      blockCompressor: snappy

net:
  port: 27017
  bindIp: 0.0.0.0
  ssl:
    mode: requireSSL
    PEMKeyFile: /etc/mongodb/ssl/mongodb.pem
    allowInvalidCertificates: true

security:
  authorization: enabled
  enableEncryption: true
  encryptionKeyFile: /etc/mongodb/keys/mongodb.key

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  verbosity: 0

processManagement:
  fork: false

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100
EOF

# Run secure container
docker run -d \
  --name mongodb-secure \
  -p 27017:27017 \
  -v $(pwd)/config/mongod-secure.conf:/etc/mongod.conf:ro \
  -v $(pwd)/data:/data/db \
  -v $(pwd)/logs:/var/log/mongodb \
  -v $(pwd)/keys/mongodb.key:/etc/mongodb/keys/mongodb.key:ro \
  -v $(pwd)/ssl/mongodb.pem:/etc/mongodb/ssl/mongodb.pem:ro \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=securepassword123 \
  mongo:7.0 mongod --config /etc/mongod.conf
```

## Configuration Validation

### Check Configuration Inside Container

```bash
# Connect to container
docker exec -it mongodb-configured bash

# Verify configuration is loaded
mongod --config /etc/mongod.conf --help

# Check current configuration
mongo --eval "db.adminCommand('getCmdLineOpts')"

# Check specific settings
mongo --eval "db.serverStatus().storageEngine"
mongo --eval "db.serverStatus().connections"
```

### Verify Settings with MongoDB Shell

```javascript
// Connect to MongoDB
mongo

// Check command line options
db.adminCommand("getCmdLineOpts")

// Check server status
db.serverStatus()

// Check specific configurations
db.serverStatus().storageEngine
db.serverStatus().connections
db.serverStatus().network
db.serverStatus().security

// Check replication status (if enabled)
rs.status()

// Check profiling settings
db.getProfilingStatus()

// Check log settings
db.adminCommand("getLog", "global")
```

## Configuration Management Strategies

### 1. Environment-Based Configs

```bash
# Development
docker run -d \
  --name mongodb-dev \
  -v $(pwd)/config/mongod-dev.conf:/etc/mongod.conf:ro \
  -v $(pwd)/data-dev:/data/db \
  mongo:7.0 mongod --config /etc/mongod.conf

# Production
docker run -d \
  --name mongodb-prod \
  -v $(pwd)/config/mongod-prod.conf:/etc/mongod.conf:ro \
  -v $(pwd)/data-prod:/data/db \
  mongo:7.0 mongod --config /etc/mongod.conf
```

### 2. Configuration Templates

Create `config/mongod.template.conf`:

```yaml
# Template configuration with placeholders
storage:
  dbPath: /data/db
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: ${CACHE_SIZE_GB}

net:
  port: ${MONGO_PORT}
  bindIp: 0.0.0.0
  maxIncomingConnections: ${MAX_CONNECTIONS}

security:
  authorization: ${AUTH_ENABLED}

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  verbosity: ${LOG_VERBOSITY}
```

Generate config with environment variables:

```bash
# Set environment variables
export CACHE_SIZE_GB=2
export MONGO_PORT=27017
export MAX_CONNECTIONS=10000
export AUTH_ENABLED=enabled
export LOG_VERBOSITY=0

# Generate configuration
envsubst < config/mongod.template.conf > config/mongod.conf
```

### 3. Multi-Container Setup

```bash
# Primary MongoDB
docker run -d \
  --name mongodb-primary \
  -p 27017:27017 \
  -v $(pwd)/config/mongod-primary.conf:/etc/mongod.conf:ro \
  mongo:7.0 mongod --config /etc/mongod.conf

# Secondary MongoDB
docker run -d \
  --name mongodb-secondary \
  -p 27018:27017 \
  -v $(pwd)/config/mongod-secondary.conf:/etc/mongod.conf:ro \
  mongo:7.0 mongod --config /etc/mongod.conf
```

## Troubleshooting Configuration

### Common Configuration Issues

1. **Invalid YAML syntax:**
   ```bash
   # Validate YAML syntax
   python3 -c "import yaml; yaml.safe_load(open('config/mongod.conf'))"
   
   # Or use yamllint
   yamllint config/mongod.conf
   ```

2. **File permission errors:**
   ```bash
   # Check file permissions in container
   docker exec mongodb-configured ls -la /etc/mongod.conf
   
   # Fix permissions on host
   chmod 644 config/mongod.conf
   ```

3. **Path mismatches:**
   ```bash
   # Verify paths exist in container
   docker exec mongodb-configured ls -la /data/db
   docker exec mongodb-configured ls -la /var/log/mongodb
   ```

4. **Configuration not applied:**
   ```bash
   # Check if config file is being used
   docker exec mongodb-configured ps aux | grep mongod
   
   # Verify configuration is loaded
   docker exec mongodb-configured mongo --eval "db.adminCommand('getCmdLineOpts')"
   ```

### Debug Configuration

```bash
# Test configuration without starting MongoDB
docker run --rm \
  -v $(pwd)/config/mongod.conf:/etc/mongod.conf:ro \
  mongo:7.0 mongod --config /etc/mongod.conf --help

# Start MongoDB in foreground to see errors
docker run --rm -it \
  -v $(pwd)/config/mongod.conf:/etc/mongod.conf:ro \
  -v $(pwd)/data:/data/db \
  mongo:7.0 mongod --config /etc/mongod.conf

# Check logs for configuration errors
docker logs mongodb-configured
```

## Configuration Best Practices

### 1. Memory Management

```yaml
storage:
  wiredTiger:
    engineConfig:
      # Set cache size to 50-80% of available container memory
      cacheSizeGB: 2  # For 4GB container
```

### 2. Security Hardening

```yaml
security:
  authorization: enabled
  javascriptEnabled: false  # Disable if not needed
  
net:
  bindIp: 127.0.0.1,0.0.0.0  # Limit bind addresses
  maxIncomingConnections: 1000  # Reasonable limit
```

### 3. Performance Optimization

```yaml
storage:
  wiredTiger:
    collectionConfig:
      blockCompressor: snappy  # Good balance of speed/compression
    indexConfig:
      prefixCompression: true

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100  # Monitor slow operations
```

### 4. Monitoring and Logging

```yaml
systemLog:
  verbosity: 0  # Production
  component:
    command:
      verbosity: 1  # Log slow commands
    network:
      verbosity: 0
```

## Summary

Key points for MongoDB configuration in containers:

✅ **Always use `fork: false`** in containers
✅ **Mount config files as read-only** (`:ro`)
✅ **Ensure paths match volume mounts**
✅ **Validate YAML syntax before deployment**
✅ **Use environment-specific configurations**
✅ **Monitor configuration with `getCmdLineOpts()`**
✅ **Test configurations in development first**
✅ **Keep sensitive data in separate files**

Your MongoDB container is now properly configured and ready for any environment!