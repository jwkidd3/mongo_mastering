# MongoDB Day 2 - C# Development Labs
*5 hands-on labs using C# and Visual Studio Code, 45 minutes each*

---

## Prerequisites

### Required Software
- Docker Desktop
- Visual Studio Code
- .NET 8 SDK
- C# extension for VS Code
- MongoDB for VS Code extension

### Docker Setup
```bash
# Pull MongoDB Docker image
docker pull mongo:latest

# Run MongoDB container
docker run -d --name mongodb-lab -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo:latest

# Verify container is running
docker ps
```

### Project Setup
```bash
# Create new console application
mkdir MongoDBLabs
cd MongoDBLabs
dotnet new console
dotnet add package MongoDB.Driver
dotnet add package Microsoft.Extensions.Configuration
dotnet add package Microsoft.Extensions.Configuration.Json
```

---

## Lab 1: C# MongoDB Driver Setup and Basic CRUD Operations (45 minutes)

### Learning Objectives
- Configure MongoDB C# driver with Docker container
- Implement basic CRUD operations using C# driver
- Handle connection strings and database configuration
- Understand async/await patterns with MongoDB

### Tasks

#### Part A: Project Configuration (15 minutes)

1. **Create appsettings.json**
   ```json
   {
     "ConnectionStrings": {
       "MongoDB": "mongodb://admin:password@localhost:27017/ecommerce?authSource=admin"
     },
     "DatabaseSettings": {
       "DatabaseName": "ecommerce",
       "CollectionName": "products"
     }
   }
   ```

2. **Create Product Model**
   ```csharp
   // Models/Product.cs
   using MongoDB.Bson;
   using MongoDB.Bson.Serialization.Attributes;
   
   namespace MongoDBLabs.Models
   {
       public class Product
       {
           [BsonId]
           [BsonRepresentation(BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [BsonElement("name")]
           public string Name { get; set; } = string.Empty;
           
           [BsonElement("price")]
           public decimal Price { get; set; }
           
           [BsonElement("category")]
           public string Category { get; set; } = string.Empty;
           
           [BsonElement("inStock")]
           public bool InStock { get; set; }
           
           [BsonElement("tags")]
           public List<string> Tags { get; set; } = new();
           
           [BsonElement("specifications")]
           public Dictionary<string, object> Specifications { get; set; } = new();
           
           [BsonElement("createdAt")]
           public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
       }
   }
   ```

3. **Create Database Service**
   ```csharp
   // Services/MongoDBService.cs
   using MongoDB.Driver;
   using Microsoft.Extensions.Configuration;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class MongoDBService
       {
           private readonly IMongoCollection<Product> _products;
           
           public MongoDBService(IConfiguration configuration)
           {
               var connectionString = configuration.GetConnectionString("MongoDB");
               var client = new MongoClient(connectionString);
               var database = client.GetDatabase(configuration["DatabaseSettings:DatabaseName"]);
               _products = database.GetCollection<Product>("products");
           }
           
           public IMongoCollection<Product> Products => _products;
       }
   }
   ```

#### Part B: Basic CRUD Operations (25 minutes)

4. **Implement CRUD Methods**
   ```csharp
   // Services/ProductService.cs
   using MongoDB.Driver;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class ProductService
       {
           private readonly IMongoCollection<Product> _products;
           
           public ProductService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
           }
           
           // Create
           public async Task<Product> CreateProductAsync(Product product)
           {
               await _products.InsertOneAsync(product);
               return product;
           }
           
           public async Task CreateProductsAsync(List<Product> products)
           {
               await _products.InsertManyAsync(products);
           }
           
           // Read
           public async Task<List<Product>> GetAllProductsAsync()
           {
               return await _products.Find(_ => true).ToListAsync();
           }
           
           public async Task<Product?> GetProductByIdAsync(string id)
           {
               return await _products.Find(p => p.Id == id).FirstOrDefaultAsync();
           }
           
           public async Task<List<Product>> GetProductsByCategoryAsync(string category)
           {
               return await _products.Find(p => p.Category == category).ToListAsync();
           }
           
           // Update
           public async Task<bool> UpdateProductAsync(string id, Product product)
           {
               var result = await _products.ReplaceOneAsync(p => p.Id == id, product);
               return result.ModifiedCount > 0;
           }
           
           public async Task<bool> UpdateProductPriceAsync(string id, decimal newPrice)
           {
               var filter = Builders<Product>.Filter.Eq(p => p.Id, id);
               var update = Builders<Product>.Update.Set(p => p.Price, newPrice);
               var result = await _products.UpdateOneAsync(filter, update);
               return result.ModifiedCount > 0;
           }
           
           // Delete
           public async Task<bool> DeleteProductAsync(string id)
           {
               var result = await _products.DeleteOneAsync(p => p.Id == id);
               return result.DeletedCount > 0;
           }
           
           public async Task<long> DeleteProductsByCategoryAsync(string category)
           {
               var result = await _products.DeleteManyAsync(p => p.Category == category);
               return result.DeletedCount;
           }
       }
   }
   ```

5. **Update Program.cs**
   ```csharp
   using Microsoft.Extensions.Configuration;
   using MongoDBLabs.Services;
   using MongoDBLabs.Models;
   
   // Configuration setup
   var configuration = new ConfigurationBuilder()
       .SetBasePath(Directory.GetCurrentDirectory())
       .AddJsonFile("appsettings.json")
       .Build();
   
   // Services
   var mongoService = new MongoDBService(configuration);
   var productService = new ProductService(mongoService);
   
   // Test CRUD operations
   await TestCRUDOperations(productService);
   
   static async Task TestCRUDOperations(ProductService productService)
   {
       Console.WriteLine("=== MongoDB C# Driver CRUD Tests ===\n");
       
       // Create sample products
       var products = new List<Product>
       {
           new Product
           {
               Name = "Wireless Headphones",
               Price = 89.99m,
               Category = "Electronics",
               InStock = true,
               Tags = new List<string> { "wireless", "bluetooth", "audio" },
               Specifications = new Dictionary<string, object>
               {
                   { "battery", "20 hours" },
                   { "color", "black" }
               }
           },
           new Product
           {
               Name = "Gaming Mouse",
               Price = 45.99m,
               Category = "Electronics",
               InStock = true,
               Tags = new List<string> { "gaming", "rgb", "wireless" }
           }
       };
       
       // INSERT
       Console.WriteLine("Creating products...");
       await productService.CreateProductsAsync(products);
       
       // READ
       Console.WriteLine("\nFetching all products:");
       var allProducts = await productService.GetAllProductsAsync();
       foreach (var product in allProducts)
       {
           Console.WriteLine($"- {product.Name}: ${product.Price}");
       }
       
       // UPDATE
       if (allProducts.Any())
       {
           var firstProduct = allProducts.First();
           Console.WriteLine($"\nUpdating price of {firstProduct.Name}...");
           await productService.UpdateProductPriceAsync(firstProduct.Id!, 99.99m);
       }
       
       // READ after update
       Console.WriteLine("\nProducts after price update:");
       var updatedProducts = await productService.GetAllProductsAsync();
       foreach (var product in updatedProducts)
       {
           Console.WriteLine($"- {product.Name}: ${product.Price}");
       }
       
       // DELETE
       Console.WriteLine("\nDeleting Electronics category...");
       var deletedCount = await productService.DeleteProductsByCategoryAsync("Electronics");
       Console.WriteLine($"Deleted {deletedCount} products");
   }
   ```

