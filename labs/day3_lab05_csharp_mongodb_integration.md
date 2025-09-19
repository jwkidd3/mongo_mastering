# Lab 5: C# MongoDB Integration for Insurance Management
**Duration:** 30 minutes
**Objective:** Integrate MongoDB with C# applications for insurance management system

## Part A: Project Setup (10 minutes)

### Step 1: Create C# Console Application
```bash
# Create insurance management project directory
mkdir InsuranceManagementSystem
cd InsuranceManagementSystem

# Create new console application
dotnet new console

# Add MongoDB driver
dotnet add package MongoDB.Driver
```

### Step 2: Create Models

**Create Models/Policy.cs:**
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
        public string PolicyType { get; set; } = string.Empty; // Auto, Property, Life, Commercial

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

**Create Models/Customer.cs:**
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

**Create Models/Claim.cs:**
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

        [BsonElement("policyId")]
        public string PolicyId { get; set; } = string.Empty;

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
        public string Status { get; set; } = "Filed";

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

### Step 3: Create Database Service

**Create Services/MongoDBService.cs:**
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

**Create Services/PolicyService.cs:**
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

**Create Services/ClaimService.cs:**
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

        public async Task<List<Claim>> GetClaimsByPolicyAsync(string policyId)
        {
            return await _claims.Find(c => c.PolicyId == policyId).ToListAsync();
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
            var openStatuses = new[] { "Filed", "Under Review", "Investigating" };
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
                .Set(c => c.Status, "Under Review");
            var result = await _claims.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ApproveClaim(string id, decimal settlementAmount, string approvedBy)
        {
            var filter = Builders<Claim>.Filter.Eq(c => c.Id, id);
            var update = Builders<Claim>.Update
                .Set(c => c.Status, "Approved")
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
                .Set(c => c.Status, "Denied")
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

**Update Program.cs:**
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
                PolicyId = allPolicies.First().Id!,
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
                PolicyId = allPolicies.Skip(1).First().Id!,
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

**Create Services/ResilientInsuranceService.cs:**
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
                if (claims.Any(c => c.Status == "Under Review"))
                {
                    var claimToApprove = claims.First(c => c.Status == "Under Review");
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

### Step 7: Run the Application

```bash
# Build and run the insurance management application
dotnet build
dotnet run
```

### Step 8: Verify in Compass

1. Connect Compass to the C# database: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`
2. Navigate to `insurance_company_csharp` database
3. Verify the following collections contain data created by C# application:
   - `policies` collection with insurance policy documents
   - `claims` collection with claim documents
   - `customers` collection (if implemented)
4. View the documents and their insurance-specific structure
5. Observe the policy and claim relationships through the `customerId` and `policyId` fields

## Lab 5 Deliverables
✅ **C# MongoDB integration** for insurance management with strongly-typed models:
   - Policy management system
   - Claims processing system
   - Customer data management
✅ **Complete insurance CRUD operations** implementation:
   - Policy creation, updates, renewals, and cancellations
   - Claim filing, status updates, approvals, and settlements
   - Customer risk assessment and history tracking
✅ **Insurance-specific aggregation queries**:
   - Policy statistics by type and region
   - Claims analytics by status and type
   - High-risk policy identification
   - Expiring policy alerts
✅ **Error handling and resilience** patterns for critical insurance operations
✅ **Connection to replica set** from C# insurance management application
✅ **Real-world insurance scenarios** with proper data relationships and business logic