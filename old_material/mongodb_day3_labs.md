# MongoDB Day 3 - Advanced C# Development Labs

---

## Lab 1: Transactions and Data Consistency (45 minutes)

### Learning Objectives
- Implement multi-document ACID transactions
- Handle transaction errors and retries
- Understand consistency models in distributed systems

### Tasks

#### Part A: Basic Transactions (20 minutes)
1. **Bank Transfer Transaction**
   ```javascript
   const session = db.getMongo().startSession()
   
   try {
     session.startTransaction()
     
     // Debit from source account
     db.accounts.updateOne(
       { accountNumber: "12345" },
       { $inc: { balance: -100 } },
       { session }
     )
     
     // Credit to destination account
     db.accounts.updateOne(
       { accountNumber: "67890" },
       { $inc: { balance: 100 } },
       { session }
     )
     
     // Record transaction
     db.transactions.insertOne({
       from: "12345",
       to: "67890",
       amount: 100,
       timestamp: new Date(),
       type: "transfer"
     }, { session })
     
     session.commitTransaction()
     print("Transfer completed successfully")
     
   } catch (error) {
     session.abortTransaction()
     print("Transfer failed: " + error)
   } finally {
     session.endSession()
   }
   ```

2. **E-commerce Order Processing**
   ```javascript
   function processOrder(customerId, items) {
     const session = db.getMongo().startSession()
     
     try {
       session.startTransaction()
       
       // Create order
       const orderResult = db.orders.insertOne({
         customerId: customerId,
         items: items,
         status: "processing",
         createdAt: new Date(),
         total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
       }, { session })
       
       // Update inventory
       for (let item of items) {
         const updateResult = db.products.updateOne(
           { 
             _id: item.productId,
             "inventory.available": { $gte: item.quantity }
           },
           { 
             $inc: { 
               "inventory.available": -item.quantity,
               "inventory.reserved": item.quantity
             }
           },
           { session }
         )
         
         if (updateResult.matchedCount === 0) {
           throw new Error(`Insufficient inventory for product ${item.productId}`)
         }
       }
       
       session.commitTransaction()
       return orderResult.insertedId
       
     } catch (error) {
       session.abortTransaction()
       throw error
     } finally {
       session.endSession()
     }
   }
   ```

#### Part B: Advanced Transaction Patterns (25 minutes)
1. **Retry Logic for Transient Errors**
   ```javascript
   function executeWithRetry(operation, maxRetries = 3) {
     let attempts = 0
     
     while (attempts < maxRetries) {
       try {
         return operation()
       } catch (error) {
         attempts++
         
         if (error.hasErrorLabel('TransientTransactionError') && attempts < maxRetries) {
           print(`Transient error, retrying... (${attempts}/${maxRetries})`)
           sleep(Math.pow(2, attempts) * 100) // Exponential backoff
           continue
         }
         
         throw error
       }
     }
   }
   ```

2. **Read Concerns and Write Concerns**
   ```javascript
   // Strong consistency read
   db.accounts.find({ accountNumber: "12345" })
     .readConcern("majority")
     .readPreference("primary")
   
   // Acknowledged write with journal
   db.accounts.updateOne(
     { accountNumber: "12345" },
     { $inc: { balance: -50 } },
     { writeConcern: { w: "majority", j: true } }
   )
   ```

### Challenge Exercise
Implement a reservation system for event tickets that handles concurrent bookings, prevents overbooking, and includes automatic timeout for unpaid reservations.

---

## Lab 2: Replica Sets and Sharding (45 minutes)

### Learning Objectives
- Configure replica sets for high availability
- Implement horizontal scaling with sharding
- Monitor and troubleshoot distributed MongoDB clusters

### Tasks

#### Part A: Replica Set Configuration (20 minutes)
1. **Initialize Replica Set**
   ```javascript
   // Initialize replica set
   rs.initiate({
     _id: "myReplicaSet",
     members: [
       { _id: 0, host: "mongodb-primary:27017", priority: 2 },
       { _id: 1, host: "mongodb-secondary1:27017", priority: 1 },
       { _id: 2, host: "mongodb-secondary2:27017", priority: 1 },
       { _id: 3, host: "mongodb-arbiter:27017", arbiterOnly: true }
     ]
   })
   ```

2. **Read Preference Configuration**
   ```javascript
   // Configure read preferences for different scenarios
   
   // Critical reads - primary only
   db.accounts.find({ accountNumber: "12345" })
     .readPref("primary")
   
   // Analytics reads - secondary preferred
   db.analytics.aggregate([...])
     .readPref("secondaryPreferred")
   
   // Reporting - secondary with tags
   db.reports.find({})
     .readPref("secondary", [{ "datacenter": "west" }])
   ```

#### Part B: Sharding Setup (25 minutes)
1. **Shard Key Selection and Collection Sharding**
   ```javascript
   // Enable sharding on database
   sh.enableSharding("ecommerce")
   
   // Shard orders collection by customerId
   sh.shardCollection("ecommerce.orders", { "customerId": 1 })
   
   // Shard products collection with compound key
   sh.shardCollection("ecommerce.products", { 
     "category": 1, 
     "_id": 1 
   })
   
   // Hash-based sharding for user sessions
   sh.shardCollection("ecommerce.sessions", { 
     "userId": "hashed" 
   })
   ```

2. **Zone Sharding (Geographic Distribution)**
   ```javascript
   // Add shards to zones
   sh.addShardToZone("shard-us", "US")
   sh.addShardToZone("shard-eu", "EU")
   sh.addShardToZone("shard-asia", "ASIA")
   
   // Define zone ranges for orders collection
   sh.updateZoneKeyRange(
     "ecommerce.orders",
     { region: "US", customerId: MinKey },
     { region: "US", customerId: MaxKey },
     "US"
   )
   
   sh.updateZoneKeyRange(
     "ecommerce.orders",
     { region: "EU", customerId: MinKey },
     { region: "EU", customerId: MaxKey },
     "EU"
   )
   ```

3. **Monitoring and Balancing**
   ```javascript
   // Check sharding status
   sh.status()
   
   // Monitor chunk distribution
   db.adminCommand("shardDistribution")
   
   // Check balancer status
   sh.getBalancerState()
   sh.isBalancerRunning()
   
   // Manual chunk operations if needed
   sh.splitFind("ecommerce.orders", { customerId: ObjectId("...") })
   ```

### Challenge Exercise
Design a sharding strategy for a multi-tenant SaaS application with the following requirements:
- Tenant isolation (data from different tenants should not mix)
- Balanced load distribution
- Efficient cross-tenant analytics queries
- Geographic data locality for compliance

---

## Additional Resources and Next Steps

### Performance Monitoring Commands
```javascript
// Enable profiler for slow operations
db.setProfilingLevel(1, { slowms: 100 })

// Check current operations
db.currentOp()

// Database statistics
db.stats()

// Collection statistics
db.orders.stats()
```

### Best Practices Summary
1. **Indexing**: Create indexes that match your query patterns
2. **Schema Design**: Embed for 1:1 and 1:few, reference for 1:many
3. **Transactions**: Use sparingly, only when ACID properties are required
4. **Sharding**: Choose shard keys that provide even distribution
5. **Replica Sets**: Use appropriate read preferences for your use case

### Homework Assignment
Design and implement a complete MongoDB solution for a real-time chat application with the following features:
- User authentication and profiles
- Chat rooms and direct messages
- Message history and search
- Online presence tracking
- File attachments support

Include schema design, indexing strategy, and scalability considerations for 1M+ concurrent users.

---

## hands-on labs using C# and Visual Studio Code, 45 minutes each*

---

## Prerequisites

### Environment Setup (Continuing from Day 2)
- Existing Day 2 project structure
- Docker MongoDB container running
- Additional packages needed:

```bash
# Add additional packages for Day 3
dotnet add package Microsoft.Extensions.Hosting
dotnet add package Microsoft.Extensions.DependencyInjection
dotnet add package Microsoft.Extensions.Logging
dotnet add package Microsoft.Extensions.Logging.Console
dotnet add package Newtonsoft.Json
```

---

## Lab 3: Advanced Schema Design and Data Modeling Patterns (45 minutes)

### Learning Objectives
- Implement complex data modeling patterns in C#
- Design schemas for real-world scenarios
- Handle polymorphic data and inheritance
- Optimize for different access patterns

### Tasks

#### Part A: E-commerce Multi-Tenant Schema Design (20 minutes)

1. **Create Complex Product Hierarchy Models**
   ```csharp
   // Models/Advanced/ProductCatalog.cs
   using MongoDB.Bson;
   using MongoDB.Bson.Serialization.Attributes;
   
   namespace MongoDBLabs.Models.Advanced
   {
       // Base product class for polymorphism
       [BsonDiscriminator(RootClass = true)]
       [BsonKnownTypes(typeof(ElectronicsProduct), typeof(ClothingProduct), typeof(BookProduct))]
       public abstract class BaseProduct
       {
           [BsonId]
           [BsonRepresentation(BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [BsonElement("tenantId")]
           public string TenantId { get; set; } = string.Empty;
           
           [BsonElement("name")]
           public string Name { get; set; } = string.Empty;
           
           [BsonElement("price")]
           public decimal Price { get; set; }
           
           [BsonElement("category")]
           public string Category { get; set; } = string.Empty;
           
           [BsonElement("sku")]
           public string SKU { get; set; } = string.Empty;
           
           [BsonElement("createdAt")]
           public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
           
           [BsonElement("metadata")]
           public Dictionary<string, object> Metadata { get; set; } = new();
       }
       
       // Electronics-specific product
       [BsonDiscriminator("electronics")]
       public class ElectronicsProduct : BaseProduct
       {
           [BsonElement("warranty")]
           public WarrantyInfo Warranty { get; set; } = new();
           
           [BsonElement("specifications")]
           public ElectronicsSpecs Specifications { get; set; } = new();
           
           [BsonElement("energyRating")]
           public string EnergyRating { get; set; } = string.Empty;
       }
       
       // Clothing-specific product
       [BsonDiscriminator("clothing")]
       public class ClothingProduct : BaseProduct
       {
           [BsonElement("sizes")]
           public List<SizeVariant> Sizes { get; set; } = new();
           
           [BsonElement("materials")]
           public List<string> Materials { get; set; } = new();
           
           [BsonElement("careInstructions")]
           public List<string> CareInstructions { get; set; } = new();
           
           [BsonElement("season")]
           public string Season { get; set; } = string.Empty;
       }
       
       // Book-specific product
       [BsonDiscriminator("book")]
       public class BookProduct : BaseProduct
       {
           [BsonElement("author")]
           public AuthorInfo Author { get; set; } = new();
           
           [BsonElement("isbn")]
           public string ISBN { get; set; } = string.Empty;
           
           [BsonElement("publisher")]
           public string Publisher { get; set; } = string.Empty;
           
           [BsonElement("pageCount")]
           public int PageCount { get; set; }
           
           [BsonElement("genres")]
           public List<string> Genres { get; set; } = new();
       }
       
       // Supporting classes
       public class WarrantyInfo
       {
           [BsonElement("duration")]
           public int DurationMonths { get; set; }
           
           [BsonElement("type")]
           public string Type { get; set; } = string.Empty;
           
           [BsonElement("provider")]
           public string Provider { get; set; } = string.Empty;
       }
       
       public class ElectronicsSpecs
       {
           [BsonElement("powerConsumption")]
           public string PowerConsumption { get; set; } = string.Empty;
           
           [BsonElement("dimensions")]
           public Dimensions Dimensions { get; set; } = new();
           
           [BsonElement("weight")]
           public decimal Weight { get; set; }
           
           [BsonElement("connectivity")]
           public List<string> Connectivity { get; set; } = new();
       }
       
       public class SizeVariant
       {
           [BsonElement("size")]
           public string Size { get; set; } = string.Empty;
           
           [BsonElement("inventory")]
           public int Inventory { get; set; }
           
           [BsonElement("priceAdjustment")]
           public decimal PriceAdjustment { get; set; }
       }
       
       public class AuthorInfo
       {
           [BsonElement("name")]
           public string Name { get; set; } = string.Empty;
           
           [BsonElement("biography")]
           public string Biography { get; set; } = string.Empty;
           
           [BsonElement("nationality")]
           public string Nationality { get; set; } = string.Empty;
       }
       
       public class Dimensions
       {
           [BsonElement("length")]
           public decimal Length { get; set; }
           
           [BsonElement("width")]
           public decimal Width { get; set; }
           
           [BsonElement("height")]
           public decimal Height { get; set; }
           
           [BsonElement("unit")]
           public string Unit { get; set; } = "cm";
       }
   }
   ```

2. **Create Advanced User and Review System**
   ```csharp
   // Models/Advanced/UserReviewSystem.cs
   using MongoDB.Bson;
   using MongoDB.Bson.Serialization.Attributes;
   
   namespace MongoDBLabs.Models.Advanced
   {
       // User with embedded profile and preferences
       public class User
       {
           [BsonId]
           [BsonRepresentation(BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [BsonElement("tenantId")]
           public string TenantId { get; set; } = string.Empty;
           
           [BsonElement("username")]
           public string Username { get; set; } = string.Empty;
           
           [BsonElement("email")]
           public string Email { get; set; } = string.Empty;
           
           [BsonElement("profile")]
           public UserProfile Profile { get; set; } = new();
           
           [BsonElement("preferences")]
           public UserPreferences Preferences { get; set; } = new();
           
           [BsonElement("addresses")]
           public List<Address> Addresses { get; set; } = new();
           
           [BsonElement("createdAt")]
           public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
           
           [BsonElement("lastLogin")]
           public DateTime? LastLogin { get; set; }
       }
       
       public class UserProfile
       {
           [BsonElement("firstName")]
           public string FirstName { get; set; } = string.Empty;
           
           [BsonElement("lastName")]
           public string LastName { get; set; } = string.Empty;
           
           [BsonElement("dateOfBirth")]
           public DateTime? DateOfBirth { get; set; }
           
           [BsonElement("phone")]
           public string Phone { get; set; } = string.Empty;
           
           [BsonElement("loyaltyTier")]
           public string LoyaltyTier { get; set; } = "Bronze";
           
           [BsonElement("totalSpent")]
           public decimal TotalSpent { get; set; }
       }
       
       public class UserPreferences
       {
           [BsonElement("newsletter")]
           public bool Newsletter { get; set; } = true;
           
           [BsonElement("smsNotifications")]
           public bool SmsNotifications { get; set; } = false;
           
           [BsonElement("preferredCategories")]
           public List<string> PreferredCategories { get; set; } = new();
           
           [BsonElement("currency")]
           public string Currency { get; set; } = "USD";
           
           [BsonElement("language")]
           public string Language { get; set; } = "en";
       }
       
       public class Address
       {
           [BsonElement("type")]
           public string Type { get; set; } = string.Empty; // home, work, billing, shipping
           
           [BsonElement("street")]
           public string Street { get; set; } = string.Empty;
           
           [BsonElement("city")]
           public string City { get; set; } = string.Empty;
           
           [BsonElement("state")]
           public string State { get; set; } = string.Empty;
           
           [BsonElement("zipCode")]
           public string ZipCode { get; set; } = string.Empty;
           
           [BsonElement("country")]
           public string Country { get; set; } = string.Empty;
           
           [BsonElement("isDefault")]
           public bool IsDefault { get; set; } = false;
       }
       
       // Review system with moderation
       public class ProductReview
       {
           [BsonId]
           [BsonRepresentation(BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [BsonElement("productId")]
           [BsonRepresentation(BsonType.ObjectId)]
           public string ProductId { get; set; } = string.Empty;
           
           [BsonElement("userId")]
           [BsonRepresentation(BsonType.ObjectId)]
           public string UserId { get; set; } = string.Empty;
           
           [BsonElement("rating")]
           public int Rating { get; set; } // 1-5
           
           [BsonElement("title")]
           public string Title { get; set; } = string.Empty;
           
           [BsonElement("content")]
           public string Content { get; set; } = string.Empty;
           
           [BsonElement("pros")]
           public List<string> Pros { get; set; } = new();
           
           [BsonElement("cons")]
           public List<string> Cons { get; set; } = new();
           
           [BsonElement("verified")]
           public bool VerifiedPurchase { get; set; } = false;
           
           [BsonElement("helpful")]
           public ReviewHelpfulness Helpful { get; set; } = new();
           
           [BsonElement("moderation")]
           public ModerationStatus Moderation { get; set; } = new();
           
           [BsonElement("createdAt")]
           public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
       }
       
       public class ReviewHelpfulness
       {
           [BsonElement("upvotes")]
           public int Upvotes { get; set; }
           
           [BsonElement("downvotes")]
           public int Downvotes { get; set; }
           
           [BsonElement("voters")]
           public List<string> Voters { get; set; } = new(); // User IDs who voted
       }
       
       public class ModerationStatus
       {
           [BsonElement("status")]
           public string Status { get; set; } = "pending"; // pending, approved, rejected
           
           [BsonElement("moderatedBy")]
           public string? ModeratedBy { get; set; }
           
           [BsonElement("moderatedAt")]
           public DateTime? ModeratedAt { get; set; }
           
           [BsonElement("reason")]
           public string? Reason { get; set; }
       }
   }
   ```

#### Part B: Advanced Service Implementation (15 minutes)

