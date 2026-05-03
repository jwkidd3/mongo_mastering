const Claim = require('../models/Claim');

/**
 * ClaimService — CRUD + transactional / change-stream operations for `claims`.
 *
 * Constructor is wired for you. TODO (students): implement each method using
 * `this.collection`. The transactional and watch methods are added in Lab 14B
 * Part F (Transactions) and Part G (Change Streams).
 */
class ClaimService {
    constructor(db, client) {
        this.db = db;
        this.client = client;                          // needed for sessions / transactions
        this.collection = db.collection('claims');
    }

    async createClaim(claimData) {
        // TODO: instantiate Claim, validate, insert, return { success, claimId, claimNumber }.
        return { success: false, claimId: null, claimNumber: null };
    }

    async getClaimByNumber(claimNumber) {
        // TODO: findOne by claimNumber and return new Claim(doc) or null.
        return null;
    }

    async getClaimsByCustomer(customerId) {
        // TODO: find all claims for a customer; map to Claim instances.
        return [];
    }

    async updateClaimStatus(claimNumber, newStatus) {
        // TODO: update status + updatedAt; return { success, modifiedCount }.
        return { success: false, modifiedCount: 0 };
    }

    async deleteClaim(claimNumber) {
        // TODO: deleteOne; return { success, deletedCount }.
        return { success: false, deletedCount: 0 };
    }

    /**
     * File a claim atomically: insert into claims, increment policy.claimsCount,
     * and write an audit_log row -- all inside one MongoDB transaction.
     * See Lab 14B Part F.
     */
    async fileClaimAtomically(claimData) {
        // TODO: see lab markdown -- startSession + withTransaction.
        return { success: false };
    }

    /**
     * Open a change stream and process each event with `handler(event)`.
     * Caller passes a stop signal (e.g. AbortController) to end the watch.
     * See Lab 14B Part G.
     */
    async watchClaims(handler, { signal, pipeline = [] } = {}) {
        // TODO: see lab markdown -- collection.watch(pipeline, options) + for-await iteration.
    }
}

module.exports = ClaimService;
