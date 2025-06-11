# MongoDB Container Encryption Setup Guide

Complete walkthrough for setting up MongoDB encryption at rest and SSL in a Docker container using `docker run` with C# client examples.

## Prerequisites

- Docker installed
- ssh-keygen (usually pre-installed)
- C# development environment (.NET 6+)

## Part 1: Setup Host Directory Structure

```bash
# Create project directory on host
mkdir mongodb-encrypted
cd mongodb-encrypted

# Create directory structure
mkdir -p {data,config,keys,ssl,logs}

# Your structure:
# mongodb-encrypted/
# ├── data/          # MongoDB data volume
# ├── config/        # MongoDB configuration
# ├── keys/          # Encryption keys
# ├── ssl/           # SSL certificates
# └── logs/          # Log files
```

## Part 2: Generate Keys and Certificates on Host

### Step 1: Generate Encryption Key

```bash
# Generate encryption key for encryption at rest
cd keys/
head -c 96 /dev/urandom | base64 > mongodb.key

# Set permissions
chmod 600 mongodb.key
```

### Step 2: Generate SSL Certificate

```bash
# Move to SSL directory
cd ../ssl/

# Generate private key using ssh-keygen
ssh-keygen -t rsa -b 2048 -f mongodb-ssl-key -N ""

# Convert SSH key to PEM format
ssh-keygen -f mongodb-ssl-key -e -m pem > mongodb.key

# Create self-signed certificate
openssl req -new -x509 -key mongodb.key -out mongodb.crt -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Combine into PEM file (required by MongoDB)
cat mongodb.crt mongodb.key > mongodb.pem

# Set permissions
chmod 600 mongodb.pem mongodb.key
chmod 644 mongodb.crt
```

## Part 3: MongoDB Configuration

### Create MongoDB Config File

Create `config/mongod.conf`:

```yaml
# config/mongod.conf
storage:
  dbPath: /data/db
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      directoryForIndexes: false
    collectionConfig:
      blockCompressor: snappy

# Enable encryption at rest
security:
  enableEncryption: true
  encryptionKeyFile: /etc/mongodb/keys/mongodb.key

# SSL/TLS Configuration
net:
  port: 27017
  bindIp: 0.0.0.0
  ssl:
    mode: requireSSL
    PEMKeyFile: /etc/mongodb/ssl/mongodb.pem
    allowConnectionsWithoutCertificates: true
    allowInvalidCertificates: true

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  logRotate: reopen

processManagement:
  fork: false  # Don't fork in containers
```

## Part 4: Run MongoDB Container

### Start MongoDB Container

```bash
# Run MongoDB container with all volumes mounted
docker run -d \
  --name mongodb-encrypted \
  -p 27017:27017 \
  -v $(pwd)/data:/data/db \
  -v $(pwd)/config/mongod.conf:/etc/mongod.conf \
  -v $(pwd)/keys/mongodb.key:/etc/mongodb/keys/mongodb.key:ro \
  -v $(pwd)/ssl/mongodb.pem:/etc/mongodb/ssl/mongodb.pem:ro \
  -v $(pwd)/logs:/var/log/mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=securepassword123 \
  mongo:7.0 mongod --config /etc/mongod.conf

# Check container status
docker ps

# View container logs
docker logs mongodb-encrypted

# Follow logs in real-time
docker logs -f mongodb-encrypted
```

### Alternative: Run without Authentication (Development Only)

```bash
# For development/testing without authentication
docker run -d \
  --name mongodb-encrypted \
  -p 27017:27017 \
  -v $(pwd)/data:/data/db \
  -v $(pwd)/config/mongod.conf:/etc/mongod.conf \
  -v $(pwd)/keys/mongodb.key:/etc/mongodb/keys/mongodb.key:ro \
  -v $(pwd)/ssl/mongodb.pem:/etc/mongodb/ssl/mongodb.pem:ro \
  -v $(pwd)/logs:/var/log/mongodb \
  mongo:7.0 mongod --config /etc/mongod.conf
```

## Part 5: Verify Container and Encryption

### Test Container Connection

```bash
# Connect to container bash
docker exec -it mongodb-encrypted bash

# Inside container - test MongoDB connection with auth
mongo --ssl --sslAllowInvalidCertificates \
  -u admin -p securepassword123 \
  --authenticationDatabase admin

# Check encryption status
use admin
db.serverStatus().encryptionAtRest

# Create test data
use testapp
db.users.insertOne({name: "Container Test", email: "test@container.com"})

# Exit MongoDB shell and container
exit
exit
```

### Test from Host Machine

```bash
# Connect from host to containerized MongoDB
mongo --ssl --sslAllowInvalidCertificates \
  --host localhost:27017 \
  -u admin -p securepassword123 \
  --authenticationDatabase admin

# Test operations
use containertest
db.products.insertOne({name: "Encrypted Product", price: 29.99})
db.products.find()
```

## Part 6: C# Client Application

### Create C# Project

