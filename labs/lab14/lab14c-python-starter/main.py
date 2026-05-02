"""Lab 14C entry point. Connection lifecycle is handled for you; add CRUD
demonstrations under the TODO blocks.

Run with:
    python main.py
"""

from config.database import DatabaseConnection
from services.policy_service import PolicyService


def main() -> None:
    print("Insurance Management System - PyMongo")
    print("=====================================\n")

    db_connection = DatabaseConnection()
    db = db_connection.connect()

    try:
        policy_service = PolicyService(db)

        # TODO (students): exercise PolicyService here. For example:
        #
        # policy_service.create_policy({
        #     'policy_number': 'POL-PY-001',
        #     'customer_id':   'CUST000001',
        #     'policy_type':   'Auto',
        #     'region':        'West Coast',
        #     'state':         'CA',
        #     'coverage_limit': 250000.0,
        #     'annual_premium': 1800.0,
        #     'deductible':     750.0,
        # })
        #
        # for p in policy_service.search_policies({'active_only': True}):
        #     print(p.policy_number, p.annual_premium)
        #
        # for s in policy_service.get_statistics():
        #     print(s)

        _ = policy_service  # silence unused-warning until students wire calls
    finally:
        db_connection.close()


if __name__ == "__main__":
    main()