#### Part C: Testing and Verification (5 minutes)

6. **Run and Test Application**
   ```bash
   dotnet run
   ```

7. **Verify in MongoDB Compass or Shell**
   - Connect to mongodb://admin:password@localhost:27017
   - Check ecommerce database and products collection
   - Verify operations were successful

### Deliverables
- Working C# console application with CRUD operations
- Screenshot of successful program execution
- Verification of data in MongoDB using Compass or shell

---

## Lab 2: Advanced Querying with C# MongoDB Driver (45 minutes)

### Learning Objectives
- Implement complex queries using FilterDefinition builders
- Work with projections and sorting in C#
- Handle pagination and query optimization
- Use LINQ with MongoDB driver

### Tasks

#### Part A: Query Builder Patterns (20 minutes)

1. **Create Advanced Query Service**
   ```csharp
   // Services/ProductQueryService.cs
   using MongoDB.Driver;
   using MongoDB.Driver.Linq;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class ProductQueryService
       {
           private readonly IMongoCollection<Product> _products;
           
           public ProductQueryService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
           }
           
           // Price range queries
           public async Task<List<Product>> GetProductsByPriceRangeAsync(decimal minPrice, decimal maxPrice)
           {
               var filter = Builders<Product>.Filter.And(
                   Builders<Product>.Filter.Gte(p => p.Price, minPrice),
                   Builders<Product>.Filter.Lte(p => p.Price, maxPrice)
               );
               
               return await _products.Find(filter).ToListAsync();
           }
           
           // Text search simulation (until text indexes are created)
           public async Task<List<Product>> SearchProductsByNameAsync(string searchTerm)
           {
               var filter = Builders<Product>.Filter.Regex(p => p.Name, 
                   new MongoDB.Bson.BsonRegularExpression(searchTerm, "i"));
               
               return await _products.Find(filter).ToListAsync();
           }
           
           // Array operations
           public async Task<List<Product>> GetProductsByTagsAsync(List<string> tags)
           {
               var filter = Builders<Product>.Filter.AnyIn(p => p.Tags, tags);
               return await _products.Find(filter).ToListAsync();
           }
           
           public async Task<List<Product>> GetProductsWithAllTagsAsync(List<string> tags)
           {
               var filter = Builders<Product>.Filter.All(p => p.Tags, tags);
               return await _products.Find(filter).ToListAsync();
           }
           
           // Projections
           public async Task<List<object>> GetProductNamesAndPricesAsync()
           {
               var projection = Builders<Product>.Projection
                   .Include(p => p.Name)
                   .Include(p => p.Price)
                   .Exclude(p => p.Id);
               
               return await _products.Find(_ => true)
                   .Project(projection)
                   .ToListAsync();
           }
           
           // Sorting and pagination
           public async Task<List<Product>> GetProductsPagedAsync(int pageNumber, int pageSize, string sortField = "name")
           {
               var sortDefinition = sortField.ToLower() switch
               {
                   "price" => Builders<Product>.Sort.Ascending(p => p.Price),
                   "name" => Builders<Product>.Sort.Ascending(p => p.Name),
                   "createdat" => Builders<Product>.Sort.Descending(p => p.CreatedAt),
                   _ => Builders<Product>.Sort.Ascending(p => p.Name)
               };
               
               return await _products.Find(_ => true)
                   .Sort(sortDefinition)
                   .Skip((pageNumber - 1) * pageSize)
                   .Limit(pageSize)
                   .ToListAsync();
           }
           
           // Count operations
           public async Task<long> GetProductCountAsync()
           {
               return await _products.CountDocumentsAsync(_ => true);
           }
           
           public async Task<long> GetProductCountByCategoryAsync(string category)
           {
               return await _products.CountDocumentsAsync(p => p.Category == category);
           }
       }
   }
   ```

#### Part B: LINQ Integration (15 minutes)

2. **Create LINQ Query Examples**
   ```csharp
   // Services/ProductLinqService.cs
   using MongoDB.Driver;
   using MongoDB.Driver.Linq;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class ProductLinqService
       {
           private readonly IMongoCollection<Product> _products;
           
           public ProductLinqService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
           }
           
           // LINQ queries
           public async Task<List<Product>> GetExpensiveProductsAsync(decimal minPrice)
           {
               return await _products.AsQueryable()
                   .Where(p => p.Price >= minPrice && p.InStock)
                   .OrderByDescending(p => p.Price)
                   .ToListAsync();
           }
           
           public async Task<List<IGrouping<string, Product>>> GetProductsGroupedByCategoryAsync()
           {
               return await _products.AsQueryable()
                   .GroupBy(p => p.Category)
                   .ToListAsync();
           }
           
           public async Task<decimal> GetAveragePriceAsync()
           {
               return await _products.AsQueryable()
                   .Where(p => p.InStock)
                   .Select(p => p.Price)
                   .AverageAsync();
           }
           
           public async Task<List<string>> GetUniqueTagsAsync()
           {
               return await _products.AsQueryable()
                   .SelectMany(p => p.Tags)
                   .Distinct()
                   .ToListAsync();
           }
           
           // Complex LINQ queries
           public async Task<List<object>> GetCategoryStatisticsAsync()
           {
               return await _products.AsQueryable()
                   .GroupBy(p => p.Category)
                   .Select(g => new 
                   {
                       Category = g.Key,
                       Count = g.Count(),
                       AveragePrice = g.Average(p => p.Price),
                       MaxPrice = g.Max(p => p.Price),
                       MinPrice = g.Min(p => p.Price)
                   })
                   .ToListAsync();
           }
       }
   }
   ```

#### Part B: Testing Queries (10 minutes)

