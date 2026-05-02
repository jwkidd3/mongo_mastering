"""Policy dataclass skeleton.

TODO (students): add the remaining fields and helper methods listed in the lab.
Suggested fields:
    policy_number, customer_id, policy_type (Auto/Property/Life/Commercial/Cyber/Health),
    region, state, coverage_limit, annual_premium, deductible,
    is_active, effective_date, expiration_date, created_at

Implement validate(), get_monthly_premium(), to_dict(), from_dict().
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from bson import ObjectId


@dataclass
class Policy:
    policy_number: str = ""
    # TODO: add the rest of the fields with sensible defaults.
    _id: ObjectId = field(default_factory=ObjectId)

    def validate(self) -> None:
        """Raise ValueError if the policy is not valid."""
        # TODO: collect errors and raise if any.
        return None

    def get_monthly_premium(self) -> float:
        """Annual premium / 12, rounded to two decimals."""
        # TODO
        return 0.0

    def to_dict(self) -> dict[str, Any]:
        """Convert to camelCase dict for MongoDB."""
        # TODO: return the document to persist.
        return {"_id": self._id, "policyNumber": self.policy_number}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Policy":
        """Build a Policy from a Mongo document (camelCase fields)."""
        # TODO: map fields back from camelCase.
        return cls(
            _id=data.get("_id", ObjectId()),
            policy_number=data.get("policyNumber", ""),
        )
