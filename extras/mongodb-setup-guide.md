# MongoDB 8.0 Cluster Setup with Docker

## 1. Start the Nodes

```bash
# Node 1 (Primary)
docker run -d --name mongo1 -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Node 2 (Secondary)
docker run -d --name mongo2 -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Node 3 (Secondary)
docker run -d --name mongo3 -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all
```

## 2. Initialize Replica Set

Wait 10 seconds, then:

```bash
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: '127.0.0.1:27017' },
    { _id: 1, host: '127.0.0.1:27018' },
    { _id: 2, host: '127.0.0.1:27019' }
  ]
})
"
```

## 3. Verify Setup

```bash
docker exec -it mongo1 mongosh --eval "rs.status()"
```

## 4. Test Transactions

```bash
docker exec -it mongo1 mongosh
```

```javascript
// Create test accounts
db.accounts.insertMany([
  { accountNumber: "12345", balance: 1000 },
  { accountNumber: "67890", balance: 500 }
])

// Run transaction
const session = db.getMongo().startSession()
try {
  session.startTransaction()
  
  db.accounts.updateOne({ accountNumber: "12345" }, { $inc: { balance: -100 } }, { session })
  db.accounts.updateOne({ accountNumber: "67890" }, { $inc: { balance: 100 } }, { session })
  
  session.commitTransaction()
  print("Transfer completed successfully")
} catch (error) {
  session.abortTransaction()
  print("Transfer failed: " + error)
} finally {
  session.endSession()
}
```

## 5. Cleanup

```bash
docker stop mongo1 mongo2 mongo3
docker rm mongo1 mongo2 mongo3
```

**Done!** You now have a working 3-node MongoDB 8.0 cluster ready for transactions.