3. **Update Program.cs for Query Testing**
   ```csharp
   // Add to Program.cs
   static async Task TestAdvancedQueries(ProductQueryService queryService, ProductLinqService linqService)
   {
       Console.WriteLine("\n=== Advanced Query Tests ===\n");
       
       // Price range query
       Console.WriteLine("Products between $20 and $100:");
       var priceRangeProducts = await queryService.GetProductsByPriceRangeAsync(20m, 100m);
       foreach (var product in priceRangeProducts)
       {
           Console.WriteLine($"- {product.Name}: ${product.Price}");
       }
       
       // Tag search
       Console.WriteLine("\nProducts with 'wireless' tag:");
       var wirelessProducts = await queryService.GetProductsByTagsAsync(new List<string> { "wireless" });
       foreach (var product in wirelessProducts)
       {
           Console.WriteLine($"- {product.Name}: {string.Join(", ", product.Tags)}");
       }
       
       // LINQ queries
       Console.WriteLine("\nExpensive products (>$50) using LINQ:");
       var expensiveProducts = await linqService.GetExpensiveProductsAsync(50m);
       foreach (var product in expensiveProducts)
       {
           Console.WriteLine($"- {product.Name}: ${product.Price}");
       }
       
       // Statistics
       Console.WriteLine("\nCategory statistics:");
       var stats = await linqService.GetCategoryStatisticsAsync();
       foreach (var stat in stats)
       {
           Console.WriteLine($"- {stat}");
       }
       
       // Pagination
       Console.WriteLine("\nPaginated results (Page 1, Size 2):");
       var pagedProducts = await queryService.GetProductsPagedAsync(1, 2, "price");
       foreach (var product in pagedProducts)
       {
           Console.WriteLine($"- {product.Name}: ${product.Price}");
       }
   }
   ```

### Deliverables
- Advanced query service with multiple query patterns
- LINQ integration examples
- Test results demonstrating various query capabilities

---

## Lab 3: Aggregation Pipelines in C# (45 minutes)

### Learning Objectives
- Build aggregation pipelines using C# MongoDB driver
- Implement grouping, sorting, and data transformation
- Handle complex multi-stage aggregations
- Work with lookup operations (joins)

### Tasks

#### Part A: Basic Aggregation Operations (20 minutes)

1. **Create Order Models for Aggregation**
   ```csharp
   // Models/Order.cs
   using MongoDB.Bson;
   using MongoDB.Bson.Serialization.Attributes;
   
   namespace MongoDBLabs.Models
   {
       public class Order
       {
           [BsonId]
           [BsonRepresentation(BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [BsonElement("customerId")]
           [BsonRepresentation(BsonType.ObjectId)]
           public string CustomerId { get; set; } = string.Empty;
           
           [BsonElement("orderDate")]
           public DateTime OrderDate { get; set; }
           
           [BsonElement("items")]
           public List<OrderItem> Items { get; set; } = new();
           
           [BsonElement("total")]
           public decimal Total { get; set; }
           
           [BsonElement("status")]
           public string Status { get; set; } = "pending";
       }
       
       public class OrderItem
       {
           [BsonElement("productId")]
           [BsonRepresentation(BsonType.ObjectId)]
           public string ProductId { get; set; } = string.Empty;
           
           [BsonElement("productName")]
           public string ProductName { get; set; } = string.Empty;
           
           [BsonElement("quantity")]
           public int Quantity { get; set; }
           
           [BsonElement("price")]
           public decimal Price { get; set; }
       }
       
       public class Customer
       {
           [BsonId]
           [BsonRepresentation(BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [BsonElement("name")]
           public string Name { get; set; } = string.Empty;
           
           [BsonElement("email")]
           public string Email { get; set; } = string.Empty;
           
           [BsonElement("city")]
           public string City { get; set; } = string.Empty;
       }
   }
   ```

2. **Create Aggregation Service**
   ```csharp
   // Services/AggregationService.cs
   using MongoDB.Driver;
   using MongoDB.Bson;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class AggregationService
       {
           private readonly IMongoDatabase _database;
           private readonly IMongoCollection<Order> _orders;
           private readonly IMongoCollection<Product> _products;
           private readonly IMongoCollection<Customer> _customers;
           
           public AggregationService(MongoDBService mongoDBService)
           {
               _database = mongoDBService.Products.Database;
               _orders = _database.GetCollection<Order>("orders");
               _products = _database.GetCollection<Product>("products");
               _customers = _database.GetCollection<Customer>("customers");
           }
           
           // Sales by month
           public async Task<List<BsonDocument>> GetSalesByMonthAsync()
           {
               var pipeline = new[]
               {
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = new BsonDocument
                       {
                           ["year"] = new BsonDocument("$year", "$orderDate"),
                           ["month"] = new BsonDocument("$month", "$orderDate")
                       },
                       ["totalSales"] = new BsonDocument("$sum", "$total"),
                       ["orderCount"] = new BsonDocument("$sum", 1)
                   }),
                   new BsonDocument("$sort", new BsonDocument
                   {
                       ["_id.year"] = 1,
                       ["_id.month"] = 1
                   })
               };
               
               return await _orders.Aggregate<BsonDocument>(pipeline).ToListAsync();
           }
           
           // Top selling products
           public async Task<List<BsonDocument>> GetTopSellingProductsAsync(int limit = 10)
           {
               var pipeline = new[]
               {
                   new BsonDocument("$unwind", "$items"),
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = "$items.productId",
                       ["productName"] = new BsonDocument("$first", "$items.productName"),
                       ["totalQuantity"] = new BsonDocument("$sum", "$items.quantity"),
                       ["totalRevenue"] = new BsonDocument("$sum", 
                           new BsonDocument("$multiply", new BsonArray { "$items.quantity", "$items.price" }))
                   }),
                   new BsonDocument("$sort", new BsonDocument("totalRevenue", -1)),
                   new BsonDocument("$limit", limit)
               };
               
               return await _orders.Aggregate<BsonDocument>(pipeline).ToListAsync();
           }
           
           // Customer order statistics
           public async Task<List<BsonDocument>> GetCustomerOrderStatsAsync()
           {
               var pipeline = new[]
               {
                   new BsonDocument("$group", new BsonDocument
                   {
                       ["_id"] = "$customerId",
                       ["totalOrders"] = new BsonDocument("$sum", 1),
                       ["totalSpent"] = new BsonDocument("$sum", "$total"),
                       ["averageOrderValue"] = new BsonDocument("$avg", "$total"),
                       ["lastOrderDate"] = new BsonDocument("$max", "$orderDate")
                   }),
                   new BsonDocument("$lookup", new BsonDocument
                   {
                       ["from"] = "customers",
                       ["localField"] = "_id",
                       ["foreignField"] = "_id",
                       ["as"] = "customer"
                   }),
                   new BsonDocument("$unwind", "$customer"),
                   new BsonDocument("$project", new BsonDocument
                   {
                       ["customerName"] = "$customer.name",
                       ["customerEmail"] = "$customer.email",
                       ["totalOrders"] = 1,
                       ["totalSpent"] = 1,
                       ["averageOrderValue"] = 1,
                       ["lastOrderDate"] = 1
                   }),
                   new BsonDocument("$sort", new BsonDocument("totalSpent", -1))
               };
               
               return await _orders.Aggregate<BsonDocument>(pipeline).ToListAsync();
           }
       }
   }
   ```