```bash
# Create new C# project (outside container directory)
mkdir ../csharp-mongo-client
cd ../csharp-mongo-client
dotnet new console
dotnet add package MongoDB.Driver
```

### C# Connection Code

Create `Program.cs`:

```csharp
using MongoDB.Driver;
using MongoDB.Bson;
using System;
using System.Threading.Tasks;

namespace MongoDBContainerClient
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("🔗 Connecting to containerized MongoDB...");
            
            // Connection string for containerized MongoDB with SSL
            var connectionString = "mongodb://admin:securepassword123@localhost:27017/admin?ssl=true&sslVerifyCertificate=false";
            
            // Create client settings
            var settings = MongoClientSettings.FromConnectionString(connectionString);
            settings.SslSettings = new SslSettings
            {
                EnabledSslProtocols = System.Security.Authentication.SslProtocols.Tls12,
                CheckCertificateRevocation = false
            };
            
            var client = new MongoClient(settings);
            
            try
            {
                // Test connection
                Console.WriteLine("🧪 Testing connection...");
                await client.ListDatabaseNamesAsync();
                Console.WriteLine("✅ Connected to containerized MongoDB with SSL!");
                
                // Get database and collection
                var database = client.GetDatabase("clienttest");
                var collection = database.GetCollection<BsonDocument>("orders");
                
                // Insert test document
                var document = new BsonDocument
                {
                    { "orderId", Guid.NewGuid().ToString() },
                    { "customerName", "C# Client Test" },
                    { "amount", 99.99 },
                    { "encrypted", true },
                    { "createdAt", DateTime.UtcNow }
                };
                
                Console.WriteLine("📝 Inserting document...");
                await collection.InsertOneAsync(document);
                Console.WriteLine($"✅ Document inserted with ID: {document["_id"]}");
                
                // Find and display documents
                Console.WriteLine("🔍 Retrieving documents...");
                var cursor = await collection.FindAsync(new BsonDocument());
                var documents = await cursor.ToListAsync();
                
                Console.WriteLine($"✅ Found {documents.Count} documents:");
                foreach (var doc in documents)
                {
                    Console.WriteLine($"   📄 Order: {doc["orderId"]} - Customer: {doc["customerName"]} - Amount: ${doc["amount"]}");
                }
                
                // Test aggregation
                Console.WriteLine("📊 Running aggregation...");
                var pipeline = new[]
                {
                    new BsonDocument("$group", new BsonDocument
                    {
                        { "_id", BsonNull.Value },
                        { "totalAmount", new BsonDocument("$sum", "$amount") },
                        { "orderCount", new BsonDocument("$sum", 1) }
                    })
                };
                
                var aggregationResult = await collection.AggregateAsync<BsonDocument>(pipeline);
                var result = await aggregationResult.FirstOrDefaultAsync();
                
                if (result != null)
                {
                    Console.WriteLine($"📈 Total Orders: {result["orderCount"]}, Total Amount: ${result["totalAmount"]}");
                }
                
                Console.WriteLine("🎉 All operations completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error: {ex.Message}");
                Console.WriteLine($"💡 Make sure MongoDB container is running: docker ps");
            }
        }
    }
}
```

### Simple C# Connection Test

Create `SimpleTest.cs`:

```csharp
using MongoDB.Driver;
using System;

namespace SimpleMongoTest
{
    class SimpleTest
    {
        static void Main()
        {
            try
            {
                // Simple connection test
                var client = new MongoClient("mongodb://admin:securepassword123@localhost:27017/admin?ssl=true&sslVerifyCertificate=false");
                
                var database = client.GetDatabase("quicktest");
                var collection = database.GetCollection<dynamic>("status");
                
                collection.InsertOne(new { 
                    message = "SSL + Encryption working!", 
                    timestamp = DateTime.Now,
                    containerized = true
                });
                
                Console.WriteLine("✅ Connection successful - SSL + Encryption working!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Connection failed: {ex.Message}");
            }
        }
    }
}
```

### Run C# Applications

```bash
# Run main application
dotnet run

# Or run simple test
dotnet run SimpleTest.cs
```

## Part 7: MongoDB Compass Connection

### Compass Connection Details

1. **Connection String:**
   ```
   mongodb://admin:securepassword123@localhost:27017/admin?ssl=true
   ```

2. **Manual Configuration:**
   - **Hostname:** `localhost`
   - **Port:** `27017`
   - **Authentication:** Username/Password
   - **Username:** `admin`
   - **Password:** `securepassword123`
   - **Authentication Database:** `admin`
   - **SSL:** Self-Signed / Unvalidated
   - **✓ Check:** Allow invalid certificates

## Part 8: Container Management

### Essential Docker Commands

```bash
# Check container status
docker ps
docker ps -a  # Show all containers (including stopped)

# View container logs
docker logs mongodb-encrypted
docker logs -f mongodb-encrypted  # Follow logs

# Stop container
docker stop mongodb-encrypted

# Start existing container
docker start mongodb-encrypted

# Restart container
docker restart mongodb-encrypted

# Remove container (data persists in volumes)
docker rm mongodb-encrypted

# Remove container and start fresh
docker rm -f mongodb-encrypted
# Then run the docker run command again
```