3. **Create Multi-Tenant Product Service**
   ```csharp
   // Services/Advanced/MultiTenantProductService.cs
   using MongoDB.Driver;
   using MongoDBLabs.Models.Advanced;
   
   namespace MongoDBLabs.Services.Advanced
   {
       public class MultiTenantProductService
       {
           private readonly IMongoCollection<BaseProduct> _products;
           
           public MultiTenantProductService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products.Database.GetCollection<BaseProduct>("advancedProducts");
           }
           
           // Tenant-aware operations
           public async Task<List<T>> GetProductsByTenantAsync<T>(string tenantId) where T : BaseProduct
           {
               var filter = Builders<BaseProduct>.Filter.And(
                   Builders<BaseProduct>.Filter.Eq(p => p.TenantId, tenantId),
                   Builders<BaseProduct>.Filter.OfType<T>()
               );
               
               return await _products.Find(filter).OfType<T>().ToListAsync();
           }
           
           // Polymorphic queries
           public async Task<List<ElectronicsProduct>> GetElectronicsWithWarrantyAsync(string tenantId, int minWarrantyMonths)
           {
               var filter = Builders<BaseProduct>.Filter.And(
                   Builders<BaseProduct>.Filter.Eq(p => p.TenantId, tenantId),
                   Builders<BaseProduct>.Filter.OfType<ElectronicsProduct>(),
                   Builders<BaseProduct>.Filter.Gte("warranty.duration", minWarrantyMonths)
               );
               
               return await _products.Find(filter).OfType<ElectronicsProduct>().ToListAsync();
           }
           
           // Complex clothing queries
           public async Task<List<ClothingProduct>> GetClothingBySizeAndSeasonAsync(
               string tenantId, string size, string season)
           {
               var filter = Builders<BaseProduct>.Filter.And(
                   Builders<BaseProduct>.Filter.Eq(p => p.TenantId, tenantId),
                   Builders<BaseProduct>.Filter.OfType<ClothingProduct>(),
                   Builders<BaseProduct>.Filter.ElemMatch("sizes", 
                       Builders<SizeVariant>.Filter.Eq(s => s.Size, size)),
                   Builders<BaseProduct>.Filter.Eq("season", season)
               );
               
               return await _products.Find(filter).OfType<ClothingProduct>().ToListAsync();
           }
           
           // Book search with author information
           public async Task<List<BookProduct>> SearchBooksByAuthorAsync(string tenantId, string authorName)
           {
               var filter = Builders<BaseProduct>.Filter.And(
                   Builders<BaseProduct>.Filter.Eq(p => p.TenantId, tenantId),
                   Builders<BaseProduct>.Filter.OfType<BookProduct>(),
                   Builders<BaseProduct>.Filter.Regex("author.name", 
                       new MongoDB.Bson.BsonRegularExpression(authorName, "i"))
               );
               
               return await _products.Find(filter).OfType<BookProduct>().ToListAsync();
           }
           
           // Cross-category price analysis
           public async Task<List<CategoryPriceStats>> GetPriceStatsByCategory(string tenantId)
           {
               var pipeline = new BsonDocument[]
               {
                   new BsonDocument("$match", new BsonDocument("tenantId", tenantId)),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = "$category",
                       ["avgPrice"] = new BsonDocument("$avg", "$price"),
                       ["minPrice"] = new BsonDocument("$min", "$price"),
                       ["maxPrice"] = new BsonDocument("$max", "$price"),
                       ["count"] = new BsonDocument("$sum", 1)
                   }),
                   new BsonDocument("$sort", new BsonDocument("avgPrice", -1))
               };
               
               return await _products.Aggregate<CategoryPriceStats>(pipeline).ToListAsync();
           }
       }
       
       public class CategoryPriceStats
       {
           [MongoDB.Bson.Serialization.Attributes.BsonElement("_id")]
           public string Category { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("avgPrice")]
           public decimal AveragePrice { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("minPrice")]
           public decimal MinPrice { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("maxPrice")]
           public decimal MaxPrice { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("count")]
           public int Count { get; set; }
       }
   }
   ```

#### Part C: Testing Complex Schemas (10 minutes)

4. **Create Test Data and Verification**
   ```csharp
   // Add to Program.cs
   static async Task TestAdvancedSchemaDesign()
   {
       Console.WriteLine("\n=== Advanced Schema Design Tests ===\n");
       
       var mongoService = new MongoDBService(configuration);
       var multiTenantService = new MultiTenantProductService(mongoService);
       
       // Create sample products of different types
       var products = new List<BaseProduct>
       {
           new ElectronicsProduct
           {
               TenantId = "tenant1",
               Name = "Smart TV 65\"",
               Price = 899.99m,
               Category = "Electronics",
               SKU = "TV-65-SMART",
               Warranty = new WarrantyInfo { DurationMonths = 24, Type = "Full", Provider = "Manufacturer" },
               Specifications = new ElectronicsSpecs 
               { 
                   PowerConsumption = "150W",
                   Weight = 25.5m,
                   Connectivity = new List<string> { "HDMI", "USB", "WiFi", "Bluetooth" }
               },
               EnergyRating = "A+"
           },
           new ClothingProduct
           {
               TenantId = "tenant1",
               Name = "Winter Jacket",
               Price = 129.99m,
               Category = "Clothing",
               SKU = "WJ-2024-BLK",
               Sizes = new List<SizeVariant>
               {
                   new SizeVariant { Size = "M", Inventory = 10, PriceAdjustment = 0 },
                   new SizeVariant { Size = "L", Inventory = 15, PriceAdjustment = 5 },
                   new SizeVariant { Size = "XL", Inventory = 8, PriceAdjustment = 10 }
               },
               Materials = new List<string> { "Polyester", "Down Fill" },
               Season = "Winter"
           },
           new BookProduct
           {
               TenantId = "tenant1",
               Name = "MongoDB in Action",
               Price = 45.99m,
               Category = "Books",
               SKU = "BOOK-MDB-001",
               Author = new AuthorInfo { Name = "Kyle Banker", Nationality = "US" },
               ISBN = "978-1617291609",
               Publisher = "Manning Publications",
               PageCount = 480,
               Genres = new List<string> { "Technology", "Database", "Programming" }
           }
       };
       
       var collection = mongoService.Products.Database.GetCollection<BaseProduct>("advancedProducts");
       await collection.InsertManyAsync(products);
       
       // Test polymorphic queries
       Console.WriteLine("Electronics with warranty >= 12 months:");
       var electronics = await multiTenantService.GetElectronicsWithWarrantyAsync("tenant1", 12);
       foreach (var product in electronics)
       {
           Console.WriteLine($"- {product.Name}: {product.Warranty.DurationMonths} months warranty");
       }
       
       Console.WriteLine("\nClothing available in size L for Winter:");
       var clothing = await multiTenantService.GetClothingBySizeAndSeasonAsync("tenant1", "L", "Winter");
       foreach (var product in clothing)
       {
           Console.WriteLine($"- {product.Name}: {product.Season}");
       }
       
       Console.WriteLine("\nPrice statistics by category:");
       var stats = await multiTenantService.GetPriceStatsByCategory("tenant1");
       foreach (var stat in stats)
       {
           Console.WriteLine($"- {stat.Category}: Avg ${stat.AveragePrice:F2}, Range ${stat.MinPrice:F2}-${stat.MaxPrice:F2}");
       }
   }
   ```

### Deliverables
- Complex polymorphic product hierarchy implementation
- Multi-tenant data isolation patterns
- Advanced querying across different product types
- Performance analysis of schema design decisions

---

## Lab 4: Real-time Analytics and Reporting with Aggregation Pipelines (45 minutes)

### Learning Objectives
- Build sophisticated aggregation pipelines for business analytics
- Implement real-time dashboard data feeds
- Create time-series analytics and trending calculations
- Handle large-scale data aggregation efficiently

### Tasks

#### Part A: Analytics Models and Services (20 minutes)

1. **Create Analytics-Focused Models**
   ```csharp
   // Models/Analytics/SalesAnalytics.cs
   using MongoDB.Bson;
   using MongoDB.Bson.Serialization.Attributes;
   
   namespace MongoDBLabs.Models.Analytics
   {
       public class SalesTransaction
       {
           [BsonId]
           [BsonRepresentation(BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [BsonElement("orderId")]
           public string OrderId { get; set; } = string.Empty;
           
           [BsonElement("customerId")]
           [BsonRepresentation(BsonType.ObjectId)]
           public string CustomerId { get; set; } = string.Empty;
           
           [BsonElement("timestamp")]
           public DateTime Timestamp { get; set; } = DateTime.UtcNow;
           
           [BsonElement("items")]
           public List<SalesItem> Items { get; set; } = new();
           
           [BsonElement("totals")]
           public TransactionTotals Totals { get; set; } = new();
           
           [BsonElement("customer")]
           public CustomerSummary Customer { get; set; } = new();
           
           [BsonElement("location")]
           public GeographicInfo Location { get; set; } = new();
           
           [BsonElement("channel")]
           public string Channel { get; set; } = "online"; // online, mobile, store
           
           [BsonElement("paymentMethod")]
           public string PaymentMethod { get; set; } = string.Empty;
       }
       
       public class SalesItem
       {
           [BsonElement("productId")]
           [BsonRepresentation(BsonType.ObjectId)]
           public string ProductId { get; set; } = string.Empty;
           
           [BsonElement("productName")]
           public string ProductName { get; set; } = string.Empty;
           
           [BsonElement("category")]
           public string Category { get; set; } = string.Empty;
           
           [BsonElement("brand")]
           public string Brand { get; set; } = string.Empty;
           
           [BsonElement("quantity")]
           public int Quantity { get; set; }
           
           [BsonElement("unitPrice")]
           public decimal UnitPrice { get; set; }
           
           [BsonElement("totalPrice")]
           public decimal TotalPrice { get; set; }
           
           [BsonElement("discount")]
           public decimal Discount { get; set; }
       }
       
       public class TransactionTotals
       {
           [BsonElement("subtotal")]
           public decimal Subtotal { get; set; }
           
           [BsonElement("tax")]
           public decimal Tax { get; set; }
           
           [BsonElement("shipping")]
           public decimal Shipping { get; set; }
           
           [BsonElement("discount")]
           public decimal Discount { get; set; }
           
           [BsonElement("total")]
           public decimal Total { get; set; }
       }
       
       public class CustomerSummary
       {
           [BsonElement("segment")]
           public string Segment { get; set; } = string.Empty; // new, returning, vip
           
           [BsonElement("acquisitionChannel")]
           public string AcquisitionChannel { get; set; } = string.Empty;
           
           [BsonElement("lifetimeValue")]
           public decimal LifetimeValue { get; set; }
           
           [BsonElement("previousOrderCount")]
           public int PreviousOrderCount { get; set; }
       }
       
       public class GeographicInfo
       {
           [BsonElement("country")]
           public string Country { get; set; } = string.Empty;
           
           [BsonElement("region")]
           public string Region { get; set; } = string.Empty;
           
           [BsonElement("city")]
           public string City { get; set; } = string.Empty;
           
           [BsonElement("timezone")]
           public string Timezone { get; set; } = string.Empty;
           
           [BsonElement("coordinates")]
           public GeoPoint? Coordinates { get; set; }
       }
       
       public class GeoPoint
       {
           [BsonElement("type")]
           public string Type { get; set; } = "Point";
           
           [BsonElement("coordinates")]
           public double[] Coordinates { get; set; } = new double[2]; // [longitude, latitude]
       }
   }
   ```

2. **Create Advanced Analytics Service**
   ```csharp
   // Services/Analytics/SalesAnalyticsService.cs
   using MongoDB.Driver;
   using MongoDB.Bson;
   using MongoDBLabs.Models.Analytics;
   
   namespace MongoDBLabs.Services.Analytics
   {
       public class SalesAnalyticsService
       {
           private readonly IMongoCollection<SalesTransaction> _transactions;
           
           public SalesAnalyticsService(MongoDBService mongoDBService)
           {
               _transactions = mongoDBService.Products.Database.GetCollection<SalesTransaction>("salesTransactions");
           }
           
           // Real-time dashboard metrics
           public async Task<DashboardMetrics> GetRealTimeDashboardAsync(DateTime from, DateTime to)
           {
               var pipeline = new BsonDocument[]
               {
                   new BsonDocument("$match", new BsonDocument
                   {
                       ["timestamp"] = new BsonDocument
                       {
                           ["$gte"] = from,
                           ["$lte"] = to
                       }
                   }),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = BsonNull.Value,
                       ["totalRevenue"] = new BsonDocument("$sum", "$totals.total"),
                       ["totalOrders"] = new BsonDocument("$sum", 1),
                       ["averageOrderValue"] = new BsonDocument("$avg", "$totals.total"),
                       ["totalItems"] = new BsonDocument("$sum", new BsonDocument("$sum", "$items.quantity")),
                       ["uniqueCustomers"] = new BsonDocument("$addToSet", "$customerId")
                   }),
                   new BsonDocument("$addFields", new BsonDocument
                   {
                       ["uniqueCustomerCount"] = new BsonDocument("$size", "$uniqueCustomers")
                   })
               };
               
               var result = await _transactions.Aggregate<BsonDocument>(pipeline).FirstOrDefaultAsync();
               
               return new DashboardMetrics
               {
                   TotalRevenue = result?["totalRevenue"]?.AsDecimal ?? 0,
                   TotalOrders = result?["totalOrders"]?.AsInt32 ?? 0,
                   AverageOrderValue = result?["averageOrderValue"]?.AsDecimal ?? 0,
                   TotalItems = result?["totalItems"]?.AsInt32 ?? 0,
                   UniqueCustomers = result?["uniqueCustomerCount"]?.AsInt32 ?? 0
               };
           }
           
           // Hourly sales trends
           public async Task<List<HourlyTrend>> GetHourlySalesTrendsAsync(DateTime date)
           {
               var startOfDay = date.Date;
               var endOfDay = startOfDay.AddDays(1);
               
               var pipeline = new BsonDocument[]
               {
                   new BsonDocument("$match", new BsonDocument
                   {
                       ["timestamp"] = new BsonDocument
                       {
                           ["$gte"] = startOfDay,
                           ["$lt"] = endOfDay
                       }
                   }),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = new BsonDocument("$hour", "$timestamp"),
                       ["revenue"] = new BsonDocument("$sum", "$totals.total"),
                       ["orders"] = new BsonDocument("$sum", 1),
                       ["avgOrderValue"] = new BsonDocument("$avg", "$totals.total")
                   }),
                   new BsonDocument("$sort", new BsonDocument("_id", 1))
               };
               
               return await _transactions.Aggregate<HourlyTrend>(pipeline).ToListAsync();
           }
           
           // Geographic sales distribution
           public async Task<List<GeographicSales>> GetSalesByRegionAsync(DateTime from, DateTime to)
           {
               var pipeline = new BsonDocument[]
               {
                   new BsonDocument("$match", new BsonDocument
                   {
                       ["timestamp"] = new BsonDocument
                       {
                           ["$gte"] = from,
                           ["$lte"] = to
                       }
                   }),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = new BsonDocument
                       {
                           ["country"] = "$location.country",
                           ["region"] = "$location.region"
                       },
                       ["totalRevenue"] = new BsonDocument("$sum", "$totals.total"),
                       ["orderCount"] = new BsonDocument("$sum", 1),
                       ["uniqueCustomers"] = new BsonDocument("$addToSet", "$customerId")
                   }),
                   new BsonDocument("$addFields", new BsonDocument
                   {
                       ["customerCount"] = new BsonDocument("$size", "$uniqueCustomers")
                   }),
                   new BsonDocument("$sort", new BsonDocument("totalRevenue", -1))
               };
               
               return await _transactions.Aggregate<GeographicSales>(pipeline).ToListAsync();
           }
           
           // Product performance analysis
           public async Task<List<ProductPerformance>> GetTopPerformingProductsAsync(
               DateTime from, DateTime to, int limit = 20)
           {
               var pipeline = new BsonDocument[]
               {
                   new BsonDocument("$match", new BsonDocument
                   {
                       ["timestamp"] = new BsonDocument
                       {
                           ["$gte"] = from,
                           ["$lte"] = to
                       }
                   }),
                   new BsonDocument("$unwind", "$items"),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = new BsonDocument
                       {
                           ["productId"] = "$items.productId",
                           ["productName"] = "$items.productName",
                           ["category"] = "$items.category"
                       },
                       ["totalRevenue"] = new BsonDocument("$sum", "$items.totalPrice"),
                       ["totalQuantity"] = new BsonDocument("$sum", "$items.quantity"),
                       ["orderCount"] = new BsonDocument("$sum", 1),
                       ["avgPrice"] = new BsonDocument("$avg", "$items.unitPrice")
                   }),
                   new BsonDocument("$sort", new BsonDocument("totalRevenue", -1)),
                   new BsonDocument("$limit", limit)
               };
               
               return await _transactions.Aggregate<ProductPerformance>(pipeline).ToListAsync();
           }
           
           // Customer segmentation analysis
           public async Task<List<CustomerSegmentAnalysis>> GetCustomerSegmentationAsync(DateTime from, DateTime to)
           {
               var pipeline = new BsonDocument[]
               {
                   new BsonDocument("$match", new BsonDocument
                   {
                       ["timestamp"] = new BsonDocument
                       {
                           ["$gte"] = from,
                           ["$lte"] = to
                       }
                   }),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = "$customer.segment",
                       ["customerCount"] = new BsonDocument("$addToSet", "$customerId"),
                       ["totalRevenue"] = new BsonDocument("$sum", "$totals.total"),
                       ["totalOrders"] = new BsonDocument("$sum", 1),
                       ["avgOrderValue"] = new BsonDocument("$avg", "$totals.total")
                   }),
                   new BsonDocument("$addFields", new BsonDocument
                   {
                       ["uniqueCustomers"] = new BsonDocument("$size", "$customerCount")
                   }),
                   new BsonDocument("$project", new BsonDocument
                   {
                       ["customerCount"] = 0
                   })
               };
               
               return await _transactions.Aggregate<CustomerSegmentAnalysis>(pipeline).ToListAsync();
           }
           
           // Advanced cohort analysis
           public async Task<List<CohortData>> GetCohortAnalysisAsync(int monthsBack = 12)
           {
               var cutoffDate = DateTime.UtcNow.AddMonths(-monthsBack);
               
               var pipeline = new BsonDocument[]
               {
                   new BsonDocument("$match", new BsonDocument
                   {
                       ["timestamp"] = new BsonDocument("$gte", cutoffDate)
                   }),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = new BsonDocument
                       {
                           ["customerId"] = "$customerId",
                           ["month"] = new BsonDocument
                           {
                               ["year"] = new BsonDocument("$year", "$timestamp"),
                               ["month"] = new BsonDocument("$month", "$timestamp")
                           }
                       },
                       ["monthlySpend"] = new BsonDocument("$sum", "$totals.total"),
                       ["orderCount"] = new BsonDocument("$sum", 1)
                   }),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = "$_id.month",
                       ["activeCustomers"] = new BsonDocument("$sum", 1),
                       ["totalRevenue"] = new BsonDocument("$sum", "$monthlySpend"),
                       ["avgSpendPerCustomer"] = new BsonDocument("$avg", "$monthlySpend")
                   }),
                   new BsonDocument("$sort", new BsonDocument
                   {
                       ["_id.year"] = 1,
                       ["_id.month"] = 1
                   })
               };
               
               return await _transactions.Aggregate<CohortData>(pipeline).ToListAsync();
           }
       }
       
       // Result classes
       public class DashboardMetrics
       {
           public decimal TotalRevenue { get; set; }
           public int TotalOrders { get; set; }
           public decimal AverageOrderValue { get; set; }
           public int TotalItems { get; set; }
           public int UniqueCustomers { get; set; }
       }
       
       public class HourlyTrend
       {
           [BsonElement("_id")]
           public int Hour { get; set; }
           
           [BsonElement("revenue")]
           public decimal Revenue { get; set; }
           
           [BsonElement("orders")]
           public int Orders { get; set; }
           
           [BsonElement("avgOrderValue")]
           public decimal AvgOrderValue { get; set; }
       }
       
       public class GeographicSales
       {
           [BsonElement("_id")]
           public GeographicKey Id { get; set; } = new();
           
           [BsonElement("totalRevenue")]
           public decimal TotalRevenue { get; set; }
           
           [BsonElement("orderCount")]
           public int OrderCount { get; set; }
           
           [BsonElement("customerCount")]
           public int CustomerCount { get; set; }
       }
       
       public class GeographicKey
       {
           [BsonElement("country")]
           public string Country { get; set; } = string.Empty;
           
           [BsonElement("region")]
           public string Region { get; set; } = string.Empty;
       }
       
       public class ProductPerformance
       {
           [BsonElement("_id")]
           public ProductKey Id { get; set; } = new();
           
           [BsonElement("totalRevenue")]
           public decimal TotalRevenue { get; set; }
           
           [BsonElement("totalQuantity")]
           public int TotalQuantity { get; set; }
           
           [BsonElement("orderCount")]
           public int OrderCount { get; set; }
           
           [BsonElement("avgPrice")]
           public decimal AvgPrice { get; set; }
       }
       
       public class ProductKey
       {
           [BsonElement("productId")]
           public string ProductId { get; set; } = string.Empty;
           
           [BsonElement("productName")]
           public string ProductName { get; set; } = string.Empty;
           
           [BsonElement("category")]
           public string Category { get; set; } = string.Empty;
       }
       
       public class CustomerSegmentAnalysis
       {
           [BsonElement("_id")]
           public string Segment { get; set; } = string.Empty;
           
           [BsonElement("uniqueCustomers")]
           public int UniqueCustomers { get; set; }
           
           [BsonElement("totalRevenue")]
           public decimal TotalRevenue { get; set; }
           
           [BsonElement("totalOrders")]
           public int TotalOrders { get; set; }
           
           [BsonElement("avgOrderValue")]
           public decimal AvgOrderValue { get; set; }
       }
       
       public class CohortData
       {
           [BsonElement("_id")]
           public MonthYear Id { get; set; } = new();
           
           [BsonElement("activeCustomers")]
           public int ActiveCustomers { get; set; }
           
           [BsonElement("totalRevenue")]
           public decimal TotalRevenue { get; set; }
           
           [BsonElement("avgSpendPerCustomer")]
           public decimal AvgSpendPerCustomer { get; set; }
       }
       
       public class MonthYear
       {
           [BsonElement("year")]
           public int Year { get; set; }
           
           [BsonElement("month")]
           public int Month { get; set; }
       }
   }
   ```

