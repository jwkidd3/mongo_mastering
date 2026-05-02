const { MongoClient } = require('mongodb');
require('dotenv').config();

/**
 * DatabaseConnection — wraps MongoClient lifecycle. Already wired up; students
 * don't need to modify this file.
 */
class DatabaseConnection {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/?directConnection=true';
            this.client = new MongoClient(uri);

            await this.client.connect();
            this.db = this.client.db(process.env.DATABASE_NAME || 'insurance_company');

            console.log('Connected to MongoDB successfully');
            return this.db;
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            console.log('Disconnected from MongoDB');
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }
}

module.exports = DatabaseConnection;
