db.orders.drop()
db.customers.drop()

db.customers.insertMany([
  { _id: "cust001", name: "John Smith", email: "john.smith@email.com", city: "New York" },
  { _id: "cust002", name: "Sarah Johnson", email: "sarah.johnson@email.com", city: "Los Angeles" },
  { _id: "cust003", name: "Mike Davis", email: "mike.davis@email.com", city: "Chicago" },
  { _id: "cust004", name: "Emily Wilson", email: "emily.wilson@email.com", city: "Houston" },
  { _id: "cust005", name: "David Brown", email: "david.brown@email.com", city: "Phoenix" },
  { _id: "cust006", name: "Lisa Garcia", email: "lisa.garcia@email.com", city: "Philadelphia" },
  { _id: "cust007", name: "Tom Anderson", email: "tom.anderson@email.com", city: "San Diego" },
  { _id: "cust008", name: "Amy Martinez", email: "amy.martinez@email.com", city: "Dallas" },
  { _id: "cust009", name: "Chris Taylor", email: "chris.taylor@email.com", city: "Seattle" },
  { _id: "cust010", name: "Jessica Lee", email: "jessica.lee@email.com", city: "Boston" },
  { _id: "cust011", name: "Robert Miller", email: "robert.miller@email.com", city: "Denver" },
  { _id: "cust012", name: "Michelle White", email: "michelle.white@email.com", city: "Miami" }
])

db.orders.insertMany([
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0001"),
    customerId: "cust001",
    status: "completed",
    orderDate: new Date("2024-01-15"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439011"), quantity: 1, price: 999 },
      { productId: ObjectId("507f1f77bcf86cd799439014"), quantity: 2, price: 249 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0002"),
    customerId: "cust002", 
    status: "completed",
    orderDate: new Date("2024-02-20"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439012"), quantity: 1, price: 899 },
      { productId: ObjectId("507f1f77bcf86cd799439015"), quantity: 1, price: 120 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0003"),
    customerId: "cust003",
    status: "completed", 
    orderDate: new Date("2024-03-10"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439013"), quantity: 1, price: 1999 },
      { productId: ObjectId("507f1f77bcf86cd799439014"), quantity: 1, price: 249 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0004"),
    customerId: "cust004",
    status: "completed",
    orderDate: new Date("2024-04-05"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439011"), quantity: 2, price: 999 },
      { productId: ObjectId("507f1f77bcf86cd799439016"), quantity: 1, price: 180 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0005"),
    customerId: "cust005",
    status: "completed",
    orderDate: new Date("2024-05-12"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439017"), quantity: 3, price: 89 },
      { productId: ObjectId("507f1f77bcf86cd799439018"), quantity: 2, price: 59 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0006"),
    customerId: "cust006",
    status: "completed",
    orderDate: new Date("2024-06-08"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439012"), quantity: 1, price: 899 },
      { productId: ObjectId("507f1f77bcf86cd799439019"), quantity: 4, price: 29 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0007"),
    customerId: "cust007",
    status: "completed",
    orderDate: new Date("2024-07-22"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd79943901a"), quantity: 1, price: 149 },
      { productId: ObjectId("507f1f77bcf86cd799439015"), quantity: 2, price: 120 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0008"),
    customerId: "cust008",
    status: "completed",
    orderDate: new Date("2024-08-14"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439013"), quantity: 1, price: 1999 },
      { productId: ObjectId("507f1f77bcf86cd799439014"), quantity: 3, price: 249 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0009"),
    customerId: "cust009",
    status: "completed",
    orderDate: new Date("2024-09-30"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439011"), quantity: 1, price: 999 },
      { productId: ObjectId("507f1f77bcf86cd799439017"), quantity: 1, price: 89 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0010"),
    customerId: "cust010",
    status: "completed",
    orderDate: new Date("2024-10-15"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439016"), quantity: 2, price: 180 },
      { productId: ObjectId("507f1f77bcf86cd799439018"), quantity: 1, price: 59 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0011"),
    customerId: "cust011",
    status: "pending",
    orderDate: new Date("2023-12-20"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439011"), quantity: 1, price: 999 }
    ]
  },
  {
    _id: ObjectId("65a1b2c3d4e5f6789abc0012"),
    customerId: "cust012",
    status: "completed",
    orderDate: new Date("2023-11-10"),
    items: [
      { productId: ObjectId("507f1f77bcf86cd799439012"), quantity: 1, price: 899 }
    ]
  }
])

print("Created orders:", db.orders.countDocuments())
print("Created customers:", db.customers.countDocuments())
