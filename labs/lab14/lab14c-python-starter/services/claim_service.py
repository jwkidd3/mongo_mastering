"""ClaimService — CRUD + transactional / change-stream operations for ``claims``.

Constructor is wired for you. TODO (students): implement each method using
``self.collection``. The transactional and watch methods are added in
Lab 14C Part H (Transactions) and Part I (Change Streams).
"""

from __future__ import annotations

from typing import Any, Callable, Iterable

from models.claim import Claim


class ClaimService:
    def __init__(self, database, client):
        self.db = database
        self.client = client                              # for sessions / transactions
        self.collection = database.claims
        self._ensure_indexes()

    def _ensure_indexes(self):
        try:
            self.collection.create_index("claimNumber", unique=True)
            self.collection.create_index([("customerId", 1), ("status", 1)])
            self.collection.create_index([("policyNumber", 1)])
        except Exception as exc:  # noqa: BLE001
            print(f"Index warning: {exc}")

    def create_claim(self, claim_data: dict[str, Any]) -> str:
        """Validate and insert one claim. Return the inserted _id as str."""
        # TODO
        return ""

    def get_claim_by_number(self, claim_number: str) -> Claim | None:
        # TODO: find_one + Claim.from_dict
        return None

    def get_claims_by_customer(self, customer_id: str) -> list[Claim]:
        # TODO
        return []

    def update_claim_status(self, claim_number: str, new_status: str) -> int:
        """Update status field. Return number of documents modified."""
        # TODO
        return 0

    def delete_claim(self, claim_number: str) -> int:
        # TODO
        return 0

    # ------------------------------------------------------------------
    # Transactions  (Lab 14C Part H)
    # ------------------------------------------------------------------
    def file_claim_atomically(self, claim_data: dict[str, Any]) -> dict[str, Any]:
        """File a claim atomically across claims, policies, and audit_log.

        Uses ``client.start_session()`` + ``session.with_transaction()`` so
        pymongo handles the TransientTransactionError retry loop for us.
        """
        # TODO: see lab markdown
        return {"success": False}

    # ------------------------------------------------------------------
    # Change streams  (Lab 14C Part I)
    # ------------------------------------------------------------------
    def watch_claims(self, handler: Callable[[dict], None],
                     pipeline: Iterable[dict] | None = None,
                     stop_event=None):
        """Open a change stream and call ``handler(event)`` for each event.

        ``stop_event`` is an optional ``threading.Event`` used to break out of
        the loop. If ``pipeline`` is None, defaults to "high-amount inserts".
        """
        # TODO: see lab markdown
        pass