#### Part B: Sample Data Generation and Testing (15 minutes)

3. **Create Analytics Data Generator**
   ```csharp
   // Services/Analytics/AnalyticsDataGenerator.cs
   using MongoDBLabs.Models.Analytics;
   using MongoDB.Driver;
   
   namespace MongoDBLabs.Services.Analytics
   {
       public class AnalyticsDataGenerator
       {
           private readonly IMongoCollection<SalesTransaction> _transactions;
           private readonly Random _random = new();
           
           public AnalyticsDataGenerator(MongoDBService mongoDBService)
           {
               _transactions = mongoDBService.Products.Database.GetCollection<SalesTransaction>("salesTransactions");
           }
           
           public async Task GenerateAnalyticsDataAsync(int transactionCount = 1000)
           {
               Console.WriteLine($"Generating {transactionCount} sales transactions...");
               
               var transactions = new List<SalesTransaction>();
               var countries = new[] { "US", "UK", "CA", "AU", "DE", "FR", "JP" };
               var regions = new[] { "North", "South", "East", "West", "Central" };
               var cities = new[] { "New York", "London", "Toronto", "Sydney", "Berlin", "Paris", "Tokyo" };
               var channels = new[] { "online", "mobile", "store" };
               var segments = new[] { "new", "returning", "vip" };
               var categories = new[] { "Electronics", "Clothing", "Books", "Home", "Sports" };
               var brands = new[] { "BrandA", "BrandB", "BrandC", "BrandD", "BrandE" };
               var paymentMethods = new[] { "credit_card", "debit_card", "paypal", "apple_pay", "bank_transfer" };
               
               for (int i = 0; i < transactionCount; i++)
               {
                   var timestamp = DateTime.UtcNow.AddDays(-_random.Next(365)).AddHours(-_random.Next(24));
                   var itemCount = _random.Next(1, 6);
                   var items = new List<SalesItem>();
                   decimal subtotal = 0;
                   
                   for (int j = 0; j < itemCount; j++)
                   {
                       var quantity = _random.Next(1, 4);
                       var unitPrice = (decimal)(_random.NextDouble() * 200 + 10);
                       var totalPrice = quantity * unitPrice;
                       var discount = totalPrice * (decimal)(_random.NextDouble() * 0.1); // 0-10% discount
                       
                       items.Add(new SalesItem
                       {
                           ProductId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                           ProductName = $"Product {_random.Next(1000)}",
                           Category = categories[_random.Next(categories.Length)],
                           Brand = brands[_random.Next(brands.Length)],
                           Quantity = quantity,
                           UnitPrice = unitPrice,
                           TotalPrice = totalPrice - discount,
                           Discount = discount
                       });
                       
                       subtotal += totalPrice - discount;
                   }
                   
                   var tax = subtotal * 0.08m; // 8% tax
                   var shipping = _random.NextDouble() > 0.5 ? (decimal)(_random.NextDouble() * 20 + 5) : 0;
                   var total = subtotal + tax + shipping;
                   
                   transactions.Add(new SalesTransaction
                   {
                       OrderId = $"ORD-{DateTime.UtcNow.Ticks}-{i}",
                       CustomerId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                       Timestamp = timestamp,
                       Items = items,
                       Totals = new TransactionTotals
                       {
                           Subtotal = subtotal,
                           Tax = tax,
                           Shipping = shipping,
                           Discount = items.Sum(item => item.Discount),
                           Total = total
                       },
                       Customer = new CustomerSummary
                       {
                           Segment = segments[_random.Next(segments.Length)],
                           AcquisitionChannel = channels[_random.Next(channels.Length)],
                           LifetimeValue = (decimal)(_random.NextDouble() * 5000),
                           PreviousOrderCount = _random.Next(0, 20)
                       },
                       Location = new GeographicInfo
                       {
                           Country = countries[_random.Next(countries.Length)],
                           Region = regions[_random.Next(regions.Length)],
                           City = cities[_random.Next(cities.Length)],
                           Timezone = "UTC",
                           Coordinates = new GeoPoint
                           {
                               Coordinates = new double[] 
                               { 
                                   _random.NextDouble() * 360 - 180, // longitude
                                   _random.NextDouble() * 180 - 90   // latitude
                               }
                           }
                       },
                       Channel = channels[_random.Next(channels.Length)],
                       PaymentMethod = paymentMethods[_random.Next(paymentMethods.Length)]
                   });
                   
                   if (transactions.Count == 100)
                   {
                       await _transactions.InsertManyAsync(transactions);
                       transactions.Clear();
                       Console.WriteLine($"Generated {i + 1} transactions...");
                   }
               }
               
               if (transactions.Any())
               {
                   await _transactions.InsertManyAsync(transactions);
               }
               
               Console.WriteLine($"Analytics data generation completed: {transactionCount} transactions created.");
           }
       }
   }
   ```

#### Part C: Testing Analytics Pipelines (10 minutes)

4. **Create Analytics Testing Program**
   ```csharp
   // Add to Program.cs
   static async Task TestRealTimeAnalytics()
   {
       Console.WriteLine("\n=== Real-time Analytics Tests ===\n");
       
       var mongoService = new MongoDBService(configuration);
       var analyticsService = new SalesAnalyticsService(mongoService);
       var dataGenerator = new AnalyticsDataGenerator(mongoService);
       
       // Generate sample data
       await dataGenerator.GenerateAnalyticsDataAsync(500);
       
       var now = DateTime.UtcNow;
       var thirtyDaysAgo = now.AddDays(-30);
       
       // Dashboard metrics
       Console.WriteLine("=== Dashboard Metrics (Last 30 Days) ===");
       var dashboard = await analyticsService.GetRealTimeDashboardAsync(thirtyDaysAgo, now);
       Console.WriteLine($"Total Revenue: ${dashboard.TotalRevenue:F2}");
       Console.WriteLine($"Total Orders: {dashboard.TotalOrders:N0}");
       Console.WriteLine($"Average Order Value: ${dashboard.AverageOrderValue:F2}");
       Console.WriteLine($"Total Items Sold: {dashboard.TotalItems:N0}");
       Console.WriteLine($"Unique Customers: {dashboard.UniqueCustomers:N0}");
       
       // Hourly trends for today
       Console.WriteLine("\n=== Today's Hourly Trends ===");
       var hourlyTrends = await analyticsService.GetHourlySalesTrendsAsync(DateTime.Today);
       foreach (var trend in hourlyTrends.Take(10))
       {
           Console.WriteLine($"Hour {trend.Hour:D2}: ${trend.Revenue:F2} ({trend.Orders} orders)");
       }
       
       // Geographic distribution
       Console.WriteLine("\n=== Sales by Region ===");
       var geoSales = await analyticsService.GetSalesByRegionAsync(thirtyDaysAgo, now);
       foreach (var sale in geoSales.Take(5))
       {
           Console.WriteLine($"{sale.Id.Country}-{sale.Id.Region}: ${sale.TotalRevenue:F2} ({sale.OrderCount} orders)");
       }
       
       // Top products
       Console.WriteLine("\n=== Top Performing Products ===");
       var topProducts = await analyticsService.GetTopPerformingProductsAsync(thirtyDaysAgo, now, 5);
       foreach (var product in topProducts)
       {
           Console.WriteLine($"{product.Id.ProductName}: ${product.TotalRevenue:F2} ({product.TotalQuantity} sold)");
       }
       
       // Customer segmentation
       Console.WriteLine("\n=== Customer Segmentation ===");
       var segments = await analyticsService.GetCustomerSegmentationAsync(thirtyDaysAgo, now);
       foreach (var segment in segments)
       {
           Console.WriteLine($"{segment.Segment}: {segment.UniqueCustomers} customers, ${segment.TotalRevenue:F2} revenue");
       }
       
       // Cohort analysis
       Console.WriteLine("\n=== Monthly Cohort Analysis ===");
       var cohorts = await analyticsService.GetCohortAnalysisAsync(6);
       foreach (var cohort in cohorts)
       {
           Console.WriteLine($"{cohort.Id.Year}-{cohort.Id.Month:D2}: {cohort.ActiveCustomers} customers, ${cohort.AvgSpendPerCustomer:F2} avg spend");
       }
   }
   ```

### Deliverables
- Comprehensive sales analytics pipeline implementation
- Real-time dashboard metrics calculation
- Geographic and temporal trend analysis
- Customer segmentation and cohort analysis tools

---

## Lab 5: High-Performance Data Processing and Bulk Operations (45 minutes)

### Learning Objectives
- Implement high-performance bulk operations
- Handle large dataset processing efficiently
- Optimize memory usage and processing speed
- Implement parallel processing patterns

### Tasks

#### Part A: Bulk Operations and Performance Optimization (25 minutes)

1. **Create High-Performance Bulk Service**
   ```csharp
   // Services/Performance/BulkProcessingService.cs
   using MongoDB.Driver;
   using System.Collections.Concurrent;
   using System.Diagnostics;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services.Performance
   {
       public class BulkProcessingService
       {
           private readonly IMongoCollection<Product> _products;
           private readonly IMongoCollection<BulkOperationLog> _operationLogs;
           
           public BulkProcessingService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
               _operationLogs = mongoDBService.Products.Database.GetCollection<BulkOperationLog>("bulkOperationLogs");
           }
           
           // High-performance bulk insert with batching
           public async Task<BulkOperationResult> BulkInsertProductsAsync(
               IEnumerable<Product> products, 
               int batchSize = 1000,
               bool ordered = false)
           {
               var stopwatch = Stopwatch.StartNew();
               var totalInserted = 0;
               var errors = new List<string>();
               
               try
               {
                   var batches = products.Chunk(batchSize);
                   
                   var options = new InsertManyOptions
                   {
                       IsOrdered = ordered,
                       BypassDocumentValidation = false
                   };
                   
                   foreach (var batch in batches)
                   {
                       try
                       {
                           await _products.InsertManyAsync(batch, options);
                           totalInserted += batch.Count();
                           Console.WriteLine($"Inserted batch of {batch.Count()} products. Total: {totalInserted}");
                       }
                       catch (MongoBulkWriteException ex)
                       {
                           totalInserted += ex.Result.InsertedCount;
                           foreach (var error in ex.WriteErrors)
                           {
                               errors.Add($"Index {error.Index}: {error.Message}");
                           }
                           
                           if (ordered) break; // Stop on first error if ordered
                       }
                   }
               }
               catch (Exception ex)
               {
                   errors.Add($"Fatal error: {ex.Message}");
               }
               
               stopwatch.Stop();
               
               var result = new BulkOperationResult
               {
                   OperationType = "BulkInsert",
                   TotalProcessed = totalInserted,
                   Errors = errors,
                   ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                   ItemsPerSecond = totalInserted / (stopwatch.ElapsedMilliseconds / 1000.0)
               };
               
               await LogOperationAsync(result);
               return result;
           }
           
           // Optimized bulk update operations
           public async Task<BulkOperationResult> BulkUpdateProductsAsync(
               Dictionary<string, decimal> priceUpdates,
               int batchSize = 1000)
           {
               var stopwatch = Stopwatch.StartNew();
               var totalUpdated = 0;
               var errors = new List<string>();
               
               try
               {
                   var batches = priceUpdates.Chunk(batchSize);
                   
                   foreach (var batch in batches)
                   {
                       var bulkOps = batch.Select(kvp => 
                           new UpdateOneModel<Product>(
                               Builders<Product>.Filter.Eq(p => p.Id, kvp.Key),
                               Builders<Product>.Update.Set(p => p.Price, kvp.Value)
                           )
                       ).ToList();
                       
                       try
                       {
                           var result = await _products.BulkWriteAsync(bulkOps, new BulkWriteOptions { IsOrdered = false });
                           totalUpdated += (int)result.ModifiedCount;
                           Console.WriteLine($"Updated batch of {result.ModifiedCount} products. Total: {totalUpdated}");
                       }
                       catch (MongoBulkWriteException ex)
                       {
                           totalUpdated += (int)ex.Result.ModifiedCount;
                           foreach (var error in ex.WriteErrors)
                           {
                               errors.Add($"Update error: {error.Message}");
                           }
                       }
                   }
               }
               catch (Exception ex)
               {
                   errors.Add($"Fatal error: {ex.Message}");
               }
               
               stopwatch.Stop();
               
               var result = new BulkOperationResult
               {
                   OperationType = "BulkUpdate",
                   TotalProcessed = totalUpdated,
                   Errors = errors,
                   ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                   ItemsPerSecond = totalUpdated / (stopwatch.ElapsedMilliseconds / 1000.0)
               };
               
               await LogOperationAsync(result);
               return result;
           }
           
           // Parallel processing with concurrency control
           public async Task<BulkOperationResult> ParallelBulkProcessAsync<T>(
               IEnumerable<T> items,
               Func<T, Task<bool>> processor,
               int maxConcurrency = Environment.ProcessorCount)
           {
               var stopwatch = Stopwatch.StartNew();
               var totalProcessed = 0;
               var errors = new ConcurrentBag<string>();
               
               var semaphore = new SemaphoreSlim(maxConcurrency, maxConcurrency);
               var tasks = items.Select(async item =>
               {
                   await semaphore.WaitAsync();
                   try
                   {
                       var success = await processor(item);
                       if (success) Interlocked.Increment(ref totalProcessed);
                   }
                   catch (Exception ex)
                   {
                       errors.Add($"Processing error: {ex.Message}");
                   }
                   finally
                   {
                       semaphore.Release();
                   }
               });
               
               await Task.WhenAll(tasks);
               stopwatch.Stop();
               
               return new BulkOperationResult
               {
                   OperationType = "ParallelBulkProcess",
                   TotalProcessed = totalProcessed,
                   Errors = errors.ToList(),
                   ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                   ItemsPerSecond = totalProcessed / (stopwatch.ElapsedMilliseconds / 1000.0)
               };
           }
           
           // Memory-efficient streaming operations
           public async Task<BulkOperationResult> StreamingBulkInsertAsync(
               IAsyncEnumerable<Product> productStream,
               int bufferSize = 1000)
           {
               var stopwatch = Stopwatch.StartNew();
               var totalInserted = 0;
               var errors = new List<string>();
               var buffer = new List<Product>(bufferSize);
               
               try
               {
                   await foreach (var product in productStream)
                   {
                       buffer.Add(product);
                       
                       if (buffer.Count >= bufferSize)
                       {
                           var insertResult = await FlushBufferAsync(buffer);
                           totalInserted += insertResult.inserted;
                           errors.AddRange(insertResult.errors);
                           buffer.Clear();
                       }
                   }
                   
                   // Flush remaining items
                   if (buffer.Count > 0)
                   {
                       var insertResult = await FlushBufferAsync(buffer);
                       totalInserted += insertResult.inserted;
                       errors.AddRange(insertResult.errors);
                   }
               }
               catch (Exception ex)
               {
                   errors.Add($"Streaming error: {ex.Message}");
               }
               
               stopwatch.Stop();
               
               return new BulkOperationResult
               {
                   OperationType = "StreamingBulkInsert",
                   TotalProcessed = totalInserted,
                   Errors = errors,
                   ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                   ItemsPerSecond = totalInserted / (stopwatch.ElapsedMilliseconds / 1000.0)
               };
           }
           
           private async Task<(int inserted, List<string> errors)> FlushBufferAsync(List<Product> buffer)
           {
               try
               {
                   await _products.InsertManyAsync(buffer, new InsertManyOptions { IsOrdered = false });
                   Console.WriteLine($"Flushed buffer: {buffer.Count} products inserted");
                   return (buffer.Count, new List<string>());
               }
               catch (MongoBulkWriteException ex)
               {
                   var errors = ex.WriteErrors.Select(e => e.Message).ToList();
                   return (ex.Result.InsertedCount, errors);
               }
           }
           
           private async Task LogOperationAsync(BulkOperationResult result)
           {
               var log = new BulkOperationLog
               {
                   OperationType = result.OperationType,
                   TotalProcessed = result.TotalProcessed,
                   ErrorCount = result.Errors.Count,
                   ExecutionTimeMs = result.ExecutionTimeMs,
                   ItemsPerSecond = result.ItemsPerSecond,
                   Timestamp = DateTime.UtcNow
               };
               
               await _operationLogs.InsertOneAsync(log);
           }
       }
       
       public class BulkOperationResult
       {
           public string OperationType { get; set; } = string.Empty;
           public int TotalProcessed { get; set; }
           public List<string> Errors { get; set; } = new();
           public long ExecutionTimeMs { get; set; }
           public double ItemsPerSecond { get; set; }
       }
       
       public class BulkOperationLog
       {
           [MongoDB.Bson.Serialization.Attributes.BsonId]
           [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("operationType")]
           public string OperationType { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("totalProcessed")]
           public int TotalProcessed { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("errorCount")]
           public int ErrorCount { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("executionTimeMs")]
           public long ExecutionTimeMs { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("itemsPerSecond")]
           public double ItemsPerSecond { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("timestamp")]
           public DateTime Timestamp { get; set; }
       }
   }
   
   // Extension method for chunking
   public static class EnumerableExtensions
   {
       public static IEnumerable<T[]> Chunk<T>(this IEnumerable<T> source, int size)
       {
           var list = source.ToList();
           for (int i = 0; i < list.Count; i += size)
           {
               yield return list.Skip(i).Take(size).ToArray();
           }
       }
   }
   ```