#### Part B: Typed Aggregation with C# (15 minutes)

3. **Create Strongly-Typed Aggregation Results**
   ```csharp
   // Models/AggregationResults.cs
   namespace MongoDBLabs.Models
   {
       public class MonthlySales
       {
           public MonthYear Id { get; set; } = new();
           public decimal TotalSales { get; set; }
           public int OrderCount { get; set; }
       }
       
       public class MonthYear
       {
           public int Year { get; set; }
           public int Month { get; set; }
       }
       
       public class TopProduct
       {
           public string Id { get; set; } = string.Empty;
           public string ProductName { get; set; } = string.Empty;
           public int TotalQuantity { get; set; }
           public decimal TotalRevenue { get; set; }
       }
       
       public class CustomerStats
       {
           public string Id { get; set; } = string.Empty;
           public string CustomerName { get; set; } = string.Empty;
           public string CustomerEmail { get; set; } = string.Empty;
           public int TotalOrders { get; set; }
           public decimal TotalSpent { get; set; }
           public decimal AverageOrderValue { get; set; }
           public DateTime LastOrderDate { get; set; }
       }
   }
   ```

4. **Create Typed Aggregation Service**
   ```csharp
   // Services/TypedAggregationService.cs
   using MongoDB.Driver;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class TypedAggregationService
       {
           private readonly IMongoCollection<Order> _orders;
           
           public TypedAggregationService(MongoDBService mongoDBService)
           {
               _orders = mongoDBService.Products.Database.GetCollection<Order>("orders");
           }
           
           public async Task<List<MonthlySales>> GetMonthlySalesTypedAsync()
           {
               return await _orders.Aggregate()
                   .Group(order => new { 
                       Year = order.OrderDate.Year, 
                       Month = order.OrderDate.Month 
                   }, 
                   group => new MonthlySales
                   {
                       Id = new MonthYear { Year = group.Key.Year, Month = group.Key.Month },
                       TotalSales = group.Sum(o => o.Total),
                       OrderCount = group.Count()
                   })
                   .SortBy(result => result.Id.Year)
                   .ThenBy(result => result.Id.Month)
                   .ToListAsync();
           }
           
           public async Task<List<TopProduct>> GetTopProductsTypedAsync(int limit = 10)
           {
               return await _orders.Aggregate()
                   .Unwind(order => order.Items)
                   .Group(order => order.Items.ProductId,
                       group => new TopProduct
                       {
                           Id = group.Key,
                           ProductName = group.First().Items.ProductName,
                           TotalQuantity = group.Sum(o => o.Items.Quantity),
                           TotalRevenue = group.Sum(o => o.Items.Quantity * o.Items.Price)
                       })
                   .SortByDescending(result => result.TotalRevenue)
                   .Limit(limit)
                   .ToListAsync();
           }
       }
   }
   ```

#### Part C: Sample Data and Testing (10 minutes)

5. **Create Sample Data Generator**
   ```csharp
   // Services/SampleDataService.cs
   using MongoDBLabs.Models;
   using MongoDB.Driver;
   
   namespace MongoDBLabs.Services
   {
       public class SampleDataService
       {
           private readonly IMongoDatabase _database;
           
           public SampleDataService(MongoDBService mongoDBService)
           {
               _database = mongoDBService.Products.Database;
           }
           
           public async Task GenerateSampleDataAsync()
           {
               // Create customers
               var customers = new List<Customer>
               {
                   new Customer { Name = "John Doe", Email = "john@example.com", City = "New York" },
                   new Customer { Name = "Jane Smith", Email = "jane@example.com", City = "Los Angeles" },
                   new Customer { Name = "Bob Johnson", Email = "bob@example.com", City = "Chicago" }
               };
               
               var customerCollection = _database.GetCollection<Customer>("customers");
               await customerCollection.InsertManyAsync(customers);
               
               // Create orders
               var orders = new List<Order>
               {
                   new Order
                   {
                       CustomerId = customers[0].Id!,
                       OrderDate = DateTime.UtcNow.AddDays(-30),
                       Items = new List<OrderItem>
                       {
                           new OrderItem { ProductName = "Laptop", Quantity = 1, Price = 999.99m },
                           new OrderItem { ProductName = "Mouse", Quantity = 2, Price = 25.99m }
                       },
                       Total = 1051.97m,
                       Status = "completed"
                   },
                   new Order
                   {
                       CustomerId = customers[1].Id!,
                       OrderDate = DateTime.UtcNow.AddDays(-15),
                       Items = new List<OrderItem>
                       {
                           new OrderItem { ProductName = "Keyboard", Quantity = 1, Price = 79.99m }
                       },
                       Total = 79.99m,
                       Status = "completed"
                   }
               };
               
               var orderCollection = _database.GetCollection<Order>("orders");
               await orderCollection.InsertManyAsync(orders);
           }
       }
   }
   ```

### Deliverables
- Working aggregation pipelines for sales analysis
- Both raw BsonDocument and strongly-typed approaches
- Sample data generation and testing results

---

## Lab 4: Indexing and Performance Optimization in C# (45 minutes)

### Learning Objectives
- Create and manage indexes programmatically using C#
- Analyze query performance and execution plans
- Implement performance monitoring and optimization strategies
- Handle large datasets efficiently

### Tasks

#### Part A: Index Management Service (20 minutes)

