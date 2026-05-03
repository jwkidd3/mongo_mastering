"""Claim dataclass skeleton.

TODO (students): add the remaining fields and helper methods listed in the lab.
Suggested fields:
    claim_number, customer_id, policy_number, claim_type, claim_amount,
    status (submitted / under_review / approved / denied / settled),
    incident_date, filed_date, description, settlement_amount, adjuster_notes,
    created_at, updated_at

Implement validate(), get_summary(), to_dict(), from_dict(). Mirror policy.py
so ClaimService can use it the same way PolicyService uses Policy.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any

from bson import ObjectId


@dataclass
class Claim:
    claim_number: str = ""
    # TODO: add the rest of the fields with sensible defaults.
    # claim_amount should default to Decimal("0"); status to "submitted";
    # filed_date to datetime.utcnow().
    _id: ObjectId = field(default_factory=ObjectId)

    def validate(self) -> None:
        """Raise ValueError if the claim is not valid.

        Required: claim_number, customer_id, policy_number, claim_amount > 0.
        """
        # TODO: collect errors and raise if any.
        return None

    def get_summary(self) -> dict[str, Any]:
        """Small summary dict (claim_number, status, amount, days_open)."""
        # TODO
        return {"id": str(self._id)}

    def to_dict(self) -> dict[str, Any]:
        """Convert to camelCase dict for MongoDB."""
        # TODO: return the document to persist.
        return {"_id": self._id, "claimNumber": self.claim_number}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Claim":
        """Build a Claim from a Mongo document (camelCase fields)."""
        # TODO: map fields back from camelCase.
        return cls(
            _id=data.get("_id", ObjectId()),
            claim_number=data.get("claimNumber", ""),
        )
