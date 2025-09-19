# Lab 5: C# MongoDB API Integration
**Duration:** 30 minutes
**Objective:** Integrate MongoDB with C# applications

## Part A: Project Setup (10 minutes)

### Step 1: Create C# Console Application
```bash
# Create project directory
mkdir MongoDBCSharpLab
cd MongoDBCSharpLab

# Create new console application
dotnet new console

# Add MongoDB driver
dotnet add package MongoDB.Driver
```

### Step 2: Create Models

**Create Models/Product.cs:**
```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MongoDBCSharpLab.Models
{
    public class Product
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("price")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Price { get; set; }

        [BsonElement("category")]
        public string Category { get; set; } = string.Empty;

        [BsonElement("stock")]
        public int Stock { get; set; }

        [BsonElement("description")]
        public string Description { get; set; } = string.Empty;

        [BsonElement("tags")]
        public List<string> Tags { get; set; } = new();

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }
}
```

**Create Models/Customer.cs:**
```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MongoDBCSharpLab.Models
{
    public class Customer
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("phone")]
        public string Phone { get; set; } = string.Empty;

        [BsonElement("address")]
        public Address Address { get; set; } = new();

        [BsonElement("registrationDate")]
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

        [BsonElement("balance")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Balance { get; set; }

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }

    public class Address
    {
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
    }
}
```

### Step 3: Create Database Service

**Create Services/MongoDBService.cs:**
```csharp
using MongoDB.Driver;
using MongoDBCSharpLab.Models;

namespace MongoDBCSharpLab.Services
{
    public class MongoDBService
    {
        private readonly IMongoDatabase _database;

        public MongoDBService(string connectionString, string databaseName)
        {
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<Product> Products =>
            _database.GetCollection<Product>("products");

        public IMongoCollection<Customer> Customers =>
            _database.GetCollection<Customer>("customers");
    }
}
```

## Part B: CRUD Operations (15 minutes)

### Step 4: Implement Product Service

**Create Services/ProductService.cs:**
```csharp
using MongoDB.Driver;
using MongoDBCSharpLab.Models;

namespace MongoDBCSharpLab.Services
{
    public class ProductService
    {
        private readonly IMongoCollection<Product> _products;

        public ProductService(MongoDBService mongoDBService)
        {
            _products = mongoDBService.Products;
        }

        // Create operations
        public async Task<Product> CreateProductAsync(Product product)
        {
            await _products.InsertOneAsync(product);
            return product;
        }

        public async Task CreateProductsAsync(IEnumerable<Product> products)
        {
            await _products.InsertManyAsync(products);
        }

        // Read operations
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

        public async Task<List<Product>> GetProductsByPriceRangeAsync(decimal minPrice, decimal maxPrice)
        {
            var filter = Builders<Product>.Filter.And(
                Builders<Product>.Filter.Gte(p => p.Price, minPrice),
                Builders<Product>.Filter.Lte(p => p.Price, maxPrice)
            );
            return await _products.Find(filter).ToListAsync();
        }

        public async Task<List<Product>> SearchProductsAsync(string searchTerm)
        {
            var filter = Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Regex(p => p.Name,
                    new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
                Builders<Product>.Filter.Regex(p => p.Description,
                    new MongoDB.Bson.BsonRegularExpression(searchTerm, "i"))
            );
            return await _products.Find(filter).ToListAsync();
        }

        // Update operations
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

        public async Task<bool> UpdateStockAsync(string id, int newStock)
        {
            var filter = Builders<Product>.Filter.Eq(p => p.Id, id);
            var update = Builders<Product>.Update.Set(p => p.Stock, newStock);
            var result = await _products.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        // Delete operations
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

        // Aggregation operations
        public async Task<List<object>> GetProductStatsByCategoryAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$group", new BsonDocument
                {
                    ["_id"] = "$category",
                    ["count"] = new BsonDocument("$sum", 1),
                    ["avgPrice"] = new BsonDocument("$avg", "$price"),
                    ["totalStock"] = new BsonDocument("$sum", "$stock")
                }),
                new BsonDocument("$sort", new BsonDocument("count", -1))
            };

            return await _products.Aggregate<object>(pipeline).ToListAsync();
        }
    }
}
```

