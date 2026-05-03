const { ObjectId } = require('mongodb');

/**
 * Claim — insurance claim model.
 *
 * TODO (students): populate the constructor with the fields described in the
 * lab. Suggested fields:
 *   claimNumber, customerId, policyNumber, claimType, claimAmount,
 *   status, incidentDate, filedDate, description, settlementAmount,
 *   adjusterNotes, createdAt, updatedAt
 *
 * Then implement validate(), getSummary(), toMongo(). Mirror the shape of
 * Policy.js so ClaimService can use it the same way PolicyService uses Policy.
 */
class Claim {
    constructor(data = {}) {
        this._id = data._id || new ObjectId();
        // TODO: assign the rest of the fields from `data` with sensible defaults.
        // claimAmount should default to 0; status to "submitted"; filedDate to new Date().
    }

    validate() {
        // TODO: return { isValid: boolean, errors: string[] }
        // Required fields: claimNumber, customerId, policyNumber, claimAmount > 0.
        return { isValid: true, errors: [] };
    }

    getSummary() {
        // TODO: return a small object summarising the claim
        // (claimNumber, status, claimAmount, daysOpen).
        return { id: this._id };
    }

    toMongo() {
        // TODO: return the plain object MongoDB should store.
        return { _id: this._id };
    }
}

module.exports = Claim;