#### Part B: Performance Monitoring and Memory Management (20 minutes)

2. **Create Performance Monitoring Service**
   ```csharp
   // Services/Performance/PerformanceMonitoringService.cs
   using MongoDB.Driver;
   using System.Diagnostics;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services.Performance
   {
       public class PerformanceMonitoringService
       {
           private readonly IMongoCollection<Product> _products;
           private readonly IMongoCollection<PerformanceMetric> _metrics;
           
           public PerformanceMonitoringService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
               _metrics = mongoDBService.Products.Database.GetCollection<PerformanceMetric>("performanceMetrics");
           }
           
           // Benchmark different query approaches
           public async Task<PerformanceBenchmark> BenchmarkQueryApproachesAsync(int iterations = 100)
           {
               var results = new PerformanceBenchmark();
               
               // Warm up
               await _products.Find(_ => true).Limit(10).ToListAsync();
               
               // Test 1: Simple filter performance
               var simpleFilterTimes = new List<long>();
               for (int i = 0; i < iterations; i++)
               {
                   var sw = Stopwatch.StartNew();
                   await _products.Find(p => p.Category == "Electronics").ToListAsync();
                   sw.Stop();
                   simpleFilterTimes.Add(sw.ElapsedMilliseconds);
               }
               results.SimpleFilterAvgMs = simpleFilterTimes.Average();
               
               // Test 2: Complex filter performance
               var complexFilterTimes = new List<long>();
               for (int i = 0; i < iterations; i++)
               {
                   var sw = Stopwatch.StartNew();
                   await _products.Find(p => 
                       p.Category == "Electronics" && 
                       p.Price >= 100 && 
                       p.Price <= 1000 && 
                       p.InStock == true
                   ).ToListAsync();
                   sw.Stop();
                   complexFilterTimes.Add(sw.ElapsedMilliseconds);
               }
               results.ComplexFilterAvgMs = complexFilterTimes.Average();
               
               // Test 3: Aggregation performance
               var aggregationTimes = new List<long>();
               for (int i = 0; i < iterations; i++)
               {
                   var sw = Stopwatch.StartNew();
                   await _products.Aggregate()
                       .Match(p => p.Category == "Electronics")
                       .Group(p => p.Category, g => new { Category = g.Key, Count = g.Count(), AvgPrice = g.Average(p => p.Price) })
                       .ToListAsync();
                   sw.Stop();
                   aggregationTimes.Add(sw.ElapsedMilliseconds);
               }
               results.AggregationAvgMs = aggregationTimes.Average();
               
               // Test 4: Projection performance
               var projectionTimes = new List<long>();
               for (int i = 0; i < iterations; i++)
               {
                   var sw = Stopwatch.StartNew();
                   await _products.Find(_ => true)
                       .Project(p => new { p.Name, p.Price, p.Category })
                       .ToListAsync();
                   sw.Stop();
                   projectionTimes.Add(sw.ElapsedMilliseconds);
               }
               results.ProjectionAvgMs = projectionTimes.Average();
               
               await LogPerformanceMetricAsync("QueryBenchmark", results);
               return results;
           }
           
           // Memory usage monitoring
           public async Task<MemoryUsageReport> MonitorMemoryUsageAsync(Func<Task> operation, string operationName)
           {
               GC.Collect();
               GC.WaitForPendingFinalizers();
               GC.Collect();
               
               var initialMemory = GC.GetTotalMemory(false);
               var sw = Stopwatch.StartNew();
               
               await operation();
               
               sw.Stop();
               var finalMemory = GC.GetTotalMemory(false);
               var memoryUsed = finalMemory - initialMemory;
               
               var report = new MemoryUsageReport
               {
                   OperationName = operationName,
                   InitialMemoryBytes = initialMemory,
                   FinalMemoryBytes = finalMemory,
                   MemoryUsedBytes = memoryUsed,
                   ExecutionTimeMs = sw.ElapsedMilliseconds,
                   Timestamp = DateTime.UtcNow
               };
               
               await LogMemoryUsageAsync(report);
               return report;
           }
           
           // Database performance statistics
           public async Task<DatabaseStats> GetDatabasePerformanceStatsAsync()
           {
               var database = _products.Database;
               var stats = await database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                   new MongoDB.Bson.BsonDocument("dbStats", 1));
               
               var collStats = await database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                   new MongoDB.Bson.BsonDocument("collStats", "products"));
               
               return new DatabaseStats
               {
                   DatabaseSizeBytes = stats["dataSize"].AsInt64,
                   IndexSizeBytes = stats["indexSize"].AsInt64,
                   DocumentCount = stats["objects"].AsInt64,
                   CollectionCount = stats["collections"].AsInt32,
                   AverageObjectSizeBytes = stats["avgObjSize"].AsDouble,
                   StorageEngineInfo = stats["storageEngine"]["name"].AsString,
                   Timestamp = DateTime.UtcNow
               };
           }
           
           // Connection pool monitoring
           public ConnectionPoolStats GetConnectionPoolStats()
           {
               var cluster = ((MongoClient)_products.Database.Client).Cluster;
               
               return new ConnectionPoolStats
               {
                   // Note: In a real implementation, you'd access internal connection pool metrics
                   // This is a simplified version for demonstration
                   TotalConnections = 10, // Placeholder - would get from actual pool
                   ActiveConnections = 5,  // Placeholder
                   AvailableConnections = 5, // Placeholder
                   Timestamp = DateTime.UtcNow
               };
           }
           
           private async Task LogPerformanceMetricAsync(string metricType, object data)
           {
               var metric = new PerformanceMetric
               {
                   MetricType = metricType,
                   Data = Newtonsoft.Json.JsonConvert.SerializeObject(data),
                   Timestamp = DateTime.UtcNow
               };
               
               await _metrics.InsertOneAsync(metric);
           }
           
           private async Task LogMemoryUsageAsync(MemoryUsageReport report)
           {
               var collection = _products.Database.GetCollection<MemoryUsageReport>("memoryUsageReports");
               await collection.InsertOneAsync(report);
           }
       }
       
       public class PerformanceBenchmark
       {
           public double SimpleFilterAvgMs { get; set; }
           public double ComplexFilterAvgMs { get; set; }
           public double AggregationAvgMs { get; set; }
           public double ProjectionAvgMs { get; set; }
           public DateTime Timestamp { get; set; } = DateTime.UtcNow;
       }
       
       public class MemoryUsageReport
       {
           [MongoDB.Bson.Serialization.Attributes.BsonId]
           [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("operationName")]
           public string OperationName { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("initialMemoryBytes")]
           public long InitialMemoryBytes { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("finalMemoryBytes")]
           public long FinalMemoryBytes { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("memoryUsedBytes")]
           public long MemoryUsedBytes { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("executionTimeMs")]
           public long ExecutionTimeMs { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("timestamp")]
           public DateTime Timestamp { get; set; }
       }
       
       public class DatabaseStats
       {
           public long DatabaseSizeBytes { get; set; }
           public long IndexSizeBytes { get; set; }
           public long DocumentCount { get; set; }
           public int CollectionCount { get; set; }
           public double AverageObjectSizeBytes { get; set; }
           public string StorageEngineInfo { get; set; } = string.Empty;
           public DateTime Timestamp { get; set; }
       }
       
       public class ConnectionPoolStats
       {
           public int TotalConnections { get; set; }
           public int ActiveConnections { get; set; }
           public int AvailableConnections { get; set; }
           public DateTime Timestamp { get; set; }
       }
       
       public class PerformanceMetric
       {
           [MongoDB.Bson.Serialization.Attributes.BsonId]
           [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("metricType")]
           public string MetricType { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("data")]
           public string Data { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("timestamp")]
           public DateTime Timestamp { get; set; }
       }
   }
   ```

3. **Create High-Performance Data Generator**
   ```csharp
   // Services/Performance/HighPerformanceDataGenerator.cs
   using MongoDBLabs.Models;
   using System.Threading.Channels;
   
   namespace MongoDBLabs.Services.Performance
   {
       public class HighPerformanceDataGenerator
       {
           private readonly Random _random = new();
           
           // Generate products using async enumerable for memory efficiency
           public async IAsyncEnumerable<Product> GenerateProductsStreamAsync(
               int totalCount, 
               int delayMs = 0)
           {
               var categories = new[] { "Electronics", "Clothing", "Books", "Home", "Sports" };
               var brands = new[] { "BrandA", "BrandB", "BrandC", "BrandD", "BrandE" };
               
               for (int i = 0; i < totalCount; i++)
               {
                   yield return new Product
                   {
                       Name = $"Product {i:D6}",
                       Price = (decimal)(_random.NextDouble() * 1000 + 10),
                       Category = categories[_random.Next(categories.Length)],
                       InStock = _random.Next(2) == 1,
                       Tags = GenerateRandomTags(),
                       Specifications = new Dictionary<string, object>
                       {
                           { "brand", brands[_random.Next(brands.Length)] },
                           { "weight", _random.NextDouble() * 10 },
                           { "inventory", _random.Next(0, 100) }
                       },
                       CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(365))
                   };
                   
                   if (delayMs > 0)
                       await Task.Delay(delayMs);
               }
           }
           
           // Channel-based producer-consumer pattern
           public async Task<Channel<Product>> GenerateProductsChannelAsync(
               int totalCount, 
               int bufferSize = 1000)
           {
               var channel = Channel.CreateBounded<Product>(new BoundedChannelOptions(bufferSize)
               {
                   FullMode = BoundedChannelFullMode.Wait,
                   SingleReader = false,
                   SingleWriter = true
               });
               
               _ = Task.Run(async () =>
               {
                   var writer = channel.Writer;
                   try
                   {
                       await foreach (var product in GenerateProductsStreamAsync(totalCount))
                       {
                           await writer.WriteAsync(product);
                       }
                   }
                   finally
                   {
                       writer.Complete();
                   }
               });
               
               return channel;
           }
           
           // Parallel data generation
           public async Task<List<Product>> GenerateProductsParallelAsync(
               int totalCount, 
               int parallelism = Environment.ProcessorCount)
           {
               var products = new Product[totalCount];
               var partitioner = Partitioner.Create(0, totalCount, totalCount / parallelism);
               
               await Task.WhenAll(partitioner.Select(async partition =>
               {
                   await Task.Run(() =>
                   {
                       var localRandom = new Random(Thread.CurrentThread.ManagedThreadId);
                       var categories = new[] { "Electronics", "Clothing", "Books", "Home", "Sports" };
                       var brands = new[] { "BrandA", "BrandB", "BrandC", "BrandD", "BrandE" };
                       
                       for (int i = partition.Item1; i < partition.Item2; i++)
                       {
                           products[i] = new Product
                           {
                               Name = $"Product {i:D6}",
                               Price = (decimal)(localRandom.NextDouble() * 1000 + 10),
                               Category = categories[localRandom.Next(categories.Length)],
                               InStock = localRandom.Next(2) == 1,
                               Tags = GenerateRandomTags(localRandom),
                               Specifications = new Dictionary<string, object>
                               {
                                   { "brand", brands[localRandom.Next(brands.Length)] },
                                   { "weight", localRandom.NextDouble() * 10 },
                                   { "inventory", localRandom.Next(0, 100) }
                               },
                               CreatedAt = DateTime.UtcNow.AddDays(-localRandom.Next(365))
                           };
                       }
                   });
               }));
               
               return products.ToList();
           }
           
           private List<string> GenerateRandomTags(Random? random = null)
           {
               random ??= _random;
               var allTags = new[] { "premium", "sale", "new", "bestseller", "limited", "eco-friendly", "wireless", "portable" };
               var tagCount = random.Next(1, 4);
               return allTags.OrderBy(x => random.Next()).Take(tagCount).ToList();
           }
       }
   }
   ```

4. **Testing Performance Features**
   ```csharp
   // Add to Program.cs
   static async Task TestHighPerformanceProcessing()
   {
       Console.WriteLine("\n=== High-Performance Processing Tests ===\n");
       
       var mongoService = new MongoDBService(configuration);
       var bulkService = new BulkProcessingService(mongoService);
       var performanceService = new PerformanceMonitoringService(mongoService);
       var dataGenerator = new HighPerformanceDataGenerator();
       
       // Test 1: Bulk insert performance
       Console.WriteLine("=== Bulk Insert Performance Test ===");
       var products = await dataGenerator.GenerateProductsParallelAsync(5000);
       
       var bulkResult = await performanceService.MonitorMemoryUsageAsync(async () =>
       {
           await bulkService.BulkInsertProductsAsync(products, batchSize: 1000);
       }, "BulkInsert5000Products");
       
       Console.WriteLine($"Memory used: {bulkResult.MemoryUsedBytes / 1024 / 1024:F2} MB");
       Console.WriteLine($"Execution time: {bulkResult.ExecutionTimeMs} ms");
       
       // Test 2: Streaming insert performance
       Console.WriteLine("\n=== Streaming Insert Performance Test ===");
       var streamingResult = await performanceService.MonitorMemoryUsageAsync(async () =>
       {
           await bulkService.StreamingBulkInsertAsync(
               dataGenerator.GenerateProductsStreamAsync(3000), 
               bufferSize: 500);
       }, "StreamingInsert3000Products");
       
       Console.WriteLine($"Memory used: {streamingResult.MemoryUsedBytes / 1024 / 1024:F2} MB");
       Console.WriteLine($"Execution time: {streamingResult.ExecutionTimeMs} ms");
       
       // Test 3: Query performance benchmarks
       Console.WriteLine("\n=== Query Performance Benchmarks ===");
       var benchmark = await performanceService.BenchmarkQueryApproachesAsync(50);
       Console.WriteLine($"Simple filter avg: {benchmark.SimpleFilterAvgMs:F2} ms");
       Console.WriteLine($"Complex filter avg: {benchmark.ComplexFilterAvgMs:F2} ms");
       Console.WriteLine($"Aggregation avg: {benchmark.AggregationAvgMs:F2} ms");
       Console.WriteLine($"Projection avg: {benchmark.ProjectionAvgMs:F2} ms");
       
       // Test 4: Database statistics
       Console.WriteLine("\n=== Database Performance Statistics ===");
       var dbStats = await performanceService.GetDatabasePerformanceStatsAsync();
       Console.WriteLine($"Database size: {dbStats.DatabaseSizeBytes / 1024 / 1024:F2} MB");
       Console.WriteLine($"Index size: {dbStats.IndexSizeBytes / 1024 / 1024:F2} MB");
       Console.WriteLine($"Document count: {dbStats.DocumentCount:N0}");
       Console.WriteLine($"Avg object size: {dbStats.AverageObjectSizeBytes:F2} bytes");
       
       // Test 5: Parallel bulk updates
       Console.WriteLine("\n=== Parallel Bulk Update Test ===");
       var productIds = await mongoService.Products.Find(_ => true)
           .Project(p => p.Id)
           .Limit(1000)
           .ToListAsync();
       
       var priceUpdates = productIds.Where(id => id != null)
           .ToDictionary(id => id!, _ => (decimal)(new Random().NextDouble() * 100 + 50));
       
       var updateResult = await bulkService.BulkUpdateProductsAsync(priceUpdates, batchSize: 200);
       Console.WriteLine($"Updated {updateResult.TotalProcessed} products");
       Console.WriteLine($"Rate: {updateResult.ItemsPerSecond:F2} items/second");
       Console.WriteLine($"Errors: {updateResult.Errors.Count}");
   }
   ```

