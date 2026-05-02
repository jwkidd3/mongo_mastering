"""MongoDB connection wrapper. Already wired — students don't modify this."""

import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()


class DatabaseConnection:
    def __init__(self, uri: str | None = None, db_name: str | None = None):
        self.uri = uri or os.getenv(
            "MONGODB_URI", "mongodb://localhost:27017/?directConnection=true"
        )
        self.db_name = db_name or os.getenv("DATABASE_NAME", "insurance_company")
        self.client: MongoClient | None = None
        self.db = None

    def connect(self):
        """Establish connection to MongoDB and return the Database handle."""
        self.client = MongoClient(self.uri, serverSelectionTimeoutMS=5000)
        # ping confirms server reachability; comment out if running offline.
        try:
            self.client.admin.command("ping")
            print(f"Connected to MongoDB at {self.uri}")
        except Exception as exc:  # noqa: BLE001
            print(f"Warning: MongoDB ping failed ({exc}); continuing.")
        self.db = self.client[self.db_name]
        return self.db

    def get_db(self):
        if self.db is None:
            return self.connect()
        return self.db

    def close(self):
        if self.client is not None:
            self.client.close()
            print("Disconnected from MongoDB")
