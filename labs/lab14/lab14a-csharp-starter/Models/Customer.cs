using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InsuranceManagementSystem.Models
{
    /// <summary>
    /// Insurance Customer model.
    ///
    /// TODO (students): add the [BsonElement] properties from the lab instructions.
    /// Suggested fields: Name, Email, Phone, Type (Individual/Business), State,
    /// Address (nested), RegistrationDate, AccountBalance, RiskLevel, IsActive...
    /// </summary>
    public class Customer
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // TODO: add Customer fields here.
    }

    /// <summary>
    /// Address sub-document used by Customer. TODO: fill in fields.
    /// </summary>
    public class Address
    {
        // TODO: street, city, state, zipCode, country
    }
}