### Deliverables
- High-performance bulk operation implementation
- Memory usage monitoring and optimization
- Performance benchmarking tools
- Parallel processing patterns for large datasets

---

## Lab 6: Enterprise Integration Patterns and Microservices (45 minutes)

### Learning Objectives
- Implement MongoDB in microservices architecture
- Create enterprise integration patterns
- Handle distributed transactions and data consistency
- Implement event sourcing and CQRS patterns

### Tasks

#### Part A: Microservices Architecture Setup (20 minutes)

1. **Create Microservice Base Infrastructure**
   ```csharp
   // Infrastructure/MicroserviceBase.cs
   using Microsoft.Extensions.DependencyInjection;
   using Microsoft.Extensions.Hosting;
   using Microsoft.Extensions.Logging;
   using MongoDB.Driver;
   
   namespace MongoDBLabs.Infrastructure
   {
       public abstract class MicroserviceBase : IHostedService
       {
           protected readonly IServiceProvider ServiceProvider;
           protected readonly ILogger Logger;
           protected readonly CancellationTokenSource CancellationTokenSource;
           
           public MicroserviceBase(IServiceProvider serviceProvider, ILogger logger)
           {
               ServiceProvider = serviceProvider;
               Logger = logger;
               CancellationTokenSource = new CancellationTokenSource();
           }
           
           public virtual Task StartAsync(CancellationToken cancellationToken)
           {
               Logger.LogInformation($"Starting {GetType().Name}...");
               return OnStartAsync(cancellationToken);
           }
           
           public virtual Task StopAsync(CancellationToken cancellationToken)
           {
               Logger.LogInformation($"Stopping {GetType().Name}...");
               CancellationTokenSource.Cancel();
               return OnStopAsync(cancellationToken);
           }
           
           protected abstract Task OnStartAsync(CancellationToken cancellationToken);
           protected abstract Task OnStopAsync(CancellationToken cancellationToken);
           
           public void Dispose()
           {
               CancellationTokenSource?.Dispose();
           }
       }
       
       // Event Bus Interface
       public interface IEventBus
       {
           Task PublishAsync<T>(T @event) where T : class;
           Task SubscribeAsync<T>(Func<T, Task> handler) where T : class;
       }
       
       // Simple in-memory event bus for demonstration
       public class InMemoryEventBus : IEventBus
       {
           private readonly Dictionary<Type, List<Func<object, Task>>> _handlers = new();
           private readonly ILogger<InMemoryEventBus> _logger;
           
           public InMemoryEventBus(ILogger<InMemoryEventBus> logger)
           {
               _logger = logger;
           }
           
           public async Task PublishAsync<T>(T @event) where T : class
           {
               var eventType = typeof(T);
               if (_handlers.TryGetValue(eventType, out var handlers))
               {
                   var tasks = handlers.Select(handler => handler(@event));
                   await Task.WhenAll(tasks);
                   _logger.LogInformation($"Published event {eventType.Name} to {handlers.Count} handlers");
               }
           }
           
           public Task SubscribeAsync<T>(Func<T, Task> handler) where T : class
           {
               var eventType = typeof(T);
               if (!_handlers.ContainsKey(eventType))
               {
                   _handlers[eventType] = new List<Func<object, Task>>();
               }
               
               _handlers[eventType].Add(async obj => await handler((T)obj));
               _logger.LogInformation($"Subscribed handler for event {eventType.Name}");
               return Task.CompletedTask;
           }
       }
   }
   ```

2. **Create Domain Events and Event Sourcing**
   ```csharp
   // Models/Events/DomainEvents.cs
   using MongoDB.Bson;
   using MongoDB.Bson.Serialization.Attributes;
   
   namespace MongoDBLabs.Models.Events
   {
       // Base event class
       public abstract class DomainEvent
       {
           [BsonId]
           [BsonRepresentation(BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [BsonElement("eventType")]
           public string EventType { get; set; }
           
           [BsonElement("aggregateId")]
           public string AggregateId { get; set; } = string.Empty;
           
           [BsonElement("timestamp")]
           public DateTime Timestamp { get; set; } = DateTime.UtcNow;
           
           [BsonElement("version")]
           public int Version { get; set; }
           
           [BsonElement("correlationId")]
           public string? CorrelationId { get; set; }
           
           protected DomainEvent(string eventType)
           {
               EventType = eventType;
           }
       }
       
       // Product Events
       public class ProductCreatedEvent : DomainEvent
       {
           [BsonElement("productName")]
           public string ProductName { get; set; } = string.Empty;
           
           [BsonElement("category")]
           public string Category { get; set; } = string.Empty;
           
           [BsonElement("price")]
           public decimal Price { get; set; }
           
           public ProductCreatedEvent() : base("ProductCreated") { }
       }
       
       public class ProductPriceChangedEvent : DomainEvent
       {
           [BsonElement("oldPrice")]
           public decimal OldPrice { get; set; }
           
           [BsonElement("newPrice")]
           public decimal NewPrice { get; set; }
           
           [BsonElement("reason")]
           public string Reason { get; set; } = string.Empty;
           
           public ProductPriceChangedEvent() : base("ProductPriceChanged") { }
       }
       
       public class InventoryUpdatedEvent : DomainEvent
       {
           [BsonElement("oldQuantity")]
           public int OldQuantity { get; set; }
           
           [BsonElement("newQuantity")]
           public int NewQuantity { get; set; }
           
           [BsonElement("operation")]
           public string Operation { get; set; } = string.Empty; // "restock", "sale", "adjustment"
           
           public InventoryUpdatedEvent() : base("InventoryUpdated") { }
       }
       
       // Order Events
       public class OrderCreatedEvent : DomainEvent
       {
           [BsonElement("customerId")]
           public string CustomerId { get; set; } = string.Empty;
           
           [BsonElement("orderItems")]
           public List<OrderEventItem> Items { get; set; } = new();
           
           [BsonElement("totalAmount")]
           public decimal TotalAmount { get; set; }
           
           public OrderCreatedEvent() : base("OrderCreated") { }
       }
       
       public class OrderStatusChangedEvent : DomainEvent
       {
           [BsonElement("oldStatus")]
           public string OldStatus { get; set; } = string.Empty;
           
           [BsonElement("newStatus")]
           public string NewStatus { get; set; } = string.Empty;
           
           [BsonElement("reason")]
           public string Reason { get; set; } = string.Empty;
           
           public OrderStatusChangedEvent() : base("OrderStatusChanged") { }
       }
       
       public class OrderEventItem
       {
           [BsonElement("productId")]
           public string ProductId { get; set; } = string.Empty;
           
           [BsonElement("quantity")]
           public int Quantity { get; set; }
           
           [BsonElement("price")]
           public decimal Price { get; set; }
       }
   }
   ```

3. **Create Event Store Service**
   ```csharp
   // Services/EventSourcing/EventStoreService.cs
   using MongoDB.Driver;
   using MongoDBLabs.Models.Events;
   
   namespace MongoDBLabs.Services.EventSourcing
   {
       public class EventStoreService
       {
           private readonly IMongoCollection<DomainEvent> _events;
           private readonly IMongoCollection<EventSnapshot> _snapshots;
           
           public EventStoreService(MongoDBService mongoDBService)
           {
               var database = mongoDBService.Products.Database;
               _events = database.GetCollection<DomainEvent>("events");
               _snapshots = database.GetCollection<EventSnapshot>("snapshots");
               
               // Create indexes for efficient querying
               CreateIndexes();
           }
           
           // Store event
           public async Task<string> StoreEventAsync(DomainEvent domainEvent)
           {
               // Set version based on existing events for this aggregate
               var lastVersion = await _events
                   .Find(e => e.AggregateId == domainEvent.AggregateId)
                   .SortByDescending(e => e.Version)
                   .Project(e => e.Version)
                   .FirstOrDefaultAsync();
               
               domainEvent.Version = lastVersion + 1;
               
               await _events.InsertOneAsync(domainEvent);
               return domainEvent.Id!;
           }
           
           // Get events for aggregate
           public async Task<List<DomainEvent>> GetEventsAsync(string aggregateId, int fromVersion = 0)
           {
               return await _events
                   .Find(e => e.AggregateId == aggregateId && e.Version > fromVersion)
                   .SortBy(e => e.Version)
                   .ToListAsync();
           }
           
           // Get events by type
           public async Task<List<T>> GetEventsByTypeAsync<T>(DateTime? fromDate = null) where T : DomainEvent
           {
               var filter = Builders<DomainEvent>.Filter.OfType<T>();
               
               if (fromDate.HasValue)
               {
                   filter = Builders<DomainEvent>.Filter.And(
                       filter,
                       Builders<DomainEvent>.Filter.Gte(e => e.Timestamp, fromDate.Value)
                   );
               }
               
               return await _events.Find(filter).OfType<T>().ToListAsync();
           }
           
           // Store snapshot
           public async Task StoreSnapshotAsync(EventSnapshot snapshot)
           {
               var filter = Builders<EventSnapshot>.Filter.Eq(s => s.AggregateId, snapshot.AggregateId);
               var options = new ReplaceOptions { IsUpsert = true };
               
               await _snapshots.ReplaceOneAsync(filter, snapshot, options);
           }
           
           // Get latest snapshot
           public async Task<EventSnapshot?> GetSnapshotAsync(string aggregateId)
           {
               return await _snapshots
                   .Find(s => s.AggregateId == aggregateId)
                   .FirstOrDefaultAsync();
           }
           
           // Replay events to rebuild aggregate state
           public async Task<T> ReplayEventsAsync<T>(string aggregateId, Func<T, DomainEvent, T> applyEvent, T initialState)
           {
               var events = await GetEventsAsync(aggregateId);
               return events.Aggregate(initialState, applyEvent);
           }
           
           // Event stream with real-time updates
           public async IAsyncEnumerable<DomainEvent> GetEventStreamAsync(
               string? aggregateId = null,
               DateTime? fromTimestamp = null)
           {
               var filterBuilder = Builders<DomainEvent>.Filter;
               var filter = filterBuilder.Empty;
               
               if (!string.IsNullOrEmpty(aggregateId))
               {
                   filter = filterBuilder.And(filter, filterBuilder.Eq(e => e.AggregateId, aggregateId));
               }
               
               if (fromTimestamp.HasValue)
               {
                   filter = filterBuilder.And(filter, filterBuilder.Gte(e => e.Timestamp, fromTimestamp.Value));
               }
               
               // First, yield existing events
               var existingEvents = await _events.Find(filter).SortBy(e => e.Timestamp).ToListAsync();
               foreach (var @event in existingEvents)
               {
                   yield return @event;
               }
               
               // Then, watch for new events using change streams
               var pipeline = new EmptyPipelineDefinition<ChangeStreamDocument<DomainEvent>>()
                   .Match(change => change.OperationType == ChangeStreamOperationType.Insert);
               
               using var changeStream = await _events.WatchAsync(pipeline);
               await foreach (var change in changeStream.ToAsyncEnumerable())
               {
                   if (change.FullDocument != null)
                   {
                       yield return change.FullDocument;
                   }
               }
           }
           
           private void CreateIndexes()
           {
               var indexKeys = Builders<DomainEvent>.IndexKeys;
               
               // Compound index for aggregate queries
               _events.Indexes.CreateOne(new CreateIndexModel<DomainEvent>(
                   indexKeys.Ascending(e => e.AggregateId).Ascending(e => e.Version)));
               
               // Index for event type queries
               _events.Indexes.CreateOne(new CreateIndexModel<DomainEvent>(
                   indexKeys.Ascending(e => e.EventType)));
               
               // Index for timestamp queries
               _events.Indexes.CreateOne(new CreateIndexModel<DomainEvent>(
                   indexKeys.Descending(e => e.Timestamp)));
           }
       }
       
       public class EventSnapshot
       {
           [MongoDB.Bson.Serialization.Attributes.BsonId]
           [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("aggregateId")]
           public string AggregateId { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("version")]
           public int Version { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("data")]
           public string Data { get; set; } = string.Empty; // JSON serialized state
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("timestamp")]
           public DateTime Timestamp { get; set; } = DateTime.UtcNow;
       }
   }
   ```

#### Part B: CQRS Implementation (15 minutes)

4. **Create CQRS Command and Query Services**
   ```csharp
   // Services/CQRS/CommandHandlers.cs
   using MongoDBLabs.Infrastructure;
   using MongoDBLabs.Models.Events;
   using MongoDBLabs.Services.EventSourcing;
   using Microsoft.Extensions.Logging;
   
   namespace MongoDBLabs.Services.CQRS
   {
       // Commands
       public record CreateProductCommand(string Name, string Category, decimal Price, string CreatedBy);
       public record UpdateProductPriceCommand(string ProductId, decimal NewPrice, string Reason, string UpdatedBy);
       public record UpdateInventoryCommand(string ProductId, int NewQuantity, string Operation, string UpdatedBy);
       
       // Command Handlers
       public class ProductCommandHandler
       {
           private readonly EventStoreService _eventStore;
           private readonly IEventBus _eventBus;
           private readonly ILogger<ProductCommandHandler> _logger;
           
           public ProductCommandHandler(
               EventStoreService eventStore, 
               IEventBus eventBus, 
               ILogger<ProductCommandHandler> logger)
           {
               _eventStore = eventStore;
               _eventBus = eventBus;
               _logger = logger;
           }
           
           public async Task<string> HandleAsync(CreateProductCommand command)
           {
               var productId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
               
               var @event = new ProductCreatedEvent
               {
                   AggregateId = productId,
                   ProductName = command.Name,
                   Category = command.Category,
                   Price = command.Price,
                   CorrelationId = Guid.NewGuid().ToString()
               };
               
               await _eventStore.StoreEventAsync(@event);
               await _eventBus.PublishAsync(@event);
               
               _logger.LogInformation($"Product {productId} created by {command.CreatedBy}");
               return productId;
           }
           
           public async Task HandleAsync(UpdateProductPriceCommand command)
           {
               // In a real implementation, you'd load current state to get old price
               var oldPrice = 0m; // Would be loaded from current state
               
               var @event = new ProductPriceChangedEvent
               {
                   AggregateId = command.ProductId,
                   OldPrice = oldPrice,
                   NewPrice = command.NewPrice,
                   Reason = command.Reason,
                   CorrelationId = Guid.NewGuid().ToString()
               };
               
               await _eventStore.StoreEventAsync(@event);
               await _eventBus.PublishAsync(@event);
               
               _logger.LogInformation($"Product {command.ProductId} price updated by {command.UpdatedBy}");
           }
           
           public async Task HandleAsync(UpdateInventoryCommand command)
           {
               var oldQuantity = 0; // Would be loaded from current state
               
               var @event = new InventoryUpdatedEvent
               {
                   AggregateId = command.ProductId,
                   OldQuantity = oldQuantity,
                   NewQuantity = command.NewQuantity,
                   Operation = command.Operation,
                   CorrelationId = Guid.NewGuid().ToString()
               };
               
               await _eventStore.StoreEventAsync(@event);
               await _eventBus.PublishAsync(@event);
               
               _logger.LogInformation($"Product {command.ProductId} inventory updated by {command.UpdatedBy}");
           }
       }
       
       // Read Models
       public class ProductReadModel
       {
           [MongoDB.Bson.Serialization.Attributes.BsonId]
           public string ProductId { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("name")]
           public string Name { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("category")]
           public string Category { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("currentPrice")]
           public decimal CurrentPrice { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("inventory")]
           public int Inventory { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("lastUpdated")]
           public DateTime LastUpdated { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("version")]
           public int Version { get; set; }
       }
       
       // Query Service
       public class ProductQueryService
       {
           private readonly IMongoCollection<ProductReadModel> _readModels;
           
           public ProductQueryService(MongoDBService mongoDBService)
           {
               _readModels = mongoDBService.Products.Database.GetCollection<ProductReadModel>("productReadModels");
           }
           
           public async Task<ProductReadModel?> GetProductAsync(string productId)
           {
               return await _readModels.Find(p => p.ProductId == productId).FirstOrDefaultAsync();
           }
           
           public async Task<List<ProductReadModel>> GetProductsByCategoryAsync(string category)
           {
               return await _readModels.Find(p => p.Category == category).ToListAsync();
           }
           
           public async Task<List<ProductReadModel>> GetLowInventoryProductsAsync(int threshold = 10)
           {
               return await _readModels.Find(p => p.Inventory <= threshold).ToListAsync();
           }
           
           public async Task<List<ProductReadModel>> SearchProductsAsync(string searchTerm)
           {
               var filter = Builders<ProductReadModel>.Filter.Regex(p => p.Name, 
                   new MongoDB.Bson.BsonRegularExpression(searchTerm, "i"));
               
               return await _readModels.Find(filter).ToListAsync();
           }
       }
       
       // Event Projector - Updates read models based on events
       public class ProductProjectionService
       {
           private readonly IMongoCollection<ProductReadModel> _readModels;
           private readonly ILogger<ProductProjectionService> _logger;
           
           public ProductProjectionService(MongoDBService mongoDBService, ILogger<ProductProjectionService> logger)
           {
               _readModels = mongoDBService.Products.Database.GetCollection<ProductReadModel>("productReadModels");
               _logger = logger;
           }
           
           public async Task ProjectAsync(ProductCreatedEvent @event)
           {
               var readModel = new ProductReadModel
               {
                   ProductId = @event.AggregateId,
                   Name = @event.ProductName,
                   Category = @event.Category,
                   CurrentPrice = @event.Price,
                   Inventory = 0,
                   LastUpdated = @event.Timestamp,
                   Version = @event.Version
               };
               
               await _readModels.InsertOneAsync(readModel);
               _logger.LogInformation($"Created read model for product {@event.AggregateId}");
           }
           
           public async Task ProjectAsync(ProductPriceChangedEvent @event)
           {
               var filter = Builders<ProductReadModel>.Filter.Eq(p => p.ProductId, @event.AggregateId);
               var update = Builders<ProductReadModel>.Update
                   .Set(p => p.CurrentPrice, @event.NewPrice)
                   .Set(p => p.LastUpdated, @event.Timestamp)
                   .Set(p => p.Version, @event.Version);
               
               await _readModels.UpdateOneAsync(filter, update);
               _logger.LogInformation($"Updated price in read model for product {@event.AggregateId}");
           }
           
           public async Task ProjectAsync(InventoryUpdatedEvent @event)
           {
               var filter = Builders<ProductReadModel>.Filter.Eq(p => p.ProductId, @event.AggregateId);
               var update = Builders<ProductReadModel>.Update
                   .Set(p => p.Inventory, @event.NewQuantity)
                   .Set(p => p.LastUpdated, @event.Timestamp)
                   .Set(p => p.Version, @event.Version);
               
               await _readModels.UpdateOneAsync(filter, update);
               _logger.LogInformation($"Updated inventory in read model for product {@event.AggregateId}");
           }
       }
   }
   ```

