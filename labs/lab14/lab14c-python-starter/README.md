# Lab 14C Starter — Python / PyMongo

A ready-to-run Python scaffold for Lab 14C. The connection layer, package
structure, and dataclass skeletons are wired up; you fill in the model fields,
service methods, and CRUD calls.

The lab itself is presented in Jupyter, but this starter is plain Python — copy
cells out of `main.py` / the service into a notebook, or run `python main.py`
directly.

## What's already done

- `requirements.txt` — `pymongo`, `python-dotenv`, `pandas`, `matplotlib`.
- `.env.example` — copy to `.env` and adjust if needed.
- `config/database.py` — `DatabaseConnection` wrapping `MongoClient`. Don't modify.
- `main.py` — connects, constructs `PolicyService`, then closes. Runs cleanly
  out of the box.
- Stub `Policy` and `Customer` dataclasses with `_id` defaulted to a fresh
  `ObjectId`.
- `PolicyService` with constructor + `_ensure_indexes()` already implemented.

## What you fill in

- `models/policy.py` — add fields, implement `validate()`, `get_monthly_premium()`,
  `to_dict()`, `from_dict()`.
- `models/customer.py` — add fields, implement helper methods.
- `services/policy_service.py` — implement `create_policy`, `get_policy`,
  `update_premium`, `search_policies`, `get_statistics`.
- `main.py` — under the TODO block, exercise the service.

## Run

```bash
cp .env.example .env       # one time
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

`python main.py` must run cleanly before you change anything (it just connects
and exits). As you fill in TODOs, re-run to see results.
