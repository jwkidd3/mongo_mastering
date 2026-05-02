"""Customer dataclass skeleton.

TODO (students): add the remaining fields and helper methods.
Suggested fields:
    customer_id, first_name, last_name, email, phone, state,
    customer_type (individual/family/business), risk_score,
    is_active, registration_date

Implement get_full_name(), get_risk_category(), to_dict(), from_dict().
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from bson import ObjectId


@dataclass
class Customer:
    customer_id: str = ""
    # TODO: add the rest of the fields.
    _id: ObjectId = field(default_factory=ObjectId)

    def get_full_name(self) -> str:
        # TODO
        return ""

    def get_risk_category(self) -> str:
        """Return Low/Medium/High based on risk_score."""
        # TODO
        return "Low Risk"

    def to_dict(self) -> dict[str, Any]:
        # TODO
        return {"_id": self._id, "customerId": self.customer_id}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Customer":
        # TODO
        return cls(
            _id=data.get("_id", ObjectId()),
            customer_id=data.get("customerId", ""),
        )