### Step 5: Main Program Implementation

**Update Program.cs:**
```csharp
using MongoDBCSharpLab.Models;
using MongoDBCSharpLab.Services;

class Program
{
    // Connection to replica set from Lab 1
    private static readonly string ConnectionString =
        "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0";
    private static readonly string DatabaseName = "ecommerce_csharp";

    static async Task Main(string[] args)
    {
        Console.WriteLine("MongoDB C# Driver Lab");
        Console.WriteLine("====================\n");

        try
        {
            // Initialize services
            var mongoService = new MongoDBService(ConnectionString, DatabaseName);
            var productService = new ProductService(mongoService);

            // Run CRUD operations
            await TestCRUDOperations(productService);

            // Run aggregation operations
            await TestAggregationOperations(productService);

        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }

        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }

    static async Task TestCRUDOperations(ProductService productService)
    {
        Console.WriteLine("=== CRUD Operations Test ===\n");

        // Create sample products
        var products = new List<Product>
        {
            new Product
            {
                Name = "Wireless Headphones",
                Price = 89.99m,
                Category = "Electronics",
                Stock = 50,
                Description = "High-quality wireless headphones with noise cancellation",
                Tags = new List<string> { "wireless", "audio", "bluetooth" }
            },
            new Product
            {
                Name = "Gaming Mouse",
                Price = 45.99m,
                Category = "Electronics",
                Stock = 25,
                Description = "Precision gaming mouse with RGB lighting",
                Tags = new List<string> { "gaming", "mouse", "rgb" }
            },
            new Product
            {
                Name = "Coffee Mug",
                Price = 12.99m,
                Category = "Home",
                Stock = 100,
                Description = "Ceramic coffee mug with heat retention",
                Tags = new List<string> { "coffee", "ceramic", "kitchen" }
            },
            new Product
            {
                Name = "Smartphone",
                Price = 699.99m,
                Category = "Electronics",
                Stock = 30,
                Description = "Latest smartphone with advanced camera",
                Tags = new List<string> { "mobile", "camera", "5g" }
            }
        };

        // INSERT
        Console.WriteLine("Creating products...");
        await productService.CreateProductsAsync(products);
        Console.WriteLine($"✅ Created {products.Count} products\n");

        // READ
        Console.WriteLine("Reading all products:");
        var allProducts = await productService.GetAllProductsAsync();
        foreach (var product in allProducts)
        {
            Console.WriteLine($"- {product.Name}: ${product.Price} (Stock: {product.Stock})");
        }
        Console.WriteLine();

        // SEARCH
        Console.WriteLine("Searching for 'gaming' products:");
        var gamingProducts = await productService.SearchProductsAsync("gaming");
        foreach (var product in gamingProducts)
        {
            Console.WriteLine($"- {product.Name}: {product.Description}");
        }
        Console.WriteLine();

        // CATEGORY FILTER
        Console.WriteLine("Electronics products:");
        var electronicsProducts = await productService.GetProductsByCategoryAsync("Electronics");
        foreach (var product in electronicsProducts)
        {
            Console.WriteLine($"- {product.Name}: ${product.Price}");
        }
        Console.WriteLine();

        // UPDATE
        if (allProducts.Any())
        {
            var firstProduct = allProducts.First();
            Console.WriteLine($"Updating price of {firstProduct.Name}...");
            await productService.UpdateProductPriceAsync(firstProduct.Id!, 99.99m);

            var updatedProduct = await productService.GetProductByIdAsync(firstProduct.Id!);
            Console.WriteLine($"✅ New price: ${updatedProduct?.Price}\n");
        }

        // PRICE RANGE QUERY
        Console.WriteLine("Products between $40 and $100:");
        var priceRangeProducts = await productService.GetProductsByPriceRangeAsync(40m, 100m);
        foreach (var product in priceRangeProducts)
        {
            Console.WriteLine($"- {product.Name}: ${product.Price}");
        }
        Console.WriteLine();

        // STOCK UPDATE
        if (allProducts.Any())
        {
            var product = allProducts.Last();
            Console.WriteLine($"Updating stock for {product.Name}...");
            await productService.UpdateStockAsync(product.Id!, 5);
            Console.WriteLine("✅ Stock updated to 5\n");
        }
    }

    static async Task TestAggregationOperations(ProductService productService)
    {
        Console.WriteLine("=== Aggregation Operations Test ===\n");

        // Category statistics
        Console.WriteLine("Product statistics by category:");
        var categoryStats = await productService.GetProductStatsByCategoryAsync();
        foreach (var stat in categoryStats)
        {
            Console.WriteLine($"- {stat}");
        }
        Console.WriteLine();
    }
}
```

