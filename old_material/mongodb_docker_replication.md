# MongoDB Multi-Node Replication with Docker

This guide covers setting up MongoDB replica sets using Docker, from simple development setups to production-ready configurations.

## Table of Contents

1. [Quick Start - Docker Compose](#quick-start---docker-compose)
2. [Manual Docker Setup](#manual-docker-setup)
3. [Production Configuration](#production-configuration)
4. [Authentication and Security](#authentication-and-security)
5. [Monitoring and Management](#monitoring-and-management)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start - Docker Compose

### Basic 3-Node Replica Set

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  mongo1:
    image: mongo:7.0
    container_name: mongo1
    hostname: mongo1
    ports:
      - "27017:27017"
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongo1_data:/data/db
      - ./scripts:/scripts
    networks:
      - mongo-cluster

  mongo2:
    image: mongo:7.0
    container_name: mongo2
    hostname: mongo2
    ports:
      - "27018:27017"
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongo2_data:/data/db
    networks:
      - mongo-cluster

  mongo3:
    image: mongo:7.0
    container_name: mongo3
    hostname: mongo3
    ports:
      - "27019:27017"
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongo3_data:/data/db
    networks:
      - mongo-cluster

  mongo-setup:
    image: mongo:7.0
    container_name: mongo-setup
    depends_on:
      - mongo1
      - mongo2
      - mongo3
    volumes:
      - ./scripts:/scripts
    networks:
      - mongo-cluster
    entrypoint: ["/scripts/setup-replica-set.sh"]

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:

networks:
  mongo-cluster:
    driver: bridge
```

### Setup Script

Create a `scripts/setup-replica-set.sh` file:

```bash
#!/bin/bash

echo "Waiting for MongoDB instances to start..."
sleep 30

echo "Initiating replica set..."
mongosh --host mongo1:27017 --eval "
try {
  rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'mongo1:27017', priority: 2 },
      { _id: 1, host: 'mongo2:27017', priority: 1 },
      { _id: 2, host: 'mongo3:27017', priority: 1 }
    ]
  });
  print('Replica set initiated successfully');
} catch (e) {
  print('Error initiating replica set: ' + e);
}
"

echo "Waiting for replica set to stabilize..."
sleep 15

echo "Checking replica set status..."
mongosh --host mongo1:27017 --eval "rs.status()"

echo "Setup complete!"
```

Make the script executable:

```bash
chmod +x scripts/setup-replica-set.sh
```

### Start the Cluster

```bash
# Create the directory structure
mkdir -p scripts

# Start the containers
docker-compose up -d

# Check logs
docker-compose logs -f mongo-setup
```

### Verify the Setup

```bash
# Connect to primary
docker exec -it mongo1 mongosh

# Check replica set status
rs.status()

# Test data replication
db.test.insertOne({name: "test", timestamp: new Date()})

# Connect to secondary and read data
docker exec -it mongo2 mongosh
db.setReadPref("secondary")
db.test.find()
```

---

## Manual Docker Setup

### Step 1: Create Docker Network

```bash
# Create a custom network for MongoDB cluster
docker network create mongo-cluster
```

### Step 2: Start MongoDB Containers

```bash
# Start first MongoDB instance (Primary)
docker run -d \
  --name mongo1 \
  --hostname mongo1 \
  --network mongo-cluster \
  -p 27017:27017 \
  -v mongo1_data:/data/db \
  mongo:7.0 \
  mongod --replSet rs0 --bind_ip_all

# Start second MongoDB instance
docker run -d \
  --name mongo2 \
  --hostname mongo2 \
  --network mongo-cluster \
  -p 27018:27017 \
  -v mongo2_data:/data/db \
  mongo:7.0 \
  mongod --replSet rs0 --bind_ip_all

# Start third MongoDB instance
docker run -d \
  --name mongo3 \
  --hostname mongo3 \
  --network mongo-cluster \
  -p 27019:27017 \
  -v mongo3_data:/data/db \
  mongo:7.0 \
  mongod --replSet rs0 --bind_ip_all
```

### Step 3: Initialize Replica Set

```bash
# Wait for containers to start
sleep 30

# Connect to mongo1 and initialize replica set
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

# Check status
docker exec -it mongo1 mongosh --eval "rs.status()"
```

---

## Production Configuration

### Advanced Docker Compose with Security

```yaml
version: '3.8'

services:
  mongo1:
    image: mongo:7.0
    container_name: mongo1
    hostname: mongo1
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    command: >
      mongod 
      --replSet rs0 
      --bind_ip_all 
      --auth 
      --keyFile /data/keyfile/mongodb.key 
      --oplogSize 1024
    volumes:
      - mongo1_data:/data/db
      - mongo1_config:/data/configdb
      - ./keyfile:/data/keyfile
      - ./mongod.conf:/etc/mongod.conf
    networks:
      - mongo-cluster
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  mongo2:
    image: mongo:7.0
    container_name: mongo2
    hostname: mongo2
    ports:
      - "27018:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    command: >
      mongod 
      --replSet rs0 
      --bind_ip_all 
      --auth 
      --keyFile /data/keyfile/mongodb.key 
      --oplogSize 1024
    volumes:
      - mongo2_data:/data/db
      - mongo2_config:/data/configdb
      - ./keyfile:/data/keyfile
      - ./mongod.conf:/etc/mongod.conf
    networks:
      - mongo-cluster
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  mongo3:
    image: mongo:7.0
    container_name: mongo3
    hostname: mongo3
    ports:
      - "27019:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    command: >
      mongod 
      --replSet rs0 
      --bind_ip_all 
      --auth 
      --keyFile /data/keyfile/mongodb.key 
      --oplogSize 1024
    volumes:
      - mongo3_data:/data/db
      - mongo3_config:/data/configdb
      - ./keyfile:/data/keyfile
      - ./mongod.conf:/etc/mongod.conf
    networks:
      - mongo-cluster
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  mongo-express:
    image: mongo-express:latest
    container_name: mongo-express
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_URL: mongodb://admin:${MONGO_ROOT_PASSWORD}@mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0&authSource=admin
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: ${MONGO_EXPRESS_PASSWORD}
    networks:
      - mongo-cluster
    depends_on:
      - mongo1
      - mongo2
      - mongo3
    restart: unless-stopped

volumes:
  mongo1_data:
  mongo1_config:
  mongo2_data:
  mongo2_config:
  mongo3_data:
  mongo3_config:

networks:
  mongo-cluster:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Environment File (.env)

```bash
# MongoDB passwords
MONGO_ROOT_PASSWORD=your_secure_root_password_here
MONGO_EXPRESS_PASSWORD=your_mongo_express_password_here

# MongoDB settings
MONGO_REPLICA_SET_NAME=rs0
MONGO_OPLOG_SIZE=1024
```

### MongoDB Configuration File (mongod.conf)

```yaml
# mongod.conf
storage:
  dbPath: /data/db
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  verbosity: 1

net:
  port: 27017
  bindIp: 0.0.0.0

replication:
  replSetName: rs0
  oplogSizeMB: 1024

security:
  authorization: enabled
  keyFile: /data/keyfile/mongodb.key

operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp
```

---

## Authentication and Security

### Generate Keyfile

```bash
# Create keyfile directory
mkdir -p keyfile

# Generate keyfile for inter-node authentication
openssl rand -base64 756 > keyfile/mongodb.key

# Set proper permissions
chmod 400 keyfile/mongodb.key
sudo chown 999:999 keyfile/mongodb.key
```

### Setup Script with Authentication

Create `scripts/setup-replica-set-auth.sh`:

```bash
#!/bin/bash

echo "Waiting for MongoDB instances to start..."
sleep 30

echo "Creating admin user on primary..."
docker exec mongo1 mongosh --eval "
try {
  admin = db.getSiblingDB('admin');
  admin.createUser({
    user: 'admin',
    pwd: '${MONGO_ROOT_PASSWORD}',
    roles: ['root']
  });
  print('Admin user created successfully');
} catch (e) {
  print('Admin user might already exist: ' + e);
}
"

echo "Initiating replica set with authentication..."
docker exec mongo1 mongosh -u admin -p ${MONGO_ROOT_PASSWORD} --authenticationDatabase admin --eval "
try {
  rs.initiate({
    _id: '${MONGO_REPLICA_SET_NAME}',
    members: [
      { _id: 0, host: 'mongo1:27017', priority: 2 },
      { _id: 1, host: 'mongo2:27017', priority: 1 },
      { _id: 2, host: 'mongo3:27017', priority: 1 }
    ]
  });
  print('Replica set initiated successfully');
} catch (e) {
  print('Error initiating replica set: ' + e);
}
"

echo "Waiting for replica set to stabilize..."
sleep 20

echo "Creating application user..."
docker exec mongo1 mongosh -u admin -p ${MONGO_ROOT_PASSWORD} --authenticationDatabase admin --eval "
try {
  db = db.getSiblingDB('myapp');
  db.createUser({
    user: 'appuser',
    pwd: 'apppassword',
    roles: [
      { role: 'readWrite', db: 'myapp' }
    ]
  });
  print('Application user created successfully');
} catch (e) {
  print('Application user might already exist: ' + e);
}
"

echo "Replica set setup with authentication complete!"
```

### Connection String Examples

```bash
# For applications
mongodb://appuser:apppassword@localhost:27017,localhost:27018,localhost:27019/myapp?replicaSet=rs0

# For admin operations
mongodb://admin:your_secure_root_password_here@localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&authSource=admin
```

---

## Monitoring and Management

### Health Check Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash

echo "=== MongoDB Replica Set Health Check ==="
echo "Date: $(date)"
echo

# Check container status
echo "Container Status:"
docker ps --filter "name=mongo" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

# Check replica set status
echo "Replica Set Status:"
docker exec mongo1 mongosh -u admin -p ${MONGO_ROOT_PASSWORD} --authenticationDatabase admin --quiet --eval "
const status = rs.status();
status.members.forEach(member => {
  print(member.name + ' - ' + member.stateStr + ' - Health: ' + member.health);
});
"
echo

# Check replication lag
echo "Replication Lag:"
docker exec mongo1 mongosh -u admin -p ${MONGO_ROOT_PASSWORD} --authenticationDatabase admin --quiet --eval "
rs.printSlaveReplicationInfo();
"
echo

# Check oplog status
echo "Oplog Status:"
docker exec mongo1 mongosh -u admin -p ${MONGO_ROOT_PASSWORD} --authenticationDatabase admin --quiet --eval "
const stats = db.oplog.rs.stats();
print('Oplog Size: ' + Math.round(stats.maxSize / 1024 / 1024) + ' MB');
print('Oplog Used: ' + Math.round(stats.size / 1024 / 1024) + ' MB');
print('Oplog Usage: ' + Math.round((stats.size / stats.maxSize) * 100) + '%');
"
```

### Backup Script

Create `scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backup/mongodb/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "Starting MongoDB backup..."
echo "Backup directory: $BACKUP_DIR"

# Backup from secondary to avoid impacting primary
docker exec mongo2 mongodump \
  -u admin \
  -p ${MONGO_ROOT_PASSWORD} \
  --authenticationDatabase admin \
  --oplog \
  --out /backup/temp

# Copy backup from container
docker cp mongo2:/backup/temp $BACKUP_DIR

# Compress backup
tar -czf ${BACKUP_DIR}.tar.gz -C $BACKUP_DIR .
rm -rf $BACKUP_DIR

echo "Backup completed: ${BACKUP_DIR}.tar.gz"
```

### Monitoring with Docker Stats

```bash
# Real-time monitoring
watch -n 2 'docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" mongo1 mongo2 mongo3'

# Log monitoring
docker-compose logs -f --tail=100 mongo1 mongo2 mongo3
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Containers Can't Communicate

```bash
# Check network connectivity
docker exec mongo1 ping mongo2
docker exec mongo1 ping mongo3

# Verify network configuration
docker network inspect mongo-cluster
```

#### 2. Replica Set Initialization Fails

```bash
# Check MongoDB logs
docker logs mongo1
docker logs mongo2
docker logs mongo3

# Verify replica set configuration
docker exec mongo1 mongosh --eval "rs.conf()"
```

#### 3. Authentication Issues

```bash
# Reset admin password
docker exec mongo1 mongosh --eval "
use admin;
db.updateUser('admin', {pwd: 'new_password'});
"

# Check user permissions
docker exec mongo1 mongosh -u admin -p password --authenticationDatabase admin --eval "
db.runCommand({usersInfo: 1});
"
```

#### 4. Performance Issues

```bash
# Check slow queries
docker exec mongo1 mongosh -u admin -p password --authenticationDatabase admin --eval "
db.setProfilingLevel(2, {slowms: 100});
db.system.profile.find().sort({ts: -1}).limit(5);
"

# Monitor resource usage
docker exec mongo1 mongosh -u admin -p password --authenticationDatabase admin --eval "
db.serverStatus().mem;
"
```

### Useful Commands

```bash
# Scale replica set (add new member)
docker run -d \
  --name mongo4 \
  --hostname mongo4 \
  --network mongo-cluster \
  -p 27020:27017 \
  -v mongo4_data:/data/db \
  mongo:7.0 \
  mongod --replSet rs0 --bind_ip_all

# Add to replica set
docker exec mongo1 mongosh -u admin -p password --authenticationDatabase admin --eval "
rs.add('mongo4:27017');
"

# Remove member
docker exec mongo1 mongosh -u admin -p password --authenticationDatabase admin --eval "
rs.remove('mongo4:27017');
"

# Force primary election
docker exec mongo1 mongosh -u admin -p password --authenticationDatabase admin --eval "
rs.stepDown();
"

# Check election history
docker exec mongo1 mongosh -u admin -p password --authenticationDatabase admin --eval "
db.adminCommand('replSetGetStatus').members.forEach(function(member) {
  print(member.name + ' - ' + member.stateStr + ' - electionTime: ' + member.electionTime);
});
"
```

### Complete Startup Script

Create `start-cluster.sh`:

```bash
#!/bin/bash

set -e

echo "Starting MongoDB Replica Set with Docker..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Creating .env file with default values..."
  cat > .env << EOF
MONGO_ROOT_PASSWORD=secure_password_123
MONGO_EXPRESS_PASSWORD=express_password_123
MONGO_REPLICA_SET_NAME=rs0
MONGO_OPLOG_SIZE=1024
EOF
fi

# Create necessary directories
mkdir -p scripts keyfile

# Generate keyfile if it doesn't exist
if [ ! -f keyfile/mongodb.key ]; then
  echo "Generating MongoDB keyfile..."
  openssl rand -base64 756 > keyfile/mongodb.key
  chmod 400 keyfile/mongodb.key
  sudo chown 999:999 keyfile/mongodb.key
fi

# Start containers
echo "Starting containers..."
docker-compose up -d mongo1 mongo2 mongo3

# Wait for containers to be ready
echo "Waiting for MongoDB instances to start..."
sleep 30

# Setup replica set
echo "Setting up replica set..."
source .env
bash scripts/setup-replica-set-auth.sh

echo "MongoDB Replica Set is ready!"
echo "Connection string: mongodb://admin:${MONGO_ROOT_PASSWORD}@localhost:27017,localhost:27018,localhost:27019/?replicaSet=${MONGO_REPLICA_SET_NAME}&authSource=admin"
```

This comprehensive guide provides everything you need to set up MongoDB replication with Docker, from simple development environments to production-ready configurations with authentication, monitoring, and management tools.