#### Part C: Integration Testing (10 minutes)

5. **Create Integration Test for Enterprise Patterns**
   ```csharp
   // Add to Program.cs
   static async Task TestEnterpriseIntegrationPatterns()
   {
       Console.WriteLine("\n=== Enterprise Integration Patterns Tests ===\n");
       
       // Setup services
       var services = new ServiceCollection();
       services.AddLogging(builder => builder.AddConsole());
       services.AddSingleton<MongoDBService>();
       services.AddSingleton<EventStoreService>();
       services.AddSingleton<IEventBus, InMemoryEventBus>();
       services.AddSingleton<ProductCommandHandler>();
       services.AddSingleton<ProductQueryService>();
       services.AddSingleton<ProductProjectionService>();
       
       var serviceProvider = services.BuildServiceProvider();
       
       var commandHandler = serviceProvider.GetRequiredService<ProductCommandHandler>();
       var queryService = serviceProvider.GetRequiredService<ProductQueryService>();
       var projectionService = serviceProvider.GetRequiredService<ProductProjectionService>();
       var eventBus = serviceProvider.GetRequiredService<IEventBus>();
       
       // Subscribe to events for projection updates
       await eventBus.SubscribeAsync<ProductCreatedEvent>(projectionService.ProjectAsync);
       await eventBus.SubscribeAsync<ProductPriceChangedEvent>(projectionService.ProjectAsync);
       await eventBus.SubscribeAsync<InventoryUpdatedEvent>(projectionService.ProjectAsync);
       
       // Test CQRS pattern
       Console.WriteLine("=== Testing CQRS Pattern ===");
       
       // Create product via command
       var productId = await commandHandler.HandleAsync(
           new CreateProductCommand("Enterprise Laptop", "Electronics", 1299.99m, "admin"));
       
       Console.WriteLine($"Created product: {productId}");
       
       // Wait a moment for projection to complete
       await Task.Delay(100);
       
       // Query read model
       var readModel = await queryService.GetProductAsync(productId);
       Console.WriteLine($"Read model: {readModel?.Name} - ${readModel?.CurrentPrice}");
       
       // Update price via command
       await commandHandler.HandleAsync(
           new UpdateProductPriceCommand(productId, 1199.99m, "Holiday Sale", "admin"));
       
       await Task.Delay(100);
       
       // Update inventory via command
       await commandHandler.HandleAsync(
           new UpdateInventoryCommand(productId, 50, "restock", "warehouse"));
       
       await Task.Delay(100);
       
       // Query updated read model
       var updatedReadModel = await queryService.GetProductAsync(productId);
       Console.WriteLine($"Updated read model: {updatedReadModel?.Name} - ${updatedReadModel?.CurrentPrice} (Inventory: {updatedReadModel?.Inventory})");
       
       // Test event sourcing
       Console.WriteLine("\n=== Testing Event Sourcing ===");
       var eventStore = serviceProvider.GetRequiredService<EventStoreService>();
       
       // Get all events for the product
       var events = await eventStore.GetEventsAsync(productId);
       Console.WriteLine($"Found {events.Count} events for product {productId}:");
       
       foreach (var @event in events)
       {
           Console.WriteLine($"- {@event.EventType} (Version: {@event.Version}) at {@event.Timestamp}");
       }
       
       // Test event stream
       Console.WriteLine("\n=== Testing Event Stream ===");
       var eventCount = 0;
       await foreach (var @event in eventStore.GetEventStreamAsync(productId).Take(5))
       {
           Console.WriteLine($"Event {++eventCount}: {@event.EventType}");
           if (eventCount >= 3) break; // Prevent infinite loop in demo
       }
       
       Console.WriteLine("Enterprise integration patterns test completed!");
   }
   ```

### Deliverables
- Microservices architecture foundation
- Event sourcing and CQRS implementation
- Enterprise integration patterns
- Real-time event streaming capabilities

---

## Lab 7: Production Deployment and Monitoring (45 minutes)

### Learning Objectives
- Implement production-ready MongoDB configurations
- Set up comprehensive monitoring and alerting
- Handle deployment automation and scaling
- Implement disaster recovery and backup strategies

### Tasks

#### Part A: Production Configuration and Health Monitoring (25 minutes)

1. **Create Production Configuration Service**
   ```csharp
   // Services/Production/ProductionConfigurationService.cs
   using MongoDB.Driver;
   using Microsoft.Extensions.Logging;
   using Microsoft.Extensions.Configuration;
   
   namespace MongoDBLabs.Services.Production
   {
       public class ProductionConfigurationService
       {
           private readonly IMongoDatabase _database;
           private readonly ILogger<ProductionConfigurationService> _logger;
           private readonly IConfiguration _configuration;
           
           public ProductionConfigurationService(
               MongoDBService mongoDBService, 
               ILogger<ProductionConfigurationService> logger,
               IConfiguration configuration)
           {
               _database = mongoDBService.Products.Database;
               _logger = logger;
               _configuration = configuration;
           }
           
           // Apply production-ready configurations
           public async Task ApplyProductionConfigurationsAsync()
           {
               _logger.LogInformation("Applying production configurations...");
               
               await ConfigureConnectionPoolAsync();
               await ConfigureIndexesAsync();
               await ConfigureShardingAsync();
               await ConfigureSecurityAsync();
               
               _logger.LogInformation("Production configurations applied successfully");
           }
           
           private async Task ConfigureConnectionPoolAsync()
           {
               // Connection pool settings are typically configured at client level
               // This would be done in the connection string or client settings
               _logger.LogInformation("Connection pool configured for production workloads");
               
               // Example: Monitor connection pool health
               var client = _database.Client;
               // In a real implementation, you'd access connection pool metrics
               _logger.LogInformation("Connection pool status: Active connections monitored");
           }
           
           private async Task ConfigureIndexesAsync()
           {
               _logger.LogInformation("Creating production indexes...");
               
               var collections = new[] { "products", "orders", "customers", "analytics" };
               
               foreach (var collectionName in collections)
               {
                   var collection = _database.GetCollection<MongoDB.Bson.BsonDocument>(collectionName);
                   
                   // Create standard production indexes
                   await CreateProductionIndexesAsync(collection, collectionName);
               }
           }
           
           private async Task CreateProductionIndexesAsync(IMongoCollection<MongoDB.Bson.BsonDocument> collection, string collectionName)
           {
               var indexKeys = Builders<MongoDB.Bson.BsonDocument>.IndexKeys;
               
               switch (collectionName)
               {
                   case "products":
                       // Compound index for common queries
                       await collection.Indexes.CreateOneAsync(new CreateIndexModel<MongoDB.Bson.BsonDocument>(
                           indexKeys.Ascending("category").Ascending("inStock").Descending("price"),
                           new CreateIndexOptions { Name = "category_stock_price_idx", Background = true }));
                       
                       // Text search index
                       await collection.Indexes.CreateOneAsync(new CreateIndexModel<MongoDB.Bson.BsonDocument>(
                           indexKeys.Text("name").Text("description"),
                           new CreateIndexOptions { Name = "product_text_idx", Background = true }));
                       break;
                       
                   case "orders":
                       // Customer orders index
                       await collection.Indexes.CreateOneAsync(new CreateIndexModel<MongoDB.Bson.BsonDocument>(
                           indexKeys.Ascending("customerId").Descending("orderDate"),
                           new CreateIndexOptions { Name = "customer_orders_idx", Background = true }));
                       
                       // Order status index
                       await collection.Indexes.CreateOneAsync(new CreateIndexModel<MongoDB.Bson.BsonDocument>(
                           indexKeys.Ascending("status").Descending("orderDate"),
                           new CreateIndexOptions { Name = "status_date_idx", Background = true }));
                       break;
                       
                   case "customers":
                       // Email unique index
                       await collection.Indexes.CreateOneAsync(new CreateIndexModel<MongoDB.Bson.BsonDocument>(
                           indexKeys.Ascending("email"),
                           new CreateIndexOptions { Name = "email_unique_idx", Unique = true, Background = true }));
                       break;
                       
                   case "analytics":
                       // Time-series index for analytics
                       await collection.Indexes.CreateOneAsync(new CreateIndexModel<MongoDB.Bson.BsonDocument>(
                           indexKeys.Descending("timestamp").Ascending("eventType"),
                           new CreateIndexOptions { Name = "analytics_time_idx", Background = true }));
                       break;
               }
               
               _logger.LogInformation($"Production indexes created for {collectionName}");
           }
           
           private async Task ConfigureShardingAsync()
           {
               try
               {
                   // Check if sharding is enabled
                   var isMongos = await IsMongoSAsync();
                   if (!isMongos)
                   {
                       _logger.LogInformation("Sharding not available - running on standalone/replica set");
                       return;
                   }
                   
                   _logger.LogInformation("Configuring sharding for production...");
                   
                   // Enable sharding on database
                   await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                       new MongoDB.Bson.BsonDocument("enableSharding", _database.DatabaseNamespace.DatabaseName));
                   
                   // Configure shard keys for collections
                   await ConfigureShardKeysAsync();
                   
                   _logger.LogInformation("Sharding configuration completed");
               }
               catch (Exception ex)
               {
                   _logger.LogWarning($"Sharding configuration failed: {ex.Message}");
               }
           }
           
           private async Task ConfigureShardKeysAsync()
           {
               var shardConfigs = new[]
               {
                   new { Collection = "orders", ShardKey = new MongoDB.Bson.BsonDocument("customerId", 1) },
                   new { Collection = "analytics", ShardKey = new MongoDB.Bson.BsonDocument("timestamp", 1) },
                   new { Collection = "products", ShardKey = new MongoDB.Bson.BsonDocument("category", 1) }
               };
               
               foreach (var config in shardConfigs)
               {
                   try
                   {
                       var command = new MongoDB.Bson.BsonDocument
                       {
                           ["shardCollection"] = $"{_database.DatabaseNamespace.DatabaseName}.{config.Collection}",
                           ["key"] = config.ShardKey
                       };
                       
                       await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(command);
                       _logger.LogInformation($"Shard key configured for {config.Collection}");
                   }
                   catch (Exception ex)
                   {
                       _logger.LogWarning($"Failed to configure shard key for {config.Collection}: {ex.Message}");
                   }
               }
           }
           
           private async Task<bool> IsMongoSAsync()
           {
               try
               {
                   var result = await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                       new MongoDB.Bson.BsonDocument("isMaster", 1));
                   return result.Contains("msg") && result["msg"].AsString == "isdbgrid";
               }
               catch
               {
                   return false;
               }
           }
           
           private async Task ConfigureSecurityAsync()
           {
               _logger.LogInformation("Applying security configurations...");
               
               // Create application-specific users and roles
               await CreateApplicationRolesAsync();
               
               // Configure audit logging (if available)
               await ConfigureAuditingAsync();
               
               _logger.LogInformation("Security configurations applied");
           }
           
           private async Task CreateApplicationRolesAsync()
           {
               try
               {
                   // Create read-only role for analytics
                   var createRoleCommand = new MongoDB.Bson.BsonDocument
                   {
                       ["createRole"] = "analyticsReader",
                       ["privileges"] = new MongoDB.Bson.BsonArray
                       {
                           new MongoDB.Bson.BsonDocument
                           {
                               ["resource"] = new MongoDB.Bson.BsonDocument { ["db"] = _database.DatabaseNamespace.DatabaseName, ["collection"] = "" },
                               ["actions"] = new MongoDB.Bson.BsonArray { "find", "listCollections" }
                           }
                       },
                       ["roles"] = new MongoDB.Bson.BsonArray()
                   };
                   
                   await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(createRoleCommand);
                   _logger.LogInformation("Analytics reader role created");
               }
               catch (Exception ex)
               {
                   _logger.LogWarning($"Role creation failed: {ex.Message}");
               }
           }
           
           private async Task ConfigureAuditingAsync()
           {
               try
               {
                   // Audit configuration would typically be done at server level
                   // This is a placeholder for audit-related configurations
                   _logger.LogInformation("Audit configuration checked");
               }
               catch (Exception ex)
               {
                   _logger.LogWarning($"Audit configuration failed: {ex.Message}");
               }
           }
       }
   }
   ```

