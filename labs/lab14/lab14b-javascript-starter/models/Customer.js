const { ObjectId } = require('mongodb');

/**
 * Customer — insurance customer model.
 *
 * TODO (students): fill in the constructor with the customer fields:
 *   customerId, firstName, lastName, email, phone,
 *   address: { street, city, state, zipCode },
 *   dateOfBirth, customerType (individual/family/business),
 *   riskScore, isActive, registrationDate, lastUpdateDate
 *
 * Implement getFullName(), getFormattedAddress(), getAge(), validate(), toMongo().
 */
class Customer {
    constructor(data = {}) {
        this._id = data._id || new ObjectId();
        // TODO: assign the rest of the fields.
    }

    getFullName() {
        // TODO
        return '';
    }

    getFormattedAddress() {
        // TODO
        return '';
    }

    getAge() {
        // TODO
        return null;
    }

    validate() {
        // TODO: return { isValid, errors }
        return { isValid: true, errors: [] };
    }

    toMongo() {
        // TODO: return the document to persist.
        return { _id: this._id };
    }
}

module.exports = Customer;
