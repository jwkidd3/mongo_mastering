const Policy = require('../models/Policy');

/**
 * PolicyService — CRUD + analytics for the `policies` collection.
 *
 * Constructor is wired for you. TODO (students): implement each method using
 * `this.collection`.
 */
class PolicyService {
    constructor(db) {
        this.db = db;
        this.collection = db.collection('policies');
    }

    async createPolicy(policyData) {
        // TODO: instantiate Policy, validate, check for duplicate policyNumber,
        // insert, and return { success, policyId, policyNumber }.
        return { success: false, policyId: null, policyNumber: null };
    }

    async getPolicyByNumber(policyNumber) {
        // TODO: findOne by policyNumber and return new Policy(doc) or throw.
        return null;
    }

    async getPoliciesByCustomer(customerId) {
        // TODO: find active policies for a customer; return Policy[].
        return [];
    }

    async updatePremium(policyNumber, newPremium) {
        // TODO: validate, updateOne with $set, return the result.
        return null;
    }

    async deactivatePolicy(policyNumber, reason = '') {
        // TODO: set isActive=false, deactivationReason, deactivationDate.
        return null;
    }

    async getPolicyStatistics() {
        // TODO: aggregation pipeline grouping by policyType.
        return [];
    }

    async searchPolicies(filters = {}) {
        // TODO: build a query from filters (policyType, state, premium range,
        // activeOnly, sortBy, limit) and return Policy[].
        return [];
    }
}

module.exports = PolicyService;