## Part C: Error Handling and Resilience (5 minutes)

### Step 6: Enhanced Error Handling

**Create Services/ResilientProductService.cs:**
```csharp
using MongoDB.Driver;
using MongoDBCSharpLab.Models;

namespace MongoDBCSharpLab.Services
{
    public class ResilientProductService
    {
        private readonly ProductService _productService;

        public ResilientProductService(ProductService productService)
        {
            _productService = productService;
        }

        public async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, int maxRetries = 3)
        {
            Exception? lastException = null;

            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    return await operation();
                }
                catch (MongoException ex) when (IsTransientError(ex) && attempt < maxRetries)
                {
                    lastException = ex;
                    var delay = TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 1000); // Exponential backoff
                    Console.WriteLine($"⚠️ Attempt {attempt} failed. Retrying in {delay.TotalSeconds} seconds...");
                    await Task.Delay(delay);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Non-transient error: {ex.Message}");
                    throw;
                }
            }

            throw lastException!;
        }

        private static bool IsTransientError(MongoException ex)
        {
            return ex is MongoConnectionException ||
                   ex is MongoTimeoutException ||
                   (ex is MongoWriteException writeEx && IsTransientWriteError(writeEx));
        }

        private static bool IsTransientWriteError(MongoWriteException ex)
        {
            // Check for specific transient write error codes
            return ex.WriteError?.Code == 11000 || // Duplicate key (might be transient)
                   ex.WriteError?.Code == 16500;    // Shard config stale
        }

        // Example of resilient operation
        public async Task<Product?> GetProductByIdWithRetryAsync(string id)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                Console.WriteLine($"Attempting to fetch product {id}...");
                return await _productService.GetProductByIdAsync(id);
            });
        }

        // Test resilience
        public async Task TestResilienceAsync()
        {
            Console.WriteLine("=== Testing Resilient Operations ===\n");

            try
            {
                // This demonstrates retry logic
                var products = await ExecuteWithRetryAsync(async () =>
                {
                    Console.WriteLine("Fetching all products with retry logic...");
                    return await _productService.GetAllProductsAsync();
                });

                Console.WriteLine($"✅ Successfully fetched {products.Count} products");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Operation failed after retries: {ex.Message}");
            }
        }
    }
}
```

### Step 7: Run the Application

```bash
# Build and run the application
dotnet build
dotnet run
```

### Step 8: Verify in Compass

1. Connect Compass to the C# database: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
2. Navigate to `ecommerce_csharp` database
3. Verify the `products` collection contains data created by C# application
4. View the documents and their structure

## Lab 5 Deliverables
✅ **C# MongoDB integration** with strongly-typed models
✅ **Complete CRUD operations** implementation
✅ **Error handling and resilience** patterns
✅ **Connection to replica set** from C# application