1. **Create Index Management Service**
   ```csharp
   // Services/IndexManagementService.cs
   using MongoDB.Driver;
   using MongoDBLabs.Models;
   using MongoDB.Bson;
   
   namespace MongoDBLabs.Services
   {
       public class IndexManagementService
       {
           private readonly IMongoCollection<Product> _products;
           private readonly IMongoDatabase _database;
           
           public IndexManagementService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
               _database = _products.Database;
           }
           
           // Create single field indexes
           public async Task CreateBasicIndexesAsync()
           {
               // Single field indexes
               await _products.Indexes.CreateOneAsync(
                   new CreateIndexModel<Product>(
                       Builders<Product>.IndexKeys.Ascending(p => p.Category),
                       new CreateIndexOptions { Name = "category_1" }
                   )
               );
               
               await _products.Indexes.CreateOneAsync(
                   new CreateIndexModel<Product>(
                       Builders<Product>.IndexKeys.Ascending(p => p.Price),
                       new CreateIndexOptions { Name = "price_1" }
                   )
               );
               
               Console.WriteLine("Basic indexes created successfully.");
           }
           
           // Create compound indexes
           public async Task CreateCompoundIndexesAsync()
           {
               var compoundIndex = Builders<Product>.IndexKeys
                   .Ascending(p => p.Category)
                   .Ascending(p => p.InStock)
                   .Descending(p => p.Price);
               
               await _products.Indexes.CreateOneAsync(
                   new CreateIndexModel<Product>(
                       compoundIndex,
                       new CreateIndexOptions { Name = "category_instock_price" }
                   )
               );
               
               Console.WriteLine("Compound index created successfully.");
           }
           
           // Create text indexes
           public async Task CreateTextIndexAsync()
           {
               var textIndex = Builders<Product>.IndexKeys
                   .Text(p => p.Name)
                   .Text(p => p.Category);
               
               await _products.Indexes.CreateOneAsync(
                   new CreateIndexModel<Product>(
                       textIndex,
                       new CreateIndexOptions 
                       { 
                           Name = "text_search",
                           DefaultLanguage = "english"
                       }
                   )
               );
               
               Console.WriteLine("Text index created successfully.");
           }
           
           // Create partial indexes
           public async Task CreatePartialIndexAsync()
           {
               var partialFilter = Builders<Product>.Filter.Eq(p => p.InStock, true);
               
               await _products.Indexes.CreateOneAsync(
                   new CreateIndexModel<Product>(
                       Builders<Product>.IndexKeys.Ascending(p => p.Price),
                       new CreateIndexOptions 
                       { 
                           Name = "price_instock_only",
                           PartialFilterExpression = partialFilter
                       }
                   )
               );
               
               Console.WriteLine("Partial index created successfully.");
           }
           
           // List all indexes
           public async Task ListIndexesAsync()
           {
               Console.WriteLine("\n=== Current Indexes ===");
               var indexes = await _products.Indexes.List().ToListAsync();
               
               foreach (var index in indexes)
               {
                   Console.WriteLine($"Index: {index["name"]}");
                   Console.WriteLine($"Keys: {index["key"]}");
                   if (index.Contains("partialFilterExpression"))
                   {
                       Console.WriteLine($"Partial Filter: {index["partialFilterExpression"]}");
                   }
                   Console.WriteLine();
               }
           }
           
           // Drop index
           public async Task DropIndexAsync(string indexName)
           {
               await _products.Indexes.DropOneAsync(indexName);
               Console.WriteLine($"Index '{indexName}' dropped successfully.");
           }
       }
   }
   ```

#### Part B: Performance Analysis Service (15 minutes)

2. **Create Performance Analysis Service**
   ```csharp
   // Services/PerformanceAnalysisService.cs
   using MongoDB.Driver;
   using MongoDB.Bson;
   using MongoDBLabs.Models;
   using System.Diagnostics;
   
   namespace MongoDBLabs.Services
   {
       public class PerformanceAnalysisService
       {
           private readonly IMongoCollection<Product> _products;
           
           public PerformanceAnalysisService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
           }
           
           // Analyze query performance
           public async Task<QueryAnalysisResult> AnalyzeQueryPerformanceAsync<T>(
               FilterDefinition<Product> filter, 
               string queryDescription)
           {
               var stopwatch = Stopwatch.StartNew();
               
               // Get explain plan
               var explainResult = await _products
                   .Find(filter)
                   .Explain(ExplainVerbosity.ExecutionStats);
               
               // Execute query to measure time
               var results = await _products.Find(filter).ToListAsync();
               stopwatch.Stop();
               
               var executionStats = explainResult["executionStats"];
               
               return new QueryAnalysisResult
               {
                   QueryDescription = queryDescription,
                   ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                   DocumentsExamined = executionStats["totalDocsExamined"].AsInt32,
                   DocumentsReturned = results.Count,
                   IndexUsed = executionStats.Contains("indexName") ? 
                       executionStats["indexName"].AsString : "No index used",
                   WinningPlan = explainResult["queryPlanner"]["winningPlan"].ToJson()
               };
           }
           
           // Compare performance with and without index
           public async Task CompareIndexPerformanceAsync()
           {
               Console.WriteLine("\n=== Index Performance Comparison ===\n");
               
               // Test query: find products by category
               var categoryFilter = Builders<Product>.Filter.Eq(p => p.Category, "Electronics");
               
               // Before index
               var beforeIndex = await AnalyzeQueryPerformanceAsync(
                   categoryFilter, 
                   "Category query (no index)"
               );
               
               // Create index
               await _products.Indexes.CreateOneAsync(
                   new CreateIndexModel<Product>(
                       Builders<Product>.IndexKeys.Ascending(p => p.Category)
                   )
               );
               
               // After index
               var afterIndex = await AnalyzeQueryPerformanceAsync(
                   categoryFilter, 
                   "Category query (with index)"
               );
               
               // Display comparison
               Console.WriteLine("BEFORE INDEX:");
               PrintAnalysisResult(beforeIndex);
               
               Console.WriteLine("\nAFTER INDEX:");
               PrintAnalysisResult(afterIndex);
               
               var improvementRatio = (double)beforeIndex.ExecutionTimeMs / afterIndex.ExecutionTimeMs;
               Console.WriteLine($"\nPerformance improvement: {improvementRatio:F2}x faster");
           }
           
           private void PrintAnalysisResult(QueryAnalysisResult result)
           {
               Console.WriteLine($"Query: {result.QueryDescription}");
               Console.WriteLine($"Execution Time: {result.ExecutionTimeMs}ms");
               Console.WriteLine($"Documents Examined: {result.DocumentsExamined}");
               Console.WriteLine($"Documents Returned: {result.DocumentsReturned}");
               Console.WriteLine($"Index Used: {result.IndexUsed}");
           }
           
           // Generate large dataset for performance testing
           public async Task GenerateLargeDatasetAsync(int count = 10000)
           {
               Console.WriteLine($"Generating {count} sample products...");
               
               var products = new List<Product>();
               var categories = new[] { "Electronics", "Books", "Clothing", "Home", "Sports" };
               var random = new Random();
               
               for (int i = 1; i <= count; i++)
               {
                   products.Add(new Product
                   {
                       Name = $"Product {i}",
                       Price = (decimal)(random.NextDouble() * 1000),
                       Category = categories[random.Next(categories.Length)],
                       InStock = random.Next(2) == 1,
                       Tags = new List<string> { "tag1", "tag2", "tag3" },
                       CreatedAt = DateTime.UtcNow.AddDays(-random.Next(365))
                   });
                   
                   if (products.Count == 1000)
                   {
                       await _products.InsertManyAsync(products);
                       products.Clear();
                       Console.WriteLine($"Inserted {i} products so far...");
                   }
               }
               
               if (products.Any())
               {
                   await _products.InsertManyAsync(products);
               }
               
               Console.WriteLine($"Dataset generation completed: {count} products created.");
           }
       }
       
       public class QueryAnalysisResult
       {
           public string QueryDescription { get; set; } = string.Empty;
           public long ExecutionTimeMs { get; set; }
           public int DocumentsExamined { get; set; }
           public int DocumentsReturned { get; set; }
           public string IndexUsed { get; set; } = string.Empty;
           public string WinningPlan { get; set; } = string.Empty;
       }
   }
   ```

