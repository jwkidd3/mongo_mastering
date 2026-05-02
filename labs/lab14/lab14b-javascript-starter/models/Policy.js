const { ObjectId } = require('mongodb');

/**
 * Policy — insurance policy model.
 *
 * TODO (students): populate the constructor with the fields described in the
 * lab. Suggested fields:
 *   policyNumber, customerId, policyType, region, state,
 *   coverageLimit, annualPremium, deductible,
 *   isActive, effectiveDate, expirationDate, createdAt, updatedAt
 *
 * Then implement validate(), getMonthlyPremium(), getSummary(), toMongo().
 */
class Policy {
    constructor(data = {}) {
        this._id = data._id || new ObjectId();
        // TODO: assign the rest of the fields from `data` with sensible defaults.
    }

    validate() {
        // TODO: return { isValid: boolean, errors: string[] }
        return { isValid: true, errors: [] };
    }

    getMonthlyPremium() {
        // TODO: annualPremium / 12, rounded to 2 decimals.
        return 0;
    }

    getSummary() {
        // TODO: return a small object summarising the policy.
        return { id: this._id };
    }

    toMongo() {
        // TODO: return the plain object MongoDB should store.
        return { _id: this._id };
    }
}

module.exports = Policy;
