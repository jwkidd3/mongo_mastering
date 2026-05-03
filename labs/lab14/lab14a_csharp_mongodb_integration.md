# Lab 14A: C# MongoDB Integration for Insurance Management
**Duration:** 45 minutes
**Objective:** Integrate MongoDB with C# applications for insurance management system

## Prerequisites: MongoDB Environment Setup

**⚠️ Only run if MongoDB environment is not already running**

From the project root directory, use the course's standardized setup scripts:

**macOS/Linux:**
```bash
./scripts/setup.sh
```

**Windows PowerShell:**
```powershell
.\scripts\setup.ps1
```

To check if MongoDB is already running:
```bash
mongosh --eval "db.runCommand('ping')"
```

## Prerequisites: Load Course Data

Before starting this lab, ensure the MongoDB environment is running and course data is loaded:

> **New to MongoDB tooling?** See [Lab 1 — Choose Your Tool](../lab01_mongodb_shell_mastery.md#choose-your-tool-mongodb-compass-or-mongosh-cli) for the Compass UI alternative (no shell-redirection issues, works the same on every OS).

```bash
# From the project root
mongosh "mongodb://localhost:27017/?directConnection=true" < data/comprehensive_data_loader.js
```

> **Windows (PowerShell):** PowerShell does not forward `<` into `mongosh` — the command will error. Use `--file` instead:
> ```powershell
> mongosh "mongodb://localhost:27017/?directConnection=true" --file data/comprehensive_data_loader.js
> ```

Verify the data loaded successfully:

```bash
mongosh "mongodb://localhost:27017/insurance_company?directConnection=true" --eval "db.policies.countDocuments()"
```

> **Note:** This lab will create and use its own separate database (`insurance_company_csharp`) for the C# integration exercises. The comprehensive loader is still required to populate the shared course data used by other labs.

## Part A: Project Setup (5 minutes)

### Step 1: Get the Starter Code

The starter code is in `labs/lab14/lab14a-csharp-starter/`. Copy it to your working directory and verify it builds:

```bash
cp -r labs/lab14/lab14a-csharp-starter ~/lab14a-mywork
cd ~/lab14a-mywork
dotnet build
```

The build should succeed with no warnings — the project already has:

- `MongoDBPolicyService.csproj` referencing `MongoDB.Driver` 2.x
- `appsettings.json` with the connection string (override via env vars `MongoDB__ConnectionString` / `MongoDB__DatabaseName` if needed)
- `Services/MongoDBService.cs` with the `MongoClient` setup and typed collection helpers (don't modify)
- `Program.cs` that loads config, constructs services, and runs cleanly
- Skeleton `Models/Policy.cs`, `Models/Customer.cs`, and `Services/PolicyService.cs` files with `TODO` comments where you fill in the details

Open the project in VS Code (`code .`). The C# extension will pick up the project automatically.

### Step 2: Fill in the Models

Open `Models/Policy.cs` and add the `[BsonElement]` properties below to the existing class skeleton (the `[BsonId]` Id property is already there):
```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InsuranceManagementSystem.Models
{
    public class Policy
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("policyNumber")]
        public string PolicyNumber { get; set; } = string.Empty;

        [BsonElement("customerId")]
        public string CustomerId { get; set; } = string.Empty;

        [BsonElement("policyType")]
        public string PolicyType { get; set; } = string.Empty; // Auto, Property, Life, Commercial, Cyber, Health

        [BsonElement("region")]
        public string Region { get; set; } = string.Empty;

        [BsonElement("state")]
        public string State { get; set; } = string.Empty;

        [BsonElement("coverageLimit")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CoverageLimit { get; set; }

        [BsonElement("premium")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Premium { get; set; }

        [BsonElement("deductible")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Deductible { get; set; }

        [BsonElement("effectiveDate")]
        public DateTime EffectiveDate { get; set; }

        [BsonElement("expirationDate")]
        public DateTime ExpirationDate { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "Active"; // Active, Pending, Cancelled, Expired

        [BsonElement("claimsCount")]
        public int ClaimsCount { get; set; } = 0;

        [BsonElement("totalClaimsPaid")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalClaimsPaid { get; set; } = 0m;

        [BsonElement("lastClaimDate")]
        public DateTime? LastClaimDate { get; set; }

        [BsonElement("agentId")]
        public string? AgentId { get; set; }
    }
}
```

Open `Models/Customer.cs` and replace the skeleton with:
```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InsuranceManagementSystem.Models
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

        [BsonElement("type")]
        public string Type { get; set; } = string.Empty; // Individual, Business

        [BsonElement("state")]
        public string State { get; set; } = string.Empty;

        [BsonElement("address")]
        public Address Address { get; set; } = new();

        [BsonElement("registrationDate")]
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

        [BsonElement("accountBalance")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AccountBalance { get; set; }

        [BsonElement("totalPremiumsPaid")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalPremiumsPaid { get; set; } = 0m;

        [BsonElement("totalClaimsSettled")]
        public int TotalClaimsSettled { get; set; } = 0;

        [BsonElement("totalClaimPayouts")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalClaimPayouts { get; set; } = 0m;

        [BsonElement("creditScore")]
        public int? CreditScore { get; set; } // For individuals

        [BsonElement("businessSize")]
        public int? BusinessSize { get; set; } // For businesses

        [BsonElement("riskLevel")]
        public string RiskLevel { get; set; } = "Low"; // Low, Medium, High

        [BsonElement("lastRiskAssessment")]
        public DateTime? LastRiskAssessment { get; set; }

        [BsonElement("lastClaimDate")]
        public DateTime? LastClaimDate { get; set; }

        [BsonElement("lastPaymentDate")]
        public DateTime? LastPaymentDate { get; set; }

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
        public string Country { get; set; } = "USA";
    }
}
```

Create a new file `Models/Claim.cs` (this one isn't in the starter):
```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InsuranceManagementSystem.Models
{
    public class Claim
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("claimNumber")]
        public string ClaimNumber { get; set; } = string.Empty;

        [BsonElement("customerId")]
        public string CustomerId { get; set; } = string.Empty;

        [BsonElement("policyNumber")]
        public string PolicyNumber { get; set; } = string.Empty;

        [BsonElement("claimType")]
        public string ClaimType { get; set; } = string.Empty;

        [BsonElement("state")]
        public string State { get; set; } = string.Empty;

        [BsonElement("incidentDate")]
        public DateTime IncidentDate { get; set; }

        [BsonElement("filedDate")]
        public DateTime FiledDate { get; set; } = DateTime.UtcNow;

        [BsonElement("claimAmount")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ClaimAmount { get; set; }

        [BsonElement("settlementAmount")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal? SettlementAmount { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "submitted";

        [BsonElement("description")]
        public string Description { get; set; } = string.Empty;

        [BsonElement("adjusterId")]
        public string? AdjusterId { get; set; }

        [BsonElement("investigationNotes")]
        public string? InvestigationNotes { get; set; }

        [BsonElement("approvedBy")]
        public string? ApprovedBy { get; set; }

        [BsonElement("approvalDate")]
        public DateTime? ApprovalDate { get; set; }

        [BsonElement("settlementDate")]
        public DateTime? SettlementDate { get; set; }

        [BsonElement("denialReason")]
        public string? DenialReason { get; set; }
    }
}
```

### Step 3: Database Service (already provided)

`Services/MongoDBService.cs` is already in the starter and exposes typed `IMongoCollection<T>` for `Policies` and `Customers`. For reference, here's what it contains — and you'll need to add a `Claims` collection accessor:
```csharp
using MongoDB.Driver;
using InsuranceManagementSystem.Models;

namespace InsuranceManagementSystem.Services
{
    public class MongoDBService
    {
        private readonly IMongoDatabase _database;

        public MongoDBService(string connectionString, string databaseName)
        {
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<Policy> Policies =>
            _database.GetCollection<Policy>("policies");

        public IMongoCollection<Customer> Customers =>
            _database.GetCollection<Customer>("customers");

        public IMongoCollection<Claim> Claims =>
            _database.GetCollection<Claim>("claims");
    }
}
```

## Part B: CRUD Operations (15 minutes)

### Step 4: Implement Policy Service

Open `Services/PolicyService.cs` (already in the starter with stubbed methods) and replace the stubs with these implementations:
```csharp
using MongoDB.Driver;
using MongoDB.Bson;
using InsuranceManagementSystem.Models;

namespace InsuranceManagementSystem.Services
{
    public class PolicyService
    {
        private readonly IMongoCollection<Policy> _policies;

        public PolicyService(MongoDBService mongoDBService)
        {
            _policies = mongoDBService.Policies;
        }

        // Create operations
        public async Task<Policy> CreatePolicyAsync(Policy policy)
        {
            await _policies.InsertOneAsync(policy);
            return policy;
        }

        public async Task CreatePoliciesAsync(IEnumerable<Policy> policies)
        {
            await _policies.InsertManyAsync(policies);
        }

        // Read operations
        public async Task<List<Policy>> GetAllPoliciesAsync()
        {
            return await _policies.Find(_ => true).ToListAsync();
        }

        public async Task<Policy?> GetPolicyByIdAsync(string id)
        {
            return await _policies.Find(p => p.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Policy?> GetPolicyByNumberAsync(string policyNumber)
        {
            return await _policies.Find(p => p.PolicyNumber == policyNumber).FirstOrDefaultAsync();
        }

        public async Task<List<Policy>> GetPoliciesByCustomerAsync(string customerId)
        {
            return await _policies.Find(p => p.CustomerId == customerId).ToListAsync();
        }

        public async Task<List<Policy>> GetPoliciesByTypeAsync(string policyType)
        {
            return await _policies.Find(p => p.PolicyType == policyType).ToListAsync();
        }

        public async Task<List<Policy>> GetPoliciesByStateAsync(string state)
        {
            return await _policies.Find(p => p.State == state).ToListAsync();
        }

        public async Task<List<Policy>> GetPoliciesByRegionAsync(string region)
        {
            return await _policies.Find(p => p.Region == region).ToListAsync();
        }

        public async Task<List<Policy>> GetActivePoliciesAsync()
        {
            return await _policies.Find(p => p.Status == "Active").ToListAsync();
        }

        public async Task<List<Policy>> GetExpiringPoliciesAsync(int daysFromNow = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(daysFromNow);
            var filter = Builders<Policy>.Filter.And(
                Builders<Policy>.Filter.Eq(p => p.Status, "Active"),
                Builders<Policy>.Filter.Lte(p => p.ExpirationDate, cutoffDate)
            );
            return await _policies.Find(filter).ToListAsync();
        }

        public async Task<List<Policy>> GetPoliciesByCoverageLimitRangeAsync(decimal minLimit, decimal maxLimit)
        {
            var filter = Builders<Policy>.Filter.And(
                Builders<Policy>.Filter.Gte(p => p.CoverageLimit, minLimit),
                Builders<Policy>.Filter.Lte(p => p.CoverageLimit, maxLimit)
            );
            return await _policies.Find(filter).ToListAsync();
        }

        // Update operations
        public async Task<bool> UpdatePolicyAsync(string id, Policy policy)
        {
            var result = await _policies.ReplaceOneAsync(p => p.Id == id, policy);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdatePolicyPremiumAsync(string id, decimal newPremium)
        {
            var filter = Builders<Policy>.Filter.Eq(p => p.Id, id);
            var update = Builders<Policy>.Update.Set(p => p.Premium, newPremium);
            var result = await _policies.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdatePolicyStatusAsync(string id, string newStatus)
        {
            var filter = Builders<Policy>.Filter.Eq(p => p.Id, id);
            var update = Builders<Policy>.Update.Set(p => p.Status, newStatus);
            var result = await _policies.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdatePolicyClaimsAsync(string id, decimal claimAmount)
        {
            var filter = Builders<Policy>.Filter.Eq(p => p.Id, id);
            var update = Builders<Policy>.Update
                .Inc(p => p.ClaimsCount, 1)
                .Inc(p => p.TotalClaimsPaid, claimAmount)
                .Set(p => p.LastClaimDate, DateTime.UtcNow);
            var result = await _policies.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> RenewPolicyAsync(string id, DateTime newExpirationDate)
        {
            var filter = Builders<Policy>.Filter.Eq(p => p.Id, id);
            var update = Builders<Policy>.Update
                .Set(p => p.ExpirationDate, newExpirationDate)
                .Set(p => p.Status, "Active");
            var result = await _policies.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        // Delete operations
        public async Task<bool> DeletePolicyAsync(string id)
        {
            var result = await _policies.DeleteOneAsync(p => p.Id == id);
            return result.DeletedCount > 0;
        }

        public async Task<long> CancelPoliciesByCustomerAsync(string customerId)
        {
            var filter = Builders<Policy>.Filter.Eq(p => p.CustomerId, customerId);
            var update = Builders<Policy>.Update.Set(p => p.Status, "Cancelled");
            var result = await _policies.UpdateManyAsync(filter, update);
            return result.ModifiedCount;
        }

        // Aggregation operations
        public async Task<List<object>> GetPolicyStatsByTypeAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$group", new BsonDocument
                {
                    ["_id"] = "$policyType",
                    ["count"] = new BsonDocument("$sum", 1),
                    ["avgPremium"] = new BsonDocument("$avg", "$premium"),
                    ["avgCoverageLimit"] = new BsonDocument("$avg", "$coverageLimit"),
                    ["totalClaims"] = new BsonDocument("$sum", "$claimsCount"),
                    ["totalClaimsPaid"] = new BsonDocument("$sum", "$totalClaimsPaid")
                }),
                new BsonDocument("$sort", new BsonDocument("count", -1))
            };

            return await _policies.Aggregate<object>(pipeline).ToListAsync();
        }

        public async Task<List<object>> GetPolicyStatsByRegionAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$group", new BsonDocument
                {
                    ["_id"] = "$region",
                    ["count"] = new BsonDocument("$sum", 1),
                    ["avgPremium"] = new BsonDocument("$avg", "$premium"),
                    ["totalCoverage"] = new BsonDocument("$sum", "$coverageLimit")
                }),
                new BsonDocument("$sort", new BsonDocument("count", -1))
            };

            return await _policies.Aggregate<object>(pipeline).ToListAsync();
        }

        public async Task<List<object>> GetHighRiskPoliciesAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$match", new BsonDocument
                {
                    ["claimsCount"] = new BsonDocument("$gte", 2),
                    ["status"] = "Active"
                }),
                new BsonDocument("$sort", new BsonDocument("claimsCount", -1))
            };

            return await _policies.Aggregate<object>(pipeline).ToListAsync();
        }
    }
}
```

Create a new file `Services/ClaimService.cs` (not in the starter):
```csharp
using MongoDB.Driver;
using MongoDB.Bson;
using InsuranceManagementSystem.Models;

namespace InsuranceManagementSystem.Services
{
    public class ClaimService
    {
        private readonly IMongoCollection<Claim> _claims;

        public ClaimService(MongoDBService mongoDBService)
        {
            _claims = mongoDBService.Claims;
        }

        // Create operations
        public async Task<Claim> CreateClaimAsync(Claim claim)
        {
            await _claims.InsertOneAsync(claim);
            return claim;
        }

        // Read operations
        public async Task<List<Claim>> GetAllClaimsAsync()
        {
            return await _claims.Find(_ => true).ToListAsync();
        }

        public async Task<Claim?> GetClaimByIdAsync(string id)
        {
            return await _claims.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Claim?> GetClaimByNumberAsync(string claimNumber)
        {
            return await _claims.Find(c => c.ClaimNumber == claimNumber).FirstOrDefaultAsync();
        }

        public async Task<List<Claim>> GetClaimsByCustomerAsync(string customerId)
        {
            return await _claims.Find(c => c.CustomerId == customerId).ToListAsync();
        }

        public async Task<List<Claim>> GetClaimsByPolicyAsync(string policyNumber)
        {
            return await _claims.Find(c => c.PolicyNumber == policyNumber).ToListAsync();
        }

        public async Task<List<Claim>> GetClaimsByStatusAsync(string status)
        {
            return await _claims.Find(c => c.Status == status).ToListAsync();
        }

        public async Task<List<Claim>> GetClaimsByStateAsync(string state)
        {
            return await _claims.Find(c => c.State == state).ToListAsync();
        }

        public async Task<List<Claim>> GetOpenClaimsAsync()
        {
            var openStatuses = new[] { "submitted", "under_review", "investigating" };
            var filter = Builders<Claim>.Filter.In(c => c.Status, openStatuses);
            return await _claims.Find(filter).ToListAsync();
        }

        public async Task<List<Claim>> GetClaimsByAmountRangeAsync(decimal minAmount, decimal maxAmount)
        {
            var filter = Builders<Claim>.Filter.And(
                Builders<Claim>.Filter.Gte(c => c.ClaimAmount, minAmount),
                Builders<Claim>.Filter.Lte(c => c.ClaimAmount, maxAmount)
            );
            return await _claims.Find(filter).ToListAsync();
        }

        // Update operations
        public async Task<bool> UpdateClaimStatusAsync(string id, string newStatus)
        {
            var filter = Builders<Claim>.Filter.Eq(c => c.Id, id);
            var update = Builders<Claim>.Update.Set(c => c.Status, newStatus);
            var result = await _claims.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> AssignAdjusterAsync(string id, string adjusterId)
        {
            var filter = Builders<Claim>.Filter.Eq(c => c.Id, id);
            var update = Builders<Claim>.Update
                .Set(c => c.AdjusterId, adjusterId)
                .Set(c => c.Status, "under_review");
            var result = await _claims.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ApproveClaim(string id, decimal settlementAmount, string approvedBy)
        {
            var filter = Builders<Claim>.Filter.Eq(c => c.Id, id);
            var update = Builders<Claim>.Update
                .Set(c => c.Status, "approved")
                .Set(c => c.SettlementAmount, settlementAmount)
                .Set(c => c.ApprovedBy, approvedBy)
                .Set(c => c.ApprovalDate, DateTime.UtcNow);
            var result = await _claims.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DenyClaimAsync(string id, string denialReason)
        {
            var filter = Builders<Claim>.Filter.Eq(c => c.Id, id);
            var update = Builders<Claim>.Update
                .Set(c => c.Status, "denied")
                .Set(c => c.DenialReason, denialReason);
            var result = await _claims.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        // Aggregation operations
        public async Task<List<object>> GetClaimStatsByStatusAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$group", new BsonDocument
                {
                    ["_id"] = "$status",
                    ["count"] = new BsonDocument("$sum", 1),
                    ["avgAmount"] = new BsonDocument("$avg", "$claimAmount"),
                    ["totalAmount"] = new BsonDocument("$sum", "$claimAmount")
                }),
                new BsonDocument("$sort", new BsonDocument("count", -1))
            };

            return await _claims.Aggregate<object>(pipeline).ToListAsync();
        }

        public async Task<List<object>> GetClaimStatsByTypeAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$group", new BsonDocument
                {
                    ["_id"] = "$claimType",
                    ["count"] = new BsonDocument("$sum", 1),
                    ["avgAmount"] = new BsonDocument("$avg", "$claimAmount"),
                    ["avgSettlement"] = new BsonDocument("$avg", "$settlementAmount")
                }),
                new BsonDocument("$sort", new BsonDocument("count", -1))
            };

            return await _claims.Aggregate<object>(pipeline).ToListAsync();
        }
    }
}
```

### Step 5: Main Program Implementation

The starter's `Program.cs` already handles config loading and service construction. Replace its body with the full implementation below to exercise CRUD + aggregation:
```csharp
using InsuranceManagementSystem.Models;
using InsuranceManagementSystem.Services;

class Program
{
    // Connection to replica set from Lab 1
    private static readonly string ConnectionString =
        "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0";
    private static readonly string DatabaseName = "insurance_company_csharp";

    static async Task Main(string[] args)
    {
        Console.WriteLine("Insurance Management System - MongoDB C# Driver");
        Console.WriteLine("=============================================\n");

        try
        {
            // Initialize services
            var mongoService = new MongoDBService(ConnectionString, DatabaseName);
            var policyService = new PolicyService(mongoService);
            var claimService = new ClaimService(mongoService);

            // Run insurance CRUD operations
            await TestInsuranceCRUDOperations(policyService, claimService);

            // Run insurance aggregation operations
            await TestInsuranceAggregationOperations(policyService, claimService);

        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }

        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }

    static async Task TestInsuranceCRUDOperations(PolicyService policyService, ClaimService claimService)
    {
        Console.WriteLine("=== Insurance CRUD Operations Test ===\n");

        // Create sample policies
        var policies = new List<Policy>
        {
            new Policy
            {
                PolicyNumber = "AUTO-CS-001",
                CustomerId = "cust_001",
                PolicyType = "Auto",
                Region = "Southeast",
                State = "FL",
                CoverageLimit = 100000m,
                Premium = 1200m,
                Deductible = 1000m,
                EffectiveDate = DateTime.UtcNow,
                ExpirationDate = DateTime.UtcNow.AddYears(1),
                AgentId = "agent_001"
            },
            new Policy
            {
                PolicyNumber = "PROP-CS-002",
                CustomerId = "cust_002",
                PolicyType = "Property",
                Region = "Northeast",
                State = "NY",
                CoverageLimit = 500000m,
                Premium = 2400m,
                Deductible = 2500m,
                EffectiveDate = DateTime.UtcNow,
                ExpirationDate = DateTime.UtcNow.AddYears(1),
                AgentId = "agent_002"
            },
            new Policy
            {
                PolicyNumber = "LIFE-CS-003",
                CustomerId = "cust_003",
                PolicyType = "Life",
                Region = "West",
                State = "CA",
                CoverageLimit = 250000m,
                Premium = 800m,
                Deductible = 0m,
                EffectiveDate = DateTime.UtcNow,
                ExpirationDate = DateTime.UtcNow.AddYears(5),
                AgentId = "agent_003"
            },
            new Policy
            {
                PolicyNumber = "COMM-CS-004",
                CustomerId = "cust_004",
                PolicyType = "Commercial",
                Region = "Midwest",
                State = "IL",
                CoverageLimit = 1000000m,
                Premium = 5000m,
                Deductible = 5000m,
                EffectiveDate = DateTime.UtcNow,
                ExpirationDate = DateTime.UtcNow.AddYears(1),
                AgentId = "agent_001"
            }
        };

        // INSERT POLICIES
        Console.WriteLine("Creating insurance policies...");
        await policyService.CreatePoliciesAsync(policies);
        Console.WriteLine($"✅ Created {policies.Count} policies\n");

        // READ ALL POLICIES
        Console.WriteLine("Reading all policies:");
        var allPolicies = await policyService.GetAllPoliciesAsync();
        foreach (var policy in allPolicies)
        {
            Console.WriteLine($"- {policy.PolicyNumber}: {policy.PolicyType} | Premium: ${policy.Premium} | Coverage: ${policy.CoverageLimit:N0}");
        }
        Console.WriteLine();

        // FILTER BY TYPE
        Console.WriteLine("Auto insurance policies:");
        var autoPolicies = await policyService.GetPoliciesByTypeAsync("Auto");
        foreach (var policy in autoPolicies)
        {
            Console.WriteLine($"- {policy.PolicyNumber}: State: {policy.State} | Premium: ${policy.Premium}");
        }
        Console.WriteLine();

        // FILTER BY REGION
        Console.WriteLine("Southeast region policies:");
        var southeastPolicies = await policyService.GetPoliciesByRegionAsync("Southeast");
        foreach (var policy in southeastPolicies)
        {
            Console.WriteLine($"- {policy.PolicyNumber}: {policy.PolicyType} in {policy.State}");
        }
        Console.WriteLine();

        // UPDATE PREMIUM
        if (allPolicies.Any())
        {
            var firstPolicy = allPolicies.First();
            Console.WriteLine($"Updating premium for {firstPolicy.PolicyNumber}...");
            await policyService.UpdatePolicyPremiumAsync(firstPolicy.Id!, 1350m);

            var updatedPolicy = await policyService.GetPolicyByIdAsync(firstPolicy.Id!);
            Console.WriteLine($"✅ New premium: ${updatedPolicy?.Premium}\n");
        }

        // COVERAGE LIMIT RANGE QUERY
        Console.WriteLine("Policies with coverage between $200K and $600K:");
        var midRangePolicies = await policyService.GetPoliciesByCoverageLimitRangeAsync(200000m, 600000m);
        foreach (var policy in midRangePolicies)
        {
            Console.WriteLine($"- {policy.PolicyNumber}: {policy.PolicyType} | Coverage: ${policy.CoverageLimit:N0}");
        }
        Console.WriteLine();

        // CREATE SAMPLE CLAIMS
        var claims = new List<Claim>
        {
            new Claim
            {
                ClaimNumber = "CLM-2024-CS-001",
                CustomerId = "cust_001",
                PolicyNumber = allPolicies.First().PolicyNumber,
                ClaimType = "Auto Accident",
                State = "FL",
                IncidentDate = DateTime.UtcNow.AddDays(-10),
                ClaimAmount = 8500m,
                Description = "Rear-end collision on I-95"
            },
            new Claim
            {
                ClaimNumber = "CLM-2024-CS-002",
                CustomerId = "cust_002",
                PolicyNumber = allPolicies.Skip(1).First().PolicyNumber,
                ClaimType = "Property Damage",
                State = "NY",
                IncidentDate = DateTime.UtcNow.AddDays(-5),
                ClaimAmount = 25000m,
                Description = "Kitchen fire damage"
            }
        };

        // INSERT CLAIMS
        Console.WriteLine("Filing insurance claims...");
        foreach (var claim in claims)
        {
            await claimService.CreateClaimAsync(claim);
        }
        Console.WriteLine($"✅ Filed {claims.Count} claims\n");

        // READ CLAIMS
        Console.WriteLine("All filed claims:");
        var allClaims = await claimService.GetAllClaimsAsync();
        foreach (var claim in allClaims)
        {
            Console.WriteLine($"- {claim.ClaimNumber}: {claim.ClaimType} | Amount: ${claim.ClaimAmount} | Status: {claim.Status}");
        }
        Console.WriteLine();

        // UPDATE CLAIM STATUS
        if (allClaims.Any())
        {
            var firstClaim = allClaims.First();
            Console.WriteLine($"Assigning adjuster to claim {firstClaim.ClaimNumber}...");
            await claimService.AssignAdjusterAsync(firstClaim.Id!, "adj_001");

            Console.WriteLine($"Approving claim {firstClaim.ClaimNumber}...");
            await claimService.ApproveClaim(firstClaim.Id!, 7500m, "supervisor_001");

            var updatedClaim = await claimService.GetClaimByIdAsync(firstClaim.Id!);
            Console.WriteLine($"✅ Claim {updatedClaim?.ClaimNumber} approved for ${updatedClaim?.SettlementAmount}\n");
        }

        // FILTER CLAIMS BY STATUS
        Console.WriteLine("Open claims:");
        var openClaims = await claimService.GetOpenClaimsAsync();
        foreach (var claim in openClaims)
        {
            Console.WriteLine($"- {claim.ClaimNumber}: {claim.Status} | Filed: {claim.FiledDate:MM/dd/yyyy}");
        }
        Console.WriteLine();
    }

    static async Task TestInsuranceAggregationOperations(PolicyService policyService, ClaimService claimService)
    {
        Console.WriteLine("=== Insurance Analytics & Aggregation Operations ===\n");

        // Policy statistics by type
        Console.WriteLine("Policy statistics by type:");
        var policyTypeStats = await policyService.GetPolicyStatsByTypeAsync();
        foreach (var stat in policyTypeStats)
        {
            Console.WriteLine($"- {stat}");
        }
        Console.WriteLine();

        // Policy statistics by region
        Console.WriteLine("Policy statistics by region:");
        var regionStats = await policyService.GetPolicyStatsByRegionAsync();
        foreach (var stat in regionStats)
        {
            Console.WriteLine($"- {stat}");
        }
        Console.WriteLine();

        // Claim statistics by status
        Console.WriteLine("Claim statistics by status:");
        var claimStatusStats = await claimService.GetClaimStatsByStatusAsync();
        foreach (var stat in claimStatusStats)
        {
            Console.WriteLine($"- {stat}");
        }
        Console.WriteLine();

        // Claim statistics by type
        Console.WriteLine("Claim statistics by type:");
        var claimTypeStats = await claimService.GetClaimStatsByTypeAsync();
        foreach (var stat in claimTypeStats)
        {
            Console.WriteLine($"- {stat}");
        }
        Console.WriteLine();

        // High-risk policies
        Console.WriteLine("High-risk policies (2+ claims):");
        var highRiskPolicies = await policyService.GetHighRiskPoliciesAsync();
        foreach (var policy in highRiskPolicies)
        {
            Console.WriteLine($"- {policy}");
        }
        Console.WriteLine();

        // Expiring policies
        Console.WriteLine("Policies expiring in the next 30 days:");
        var expiringPolicies = await policyService.GetExpiringPoliciesAsync(30);
        foreach (var policy in expiringPolicies)
        {
            Console.WriteLine($"- {policy.PolicyNumber}: Expires {policy.ExpirationDate:MM/dd/yyyy}");
        }
        Console.WriteLine();
    }
}
```

## Part C: Error Handling and Resilience (5 minutes)

### Step 6: Enhanced Error Handling

Create a new file `Services/ResilientInsuranceService.cs`:
```csharp
using MongoDB.Driver;
using InsuranceManagementSystem.Models;

namespace InsuranceManagementSystem.Services
{
    public class ResilientInsuranceService
    {
        private readonly PolicyService _policyService;
        private readonly ClaimService _claimService;

        public ResilientInsuranceService(PolicyService policyService, ClaimService claimService)
        {
            _policyService = policyService;
            _claimService = claimService;
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

        // Example of resilient operations for insurance
        public async Task<Policy?> GetPolicyByIdWithRetryAsync(string id)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                Console.WriteLine($"Attempting to fetch policy {id}...");
                return await _policyService.GetPolicyByIdAsync(id);
            });
        }

        public async Task<Claim?> GetClaimByIdWithRetryAsync(string id)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                Console.WriteLine($"Attempting to fetch claim {id}...");
                return await _claimService.GetClaimByIdAsync(id);
            });
        }

        // Test resilience for insurance operations
        public async Task TestInsuranceResilienceAsync()
        {
            Console.WriteLine("=== Testing Resilient Insurance Operations ===\n");

            try
            {
                // Test resilient policy retrieval
                var policies = await ExecuteWithRetryAsync(async () =>
                {
                    Console.WriteLine("Fetching all policies with retry logic...");
                    return await _policyService.GetAllPoliciesAsync();
                });

                Console.WriteLine($"✅ Successfully fetched {policies.Count} policies");

                // Test resilient claim retrieval
                var claims = await ExecuteWithRetryAsync(async () =>
                {
                    Console.WriteLine("Fetching all claims with retry logic...");
                    return await _claimService.GetAllClaimsAsync();
                });

                Console.WriteLine($"✅ Successfully fetched {claims.Count} claims");

                // Test resilient critical operation (claim approval)
                if (claims.Any(c => c.Status == "under_review"))
                {
                    var claimToApprove = claims.First(c => c.Status == "under_review");
                    var approved = await ExecuteWithRetryAsync(async () =>
                    {
                        Console.WriteLine($"Processing critical claim approval for {claimToApprove.ClaimNumber}...");
                        return await _claimService.ApproveClaim(claimToApprove.Id!, 5000m, "system_supervisor");
                    });

                    Console.WriteLine($"✅ Claim approval processed: {approved}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Insurance operation failed after retries: {ex.Message}");
            }
        }
    }
}
```

## Part D: Multi-Document Transactions (10 minutes)

A single business action often touches multiple collections — file a claim AND increment the policy's `claimsCount` AND insert an `audit_log` row. To keep them consistent, run them in a transaction. The driver gives you an `IClientSessionHandle` that batches the operations atomically across the replica set.

### Step 7: Add a `FileClaimAtomicallyAsync` method to `ClaimService`

```csharp
// Append to Services/ClaimService.cs
public async Task<bool> FileClaimAtomicallyAsync(Claim claim)
{
    using var session = await _mongoService.Client.StartSessionAsync();
    session.StartTransaction(new TransactionOptions(
        readConcern:  ReadConcern.Majority,
        writeConcern: WriteConcern.WMajority));

    try
    {
        // 1. Insert the new claim
        await _claims.InsertOneAsync(session, claim);

        // 2. Increment the policy's claimsCount and update lastClaimDate
        var policyFilter = Builders<Policy>.Filter.Eq(p => p.PolicyNumber, claim.PolicyNumber);
        var policyUpdate = Builders<Policy>.Update
            .Inc(p => p.ClaimsCount, 1)
            .Set(p => p.LastClaimDate, claim.FiledDate);
        await _policies.UpdateOneAsync(session, policyFilter, policyUpdate);

        // 3. Audit-log the operation
        var audit = new BsonDocument {
            { "operation",   "claim_filed"          },
            { "claimNumber", claim.ClaimNumber       },
            { "timestamp",   DateTime.UtcNow         }
        };
        await _mongoService.Database.GetCollection<BsonDocument>("audit_log")
            .InsertOneAsync(session, audit);

        await session.CommitTransactionAsync();
        return true;
    }
    catch (Exception)
    {
        await session.AbortTransactionAsync();
        throw;
    }
}
```

### Step 8: Wrap with retry-on-`TransientTransactionError`

MongoDB's transaction protocol can fail mid-flight if the primary steps down. The driver tags such failures with the `TransientTransactionError` label — you should retry the whole transaction (not just the failed operation).

```csharp
// In ClaimService.cs
public async Task<bool> FileClaimWithRetryAsync(Claim claim, int maxAttempts = 3)
{
    for (int attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            return await FileClaimAtomicallyAsync(claim);
        }
        catch (MongoException ex) when (ex.HasErrorLabel("TransientTransactionError") && attempt < maxAttempts)
        {
            await Task.Delay(100 * attempt);   // small backoff
        }
    }
    return false;
}
```

Call `claimService.FileClaimWithRetryAsync(myClaim)` from `Program.cs` to exercise it.

## Part E: Watching Changes (10 minutes)

The same change-stream concept lab 13 demonstrated in mongosh is available from C# via `IMongoCollection<T>.Watch()`. The driver returns an `IAsyncCursor<ChangeStreamDocument<T>>` you iterate with `MoveNextAsync`.

### Step 9: Add a `WatchClaimsAsync` method to `ClaimService`

```csharp
// Append to Services/ClaimService.cs
using MongoDB.Driver;
using MongoDB.Driver.Linq;

public async Task WatchClaimsAsync(int forSeconds = 10, CancellationToken ct = default)
{
    // Server-side filter: only insert events with claimAmount >= 50000
    var pipeline = new EmptyPipelineDefinition<ChangeStreamDocument<Claim>>()
        .Match(x =>
            x.OperationType == ChangeStreamOperationType.Insert &&
            x.FullDocument.ClaimAmount >= 50000);

    var options = new ChangeStreamOptions {
        FullDocument = ChangeStreamFullDocumentOption.UpdateLookup
    };

    var deadline = DateTime.UtcNow.AddSeconds(forSeconds);
    using var cursor = await _claims.WatchAsync(pipeline, options, ct);

    Console.WriteLine($"[watcher] Listening for high-value claim inserts ({forSeconds}s)...");
    while (DateTime.UtcNow < deadline && await cursor.MoveNextAsync(ct))
    {
        foreach (var change in cursor.Current)
        {
            var c = change.FullDocument;
            Console.WriteLine($"[watcher] {change.OperationType} {c.ClaimNumber} amount={c.ClaimAmount}");
            // In a real system, raise a fraud alert / notify investigators / etc.
        }
    }
    Console.WriteLine("[watcher] done");
}
```

### Step 10: Drive it from `Program.cs`

```csharp
// In Program.cs, after services are wired up:
var watcherTask = claimService.WatchClaimsAsync(forSeconds: 8);

// Trigger an event the filter should pick up
await Task.Delay(1000);
await claimService.FileClaimWithRetryAsync(new Claim {
    ClaimNumber  = "CLM-CS-DEMO",
    PolicyNumber = "POL-AUTO-001",
    CustomerId   = "CUST000001",
    ClaimAmount  = 75000m,             // above the 50000 threshold
    Status       = "submitted",
    FiledDate    = DateTime.UtcNow,
    Description  = "Driver-side change-stream demo"
});

await watcherTask;
```

You should see one `[watcher] insert CLM-CS-DEMO amount=75000` line, proving the change-stream cursor received the server-pushed event.

> Production listeners run as long-lived background services and persist a resume token after each successfully processed event. See `ChangeStreamOptions.ResumeAfter` for the C# equivalent of mongosh's `resumeAfter`.

### Step 11: Run the Application

```bash
# Build and run the insurance management application
dotnet build
dotnet run
```

### Step 12: Verify in Compass

1. Connect Compass to the C# database: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
2. Navigate to `insurance_company_csharp` database
3. Verify the following collections contain data created by C# application:
   - `policies` collection with insurance policy documents
   - `claims` collection with claim documents
   - `customers` collection (if implemented)
4. View the documents and their insurance-specific structure
5. Observe the policy and claim relationships through the `customerId` and `policyNumber` fields

## Lab 14A Deliverables
✅ **C# MongoDB integration** for insurance management with strongly-typed models (Policy, Claim, Customer)
✅ **Complete insurance CRUD operations**: policy / claim / customer creation, updates, deletes
✅ **Insurance-specific aggregation queries**: stats by type, region, status; expiring-policy alerts
✅ **Error handling and resilience** patterns (retry with exponential backoff)
✅ **Multi-document transactions**: atomic claim-filing across `claims` + `policies` + `audit_log` with `TransientTransactionError` retry
✅ **Change streams** in C#: `IMongoCollection<T>.WatchAsync()` with a server-side `$match` filter receiving live events
✅ **Connection to replica set** from C# insurance management application