#### Part C: Testing and Benchmarking (10 minutes)

3. **Create Performance Testing Program**
   ```csharp
   // Add to Program.cs
   static async Task TestPerformanceOptimization()
   {
       Console.WriteLine("\n=== Performance Optimization Tests ===\n");
       
       var mongoService = new MongoDBService(configuration);
       var indexService = new IndexManagementService(mongoService);
       var performanceService = new PerformanceAnalysisService(mongoService);
       
       // Generate large dataset
       await performanceService.GenerateLargeDatasetAsync(5000);
       
       // Test various queries and their performance
       await performanceService.CompareIndexPerformanceAsync();
       
       // Create different types of indexes
       await indexService.CreateCompoundIndexesAsync();
       await indexService.CreateTextIndexAsync();
       await indexService.CreatePartialIndexAsync();
       
       // List all created indexes
       await indexService.ListIndexesAsync();
       
       // Test complex query performance
       var complexFilter = Builders<Product>.Filter.And(
           Builders<Product>.Filter.Eq(p => p.Category, "Electronics"),
           Builders<Product>.Filter.Gte(p => p.Price, 100),
           Builders<Product>.Filter.Eq(p => p.InStock, true)
       );
       
       var complexResult = await performanceService.AnalyzeQueryPerformanceAsync(
           complexFilter, 
           "Complex compound query"
       );
       
       Console.WriteLine("\nCOMPLEX QUERY ANALYSIS:");
       Console.WriteLine($"Execution Time: {complexResult.ExecutionTimeMs}ms");
       Console.WriteLine($"Documents Examined: {complexResult.DocumentsExamined}");
       Console.WriteLine($"Documents Returned: {complexResult.DocumentsReturned}");
   }
   ```

### Deliverables
- Index management service with multiple index types
- Performance analysis tools and benchmarking results
- Large dataset performance comparison data

---

## Lab 5: Production Features - Transactions, Change Streams, and Error Handling (45 minutes)

### Learning Objectives
- Implement ACID transactions using C# MongoDB driver
- Set up change streams for real-time data monitoring
- Handle errors and implement retry logic
- Apply production-ready patterns and best practices

### Tasks

#### Part A: Transaction Implementation (20 minutes)

1. **Create Transaction Service**
   ```csharp
   // Services/TransactionService.cs
   using MongoDB.Driver;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class TransactionService
       {
           private readonly IMongoDatabase _database;
           private readonly IMongoCollection<Product> _products;
           private readonly IMongoCollection<Order> _orders;
           private readonly IMongoCollection<Customer> _customers;
           
           public TransactionService(MongoDBService mongoDBService)
           {
               _database = mongoDBService.Products.Database;
               _products = _database.GetCollection<Product>("products");
               _orders = _database.GetCollection<Order>("orders");
               _customers = _database.GetCollection<Customer>("customers");
           }
           
           // E-commerce order processing with inventory update
           public async Task<string> ProcessOrderWithTransactionAsync(string customerId, List<OrderItem> items)
           {
               using var session = await _database.Client.StartSessionAsync();
               
               try
               {
                   return await session.WithTransactionAsync(async (s, ct) =>
                   {
                       // 1. Validate customer exists
                       var customer = await _customers.Find(s, c => c.Id == customerId).FirstOrDefaultAsync(ct);
                       if (customer == null)
                           throw new InvalidOperationException("Customer not found");
                       
                       // 2. Validate and reserve inventory
                       decimal totalAmount = 0;
                       var orderId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                       
                       foreach (var item in items)
                       {
                           // Find product and check inventory
                           var filter = Builders<Product>.Filter.And(
                               Builders<Product>.Filter.Eq(p => p.Id, item.ProductId),
                               Builders<Product>.Filter.Gte(p => p.Specifications["inventory"], item.Quantity)
                           );
                           
                           var update = Builders<Product>.Update.Inc("specifications.inventory", -item.Quantity);
                           
                           var updateResult = await _products.UpdateOneAsync(s, filter, update, cancellationToken: ct);
                           
                           if (updateResult.MatchedCount == 0)
                               throw new InvalidOperationException($"Insufficient inventory for product {item.ProductId}");
                           
                           totalAmount += item.Price * item.Quantity;
                       }
                       
                       // 3. Create order
                       var order = new Order
                       {
                           Id = orderId,
                           CustomerId = customerId,
                           OrderDate = DateTime.UtcNow,
                           Items = items,
                           Total = totalAmount,
                           Status = "confirmed"
                       };
                       
                       await _orders.InsertOneAsync(s, order, cancellationToken: ct);
                       
                       Console.WriteLine($"Order {orderId} processed successfully. Total: ${totalAmount:F2}");
                       return orderId;
                   });
               }
               catch (Exception ex)
               {
                   Console.WriteLine($"Transaction failed: {ex.Message}");
                   throw;
               }
           }
           
           // Bank transfer simulation
           public async Task<bool> TransferFundsAsync(string fromAccountId, string toAccountId, decimal amount)
           {
               var accounts = _database.GetCollection<BankAccount>("accounts");
               
               using var session = await _database.Client.StartSessionAsync();
               
               try
               {
                   return await session.WithTransactionAsync(async (s, ct) =>
                   {
                       // Debit from source account
                       var debitFilter = Builders<BankAccount>.Filter.And(
                           Builders<BankAccount>.Filter.Eq(a => a.Id, fromAccountId),
                           Builders<BankAccount>.Filter.Gte(a => a.Balance, amount)
                       );
                       
                       var debitUpdate = Builders<BankAccount>.Update.Inc(a => a.Balance, -amount);
                       var debitResult = await accounts.UpdateOneAsync(s, debitFilter, debitUpdate, cancellationToken: ct);
                       
                       if (debitResult.MatchedCount == 0)
                           throw new InvalidOperationException("Insufficient funds or account not found");
                       
                       // Credit to destination account
                       var creditFilter = Builders<BankAccount>.Filter.Eq(a => a.Id, toAccountId);
                       var creditUpdate = Builders<BankAccount>.Update.Inc(a => a.Balance, amount);
                       var creditResult = await accounts.UpdateOneAsync(s, creditFilter, creditUpdate, cancellationToken: ct);
                       
                       if (creditResult.MatchedCount == 0)
                           throw new InvalidOperationException("Destination account not found");
                       
                       Console.WriteLine($"Transfer completed: ${amount:F2} from {fromAccountId} to {toAccountId}");
                       return true;
                   });
               }
               catch (Exception ex)
               {
                   Console.WriteLine($"Transfer failed: {ex.Message}");
                   return false;
               }
           }
       }
       
       public class BankAccount
       {
           [MongoDB.Bson.Serialization.Attributes.BsonId]
           [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
           public string? Id { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("accountNumber")]
           public string AccountNumber { get; set; } = string.Empty;
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("balance")]
           public decimal Balance { get; set; }
           
           [MongoDB.Bson.Serialization.Attributes.BsonElement("ownerName")]
           public string OwnerName { get; set; } = string.Empty;
       }
   }
   ```

