"""PolicyService — CRUD + analytics for the `policies` collection.

Constructor is wired for you. TODO (students): implement each method using
``self.collection``.
"""

from __future__ import annotations

from typing import Any

from models.policy import Policy


class PolicyService:
    def __init__(self, database):
        self.db = database
        self.collection = database.policies
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create indexes used by this service."""
        try:
            self.collection.create_index("policyNumber", unique=True)
            self.collection.create_index([("customerId", 1), ("isActive", 1)])
            self.collection.create_index([("policyType", 1), ("state", 1)])
        except Exception as exc:  # noqa: BLE001
            print(f"Index warning: {exc}")

    def create_policy(self, policy_data: dict[str, Any]) -> str:
        """Validate and insert one policy. Return the inserted _id as str."""
        # TODO: build Policy, validate, insert_one, return inserted_id.
        return ""

    def get_policy(self, policy_number: str) -> Policy:
        """Fetch a policy by policyNumber. Raise ValueError if missing."""
        # TODO
        raise NotImplementedError

    def update_premium(self, policy_number: str, new_premium: float) -> bool:
        """Update annualPremium. Raise ValueError on bad input or missing doc."""
        # TODO
        return False

    def search_policies(self, filters: dict[str, Any] | None = None) -> list[Policy]:
        """Filter policies. Supported keys: policy_type, state, active_only,
        customer_id, limit."""
        # TODO
        return []

    def get_statistics(self) -> list[dict[str, Any]]:
        """$group by policyType — count, total/avg premium, avg coverage."""
        # TODO
        return []
