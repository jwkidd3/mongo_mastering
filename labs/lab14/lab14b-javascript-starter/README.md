# Lab 14B Starter — Node.js / MongoDB driver

A ready-to-run Node.js scaffold for Lab 14B. The connection layer and project
structure are wired up; you fill in models, service methods, and CRUD calls.

## What's already done

- `package.json` — declares `mongodb` and `dotenv`. Run `npm install` once.
- `.env.example` — copy to `.env` and adjust if needed. Defaults to
  `mongodb://localhost:27017/?directConnection=true`.
- `config/database.js` — `DatabaseConnection` class wrapping `MongoClient`.
  Don't modify.
- `app.js` — entry point. Connects, constructs `PolicyService`, calls a demo
  method, then disconnects. Runs cleanly out of the box.

## What you fill in

- `models/Policy.js` — populate constructor fields, implement `validate()`,
  `getMonthlyPremium()`, `getSummary()`, `toMongo()`.
- `models/Customer.js` — populate constructor + helper methods.
- `services/PolicyService.js` — implement `createPolicy`, `getPolicyByNumber`,
  `updatePremium`, `searchPolicies`, `getPolicyStatistics`, etc.
- `app.js` — under each TODO, exercise your service.

## Run

```bash
cp .env.example .env       # one time
npm install
npm start
```

`npm start` must run cleanly before you change anything (it just connects and
exits). As you fill in TODOs, re-run to see your CRUD output.