#### Part B: Change Streams Implementation (15 minutes)

2. **Create Change Stream Service**
   ```csharp
   // Services/ChangeStreamService.cs
   using MongoDB.Driver;
   using MongoDB.Bson;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class ChangeStreamService
       {
           private readonly IMongoCollection<Product> _products;
           private readonly IMongoCollection<Order> _orders;
           private CancellationTokenSource _cancellationTokenSource = new();
           
           public ChangeStreamService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
               _orders = _products.Database.GetCollection<Order>("orders");
           }
           
           // Monitor all changes to products collection
           public async Task StartProductMonitoringAsync()
           {
               Console.WriteLine("Starting product change stream monitoring...");
               
               var options = new ChangeStreamOptions
               {
                   FullDocument = ChangeStreamFullDocumentOption.UpdateLookup
               };
               
               using var changeStream = await _products.WatchAsync(options, _cancellationTokenSource.Token);
               
               await changeStream.ForEachAsync(change =>
               {
                   Console.WriteLine($"\n=== Product Change Detected ===");
                   Console.WriteLine($"Operation: {change.OperationType}");
                   Console.WriteLine($"Document ID: {change.DocumentKey}");
                   
                   switch (change.OperationType)
                   {
                       case ChangeStreamOperationType.Insert:
                           Console.WriteLine($"New product: {change.FullDocument?.Name}");
                           break;
                       case ChangeStreamOperationType.Update:
                           Console.WriteLine($"Updated product: {change.FullDocument?.Name}");
                           if (change.UpdateDescription?.UpdatedFields != null)
                           {
                               foreach (var field in change.UpdateDescription.UpdatedFields)
                               {
                                   Console.WriteLine($"  {field.Name}: {field.Value}");
                               }
                           }
                           break;
                       case ChangeStreamOperationType.Delete:
                           Console.WriteLine("Product deleted");
                           break;
                   }
               }, _cancellationTokenSource.Token);
           }
           
           // Monitor specific types of changes (e.g., low inventory)
           public async Task StartLowInventoryMonitoringAsync()
           {
               Console.WriteLine("Starting low inventory monitoring...");
               
               var pipeline = new EmptyPipelineDefinition<ChangeStreamDocument<Product>>()
                   .Match(change => 
                       change.OperationType == ChangeStreamOperationType.Update &&
                       change.FullDocument.Specifications.ContainsKey("inventory") &&
                       change.FullDocument.Specifications["inventory"].AsInt32 < 10);
               
               using var changeStream = await _products.WatchAsync(pipeline, _cancellationTokenSource.Token);
               
               await changeStream.ForEachAsync(change =>
               {
                   var product = change.FullDocument;
                   var inventory = product.Specifications["inventory"].AsInt32;
                   
                   Console.WriteLine($"\n🚨 LOW INVENTORY ALERT 🚨");
                   Console.WriteLine($"Product: {product.Name}");
                   Console.WriteLine($"Current Inventory: {inventory}");
                   Console.WriteLine($"Action: Reorder needed!");
                   
                   // In a real application, you might:
                   // - Send email notifications
                   // - Create reorder requests
                   // - Update dashboard alerts
                   
               }, _cancellationTokenSource.Token);
           }
           
           // Monitor order creation for real-time analytics
           public async Task StartOrderAnalyticsAsync()
           {
               Console.WriteLine("Starting order analytics monitoring...");
               
               var pipeline = new EmptyPipelineDefinition<ChangeStreamDocument<Order>>()
                   .Match(change => change.OperationType == ChangeStreamOperationType.Insert);
               
               using var changeStream = await _orders.WatchAsync(pipeline, _cancellationTokenSource.Token);
               
               await changeStream.ForEachAsync(change =>
               {
                   var order = change.FullDocument;
                   
                   Console.WriteLine($"\n📊 NEW ORDER ANALYTICS 📊");
                   Console.WriteLine($"Order ID: {order.Id}");
                   Console.WriteLine($"Customer: {order.CustomerId}");
                   Console.WriteLine($"Total: ${order.Total:F2}");
                   Console.WriteLine($"Items: {order.Items.Count}");
                   
                   // Real-time analytics calculations
                   var avgItemValue = order.Total / order.Items.Count;
                   Console.WriteLine($"Average item value: ${avgItemValue:F2}");
                   
               }, _cancellationTokenSource.Token);
           }
           
           public void StopMonitoring()
           {
               _cancellationTokenSource.Cancel();
               Console.WriteLine("Change stream monitoring stopped.");
           }
       }
   }
   ```

#### Part C: Error Handling and Retry Logic (10 minutes)

