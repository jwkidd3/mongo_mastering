using MongoDB.Driver;
using InsuranceManagementSystem.Models;

namespace InsuranceManagementSystem.Services
{
    /// <summary>
    /// MongoDB connection wrapper. Already done — students don't need to change this.
    /// Exposes typed IMongoCollection&lt;T&gt; for each domain entity.
    /// </summary>
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
    }
}
