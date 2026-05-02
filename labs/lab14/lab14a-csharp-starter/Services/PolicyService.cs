using MongoDB.Driver;
using MongoDB.Bson;
using InsuranceManagementSystem.Models;

namespace InsuranceManagementSystem.Services
{
    /// <summary>
    /// Business-logic layer for Policy CRUD and aggregation.
    ///
    /// The constructor and field are wired up for you. Each method body is a stub
    /// returning a default value so the project compiles. TODO (students): implement
    /// each method using the IMongoCollection&lt;Policy&gt; field `_policies`.
    /// </summary>
    public class PolicyService
    {
        private readonly IMongoCollection<Policy> _policies;

        public PolicyService(MongoDBService mongoDBService)
        {
            _policies = mongoDBService.Policies;
        }

        // ---------- Create ----------
        public async Task<Policy> CreatePolicyAsync(Policy policy)
        {
            // TODO: insert one policy and return it.
            await Task.CompletedTask;
            return policy;
        }

        public async Task CreatePoliciesAsync(IEnumerable<Policy> policies)
        {
            // TODO: bulk insert with InsertManyAsync.
            await Task.CompletedTask;
        }

        // ---------- Read ----------
        public async Task<List<Policy>> GetAllPoliciesAsync()
        {
            // TODO: return all policies.
            await Task.CompletedTask;
            return new List<Policy>();
        }

        public async Task<Policy?> GetPolicyByIdAsync(string id)
        {
            // TODO: find one by Id.
            await Task.CompletedTask;
            return null;
        }

        public async Task<List<Policy>> GetPoliciesByTypeAsync(string policyType)
        {
            // TODO: filter by PolicyType.
            await Task.CompletedTask;
            return new List<Policy>();
        }

        // ---------- Update ----------
        public async Task<bool> UpdatePolicyPremiumAsync(string id, decimal newPremium)
        {
            // TODO: build a Set update on Premium and apply it.
            await Task.CompletedTask;
            return false;
        }

        public async Task<bool> UpdatePolicyStatusAsync(string id, string newStatus)
        {
            // TODO: update Status field.
            await Task.CompletedTask;
            return false;
        }

        // ---------- Delete ----------
        public async Task<bool> DeletePolicyAsync(string id)
        {
            // TODO: delete one policy by Id.
            await Task.CompletedTask;
            return false;
        }

        // ---------- Aggregation ----------
        public async Task<List<BsonDocument>> GetPolicyStatsByTypeAsync()
        {
            // TODO: $group by policyType, return count + avg premium etc.
            await Task.CompletedTask;
            return new List<BsonDocument>();
        }
    }
}