2. **Create Comprehensive Health Monitoring Service**
   ```csharp
   // Services/Production/HealthMonitoringService.cs
   using MongoDB.Driver;
   using Microsoft.Extensions.Logging;
   using System.Diagnostics;
   
   namespace MongoDBLabs.Services.Production
   {
       public class HealthMonitoringService
       {
           private readonly IMongoDatabase _database;
           private readonly ILogger<HealthMonitoringService> _logger;
           private readonly IMongoCollection<HealthMetric> _healthMetrics;
           
           public HealthMonitoringService(MongoDBService mongoDBService, ILogger<HealthMonitoringService> logger)
           {
               _database = mongoDBService.Products.Database;
               _logger = logger;
               _healthMetrics = _database.GetCollection<HealthMetric>("healthMetrics");
           }
           
           // Comprehensive health check
           public async Task<SystemHealthReport> PerformHealthCheckAsync()
           {
               var healthReport = new SystemHealthReport
               {
                   Timestamp = DateTime.UtcNow,
                   CheckId = Guid.NewGuid().ToString()
               };
               
               var stopwatch = Stopwatch.StartNew();
               
               try
               {
                   // Database connectivity check
                   healthReport.DatabaseHealth = await CheckDatabaseHealthAsync();
                   
                   // Performance metrics check
                   healthReport.PerformanceHealth = await CheckPerformanceHealthAsync();
                   
                   // Index health check
                   healthReport.IndexHealth = await CheckIndexHealthAsync();
                   
                   // Disk space check
                   healthReport.StorageHealth = await CheckStorageHealthAsync();
                   
                   // Replica set health (if applicable)
                   healthReport.ReplicationHealth = await CheckReplicationHealthAsync();
                   
                   // Calculate overall health
                   healthReport.OverallHealth = CalculateOverallHealth(healthReport);
                   
                   stopwatch.Stop();
                   healthReport.CheckDurationMs = stopwatch.ElapsedMilliseconds;
                   
                   // Store health metric
                   await StoreHealthMetricAsync(healthReport);
                   
                   _logger.LogInformation($"Health check completed in {stopwatch.ElapsedMilliseconds}ms - Overall: {healthReport.OverallHealth}");
               }
               catch (Exception ex)
               {
                   healthReport.OverallHealth = HealthStatus.Critical;
                   healthReport.ErrorMessage = ex.Message;
                   _logger.LogError(ex, "Health check failed");
               }
               
               return healthReport;
           }
           
           private async Task<DatabaseHealthInfo> CheckDatabaseHealthAsync()
           {
               try
               {
                   var sw = Stopwatch.StartNew();
                   
                   // Ping test
                   await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                       new MongoDB.Bson.BsonDocument("ping", 1));
                   
                   sw.Stop();
                   
                   // Get server status
                   var serverStatus = await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                       new MongoDB.Bson.BsonDocument("serverStatus", 1));
                   
                   return new DatabaseHealthInfo
                   {
                       Status = HealthStatus.Healthy,
                       PingTimeMs = sw.ElapsedMilliseconds,
                       ServerVersion = serverStatus["version"].AsString,
                       ConnectionCount = serverStatus["connections"]["current"].AsInt32,
                       AvailableConnections = serverStatus["connections"]["available"].AsInt32,
                       UptimeSeconds = serverStatus["uptime"].AsInt64
                   };
               }
               catch (Exception ex)
               {
                   return new DatabaseHealthInfo
                   {
                       Status = HealthStatus.Critical,
                       ErrorMessage = ex.Message
                   };
               }
           }
           
           private async Task<PerformanceHealthInfo> CheckPerformanceHealthAsync()
           {
               try
               {
                   var serverStatus = await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                       new MongoDB.Bson.BsonDocument("serverStatus", 1));
                   
                   var opcounters = serverStatus["opcounters"];
                   var mem = serverStatus["mem"];
                   
                   var totalOps = opcounters["insert"].AsInt64 + opcounters["query"].AsInt64 + 
                                  opcounters["update"].AsInt64 + opcounters["delete"].AsInt64;
                   
                   var memoryUsageMB = mem["resident"].AsInt32;
                   var virtualMemoryMB = mem["virtual"].AsInt32;
                   
                   return new PerformanceHealthInfo
                   {
                       Status = memoryUsageMB > 8192 ? HealthStatus.Warning : HealthStatus.Healthy, // 8GB threshold
                       TotalOperations = totalOps,
                       MemoryUsageMB = memoryUsageMB,
                       VirtualMemoryMB = virtualMemoryMB,
                       QueryExecutorPool = serverStatus.Contains("queryExecution") ? 
                           serverStatus["queryExecution"]["totalExecutions"].AsInt64 : 0
                   };
               }
               catch (Exception ex)
               {
                   return new PerformanceHealthInfo
                   {
                       Status = HealthStatus.Critical,
                       ErrorMessage = ex.Message
                   };
               }
           }
           
           private async Task<IndexHealthInfo> CheckIndexHealthAsync()
           {
               try
               {
                   var collections = await _database.ListCollectionNamesAsync();
                   var totalIndexes = 0;
                   var problematicIndexes = new List<string>();
                   
                   await foreach (var collectionName in collections.ToAsyncEnumerable())
                   {
                       var collection = _database.GetCollection<MongoDB.Bson.BsonDocument>(collectionName);
                       var indexes = await collection.Indexes.List().ToListAsync();
                       totalIndexes += indexes.Count;
                       
                       // Check for problematic indexes (too many, unused, etc.)
                       if (indexes.Count > 20) // Arbitrary threshold
                       {
                           problematicIndexes.Add($"{collectionName}: {indexes.Count} indexes");
                       }
                   }
                   
                   return new IndexHealthInfo
                   {
                       Status = problematicIndexes.Any() ? HealthStatus.Warning : HealthStatus.Healthy,
                       TotalIndexes = totalIndexes,
                       ProblematicIndexes = problematicIndexes
                   };
               }
               catch (Exception ex)
               {
                   return new IndexHealthInfo
                   {
                       Status = HealthStatus.Critical,
                       ErrorMessage = ex.Message
                   };
               }
           }
           
           private async Task<StorageHealthInfo> CheckStorageHealthAsync()
           {
               try
               {
                   var dbStats = await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                       new MongoDB.Bson.BsonDocument("dbStats", 1));
                   
                   var dataSizeGB = dbStats["dataSize"].AsInt64 / (1024.0 * 1024.0 * 1024.0);
                   var indexSizeGB = dbStats["indexSize"].AsInt64 / (1024.0 * 1024.0 * 1024.0);
                   var totalSizeGB = dataSizeGB + indexSizeGB;
                   
                   // Check if storage usage is getting high (>80% in real scenarios)
                   var status = totalSizeGB > 50 ? HealthStatus.Warning : HealthStatus.Healthy; // 50GB threshold for demo
                   
                   return new StorageHealthInfo
                   {
                       Status = status,
                       DataSizeGB = dataSizeGB,
                       IndexSizeGB = indexSizeGB,
                       TotalSizeGB = totalSizeGB,
                       DocumentCount = dbStats["objects"].AsInt64
                   };
               }
               catch (Exception ex)
               {
                   return new StorageHealthInfo
                   {
                       Status = HealthStatus.Critical,
                       ErrorMessage = ex.Message
                   };
               }
           }
           
           private async Task<ReplicationHealthInfo> CheckReplicationHealthAsync()
           {
               try
               {
                   var replSetStatus = await _database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                       new MongoDB.Bson.BsonDocument("replSetGetStatus", 1));
                   
                   var members = replSetStatus["members"].AsBsonArray;
                   var healthyMembers = 0;
                   var primaryMember = "";
                   
                   foreach (var member in members)
                   {
                       var state = member["state"].AsInt32;
                       if (state == 1) // Primary
                       {
                           primaryMember = member["name"].AsString;
                           healthyMembers++;
                       }
                       else if (state == 2) // Secondary
                       {
                           healthyMembers++;
                       }
                   }
                   
                   return new ReplicationHealthInfo
                   {
                       Status = healthyMembers >= 2 ? HealthStatus.Healthy : HealthStatus.Warning,
                       TotalMembers = members.Count,
                       HealthyMembers = healthyMembers,
                       PrimaryMember = primaryMember,
                       IsReplicaSet = true
                   };
               }
               catch (MongoCommandException ex) when (ex.CodeName == "NotYetInitialized")
               {
                   return new ReplicationHealthInfo
                   {
                       Status = HealthStatus.Healthy,
                       IsReplicaSet = false,
                       ErrorMessage = "Running on standalone instance"
                   };
               }
               catch (Exception ex)
               {
                   return new ReplicationHealthInfo
                   {
                       Status = HealthStatus.Warning,
                       ErrorMessage = ex.Message
                   };
               }
           }
           
           private HealthStatus CalculateOverallHealth(SystemHealthReport report)
           {
               var statuses = new[]
               {
                   report.DatabaseHealth?.Status,
                   report.PerformanceHealth?.Status,
                   report.IndexHealth?.Status,
                   report.StorageHealth?.Status,
                   report.ReplicationHealth?.Status
               }.Where(s => s.HasValue).Select(s => s.Value);
               
               if (statuses.Any(s => s == HealthStatus.Warning))
                   return HealthStatus.Warning;
               
               return HealthStatus.Healthy;
           }
           
           private async Task StoreHealthMetricAsync(SystemHealthReport report)
           {
               var metric = new HealthMetric
               {
                   CheckId = report.CheckId,
                   Timestamp = report.Timestamp,
                   OverallHealth = report.OverallHealth.ToString(),
                   CheckDurationMs = report.CheckDurationMs,
                   DatabasePingMs = report.DatabaseHealth?.PingTimeMs ?? 0,
                   MemoryUsageMB = report.PerformanceHealth?.MemoryUsageMB ?? 0,
                   TotalIndexes = report.IndexHealth?.TotalIndexes ?? 0,
                   DataSizeGB = report.StorageHealth?.DataSizeGB ?? 0,
                   IsReplicaSet = report.ReplicationHealth?.IsReplicaSet ?? false,
                   HealthyMembers = report.ReplicationHealth?.HealthyMembers ?? 0
               };
               
               await _healthMetrics.InsertOneAsync(metric);
           }
           
           // Get health trends
           public async Task<List<HealthTrend>> GetHealthTrendsAsync(TimeSpan period)
           {
               var fromDate = DateTime.UtcNow.Subtract(period);
               
               var pipeline = new MongoDB.Bson.BsonDocument[]
               {
                   new MongoDB.Bson.BsonDocument("$match", new MongoDB.Bson.BsonDocument
                   {
                       ["timestamp"] = new MongoDB.Bson.BsonDocument("$gte", fromDate)
                   }),
                   new MongoDB.Bson.BsonDocument("$group", new MongoDB.Bson.BsonDocument
                   {
                       ["_id"] = new MongoDB.Bson.BsonDocument
                       {
                           ["year"] = new MongoDB.Bson.BsonDocument("$year", "$timestamp"),
                           ["month"] = new MongoDB.Bson.BsonDocument("$month", "$timestamp"),
                           ["day"] = new MongoDB.Bson.BsonDocument("$dayOfMonth", "$timestamp"),
                           ["hour"] = new MongoDB.Bson.BsonDocument("$hour", "$timestamp")
                       },
                       ["avgPingMs"] = new MongoDB.Bson.BsonDocument("$avg", "$databasePingMs"),
                       ["avgMemoryMB"] = new MongoDB.Bson.BsonDocument("$avg", "$memoryUsageMB"),
                       ["healthyChecks"] = new MongoDB.Bson.BsonDocument("$sum", new MongoDB.Bson.BsonDocument
                       {
                           ["$cond"] = new MongoDB.Bson.BsonArray { new MongoDB.Bson.BsonDocument("$eq", new MongoDB.Bson.BsonArray { "$overallHealth", "Healthy" }), 1, 0 }
                       }),
                       ["totalChecks"] = new MongoDB.Bson.BsonDocument("$sum", 1)
                   }),
                   new MongoDB.Bson.BsonDocument("$sort", new MongoDB.Bson.BsonDocument
                   {
                       ["_id.year"] = 1,
                       ["_id.month"] = 1,
                       ["_id.day"] = 1,
                       ["_id.hour"] = 1
                   })
               };
               
               return await _healthMetrics.Aggregate<HealthTrend>(pipeline).ToListAsync();
           }
       }
       
       // Health model classes
       public class SystemHealthReport
       {
           public string CheckId { get; set; } = string.Empty;
           public DateTime Timestamp { get; set; }
           public HealthStatus OverallHealth { get; set; }
           public long CheckDurationMs { get; set; }
           public string? ErrorMessage { get; set; }
           
           public DatabaseHealthInfo? DatabaseHealth { get; set; }
           public PerformanceHealthInfo? PerformanceHealth { get; set; }
           public IndexHealthInfo? IndexHealth { get; set; }
           public StorageHealthInfo? StorageHealth { get; set; }
           public ReplicationHealthInfo? ReplicationHealth { get; set; }
       }
       
       public enum HealthStatus
       {
           Healthy,
           Warning,
           Critical
       }
       
       public class DatabaseHealthInfo
       {
           public HealthStatus Status { get; set; }
           public long PingTimeMs { get; set; }
           public string ServerVersion { get; set; } = string.Empty;
           public int ConnectionCount { get; set; }
           public int AvailableConnections { get; set; }
           public long UptimeSeconds { get; set; }
           public string? ErrorMessage { get; set; }
       }
       
       public class PerformanceHealthInfo
       {
           public HealthStatus Status { get; set; }
           public long TotalOperations { get; set; }
           public int MemoryUsageMB { get; set; }
           public int VirtualMemoryMB { get; set; }
           public long QueryExecutorPool { get; set; }
           public string? ErrorMessage { get; set; }
       }
       
       public class IndexHealthInfo
       {
           public HealthStatus Status { get; set; }
           public int TotalIndexes { get; set; }
           public List<string> ProblematicIndexes { get; set; } = new();
           public string? ErrorMessage { get; set; }
       }
       
       public class StorageHealthInfo
       {
           public HealthStatus Status { get; set; }
           public double DataSizeGB { get; set; }
           public double IndexSizeGB { get; set; }
           public double TotalSizeGB { get; set; }
           public long DocumentCount { get; set; }
           public string? ErrorMessage { get; set; }
       }
       
       public class ReplicationHealthInfo
       {
           public HealthStatus Status { get; set; }
           public bool IsReplicaSet { get; set; }
           public int TotalMembers { get; set; }
           public int HealthyMembers { get; set; }
           public string PrimaryMember { get; set; } = string.Empty;
           public string? ErrorMessage { get; set; }
       }
       
       public class HealthMetric
       {
           [MongoDB.Bson.Serialization.Attributes.BsonId]
           [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("checkId")]
           public string CheckId { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("timestamp")]
           public DateTime Timestamp { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("overallHealth")]
           public string OverallHealth { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("checkDurationMs")]
           public long CheckDurationMs { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("databasePingMs")]
           public long DatabasePingMs { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("memoryUsageMB")]
           public int MemoryUsageMB { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("totalIndexes")]
           public int TotalIndexes { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("dataSizeGB")]
           public double DataSizeGB { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("isReplicaSet")]
           public bool IsReplicaSet { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("healthyMembers")]
           public int HealthyMembers { get; set; }
       }
       
       public class HealthTrend
       {
           [MongoDB.Bson.Serialization.Attributes.BsonElement("_id")]
           public TimeKey Id { get; set; } = new();
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("avgPingMs")]
           public double AvgPingMs { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("avgMemoryMB")]
           public double AvgMemoryMB { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("healthyChecks")]
           public int HealthyChecks { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("totalChecks")]
           public int TotalChecks { get; set; }
           
           public double HealthPercentage => (double)HealthyChecks / TotalChecks * 100;
       }
       
       public class TimeKey
       {
           [MongoDB.Bson.Serialization.Attributes.BsonElement("year")]
           public int Year { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("month")]
           public int Month { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("day")]
           public int Day { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("hour")]
           public int Hour { get; set; }
       }
   }
   ```

#### Part B: Backup and Disaster Recovery (20 minutes)

