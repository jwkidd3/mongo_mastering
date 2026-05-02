const DatabaseConnection = require('./config/database');
const PolicyService = require('./services/PolicyService');
// const Policy = require('./models/Policy');
// const Customer = require('./models/Customer');

/**
 * InsuranceManagementApp — entry point. Connection lifecycle is handled for
 * you. Add your CRUD demonstrations under the TODO blocks.
 */
class InsuranceManagementApp {
    constructor() {
        this.dbConnection = new DatabaseConnection();
        this.policyService = null;
    }

    async initialize() {
        const db = await this.dbConnection.connect();
        this.policyService = new PolicyService(db);
        console.log('Insurance Management System initialized');
    }

    async demonstratePolicyOperations() {
        console.log('\n=== Policy Management Demo ===');
        // TODO (students): create a policy, retrieve it, update its premium,
        // search by type, then call getPolicyStatistics().
        //
        //   await this.policyService.createPolicy({
        //       policyNumber: 'POL-JS-2024-001',
        //       customerId:   'CUST000001',
        //       policyType:   'Auto',
        //       ...
        //   });
    }

    async cleanup() {
        await this.dbConnection.disconnect();
    }

    async run() {
        try {
            await this.initialize();
            await this.demonstratePolicyOperations();
        } catch (error) {
            console.error('Application error:', error);
        } finally {
            await this.cleanup();
        }
    }
}

if (require.main === module) {
    const app = new InsuranceManagementApp();
    app.run().catch(console.error);
}

module.exports = InsuranceManagementApp;