3. **Create Resilient Service with Retry Logic**
   ```csharp
   // Services/ResilientMongoService.cs
   using MongoDB.Driver;
   using MongoDBLabs.Models;
   
   namespace MongoDBLabs.Services
   {
       public class ResilientMongoService
       {
           private readonly IMongoCollection<Product> _products;
           
           public ResilientMongoService(MongoDBService mongoDBService)
           {
               _products = mongoDBService.Products;
           }
           
           // Retry logic for transient failures
           public async Task<T> ExecuteWithRetryAsync<T>(
               Func<Task<T>> operation, 
               int maxRetries = 3, 
               TimeSpan? delay = null)
           {
               delay ??= TimeSpan.FromMilliseconds(500);
               
               for (int attempt = 1; attempt <= maxRetries; attempt++)
               {
                   try
                   {
                       return await operation();
                   }
                   catch (MongoException ex) when (IsTransientError(ex) && attempt < maxRetries)
                   {
                       Console.WriteLine($"Attempt {attempt} failed with transient error: {ex.Message}");
                       Console.WriteLine($"Retrying in {delay.Value.TotalMilliseconds}ms...");
                       
                       await Task.Delay(delay.Value);
                       delay = TimeSpan.FromMilliseconds(delay.Value.TotalMilliseconds * 2); // Exponential backoff
                   }
                   catch (Exception ex)
                   {
                       Console.WriteLine($"Non-transient error on attempt {attempt}: {ex.Message}");
                       throw;
                   }
               }
               
               throw new InvalidOperationException($"Operation failed after {maxRetries} attempts");
           }
           
           private bool IsTransientError(MongoException ex)
           {
               // Check for transient error conditions
               return ex is MongoConnectionException ||
                      ex is MongoTimeoutException ||
                      (ex is MongoWriteException writeEx && 
                       writeEx.WriteError?.Code == 11000); // Duplicate key error that might be transient
           }
           
           // Example resilient operations
           public async Task<Product?> GetProductWithRetryAsync(string id)
           {
               return await ExecuteWithRetryAsync(async () =>
               {
                   Console.WriteLine($"Attempting to fetch product {id}...");
                   return await _products.Find(p => p.Id == id).FirstOrDefaultAsync();
               });
           }
           
           public async Task<bool> UpdateProductWithRetryAsync(string id, decimal newPrice)
           {
               return await ExecuteWithRetryAsync(async () =>
               {
                   Console.WriteLine($"Attempting to update product {id} price to ${newPrice}...");
                   var filter = Builders<Product>.Filter.Eq(p => p.Id, id);
                   var update = Builders<Product>.Update.Set(p => p.Price, newPrice);
                   var result = await _products.UpdateOneAsync(filter, update);
                   return result.ModifiedCount > 0;
               });
           }
           
           // Bulk operation with error handling
           public async Task<BulkWriteResult<Product>> BulkUpdateWithErrorHandlingAsync(
               List<WriteModel<Product>> writes)
           {
               try
               {
                   var options = new BulkWriteOptions 
                   { 
                       IsOrdered = false, // Continue on errors
                       BypassDocumentValidation = false 
                   };
                   
                   return await _products.BulkWriteAsync(writes, options);
               }
               catch (MongoBulkWriteException ex)
               {
                   Console.WriteLine($"Bulk write completed with {ex.WriteErrors.Count} errors:");
                   
                   foreach (var error in ex.WriteErrors)
                   {
                       Console.WriteLine($"  Error at index {error.Index}: {error.Message}");
                   }
                   
                   Console.WriteLine($"Successfully processed: {ex.Result.ProcessedRequests.Count} operations");
                   return ex.Result;
               }
           }
       }
   }
   ```

4. **Integration Testing Program**
   ```csharp
   // Add to Program.cs
   static async Task TestProductionFeatures()
   {
       Console.WriteLine("\n=== Production Features Testing ===\n");
       
       var mongoService = new MongoDBService(configuration);
       var transactionService = new TransactionService(mongoService);
       var changeStreamService = new ChangeStreamService(mongoService);
       var resilientService = new ResilientMongoService(mongoService);
       
       // Test transactions
       Console.WriteLine("Testing transactions...");
       
       // Create sample accounts for transfer test
       var accounts = mongoService.Products.Database.GetCollection<BankAccount>("accounts");
       await accounts.InsertManyAsync(new[]
       {
           new BankAccount { AccountNumber = "ACC001", Balance = 1000m, OwnerName = "John Doe" },
           new BankAccount { AccountNumber = "ACC002", Balance = 500m, OwnerName = "Jane Smith" }
       });
       
       var accountsList = await accounts.Find(_ => true).ToListAsync();
       if (accountsList.Count >= 2)
       {
           await transactionService.TransferFundsAsync(
               accountsList[0].Id!, 
               accountsList[1].Id!, 
               250m
           );
       }
       
       // Test resilient operations
       Console.WriteLine("\nTesting resilient operations...");
       var products = await resilientService.GetProductWithRetryAsync("nonexistent");
       Console.WriteLine($"Resilient query result: {products?.Name ?? "Not found"}");
       
       // Start change stream monitoring (in background)
       var monitoringTask = Task.Run(async () =>
       {
           try
           {
               await changeStreamService.StartProductMonitoringAsync();
           }
           catch (OperationCanceledException)
           {
               Console.WriteLine("Change stream monitoring stopped.");
           }
       });
       
       // Create some changes to trigger change stream
       await Task.Delay(1000); // Let change stream start
       
       var testProduct = new Product
       {
           Name = "Change Stream Test Product",
           Price = 99.99m,
           Category = "Test",
           InStock = true,
           Specifications = new Dictionary<string, object> { { "inventory", 5 } }
       };
       
       var productService = new ProductService(mongoService);
       await productService.CreateProductAsync(testProduct);
       
       await Task.Delay(2000); // Let change stream process
       
       // Update the product to trigger change stream
       await productService.UpdateProductPriceAsync(testProduct.Id!, 89.99m);
       
       await Task.Delay(2000); // Let change stream process
       
       // Stop monitoring
       changeStreamService.StopMonitoring();
       
       try
       {
           await monitoringTask;
       }
       catch (OperationCanceledException)
       {
           // Expected when stopping monitoring
       }
   }
   ```

### Deliverables
- Working transaction implementation with ACID guarantees
- Change stream monitoring for real-time data changes
- Resilient service with retry logic and error handling
- Integration test demonstrating all production features

## Summary

These updated Day 2 labs provide:

1. **C# MongoDB Driver mastery** with proper async/await patterns
2. **Docker integration** for consistent development environment
3. **Production-ready patterns** including transactions and change streams
4. **Performance optimization** with indexing and analysis tools
5. **Error handling and resilience** for production applications

Each lab builds upon the previous one, creating a comprehensive C# MongoDB development experience using Visual Studio Code and Docker.