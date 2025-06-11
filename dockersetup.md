
docker run -d --name mongodb --hostname mongo -p 27017:27017 mongo:8.0-rc --replSet rs0


docker exec -it mongodb mongosh

docker exec -it mongodb mongosh

rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" }  // or use your host IP
  ]
})


session = db.getMongo().startSession()
session.startTransaction()

db1 = session.getDatabase("test")
coll1 = db1.getCollection("accounts")
coll1.insertOne({ name: "Alice", balance: 100 })

coll1.insertOne({ name: "Bob", balance: 200 })

session.commitTransaction()
session.endSession()