### Container Inspection

```bash
# Inspect container details
docker inspect mongodb-encrypted

# Check container resource usage
docker stats mongodb-encrypted

# Execute commands in running container
docker exec -it mongodb-encrypted bash

# Check MongoDB process in container
docker exec mongodb-encrypted ps aux | grep mongod
```

## Part 9: Data Management

### Backup and Restore

```bash
# Backup from container to host
docker exec mongodb-encrypted mongodump \
  --ssl --sslAllowInvalidCertificates \
  -u admin -p securepassword123 \
  --authenticationDatabase admin \
  --out /data/backup

# Copy backup from container to host
docker cp mongodb-encrypted:/data/backup ./backup-$(date +%Y%m%d)

# Restore backup
docker exec mongodb-encrypted mongorestore \
  --ssl --sslAllowInvalidCertificates \
  -u admin -p securepassword123 \
  --authenticationDatabase admin \
  /data/backup
```

### Data Persistence Verification

```bash
# Check data directory on host
ls -la data/

# Stop container and restart to verify persistence
docker stop mongodb-encrypted
docker start mongodb-encrypted

# Connect and verify data is still there
mongo --ssl --sslAllowInvalidCertificates \
  --host localhost:27017 \
  -u admin -p securepassword123 \
  --authenticationDatabase admin \
  --eval "db.adminCommand('listCollections')"
```

## Part 10: Troubleshooting

### Common Issues and Solutions

1. **Container won't start:**
   ```bash
   # Check logs for errors
   docker logs mongodb-encrypted
   
   # Common fix: File permissions
   chmod 600 keys/mongodb.key ssl/mongodb.pem
   
   # Remove and recreate container
   docker rm -f mongodb-encrypted
   # Run docker run command again
   ```

2. **Cannot connect with SSL:**
   ```bash
   # Test SSL connectivity
   openssl s_client -connect localhost:27017 -servername localhost
   
   # Check if container is listening
   docker exec mongodb-encrypted netstat -tlnp | grep 27017
   
   # Verify SSL certificate in container
   docker exec mongodb-encrypted openssl x509 -in /etc/mongodb/ssl/mongodb.pem -text -noout
   ```

3. **C# connection fails:**
   ```bash
   # Verify container is running
   docker ps | grep mongodb-encrypted
   
   # Test with MongoDB shell first
   mongo --ssl --sslAllowInvalidCertificates --host localhost:27017
   
   # Check firewall/port access
   telnet localhost 27017
   ```

4. **Data not persisting:**
   ```bash
   # Check volume mounts
   docker inspect mongodb-encrypted | grep -A 10 "Mounts"
   
   # Verify host directory permissions
   ls -la data/
   ```

### Verification Script

Create `verify-container.sh`:

```bash
#!/bin/bash

echo "🔍 Verifying MongoDB Container Setup..."

# Check if container is running
if docker ps | grep -q "mongodb-encrypted"; then
    echo "✅ Container is running"
else
    echo "❌ Container is not running"
    echo "💡 Start with: docker start mongodb-encrypted"
    exit 1
fi

# Test connection
if docker exec mongodb-encrypted mongo --ssl --sslAllowInvalidCertificates --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB is responding"
else
    echo "❌ MongoDB is not responding"
    exit 1
fi

# Check encryption
if docker exec mongodb-encrypted mongo --ssl --sslAllowInvalidCertificates --eval "print(db.serverStatus().encryptionAtRest ? 'Enabled' : 'Disabled')" 2>/dev/null | grep -q "Enabled"; then
    echo "✅ Encryption at rest is enabled"
else
    echo "❌ Encryption at rest is not enabled"
fi

# Test external connection
if mongo --ssl --sslAllowInvalidCertificates --host localhost:27017 --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ External SSL connection working"
else
    echo "❌ External SSL connection failed"
fi

echo "🎉 Container verification complete!"
```

Make executable and run:
```bash
chmod +x verify-container.sh
./verify-container.sh
```

## Summary

You now have:
- ✅ MongoDB running in a Docker container with encryption at rest
- ✅ SSL/TLS encryption in transit with self-signed certificates
- ✅ C# client applications connecting from host machine
- ✅ Data persistence through Docker volumes
- ✅ Authentication enabled for security
- ✅ Easy container management with docker commands

**Key Connection Details:**
- **Host:** `localhost:27017`
- **SSL:** Required with self-signed certificate
- **Auth:** `admin` / `securepassword123`
- **Connection String:** `mongodb://admin:securepassword123@localhost:27017/admin?ssl=true&sslVerifyCertificate=false`

**Essential Commands:**
```bash
# Start: docker start mongodb-encrypted
# Stop: docker stop mongodb-encrypted  
# Logs: docker logs -f mongodb-encrypted
# Shell: docker exec -it mongodb-encrypted bash
```

Your containerized MongoDB is secure and ready for client applications!