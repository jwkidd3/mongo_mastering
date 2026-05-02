using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InsuranceManagementSystem.Models
{
    /// <summary>
    /// Insurance Policy model. Represents one document in the `policies` collection.
    ///
    /// TODO (students): add the [BsonElement] properties listed in the lab instructions.
    /// At minimum you'll need:
    ///   - PolicyNumber (string)
    ///   - CustomerId  (string)
    ///   - PolicyType  (string)  // Auto, Property, Life, Commercial, Cyber, Health
    ///   - Region, State (string)
    ///   - CoverageLimit, Premium, Deductible (decimal, use [BsonRepresentation(BsonType.Decimal128)])
    ///   - EffectiveDate, ExpirationDate (DateTime)
    ///   - Status (string, default "Active")
    ///   - ClaimsCount (int), TotalClaimsPaid (decimal), LastClaimDate (DateTime?)
    ///   - AgentId (string?)
    /// </summary>
    public class Policy
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // TODO: add Policy fields here following the pattern:
        // [BsonElement("policyNumber")]
        // public string PolicyNumber { get; set; } = string.Empty;
    }
}