3. **Create Backup and Disaster Recovery Service**
   ```csharp
   // Services/Production/BackupRecoveryService.cs
   using MongoDB.Driver;
   using Microsoft.Extensions.Logging;
   using System.Diagnostics;
   using System.Text.Json;
   
   namespace MongoDBLabs.Services.Production
   {
       public class BackupRecoveryService
       {
           private readonly IMongoDatabase _database;
           private readonly ILogger<BackupRecoveryService> _logger;
           private readonly IMongoCollection<BackupMetadata> _backupMetadata;
           
           public BackupRecoveryService(MongoDBService mongoDBService, ILogger<BackupRecoveryService> logger)
           {
               _database = mongoDBService.Products.Database;
               _logger = logger;
               _backupMetadata = _database.GetCollection<BackupMetadata>("backupMetadata");
           }
           
           // Create full database backup
           public async Task<BackupResult> CreateFullBackupAsync(string backupPath, BackupOptions? options = null)
           {
               options ??= new BackupOptions();
               var backupId = Guid.NewGuid().ToString();
               var startTime = DateTime.UtcNow;
               
               _logger.LogInformation($"Starting full backup {backupId} to {backupPath}");
               
               var stopwatch = Stopwatch.StartNew();
               
               try
               {
                   var backupDirectory = Path.Combine(backupPath, $"backup_{backupId}_{startTime:yyyyMMdd_HHmmss}");
                   Directory.CreateDirectory(backupDirectory);
                   
                   var collections = await _database.ListCollectionNamesAsync();
                   var backupManifest = new BackupManifest
                   {
                       BackupId = backupId,
                       DatabaseName = _database.DatabaseNamespace.DatabaseName,
                       BackupType = BackupType.Full,
                       StartTime = startTime,
                       Collections = new List<CollectionBackupInfo>()
                   };
                   
                   long totalDocuments = 0;
                   long totalSizeBytes = 0;
                   
                   await foreach (var collectionName in collections.ToAsyncEnumerable())
                   {
                       if (options.ExcludedCollections.Contains(collectionName))
                       {
                           _logger.LogInformation($"Skipping excluded collection: {collectionName}");
                           continue;
                       }
                       
                       var collectionBackup = await BackupCollectionAsync(collectionName, backupDirectory, options);
                       backupManifest.Collections.Add(collectionBackup);
                       totalDocuments += collectionBackup.DocumentCount;
                       totalSizeBytes += collectionBackup.SizeBytes;
                       
                       _logger.LogInformation($"Backed up collection {collectionName}: {collectionBackup.DocumentCount} documents");
                   }
                   
                   // Save backup manifest
                   var manifestPath = Path.Combine(backupDirectory, "backup_manifest.json");
                   var manifestJson = JsonSerializer.Serialize(backupManifest, new JsonSerializerOptions { WriteIndented = true });
                   await File.WriteAllTextAsync(manifestPath, manifestJson);
                   
                   stopwatch.Stop();
                   backupManifest.EndTime = DateTime.UtcNow;
                   backupManifest.DurationMs = stopwatch.ElapsedMilliseconds;
                   
                   // Store backup metadata
                   var metadata = new BackupMetadata
                   {
                       BackupId = backupId,
                       BackupType = BackupType.Full,
                       DatabaseName = _database.DatabaseNamespace.DatabaseName,
                       BackupPath = backupDirectory,
                       StartTime = startTime,
                       EndTime = backupManifest.EndTime.Value,
                       DurationMs = stopwatch.ElapsedMilliseconds,
                       TotalDocuments = totalDocuments,
                       TotalSizeBytes = totalSizeBytes,
                       Status = BackupStatus.Completed,
                       Collections = backupManifest.Collections.Select(c => c.CollectionName).ToList()
                   };
                   
                   await _backupMetadata.InsertOneAsync(metadata);
                   
                   _logger.LogInformation($"Backup {backupId} completed in {stopwatch.ElapsedMilliseconds}ms. Total: {totalDocuments} documents, {totalSizeBytes / 1024 / 1024:F2} MB");
                   
                   return new BackupResult
                   {
                       BackupId = backupId,
                       Success = true,
                       BackupPath = backupDirectory,
                       DurationMs = stopwatch.ElapsedMilliseconds,
                       TotalDocuments = totalDocuments,
                       TotalSizeBytes = totalSizeBytes
                   };
               }
               catch (Exception ex)
               {
                   stopwatch.Stop();
                   _logger.LogError(ex, $"Backup {backupId} failed after {stopwatch.ElapsedMilliseconds}ms");
                   
                   // Update metadata with failure
                   await _backupMetadata.InsertOneAsync(new BackupMetadata
                   {
                       BackupId = backupId,
                       BackupType = BackupType.Full,
                       DatabaseName = _database.DatabaseNamespace.DatabaseName,
                       StartTime = startTime,
                       EndTime = DateTime.UtcNow,
                       DurationMs = stopwatch.ElapsedMilliseconds,
                       Status = BackupStatus.Failed,
                       ErrorMessage = ex.Message
                   });
                   
                   return new BackupResult
                   {
                       BackupId = backupId,
                       Success = false,
                       ErrorMessage = ex.Message,
                       DurationMs = stopwatch.ElapsedMilliseconds
                   };
               }
           }
           
           // Backup individual collection
           private async Task<CollectionBackupInfo> BackupCollectionAsync(string collectionName, string backupDirectory, BackupOptions options)
           {
               var collection = _database.GetCollection<MongoDB.Bson.BsonDocument>(collectionName);
               var collectionPath = Path.Combine(backupDirectory, $"{collectionName}.json");
               
               long documentCount = 0;
               long sizeBytes = 0;
               
               using var fileStream = new FileStream(collectionPath, FileMode.Create, FileAccess.Write);
               using var writer = new StreamWriter(fileStream);
               
               var cursor = await collection.FindAsync(MongoDB.Bson.BsonDocument.Empty);
               
               while (await cursor.MoveNextAsync())
               {
                   foreach (var document in cursor.Current)
                   {
                       var json = document.ToJson();
                       await writer.WriteLineAsync(json);
                       documentCount++;
                       sizeBytes += System.Text.Encoding.UTF8.GetByteCount(json);
                       
                       if (options.MaxDocumentsPerCollection > 0 && documentCount >= options.MaxDocumentsPerCollection)
                       {
                           break;
                       }
                   }
                   
                   if (options.MaxDocumentsPerCollection > 0 && documentCount >= options.MaxDocumentsPerCollection)
                   {
                       break;
                   }
               }
               
               // Backup indexes
               if (options.IncludeIndexes)
               {
                   await BackupCollectionIndexesAsync(collection, backupDirectory, collectionName);
               }
               
               return new CollectionBackupInfo
               {
                   CollectionName = collectionName,
                   DocumentCount = documentCount,
                   SizeBytes = sizeBytes,
                   BackupPath = collectionPath
               };
           }
           
           private async Task BackupCollectionIndexesAsync(IMongoCollection<MongoDB.Bson.BsonDocument> collection, string backupDirectory, string collectionName)
           {
               var indexes = await collection.Indexes.List().ToListAsync();
               var indexesPath = Path.Combine(backupDirectory, $"{collectionName}_indexes.json");
               
               var indexData = indexes.Select(index => new
               {
                   Name = index["name"].AsString,
                   Key = index["key"],
                   Options = index.Elements.Where(e => e.Name != "v" && e.Name != "key" && e.Name != "name").ToDictionary(e => e.Name, e => e.Value)
               });
               
               var indexJson = JsonSerializer.Serialize(indexData, new JsonSerializerOptions { WriteIndented = true });
               await File.WriteAllTextAsync(indexesPath, indexJson);
           }
           
           // Restore from backup
           public async Task<RestoreResult> RestoreFromBackupAsync(string backupPath, RestoreOptions? options = null)
           {
               options ??= new RestoreOptions();
               var restoreId = Guid.NewGuid().ToString();
               var startTime = DateTime.UtcNow;
               
               _logger.LogInformation($"Starting restore {restoreId} from {backupPath}");
               
               var stopwatch = Stopwatch.StartNew();
               
               try
               {
                   // Load backup manifest
                   var manifestPath = Path.Combine(backupPath, "backup_manifest.json");
                   if (!File.Exists(manifestPath))
                   {
                       throw new FileNotFoundException("Backup manifest not found");
                   }
                   
                   var manifestJson = await File.ReadAllTextAsync(manifestPath);
                   var manifest = JsonSerializer.Deserialize<BackupManifest>(manifestJson);
                   
                   if (manifest == null)
                   {
                       throw new InvalidOperationException("Invalid backup manifest");
                   }
                   
                   long totalRestored = 0;
                   
                   foreach (var collectionInfo in manifest.Collections)
                   {
                       if (options.ExcludedCollections.Contains(collectionInfo.CollectionName))
                       {
                           _logger.LogInformation($"Skipping excluded collection: {collectionInfo.CollectionName}");
                           continue;
                       }
                       
                       var restored = await RestoreCollectionAsync(collectionInfo, options);
                       totalRestored += restored;
                       
                       _logger.LogInformation($"Restored collection {collectionInfo.CollectionName}: {restored} documents");
                   }
                   
                   stopwatch.Stop();
                   
                   _logger.LogInformation($"Restore {restoreId} completed in {stopwatch.ElapsedMilliseconds}ms. Total: {totalRestored} documents");
                   
                   return new RestoreResult
                   {
                       RestoreId = restoreId,
                       Success = true,
                       DurationMs = stopwatch.ElapsedMilliseconds,
                       TotalDocuments = totalRestored,
                       BackupId = manifest.BackupId
                   };
               }
               catch (Exception ex)
               {
                   stopwatch.Stop();
                   _logger.LogError(ex, $"Restore {restoreId} failed after {stopwatch.ElapsedMilliseconds}ms");
                   
                   return new RestoreResult
                   {
                       RestoreId = restoreId,
                       Success = false,
                       ErrorMessage = ex.Message,
                       DurationMs = stopwatch.ElapsedMilliseconds
                   };
               }
           }
           
           private async Task<long> RestoreCollectionAsync(CollectionBackupInfo collectionInfo, RestoreOptions options)
           {
               var collection = _database.GetCollection<MongoDB.Bson.BsonDocument>(collectionInfo.CollectionName);
               
               // Drop collection if specified
               if (options.DropExistingCollections)
               {
                   await _database.DropCollectionAsync(collectionInfo.CollectionName);
               }
               
               var documents = new List<MongoDB.Bson.BsonDocument>();
               var lines = await File.ReadAllLinesAsync(collectionInfo.BackupPath);
               long restoredCount = 0;
               
               foreach (var line in lines)
               {
                   if (string.IsNullOrWhiteSpace(line)) continue;
                   
                   var document = MongoDB.Bson.BsonDocument.Parse(line);
                   documents.Add(document);
                   
                   if (documents.Count >= options.BatchSize)
                   {
                       await collection.InsertManyAsync(documents, new InsertManyOptions { IsOrdered = false });
                       restoredCount += documents.Count;
                       documents.Clear();
                   }
               }
               
               // Insert remaining documents
               if (documents.Count > 0)
               {
                   await collection.InsertManyAsync(documents, new InsertManyOptions { IsOrdered = false });
                   restoredCount += documents.Count;
               }
               
               // Restore indexes if available
               if (options.RestoreIndexes)
               {
                   await RestoreCollectionIndexesAsync(collection, Path.GetDirectoryName(collectionInfo.BackupPath)!, collectionInfo.CollectionName);
               }
               
               return restoredCount;
           }
           
           private async Task RestoreCollectionIndexesAsync(IMongoCollection<MongoDB.Bson.BsonDocument> collection, string backupDirectory, string collectionName)
           {
               var indexesPath = Path.Combine(backupDirectory, $"{collectionName}_indexes.json");
               if (!File.Exists(indexesPath)) return;
               
               try
               {
                   var indexJson = await File.ReadAllTextAsync(indexesPath);
                   var indexes = JsonSerializer.Deserialize<List<dynamic>>(indexJson);
                   
                   // Note: In a real implementation, you'd properly recreate indexes
                   // This is a simplified version for demonstration
                   _logger.LogInformation($"Index restoration for {collectionName} would be implemented here");
               }
               catch (Exception ex)
               {
                   _logger.LogWarning($"Failed to restore indexes for {collectionName}: {ex.Message}");
               }
           }
           
           // List available backups
           public async Task<List<BackupMetadata>> ListBackupsAsync(TimeSpan? olderThan = null)
           {
               var filter = Builders<BackupMetadata>.Filter.Empty;
               
               if (olderThan.HasValue)
               {
                   var cutoffDate = DateTime.UtcNow.Subtract(olderThan.Value);
                   filter = Builders<BackupMetadata>.Filter.Lt(b => b.StartTime, cutoffDate);
               }
               
               return await _backupMetadata.Find(filter)
                   .SortByDescending(b => b.StartTime)
                   .ToListAsync();
           }
           
           // Cleanup old backups
           public async Task<int> CleanupOldBackupsAsync(TimeSpan retentionPeriod, bool deleteFiles = false)
           {
               var cutoffDate = DateTime.UtcNow.Subtract(retentionPeriod);
               var oldBackups = await _backupMetadata.Find(b => b.StartTime < cutoffDate).ToListAsync();
               
               var deletedCount = 0;
               
               foreach (var backup in oldBackups)
               {
                   try
                   {
                       if (deleteFiles && !string.IsNullOrEmpty(backup.BackupPath) && Directory.Exists(backup.BackupPath))
                       {
                           Directory.Delete(backup.BackupPath, true);
                           _logger.LogInformation($"Deleted backup files: {backup.BackupPath}");
                       }
                       
                       await _backupMetadata.DeleteOneAsync(b => b.Id == backup.Id);
                       deletedCount++;
                   }
                   catch (Exception ex)
                   {
                       _logger.LogError(ex, $"Failed to cleanup backup {backup.BackupId}: {ex.Message}");
                   }
               }
               
               _logger.LogInformation($"Cleaned up {deletedCount} old backups");
               return deletedCount;
           }
       }
       
       // Supporting classes
       public class BackupOptions
       {
           public List<string> ExcludedCollections { get; set; } = new();
           public bool IncludeIndexes { get; set; } = true;
           public int MaxDocumentsPerCollection { get; set; } = 0; // 0 = no limit
           public bool CompressBackup { get; set; } = false;
       }
       
       public class RestoreOptions
       {
           public List<string> ExcludedCollections { get; set; } = new();
           public bool DropExistingCollections { get; set; } = false;
           public bool RestoreIndexes { get; set; } = true;
           public int BatchSize { get; set; } = 1000;
       }
       
       public class BackupResult
       {
           public string BackupId { get; set; } = string.Empty;
           public bool Success { get; set; }
           public string? BackupPath { get; set; }
           public long DurationMs { get; set; }
           public long TotalDocuments { get; set; }
           public long TotalSizeBytes { get; set; }
           public string? ErrorMessage { get; set; }
       }
       
       public class RestoreResult
       {
           public string RestoreId { get; set; } = string.Empty;
           public bool Success { get; set; }
           public long DurationMs { get; set; }
           public long TotalDocuments { get; set; }
           public string? BackupId { get; set; }
           public string? ErrorMessage { get; set; }
       }
       
       public class BackupManifest
       {
           public string BackupId { get; set; } = string.Empty;
           public string DatabaseName { get; set; } = string.Empty;
           public BackupType BackupType { get; set; }
           public DateTime StartTime { get; set; }
           public DateTime? EndTime { get; set; }
           public long DurationMs { get; set; }
           public List<CollectionBackupInfo> Collections { get; set; } = new();
       }
       
       public class CollectionBackupInfo
       {
           public string CollectionName { get; set; } = string.Empty;
           public long DocumentCount { get; set; }
           public long SizeBytes { get; set; }
           public string BackupPath { get; set; } = string.Empty;
       }
       
       public class BackupMetadata
       {
           [MongoDB.Bson.Serialization.Attributes.BsonId]
           [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("backupId")]
           public string BackupId { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("backupType")]
           public BackupType BackupType { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("databaseName")]
           public string DatabaseName { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("backupPath")]
           public string? BackupPath { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("startTime")]
           public DateTime StartTime { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("endTime")]
           public DateTime EndTime { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("durationMs")]
           public long DurationMs { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("totalDocuments")]
           public long TotalDocuments { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("totalSizeBytes")]
           public long TotalSizeBytes { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("status")]
           public BackupStatus Status { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("collections")]
           public List<string> Collections { get; set; } = new();
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("errorMessage")]
           public string? ErrorMessage { get; set; }
       }
       
       public enum BackupType
       {
           Full,
           Incremental,
           Differential
       }
       
       public enum BackupStatus
       {
           InProgress,
           Completed,
           Failed,
           Cancelled
       }
   }
   ```

4. **Final Integration Test for Production Features**
   ```csharp
   // Add to Program.cs
   static async Task TestProductionDeploymentFeatures()
   {
       Console.WriteLine("\n=== Production Deployment Features Tests ===\n");
       
       // Setup services
       var services = new ServiceCollection();
       services.AddLogging(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Information));
       services.AddSingleton<IConfiguration>(configuration);
       services.AddSingleton<MongoDBService>();
       services.AddSingleton<ProductionConfigurationService>();
       services.AddSingleton<HealthMonitoringService>();
       services.AddSingleton<BackupRecoveryService>();
       
       var serviceProvider = services.BuildServiceProvider();
       
       var productionConfig = serviceProvider.GetRequiredService<ProductionConfigurationService>();
       var healthMonitoring = serviceProvider.GetRequiredService<HealthMonitoringService>();
       var backupRecovery = serviceProvider.GetRequiredService<BackupRecoveryService>();
       
       // Test 1: Apply production configurations
       Console.WriteLine("=== Applying Production Configurations ===");
       await productionConfig.ApplyProductionConfigurationsAsync();
       
       // Test 2: Health monitoring
       Console.WriteLine("\n=== Health Monitoring Test ===");
       var healthReport = await healthMonitoring.PerformHealthCheckAsync();
       Console.WriteLine($"Overall Health: {healthReport.OverallHealth}");
       Console.WriteLine($"Database Ping: {healthReport.DatabaseHealth?.PingTimeMs}ms");
       Console.WriteLine($"Memory Usage: {healthReport.PerformanceHealth?.MemoryUsageMB}MB");
       Console.WriteLine($"Total Indexes: {healthReport.IndexHealth?.TotalIndexes}");
       Console.WriteLine($"Data Size: {healthReport.StorageHealth?.DataSizeGB:F2}GB");
       
       if (healthReport.ReplicationHealth?.IsReplicaSet == true)
       {
           Console.WriteLine($"Replica Set: {healthReport.ReplicationHealth.HealthyMembers}/{healthReport.ReplicationHealth.TotalMembers} healthy members");
       }
       
       // Test 3: Health trends
       Console.WriteLine("\n=== Health Trends Analysis ===");
       var trends = await healthMonitoring.GetHealthTrendsAsync(TimeSpan.FromHours(24));
       Console.WriteLine($"Found {trends.Count} health trend data points in last 24 hours");
       
       foreach (var trend in trends.Take(5))
       {
           Console.WriteLine($"{trend.Id.Year}-{trend.Id.Month:D2}-{trend.Id.Day:D2} {trend.Id.Hour:D2}:00 - " +
                           $"Health: {trend.HealthPercentage:F1}%, Avg Ping: {trend.AvgPingMs:F1}ms");
       }
       
       // Test 4: Backup and recovery
       Console.WriteLine("\n=== Backup and Recovery Test ===");
       var backupPath = Path.Combine(Path.GetTempPath(), "mongodb_backups");
       Directory.CreateDirectory(backupPath);
       
       try
       {
           // Create backup
           var backupOptions = new BackupOptions
           {
               IncludeIndexes = true,
               ExcludedCollections = new List<string> { "tempCollection" }
           };
           
           var backupResult = await backupRecovery.CreateFullBackupAsync(backupPath, backupOptions);
           
           if (backupResult.Success)
           {
               Console.WriteLine($"Backup created successfully: {backupResult.BackupId}");
               Console.WriteLine($"Backup path: {backupResult.BackupPath}");
               Console.WriteLine($"Duration: {backupResult.DurationMs}ms");
               Console.WriteLine($"Documents: {backupResult.TotalDocuments:N0}");
               Console.WriteLine($"Size: {backupResult.TotalSizeBytes / 1024 / 1024:F2}MB");
               
               // List all backups
               Console.WriteLine("\n=== Available Backups ===");
               var allBackups = await backupRecovery.ListBackupsAsync();
               foreach (var backup in allBackups.Take(5))
               {
                   Console.WriteLine($"Backup: {backup.BackupId} ({backup.Status}) - {backup.StartTime:yyyy-MM-dd HH:mm:ss}");
                   Console.WriteLine($"  Size: {backup.TotalSizeBytes / 1024 / 1024:F2}MB, Documents: {backup.TotalDocuments:N0}");
               }
               
               // Test restore (to a different database name for safety)
               Console.WriteLine("\n=== Testing Restore Process ===");
               Console.WriteLine("Note: In production, this would restore to a different environment");
               Console.WriteLine($"Backup {backupResult.BackupId} is ready for restore operations");
           }
           else
           {
               Console.WriteLine($"Backup failed: {backupResult.ErrorMessage}");
           }
       }
       catch (Exception ex)
       {
           Console.WriteLine($"Backup test failed: {ex.Message}");
       }
       
       // Test 5: Cleanup simulation
       Console.WriteLine("\n=== Backup Cleanup Simulation ===");
       var oldBackupsCount = await backupRecovery.CleanupOldBackupsAsync(TimeSpan.FromDays(30), deleteFiles: false);
       Console.WriteLine($"Would cleanup {oldBackupsCount} old backups (files not actually deleted in demo)");
       
       Console.WriteLine("\n=== Production Deployment Tests Completed ===");
       Console.WriteLine("Your MongoDB application is production-ready with:");
       Console.WriteLine("✓ Production configurations applied");
       Console.WriteLine("✓ Comprehensive health monitoring");
       Console.WriteLine("✓ Backup and recovery capabilities");
       Console.WriteLine("✓ Performance monitoring and alerting");
       Console.WriteLine("✓ Enterprise integration patterns");
   }
   ```

5. **Update Main Program**
   ```csharp
   // Updated Program.cs main method
   static async Task Main(string[] args)
   {
       Console.WriteLine("=== MongoDB Mastering Course - Day 3: Advanced Features ===\n");
       
       try
       {
           // Day 3 Lab Tests
           await TestAdvancedSchemaDesign();
           await TestRealTimeAnalytics();
           await TestHighPerformanceProcessing();
           await TestEnterpriseIntegrationPatterns();
           await TestProductionDeploymentFeatures();
           
           Console.WriteLine("\n🎉 All Day 3 labs completed successfully!");
           Console.WriteLine("\nYou have mastered:");
           Console.WriteLine("• Advanced schema design patterns");
           Console.WriteLine("• Real-time analytics and reporting");
           Console.WriteLine("• High-performance data processing");
           Console.WriteLine("• Enterprise integration patterns");
           Console.WriteLine("• Production deployment and monitoring");
           Console.WriteLine("\nYour MongoDB expertise is now production-ready! 🚀");
       }
       catch (Exception ex)
       {
           Console.WriteLine($"\n❌ An error occurred: {ex.Message}");
           Console.WriteLine($"Stack trace: {ex.StackTrace}");
       }
       
       Console.WriteLine("\nPress any key to exit...");
       Console.ReadKey();
   }
   ```

### Deliverables
- Production-ready MongoDB configuration management
- Comprehensive health monitoring and alerting system
- Automated backup and disaster recovery solution
- Performance monitoring and optimization tools
- Enterprise-grade deployment patterns

## Summary

These updated Day 3 labs provide:

1. **Advanced Schema Design** - Polymorphic models, multi-tenant patterns, complex relationships
2. **Real-time Analytics** - Sophisticated aggregation pipelines, business intelligence, time-series analysis
3. **High-Performance Processing** - Bulk operations, parallel processing, memory optimization
4. **Enterprise Integration** - Microservices, event sourcing, CQRS, distributed patterns
5. **Production Deployment** - Health monitoring, backup/recovery, configuration management

Each lab builds upon enterprise-level requirements and provides production-ready implementations using C#, Visual Studio Code, and Docker. The complete course now covers everything from basic CRUD operations to advanced enterprise patterns, making students ready for real-world MongoDB development challenges. HealthStatus.Critical))
                   return HealthStatus.Critical;
               
               if (statuses.Any(s => s == 